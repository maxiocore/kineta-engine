// Processor-agnostic payment interface. The rest of the platform talks only to this.
export type ProviderStatus = "initiated" | "paid" | "authorized" | "captured" | "failed" | "refunded" | "voided" | "unknown";

export interface ProviderPayment {
  id: string;
  status: ProviderStatus;
  amountMinor: number;
  currency: string;
  internalId: string | null; // our PAY-YYYY-XXXXXX from metadata
  method: string | null; // mada | visa | mastercard | amex | applepay | stcpay
  last4: string | null;
  live: boolean;
}

export class ProviderError extends Error {
  constructor(public code: string, public httpStatus = 0) { super(code); }
}

export interface PaymentProvider {
  readonly name: string; // admin-only
  environment(): "sandbox" | "live";
  isConfigured(): boolean;
  publishableKey(): string | null;
  testConnection(): Promise<{ ok: boolean; code?: string }>;
  getPayment(id: string): Promise<ProviderPayment>;
  refundPayment(id: string, amountMinor: number): Promise<ProviderPayment>;
  voidPayment(id: string): Promise<ProviderPayment>;
  verifyWebhook(body: Record<string, unknown>): boolean;
  webhookPaymentId(body: Record<string, unknown>): string | null;
}

export function timingSafeEqual(a: string, b: string) {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let r = 0;
  for (let i = 0; i < ea.length; i++) r |= ea[i] ^ eb[i];
  return r === 0;
}
