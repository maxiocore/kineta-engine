import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const AUTHENTICA_API_KEY = Deno.env.get("AUTHENTICA_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "approved" | "rejected" | "documents_required" | "under_review";
  email: string;
  name: string;
  phone?: string;
  userId?: string;
  amount?: number;
  installments_count?: number;
  monthly_installment?: number;
  rejection_reason?: string;
  documents_notes?: string;
  application_number: string;
}

// Format phone number to international format for Saudi Arabia
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('966')) {
    cleaned = '966' + cleaned;
  }
  return cleaned;
}

// Send SMS via Authentica API
async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!AUTHENTICA_API_KEY || !phone) {
    console.log('SMS skipped: API key or phone not configured');
    return { success: false, error: 'SMS not configured' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`Sending SMS to ${formattedPhone}`);
    
    const response = await fetch('https://api.authentica.sa/api/v2/send-sms', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Authorization': AUTHENTICA_API_KEY,
      },
      body: JSON.stringify({
        phone: `+${formattedPhone}`,
        message: message,
        sender_name: 'Authentica',
      }),
    });

    const data = await response.json();
    console.log('Authentica API response:', data);

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.message || data.error || 'Failed to send SMS' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending SMS:', error);
    return { success: false, error: errorMessage };
  }
}

// Get SMS message based on notification type
function getSMSMessage(data: NotificationRequest): string {
  switch (data.type) {
    case "approved":
      return `ماكسيو كور: تمت الموافقة على طلب التمويل #${data.application_number} بمبلغ ${data.amount} ر.س. تم إضافة الرصيد لحسابك.`;
    case "rejected":
      return `ماكسيو كور: نأسف، لم تتم الموافقة على طلب التمويل #${data.application_number}. للمزيد: maxiocore.com/dashboard/financing`;
    case "documents_required":
      return `ماكسيو كور: مطلوب مستندات إضافية لطلب التمويل #${data.application_number}. يرجى رفعها من حسابك.`;
    case "under_review":
      return `ماكسيو كور: طلب التمويل #${data.application_number} قيد المراجعة. سنوافيك بالنتيجة قريباً.`;
    default:
      return `ماكسيو كور: تحديث على طلب التمويل #${data.application_number}`;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: NotificationRequest = await req.json();
    console.log("Sending financing notification:", data);

    let subject: string;
    let htmlContent: string;

    switch (data.type) {
      case "approved":
        subject = `🎉 تمت الموافقة على طلب التمويل #${data.application_number}`;
        htmlContent = `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981, #14b8a6); padding: 30px; border-radius: 16px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">🎉 مبروك!</h1>
              <p style="margin: 10px 0 0; font-size: 18px;">تمت الموافقة على طلب التمويل الخاص بك</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin: 0 0 20px;">مرحباً ${data.name}،</h2>
              <p style="color: #64748b; line-height: 1.8;">يسعدنا إبلاغك بأنه تمت الموافقة على طلب التمويل الخاص بك. تم إضافة الرصيد إلى حسابك ويمكنك استخدامه فوراً.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 10px 0; color: #64748b;">رقم الطلب:</td><td style="text-align: left; font-weight: bold;">${data.application_number}</td></tr>
                  <tr><td style="padding: 10px 0; color: #64748b;">مبلغ التمويل:</td><td style="text-align: left; font-weight: bold; color: #10b981;">${data.amount} ر.س</td></tr>
                  <tr><td style="padding: 10px 0; color: #64748b;">عدد الأقساط:</td><td style="text-align: left; font-weight: bold;">${data.installments_count}</td></tr>
                  <tr><td style="padding: 10px 0; color: #64748b;">القسط الشهري:</td><td style="text-align: left; font-weight: bold;">${data.monthly_installment?.toFixed(2)} ر.س</td></tr>
                </table>
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">⚠️ تذكير: الرصيد المضاف لحسابك صالح للاستخدام داخل المنصة فقط ولا يمكن سحبه.</p>
              </div>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="https://maxiocore.com/dashboard/financing" style="background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">عرض تفاصيل التمويل</a>
              </div>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">فريق ماكسيو كور - Maxiocore</p>
          </div>
        `;
        break;

      case "rejected":
        subject = `طلب التمويل #${data.application_number} - نتيجة المراجعة`;
        htmlContent = `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fee2e2; padding: 30px; border-radius: 16px; text-align: center;">
              <h1 style="color: #dc2626; margin: 0; font-size: 24px;">❌ نتيجة مراجعة طلب التمويل</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin: 0 0 20px;">مرحباً ${data.name}،</h2>
              <p style="color: #64748b; line-height: 1.8;">نأسف لإبلاغك بأنه لم تتم الموافقة على طلب التمويل رقم <strong>${data.application_number}</strong> في الوقت الحالي.</p>
              
              ${data.rejection_reason ? `
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #dc2626;">
                <p style="color: #64748b; margin: 0;"><strong>السبب:</strong> ${data.rejection_reason}</p>
              </div>
              ` : ''}
              
              <p style="color: #64748b; line-height: 1.8;">يمكنك التقديم مرة أخرى بعد استيفاء الشروط المطلوبة. لأي استفسار، تواصل معنا.</p>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="https://maxiocore.com/dashboard/financing" style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">تقديم طلب جديد</a>
              </div>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">فريق ماكسيو كور - Maxiocore</p>
          </div>
        `;
        break;

      case "documents_required":
        subject = `📄 مطلوب مستندات إضافية - طلب التمويل #${data.application_number}`;
        htmlContent = `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 16px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">📄 مطلوب مستندات إضافية</h1>
              <p style="margin: 10px 0 0; font-size: 16px;">طلب التمويل #${data.application_number}</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin: 0 0 20px;">مرحباً ${data.name}،</h2>
              <p style="color: #64748b; line-height: 1.8;">بعد مراجعة طلب التمويل الخاص بك، نحتاج إلى بعض المستندات الإضافية لاستكمال عملية المراجعة.</p>
              
              ${data.documents_notes ? `
              <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">📋 المستندات المطلوبة:</h3>
                <p style="color: #78716c; margin: 0; white-space: pre-line; line-height: 1.8;">${data.documents_notes}</p>
              </div>
              ` : ''}
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #64748b; margin: 0;">
                  <strong>⏱️ مهم:</strong> يرجى تقديم المستندات المطلوبة في أقرب وقت ممكن لتسريع عملية المراجعة.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="https://maxiocore.com/dashboard/financing" style="background: #f59e0b; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">رفع المستندات</a>
              </div>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">فريق ماكسيو كور - Maxiocore</p>
          </div>
        `;
        break;

      case "under_review":
        subject = `🔍 جاري مراجعة طلب التمويل #${data.application_number}`;
        htmlContent = `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 16px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">🔍 جاري المراجعة</h1>
              <p style="margin: 10px 0 0; font-size: 16px;">طلب التمويل #${data.application_number}</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin: 0 0 20px;">مرحباً ${data.name}،</h2>
              <p style="color: #64748b; line-height: 1.8;">نود إعلامك بأن طلب التمويل الخاص بك قيد المراجعة الآن من قبل فريقنا المختص.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="width: 40px; height: 40px; background: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 15px;">
                    <span style="font-size: 20px;">1️⃣</span>
                  </div>
                  <div>
                    <p style="margin: 0; color: #10b981; font-weight: bold;">✓ تم استلام الطلب</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="width: 40px; height: 40px; background: #c7d2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 15px;">
                    <span style="font-size: 20px;">2️⃣</span>
                  </div>
                  <div>
                    <p style="margin: 0; color: #6366f1; font-weight: bold;">⏳ قيد المراجعة (أنت هنا)</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center;">
                  <div style="width: 40px; height: 40px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 15px;">
                    <span style="font-size: 20px;">3️⃣</span>
                  </div>
                  <div>
                    <p style="margin: 0; color: #9ca3af;">النتيجة</p>
                  </div>
                </div>
              </div>
              
              <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #1e40af; margin: 0; font-size: 14px;">
                  💡 سيتم إعلامك فور الانتهاء من المراجعة عبر البريد الإلكتروني.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="https://maxiocore.com/dashboard/financing" style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">متابعة حالة الطلب</a>
              </div>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">فريق ماكسيو كور - Maxiocore</p>
          </div>
        `;
        break;

      default:
        throw new Error("Invalid notification type");
    }

    // Send email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Maxiocore <noreply@maxiocore.com>",
        to: [data.email],
        subject,
        html: htmlContent,
      }),
    });

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    // Send SMS notification if phone is available
    if (data.phone) {
      const smsMessage = getSMSMessage(data);
      const smsResult = await sendSMS(data.phone, smsMessage);
      console.log("SMS result:", smsResult);
      
      // Log SMS
      await supabase.from("sms_logs").insert({
        phone: data.phone,
        message: smsMessage,
        type: 'notification',
        status: smsResult.success ? 'sent' : 'failed',
        user_id: data.userId || null,
        reference_id: data.application_number,
        error_message: smsResult.error || null,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
