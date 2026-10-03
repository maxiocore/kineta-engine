import { useTable } from "./adminCloudShared";

export const categoryOf = (serverType: string) =>
  /^cax/i.test(serverType) ? "cloud_arm" : /^ccx/i.test(serverType) ? "dedicated_vcpu" : "cloud_vps";

export const CATEGORY_LABEL: Record<string, [string, string]> = {
  cloud_vps: ["Cloud VPS", "Cloud VPS"], cloud_arm: ["Cloud ARM", "Cloud ARM"],
  dedicated_vcpu: ["Dedicated vCPU", "Dedicated vCPU"], dedicated_physical: ["خوادم مخصصة فعلية", "Dedicated physical"],
};

/** Admin-only pricing context: effective rate, buffer, and per-location provider cost lookup. */
export function usePricingContext() {
  const { data: ps = [] } = useTable("cloud_pricing_settings", "id", true);
  const { data: prices = [] } = useTable("cloud_provider_prices", "server_type", true);
  const { data: maps = [] } = useTable("cloud_resource_mappings", "kind", true);
  const { data: billing = [] } = useTable("cloud_billing_settings", "id", true);
  const s = ps[0] ?? {};
  const auto = s.rate_mode === "auto" && Number(s.auto_rate) > 0;
  const rate = Number(auto ? s.auto_rate : s.manual_rate) || 0;
  const buffer = Number(s.cost_buffer_pct ?? 0);
  const minMargin = Number(s.min_margin_pct ?? 20);
  const vat = Number(billing[0]?.vat_rate ?? 0.15);
  const providerLoc = (providerId: string, code: string) => maps.find((m) => m.kind === "location" && m.code === code && m.provider_id === providerId)?.provider_ref ?? code;
  const costFor = (providerId: string | null | undefined, serverType: string | null | undefined, code: string) => {
    if (!providerId || !serverType) return null;
    const p = prices.find((x) => x.provider_id === providerId && x.server_type === serverType && x.location === providerLoc(providerId, code));
    if (!p) return null;
    const eur = Number(p.monthly_net); const sar = eur * rate; const adj = sar * (1 + buffer / 100);
    return { eur, sar, adj, row: p };
  };
  const margin = (retail: number, adj: number) => ({ profit: retail - adj, pct: retail ? ((retail - adj) / retail) * 100 : 0 });
  return { s, rate, auto, buffer, minMargin, vat, prices, costFor, margin, providerLoc };
}
