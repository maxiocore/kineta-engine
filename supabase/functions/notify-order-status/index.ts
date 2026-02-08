import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSMS as sendSMSHelper, formatPhoneNumber } from "../_shared/sms-helper.ts";
import { sendWhatsAppMessage, getOrderStatusMessage } from "../_shared/whatsapp-helper.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Wrapper to maintain compatibility with existing code
async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const result = await sendSMSHelper(phone, message, 'order_status');
  return { success: result.success, error: result.error };
}

interface NotifyOrderStatusRequest {
  orderId: string;
  oldStatus?: string;
  newStatus: string;
}

// Status translations with RTL support
const statusTranslations: Record<string, { ar: string; en: string; color: string; bgColor: string; emoji: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending", color: "#92400e", bgColor: "#fef3c7", emoji: "⏳" },
  confirmed: { ar: "مؤكد", en: "Confirmed", color: "#1e40af", bgColor: "#dbeafe", emoji: "✅" },
  processing: { ar: "قيد المعالجة", en: "Processing", color: "#6b21a8", bgColor: "#f3e8ff", emoji: "⚙️" },
  in_progress: { ar: "قيد التنفيذ", en: "In Progress", color: "#0369a1", bgColor: "#e0f2fe", emoji: "🔄" },
  completed: { ar: "مكتمل", en: "Completed", color: "#166534", bgColor: "#dcfce7", emoji: "✅" },
  partial: { ar: "مكتمل جزئي", en: "Partial", color: "#854d0e", bgColor: "#fef9c3", emoji: "⚠️" },
  cancelled: { ar: "ملغي", en: "Cancelled", color: "#991b1b", bgColor: "#fee2e2", emoji: "❌" },
  refunded: { ar: "مسترد", en: "Refunded", color: "#c2410c", bgColor: "#ffedd5", emoji: "💰" },
};

function getEmailTemplate(
  orderNumber: string,
  serviceName: string,
  oldStatus: string | undefined,
  newStatus: string,
  customerName: string,
  quantity: number | null,
  totalPrice: number
): string {
  const statusInfo = statusTranslations[newStatus] || { ar: newStatus, en: newStatus, color: "#6b7280", bgColor: "#f3f4f6", emoji: "📦" };
  const oldStatusInfo = oldStatus ? statusTranslations[oldStatus] : null;

  const statusMessage = 
    newStatus === 'completed' ? '🎉 تهانينا! تم إكمال طلبك بنجاح.' :
    newStatus === 'in_progress' ? '⚡ نعمل على طلبك الآن، سنبقيك على اطلاع.' :
    newStatus === 'processing' ? '🔄 جاري معالجة طلبك، يرجى الانتظار.' :
    newStatus === 'cancelled' ? '❌ تم إلغاء طلبك واسترداد المبلغ لرصيدك.' :
    newStatus === 'refunded' ? '💰 تم استرداد مبلغ الطلب لرصيدك.' :
    newStatus === 'partial' ? '⚠️ تم إكمال طلبك جزئياً.' :
    'سيتم تحديثك بأي تغييرات جديدة.';

  // Dynamic gradient based on status
  const headerGradient = 
    newStatus === 'completed' ? 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' :
    newStatus === 'cancelled' || newStatus === 'refunded' ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)' :
    newStatus === 'in_progress' || newStatus === 'processing' ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)' :
    'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>تحديث حالة الطلب</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); } 50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.5); } }
    .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
    .animate-pulse { animation: pulse 2s ease-in-out infinite; }
    .animate-glow { animation: glow 2s ease-in-out infinite; }
    * { font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif; background: #f1f5f9; direction: rtl; text-align: right; min-height: 100vh;">
  
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Card Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" class="animate-fade" style="width: 100%; max-width: 600px; border-collapse: collapse; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: ${headerGradient}; padding: 50px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <!-- Status Icon -->
                    <div class="animate-pulse" style="width: 100px; height: 100px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 25px; line-height: 100px; border: 4px solid rgba(255,255,255,0.4);">
                      <span style="font-size: 56px; display: inline-block;">${statusInfo.emoji}</span>
                    </div>
                    <h1 style="margin: 0 0 12px; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      تحديث حالة الطلب
                    </h1>
                    <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 500; opacity: 0.95;">
                      طلب رقم: <strong>${orderNumber}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Greeting Section -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: right; direction: rtl; background: #ffffff;">
              <h2 style="margin: 0 0 15px; font-size: 26px; color: #1e293b; font-weight: 700;">
                مرحباً ${customerName || 'عميلنا العزيز'} 👋
              </h2>
              <p style="margin: 0; font-size: 18px; color: #475569; line-height: 1.9;">
                نود إعلامك بأنه تم تحديث حالة طلبك. يمكنك الاطلاع على التفاصيل أدناه.
              </p>
            </td>
          </tr>
          
          <!-- Status Change Card -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <table role="presentation" cellpadding="0" cellspacing="0" class="animate-glow" style="width: 100%; background: ${statusInfo.bgColor}; border-radius: 20px; border: 3px solid ${statusInfo.color}30;">
                <tr>
                  <td style="padding: 35px; text-align: center;">
                    <p style="margin: 0 0 25px; font-size: 16px; color: #334155; letter-spacing: 1px; font-weight: 600;">الحالة الحالية</p>
                    
                    ${oldStatusInfo ? `
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 12px 24px; background: #e2e8f0; color: #64748b; border-radius: 50px; font-size: 16px; text-decoration: line-through; font-weight: 600;">
                          ${oldStatusInfo.ar}
                        </td>
                        <td style="padding: 0 25px;">
                          <span style="color: ${statusInfo.color}; font-size: 28px; font-weight: 700;">←</span>
                        </td>
                        <td class="animate-pulse" style="padding: 16px 36px; background: ${statusInfo.color}; color: #ffffff; border-radius: 50px; font-size: 20px; font-weight: 700; box-shadow: 0 10px 30px ${statusInfo.color}50;">
                          ${statusInfo.emoji} ${statusInfo.ar}
                        </td>
                      </tr>
                    </table>
                    ` : `
                    <span class="animate-pulse" style="display: inline-block; padding: 18px 45px; background: ${statusInfo.color}; color: #ffffff; border-radius: 50px; font-size: 22px; font-weight: 700; box-shadow: 0 10px 30px ${statusInfo.color}50;">
                      ${statusInfo.emoji} ${statusInfo.ar}
                    </span>
                    `}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Details Card -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 20px; border: 2px solid #e2e8f0;">
                <tr>
                  <td style="padding: 25px 30px; border-bottom: 2px solid #e2e8f0; background: #f1f5f9; border-radius: 18px 18px 0 0;">
                    <p style="margin: 0; font-size: 16px; color: #1e293b; letter-spacing: 1px; font-weight: 700;">📋 تفاصيل الطلب</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <!-- Order Number -->
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 2px dashed #e2e8f0; text-align: right; color: #334155; font-size: 17px; font-weight: 600;">
                          🔢 رقم الطلب
                        </td>
                        <td style="padding: 18px 0; border-bottom: 2px dashed #e2e8f0; text-align: left; color: #0f172a; font-size: 18px; font-weight: 700;">${orderNumber}</td>
                      </tr>
                      <!-- Service Name -->
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 2px dashed #e2e8f0; text-align: right; color: #334155; font-size: 17px; font-weight: 600;">
                          🎯 الخدمة
                        </td>
                        <td style="padding: 18px 0; border-bottom: 2px dashed #e2e8f0; text-align: left; color: #0f172a; font-size: 17px; font-weight: 600; max-width: 220px; word-break: break-word;">${serviceName}</td>
                      </tr>
                      ${quantity ? `
                      <!-- Quantity -->
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 2px dashed #e2e8f0; text-align: right; color: #334155; font-size: 17px; font-weight: 600;">
                          📊 الكمية
                        </td>
                        <td style="padding: 18px 0; border-bottom: 2px dashed #e2e8f0; text-align: left; color: #0f172a; font-size: 18px; font-weight: 700;">${quantity.toLocaleString('ar-SA')}</td>
                      </tr>
                      ` : ''}
                      <!-- Price -->
                      <tr>
                        <td style="padding: 18px 0; text-align: right; color: #334155; font-size: 17px; font-weight: 600;">
                          💵 المبلغ
                        </td>
                        <td style="padding: 18px 0; text-align: left;">
                          <span style="display: inline-block; padding: 12px 24px; background: #dcfce7; color: #15803d; border-radius: 50px; font-size: 22px; font-weight: 800;">$${totalPrice.toFixed(2)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Status Message Box -->
          <tr>
            <td style="padding: 0 40px 35px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: ${newStatus === 'completed' ? '#dcfce7' : newStatus === 'cancelled' ? '#fee2e2' : '#e0f2fe'}; border-radius: 16px; border-right: 6px solid ${newStatus === 'completed' ? '#22c55e' : newStatus === 'cancelled' ? '#ef4444' : '#0ea5e9'};">
                <tr>
                  <td style="padding: 28px 32px; text-align: center;">
                    <p style="margin: 0; font-size: 20px; color: ${newStatus === 'completed' ? '#15803d' : newStatus === 'cancelled' ? '#b91c1c' : '#0369a1'}; line-height: 1.9; font-weight: 700;">
                      ${statusMessage}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 45px; text-align: center;">
              <a href="https://ashholding.com/dashboard/orders" class="animate-pulse" style="display: inline-block; padding: 20px 55px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 20px; box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);">
                📋 تتبع طلبك الآن
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #1e293b; padding: 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; margin: 0 auto 20px; line-height: 60px; text-align: center;">
                      <span style="font-size: 30px; font-weight: 800; color: #ffffff;">A</span>
                    </div>
                    <p style="margin: 0 0 18px; font-size: 17px; color: #cbd5e1; line-height: 1.8;">
                      إذا كانت لديك أي استفسارات، لا تتردد في التواصل معنا.
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #64748b;">
                      © ${new Date().getFullYear()} ASH HOLDING. جميع الحقوق محفوظة.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(async (req: Request): Promise<Response> => {
  console.log("notify-order-status function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, oldStatus, newStatus }: NotifyOrderStatusRequest = await req.json();
    
    console.log(`Processing order status notification: ${orderId}, ${oldStatus} -> ${newStatus}`);
    
    if (!orderId || !newStatus) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Skip if status didn't actually change
    if (oldStatus === newStatus) {
      console.log("Status unchanged, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "Status unchanged, no notification sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch order details with service and user profile
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        quantity,
        total_price,
        user_id,
        services (name)
      `)
      .eq("id", orderId)
      .single();
    
    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch user profile with phone
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", order.user_id)
      .single();
    
    if (profileError || !profile?.email) {
      console.error("Error fetching profile or no email:", profileError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const serviceName = (order.services as any)?.name || "خدمة غير محددة";
    const statusInfo = statusTranslations[newStatus] || { ar: newStatus, emoji: "📦" };
    
    // Generate email HTML
    const emailHtml = getEmailTemplate(
      order.order_number,
      serviceName,
      oldStatus,
      newStatus,
      profile.full_name || "",
      order.quantity,
      order.total_price
    );
    
    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ASH HOLDING <noreply@ash-holding.sa>",
        to: [profile.email],
        subject: `${statusInfo.emoji} تحديث حالة طلبك ${order.order_number} - ${statusInfo.ar}`,
        html: emailHtml,
      }),
    });
    
    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Error sending email:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Email sent successfully:", emailResult);
    
    // Log the email in the emails table
    await supabase.from("emails").insert({
      recipient_email: profile.email,
      recipient_name: profile.full_name,
      subject: `تحديث حالة طلبك ${order.order_number}`,
      content: `تم تحديث حالة طلبك من ${oldStatus || 'جديد'} إلى ${newStatus}`,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
    
    // Send SMS notification if phone is available
    if (profile.phone) {
      const smsMessage = `ASH HOLDING: تم تحديث طلبك رقم ${order.order_number} إلى "${statusInfo.ar}". تتبع الطلب: ashholding.com/dashboard/orders`;
      const smsResult = await sendSMS(profile.phone, smsMessage);
      console.log("SMS result:", smsResult);
      
      // Log SMS
      await supabase.from("sms_logs").insert({
        phone: profile.phone,
        message: smsMessage,
        type: 'order_status',
        status: smsResult.success ? 'sent' : 'failed',
        user_id: order.user_id,
        reference_id: orderId,
        error_message: smsResult.error || null,
      });

      // Send WhatsApp notification
      const whatsappMessage = getOrderStatusMessage(order.order_number, newStatus, serviceName);
      const whatsappResult = await sendWhatsAppMessage({
        phone: profile.phone,
        message: whatsappMessage,
        type: 'order'
      });
      console.log("WhatsApp result:", whatsappResult);
      
      // Log WhatsApp
      await supabase.from("sms_logs").insert({
        phone: profile.phone,
        message: whatsappMessage,
        type: 'whatsapp_order_status',
        status: whatsappResult.success ? 'sent' : 'failed',
        user_id: order.user_id,
        reference_id: orderId,
        error_message: whatsappResult.error || null,
      });
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    console.error("Error in notify-order-status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
