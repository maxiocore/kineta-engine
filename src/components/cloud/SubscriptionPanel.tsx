import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { db, fmtDate } from "@/components/cloud/cloudShared";

const LABEL: Record<string, [string, string]> = {
  pending_payment: ["بانتظار الدفع", "Pending payment"], paid: ["مدفوع", "Paid"], provisioning: ["قيد التجهيز", "Provisioning"],
  active: ["نشط", "Active"], renewal_due: ["التجديد مستحق", "Renewal due"], payment_failed: ["فشل الدفع", "Payment failed"],
  grace_period: ["مهلة السداد", "Grace period"], suspension_pending: ["جارٍ التعليق", "Suspension pending"], suspended: ["معلّق", "Suspended"],
  reactivation_pending: ["جارٍ إعادة التفعيل", "Reactivating"], cancellation_pending: ["إلغاء مجدول", "Cancellation scheduled"],
  termination_pending: ["جارٍ الإنهاء", "Terminating"], terminated: ["منتهٍ", "Terminated"], provisioning_failed: ["فشل التجهيز", "Provisioning failed"], cancelled: ["ملغي", "Cancelled"],
};
const money = (minor: number | null, lang: string) => minor == null ? "—" : `${(minor / 100).toLocaleString(lang === "ar" ? "ar-SA" : "en-US", { minimumFractionDigits: 2 })} ${lang === "ar" ? "ر.س" : "SAR"}`;

export default function SubscriptionPanel({ serverId, t, lang }: { serverId: string; t: (a: string, e: string) => string; lang: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: s } = useQuery({
    queryKey: ["cloud-sub", serverId],
    queryFn: async () => (await db.from("cloud_subscriptions").select("*").eq("server_id", serverId).eq("is_simulation", false).order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });
  if (!s) return <p className="text-sm text-muted-foreground">{t("لا يوجد اشتراك مرتبط بعد", "No linked subscription yet")}</p>;
  const call = async (fn: string, args: Record<string, unknown>, ok: string) => {
    setBusy(true);
    const { data, error } = await db.rpc(fn, args);
    setBusy(false);
    if (error || data?.ok === false) toast.error(t("تعذر تنفيذ العملية", "Action could not be completed")); else toast.success(ok);
    qc.invalidateQueries({ queryKey: ["cloud-sub", serverId] });
  };
  const daysLeft = s.grace_ends_at ? Math.max(0, Math.ceil((new Date(s.grace_ends_at).getTime() - Date.now()) / 86400000)) : null;
  const due = ["payment_failed", "grace_period", "suspension_pending", "suspended"].includes(s.status);
  const [ar, en] = LABEL[s.status] ?? [s.status, s.status];
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="rounded-xl border bg-card p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="font-semibold mt-1">{v}</div></div>;

  return (
    <div className="space-y-4 text-start" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="grid sm:grid-cols-3 gap-3">
        <Row k={t("حالة الاشتراك", "Subscription status")} v={<Badge variant={due ? "destructive" : "outline"}>{t(ar, en)}</Badge>} />
        <Row k={t("التجديد القادم", "Next renewal")} v={fmtDate(s.next_renewal_at, lang)} />
        <Row k={t("مبلغ التجديد (شامل الضريبة)", "Renewal amount (incl. VAT)")} v={money(s.renewal_total_minor, lang)} />
      </div>
      {s.status === "grace_period" && <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">{t(`فشل التجديد. متبقٍ ${daysLeft} يوم قبل تعليق الخدمة.`, `Renewal failed. ${daysLeft} day(s) left before suspension.`)}</p>}
      {s.status === "suspended" && <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">{t("الخدمة معلقة لعدم السداد. المبلغ المستحق: ", "Service suspended for non-payment. Amount due: ")}{money(s.renewal_total_minor, lang)}{s.termination_scheduled_at && <> — {t("موعد الحذف النهائي: ", "Scheduled deletion: ")}{fmtDate(s.termination_scheduled_at, lang)}</>}</p>}
      {s.status === "cancellation_pending" && <p className="rounded-xl border bg-muted/40 p-3 text-sm">{t("موعد إيقاف الخدمة: ", "Service stops on: ")}{fmtDate(s.termination_scheduled_at, lang)}. {t("الاسترداد حسب سياسة الاسترداد فقط.", "Refunds follow the refund policy only.")}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {due && <Button disabled={busy} onClick={() => call("cloud_pay_due", { p_sub: s.id }, t("تم الدفع", "Paid"))}>{s.status === "suspended" ? t("ادفع وأعد التفعيل", "Pay & reactivate") : t("ادفع الآن من المحفظة", "Pay now from wallet")}</Button>}
        {["active", "renewal_due"].includes(s.status) && <label className="flex items-center gap-2 text-sm"><Switch checked={s.auto_renew} disabled={busy} onCheckedChange={(v) => call("cloud_set_auto_renew", { p_sub: s.id, p_on: v }, t("تم الحفظ", "Saved"))} />{t("تجديد تلقائي", "Auto-renew")}</label>}
        {["active", "renewal_due", "grace_period"].includes(s.status) && <>
          <Button variant="outline" disabled={busy} onClick={() => confirm(t("إلغاء في نهاية الفترة؟", "Cancel at end of period?")) && call("cloud_request_cancel", { p_sub: s.id, p_mode: "period_end" }, t("تمت الجدولة", "Scheduled"))}>{t("إلغاء نهاية الفترة", "Cancel at period end")}</Button>
          <Button variant="destructive" disabled={busy} onClick={() => confirm(t("سيتم إيقاف الخدمة فوراً. الاسترداد حسب السياسة فقط. متابعة؟", "Service stops immediately. Refunds follow policy only. Continue?")) && call("cloud_request_cancel", { p_sub: s.id, p_mode: "immediate" }, t("تم الطلب", "Requested"))}>{t("إلغاء فوري", "Cancel immediately")}</Button>
        </>}
        {s.backup_status === "active" && <Button variant="outline" disabled={busy} onClick={() => confirm(t("إلغاء النسخ الاحتياطي؟ يبقى مفعلاً حتى يتم تأكيد الإيقاف.", "Cancel backups? They stay on until the stop is confirmed.")) && call("cloud_request_backup_cancel", { p_sub: s.id }, t("تم الطلب", "Requested"))}>{t("إلغاء النسخ الاحتياطي", "Cancel backups")}</Button>}
        {s.backup_status === "cancellation_pending" && <Badge variant="outline">{t("جارٍ إيقاف النسخ الاحتياطي", "Backup cancellation in progress")}</Badge>}
        {s.status === "cancellation_pending" && s.cancel_mode === "period_end" && <Button variant="outline" disabled={busy} onClick={() => call("cloud_undo_cancel", { p_sub: s.id }, t("تم التراجع", "Undone"))}>{t("تراجع عن الإلغاء", "Undo cancellation")}</Button>}
      </div>
    </div>
  );
}
