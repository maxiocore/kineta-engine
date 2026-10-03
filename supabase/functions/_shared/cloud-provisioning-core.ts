// Paid-order provisioning engine shared by the real worker and the simulation.
// State machine (enforced again in DB by cloud_set_provisioning_state):
//   queued -> provisioning -> configuring -> active
//   failures -> provisioning_failed -> reconciliation -> (adopt | safe retry | manual_review | refund_eligible)
// Rules: one provider server per order (label ash-order=<order_id>), always look up before (re)create,
// never mark active before first-boot readiness, never refund while a provider resource may exist.

export interface ProvServer { ref: string; status: string; ipv4?: string | null; ipv6?: string | null }
export interface ReadinessResult {
  ssh_reachable: boolean; ssh_login: boolean; boot_finished: boolean; host_keys_exist: boolean;
  host_keys_nonzero: boolean; host_keys_valid: boolean; sshd_valid: boolean; sync_ok: boolean; error?: string;
}
export interface ProvisionProvider {
  /** null = definitely absent; throws/returns {error} when the lookup itself failed (unknown). */
  findByOrder(orderId: string): Promise<ProvServer | null | { error: string }>;
  get(ref: string): Promise<ProvServer | null | { error: string }>;
  /** lost=true means the outcome is unknown (timeout / lost response). */
  create(input: { orderId: string; name: string; serverType: string; location: string; image: string; jobId: string; customerPublicKey?: string | null; serverId?: string; userId?: string }):
    Promise<{ ok: true; server: ProvServer; requestId?: string } | { ok: false; error: string; lost: boolean }>;
  readiness(jobId: string, host: string): Promise<ReadinessResult>;
  cleanupPlatformKey?(jobId: string, host: string, customerPublicKey: string | null): Promise<{ ok: boolean; reason: string | null }>;
}

export const MAX_CREATE_ATTEMPTS = 3;
export const READINESS_TIMEOUT_MS = 15 * 60 * 1000;
const RETRY_SECONDS = 60;
const isErr = (x: unknown): x is { error: string } => !!x && typeof x === "object" && "error" in (x as any);

export const READINESS_KEYS: (keyof ReadinessResult)[] = ["ssh_reachable", "ssh_login", "boot_finished", "host_keys_exist", "host_keys_nonzero", "host_keys_valid", "sshd_valid", "sync_ok"];

export interface ProvCtx { db: any; prov: ProvisionProvider; worker: string; sim: boolean; liveProvisioning: boolean; now?: () => number }

/** Process one job once. Safe to call concurrently: the DB claim admits a single holder. */
export async function runProvisioningJob(ctx: ProvCtx, jobId: string): Promise<Record<string, unknown>> {
  const { db, prov, worker } = ctx;
  const now = ctx.now ?? (() => Date.now());
  const claim = (await db.rpc("cloud_claim_provisioning_job", { p_job: jobId, p_worker: worker, p_ttl_seconds: 300 })).data;
  if (!claim?.id) return { job: jobId, skipped: "locked_or_not_runnable" };
  const set = async (to: string, f: Record<string, unknown> = {}) => {
    const r = await db.rpc("cloud_set_provisioning_state", { p_job: jobId, p_worker: worker, p_to: to, p_fields: f });
    if (r.error) throw new Error(r.error.message);
  };
  const release = (retry?: number) => db.rpc("cloud_release_provisioning_job", { p_job: jobId, p_worker: worker, p_retry_in_seconds: retry ?? null });
  const manual = async (reason: string, extra: Record<string, unknown> = {}) => {
    let st = (await db.from("cloud_provisioning_jobs").select("status").eq("id", jobId).single()).data.status;
    if (st === "configuring") { await set("provisioning_failed", { error_code: reason }); st = "provisioning_failed"; }
    await set("manual_review", { manual_reason: reason, error_code: reason, ...extra }); await release(); return { job: jobId, result: "manual_review", reason };
  };

  try {
    let job = claim;
    // ---------- validation (never trust anything but DB rows) ----------
    const { data: order } = await db.from("cloud_orders").select("*").eq("id", job.order_id).single();
    const { data: server } = await db.from("cloud_servers").select("*").eq("id", job.server_id).single();
    if (!order || !server || order.server_id !== server.id) return await manual("order_server_mismatch");
    if (!!order.is_simulation !== ctx.sim || !!job.is_simulation !== ctx.sim) { await release(); return { job: jobId, skipped: "sim_mismatch" }; }
    if (!ctx.sim && !order.is_e2e_test && !ctx.liveProvisioning) { await release(); return { job: jobId, skipped: "live_provisioning_disabled" }; }
    if (!["paid", "provisioning", "provisioning_failed"].includes(order.status) && job.status !== "configuring") return await manual("order_not_paid");
    const { data: plan } = await db.from("cloud_plans").select("*").eq("id", order.plan_id).single();
    if (!plan || plan.status !== "active" || (!plan.is_active && !order.is_e2e_test && !ctx.sim)) return await manual("plan_not_available");
    const { data: loc } = await db.from("cloud_locations").select("code").eq("code", server.location_code).eq("is_active", true).eq("customer_visible", true).maybeSingle();
    if (!loc && !ctx.sim) return await manual("location_not_available");
    const { data: cost } = await db.from("cloud_plan_costs").select("provider_id, provider_ref").eq("plan_id", plan.id).maybeSingle();
    const { data: maps } = cost?.provider_id ? await db.from("cloud_resource_mappings").select("kind, code, provider_ref").eq("provider_id", cost.provider_id).in("code", [server.location_code, server.image_code]) : { data: [] };
    const pLoc = maps?.find((m: any) => m.kind === "location" && m.code === server.location_code)?.provider_ref;
    const pImg = maps?.find((m: any) => m.kind === "image" && m.code === server.image_code)?.provider_ref;
    if (!cost?.provider_ref || !pLoc || !pImg) return await manual("mapping_missing");
    if (!ctx.sim) {
      const { data: paid } = await db.from("balance_logs").select("id, amount").eq("user_id", order.user_id).eq("idempotency_key", `cloud_order:${order.idempotency_key}`).maybeSingle();
      if (!paid || Math.abs(Number(paid.amount)) !== Number(order.total)) return await manual("payment_not_verified");
      if (!order.is_e2e_test) {
        const { data: res } = await db.from("cloud_launch_reservations").select("status, order_id").eq("id", job.reservation_id).maybeSingle();
        if (!res || res.status !== "consumed" || res.order_id !== order.id) return await manual("launch_reservation_invalid");
      }
    }

    // ---------- reconciliation / create ----------
    if (!job.provider_resource_id) {
      if (job.status === "queued") { await set("provisioning"); job.status = "provisioning"; }
      if (job.status === "provisioning_failed") { await set("reconciliation"); job.status = "reconciliation"; }
      const found = await prov.findByOrder(order.id);
      if (isErr(found)) { // lookup unknown -> do NOT create
        if (job.status !== "reconciliation") await set("reconciliation", { error_code: "lookup_failed" });
        await release(RETRY_SECONDS); return { job: jobId, result: "reconciliation_pending", reason: found.error };
      }
      if (found) { // adopt existing resource, never create a second one
        if (job.status === "reconciliation") await set("provisioning", { provider_resource_id: found.ref, reconciliation: { adopted: true, at: new Date(now()).toISOString() } });
        await set("configuring", { provider_resource_id: found.ref, provider: "hetzner_cloud", ipv4: found.ipv4, ipv6: found.ipv6, reconciliation: { adopted: true, at: new Date(now()).toISOString() } });
        await release(); return { job: jobId, result: "adopted", ref: found.ref };
      }
      // definitely absent
      if (job.attempt_count >= MAX_CREATE_ATTEMPTS) {
        if (job.status !== "reconciliation") await set("reconciliation");
        await set("refund_eligible", { reconciliation: { absent_confirmed: true, attempts: job.attempt_count, at: new Date(now()).toISOString() }, manual_reason: "retries_exhausted_resource_absent", error_code: "retries_exhausted" });
        await release(); return { job: jobId, result: "refund_eligible" };
      }
      if (job.status === "reconciliation") await set("provisioning");
      const { data: key } = server.ssh_key_id ? await db.from("cloud_ssh_keys").select("public_key").eq("id", server.ssh_key_id).eq("user_id", server.user_id).maybeSingle() : { data: null };
      if (server.access_method === "ssh_key" && !key) return await manual("customer_ssh_key_missing");
      // Hostname is generated by the DB (srv-<id>); never derived from the free-text customer name.
      const name = /^[a-z0-9][a-z0-9-]{1,62}$/.test(server.hostname ?? "") ? server.hostname : `srv-${server.id.replace(/-/g, "").slice(0, 10)}`;
      const r = await prov.create({ orderId: order.id, name, serverType: cost.provider_ref, location: pLoc, image: pImg, jobId, customerPublicKey: key?.public_key ?? null, serverId: server.id, userId: server.user_id });
      if (r.ok) {
        await set("configuring", { attempt_inc: 1, provider_resource_id: r.server.ref, provider_request_id: r.requestId ?? null, provider: "hetzner_cloud", ipv4: r.server.ipv4, ipv6: r.server.ipv6 });
        await release(); return { job: jobId, result: "created", ref: r.server.ref };
      }
      // failure: reconcile immediately (resource may exist after a lost response)
      await set("provisioning_failed", { attempt_inc: 1, error_code: r.error });
      await set("reconciliation");
      const again = await prov.findByOrder(order.id);
      if (!isErr(again) && again) {
        await set("provisioning", { provider_resource_id: again.ref, reconciliation: { adopted: true, after: r.error } });
        await set("configuring", { provider_resource_id: again.ref, provider: "hetzner_cloud", ipv4: again.ipv4, ipv6: again.ipv6 });
        await release(); return { job: jobId, result: "adopted_after_failure", ref: again.ref };
      }
      if (isErr(again)) { await release(RETRY_SECONDS); return { job: jobId, result: "reconciliation_pending" }; }
      await set("queued", { reconciliation: { absent_confirmed: true, after: r.error, at: new Date(now()).toISOString() } });
      await release(RETRY_SECONDS); return { job: jobId, result: "safe_retry_scheduled", error: r.error };
    }

    // ---------- configuring: first-boot readiness ----------
    if (job.status === "configuring" || job.status === "provisioning") {
      if (job.status === "provisioning") { await set("configuring"); job.status = "configuring"; }
      const s = await prov.get(job.provider_resource_id);
      if (isErr(s)) { await release(RETRY_SECONDS); return { job: jobId, result: "provider_read_failed" }; }
      if (!s) return await manual("provider_resource_missing");
      const started = job.phase_started_at ? new Date(job.phase_started_at).getTime() : now();
      const timedOut = now() - started > READINESS_TIMEOUT_MS;
      const base = { ipv4: s.ipv4 ?? null, ipv6: s.ipv6 ?? null, provider_running: s.status === "running" };
      if (s.status !== "running" || !s.ipv4 || !s.ipv6) {
        if (timedOut) return await manual("readiness_timeout", { readiness: { ...base, all_passed: false } });
        await set("configuring", { ipv4: s.ipv4, ipv6: s.ipv6, readiness: { ...base, all_passed: false } }); await release(30);
        return { job: jobId, result: "waiting_for_running_with_ips" };
      }
      const rd = await prov.readiness(jobId, s.ipv4);
      const all = READINESS_KEYS.every((k) => rd[k] === true);
      const readiness = { ...base, ...rd, ipv4_assigned: !!s.ipv4, ipv6_assigned: !!s.ipv6, all_passed: all, at: new Date(now()).toISOString() };
      if (all) {
        await set("active", { ipv4: s.ipv4, ipv6: s.ipv6, readiness }); await release();
        let cleanup: unknown = null;
        if (prov.cleanupPlatformKey) {
          const { data: srvRow } = await db.from("cloud_servers").select("ssh_key_id").eq("id", job.server_id).single();
          const { data: ck } = srvRow?.ssh_key_id ? await db.from("cloud_ssh_keys").select("public_key").eq("id", srvRow.ssh_key_id).maybeSingle() : { data: null };
          try { cleanup = await prov.cleanupPlatformKey(jobId, s.ipv4, ck?.public_key ?? null); } catch (e) { cleanup = { ok: false, reason: String((e as Error).message).slice(0, 80) }; }
        }
        return { job: jobId, result: "active", platform_key_cleanup: cleanup };
      }
      if (rd.ssh_login && (!rd.host_keys_nonzero || !rd.host_keys_valid)) return await manual("ssh_host_keys_invalid", { readiness }); // never recreate
      if (timedOut) return await manual("readiness_timeout", { readiness });
      await set("configuring", { readiness }); await release(30);
      return { job: jobId, result: "not_ready_yet", readiness };
    }
    await release(); return { job: jobId, skipped: `status_${job.status}` };
  } catch (e) {
    await release(RETRY_SECONDS);
    return { job: jobId, error: String((e as Error).message) };
  }
}
