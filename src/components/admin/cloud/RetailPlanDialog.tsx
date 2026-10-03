import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { db, useTable, useInvalidate, cloudApi, Pill, T } from "./adminCloudShared";
import { usePricingContext, categoryOf, CATEGORY_LABEL } from "./pricingShared";

/** Create/edit a retail plan backed by a provider server type. Specs come from the catalog; admin sets only commercial fields. */
export default function RetailPlanDialog({ open, onClose, t, providerId, serverType, plan }: {
  open: boolean; onClose: () => void; t: T; providerId: string; serverType: string; plan?: any;
}) {
  const ctx = usePricingContext();
  const inv = useInvalidate();
  const { data: catalog = [] } = useTable("cloud_provider_catalog", "synced_at");
  const { data: locations = [] } = useTable("cloud_locations", "sort_order", true);
  const { data: locPrices = [] } = useTable("cloud_plan_location_prices", "location_code", true);
  const item = catalog.find((c) => c.provider_id === providerId && c.kind === "server_type" && c.provider_ref === serverType);
  const d = item?.data ?? {};
  const [f, setF] = useState<any>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (plan) {
      const lp = Object.fromEntries(locPrices.filter((x) => x.plan_id === plan.id).map((x) => [x.location_code, x.monthly_price]));
      setF({ name_ar: plan.name_ar, name_en: plan.name_en, code: plan.code, pricing_mode: plan.pricing_mode ?? "same", monthly_price: plan.monthly_price, loc_prices: lp,
        locations: plan.location_codes ?? [], billing_cycles: (plan.billing_cycles ?? ["monthly"]).join(", "), featured: plan.featured, status: plan.status, traffic_tb: plan.traffic_tb, ipv4_mode: plan.ipv4_mode ?? "included", ipv4_retail_price: plan.ipv4_retail_price ?? "", retail_backup_price: plan.retail_backup_price ?? "" });
    } else setF({ name_ar: "", name_en: "", code: serverType, pricing_mode: "same", monthly_price: "", loc_prices: {}, locations: [], billing_cycles: "monthly", featured: false, status: "hidden", traffic_tb: null, ipv4_mode: "included", ipv4_retail_price: "", retail_backup_price: "" });
  }, [open, plan?.id, serverType]);

  // Internal locations where this provider type is sold
  const opts = { ipv4: f.ipv4_mode === "included" };
  const avail = locations.filter((l) => ctx.costFor(providerId, serverType, l.code));
  const retailFor = (code: string) => Number(f.pricing_mode === "location" ? f.loc_prices?.[code] : f.monthly_price) || 0;

  const save = async () => {
    if (!f.name_ar?.trim() || !f.name_en?.trim() || !f.code?.trim()) return toast.error(t("أكمل الاسم والرمز", "Name and code required"));
    if (!f.locations.length) return toast.error(t("اختر موقعاً واحداً على الأقل", "Select at least one location"));
    if (f.pricing_mode === "same" && !(Number(f.monthly_price) > 0)) return toast.error(t("أدخل سعر البيع", "Enter retail price"));
    if (f.ipv4_mode === "optional" && !(Number(f.ipv4_retail_price) > 0)) return toast.error(t("أدخل سعر إضافة IPv4", "Enter IPv4 add-on price"));
    if (f.pricing_mode === "location" && f.locations.some((c: string) => !(Number(f.loc_prices?.[c]) > 0))) return toast.error(t("أدخل سعراً لكل موقع مفعّل", "Enter a price for each enabled location"));
    const traffic = d.prices?.[0]?.included_traffic ? Number(d.prices[0].included_traffic) / 1099511627776 : f.traffic_tb;
    const row: any = {
      name_ar: f.name_ar.trim(), name_en: f.name_en.trim(), code: f.code.trim(), server_type: "vps", category: categoryOf(serverType),
      vcpu: d.cores ?? null, ram_gb: Math.round(Number(d.memory ?? 0)), storage_gb: Number(d.disk ?? 0), disk_type: "NVMe SSD", cpu_type: d.cpu_type ?? null, architecture: d.architecture ?? "x86",
      traffic_tb: traffic ?? null, pricing_mode: f.pricing_mode,
      monthly_price: f.pricing_mode === "same" ? Number(f.monthly_price) : Math.min(...f.locations.map((c: string) => Number(f.loc_prices[c]))),
      setup_fee: 0, location_codes: f.locations, billing_cycles: String(f.billing_cycles).split(",").map((x) => x.trim()).filter(Boolean),
      featured: !!f.featured, status: f.status, is_active: f.status === "active",
      ipv4_mode: f.ipv4_mode, ipv4_included: f.ipv4_mode === "included", ipv6_included: true,
      ipv4_retail_price: f.ipv4_mode === "optional" ? Number(f.ipv4_retail_price) : null, retail_backup_price: f.retail_backup_price === "" ? null : Number(f.retail_backup_price),
    };
    setBusy(true);
    const res = plan ? await db.from("cloud_plans").update(row).eq("id", plan.id).select("id").single() : await db.from("cloud_plans").insert(row).select("id").single();
    if (res.error) { setBusy(false); return toast.error(res.error.message); }
    const id = res.data.id;
    await db.from("cloud_plan_costs").upsert({ plan_id: id, provider_id: providerId, provider_ref: serverType, infra_cost: Math.max(0, ...f.locations.map((c: string) => ctx.costFor(providerId, serverType, c, opts)?.adj ?? 0)), pricing_mode: "manual", updated_at: new Date().toISOString() });
    await db.from("cloud_plan_location_prices").delete().eq("plan_id", id);
    if (f.pricing_mode === "location") await db.from("cloud_plan_location_prices").insert(f.locations.map((c: string) => ({ plan_id: id, location_code: c, monthly_price: Number(f.loc_prices[c]) })));
    await cloudApi({ action: "admin_check_margins" });
    setBusy(false); toast.success(t("تم الحفظ", "Saved")); inv(); onClose();
  };

  const toggleLoc = (c: string) => setF({ ...f, locations: f.locations.includes(c) ? f.locations.filter((x: string) => x !== c) : [...f.locations, c] });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{plan ? t("تعديل باقة بيع", "Edit retail plan") : t("إنشاء باقة بيع", "Create retail plan")} · <span className="font-mono">{serverType}</span></DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Pill tone="info">{t(...CATEGORY_LABEL[categoryOf(serverType)])}</Pill>
          <Pill>{d.cores} vCPU</Pill><Pill>{d.memory} GB RAM</Pill><Pill>{d.disk} GB NVMe</Pill><Pill>{d.architecture}</Pill><Pill>{d.cpu_type}</Pill>
          <Pill>1 EUR = {ctx.rate.toFixed(4)} SAR</Pill><Pill>{t("هامش أمان", "Buffer")} {ctx.buffer}%</Pill>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[["name_ar", t("اسم الباقة بالعربية", "Arabic name")], ["name_en", t("اسم الباقة بالإنجليزية", "English name")], ["code", t("الرمز الداخلي", "Internal code")], ["billing_cycles", t("دورات الفوترة", "Billing cycles")]].map(([k, l]) => (
            <label key={k} className="text-xs space-y-1"><span className="text-muted-foreground">{l}</span><Input dir={k === "name_ar" ? undefined : "ltr"} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>))}
          <label className="text-xs space-y-1"><span className="text-muted-foreground">{t("نموذج التسعير", "Pricing mode")}</span>
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={f.pricing_mode} onChange={(e) => setF({ ...f, pricing_mode: e.target.value })}>
              <option value="same">{t("نفس السعر لكل المواقع", "Same retail price")}</option><option value="location">{t("سعر حسب الموقع", "Location-based price")}</option></select></label>
          {f.pricing_mode === "same" && <label className="text-xs space-y-1"><span className="text-muted-foreground">{t("سعر البيع الشهري قبل الضريبة (SAR)", "Retail monthly excl. VAT (SAR)")}</span><Input dir="ltr" type="number" step="0.01" value={f.monthly_price ?? ""} onChange={(e) => setF({ ...f, monthly_price: e.target.value })} /></label>}
          <label className="text-xs space-y-1"><span className="text-muted-foreground">{t("الظهور", "Visibility")}</span>
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{["hidden", "active", "out_of_stock", "disabled"].map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="text-xs space-y-1"><span className="text-muted-foreground">IPv4</span>
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={f.ipv4_mode} onChange={(e) => setF({ ...f, ipv4_mode: e.target.value })}>
              <option value="included">{t("مضمّن (تُضاف تكلفته للباقة)", "Included (cost added)")}</option><option value="optional">{t("اختياري (سعر إضافة منفصل)", "Optional (separate add-on)")}</option><option value="not_available">{t("غير متاح", "Not available")}</option></select></label>
          {f.ipv4_mode === "optional" && <label className="text-xs space-y-1"><span className="text-muted-foreground">{t("سعر إضافة IPv4 للعميل (SAR/شهر)", "IPv4 add-on retail (SAR/mo)")}</span><Input dir="ltr" type="number" step="0.01" value={f.ipv4_retail_price ?? ""} onChange={(e) => setF({ ...f, ipv4_retail_price: e.target.value })} /></label>}
          <label className="text-xs space-y-1"><span className="text-muted-foreground">{t("سعر النسخ الاحتياطي للعميل (SAR/شهر) — مستقل عن تكلفة المزود", "Retail backup price (SAR/mo) — independent of provider cost")}</span><Input dir="ltr" type="number" step="0.01" value={f.retail_backup_price ?? ""} onChange={(e) => setF({ ...f, retail_backup_price: e.target.value })} /></label>
          <label className="flex items-center justify-between rounded-lg border p-2.5 text-xs"><span>{t("مميزة", "Featured")}</span><Switch checked={!!f.featured} onCheckedChange={(c) => setF({ ...f, featured: c })} /></label>
        </div>

        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{["", t("الموقع", "Location"), t("الخادم", "Server"), "IPv4", t("خام EUR", "Raw EUR"), t("النقل", "Traffic"), t("محوّل", "Converted"), t("بعد الهامش", "Adjusted"), t("سعر البيع", "Retail"), t("شامل الضريبة", "Incl. VAT"), t("الربح", "Profit"), t("الهامش", "Margin")].map((c, i) => <th key={i} className="px-2 py-2 text-start whitespace-nowrap">{c}</th>)}</tr></thead>
            <tbody>{avail.map((l) => {
              const c = ctx.costFor(providerId, serverType, l.code, opts)!; const on = f.locations?.includes(l.code); const r = retailFor(l.code); const m = ctx.margin(r, c.adj);
              const warn = r > 0 && (m.pct < 0 ? "bad" : m.pct < ctx.minMargin ? "warn" : null);
              return <tr key={l.code} className="border-t">
                <td className="px-2 py-1.5"><input type="checkbox" checked={!!on} onChange={() => toggleLoc(l.code)} aria-label={l.code} /></td>
                <td className="px-2 py-1.5 whitespace-nowrap">{t(l.name_ar, l.name_en)}</td>
                <td className="px-2 py-1.5" dir="ltr">€{c.server.toFixed(2)}</td><td className="px-2 py-1.5 whitespace-nowrap" dir="ltr">{f.ipv4_mode !== "included" ? "—" : c.ipv4 != null ? `€${c.ipv4.toFixed(2)}` : "Pricing unavailable"}</td><td className="px-2 py-1.5" dir="ltr">€{c.raw.toFixed(2)}</td><td className="px-2 py-1.5" dir="ltr">{c.trafficTb != null ? `${c.trafficTb} TB` : "—"}</td><td className="px-2 py-1.5" dir="ltr">{c.sar.toFixed(2)}</td><td className="px-2 py-1.5" dir="ltr">{c.adj.toFixed(2)}</td>
                <td className="px-2 py-1.5">{f.pricing_mode === "location" ? <Input dir="ltr" type="number" step="0.01" className="h-8 w-24" disabled={!on} value={f.loc_prices?.[l.code] ?? ""} onChange={(e) => setF({ ...f, loc_prices: { ...f.loc_prices, [l.code]: e.target.value } })} /> : <span dir="ltr">{r ? r.toFixed(2) : "—"}</span>}</td>
                <td className="px-2 py-1.5" dir="ltr">{r ? (r * (1 + ctx.vat)).toFixed(2) : "—"}</td>
                <td className={`px-2 py-1.5 ${m.profit < 0 ? "text-destructive" : ""}`} dir="ltr">{r ? m.profit.toFixed(2) : "—"}</td>
                <td className="px-2 py-1.5">{r ? <span className="inline-flex items-center gap-1">{warn && <AlertTriangle className={`w-3.5 h-3.5 ${warn === "bad" ? "text-destructive" : "text-amber-500"}`} />}<span dir="ltr">{m.pct.toFixed(1)}%</span></span> : "—"}</td>
              </tr>;
            })}</tbody>
          </table>
          {!avail.length && <p className="p-4 text-xs text-muted-foreground">{t("هذا النوع غير متاح في أي موقع داخلي مربوط.", "Not available in any mapped internal location.")}</p>}
        </div>
        <p className="text-xs text-muted-foreground">{t(`الهامش = (سعر البيع − التكلفة بعد هامش الأمان) ÷ سعر البيع. تنبيه تحت ${ctx.minMargin}%. لا يرى العميل أي تكلفة أو مزود.`, `Margin = (retail − adjusted cost) ÷ retail. Warning below ${ctx.minMargin}%. Customers never see costs or provider.`)}</p>
        <DialogFooter><Button onClick={save} disabled={busy}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{t("حفظ", "Save")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
