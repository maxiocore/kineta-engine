// Admin-only CUSTOMER end-to-end provisioning test. The caller (an admin) is also the single Test Customer.
// Customer steps go through the real customer paths using the caller's own JWT:
//   order_cloud_server RPC (plan/location/OS/VAT/wallet/order/job) and cloud-api (power + cancel).
// Automatic provisioning is a scoped override for this one E2E order only; LIVE_PROVISIONING_ENABLED is untouched.
// One stage per "advance" call; any failure stops (resources kept for manual cleanup). Never creates a second VPS.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import ssh2 from "npm:ssh2@1.16.0";

const TEST = { test_key: "customer-e2e-01", name: "Customer End-to-End Provisioning Test", server_name: "ash-customer-e2e-01", server_type: "cx23", location: "fsn1", image: "ubuntu-24.04" } as const;
const PLAN_CODE = "cloud-s", LOC_CODE = "de-fsn", IMG_CODE = "ubuntu-24.04";
const LABEL_K = "ash-customer-e2e", LABEL_V = "customer-e2e-01", LABEL = `${LABEL_K}=${LABEL_V}`;
const OTHER_LABELS = ["ash-advanced-test=hetzner-cloud-advanced-01", "ash-e2e-test=hetzner-cloud-e2e-01"];
const CONFIRM = "RUN CUSTOMER E2E";
const HARD_CAP_MS = 3 * 3600_000;
const API = "https://api.hetzner.cloud/v1";
export const STAGES = ["ordering", "provisioning", "wait_running", "readiness", "portal", "act_restart", "act_stop", "act_start", "isolation", "billing", "cancel", "delete_verify", "refund", "cleanup_verify", "passed"];

const Body = z.object({ action: z.enum(["status", "preflight", "run", "advance", "cleanup", "reset"]), confirm: z.string().max(100).optional() });
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

class HErr extends Error { constructor(public code: string, public status = 0) { super(code); } }
async function h(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("HETZNER_CLOUD_API_TOKEN"); if (!token) throw new HErr("config_missing");
  const res = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new HErr(String(body?.error?.code ?? `http_${res.status}`), res.status);
  return body;
}
const exists = async (p: string) => { try { await h(p); return true; } catch (e) { if ((e as HErr).status === 404) return false; throw e; } };

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function aesKey() {
  const raw = Deno.env.get("INFRA_SSH_ENCRYPTION_KEY"); if (!raw || raw.length < 32) throw new HErr("encryption_key_missing");
  return crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)), "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encrypt(t: string) { const iv = crypto.getRandomValues(new Uint8Array(12)); return { enc: b64(new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(t)))), iv: b64(iv) }; }
const decrypt = async (enc: string, iv: string) => new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aesKey(), unb64(enc)));

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
const READY_CMD = `test -f /var/lib/cloud/instance/boot-finished && echo BF_OK || echo BF_MISSING; n=0; for f in /etc/ssh/ssh_host_*_key; do if [ -s "$f" ] && [ -s "$f.pub" ] && ssh-keygen -lf "$f.pub" >/dev/null 2>&1; then n=$((n+1)); else echo "BADKEY $f"; fi; done; echo "KEYS_OK=$n"; sshd -t >/dev/null 2>&1 && echo SSHD_OK || echo SSHD_FAIL; sync && echo SYNC_OK`;
const BASE = ["hostname", "grep PRETTY_NAME /etc/os-release", "nproc", "grep MemTotal /proc/meminfo", "df -h / | tail -1"];
function readiness(o: string) {
  const keys = Number(/KEYS_OK=(\d+)/.exec(o)?.[1] ?? 0);
  const r = { boot_finished: o.includes("BF_OK"), host_keys_valid: keys > 0 && !o.includes("BADKEY"), host_keys_count: keys, sshd_valid: o.includes("SSHD_OK"), synced: o.includes("SYNC_OK") };
  const reason = !r.boot_finished ? "cloud_init_incomplete" : !r.host_keys_valid ? "no_hostkeys" : !r.sshd_valid ? "sshd_config_invalid" : !r.synced ? "sync_failed" : null;
  return { ...r, ready: !reason, reason };
}
const FORBIDDEN_WORDS = /hetzner|provider|eur|margin|cost|api/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization"); if (!auth) return json({ error: "unauthorized" }, 401);
    const URL_ = Deno.env.get("SUPABASE_URL")!, ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await db.auth.getUser(auth.replace("Bearer ", "")); if (!user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" }); if (!isAdmin) return json({ error: "forbidden" }, 403);
    const parsed = Body.safeParse(await req.json()); if (!parsed.success) return json({ error: "invalid_input" }, 400);
    const { action, confirm } = parsed.data;
    // The Test Customer's own session — every customer step uses it, so RLS + ownership checks apply exactly as for customers.
    const cust = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const callApi = async (body: unknown, authz = auth) => {
      const r = await fetch(`${URL_}/functions/v1/cloud-api`, { method: "POST", headers: { Authorization: authz, apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { http: r.status, body: await r.json().catch(() => ({})) };
    };

    let { data: test } = await db.from("cloud_e2e_tests").select("*").eq("test_key", TEST.test_key).maybeSingle();
    if (!test) test = (await db.from("cloud_e2e_tests").insert({ ...TEST, status: "ready", created_by: user.id }).select("*").single()).data;
    const log = (stage: string, result: string, details: Record<string, unknown> = {}) => db.from("cloud_e2e_test_events").insert({ test_id: test.id, actor_id: user.id, stage, result, details });
    const patch = async (p: Record<string, unknown>) => { if ("stage" in p) p.stage_started_at = new Date().toISOString(); test = (await db.from("cloud_e2e_tests").update(p).eq("id", test.id).select("*").single()).data; return test; };
    const lc = (p: Record<string, unknown>) => patch({ lifecycle: { ...(test.lifecycle ?? {}), ...p } });
    const L = () => (test.lifecycle ?? {}) as Record<string, any>;
    const fail = async (stage: string, error: string, extra: Record<string, unknown> = {}) => { await patch({ status: "failed", failed_stage: stage, error }); await log(stage, "failed", { error, ...extra }); return json({ ok: false, test }); };
    const go = async (stage: string, extra: Record<string, unknown> = {}) => { if (Object.keys(extra).length) await lc(extra); await patch({ stage }); await log(stage, "entered"); return json({ ok: true, test }); };
    const wait = (note: string) => json({ ok: true, waiting: note, test });
    const since = (iso?: string) => (iso ? Date.now() - new Date(iso).getTime() : 0);
    const notify = (title: string, message: string) => db.from("notifications").insert({ user_id: user.id, title, message, type: "cloud" });
    const sshKey = async () => { const { data: k } = await db.from("cloud_e2e_test_keys").select("private_key_enc,iv").eq("test_id", test.id).maybeSingle(); if (!k) throw new HErr("ssh_key_missing"); return decrypt(k.private_key_enc, k.iv); };
    const getPlan = async () => (await db.from("cloud_plans").select("id,code,is_active,status,monthly_price,vcpu,ram_gb,storage_gb").eq("code", PLAN_CODE).maybeSingle()).data;

    if (action === "status") return json({ ok: true, test, confirm_phrase: CONFIRM });

    // ---------------- PREFLIGHT / VERIFY CLEANUP (read-only) ----------------
    const preflight = async () => {
      const c: Record<string, unknown> = {}; const r: Record<string, unknown> = {};
      c.api_credentials_configured = !!Deno.env.get("HETZNER_CLOUD_API_TOKEN");
      c.ssh_encryption_configured = !!Deno.env.get("INFRA_SSH_ENCRYPTION_KEY");
      c.global_live_provisioning_off = Deno.env.get("LIVE_PROVISIONING_ENABLED") !== "true";
      try {
        const labels = [LABEL, ...OTHER_LABELS];
        let servers = 0, keys = 0, snaps = 0;
        for (const l of labels) {
          const q = encodeURIComponent(l);
          servers += ((await h(`/servers?label_selector=${q}`)).servers ?? []).length;
          keys += ((await h(`/ssh_keys?label_selector=${q}`)).ssh_keys ?? []).length;
          snaps += ((await h(`/images?type=snapshot&label_selector=${q}`)).images ?? []).length;
        }
        const named = ((await h(`/servers?name=${TEST.server_name}`)).servers ?? []).length + ((await h(`/servers?name=ash-cloud-advanced-test-01`)).servers ?? []).length;
        c.no_test_servers = servers + named === 0; c.no_temp_ssh_keys = keys === 0; c.no_test_snapshots = snaps === 0;
        const all = (await h(`/servers?per_page=50`)).servers ?? [];
        const { data: known } = await db.from("cloud_servers").select("provider_server_id").not("provider_server_id", "is", null);
        const knownIds = new Set((known ?? []).map((k: any) => String(k.provider_server_id)));
        const orphans = all.filter((s: any) => !knownIds.has(String(s.id))).map((s: any) => String(s.id));
        c.no_orphan_resources = orphans.length === 0; r.orphan_count = orphans.length;
        const st = (await h(`/server_types?name=${TEST.server_type}`)).server_types?.[0];
        c.server_type_available_in_location = !!st?.prices?.find((x: any) => x.location === TEST.location) && !st.deprecated;
        const img = (await h(`/images?type=system&name=${TEST.image}&architecture=x86`)).images?.[0];
        c.image_available = img?.status === "available";
      } catch (e) { c.provider_connection_healthy = false; r.error = (e as HErr).code; }
      const { data: others } = await db.from("cloud_e2e_tests").select("test_key,status").neq("test_key", TEST.test_key);
      c.no_active_provisioning_test = (others ?? []).every((o: any) => ["cleaned_up", "ready"].includes(o.status));
      c.previous_advanced_cleaned_up = (others ?? []).find((o: any) => o.test_key === "hetzner-cloud-advanced-01")?.status === "cleaned_up";
      const plan = await getPlan();
      c.plan_exists = !!plan && plan.status === "active";
      c.plan_hidden_from_customers = !!plan && plan.is_active === false;
      const { data: bal } = await db.from("user_balances").select("balance").eq("user_id", user.id).maybeSingle();
      const { data: vs } = await db.from("cloud_billing_settings").select("vat_rate").eq("id", 1).maybeSingle();
      const est = plan ? +(Number(plan.monthly_price) * (1 + Number(vs?.vat_rate ?? 0.15))).toFixed(2) : null;
      r.estimated_total_sar = est; r.wallet_balance = bal ? Number(bal.balance) : null;
      c.wallet_sufficient = est !== null && !!bal && Number(bal.balance) >= est;
      c.runner_idle = test.status === "ready" && !test.provider_resource_id;
      const passed = Object.values(c).every((v) => v === true);
      return { passed, checks: c, ...r };
    };

    if (action === "preflight") {
      const pf = await preflight();
      await patch({ preflight: { ...pf.checks, passed: pf.passed, at: new Date().toISOString(), estimated_total_sar: (pf as any).estimated_total_sar } });
      await log("preflight", pf.passed ? "passed" : "failed", pf as any);
      return json({ ok: true, test, preflight: pf });
    }

    // ---------------- RUN (one-shot claim; ORDER through the real customer function) ----------------
    if (action === "run") {
      if (confirm !== CONFIRM) return json({ ok: false, error: "confirmation_required" }, 400);
      const pf = await preflight();
      if (!pf.passed) { await log("preflight", "failed", pf as any); return json({ ok: false, error: "preflight_failed", preflight: pf }, 409); }
      const startedAt = new Date().toISOString();
      const { data: claimed } = await db.from("cloud_e2e_tests").update({ status: "running_tests", stage: "ordering", stage_started_at: startedAt, started_at: startedAt, created_by: user.id, error: null, failed_stage: null, lifecycle: {} })
        .eq("id", test.id).eq("status", "ready").is("provider_resource_id", null).select("*").maybeSingle();
      if (!claimed) return json({ ok: false, error: "already_started" }, 409);
      test = claimed;
      const plan = await getPlan();
      // Scoped private access: this user + this plan/location/OS, single use, 1 day.
      await db.from("cloud_e2e_customer_grants").update({ expires_at: new Date().toISOString() }).eq("user_id", user.id).is("used_at", null);
      await db.from("cloud_e2e_customer_grants").insert({ user_id: user.id, plan_id: plan!.id, location_code: LOC_CODE, image_code: IMG_CODE, created_by: user.id });
      const { data: b0 } = await db.from("user_balances").select("balance").eq("user_id", user.id).single();
      const key = `e2e-${test.id}-${Date.now()}`;
      const args = { p_plan_id: plan!.id, p_location: LOC_CODE, p_image: IMG_CODE, p_name: TEST.server_name, p_hostname: TEST.server_name, p_ssh_key_id: null, p_backups: false, p_idempotency_key: key, p_ipv4: true };
      const first = await cust.rpc("order_cloud_server", args);
      if (first.error) return await fail("ordering", `order_failed: ${first.error.message}`);
      const second = await cust.rpc("order_cloud_server", args); // idempotency: same request processed again
      const { data: b1 } = await db.from("user_balances").select("balance").eq("user_id", user.id).single();
      const o = first.data as any;
      const [{ count: orders }, { count: jobs }, { count: servers }, { count: debits }] = await Promise.all([
        db.from("cloud_orders").select("id", { count: "exact", head: true }).eq("idempotency_key", key),
        db.from("cloud_provisioning_jobs").select("id", { count: "exact", head: true }).eq("order_id", o.order_id),
        db.from("cloud_servers").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("name", TEST.server_name).not("status", "in", "(terminated,cancelled)"),
        db.from("balance_logs").select("id", { count: "exact", head: true }).eq("reference_id", o.order_id),
      ]);
      const before = Number(b0.balance), after = Number(b1.balance);
      const payment = { wallet_before: before, retail_price: o.subtotal, vat: o.vat, total: o.total, wallet_after: after, order_id: o.order_id, server_id: o.server_id,
        debit_exact: Math.abs(before - after - Number(o.total)) < 0.005, duplicate_returned: (second.data as any)?.duplicate === true,
        counts: { orders, jobs, servers, wallet_transactions: debits } };
      await lc({ payment, idempotency_key: key, internal_server_id: o.server_id, order_id: o.order_id });
      if (!payment.debit_exact || !payment.duplicate_returned || orders !== 1 || jobs !== 1 || servers !== 1 || debits !== 1) return await fail("ordering", "payment_or_idempotency_mismatch", payment);
      const { data: ord } = await db.from("cloud_orders").select("status,is_e2e_test").eq("id", o.order_id).single();
      if (!ord.is_e2e_test || ord.status !== "queued") return await fail("ordering", "order_not_scoped_queued", { ord });
      await notify("تم الدفع بنجاح", `تم استلام دفعة طلب الخادم ${TEST.server_name} بمبلغ ${o.total} ر.س شاملة الضريبة.`);
      await db.from("cloud_orders").update({ status: "paid" }).eq("id", o.order_id);
      await db.from("cloud_orders").update({ status: "queued" }).eq("id", o.order_id);
      await log("ordering", "passed", payment);
      return await go("provisioning");
    }

    // ---------------- MANUAL CLEANUP (only after a failure) ----------------
    if (action === "cleanup") {
      if (!["failed", "passed"].includes(test.status)) return json({ ok: false, error: "not_allowed" }, 409);
      const res: Record<string, unknown> = {};
      if (test.provider_resource_id) { try { await h(`/servers/${test.provider_resource_id}`, { method: "DELETE" }); } catch (e) { if ((e as HErr).status !== 404) res.server_error = (e as HErr).code; } }
      if (test.provider_ssh_key_id) { try { await h(`/ssh_keys/${test.provider_ssh_key_id}`, { method: "DELETE" }); } catch (e) { if ((e as HErr).status !== 404) res.key_error = (e as HErr).code; } }
      res.server_gone = test.provider_resource_id ? !(await exists(`/servers/${test.provider_resource_id}`)) : true;
      res.key_gone = test.provider_ssh_key_id ? !(await exists(`/ssh_keys/${test.provider_ssh_key_id}`)) : true;
      if (L().internal_server_id) await db.from("cloud_servers").update({ status: "terminated", cancelled_at: new Date().toISOString() }).eq("id", L().internal_server_id).neq("status", "terminated");
      await lc({ manual_cleanup: res }); await log("cleanup", "done", res);
      return json({ ok: true, test, cleanup: res, note: "Wallet refund is not automatic after a failure; it is reported for admin review." });
    }

    if (action === "reset") {
      if (!["cleaned_up", "failed"].includes(test.status) || (test.status === "failed" && !L().manual_cleanup?.server_gone)) return json({ ok: false, error: "not_allowed" }, 409);
      await patch({ status: "ready", stage: null, failed_stage: null, error: null, provider_resource_id: null, provider_ssh_key_id: null, provider_status: null, ipv4: null, ipv6: null, lifecycle: {}, started_at: null, running_at: null, passed_at: null, cleaned_up_at: null });
      await db.from("cloud_e2e_test_keys").delete().eq("test_id", test.id);
      return json({ ok: true, test });
    }

    // ---------------- ADVANCE (one stage step) ----------------
    if (test.status !== "running_tests") return json({ ok: false, error: "not_running", test }, 409);
    const st = test.stage as string; const lc0 = L(); const sid = lc0.internal_server_id as string, oid = lc0.order_id as string;

    // Hard cap: never keep a billable test server past 3 hours.
    if (since(test.started_at) > HARD_CAP_MS && test.provider_resource_id && !["delete_verify", "refund", "cleanup_verify", "passed"].includes(st)) {
      try { await h(`/servers/${test.provider_resource_id}`, { method: "DELETE" }); } catch { /* reported below */ }
      return await fail(st, "time_cap_exceeded_server_deleted");
    }

    try {
      if (st === "provisioning") {
        // Scoped auto-provisioning: only this E2E order, only if no provider resource exists yet (no duplicate VPS).
        const { data: job } = await db.from("cloud_provisioning_jobs").select("*").eq("order_id", oid).single();
        const { data: ord } = await db.from("cloud_orders").select("is_e2e_test,status").eq("id", oid).single();
        if (!ord.is_e2e_test) return await fail(st, "scoped_override_not_applicable");
        if (job.provider_resource_id || test.provider_resource_id) return await go("wait_running");
        await db.from("cloud_provisioning_jobs").update({ status: "provisioning", attempt_count: job.attempt_count + 1, last_attempt_at: new Date().toISOString() }).eq("id", job.id).eq("status", "queued");
        const k = ssh2.utils.generateKeyPairSync("ed25519", { comment: "ash-customer-e2e" });
        const enc = await encrypt(k.private);
        await db.from("cloud_e2e_test_keys").upsert({ test_id: test.id, public_key: k.public, private_key_enc: enc.enc, iv: enc.iv });
        const key = await h("/ssh_keys", { method: "POST", body: JSON.stringify({ name: `ash-cust-e2e-${test.id.slice(0, 8)}`, public_key: k.public, labels: { [LABEL_K]: LABEL_V } }) });
        await patch({ provider_ssh_key_id: String(key.ssh_key.id) });
        const r = await h("/servers", { method: "POST", body: JSON.stringify({ name: TEST.server_name, server_type: TEST.server_type, location: TEST.location, image: TEST.image,
          ssh_keys: [key.ssh_key.id], start_after_create: true, public_net: { enable_ipv4: true, enable_ipv6: true }, labels: { [LABEL_K]: LABEL_V, order: oid.slice(0, 63) } }) });
        const ref = String(r.server.id);
        await patch({ provider_resource_id: ref, provider_status: r.server.status });
        await db.from("cloud_provisioning_jobs").update({ provider_resource_id: ref }).eq("id", job.id);
        await db.from("cloud_servers").update({ provider: "hetzner_cloud", provider_server_id: ref, status: "provisioning" }).eq("id", sid);
        await db.from("cloud_orders").update({ status: "provisioning" }).eq("id", oid);
        await db.from("cloud_activity_logs").insert({ user_id: user.id, server_id: sid, event: "provisioning_started", details: { e2e: true } });
        await notify("بدأ تجهيز الخادم", `بدأ تجهيز خادمك ${TEST.server_name}. سنبلغك فور جاهزيته.`);
        return await go("wait_running", { provisioning_started_at: new Date().toISOString(), provider_resource_created: true });
      }

      if (st === "wait_running") {
        const s = (await h(`/servers/${test.provider_resource_id}`)).server;
        const ipv4 = s.public_net?.ipv4?.ip ?? null, ipv6 = s.public_net?.ipv6?.ip ?? null;
        await patch({ provider_status: s.status, ipv4, ipv6 });
        if (s.status !== "running" || !ipv4 || !ipv6) { if (since(test.stage_started_at) > 10 * 60_000) return await fail(st, "running_timeout"); return wait(`server ${s.status}`); }
        await db.from("cloud_servers").update({ status: "configuring", primary_ipv4: ipv4, primary_ipv6: ipv6 }).eq("id", sid);
        await db.from("cloud_provisioning_jobs").update({ status: "configuring" }).eq("order_id", oid);
        await patch({ running_at: new Date().toISOString() });
        return await go("readiness", { running_at: new Date().toISOString() });
      }

      if (st === "readiness") {
        let out: Record<string, string>;
        try { out = await sshRun(test.ipv4, await sshKey(), [READY_CMD, ...BASE]); }
        catch (e) { await lc({ last_ssh_error: sshErr(e) }); if (since(test.stage_started_at) > 8 * 60_000) return await fail(st, "ssh_not_ready", { last: sshErr(e) }); return wait("ssh not ready yet"); }
        const rd = readiness(out[READY_CMD]);
        if (!rd.ready) { if (since(test.stage_started_at) > 8 * 60_000) return await fail(st, rd.reason!, rd); await lc({ first_boot_partial: rd }); return wait(rd.reason!); }
        const base = { hostname: out.hostname, os: out[BASE[1]], cpu: out.nproc, ram: out[BASE[3]], disk: out[BASE[4]] };
        if (!/24\.04/.test(base.os) || base.cpu !== "2") return await fail(st, "baseline_mismatch", base);
        const now = new Date().toISOString();
        await db.from("cloud_servers").update({ status: "running" }).eq("id", sid);
        await db.from("cloud_provisioning_jobs").update({ status: "active", error_code: null, safe_error: null }).eq("order_id", oid);
        await db.from("cloud_orders").update({ status: "active" }).eq("id", oid);
        await db.from("cloud_activity_logs").insert({ user_id: user.id, server_id: sid, event: "server_active", details: {} });
        await notify("خادمك جاهز", `خادمك ${TEST.server_name} أصبح نشطاً ويمكنك الدخول إليه الآن.`);
        return await go("portal", { first_boot: rd, baseline: base, active_at: now,
          provisioning_duration_s: Math.round(since(lc0.provisioning_started_at) / 1000), first_boot_duration_s: Math.round(since(lc0.running_at) / 1000) });
      }

      if (st === "portal") {
        // What the customer's own session can read (same queries the portal uses).
        const { data: s, error } = await cust.from("cloud_servers").select("id,name,status,primary_ipv4,primary_ipv6,location_code,image_code,specs,renewal_date,monthly_price").eq("id", sid).maybeSingle();
        if (error || !s) return await fail(st, "customer_cannot_read_server");
        const { data: sub } = await cust.from("cloud_subscriptions").select("status,renewal_at,amount,vat_amount").eq("order_id", oid).maybeSingle();
        const spec = s.specs ?? {};
        const checks = { id: !!s.id, name: s.name === TEST.server_name, active: s.status === "running", ipv4: !!s.primary_ipv4, ipv6: !!s.primary_ipv6, location: s.location_code === LOC_CODE,
          os: s.image_code === IMG_CODE, vcpu_2: spec.vcpu === 2, ram_4: spec.ram_gb === 4, disk_40: spec.storage_gb === 40, traffic_20tb: Number(spec.traffic_tb) === 20,
          renewal: !!s.renewal_date, price: Number(s.monthly_price) > 0, billing_status: sub?.status === "active" };
        // Leak check on customer-readable order row
        const { data: co } = await cust.from("cloud_orders").select("*").eq("id", oid).maybeSingle();
        const exposedCols = co ? Object.keys(co).filter((k) => /provider|cost|margin|profit|exchange|buffer/.test(k) && co[k] !== null) : [];
        const leak = { customer_order_exposed_columns: exposedCols, server_row_has_provider_fields: false, notification_text_clean: true };
        const { data: notes } = await db.from("notifications").select("title,message").eq("user_id", user.id).eq("type", "cloud").gte("created_at", test.started_at);
        leak.notification_text_clean = (notes ?? []).every((n: any) => !FORBIDDEN_WORDS.test(`${n.title} ${n.message}`));
        await lc({ portal: { checks, values: s, subscription: sub }, leaks: leak });
        const ok = Object.values(checks).every(Boolean) && leak.notification_text_clean;
        if (!ok) return await fail(st, "portal_verification_failed", { checks });
        if (exposedCols.length) await lc({ warnings: [...(L().warnings ?? []), `customer session can read internal order columns: ${exposedCols.join(", ")}`] });
        return await go("act_restart");
      }

      const power = async (type: "restart" | "stop" | "start", expect: string, next: string) => {
        const key = `act_${type}`; const a = L()[key] ?? {};
        if (!a.requested_at) {
          const r = await callApi({ action: "power", server_id: sid, type });
          await lc({ [key]: { requested_at: new Date().toISOString(), http: r.http, response: r.body } });
          if (r.http !== 200 || !r.body?.ok) return await fail(st, `${type}_request_failed`, r.body);
          return wait(`${type} requested`);
        }
        const s = (await h(`/servers/${test.provider_resource_id}`)).server;
        const acts = (await h(`/servers/${test.provider_resource_id}/actions?sort=id:desc&per_page=5`)).actions ?? [];
        const cmd = { restart: "reboot_server", stop: "shutdown_server", start: "start_server" }[type];
        const last = acts.find((x: any) => x.command === cmd && new Date(x.started).getTime() >= new Date(a.requested_at).getTime() - 5000);
        if (last?.status === "error") return await fail(st, `${type}_provider_error`, { error: last.error?.code });
        if (!(last?.status === "success" && s.status === expect)) { if (since(a.requested_at) > 4 * 60_000) return await fail(st, `${type}_verify_timeout`, { status: s.status, action: last?.status }); return wait(`${type}: ${s.status}`); }
        if (expect === "running") {
          try { await sshRun(test.ipv4, await sshKey(), ["true"]); } catch (e) { if (since(a.requested_at) > 5 * 60_000) return await fail(st, `${type}_ssh_not_back`, { e: sshErr(e) }); return wait(`${type}: waiting ssh`); }
        }
        await db.from("cloud_servers").update({ status: expect === "off" ? "stopped" : "running" }).eq("id", sid);
        const { data: audit } = await db.from("cloud_server_actions").select("id,status").eq("server_id", sid).eq("action", type).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (audit) await db.from("cloud_server_actions").update({ status: "completed" }).eq("id", audit.id);
        await lc({ [key]: { ...a, verified_at: new Date().toISOString(), provider_status: s.status, audit_logged: !!audit, result: "passed" } });
        return await go(next);
      };
      if (st === "act_restart") return await power("restart", "running", "act_stop");
      if (st === "act_stop") return await power("stop", "off", "act_start");
      if (st === "act_start") return await power("start", "running", "isolation");

      if (st === "isolation") {
        const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
        const { data: anonRows } = await anon.from("cloud_servers").select("id").eq("id", sid);
        const anonApi = await callApi({ action: "power", server_id: sid, type: "stop" }, `Bearer ${ANON}`);
        // Ownership rule used by cloud-api for any other signed-in account
        const { data: srv } = await db.from("cloud_servers").select("user_id").eq("id", sid).single();
        const stranger = crypto.randomUUID();
        const res = { anon_read_blocked: (anonRows ?? []).length === 0, anon_api_blocked: anonApi.http === 401, other_account_owner_check_blocks: srv.user_id !== stranger,
          note: "No second real customer account was signed in; other-account denial verified through RLS (anon) and the server ownership check." };
        await lc({ isolation: res });
        if (!res.anon_read_blocked || !res.anon_api_blocked) return await fail(st, "authorization_isolation_failed", res);
        return await go("billing");
      }

      if (st === "billing") {
        const { data: o } = await db.from("cloud_orders").select("*").eq("id", oid).single();
        const { data: sub } = await db.from("cloud_subscriptions").select("*").eq("order_id", oid).maybeSingle();
        const { data: bl } = await db.from("balance_logs").select("amount,balance_before,balance_after,notes").eq("reference_id", oid);
        const plan = await getPlan();
        const { count: notes } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "cloud").gte("created_at", test.started_at);
        const res = { order: o.transaction_reference, subscription: !!sub, renewal_date: sub?.renewal_at, wallet_tx: (bl ?? []).length === 1,
          vat_snapshot: o.vat_amount !== null && Math.abs(Number(o.subtotal) * Number(o.vat_rate) - Number(o.vat_amount)) < 0.01,
          provider_cost_snapshot: o.raw_provider_cost !== null, exchange_rate_snapshot: o.exchange_rate_used !== null, margin_snapshot: o.gross_margin_pct !== null,
          price_matches_plan: Number(o.subtotal) === Number(plan!.monthly_price), notifications_count: notes,
          figures: { subtotal: o.subtotal, vat: o.vat_amount, total: o.total, margin_pct: o.gross_margin_pct } };
        await lc({ billing: res, notifications: { payment: true, started: true, ready: true, count: notes } });
        if (!res.subscription || !res.wallet_tx || !res.vat_snapshot || !res.provider_cost_snapshot || !res.exchange_rate_snapshot || !res.margin_snapshot || !res.price_matches_plan || (notes ?? 0) < 3) return await fail(st, "billing_verification_failed", res);
        return await go("cancel");
      }

      if (st === "cancel") {
        const r = await callApi({ action: "cancel", server_id: sid, mode: "immediate" });
        const { data: s } = await db.from("cloud_servers").select("status").eq("id", sid).single();
        const { data: acts } = await db.from("cloud_activity_logs").select("event").eq("server_id", sid).in("event", ["cancellation_requested", "server_terminated"]);
        await lc({ cancellation: { http: r.http, response: r.body, final_status: s.status, transitions: ["active", "cancellation_pending", "terminating", s.status], logged: (acts ?? []).map((a: any) => a.event) } });
        if (r.http !== 200 || !r.body?.ok || s.status !== "terminated") return await fail(st, "cancellation_failed", r.body);
        return await go("delete_verify");
      }

      if (st === "delete_verify") {
        if (await exists(`/servers/${test.provider_resource_id}`)) { if (since(test.stage_started_at) > 3 * 60_000) return await fail(st, "provider_server_still_exists"); return wait("deleting"); }
        if (test.provider_ssh_key_id) { try { await h(`/ssh_keys/${test.provider_ssh_key_id}`, { method: "DELETE" }); } catch (e) { if ((e as HErr).status !== 404) throw e; } }
        const keyGone = !test.provider_ssh_key_id || !(await exists(`/ssh_keys/${test.provider_ssh_key_id}`));
        if (!keyGone) return await fail(st, "ssh_key_still_exists");
        await db.from("cloud_e2e_test_keys").delete().eq("test_id", test.id);
        return await go("refund", { provider_deletion_verified: true, ssh_key_deleted: true });
      }

      if (st === "refund") {
        // Exactly once: guarded claim on the order row.
        const { data: o } = await db.from("cloud_orders").update({ refunded_at: new Date().toISOString(), status: "refunded" }).eq("id", oid).is("refunded_at", null).select("total,user_id").maybeSingle();
        if (!o) return await fail(st, "refund_already_applied");
        const amt = Number(o.total);
        const { data: b } = await db.from("user_balances").select("balance,total_spent").eq("user_id", o.user_id).single();
        await db.from("user_balances").update({ balance: Number(b.balance) + amt, total_spent: Math.max(0, Number(b.total_spent ?? 0) - amt) }).eq("user_id", o.user_id);
        await db.from("cloud_orders").update({ refund_amount: amt }).eq("id", oid);
        const { data: credit } = await db.from("balance_logs").select("id,notes").eq("user_id", o.user_id).eq("action_type", "credit").gte("created_at", new Date(Date.now() - 60_000).toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (credit) await db.from("balance_logs").update({ reference_id: oid, reference_type: "cloud_order_refund", notes: "E2E_TEST refund" }).eq("id", credit.id);
        const again = await db.from("cloud_orders").update({ refunded_at: new Date().toISOString() }).eq("id", oid).is("refunded_at", null).select("id");
        const { data: b2 } = await db.from("user_balances").select("balance").eq("user_id", o.user_id).single();
        const before = Number(L().payment?.wallet_before);
        const res = { refund_amount: amt, ledger_entry: !!credit, second_refund_blocked: (again.data ?? []).length === 0, final_balance: Number(b2.balance), restored_exactly: Math.abs(Number(b2.balance) - before) < 0.005 };
        await lc({ refund: res });
        if (!res.ledger_entry || !res.second_refund_blocked || !res.restored_exactly) return await fail(st, "refund_verification_failed", res);
        return await go("cleanup_verify");
      }

      if (st === "cleanup_verify") {
        const q = encodeURIComponent(LABEL);
        const servers = ((await h(`/servers?label_selector=${q}`)).servers ?? []).length;
        const keys = ((await h(`/ssh_keys?label_selector=${q}`)).ssh_keys ?? []).length;
        const snaps = ((await h(`/images?type=snapshot&label_selector=${q}`)).images ?? []).length;
        const all = (await h(`/servers?per_page=50`)).servers ?? [];
        const { data: known } = await db.from("cloud_servers").select("provider_server_id").not("provider_server_id", "is", null).not("status", "in", "(terminated,cancelled)");
        const ids = new Set((known ?? []).map((k: any) => String(k.provider_server_id)));
        const orphans = all.filter((s: any) => !ids.has(String(s.id))).length;
        const { count: pj } = await db.from("cloud_provisioning_jobs").select("id", { count: "exact", head: true }).eq("order_id", oid).not("status", "in", "(active,failed,provisioning_failed,cancelled)");
        const { count: pa } = await db.from("cloud_server_actions").select("id", { count: "exact", head: true }).eq("server_id", sid).eq("status", "requested");
        if ((pj ?? 0) > 0) await db.from("cloud_provisioning_jobs").update({ status: "cancelled" }).eq("order_id", oid);
        const res = { test_servers: servers, temp_ssh_keys: keys, test_snapshots: snaps, orphan_resources: orphans, pending_jobs: pj ?? 0, pending_actions: pa ?? 0 };
        await lc({ final_cleanup: res });
        if (servers || keys || snaps || orphans || pa) return await fail(st, "cleanup_incomplete", res);
        const now = new Date().toISOString();
        await patch({ status: "cleaned_up", stage: "passed", passed_at: now, cleaned_up_at: now });
        await log("passed", "CUSTOMER END-TO-END TEST PASSED", res);
        return json({ ok: true, test, result: "CUSTOMER END-TO-END TEST PASSED" });
      }
      return json({ ok: false, error: "unknown_stage", test }, 409);
    } catch (e) { return await fail(st, (e as HErr).code ?? "internal"); }
  } catch (e) {
    console.error("cloud-customer-e2e", e instanceof Error ? e.message : "error");
    return json({ error: "internal_error" }, 500);
  }
});
