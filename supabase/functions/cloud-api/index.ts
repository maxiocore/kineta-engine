import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { getProvider } from "./providers.ts";
import { refreshRate, syncPrices, checkMargins, syncAddonPrices } from "./pricing.ts";
import { runProvisioningJob } from "../_shared/cloud-provisioning-core.ts";
import { HetznerProvisionProvider } from "../_shared/cloud-provisioning-hetzner.ts";

const LIVE = () => Deno.env.get("LIVE_PROVISIONING_ENABLED") === "true";
const BILLABLE = ["rebuild", "rescue", "snapshot", "backup", "terminate"];
const LIVE_OFF = { ok: false, error: "live_provisioning_disabled", message: "Live provisioning is currently disabled." };

const ADMIN_ACTIONS = ["start", "stop", "restart", "rebuild", "rescue", "snapshot", "backup", "suspend", "unsuspend", "terminate"] as const;

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("power"), server_id: z.string().uuid(), type: z.enum(["start", "stop", "restart"]) }),
  z.object({ action: z.literal("cancel"), server_id: z.string().uuid(), mode: z.literal("immediate") }),
  z.object({ action: z.literal("snapshot"), server_id: z.string().uuid(), name: z.string().trim().min(2).max(63) }),
  z.object({ action: z.literal("admin_test_provider"), provider_id: z.string().uuid() }),
  z.object({ action: z.literal("admin_sync"), provider_id: z.string().uuid(), kind: z.enum(["server_type", "location", "image", "server"]) }),
  z.object({ action: z.literal("admin_provision"), job_id: z.string().uuid() }),
  z.object({ action: z.literal("admin_server_action"), server_id: z.string().uuid(), type: z.enum(ADMIN_ACTIONS), payload: z.record(z.unknown()).optional() }),
  z.object({ action: z.literal("admin_process_action"), action_id: z.string().uuid() }),
  z.object({ action: z.literal("admin_refresh_rate") }),
  z.object({ action: z.literal("admin_sync_prices"), provider_id: z.string().uuid() }),
  z.object({ action: z.literal("admin_check_margins") }),
  z.object({ action: z.literal("admin_sync_addons"), provider_id: z.string().uuid() }),
  z.object({ action: z.literal("admin_status") }),
]);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "unauthorized" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "invalid_input" }, 400);
    const body = parsed.data;

    if (body.action.startsWith("admin_")) {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "forbidden" }, 403);
      return await handleAdmin(admin, user.id, body as any);
    }

    const b = body as any;
    const { data: server } = await admin.from("cloud_servers").select("*").eq("id", b.server_id).maybeSingle();
    if (!server || server.user_id !== user.id) return json({ error: "not found" }, 404);

    const { data: allowed, error: rlErr } = await admin.rpc("cloud_action_rate_check", { p_user: user.id, p_server: server.id, p_action: b.action === "power" ? b.type : b.action });
    if (rlErr || !allowed) return json({ ok: false, error: "rate_limited", message: "Too many server actions. Please wait a minute." }, 429);

    if (b.action === "cancel") return await customerCancel(admin, user.id, server);
    if (["pending", "suspended", "cancelled", "terminated", "terminating", "cancellation_pending", "provisioning", "configuring"].includes(server.status)) return json({ error: "server_not_ready" }, 409);

    const provider = getProvider(server.provider);
    if (b.action === "power") {
      const r = await provider.power(server.provider_server_id, b.type);
      await admin.from("cloud_server_actions").insert({ server_id: server.id, user_id: user.id, action: b.type, status: r.status === "failed" ? "failed" : "requested", error: r.error ?? null });
      await admin.from("cloud_activity_logs").insert({ user_id: user.id, server_id: server.id, event: `power_${b.type}`, details: { status: r.status } });
      return json({ ok: r.status !== "failed", status: r.status });
    }
    const r = await provider.createSnapshot(server.provider_server_id, b.name);
    await admin.from("cloud_snapshots").insert({ server_id: server.id, user_id: user.id, name: b.name, status: r.status === "failed" ? "failed" : "pending" });
    await admin.from("cloud_activity_logs").insert({ user_id: user.id, server_id: server.id, event: "snapshot_requested", details: { name: b.name, status: r.status } });
    return json({ ok: r.status !== "failed", status: r.status });
  } catch (e) {
    console.error("cloud-api", e instanceof Error ? e.message : "error");
    return json({ error: "internal_error" }, 500);
  }
});

// Customer "cancel immediately": active -> cancellation_pending -> terminating -> terminated.
// Deleting a provider resource is billable-gated: allowed only when live provisioning is on OR the order is a scoped E2E test order.
async function customerCancel(admin: any, uid: string, server: any) {
  if (["terminated", "cancelled"].includes(server.status)) return json({ ok: true, status: server.status, duplicate: true });
  const { data: order } = await admin.from("cloud_orders").select("id,is_e2e_test").eq("server_id", server.id).maybeSingle();
  if (server.provider_server_id && server.provider !== "manual" && !LIVE() && !order?.is_e2e_test) return json(LIVE_OFF);
  const now = () => new Date().toISOString();
  await admin.from("cloud_servers").update({ status: "cancellation_pending" }).eq("id", server.id);
  await admin.from("cloud_activity_logs").insert({ user_id: uid, server_id: server.id, event: "cancellation_requested", details: { mode: "immediate" } });
  await admin.from("cloud_servers").update({ status: "terminating" }).eq("id", server.id);
  if (server.provider_server_id && server.provider !== "manual") {
    const r = await getProvider(server.provider).action(server.provider_server_id, "terminate");
    if (r.status === "failed" && r.error !== "not_found") {
      await admin.from("cloud_server_actions").insert({ server_id: server.id, user_id: uid, action: "terminate", status: "failed", error: r.error ?? null });
      return json({ ok: false, status: "terminating", error: "terminate_failed" });
    }
  }
  await admin.from("cloud_servers").update({ status: "terminated", cancelled_at: now() }).eq("id", server.id);
  await admin.from("cloud_subscriptions").update({ status: "cancelled", cancelled_at: now() }).eq("server_id", server.id);
  if (order) await admin.from("cloud_orders").update({ status: "cancelled" }).eq("id", order.id);
  await admin.from("cloud_server_actions").insert({ server_id: server.id, user_id: uid, action: "terminate", status: "completed" });
  await admin.from("cloud_activity_logs").insert({ user_id: uid, server_id: server.id, event: "server_terminated", details: {} });
  return json({ ok: true, status: "terminated" });
}

async function log(admin: any, actor: string, server_id: string | null, user_id: string, event: string, details: Record<string, unknown>) {
  await admin.from("cloud_activity_logs").insert({ user_id, server_id, event, details: { ...details, actor } });
}

async function handleAdmin(admin: any, actor: string, b: any) {
  if (b.action === "admin_status") return json({ live_provisioning_enabled: LIVE(), hetzner_cloud_configured: !!Deno.env.get("HETZNER_CLOUD_API_TOKEN") });
  if (b.action === "admin_refresh_rate") return json(await refreshRate(admin));
  if (b.action === "admin_sync_prices") return json(await syncPrices(admin, b.provider_id));
  if (b.action === "admin_sync_addons") return json(await syncAddonPrices(admin, b.provider_id));
  if (b.action === "admin_check_margins") return json({ ok: true, alerts: await checkMargins(admin) });
  if (b.action === "admin_test_provider" || b.action === "admin_sync") {
    const { data: p } = await admin.from("cloud_providers").select("*").eq("id", b.provider_id).maybeSingle();
    if (!p) return json({ error: "not found" }, 404);
    const provider = getProvider(p.code);
    const now = new Date().toISOString();
    if (b.action === "admin_test_provider") {
      const status = await provider.testConnection();
      await admin.from("cloud_providers").update({ last_health_check: now, ...(status === "connected" ? { last_success_at: now, last_error: null } : { last_error: status }) }).eq("id", p.id);
      return json({ status, last_connected_at: status === "connected" ? now : p.last_success_at });
    }
    try {
      const items = await provider.sync(b.kind);
      if (items.length) {
        const { error } = await admin.from("cloud_provider_catalog").upsert(items.map((i) => ({ ...i, provider_id: p.id, synced_at: now })), { onConflict: "provider_id,kind,provider_ref" });
        if (error) throw new Error("db");
      }
      await admin.from("cloud_providers").update({ last_success_at: now, last_error: null }).eq("id", p.id);
      return json({ ok: true, count: items.length });
    } catch (e) {
      const code = (e as any)?.code ?? "sync_failed";
      await admin.from("cloud_providers").update({ last_error: code }).eq("id", p.id);
      return json({ ok: false, error: code });
    }
  }

  if (b.action === "admin_provision") {
    // Recovery/manual-review tool only. Normal flow is the automatic queue (cloud-provisioning-worker).
    // Uses the same engine: atomic job lock, provider lookup/adoption before any create, readiness before active.
    const r = await runProvisioningJob({ db: admin, prov: new HetznerProvisionProvider(admin), worker: `admin:${actor}`, sim: false, liveProvisioning: LIVE() }, b.job_id);
    if (r.skipped === "live_provisioning_disabled") return json(LIVE_OFF);
    return json({ ok: !r.error && !r.skipped, ...r });
  }

  if (b.action === "admin_process_action") {
    const { data: a } = await admin.from("cloud_server_actions").select("*").eq("id", b.action_id).maybeSingle();
    if (!a) return json({ error: "not found" }, 404);
    return runServerAction(admin, actor, a.server_id, a.action, a.payload ?? {}, a.id);
  }

  return runServerAction(admin, actor, b.server_id, b.type, b.payload ?? {}, null);
}

async function runServerAction(admin: any, actor: string, serverId: string, type: string, payload: Record<string, unknown>, actionId: string | null) {
  const { data: s } = await admin.from("cloud_servers").select("*").eq("id", serverId).maybeSingle();
  if (!s) return json({ error: "not found" }, 404);
  let status = "completed"; let error: string | null = null;
  const patch: Record<string, unknown> = {};
  if (type === "suspend") Object.assign(patch, { status: "suspended", suspended_at: new Date().toISOString(), suspend_reason: (payload.reason as string) ?? null });
  else if (type === "unsuspend") Object.assign(patch, { status: "running", suspended_at: null, suspend_reason: null });
  else if (s.provider_server_id && s.provider !== "manual" && BILLABLE.includes(type) && !LIVE()) return json(LIVE_OFF);
  else if (s.provider_server_id && s.provider !== "manual") {
    const r = await getProvider(s.provider).action(s.provider_server_id, type, payload);
    status = r.status === "failed" ? "failed" : "completed"; error = r.error ?? null;
    if (status === "completed") {
      if (type === "stop") patch.status = "stopped";
      if (type === "start" || type === "restart") patch.status = "running";
      if (type === "terminate") Object.assign(patch, { status: "cancelled", cancelled_at: new Date().toISOString() });
    }
  } else {
    status = "requested"; // manual fulfilment
    if (type === "terminate") Object.assign(patch, { status: "cancelled", cancelled_at: new Date().toISOString() }), status = "completed";
  }
  if (Object.keys(patch).length) await admin.from("cloud_servers").update(patch).eq("id", s.id);
  if (actionId) await admin.from("cloud_server_actions").update({ status, error }).eq("id", actionId);
  else await admin.from("cloud_server_actions").insert({ server_id: s.id, user_id: s.user_id, action: type, status, error, payload: { by: "admin" } });
  await log(admin, actor, s.id, s.user_id, `admin_${type}`, { status });
  return json({ ok: status !== "failed", status, error });
}
