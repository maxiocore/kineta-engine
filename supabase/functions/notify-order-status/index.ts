import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>تحديث حالة الطلب</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f0f4f8; direction: rtl; text-align: right;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 35px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 18px; margin: 0 auto 15px; line-height: 70px;">
                      <span style="font-size: 36px;">${statusInfo.emoji}</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                      تحديث حالة الطلب
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: right; direction: rtl;">
              <h2 style="margin: 0 0 10px; font-size: 20px; color: #1e293b; font-weight: 600;">
                مرحباً ${customerName || 'عميلنا العزيز'}،
              </h2>
              <p style="margin: 0; font-size: 16px; color: #475569; line-height: 1.7;">
                نود إعلامك بأنه تم تحديث حالة طلبك.
              </p>
            </td>
          </tr>
          
          <!-- Status Change Display -->
          <tr>
            <td style="padding: 0 30px 25px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, ${statusInfo.bgColor} 0%, ${statusInfo.bgColor}dd 100%); border-radius: 16px; border-right: 4px solid ${statusInfo.color};">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    ${oldStatusInfo ? `
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 8px 16px; background-color: #f1f5f9; color: #64748b; border-radius: 50px; font-size: 14px; text-decoration: line-through;">
                          ${oldStatusInfo.ar}
                        </td>
                        <td style="padding: 0 15px; color: #9ca3af; font-size: 20px;">←</td>
                        <td style="padding: 10px 24px; background-color: ${statusInfo.color}; color: #ffffff; border-radius: 50px; font-size: 16px; font-weight: 700;">
                          ${statusInfo.emoji} ${statusInfo.ar}
                        </td>
                      </tr>
                    </table>
                    ` : `
                    <span style="display: inline-block; padding: 12px 28px; background-color: ${statusInfo.color}; color: #ffffff; border-radius: 50px; font-size: 18px; font-weight: 700;">
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
            <td style="padding: 0 30px 25px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; border-right: 4px solid #6366f1;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <!-- Order Number -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 14px;">رقم الطلب</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 16px; font-weight: 700;">${orderNumber}</td>
                      </tr>
                      <!-- Service Name -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 14px;">الخدمة</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px; max-width: 200px; word-break: break-word;">${serviceName}</td>
                      </tr>
                      ${quantity ? `
                      <!-- Quantity -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 14px;">الكمية</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: left; color: #1e293b; font-size: 14px;">${quantity.toLocaleString('ar-SA')}</td>
                      </tr>
                      ` : ''}
                      <!-- Price -->
                      <tr>
                        <td style="padding: 12px 0; text-align: right; color: #64748b; font-size: 14px;">المبلغ</td>
                        <td style="padding: 12px 0; text-align: left; color: #22c55e; font-size: 18px; font-weight: 700;">$${totalPrice.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Status Message -->
          <tr>
            <td style="padding: 0 30px 25px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: ${newStatus === 'completed' ? '#dcfce7' : newStatus === 'cancelled' ? '#fee2e2' : '#f0f9ff'}; border-radius: 12px; border-right: 4px solid ${newStatus === 'completed' ? '#22c55e' : newStatus === 'cancelled' ? '#ef4444' : '#0ea5e9'};">
                <tr>
                  <td style="padding: 18px 22px; text-align: center;">
                    <p style="margin: 0; font-size: 15px; color: ${newStatus === 'completed' ? '#166534' : newStatus === 'cancelled' ? '#991b1b' : '#0369a1'}; line-height: 1.7;">
                      ${statusMessage}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="https://maxiocore.com/dashboard/orders" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);">
                📋 تتبع طلبك
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 25px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 12px; font-size: 14px; color: rgba(255,255,255,0.8); line-height: 1.7;">
                      إذا كانت لديك أي استفسارات، لا تتردد في التواصل معنا.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      © ${new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.
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
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
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
        from: "MaxioCore <noreply@maxiocore.com>",
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
