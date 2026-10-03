import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlugZap, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { db, useTable, useInvalidate, DataTable, Pill, toneOf, dt, cloudApi, EditDialog, T } from "./adminCloudShared";

const STATUS_TEXT: Record<string, [string, string]> = {
  connected: ["متصل", "Connected"], auth_failed: ["فشل المصادقة", "Authentication failed"], unavailable: ["المزود غير متاح", "Provider unavailable"],
  config_missing: ["الإعداد مفقود", "Configuration missing"], not_supported: ["غير مدعوم بعد", "Not supported yet"],
};

export default function ProvidersSection({ t, lang }: { t: T; lang: string }) {
  const { data: providers = [] } = useTable("cloud_providers", "code", true);
  const { data: catalog = [] } = useTable("cloud_provider_catalog", "synced_at");
  const inv = useInvalidate();
  const [busy, setBusy] = useState<string | null>(null);
  const [kind, setKind] = useState("server_type");
  const [mk, setMk] = useState<any>(null);

  const test = async (id: string) => {
    setBusy(id + "test"); const r = await cloudApi({ action: "admin_test_provider", provider_id: id }); setBusy(null); inv();
    const s = STATUS_TEXT[r?.status] ?? ["خطأ", "Error"];
    r?.status === "connected" ? toast.success(t(s[0], s[1])) : toast.error(t(s[0], s[1]));
  };
  const sync = async (id: string, k: string) => {
    setBusy(id + k); const r = await cloudApi({ action: "admin_sync", provider_id: id, kind: k }); setBusy(null); inv();
    r?.ok ? toast.success(t(`تمت المزامنة: ${r.count}`, `Synced: ${r.count}`)) : toast.error(t("فشلت المزامنة", "Sync failed") + ` (${r?.error ?? "error"})`);
  };
  const setStatus = async (id: string, status: string) => { await db.from("cloud_providers").update({ status }).eq("id", id); inv(); };

  const createPlan = async (v: any) => {
    const c = mk.item; const d = c.data ?? {};
    const row = { code: v.code, name_ar: v.name_ar, name_en: v.name_en, server_type: "vps", vcpu: d.cores ?? null, ram_gb: Math.round(Number(d.memory ?? 0)), storage_gb: Number(d.disk ?? 0),
      cpu_type: d.cpu_type ?? null, architecture: d.architecture ?? "x86", monthly_price: Number(v.monthly_price), setup_fee: 0, status: v.status ?? "hidden", is_active: v.status === "active",
      featured: !!v.featured, billing_cycles: v.billing_cycles?.length ? v.billing_cycles : ["monthly"], location_codes: v.location_codes ?? [] };
    const res = await db.from("cloud_plans").insert(row).select("id").single();
    if (res.error) { toast.error(res.error.message); return false; }
    const monthly = (d.prices ?? [])[0]?.price_monthly?.gross;
    await db.from("cloud_plan_costs").upsert({ plan_id: res.data.id, provider_id: c.provider_id, provider_ref: c.provider_ref, infra_cost: Number(v.infra_cost ?? 0), pricing_mode: "manual" });
    toast.success(t("أُنشئت الباقة (مخفية حتى تفعيلها)", "Plan created")); inv(); return true;
  };
  const mapItem = async (c: any) => {
    const code = prompt(t("الرمز الداخلي لربط هذا العنصر (مثلاً fsn1 أو ubuntu-24.04)", "Internal code to map (e.g. fsn1, ubuntu-24.04)"));
    if (!code) return;
    const { error } = await db.from("cloud_resource_mappings").upsert({ kind: c.kind, code, provider_id: c.provider_id, provider_ref: c.provider_ref }, { onConflict: "kind,code,provider_id" });
    error ? toast.error(error.message) : toast.success(t("تم الربط", "Mapped"));
  };

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-3">
        {providers.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2"><b>{p.name}</b>
              <select className="h-8 rounded-md border bg-background px-2 text-xs" value={p.status} onChange={(e) => setStatus(p.id, e.target.value)}>{["enabled", "disabled", "maintenance"].map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>{t("النوع", "Type")}: <span className="font-mono">{p.type}</span></p>
              <p>{t("آخر فحص", "Last health check")}: {dt(p.last_health_check, lang)}</p>
              <p>{t("آخر اتصال ناجح", "Last connected")}: {dt(p.last_success_at, lang)}</p>
              {p.last_error && <p>{t("آخر خطأ", "Last error")}: <Pill tone="bad">{STATUS_TEXT[p.last_error] ? t(...STATUS_TEXT[p.last_error]) : p.last_error}</Pill></p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" onClick={() => test(p.id)} disabled={!!busy}>{busy === p.id + "test" ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlugZap className="w-3 h-3" />}{t("اختبار الاتصال", "Test connection")}</Button>
              {p.code === "hetzner_cloud" && ["server_type", "location", "image", "server"].map((k) => (
                <Button key={k} size="sm" variant="outline" disabled={!!busy} onClick={() => sync(p.id, k)}>{busy === p.id + k ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}Sync {k}</Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("بيانات الاعتماد تُقرأ من إعدادات الخادم فقط (HETZNER_CLOUD_API_TOKEN) ولا تُعرض أو تُخزن في المتصفح.", "Credentials are read server-side only (HETZNER_CLOUD_API_TOKEN) and never shown in the browser.")}</p>

      <section className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold">{t("كتالوج المزود الداخلي", "Provider catalog")}</h3>
          {["server_type", "location", "image", "server"].map((k) => <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>{k} ({catalog.filter((c) => c.kind === k).length})</Button>)}</div>
        <DataTable empty={t("لا توجد بيانات؛ نفّذ المزامنة بعد ربط المزود", "Empty; run sync after connecting the provider")}
          cols={["Ref", t("الاسم", "Name"), t("البيانات", "Data"), t("آخر مزامنة", "Synced"), ""]}
          rows={catalog.filter((c) => c.kind === kind).map((c) => [<span className="font-mono text-xs">{c.provider_ref}</span>, c.name, <span className="font-mono text-[11px] whitespace-normal break-all line-clamp-2 max-w-md inline-block">{JSON.stringify({ ...c.data, prices: undefined })}</span>, dt(c.synced_at, lang),
            kind === "server_type" ? <Button size="sm" onClick={() => setMk({ item: c, init: { code: c.provider_ref, name_ar: "", name_en: c.provider_ref.toUpperCase(), status: "hidden", billing_cycles: ["monthly"] } })}><Plus className="w-3 h-3" />{t("إنشاء باقة بيع", "Create retail plan")}</Button>
              : ["location", "image"].includes(kind) ? <Button size="sm" variant="outline" onClick={() => mapItem(c)}>{t("ربط برمز داخلي", "Map to internal code")}</Button> : null])} />
      </section>

      <EditDialog open={!!mk} onOpenChange={(o) => !o && setMk(null)} title={t("إنشاء باقة بيع", "Create retail plan")} initial={mk?.init ?? {}} onSave={createPlan} t={t}
        fields={[{ k: "name_ar", label: t("الاسم بالعربية", "Arabic name"), required: true }, { k: "name_en", label: t("الاسم بالإنجليزية", "English name"), required: true }, { k: "code", label: t("الرمز", "Code"), ltr: true, required: true },
          { k: "infra_cost", label: t("تكلفة المزود الشهرية (ر.س)", "Provider monthly cost (SAR)"), type: "number" }, { k: "monthly_price", label: t("سعر البيع قبل الضريبة", "Retail price excl. VAT"), type: "number", required: true },
          { k: "location_codes", label: t("المواقع", "Locations"), type: "list", ltr: true }, { k: "billing_cycles", label: t("دورات الفوترة", "Billing cycles"), type: "list", ltr: true },
          { k: "status", label: t("الإتاحة", "Availability"), type: "select", options: ["active", "hidden", "out_of_stock", "disabled"].map((v) => ({ v, l: v })) }, { k: "featured", label: t("مميزة", "Featured"), type: "bool" }]} />
    </div>
  );
}
