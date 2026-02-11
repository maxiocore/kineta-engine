import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ash-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key from ASH Holdings
    const apiKey = req.headers.get("x-ash-api-key");
    const expectedKey = Deno.env.get("ASH_HOLDINGS_API_KEY");

    if (!apiKey || apiKey !== expectedKey) {
      return new Response(
        JSON.stringify({ success: false, error: "unauthorized", message_ar: "مفتاح API غير صالح" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { wallet_account_number, phone, email, amount, external_transaction_id, metadata } = await req.json();

    // Must have at least one identifier
    if (!wallet_account_number && !phone && !email) {
      return new Response(
        JSON.stringify({ success: false, error: "missing_identifier", message_ar: "يجب توفير رقم الحساب أو رقم الجوال أو البريد الإلكتروني" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount
    if (!amount) {
      return new Response(
        JSON.stringify({ success: false, error: "missing_fields", message_ar: "المبلغ مطلوب" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_amount", message_ar: "المبلغ يجب أن يكون أكبر من صفر" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve user_id from any identifier
    let wallet: { user_id: string; balance: number; wallet_account_number: string } | null = null;

    // Priority 1: wallet_account_number
    if (wallet_account_number) {
      const { data } = await supabase
        .from("user_balances")
        .select("user_id, balance, wallet_account_number")
        .eq("wallet_account_number", wallet_account_number)
        .single();
      wallet = data;
    }

    // Priority 2: phone number
    if (!wallet && phone) {
      // Normalize phone: ensure it starts with +966
      let normalizedPhone = phone.replace(/\D/g, '');
      if (normalizedPhone.startsWith('00966')) normalizedPhone = normalizedPhone.substring(2);
      else if (normalizedPhone.startsWith('0')) normalizedPhone = '966' + normalizedPhone.substring(1);
      if (!normalizedPhone.startsWith('966')) normalizedPhone = '966' + normalizedPhone;
      const phoneWithPlus = '+' + normalizedPhone;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", phoneWithPlus)
        .eq("phone_verified", true)
        .single();

      if (profile) {
        const { data } = await supabase
          .from("user_balances")
          .select("user_id, balance, wallet_account_number")
          .eq("user_id", profile.id)
          .single();
        wallet = data;
      }
    }

    // Priority 3: email
    if (!wallet && email) {
      // Look up user by email in auth.users via profiles or directly
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const matchedUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (matchedUser) {
        const { data } = await supabase
          .from("user_balances")
          .select("user_id, balance, wallet_account_number")
          .eq("user_id", matchedUser.id)
          .single();
        wallet = data;
      }
    }

    if (!wallet) {
      return new Response(
        JSON.stringify({ success: false, error: "account_not_found", message_ar: "الحساب غير موجود" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate transaction
    if (external_transaction_id) {
      const { data: existing } = await supabase
        .from("external_deposits")
        .select("id")
        .eq("external_transaction_id", external_transaction_id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ success: false, error: "duplicate_transaction", message_ar: "هذه العملية تمت معالجتها مسبقاً" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Add balance to user
    const newBalance = Number(wallet.balance) + Number(amount);
    const { error: updateError } = await supabase
      .from("user_balances")
      .update({
        balance: newBalance,
        total_deposited: undefined, // will be handled by trigger
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", wallet.user_id);

    // Actually update total_deposited separately
    await supabase.rpc("increment_total_deposited_external", {
      p_user_id: wallet.user_id,
      p_amount: amount,
    }).catch(() => {
      // Fallback: direct update
      return supabase
        .from("user_balances")
        .update({
          balance: newBalance,
          total_deposited: Number(wallet.balance) + Number(amount), // approximate
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", wallet.user_id);
    });

    if (updateError) {
      console.error("Balance update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "update_failed", message_ar: "فشل تحديث الرصيد" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record external deposit
    const { error: depositError } = await supabase
      .from("external_deposits")
      .insert({
        wallet_account_number,
        user_id: wallet.user_id,
        amount,
        source: "ash_holdings",
        external_transaction_id: external_transaction_id || null,
        status: "completed",
        metadata: metadata || null,
      });

    if (depositError) {
      console.error("Deposit record error:", depositError);
    }

    // Log balance change
    await supabase.from("balance_logs").insert({
      user_id: wallet.user_id,
      action_type: "external_deposit",
      amount: amount,
      balance_before: Number(wallet.balance),
      balance_after: newBalance,
      reference_type: "external_deposit",
      reference_id: external_transaction_id || null,
      notes: "إيداع خارجي من ASH Holdings",
    });

    // Send notification to user
    await supabase.from("notifications").insert({
      user_id: wallet.user_id,
      title: "تم إيداع رصيد جديد 💰",
      message: `تم إضافة ${amount} ر.س إلى محفظتك من ASH Holdings`,
      type: "success",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message_ar: "تم الإيداع بنجاح",
        new_balance: newBalance,
        wallet_account_number,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error", message_ar: "خطأ داخلي" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
