import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, Loader2, XCircle, AlertTriangle } from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { CustomerPayment, METHOD_LABEL, confirmPayment, sar } from "@/lib/payments";

// The redirect itself proves nothing: we only show what the server confirmed with the processor.
export default function PaymentReturn() {
  const [sp] = useSearchParams();
  const pid = sp.get("pid") ?? "";
  const ref = sp.get("id") ?? undefined;
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [p, setP] = useState<CustomerPayment | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true, tries = 0;
    const tick = async () => {
      try {
        const r = await confirmPayment(pid, ref);
        if (!alive) return;
        setP(r.payment);
        if (["initiated", "pending"].includes(r.payment.status) && tries++ < 8) setTimeout(tick, 2500);
      } catch { if (alive) setErr(true); }
    };
    if (/^PAY-\d{4}-[A-Z0-9]{6}$/.test(pid)) tick(); else setErr(true);
    return () => { alive = false; };
  }, [pid, ref]);

  const s = p?.status;
  const ok = s === "paid" || s === "refunded" || s === "partially_refunded";
  const waiting = !p || s === "initiated" || s === "pending";
  const method = p?.payment_method ? METHOD_LABEL[p.payment_method] : null;
  const next = p?.reference_type === "dev_invoice" ? "/dashboard/dev-orders" : p?.reference_type === "service_order" ? "/dashboard/orders" : "/dashboard/financial";

  return (
    <ClientDashboardLayout>
      <div className="max-w-lg mx-auto px-4 py-10 animate-fade-in">
        <Card><CardContent className="p-8 text-center space-y-5">
          {err ? <AlertTriangle className="w-14 h-14 mx-auto text-destructive" />
            : waiting ? <Loader2 className="w-14 h-14 mx-auto animate-spin text-primary" />
            : ok ? <CheckCircle2 className="w-14 h-14 mx-auto text-primary" />
            : s === "review" ? <Clock className="w-14 h-14 mx-auto text-muted-foreground" />
            : <XCircle className="w-14 h-14 mx-auto text-destructive" />}
          <h1 className="text-xl font-bold">
            {err ? t("تعذر العثور على العملية", "Payment not found")
              : waiting ? t("جاري التحقق من الدفع…", "Verifying your payment…")
              : ok ? t("تم استلام دفعتك بنجاح", "Payment received successfully")
              : s === "review" ? t("الدفعة قيد المراجعة", "Payment under review")
              : t("لم تكتمل عملية الدفع", "Payment was not completed")}
          </h1>
          {s === "review" && <p className="text-sm text-muted-foreground">{t("سيتواصل معك فريقنا قريباً. لم يتم خصم أو إضافة أي مبلغ تلقائياً.", "Our team will contact you shortly. Nothing was applied automatically.")}</p>}
          {s === "failed" && <p className="text-sm text-muted-foreground">{t("لم يتم خصم أي مبلغ من حسابك لدينا. يمكنك المحاولة مرة أخرى.", "Nothing was charged to your account with us. You can try again.")}</p>}
          {p && (
            <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-2 text-start">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("رقم العملية", "Payment number")}</span><span dir="ltr" className="font-mono">{p.internal_payment_id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("المبلغ", "Amount")}</span><span>{sar(p.amount_minor)} {t("ر.س", "SAR")}</span></div>
              {method && <div className="flex justify-between"><span className="text-muted-foreground">{t("طريقة الدفع", "Payment method")}</span><span>{lang === "en" ? method.en : method.ar}{p.card_last4 ? ` •••• ${p.card_last4}` : ""}</span></div>}
              {ok && p.result?.order_number && <div className="flex justify-between"><span className="text-muted-foreground">{t("رقم الطلب", "Order number")}</span><span dir="ltr">{p.result.order_number}</span></div>}
              {ok && p.result?.credited_to_wallet && <p className="text-muted-foreground">{t("تمت إضافة المبلغ إلى رصيد محفظتك.", "The amount was added to your wallet balance.")}</p>}
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {s === "failed" && p?.reference_type === "wallet_topup" && <Button onClick={() => navigate("/dashboard/deposit")}>{t("حاول مرة أخرى", "Try again")}</Button>}
            <Button variant={s === "failed" ? "outline" : "default"} onClick={() => navigate(next)}>{t("متابعة", "Continue")}</Button>
          </div>
        </CardContent></Card>
      </div>
    </ClientDashboardLayout>
  );
}
