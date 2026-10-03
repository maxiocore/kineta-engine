import { PaymentProvider, ProviderError, ProviderPayment, ProviderStatus, timingSafeEqual } from "./provider.ts";

const BASE = "https://api.moyasar.com/v1";
const METHOD: Record<string, string> = { mada: "mada", visa: "visa", master: "mastercard", mastercard: "mastercard", amex: "amex" };

export class MoyasarPaymentProvider implements PaymentProvider {
  readonly name = "Moyasar";
  private sk = Deno.env.get("MOYASAR_SECRET_KEY") ?? "";
  private pk = Deno.env.get("MOYASAR_PUBLISHABLE_KEY") ?? "";
  private wh = Deno.env.get("MOYASAR_WEBHOOK_SECRET") ?? "";

  environment() { return this.sk.startsWith("sk_live_") ? "live" as const : "sandbox" as const; }
  isConfigured() {
    const env = this.environment();
    const pkOk = env === "live" ? this.pk.startsWith("pk_live_") : this.pk.startsWith("pk_test_");
    return /^sk_(test|live)_/.test(this.sk) && pkOk;
  }
  webhookConfigured() { return this.wh.length >= 16; }
  publishableKey() { return this.isConfigured() ? this.pk : null; }

  private async call(path: string, init: RequestInit = {}) {
    if (!this.isConfigured()) throw new ProviderError("not_configured");
    let res: Response;
    try {
      res = await fetch(BASE + path, {
        ...init,
        headers: { Authorization: "Basic " + btoa(this.sk + ":"), "Content-Type": "application/json", ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(15000),
      });
    } catch { throw new ProviderError("network_error"); }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ProviderError(res.status === 401 ? "auth_failed" : res.status === 404 ? "not_found" : "provider_error", res.status);
    return body;
  }

  private map(p: any): ProviderPayment {
    const s = String(p?.status ?? "unknown") as ProviderStatus;
    const src = p?.source ?? {};
    const type = String(src.type ?? "");
    const method = type === "applepay" ? "applepay" : type === "stcpay" ? "stcpay" : METHOD[String(src.company ?? "").toLowerCase()] ?? (type || null);
    const num = String(src.number ?? "");
    return {
      id: String(p?.id ?? ""),
      status: ["initiated", "paid", "authorized", "captured", "failed", "refunded", "voided"].includes(s) ? s : "unknown",
      amountMinor: Number(p?.amount),
      currency: String(p?.currency ?? ""),
      internalId: p?.metadata?.internal_payment_id ? String(p.metadata.internal_payment_id) : null,
      method,
      last4: /\d{4}$/.test(num) ? num.slice(-4) : null,
      live: p?.live === true || this.environment() === "live",
    };
  }

  async testConnection() {
    try { await this.call("/payments?page=1"); return { ok: true }; }
    catch (e) { return { ok: false, code: (e as ProviderError).code }; }
  }
  async getPayment(id: string) {
    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) throw new ProviderError("invalid_reference");
    return this.map(await this.call(`/payments/${id}`));
  }
  async refundPayment(id: string, amountMinor: number) {
    return this.map(await this.call(`/payments/${id}/refund`, { method: "POST", body: JSON.stringify({ amount: amountMinor }) }));
  }
  async voidPayment(id: string) {
    return this.map(await this.call(`/payments/${id}/void`, { method: "POST" }));
  }
  verifyWebhook(body: Record<string, unknown>) {
    const t = typeof body.secret_token === "string" ? body.secret_token : "";
    return this.webhookConfigured() && t.length > 0 && timingSafeEqual(t, this.wh);
  }
  webhookPaymentId(body: Record<string, unknown>) {
    const d = body.data as any;
    return d && typeof d.id === "string" ? d.id : null;
  }
}
