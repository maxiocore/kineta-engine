import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Copy, Eye, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type T = (ar: string, en: string) => string;

/** Customer server access: IPs, root username, and a one-time reveal of the auto-generated password. */
const ServerAccessPanel = ({ server, sshKeyName, t }: { server: any; sshKeyName: string | null; t: T }) => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<{ username: string; password: string } | null>(null);
  const { data: info, isLoading } = useQuery({
    queryKey: ["cloud-access", server.id],
    queryFn: async () => (await supabase.functions.invoke("cloud-api", { body: { action: "access_info", server_id: server.id } })).data as any,
  });
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success(t("تم النسخ", "Copied")); };
  const reveal = async () => {
    setAsk(false); setBusy(true);
    const { data, error } = await supabase.functions.invoke("cloud-api", { body: { action: "reveal_credentials", server_id: server.id } });
    setBusy(false);
    if (error || !data?.password) { toast.error(t("بيانات الوصول عُرضت سابقاً أو غير متاحة. تواصل مع الدعم لإعادة تعيينها.", "Access details were already shown or are unavailable. Contact support to reset them.")); qc.invalidateQueries({ queryKey: ["cloud-access", server.id] }); return; }
    setSecret(data);
  };
  const Row = ({ k, v }: { k: string; v: string | null }) => (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-card">
      <span className="text-xs text-muted-foreground">{k}</span>
      <div className="flex items-center gap-1 min-w-0"><span className="font-mono text-sm truncate" dir="ltr">{v ?? "—"}</span>{v && <Button size="icon" variant="ghost" aria-label={t("نسخ", "Copy")} onClick={() => copy(v)}><Copy className="w-4 h-4" /></Button>}</div>
    </div>
  );
  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  const auto = (info?.access_method ?? server.access_method) !== "ssh_key";
  const active = server.status === "active" || server.status === "running";

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /><h3 className="font-semibold">{t("الوصول إلى الخادم", "Server access")}</h3></div>
      <Row k="IPv4" v={server.primary_ipv4} />
      <Row k="IPv6" v={server.primary_ipv6} />
      <Row k={t("اسم المستخدم", "Username")} v="root" />
      {!active && <p className="text-xs text-muted-foreground">{t("ستتوفر بيانات الوصول بعد اكتمال تجهيز الخادم.", "Access details become available once the server is ready.")}</p>}

      {auto && active && (secret ? (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-2">
          <p className="text-sm font-semibold">{t("كلمة المرور", "Password")}</p>
          <div className="flex items-center gap-2"><code className="font-mono text-sm break-all flex-1" dir="ltr">{secret.password}</code><Button size="icon" variant="ghost" aria-label={t("نسخ", "Copy")} onClick={() => copy(secret.password)}><Copy className="w-4 h-4" /></Button></div>
          <p className="text-xs text-destructive">{t("احفظها الآن في مكان آمن. لن تظهر مرة أخرى بعد مغادرة هذه الصفحة.", "Save it now somewhere safe. It won't be shown again after you leave this page.")}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">ssh root@{server.primary_ipv4 ?? server.primary_ipv6}</p>
        </div>
      ) : info?.revealed ? (
        <p className="text-xs text-muted-foreground rounded-xl border p-3">{t("تم عرض بيانات الوصول مسبقاً لمرة واحدة. لإعادة تعيينها تواصل مع الدعم.", "Access details were already shown once. Contact support to reset them.")}</p>
      ) : info?.has_password ? (
        <Button onClick={() => setAsk(true)} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}{t("عرض بيانات الوصول", "Show access details")}</Button>
      ) : null)}

      {!auto && <p className="text-xs text-muted-foreground rounded-xl border p-3">{t("يتم الدخول بمفتاح SSH الخاص بك", "You sign in with your own SSH key")}{sshKeyName ? `: ${sshKeyName}` : ""}</p>}
      <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/cloud/ssh-keys")}><KeyRound className="w-4 h-4" />{t("إدارة مفاتيح SSH", "Manage SSH keys")}</Button>

      <AlertDialog open={ask} onOpenChange={setAsk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("عرض بيانات الوصول؟", "Show access details?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("ستظهر كلمة المرور مرة واحدة فقط. تأكد أنك في مكان آمن واحفظها فوراً.", "The password is shown only once. Make sure you're somewhere private and save it right away.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel><AlertDialogAction onClick={reveal}>{t("عرض الآن", "Show now")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServerAccessPanel;
