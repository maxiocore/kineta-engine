import { useTable } from "./adminCloudShared";

export const categoryOf = (serverType: string) =>
  /^cax/i.test(serverType) ? "cloud_arm" : /^ccx/i.test(serverType) ? "dedicated_vcpu" : "cloud_vps";

export const CATEGORY_LABEL: Record<string, [string, string]> = {
  cloud_vps: ["Standard Cloud (CX)", "Standard Cloud (CX)"], cloud_arm: ["ARM Cloud (CAX)", "ARM Cloud (CAX)"],
  dedicated_vcpu: ["Dedicated vCPU Cloud (CCX)", "Dedicated vCPU Cloud (CCX)"], dedicated_physical: ["خوادم مخصصة فعلية (Robot)", "Dedicated physical (Robot)"],
};

export type CostOpts = { ipv4?: boolean; backup?: boolean };
export type CostBreakdown = {
  server: number; ipv4: number | null; ipv4Available: boolean; backup: number | null; backupPct: number | null;
  raw: number; sar: number; adj: number; eur: number; trafficTb: number | null; overagePerTb: number | null; row: any;
};

/** Admin-only pricing context: effective rate, buffer, add-ons, and per-location true cost. */
export function usePricingContext() {
  const { data: ps = [] } = useTable("cloud_pricing_settings", "id", true);
  const { data: prices = [] } = useTable("cloud_provider_prices", "server_type", true);
  const { data: maps = [] } = useTable("cloud_resource_mappings", "kind", true);
  const { data: billing = [] } = useTable("cloud_billing_settings", "id", true);
  const { data: addons = [] } = useTable("cloud_provider_addon_prices", "resource", true);
  const s = ps[0] ?? {};
  const auto = s.rate_mode === "auto" && Number(s.auto_rate) > 0;
  const rate = Number(auto ? s.auto_rate : s.manual_rate) || 0;
  const buffer = Number(s.cost_buffer_pct ?? 0);
  const minMargin = Number(s.min_margin_pct ?? 20);
  const vat = Number(billing[0]?.vat_rate ?? 0.15);
  const providerLoc = (providerId: string, code: string) => maps.find((m) => m.kind === "location" && m.code === code && m.provider_id === providerId)?.provider_ref ?? code;
  const addon = (providerId: string, resource: string, variant: string, ploc: string) =>
    addons.find((a) => a.provider_id === providerId && a.resource === resource && a.variant === variant && (a.location === ploc || a.location === "*"));

  /** Base server + IPv4 (if included) + backup (if included) = raw EUR → SAR → buffer. Unavailable add-on prices stay null, never 0. */
  const costFor = (providerId: string | null | undefined, serverType: string | null | undefined, code: string, opts: CostOpts = { ipv4: true }): CostBreakdown | null => {
    if (!providerId || !serverType) return null;
    const ploc = providerLoc(providerId, code);
    const p = prices.find((x) => x.provider_id === providerId && x.server_type === serverType && x.location === ploc);
    if (!p) return null;
    const server = Number(p.monthly_net);
    const ip = addon(providerId, "primary_ip", "ipv4", ploc);
    const ipv4 = ip?.pricing_available && ip.price_net != null ? Number(ip.price_net) : null;
    const bk = addon(providerId, "backup", "", "*");
    const backupPct = bk?.pricing_available && bk.percentage != null ? Number(bk.percentage) : null;
    const backup = backupPct != null ? (server * backupPct) / 100 : null;
    const raw = server + (opts.ipv4 ? ipv4 ?? 0 : 0) + (opts.backup ? backup ?? 0 : 0);
    const sar = raw * rate; const adj = sar * (1 + buffer / 100);
    return { server, ipv4, ipv4Available: ipv4 != null, backup, backupPct, raw, sar, adj, eur: raw,
      trafficTb: p.included_traffic_tb != null ? Number(p.included_traffic_tb) : null, overagePerTb: p.overage_price_per_tb != null ? Number(p.overage_price_per_tb) : null, row: p };
  };
  const margin = (retail: number, adj: number) => ({ profit: retail - adj, pct: retail ? ((retail - adj) / retail) * 100 : 0 });
  /** Retail ex-VAT needed to reach a target gross margin (pure maths, not a recommendation). */
  const priceForMargin = (adj: number, pct: number) => (pct >= 100 ? NaN : adj / (1 - pct / 100));
  return { s, rate, auto, buffer, minMargin, vat, prices, addons, costFor, margin, priceForMargin, providerLoc };
}
