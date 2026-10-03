import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useTable, Pill, T } from "./adminCloudShared";
import { usePricingContext, categoryOf, CATEGORY_LABEL } from "./pricingShared";

const CANDIDATES = ["cx23", "cx33", "cx43", "cx53", "cax11", "cax21", "cax31", "ccx13", "ccx23", "ccx33"];
const f2 = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : n.toFixed(2));

/** Analysis-only tool: compares candidate server types by true cost per location. Never creates or publishes plans. */
export default function StarterPlanBuilder({ t }: { t: T }) {
  const ctx = usePricingContext();
  const { data: providers = [] } = useTable("cloud_providers", "code", true);
  const { data: catalog = [] } = useTable("cloud_provider_catalog", "synced_at");
  const { data: locations = [] } = useTable("cloud_locations", "sort_order", true);
  const hz = providers.find((p) => p.code === "hetzner_cloud");
  const [price, setPrice] = useState("49");
  const [priceMode, setPriceMode] = useState<"ex" | "inc">("ex");
  const [target, setTarget] = useState("30");
  const [ipv4, setIpv4] = useState(true);
  const [backup, setBackup] = useState(false);

  if (!hz) return <p className="text-sm text-muted-foreground">{t("لا يوجد مزود مربوط", "No provider connected")}</p>;
  const entered = Number(price) || 0;
  const exVat = priceMode === "ex" ? entered : entered / (1 + ctx.vat);
  const vatAmt = exVat * ctx.vat;
  const tgt = Number(target);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Starter Plan Builder</h3><Pill tone="warn">{t("تحليل فقط — لا ينشئ أو ينشر باقات", "Analysis only — creates/publishes nothing")}</Pill></div>
        <p className="text-xs text-muted-foreground">{t("CX = Standard Cloud · CAX = ARM Cloud · CCX = Dedicated vCPU Cloud (وليس خادماً مخصصاً فعلياً؛ الخوادم الفعلية منتج Hetzner Robot المنفصل).", "CX = Standard Cloud · CAX = ARM Cloud · CCX = Dedicated vCPU Cloud (not a dedicated server; physical servers are the separate Hetzner Robot product).")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <label className="space-y-1"><span className="text-muted-foreground">{t("سعر البيع للمحاكاة (SAR)", "Simulated retail (SAR)")}</span><Input dir="ltr" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
          <label className="space-y-1"><span className="text-muted-foreground">{t("السعر المدخل", "Entered price is")}</span>
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={priceMode} onChange={(e) => setPriceMode(e.target.value as any)}><option value="ex">{t("قبل الضريبة", "Before VAT")}</option><option value="inc">{t("شامل الضريبة", "VAT inclusive")}</option></select></label>
          <label className="space-y-1"><span className="text-muted-foreground">{t("الهامش المستهدف %", "Target margin %")}</span><Input dir="ltr" type="number" step="1" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          <label className="flex items-center gap-2 rounded-lg border p-2.5"><input type="checkbox" checked={ipv4} onChange={(e) => setIpv4(e.target.checked)} />{t("IPv4 مضمّن", "IPv4 included")}</label>
          <label className="flex items-center gap-2 rounded-lg border p-2.5"><input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} />{t("النسخ الاحتياطي مضمّن", "Backups included")}</label>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs" dir="ltr">
          <Pill>Before VAT {f2(exVat)}</Pill><Pill>VAT {(ctx.vat * 100).toFixed(0)}% = {f2(vatAmt)}</Pill><Pill>Customer total {f2(exVat + vatAmt)}</Pill>
          <Pill>1 EUR = {ctx.rate.toFixed(4)} SAR</Pill><Pill>Buffer {ctx.buffer}%</Pill>
        </div>
      </div>

      {CANDIDATES.map((st) => {
        const d = catalog.find((c) => c.provider_id === hz.id && c.kind === "server_type" && c.provider_ref === st)?.data ?? {};
        const rows = locations.map((l) => ({ l, c: ctx.costFor(hz.id, st, l.code, { ipv4, backup }) })).filter((r) => r.c);
        return (
          <div key={st} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-1.5 p-3 border-b text-xs">
              <span className="font-mono font-semibold text-sm uppercase me-1">{st}</span>
              <Pill tone="info">{t(...CATEGORY_LABEL[categoryOf(st)])}</Pill>
              {d.cores != null && <Pill>{d.cores} vCPU</Pill>}{d.memory != null && <Pill>{d.memory} GB RAM</Pill>}{d.disk != null && <Pill>{d.disk} GB NVMe</Pill>}
              {d.architecture && <Pill>{d.architecture}</Pill>}{d.cpu_type && <Pill>CPU: {d.cpu_type}</Pill>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground"><tr>{[t("الموقع", "Location"), "Server €", "IPv4 €", t("نسخ €", "Backup €"), "True €", "True SAR", "Adjusted SAR", t("النقل", "Traffic"), t("تجاوز €/TB", "Overage €/TB"), t("الربح", "Profit"), t("الهامش", "Margin"), t(`سعر لهامش ${target}%`, `Price for ${target}% margin`)].map((c, i) => <th key={i} className="px-2 py-2 text-start whitespace-nowrap">{c}</th>)}</tr></thead>
                <tbody>{rows.map(({ l, c }) => {
                  const m = ctx.margin(exVat, c!.adj); const pfm = ctx.priceForMargin(c!.adj, tgt);
                  return <tr key={l.code} className="border-t" dir="ltr">
                    <td className="px-2 py-1.5 whitespace-nowrap" dir="auto">{t(l.name_ar, l.name_en)}{l.customer_visible === false && <span className="ms-1 text-muted-foreground">({t("مخفي", "hidden")})</span>}</td>
                    <td className="px-2 py-1.5">{f2(c!.server)}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{!ipv4 ? "—" : c!.ipv4 != null ? f2(c!.ipv4) : "Pricing unavailable"}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{!backup ? "—" : c!.backup != null ? f2(c!.backup) : "Pricing unavailable"}</td>
                    <td className="px-2 py-1.5">{f2(c!.raw)}</td><td className="px-2 py-1.5">{f2(c!.sar)}</td><td className="px-2 py-1.5 font-semibold">{f2(c!.adj)}</td>
                    <td className="px-2 py-1.5">{c!.trafficTb != null ? `${c!.trafficTb} TB` : "—"}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{c!.overagePerTb != null ? f2(c!.overagePerTb) : "Overage pricing unavailable"}</td>
                    <td className={`px-2 py-1.5 ${m.profit < 0 ? "text-destructive" : ""}`}>{exVat ? f2(m.profit) : "—"}</td>
                    <td className={`px-2 py-1.5 ${m.pct < 0 ? "text-destructive" : m.pct < ctx.minMargin ? "text-amber-600" : ""}`}>{exVat ? `${m.pct.toFixed(1)}%` : "—"}</td>
                    <td className="px-2 py-1.5">{Number.isFinite(pfm) ? `${f2(pfm)} (+VAT ${f2(pfm * (1 + ctx.vat))})` : "—"}</td>
                  </tr>;
                })}</tbody>
              </table>
              {!rows.length && <p className="p-3 text-xs text-muted-foreground">{t("لا توجد أسعار لهذا النوع؛ نفّذ مزامنة الأسعار", "No prices; run price sync")}</p>}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">{t("الربح والهامش يُحسبان على السعر قبل الضريبة؛ الضريبة لا تدخل في الربح. «سعر لهامش مستهدف» حساب رياضي فقط وليس سعراً موصى به.", "Profit and margin use the price before VAT; VAT is never profit. “Price for target margin” is pure maths, not a recommendation.")}</p>
    </div>
  );
}
