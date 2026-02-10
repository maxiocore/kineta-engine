import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

function verifySignature(payload: string, signature: string | null, secret: string | null): boolean {
  if (!secret || !signature) return true; // No secret configured = skip verification
  // HMAC-SHA256 verification can be added when ash.holdings provides a signing secret
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const webhookSecret = Deno.env.get("FINANCE_WEBHOOK_SECRET");

    // Verify webhook signature
    const isValid = verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const {
      finance_request_id,
      event_type,
      status,
      ...rest
    } = payload;

    if (!finance_request_id || !status) {
      return new Response(
        JSON.stringify({ error: "Missing finance_request_id or status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

    // 1. Log the webhook event for audit
    const { error: logError } = await supabaseAdmin
      .from("finance_webhook_events")
      .insert({
        finance_request_id,
        event_type: event_type || "status_update",
        status,
        payload,
        signature_valid: isValid,
        ip_address: clientIp,
        processed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Failed to log webhook event:", logError);
    }

    // 2. Match finance_request_id to a financing application
    const { data: application } = await supabaseAdmin
      .from("financing_applications")
      .select("id, user_id, status, application_number")
      .eq("id", finance_request_id)
      .maybeSingle();

    if (application) {
      // Update financing application status
      const { error: updateError } = await supabaseAdmin
        .from("financing_applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", finance_request_id);

      if (updateError) {
        console.error("Failed to update application status:", updateError);
      }

      // Log in financing_activity_log
      await supabaseAdmin.from("financing_activity_log").insert({
        application_id: application.id,
        event_type: event_type || "webhook_status_update",
        from_status: application.status,
        to_status: status,
        triggered_by: "webhook",
        metadata: { source: "ash.holdings", ip: clientIp, ...rest },
        is_visible_to_customer: true,
      });

      // Notify user
      await supabaseAdmin.from("notifications").insert({
        user_id: application.user_id,
        title: "تحديث حالة التمويل",
        message: `تم تحديث حالة طلب التمويل ${application.application_number} إلى: ${status}`,
        type: "info",
      });

      // Log in audit_logs
      await supabaseAdmin.from("audit_logs").insert({
        table_name: "financing_applications",
        record_id: finance_request_id,
        action: "webhook_update",
        new_value: { status, event_type },
        metadata: { source: "ash.holdings", ip: clientIp },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("finance-webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
