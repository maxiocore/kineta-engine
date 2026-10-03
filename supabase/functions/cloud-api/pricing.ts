// Exchange rates + provider price sync + margin alerts. Admin-only, read-only towards providers.
export interface CurrencyRateProvider { readonly id: string; getRate(from: string, to: string): Promise<number> }

/** Free public ECB-based feed; swap by implementing CurrencyRateProvider. */
export class OpenErApiRateProvider implements CurrencyRateProvider {
  readonly id = "open.er-api.com";
  async getRate(from: string, to: string) {
    const r = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`);
    if (!r.ok) throw new Error("rate_unavailable");
    const j = await r.json();
    const v = Number(j?.rates?.[to]);
    if (!(v > 0)) throw new Error("rate_unavailable");
    return v;
  }
}

export const rateProviders: CurrencyRateProvider[] = [new OpenErApiRateProvider()];

export async function refreshRate(admin: any) {
  const { data: s } = await admin.from("cloud_pricing_settings").select("*").eq("id", 1).single();
  for (const p of rateProviders) {
    try {
      const rate = await p.getRate(s.provider_currency, s.selling_currency);
      await admin.from("cloud_pricing_settings").update({ auto_rate: rate, auto_rate_source: p.id, auto_rate_updated_at: new Date().toISOString() }).eq("id", 1);
      return { ok: true, rate, source: p.id };
    } catch { /* try next */ }
  }
  await admin.from("cloud_price_alerts").insert({ type: "rate_refresh_failed", message: "Exchange-rate refresh failed; manual fallback in use" });
  return { ok: false, error: "rate_unavailable" };
}

export async function effectiveRate(admin: any) {
  const { data: s } = await admin.from("cloud_pricing_settings").select("*").eq("id", 1).single();
  const auto = s.rate_mode === "auto" && Number(s.auto_rate) > 0;
  return { rate: Number(auto ? s.auto_rate : s.manual_rate), settings: s, usingFallback: !auto };
}

/** Reads Hetzner server-type prices per location and stores them; never touches retail prices. */
export async function syncPrices(admin: any, providerId: string) {
  const token = Deno.env.get("HETZNER_CLOUD_API_TOKEN");
  if (!token) return { ok: false, error: "config_missing" };
  let list: any[] = [];
  try {
    const r = await fetch("https://api.hetzner.cloud/v1/server_types?per_page=50", { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 401 || r.status === 403) throw new Error("auth_failed");
    if (!r.ok) throw new Error("unavailable");
    list = (await r.json()).server_types ?? [];
  } catch (e) {
    const code = (e as Error).message === "auth_failed" ? "auth_failed" : "unavailable";
    await admin.from("cloud_price_alerts").insert({ type: "price_sync_failed", message: code });
    await admin.from("cloud_providers").update({ last_error: code }).eq("id", providerId);
    return { ok: false, error: code };
  }
  const { data: existing } = await admin.from("cloud_provider_prices").select("*").eq("provider_id", providerId);
  const prev = new Map((existing ?? []).map((p: any) => [`${p.server_type}|${p.location}`, p]));
  const now = new Date().toISOString();
  const rows: any[] = []; const alerts: any[] = [];
  for (const st of list) for (const p of st.prices ?? []) {
    const net = Number(p.price_monthly?.net); if (!(net >= 0)) continue;
    const old: any = prev.get(`${st.name}|${p.location}`);
    const changed = old && Number(old.monthly_net) !== net;
    rows.push({ provider_id: providerId, server_type: st.name, location: p.location, currency: "EUR", monthly_net: net, monthly_gross: Number(p.price_monthly?.gross ?? 0) || null,
      hourly_net: Number(p.price_hourly?.net ?? 0) || null, included_traffic_tb: p.included_traffic ? Number(p.included_traffic) / 1e12 : null,
      previous_monthly_net: changed ? Number(old.monthly_net) : old?.previous_monthly_net ?? null, changed_at: changed ? now : old?.changed_at ?? null, synced_at: now });
    if (changed) alerts.push({ type: net > Number(old.monthly_net) ? "provider_cost_increased" : "provider_cost_decreased", server_type: st.name, location: p.location, old_value: Number(old.monthly_net), new_value: net, message: "EUR monthly" });
  }
  if (rows.length) await admin.from("cloud_provider_prices").upsert(rows, { onConflict: "provider_id,server_type,location" });
  if (alerts.length) await admin.from("cloud_price_alerts").insert(alerts);
  await admin.from("cloud_providers").update({ last_success_at: now, last_error: null }).eq("id", providerId);
  const margins = await checkMargins(admin);
  return { ok: true, count: rows.length, changed: alerts.length, margin_alerts: margins };
}

/** Raises low/negative margin + stale-rate warnings. Never changes customer prices. */
export async function checkMargins(admin: any) {
  const { rate, settings: s } = await effectiveRate(admin);
  const [{ data: plans }, { data: costs }, { data: prices }, { data: maps }, { data: locPrices }] = await Promise.all([
    admin.from("cloud_plans").select("*"), admin.from("cloud_plan_costs").select("*"), admin.from("cloud_provider_prices").select("*"),
    admin.from("cloud_resource_mappings").select("*").eq("kind", "location"), admin.from("cloud_plan_location_prices").select("*"),
  ]);
  await admin.from("cloud_price_alerts").delete().in("type", ["low_margin", "negative_margin", "exchange_rate_stale"]).eq("resolved", false);
  const out: any[] = [];
  const staleH = s.auto_rate_updated_at ? (Date.now() - new Date(s.auto_rate_updated_at).getTime()) / 36e5 : Infinity;
  if (s.rate_mode === "auto" && staleH > s.rate_stale_hours) out.push({ type: "exchange_rate_stale", message: s.auto_rate_updated_at ? `${Math.round(staleH)}h` : "never fetched" });
  for (const p of plans ?? []) {
    const c = (costs ?? []).find((x: any) => x.plan_id === p.id); if (!c?.provider_ref) continue;
    for (const loc of p.location_codes ?? []) {
      const ploc = (maps ?? []).find((m: any) => m.code === loc && m.provider_id === c.provider_id)?.provider_ref ?? loc;
      const pr = (prices ?? []).find((x: any) => x.provider_id === c.provider_id && x.server_type === c.provider_ref && x.location === ploc); if (!pr) continue;
      const adj = Number(pr.monthly_net) * rate * (1 + Number(s.cost_buffer_pct) / 100);
      const retail = p.pricing_mode === "location" ? Number((locPrices ?? []).find((l: any) => l.plan_id === p.id && l.location_code === loc)?.monthly_price ?? 0) : Number(p.monthly_price);
      if (!retail) continue;
      const m = ((retail - adj) / retail) * 100;
      if (m < 0) out.push({ type: "negative_margin", plan_id: p.id, location: loc, new_value: Number(m.toFixed(2)), message: p.code });
      else if (m < Number(s.min_margin_pct)) out.push({ type: "low_margin", plan_id: p.id, location: loc, new_value: Number(m.toFixed(2)), message: p.code });
    }
  }
  if (out.length) await admin.from("cloud_price_alerts").insert(out);
  return out.length;
}
