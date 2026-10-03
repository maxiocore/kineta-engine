// Provider-agnostic infrastructure layer. Credentials live only in server-side secrets.
export type PowerAction = "start" | "stop" | "restart";

export interface ProviderResult {
  status: "requested" | "completed" | "failed";
  providerRef?: string;
  requestId?: string;
  error?: string; // safe message only
  data?: Record<string, unknown>;
}

export type HealthStatus = "connected" | "auth_failed" | "unavailable" | "config_missing" | "not_supported";

export interface CatalogItem { kind: string; provider_ref: string; name: string; data: Record<string, unknown> }

export interface CreateServerInput { name: string; serverType: string; location: string; image: string; sshKeys?: string[]; idempotencyKey: string }

export interface CloudProvider {
  readonly id: string;
  power(providerServerId: string | null, action: PowerAction): Promise<ProviderResult>;
  createSnapshot(providerServerId: string | null, name: string): Promise<ProviderResult>;
  testConnection(): Promise<HealthStatus>;
  sync(kind: "server_type" | "location" | "image" | "server"): Promise<CatalogItem[]>;
  createServer(input: CreateServerInput): Promise<ProviderResult>;
  getServer(providerServerId: string): Promise<ProviderResult>;
  action(providerServerId: string, action: string, payload?: Record<string, unknown>): Promise<ProviderResult>;
}

/** Records requests for manual fulfilment by admin until a real adapter is connected. */
export class ManualProvider implements CloudProvider {
  readonly id = "manual";
  async power(): Promise<ProviderResult> { return { status: "requested" }; }
  async createSnapshot(): Promise<ProviderResult> { return { status: "requested" }; }
  async testConnection(): Promise<HealthStatus> { return "connected"; }
  async sync(): Promise<CatalogItem[]> { return []; }
  async createServer(): Promise<ProviderResult> { return { status: "requested" }; }
  async getServer(): Promise<ProviderResult> { return { status: "requested" }; }
  async action(): Promise<ProviderResult> { return { status: "requested" }; }
}

class ProviderError extends Error { constructor(public code: string, public requestId?: string) { super(code); } }

export class HetznerCloudProvider implements CloudProvider {
  readonly id = "hetzner_cloud";
  private base = "https://api.hetzner.cloud/v1";
  private token = Deno.env.get("HETZNER_CLOUD_API_TOKEN") ?? "";

  private async req(path: string, init: RequestInit = {}) {
    if (!this.token) throw new ProviderError("config_missing");
    let res: Response;
    try {
      res = await fetch(this.base + path, { ...init, headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    } catch { throw new ProviderError("unavailable"); }
    const requestId = res.headers.get("x-correlation-id") ?? undefined;
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) throw new ProviderError("auth_failed", requestId);
    if (!res.ok) throw new ProviderError(String(body?.error?.code ?? `http_${res.status}`), requestId);
    return { body, requestId };
  }

  private wrap = async (fn: () => Promise<ProviderResult>): Promise<ProviderResult> => {
    try { return await fn(); } catch (e) {
      const pe = e instanceof ProviderError ? e : new ProviderError("internal");
      return { status: "failed", error: pe.code, requestId: pe.requestId };
    }
  };

  async testConnection(): Promise<HealthStatus> {
    try { await this.req("/locations"); return "connected"; }
    catch (e) { const c = (e as ProviderError).code; return (["config_missing", "auth_failed"].includes(c) ? c : "unavailable") as HealthStatus; }
  }

  async sync(kind: "server_type" | "location" | "image" | "server"): Promise<CatalogItem[]> {
    const map = { server_type: "/server_types?per_page=50", location: "/locations", image: "/images?type=system&per_page=50", server: "/servers?per_page=50" };
    const { body } = await this.req(map[kind]);
    const list = body.server_types ?? body.locations ?? body.images ?? body.servers ?? [];
    return list.map((x: any) => ({
      kind, provider_ref: String(kind === "location" || kind === "server_type" ? x.name : x.id),
      name: x.description ?? x.name,
      data: kind === "server_type"
        ? { cores: x.cores, memory: x.memory, disk: x.disk, cpu_type: x.cpu_type, architecture: x.architecture, deprecated: x.deprecated, prices: x.prices }
        : kind === "location" ? { country: x.country, city: x.city, network_zone: x.network_zone }
        : kind === "image" ? { os_flavor: x.os_flavor, os_version: x.os_version, architecture: x.architecture, name: x.name }
        : { status: x.status, ipv4: x.public_net?.ipv4?.ip, server_type: x.server_type?.name, location: x.datacenter?.location?.name },
    }));
  }

  createServer(i: CreateServerInput) {
    return this.wrap(async () => {
      const { body, requestId } = await this.req("/servers", { method: "POST", body: JSON.stringify({ name: i.name, server_type: i.serverType, location: i.location, image: i.image, ssh_keys: i.sshKeys ?? [], labels: { order: i.idempotencyKey.slice(0, 63).replace(/[^a-zA-Z0-9_.-]/g, "") } }) });
      return { status: "requested", providerRef: String(body.server.id), requestId, data: { ipv4: body.server.public_net?.ipv4?.ip, ipv6: body.server.public_net?.ipv6?.ip, status: body.server.status } };
    });
  }

  getServer(id: string) {
    return this.wrap(async () => {
      const { body } = await this.req(`/servers/${encodeURIComponent(id)}`);
      return { status: body.server.status === "running" ? "completed" : "requested", providerRef: id, data: { ipv4: body.server.public_net?.ipv4?.ip, ipv6: body.server.public_net?.ipv6?.ip, status: body.server.status } };
    });
  }

  action(id: string, action: string, payload: Record<string, unknown> = {}) {
    const paths: Record<string, string> = { start: "poweron", stop: "shutdown", restart: "reboot", rebuild: "rebuild", rescue: "enable_rescue", snapshot: "create_image", backup: "enable_backup" };
    return this.wrap(async () => {
      if (action === "terminate") { const { requestId } = await this.req(`/servers/${encodeURIComponent(id)}`, { method: "DELETE" }); return { status: "requested", requestId }; }
      const p = paths[action]; if (!p) return { status: "failed", error: "not_supported" };
      const body = action === "snapshot" ? { type: "snapshot", description: payload.name } : action === "rebuild" ? { image: payload.image } : {};
      const { requestId } = await this.req(`/servers/${encodeURIComponent(id)}/actions/${p}`, { method: "POST", body: JSON.stringify(body) });
      return { status: "requested", requestId };
    });
  }

  power(id: string | null, a: PowerAction) { return id ? this.action(id, a) : Promise.resolve({ status: "requested" as const }); }
  createSnapshot(id: string | null, name: string) { return id ? this.action(id, "snapshot", { name }) : Promise.resolve({ status: "requested" as const }); }
}

/** Dedicated-server adapter placeholder; same interface, enabled later. */
export class HetznerRobotProvider extends ManualProvider {
  readonly id = "hetzner_robot" as any;
  async testConnection(): Promise<HealthStatus> {
    return Deno.env.get("HETZNER_ROBOT_USER") && Deno.env.get("HETZNER_ROBOT_PASSWORD") ? "not_supported" : "config_missing";
  }
}

export function getProvider(id: string): CloudProvider {
  switch (id) {
    case "hetzner_cloud": return new HetznerCloudProvider();
    case "hetzner_robot": return new HetznerRobotProvider();
    default: return new ManualProvider();
  }
}
