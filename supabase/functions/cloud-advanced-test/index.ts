// Admin-only Hetzner Cloud ADVANCED lifecycle test (Phase 2). Fixed parameters, exactly one server.
// Independent of customer orders, wallets and the global LIVE_PROVISIONING_ENABLED gate (stays false).
// One step per "advance" call; any failure stops the test (FAILED AT) and leaves resources for the admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import ssh2 from "npm:ssh2@1.16.0";

const TEST = { test_key: "hetzner-cloud-advanced-01", name: "Hetzner Cloud Advanced Lifecycle Test", server_name: "ash-cloud-advanced-test-01", server_type: "cx23", location: "fsn1", image: "ubuntu-24.04" } as const;
const LABEL_K = "ash-advanced-test", LABEL_V = "hetzner-cloud-advanced-01", LABEL = `${LABEL_K}=${LABEL_V}`;
const PREV = { test_key: "hetzner-cloud-e2e-01", server_id: "168468212", ssh_key_id: "130822197", name: "ash-cloud-e2e-test-01" };
const RDNS_HOST = "test-vps.ash-holding.sa";
const FILE = "/root/ash-lifecycle-test.txt";
const API = "https://api.hetzner.cloud/v1";
export const STAGES = ["creating", "wait_running", "baseline", "snapshot_request", "snapshot_wait", "modify_file", "restore_request", "restore_wait", "restore_verify",
  "backup_enable", "backup_verify", "await_rebuild_confirm", "rebuild_wait", "rebuild_verify", "rescue_enable", "rescue_reboot", "rescue_verify", "rescue_disable",
  "rescue_exit_wait", "rescue_exit_verify", "rdns", "rdns_restore", "engine", "passed"];

const Body = z.object({ action: z.enum(["status", "preflight", "create", "advance", "confirm_rebuild", "retry_rescue_exit", "cleanup", "reset"]), confirm: z.string().max(100).optional() });
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

class HErr extends Error { constructor(public code: string, public status = 0) { super(code); } }
async function h(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("HETZNER_CLOUD_API_TOKEN");
  if (!token) throw new HErr("config_missing");
  const res = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new HErr(String(body?.error?.code ?? `http_${res.status}`), res.status);
  return body;
}
const exists = async (path: string) => { try { await h(path); return true; } catch (e) { if ((e as HErr).status === 404) return false; throw e; } };

// ---- AES-GCM private key encryption (INFRA_SSH_ENCRYPTION_KEY) ----
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function aesKey() {
  const raw = Deno.env.get("INFRA_SSH_ENCRYPTION_KEY");
  if (!raw || raw.length < 32) throw new HErr("encryption_key_missing");
  return crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)), "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encrypt(text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return { enc: b64(new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(text)))), iv: b64(iv) };
}
const decrypt = async (enc: string, iv: string) => new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aesKey(), unb64(enc)));

// Same SSH implementation that passed Phase 1: AES-GCM ciphers only, root user.
const SSH_CIPHERS = ["aes256-gcm@openssh.com", "aes128-gcm@openssh.com"];
function sshRun(host: string, privateKey: string, commands: string[]): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const c = new ssh2.Client(); const out: Record<string, string> = {}; let done = false;
    const finish = (err: unknown, val?: Record<string, string>) => { if (done) return; done = true; clearTimeout(timer); try { c.end(); } catch { /* */ } err ? reject(err) : resolve(val!); };
    const timer = setTimeout(() => finish(new Error("ssh_timeout")), 30000);
    c.on("error", (e: Error) => finish(e)).on("ready", async () => {
      try {
        for (const cmd of commands) out[cmd] = await new Promise<string>((res, rej) => c.exec(cmd, (err: Error, s: any) => {
          if (err) return rej(err); let d = "";
          s.on("data", (x: Uint8Array) => (d += new TextDecoder().decode(x))).stderr.on("data", () => {}); s.on("close", () => res(d.trim().slice(0, 4000)));
        }));
        finish(null, out);
      } catch (e) { finish(e); }
    }).connect({ host, port: 22, username: "root", privateKey, readyTimeout: 15000, algorithms: { cipher: SSH_CIPHERS } });
  });
}
const sshErr = (e: unknown) => String((e as any)?.message ?? e).replace(/-----BEGIN[\s\S]*?-----END[^-]*-----/g, "[redacted]").slice(0, 160);
const BASE_CMDS = ["hostname", "grep PRETTY_NAME /etc/os-release", "nproc", "grep MemTotal /proc/meminfo", "df -h / | tail -1", "ip -4 -o addr show scope global | awk '{print $4}'", "ip -6 -o addr show scope global | awk '{print $4}'"];
const READ_FILE = `cat ${FILE} 2>/dev/null || echo __MISSING__`;
const token = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

// ---- Customer Action Engine (same contract the customer panel will use; NOT exposed to customers yet) ----
type Ctx = { actorId: string; role: "admin" | "customer" };
type EngineServer = { id: string; owner_id: string; provider_server_id: string; status?: string };
const ENGINE_ACTIONS: Record<string, (p: Record<string, unknown>) => { path: string; body: Record<string, unknown> }> = {
  start: () => ({ path: "poweron", body: {} }), stop: () => ({ path: "shutdown", body: {} }), poweroff: () => ({ path: "poweroff", body: {} }),
  restart: () => ({ path: "reboot", body: {} }), reset: () => ({ path: "reset", body: {} }),
  snapshot: (p) => ({ path: "create_image", body: { type: "snapshot", description: p.description, labels: { [LABEL_K]: LABEL_V } } }),
  backup_enable: () => ({ path: "enable_backup", body: {} }), backup_disable: () => ({ path: "disable_backup", body: {} }),
  rebuild: (p) => ({ path: "rebuild", body: { image: p.image } }),
  rescue_enable: (p) => ({ path: "enable_rescue", body: { type: "linux64", ssh_keys: p.ssh_keys } }), rescue_disable: () => ({ path: "disable_rescue", body: {} }),
  rdns: (p) => ({ path: "change_dns_ptr", body: { ip: p.ip, dns_ptr: p.dns_ptr ?? null } }),
};
function authorize(ctx: Ctx, s: EngineServer) { return ctx.role === "admin" || s.owner_id === ctx.actorId; }
async function engine(db: any, ctx: Ctx, s: EngineServer, type: string, payload: Record<string, unknown> = {}) {
  const audit = (status: string, extra: Record<string, unknown> = {}) => db.from("cloud_e2e_test_events").insert({ test_id: s.id, actor_id: ctx.actorId, stage: `engine:${type}`, result: status, details: { role: ctx.role, ...extra } });
  if (!authorize(ctx, s)) { await audit("forbidden"); return { ok: false, status: "forbidden" as const }; }
  const def = ENGINE_ACTIONS[type]; if (!def) { await audit("not_supported"); return { ok: false, status: "not_supported" as const }; }
  try {
    const { path, body } = def(payload);
    const r = await h(`/servers/${encodeURIComponent(s.provider_server_id)}/actions/${path}`, { method: "POST", body: JSON.stringify(body) });
    // Never persist/return secrets that some actions include (rescue/rebuild root_password).
    const res = { ok: true, status: "requested" as const, action_id: String(r.action?.id ?? ""), image_id: r.image?.id ? String(r.image.id) : undefined };
    await audit("requested", { action_id: res.action_id, image_id: res.image_id ?? null });
    return res;
  } catch (e) { await audit("failed", { error: (e as HErr).code }); return { ok: false, status: "failed" as const, error: (e as HErr).code }; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization"); if (!auth) return json({ error: "unauthorized" }, 401);
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await db.auth.getUser(auth.replace("Bearer ", "")); if (!user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" }); if (!isAdmin) return json({ error: "forbidden" }, 403);
    const parsed = Body.safeParse(await req.json()); if (!parsed.success) return json({ error: "invalid_input" }, 400);
    const { action, confirm } = parsed.data;

    let { data: test } = await db.from("cloud_e2e_tests").select("*").eq("test_key", TEST.test_key).maybeSingle();
    if (!test) test = (await db.from("cloud_e2e_tests").insert({ ...TEST, created_by: user.id }).select("*").single()).data;
    const log = (stage: string, result: string, details: Record<string, unknown> = {}) => db.from("cloud_e2e_test_events").insert({ test_id: test.id, actor_id: user.id, stage, result, details });
    const patch = async (p: Record<string, unknown>) => {
      if ("stage" in p) p.stage_started_at = new Date().toISOString();
      test = (await db.from("cloud_e2e_tests").update(p).eq("id", test.id).select("*").single()).data; return test;
    };
    const lc = (p: Record<string, unknown>) => patch({ lifecycle: { ...(test.lifecycle ?? {}), ...p } });
    const fail = async (stage: string, error: string) => { await patch({ status: "failed", failed_stage: stage, error }); await log(stage, "failed", { error }); return json({ ok: false, test }); };

    if (action === "status") return json({ ok: true, test });

    // ---------------- PREFLIGHT (read-only) ----------------
    const preflight = async () => {
      const c: Record<string, unknown> = {};
      c.api_credentials_configured = !!Deno.env.get("HETZNER_CLOUD_API_TOKEN");
      c.ssh_encryption_configured = !!Deno.env.get("INFRA_SSH_ENCRYPTION_KEY");
      const r: Record<string, unknown> = {};
      try {
        const { data: prev } = await db.from("cloud_e2e_tests").select("status,cleaned_up_at").eq("test_key", PREV.test_key).maybeSingle();
        c.previous_server_deleted = !(await exists(`/servers/${PREV.server_id}`)) && ((await h(`/servers?name=${PREV.name}`)).servers ?? []).length === 0;
        c.previous_ssh_key_deleted = !(await exists(`/ssh_keys/${PREV.ssh_key_id}`));
        r.previous = { record_status: prev?.status, cleaned_up_at: prev?.cleaned_up_at, server_id: PREV.server_id, ssh_key_id: PREV.ssh_key_id };
        const st = (await h(`/server_types?name=${TEST.server_type}`)).server_types?.[0];
        const p = st?.prices?.find((x: any) => x.location === TEST.location);
        c.server_type_available_in_location = !!p && !st.deprecated;
        const img = (await h(`/images?type=system&name=${TEST.image}&architecture=x86`)).images?.[0];
        c.image_available = !!img && img.status === "available";
        const pricing = (await h("/pricing")).pricing;
        const ip = pricing?.primary_ips?.find((x: any) => x.type === "ipv4")?.prices?.find((x: any) => x.location === TEST.location);
        const sm = p ? Number(p.price_monthly.net) : null, ipm = ip ? Number(ip.price_monthly.net) : null;
        const snapGb = Number(pricing?.image?.price_per_gb_month?.net ?? NaN);
        const backupPct = Number(pricing?.server_backup?.percentage ?? NaN);
        r.cost = { currency: "EUR", excl_vat: true, cx23_monthly: sm, cx23_hourly: p ? Number(p.price_hourly.net) : null, ipv4_monthly: ipm,
          snapshot_per_gb_month: isFinite(snapGb) ? snapGb : null, snapshot_estimate_note: "Billed on compressed snapshot size (GB) x price/GB/month, prorated hourly. A fresh Ubuntu 24.04 snapshot is typically ~1-2 GB.",
          backup_percentage: isFinite(backupPct) ? backupPct : null, backup_monthly: sm !== null && isFinite(backupPct) ? +(sm * backupPct / 100).toFixed(4) : null,
          disk_gb: st?.disk ?? null };
        c.pricing_available = sm !== null && ipm !== null && isFinite(snapGb) && isFinite(backupPct);
        const named = (await h(`/servers?name=${TEST.server_name}`)).servers ?? [];
        const labelled = (await h(`/servers?label_selector=${encodeURIComponent(LABEL)}`)).servers ?? [];
        c.no_existing_advanced_server = named.length === 0 && labelled.length === 0;
        c.no_leftover_advanced_snapshots = ((await h(`/images?type=snapshot&label_selector=${encodeURIComponent(LABEL)}`)).images ?? []).length === 0;
        // rDNS prerequisite: forward A record should point to the test IPv4 (only known after create)
        let a: string[] = []; try { a = await Deno.resolveDns(RDNS_HOST, "A"); } catch { /* none */ }
        r.rdns = { hostname: RDNS_HOST, valid_hostname: /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/.test(RDNS_HOST), forward_a_records: a,
          note: "Hetzner accepts any valid FQDN as PTR. Forward-confirmed rDNS needs an A record for this hostname pointing to the test IPv4; if absent the test records the requirement and does not force it." };
      } catch (e) { c.provider_connection_healthy = false; c.error = (e as HErr).code; }
      c.no_active_test = ["ready"].includes(test.status) && !test.provider_resource_id;
      const passed = Object.entries(c).filter(([k]) => k !== "error").every(([, v]) => v === true);
      return { passed, checks: c, ...r };
    };

    if (action === "preflight") {
      const pf = await preflight();
      await patch({ preflight: { ...pf.checks, passed: pf.passed, at: new Date().toISOString() }, estimated_cost: (pf as any).cost ?? null });
      await log("preflight", pf.passed ? "passed" : "failed", pf as any);
      return json({ ok: true, test, preflight: pf });
    }

    // ---------------- CREATE (exactly once, atomic claim) ----------------
    if (action === "create") {
      if (confirm !== TEST.server_name) return json({ ok: false, error: "confirmation_required" }, 400);
      const pf = await preflight();
      if (!pf.passed) { await log("preflight", "failed", { checks: pf.checks }); return json({ ok: false, error: "preflight_failed", preflight: pf }, 409); }
      const { data: claimed } = await db.from("cloud_e2e_tests").update({ status: "creating", stage: "creating", stage_started_at: new Date().toISOString(), started_at: new Date().toISOString(), created_by: user.id, error: null, failed_stage: null, lifecycle: {} })
        .eq("id", test.id).eq("status", "ready").is("provider_resource_id", null).select("*").maybeSingle();
      if (!claimed) return json({ ok: false, error: "already_started" }, 409);
      test = claimed;
      try {
        const k = ssh2.utils.generateKeyPairSync("ed25519", { comment: "ash-advanced-test" });
        const enc = await encrypt(k.private);
        await db.from("cloud_e2e_test_keys").upsert({ test_id: test.id, public_key: k.public, private_key_enc: enc.enc, iv: enc.iv });
        const key = await h("/ssh_keys", { method: "POST", body: JSON.stringify({ name: `ash-adv-${test.id.slice(0, 8)}`, public_key: k.public, labels: { [LABEL_K]: LABEL_V } }) });
        await patch({ provider_ssh_key_id: String(key.ssh_key.id) });
        await log("ssh_key", "created", { provider_ssh_key_id: key.ssh_key.id });
        const r = await h("/servers", { method: "POST", body: JSON.stringify({ name: TEST.server_name, server_type: TEST.server_type, location: TEST.location, image: TEST.image,
          ssh_keys: [key.ssh_key.id], start_after_create: true, public_net: { enable_ipv4: true, enable_ipv6: true }, labels: { [LABEL_K]: LABEL_V } }) });
        await patch({ provider_resource_id: String(r.server.id), provider_status: r.server.status, status: "running_tests", stage: "wait_running", ipv4: r.server.public_net?.ipv4?.ip ?? null, ipv6: r.server.public_net?.ipv6?.ip ?? null });
        await log("create", "accepted", { provider_resource_id: r.server.id });
        return json({ ok: true, test });
      } catch (e) { return await fail("creating", (e as HErr).code ?? "internal"); }
    }

    // ---------------- CONFIRM REBUILD (explicit admin confirmation inside Admin) ----------------
    if (action === "confirm_rebuild") {
      if (test.stage !== "await_rebuild_confirm" || test.status !== "awaiting_confirmation") return json({ ok: false, error: "not_awaiting" }, 409);
      if (confirm !== "REBUILD") return json({ ok: false, error: "confirmation_required" }, 400);
      const s: EngineServer = { id: test.id, owner_id: test.created_by, provider_server_id: test.provider_resource_id };
      const r = await engine(db, { actorId: user.id, role: "admin" }, s, "rebuild", { image: TEST.image });
      if (!r.ok) return await fail("rebuild_request", r.error ?? r.status);
      await patch({ status: "running_tests", stage: "rebuild_wait", pending_action_id: r.action_id });
      await log("rebuild_confirmed", "passed", { action_id: r.action_id });
      return json({ ok: true, test });
    }

    if (action === "retry_rescue_exit") {
      if (test.status !== "failed" || test.failed_stage !== "rescue_exit_verify" || !test.provider_resource_id) return json({ ok: false, error: "not_retryable" }, 409);
      if (!(await exists(`/servers/${test.provider_resource_id}`))) return json({ ok: false, error: "server_missing" }, 409);
      await patch({ status: "running_tests", stage: "rescue_exit_verify", failed_stage: null, error: null, pending_action_id: null });
      await lc({ rescue_exit_ssh_started_at: null, last_ssh_error: null });
      await log("rescue_exit_verify", "retry_requested");
      return json({ ok: true, test });
    }

    // ---------------- ADVANCE (one step per call) ----------------
    if (action === "advance") {
      if (test.status !== "running_tests" || !test.provider_resource_id) return json({ ok: true, test });
      const sid = test.provider_resource_id;
      const es: EngineServer = { id: test.id, owner_id: test.created_by, provider_server_id: sid };
      const admCtx: Ctx = { actorId: user.id, role: "admin" };
      const L = test.lifecycle ?? {};
      const age = Date.now() - new Date(test.stage_started_at ?? test.updated_at).getTime();
      const actionDone = async () => {
        if (!test.pending_action_id) return true;
        const a = (await h(`/actions/${test.pending_action_id}`)).action;
        if (a.status === "error") throw new HErr(`action_error:${a.error?.code ?? "unknown"}`);
        return a.status === "success";
      };
      const doAct = async (type: string, payload: Record<string, unknown>, stage: string, next: string, extra: Record<string, unknown> = {}) => {
        const r = await engine(db, admCtx, es, type, payload);
        if (!r.ok) throw new HErr(r.error ?? r.status);
        await patch({ pending_action_id: r.action_id, stage: next, ...extra });
        return r;
      };
      const key = async () => { const { data } = await db.from("cloud_e2e_test_keys").select("*").eq("test_id", test.id).single(); return decrypt(data.private_key_enc, data.iv); };
      // SSH with retries while the server boots; fails the stage after `limit` ms.
      const ssh = async (cmds: string[], stage: string, limit = 4 * 60000) => {
        try { return await sshRun(test.ipv4, await key(), cmds); }
        catch (e) { await lc({ last_ssh_error: sshErr(e) }); if (age > limit) throw new HErr(`ssh_failed:${sshErr(e).slice(0, 60)}`); return null; }
      };
      try {
        const s = (await h(`/servers/${sid}`)).server;
        if (s.status !== test.provider_status) await patch({ provider_status: s.status });
        const timeout = (min: number) => { if (age > min * 60000) throw new HErr("timeout"); };
        switch (test.stage) {
          case "wait_running":
            if (s.status === "running") { await patch({ stage: "baseline", running_at: new Date().toISOString(), ipv4: s.public_net?.ipv4?.ip, ipv6: s.public_net?.ipv6?.ip }); await log("running", "passed"); }
            else timeout(15);
            break;
          case "baseline": {
            const tok = token();
            const out = await ssh([...BASE_CMDS, `echo ${tok} > ${FILE} && sync && cat ${FILE}`], "baseline");
            if (!out) break;
            if (out[`echo ${tok} > ${FILE} && sync && cat ${FILE}`] !== tok) throw new HErr("file_write_failed");
            await lc({ baseline: { hostname: out.hostname, os: out[BASE_CMDS[1]], cpu: out.nproc, ram: out[BASE_CMDS[3]], disk: out[BASE_CMDS[4]], ipv4: out[BASE_CMDS[5]], ipv6: out[BASE_CMDS[6]],
              api: { ipv4: s.public_net?.ipv4?.ip, ipv6: s.public_net?.ipv6?.ip, cores: s.server_type?.cores, memory_gb: s.server_type?.memory, disk_gb: s.server_type?.disk } }, token_snapshot: tok });
            await patch({ stage: "snapshot_request", connectivity: { ok: true, user: "root" } });
            await log("baseline", "passed", { hostname: out.hostname });
            break;
          }
          case "snapshot_request": {
            const r = await doAct("snapshot", { description: `ash-advanced-test-${test.id.slice(0, 8)}` }, "snapshot_request", "snapshot_wait");
            await lc({ snapshot: { provider_id: r.image_id, status: "creating" } });
            break;
          }
          case "snapshot_wait": {
            const img = (await h(`/images/${L.snapshot?.provider_id}`)).image;
            await lc({ snapshot: { provider_id: String(img.id), created_at: img.created, size_gb: img.image_size, disk_size_gb: img.disk_size, status: img.status } });
            if ((await actionDone()) && img.status === "available") { await patch({ stage: "modify_file", pending_action_id: null }); await log("snapshot", "passed", { id: img.id, size_gb: img.image_size }); }
            else timeout(30);
            break;
          }
          case "modify_file": {
            if (s.status !== "running") { timeout(5); break; }
            const tok = token(); const cmd = `echo ${tok} > ${FILE} && sync && cat ${FILE}`;
            const out = await ssh([cmd], "modify_file"); if (!out) break;
            if (out[cmd] !== tok) throw new HErr("file_write_failed");
            await lc({ token_modified: tok }); await patch({ stage: "restore_request" }); await log("modify_file", "passed");
            break;
          }
          case "restore_request": await doAct("rebuild", { image: Number(L.snapshot.provider_id) }, "restore_request", "restore_wait"); await log("restore", "requested"); break;
          case "restore_wait":
            if ((await actionDone()) && s.status === "running") { await patch({ stage: "restore_verify", pending_action_id: null }); await log("restore_wait", "passed"); }
            else timeout(20);
            break;
          case "restore_verify": {
            const out = await ssh([READ_FILE, "hostname"], "restore_verify"); if (!out) break;
            const content = out[READ_FILE];
            await lc({ restore: { file_content: content, expected: L.token_snapshot, matches: content === L.token_snapshot } });
            if (content !== L.token_snapshot) throw new HErr("restore_content_mismatch");
            await patch({ stage: "backup_enable" }); await log("restore_verify", "passed");
            break;
          }
          case "backup_enable": await doAct("backup_enable", {}, "backup_enable", "backup_verify"); break;
          case "backup_verify":
            if ((await actionDone()) && s.backup_window) {
              await lc({ backup: { enabled: true, backup_window: s.backup_window, monthly_cost_eur: test.estimated_cost?.backup_monthly ?? null,
                note: "Hetzner creates backups automatically once per day inside backup_window; 7 slots kept. No on-demand backup was invented." } });
              await patch({ stage: "await_rebuild_confirm", status: "awaiting_confirmation", pending_action_id: null }); await log("backup", "passed", { backup_window: s.backup_window });
            } else timeout(5);
            break;
          case "rebuild_wait":
            if ((await actionDone()) && s.status === "running") { await patch({ stage: "rebuild_verify", pending_action_id: null }); await log("rebuild_wait", "passed"); }
            else timeout(20);
            break;
          case "rebuild_verify": {
            const out = await ssh([READ_FILE, BASE_CMDS[1]], "rebuild_verify"); if (!out) break;
            const os = out[BASE_CMDS[1]] ?? ""; const gone = out[READ_FILE] === "__MISSING__";
            await lc({ rebuild: { os, file_absent: gone } });
            if (!os.includes("Ubuntu 24.04")) throw new HErr("rebuild_os_mismatch");
            if (!gone) throw new HErr("rebuild_file_still_present");
            await patch({ stage: "rescue_enable" }); await log("rebuild_verify", "passed", { os });
            break;
          }
          case "rescue_enable": await doAct("rescue_enable", { ssh_keys: [Number(test.provider_ssh_key_id)] }, "rescue_enable", "rescue_reboot"); break;
          case "rescue_reboot":
            if (!(await actionDone())) { timeout(5); break; }
            if (!s.rescue_enabled) throw new HErr("rescue_not_enabled");
            await lc({ rescue: { enabled: true } });
            await doAct("reset", {}, "rescue_reboot", "rescue_verify"); break;
          case "rescue_verify": {
            if (!(await actionDone())) { timeout(5); break; }
            const out = await ssh(["hostname", "cat /etc/issue 2>/dev/null | head -1"], "rescue_verify", 5 * 60000); if (!out) break;
            const inRescue = /rescue/i.test(out.hostname + " " + out["cat /etc/issue 2>/dev/null | head -1"]);
            await lc({ rescue: { enabled: true, reachable: true, hostname: out.hostname, in_rescue: inRescue } });
            if (!inRescue) throw new HErr("not_in_rescue");
            await patch({ stage: "rescue_disable", pending_action_id: null }); await log("rescue_verify", "passed");
            break;
          }
          case "rescue_disable": await doAct("rescue_disable", {}, "rescue_disable", "rescue_exit_wait"); break;
          case "rescue_exit_wait":
            if (!(await actionDone())) { timeout(5); break; }
            if (s.rescue_enabled) throw new HErr("rescue_still_enabled");
            await doAct("reset", {}, "rescue_exit_wait", "rescue_exit_verify"); break;
          case "rescue_exit_verify": {
            // 1) Hetzner action finished and server reports running (not sufficient alone)
            if (!(await actionDone())) { timeout(5); break; }
            if (s.status !== "running") { timeout(10); break; }
            // 2) SSH readiness polling: every ~10s (advance cadence) for up to 5 min from when running was observed
            let started = L.rescue_exit_ssh_started_at as string | undefined;
            if (!started) { started = new Date().toISOString(); await lc({ rescue_exit_ssh_started_at: started }); await log("rescue_exit_verify", "ssh_polling_started"); }
            const waited = Date.now() - new Date(started).getTime();
            let out: Record<string, string> | null = null;
            try { out = await sshRun(test.ipv4, await key(), ["hostname", "cat /etc/os-release"]); }
            catch (e) {
              const err = sshErr(e); await lc({ last_ssh_error: err, rescue_exit_ssh_attempts: (Number(L.rescue_exit_ssh_attempts) || 0) + 1 });
              if (waited > 5 * 60000) throw new HErr(`ssh_not_ready_after_5min:${err.slice(0, 60)}`);
              break; // ECONNREFUSED / timeout = not ready yet
            }
            const host = (out.hostname ?? "").trim(); const osr = out["cat /etc/os-release"] ?? "";
            if (/rescue/i.test(host)) { if (waited > 5 * 60000) throw new HErr(`still_in_rescue:${host}`); break; }
            if (!/Ubuntu/.test(osr) || !/VERSION_ID="?24\.04/.test(osr)) throw new HErr("not_ubuntu_24_04");
            await lc({ rescue: { ...L.rescue, disabled: true, back_to_normal: true, hostname: host, os: "Ubuntu 24.04", ssh_original_key: true }, last_ssh_error: null });
            await patch({ stage: "rdns", pending_action_id: null }); await log("rescue_exit_verify", "passed", { hostname: host, waited_ms: waited });
            break;
          }
          case "rdns": {
            const ip = s.public_net?.ipv4?.ip; const prev = s.public_net?.ipv4?.dns_ptr ?? null;
            let a: string[] = []; try { a = await Deno.resolveDns(RDNS_HOST, "A"); } catch { /* none */ }
            if (!a.includes(ip)) {
              await lc({ rdns: { status: "skipped_requirement", previous: prev, requirement: `Create DNS A record ${RDNS_HOST} -> ${ip} first (forward-confirmed rDNS). Not forced.`, forward_a_records: a } });
              await patch({ stage: "engine" }); await log("rdns", "skipped_requirement", { forward_a_records: a });
              break;
            }
            await lc({ rdns: { status: "changing", previous: prev } });
            await doAct("rdns", { ip, dns_ptr: RDNS_HOST }, "rdns", "rdns_restore");
            break;
          }
          case "rdns_restore": {
            if (!(await actionDone())) { timeout(5); break; }
            const ptr = s.public_net?.ipv4?.dns_ptr;
            if (L.rdns?.status === "changing") {
              if (ptr !== RDNS_HOST) throw new HErr("ptr_not_saved");
              await lc({ rdns: { ...L.rdns, status: "verified", saved: ptr } }); await log("rdns", "passed", { ptr });
              await doAct("rdns", { ip: s.public_net?.ipv4?.ip, dns_ptr: L.rdns.previous ?? null }, "rdns_restore", "rdns_restore");
              await lc({ rdns: { ...L.rdns, status: "restoring", saved: ptr } });
            } else { await lc({ rdns: { ...L.rdns, status: "restored", now: ptr } }); await patch({ stage: "engine", pending_action_id: null }); }
            break;
          }
          case "engine": {
            // Customer Action Engine: ownership authorization, status, audit, provider response handling.
            const step = L.engine?.step ?? 0;
            const results = L.engine?.results ?? {};
            if (!(await actionDone())) { timeout(6); break; }
            const seq: [string, Record<string, unknown>, string | null][] = [
              ["stop", {}, "off"], ["start", {}, "running"], ["restart", {}, "running"],
              ["snapshot", { description: `ash-advanced-engine-${test.id.slice(0, 8)}` }, null], ["backup_disable", {}, null],
            ];
            if (step === 0 && !results.ownership) {
              const stranger = await engine(db, { actorId: crypto.randomUUID(), role: "customer" }, es, "restart");
              const owner = authorize({ actorId: test.created_by, role: "customer" }, es);
              const unsupported = await engine(db, admCtx, es, "delete_everything");
              results.ownership = { stranger_blocked: stranger.status === "forbidden", owner_allowed: owner, unsupported_rejected: unsupported.status === "not_supported" };
              if (!results.ownership.stranger_blocked || !owner || !results.ownership.unsupported_rejected) throw new HErr("engine_authorization_failed");
            }
            if (step > 0) {
              const [prevType, , want] = seq[step - 1];
              if (want && s.status !== want) { timeout(6); break; }
              results[prevType] = "completed";
              if (prevType === "backup_disable") results.backup_toggle = s.backup_window ? "still_enabled" : "disabled";
            }
            if (step < seq.length) {
              const [type, payload] = seq[step];
              const r = await engine(db, admCtx, es, type, payload);
              if (!r.ok) throw new HErr(`engine_${type}_${r.error ?? r.status}`);
              if (type === "snapshot") await lc({ engine_snapshot_id: r.image_id });
              await patch({ pending_action_id: r.action_id, stage_started_at: new Date().toISOString() } as any);
              await lc({ engine: { step: step + 1, results } });
            } else {
              results.rebuild = "completed via engine (Test 3 restore + Test 5 rebuild)";
              results.rescue = "completed via engine (Test 6 enable/disable)";
              await lc({ engine: { step, results, passed: true } });
              await patch({ stage: "passed", status: "passed", passed_at: new Date().toISOString(), pending_action_id: null });
              await log("engine", "passed", results); await log("advanced_test", "passed");
            }
            break;
          }
        }
        return json({ ok: true, test });
      } catch (e) { return await fail(test.stage, (e as HErr).code ?? "internal"); }
    }

    // ---------------- CLEANUP (explicit confirmation; verified via API) ----------------
    if (action === "cleanup") {
      if (confirm !== "DELETE") return json({ ok: false, error: "confirmation_required" }, 400);
      try {
        const snaps = ((await h(`/images?type=snapshot&label_selector=${encodeURIComponent(LABEL)}`)).images ?? []).map((i: any) => String(i.id));
        for (const id of [test.lifecycle?.snapshot?.provider_id, test.lifecycle?.engine_snapshot_id]) if (id && !snaps.includes(String(id))) snaps.push(String(id));
        const report: Record<string, unknown> = {};
        if (test.provider_resource_id) {
          try { await h(`/servers/${test.provider_resource_id}`, { method: "DELETE" }); } catch (e) { if ((e as HErr).status !== 404) throw e; }
          let gone = false;
          for (let i = 0; i < 12 && !gone; i++) { gone = !(await exists(`/servers/${test.provider_resource_id}`)); if (!gone) await new Promise((r) => setTimeout(r, 3000)); }
          if (!gone) { await log("cleanup", "pending", { note: "server delete accepted, not yet gone" }); return json({ ok: false, error: "delete_pending", test }); }
          report.server_deleted = true;
        }
        for (const id of snaps) { try { await h(`/images/${id}`, { method: "DELETE" }); } catch (e) { if ((e as HErr).status !== 404) throw e; } }
        report.snapshots_deleted = snaps; report.snapshots_verified_gone = (await Promise.all(snaps.map((id: string) => exists(`/images/${id}`)))).every((x) => !x);
        if (test.provider_ssh_key_id) { try { await h(`/ssh_keys/${test.provider_ssh_key_id}`, { method: "DELETE" }); } catch (e) { if ((e as HErr).status !== 404) throw e; } report.ssh_key_verified_gone = !(await exists(`/ssh_keys/${test.provider_ssh_key_id}`)); }
        report.no_labelled_servers_left = ((await h(`/servers?label_selector=${encodeURIComponent(LABEL)}`)).servers ?? []).length === 0;
        if (!report.snapshots_verified_gone || report.ssh_key_verified_gone === false || !report.no_labelled_servers_left) { await log("cleanup", "incomplete", report); return json({ ok: false, error: "cleanup_incomplete", report, test }); }
        await db.from("cloud_e2e_test_keys").delete().eq("test_id", test.id);
        await patch({ status: "cleaned_up", stage: "cleaned_up", cleaned_up_at: new Date().toISOString(), lifecycle: { ...(test.lifecycle ?? {}), cleanup: report } });
        await log("cleanup", "passed", report);
        return json({ ok: true, test, report });
      } catch (e) { await log("cleanup", "failed", { error: (e as HErr).code }); return json({ ok: false, error: (e as HErr).code, test }); }
    }

    if (action === "reset") {
      if (!(["cleaned_up", "ready"].includes(test.status))) return json({ ok: false, error: "cleanup_first" }, 409);
      await patch({ status: "ready", stage: "not_started", stage_started_at: null, provider_resource_id: null, provider_ssh_key_id: null, pending_action_id: null, provider_status: null,
        ipv4: null, ipv6: null, connectivity: null, customer_data: null, failed_stage: null, error: null, started_at: null, running_at: null, passed_at: null, cleaned_up_at: null, lifecycle: {} });
      await log("reset", "done"); return json({ ok: true, test });
    }
    return json({ error: "invalid_input" }, 400);
  } catch { return json({ error: "internal" }, 500); }
});
