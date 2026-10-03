import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck, ShieldAlert, Search, Undo2, Eye } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sar } from "@/lib/payments";

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("payments", { body });
  if (error) { let c = "error"; try { c = (await (error as any).context?.json())?.error ?? c; } catch { /* */ } throw new Error(c); }
  return data;
}

const STATUS_AR: Record<string, string> = { ready: "جاهزة", configuration_required: "تحتاج إعداد", disabled: "غير متاحة", unavailable: "غير متاحة" };
const PAY_STATUS: Record<string, string> = { initiated: "بدأت", pending: "قيد التحقق", paid: "مدفوعة", failed: "فشلت", review: "مراجعة", refunded: "مستردة", partially_refunded: "مستردة جزئياً", expired: "منتهية" };
const EVENTS = ["payment_paid", "payment_failed", "payment_refunded"];

export default function AdminPaymentGateway() {
  const [st, setSt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [refund, setRefund] = useState<{ amount: string; reason: string; key: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => { setLoading(true); try { setSt(await call({ action: "admin_status" })); } catch (e: any) { toast.error(e.message); } setLoading(false); }, []);
  const loadList = useCallback(async () => {
    try {
      const r = await call({ action: "admin_list", status: filter === "all" ? undefined : filter, search: search || undefined });
      setList(r.payments); setProfiles(Object.fromEntries((r.profiles ?? []).map((p: any) => [p.id, p])));
    } catch (e: any) { toast.error(e.message); }
  }, [filter, search]);
  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => { loadList(); }, [loadList]);

  const saveSetting = async (patch: Record<string, unknown>) => {
    try { await call({ action: "admin_settings", ...patch }); toast.success("تم الحفظ"); loadStatus(); } catch (e: any) { toast.error(e.message); }
  };
  const openDetail = async (id: string) => { try { setDetail(await call({ action: "admin_detail", payment_id: id })); } catch (e: any) { toast.error(e.message); } };
  const doRefund = async () => {
    if (!detail || !refund) return;
    setBusy(true);
    try {
      const r = await call({ action: "admin_refund", payment_id: detail.payment.id, amount: Number(refund.amount), reason: refund.reason, idempotency_key: refund.key });
      r.status === "succeeded" ? toast.success("تم الاسترداد") : toast.error(`فشل الاسترداد: ${r.provider_error ?? r.status}`);
      setRefund(null); openDetail(detail.payment.id); loadList();
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  const hooks: any[] = st?.webhooks ?? [];
  const ourHook = hooks.find((h) => h.url?.includes("/functions/v1/payments"));

  return (
    <AdminDashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">بوابة الدفع الإلكتروني</h1>
            <p className="text-sm text-muted-foreground">إعدادات المعالج والمدفوعات والاسترداد (للإدارة فقط)</p>
          </div>
          <Button variant="outline" onClick={() => { loadStatus(); loadList(); }} className="gap-2"><RefreshCw className="w-4 h-4" />تحديث</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">{st?.connection === "connected" ? <ShieldCheck className="w-5 h-5 text-primary" /> : <ShieldAlert className="w-5 h-5 text-destructive" />}حالة الاتصال</CardTitle></CardHeader>
          <CardContent>
            {loading || !st ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <Info k="المعالج" v={st.processor} />
                <Info k="البيئة" v={<Badge variant={st.environment === "live" ? "default" : "secondary"}>{st.environment === "live" ? "LIVE" : "TEST"}</Badge>} />
                <Info k="الاتصال" v={<Badge variant={st.connection === "connected" ? "default" : "destructive"}>{st.connection === "connected" ? `${st.environment === "live" ? "LIVE" : "TEST"} CONNECTED` : "CONNECTION FAILED"}</Badge>} />
                <Info k="المفاتيح" v={st.keys_configured ? "Configured" : "Missing"} />
                <Info k="صيغة المفتاح العام" v={st.key_formats?.publishable ?? "—"} />
                <Info k="صيغة المفتاح السري" v={st.key_formats?.secret ?? "—"} />
                <Info k="سر الإشعارات" v={st.webhook_secret_configured ? "Configured" : "Missing"} />
                <Info k="المدفوعات الحقيقية" v={<Badge variant={st.live_payments_enabled ? "default" : "outline"}>{st.live_payments_enabled ? "ENABLED" : "LOCKED (LIVE_PAYMENTS_ENABLED=false)"}</Badge>} />
                <Info k="Paylink للمدفوعات الجديدة" v="معطّل" />
                <Info k="عنوان الإشعارات" v={<span dir="ltr" className="text-xs break-all">{st.webhook_url}</span>} />
                <Info k="الإشعار مسجّل لدى المعالج" v={ourHook ? `نعم (${ourHook.http_method ?? "POST"})` : st.webhooks ? "غير موجود" : "تعذر القراءة"} />
                <Info k="الأحداث" v={ourHook ? EVENTS.map((e) => `${e}: ${ourHook.events.includes(e) ? "✓" : "✗"}`).join(" · ") : "—"} />
              </div>
            )}
          </CardContent>
        </Card>

        {st && (
          <Card>
            <CardHeader><CardTitle>طرق الدفع</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid sm:grid-cols-5 gap-3">
                {(["mada", "visa", "mastercard", "applepay", "stcpay"] as const).map((m) => (
                  <div key={m} className="rounded-lg border border-border p-3 text-center">
                    <div className="font-medium">{{ mada: "مدى", visa: "Visa", mastercard: "Mastercard", applepay: "Apple Pay", stcpay: "STC Pay" }[m]}</div>
                    <Badge variant={st.methods?.[m] === "ready" ? "default" : "outline"} className="mt-2">{STATUS_AR[st.methods?.[m]] ?? st.methods?.[m]}</Badge>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-6 items-center pt-2">
                <label className="flex items-center gap-2"><Switch checked={st.settings.card_enabled} onCheckedChange={(v) => saveSetting({ card_enabled: v })} />البطاقات (مدى/فيزا/ماستركارد)</label>
                {(["applepay_status", "stcpay_status"] as const).map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <span>{k === "applepay_status" ? "Apple Pay" : "STC Pay"}</span>
                    <Select value={st.settings[k]} onValueChange={(v) => saveSetting({ [k]: v })}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="configuration_required">تحتاج إعداد</SelectItem>
                        <SelectItem value="enabled">جاهزة (بعد إكمال الإعداد)</SelectItem>
                        <SelectItem value="disabled">غير متاحة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Apple Pay يتطلب توثيق النطاق لدى المعالج، وSTC Pay يتطلب تفعيله في حساب المعالج قبل اعتبارهما جاهزين.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>المدفوعات</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 absolute top-3 start-3 text-muted-foreground" /><Input className="ps-9" placeholder="رقم العملية أو مرجع المعالج" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">الكل</SelectItem>{Object.entries(PAY_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-muted-foreground border-b border-border">{["رقم العملية", "العميل", "النوع", "المبلغ", "الحالة", "البيئة", "التاريخ", ""].map((h) => <th key={h} className="p-2 text-start font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {list.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">لا توجد مدفوعات بعد</td></tr>}
                  {list.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="p-2 font-mono" dir="ltr">{p.internal_payment_id}</td>
                      <td className="p-2">{profiles[p.user_id]?.full_name ?? profiles[p.user_id]?.email ?? "—"}</td>
                      <td className="p-2">{{ wallet_topup: "شحن محفظة", dev_invoice: "فاتورة", service_order: "طلب خدمة" }[p.reference_type as string]}</td>
                      <td className="p-2">{sar(p.amount_minor)} ر.س</td>
                      <td className="p-2"><Badge variant={p.status === "paid" ? "default" : "outline"}>{PAY_STATUS[p.status] ?? p.status}</Badge></td>
                      <td className="p-2">{p.environment === "live" ? "LIVE" : "TEST"}</td>
                      <td className="p-2">{new Date(p.created_at).toLocaleString("ar-SA")}</td>
                      <td className="p-2"><Button size="sm" variant="ghost" onClick={() => openDetail(p.id)}><Eye className="w-4 h-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && (setDetail(null), setRefund(null))}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تفاصيل الدفعة {detail?.payment?.internal_payment_id}</DialogTitle></DialogHeader>
          {detail?.payment && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Info k="مرجع المعالج" v={<span dir="ltr" className="font-mono text-xs">{detail.payment.provider_payment_id ?? "—"}</span>} />
                <Info k="حالة المعالج" v={detail.payment.provider_status ?? "—"} />
                <Info k="المبلغ" v={`${sar(detail.payment.amount_minor)} ر.س`} />
                <Info k="المسترد" v={`${sar(detail.payment.refunded_minor)} ر.س`} />
                <Info k="الطريقة" v={`${detail.payment.payment_method ?? "—"} ${detail.payment.card_last4 ? "•••• " + detail.payment.card_last4 : ""}`} />
                <Info k="سبب المراجعة" v={detail.payment.failure_code ?? "—"} />
              </div>
              <div>
                <div className="font-medium mb-2">سجل الأحداث</div>
                <ul className="space-y-1">{detail.events.map((e: any) => <li key={e.id} className="flex justify-between gap-2 border-b border-border/40 py-1"><span>{e.event_type} · {e.source}</span><span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("ar-SA")}</span></li>)}</ul>
              </div>
              {detail.refunds.length > 0 && <div><div className="font-medium mb-2">الاستردادات</div>{detail.refunds.map((r: any) => <div key={r.id}>{sar(r.amount_minor)} ر.س · {r.status} · {r.reason}</div>)}</div>}
              <div className="flex gap-2 flex-wrap">
                {detail.payment.provider_payment_id && !detail.payment.processed_at && <Button variant="outline" onClick={async () => { try { await call({ action: "admin_reverify", payment_id: detail.payment.id }); openDetail(detail.payment.id); } catch (e: any) { toast.error(e.message); } }}>إعادة التحقق</Button>}
                {["paid", "partially_refunded"].includes(detail.payment.status) && !refund && (
                  <Button variant="destructive" className="gap-2" onClick={() => setRefund({ amount: ((detail.payment.amount_minor - detail.payment.refunded_minor) / 100).toFixed(2), reason: "", key: crypto.randomUUID() })}><Undo2 className="w-4 h-4" />استرداد</Button>
                )}
              </div>
              {refund && (
                <div className="space-y-2 rounded-lg border border-destructive/40 p-3">
                  <p className="text-xs text-muted-foreground">يُخصم مبلغ الاسترداد من محفظة العميل أولاً ثم يُعاد إلى بطاقته. إذا كان العميل قد صرف الرصيد يجب إلغاء الطلب أولاً.</p>
                  <Input type="number" value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} />
                  <Textarea placeholder="سبب الاسترداد" value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} />
                  <Button disabled={busy || refund.reason.trim().length < 3 || Number(refund.amount) <= 0} onClick={doRefund}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الاسترداد"}</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="rounded-lg bg-muted/40 p-3"><div className="text-xs text-muted-foreground mb-1">{k}</div><div className="font-medium">{v}</div></div>;
}
