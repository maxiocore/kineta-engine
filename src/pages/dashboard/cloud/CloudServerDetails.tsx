import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Square, RotateCw, Cloud, HardDrive, MapPin, Disc, Globe, Loader2, ChevronRight, ChevronLeft, Camera, LineChart, Copy } from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { db, StatusBadge, EmptyState, sar, fmtDate, CloudServer } from "@/components/cloud/cloudShared";
import { LogList } from "./CloudCenter";
import SubscriptionPanel from "@/components/cloud/SubscriptionPanel";

const CloudServerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t, lang, isRtl } = useLanguage();
  const [confirm, setConfirm] = useState<null | "stop" | "restart" | "start">(null);
  const [busy, setBusy] = useState(false);
  const [snapName, setSnapName] = useState("");
  const [newName, setNewName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["cloud-server", id],
    enabled: !!id,
    queryFn: async () => {
      const [s, ips, snaps, backups, logs, actions] = await Promise.all([
        db.from("cloud_servers").select("*").eq("id", id).maybeSingle(),
        db.from("cloud_server_ips").select("*").eq("server_id", id),
        db.from("cloud_snapshots").select("*").eq("server_id", id).order("created_at", { ascending: false }),
        db.from("cloud_backups").select("*").eq("server_id", id).order("created_at", { ascending: false }),
        db.from("cloud_activity_logs").select("*").eq("server_id", id).order("created_at", { ascending: false }).limit(50),
        db.from("cloud_server_actions").select("*").eq("server_id", id).order("created_at", { ascending: false }).limit(20),
      ]);
      const keyId = (s.data as any)?.ssh_key_id;
      const sshKey = keyId ? (await db.from("cloud_ssh_keys").select("name, fingerprint").eq("id", keyId).maybeSingle()).data : null;
      return { sshKey: sshKey as { name: string; fingerprint: string | null } | null, server: s.data as CloudServer | null, ips: ips.data ?? [], snaps: snaps.data ?? [], backups: backups.data ?? [], logs: logs.data ?? [], actions: actions.data ?? [] };
    },
  });

  const Back = isRtl ? ChevronRight : ChevronLeft;
  if (isLoading) return <ClientDashboardLayout><div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></ClientDashboardLayout>;
  const s = data?.server;
  if (!s) return <ClientDashboardLayout><EmptyState icon={Cloud} title={t("الخادم غير موجود", "Server not found")} action={<Button onClick={() => navigate("/dashboard/cloud/servers")}>{t("العودة", "Back")}</Button>} /></ClientDashboardLayout>;

  const ready = !["pending", "suspended", "cancelled", "failed"].includes(s.status);
  const refresh = () => qc.invalidateQueries({ queryKey: ["cloud-server", id] });

  const call = async (body: any, okMsg: string) => {
    setBusy(true);
    const { data: r, error } = await supabase.functions.invoke("cloud-api", { body });
    setBusy(false);
    if (error || r?.error) { toast.error(t("تعذر تنفيذ العملية", "Operation failed")); return false; }
    toast.success(okMsg); refresh(); return true;
  };

  const power = async (type: "start" | "stop" | "restart") => {
    setConfirm(null);
    await call({ action: "power", server_id: s.id, type }, t("تم إرسال الطلب وسيتم تنفيذه قريباً", "Request sent and will be executed shortly"));
  };

  const rename = async () => {
    const n = newName.trim();
    if (!/^[a-zA-Z0-9-]{2,63}$/.test(n)) { toast.error(t("اسم غير صالح", "Invalid name")); return; }
    const { error } = await db.from("cloud_servers").update({ name: n }).eq("id", s.id);
    if (error) toast.error(t("تعذر الحفظ", "Save failed")); else { toast.success(t("تم الحفظ", "Saved")); setNewName(""); refresh(); qc.invalidateQueries({ queryKey: ["cloud-servers"] }); }
  };

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success(t("تم النسخ", "Copied")); };
  const Info = ({ k, v, ltr }: { k: string; v: any; ltr?: boolean }) => (
    <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground mb-1">{k}</p><p className="font-semibold text-sm" dir={ltr ? "ltr" : undefined}>{v ?? "—"}</p></div>
  );
  const pendingNote = <EmptyState icon={LineChart} title={t("متاح بعد تفعيل الخادم", "Available after activation")} desc={t("ستظهر هذه البيانات تلقائياً فور اكتمال تجهيز الخادم.", "This data appears automatically once provisioning completes.")} />;

  const tabs = [
    ["overview", "نظرة عامة", "Overview"], ["metrics", "المؤشرات", "Metrics"], ["networking", "الشبكة", "Networking"],
    ["backups", "النسخ الاحتياطي", "Backups"], ["snapshots", "Snapshots", "Snapshots"], ["rebuild", "إعادة البناء", "Rebuild"],
    ["rescue", "وضع الإنقاذ", "Rescue"], ["access", "الوصول", "Access"], ["activity", "السجل", "Activity"],
    ["billing", "الفوترة", "Billing"], ["settings", "الإعدادات", "Settings"],
  ];

  return (
    <ClientDashboardLayout>
      <div className="space-y-5 pb-8 w-full min-w-0 max-w-full overflow-x-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
        <Link to="/dashboard/cloud/servers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><Back className="w-4 h-4" />{t("خوادمي", "My servers")}</Link>

        <div className="rounded-2xl border bg-card p-5 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{s.server_type === "vps" ? <Cloud className="w-6 h-6" /> : <HardDrive className="w-6 h-6" />}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><h1 className="text-lg font-bold truncate" dir="ltr">{s.name}</h1><StatusBadge status={s.status} t={t} /></div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1" dir="ltr"><Globe className="w-3.5 h-3.5" />{s.primary_ipv4 ?? t("بانتظار IP", "IP pending")}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{s.location_code}</span>
                  <span className="flex items-center gap-1"><Disc className="w-3.5 h-3.5" />{s.image_code}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!ready || busy || s.status === "running"} onClick={() => power("start")}><Play className="w-4 h-4" />{t("تشغيل", "Start")}</Button>
              <Button size="sm" variant="outline" disabled={!ready || busy || s.status === "stopped"} onClick={() => setConfirm("stop")}><Square className="w-4 h-4" />{t("إيقاف", "Stop")}</Button>
              <Button size="sm" variant="outline" disabled={!ready || busy} onClick={() => setConfirm("restart")}><RotateCw className="w-4 h-4" />{t("إعادة تشغيل", "Restart")}</Button>
            </div>
          </div>
          {s.status === "pending" && <p className="mt-4 text-xs rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 p-3">{t("خادمك قيد التجهيز، سنرسل لك إشعاراً فور تفعيله.", "Your server is being provisioned; we'll notify you once it's active.")}</p>}
        </div>

        <Tabs defaultValue="overview" dir={lang === "ar" ? "rtl" : "ltr"} className="text-start">
          {/* flex-row overrides the shared reversed tab order so tabs follow the reading direction (RTL Arabic, LTR English). */}
          <TabsList dir={lang === "ar" ? "rtl" : "ltr"} className="flex-row h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
            {tabs.map(([v, ar, en]) => <TabsTrigger key={v} value={v} className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t(ar, en)}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="overview" className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            <Info k="CPU" v={s.specs?.vcpu ? `${s.specs.vcpu} vCPU` : s.specs?.cpu_model} />
            <Info k="RAM" v={`${s.specs?.ram_gb ?? 0} GB`} />
            <Info k={t("التخزين", "Disk")} v={`${s.specs?.storage_gb ?? 0} GB ${s.specs?.disk_type ?? ""}`} />
            <Info k={t("النقل", "Traffic")} v={`${s.specs?.traffic_tb ?? "—"} TB`} />
            <Info k={t("النوع", "Server type")} v={s.server_type === "vps" ? "Cloud VPS" : "Dedicated"} />
            <Info k={t("المعمارية", "Architecture")} v="x86_64" ltr />
            <Info k={t("تاريخ الإنشاء", "Created")} v={fmtDate(s.created_at, lang)} />
            <Info k={t("تاريخ التجديد", "Renewal")} v={fmtDate(s.renewal_date, lang)} />
            <Info k={t("معرف الخادم", "Server ID")} v={s.id.slice(0, 8)} ltr />
            <Info k={t("اسم مستخدم SSH", "SSH username")} v="root" ltr />
            <Info k={t("مفتاح SSH", "SSH key")} v={data?.sshKey ? `${data.sshKey.name}${data.sshKey.fingerprint ? ` · ${data.sshKey.fingerprint.slice(0, 22)}…` : ""}` : "—"} ltr />
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">{pendingNote}</TabsContent>

          <TabsContent value="networking" className="mt-4 space-y-2">
            {[s.primary_ipv4 && { ip: s.primary_ipv4, v: 4 }, s.primary_ipv6 && { ip: s.primary_ipv6, v: 6 }, ...data!.ips.map((i: any) => ({ ip: i.ip, v: i.version }))].filter(Boolean).filter((r: any, i, a: any[]) => a.findIndex((x) => x.ip === r.ip) === i).map((r: any) => (
              <div key={r.ip} className="flex items-center justify-between p-4 rounded-xl border bg-card"><span className="font-mono text-sm" dir="ltr">{r.ip}</span><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">IPv{r.v}</span><Button size="icon" variant="ghost" onClick={() => copy(r.ip)}><Copy className="w-4 h-4" /></Button></div></div>
            ))}
            {!s.primary_ipv4 && !s.primary_ipv6 && !data!.ips.length && pendingNote}
          </TabsContent>

          <TabsContent value="backups" className="mt-4">
            {data!.backups.length ? data!.backups.map((b: any) => <div key={b.id} className="flex justify-between p-4 rounded-xl border bg-card mb-2 text-sm"><span>{fmtDate(b.created_at, lang)}</span><StatusBadge status={b.status} t={t} /></div>)
              : <EmptyState icon={Camera} title={s.backups_enabled ? t("لم تُنشأ نسخ بعد", "No backups yet") : t("النسخ الاحتياطي غير مفعّل", "Backups are disabled")} desc={s.backups_enabled ? undefined : t("تواصل مع الدعم لتفعيله على هذا الخادم.", "Contact support to enable it for this server.")} />}
          </TabsContent>

          <TabsContent value="snapshots" className="mt-4 space-y-3">
            <div className="flex gap-2 max-w-lg"><Input dir="ltr" value={snapName} onChange={(e) => setSnapName(e.target.value)} placeholder="snapshot-name" maxLength={63} disabled={!ready} />
              <Button disabled={!ready || busy || snapName.trim().length < 2} onClick={async () => { if (await call({ action: "snapshot", server_id: s.id, name: snapName.trim() }, t("تم طلب إنشاء Snapshot", "Snapshot requested"))) setSnapName(""); }}><Camera className="w-4 h-4" />{t("إنشاء", "Create")}</Button></div>
            {data!.snaps.map((sn: any) => <div key={sn.id} className="flex justify-between p-4 rounded-xl border bg-card text-sm"><span dir="ltr">{sn.name}</span><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{fmtDate(sn.created_at, lang)}</span><StatusBadge status={sn.status} t={t} /></div></div>)}
          </TabsContent>

          {["rebuild", "rescue", "access"].map((v) => (
            <TabsContent key={v} value={v} className="mt-4">
              <EmptyState icon={v === "rebuild" ? Disc : v === "rescue" ? RotateCw : Globe}
                title={v === "rebuild" ? t("إعادة بناء الخادم", "Rebuild server") : v === "rescue" ? t("وضع الإنقاذ", "Rescue mode") : t("الوصول والكونسول", "Access & console")}
                desc={t("هذه الميزة تُفعّل قريباً. حالياً يمكنك طلبها عبر الدعم الفني وسننفذها لك.", "This feature is coming soon. Meanwhile request it through support and we'll handle it.")}
                action={<Button variant="outline" onClick={() => navigate("/dashboard/support")}>{t("طلب عبر الدعم", "Request via support")}</Button>} />
            </TabsContent>
          ))}

          <TabsContent value="activity" className="mt-4">
            {data!.logs.length ? <div className="rounded-2xl border bg-card p-5"><LogList logs={data!.logs} serverName={() => s.name} /></div> : <EmptyState icon={LineChart} title={t("لا توجد عمليات", "No activity")} />}
          </TabsContent>

          <TabsContent value="billing" className="mt-4">
            <SubscriptionPanel serverId={s.id} t={t} lang={lang} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 max-w-lg space-y-3">
            <p className="text-sm font-medium">{t("تغيير اسم الخادم", "Rename server")}</p>
            <div className="flex gap-2"><Input dir="ltr" value={newName} onChange={(e) => setNewName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))} placeholder={s.name} maxLength={63} /><Button onClick={rename} disabled={!newName}>{t("حفظ", "Save")}</Button></div>
            <p className="text-xs text-muted-foreground pt-4">{t("لإلغاء الاشتراك تواصل مع الدعم الفني.", "To cancel the subscription, contact support.")}</p>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "stop" ? t("إيقاف الخادم؟", "Stop server?") : t("إعادة تشغيل الخادم؟", "Restart server?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("قد تنقطع الخدمات العاملة على الخادم مؤقتاً.", "Services running on the server may be interrupted temporarily.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => confirm && power(confirm)}>{t("تأكيد", "Confirm")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ClientDashboardLayout>
  );
};

export default CloudServerDetails;
