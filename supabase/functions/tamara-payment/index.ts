import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TAMARA_API_TOKEN = Deno.env.get("TAMARA_API_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Production: https://api.tamara.co
const TAMARA_BASE_URL = "https://api.tamara.co";

interface TamaraCheckoutResponse {
  order_id: string;
  checkout_id: string;
  checkout_url: string;
  status: string;
}

interface TamaraOrderResponse {
  order_id: string;
  status: string;
  total_amount: {
    amount: number;
    currency: string;
  };
}

async function createCheckoutSession(
  orderNumber: string,
  amount: number,
  clientName: string,
  clientEmail: string,
  clientPhone: string,
  successUrl: string,
  failureUrl: string,
  cancelUrl: string
): Promise<TamaraCheckoutResponse> {
  console.log("Creating Tamara checkout session...", { orderNumber, amount });

  // Split name into first and last name
  const nameParts = clientName.trim().split(" ");
  const firstName = nameParts[0] || "عميل";
  const lastName = nameParts.slice(1).join(" ") || "كريم";

  const response = await fetch(`${TAMARA_BASE_URL}/checkout`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TAMARA_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_reference_id: orderNumber,
      order_number: orderNumber,
      total_amount: {
        amount: amount,
        currency: "SAR",
      },
      description: "شحن رصيد المحفظة",
      country_code: "SA",
      payment_type: "PAY_BY_INSTALMENTS",
      instalments: 3,
      locale: "ar_SA",
      items: [
        {
          reference_id: `item-${orderNumber}`,
          type: "Digital",
          name: "شحن رصيد",
          sku: "WALLET_TOPUP",
          quantity: 1,
          unit_price: {
            amount: amount,
            currency: "SAR",
          },
          total_amount: {
            amount: amount,
            currency: "SAR",
          },
        },
      ],
      consumer: {
        first_name: firstName,
        last_name: lastName,
        phone_number: clientPhone,
        email: clientEmail || `${orderNumber}@temp.com`,
      },
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        line1: "المملكة العربية السعودية",
        city: "الرياض",
        country_code: "SA",
      },
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        line1: "المملكة العربية السعودية",
        city: "الرياض",
        country_code: "SA",
      },
      merchant_url: {
        success: successUrl,
        failure: failureUrl,
        cancel: cancelUrl,
        notification: `${SUPABASE_URL}/functions/v1/tamara-payment`,
      },
      tax_amount: {
        amount: 0,
        currency: "SAR",
      },
      shipping_amount: {
        amount: 0,
        currency: "SAR",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Tamara create checkout error:", response.status, errorText);
    throw new Error(`Failed to create Tamara checkout: ${response.status} - ${errorText}`);
  }

  const data: TamaraCheckoutResponse = await response.json();
  console.log("Tamara checkout created:", data.order_id);
  return data;
}

async function getOrderDetails(orderId: string): Promise<TamaraOrderResponse> {
  console.log("Getting Tamara order details...", orderId);

  const response = await fetch(`${TAMARA_BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${TAMARA_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Tamara get order error:", response.status, errorText);
    throw new Error(`Failed to get Tamara order: ${response.status}`);
  }

  const data: TamaraOrderResponse = await response.json();
  console.log("Tamara order status:", data.status);
  return data;
}

async function authoriseOrder(orderId: string): Promise<boolean> {
  console.log("Authorising Tamara order...", orderId);

  const response = await fetch(`${TAMARA_BASE_URL}/orders/${orderId}/authorise`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TAMARA_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Tamara authorise error:", response.status, errorText);
    return false;
  }

  console.log("Tamara order authorised successfully");
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const action = body.action;

    console.log("Tamara action:", action);

    switch (action) {
      case "create-payment": {
        const {
          userId,
          amount,
          clientName,
          clientEmail,
          clientPhone,
          successUrl,
          failureUrl,
          cancelUrl,
        } = body;

        if (!userId || !amount || !clientName || !clientPhone) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check minimum amount for Tamara (usually 100 SAR)
        if (amount < 100) {
          return new Response(
            JSON.stringify({ error: "الحد الأدنى للدفع عبر تمارا هو 100 ريال" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate unique order number
        const orderNumber = `TAM-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Create Tamara checkout session
        const checkout = await createCheckoutSession(
          orderNumber,
          amount,
          clientName,
          clientEmail || "",
          clientPhone,
          successUrl,
          failureUrl,
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
            transaction_id: checkout.order_id,
            status: "pending",
            notes: "تمارا - الدفع على أقساط",
          })
          .select()
          .single();

        if (depositError) {
          console.error("Error creating deposit:", depositError);
          throw new Error("Failed to create deposit record");
        }

        console.log("Deposit created for Tamara:", deposit.id);

        return new Response(
          JSON.stringify({
            success: true,
            checkoutUrl: checkout.checkout_url,
            orderId: checkout.order_id,
            depositId: deposit.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify-payment": {
        const { orderId } = body;

        console.log("Verifying Tamara payment:", orderId);

        // Find the deposit by order_id
        const { data: deposit, error: findError } = await supabase
          .from("deposits")
          .select("*")
          .eq("transaction_id", orderId)
          .maybeSingle();

        if (findError || !deposit) {
          console.error("Deposit not found:", orderId);
          return new Response(
            JSON.stringify({ success: false, message: "لم يتم العثور على طلب الإيداع" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Already completed
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

        // Get order status from Tamara
        let tamaraOrder: TamaraOrderResponse;
        try {
          tamaraOrder = await getOrderDetails(orderId);
        } catch (e) {
          console.error("Failed to verify with Tamara:", e);
          return new Response(
            JSON.stringify({
              success: false,
              message: "فشل التحقق من حالة الدفع، يرجى المحاولة لاحقاً",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check status: approved, authorised, captured means success
        if (["approved", "authorised", "captured", "fully_captured"].includes(tamaraOrder.status)) {
          // Authorise the order if it's just approved
          if (tamaraOrder.status === "approved") {
            await authoriseOrder(orderId);
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
          }

          console.log("Tamara deposit completed:", deposit.id);

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
            console.log("Deposit notification sent for Tamara:", deposit.id);
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
        } else if (["declined", "expired", "canceled"].includes(tamaraOrder.status)) {
          // Update deposit as failed
          await supabase
            .from("deposits")
            .update({ status: "rejected" })
            .eq("id", deposit.id);

          return new Response(
            JSON.stringify({
              success: false,
              message: "تم رفض أو إلغاء طلب الدفع",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Pending or other status
        return new Response(
          JSON.stringify({
            success: false,
            message: `حالة الدفع: ${tamaraOrder.status}. يرجى المحاولة مرة أخرى`,
            status: tamaraOrder.status,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "webhook": {
        // Handle Tamara webhook notification
        const { order_id, order_status, event_type } = body;

        console.log("Tamara webhook received:", { order_id, order_status, event_type });

        if (event_type === "order_approved" || order_status === "approved") {
          // Find deposit
          const { data: deposit, error: findError } = await supabase
            .from("deposits")
            .select("*")
            .eq("transaction_id", order_id)
            .maybeSingle();

          if (findError || !deposit) {
            console.error("Deposit not found for webhook:", order_id);
            return new Response(
              JSON.stringify({ error: "Deposit not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          if (deposit.status === "completed") {
            return new Response(
              JSON.stringify({ success: true, message: "Already processed" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Authorise the order
          await authoriseOrder(order_id);

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

          console.log("Deposit completed via Tamara webhook:", deposit.id);

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
            console.log("Deposit notification sent via Tamara webhook:", deposit.id);
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
    console.error("Tamara error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
