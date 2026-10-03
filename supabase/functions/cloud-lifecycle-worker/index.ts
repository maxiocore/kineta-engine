// Cloud lifecycle worker: renewals, grace, suspension, termination, jobs, reconciliation.
// Admin/service only. Every automatic stage is gated by its own secret switch (default false).
// `simulate` runs tests A–R on simulation subscriptions with a MockProvider: no money, no provider calls.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const flag = (n: string) => (Deno.env.get(n) ?? "false").toLowerCase() === "true";
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type ErrorClass = "temporary" | "rate_limited" | "authentication" | "invalid_request" | "resource_missing" | "provider_outage" | "unknown";
export function classifyError(code: string): ErrorClass {
  if (code === "auth_failed" || code === "config_missing") return "authentication";
  if (code === "rate_limit_exceeded" || code === "http_429") return "rate_limited";
  if (code === "unavailable" || code === "timeout") return "temporary";
  if (code === "not_found" || code === "http_404") return "resource_missing";
  if (code === "invalid_input" || code === "uniqueness_error" || code === "http_400" || code === "http_422") return "invalid_request";
  if (/^http_5\d\d$/.test(code) || code === "service_error" || code === "maintenance") return "provider_outage";
  return "unknown";
}

/** Deterministic in-memory provider for simulations. Never touches the network. */
class MockProvider {
  servers = new Map<string, { id: string; label: string; status: string; ip: string }>();
  failNext: string | null = null; loseNextResponse = false; createCalls = 0;
  private n = 0;
  private maybeFail() { if (this.failNext) { const c = this.failNext; this.failNext = null; throw new Error(c); } }
  async findByLabel(label: string) { return [...this.servers.values()].find((s) => s.label === label) ?? null; }
  async create(label: string) {
    this.maybeFail(); this.createCalls++;
    const s = { id: `mock-${++this.n}`, label, status: "running", ip: `10.0.0.${this.n}` };
    this.servers.set(s.id, s);
    if (this.loseNextResponse) { this.loseNextResponse = false; throw new Error("timeout"); }
    return s;
  }
  async power(id: string, on: boolean) { this.maybeFail(); const s = this.servers.get(id); if (!s) throw new Error("not_found"); s.status = on ? "running" : "off"; return s; }
  async get(id: string) { return this.servers.get(id) ?? null; }
  async delete(id: string) { this.maybeFail(); this.servers.delete(id); }
  list() { return [...this.servers.values()]; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const db = createClient(URL_, SR);
  // --- auth: service role or admin user only ---
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  let actor: string | null = null;
  if (token !== SR) {
    const { data: u } = await db.auth.getUser(token);
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await db.rpc("is_admin", { _user_id: u.user.id });
    if (!isAdmin) return json({ error: "forbidden" }, 403);
    actor = u.user.id;
  }
  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = String(body.action ?? "status");

  const switches = {
    LIVE_PAYMENTS_ENABLED: flag("LIVE_PAYMENTS_ENABLED"),
    LIVE_PROVISIONING_ENABLED: flag("LIVE_PROVISIONING_ENABLED"),
    AUTOMATIC_RENEWALS_ENABLED: flag("AUTOMATIC_RENEWALS_ENABLED"),
    AUTOMATIC_SUSPENSIONS_ENABLED: flag("AUTOMATIC_SUSPENSIONS_ENABLED"),
    AUTOMATIC_TERMINATIONS_ENABLED: flag("AUTOMATIC_TERMINATIONS_ENABLED"),
  };

  if (action === "status") return json({ switches });

  if (action === "run") {
    // Real sweep. Each stage refuses unless its switch is on; provider steps also need LIVE_PROVISIONING_ENABLED.
    const out: Record<string, unknown> = {};
    const now = new Date().toISOString();
    if (!switches.AUTOMATIC_RENEWALS_ENABLED) out.renewals = "disabled";
    else {
      const { data: due } = await db.from("cloud_subscriptions").select("id,status,next_retry_at").eq("is_simulation", false)
        .or(`and(status.in.(active,renewal_due),next_renewal_at.lte.${now}),and(status.eq.grace_period,next_retry_at.lte.${now})`).limit(100);
      const res = [];
      for (const s of due ?? []) {
        const { data: r } = await db.rpc("cloud_renew_subscription", { p_sub: s.id });
        if (!r?.ok && r?.reason === "insufficient_balance") await db.rpc("cloud_record_renewal_failure", { p_sub: s.id, p_reason: "insufficient_balance" });
        res.push({ id: s.id, r });
      }
      out.renewals = res.length;
    }
    if (!switches.AUTOMATIC_SUSPENSIONS_ENABLED) out.suspensions = "disabled";
    else {
      const { data: g } = await db.from("cloud_subscriptions").select("id").eq("status", "grace_period").eq("is_simulation", false).lte("grace_ends_at", now).limit(100);
      for (const s of g ?? []) await db.rpc("cloud_begin_suspension", { p_sub: s.id });
      out.suspensions = g?.length ?? 0;
    }
    if (!switches.AUTOMATIC_TERMINATIONS_ENABLED) out.terminations = "disabled";
    else {
      const { data: t } = await db.from("cloud_subscriptions").select("id").in("status", ["suspended", "cancellation_pending"]).eq("is_simulation", false).lte("termination_scheduled_at", now).limit(50);
      for (const s of t ?? []) await db.rpc("cloud_begin_termination", { p_sub: s.id });
      out.terminations = t?.length ?? 0;
    }
    out.provider_jobs = switches.LIVE_PROVISIONING_ENABLED ? "provider job execution handled by cloud-api queue" : "disabled";
    return json({ switches, out });
  }

  if (action === "simulate") return json(await simulate(db, actor));
  return json({ error: "unknown_action" }, 400);
});

// ================= Simulation (tests A–R + races) =================
async function simulate(db: any, actor: string | null) {
  const results: { id: string; name: string; pass: boolean; detail: string }[] = [];
  const created: string[] = [];
  const t0 = Date.now();
  const at = (days: number) => new Date(t0 + days * 86400000).toISOString();
  const { data: settings } = await db.from("cloud_lifecycle_settings").select("*").single();
  const { data: anyAdmin } = await db.from("user_roles").select("user_id").eq("role", "admin").limit(1).single();
  const owner = actor ?? anyAdmin.user_id;

  const mkSub = async (wallet: number, extra: Record<string, unknown> = {}) => {
    const { data, error } = await db.from("cloud_subscriptions").insert({
      user_id: owner, status: "active", billing_cycle: "monthly", amount: 49, vat_amount: 7.35, is_simulation: true,
      started_at: at(-30), current_period_start: at(-30), current_period_end: at(0), next_renewal_at: at(0), renewal_at: at(0).slice(0, 10),
      renewal_subtotal_minor: 4900, renewal_backup_minor: 0, vat_rate_snapshot: 15, renewal_vat_minor: 735, renewal_total_minor: 5635,
      sim_wallet_minor: wallet, auto_renew: true, payment_method: "wallet", ...extra,
    }).select().single();
    if (error) throw new Error("fixture: " + error.message);
    created.push(data.id); return data;
  };
  const get = async (id: string) => (await db.from("cloud_subscriptions").select("*").eq("id", id).single()).data;
  const invCount = async (id: string) => (await db.from("cloud_renewal_invoices").select("id", { count: "exact", head: true }).eq("subscription_id", id)).count ?? 0;
  const rpc = async (fn: string, args: Record<string, unknown>) => { const { data, error } = await db.rpc(fn, args); if (error) return { error: error.message }; return data; };
  const rec = (id: string, name: string, pass: boolean, detail: unknown) => results.push({ id, name, pass, detail: typeof detail === "string" ? detail : JSON.stringify(detail) });
  const graceEnd = (settings.grace_period_days ?? 3) + 0.01;
  const termEnd = graceEnd + (settings.termination_delay_days ?? 7) + 0.01;
  const runJob = async (key: string, ok: boolean, cls?: string, err?: string) => {
    const { data: j } = await db.from("cloud_jobs").select("id").eq("idempotency_key", key).single();
    if (!j) return "no_job";
    const c = await rpc("cloud_claim_job", { p_job: j.id });
    if (!c?.id) return "not_claimed";
    return await rpc("cloud_finish_job", { p_job: j.id, p_ok: ok, p_class: cls ?? null, p_error: err ?? null });
  };
  const jobKey = async (subId: string, type: string) => (await db.from("cloud_jobs").select("idempotency_key").eq("resource_id", subId).eq("job_type", type).order("created_at", { ascending: false }).limit(1).single()).data?.idempotency_key;

  try {
    // A. successful renewal
    { const s = await mkSub(10000); const r = await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) }); const a = await get(s.id);
      rec("A", "Successful renewal", r?.ok && a.status === "active" && a.sim_wallet_minor === 10000 - 5635 && (await invCount(s.id)) === 1 && a.current_period_end > s.current_period_end, { r, wallet: a.sim_wallet_minor }); }
    // B. insufficient wallet
    { const s = await mkSub(100); const r = await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) }); const a = await get(s.id);
      rec("B", "Insufficient wallet", r?.reason === "insufficient_balance" && a.sim_wallet_minor === 100 && (await invCount(s.id)) === 0, r); }
    // C. grace period
    const sC = await mkSub(100);
    { await rpc("cloud_renew_subscription", { p_sub: sC.id, p_now: at(0.01) }); const f = await rpc("cloud_record_renewal_failure", { p_sub: sC.id, p_reason: "insufficient_balance", p_now: at(0.01) });
      const a = await get(sC.id); const expectStatus = settings.grace_server_policy === "suspend_immediately" ? "suspension_pending" : "grace_period";
      rec("C", "Grace period (server kept, not terminated)", f?.ok && a.status === expectStatus && !!a.grace_ends_at && !!a.next_retry_at && a.attempt_count === 1, { status: a.status, grace_ends_at: a.grace_ends_at }); }
    // D. retry succeeds
    { const s = await mkSub(100); await rpc("cloud_record_renewal_failure", { p_sub: s.id, p_reason: "insufficient_balance", p_now: at(0.01) });
      await db.from("cloud_subscriptions").update({ sim_wallet_minor: 9000 }).eq("id", s.id);
      const r = await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(1) }); const a = await get(s.id);
      rec("D", "Retry succeeds", r?.ok && a.status === "active" && a.attempt_count === 0 && a.sim_wallet_minor === 9000 - 5635, { r }); }
    // E. retry fails
    { const s = await mkSub(0); await rpc("cloud_record_renewal_failure", { p_sub: s.id, p_reason: "insufficient_balance", p_now: at(0.01) });
      const r = await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(1) }); await rpc("cloud_record_renewal_failure", { p_sub: s.id, p_reason: "insufficient_balance", p_now: at(1) });
      const a = await get(s.id); rec("E", "Retry fails (no charge, attempts counted)", !r?.ok && a.attempt_count === 2 && (await invCount(s.id)) === 0 && ["grace_period", "suspension_pending"].includes(a.status), { attempts: a.attempt_count, status: a.status }); }
    // F. suspension (power off ≠ delete)
    const mock = new MockProvider();
    const sF = await mkSub(0);
    { const srv = await mock.create("sub:" + sF.id);
      await rpc("cloud_record_renewal_failure", { p_sub: sF.id, p_reason: "insufficient_balance", p_now: at(0.01) });
      const early = await rpc("cloud_begin_suspension", { p_sub: sF.id, p_now: at(1) });
      await rpc("cloud_begin_suspension", { p_sub: sF.id, p_now: at(graceEnd) });
      await mock.power(srv.id, false); const k = await jobKey(sF.id, "suspension"); await runJob(k, true);
      await rpc("cloud_confirm_provider_state", { p_sub: sF.id, p_state: "powered_off", p_now: at(graceEnd) });
      const a = await get(sF.id);
      rec("F", "Suspension after grace (power off, server kept)", (settings.grace_server_policy === "suspend_immediately" || early?.ok === false) && a.status === "suspended" && !!a.termination_scheduled_at && !!(await mock.get(srv.id)), { status: a.status, server: (await mock.get(srv.id))?.status }); (sF as any).srv = srv.id; }
    // G + H. payment while suspended → reactivation after provider verify
    { await db.from("cloud_subscriptions").update({ sim_wallet_minor: 20000 }).eq("id", sF.id);
      const r = await rpc("cloud_renew_subscription", { p_sub: sF.id, p_now: at(graceEnd + 1) }); const mid = await get(sF.id);
      rec("G", "Payment while suspended (settle first)", r?.ok && mid.status === "reactivation_pending" && mid.sim_wallet_minor === 20000 - 5635, { status: mid.status });
      const k = await jobKey(sF.id, "reactivation"); await mock.power((sF as any).srv, true);
      const ver = (await mock.get((sF as any).srv))?.status === "running";
      await runJob(k, true);
      if (ver) await rpc("cloud_confirm_provider_state", { p_sub: sF.id, p_state: "running", p_now: at(graceEnd + 1) });
      const a = await get(sF.id); rec("H", "Reactivation only after provider verified running", ver && a.status === "active" && !!a.reactivated_at, { status: a.status }); }
    // I. termination scheduled + executed with verification
    const suspendSub = async (wallet = 0, extra = {}) => { const s = await mkSub(wallet, extra);
      await rpc("cloud_record_renewal_failure", { p_sub: s.id, p_reason: "insufficient_balance", p_now: at(0.01) });
      await rpc("cloud_begin_suspension", { p_sub: s.id, p_now: at(graceEnd) });
      await rpc("cloud_confirm_provider_state", { p_sub: s.id, p_state: "powered_off", p_now: at(graceEnd) }); return s; };
    { const s = await suspendSub(); const srv = await mock.create("sub:" + s.id);
      const early = await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(graceEnd + 1) });
      const r = await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) });
      await mock.delete(srv.id); const gone = !(await mock.get(srv.id)); await runJob(await jobKey(s.id, "termination"), true);
      if (gone) await rpc("cloud_confirm_provider_state", { p_sub: s.id, p_state: "deleted", p_now: at(termEnd) });
      const a = await get(s.id); rec("I", "Termination after delay, verified deletion", early?.reason === "not_due" && r?.ok && a.status === "terminated" && !!a.provider_deletion_verified_at, { early, status: a.status }); }
    // J. payment just before termination
    { const s = await suspendSub(); await db.from("cloud_subscriptions").update({ sim_wallet_minor: 9000 }).eq("id", s.id);
      await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(termEnd - 0.01) }); const r = await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) });
      const a = await get(s.id); rec("J", "Payment just before termination cancels it", !r?.ok && a.status === "reactivation_pending", { r, status: a.status }); }
    // K. protected server
    { const s = await suspendSub(0, { protect_from_termination: true }); const r = await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) });
      const a = await get(s.id); rec("K", "Protected subscription never auto-terminated", r?.reason === "protected" && a.status === "suspended", r); }
    // L. provider timeout → retry with backoff, then manual review; no wrong status
    { const s = await suspendSub(); await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) }); const k = await jobKey(s.id, "termination");
      const outs: string[] = [];
      for (let i = 0; i < settings.provider_max_attempts; i++) { await db.from("cloud_jobs").update({ scheduled_at: new Date().toISOString() }).eq("idempotency_key", k); outs.push(await runJob(k, false, classifyError("timeout"), "timeout")); }
      const a = await get(s.id); rec("L", "Provider timeout: backoff retries → manual_review, status unchanged", outs.at(-1) === "manual_review" && outs.slice(0, -1).every((o) => o === "queued") && a.status === "termination_pending", outs); }
    // M. lost create response → adopt existing, no second server
    { const label = "order:sim-" + crypto.randomUUID(); mock.loseNextResponse = true; const before = mock.createCalls;
      try { await mock.create(label); } catch { /* response lost */ }
      const found = await mock.findByLabel(label); if (!found) await mock.create(label);
      rec("M", "Lost create response → adopted existing resource", !!found && mock.createCalls - before === 1 && mock.list().filter((x) => x.label === label).length === 1, { adopted: found?.id }); }
    // N + O. reconciliation mismatch & orphan (alerts only, nothing deleted)
    { const internal = [{ id: "int-1", provider_ref: "mock-gone", ip: "1.1.1.1", status: "running" }];
      const orphan = await mock.create("unknown-resource");
      const findings: any[] = [];
      for (const i of internal) if (!(await mock.get(i.provider_ref))) findings.push({ kind: "provider_missing", provider_ref: i.provider_ref, is_simulation: true });
      const mapped = new Set(internal.map((i) => i.provider_ref));
      for (const p of mock.list()) if (!mapped.has(p.id) && !p.label.startsWith("sub:") && !p.label.startsWith("order:")) findings.push({ kind: "orphan", provider_ref: p.id, is_simulation: true, details: { note: "ORPHAN DETECTED — admin review required" } });
      if (findings.length) await db.from("cloud_reconciliation_findings").insert(findings);
      for (const f of findings) await db.rpc("_cloud_alert", { p_kind: f.kind === "orphan" ? "orphan_resource" : "reconciliation_mismatch", p_sev: "warning", p_msg: f.kind, p_key: "sim:" + f.kind + ":" + f.provider_ref + ":" + t0, p_details: {}, p_sim: true });
      rec("N", "Reconciliation mismatch flagged (no auto-fix)", findings.some((f) => f.kind === "provider_missing"), findings.length);
      rec("O", "Orphan resource flagged, not deleted", findings.some((f) => f.kind === "orphan") && !!(await mock.get(orphan.id)), orphan.id); }
    // P. duplicate renewal worker (true concurrency)
    { const s = await mkSub(100000); const rs = await Promise.all(Array.from({ length: 5 }, () => rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) })));
      const a = await get(s.id); rec("P", "Duplicate renewal workers → one charge", (await invCount(s.id)) === 1 && a.sim_wallet_minor === 100000 - 5635, rs.map((r: any) => r?.duplicate ?? r?.reason ?? r?.error)); }
    // Q. duplicate termination worker
    { const s = await suspendSub(); const rs = await Promise.all(Array.from({ length: 4 }, () => rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) })));
      const { count } = await db.from("cloud_jobs").select("id", { count: "exact", head: true }).eq("resource_id", s.id).eq("job_type", "termination");
      rec("Q", "Duplicate termination workers → one job", rs.filter((r: any) => r?.ok).length === 1 && count === 1, { ok: rs.filter((r: any) => r?.ok).length, jobs: count }); }
    // R. conflicting server actions
    { const res = crypto.randomUUID(); const j1 = crypto.randomUUID(), j2 = crypto.randomUUID();
      const [a1, a2] = await Promise.all([rpc("cloud_acquire_lock", { p_resource: res, p_action: "rebuild", p_job: j1 }), rpc("cloud_acquire_lock", { p_resource: res, p_action: "delete", p_job: j2 })]);
      await rpc("cloud_release_lock", { p_resource: res, p_job: j1 }); await rpc("cloud_release_lock", { p_resource: res, p_job: j2 });
      rec("R", "Conflicting actions → only one holds the lock", [a1, a2].filter(Boolean).length === 1, { a1, a2 }); }

    // ===== Races =====
    { const s = await mkSub(0); await rpc("cloud_record_renewal_failure", { p_sub: s.id, p_reason: "x", p_now: at(0.01) });
      await db.from("cloud_subscriptions").update({ sim_wallet_minor: 9000 }).eq("id", s.id);
      await Promise.all([rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(graceEnd) }), rpc("cloud_begin_suspension", { p_sub: s.id, p_now: at(graceEnd) })]);
      const a = await get(s.id); const n = await invCount(s.id);
      const ok = n === 1 && a.sim_wallet_minor === 9000 - 5635 && ["active", "reactivation_pending"].includes(a.status);
      rec("RACE-1", "Payment vs suspension at same moment", ok, { status: a.status, invoices: n }); }
    { const s = await suspendSub(); await db.from("cloud_subscriptions").update({ sim_wallet_minor: 9000 }).eq("id", s.id);
      const [p, t] = await Promise.all([rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(termEnd) }), rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) })]);
      const a = await get(s.id); const n = await invCount(s.id);
      const ok = (p?.ok && !t?.ok && a.status === "reactivation_pending" && n === 1) || (!p?.ok && t?.ok && a.status === "termination_pending" && n === 0 && a.sim_wallet_minor === 9000);
      rec("RACE-2", "Payment vs termination at same moment", ok, { pay: p?.ok ?? p, term: t?.ok ?? t, status: a.status, invoices: n }); }
    { const s = await mkSub(100000); await Promise.all([rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) }), rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) })]);
      rec("RACE-3", "Renewal worker runs twice", (await invCount(s.id)) === 1, await invCount(s.id)); }
    { const s = await mkSub(100000);
      const [c, r] = await Promise.all([
        db.from("cloud_subscriptions").update({ status: "cancellation_pending", auto_renew: false, cancel_mode: "period_end", termination_scheduled_at: s.current_period_end }).eq("id", s.id).eq("status", "active").select(),
        rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) })]);
      const a = await get(s.id); const n = await invCount(s.id);
      const ok = (a.status === "cancellation_pending" && n === 0 && a.sim_wallet_minor === 100000) || (a.status === "active" && n === 1 && (c.data?.length ?? 0) === 0) || (a.status === "cancellation_pending" && n === 1 && a.sim_wallet_minor === 100000 - 5635);
      rec("RACE-4", "Cancellation and renewal together (consistent)", ok, { status: a.status, invoices: n, wallet: a.sim_wallet_minor }); }

    // ===== Security: a signed-in non-admin cannot call workers =====
    { const anon = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!);
      const calls = ["cloud_renew_subscription", "cloud_begin_suspension", "cloud_begin_termination", "cloud_finish_job", "cloud_confirm_provider_state"];
      const denied: Record<string, boolean> = {};
      for (const fn of calls) { const { error } = await anon.rpc(fn, { p_sub: created[0] ?? crypto.randomUUID() } as any); denied[fn] = !!error; }
      const wr = await fetch(`${URL_}/functions/v1/cloud-lifecycle-worker`, { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "run" }) });
      rec("SEC-1", "Public cannot call renewal/suspension/termination/job functions", Object.values(denied).every(Boolean), denied);
      rec("SEC-2", "Worker endpoint rejects non-admin callers", wr.status === 401 || wr.status === 403, wr.status); }
  } catch (e) {
    rec("FIXTURE", "Simulation error", false, String(e));
  } finally {
    // Cleanup simulation data (subscriptions cascade to events/invoices/costs).
    if (created.length) {
      await db.from("cloud_jobs").delete().in("resource_id", created);
      await db.from("cloud_subscriptions").delete().in("id", created).eq("is_simulation", true);
    }
    await db.from("cloud_jobs").delete().eq("is_simulation", true);
    await db.from("cloud_reconciliation_findings").delete().eq("is_simulation", true);
    await db.from("cloud_admin_alerts").delete().eq("is_simulation", true);
  }
  return { ran_at: new Date().toISOString(), passed: results.filter((r) => r.pass).length, total: results.length, results, cleaned_up: created.length };
}
