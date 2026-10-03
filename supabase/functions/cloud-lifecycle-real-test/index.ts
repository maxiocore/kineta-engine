// ONE real-provider lifecycle test (admin only, fixed parameters). Creates exactly one Hetzner CX23,
// then drives the real lifecycle engine (shared runProviderJob + DB lifecycle functions) against it.
// Money is simulated (is_lifecycle_test subscription, sim wallet). Global switches stay false.
// Any failed provider step stops the test (status=failed); nothing is retried or recreated automatically.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import ssh2 from "npm:ssh2@1.16.0";
import { type Ctx, RealProvider, runProviderJob } from "../_shared/cloud-lifecycle-core.ts";
import { sendEmail } from "../_shared/email-gateway.ts";
import { renderBrandedEmail } from "../_shared/email-template.ts";

const TEST = { test_key: "hetzner-lifecycle-real-01", name: "Real Cloud Lifecycle Test", server_name: "ash-lifecycle-production-test-01", server_type: "cx23", location: "fsn1", image: "ubuntu-24.04" } as const;
const LABEL_K = "ash-lifecycle-test", LABEL_V = "real-01", LABEL = `${LABEL_K}=${LABEL_V}`;
const OWNER = "3030f5e0-95d4-4e9e-9075-07eaf560ce6f"; // admin test account
const API = "https://api.hetzner.cloud/v1";
const SWITCHES = ["LIVE_PAYMENTS_ENABLED", "LIVE_PROVISIONING_ENABLED", "AUTOMATIC_RENEWALS_ENABLED", "AUTOMATIC_SUSPENSIONS_ENABLED", "AUTOMATIC_TERMINATIONS_ENABLED", "LIFECYCLE_SCHEDULER_ENABLED"];
const flag = (n: string) => (Deno.env.get(n) ?? "false").toLowerCase() === "true";
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const Body = z.object({ action: z.enum(["status", "preflight", "create", "advance", "send_test_email", "cleanup"]), confirm: z.string().max(100).optional() });

class HErr extends Error { constructor(public code: string, public status = 0) { super(code); } }
async function h(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("HETZNER_CLOUD_API_TOKEN"); if (!token) throw new HErr("config_missing");
  const res = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new HErr(String(body?.error?.code ?? `http_${res.status}`), res.status);
  return body;
}

// ---- AES-GCM private key storage (same scheme as the proven E2E test) ----
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function aesKey() {
  const raw = Deno.env.get("INFRA_SSH_ENCRYPTION_KEY"); if (!raw || raw.length < 32) throw new HErr("encryption_key_missing");
  return crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)), "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encrypt(t: string) { const iv = crypto.getRandomValues(new Uint8Array(12)); return { enc: b64(new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(t)))), iv: b64(iv) }; }
async function decrypt(enc: string, iv: string) { return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aesKey(), unb64(enc))); }

function sshRun(host: string, privateKey: string, cmds: string[]): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const c = new ssh2.Client(); const out: Record<string, string> = {}; let done = false;
    const fin = (e: unknown, v?: Record<string, string>) => { if (done) return; done = true; clearTimeout(t); try { c.end(); } catch { /* */ } e ? reject(e) : resolve(v!); };
    const t = setTimeout(() => fin(new Error("ssh_timeout")), 30000);
    c.on("error", (e: Error) => fin(e)).on("ready", async () => {
      try {
        for (const cmd of cmds) out[cmd] = await new Promise<string>((res, rej) => c.exec(cmd, (err: Error, s: any) => { if (err) return rej(err); let d = ""; s.on("data", (x: Uint8Array) => (d += new TextDecoder().decode(x))).stderr.on("data", () => {}); s.on("close", () => res(d.trim().slice(0, 2000))); }));
        fin(null, out);
      } catch (e) { fin(e); }
    }).connect({ host, port: 22, username: "root", privateKey, readyTimeout: 15000, algorithms: { cipher: ["aes256-gcm@openssh.com", "aes128-gcm@openssh.com"] } });
  });
}
const READY_CMDS = {
  boot: "test -f /var/lib/cloud/instance/boot-finished && echo yes || echo no",
  empty_keys: "find /etc/ssh -maxdepth 1 -name 'ssh_host_*' -size 0 | wc -l",
  keys: "ls /etc/ssh/ssh_host_*_key 2>/dev/null | wc -l",
  sshd: "mkdir -p /run/sshd; sshd -t >/dev/null 2>&1 && echo ok || echo fail",
  sync: "sync && echo ok",
  os: ". /etc/os-release && echo $ID-$VERSION_ID",
  cpu: "nproc", mem: "free -m | awk '/Mem/{print $2}'", disk: "lsblk -bdno SIZE /dev/sda", hostname: "hostname",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  let actor: string | null = null;
  if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    const { data: u } = await db.auth.getUser(token); if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: ok } = await db.rpc("has_role", { _user_id: u.user.id, _role: "admin" }); if (!ok) return json({ error: "forbidden" }, 403);
    actor = u.user.id;
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({}))); if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const { action, confirm } = parsed.data;
  const switches = Object.fromEntries(SWITCHES.map((s) => [s, flag(s)]));

  let { data: test } = await db.from("cloud_e2e_tests").select("*").eq("test_key", TEST.test_key).maybeSingle();
  if (!test) test = (await db.from("cloud_e2e_tests").insert({ ...TEST, created_by: actor ?? OWNER, lifecycle: { calls: [], timeline: [] } }).select("*").single()).data;
  const L = () => (test.lifecycle ?? { calls: [], timeline: [] }) as any;
  const patch = async (p: Record<string, unknown>) => { if ("stage" in p) p.stage_started_at = new Date().toISOString(); test = (await db.from("cloud_e2e_tests").update(p).eq("id", test.id).select("*").single()).data; return test; };
  const log = (stage: string, result: string, details: Record<string, unknown> = {}) => db.from("cloud_e2e_test_events").insert({ test_id: test.id, actor_id: actor ?? OWNER, stage, result, details });
  const note = async (stage: string, details: Record<string, unknown>, next: string | null, provCalls: string[] = []) => {
    const l = L(); l.timeline = [...(l.timeline ?? []), { stage, at: new Date().toISOString(), ...details }]; l.calls = [...(l.calls ?? []), ...provCalls.map((c) => ({ stage, call: c.split(":")[0], at: new Date().toISOString() }))];
    await patch({ lifecycle: l, ...(next ? { stage: next } : {}) }); await log(stage, "passed", details);
  };
  const fail = async (stage: string, error: string, details: Record<string, unknown> = {}) => {
    await patch({ status: "failed", failed_stage: stage, error }); await log(stage, "failed", { error, ...details });
    return json({ ok: false, FAILED_AT: stage, error, details, test });
  };

  if (action === "status") return json({ ok: true, switches, test });

  const anySwitchOn = Object.values(switches).some(Boolean);
  if (anySwitchOn && action !== "cleanup") return json({ ok: false, error: "a_global_switch_is_on", switches }, 409);

  // ---------------- PREFLIGHT (read-only) ----------------
  const preflight = async () => {
    const c: Record<string, unknown> = {};
    try {
      const st = (await h(`/server_types?name=${TEST.server_type}`)).server_types?.[0];
      c.server_type_in_location = !!st?.prices?.find((x: any) => x.location === TEST.location) && !st.deprecated;
      c.image_available = ((await h(`/images?type=system&name=${TEST.image}&architecture=x86`)).images?.[0]?.status) === "available";
      c.no_existing_by_name = ((await h(`/servers?name=${TEST.server_name}`)).servers ?? []).length === 0;
      c.no_existing_by_label = ((await h(`/servers?label_selector=${encodeURIComponent(LABEL)}`)).servers ?? []).length === 0;
      c.provider_servers_before = ((await h(`/servers?per_page=50`)).servers ?? []).length;
    } catch (e) { c.provider_error = (e as HErr).code; }
    c.ssh_encryption_configured = !!Deno.env.get("INFRA_SSH_ENCRYPTION_KEY");
    c.all_switches_false = !anySwitchOn;
    c.not_started = test.status === "ready" || !test.status || test.status === "pending";
    const passed = ["server_type_in_location", "image_available", "no_existing_by_name", "no_existing_by_label", "ssh_encryption_configured", "all_switches_false"].every((k) => c[k] === true) && !c.provider_error;
    return { passed, checks: c };
  };
  if (action === "preflight") { const p = await preflight(); await patch({ preflight: { ...p, at: new Date().toISOString() } }); return json({ ok: true, preflight: p, test }); }

  // ---------------- CREATE (exactly once, idempotent) ----------------
  if (action === "create") {
    if (confirm !== TEST.server_name) return json({ ok: false, error: "confirmation_required" }, 400);
    const pf = await preflight(); if (!pf.passed) return json({ ok: false, error: "preflight_failed", pf }, 409);
    const { data: claimed } = await db.from("cloud_e2e_tests").update({ status: "creating", stage: "creating", started_at: new Date().toISOString() })
      .eq("id", test.id).in("status", ["ready", "pending"]).is("provider_resource_id", null).select("*").maybeSingle();
    if (!claimed) return json({ ok: false, error: "already_started", test }, 409);
    test = claimed;
    try {
      const k = ssh2.utils.generateKeyPairSync("ed25519", { comment: "ash-lifecycle-test" });
      const enc = await encrypt(k.private);
      await db.from("cloud_e2e_test_keys").upsert({ test_id: test.id, public_key: k.public, private_key_enc: enc.enc, iv: enc.iv });
      const key = await h("/ssh_keys", { method: "POST", body: JSON.stringify({ name: `ash-lifecycle-${test.id.slice(0, 8)}`, public_key: k.public, labels: { [LABEL_K]: LABEL_V } }) });
      await patch({ provider_ssh_key_id: String(key.ssh_key.id) });
      // Idempotent create: adopt an existing labelled server instead of creating a second one.
      const existing = ((await h(`/servers?label_selector=${encodeURIComponent(LABEL)}`)).servers ?? [])[0];
      const srv = existing ?? (await h("/servers", { method: "POST", body: JSON.stringify({
        name: TEST.server_name, server_type: TEST.server_type, location: TEST.location, image: TEST.image, ssh_keys: [key.ssh_key.id], start_after_create: true,
        public_net: { enable_ipv4: true, enable_ipv6: true }, labels: { [LABEL_K]: LABEL_V, internal_ref: test.id.slice(0, 36) },
      }) })).server;
      await patch({ provider_resource_id: String(srv.id), provider_status: srv.status, status: "running_tests", stage: "wait_running", ipv4: srv.public_net?.ipv4?.ip ?? null, ipv6: srv.public_net?.ipv6?.ip ?? null });
      await note("create", { provider_resource_id: String(srv.id), adopted: !!existing }, null, existing ? [] : ["create:" + srv.id]);
      return json({ ok: true, test });
    } catch (e) { return await fail("creating", (e as HErr).code ?? "internal"); }
  }

  // ---------------- ONE REAL EMAIL ----------------
  if (action === "send_test_email") {
    if (L().email) return json({ ok: false, error: "already_sent", email: L().email });
    const { data: u } = await db.auth.admin.getUserById(OWNER); const to = u?.user?.email; if (!to) return json({ ok: false, error: "no_recipient" });
    const html = renderBrandedEmail({ title: "إشعار اختبار دورة حياة الخادم | Lifecycle test notification", department: "الشؤون المالية", tone: "info", legal: "financial",
      intro: "هذه رسالة اختبار داخلية لإثبات تسليم بريد دورة حياة خدمات الخوادم. This is an internal test proving lifecycle email delivery.",
      details: [{ label: "Test", value: TEST.test_key, dir: "ltr" }], notice: "لا يلزم أي إجراء. No action required." });
    const r = await sendEmail({ from: "ASH HOLDING <billing@ash-holding.sa>", to, subject: "إشعار اختبار | Lifecycle test notification", html, reply_to: "billing@ash-holding.sa" });
    const l = L(); l.email = r.error ? { ok: false, error: String(r.error.statusCode ?? r.error.message ?? "error"), at: new Date().toISOString() } : { ok: true, id: (r as any).data?.id ?? null, at: new Date().toISOString() };
    await patch({ lifecycle: l }); return json({ ok: !r.error, email: l.email });
  }

  // ---------------- CLEANUP (explicit; only via this path) ----------------
  if (action === "cleanup") {
    if (confirm !== "DELETE" && test.stage !== "cleanup") return json({ ok: false, error: "confirmation_required" }, 400);
    const res: Record<string, unknown> = {};
    try {
      if (test.provider_resource_id) {
        try { await h(`/servers/${test.provider_resource_id}`); res.server = "still_exists"; } catch (e) { res.server = (e as HErr).status === 404 ? "gone" : (e as HErr).code; }
        if (res.server === "still_exists") return json({ ok: false, error: "server_still_exists_use_lifecycle_termination", res });
        const backups = ((await h(`/images?type=backup&per_page=50`)).images ?? []).filter((i: any) => String(i.created_from?.id) === String(test.provider_resource_id));
        res.backup_images_left = backups.length;
      }
      if (test.provider_ssh_key_id) { try { await h(`/ssh_keys/${test.provider_ssh_key_id}`, { method: "DELETE" }); } catch (e) { if ((e as HErr).status !== 404) throw e; } }
      try { await h(`/ssh_keys/${test.provider_ssh_key_id}`); res.ssh_key = "still_exists"; } catch (e) { res.ssh_key = (e as HErr).status === 404 ? "deleted" : (e as HErr).code; }
      await db.from("cloud_e2e_test_keys").delete().eq("test_id", test.id);
      res.labelled_servers = ((await h(`/servers?label_selector=${encodeURIComponent(LABEL)}`)).servers ?? []).length;
      res.labelled_keys = ((await h(`/ssh_keys?label_selector=${encodeURIComponent(LABEL)}`)).ssh_keys ?? []).length;
      res.provider_servers_after = ((await h(`/servers?per_page=50`)).servers ?? []).length;
      const subId = L().subscription_id, srvId = L().server_row_id;
      if (subId) {
        res.pending_jobs = (await db.from("cloud_jobs").select("id", { count: "exact", head: true }).eq("resource_id", subId).in("status", ["queued", "running"])).count;
        res.subscription_status = (await db.from("cloud_subscriptions").select("status").eq("id", subId).single()).data?.status;
      }
      if (srvId) res.locks = (await db.from("cloud_server_locks").select("resource_id", { count: "exact", head: true }).eq("resource_id", srvId)).count;
      const clean = res.ssh_key === "deleted" && res.labelled_servers === 0 && res.labelled_keys === 0 && !res.pending_jobs && !res.locks && (res.backup_images_left ?? 0) === 0 && ["terminated", undefined].includes(res.subscription_status as any);
      const l = L(); l.cleanup = res;
      await patch({ lifecycle: l, status: clean ? (test.status === "failed" ? "failed" : "passed") : test.status, stage: clean ? "cleaned_up" : test.stage, cleaned_up_at: clean ? new Date().toISOString() : null, passed_at: clean && test.status !== "failed" ? new Date().toISOString() : null });
      await log("cleanup", clean ? "passed" : "incomplete", res);
      return json({ ok: clean, cleanup: res, test });
    } catch (e) { return json({ ok: false, error: (e as HErr).code, res }); }
  }

  // ---------------- ADVANCE: one stage per call ----------------
  if (action !== "advance") return json({ error: "invalid_input" }, 400);
  if (test.status !== "running_tests" || !test.provider_resource_id) return json({ ok: true, test });
  const sid = test.provider_resource_id;
  const sub = async () => (await db.from("cloud_subscriptions").select("*").eq("id", L().subscription_id).single()).data;
  const rpc = async (fn: string, args: Record<string, unknown>) => { const { data, error } = await db.rpc(fn, args); if (error) throw new HErr("rpc_" + fn + ":" + error.message); return data; };
  const upd = async (p: Record<string, unknown>) => { const { error } = await db.from("cloud_subscriptions").update(p).eq("id", L().subscription_id); if (error) throw new HErr("update:" + error.message); };
  const past = () => new Date(Date.now() - 60000).toISOString();
  const prov = new RealProvider();
  const ctx: Ctx = { db, sim: false, prov, switches, actor };
  const runJob = async (type: string) => {
    const { data: j } = await db.from("cloud_jobs").select("*").eq("resource_id", L().subscription_id).eq("job_type", type).eq("status", "queued").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!j) return { ok: false, reason: "no_job" } as any;
    const c = (await db.rpc("cloud_claim_job", { p_job: j.id })).data; if (!c?.id) return { ok: false, reason: "not_claimed" } as any;
    return await runProviderJob(ctx, c);
  };
  const ssh = async () => { const { data: k } = await db.from("cloud_e2e_test_keys").select("*").eq("test_id", test.id).single(); return await sshRun(test.ipv4, await decrypt(k.private_key_enc, k.iv), Object.values(READY_CMDS)); };
  const readiness = (o: Record<string, string>) => ({ boot_finished: o[READY_CMDS.boot] === "yes", empty_host_keys: Number(o[READY_CMDS.empty_keys]), host_keys: Number(o[READY_CMDS.keys]), sshd_valid: o[READY_CMDS.sshd] === "ok", synced: o[READY_CMDS.sync] === "ok", os: o[READY_CMDS.os], cpu: Number(o[READY_CMDS.cpu]), mem_mb: Number(o[READY_CMDS.mem]), disk_gb: Math.round(Number(o[READY_CMDS.disk]) / 1e9), hostname: o[READY_CMDS.hostname] });
  const deleteCalls = (calls: any[] = L().calls ?? []) => calls.filter((c: any) => c.call === "delete").length;
  // Suspension via real engine: unpaid renewal → grace → grace expired (time moved on the test row only) → power off verified.
  const suspend = async (stage: string, next: string) => {
    const s0 = await sub();
    await upd({ next_renewal_at: past(), current_period_end: past() });
    if (["active", "renewal_due"].includes(s0.status)) await rpc("cloud_record_renewal_failure", { p_sub: s0.id, p_reason: "lifecycle_test_unpaid" });
    await upd({ grace_ends_at: past() });
    const b = await rpc("cloud_begin_suspension", { p_sub: s0.id }); if (!b?.ok) return await fail(stage, "begin_suspension_" + b?.reason);
    const pending = (await sub()).status; const t0 = new Date().toISOString();
    const r = await runJob("suspension"); const s1 = await sub(); const st = await prov.get(sid);
    if (!r.ok || s1.status !== "suspended" || st.status !== "off") return await fail(stage, "suspension_not_verified", { r, status: s1.status, provider: st.status, calls: prov.calls });
    await note(stage, { pending_status: pending, requested_at: t0, provider_status: st.status, subscription: s1.status, suspended_at: s1.suspended_at, graceful: !prov.calls.some((c) => c.startsWith("poweroff")) }, next, prov.calls);
    return null;
  };
  const sshCheck = async (stage: string, next: string) => {
    const age = Date.now() - new Date(test.stage_started_at).getTime();
    try { const o = readiness(await ssh()); if (!o.sshd_valid || o.empty_host_keys > 0) return await fail(stage, "ssh_unhealthy", o); await note(stage, { ssh: "ok", ...o }, next); return null; }
    catch (e) { if (age > 4 * 60000) return await fail(stage, "ssh_" + String((e as Error).message).slice(0, 60)); return json({ ok: true, waiting: stage, test }); }
  };

  try {
    const s = (await h(`/servers/${sid}`)).server;
    switch (test.stage) {
      case "wait_running":
        if (s.status !== "running") { if (Date.now() - new Date(test.started_at).getTime() > 15 * 60000) return await fail("wait_running", "timeout"); break; }
        await patch({ ipv4: s.public_net?.ipv4?.ip, ipv6: s.public_net?.ipv6?.ip, running_at: new Date().toISOString() });
        { const a = await h(`/servers/${sid}/actions/enable_backup`, { method: "POST", body: "{}" }); await patch({ pending_action_id: String(a.action.id) }); }
        await note("wait_running", { status: s.status }, "wait_backup", ["enable_backup:" + sid]); break;
      case "wait_backup": {
        const a = (await h(`/actions/${test.pending_action_id}`)).action;
        if (a.status === "error") return await fail("enable_backup", "action_error");
        if (a.status !== "success" || !s.backup_window) break;
        await note("wait_backup", { backups_enabled: true, backup_window: s.backup_window }, "first_boot"); await patch({ pending_action_id: null }); break;
      }
      case "first_boot": {
        const age = Date.now() - new Date(test.stage_started_at).getTime();
        let o; try { o = readiness(await ssh()); } catch (e) { if (age > 6 * 60000) return await fail("first_boot", "ssh_" + String((e as Error).message).slice(0, 60)); break; }
        if (!o.boot_finished) { if (age > 8 * 60000) return await fail("first_boot", "cloud_init_not_finished", o); break; }
        if (o.empty_host_keys > 0 || o.host_keys < 1 || !o.sshd_valid || !o.synced) return await fail("first_boot", "host_keys_or_sshd_invalid", o);
        const st = s.server_type ?? {};
        const baseline = { exists: true, ipv4: s.public_net?.ipv4?.ip ?? null, ipv6: s.public_net?.ipv6?.ip ?? null, image: s.image?.name, os: o.os, vcpu: st.cores, ram_gb: st.memory, disk_gb: st.disk, os_cpu: o.cpu, os_mem_mb: o.mem_mb, os_disk_gb: o.disk_gb, backups: !!s.backup_window, location: s.datacenter?.location?.name };
        const ok = baseline.ipv4 && baseline.ipv6 && baseline.image === "ubuntu-24.04" && o.os === "ubuntu-24.04" && st.cores === 2 && st.memory === 4 && st.disk === 40 && baseline.backups;
        if (!ok) return await fail("baseline", "baseline_mismatch", baseline);
        // Internal test records linked to this VPS (simulated money only).
        const now = Date.now(), d = (n: number) => new Date(now + n * 86400000).toISOString();
        const { data: srvRow, error: e1 } = await db.from("cloud_servers").insert({ user_id: OWNER, server_type: TEST.server_type, name: TEST.server_name, hostname: o.hostname, status: "active", location_code: TEST.location, image_code: TEST.image,
          primary_ipv4: baseline.ipv4, primary_ipv6: baseline.ipv6, backups_enabled: true, provider: "hetzner_cloud", provider_server_id: String(sid), monthly_price: 49, specs: { vcpu: 2, ram_gb: 4, disk_gb: 40, lifecycle_test: true } }).select("id").single();
        if (e1) return await fail("baseline", "server_row:" + e1.message);
        const { data: subRow, error: e2 } = await db.from("cloud_subscriptions").insert({ user_id: OWNER, server_id: srvRow.id, status: "active", billing_cycle: "monthly", amount: 49, vat_amount: 8.82, is_e2e_test: true, is_lifecycle_test: true, is_simulation: false,
          started_at: d(-1), current_period_start: d(-1), current_period_end: d(29), next_renewal_at: d(29), renewal_at: d(29).slice(0, 10), auto_renew: true, payment_method: "wallet",
          renewal_subtotal_minor: 4900, renewal_backup_minor: 980, vat_rate_snapshot: 0.15, renewal_vat_minor: 882, renewal_total_minor: 6762, backups_addon: true, backup_status: "active", sim_wallet_minor: 0 }).select("id").single();
        if (e2) return await fail("baseline", "subscription_row:" + e2.message);
        const l = L(); l.subscription_id = subRow.id; l.server_row_id = srvRow.id; l.baseline = baseline; l.first_boot = o; await patch({ lifecycle: l });
        await note("first_boot", { ...o, baseline }, "suspend_1"); break;
      }
      case "suspend_1": { const f = await suspend("suspend_1", "reactivate_1"); if (f) return f; break; }
      case "reactivate_1": case "reactivate_2": {
        const s0 = await sub(); if (s0.status === "suspended") { await upd({ sim_wallet_minor: s0.renewal_total_minor }); const p = await rpc("cloud_renew_subscription", { p_sub: s0.id }); if (!p?.ok) return await fail(test.stage, "payment_" + p?.reason); }
        const t0 = new Date().toISOString(); const r = await runJob("reactivation"); const s1 = await sub(); const st = await prov.get(sid);
        if (!r.ok || s1.status !== "active" || st.status !== "running") return await fail(test.stage, "reactivation_not_verified", { r, status: s1.status, provider: st.status });
        await note(test.stage, { requested_at: t0, provider_status: st.status, subscription: s1.status, wallet: "simulated" }, test.stage === "reactivate_1" ? "ssh_after_1" : "ssh_after_2", prov.calls); break;
      }
      case "ssh_after_1": { const f = await sshCheck("ssh_after_1", "ui_pause"); if (f) return f; break; }
      case "ui_pause": if (confirm !== "CONTINUE") return json({ ok: true, paused_for_ui_check: true, test }); await note("ui_pause", { resumed: true }, "backup_cancel"); break;
      case "backup_cancel": {
        const before = await prov.get(sid); if (!before.backup_enabled) return await fail("backup_cancel", "backups_not_enabled_before");
        const s0 = await sub(); const req0 = await rpc("cloud_request_backup_cancel", { p_sub: s0.id }); if (!req0?.ok) return await fail("backup_cancel", "request_" + req0?.reason);
        const pending = (await sub()).backup_status; const r = await runJob("backup_disable"); const s1 = await sub(); const after = await prov.get(sid);
        if (!r.ok || s1.backup_status !== "cancelled" || after.backup_enabled !== false || s1.renewal_backup_minor !== 0 || s1.renewal_total_minor !== 5635) return await fail("backup_cancel", "not_verified", { r, s1: { b: s1.backup_status, total: s1.renewal_total_minor }, provider_backup: after.backup_enabled });
        await upd({ backups_addon: false }); await db.from("cloud_servers").update({ backups_enabled: false }).eq("id", L().server_row_id);
        await note("backup_cancel", { enabled_before: true, pending_status: pending, provider_disabled: true, renewal_before_minor: s0.renewal_total_minor, renewal_after_minor: s1.renewal_total_minor, backup_minor: s1.renewal_backup_minor }, "suspend_2", prov.calls); break;
      }
      case "suspend_2": { const f = await suspend("suspend_2", "pay_before_termination"); if (f) return f; break; }
      case "pay_before_termination": {
        const s0 = await sub(); await rpc("cloud_send_final_warning", { p_sub: s0.id }); await upd({ termination_scheduled_at: past() });
        const before = deleteCalls(); await upd({ sim_wallet_minor: s0.renewal_total_minor });
        const pay = await rpc("cloud_renew_subscription", { p_sub: s0.id }); const term = await rpc("cloud_begin_termination", { p_sub: s0.id });
        const { count: tj } = await db.from("cloud_jobs").select("id", { count: "exact", head: true }).eq("resource_id", s0.id).eq("job_type", "termination");
        const st = await prov.get(sid);
        if (!pay?.ok || term?.ok || (tj ?? 0) > 0 || !st.exists) return await fail("pay_before_termination", "termination_not_blocked", { pay, term, tj });
        await note("pay_before_termination", { payment: pay.status, termination: term?.reason, termination_jobs: tj, delete_calls: deleteCalls() - before, provider_exists: st.exists }, "reactivate_2"); break;
      }
      case "ssh_after_2": { const f = await sshCheck("ssh_after_2", "suspend_3"); if (f) return f; break; }
      case "suspend_3": { const f = await suspend("suspend_3", "protected_termination"); if (f) return f; break; }
      case "protected_termination": {
        const s0 = await sub(); await upd({ final_warning_sent_at: null }); await rpc("cloud_send_final_warning", { p_sub: s0.id });
        await upd({ termination_scheduled_at: past(), protect_from_termination: true });
        const r = await rpc("cloud_begin_termination", { p_sub: s0.id });
        const { count: tj } = await db.from("cloud_jobs").select("id", { count: "exact", head: true }).eq("resource_id", s0.id).eq("job_type", "termination");
        if (r?.ok || r?.reason !== "protected" || (tj ?? 0) > 0) return await fail("protected_termination", "not_blocked", { r, tj });
        await upd({ protect_from_termination: false });
        await note("protected_termination", { result: r.reason, termination_jobs: tj, delete_calls: 0, protection_removed: true }, "final_termination"); break;
      }
      case "final_termination": {
        const s0 = await sub();
        const pre = { unpaid: s0.status === "suspended", final_warning: !!s0.final_warning_sent_at, delay_passed: s0.termination_scheduled_at <= new Date().toISOString(), protected: s0.protect_from_termination, hold: s0.on_hold };
        const b = await rpc("cloud_begin_termination", { p_sub: s0.id }); if (!b?.ok) return await fail("final_termination", "begin_" + b?.reason, pre);
        const pending = (await sub()).status; const r = await runJob("termination"); const s1 = await sub(); const st = await prov.get(sid);
        const dels = prov.calls.filter((c) => c.startsWith("delete")).length;
        if (!r.ok || st.exists || s1.status !== "terminated") return await fail("final_termination", "not_verified", { r, exists: st.exists, status: s1.status, dels });
        await db.from("cloud_servers").update({ status: "terminated", cancelled_at: new Date().toISOString() }).eq("id", L().server_row_id);
        await note("final_termination", { preconditions: pre, pending_status: pending, delete_requests: dels, provider_resource: "not_found", subscription: s1.status, verified_at: s1.provider_deletion_verified_at }, "cleanup", prov.calls); break;
      }
      default: break;
    }
    return json({ ok: true, test });
  } catch (e) {
    if ((e as HErr).status === 404 && test.stage !== "cleanup") return await fail(test.stage, "provider_resource_missing");
    return await fail(test.stage, (e as HErr).code ?? String((e as Error).message ?? "internal").slice(0, 120));
  }
});
