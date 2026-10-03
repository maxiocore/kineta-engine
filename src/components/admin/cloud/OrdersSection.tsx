import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db, useTable, useInvalidate, DataTable, Pill, toneOf, money, dt, cloudApi, T } from "./adminCloudShared";

export function OrdersSection({ t, lang }: { t: T; lang: string }) {
  const { data: orders = [] } = useTable("cloud_orders");
  const { data: jobs = [] } = useTable("cloud_provisioning_jobs");
  const [f, setF] = useState("");
  const rows = orders.filter((o) => !f || o.status === f);
  return (
    <div className="space-y-3">
      <select className="h-10 rounded-md border bg-background px-2 text-sm" value={f} onChange={(e) => setF(e.target.value)}>
        <option value="">{t("كل الحالات", "All statuses")}</option>
        {["pending_payment", "paid", "queued", "provisioning", "active", "failed", "cancelled", "refunded"].map((s) => <option key={s}>{s}</option>)}
      </select>
      <DataTable empty={t("لا توجد طلبات بعد", "No orders yet")}
        cols={[t("المرجع", "Reference"), t("العميل", "Customer"), t("المبلغ", "Amount"), t("الضريبة", "VAT"), t("الدفع", "Payment"), t("الحالة", "Status"), t("التجهيز", "Provisioning"), t("التاريخ", "Created")]}
        rows={rows.map((o) => {
          const j = jobs.find((x) => x.order_id === o.id);
          return [<span className="font-mono text-xs">{o.transaction_reference}</span>, <span className="font-mono text-xs">{o.user_id.slice(0, 8)}</span>, money(o.subtotal, lang), money(o.vat_amount, lang), o.payment_method,
            <Pill tone={toneOf(o.status)}>{o.status}</Pill>, j ? <Pill tone={toneOf(j.status)}>{j.status}</Pill> : "—", dt(o.created_at, lang)];
        })} />
    </div>
  );
}

export function ProvisioningSection({ t, lang }: { t: T; lang: string }) {
  const { data: jobs = [] } = useTable("cloud_provisioning_jobs");
  const { data: orders = [] } = useTable("cloud_orders");
  const { data: actions = [] } = useTable("cloud_server_actions");
  const inv = useInvalidate();
  const [busy, setBusy] = useState<string | null>(null);

  const provision = async (id: string) => {
    setBusy(id); const r = await cloudApi({ action: "admin_provision", job_id: id }); setBusy(null); inv();
    r?.ok ? toast.success(r.status) : toast.error(t("فشل التجهيز", "Provisioning failed") + ` (${r?.error ?? "error"})`);
  };
  const cancel = async (j: any) => {
    if (!confirm(t("إلغاء الطلب؟", "Cancel this order?"))) return;
    await db.from("cloud_provisioning_jobs").update({ status: "cancelled" }).eq("id", j.id);
    await db.from("cloud_orders").update({ status: "cancelled" }).eq("id", j.order_id);
    if (j.server_id) await db.from("cloud_servers").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", j.server_id);
    inv();
  };
  const refund = async (j: any) => {
    const o = orders.find((x) => x.id === j.order_id); if (!o) return;
    if (o.status === "refunded") return toast.error(t("مسترد مسبقاً", "Already refunded"));
    if (!confirm(t(`استرداد ${money(o.total, lang)} إلى محفظة العميل؟`, `Refund ${money(o.total, lang)} to customer wallet?`))) return;
    const { error } = await db.rpc("admin_refund_cloud_order", { p_order_id: o.id });
    if (error) return toast.error(t("تعذر الاسترداد", "Refund failed"));
    toast.success(t("تم الاسترداد", "Refunded")); inv();
  };
  const process = async (id: string) => { setBusy(id); const r = await cloudApi({ action: "admin_process_action", action_id: id }); setBusy(null); inv(); r?.ok ? toast.success(r.status) : toast.error(r?.error ?? "error"); };
  const markDone = async (id: string) => { await db.from("cloud_server_actions").update({ status: "completed" }).eq("id", id); inv(); };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="font-semibold">{t("مهام التجهيز", "Provisioning jobs")}</h3>
        <DataTable empty={t("لا توجد مهام", "No jobs")}
          cols={[t("المهمة", "Job"), t("الحالة", "Status"), t("المحاولات", "Attempts"), t("آخر محاولة", "Last attempt"), t("رمز الخطأ", "Error code"), t("الرسالة", "Message"), "Request ID", "Resource ID", ""]}
          rows={jobs.map((j) => [<span className="font-mono text-xs">{j.id.slice(0, 8)}</span>, <Pill tone={toneOf(j.status)}>{j.status}</Pill>, j.attempt_count, dt(j.last_attempt_at, lang), j.error_code ?? "—", j.safe_error ?? "—", j.provider_request_id ?? "—", j.provider_resource_id ?? "—",
            <div className="flex gap-1">{!["active", "cancelled"].includes(j.status) && <>
              <Button size="sm" disabled={busy === j.id} onClick={() => provision(j.id)}>{busy === j.id && <Loader2 className="w-3 h-3 animate-spin" />}{j.attempt_count ? t("إعادة", "Retry") : t("تجهيز", "Provision")}</Button>
              <Button size="sm" variant="outline" onClick={() => cancel(j)}>{t("إلغاء", "Cancel")}</Button></>}
              {j.status !== "active" && <Button size="sm" variant="destructive" onClick={() => refund(j)}>{t("استرداد", "Refund")}</Button>}</div>])} />
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">{t("إجراءات العملاء المعلقة", "Pending customer actions")}</h3>
        <DataTable empty={t("لا توجد إجراءات معلقة", "No pending actions")}
          cols={[t("الإجراء", "Action"), t("الخادم", "Server"), t("التاريخ", "Date"), ""]}
          rows={actions.filter((a) => a.status === "requested").map((a) => [a.action, <span className="font-mono text-xs">{a.server_id.slice(0, 8)}</span>, dt(a.created_at, lang),
            <div className="flex gap-1"><Button size="sm" disabled={busy === a.id} onClick={() => process(a.id)}>{t("تنفيذ عبر المزود", "Run via provider")}</Button><Button size="sm" variant="outline" onClick={() => markDone(a.id)}>{t("تم يدوياً", "Done manually")}</Button></div>])} />
      </section>
    </div>
  );
}
