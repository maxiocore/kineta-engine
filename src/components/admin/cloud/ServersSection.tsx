import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db, useTable, useInvalidate, DataTable, Pill, toneOf, money, dt, cloudApi, T } from "./adminCloudShared";

const DESTRUCTIVE = ["stop", "rebuild", "rescue", "suspend", "terminate", "restart"];
const ACTIONS = ["start", "stop", "restart", "rebuild", "rescue", "snapshot", "backup", "suspend", "unsuspend", "terminate"];

export default function ServersSection({ t, lang, statusFilter }: { t: T; lang: string; statusFilter?: string[] }) {
  const { data: servers = [] } = useTable("cloud_servers");
  const { data: plans = [] } = useTable("cloud_plans", "sort_order", true);
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-cloud", "profiles", servers.length],
    enabled: servers.length > 0,
    queryFn: async () => (await db.from("profiles").select("user_id:id, full_name, email").in("id", [...new Set(servers.map((s) => s.user_id))])).data ?? [],
  });
  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [st, setSt] = useState(""); const [prov, setProv] = useState(""); const [loc, setLoc] = useState("");
  const [open, setOpen] = useState<any>(null);
  const prof = (id: string) => profiles.find((p: any) => p.user_id === id);
  const planName = (id: string) => { const p = plans.find((x) => x.id === id); return p ? (lang === "ar" ? p.name_ar : p.name_en) : "—"; };

  const rows = useMemo(() => servers.filter((s) => {
    if (statusFilter && !statusFilter.includes(s.status)) return false;
    if (type && s.server_type !== type) return false; if (st && s.status !== st) return false;
    if (prov && s.provider !== prov) return false; if (loc && s.location_code !== loc) return false;
    if (!q) return true; const p = prof(s.user_id); const n = q.toLowerCase();
    return [s.id, s.name, s.hostname, s.primary_ipv4, s.primary_ipv6, p?.email, p?.full_name].some((x) => x && String(x).toLowerCase().includes(n));
  }), [servers, q, type, st, prov, loc, profiles, statusFilter]);

  const uniq = (k: string) => [...new Set(servers.map((s) => s[k]).filter(Boolean))] as string[];
  const Sel = ({ v, set, opts, ph }: any) => <select className="h-10 rounded-md border bg-background px-2 text-sm" value={v} onChange={(e) => set(e.target.value)}><option value="">{ph}</option>{opts.map((o: string) => <option key={o} value={o}>{o}</option>)}</select>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Input className="col-span-2" placeholder={t("بحث: المعرف، العميل، البريد، IP، Hostname", "Search: ID, customer, email, IP, hostname")} value={q} onChange={(e) => setQ(e.target.value)} />
        <Sel v={type} set={setType} opts={["vps", "dedicated"]} ph={t("النوع", "Type")} />
        <Sel v={st} set={setSt} opts={["pending", "provisioning", "running", "stopped", "suspended", "failed", "cancelled"]} ph={t("الحالة", "Status")} />
        <Sel v={prov} set={setProv} opts={uniq("provider")} ph={t("المزود", "Provider")} />
        <Sel v={loc} set={setLoc} opts={uniq("location_code")} ph={t("الموقع", "Location")} />
      </div>
      <DataTable empty={t("لا توجد خوادم", "No servers")}
        cols={[t("المعرف", "ID"), t("العميل", "Customer"), t("الاسم", "Name"), t("النوع", "Type"), t("الباقة", "Plan"), t("الحالة", "Status"), "IP", t("الموقع", "Location"), t("النظام", "OS"), t("السعر", "Price"), t("المزود", "Provider"), t("الإنشاء", "Created"), t("التجديد", "Renewal")]}
        rows={rows.map((s) => [
          <button className="font-mono text-xs text-primary underline-offset-2 hover:underline" onClick={() => setOpen(s)}>{s.id.slice(0, 8)}</button>,
          <span className="text-xs">{prof(s.user_id)?.full_name ?? "—"}<br /><span className="text-muted-foreground" dir="ltr">{prof(s.user_id)?.email}</span></span>,
          <span dir="ltr">{s.name}</span>, s.server_type, planName(s.plan_id), <Pill tone={toneOf(s.status)}>{s.status}</Pill>,
          <span dir="ltr" className="font-mono text-xs">{s.primary_ipv4 ?? "—"}</span>, s.location_code, s.image_code, money(s.monthly_price, lang), s.provider, dt(s.created_at, lang), s.renewal_date ?? "—",
        ])} />
      {open && <ServerDetails server={servers.find((x) => x.id === open.id) ?? open} onClose={() => setOpen(null)} t={t} lang={lang} customer={prof(open.user_id)} planName={planName(open.plan_id)} />}
    </div>
  );
}

function ServerDetails({ server: s, onClose, t, lang, customer, planName }: any) {
  const inv = useInvalidate();
  const [busy, setBusy] = useState<string | null>(null);
  const { data: cost } = useQuery({ queryKey: ["admin-cloud", "cost", s.plan_id], queryFn: async () => (await db.from("cloud_plan_costs").select("*").eq("plan_id", s.plan_id).maybeSingle()).data });
  const q = (table: string) => useQuery({ queryKey: ["admin-cloud", table, s.id], queryFn: async () => (await db.from(table).select("*").eq("server_id", s.id).order("created_at", { ascending: false })).data ?? [] });
  const ips = q("cloud_server_ips"), backups = q("cloud_backups"), snaps = q("cloud_snapshots"), acts = q("cloud_server_actions"), logs = q("cloud_activity_logs"), orders = q("cloud_orders");
  const infra = Number(cost?.infra_cost ?? 0); const margin = Number(s.monthly_price) - infra;

  const run = async (a: string) => {
    if (DESTRUCTIVE.includes(a) && !confirm(t(`تأكيد تنفيذ «${a}» على ${s.name}؟`, `Confirm "${a}" on ${s.name}?`))) return;
    let payload: any = {};
    if (a === "snapshot") { const n = prompt(t("اسم اللقطة", "Snapshot name")); if (!n) return; payload = { name: n }; }
    if (a === "rebuild") { const im = prompt(t("معرف النظام لدى المزود", "Provider image ID")); if (!im) return; payload = { image: im }; }
    if (a === "suspend") payload = { reason: prompt(t("سبب الإيقاف", "Suspension reason")) ?? "" };
    if (a === "terminate" && prompt(t("اكتب اسم الخادم للتأكيد", "Type server name to confirm")) !== s.name) return toast.error(t("الاسم غير مطابق", "Name mismatch"));
    setBusy(a); const r = await cloudApi({ action: "admin_server_action", server_id: s.id, type: a, payload }); setBusy(null);
    r?.ok ? toast.success(r.status === "requested" ? t("سُجّل للتنفيذ اليدوي", "Queued for manual fulfilment") : t("تم التنفيذ", "Done")) : toast.error(t("فشل التنفيذ", "Failed") + (r?.error ? ` (${r.error})` : ""));
    inv();
  };
  const Row = ({ k, v }: any) => <div className="flex justify-between gap-3 py-1.5 border-b text-sm"><span className="text-muted-foreground">{k}</span><span className="text-end break-all">{v ?? "—"}</span></div>;
  const List = ({ rows, cols }: any) => <DataTable cols={cols} rows={rows} empty={t("لا توجد بيانات", "No data")} />;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2 flex-wrap"><span dir="ltr">{s.name}</span><Pill tone={toneOf(s.status)}>{s.status}</Pill></DialogTitle></DialogHeader>
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">{["overview", "provider", "networking", "backups", "snapshots", "billing", "actions", "activity", "security"].map((k) => <TabsTrigger key={k} value={k}>{k}</TabsTrigger>)}</TabsList>
          <TabsContent value="overview" className="grid sm:grid-cols-2 gap-x-6">
            <Row k={t("العميل", "Customer")} v={`${customer?.full_name ?? ""} ${customer?.email ?? ""}`} /><Row k={t("المعرف الداخلي", "Internal ID")} v={<span className="font-mono text-xs">{s.id}</span>} />
            <Row k={t("النوع", "Type")} v={s.server_type} /><Row k={t("الباقة", "Plan")} v={planName} /><Row k={t("الموقع", "Location")} v={s.location_code} />
            <Row k="CPU" v={s.specs?.vcpu ?? s.specs?.cpu_model} /><Row k="RAM" v={s.specs?.ram_gb && `${s.specs.ram_gb} GB`} /><Row k={t("التخزين", "Storage")} v={s.specs?.storage_gb && `${s.specs.storage_gb} GB`} />
            <Row k="OS" v={s.image_code} /><Row k="IPv4" v={s.primary_ipv4} /><Row k="IPv6" v={s.primary_ipv6} /><Row k={t("الإنشاء", "Created")} v={dt(s.created_at, lang)} /><Row k={t("التجديد", "Renewal")} v={s.renewal_date} />
          </TabsContent>
          <TabsContent value="provider"><Row k={t("المزود", "Provider")} v={s.provider} /><Row k="Provider Resource ID" v={s.provider_server_id} /><Row k="Provider Type" v={cost?.provider_ref} /></TabsContent>
          <TabsContent value="networking"><List cols={["IP", "v", t("أساسي", "Primary"), "rDNS"]} rows={(ips.data ?? []).map((i: any) => [i.ip, i.version, i.is_primary ? "✓" : "", i.reverse_dns ?? "—"])} /></TabsContent>
          <TabsContent value="backups"><List cols={[t("الحالة", "Status"), "GB", t("التاريخ", "Date")]} rows={(backups.data ?? []).map((b: any) => [<Pill tone={toneOf(b.status)}>{b.status}</Pill>, b.size_gb ?? "—", dt(b.created_at, lang)])} /></TabsContent>
          <TabsContent value="snapshots"><List cols={[t("الاسم", "Name"), t("الحالة", "Status"), t("التاريخ", "Date")]} rows={(snaps.data ?? []).map((b: any) => [b.name, <Pill tone={toneOf(b.status)}>{b.status}</Pill>, dt(b.created_at, lang)])} /></TabsContent>
          <TabsContent value="billing">
            <Row k={t("سعر البيع الشهري", "Retail monthly")} v={money(s.monthly_price, lang)} /><Row k={t("تكلفة البنية", "Infrastructure cost")} v={money(infra, lang)} />
            <Row k={t("الهامش", "Margin")} v={`${money(margin, lang)}${Number(s.monthly_price) ? ` (${((margin / Number(s.monthly_price)) * 100).toFixed(1)}%)` : ""}`} />
            <List cols={[t("المرجع", "Reference"), t("الإجمالي", "Total"), t("الحالة", "Status")]} rows={(orders.data ?? []).map((o: any) => [<span className="font-mono text-xs">{o.transaction_reference}</span>, money(o.total, lang), o.status])} />
          </TabsContent>
          <TabsContent value="actions" className="space-y-3">
            <div className="flex flex-wrap gap-2">{ACTIONS.map((a) => <Button key={a} size="sm" variant={DESTRUCTIVE.includes(a) ? "destructive" : "outline"} disabled={!!busy} onClick={() => run(a)}>{busy === a && <Loader2 className="w-4 h-4 animate-spin" />}{a}</Button>)}</div>
            <List cols={[t("الإجراء", "Action"), t("الحالة", "Status"), t("الخطأ", "Error"), t("التاريخ", "Date")]} rows={(acts.data ?? []).map((a: any) => [a.action, <Pill tone={toneOf(a.status)}>{a.status}</Pill>, a.error ?? "—", dt(a.created_at, lang)])} />
          </TabsContent>
          <TabsContent value="activity"><List cols={[t("الحدث", "Event"), t("التفاصيل", "Details"), t("التاريخ", "Date")]} rows={(logs.data ?? []).map((l: any) => [l.event, <span className="font-mono text-[11px]">{JSON.stringify(l.details)}</span>, dt(l.created_at, lang)])} /></TabsContent>
          <TabsContent value="security"><Row k={t("مفتاح SSH", "SSH key")} v={s.ssh_key_id ? t("مرفق", "Attached") : t("لا يوجد", "None")} /><Row k={t("النسخ الاحتياطي", "Backups")} v={s.backups_enabled ? "✓" : "✗"} /><Row k={t("سبب الإيقاف", "Suspension reason")} v={s.suspend_reason} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
