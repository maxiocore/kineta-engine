// Platform payment service. Customers only ever see our own payment numbers and safe statuses.
// Processor identity, IDs and raw errors stay server-side / admin-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { MoyasarPaymentProvider } from "./moyasar.ts";
import { PaymentProvider, ProviderError } from "./provider.ts";

const provider: PaymentProvider & { webhookConfigured?: () => boolean } = new MoyasarPaymentProvider();
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const ORIGINS = [/^https:\/\/([a-z0-9-]+\.)*lovable\.app$/, /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/, /^https:\/\/(www\.)?ash-holding\.sa$/, /^http:\/\/localhost:\d+$/];
const CUSTOMER_FIELDS = "id,internal_payment_id,reference_type,reference_id,description,amount_minor,currency,status,payment_method,card_last4,refunded_minor,result,failure_code,paid_at,created_at";
const SAFE_ERRORS = new Set(["INVALID_AMOUNT", "INVOICE_NOT_FOUND", "INVOICE_NOT_PAYABLE", "INVALID_TOTAL", "SERVICE_NOT_AVAILABLE", "SERVICE_REQUIRES_QUOTE",
  "INVALID_QUANTITY", "COUPON_INVALID", "COUPON_EXPIRED", "COUPON_EXHAUSTED", "COUPON_MIN_ORDER", "INVALID_LINK", "INVALID_NOTES", "INVALID_IDEMPOTENCY_KEY",
  "INVALID_PAYMENT_TYPE", "REFUND_EXCEEDS_REFUNDABLE", "PAYMENT_NOT_REFUNDABLE", "INSUFFICIENT_BALANCE", "REASON_REQUIRED", "PAYMENT_NOT_FOUND"]);

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const dbErr = (e: { message?: string } | null) => { const m = (e?.message ?? "").match(/[A-Z_]{5,}/)?.[0] ?? ""; return SAFE_ERRORS.has(m) ? m : "PAYMENT_ERROR"; };

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("config") }),
  z.object({ action: z.literal("create"), type: z.enum(["wallet_topup", "dev_invoice", "service_order"]), reference_id: z.string().uuid().optional(),
    intent: z.object({ amount: z.number().positive().max(1000000).optional(), service_id: z.string().uuid().optional(), quantity: z.number().int().positive().max(1000000).optional(),
      link: z.string().max(2000).optional(), notes: z.string().max(10000).optional(), coupon_code: z.string().max(64).optional() }).default({}),
    idempotency_key: z.string().min(8).max(100) }),
  z.object({ action: z.literal("checkout"), internal_payment_id: z.string().regex(/^PAY-\d{4}-[A-Z0-9]{6}$/) }),
  z.object({ action: z.literal("confirm"), internal_payment_id: z.string().regex(/^PAY-\d{4}-[A-Z0-9]{6}$/), reference: z.string().min(8).max(64).optional() }),
  z.object({ action: z.literal("get"), internal_payment_id: z.string().regex(/^PAY-\d{4}-[A-Z0-9]{6}$/) }),
  z.object({ action: z.literal("admin_status") }),
  z.object({ action: z.literal("admin_list"), status: z.string().max(30).optional(), search: z.string().max(40).optional() }),
  z.object({ action: z.literal("admin_detail"), payment_id: z.string().uuid() }),
  z.object({ action: z.literal("admin_reverify"), payment_id: z.string().uuid() }),
  z.object({ action: z.literal("admin_refund"), payment_id: z.string().uuid(), amount: z.number().positive().max(1000000), reason: z.string().min(3).max(500), idempotency_key: z.string().min(8).max(100) }),
  z.object({ action: z.literal("admin_settings"), card_enabled: z.boolean().optional(),
    applepay_status: z.enum(["disabled", "configuration_required", "enabled"]).optional(), stcpay_status: z.enum(["disabled", "configuration_required", "enabled"]).optional() }),
]);

async function settings() { return (await db.from("payment_gateway_settings").select("*").eq("id", true).single()).data!; }

function methodsFor(s: any) {
  const m: string[] = [];
  if (s.card_enabled) m.push("creditcard");
  if (s.applepay_status === "enabled") m.push("applepay");
  if (s.stcpay_status === "enabled") m.push("stcpay");
  return m;
}

// Gateway is usable only when keys exist and match the configured environment. Live stays locked unless explicitly unlocked server-side.
async function gatewayReady() {
  const s = await settings();
  const env = provider.environment();
  const liveUnlocked = Deno.env.get("LIVE_PAYMENTS_ENABLED") === "true";
  const ok = provider.isConfigured() && env === s.environment && (env === "sandbox" || liveUnlocked);
  return { ok, s, env };
}

// Scoped one-shot live test: only the override's user, wallet_topup, exactly 100 halalas, one payment.
async function activeOverride(userId: string) {
  const { data } = await db.from("live_payment_test_overrides").select("*").eq("user_id", userId).eq("active", true)
    .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}
async function gatewayReadyFor(userId: string, internalPaymentId?: string) {
  const g = await gatewayReady();
  if (g.ok || g.env !== "live" || !provider.isConfigured() || g.env !== g.s.environment) return g;
  const o = await activeOverride(userId);
  if (!o) return g;
  if (internalPaymentId) {
    if (!o.payment_id) return g;
    const { data: p } = await db.from("payments").select("id,internal_payment_id").eq("id", o.payment_id).maybeSingle();
    if (p?.internal_payment_id !== internalPaymentId) return g;
  }
  return { ...g, ok: true, override: o, s: { ...g.s, applepay_status: "disabled", stcpay_status: "disabled" } };
}

async function verifyAndApply(paymentRow: any, providerRef: string, source: string) {
  let pp;
  try { pp = await provider.getPayment(providerRef); }
  catch (e) {
    await db.from("payment_events").insert({ payment_id: paymentRow.id, source, event_type: "verify_failed", details: { code: (e as ProviderError).code } });
    return { ok: false, status: "pending" };
  }
  if ((pp.live && paymentRow.environment !== "live") || (!pp.live && paymentRow.environment === "live")) {
    await db.from("payment_events").insert({ payment_id: paymentRow.id, source, event_type: "environment_mismatch", details: {} });
    return { ok: false, status: "review" };
  }
  const { data, error } = await db.rpc("payment_apply_verified", {
    p_payment_id: paymentRow.id, p_provider_payment_id: pp.id, p_provider_status: pp.status, p_amount_minor: pp.amountMinor,
    p_currency: pp.currency, p_meta_internal_id: pp.internalId, p_method: pp.method, p_last4: pp.last4, p_source: source,
  });
  if (error) { console.error("apply failed", error.code); return { ok: false, status: "pending" }; }
  return data as { ok: boolean; status: string };
}

async function handleWebhook(req: Request) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !provider.verifyWebhook(body)) return json({ ok: false }, 401);
  const eventId = typeof body.id === "string" ? body.id : null;
  const ref = provider.webhookPaymentId(body);
  if (!ref) return json({ ok: true, ignored: true });
  // Replay protection: each provider event is recorded once.
  if (eventId) {
    const { error } = await db.from("payment_events").insert({ source: "webhook", event_type: String(body.type ?? "event").slice(0, 40), provider_event_id: eventId, details: {} });
    if (error?.code === "23505") return json({ ok: true, duplicate: true });
  }
  // Never trust the payload: re-read the payment from the processor and map it via our own reference.
  let pp;
  try { pp = await provider.getPayment(ref); } catch { return json({ ok: false }, 502); }
  let row = (await db.from("payments").select("*").eq("provider_payment_id", pp.id).maybeSingle()).data;
  if (!row && pp.internalId) row = (await db.from("payments").select("*").eq("internal_payment_id", pp.internalId).maybeSingle()).data;
  if (!row) return json({ ok: true, unknown: true });
  if (eventId) await db.from("payment_events").update({ payment_id: row.id }).eq("provider_event_id", eventId);
  const r = await verifyAndApply(row, pp.id, "webhook");
  return json({ ok: true, status: r.status });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("hook") === "processor") return await handleWebhook(req);

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ error: "unauthorized" }, 401);
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ error: "unauthorized" }, 401);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "invalid_request" }, 400);
    const b = parsed.data;

    if (b.action.startsWith("admin_")) {
      const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "forbidden" }, 403);
    }

    switch (b.action) {
      case "config": {
        const { ok, s } = await gatewayReadyFor(user.id);
        return json({ available: ok, methods: ok ? methodsFor(s) : [], min_topup: Number(s.min_topup), max_topup: Number(s.max_topup) });
      }
      case "create": {
        const g = await gatewayReadyFor(user.id);
        if (!g.ok) return json({ error: "GATEWAY_UNAVAILABLE" }, 503);
        const o = (g as any).override;
        if (o) {
          if (b.type !== "wallet_topup" || b.intent.amount !== 1) return json({ error: "GATEWAY_UNAVAILABLE" }, 503);
          const { data: claimed } = await db.rpc("live_test_claim", { p_user: user.id, p_idempotency_key: b.idempotency_key });
          if (!claimed) return json({ error: "GATEWAY_UNAVAILABLE" }, 503);
        }
        const { data, error } = await db.rpc("payment_create", { p_user: user.id, p_type: b.type, p_reference_id: b.reference_id ?? null,
          p_intent: b.intent, p_idempotency_key: b.idempotency_key, p_environment: g.env });
        if (error) return json({ error: dbErr(error) }, 400);
        if (o) {
          if ((data as any).amount_minor !== 100) return json({ error: "GATEWAY_UNAVAILABLE" }, 503);
          await db.from("live_payment_test_overrides").update({ payment_id: (data as any).id }).eq("id", o.id).is("payment_id", null);
          await db.from("payment_events").insert({ payment_id: (data as any).id, source: "admin", event_type: "live_test_override", details: { override_id: o.id } });
        }
        return json({ internal_payment_id: (data as any).internal_payment_id, duplicate: (data as any).duplicate });
      }
      case "checkout": {
        const { ok, s } = await gatewayReadyFor(user.id, b.internal_payment_id);
        const { data: p } = await db.from("payments").select(CUSTOMER_FIELDS + ",user_id,intent").eq("internal_payment_id", b.internal_payment_id).maybeSingle();
        if (!p || p.user_id !== user.id) return json({ error: "PAYMENT_NOT_FOUND" }, 404);
        if (!ok) return json({ error: "GATEWAY_UNAVAILABLE" }, 503);
        const origin = req.headers.get("Origin") ?? "";
        if (!ORIGINS.some((r) => r.test(origin))) return json({ error: "invalid_origin" }, 400);
        const { user_id: _u, intent, ...pub } = p as any;
        return json({
          payment: { ...pub, subtotal: intent?.subtotal ?? null, discount: intent?.discount ?? null, vat: 0 },
          form: p.status === "initiated" || p.status === "pending" ? {
            amount: p.amount_minor, currency: p.currency, description: `${p.internal_payment_id}`,
            publishable_api_key: provider.publishableKey(), methods: methodsFor(s),
            callback_url: `${origin}/payment/return?pid=${encodeURIComponent(p.internal_payment_id)}`,
            metadata: { internal_payment_id: p.internal_payment_id },
          } : null,
        });
      }
      case "confirm": {
        const { data: p } = await db.from("payments").select("*").eq("internal_payment_id", b.internal_payment_id).maybeSingle();
        if (!p || p.user_id !== user.id) return json({ error: "PAYMENT_NOT_FOUND" }, 404);
        const ref = p.provider_payment_id ?? b.reference;
        if (!p.processed_at && ref) await verifyAndApply(p, ref, "callback");
        const { data: fresh } = await db.from("payments").select(CUSTOMER_FIELDS).eq("id", p.id).single();
        return json({ payment: fresh });
      }
      case "get": {
        const { data: p } = await db.from("payments").select(CUSTOMER_FIELDS + ",user_id").eq("internal_payment_id", b.internal_payment_id).maybeSingle();
        if (!p || (p as any).user_id !== user.id) return json({ error: "PAYMENT_NOT_FOUND" }, 404);
        const { user_id: _u, ...pub } = p as any;
        return json({ payment: pub });
      }

      // ---------------- Admin ----------------
      case "admin_status": {
        const s = await settings();
        const conn = provider.isConfigured() ? await provider.testConnection() : { ok: false, code: "not_configured" };
        return json({
          processor: provider.name, environment: provider.environment(), configured_environment: s.environment,
          keys_configured: provider.isConfigured(), webhook_secret_configured: provider.webhookConfigured?.() ?? false,
          live_payments_enabled: Deno.env.get("LIVE_PAYMENTS_ENABLED") === "true", connection: conn.ok ? "connected" : "disconnected", connection_code: conn.code ?? null,
          webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payments?hook=processor`,
          settings: s, paylink_new_payments: false,
          key_formats: (provider as any).keyFormats?.() ?? null,
          webhooks: conn.ok ? await (provider as any).listWebhooks?.().catch(() => null) : null,
          methods: {
            mada: s.card_enabled ? "ready" : "unavailable", visa: s.card_enabled ? "ready" : "unavailable", mastercard: s.card_enabled ? "ready" : "unavailable",
            applepay: s.applepay_status === "enabled" ? "ready" : s.applepay_status, stcpay: s.stcpay_status === "enabled" ? "ready" : s.stcpay_status,
          },
        });
      }
      case "admin_list": {
        let q = db.from("payments").select("*").order("created_at", { ascending: false }).limit(200);
        if (b.status) q = q.eq("status", b.status);
        if (b.search) q = q.or(`internal_payment_id.ilike.%${b.search.replace(/[^A-Za-z0-9-]/g, "")}%,provider_payment_id.ilike.%${b.search.replace(/[^A-Za-z0-9-]/g, "")}%`);
        const { data } = await q;
        const ids = [...new Set((data ?? []).map((r: any) => r.user_id))];
        const { data: profs } = ids.length ? await db.from("profiles").select("id,full_name,email").in("id", ids) : { data: [] };
        return json({ payments: data ?? [], profiles: profs ?? [] });
      }
      case "admin_detail": {
        const [{ data: p }, { data: ev }, { data: rf }] = await Promise.all([
          db.from("payments").select("*").eq("id", b.payment_id).maybeSingle(),
          db.from("payment_events").select("*").eq("payment_id", b.payment_id).order("created_at"),
          db.from("payment_refunds").select("*").eq("payment_id", b.payment_id).order("created_at"),
        ]);
        return json({ payment: p, events: ev ?? [], refunds: rf ?? [] });
      }
      case "admin_reverify": {
        const { data: p } = await db.from("payments").select("*").eq("id", b.payment_id).maybeSingle();
        if (!p?.provider_payment_id) return json({ error: "no_reference" }, 400);
        return json(await verifyAndApply(p, p.provider_payment_id, "admin"));
      }
      case "admin_refund": {
        const amountMinor = Math.round(b.amount * 100);
        const { data: prep, error } = await db.rpc("payment_refund_prepare", { p_payment_id: b.payment_id, p_amount_minor: amountMinor, p_reason: b.reason, p_admin: user.id, p_idempotency_key: b.idempotency_key });
        if (error) return json({ error: dbErr(error) }, 400);
        if ((prep as any).duplicate) return json(prep);
        let success = false, code: string | null = null;
        try { await provider.refundPayment((prep as any).provider_payment_id, amountMinor); success = true; }
        catch (e) { code = (e as ProviderError).code; }
        const { data: fin } = await db.rpc("payment_refund_finish", { p_refund_id: (prep as any).refund_id, p_success: success, p_failure: code });
        await db.from("audit_logs").insert({ table_name: "payments", action: success ? "PAYMENT_REFUND" : "PAYMENT_REFUND_FAILED", user_id: user.id,
          new_value: { amount_minor: amountMinor }, metadata: { payment_id: b.payment_id, refund_id: (prep as any).refund_id, reason: b.reason } });
        return json({ ...(fin as object), provider_error: code });
      }
      case "admin_settings": {
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user.id };
        for (const k of ["card_enabled", "applepay_status", "stcpay_status"] as const) if (b[k] !== undefined) patch[k] = b[k];
        const { data, error } = await db.from("payment_gateway_settings").update(patch).eq("id", true).select("*").single();
        if (error) return json({ error: "update_failed" }, 400);
        await db.from("audit_logs").insert({ table_name: "payment_gateway_settings", action: "UPDATE", user_id: user.id, new_value: patch });
        return json({ settings: data });
      }
    }
    return json({ error: "invalid_request" }, 400);
  } catch (e) {
    console.error("payments error", (e as Error).message?.slice(0, 80));
    return json({ error: "PAYMENT_ERROR" }, 500);
  }
});
