// Provider-agnostic infrastructure layer. Credentials live only in server-side secrets.
export type PowerAction = "start" | "stop" | "restart";

export interface ProviderResult {
  status: "requested" | "completed" | "failed";
  providerRef?: string;
  error?: string;
}

export interface CloudProvider {
  readonly id: string;
  power(providerServerId: string | null, action: PowerAction): Promise<ProviderResult>;
  createSnapshot(providerServerId: string | null, name: string): Promise<ProviderResult>;
}

/** Records requests for manual fulfilment by admin until a real adapter is connected. */
export class ManualProvider implements CloudProvider {
  readonly id = "manual";
  async power(): Promise<ProviderResult> { return { status: "requested" }; }
  async createSnapshot(): Promise<ProviderResult> { return { status: "requested" }; }
}

export function getProvider(id: string): CloudProvider {
  // Future adapters (e.g. a cloud API or dedicated-server API) register here,
  // reading their tokens from Deno.env only.
  switch (id) {
    default:
      return new ManualProvider();
  }
}
