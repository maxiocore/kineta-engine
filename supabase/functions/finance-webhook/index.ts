import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ash-api-key",
};

interface FinanceWebhookPayload {
  event_type: string;
  // Identifiers (at least one required)
  wallet_account_number?: string;
  phone?: string;
  email?: string;
  user_id?: string;
  // Event data
  amount?: number;
  contract_number?: string;
  contract_status?: string;
  application_id?: string;
  external_transaction_id?: string;
  metadata?: Record<string, unknown>;
}

// Supported event types
type EventType =
  | "wallet.credit"
  | "wallet.debit"
  | "contract.status_changed"
  | "contract.finalized"
  | "installment.paid"
  | "deposit.completed"
  | "deposit.failed";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // 1. Validate API key
    const apiKey = req.headers.get("x-ash-api-key");
    const expectedKey = Deno.env.get("ASH_HOLDINGS_API_KEY");

    if (!apiKey || !expectedKey || !safeEqual(apiKey, expectedKey)) {
      return json({ success: false, error: "unauthorized", message_ar: "مفتاح API غير صالح" }, 401);
    }

    const payload: FinanceWebhookPayload = await req.json();
    const { event_type } = payload;

    if (!event_type) {
      return json({ success: false, error: "missing_event_type", message_ar: "نوع الحدث مطلوب" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 2. Resolve user
    const resolvedUserId = await resolveUser(supabase, payload);
    if (!resolvedUserId) {
      return json({ success: false, error: "account_not_found", message_ar: "الحساب غير موجود" }, 404);
    }

    // 3. Deduplicate
    if (payload.external_transaction_id) {
      const { data: dup } = await supabase
        .from("external_deposits")
        .select("id")
        .eq("external_transaction_id", payload.external_transaction_id)
        .maybeSingle();
      if (dup) {
        return json({ success: false, error: "duplicate_transaction", message_ar: "تمت معالجة هذه العملية مسبقاً" }, 409);
      }
    }

    // 4. Route by event type
    let result: { success: boolean; data?: Record<string, unknown> };

    switch (event_type as EventType) {
      case "wallet.credit":
        result = await handleWalletCredit(supabase, resolvedUserId, payload);
        break;
      case "wallet.debit":
        result = await handleWalletDebit(supabase, resolvedUserId, payload);
        break;
      case "contract.status_changed":
        result = await handleContractStatusChanged(supabase, resolvedUserId, payload);
        break;
      case "contract.finalized":
        result = await handleContractFinalized(supabase, resolvedUserId, payload);
        break;
      case "installment.paid":
        result = await handleInstallmentPaid(supabase, resolvedUserId, payload);
        break;
      case "deposit.completed":
        result = await handleDepositCompleted(supabase, resolvedUserId, payload);
        break;
      case "deposit.failed":
        result = await handleDepositFailed(supabase, resolvedUserId, payload);
        break;
      default:
        return json({ success: false, error: "unknown_event_type", message_ar: `نوع الحدث غير معروف: ${event_type}` }, 400);
    }

    return json({ success: true, event_type, ...result.data });
  } catch (error) {
    console.error("Finance webhook error:", error);
    return json({ success: false, error: "internal_error", message_ar: "خطأ داخلي" }, 500);
  }
});

// ── Resolve user from any identifier ──
async function resolveUser(supabase: ReturnType<typeof createClient>, payload: FinanceWebhookPayload): Promise<string | null> {
  if (payload.user_id) {
    const { data } = await supabase.from("user_balances").select("user_id").eq("user_id", payload.user_id).maybeSingle();
    if (data) return data.user_id;
  }

  if (payload.wallet_account_number) {
    const { data } = await supabase.from("user_balances").select("user_id").eq("wallet_account_number", payload.wallet_account_number).maybeSingle();
    if (data) return data.user_id;
  }

  if (payload.phone) {
    let n = payload.phone.replace(/\D/g, "");
    if (n.startsWith("00966")) n = n.substring(2);
    else if (n.startsWith("0")) n = "966" + n.substring(1);
    if (!n.startsWith("966")) n = "966" + n;
    const { data: profile } = await supabase.from("profiles").select("id").eq("phone", "+" + n).eq("phone_verified", true).maybeSingle();
    if (profile) return profile.id;
  }

  if (payload.email) {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const matched = authUsers?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === payload.email!.toLowerCase());
    if (matched) return matched.id;
  }

  return null;
}

// ── Wallet Credit ──
async function handleWalletCredit(supabase: ReturnType<typeof createClient>, userId: string, payload: FinanceWebhookPayload) {
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) throw new Error("Invalid amount");

  const { data: wallet } = await supabase.from("user_balances").select("balance, wallet_account_number").eq("user_id", userId).single();
  if (!wallet) throw new Error("Wallet not found");

  if (!payload.external_transaction_id) throw new Error("external_transaction_id required");
  // Atomic, locked, idempotent ledger credit (same external id => one credit)
  const { data: post, error: postErr } = await supabase.rpc("_wallet_post", {
    p_user: userId, p_amount: Math.round(amount * 100) / 100, p_action: "finance_credit", p_ref_type: "finance_webhook",
    p_ref_id: null, p_key: `fin:${payload.external_transaction_id}`,
    p_notes: (payload.metadata?.notes as string) || "إيداع تمويلي من ash.holdings", p_actor: null, p_original: null, p_spend: false,
  });
  if (postErr) throw new Error("ledger_failed");
  if ((post as any)?.duplicate) return { success: true, duplicate: true, data: { new_balance: (post as any).balance_after } };
  const newBalance = Number((post as any).balance_after);

  if (payload.external_transaction_id) {
    await supabase.from("external_deposits").insert({
      wallet_account_number: wallet.wallet_account_number, user_id: userId,
      amount, source: "ash_holdings_finance", external_transaction_id: payload.external_transaction_id,
      status: "completed", metadata: payload.metadata || null,
    });
  }

  await supabase.from("notifications").insert({
    user_id: userId, title: "تم إيداع مبلغ تمويلي 💰",
    message: `تم إضافة ${amount} ر.س إلى محفظتك من التمويل`, type: "success",
  });

  return { success: true, data: { new_balance: newBalance } };
}

// ── Wallet Debit ──
async function handleWalletDebit(supabase: ReturnType<typeof createClient>, userId: string, payload: FinanceWebhookPayload) {
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) throw new Error("Invalid amount");

  const { data: wallet } = await supabase.from("user_balances").select("balance, wallet_account_number").eq("user_id", userId).single();
  if (!wallet) throw new Error("Wallet not found");

  if (!payload.external_transaction_id) throw new Error("external_transaction_id required");
  const { data: post, error: postErr } = await supabase.rpc("_wallet_post", {
    p_user: userId, p_amount: -Math.round(amount * 100) / 100, p_action: "finance_debit", p_ref_type: "finance_webhook",
    p_ref_id: null, p_key: `fin:${payload.external_transaction_id}`,
    p_notes: (payload.metadata?.notes as string) || "خصم تمويلي", p_actor: null, p_original: null, p_spend: false,
  });
  if (postErr) throw new Error(postErr.message?.includes("INSUFFICIENT_BALANCE") ? "insufficient_balance" : "ledger_failed");
  if ((post as any)?.duplicate) return { success: true, duplicate: true, data: { new_balance: (post as any).balance_after } };
  const newBalance = Number((post as any).balance_after);

  await supabase.from("notifications").insert({
    user_id: userId, title: "تم خصم مبلغ من المحفظة",
    message: `تم خصم ${amount} ر.س من محفظتك (قسط تمويلي)`, type: "info",
  });

  return { success: true, data: { new_balance: newBalance } };
}

// ── Contract Status Changed ──
async function handleContractStatusChanged(supabase: ReturnType<typeof createClient>, userId: string, payload: FinanceWebhookPayload) {
  if (!payload.contract_number || !payload.contract_status) throw new Error("contract_number and contract_status required");

  const validStatuses = ["draft", "presented", "accepted", "finalized"];
  if (!validStatuses.includes(payload.contract_status)) throw new Error("Invalid contract_status");

  const { data: contract } = await supabase
    .from("financing_contracts")
    .select("id, status")
    .eq("contract_number", payload.contract_number)
    .eq("user_id", userId)
    .maybeSingle();

  if (!contract) throw new Error("Contract not found");

  const oldStatus = contract.status;
  await supabase.from("financing_contracts").update({
    status: payload.contract_status, updated_at: new Date().toISOString(),
  }).eq("id", contract.id);

  await supabase.from("financing_contract_events").insert({
    contract_id: contract.id, event_type: "status_changed",
    old_status: oldStatus, new_status: payload.contract_status,
    user_id: userId, metadata: payload.metadata || null,
  });

  const statusMessages: Record<string, string> = {
    draft: "تم إنشاء مسودة عقد التمويل",
    presented: "تم عرض عقد التمويل للمراجعة",
    accepted: "تم قبول عقد التمويل ✅",
    finalized: "تم اعتماد عقد التمويل نهائياً 🎉",
  };

  await supabase.from("notifications").insert({
    user_id: userId, title: "تحديث حالة العقد",
    message: statusMessages[payload.contract_status] || `حالة العقد: ${payload.contract_status}`,
    type: payload.contract_status === "finalized" ? "success" : "info",
  });

  return { success: true, data: { contract_id: contract.id, old_status: oldStatus, new_status: payload.contract_status } };
}

// ── Contract Finalized ──
async function handleContractFinalized(supabase: ReturnType<typeof createClient>, userId: string, payload: FinanceWebhookPayload) {
  return handleContractStatusChanged(supabase, userId, { ...payload, contract_status: "finalized" });
}

// ── Installment Paid ──
async function handleInstallmentPaid(supabase: ReturnType<typeof createClient>, userId: string, payload: FinanceWebhookPayload) {
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) throw new Error("Invalid amount");

  // Log in deposit ledger
  if (payload.application_id) {
    await supabase.from("financing_deposit_ledger").insert({
      deposit_key: `inst_${payload.external_transaction_id || Date.now()}`,
      application_id: payload.application_id,
      user_id: userId,
      amount,
      status: "completed",
      contract_id: null,
      processing_completed_at: new Date().toISOString(),
    });
  }

  await supabase.from("balance_logs").insert({
    user_id: userId, action_type: "installment_payment", amount: -amount,
    balance_before: 0, balance_after: 0,
    reference_type: "installment", reference_id: payload.external_transaction_id || null,
    notes: `سداد قسط تمويلي بمبلغ ${amount} ر.س`,
  });

  await supabase.from("notifications").insert({
    user_id: userId, title: "تم سداد القسط بنجاح ✅",
    message: `تم سداد قسط بمبلغ ${amount} ر.س`, type: "success",
  });

  return { success: true, data: { amount_paid: amount } };
}

// ── Deposit Completed ──
async function handleDepositCompleted(supabase: ReturnType<typeof createClient>, userId: string, payload: FinanceWebhookPayload) {
  if (payload.application_id) {
    await supabase.from("financing_deposit_ledger")
      .update({ status: "completed", processing_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("application_id", payload.application_id)
      .eq("user_id", userId)
      .eq("status", "pending");
  }

  // Credit wallet
  return handleWalletCredit(supabase, userId, payload);
}

// ── Deposit Failed ──
async function handleDepositFailed(supabase: ReturnType<typeof createClient>, userId: string, payload: FinanceWebhookPayload) {
  if (payload.application_id) {
    await supabase.from("financing_deposit_ledger")
      .update({
        status: "failed",
        failure_reason: (payload.metadata?.reason as string) || "فشل من المصدر",
        failure_code: (payload.metadata?.code as string) || "EXTERNAL_FAILURE",
        processing_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("application_id", payload.application_id)
      .eq("user_id", userId)
      .eq("status", "pending");
  }

  await supabase.from("notifications").insert({
    user_id: userId, title: "فشل عملية الإيداع ❌",
    message: (payload.metadata?.reason as string) || "فشلت عملية الإيداع التمويلي، يرجى المحاولة لاحقاً",
    type: "error",
  });

  return { success: true, data: { status: "failed" } };
}
