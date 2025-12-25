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

// Status translations
const statusTranslations: Record<string, { ar: string; en: string; color: string; emoji: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending", color: "#f59e0b", emoji: "⏳" },
  confirmed: { ar: "مؤكد", en: "Confirmed", color: "#3b82f6", emoji: "✅" },
  processing: { ar: "قيد المعالجة", en: "Processing", color: "#8b5cf6", emoji: "⚙️" },
  in_progress: { ar: "قيد التنفيذ", en: "In Progress", color: "#06b6d4", emoji: "🔄" },
  completed: { ar: "مكتمل", en: "Completed", color: "#22c55e", emoji: "✅" },
  partial: { ar: "مكتمل جزئي", en: "Partial", color: "#eab308", emoji: "⚠️" },
  cancelled: { ar: "ملغي", en: "Cancelled", color: "#ef4444", emoji: "❌" },
  refunded: { ar: "مسترد", en: "Refunded", color: "#f97316", emoji: "💰" },
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
  const statusInfo = statusTranslations[newStatus] || { ar: newStatus, en: newStatus, color: "#6b7280", emoji: "📦" };
  const oldStatusInfo = oldStatus ? statusTranslations[oldStatus] : null;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تحديث حالة الطلب</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Tajawal', Arial, sans-serif; background-color: #f3f4f6; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ${statusInfo.emoji} تحديث حالة الطلب
              </h1>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: 500;">
                مرحباً ${customerName || 'عميلنا العزيز'}،
              </p>
              <p style="margin: 15px 0 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                نود إعلامك بأنه تم تحديث حالة طلبك.
              </p>
            </td>
          </tr>
          
          <!-- Order Details Card -->
          <tr>
            <td style="padding: 0 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 20px;">
                    <!-- Order Number -->
                    <table role="presentation" style="width: 100%; margin-bottom: 15px;">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">رقم الطلب</td>
                        <td style="text-align: left; color: #1f2937; font-size: 16px; font-weight: 700;">${orderNumber}</td>
                      </tr>
                    </table>
                    
                    <!-- Service Name -->
                    <table role="presentation" style="width: 100%; margin-bottom: 15px;">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">الخدمة</td>
                        <td style="text-align: left; color: #1f2937; font-size: 14px; max-width: 200px; word-break: break-word;">${serviceName}</td>
                      </tr>
                    </table>
                    
                    <!-- Quantity -->
                    ${quantity ? `
                    <table role="presentation" style="width: 100%; margin-bottom: 15px;">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">الكمية</td>
                        <td style="text-align: left; color: #1f2937; font-size: 14px;">${quantity.toLocaleString()}</td>
                      </tr>
                    </table>
                    ` : ''}
                    
                    <!-- Price -->
                    <table role="presentation" style="width: 100%; margin-bottom: 15px;">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">المبلغ</td>
                        <td style="text-align: left; color: #1f2937; font-size: 16px; font-weight: 700;">$${totalPrice.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Status Change -->
          <tr>
            <td style="padding: 25px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center;">
                    ${oldStatusInfo ? `
                    <span style="display: inline-block; padding: 8px 16px; background-color: #f3f4f6; color: #6b7280; border-radius: 20px; font-size: 14px; text-decoration: line-through;">
                      ${oldStatusInfo.ar}
                    </span>
                    <span style="display: inline-block; margin: 0 15px; color: #9ca3af; font-size: 20px;">←</span>
                    ` : ''}
                    <span style="display: inline-block; padding: 10px 20px; background-color: ${statusInfo.color}; color: #ffffff; border-radius: 20px; font-size: 16px; font-weight: 700;">
                      ${statusInfo.emoji} ${statusInfo.ar}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Message based on status -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0; font-size: 15px; color: #4b5563; text-align: center; line-height: 1.6;">
                ${newStatus === 'completed' ? '🎉 تهانينا! تم إكمال طلبك بنجاح.' : 
                  newStatus === 'in_progress' ? '⚡ نعمل على طلبك الآن، سنبقيك على اطلاع.' :
                  newStatus === 'processing' ? '🔄 جاري معالجة طلبك، يرجى الانتظار.' :
                  newStatus === 'cancelled' ? '❌ تم إلغاء طلبك واسترداد المبلغ لرصيدك.' :
                  newStatus === 'refunded' ? '💰 تم استرداد مبلغ الطلب لرصيدك.' :
                  newStatus === 'partial' ? '⚠️ تم إكمال طلبك جزئياً.' :
                  'سيتم تحديثك بأي تغييرات جديدة.'}
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="https://maxiocore.com/dashboard/orders" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
                📋 تتبع طلبك
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280; text-align: center;">
                إذا كانت لديك أي استفسارات، لا تتردد في التواصل معنا.
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
                © ${new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.
              </p>
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
