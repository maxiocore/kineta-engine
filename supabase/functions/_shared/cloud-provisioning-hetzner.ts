// Real Hetzner adapter for the provisioning engine. Same readiness checks proven in the real lifecycle test.
import ssh2 from "npm:ssh2@1.16.0";
import type { ProvisionProvider, ProvServer, ReadinessResult } from "./cloud-provisioning-core.ts";

const API = "https://api.hetzner.cloud/v1";
const LABEL_K = "ash-order";
class HErr extends Error { constructor(public code: string, public status = 0) { super(code); } }
async function h(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("HETZNER_CLOUD_API_TOKEN"); if (!token) throw new HErr("config_missing");
  let res: Response;
  try { res = await fetch(API + path, { ...init, signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }); }
  catch { throw new HErr("timeout"); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new HErr(String(body?.error?.code ?? `http_${res.status}`), res.status);
  return body;
}
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
    }).connect({ host, port: 22, username: "root", privateKey, readyTimeout: 15000 });
  });
}
async function tcpOpen(host: string) { try { const c = await Deno.connect({ hostname: host, port: 22 }); c.close(); return true; } catch { return false; } }

const C = {
  boot: "test -f /var/lib/cloud/instance/boot-finished && echo yes || echo no",
  keys: "ls /etc/ssh/ssh_host_*_key 2>/dev/null | wc -l",
  empty: "find /etc/ssh -maxdepth 1 -name 'ssh_host_*' -size 0 | wc -l",
  valid: "for k in /etc/ssh/ssh_host_*_key; do ssh-keygen -l -f \"$k\" >/dev/null 2>&1 || echo bad; done | wc -l",
  sshd: "mkdir -p /run/sshd; sshd -t >/dev/null 2>&1 && echo ok || echo fail",
  sync: "sync && echo ok",
};
const toSrv = (s: any): ProvServer => ({ ref: String(s.id), status: s.status, ipv4: s.public_net?.ipv4?.ip ?? null, ipv6: s.public_net?.ipv6?.ip ?? null });

export class HetznerProvisionProvider implements ProvisionProvider {
  constructor(private db: any) {}
  async findByOrder(orderId: string) {
    try { const b = await h(`/servers?label_selector=${encodeURIComponent(`${LABEL_K}=${orderId}`)}`); const l = b.servers ?? [];
      if (l.length > 1) return { error: "duplicate_resource" }; return l[0] ? toSrv(l[0]) : null; }
    catch (e) { return { error: (e as HErr).code }; }
  }
  async get(ref: string) {
    try { return toSrv((await h(`/servers/${encodeURIComponent(ref)}`)).server); }
    catch (e) { return (e as HErr).status === 404 ? null : { error: (e as HErr).code }; }
  }
  async create(i: Parameters<ProvisionProvider["create"]>[0]) {
    try {
      let row = (await this.db.from("cloud_provisioning_keys").select("*").eq("job_id", i.jobId).maybeSingle()).data;
      if (!row) {
        const k = ssh2.utils.generateKeyPairSync("ed25519", { comment: `ash-provision-${i.jobId.slice(0, 8)}` });
        const enc = await encrypt(k.private);
        const key = await h("/ssh_keys", { method: "POST", body: JSON.stringify({ name: `ash-provision-${i.jobId}`, public_key: k.public, labels: { [LABEL_K]: i.orderId } }) });
        row = (await this.db.from("cloud_provisioning_keys").insert({ job_id: i.jobId, public_key: k.public, private_key_enc: enc.enc, iv: enc.iv, provider_key_id: String(key.ssh_key.id) }).select("*").single()).data;
      }
      const keys = [Number(row.provider_key_id)];
      if (i.customerPublicKey) {
        try { const ck = await h("/ssh_keys", { method: "POST", body: JSON.stringify({ name: `ash-customer-${i.orderId}`, public_key: i.customerPublicKey, labels: { [LABEL_K]: i.orderId } }) }); keys.push(ck.ssh_key.id); }
        catch (e) {
          if ((e as HErr).code !== "uniqueness_error") throw e;
          // Same public key already in the project (e.g. an earlier order): reuse it so the customer key is always installed.
          const want = i.customerPublicKey.trim().split(/\s+/).slice(0, 2).join(" "); let page = 1; let found: number | null = null;
          while (!found && page <= 20) {
            const l = await h(`/ssh_keys?per_page=50&page=${page}`); for (const k of l.ssh_keys ?? []) if (String(k.public_key).trim().split(/\s+/).slice(0, 2).join(" ") === want) found = k.id;
            if (!l.meta?.pagination?.next_page) break; page++;
          }
          if (!found) throw new HErr("customer_key_unavailable"); keys.push(found);
        }
      }
      // Automatic access: a unique random root password per server, stored encrypted (same row reused on retries), shown to the owner once.
      let userData: string | undefined;
      if (!i.customerPublicKey && i.serverId && i.userId) {
        let cred = (await this.db.from("cloud_server_credentials").select("*").eq("server_id", i.serverId).maybeSingle()).data;
        if (!cred) {
          const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
          const rnd = crypto.getRandomValues(new Uint8Array(24));
          const pw = Array.from(rnd, (x) => alphabet[x % alphabet.length]).join("");
          const e = await encrypt(pw);
          cred = (await this.db.from("cloud_server_credentials").insert({ server_id: i.serverId, user_id: i.userId, username: "root", secret_enc: e.enc, iv: e.iv }).select("*").single()).data;
        }
        if (!cred?.secret_enc) throw new HErr("credential_unavailable");
        const pw = await decrypt(cred.secret_enc, cred.iv);
        userData = [
          "#cloud-config",
          "ssh_pwauth: true",
          "chpasswd:",
          "  expire: false",
          "  users:",
          `    - {name: root, password: "${pw}", type: text}`,
          "write_files:",
          "  - path: /etc/ssh/sshd_config.d/01-ash-access.conf",
          "    content: |",
          "      PasswordAuthentication yes",
          "      PermitRootLogin yes",
          "runcmd:",
          "  - [sh, -c, 'systemctl restart ssh 2>/dev/null || systemctl restart sshd']",
          "",
        ].join("\n");
      }
      const b = await h("/servers", { method: "POST", body: JSON.stringify({ name: i.name, server_type: i.serverType, location: i.location, image: i.image, ssh_keys: keys, labels: { [LABEL_K]: i.orderId }, public_net: { enable_ipv4: true, enable_ipv6: true }, ...(userData ? { user_data: userData } : {}) }) });
      return { ok: true as const, server: toSrv(b.server) };
    } catch (e) { const code = (e as HErr).code; return { ok: false as const, error: code, lost: ["timeout", "unavailable"].includes(code) || (e as HErr).status >= 500 }; }
  }
  /** After readiness passed: remove the platform's temporary key from the server and the project, keep the customer key. Best effort. */
  async cleanupPlatformKey(jobId: string, host: string, customerPublicKey: string | null) {
    const row = (await this.db.from("cloud_provisioning_keys").select("*").eq("job_id", jobId).maybeSingle()).data;
    if (!row || !customerPublicKey) return { ok: false, reason: row ? "no_customer_key" : "no_platform_key" };
    const cust = customerPublicKey.trim().split(/\s+/)[1]; const plat = String(row.public_key).trim().split(/\s+/)[1];
    if (!/^[A-Za-z0-9+/=]+$/.test(cust) || !/^[A-Za-z0-9+/=]+$/.test(plat)) return { ok: false, reason: "bad_key" };
    const f = "/root/.ssh/authorized_keys";
    const o = await sshRun(host, await decrypt(row.private_key_enc, row.iv), [
      `grep -qF '${cust}' ${f} && grep -vF '${plat}' ${f} > ${f}.ash && chmod 600 ${f}.ash && mv ${f}.ash ${f} && echo removed || echo kept`,
    ]);
    const removed = Object.values(o)[0] === "removed";
    if (removed) {
      try { await h(`/ssh_keys/${encodeURIComponent(row.provider_key_id)}`, { method: "DELETE" }); } catch { /* key resource stays; harmless */ }
      await this.db.from("cloud_provisioning_keys").update({ private_key_enc: "", iv: "", cleaned_at: new Date().toISOString() }).eq("job_id", jobId);
    }
    return { ok: removed, reason: removed ? null : "customer_key_not_found_on_server" };
  }
  async readiness(jobId: string, host: string): Promise<ReadinessResult> {
    const r: ReadinessResult = { ssh_reachable: false, ssh_login: false, boot_finished: false, host_keys_exist: false, host_keys_nonzero: false, host_keys_valid: false, sshd_valid: false, sync_ok: false };
    r.ssh_reachable = await tcpOpen(host); if (!r.ssh_reachable) return r;
    const row = (await this.db.from("cloud_provisioning_keys").select("*").eq("job_id", jobId).maybeSingle()).data;
    if (!row) return { ...r, error: "platform_key_missing" };
    try {
      const o = await sshRun(host, await decrypt(row.private_key_enc, row.iv), Object.values(C));
      r.ssh_login = true;
      r.boot_finished = o[C.boot] === "yes";
      r.host_keys_exist = Number(o[C.keys]) > 0;
      r.host_keys_nonzero = r.host_keys_exist && Number(o[C.empty]) === 0;
      r.host_keys_valid = r.host_keys_nonzero && Number(o[C.valid]) === 0;
      r.sshd_valid = o[C.sshd] === "ok";
      r.sync_ok = o[C.sync] === "ok";
    } catch (e) { r.error = String((e as Error).message).slice(0, 120); }
    return r;
  }
}
