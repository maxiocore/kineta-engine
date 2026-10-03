import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { db, useTable, useInvalidate, DataTable, Pill, toneOf, dt, money, CrudSection, T } from "./adminCloudShared";

export function LocationsSection({ t }: { t: T }) {
  return <CrudSection table="cloud_locations" t={t} title={t("المواقع", "Locations")} defaults={{ is_active: false, sort_order: 0 }}
    cols={[t("الرمز", "Code"), t("الاسم", "Name"), t("الدولة/المدينة", "Country/City"), "Cloud", "Dedicated", t("الحالة", "Status")]}
    render={(r) => [<span className="font-mono text-xs">{r.code}</span>, `${r.name_ar} / ${r.name_en}`, `${r.country ?? "—"} · ${r.city ?? "—"}`, r.cloud_available ? "✓" : "—", r.dedicated_available ? "✓" : "—", <Pill tone={r.is_active ? "good" : "muted"}>{r.is_active ? "active" : "inactive"}</Pill>]}
    fields={[{ k: "code", label: t("الرمز الداخلي", "Internal code"), ltr: true, required: true }, { k: "name_ar", label: t("الاسم بالعربية", "Arabic name"), required: true }, { k: "name_en", label: t("الاسم بالإنجليزية", "English name"), required: true },
      { k: "country", label: t("الدولة", "Country") }, { k: "city", label: t("المدينة", "City") }, { k: "sort_order", label: t("الترتيب", "Sort"), type: "number" },
      { k: "cloud_available", label: "Cloud", type: "bool" }, { k: "dedicated_available", label: "Dedicated", type: "bool" }, { k: "is_active", label: t("نشط", "Active"), type: "bool" }]} />;
}

export function ImagesSection({ t }: { t: T }) {
  return <CrudSection table="cloud_images" t={t} title={t("أنظمة التشغيل", "Operating systems")} defaults={{ is_active: false, sort_order: 0 }}
    cols={[t("الرمز", "Code"), t("الاسم", "Name"), t("التوزيعة", "Distribution"), t("الإصدار", "Version"), t("المعمارية", "Arch"), "Cloud", "Dedicated", t("الحالة", "Status")]}
    render={(r) => [<span className="font-mono text-xs">{r.code}</span>, `${r.name_ar ?? r.name} / ${r.name}`, r.family, r.version ?? "—", r.architecture ?? "—", r.cloud_supported ? "✓" : "—", r.dedicated_supported ? "✓" : "—", <Pill tone={r.is_active ? "good" : "muted"}>{r.is_active ? "active" : "inactive"}</Pill>]}
    fields={[{ k: "code", label: t("الرمز الداخلي", "Internal code"), ltr: true, required: true }, { k: "name_ar", label: t("الاسم بالعربية", "Arabic name") }, { k: "name", label: t("الاسم بالإنجليزية", "English name"), required: true },
      { k: "family", label: t("التوزيعة", "Distribution"), ltr: true, required: true }, { k: "version", label: t("الإصدار", "Version"), ltr: true },
      { k: "architecture", label: t("المعمارية", "Architecture"), type: "select", options: [{ v: "x86", l: "x86" }, { v: "arm", l: "ARM" }] }, { k: "sort_order", label: t("الترتيب", "Sort"), type: "number" },
      { k: "cloud_supported", label: "Cloud", type: "bool" }, { k: "dedicated_supported", label: "Dedicated", type: "bool" }, { k: "is_active", label: t("نشط", "Active"), type: "bool" }]} />;
}

export function MappingsSection({ t }: { t: T }) {
  const { data: maps = [] } = useTable("cloud_resource_mappings", "kind", true);
  const { data: providers = [] } = useTable("cloud_providers", "code", true);
  const inv = useInvalidate();
  const del = async (id: string) => { await db.from("cloud_resource_mappings").delete().eq("id", id); inv(); };
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{t("ربط الموارد بالمزود (إدارة فقط)", "Provider resource mappings (admin only)")}</h3>
      <DataTable empty={t("لا يوجد ربط. اربط المواقع والأنظمة من كتالوج المزود.", "No mappings. Map from the provider catalog.")}
        cols={[t("النوع", "Kind"), t("الرمز الداخلي", "Internal code"), t("المزود", "Provider"), "Provider ID", ""]}
        rows={maps.map((m) => [m.kind, <span className="font-mono text-xs">{m.code}</span>, providers.find((p) => p.id === m.provider_id)?.name, <span className="font-mono text-xs">{m.provider_ref}</span>, <Button size="sm" variant="ghost" onClick={() => del(m.id)}>✕</Button>])} />
    </div>
  );
}

export function NetworksSection({ t }: { t: T }) {
  const { data: ips = [] } = useTable("cloud_server_ips");
  return <DataTable empty={t("لا توجد عناوين IP", "No IP addresses")} cols={["IP", t("الإصدار", "Version"), t("أساسي", "Primary"), t("الخادم", "Server"), "rDNS"]}
    rows={ips.map((i) => [<span dir="ltr" className="font-mono text-xs">{i.ip}</span>, `IPv${i.version}`, i.is_primary ? "✓" : "", <span className="font-mono text-xs">{i.server_id.slice(0, 8)}</span>, i.reverse_dns ?? "—"])} />;
}

export function BackupsSnapshotsSection({ t, lang, table }: { t: T; lang: string; table: "cloud_backups" | "cloud_snapshots" }) {
  const { data = [] } = useTable(table);
  const inv = useInvalidate();
  const set = async (id: string, status: string) => { await db.from(table).update({ status }).eq("id", id); inv(); };
  return <DataTable empty={t("لا توجد بيانات", "No data")} cols={[...(table === "cloud_snapshots" ? [t("الاسم", "Name")] : []), t("الخادم", "Server"), t("الحالة", "Status"), "GB", t("التاريخ", "Date"), ""]}
    rows={data.map((r) => [...(table === "cloud_snapshots" ? [r.name] : []), <span className="font-mono text-xs">{r.server_id.slice(0, 8)}</span>, <Pill tone={toneOf(r.status)}>{r.status}</Pill>, r.size_gb ?? "—", dt(r.created_at, lang),
      r.status === "pending" ? <div className="flex gap-1"><Button size="sm" onClick={() => set(r.id, "completed")}>{t("مكتمل", "Complete")}</Button><Button size="sm" variant="outline" onClick={() => set(r.id, "failed")}>{t("فشل", "Failed")}</Button></div> : null])} />;
}

export function BillingSection({ t, lang }: { t: T; lang: string }) {
  const { data: orders = [] } = useTable("cloud_orders");
  const { data: servers = [] } = useTable("cloud_servers");
  const subs = servers.filter((s) => !["cancelled"].includes(s.status));
  const paid = orders.filter((o) => !["refunded", "cancelled", "pending_payment"].includes(o.status));
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{t("إجمالي المحصّل (شامل الضريبة)", "Collected (incl. VAT)")}</p><p className="text-xl font-bold">{money(paid.reduce((a, o) => a + Number(o.total), 0), lang)}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{t("ضريبة محصلة", "VAT collected")}</p><p className="text-xl font-bold">{money(paid.reduce((a, o) => a + Number(o.vat_amount), 0), lang)}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{t("اشتراكات قائمة", "Active subscriptions")}</p><p className="text-xl font-bold">{subs.length}</p></div>
      </div>
      <DataTable empty={t("لا توجد اشتراكات", "No subscriptions")} cols={[t("الخادم", "Server"), t("الحالة", "Status"), t("الشهري", "Monthly"), t("التجديد", "Renewal")]}
        rows={subs.map((s) => [<span dir="ltr">{s.name}</span>, <Pill tone={toneOf(s.status)}>{s.status}</Pill>, money(s.monthly_price, lang), s.renewal_date ?? "—"])} />
    </div>
  );
}

export function ActivitySection({ t, lang }: { t: T; lang: string }) {
  const { data = [] } = useTable("cloud_activity_logs");
  const [q, setQ] = useState("");
  const rows = data.filter((l) => !q || l.event.includes(q) || (l.server_id ?? "").startsWith(q));
  return (
    <div className="space-y-2">
      <Input placeholder={t("بحث بالحدث أو معرف الخادم", "Search event or server ID")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <DataTable empty={t("لا يوجد سجل", "No logs")} cols={[t("الحدث", "Event"), t("الخادم", "Server"), t("التفاصيل", "Details"), t("التاريخ", "Date")]}
        rows={rows.slice(0, 300).map((l) => [<span className="font-mono text-xs">{l.event}</span>, <span className="font-mono text-xs">{l.server_id?.slice(0, 8) ?? "—"}</span>, <span className="font-mono text-[11px]">{JSON.stringify(l.details).slice(0, 120)}</span>, dt(l.created_at, lang)])} />
    </div>
  );
}

export function SettingsSection({ t }: { t: T }) {
  const { data = [] } = useTable("cloud_billing_settings", "id", true);
  const inv = useInvalidate();
  const s = data[0];
  const [v, setV] = useState<any>(null);
  const cur = v ?? s ?? {};
  const save = async () => {
    const vat = Number(cur.vat_rate), bk = Number(cur.backups_surcharge);
    if (!(vat >= 0 && vat < 1) || !(bk >= 0 && bk < 5)) return toast.error(t("قيم غير صالحة", "Invalid values"));
    const { error } = await db.from("cloud_billing_settings").update({ vat_rate: vat, backups_surcharge: bk, updated_at: new Date().toISOString() }).eq("id", 1);
    error ? toast.error(error.message) : (toast.success(t("تم الحفظ", "Saved")), setV(null), inv());
  };
  return (
    <div className="rounded-xl border bg-card p-4 max-w-lg space-y-3">
      <h3 className="font-semibold">{t("إعدادات الفوترة", "Billing settings")}</h3>
      <label className="block text-xs space-y-1"><span className="text-muted-foreground">{t("نسبة ضريبة القيمة المضافة (0.15 = 15%)", "VAT rate (0.15 = 15%)")}</span><Input dir="ltr" type="number" step="0.01" value={cur.vat_rate ?? ""} onChange={(e) => setV({ ...cur, vat_rate: e.target.value })} /></label>
      <label className="block text-xs space-y-1"><span className="text-muted-foreground">{t("رسوم النسخ الاحتياطي (0.2 = 20% من الشهري)", "Backups surcharge (0.2 = 20%)")}</span><Input dir="ltr" type="number" step="0.01" value={cur.backups_surcharge ?? ""} onChange={(e) => setV({ ...cur, backups_surcharge: e.target.value })} /></label>
      <p className="text-xs text-muted-foreground">{t("العملة", "Currency")}: {cur.currency ?? "SAR"}</p>
      <Button onClick={save} disabled={!v}>{t("حفظ", "Save")}</Button>
    </div>
  );
}
