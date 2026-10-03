import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, RefreshCw, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { db, useTable, useInvalidate, DataTable, Pill, dt, cloudApi, Stat, T } from "./adminCloudShared";
import { usePricingContext } from "./pricingShared";

const eur = (n: number) => `€${n.toFixed(2)}`;
const sarFmt = (n: number) => `${n.toFixed(2)} SAR`;

export default function PricingSection({ t, lang }: { t: T; lang: string }) {
  const ctx = usePricingContext();
  const { s, rate, auto } = ctx;
  const { data: providers = [] } = useTable("cloud_providers", "code", true);
  const { data: alerts = [] } = useTable("cloud_price_alerts");
  const { data: status } = useQuery({ queryKey: ["admin-cloud", "status"], queryFn: () => cloudApi({ action: "admin_status" }) });
  const inv = useInvalidate();
  const [v, setV] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const cur = v ?? s;
  const hz = providers.find((p) => p.code === "hetzner_cloud");

  const run = async (key: string, body: any, okMsg: (r: any) => string) => {
    setBusy(key); const r = await cloudApi(body); setBusy(null); inv();
    r?.ok ? toast.success(okMsg(r)) : toast.error(r?.error ?? "error");
  };
  const save = async () => {
    const n = (k: string) => Number(cur[k]);
    if (!(n("manual_rate") > 0) || n("cost_buffer_pct") < 0 || n("cost_buffer_pct") > 50 || n("min_margin_pct") < 0 || n("min_margin_pct") > 95 || !(n("rate_stale_hours") > 0)) return toast.error(t("قيم غير صالحة", "Invalid values"));
    const { error } = await db.from("cloud_pricing_settings").update({ rate_mode: cur.rate_mode, manual_rate: n("manual_rate"), cost_buffer_pct: n("cost_buffer_pct"), min_margin_pct: n("min_margin_pct"), rate_stale_hours: n("rate_stale_hours"), provisioning_mode: "manual_approval", updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast.error(error.message);
    setV(null); toast.success(t("تم الحفظ", "Saved")); await cloudApi({ action: "admin_check_margins" }); inv();
  };
  const resolve = async (id: string) => { await db.from("cloud_price_alerts").update({ resolved: true }).eq("id", id); inv(); };

  const matrix = useMemo(() => ctx.prices.filter((p) => !q || p.server_type.includes(q.toLowerCase()) || p.location.includes(q.toLowerCase())), [ctx.prices, q]);
  const open = alerts.filter((a) => !a.resolved);
  const F = ({ k, label, step = "0.01" }: any) => <label className="block text-xs space-y-1"><span className="text-muted-foreground">{label}</span><Input dir="ltr" type="number" step={step} value={cur[k] ?? ""} onChange={(e) => setV({ ...cur, [k]: e.target.value })} /></label>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label={t("سعر الصرف المستخدم", "Effective rate")} value={<span dir="ltr">1 EUR = {rate.toFixed(4)} SAR</span>} />
        <Stat label={t("المصدر", "Source")} value={<span className="text-sm">{auto ? `${t("تلقائي", "Auto")} · ${s.auto_rate_source ?? ""}` : t("يدوي (احتياطي)", "Manual fallback")}</span>} tone={auto ? "good" : "warn"} />
        <Stat label={t("آخر تحديث للسعر", "Rate updated")} value={<span className="text-sm">{dt(s.auto_rate_updated_at, lang)}</span>} />
        <Stat label={t("هامش الأمان على التكلفة", "Cost buffer")} value={`${Number(s.cost_buffer_pct ?? 0)}%`} />
        <Stat label={t("التجهيز الفعلي", "Live provisioning")} value={<span className="flex items-center gap-1 text-sm">{status?.live_provisioning_enabled ? <><ShieldCheck className="w-4 h-4" />{t("مفعّل", "Enabled")}</> : <><ShieldOff className="w-4 h-4" />{t("معطّل", "Disabled")}</>}</span>} tone={status?.live_provisioning_enabled ? "bad" : "good"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold">{t("إعدادات العملة والتسعير", "Currency & pricing settings")}</h3>
          <p className="text-xs text-muted-foreground">{t("عملة البيع: SAR · عملة المزود: EUR", "Selling currency: SAR · Provider currency: EUR")}</p>
          <label className="block text-xs space-y-1"><span className="text-muted-foreground">{t("وضع سعر الصرف", "Rate mode")}</span>
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={cur.rate_mode ?? "auto"} onChange={(e) => setV({ ...cur, rate_mode: e.target.value })}>
              <option value="auto">{t("تلقائي مع احتياطي يدوي", "Automatic (manual fallback)")}</option><option value="manual">{t("تجاوز يدوي", "Manual override")}</option></select></label>
          <div className="grid grid-cols-2 gap-3">
            <F k="manual_rate" label={t("سعر الصرف اليدوي / الاحتياطي", "Manual / fallback rate")} step="0.0001" />
            <F k="cost_buffer_pct" label={t("هامش أمان التكلفة %", "Cost buffer %")} />
            <F k="min_margin_pct" label={t("حد تنبيه الهامش الأدنى %", "Minimum margin warning %")} />
            <F k="rate_stale_hours" label={t("اعتبار السعر قديماً بعد (ساعة)", "Rate stale after (hours)")} step="1" />
          </div>
          <label className="block text-xs space-y-1"><span className="text-muted-foreground">{t("وضع التجهيز", "Provisioning mode")}</span>
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value="manual_approval" disabled><option value="manual_approval">{t("موافقة يدوية من الإدارة", "Manual approval")}</option></select>
            <span className="text-muted-foreground">{t("التجهيز التلقائي جاهز في النظام لكنه غير مفعّل حتى تطلبه.", "Automatic provisioning is prepared but not enabled until requested.")}</span></label>
          <Button onClick={save} disabled={!v}>{t("حفظ", "Save")}</Button>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold">{t("المزامنة (قراءة فقط)", "Sync (read-only)")}</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("rate", { action: "admin_refresh_rate" }, (r) => `1 EUR = ${Number(r.rate).toFixed(4)} SAR`)}>{busy === "rate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{t("تحديث سعر الصرف", "Refresh exchange rate")}</Button>
            {hz && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("prices", { action: "admin_sync_prices", provider_id: hz.id }, (r) => t(`تم: ${r.count} سعر، ${r.changed} تغيير`, `${r.count} prices, ${r.changed} changed`))}>{busy === "prices" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{t("مزامنة أسعار المزود", "Sync provider prices")}</Button>}
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("m", { action: "admin_check_margins" }, (r) => t(`${r.alerts} تنبيه`, `${r.alerts} alerts`))}>{t("فحص الهوامش", "Check margins")}</Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("المزامنة لا تغيّر أسعار البيع أبداً. أي تغيير في تكلفة المزود يظهر كتنبيه فقط.", "Sync never changes retail prices; provider cost changes only raise alerts.")}</p>
          <h4 className="text-sm font-semibold flex items-center gap-1 pt-2"><AlertTriangle className="w-4 h-4" />{t("التنبيهات", "Alerts")} ({open.length})</h4>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {open.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-xs">
                <span className="flex flex-wrap items-center gap-1.5"><Pill tone={a.type.includes("decreased") ? "info" : a.type === "low_margin" ? "warn" : "bad"}>{a.type}</Pill>
                  {a.server_type && <span className="font-mono">{a.server_type}</span>}{a.location && <span className="font-mono">{a.location}</span>}
                  {a.old_value != null && <span dir="ltr">{eur(Number(a.old_value))} → {eur(Number(a.new_value))} ({(Number(a.new_value) - Number(a.old_value) >= 0 ? "+" : "")}{(Number(a.new_value) - Number(a.old_value)).toFixed(2)})</span>}
                  {a.old_value == null && a.new_value != null && <span dir="ltr">{Number(a.new_value).toFixed(1)}%</span>}{a.message && <span className="text-muted-foreground">{a.message}</span>}</span>
                <Button size="sm" variant="ghost" onClick={() => resolve(a.id)}>{t("تم", "Resolve")}</Button>
              </div>
            ))}
            {!open.length && <p className="text-xs text-muted-foreground">{t("لا توجد تنبيهات", "No alerts")}</p>}
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap"><h3 className="font-semibold">{t("مصفوفة تكلفة المزود حسب الموقع", "Provider cost matrix by location")} ({ctx.prices.length})</h3>
          <Input className="max-w-xs" placeholder={t("بحث بالنوع أو الموقع", "Filter type or location")} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <DataTable empty={t("لا توجد أسعار؛ نفّذ مزامنة الأسعار", "No prices; run price sync")}
          cols={[t("النوع", "Server type"), t("الموقع", "Location"), t("شهري EUR", "Monthly EUR"), t("بالساعة EUR", "Hourly EUR"), t("محوّل SAR", "Converted SAR"), t("بعد هامش الأمان", "Adjusted SAR"), t("النقل المضمّن", "Traffic"), t("تغيّر", "Change"), t("آخر مزامنة", "Synced")]}
          rows={matrix.map((p) => { const sar = Number(p.monthly_net) * rate; return [<span className="font-mono text-xs">{p.server_type}</span>, <span className="font-mono text-xs">{p.location}</span>, eur(Number(p.monthly_net)), p.hourly_net ? `€${Number(p.hourly_net).toFixed(4)}` : "—", sarFmt(sar), sarFmt(sar * (1 + ctx.buffer / 100)), p.included_traffic_tb ? `${Number(p.included_traffic_tb).toFixed(0)} TB` : "—",
            p.previous_monthly_net != null ? <span dir="ltr">{eur(Number(p.previous_monthly_net))} → {eur(Number(p.monthly_net))}</span> : "—", dt(p.synced_at, lang)]; })} />
      </section>
    </div>
  );
}
