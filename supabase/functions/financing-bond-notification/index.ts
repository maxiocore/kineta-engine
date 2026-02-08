import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "ASH HOLDING <notifications@ashholding.com>";

// ملاحظة التمويل غير النقدي
const FINANCING_DISCLAIMER = `تنويه مهم: التمويل غير نقدي ويتم إضافة القيمة كرصيد خدمات داخل المنصة ولا يمكن سحبها أو تحويلها. رصيد الخدمات مخصص حصريًا لشراء خدمات شركة علي صالح الشهري القابضة والجهات التابعة لها.`;

// محتوى الإشعارات لكل نوع
const NOTIFICATION_CONTENT: Record<string, {
  subject: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaPath: string;
  additionalNote?: string;
  whatsappMessage: string;
}> = {
  BOND_ISSUING: {
    subject: '⏳ جاري إصدار السند التنفيذي | ASH HOLDING',
    headline: 'جاري إصدار السند التنفيذي (سند لأمر)',
    description: 'نُعلمكم بأنه جاري الآن إصدار السند التنفيذي (سند لأمر) لطلب التمويل الخاص بكم عبر منصة نافذ الرسمية.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    additionalNote: 'سيتم إرسال إشعار آخر فور اكتمال إصدار السند.',
    whatsappMessage: `مرحباً {{customer_name}}

⏳ جاري إصدار السند التنفيذي

رقم الطلب: {{application_number}}

نُعلمكم بأنه جاري إصدار السند التنفيذي (سند لأمر) لطلب التمويل الخاص بكم عبر منصة نافذ.

سيتم إشعاركم فور اكتمال الإصدار وإرسال الرابط لتأكيد التوقيع.

📋 متابعة الطلب:
{{deep_link}}

ASH HOLDING`
  },
  BOND_ISSUED: {
    subject: '📄 تم إصدار السند التنفيذي - يُرجى تأكيد التوقيع | ASH HOLDING',
    headline: 'تم إصدار السند التنفيذي بنجاح',
    description: 'نُعلمكم بأنه تم إصدار السند التنفيذي (سند لأمر) بنجاح عبر منصة نافذ. يُرجى الدخول إلى المنصة وتأكيد توقيعكم على السند لإتمام إجراءات التمويل.',
    ctaText: 'تأكيد توقيع السند',
    ctaPath: '/dashboard/financing/status',
    additionalNote: 'يُرجى تأكيد التوقيع خلال 7 أيام لاستكمال الإجراءات.',
    whatsappMessage: `مرحباً {{customer_name}} 📄

✅ تم إصدار السند التنفيذي بنجاح

رقم الطلب: {{application_number}}
المبلغ: {{approved_amount}} ر.س

تم إصدار السند التنفيذي (سند لأمر) عبر منصة نافذ الرسمية.

⚠️ يُرجى الدخول للمنصة وتأكيد توقيعكم خلال 7 أيام.

📋 تأكيد التوقيع:
{{deep_link}}

ASH HOLDING`
  },
  BOND_SENT_TO_CLIENT: {
    subject: '📩 تم إرسال السند التنفيذي للتوقيع | ASH HOLDING',
    headline: 'السند التنفيذي بانتظار توقيعكم',
    description: 'تم إرسال السند التنفيذي إليكم عبر منصة نافذ. يُرجى الدخول لمنصة نافذ وتوقيع السند، ثم العودة لمنصتنا لتأكيد التوقيع.',
    ctaText: 'تأكيد التوقيع',
    ctaPath: '/dashboard/financing/status',
    additionalNote: 'بعد التوقيع على نافذ، عُد للمنصة لتأكيد التوقيع.',
    whatsappMessage: `مرحباً {{customer_name}}

📩 السند التنفيذي بانتظار توقيعكم

رقم الطلب: {{application_number}}

تم إرسال السند التنفيذي إليكم عبر منصة نافذ الرسمية.

📝 الخطوات المطلوبة:
1️⃣ ادخل لمنصة نافذ ووقّع السند
2️⃣ عُد لمنصتنا وأكّد التوقيع

🔗 تأكيد التوقيع:
{{deep_link}}

ASH HOLDING`
  },
  BOND_SIGNED: {
    subject: '✅ تم تأكيد توقيع السند التنفيذي | ASH HOLDING',
    headline: 'تم تأكيد توقيع السند بنجاح!',
    description: 'شكرًا لكم! تم تأكيد توقيعكم على السند التنفيذي بنجاح. جارٍ الآن المراجعة النهائية وإضافة رصيد الخدمات إلى حسابكم.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    additionalNote: 'سيتم إضافة رصيد الخدمات خلال ساعات قليلة بعد المراجعة.',
    whatsappMessage: `مرحباً {{customer_name}} ✅

🎉 تم تأكيد توقيع السند بنجاح!

رقم الطلب: {{application_number}}
المبلغ: {{approved_amount}} ر.س

شكرًا لإتمام توقيع السند التنفيذي.

⏳ جارٍ المراجعة النهائية وسيتم إضافة رصيد الخدمات قريبًا.

📋 متابعة الطلب:
{{deep_link}}

ASH HOLDING`
  }
};

interface NotificationRequest {
  applicationId: string;
  applicationNumber: string;
  recipientEmail: string;
  recipientName: string;
  approvedAmount?: number;
  notificationType: 'BOND_ISSUING' | 'BOND_ISSUED' | 'BOND_SENT_TO_CLIENT' | 'BOND_SIGNED';
  baseUrl: string;
  actorId?: string;
}

// ============= Supabase Client =============
function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// ============= Send WhatsApp =============
async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<boolean> {
  const instanceId = Deno.env.get("SMARTWATS_INSTANCE_ID");
  const accessToken = Deno.env.get("SMARTWATS_ACCESS_TOKEN");
  
  if (!instanceId || !accessToken) {
    console.log("⚠️ SmartWats not configured, skipping WhatsApp");
    return false;
  }
  
  try {
    const response = await fetch("https://app.smartwats.com/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instance_id: instanceId,
        access_token: accessToken,
        number: phone.replace(/\D/g, ''),
        type: "text",
        message: message
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp send failed:", errorText);
      return false;
    }
    
    console.log("✅ WhatsApp sent successfully");
    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

// ============= Generate Email HTML =============
function generateEmailHtml(
  content: typeof NOTIFICATION_CONTENT[string],
  data: {
    recipientName: string;
    applicationNumber: string;
    approvedAmount?: number;
    baseUrl: string;
  }
): string {
  const ctaUrl = `${data.baseUrl}${content.ctaPath}`;
  
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f4f7fa; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">ASH HOLDING</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">منصة الحلول التقنية المتكاملة</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
                مرحباً <strong>${data.recipientName}</strong>،
              </p>
              
              <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-right: 4px solid #0EA5E9; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <h2 style="color: #0284C7; margin: 0 0 12px; font-size: 20px;">
                  ${content.headline}
                </h2>
                <p style="color: #374151; margin: 0; line-height: 1.7;">
                  ${content.description}
                </p>
              </div>
              
              <!-- Application Details -->
              <table width="100%" style="background-color: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB;">
                    <span style="color: #6B7280; font-size: 14px;">رقم الطلب:</span>
                    <strong style="color: #111827; font-size: 16px; float: left;">${data.applicationNumber}</strong>
                  </td>
                </tr>
                ${data.approvedAmount ? `
                <tr>
                  <td style="padding: 12px 16px;">
                    <span style="color: #6B7280; font-size: 14px;">المبلغ المعتمد:</span>
                    <strong style="color: #059669; font-size: 16px; float: left;">${data.approvedAmount.toLocaleString('ar-SA')} ر.س</strong>
                  </td>
                </tr>
                ` : ''}
              </table>
              
              ${content.additionalNote ? `
              <p style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; color: #92400E; font-size: 14px; margin-bottom: 24px;">
                ⚠️ ${content.additionalNote}
              </p>
              ` : ''}
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);">
                  ${content.ctaText}
                </a>
              </div>
              
              <!-- Disclaimer -->
              <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <p style="color: #991B1B; font-size: 12px; margin: 0; line-height: 1.6;">
                  ${FINANCING_DISCLAIMER}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1E293B; padding: 24px 32px; text-align: center;">
              <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} شركة علي صالح الشهري القابضة - جميع الحقوق محفوظة
              </p>
              <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin: 8px 0 0;">
                هذا البريد مُرسل تلقائيًا، يُرجى عدم الرد عليه.
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

// ============= Main Handler =============
serve(async (req) => {
  console.log("📧 Bond notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: NotificationRequest = await req.json();
    console.log("📋 Request:", JSON.stringify({
      applicationId: request.applicationId,
      notificationType: request.notificationType,
      recipientEmail: request.recipientEmail
    }));

    const {
      applicationId,
      applicationNumber,
      recipientEmail,
      recipientName,
      approvedAmount,
      notificationType,
      baseUrl,
      actorId
    } = request;

    // Validate required fields
    if (!applicationId || !applicationNumber || !recipientEmail || !recipientName || !notificationType) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get notification content
    const content = NOTIFICATION_CONTENT[notificationType];
    if (!content) {
      console.error("❌ Unknown notification type:", notificationType);
      return new Response(
        JSON.stringify({ success: false, error: `Unknown notification type: ${notificationType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();
    const deepLink = `${baseUrl}/dashboard/financing/status/${applicationId}`;
    
    // Get user phone for WhatsApp
    const { data: application } = await supabase
      .from('financing_applications')
      .select('phone')
      .eq('id', applicationId)
      .single();

    // ===== Send Email =====
    let emailSent = false;
    try {
      const emailHtml = generateEmailHtml(content, {
        recipientName,
        applicationNumber,
        approvedAmount,
        baseUrl
      });

      const emailResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: [recipientEmail],
        subject: content.subject,
        html: emailHtml
      });

      if (emailResult.error) {
        console.error("❌ Email send error:", emailResult.error);
      } else {
        console.log("✅ Email sent:", emailResult.data?.id);
        emailSent = true;
      }
    } catch (emailError) {
      console.error("❌ Email exception:", emailError);
    }

    // ===== Send WhatsApp =====
    let whatsappSent = false;
    if (application?.phone) {
      const whatsappMessage = content.whatsappMessage
        .replace('{{customer_name}}', recipientName)
        .replace('{{application_number}}', applicationNumber)
        .replace('{{approved_amount}}', approvedAmount?.toLocaleString('ar-SA') || '-')
        .replace('{{deep_link}}', deepLink);

      whatsappSent = await sendWhatsAppNotification(application.phone, whatsappMessage);
    }

    // ===== Log the notification =====
    try {
      await supabase.from('financing_activity_log').insert({
        application_id: applicationId,
        event_type: `NOTIFICATION_${notificationType}`,
        from_status: null,
        to_status: notificationType,
        triggered_by: 'system',
        actor_id: actorId || null,
        is_visible_to_customer: false,
        metadata: {
          email_sent: emailSent,
          whatsapp_sent: whatsappSent,
          recipient_email: recipientEmail
        }
      });
    } catch (logError) {
      console.error("⚠️ Failed to log notification:", logError);
    }

    console.log(`✅ Bond notification completed - Email: ${emailSent}, WhatsApp: ${whatsappSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        whatsappSent,
        notificationType
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Bond notification error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
