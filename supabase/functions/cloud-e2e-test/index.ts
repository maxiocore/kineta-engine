// Admin-only Hetzner Cloud end-to-end test. Fixed parameters only; independent of customer orders,
// wallets and the global LIVE_PROVISIONING_ENABLED gate (which stays false).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import ssh2 from "npm:ssh2@1.16.0";

const TEST = {
  test_key: "hetzner-cloud-e2e-01",
  name: "Hetzner Cloud End-to-End Test",
  server_name: "ash-cloud-e2e-test-01",
  server_type: "cx23",
  location: "fsn1",
  image: "ubuntu-24.04",
} as const;
const LABEL = "ash-e2e-test=hetzner-cloud-e2e-01";
const API = "https://api.hetzner.cloud/v1";
const SSH_CMDS = ["hostname", "uname -a", "cat /etc/os-release", "uptime", "df -h", "free -m"];

const Body = z.object({
  action: z.enum(["status", "preflight", "create", "advance", "cleanup", "reset"]),
  confirm: z.string().max(100).optional(),
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

class HErr extends Error { constructor(public code: string, public status = 0) { super(code); } }
async function h(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("HETZNER_CLOUD_API_TOKEN");
  if (!token) throw new HErr("config_missing");
  const res = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new HErr(String(body?.error?.code ?? `http_${res.status}`), res.status);
  return body;
}

// ---- AES-GCM encryption of the private key (key from INFRA_SSH_ENCRYPTION_KEY secret) ----
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function aesKey() {
  const raw = Deno.env.get("INFRA_SSH_ENCRYPTION_KEY");
  if (!raw || raw.length < 32) throw new HErr("encryption_key_missing");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encrypt(text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(text));
  return { enc: b64(new Uint8Array(ct)), iv: b64(iv) };
}
async function decrypt(enc: string, iv: string) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aesKey(), unb64(enc));
  return new TextDecoder().decode(pt);
}

function sshRun(host: string, privateKey: string): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const c = new ssh2.Client();
    const out: Record<string, string> = {};
    const timer = setTimeout(() => { c.end(); reject(new Error("ssh_timeout")); }, 25000);
    c.on("error", (e: Error) => { clearTimeout(timer); reject(new Error("ssh_" + (e.message.includes("authentication") ? "auth_failed" : "unreachable"))); })
      .on("ready", async () => {
        try {
          for (const cmd of SSH_CMDS) {
            out[cmd] = await new Promise<string>((res, rej) => c.exec(cmd, (err: Error, s: any) => {
              if (err) return rej(err);
              let d = ""; s.on("data", (x: Uint8Array) => (d += new TextDecoder().decode(x))).stderr.on("data", () => {});
              s.on("close", () => res(d.slice(0, 4000)));
            }));
          }
          clearTimeout(timer); c.end(); resolve(out);
        } catch (e) { clearTimeout(timer); c.end(); reject(e); }
      })
      .connect({ host, port: 22, username: "root", privateKey, readyTimeout: 15000, algorithms: { cipher: ["aes128-ctr", "aes256-ctr"] } });
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "unauthorized" }, 401);
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await db.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "invalid_input" }, 400);
    const { action, confirm } = parsed.data;

    // Ensure the single fixed test row exists
    let { data: test } = await db.from("cloud_e2e_tests").select("*").eq("test_key", TEST.test_key).maybeSingle();
    if (!test) {
      const ins = await db.from("cloud_e2e_tests").insert({ ...TEST, created_by: user.id }).select("*").single();
      test = ins.data;
    }
    const log = (stage: string, result: string, details: Record<string, unknown> = {}) =>
      db.from("cloud_e2e_test_events").insert({ test_id: test.id, actor_id: user.id, stage, result, details });
    const patch = async (p: Record<string, unknown>) => {
      const { data } = await db.from("cloud_e2e_tests").update(p).eq("id", test.id).select("*").single();
      test = data; return data;
    };
    const fail = async (stage: string, error: string) => {
      await patch({ status: "failed", failed_stage: stage, error });
      await log(stage, "failed", { error });
      return json({ ok: false, test });
    };

    if (action === "status") return json({ ok: true, test });

    // ---------------- PREFLIGHT ----------------
    const preflight = async () => {
      const checks: Record<string, boolean | string> = {};
      checks.api_credentials_configured = !!Deno.env.get("HETZNER_CLOUD_API_TOKEN");
      checks.ssh_encryption_configured = !!Deno.env.get("INFRA_SSH_ENCRYPTION_KEY");
      let st: any = null, img: any = null, ipPrice: number | null = null;
      try {
        await h("/locations"); checks.provider_connection_healthy = true;
        st = (await h(`/server_types?name=${TEST.server_type}`)).server_types?.[0];
        const p = st?.prices?.find((x: any) => x.location === TEST.location);
        checks.server_type_available_in_location = !!p && !st.deprecated;
        img = (await h(`/images?type=system&name=${TEST.image}&architecture=x86`)).images?.[0];
        checks.image_available = !!img && img.status === "available";
        const pricing = (await h("/pricing")).pricing;
        const ip = pricing?.primary_ips?.find((x: any) => x.type === "ipv4")?.prices?.find((x: any) => x.location === TEST.location);
        ipPrice = ip ? Number(ip.price_monthly.net) : null;
        checks.ipv4_pricing_available = ipPrice !== null;
        const existing = (await h(`/servers?name=${TEST.server_name}`)).servers ?? [];
        const labelled = (await h(`/servers?label_selector=${encodeURIComponent(LABEL)}`)).servers ?? [];
        checks.no_existing_provider_server = existing.length === 0 && labelled.length === 0;
      } catch (e) { checks.provider_connection_healthy = false; checks.error = (e as HErr).code; }
      checks.no_existing_provider_resource_id = !test.provider_resource_id;
      checks.no_active_test_job = ["ready", "failed_preflight"].includes(test.status);
      const p = st?.prices?.find((x: any) => x.location === TEST.location);
      const serverMonthly = p ? Number(p.price_monthly.net) : null;
      const serverHourly = p ? Number(p.price_hourly.net) : null;
      const cost = { currency: "EUR", server_monthly: serverMonthly, server_hourly: serverHourly, ipv4_monthly: ipPrice,
        total_monthly: serverMonthly !== null && ipPrice !== null ? +(serverMonthly + ipPrice).toFixed(4) : null,
        note: "Billed hourly; a ~1-2 hour test costs a few cents. Excludes VAT." };
      const passed = Object.entries(checks).filter(([k]) => k !== "error").every(([, v]) => v === true);
      return { passed, checks, cost, image_id: img?.id ?? null };
    };

    if (action === "preflight") {
      const pf = await preflight();
      await patch({ preflight: { ...pf.checks, passed: pf.passed, at: new Date().toISOString() }, estimated_cost: pf.cost });
      await log("preflight", pf.passed ? "passed" : "failed", { checks: pf.checks });
      return json({ ok: true, test, preflight: pf });
    }

    // ---------------- CREATE (exactly once) ----------------
    if (action === "create") {
      if (confirm !== TEST.server_name) return json({ ok: false, error: "confirmation_required" }, 400);
      const pf = await preflight();
      if (!pf.passed) { await log("preflight", "failed", { checks: pf.checks }); return json({ ok: false, error: "preflight_failed", preflight: pf }, 409); }
      // Atomic claim: only one request can move ready -> creating
      const { data: claimed } = await db.from("cloud_e2e_tests").update({ status: "creating", stage: "creating", started_at: new Date().toISOString(), created_by: user.id, error: null, failed_stage: null })
        .eq("id", test.id).eq("status", "ready").is("provider_resource_id", null).select("*").maybeSingle();
      if (!claimed) return json({ ok: false, error: "already_started" }, 409);
      test = claimed;
      try {
        const k = ssh2.utils.generateKeyPairSync("ed25519", { comment: "ash-e2e-test" });
        const enc = await encrypt(k.private);
        await db.from("cloud_e2e_test_keys").upsert({ test_id: test.id, public_key: k.public, private_key_enc: enc.enc, iv: enc.iv });
        const key = await h("/ssh_keys", { method: "POST", body: JSON.stringify({ name: `ash-e2e-${test.id.slice(0, 8)}`, public_key: k.public, labels: { "ash-e2e-test": "hetzner-cloud-e2e-01" } }) });
        await patch({ provider_ssh_key_id: String(key.ssh_key.id) });
        await log("ssh_key", "created", { provider_ssh_key_id: key.ssh_key.id });
        const r = await h("/servers", { method: "POST", body: JSON.stringify({
          name: TEST.server_name, server_type: TEST.server_type, location: TEST.location, image: TEST.image,
          ssh_keys: [key.ssh_key.id], start_after_create: true,
          public_net: { enable_ipv4: true, enable_ipv6: true }, labels: { "ash-e2e-test": "hetzner-cloud-e2e-01" },
        }) });
        await patch({ provider_resource_id: String(r.server.id), provider_status: r.server.status, status: "running_tests", stage: "wait_running",
          ipv4: r.server.public_net?.ipv4?.ip ?? null, ipv6: r.server.public_net?.ipv6?.ip ?? null });
        await log("create", "accepted", { provider_resource_id: r.server.id, server_type: TEST.server_type, location: TEST.location, image: TEST.image });
        return json({ ok: true, test });
      } catch (e) { return await fail("creating", (e as HErr).code ?? "internal"); }
    }

    // ---------------- ADVANCE (one step per call) ----------------
    if (action === "advance") {
      if (test.status !== "running_tests" || !test.provider_resource_id) return json({ ok: true, test });
      const sid = test.provider_resource_id;
      const getS = async () => (await h(`/servers/${sid}`)).server;
      const act = async (path: string, stage: string, next: string) => {
        const r = await h(`/servers/${sid}/actions/${path}`, { method: "POST", body: "{}" });
        await patch({ pending_action_id: String(r.action.id), stage: next });
        await log(stage, "requested", { action_id: r.action.id });
      };
      const actionDone = async () => {
        if (!test.pending_action_id) return true;
        const a = (await h(`/actions/${test.pending_action_id}`)).action;
        if (a.status === "error") throw new HErr("action_error");
        return a.status === "success";
      };
      try {
        const s = await getS();
        await patch({ provider_status: s.status });
        const age = Date.now() - new Date(test.updated_at).getTime();
        switch (test.stage) {
          case "wait_running":
            if (s.status === "running") {
              await patch({ stage: "ssh", running_at: new Date().toISOString(), ipv4: s.public_net?.ipv4?.ip, ipv6: s.public_net?.ipv6?.ip });
              await log("running", "passed", { status: s.status, ipv4: s.public_net?.ipv4?.ip, ipv6: s.public_net?.ipv6?.ip, location: s.datacenter?.location?.name, server_type: s.server_type?.name });
            } else if (Date.now() - new Date(test.started_at).getTime() > 15 * 60000) return await fail("wait_running", "timeout");
            break;
          case "ssh": {
            const { data: k } = await db.from("cloud_e2e_test_keys").select("*").eq("test_id", test.id).single();
            try {
              const out = await sshRun(test.ipv4, await decrypt(k.private_key_enc, k.iv));
              await patch({ connectivity: { ok: true, output: out, at: new Date().toISOString() }, stage: "power_off" });
              await log("ssh", "passed", { commands: SSH_CMDS });
            } catch (e) {
              const tries = (test.connectivity?.attempts ?? 0) + 1;
              await patch({ connectivity: { ok: false, attempts: tries, last_error: (e as Error).message } });
              if (tries >= 10) return await fail("ssh", (e as Error).message);
            }
            break;
          }
          case "power_off": await act("poweroff", "power_off", "verify_off"); break;
          case "verify_off":
            if ((await actionDone()) && s.status === "off") { await log("verify_off", "passed", { status: s.status }); await act("poweron", "power_on", "verify_on"); }
            else if (age > 5 * 60000) return await fail("verify_off", "timeout");
            break;
          case "verify_on":
            if ((await actionDone()) && s.status === "running") { await log("verify_on", "passed", { status: s.status }); await act("reboot", "reboot", "verify_reboot"); }
            else if (age > 5 * 60000) return await fail("verify_on", "timeout");
            break;
          case "verify_reboot":
            if ((await actionDone()) && s.status === "running") {
              await log("verify_reboot", "passed", { status: s.status });
              const cd = { status: s.status, ipv4: s.public_net?.ipv4?.ip ?? null, ipv6: s.public_net?.ipv6?.ip ?? null,
                location: s.datacenter?.location?.city ?? null, os: s.image?.description ?? null,
                vcpu: s.server_type?.cores ?? null, ram_gb: s.server_type?.memory ?? null, disk_gb: s.server_type?.disk ?? null };
              const complete = Object.values(cd).every((v) => v !== null && v !== undefined);
              await patch({ customer_data: { ...cd, complete }, pending_action_id: null });
              if (!complete) return await fail("customer_data_check", "missing_fields");
              await patch({ stage: "passed", status: "passed", passed_at: new Date().toISOString() });
              await log("customer_data_check", "passed", cd);
            } else if (age > 5 * 60000) return await fail("verify_reboot", "timeout");
            break;
        }
        return json({ ok: true, test });
      } catch (e) { return await fail(test.stage, (e as HErr).code ?? "internal"); }
    }

    // ---------------- CLEANUP (explicit admin confirmation) ----------------
    if (action === "cleanup") {
      if (confirm !== "DELETE") return json({ ok: false, error: "confirmation_required" }, 400);
      if (!test.provider_resource_id && !test.provider_ssh_key_id) return json({ ok: false, error: "nothing_to_clean" }, 409);
      try {
        if (test.provider_resource_id) {
          try { await h(`/servers/${test.provider_resource_id}`, { method: "DELETE" }); } catch (e) { if ((e as HErr).status !== 404) throw e; }
          let gone = false;
          for (let i = 0; i < 10 && !gone; i++) {
            try { await h(`/servers/${test.provider_resource_id}`); await new Promise((r) => setTimeout(r, 3000)); }
            catch (e) { if ((e as HErr).status === 404) gone = true; else throw e; }
          }
          if (!gone) { await log("cleanup", "pending", { note: "delete accepted, not yet gone" }); return json({ ok: false, error: "delete_pending", test }); }
        }
        if (test.provider_ssh_key_id) { try { await h(`/ssh_keys/${test.provider_ssh_key_id}`, { method: "DELETE" }); } catch (e) { if ((e as HErr).status !== 404) throw e; } }
        await db.from("cloud_e2e_test_keys").delete().eq("test_id", test.id);
        await patch({ status: "cleaned_up", stage: "cleaned_up", cleaned_up_at: new Date().toISOString() });
        await log("cleanup", "passed", { verified_deleted: true });
        return json({ ok: true, test });
      } catch (e) { await log("cleanup", "failed", { error: (e as HErr).code }); return json({ ok: false, error: (e as HErr).code, test }); }
    }

    // Reset only allowed once provider resources are gone (allows a future manual re-run)
    if (action === "reset") {
      if (!["cleaned_up", "ready"].includes(test.status)) return json({ ok: false, error: "cleanup_first" }, 409);
      await patch({ status: "ready", stage: "not_started", provider_resource_id: null, provider_ssh_key_id: null, pending_action_id: null, provider_status: null,
        ipv4: null, ipv6: null, connectivity: null, customer_data: null, failed_stage: null, error: null, started_at: null, running_at: null, passed_at: null, cleaned_up_at: null });
      await log("reset", "done");
      return json({ ok: true, test });
    }
    return json({ error: "invalid_input" }, 400);
  } catch {
    return json({ error: "internal" }, 500);
  }
});
