import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import RetailPlanDialog from "./RetailPlanDialog";
import { usePricingContext, CATEGORY_LABEL } from "./pricingShared";
import { db, useTable, useInvalidate, DataTable, Pill, toneOf, money, EditDialog, Field, T } from "./adminCloudShared";

export const pricing = (retail: number, cost: number, vat: number) => {
  const profit = retail - cost;
  return { profit, margin: retail ? (profit / retail) * 100 : 0, incl: retail * (1 + vat) };
};

export default function PlansSection({ t, lang, type }: { t: T; lang: string; type: "vps" | "dedicated" }) {
  const { data: plans = [] } = useTable("cloud_plans", "sort_order", true);
  const { data: costs = [] } = useTable("cloud_plan_costs", "updated_at");
  const { data: providers = [] } = useTable("cloud_providers", "code", true);
  const { data: locs = [] } = useTable("cloud_locations", "sort_order", true);
  const { data: billing = [] } = useTable("cloud_billing_settings", "id", true);
  const vat = Number(billing[0]?.vat_rate ?? 0.15);
  const inv = useInvalidate();
  const [edit, setEdit] = useState<any>(null);
  const [rp, setRp] = useState<any>(null);
  const ctx = usePricingContext();
  const list = plans.filter((p) => p.server_type === type);
  const costOf = (id: string) => costs.find((c) => c.plan_id === id);

  const fields: Field[] = [
    { k: "name_ar", label: t("الاسم بالعربية", "Arabic name"), required: true }, { k: "name_en", label: t("الاسم بالإنجليزية", "English name"), required: true },
    { k: "code", label: t("الرمز الداخلي", "Internal code"), ltr: true, required: true },
    { k: "provider_id", label: t("المزود", "Provider"), type: "select", options: providers.map((p) => ({ v: p.id, l: p.name })) },
    { k: "provider_ref", label: type === "vps" ? "Provider Server Type ID" : "Provider Product ID", ltr: true },
    ...(type === "vps"
      ? [{ k: "cpu_type", label: t("نوع المعالج", "CPU type"), type: "select", options: [{ v: "shared", l: "Shared" }, { v: "dedicated", l: "Dedicated" }] }, { k: "vcpu", label: "vCPU", type: "number" }] as Field[]
      : [{ k: "cpu_model", label: "CPU", ltr: true }, { k: "cores", label: "Cores", type: "number" }, { k: "threads", label: "Threads", type: "number" }, { k: "disk_count", label: t("عدد الأقراص", "Disks"), type: "number" }, { k: "network", label: t("الشبكة", "Network"), ltr: true }] as Field[]),
    { k: "ram_gb", label: "RAM GB", type: "number" }, { k: "storage_gb", label: t("التخزين GB", "Storage GB"), type: "number" }, { k: "disk_type", label: t("نوع القرص", "Disk type"), ltr: true },
    { k: "architecture", label: t("المعمارية", "Architecture"), type: "select", options: [{ v: "x86", l: "x86" }, { v: "arm", l: "ARM" }] },
    { k: "traffic_tb", label: "Traffic TB", type: "number" }, { k: "ipv4_included", label: "IPv4", type: "bool" }, { k: "ipv6_included", label: "IPv6", type: "bool" },
    { k: "location_codes", label: t("المواقع المتاحة (رموز مفصولة بفواصل)", "Locations (comma codes)"), type: "list", ltr: true },
    { k: "infra_cost", label: t("تكلفة المزود الشهرية", "Provider monthly cost"), type: "number" }, { k: "provider_setup_cost", label: t("تكلفة تجهيز المزود", "Provider setup cost"), type: "number" },
    { k: "monthly_price", label: t("سعر البيع قبل الضريبة", "Retail price excl. VAT"), type: "number", required: true }, { k: "setup_fee", label: t("رسوم التجهيز للعميل", "Retail setup fee"), type: "number" },
    { k: "billing_cycles", label: t("دورات الفوترة (monthly, quarterly, semiannual, annual)", "Billing cycles"), type: "list", ltr: true },
    { k: "status", label: t("الحالة", "Status"), type: "select", options: ["active", "hidden", "out_of_stock", "disabled"].map((v) => ({ v, l: v })) },
    { k: "featured", label: t("مميزة", "Featured"), type: "bool" }, { k: "sort_order", label: t("الترتيب", "Sort order"), type: "number" },
  ];
  const planKeys = fields.map((f) => f.k).filter((k) => !["provider_id", "provider_ref", "infra_cost", "provider_setup_cost"].includes(k));

  const save = async (v: any) => {
    const row: any = Object.fromEntries(planKeys.map((k) => [k, v[k] ?? null]));
    row.server_type = type; row.is_active = row.status === "active";
    ["ram_gb", "storage_gb", "monthly_price", "setup_fee", "sort_order"].forEach((k) => (row[k] = Number(row[k] ?? 0)));
    row.location_codes ??= []; row.billing_cycles = row.billing_cycles?.length ? row.billing_cycles : ["monthly"];
    row.featured = !!row.featured; row.ipv4_included = !!row.ipv4_included; row.ipv6_included = !!row.ipv6_included;
    const res = v.id ? await db.from("cloud_plans").update(row).eq("id", v.id).select("id").single() : await db.from("cloud_plans").insert(row).select("id").single();
    if (res.error) { toast.error(res.error.message); return false; }
    const c = await db.from("cloud_plan_costs").upsert({ plan_id: res.data.id, provider_id: v.provider_id || null, provider_ref: v.provider_ref || null, infra_cost: Number(v.infra_cost ?? 0), provider_setup_cost: Number(v.provider_setup_cost ?? 0), pricing_mode: "manual", updated_at: new Date().toISOString() });
    if (c.error) { toast.error(c.error.message); return false; }
    toast.success(t("تم الحفظ", "Saved")); inv(); return true;
  };
  const del = async (id: string) => { if (!confirm(t("حذف الباقة؟", "Delete plan?"))) return; const { error } = await db.from("cloud_plans").delete().eq("id", id); error ? toast.error(t("مرتبطة بخوادم؛ عطّلها بدلاً من الحذف", "In use; disable instead")) : inv(); };
  const open = (p?: any) => { const c = p && costOf(p.id); if (c?.provider_id && c?.provider_ref && ctx.prices.some((x) => x.server_type === c.provider_ref)) return setRp({ plan: p, c }); openManual(p); };
  const openManual = (p?: any) => setEdit(p ? { ...p, ...(costOf(p.id) ?? {}), id: p.id } : { status: "hidden", architecture: "x86", ipv4_included: true, ipv6_included: true, billing_cycles: ["monthly"], location_codes: [], sort_order: 0, disk_type: "NVMe SSD" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t(`التسعير يدوي. الضريبة ${Math.round(vat * 100)}% من الإعدادات. التكلفة والهامش للإدارة فقط. المواقع المتاحة: `, `Manual pricing. VAT ${Math.round(vat * 100)}% from settings. Costs/margins are admin-only. Locations: `)}<span dir="ltr">{locs.map((l) => l.code).join(", ") || "—"}</span></p>
        <Button size="sm" onClick={() => openManual()}><Plus className="w-4 h-4" />{t("إضافة باقة", "Add plan")}</Button>
      </div>
      <DataTable empty={t("لا توجد باقات. أضف باقات بأسعار حقيقية.", "No plans yet. Add plans with real prices.")}
        cols={[t("الباقة", "Plan"), t("المواصفات", "Specs"), t("التكلفة", "Cost"), t("البيع", "Retail"), t("شامل الضريبة", "Incl. VAT"), t("الربح", "Profit"), t("الهامش", "Margin"), t("الحالة", "Status"), ""]}
        rows={list.map((p) => {
          const pc = costOf(p.id); const live = (p.location_codes ?? []).map((l: string) => ctx.costFor(pc?.provider_id, pc?.provider_ref, l)?.adj).filter((x: any) => x != null) as number[];
          const c = live.length ? Math.max(...live) : Number(pc?.infra_cost ?? 0); const pr = pricing(Number(p.monthly_price), c, vat);
          return [<span>{lang === "ar" ? p.name_ar : p.name_en} {p.featured && <Pill tone="info">★</Pill>}<br /><span className="font-mono text-[11px] text-muted-foreground">{p.code}</span> <Pill>{t(...(CATEGORY_LABEL[p.category] ?? [p.category, p.category]))}</Pill>{p.pricing_mode === "location" && <Pill tone="info">{t("حسب الموقع", "per location")}</Pill>}</span>,
            <span className="text-xs">{p.vcpu ?? p.cpu_model} · {p.ram_gb}GB · {p.storage_gb}GB</span>, money(c, lang), money(p.monthly_price, lang), money(pr.incl, lang),
            <span className={pr.profit < 0 ? "text-destructive" : ""}>{money(pr.profit, lang)}</span>, `${pr.margin.toFixed(1)}%`, <Pill tone={toneOf(p.status === "active" ? "active" : p.status)}>{p.status}</Pill>,
            <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => open(p)} aria-label="edit"><Pencil className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={() => del(p.id)} aria-label="delete"><Trash2 className="w-4 h-4 text-destructive" /></Button></div>];
        })} />
      {rp && <RetailPlanDialog open onClose={() => setRp(null)} t={t} providerId={rp.c.provider_id} serverType={rp.c.provider_ref} plan={rp.plan} />}
      <EditDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={type === "vps" ? "Cloud VPS" : "Dedicated"} fields={fields} initial={edit ?? {}} onSave={save} t={t} />
    </div>
  );
}
