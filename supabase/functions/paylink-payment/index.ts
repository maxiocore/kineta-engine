import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PAYLINK_API_ID = Deno.env.get("PAYLINK_API_ID");
const PAYLINK_SECRET_KEY = Deno.env.get("PAYLINK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Production: https://restapi.paylink.sa
// Testing: https://restpilot.paylink.sa
const PAYLINK_BASE_URL = "https://restapi.paylink.sa";

interface PaylinkAuthResponse {
  id_token: string;
}

interface PaylinkInvoiceResponse {
  transactionNo: string;
  url: string;
  orderStatus: string;
  paymentErrors?: any[];
}

async function getAuthToken(): Promise<string> {
  console.log("Getting Paylink auth token...");
  
  const response = await fetch(`${PAYLINK_BASE_URL}/api/auth`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiId: PAYLINK_API_ID,
      secretKey: PAYLINK_SECRET_KEY,
      persistToken: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Paylink auth error:", errorText);
    throw new Error(`Paylink authentication failed: ${response.status}`);
  }

  const data: PaylinkAuthResponse = await response.json();
  console.log("Paylink auth successful");
  return data.id_token;
}

async function createInvoice(
  token: string,
  orderNumber: string,
  amount: number,
  clientName: string,
  clientEmail: string,
  clientMobile: string,
  callbackUrl: string,
  cancelUrl: string
): Promise<PaylinkInvoiceResponse> {
  console.log("Creating Paylink invoice...", { orderNumber, amount });
  
  const response = await fetch(`${PAYLINK_BASE_URL}/api/addInvoice`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderNumber,
      amount,
      callBackUrl: callbackUrl,
      cancelUrl: cancelUrl,
      clientName,
      clientEmail,
      clientMobile,
      currency: "SAR",
      note: "شحن رصيد المحفظة",
      products: [
        {
          title: "شحن رصيد",
          price: amount,
          qty: 1,
          description: `شحن رصيد بمبلغ ${amount} ريال`,
          isDigital: true,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Paylink create invoice error:", errorText);
    throw new Error(`Failed to create invoice: ${response.status}`);
  }

  const data: PaylinkInvoiceResponse = await response.json();
  console.log("Invoice created:", data.transactionNo);
  return data;
}

async function getInvoice(
  token: string,
  transactionNo: string
): Promise<PaylinkInvoiceResponse> {
  console.log("Getting Paylink invoice...", transactionNo);
  
  const response = await fetch(
    `${PAYLINK_BASE_URL}/api/getInvoice/${transactionNo}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Paylink get invoice error:", errorText);
    throw new Error(`Failed to get invoice: ${response.status}`);
  }

  const data: PaylinkInvoiceResponse = await response.json();
  console.log("Invoice status:", data.orderStatus);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, ...params } = await req.json();

    console.log("Paylink action:", action);

    switch (action) {
      case "create-payment": {
        const {
          userId,
          amount,
          clientName,
          clientEmail,
          clientMobile,
          callbackUrl,
          cancelUrl,
        } = params;

        if (!userId || !amount || !clientName || !clientMobile) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate unique order number
        const orderNumber = `DEP-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Get auth token
        const token = await getAuthToken();

        // Create invoice
        const invoice = await createInvoice(
          token,
          orderNumber,
          amount,
          clientName,
          clientEmail || "",
          clientMobile,
          callbackUrl,
          cancelUrl
        );

        // Create pending deposit record
        const { data: deposit, error: depositError } = await supabase
          .from("deposits")
          .insert({
            user_id: userId,
            amount: amount,
            fee_amount: 0,
            bonus_amount: 0,
            total_credited: amount,
            transaction_id: invoice.transactionNo,
            status: "pending",
            notes: "الدفع الإلكتروني",
          })
          .select()
          .single();

        if (depositError) {
          console.error("Error creating deposit:", depositError);
          throw new Error("Failed to create deposit record");
        }

        console.log("Deposit created:", deposit.id);

        return new Response(
          JSON.stringify({
            success: true,
            paymentUrl: invoice.url,
            transactionNo: invoice.transactionNo,
            depositId: deposit.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify-payment": {
        const { orderNumber, transactionNo } = params;

        console.log("Verifying payment:", { orderNumber, transactionNo });

        // Find the deposit by transactionNo
        let deposit;
        if (transactionNo) {
          const { data, error } = await supabase
            .from("deposits")
            .select("*")
            .eq("transaction_id", transactionNo)
            .maybeSingle();
          
          if (!error && data) {
            deposit = data;
          }
        }

        if (!deposit) {
          console.error("Deposit not found");
          return new Response(
            JSON.stringify({ success: false, message: "لم يتم العثور على طلب الإيداع" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Already completed, just return success
        if (deposit.status === "completed") {
          return new Response(
            JSON.stringify({
              success: true,
              amount: deposit.total_credited,
              message: "تم إضافة الرصيد مسبقاً",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // CRITICAL: We MUST verify with Paylink before crediting any balance
        // Never assume payment is successful without verification
        if (!deposit.transaction_id) {
          console.error("No transaction ID found for deposit");
          return new Response(
            JSON.stringify({
              success: false,
              message: "لا يمكن التحقق من الدفع - معرف المعاملة غير موجود",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify payment status with Paylink API
        let paylinkStatus: string;
        try {
          const token = await getAuthToken();
          const invoice = await getInvoice(token, deposit.transaction_id);
          paylinkStatus = invoice.orderStatus;
          console.log("Paylink verification result:", paylinkStatus);
        } catch (e) {
          // CRITICAL: If we cannot verify with Paylink, we should NOT credit the balance
          console.error("Failed to verify payment with Paylink:", e);
          return new Response(
            JSON.stringify({
              success: false,
              message: "فشل التحقق من حالة الدفع، يرجى المحاولة لاحقاً أو التواصل مع الدعم",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (paylinkStatus === "Paid") {
          // Update deposit to completed
          const { error: updateError } = await supabase
            .from("deposits")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", deposit.id);

          if (updateError) {
            console.error("Error updating deposit:", updateError);
          }

          // Note: Balance is updated automatically by the database trigger (update_balance_on_deposit)
          console.log("Deposit completed:", deposit.id);

          // Send email notification to client
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/notify-deposit-success`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ depositId: deposit.id }),
            });
            console.log("Deposit notification sent for:", deposit.id);
          } catch (notifyError) {
            console.error("Failed to send deposit notification:", notifyError);
          }

          return new Response(
            JSON.stringify({
              success: true,
              amount: deposit.total_credited,
              message: "تم إضافة الرصيد بنجاح",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else if (paylinkStatus === "Canceled" || paylinkStatus === "Cancelled" || paylinkStatus === "Expired") {
          // Update deposit as failed
          await supabase
            .from("deposits")
            .update({ status: "rejected" })
            .eq("id", deposit.id);

          return new Response(
            JSON.stringify({
              success: false,
              message: "تم إلغاء أو انتهاء صلاحية الدفع",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else if (paylinkStatus === "Pending") {
          return new Response(
            JSON.stringify({
              success: false,
              message: "الدفع لا يزال قيد الانتظار، يرجى إكمال عملية الدفع",
              status: paylinkStatus,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Any other status - don't credit, ask user to wait or contact support
        return new Response(
          JSON.stringify({
            success: false,
            message: `حالة الدفع: ${paylinkStatus}. يرجى التواصل مع الدعم إذا استمرت المشكلة`,
            status: paylinkStatus,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "webhook": {
        // Handle Paylink webhook callback
        const { transactionNo, orderStatus } = params;

        console.log("Webhook received:", { transactionNo, orderStatus });

        if (orderStatus === "Paid") {
          // Find and update deposit
          const { data: deposit, error: findError } = await supabase
            .from("deposits")
            .select("*")
            .eq("transaction_id", transactionNo)
            .maybeSingle();

          if (findError || !deposit) {
            console.error("Deposit not found:", transactionNo);
            return new Response(
              JSON.stringify({ error: "Deposit not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Skip if already completed
          if (deposit.status === "completed") {
            return new Response(
              JSON.stringify({ success: true, message: "Already processed" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Update deposit to completed
          const { error: updateError } = await supabase
            .from("deposits")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", deposit.id);

          if (updateError) {
            console.error("Error updating deposit:", updateError);
            throw new Error("Failed to update deposit");
          }

          // Note: Balance is updated automatically by the database trigger (update_balance_on_deposit)
          console.log("Deposit completed via webhook:", deposit.id);

          // Send email notification to client
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/notify-deposit-success`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ depositId: deposit.id }),
            });
            console.log("Deposit notification sent via webhook for:", deposit.id);
          } catch (notifyError) {
            console.error("Failed to send deposit notification:", notifyError);
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Paylink error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
