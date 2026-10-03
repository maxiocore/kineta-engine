// Shared lifecycle provider-job engine used by cloud-lifecycle-worker and cloud-lifecycle-real-test.
// Provider IDs come only from cloud_prepare_provider_action (our DB), never from callers.
import { HetznerCloudProvider } from "./cloud-providers.ts";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ErrorClass = "temporary" | "rate_limited" | "authentication" | "invalid_request" | "resource_missing" | "provider_outage" | "unknown";
export function classifyError(code: string): ErrorClass {
  if (code === "auth_failed" || code === "config_missing" || code === "unauthorized" || code === "forbidden") return "authentication";
  if (code === "rate_limit_exceeded" || code === "http_429") return "rate_limited";
  if (code === "unavailable" || code === "timeout" || code === "locked" || code === "conflict") return "temporary";
  if (code === "not_found" || code === "http_404") return "resource_missing";
  if (code === "invalid_input" || code === "uniqueness_error" || code === "http_400" || code === "http_422") return "invalid_request";
  if (/^http_5\d\d$/.test(code) || code === "service_error" || code === "maintenance") return "provider_outage";
  return "unknown";
}

// ---------- Provider port used by the job runner ----------
export interface ServerState { exists: boolean; status?: string; backup_enabled?: boolean; error?: string }
export interface LifecycleProvider { get(ref: string): Promise<ServerState>; act(ref: string, action: string): Promise<{ ok: boolean; error?: string }>; pollMs: number; pollTries: number }

export class RealProvider implements LifecycleProvider {
  private p = new HetznerCloudProvider(); pollMs = 5000; pollTries = 12;
  async get(ref: string): Promise<ServerState> {
    const r = await this.p.getServer(ref);
    if (r.status === "failed") return r.error === "not_found" ? { exists: false } : { exists: true, error: r.error };
    return { exists: true, status: String(r.data?.status ?? ""), backup_enabled: r.data?.backup_window != null };
  }
  /** Every provider mutation is recorded here so tests can prove exact call counts. */
  calls: string[] = [];
  async act(ref: string, action: string) {
    if (action === "poweroff") {
      // Graceful ACPI shutdown first (protects disk state); hard power-off only as an explicit fallback.
      this.calls.push("shutdown:" + ref);
      const g = await this.p.action(ref, "stop");
      if (g.status !== "failed") {
        for (let i = 0; i < 12; i++) { await sleep(5000); const s = await this.get(ref); if (s.exists && s.status === "off") return { ok: true, graceful: true }; }
      }
      this.calls.push("poweroff:" + ref);
    } else this.calls.push(action + ":" + ref);
    const r = action === "delete" ? await this.p.action(ref, "terminate") : await this.p.action(ref, action);
    return r.status === "failed" ? { ok: false, error: r.error } : { ok: true };
  }
}

export interface Ctx { db: any; sim: boolean; now?: string; prov: LifecycleProvider; switches: Record<string, boolean>; actor?: string | null }

// ---------- Provider job runner ----------
const DONE: Record<string, (s: ServerState) => boolean> = {
  poweroff: (s) => s.exists && s.status === "off",
  poweron: (s) => s.exists && s.status === "running",
  delete: (s) => !s.exists,
  disable_backup: (s) => s.exists && s.backup_enabled === false,
};

async function confirm(ctx: Ctx, jobType: string, subId: string) {
  const args: any = { p_sub: subId }; if (ctx.now) args.p_now = ctx.now;
  if (jobType === "backup_disable") return (await ctx.db.rpc("cloud_confirm_backup_disabled", { p_sub: subId })).data;
  const state = jobType === "suspension" ? "powered_off" : jobType === "reactivation" ? "running" : "deleted";
  return (await ctx.db.rpc("cloud_confirm_provider_state", { ...args, p_state: state })).data;
}

export async function runProviderJob(ctx: Ctx, job: any, dry = false) {
  const prep = (await ctx.db.rpc("cloud_prepare_provider_action", { p_job: job.id, p_dry: dry })).data;
  if (!prep?.ok) {
    if (!dry) await ctx.db.rpc("cloud_finish_job", { p_job: job.id, p_ok: false, p_class: prep?.reason === "server_locked" ? "temporary" : "invalid_request", p_error: prep?.reason ?? "prepare_failed" });
    return { ok: false, stage: "safety_check", reason: prep?.reason };
  }
  const { provider_ref: ref, action } = prep;
  const done = DONE[action];
  // Always read provider state first: covers lost responses (never re-send delete/create blindly).
  let st = await ctx.prov.get(ref);
  if (st.error) {
    if (!dry) await ctx.db.rpc("cloud_finish_job", { p_job: job.id, p_ok: false, p_class: classifyError(st.error), p_error: st.error });
    return { ok: false, stage: "read_state", reason: st.error };
  }
  if (dry) return { ok: true, dry: true, action, current_state: st, already_done: done(st), would_call: done(st) ? null : action };
  if (!done(st)) {
    const r = await ctx.prov.act(ref, action);
    if (!r.ok && r.error !== "timeout") {
      const cls = classifyError(r.error ?? "unknown");
      const out = (await ctx.db.rpc("cloud_finish_job", { p_job: job.id, p_ok: false, p_class: cls, p_error: r.error })).data;
      if (job.job_type === "reactivation") await ctx.db.rpc("_cloud_alert", { p_kind: "reactivation_failed", p_sev: "critical", p_msg: "Payment received but power-on failed; manual review", p_key: "react:" + job.id + ":" + job.attempts, p_details: { class: cls }, p_sim: ctx.sim });
      return { ok: false, stage: "provider_action", reason: r.error, job: out };
    }
    for (let i = 0; i < ctx.prov.pollTries; i++) { st = await ctx.prov.get(ref); if (done(st)) break; if (ctx.prov.pollMs) await sleep(ctx.prov.pollMs); }
  }
  if (!done(st)) {
    const out = (await ctx.db.rpc("cloud_finish_job", { p_job: job.id, p_ok: false, p_class: "temporary", p_error: "not_verified" })).data;
    if (job.job_type === "reactivation") await ctx.db.rpc("_cloud_alert", { p_kind: "reactivation_failed", p_sev: "critical", p_msg: "Payment received but server not verified running", p_key: "react:" + job.id + ":" + job.attempts, p_details: {}, p_sim: ctx.sim });
    return { ok: false, stage: "verify", reason: "not_verified", job: out };
  }
  const c = await confirm(ctx, job.job_type, prep.subscription_id);
  await ctx.db.rpc("cloud_finish_job", { p_job: job.id, p_ok: !!c?.ok, p_class: c?.ok ? null : "invalid_request", p_error: c?.ok ? null : c?.reason });
  return { ok: !!c?.ok, verified: true, confirm: c };
}

