import { supabase } from "@/integrations/supabase/client";

/**
 * All wallet money movement goes through server-side database functions.
 * The browser only sends identifiers/options plus an idempotency key;
 * prices, discounts, totals and balances are computed and locked on the server.
 */

export const newIdempotencyKey = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

const ERRORS: Record<string, string> = {
  AUTH_REQUIRED: "يجب تسجيل الدخول أولاً",
  INSUFFICIENT_BALANCE: "رصيدك غير كافٍ، يرجى شحن حسابك",
  INSUFFICIENT_POINTS: "لا تملك نقاطاً كافية",
  INVALID_POINTS: "الحد الأدنى للاستبدال 100 نقطة",
  SERVICE_NOT_AVAILABLE: "الخدمة غير متاحة حالياً",
  SERVICE_REQUIRES_QUOTE: "هذه الخدمة تتطلب عرض سعر، يرجى التواصل معنا",
  INVALID_QUANTITY: "الكمية غير صالحة لهذه الخدمة",
  INVALID_LINK: "الرابط غير صالح",
  INVALID_NOTES: "الملاحظات طويلة جداً",
  COUPON_INVALID: "كود الخصم غير صالح",
  COUPON_EXPIRED: "كود الخصم منتهي الصلاحية",
  COUPON_EXHAUSTED: "تم استنفاد استخدامات كود الخصم",
  COUPON_MIN_ORDER: "لم يتم الوصول للحد الأدنى لكود الخصم",
  INVALID_TOTAL: "إجمالي الطلب غير صالح",
  INVOICE_NOT_FOUND: "الفاتورة غير موجودة",
  INVOICE_NOT_PAYABLE: "هذه الفاتورة مدفوعة أو غير قابلة للدفع",
  FORBIDDEN: "غير مصرح لك بهذه العملية",
  REASON_REQUIRED: "يجب كتابة سبب العملية",
  INVALID_AMOUNT: "المبلغ غير صالح",
  REFUND_EXCEEDS_REFUNDABLE: "مبلغ الاسترداد يتجاوز المبلغ القابل للاسترداد",
  ORIGINAL_NOT_REFUNDABLE: "العملية الأصلية غير قابلة للاسترداد",
};

export const walletErrorMessage = (err: unknown): string => {
  const msg = (err as { message?: string })?.message || "";
  const code = Object.keys(ERRORS).find((k) => msg.includes(k));
  return code ? ERRORS[code] : "تعذر إتمام العملية، يرجى المحاولة مرة أخرى";
};

type RpcResult = Record<string, any>;

async function call(fn: string, args: Record<string, unknown>): Promise<RpcResult> {
  const { data, error } = await (supabase.rpc as any)(fn, args);
  if (error) throw error;
  return (data || {}) as RpcResult;
}

export const payServiceOrder = (a: {
  serviceId: string; quantity: number; link?: string | null; notes?: string | null;
  couponCode?: string | null; idempotencyKey: string;
}) => call("pay_service_order", {
  p_service_id: a.serviceId, p_quantity: a.quantity, p_link: a.link ?? null,
  p_notes: a.notes ?? null, p_coupon_code: a.couponCode ?? null, p_idempotency_key: a.idempotencyKey,
});

export const payDesignOrder = (a: { serviceId: string; link?: string | null; notes?: string | null; idempotencyKey: string }) =>
  call("pay_design_order", { p_service_id: a.serviceId, p_link: a.link ?? null, p_notes: a.notes ?? null, p_idempotency_key: a.idempotencyKey });

export const payDevInvoice = (invoiceId: string, idempotencyKey: string) =>
  call("pay_dev_invoice", { p_invoice_id: invoiceId, p_idempotency_key: idempotencyKey });

export const redeemPointsToWallet = (points: number, idempotencyKey: string) =>
  call("redeem_points_to_wallet", { p_points: Math.floor(points), p_idempotency_key: idempotencyKey });

export const adminAdjustWallet = (a: { userId: string; action: "credit" | "debit"; amount: number; reason: string; idempotencyKey: string }) =>
  call("admin_adjust_wallet", { p_user_id: a.userId, p_action: a.action, p_amount: a.amount, p_reason: a.reason, p_idempotency_key: a.idempotencyKey });
