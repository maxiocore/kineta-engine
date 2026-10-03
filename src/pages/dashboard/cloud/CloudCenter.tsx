import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Server, PlusCircle, Cloud, HardDrive, Network, DatabaseBackup, Camera, KeyRound, Disc,
  Activity, Receipt, History, HeadphonesIcon, Search, Trash2, Plus, Globe, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { db, useCloudServers, useCloudTable, useCatalog, StatusBadge, EmptyState, sar, fmtDate, CloudServer } from "@/components/cloud/cloudShared";
import CloudOrderWizard from "@/components/cloud/CloudOrderWizard";

const SECTIONS = [
  { id: "overview", icon: LayoutDashboard, ar: "نظرة عامة", en: "Overview" },
  { id: "servers", icon: Server, ar: "خوادمي", en: "My Servers" },
  { id: "order", icon: PlusCircle, ar: "طلب خادم", en: "Order Server" },
  { id: "vps", icon: Cloud, ar: "Cloud VPS", en: "Cloud VPS" },
  { id: "dedicated", icon: HardDrive, ar: "خوادم مخصصة", en: "Dedicated Servers" },
  { id: "networking", icon: Network, ar: "الشبكات وعناوين IP", en: "Networking & IPs" },
  { id: "backups", icon: DatabaseBackup, ar: "النسخ الاحتياطية", en: "Backups" },
  { id: "snapshots", icon: Camera, ar: "Snapshots", en: "Snapshots" },
  { id: "ssh-keys", icon: KeyRound, ar: "مفاتيح SSH", en: "SSH Keys" },
  { id: "images", icon: Disc, ar: "الصور وأنظمة التشغيل", en: "Images & OS" },
  { id: "usage", icon: Activity, ar: "الاستخدام والموارد", en: "Usage & Resources" },
  { id: "billing", icon: Receipt, ar: "الفواتير والاشتراكات", en: "Billing & Subscriptions" },
  { id: "activity", icon: History, ar: "سجل العمليات", en: "Activity Log" },
  { id: "support", icon: HeadphonesIcon, ar: "الدعم الفني", en: "Support" },
];

const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>{children}</div>
);

const ServerRow = ({ s }: { s: CloudServer }) => {
  const { t, lang, isRtl } = useLanguage();
  const Arrow = isRtl ? ChevronLeft : ChevronRight;
  return (
    <Link to={`/dashboard/cloud/servers/${s.id}`} className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all">
      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {s.server_type === "vps" ? <Cloud className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap"><p className="font-semibold truncate" dir="ltr">{s.name}</p><StatusBadge status={s.status} t={t} /></div>
        <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3" dir="ltr">
          <span>{s.primary_ipv4 ?? t("بانتظار IP", "IP pending")}</span>
          <span>{s.specs?.vcpu ? `${s.specs.vcpu} vCPU` : s.specs?.cpu_model}</span>
          <span>{s.specs?.ram_gb} GB RAM</span>
        </p>
      </div>
      <div className="text-end hidden sm:block">
        <p className="text-sm font-semibold">{sar(s.monthly_price, lang)}</p>
        <p className="text-xs text-muted-foreground">{t("التجديد", "Renews")} {fmtDate(s.renewal_date, lang)}</p>
      </div>
      <Arrow className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
};

const CloudCenter = () => {
  const { section = "overview" } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: servers = [], isLoading } = useCloudServers();
  const { data: snapshots = [] } = useCloudTable("cloud_snapshots", "snaps");
  const { data: backups = [] } = useCloudTable("cloud_backups", "backups");
  const { data: ips = [] } = useCloudTable("cloud_server_ips", "ips");
  const { data: keys = [] } = useCloudTable("cloud_ssh_keys", "keys");
  const { data: logs = [] } = useCloudTable("cloud_activity_logs", "logs");
  const { data: images = [] } = useCatalog("cloud_images");

  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyVal, setKeyVal] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [delKey, setDelKey] = useState<string | null>(null);

  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const stats = useMemo(() => ({
    total: servers.length,
    running: servers.filter((s) => s.status === "running").length,
    stopped: servers.filter((s) => s.status === "stopped").length,
    suspended: servers.filter((s) => s.status === "suspended").length,
    pending: servers.filter((s) => s.status === "pending").length,
    vps: servers.filter((s) => s.server_type === "vps").length,
    dedicated: servers.filter((s) => s.server_type === "dedicated").length,
    ipv4: ips.filter((i) => i.version === 4).length + servers.filter((s) => s.primary_ipv4 && !ips.some((i) => i.ip === s.primary_ipv4)).length,
    ipv6: ips.filter((i) => i.version === 6).length + servers.filter((s) => s.primary_ipv6 && !ips.some((i) => i.ip === s.primary_ipv6)).length,
    monthly: servers.filter((s) => !["cancelled"].includes(s.status)).reduce((a, s) => a + Number(s.monthly_price), 0),
    backupsOn: servers.filter((s) => s.backups_enabled).length,
  }), [servers, ips]);

  const filtered = (list: CloudServer[]) => list.filter((s) =>
    (statusF === "all" || s.status === statusF) &&
    (!q || [s.name, s.primary_ipv4, s.primary_ipv6, s.id].some((v) => v?.toLowerCase().includes(q.toLowerCase()))));

  const addKey = async () => {
    const v = keyVal.trim();
    if (!/^(ssh-(rsa|ed25519)|ecdsa-sha2-nistp(256|384|521)) [A-Za-z0-9+/=]+( .*)?$/.test(v) || v.length > 8000) {
      toast.error(t("صيغة المفتاح غير صحيحة", "Invalid public key format")); return;
    }
    if (keyName.trim().length < 2) { toast.error(t("أدخل اسماً للمفتاح", "Enter a key name")); return; }
    setSavingKey(true);
    const { error } = await db.from("cloud_ssh_keys").insert({ user_id: user!.id, name: keyName.trim().slice(0, 64), public_key: v });
    setSavingKey(false);
    if (error) { toast.error(t("تعذر حفظ المفتاح", "Could not save key")); return; }
    await db.from("cloud_activity_logs").insert({ user_id: user!.id, event: "ssh_key_added", details: { name: keyName.trim() } });
    toast.success(t("تمت إضافة المفتاح", "Key added"));
    setKeyOpen(false); setKeyName(""); setKeyVal("");
    qc.invalidateQueries({ queryKey: ["cloud_ssh_keys"] }); qc.invalidateQueries({ queryKey: ["cloud_activity_logs"] });
  };

  const removeKey = async () => {
    if (!delKey) return;
    const { error } = await db.from("cloud_ssh_keys").delete().eq("id", delKey);
    setDelKey(null);
    if (error) { toast.error(t("تعذر الحذف", "Delete failed")); return; }
    toast.success(t("تم حذف المفتاح", "Key deleted"));
    qc.invalidateQueries({ queryKey: ["cloud_ssh_keys"] });
  };

  const serverName = (id: string | null) => servers.find((s) => s.id === id)?.name ?? "—";
  const orderBtn = <Button onClick={() => navigate("/dashboard/cloud/order")}><Plus className="w-4 h-4" />{t("طلب خادم جديد", "Order a new server")}</Button>;

  const serverList = (list: CloudServer[], emptyTitle: string) => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ابحث بالاسم أو IP أو المعرف", "Search by name, IP or ID")} className="ps-9" /></div>
        <div className="flex gap-1.5 overflow-x-auto">
          {["all", "running", "stopped", "pending", "suspended"].map((s) => (
            <Button key={s} size="sm" variant={statusF === s ? "default" : "outline"} onClick={() => setStatusF(s)} className="shrink-0">
              {s === "all" ? t("الكل", "All") : <StatusBadgeLabel s={s} />}
            </Button>
          ))}
        </div>
      </div>
      {filtered(list).length ? <div className="space-y-2.5">{filtered(list).map((s) => <ServerRow key={s.id} s={s} />)}</div>
        : <EmptyState icon={Server} title={emptyTitle} action={orderBtn} />}
    </div>
  );

  const renderSection = () => {
    if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    switch (current.id) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                [t("إجمالي الخوادم", "Total servers"), stats.total, Server],
                [t("نشطة", "Running"), stats.running, Activity],
                [t("متوقفة", "Stopped"), stats.stopped, HardDrive],
                [t("معلّقة / قيد التجهيز", "Suspended / pending"), `${stats.suspended} / ${stats.pending}`, Loader2],
                ["Cloud VPS", stats.vps, Cloud],
                [t("خوادم مخصصة", "Dedicated"), stats.dedicated, HardDrive],
                ["IPv4 / IPv6", `${stats.ipv4} / ${stats.ipv6}`, Globe],
                ["Snapshots", snapshots.length, Camera],
              ].map(([label, val, Icon]: any, i) => (
                <Card key={i} className="p-4 animate-fade-in hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground">{label}</span><Icon className="w-4 h-4 text-primary" /></div>
                  <p className="text-xl font-bold">{val}</p>
                </Card>
              ))}
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <p className="text-sm text-muted-foreground">{t("الاستهلاك الشهري", "Monthly spend")}</p>
                <p className="text-2xl font-bold text-primary mt-1">{sar(stats.monthly, lang)}</p>
                <p className="text-xs text-muted-foreground mt-3">{t("النسخ الاحتياطي مفعّل على", "Backups enabled on")} {stats.backupsOn} / {stats.total}</p>
              </Card>
              <Card className="lg:col-span-2">
                <p className="font-semibold mb-3 text-sm">{t("إجراءات سريعة", "Quick actions")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    [t("طلب خادم جديد", "New server"), "/dashboard/cloud/order", PlusCircle],
                    [t("إنشاء VPS", "Create VPS"), "/dashboard/cloud/vps?order=1", Cloud],
                    [t("طلب خادم مخصص", "Order dedicated"), "/dashboard/cloud/dedicated?order=1", HardDrive],
                    [t("إضافة SSH Key", "Add SSH key"), "/dashboard/cloud/ssh-keys", KeyRound],
                    [t("إنشاء Snapshot", "Create snapshot"), "/dashboard/cloud/snapshots", Camera],
                    [t("فتح تذكرة دعم", "Open ticket"), "/dashboard/support", HeadphonesIcon],
                  ].map(([l, h, I]: any) => (
                    <Link key={h} to={h} className="flex items-center gap-2 p-3 rounded-xl border hover:border-primary/40 hover:bg-primary/5 text-sm transition-colors"><I className="w-4 h-4 text-primary" />{l}</Link>
                  ))}
                </div>
              </Card>
            </div>
            <Card>
              <p className="font-semibold mb-3 text-sm">{t("آخر العمليات", "Recent activity")}</p>
              {logs.length ? <LogList logs={logs.slice(0, 6)} serverName={serverName} /> : <p className="text-sm text-muted-foreground">{t("لا توجد عمليات بعد", "No activity yet")}</p>}
            </Card>
          </div>
        );
      case "servers": return serverList(servers, t("لا توجد خوادم بعد", "No servers yet"));
      case "order": return <CloudOrderWizard />;
      case "vps":
      case "dedicated": {
        const type = current.id as "vps" | "dedicated";
        if (new URLSearchParams(window.location.search).get("order")) return <CloudOrderWizard initialType={type} />;
        return serverList(servers.filter((s) => s.server_type === type), t("لا توجد خوادم من هذا النوع", "No servers of this type"));
      }
      case "networking": {
        const rows = [...ips, ...servers.flatMap((s) => [s.primary_ipv4 && { ip: s.primary_ipv4, version: 4, server_id: s.id, is_primary: true }, s.primary_ipv6 && { ip: s.primary_ipv6, version: 6, server_id: s.id, is_primary: true }].filter(Boolean) as any[])]
          .filter((r, i, a) => a.findIndex((x) => x.ip === r.ip) === i);
        return rows.length ? (
          <Card className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-muted-foreground text-xs"><tr><th className="p-3 text-start">IP</th><th className="p-3 text-start">{t("النوع", "Type")}</th><th className="p-3 text-start">{t("الخادم", "Server")}</th><th className="p-3 text-start">Reverse DNS</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.ip} className="border-t"><td className="p-3 font-mono" dir="ltr">{r.ip}</td><td className="p-3">IPv{r.version}{r.is_primary && ` · ${t("أساسي", "Primary")}`}</td><td className="p-3" dir="ltr">{serverName(r.server_id)}</td><td className="p-3" dir="ltr">{r.reverse_dns ?? "—"}</td></tr>)}</tbody></table></Card>
        ) : <EmptyState icon={Network} title={t("لا توجد عناوين IP بعد", "No IP addresses yet")} desc={t("تظهر العناوين تلقائياً بعد تفعيل خوادمك.", "Addresses appear once your servers are active.")} />;
      }
      case "backups":
        return backups.length ? <SimpleList rows={backups} cols={(b) => [serverName(b.server_id), b.size_gb ? `${b.size_gb} GB` : "—", fmtDate(b.created_at, lang)]} t={t} />
          : <EmptyState icon={DatabaseBackup} title={t("لا توجد نسخ احتياطية", "No backups yet")} desc={t("فعّل النسخ الاحتياطي عند طلب الخادم أو من إعداداته.", "Enable backups when ordering or from server settings.")} />;
      case "snapshots":
        return snapshots.length ? <SimpleList rows={snapshots} cols={(s) => [s.name, serverName(s.server_id), fmtDate(s.created_at, lang)]} t={t} />
          : <EmptyState icon={Camera} title={t("لا توجد Snapshots", "No snapshots yet")} desc={t("أنشئ Snapshot من صفحة تفاصيل أي خادم نشط.", "Create a snapshot from any active server's page.")} action={servers.length ? <Button variant="outline" onClick={() => navigate("/dashboard/cloud/servers")}>{t("اختر خادماً", "Choose a server")}</Button> : undefined} />;
      case "ssh-keys":
        return (
          <div className="space-y-4">
            <div className="flex justify-end"><Button onClick={() => setKeyOpen(true)}><Plus className="w-4 h-4" />{t("إضافة مفتاح", "Add key")}</Button></div>
            {keys.length ? keys.map((k) => (
              <Card key={k.id} className="p-4 flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0"><p className="font-medium">{k.name}</p><p className="text-xs text-muted-foreground font-mono truncate" dir="ltr">{k.public_key.slice(0, 60)}…</p></div>
                <span className="text-xs text-muted-foreground hidden sm:block">{fmtDate(k.created_at, lang)}</span>
                <Button size="icon" variant="ghost" onClick={() => setDelKey(k.id)} aria-label={t("حذف", "Delete")}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </Card>
            )) : <EmptyState icon={KeyRound} title={t("لا توجد مفاتيح SSH", "No SSH keys")} desc={t("أضف مفتاحك العام للدخول الآمن إلى خوادمك.", "Add your public key for secure server access.")} />}
          </div>
        );
      case "images":
        return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{images.map((im) => <Card key={im.id} className="p-4 flex items-center gap-3"><Disc className="w-5 h-5 text-primary" /><div><p className="font-medium text-sm">{im.name}</p><p className="text-xs text-muted-foreground">{t("متاح للتثبيت", "Available")}</p></div></Card>)}</div>;
      case "usage":
        return servers.length ? (
          <div className="grid md:grid-cols-2 gap-3">{servers.map((s) => (
            <Card key={s.id} className="p-4"><div className="flex justify-between mb-3"><p className="font-semibold" dir="ltr">{s.name}</p><StatusBadge status={s.status} t={t} /></div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {[["CPU", s.specs?.vcpu ? `${s.specs.vcpu} vCPU` : "—"], ["RAM", `${s.specs?.ram_gb ?? 0} GB`], [t("التخزين", "Disk"), `${s.specs?.storage_gb ?? 0} GB`]].map(([k, v]) => <div key={k} className="rounded-lg bg-muted/40 p-2"><p className="text-muted-foreground">{k}</p><p className="font-semibold mt-0.5">{v}</p></div>)}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{t("مؤشرات الاستهلاك الحية تظهر بعد تفعيل الخادم.", "Live usage metrics appear after activation.")}</p></Card>))}</div>
        ) : <EmptyState icon={Activity} title={t("لا توجد موارد بعد", "No resources yet")} action={orderBtn} />;
      case "billing":
        return servers.length ? <SimpleList rows={servers} cols={(s) => [s.name, sar(s.monthly_price, lang) + " / " + t("شهر", "mo"), `${t("التجديد", "Renews")} ${fmtDate(s.renewal_date, lang)}`]} t={t} />
          : <EmptyState icon={Receipt} title={t("لا توجد اشتراكات", "No subscriptions")} action={orderBtn} />;
      case "activity":
        return logs.length ? <Card><LogList logs={logs} serverName={serverName} /></Card> : <EmptyState icon={History} title={t("لا توجد عمليات بعد", "No activity yet")} />;
      case "support":
        return <EmptyState icon={HeadphonesIcon} title={t("فريق دعم البنية السحابية", "Cloud support team")} desc={t("افتح تذكرة وسيتواصل معك فريقنا التقني على مدار الساعة.", "Open a ticket and our technical team will respond 24/7.")} action={<Button onClick={() => navigate("/dashboard/support")}>{t("فتح تذكرة دعم", "Open a ticket")}</Button>} />;
    }
  };

  return (
    <ClientDashboardLayout>
      <div className="space-y-5 pb-8" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><Cloud className="w-5 h-5" /></div>
            <div><h1 className="text-lg font-bold">{t("الخوادم والبنية السحابية", "Servers & Cloud")}</h1><p className="text-xs text-muted-foreground">{t(current.ar, current.en)}</p></div>
          </div>
          {current.id !== "order" && orderBtn}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {SECTIONS.map((s) => (
            <Link key={s.id} to={`/dashboard/cloud/${s.id}`} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shrink-0 border transition-colors",
              s.id === current.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40")}>
              <s.icon className="w-3.5 h-3.5" />{t(s.ar, s.en)}
            </Link>
          ))}
        </div>
        <div key={current.id} className="animate-fade-in">{renderSection()}</div>
      </div>

      <Dialog open={keyOpen} onOpenChange={setKeyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("إضافة مفتاح SSH", "Add SSH key")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder={t("اسم المفتاح", "Key name")} maxLength={64} />
            <Textarea dir="ltr" rows={5} value={keyVal} onChange={(e) => setKeyVal(e.target.value)} placeholder="ssh-ed25519 AAAA... user@host" className="font-mono text-xs" />
          </div>
          <DialogFooter><Button onClick={addKey} disabled={savingKey}>{savingKey && <Loader2 className="w-4 h-4 animate-spin" />}{t("حفظ", "Save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!delKey} onOpenChange={(o) => !o && setDelKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("حذف المفتاح؟", "Delete key?")}</AlertDialogTitle><AlertDialogDescription>{t("لن يمكن استخدامه في الخوادم الجديدة.", "It can no longer be used for new servers.")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel><AlertDialogAction onClick={removeKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("حذف", "Delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ClientDashboardLayout>
  );
};

const StatusBadgeLabel = ({ s }: { s: string }) => {
  const { t } = useLanguage();
  const map: Record<string, [string, string]> = { running: ["يعمل", "Running"], stopped: ["متوقف", "Stopped"], pending: ["قيد التجهيز", "Pending"], suspended: ["معلّق", "Suspended"] };
  return <>{t(...map[s])}</>;
};

const EVENTS: Record<string, [string, string]> = {
  server_ordered: ["طلب خادم جديد", "Server ordered"], power_start: ["تشغيل الخادم", "Server start"], power_stop: ["إيقاف الخادم", "Server stop"],
  power_restart: ["إعادة تشغيل", "Server restart"], snapshot_requested: ["طلب Snapshot", "Snapshot requested"], ssh_key_added: ["إضافة مفتاح SSH", "SSH key added"],
};

export const LogList = ({ logs, serverName }: { logs: any[]; serverName: (id: string | null) => string }) => {
  const { t, lang } = useLanguage();
  return (
    <ol className="relative border-s border-border ms-2 space-y-4">
      {logs.map((l) => (
        <li key={l.id} className="ms-4">
          <span className="absolute -start-1.5 w-3 h-3 rounded-full bg-primary/80 ring-4 ring-background" />
          <p className="text-sm font-medium">{EVENTS[l.event] ? t(...EVENTS[l.event]) : l.event}{l.server_id && <span className="text-muted-foreground font-normal" dir="ltr"> · {serverName(l.server_id)}</span>}</p>
          <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}</p>
        </li>
      ))}
    </ol>
  );
};

const SimpleList = ({ rows, cols, t }: { rows: any[]; cols: (r: any) => string[]; t: any }) => (
  <div className="space-y-2">{rows.map((r) => (
    <div key={r.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4 rounded-xl border bg-card text-sm">
      {cols(r).map((c, i) => <span key={i} className={i === 0 ? "font-medium flex-1 min-w-[8rem]" : "text-muted-foreground"} dir="auto">{c}</span>)}
      {r.status && <StatusBadge status={r.status} t={t} />}
    </div>))}
  </div>
);

export default CloudCenter;
