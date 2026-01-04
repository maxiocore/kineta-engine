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
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); } 50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.5); } }
    .animate-fade { animation: fadeIn 0.6s ease-out forwards; }
    .animate-pulse { animation: pulse 2s ease-in-out infinite; }
    .animate-slide { animation: slideIn 0.5s ease-out forwards; }
    .animate-glow { animation: glow 2s ease-in-out infinite; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif; background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%); direction: rtl; text-align: right; min-height: 100vh;">
  
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Card Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" class="animate-fade" style="width: 100%; max-width: 580px; border-collapse: collapse; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12), 0 10px 30px rgba(0, 0, 0, 0.08);">
          
          <!-- Animated Header -->
          <tr>
            <td style="background: ${headerGradient}; padding: 45px 35px; text-align: center; position: relative;">
              <!-- Decorative circles -->
              <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <div style="position: absolute; bottom: -40px; left: -40px; width: 150px; height: 150px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
              
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; position: relative; z-index: 1;">
                <tr>
                  <td align="center">
                    <!-- Status Icon with Animation -->
                    <div class="animate-pulse" style="width: 90px; height: 90px; background: rgba(255,255,255,0.25); border-radius: 50%; margin: 0 auto 20px; line-height: 90px; backdrop-filter: blur(10px); border: 3px solid rgba(255,255,255,0.3);">
                      <span style="font-size: 48px; display: inline-block;">${statusInfo.emoji}</span>
                    </div>
                    <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 28px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.15);">
                      تحديث حالة الطلب
                    </h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500;">
                      طلب رقم: ${orderNumber}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Greeting Section -->
          <tr>
            <td class="animate-slide" style="padding: 35px 35px 25px; text-align: right; direction: rtl;">
              <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a; font-weight: 700;">
                مرحباً ${customerName || 'عميلنا العزيز'} 👋
              </h2>
              <p style="margin: 0; font-size: 16px; color: #64748b; line-height: 1.8;">
                نود إعلامك بأنه تم تحديث حالة طلبك. يمكنك الاطلاع على التفاصيل أدناه.
              </p>
            </td>
          </tr>
          
          <!-- Status Change Card with Animation -->
          <tr>
            <td style="padding: 0 35px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" class="animate-glow" style="width: 100%; background: linear-gradient(145deg, ${statusInfo.bgColor} 0%, ${statusInfo.bgColor}cc 100%); border-radius: 20px; border: 2px solid ${statusInfo.color}20; overflow: hidden;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="margin: 0 0 20px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">الحالة الحالية</p>
                    
                    ${oldStatusInfo ? `
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 10px 20px; background: #f1f5f9; color: #94a3b8; border-radius: 50px; font-size: 14px; text-decoration: line-through; font-weight: 500;">
                          ${oldStatusInfo.ar}
                        </td>
                        <td style="padding: 0 20px;">
                          <span style="display: inline-block; width: 40px; height: 2px; background: linear-gradient(90deg, #cbd5e1, ${statusInfo.color}); vertical-align: middle;"></span>
                          <span style="color: ${statusInfo.color}; font-size: 18px; margin: 0 5px;">→</span>
                          <span style="display: inline-block; width: 40px; height: 2px; background: linear-gradient(90deg, ${statusInfo.color}, ${statusInfo.color}); vertical-align: middle;"></span>
                        </td>
                        <td class="animate-pulse" style="padding: 14px 32px; background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); color: #ffffff; border-radius: 50px; font-size: 16px; font-weight: 700; box-shadow: 0 8px 25px ${statusInfo.color}40;">
                          ${statusInfo.emoji} ${statusInfo.ar}
                        </td>
                      </tr>
                    </table>
                    ` : `
                    <span class="animate-pulse" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); color: #ffffff; border-radius: 50px; font-size: 18px; font-weight: 700; box-shadow: 0 10px 30px ${statusInfo.color}40;">
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
            <td style="padding: 0 35px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden;">
                <tr>
                  <td style="padding: 25px 30px; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">📋 تفاصيل الطلب</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 25px 30px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <!-- Order Number -->
                      <tr>
                        <td style="padding: 14px 0; border-bottom: 1px dashed #e2e8f0; text-align: right; color: #64748b; font-size: 14px; font-weight: 500;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: #ede9fe; border-radius: 6px; text-align: center; line-height: 24px; margin-left: 10px; font-size: 12px;">🔢</span>
                          رقم الطلب
                        </td>
                        <td style="padding: 14px 0; border-bottom: 1px dashed #e2e8f0; text-align: left; color: #0f172a; font-size: 16px; font-weight: 700; font-family: 'Monaco', 'Consolas', monospace;">${orderNumber}</td>
                      </tr>
                      <!-- Service Name -->
                      <tr>
                        <td style="padding: 14px 0; border-bottom: 1px dashed #e2e8f0; text-align: right; color: #64748b; font-size: 14px; font-weight: 500;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: #dbeafe; border-radius: 6px; text-align: center; line-height: 24px; margin-left: 10px; font-size: 12px;">🎯</span>
                          الخدمة
                        </td>
                        <td style="padding: 14px 0; border-bottom: 1px dashed #e2e8f0; text-align: left; color: #0f172a; font-size: 14px; font-weight: 600; max-width: 200px; word-break: break-word;">${serviceName}</td>
                      </tr>
                      ${quantity ? `
                      <!-- Quantity -->
                      <tr>
                        <td style="padding: 14px 0; border-bottom: 1px dashed #e2e8f0; text-align: right; color: #64748b; font-size: 14px; font-weight: 500;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: #fef3c7; border-radius: 6px; text-align: center; line-height: 24px; margin-left: 10px; font-size: 12px;">📊</span>
                          الكمية
                        </td>
                        <td style="padding: 14px 0; border-bottom: 1px dashed #e2e8f0; text-align: left; color: #0f172a; font-size: 14px; font-weight: 600;">${quantity.toLocaleString('ar-SA')}</td>
                      </tr>
                      ` : ''}
                      <!-- Price -->
                      <tr>
                        <td style="padding: 14px 0; text-align: right; color: #64748b; font-size: 14px; font-weight: 500;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: #dcfce7; border-radius: 6px; text-align: center; line-height: 24px; margin-left: 10px; font-size: 12px;">💵</span>
                          المبلغ
                        </td>
                        <td style="padding: 14px 0; text-align: left;">
                          <span style="display: inline-block; padding: 8px 18px; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); color: #166534; border-radius: 50px; font-size: 18px; font-weight: 800;">$${totalPrice.toFixed(2)}</span>
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
            <td style="padding: 0 35px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: ${newStatus === 'completed' ? 'linear-gradient(145deg, #dcfce7 0%, #bbf7d0 100%)' : newStatus === 'cancelled' ? 'linear-gradient(145deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(145deg, #e0f2fe 0%, #bae6fd 100%)'}; border-radius: 16px; border-right: 5px solid ${newStatus === 'completed' ? '#22c55e' : newStatus === 'cancelled' ? '#ef4444' : '#0ea5e9'};">
                <tr>
                  <td style="padding: 22px 28px; text-align: center;">
                    <p style="margin: 0; font-size: 16px; color: ${newStatus === 'completed' ? '#166534' : newStatus === 'cancelled' ? '#991b1b' : '#0369a1'}; line-height: 1.8; font-weight: 600;">
                      ${statusMessage}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 35px 40px; text-align: center;">
              <a href="https://maxiocore.com/dashboard/orders" class="animate-pulse" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 16px; box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4), 0 5px 15px rgba(99, 102, 241, 0.2); transition: all 0.3s ease;">
                📋 تتبع طلبك الآن
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 14px; margin: 0 auto 15px; line-height: 50px; text-align: center;">
                      <span style="font-size: 24px; font-weight: 800; color: #ffffff;">M</span>
                    </div>
                    <p style="margin: 0 0 15px; font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.8;">
                      إذا كانت لديك أي استفسارات، لا تتردد في التواصل معنا.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #475569;">
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
