import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppConfig {
  access_token: string;
  phone_number_id: string;
}

interface NotifyRequest {
  to: string;
  type: 'test' | 'order_status';
  config?: WhatsAppConfig;
  orderNumber?: string;
  status?: string;
  statusAr?: string;
  serviceName?: string;
}

const statusMessages: Record<string, string> = {
  pending: "⏳ طلبك قيد الانتظار",
  confirmed: "✅ تم تأكيد طلبك",
  in_progress: "🔄 طلبك قيد التنفيذ",
  processing: "⚙️ جاري معالجة طلبك",
  completed: "🎉 تم إكمال طلبك بنجاح",
  cancelled: "❌ تم إلغاء طلبك",
  refunded: "💰 تم استرداد مبلغ طلبك",
  partial: "📊 تم تنفيذ طلبك جزئياً",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: NotifyRequest = await req.json();
    const { to, type, config: directConfig, orderNumber, status, statusAr, serviceName } = body;

    // Get config from request or from database
    let accessToken: string;
    let phoneNumberId: string;

    if (directConfig) {
      accessToken = directConfig.access_token;
      phoneNumberId = directConfig.phone_number_id;
    } else {
      // Get config from database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: settings, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "whatsapp_config")
        .single();

      if (error || !settings?.value) {
        return new Response(
          JSON.stringify({ success: false, error: "WhatsApp not configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const config = settings.value as WhatsAppConfig & { enabled: boolean };
      
      if (!config.enabled) {
        return new Response(
          JSON.stringify({ success: false, error: "WhatsApp notifications disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = config.access_token;
      phoneNumberId = config.phone_number_id;
    }

    if (!accessToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing API credentials" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number
    const cleanPhone = to.replace(/[^0-9]/g, "");

    // Build message based on type
    let messageBody: string;

    if (type === "test") {
      messageBody = "🔔 *رسالة اختبار*\n\nتم تفعيل إشعارات واتساب بنجاح!\n\n_MaxioCore_";
    } else if (type === "order_status") {
      const statusEmoji = statusMessages[status || ""] || "📦";
      messageBody = `${statusEmoji}\n\n*تحديث حالة الطلب*\n\nرقم الطلب: ${orderNumber}\nالحالة: ${statusAr || status}\n${serviceName ? `الخدمة: ${serviceName}` : ""}\n\n_MaxioCore_`;
    } else {
      messageBody = "📦 إشعار من MaxioCore";
    }

    // Send via WhatsApp Business API
    const whatsappUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const response = await fetch(whatsappUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
          preview_url: false,
          body: messageBody,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", result);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error?.message || "Failed to send message" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("WhatsApp message sent:", result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.messages?.[0]?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in whatsapp-notify:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
