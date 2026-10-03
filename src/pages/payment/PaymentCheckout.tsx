import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Lock, ShieldCheck, Receipt, ArrowLeft, AlertTriangle } from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { CustomerPayment, confirmPayment, getCheckout, paymentErrorText, sar } from "@/lib/payments";

// Secure card form is rendered by the processor's official script inside our page, so card data
// never touches our servers. We pass our own internal reference only.
const SCRIPT = "https://cdn.moyasar.com/mpf/1.15.0/moyasar.js";
const STYLE = "https://cdn.moyasar.com/mpf/1.15.0/moyasar.css";

function loadForm(): Promise<any> {
  const w = window as any;
  if (w.Moyasar) return Promise.resolve(w.Moyasar);
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${STYLE}"]`)) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = STYLE; document.head.appendChild(l);
    }
    const s = document.createElement("script"); s.src = SCRIPT; s.async = true;
    s.onload = () => (w.Moyasar ? resolve(w.Moyasar) : reject(new Error("load")));
    s.onerror = () => reject(new Error("load"));
    document.body.appendChild(s);
  });
}

const TYPE_LABEL = { wallet_topup: ["شحن رصيد المحفظة", "Wallet top-up"], dev_invoice: ["دفع فاتورة", "Invoice payment"], service_order: ["طلب خدمة", "Service order"] } as const;

export default function PaymentCheckout() {
  const { pid = "" } = useParams();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [payment, setPayment] = useState<CustomerPayment | null>(null);
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formReady, setFormReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getCheckout(pid)
      .then((r) => { if (!alive) return; setPayment(r.payment); setForm(r.form); if (!r.form && ["paid", "refunded", "partially_refunded"].includes(r.payment.status)) navigate(`/payment/return?pid=${pid}`, { replace: true }); })
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [pid, navigate]);

  useEffect(() => {
    if (!form || !formRef.current) return;
    let cancelled = false;
    loadForm().then((M) => {
      if (cancelled || !formRef.current) return;
      formRef.current.innerHTML = "";
      M.init({
        element: formRef.current,
        amount: form.amount,
        currency: form.currency,
        description: form.description,
        publishable_api_key: form.publishable_api_key,
        callback_url: form.callback_url,
        methods: form.methods,
        supported_networks: ["mada", "visa", "mastercard"],
        metadata: form.metadata,
        language: lang === "en" ? "en" : "ar",
        apple_pay: form.methods.includes("applepay") ? { country: "SA", label: "ASH HOLDING", validate_merchant_url: "https://api.moyasar.com/v1/applepay/initiate" } : undefined,
        // Bind the processor reference to our payment before the 3-D Secure step (server re-verifies everything).
        on_completing: (p: any) => confirmPayment(pid, p?.id).catch(() => undefined),
      });
      setFormReady(true);
    }).catch(() => setError("GATEWAY_UNAVAILABLE"));
    return () => { cancelled = true; };
  }, [form, lang, pid]);

  const total = payment ? sar(payment.amount_minor) : "";
  const label = payment ? TYPE_LABEL[payment.reference_type] : null;

  return (
    <ClientDashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Lock className="w-6 h-6 text-primary" />{t("الدفع الإلكتروني", "Secure Payment")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("أكمل الدفع بأمان عبر بوابة الدفع الخاصة بمنصتنا", "Complete your payment securely through our platform")}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1"><ArrowLeft className="w-4 h-4 rtl:rotate-180" />{t("رجوع", "Back")}</Button>
        </div>

        {error ? (
          <Card className="border-destructive/40"><CardContent className="p-8 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
            <p className="font-medium">{t(paymentErrorText(error), error === "GATEWAY_UNAVAILABLE" ? "Online payment is temporarily unavailable. Please try again later." : error === "PAYMENT_NOT_FOUND" ? "Payment not found." : "We could not complete this request. Please try again later.")}</p>
            <Button variant="outline" onClick={() => navigate("/dashboard/financial")}>{t("العودة للمركز المالي", "Back to financial hub")}</Button>
          </CardContent></Card>
        ) : !payment ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2 h-fit overflow-hidden">
              <div className="bg-primary/10 border-b border-border p-5">
                <div className="flex items-center gap-2 text-primary font-semibold"><Receipt className="w-5 h-5" />{t("ملخص الدفع", "Payment summary")}</div>
              </div>
              <CardContent className="p-5 space-y-3 text-sm">
                <Row k={t("نوع العملية", "Type")} v={label ? t(label[0], label[1]) : ""} />
                {payment.description && payment.reference_type !== "wallet_topup" && <Row k={t("البيان", "Description")} v={payment.description} />}
                <Row k={t("رقم العملية", "Payment number")} v={<span dir="ltr" className="font-mono">{payment.internal_payment_id}</span>} />
                {payment.subtotal != null && <Row k={t("المبلغ", "Amount")} v={`${Number(payment.subtotal).toFixed(2)} ${t("ر.س", "SAR")}`} />}
                {Number(payment.discount ?? 0) > 0 && <Row k={t("الخصم", "Discount")} v={`- ${Number(payment.discount).toFixed(2)} ${t("ر.س", "SAR")}`} />}
                <Row k={t("ضريبة القيمة المضافة", "VAT")} v={`0.00 ${t("ر.س", "SAR")}`} />
                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="font-semibold">{t("الإجمالي", "Total")}</span>
                  <span className="text-xl font-bold text-primary">{total} {t("ر.س", "SAR")}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <span>{t("دفع إلكتروني آمن ومشفّر. لا نحتفظ ببيانات بطاقتك.", "Secure encrypted payment. We never store your card details.")}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {["mada", "Visa", "Mastercard"].map((m) => <Badge key={m} variant="secondary">{m === "mada" ? t("مدى", "mada") : m}</Badge>)}
                  {form?.methods?.includes("applepay") && <Badge variant="secondary">Apple Pay</Badge>}
                  {form?.methods?.includes("stcpay") && <Badge variant="secondary">STC Pay</Badge>}
                </div>
                {form ? (
                  <>
                    {!formReady && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
                    <div ref={formRef} className="payment-form" data-no-translate dir={lang === "en" ? "ltr" : "rtl"} />
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t("هذه العملية لم تعد قابلة للدفع.", "This payment can no longer be paid.")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="font-medium text-end">{v}</span></div>;
}
