import { supabase } from "@/integrations/supabase/client";

// Client helper for the platform payment service. The browser never sends amounts it wants charged:
// the server recalculates every total from our own records.
export type PaymentType = "wallet_topup" | "dev_invoice" | "service_order";

export interface CustomerPayment {
  id: string;
  internal_payment_id: string;
  reference_type: PaymentType;
  reference_id: string | null;
  description: string | null;
  amount_minor: number;
  currency: string;
  status: "initiated" | "pending" | "paid" | "failed" | "review" | "refunded" | "partially_refunded" | "expired";
  payment_method: string | null;
  card_last4: string | null;
  refunded_minor: number;
  result: Record<string, any>;
  paid_at: string | null;
  created_at: string;
  subtotal?: number | null;
  discount?: number | null;
  vat?: number | null;
}

async function call<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("payments", { body });
  if (error) {
    let code = "PAYMENT_ERROR";
    try { code = (await (error as any).context?.json())?.error ?? code; } catch { /* ignore */ }
    throw new Error(code);
  }
  return data as T;
}

const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export async function getGatewayConfig() {
  return call<{ available: boolean; methods: string[]; min_topup: number; max_topup: number }>({ action: "config" });
}

export async function startPayment(type: PaymentType, opts: { reference_id?: string; intent?: Record<string, unknown>; idempotency_key?: string } = {}) {
  const r = await call<{ internal_payment_id: string }>({ action: "create", type, reference_id: opts.reference_id, intent: opts.intent ?? {}, idempotency_key: opts.idempotency_key ?? newKey() });
  return r.internal_payment_id;
}

export const getCheckout = (pid: string) => call<{ payment: CustomerPayment; form: any | null }>({ action: "checkout", internal_payment_id: pid });
export const confirmPayment = (pid: string, reference?: string) => call<{ payment: CustomerPayment }>({ action: "confirm", internal_payment_id: pid, reference });
export const getPayment = (pid: string) => call<{ payment: CustomerPayment }>({ action: "get", internal_payment_id: pid });

export const sar = (minor: number) => (minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const METHOD_LABEL: Record<string, { ar: string; en: string }> = {
  mada: { ar: "مدى", en: "mada" }, visa: { ar: "فيزا", en: "Visa" }, mastercard: { ar: "ماستركارد", en: "Mastercard" },
  amex: { ar: "أمريكان إكسبريس", en: "American Express" }, applepay: { ar: "Apple Pay", en: "Apple Pay" }, stcpay: { ar: "STC Pay", en: "STC Pay" },
};

const ERRORS: Record<string, string> = {
  GATEWAY_UNAVAILABLE: "الدفع الإلكتروني غير متاح حالياً، يرجى المحاولة لاحقاً",
  INVALID_AMOUNT: "المبلغ غير صالح",
  INVOICE_NOT_FOUND: "الفاتورة غير موجودة",
  INVOICE_NOT_PAYABLE: "هذه الفاتورة لم تعد قابلة للدفع",
  SERVICE_NOT_AVAILABLE: "الخدمة غير متاحة حالياً",
  SERVICE_REQUIRES_QUOTE: "هذه الخدمة تتطلب عرض سعر",
  INVALID_QUANTITY: "الكمية غير صالحة",
  COUPON_INVALID: "كود الخصم غير صالح",
  COUPON_EXPIRED: "كود الخصم منتهي",
  COUPON_EXHAUSTED: "كود الخصم مستنفد",
  COUPON_MIN_ORDER: "الطلب أقل من الحد الأدنى لكود الخصم",
  PAYMENT_NOT_FOUND: "عملية الدفع غير موجودة",
};
export const paymentErrorText = (code?: string) => ERRORS[code ?? ""] ?? "تعذر إتمام العملية، يرجى المحاولة لاحقاً";
