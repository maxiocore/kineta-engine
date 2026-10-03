// Automatic provisioning queue for paid cloud orders.
// Callers: service role, the scheduler (x-scheduler-secret = LIFECYCLE_SCHEDULER_SECRET), or admins.
// Real provider create is blocked unless LIVE_PROVISIONING_ENABLED=true (or a scoped E2E order).
// `simulate` runs tests against the same engine with a mock provider: no Hetzner calls, no wallet movement.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { MAX_CREATE_ATTEMPTS, type ProvisionProvider, type ProvServer, type ReadinessResult, runProvisioningJob } from "../_shared/cloud-provisioning-core.ts";
import { HetznerProvisionProvider } from "../_shared/cloud-provisioning-hetzner.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const flag = (n: string) => (Deno.env.get(n) ?? "false").toLowerCase() === "true";
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }),
  z.object({ action: z.literal("run_queue") }),
  z.object({ action: z.literal("admin_recover"), job_id: z.string().uuid() }),
  z.object({ action: z.literal("admin_refund"), order_id: z.string().uuid() }),
  z.object({ action: z.literal("simulate") }),
]);
const RUNNABLE = ["queued", "provisioning", "configuring", "reconciliation", "provisioning_failed"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const db = createClient(URL_, SR);
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const sched = Deno.env.get("LIFECYCLE_SCHEDULER_SECRET");
  let actor: string | null = null;
  if (token !== SR && !(sched && req.headers.get("x-scheduler-secret") === sched)) {
    const { data: u } = await db.auth.getUser(token); if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: ok } = await db.rpc("has_role", { _user_id: u.user.id, _role: "admin" }); if (!ok) return json({ error: "forbidden" }, 403);
    actor = u.user.id;
  }
  const p = Body.safeParse(await req.json().catch(() => ({}))); if (!p.success) return json({ error: "invalid_input" }, 400);
  const b = p.data; const live = flag("LIVE_PROVISIONING_ENABLED");

  if (b.action === "status") {
    const { data: jobs } = await db.from("cloud_provisioning_jobs").select("status").eq("is_simulation", false);
    const counts: Record<string, number> = {}; for (const j of jobs ?? []) counts[j.status] = (counts[j.status] ?? 0) + 1;
    return json({ live_provisioning_enabled: live, jobs: counts, capacity: (await db.rpc("cloud_launch_capacity")).data });
  }
  if (b.action === "run_queue") {
    const { data: jobs } = await db.from("cloud_provisioning_jobs").select("id").eq("is_simulation", false).in("status", RUNNABLE).order("created_at").limit(10);
    const prov = new HetznerProvisionProvider(db); const out = [];
    for (const j of jobs ?? []) out.push(await runProvisioningJob({ db, prov, worker: `queue:${crypto.randomUUID()}`, sim: false, liveProvisioning: live }, j.id));
    return json({ ok: true, processed: out.length, out });
  }
  if (b.action === "admin_recover") { // recovery tool only; the engine adopts existing resources and refuses parallel runs
    const r = await runProvisioningJob({ db, prov: new HetznerProvisionProvider(db), worker: `admin:${actor ?? "sr"}`, sim: false, liveProvisioning: live }, b.job_id);
    return json({ ok: !r.error && !r.skipped, ...r });
  }
  if (b.action === "admin_refund") {
    const r = await db.rpc("cloud_refund_failed_order", { p_order: b.order_id, p_actor: actor });
    return r.error ? json({ ok: false, error: r.error.message }, 409) : json(r.data);
  }
  return json(await simulate(db, actor));
});

// ================= Simulation =================
type Behaviour = { create?: "ok" | "lost_exists" | "fail" ; readiness?: Partial<ReadinessResult>; running?: boolean };
class MockProv implements ProvisionProvider {
  servers = new Map<string, ProvServer & { order: string }>(); creates: Record<string, number> = {}; beh: Record<string, Behaviour> = {}; n = 0;
  async findByOrder(o: string) { return [...this.servers.values()].find((s) => s.order === o) ?? null; }
  async get(ref: string) { return this.servers.get(ref) ?? null; }
  async create(i: { orderId: string }) {
    this.creates[i.orderId] = (this.creates[i.orderId] ?? 0) + 1; await new Promise((r) => setTimeout(r, 50));
    const b = this.beh[i.orderId] ?? {};
    if (b.create === "fail") return { ok: false as const, error: "resource_unavailable", lost: false };
    const s = { ref: `sim-${++this.n}`, order: i.orderId, status: b.running === false ? "initializing" : "running", ipv4: `203.0.113.${this.n}`, ipv6: `2001:db8::${this.n}` };
    this.servers.set(s.ref, s);
    if (b.create === "lost_exists") return { ok: false as const, error: "timeout", lost: true };
    return { ok: true as const, server: s };
  }
  async readiness(_j: string, _h: string, order?: string): Promise<ReadinessResult> { void order; return { ssh_reachable: true, ssh_login: true, boot_finished: true, host_keys_exist: true, host_keys_nonzero: true, host_keys_valid: true, sshd_valid: true, sync_ok: true }; }
}

async function simulate(db: any, actor: string | null) {
  const results: { id: string; name: string; pass: boolean; detail: unknown }[] = [];
  const rec = (id: string, name: string, pass: boolean, detail: unknown) => results.push({ id, name, pass, detail });
  const { data: admin } = await db.from("user_roles").select("user_id").eq("role", "admin").limit(1).single();
  const owner = actor ?? admin.user_id;
  const { data: plan } = await db.from("cloud_plans").select("id, server_type").eq("code", "cloud-s").single();
  const mock = new MockProv();
  const byJob: Record<string, string> = {};
  mock.readiness = async (jobId: string) => {
    const o = byJob[jobId]; const base = { ssh_reachable: true, ssh_login: true, boot_finished: true, host_keys_exist: true, host_keys_nonzero: true, host_keys_valid: true, sshd_valid: true, sync_ok: true };
    return { ...base, ...(mock.beh[o]?.readiness ?? {}) };
  };
  const made: { order: string; server: string; job: string }[] = [];
  const fixture = async (tag: string, beh: Behaviour) => {
    const { data: s } = await db.from("cloud_servers").insert({ user_id: owner, plan_id: plan.id, server_type: plan.server_type, name: `sim-${tag}`, status: "pending", location_code: "de-fsn", image_code: "ubuntu-24.04" }).select("id").single();
    const key = `sim-prov-${tag}-${crypto.randomUUID()}`;
    const { data: o } = await db.from("cloud_orders").insert({ user_id: owner, server_id: s.id, plan_id: plan.id, idempotency_key: key, transaction_reference: `SIM-${tag}`, subtotal: 49, vat_rate: 0.15, vat_amount: 7.35, total: 56.35, status: "paid", location_code: "de-fsn", is_simulation: true }).select("id").single();
    await db.from("cloud_subscriptions").insert({ user_id: owner, order_id: o.id, server_id: s.id, amount: 49, vat_amount: 7.35, status: "paid", is_simulation: true });
    const { data: j } = await db.from("cloud_provisioning_jobs").insert({ order_id: o.id, server_id: s.id, status: "queued", is_simulation: true }).select("id").single();
    mock.beh[o.id] = beh; byJob[j.id] = o.id; made.push({ order: o.id, server: s.id, job: j.id });
    return { order: o.id, server: s.id, job: j.id };
  };
  const ctx = (w = "sim") => ({ db, prov: mock, worker: `${w}:${crypto.randomUUID()}`, sim: true, liveProvisioning: false });
  const run = (job: string, w?: string) => runProvisioningJob(ctx(w), job);
  const unblock = (job: string) => db.from("cloud_provisioning_jobs").update({ next_attempt_at: null }).eq("id", job);
  const jobRow = async (job: string) => (await db.from("cloud_provisioning_jobs").select("*").eq("id", job).single()).data;
  const srv = async (id: string) => (await db.from("cloud_servers").select("status, provider_server_id").eq("id", id).single()).data;
  const sub = async (o: string) => (await db.from("cloud_subscriptions").select("status").eq("order_id", o).single()).data?.status;
  const count = (o: string) => [...mock.servers.values()].filter((s) => s.order === o).length;

  try {
    // O + A: queue picks the paid order without admin; SSH not reachable -> not active
    const A = await fixture("A", { readiness: { ssh_reachable: false, ssh_login: false, boot_finished: false, host_keys_exist: false, host_keys_nonzero: false, host_keys_valid: false, sshd_valid: false, sync_ok: false } });
    const { data: q } = await db.from("cloud_provisioning_jobs").select("id").eq("is_simulation", true).eq("status", "queued");
    const queueRuns = []; for (const j of q ?? []) queueRuns.push(await run(j.id, "queue"));
    const a1 = await jobRow(A.job);
    rec("O", "Automatic queue starts a paid order without admin", queueRuns.length >= 1 && a1.status === "configuring" && count(A.order) === 1, { status: a1.status, created: count(A.order) });
    await db.from("cloud_provisioning_jobs").update({ locked_until: null }).eq("id", A.job);
    await run(A.job); const a2 = await jobRow(A.job);
    rec("A", "Running but SSH not ready -> NOT active", a2.status === "configuring" && (await srv(A.server)).status === "configuring" && (await sub(A.order)) !== "active", { job: a2.status, server: (await srv(A.server)).status });

    const B = await fixture("B", {}); await run(B.job); await unblock(B.job); await run(B.job);
    const b = await jobRow(B.job);
    rec("B", "Running + complete readiness -> active", b.status === "active" && (await srv(B.server)).status === "running" && (await sub(B.order)) === "active" && b.readiness?.all_passed === true, { job: b.status, sub: await sub(B.order) });

    const Cx = await fixture("C", { readiness: { host_keys_nonzero: false, host_keys_valid: false } }); await run(Cx.job); await unblock(Cx.job); await run(Cx.job);
    const c = await jobRow(Cx.job);
    rec("C", "Zero-byte host keys -> failed/manual review, no duplicate server", c.status === "manual_review" && c.manual_reason === "ssh_host_keys_invalid" && mock.creates[Cx.order] === 1 && count(Cx.order) === 1, { job: c.status, creates: mock.creates[Cx.order] });

    const D = await fixture("D", { readiness: { boot_finished: false } }); await run(D.job); await unblock(D.job); await run(D.job);
    const d = await jobRow(D.job);
    rec("D", "cloud-init incomplete -> not active", d.status === "configuring" && d.readiness?.boot_finished === false, { job: d.status });

    const E = await fixture("E", { create: "lost_exists" }); const e1 = await run(E.job); const e = await jobRow(E.job);
    rec("E", "Create timeout but resource exists -> adopted, no second create", e1.result === "adopted_after_failure" && mock.creates[E.order] === 1 && count(E.order) === 1 && !!e.provider_resource_id, { r: e1.result, creates: mock.creates[E.order] });

    const F = await fixture("F", { create: "fail" }); const f1 = await run(F.job); mock.beh[F.order].create = "ok"; await unblock(F.job); const f2 = await run(F.job);
    rec("F", "Create failed + resource absent -> safe retry", f1.result === "safe_retry_scheduled" && f2.result === "created" && mock.creates[F.order] === 2 && count(F.order) === 1, { first: f1.result, second: f2.result });

    const G = await fixture("G", { create: "fail" }); const g: unknown[] = [];
    for (let i = 0; i <= MAX_CREATE_ATTEMPTS; i++) { await unblock(G.job); g.push((await run(G.job)).result); }
    const gj = await jobRow(G.job); const { data: go } = await db.from("cloud_orders").select("status").eq("id", G.order).single();
    rec("G", "Retries exhausted + resource absent -> refund eligible / review", gj.status === "refund_eligible" && gj.reconciliation?.absent_confirmed === true && go.status === "refund_eligible" && count(G.order) === 0, { runs: g, job: gj.status });

    const h1 = await db.rpc("cloud_refund_failed_order", { p_order: G.order, p_actor: owner }); const h2 = await db.rpc("cloud_refund_failed_order", { p_order: G.order, p_actor: owner });
    const blocked = await db.rpc("cloud_refund_failed_order", { p_order: E.order, p_actor: owner });
    rec("H", "Refund repeated -> exactly one refund; refund blocked when a server exists", h1.data?.duplicate === false && h2.data?.duplicate === true && !!blocked.error, { first: h1.data, second: h2.data, server_exists_refund: blocked.error?.message });

    const P = await fixture("P", {}); const [p1, p2] = await Promise.all([run(P.job, "w1"), run(P.job, "w2")]);
    rec("P", "Worker runs twice -> one provider create", mock.creates[P.order] === 1 && count(P.order) === 1 && [p1, p2].filter((x) => x.skipped).length === 1, { p1, p2 });

    const Q = await fixture("Q", {}); const hold = (await db.rpc("cloud_claim_provisioning_job", { p_job: Q.job, p_worker: "worker-active", p_ttl_seconds: 300 })).data;
    const qa = await run(Q.job, "admin");
    rec("Q", "Admin Provision while worker active -> blocked", !!hold?.id && !!qa.skipped && !mock.creates[Q.order], qa);

    // S: a provider id can never be overwritten, even by the server engine
    const bj = await jobRow(B.job); await db.rpc("cloud_claim_provisioning_job", { p_job: B.job, p_worker: "s-test", p_ttl_seconds: 60 });
    await db.from("cloud_provisioning_jobs").update({ locked_by: "s-test", locked_until: new Date(Date.now() + 60000).toISOString() }).eq("id", B.job);
    const s1 = await db.rpc("cloud_set_provisioning_state", { p_job: B.job, p_worker: "s-test", p_to: "active", p_fields: { provider_resource_id: "fake-999", readiness: { all_passed: true } } });
    rec("S", "Fake provider_resource_id -> rejected", !!s1.error && (await jobRow(B.job)).provider_resource_id === bj.provider_resource_id, s1.error?.message);

    // I-L: launch guard (simulation pool, same function as production)
    const { data: ls } = await db.from("cloud_launch_settings").select("max_new_per_window").single(); const LIM = ls.max_new_per_window;
    const fill = async (n: number, extra: Record<string, unknown>[] = []) => {
      await db.from("cloud_launch_reservations").delete().eq("is_simulation", true);
      const rows = Array.from({ length: n }, (_, i) => ({ user_id: owner, idempotency_key: `sim-fill-${i}-${crypto.randomUUID()}`, status: "consumed", consumed_at: new Date().toISOString(), expires_at: new Date().toISOString(), is_simulation: true }));
      await db.from("cloud_launch_reservations").insert([...rows, ...extra]);
    };
    const reserve = (k: string) => db.rpc("_cloud_reserve_launch_slot", { p_user: owner, p_plan: plan.id, p_key: k, p_sim: true });
    await fill(LIM - 1); const i1 = (await reserve(`sim-I-${crypto.randomUUID()}`)).data;
    rec("I", `Launch slots ${LIM - 1}/${LIM} -> next customer accepted`, i1?.ok === true, i1);
    const j1 = (await reserve(`sim-J-${crypto.randomUUID()}`)).data;
    rec("J", `Launch slots ${LIM}/${LIM} -> blocked before payment`, j1?.ok === false && j1.reason === "capacity_full", j1);
    await fill(LIM - 1); const k = await Promise.all(Array.from({ length: 20 }, (_, i) => reserve(`sim-K-${i}-${crypto.randomUUID()}`)));
    const kOk = k.filter((r: any) => r.data?.ok).length;
    rec("K", "20 simultaneous attempts with one slot left -> exactly one", kOk === 1, { accepted: kOk, rejected: k.length - kOk });
    await fill(LIM - 1, [{ user_id: owner, idempotency_key: `sim-L-old-${crypto.randomUUID()}`, status: "reserved", expires_at: new Date(Date.now() - 60000).toISOString(), is_simulation: true }]);
    const l1 = (await reserve(`sim-L-${crypto.randomUUID()}`)).data;
    rec("L", "Expired unpaid reservation -> capacity released", l1?.ok === true, l1);
  } catch (err) {
    rec("X", "Simulation crashed", false, String((err as Error).message));
  } finally {
    // cleanup every simulation row
    for (const m of made) {
      await db.from("cloud_provisioning_jobs").delete().eq("id", m.job);
      await db.from("cloud_subscription_events").delete().in("subscription_id", ((await db.from("cloud_subscriptions").select("id").eq("order_id", m.order)).data ?? []).map((x: any) => x.id));
      await db.from("cloud_subscriptions").delete().eq("order_id", m.order);
      await db.from("cloud_activity_logs").delete().eq("server_id", m.server);
      await db.from("cloud_orders").delete().eq("id", m.order);
      await db.from("cloud_servers").delete().eq("id", m.server);
    }
    await db.from("cloud_launch_reservations").delete().eq("is_simulation", true);
    await db.from("cloud_admin_alerts").delete().eq("is_simulation", true).like("dedupe_key", "prov:%");
  }
  const left = (await db.from("cloud_orders").select("id", { count: "exact", head: true }).eq("is_simulation", true)).count;
  return { passed: results.filter((r) => r.pass).length, total: results.length, results, cleanup_remaining_sim_orders: left, hetzner_calls: 0 };
}
