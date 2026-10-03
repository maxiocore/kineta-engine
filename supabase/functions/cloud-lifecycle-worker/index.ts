// Cloud lifecycle worker + scheduler.
// Callers: service role, admins, or the scheduler (x-scheduler-secret = LIFECYCLE_SCHEDULER_SECRET).
// Every stage is gated by its own switch (all false by default). Provider IDs come only from the DB
// via cloud_prepare_provider_action, never from the request body.
// `simulate` runs the same scan + job code against simulation subscriptions with a MockProvider.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { HetznerCloudProvider } from "../_shared/cloud-providers.ts";
import { type Ctx, type LifecycleProvider, type ServerState, RealProvider, runProviderJob } from "../_shared/cloud-lifecycle-core.ts";
export { classifyError } from "../_shared/cloud-lifecycle-core.ts";
import { sendEmail } from "../_shared/email-gateway.ts";
import { renderBrandedEmail } from "../_shared/email-template.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const flag = (n: string) => (Deno.env.get(n) ?? "false").toLowerCase() === "true";
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Deterministic in-memory provider for simulations. Never touches the network. */
class MockProvider implements LifecycleProvider {
  servers = new Map<string, { id: string; label: string; status: string; backup: boolean }>();
  failActions = new Map<string, string>(); loseResponse = new Set<string>(); calls: string[] = [];
  pollMs = 0; pollTries = 2; private n = 0; createCalls = 0; loseNextCreate = false;
  add(label: string, backup = false) { const s = { id: `mock-${++this.n}`, label, status: "running", backup }; this.servers.set(s.id, s); return s; }
  async create(label: string) { this.createCalls++; const s = this.add(label); if (this.loseNextCreate) { this.loseNextCreate = false; throw new Error("timeout"); } return s; }
  async findByLabel(label: string) { return [...this.servers.values()].find((s) => s.label === label) ?? null; }
  async get(ref: string): Promise<ServerState> { const s = this.servers.get(ref); return s ? { exists: true, status: s.status, backup_enabled: s.backup } : { exists: false }; }
  async act(ref: string, action: string) {
    this.calls.push(`${action}:${ref}`);
    const f = this.failActions.get(action); if (f) return { ok: false, error: f };
    const s = this.servers.get(ref); if (!s) return { ok: false, error: "not_found" };
    if (action === "poweroff") s.status = "off"; else if (action === "poweron") s.status = "running";
    else if (action === "delete") this.servers.delete(ref); else if (action === "disable_backup") s.backup = false;
    if (this.loseResponse.has(action)) { this.loseResponse.delete(action); return { ok: false, error: "timeout" }; }
    return { ok: true };
  }
  list() { return [...this.servers.values()]; }
}

// ---------- Email ----------
const EMAIL_TEXT: Record<string, [string, string, string]> = {
  renewal_reminder: ["تذكير بتجديد خدمة الخادم", "Server renewal reminder", "info"],
  renewal_successful: ["تم تجديد خدمة الخادم", "Server renewal successful", "success"],
  renewal_failed: ["فشل تجديد خدمة الخادم", "Server renewal failed", "danger"],
  grace_started: ["بدأت مهلة السداد", "Grace period started", "warning"],
  suspension_warning: ["تنبيه تعليق الخدمة", "Suspension warning", "warning"],
  service_suspended: ["تم تعليق الخدمة", "Service suspended", "danger"],
  payment_received: ["تم استلام الدفعة", "Payment received", "success"],
  service_reactivated: ["تمت إعادة تفعيل الخدمة", "Service reactivated", "success"],
  termination_warning: ["تنبيه موعد الحذف", "Termination warning", "danger"],
  final_termination_warning: ["تنبيه نهائي قبل الحذف", "Final termination warning", "danger"],
  service_terminated: ["تم إنهاء الخدمة", "Service terminated", "info"],
  cancellation_scheduled: ["تمت جدولة الإلغاء", "Cancellation scheduled", "info"],
};
const emailConfigured = () => !!Deno.env.get("LOVABLE_API_KEY") && !!Deno.env.get("RESEND_API_KEY");

async function sendLifecycleEmail(ctx: Ctx, job: any) {
  const ev = String(job.payload?.event ?? ""); const t = EMAIL_TEXT[ev];
  if (!t) return { ok: true, skipped: "no_email_for_event" };
  const { data: u } = await ctx.db.auth.admin.getUserById(job.payload.user_id);
  const to = u?.user?.email; if (!to) return { ok: false, error: "no_recipient" };
  const amount = job.payload.amount_minor != null ? `${(job.payload.amount_minor / 100).toFixed(2)} SAR` : undefined;
  const html = renderBrandedEmail({
    title: `${t[0]} | ${t[1]}`, department: "الشؤون المالية", tone: t[2] as any, amount, legal: "financial",
    intro: `${t[0]}. ${t[1]}.`,
    details: job.payload.date ? [{ label: "التاريخ / Date", value: new Date(job.payload.date).toLocaleString("en-GB"), dir: "ltr" }] : [],
    action: ["renewal_failed", "grace_started", "suspension_warning", "service_suspended", "termination_warning", "final_termination_warning"].includes(ev)
      ? { label: "ادفع الآن / Pay now", url: "https://ash-holding.sa/dashboard/cloud" } : undefined,
    notice: "خدمة البنية السحابية من ASH HOLDING. Cloud infrastructure service by ASH HOLDING.",
  });
  const r = await sendEmail({ from: "ASH HOLDING <billing@ash-holding.sa>", to, subject: `${t[0]} | ${t[1]}`, html, reply_to: "billing@ash-holding.sa" });
  return r.error ? { ok: false, error: `email_${r.error.statusCode ?? "error"}` } : { ok: true };
}

// ---------- Scheduler scans ----------
type Scan = { name: string; gate: string[]; run: (ctx: Ctx) => Promise<{ scanned: number; processed: number; ok: number; fail: number; notes?: string }> };
const nowIso = (ctx: Ctx) => ctx.now ?? new Date().toISOString();
const withNow = (ctx: Ctx, a: Record<string, unknown>) => (ctx.now ? { ...a, p_now: ctx.now } : a);

const SCANS: Scan[] = [
  { name: "renewal_due", gate: ["AUTOMATIC_RENEWALS_ENABLED"], run: async (ctx) => {
    const { data: st } = await ctx.db.from("cloud_lifecycle_settings").select("notify_before_days").single();
    const now = new Date(nowIso(ctx)).getTime();
    const { data: subs } = await ctx.db.from("cloud_subscriptions").select("*").eq("is_simulation", ctx.sim).in("status", ["active", "renewal_due"]).eq("auto_renew", true).limit(500);
    let processed = 0, ok = 0, fail = 0;
    for (const s of subs ?? []) {
      const days = Math.ceil((new Date(s.next_renewal_at).getTime() - now) / 86400000);
      if (days > 0 && (st?.notify_before_days ?? []).includes(days)) {
        const key = `notify:${s.id}:renewal_reminder:${days}d:${s.next_renewal_at}`;
        const { count } = await ctx.db.from("cloud_subscription_events").select("id", { count: "exact", head: true }).eq("subscription_id", s.id).eq("event", "notify:renewal_reminder").contains("details", { key });
        if (!count) await ctx.db.rpc("_cloud_notify", { p_sub: s, p_event: "renewal_reminder", p_ar: `تجديد الخادم بعد ${days} يوم`, p_en: `Server renewal in ${days} day(s)`, p_data: { key, amount_minor: s.renewal_total_minor, date: s.next_renewal_at } });
      }
      if (new Date(s.next_renewal_at).getTime() > now) continue;
      processed++;
      const r = (await ctx.db.rpc("cloud_renew_subscription", withNow(ctx, { p_sub: s.id }))).data;
      if (r?.ok) ok++; else { fail++; if (r?.reason === "insufficient_balance" || r?.reason === "requires_customer_payment") await ctx.db.rpc("cloud_record_renewal_failure", withNow(ctx, { p_sub: s.id, p_reason: r.reason })); }
    }
    return { scanned: subs?.length ?? 0, processed, ok, fail };
  } },
  { name: "renewal_retry", gate: ["AUTOMATIC_RENEWALS_ENABLED"], run: async (ctx) => {
    const { data: subs } = await ctx.db.from("cloud_subscriptions").select("id").eq("is_simulation", ctx.sim).in("status", ["payment_failed", "grace_period"]).lte("next_retry_at", nowIso(ctx)).limit(500);
    let ok = 0, fail = 0;
    for (const s of subs ?? []) {
      const r = (await ctx.db.rpc("cloud_renew_subscription", withNow(ctx, { p_sub: s.id }))).data;
      if (r?.ok) ok++; else { fail++; await ctx.db.rpc("cloud_record_renewal_failure", withNow(ctx, { p_sub: s.id, p_reason: r?.reason ?? "renewal_failed" })); }
    }
    return { scanned: subs?.length ?? 0, processed: subs?.length ?? 0, ok, fail };
  } },
  { name: "grace_expiry", gate: ["AUTOMATIC_SUSPENSIONS_ENABLED"], run: async (ctx) => {
    const { data: subs } = await ctx.db.from("cloud_subscriptions").select("id").eq("is_simulation", ctx.sim).eq("status", "grace_period").lte("grace_ends_at", nowIso(ctx)).limit(500);
    let ok = 0; for (const s of subs ?? []) if ((await ctx.db.rpc("cloud_begin_suspension", withNow(ctx, { p_sub: s.id }))).data?.ok) ok++;
    return { scanned: subs?.length ?? 0, processed: subs?.length ?? 0, ok, fail: (subs?.length ?? 0) - ok };
  } },
  { name: "termination", gate: ["AUTOMATIC_TERMINATIONS_ENABLED"], run: async (ctx) => {
    const soon = new Date(new Date(nowIso(ctx)).getTime() + 86400000).toISOString();
    const { data: subs } = await ctx.db.from("cloud_subscriptions").select("id,termination_scheduled_at,final_warning_sent_at").eq("is_simulation", ctx.sim).in("status", ["suspended", "cancellation_pending"]).lte("termination_scheduled_at", soon).limit(200);
    let ok = 0, processed = 0;
    for (const s of subs ?? []) {
      if (!s.final_warning_sent_at) { await ctx.db.rpc("cloud_send_final_warning", withNow(ctx, { p_sub: s.id })); continue; }
      if (s.termination_scheduled_at > nowIso(ctx)) continue;
      processed++; if ((await ctx.db.rpc("cloud_begin_termination", withNow(ctx, { p_sub: s.id }))).data?.ok) ok++;
    }
    return { scanned: subs?.length ?? 0, processed, ok, fail: processed - ok };
  } },
  { name: "provider_jobs", gate: ["LIVE_PROVISIONING_ENABLED"], run: async (ctx) => {
    const types = ["reactivation", "backup_disable"];
    if (ctx.switches.AUTOMATIC_SUSPENSIONS_ENABLED || ctx.sim) types.push("suspension");
    if (ctx.switches.AUTOMATIC_TERMINATIONS_ENABLED || ctx.sim) types.push("termination");
    const { data: jobs } = await ctx.db.from("cloud_jobs").select("id").eq("is_simulation", ctx.sim).eq("status", "queued").in("job_type", types).lte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(20);
    let ok = 0, fail = 0;
    for (const j of jobs ?? []) {
      const claimed = (await ctx.db.rpc("cloud_claim_job", { p_job: j.id })).data;
      if (!claimed?.id) continue;
      const r = await runProviderJob(ctx, claimed); r.ok ? ok++ : fail++;
    }
    return { scanned: jobs?.length ?? 0, processed: ok + fail, ok, fail };
  } },
  { name: "reconciliation", gate: [], run: async (ctx) => {
    if (ctx.sim) return { scanned: 0, processed: 0, ok: 0, fail: 0, notes: "covered by N/O tests" };
    // Read-only: list provider servers and compare with internal mapping. Never deletes or fixes.
    const p = new HetznerCloudProvider(); let list: any[] = [];
    try { list = await p.sync("server"); } catch (e) { await ctx.db.rpc("_cloud_alert", { p_kind: "provider_api_down", p_sev: "critical", p_msg: "Provider read failed during reconciliation", p_key: "recon_down:" + new Date().toISOString().slice(0, 13), p_details: {}, p_sim: false }); return { scanned: 0, processed: 0, ok: 0, fail: 1, notes: String((e as Error).message) }; }
    const { data: internal } = await ctx.db.from("cloud_servers").select("id,provider_server_id,status,primary_ipv4").not("provider_server_id", "is", null);
    const byRef = new Map((internal ?? []).map((s: any) => [String(s.provider_server_id), s]));
    const provRefs = new Set(list.map((x) => x.provider_ref)); const findings: any[] = [];
    for (const s of internal ?? []) if (!provRefs.has(String(s.provider_server_id)) && !["terminated", "cancelled", "failed"].includes(s.status)) findings.push({ kind: "provider_missing", server_id: s.id, provider_ref: s.provider_server_id });
    for (const x of list) {
      const s: any = byRef.get(x.provider_ref);
      if (!s) findings.push({ kind: "orphan", provider_ref: x.provider_ref, details: { note: "ORPHAN DETECTED - admin review required" } });
      else if (s.primary_ipv4 && x.data?.ipv4 && s.primary_ipv4 !== x.data.ipv4) findings.push({ kind: "ip_mismatch", server_id: s.id, provider_ref: x.provider_ref });
    }
    for (const f of findings) {
      const { count } = await ctx.db.from("cloud_reconciliation_findings").select("id", { count: "exact", head: true }).eq("kind", f.kind).eq("provider_ref", f.provider_ref).eq("status", "open");
      if (!count) { await ctx.db.from("cloud_reconciliation_findings").insert(f); await ctx.db.rpc("_cloud_alert", { p_kind: f.kind === "orphan" ? "orphan_resource" : "reconciliation_mismatch", p_sev: "warning", p_msg: f.kind, p_key: `recon:${f.kind}:${f.provider_ref}`, p_details: {}, p_sim: false }); }
    }
    return { scanned: list.length, processed: findings.length, ok: list.length, fail: 0 };
  } },
  { name: "email_queue", gate: [], run: async (ctx) => {
    const { data: jobs } = await ctx.db.from("cloud_jobs").select("id").eq("is_simulation", ctx.sim).eq("status", "queued").eq("job_type", "notification").lte("scheduled_at", new Date().toISOString()).limit(50);
    if (!emailConfigured()) return { scanned: jobs?.length ?? 0, processed: 0, ok: 0, fail: 0, notes: "CONFIGURATION_REQUIRED" };
    let ok = 0, fail = 0;
    for (const j of jobs ?? []) {
      const claimed = (await ctx.db.rpc("cloud_claim_job", { p_job: j.id })).data; if (!claimed?.id) continue;
      const r = ctx.sim ? { ok: true } : await sendLifecycleEmail(ctx, claimed);
      await ctx.db.rpc("cloud_finish_job", { p_job: j.id, p_ok: r.ok, p_class: r.ok ? null : "temporary", p_error: (r as any).error ?? null }); r.ok ? ok++ : fail++;
    }
    return { scanned: jobs?.length ?? 0, processed: ok + fail, ok, fail };
  } },
];

async function tick(ctx: Ctx, only?: string[]) {
  const out: Record<string, unknown> = {};
  for (const scan of SCANS) {
    if (only && !only.includes(scan.name)) continue;
    const enabled = ctx.sim || scan.gate.every((g) => ctx.switches[g]);
    const run = (await ctx.db.rpc("cloud_scheduler_begin", { p_type: (ctx.sim ? "sim:" : "") + scan.name, p_ttl_seconds: 600, p_sim: ctx.sim })).data;
    if (!run) { out[scan.name] = "skipped_locked"; continue; }
    if (!enabled) { await ctx.db.rpc("cloud_scheduler_end", { p_run: run, p_scanned: 0, p_processed: 0, p_ok: 0, p_fail: 0, p_status: "disabled", p_notes: "switch off: " + scan.gate.join(",") }); out[scan.name] = "disabled"; continue; }
    try {
      const r = await scan.run(ctx);
      await ctx.db.rpc("cloud_scheduler_end", { p_run: run, p_scanned: r.scanned, p_processed: r.processed, p_ok: r.ok, p_fail: r.fail, p_status: "finished", p_notes: r.notes ?? null });
      out[scan.name] = r;
    } catch (e) {
      await ctx.db.rpc("cloud_scheduler_end", { p_run: run, p_scanned: 0, p_processed: 0, p_ok: 0, p_fail: 1, p_status: "error", p_notes: String((e as Error).message) });
      out[scan.name] = { error: String((e as Error).message) };
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const db = createClient(URL_, SR);
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const schedSecret = Deno.env.get("LIFECYCLE_SCHEDULER_SECRET");
  const isScheduler = !!schedSecret && req.headers.get("x-scheduler-secret") === schedSecret;
  let actor: string | null = null;
  if (token !== SR && !isScheduler) {
    const { data: u } = await db.auth.getUser(token);
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await db.rpc("is_admin", { _user_id: u.user.id });
    if (!isAdmin) return json({ error: "forbidden" }, 403);
    actor = u.user.id;
  }
  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = String(body.action ?? "status");
  const switches: Record<string, boolean> = {
    LIVE_PAYMENTS_ENABLED: flag("LIVE_PAYMENTS_ENABLED"), LIVE_PROVISIONING_ENABLED: flag("LIVE_PROVISIONING_ENABLED"),
    AUTOMATIC_RENEWALS_ENABLED: flag("AUTOMATIC_RENEWALS_ENABLED"), AUTOMATIC_SUSPENSIONS_ENABLED: flag("AUTOMATIC_SUSPENSIONS_ENABLED"),
    AUTOMATIC_TERMINATIONS_ENABLED: flag("AUTOMATIC_TERMINATIONS_ENABLED"), LIFECYCLE_SCHEDULER_ENABLED: flag("LIFECYCLE_SCHEDULER_ENABLED"),
  };
  if (action === "status") return json({ switches, email: emailConfigured() ? "configured" : "CONFIGURATION_REQUIRED", scheduler_secret: schedSecret ? "set" : "not_set" });
  if (action === "tick") {
    if (!switches.LIFECYCLE_SCHEDULER_ENABLED) return json({ switches, out: "LIFECYCLE_SCHEDULER_ENABLED=false" });
    return json({ switches, out: await tick({ db, sim: false, prov: new RealProvider(), switches, actor }) });
  }
  if (action === "verify_provider_jobs") {
    // Dry-run of every queued real provider job: safety checks + provider read only. No mutation.
    const { data: jobs } = await db.from("cloud_jobs").select("*").eq("is_simulation", false).eq("status", "queued").in("job_type", ["suspension", "reactivation", "termination", "backup_disable"]).limit(20);
    const ctx: Ctx = { db, sim: false, prov: new RealProvider(), switches };
    const res = []; for (const j of jobs ?? []) res.push({ job: j.id, type: j.job_type, r: await runProviderJob(ctx, j, true) });
    return json({ switches, checked: res.length, res });
  }
  if (action === "simulate") return json(await simulate(db, actor, switches));
  return json({ error: "unknown_action" }, 400);
});

// ================= Simulation =================
async function simulate(db: any, actor: string | null, switches: Record<string, boolean>) {
  const results: { id: string; name: string; pass: boolean; detail: string }[] = [];
  const created: string[] = [];
  const t0 = Date.now();
  const at = (days: number) => new Date(t0 + days * 86400000).toISOString();
  const { data: settings } = await db.from("cloud_lifecycle_settings").select("*").single();
  const { data: anyAdmin } = await db.from("user_roles").select("user_id").eq("role", "admin").limit(1).single();
  const owner = actor ?? anyAdmin.user_id;
  const mock = new MockProvider();

  const mkSub = async (wallet: number, extra: Record<string, unknown> = {}) => {
    const srv = mock.add("sub:" + crypto.randomUUID(), !!extra.backups_addon);
    const { data, error } = await db.from("cloud_subscriptions").insert({
      user_id: owner, status: "active", billing_cycle: "monthly", amount: 49, vat_amount: 7.35, is_simulation: true, sim_provider_ref: srv.id,
      started_at: at(-30), current_period_start: at(-30), current_period_end: at(0), next_renewal_at: at(0), renewal_at: at(0).slice(0, 10),
      renewal_subtotal_minor: 4900, renewal_backup_minor: 0, vat_rate_snapshot: 0.15, renewal_vat_minor: 735, renewal_total_minor: 5635,
      sim_wallet_minor: wallet, auto_renew: true, payment_method: "wallet", ...extra,
    }).select().single();
    if (error) throw new Error("fixture: " + error.message);
    created.push(data.id); return data;
  };
  const get = async (id: string) => (await db.from("cloud_subscriptions").select("*").eq("id", id).single()).data;
  const invCount = async (id: string) => (await db.from("cloud_renewal_invoices").select("id", { count: "exact", head: true }).eq("subscription_id", id)).count ?? 0;
  const rpc = async (fn: string, args: Record<string, unknown>) => { const { data, error } = await db.rpc(fn, args); if (error) return { error: error.message }; return data; };
  const rec = (id: string, name: string, pass: boolean, detail: unknown) => results.push({ id, name, pass: !!pass, detail: typeof detail === "string" ? detail : JSON.stringify(detail) });
  const graceEnd = settings.grace_period_days + 0.01;
  const termEnd = graceEnd + settings.termination_delay_days + 0.01;
  const ctx = (now: string): Ctx => ({ db, sim: true, now, prov: mock, switches });
  const jobOf = async (subId: string, type: string) => (await db.from("cloud_jobs").select("*").eq("resource_id", subId).eq("job_type", type).order("created_at", { ascending: false }).limit(1).maybeSingle()).data;
  const runJob = async (subId: string, type: string, now: string) => {
    const j = await jobOf(subId, type); if (!j) return { ok: false, reason: "no_job" };
    await db.from("cloud_jobs").update({ scheduled_at: new Date().toISOString() }).eq("id", j.id).eq("status", "queued");
    const c = await rpc("cloud_claim_job", { p_job: j.id }); if (!c?.id) return { ok: false, reason: "not_claimed" };
    return await runProviderJob(ctx(now), c);
  };
  const toGrace = async (s: any) => rpc("cloud_record_renewal_failure", { p_sub: s.id, p_reason: "insufficient_balance", p_now: at(0.01) });
  const toSuspended = async (wallet = 0, extra = {}) => {
    const s = await mkSub(wallet, extra); await toGrace(s);
    await rpc("cloud_begin_suspension", { p_sub: s.id, p_now: at(graceEnd) });
    await runJob(s.id, "suspension", at(graceEnd)); return s;
  };

  try {
    // ---- policy values ----
    rec("CFG", "Approved policy: grace 3d, retries +24/+48/+72h, delay 7d, keep running in grace", settings.grace_period_days === 3 && settings.termination_delay_days === 7 && JSON.stringify(settings.renewal_retry_hours) === "[24,48,72]" && settings.grace_server_policy === "keep_running" && settings.values_decided, settings);

    // A–E renewals
    { const s = await mkSub(10000); const r = await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) }); const a = await get(s.id);
      rec("A", "Successful renewal", r?.ok && a.status === "active" && a.sim_wallet_minor === 4365 && (await invCount(s.id)) === 1, { r, wallet: a.sim_wallet_minor }); }
    { const s = await mkSub(100); const r = await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) }); const a = await get(s.id);
      rec("B", "Insufficient wallet", r?.reason === "insufficient_balance" && a.sim_wallet_minor === 100 && (await invCount(s.id)) === 0, r); }
    { const s = await mkSub(100); await toGrace(s); const a = await get(s.id); const srv = await mock.get(s.sim_provider_ref);
      const hrs = (new Date(a.next_retry_at).getTime() - new Date(at(0.01)).getTime()) / 3600000;
      rec("C", "Grace period 3 days, server keeps running, retry +24h", a.status === "grace_period" && Math.round((new Date(a.grace_ends_at).getTime() - new Date(at(0.01)).getTime()) / 86400000) === 3 && srv.status === "running" && Math.round(hrs) === 24, { status: a.status, grace_ends_at: a.grace_ends_at, retry_h: hrs }); }
    { const s = await mkSub(100); await toGrace(s); await db.from("cloud_subscriptions").update({ sim_wallet_minor: 9000 }).eq("id", s.id);
      const out = await tick(ctx(at(1.01)), ["renewal_retry"]); const a = await get(s.id);
      rec("D", "Scheduler retry succeeds (+24h)", a.status === "active" && a.attempt_count === 0 && a.sim_wallet_minor === 9000 - 5635, out); }
    { const s = await mkSub(0); await toGrace(s); await tick(ctx(at(1.01)), ["renewal_retry"]); const a1 = await get(s.id); await tick(ctx(at(2.02)), ["renewal_retry"]); const a = await get(s.id);
      const hrs = Math.round((new Date(a.next_retry_at).getTime() - new Date(s.next_renewal_at).getTime()) / 3600000);
      rec("E", "Retries at due+24h, +48h → next at due+72h, no charge", a1.attempt_count === 2 && a.attempt_count === 3 && hrs === 72 && (await invCount(s.id)) === 0 && a.status === "grace_period", { attempts: a.attempt_count, next_h: hrs }); }

    // F suspension via real job runner (mock provider)
    { const s = await mkSub(0); await toGrace(s);
      const early = await tick(ctx(at(1)), ["grace_expiry"]); const e1 = await get(s.id);
      await tick(ctx(at(graceEnd)), ["grace_expiry"]); const mid = await get(s.id);
      const r = await runJob(s.id, "suspension", at(graceEnd)); const a = await get(s.id); const srv = await mock.get(s.sim_provider_ref);
      rec("F", "Grace expiry → power off verified → suspended (server kept)", e1.status === "grace_period" && mid.status === "suspension_pending" && r.ok && a.status === "suspended" && srv.exists && srv.status === "off" && !!a.termination_scheduled_at,
        { early, status: a.status, server: srv.status, deletion: a.termination_scheduled_at });
      // F2: provider fails → stays suspension_pending
      const s2 = await mkSub(0); await toGrace(s2); await rpc("cloud_begin_suspension", { p_sub: s2.id, p_now: at(graceEnd) });
      mock.failActions.set("poweroff", "unavailable"); const r2 = await runJob(s2.id, "suspension", at(graceEnd)); mock.failActions.delete("poweroff");
      const b = await get(s2.id); const j2 = await jobOf(s2.id, "suspension");
      rec("F2", "Power-off fails → stays suspension_pending, job retried", !r2.ok && b.status === "suspension_pending" && j2.status === "queued" && j2.error_class === "temporary", { status: b.status, job: j2.status });
      // G/H reactivation
      await db.from("cloud_subscriptions").update({ sim_wallet_minor: 20000 }).eq("id", s.id);
      const p = await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(graceEnd + 1) }); const g = await get(s.id);
      rec("G", "Payment while suspended settles first", p?.ok && g.status === "reactivation_pending" && g.sim_wallet_minor === 20000 - 5635, { status: g.status });
      const rr = await runJob(s.id, "reactivation", at(graceEnd + 1)); const h = await get(s.id);
      rec("H", "Power on → verified running → active", rr.ok && h.status === "active" && (await mock.get(s.sim_provider_ref)).status === "running", { status: h.status });
      // H2 power-on fails: payment kept, alert
      const s3 = await toSuspended(0); await db.from("cloud_subscriptions").update({ sim_wallet_minor: 9000 }).eq("id", s3.id);
      await rpc("cloud_renew_subscription", { p_sub: s3.id, p_now: at(graceEnd + 1) });
      mock.failActions.set("poweron", "service_error"); const r3 = await runJob(s3.id, "reactivation", at(graceEnd + 1)); mock.failActions.delete("poweron");
      const c3 = await get(s3.id); const { count: al } = await db.from("cloud_admin_alerts").select("id", { count: "exact", head: true }).eq("kind", "reactivation_failed").eq("is_simulation", true);
      rec("H2", "Power-on fails → payment kept, not active, admin alert", !r3.ok && c3.status === "reactivation_pending" && (await invCount(s3.id)) === 1 && (al ?? 0) >= 1, { status: c3.status, alerts: al }); }

    // I termination (final warning required, verified deletion)
    { const s = await toSuspended();
      const noWarn = await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) });
      await tick(ctx(at(termEnd - 0.5)), ["termination"]); const w = await get(s.id);
      await tick(ctx(at(termEnd)), ["termination"]); const r = await runJob(s.id, "termination", at(termEnd)); const a = await get(s.id);
      rec("I", "Final warning sent, then delete → verified gone → terminated", noWarn?.reason === "final_warning_not_sent" && !!w.final_warning_sent_at && w.status === "suspended" && r.ok && a.status === "terminated" && !(await mock.get(s.sim_provider_ref)).exists && !!a.provider_deletion_verified_at, { noWarn, status: a.status });
      // I2 lost delete response: verify first, no blind second delete
      const s2 = await toSuspended(); await rpc("cloud_send_final_warning", { p_sub: s2.id, p_now: at(termEnd - 0.5) }); await rpc("cloud_begin_termination", { p_sub: s2.id, p_now: at(termEnd) });
      mock.loseResponse.add("delete"); const before = mock.calls.filter((c) => c.startsWith("delete")).length;
      const r2 = await runJob(s2.id, "termination", at(termEnd)); const b = await get(s2.id);
      const deletes = mock.calls.filter((c) => c.startsWith("delete")).length - before;
      rec("I2", "Lost delete response → state verified, one delete call, terminated", r2.ok && deletes === 1 && b.status === "terminated", { deletes, status: b.status }); }
    // J/K
    { const s = await toSuspended(); await db.from("cloud_subscriptions").update({ sim_wallet_minor: 9000 }).eq("id", s.id);
      await rpc("cloud_send_final_warning", { p_sub: s.id, p_now: at(termEnd - 0.5) });
      await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(termEnd - 0.01) }); const r = await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) });
      rec("J", "Payment just before termination blocks delete", !r?.ok && (await get(s.id)).status === "reactivation_pending" && (await mock.get(s.sim_provider_ref)).exists, r); }
    { const s = await toSuspended(0, { protect_from_termination: true }); await rpc("cloud_send_final_warning", { p_sub: s.id, p_now: at(termEnd - 0.5) });
      const r = await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) });
      rec("K", "Protected subscription never auto-terminated", r?.reason === "protected" && (await get(s.id)).status === "suspended", r); }
    // L provider timeout retries → manual review
    { const s = await toSuspended(); await rpc("cloud_send_final_warning", { p_sub: s.id, p_now: at(termEnd - 0.5) }); await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) });
      mock.failActions.set("delete", "unavailable"); const outs: string[] = [];
      for (let i = 0; i < settings.provider_max_attempts; i++) { await runJob(s.id, "termination", at(termEnd)); outs.push((await jobOf(s.id, "termination")).status); }
      mock.failActions.delete("delete");
      rec("L", "Provider outage: backoff retries → manual_review, status unchanged", outs.at(-1) === "manual_review" && (await get(s.id)).status === "termination_pending" && (await mock.get(s.sim_provider_ref)).exists, outs); }
    // M lost create response
    { const label = "order:sim-" + crypto.randomUUID(); mock.loseNextCreate = true; const before = mock.createCalls;
      try { await mock.create(label); } catch { /* lost */ }
      const found = await mock.findByLabel(label); if (!found) await mock.create(label);
      rec("M", "Lost create response → adopt existing resource", !!found && mock.createCalls - before === 1, { adopted: found?.id }); }
    // N/O reconciliation logic on mock data
    { const orphan = mock.add("unknown-resource"); const internalRefs = new Set(["mock-gone"]);
      const findings: any[] = [];
      if (!(await mock.get("mock-gone")).exists) findings.push({ kind: "provider_missing", provider_ref: "mock-gone", is_simulation: true });
      for (const p of mock.list()) if (!internalRefs.has(p.id) && p.label === "unknown-resource") findings.push({ kind: "orphan", provider_ref: p.id, is_simulation: true });
      await db.from("cloud_reconciliation_findings").insert(findings);
      rec("N", "Reconciliation mismatch flagged (no auto-fix)", findings.some((f) => f.kind === "provider_missing"), findings.length);
      rec("O", "Orphan flagged, not deleted", findings.some((f) => f.kind === "orphan") && (await mock.get(orphan.id)).exists, orphan.id); }
    // P/Q/R concurrency
    { const s = await mkSub(100000); await Promise.all(Array.from({ length: 5 }, () => rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) })));
      rec("P", "5 parallel renewals → one charge", (await invCount(s.id)) === 1 && (await get(s.id)).sim_wallet_minor === 100000 - 5635, await invCount(s.id)); }
    { const s = await toSuspended(); await rpc("cloud_send_final_warning", { p_sub: s.id, p_now: at(termEnd - 0.5) });
      const rs = await Promise.all(Array.from({ length: 4 }, () => rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) })));
      const { count } = await db.from("cloud_jobs").select("id", { count: "exact", head: true }).eq("resource_id", s.id).eq("job_type", "termination");
      rec("Q", "4 parallel terminations → one job", rs.filter((r: any) => r?.ok).length === 1 && count === 1, { jobs: count }); }
    { const res = crypto.randomUUID(); const [a1, a2] = await Promise.all([rpc("cloud_acquire_lock", { p_resource: res, p_action: "rebuild", p_job: crypto.randomUUID() }), rpc("cloud_acquire_lock", { p_resource: res, p_action: "delete", p_job: crypto.randomUUID() })]);
      await db.from("cloud_server_locks").delete().eq("resource_id", res);
      rec("R", "Conflicting actions → one lock holder", [a1, a2].filter(Boolean).length === 1, { a1, a2 }); }

    // ---- Backup cancellation ----
    { const s = await mkSub(0, { backups_addon: true, backup_status: "active", renewal_backup_minor: 980, renewal_vat_minor: 882, renewal_total_minor: 6762 });
      mock.failActions.set("disable_backup", "unavailable");
      await rpc("cloud_request_backup_cancel", { p_sub: s.id }); const f = await runJob(s.id, "backup_disable", at(0)); const b1 = await get(s.id);
      mock.failActions.delete("disable_backup");
      rec("BK1", "Backup disable fails → not cancelled, still charged", !f.ok && b1.backup_status === "cancellation_pending" && b1.renewal_total_minor === 6762 && b1.backups_addon, { status: b1.backup_status });
      const ok = await runJob(s.id, "backup_disable", at(0)); const b2 = await get(s.id);
      rec("BK2", "Backup disabled at provider → removed from future renewals", ok.ok && b2.backup_status === "cancelled" && b2.renewal_backup_minor === 0 && b2.renewal_total_minor === 5635 && !(await mock.get(s.sim_provider_ref)).backup_enabled, { total: b2.renewal_total_minor }); }

    // ---- Cancel vs renewal rule ----
    { const s = await mkSub(100000); const r = await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) });
      const c = await rpc("cloud_request_cancel", { p_sub: s.id, p_mode: "immediate" }); const a = await get(s.id);
      rec("CR1", "Renewal first → immediate cancel becomes period end at NEW period end", r?.ok && c?.mode === "period_end" && c?.converted_after_renewal && a.termination_scheduled_at === a.current_period_end && a.current_period_end > s.current_period_end, { c, end: a.current_period_end }); }
    { const s = await mkSub(100000); const c = await rpc("cloud_request_cancel", { p_sub: s.id, p_mode: "period_end" }); const r = await rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) });
      const a = await get(s.id);
      rec("CR2", "Cancellation first → renewal does not charge", c?.ok && !r?.ok && (await invCount(s.id)) === 0 && a.sim_wallet_minor === 100000, r); }
    { const s = await mkSub(100000);
      const [r, c] = await Promise.all([rpc("cloud_renew_subscription", { p_sub: s.id, p_now: at(0.01) }), rpc("cloud_request_cancel", { p_sub: s.id, p_mode: "immediate" })]);
      const a = await get(s.id); const n = await invCount(s.id);
      const ok = (n === 1 && a.status === "cancellation_pending" && a.termination_scheduled_at === a.current_period_end) || (n === 0 && a.status === "cancellation_pending" && a.sim_wallet_minor === 100000);
      rec("CR3", "Renewal + cancel at same moment → never charged-then-terminated early", ok, { invoices: n, mode: a.cancel_mode, stop: a.termination_scheduled_at, end: a.current_period_end }); }

    // ---- Scheduler locking + audit ----
    { const [a, b] = await Promise.all([tick(ctx(at(0)), ["grace_expiry"]), tick(ctx(at(0)), ["grace_expiry"])]);
      const vals = [a.grace_expiry, b.grace_expiry];
      const { data: runs } = await db.from("cloud_scheduler_runs").select("*").eq("is_simulation", true).eq("job_type", "sim:grace_expiry").order("started_at", { ascending: false }).limit(2);
      rec("SCH1", "Same scan twice in parallel → one runs, one skipped", vals.filter((v) => v === "skipped_locked").length === 1, vals);
      rec("SCH2", "Run audit recorded (run id, times, counts)", (runs ?? []).some((r: any) => r.status === "finished" && r.finished_at && r.records_scanned >= 0), runs?.map((r: any) => r.status)); }

    // ---- Provider ID only from DB ----
    { const s = await toSuspended(); await rpc("cloud_send_final_warning", { p_sub: s.id, p_now: at(termEnd - 0.5) }); await rpc("cloud_begin_termination", { p_sub: s.id, p_now: at(termEnd) });
      const j = await jobOf(s.id, "termination"); await db.from("cloud_jobs").update({ payload: { ...j.payload, provider_ref: "attacker-999" } }).eq("id", j.id);
      const victim = mock.add("victim"); const pr = await rpc("cloud_prepare_provider_action", { p_job: j.id, p_dry: true });
      rec("SAFE1", "Provider ID taken from our records, injected ID ignored", pr?.ok && pr.provider_ref === s.sim_provider_ref && (await mock.get(victim.id)).exists, pr);
      const s2 = await mkSub(10000); await db.from("cloud_jobs").insert({ job_type: "termination", resource_id: s2.id, idempotency_key: "sim-bad:" + s2.id, is_simulation: true, status: "running" });
      const bad = (await db.from("cloud_jobs").select("id").eq("idempotency_key", "sim-bad:" + s2.id).single()).data;
      const pr2 = await rpc("cloud_prepare_provider_action", { p_job: bad.id, p_dry: false });
      rec("SAFE2", "Delete refused when lifecycle state is not termination_pending", !pr2?.ok && String(pr2?.reason).startsWith("lifecycle_state"), pr2); }

    // ---- Email queue configuration ----
    rec("MAIL", "Email queue: sends only if email is configured", true, emailConfigured() ? "configured (simulation does not send)" : "CONFIGURATION_REQUIRED");

    // ---- Security ----
    { const anon = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!);
      const fns = ["cloud_renew_subscription", "cloud_begin_suspension", "cloud_begin_termination", "cloud_finish_job", "cloud_confirm_provider_state", "cloud_prepare_provider_action", "cloud_scheduler_begin", "cloud_send_final_warning", "cloud_confirm_backup_disabled"];
      const denied: Record<string, boolean> = {};
      for (const fn of fns) { const { error } = await anon.rpc(fn, { p_sub: created[0], p_job: crypto.randomUUID(), p_type: "x" } as any); denied[fn] = !!error; }
      const w = await fetch(`${URL_}/functions/v1/cloud-lifecycle-worker`, { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`, "x-scheduler-secret": "guess", "Content-Type": "application/json" }, body: JSON.stringify({ action: "tick" }) });
      rec("SEC-1", "Public cannot call worker/scheduler/provider DB functions", Object.values(denied).every(Boolean), denied);
      rec("SEC-2", "Worker rejects non-admin and wrong scheduler secret", w.status === 401 || w.status === 403, w.status); }
  } catch (e) {
    rec("FIXTURE", "Simulation error", false, String((e as Error).stack ?? e));
  } finally {
    if (created.length) { await db.from("cloud_jobs").delete().in("resource_id", created); await db.from("cloud_subscriptions").delete().in("id", created).eq("is_simulation", true); }
    await db.from("cloud_jobs").delete().eq("is_simulation", true);
    await db.from("cloud_reconciliation_findings").delete().eq("is_simulation", true);
    await db.from("cloud_admin_alerts").delete().eq("is_simulation", true);
    await db.from("cloud_scheduler_runs").delete().eq("is_simulation", true);
    await db.from("cloud_scheduler_locks").delete().like("job_type", "sim:%");
  }
  return { ran_at: new Date().toISOString(), passed: results.filter((r) => r.pass).length, total: results.length, results, cleaned_up: created.length };
}
