import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ملاحظة التمويل غير النقدي
const FINANCING_DISCLAIMER = `تنويه مهم: التمويل غير نقدي ويتم إضافة القيمة كرصيد خدمات داخل المنصة ولا يمكن سحبها أو تحويلها. رصيد الخدمات مخصص حصريًا لشراء خدمات شركة علي صالح الشهري القابضة والجهات التابعة لها.`;

// محتوى البريد لكل حالة
const EMAIL_CONTENT: Record<string, {
  subject: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaPath: string;
  additionalNote?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  showDisclaimer: boolean;
}> = {
  SUBMITTED: {
    subject: 'تم استلام طلب تمويل الخدمات | MaxioCore',
    headline: 'تم استلام طلبكم بنجاح',
    description: 'شكرًا لتقديمكم طلب تمويل الخدمات. تم استلام طلبكم وسيتم مراجعته من قِبل الفريق المختص في أقرب وقت ممكن.',
    ctaText: 'عرض حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'info',
    showDisclaimer: true
  },
  UNDER_REVIEW: {
    subject: 'طلبكم قيد المراجعة | MaxioCore',
    headline: 'طلبكم قيد المراجعة',
    description: 'يقوم فريقنا المختص حاليًا بمراجعة طلب تمويل الخدمات المقدم منكم. تستغرق هذه المرحلة عادةً من يوم إلى ثلاثة أيام عمل.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'info',
    showDisclaimer: true
  },
  ADDITIONAL_INFO_REQUIRED: {
    subject: '⚠️ مطلوب معلومات إضافية لطلب التمويل | MaxioCore',
    headline: 'مطلوب معلومات إضافية',
    description: 'لاستكمال دراسة طلبكم، نحتاج إلى بعض المعلومات أو المستندات الإضافية. يُرجى تزويدنا بها خلال 14 يومًا.',
    ctaText: 'رفع المستندات المطلوبة',
    ctaPath: '/dashboard/financing/documents',
    additionalNote: 'المهلة المتاحة: 14 يومًا. عدم الاستجابة قد يؤدي لانتهاء صلاحية الطلب.',
    type: 'warning',
    showDisclaimer: true
  },
  APPROVED: {
    subject: '✅ تهانينا! تمت الموافقة على طلب التمويل | MaxioCore',
    headline: 'تهانينا! تمت الموافقة على طلبكم',
    description: 'يسرنا إبلاغكم بالموافقة على طلب تمويل الخدمات الخاص بكم بالكامل. الخطوة التالية هي مراجعة العقد والموافقة عليه إلكترونيًا.',
    ctaText: 'مراجعة العقد والتوقيع',
    ctaPath: '/dashboard/financing/contract',
    type: 'success',
    showDisclaimer: true
  },
  APPROVED_WITH_LIMITS: {
    subject: '✅ تمت الموافقة على طلب التمويل بقيمة معدّلة | MaxioCore',
    headline: 'تمت الموافقة بقيمة معدّلة',
    description: 'تمت الموافقة على طلب تمويل الخدمات الخاص بكم بقيمة معدّلة. يمكنكم مراجعة التفاصيل في العقد.',
    ctaText: 'مراجعة العقد والقيمة المعتمدة',
    ctaPath: '/dashboard/financing/contract',
    additionalNote: 'في حال عدم الموافقة على القيمة المعدّلة، يمكنكم رفض العقد وتقديم طلب جديد لاحقًا.',
    type: 'success',
    showDisclaimer: true
  },
  CONTRACT_PRESENTED: {
    subject: '📄 العقد جاهز للتوقيع | MaxioCore',
    headline: 'العقد جاهز للمراجعة والتوقيع',
    description: 'تم إعداد عقد تمويل الخدمات الخاص بكم. يُرجى مراجعة البنود والشروط بعناية قبل التوقيع الإلكتروني.',
    ctaText: 'عرض العقد والتوقيع',
    ctaPath: '/dashboard/financing/contract',
    additionalNote: 'المهلة المتاحة للتوقيع: 7 أيام.',
    type: 'info',
    showDisclaimer: true
  },
  CONTRACT_ACCEPTED: {
    subject: '✅ تم قبول العقد بنجاح | MaxioCore',
    headline: 'تم قبول العقد بنجاح',
    description: 'شكرًا لتوقيعكم على عقد تمويل الخدمات. العقد بانتظار الاعتماد النهائي من الإدارة المختصة.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'success',
    showDisclaimer: true
  },
  CONTRACT_FINALIZED: {
    subject: '🎉 تم اعتماد العقد رسميًا | MaxioCore',
    headline: 'تم اعتماد العقد رسميًا',
    description: 'تم اعتماد عقد تمويل الخدمات بشكل نهائي. جارٍ إضافة رصيد الخدمات إلى حسابكم.',
    ctaText: 'عرض حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'success',
    showDisclaimer: true
  },
  CREDIT_DEPOSITED: {
    subject: '🎉 رصيد الخدمات جاهز للاستخدام! | MaxioCore',
    headline: 'رصيد الخدمات جاهز للاستخدام!',
    description: 'تم بنجاح إضافة رصيد الخدمات إلى حسابكم. يمكنكم الآن استخدامه لشراء الخدمات المتاحة. صلاحية الرصيد: 12 شهرًا.',
    ctaText: 'تصفّح الخدمات واستخدم الرصيد',
    ctaPath: '/dashboard/services',
    additionalNote: 'استكشفوا مجموعة الخدمات المتاحة واستفيدوا من رصيدكم الآن.',
    type: 'success',
    showDisclaimer: true
  },
  DECLINED: {
    subject: 'نتيجة طلب تمويل الخدمات | MaxioCore',
    headline: 'نتيجة طلب التمويل',
    description: 'نأسف لإبلاغكم بأنه لم يتم الموافقة على طلب تمويل الخدمات في الوقت الحالي، وذلك لعدم استيفاء بعض متطلبات الأهلية.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    additionalNote: 'قرار الرفض لا يعكس تقييمًا شخصيًا ويمكنكم المحاولة مجددًا.',
    type: 'error',
    showDisclaimer: false
  },
  EXPIRED: {
    subject: 'انتهت صلاحية طلب التمويل | MaxioCore',
    headline: 'انتهت صلاحية الطلب',
    description: 'انتهت صلاحية طلب تمويل الخدمات بسبب عدم استكمال الإجراءات المطلوبة خلال المهلة المحددة.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    type: 'warning',
    showDisclaimer: false
  },
  CANCELLED: {
    subject: 'تم إلغاء طلب التمويل | MaxioCore',
    headline: 'تم إلغاء الطلب',
    description: 'تم إلغاء طلب تمويل الخدمات بناءً على طلبكم. يمكنكم التقدم بطلب جديد في أي وقت.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    type: 'info',
    showDisclaimer: false
  }
};

// ألوان حسب نوع الإشعار
const TYPE_COLORS = {
  info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  success: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
  warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
  error: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' }
};

interface EmailRequest {
  applicationId: string;
  status: string;
  recipientEmail: string;
  recipientName: string;
  applicationNumber: string;
  approvedAmount?: number;
  baseUrl: string;
}

function generateEmailHtml(
  content: typeof EMAIL_CONTENT[string],
  data: {
    recipientName: string;
    applicationNumber: string;
    approvedAmount?: number;
    baseUrl: string;
    updatedAt: string;
  }
): string {
  const colors = TYPE_COLORS[content.type];
  const ctaUrl = `${data.baseUrl}${content.ctaPath}`;
  
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${content.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: Tahoma, Arial, "Noto Naskh Arabic", "Cairo", sans-serif;
      -webkit-font-smoothing: antialiased;
      direction: rtl;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f4f5;
      padding: 40px 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .logo-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    .company-name {
      color: #94a3b8;
      font-size: 14px;
      margin-top: 8px;
    }
    .email-body {
      padding: 40px;
    }
    .greeting {
      font-size: 18px;
      color: #334155;
      margin-bottom: 24px;
    }
    .status-card {
      background-color: ${colors.bg};
      border-right: 4px solid ${colors.border};
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .headline {
      font-size: 22px;
      font-weight: bold;
      color: ${colors.text};
      margin: 0 0 12px 0;
    }
    .description {
      font-size: 16px;
      color: #475569;
      line-height: 1.7;
      margin: 0;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      background-color: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
    }
    .info-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .info-table tr:last-child td {
      border-bottom: none;
    }
    .info-label {
      color: #64748b;
      width: 40%;
    }
    .info-value {
      color: #1e293b;
      font-weight: 600;
    }
    .amount-highlight {
      background-color: #ecfdf5;
      color: #059669;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 18px;
    }
    .additional-note {
      background-color: #fffbeb;
      border-right: 3px solid #f59e0b;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      font-size: 14px;
      color: #92400e;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      margin: 24px 0;
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    }
    .disclaimer {
      background-color: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      font-size: 13px;
      color: #92400e;
      line-height: 1.6;
    }
    .disclaimer-icon {
      display: inline-block;
      margin-left: 8px;
    }
    .email-footer {
      background-color: #f8fafc;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #64748b;
      margin: 0;
      line-height: 1.8;
    }
    .footer-links {
      margin-top: 16px;
    }
    .footer-links a {
      color: #3b82f6;
      text-decoration: none;
      margin: 0 12px;
      font-size: 12px;
    }
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 24px;
      }
      .email-header {
        padding: 24px;
      }
      .headline {
        font-size: 18px;
      }
      .cta-button {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <h1 class="logo-text">MaxioCore</h1>
        <p class="company-name">شركة علي صالح الشهري القابضة</p>
      </div>

      <!-- Body -->
      <div class="email-body">
        <p class="greeting">مرحباً ${data.recipientName}،</p>

        <!-- Status Card -->
        <div class="status-card">
          <h2 class="headline">${content.headline}</h2>
          <p class="description">${content.description}</p>
        </div>

        <!-- Info Table -->
        <table class="info-table" role="presentation">
          <tr>
            <td class="info-label">رقم الطلب</td>
            <td class="info-value">${data.applicationNumber}</td>
          </tr>
          ${data.approvedAmount ? `
          <tr>
            <td class="info-label">رصيد الخدمات المعتمد</td>
            <td class="info-value">
              <span class="amount-highlight">${data.approvedAmount.toLocaleString('ar-SA')} ر.س</span>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td class="info-label">تاريخ التحديث</td>
            <td class="info-value">${data.updatedAt}</td>
          </tr>
        </table>

        ${content.additionalNote ? `
        <div class="additional-note">
          ⚠️ ${content.additionalNote}
        </div>
        ` : ''}

        <!-- CTA Button -->
        <div style="text-align: center;">
          <a href="${ctaUrl}" class="cta-button">${content.ctaText}</a>
        </div>

        ${content.showDisclaimer ? `
        <!-- Disclaimer -->
        <div class="disclaimer">
          <span class="disclaimer-icon">ℹ️</span>
          ${FINANCING_DISCLAIMER}
        </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <p class="footer-text">
          هذا البريد مُرسل تلقائيًا من منصة MaxioCore<br>
          شركة علي صالح الشهري القابضة - المملكة العربية السعودية
        </p>
        <div class="footer-links">
          <a href="${data.baseUrl}/help">مركز المساعدة</a>
          <a href="${data.baseUrl}/contact">تواصل معنا</a>
          <a href="${data.baseUrl}/privacy">سياسة الخصوصية</a>
        </div>
        <p class="footer-text" style="margin-top: 16px;">
          © ${new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePlainText(
  content: typeof EMAIL_CONTENT[string],
  data: {
    recipientName: string;
    applicationNumber: string;
    approvedAmount?: number;
    baseUrl: string;
    updatedAt: string;
  }
): string {
  let text = `مرحباً ${data.recipientName}،

${content.headline}

${content.description}

---
رقم الطلب: ${data.applicationNumber}
${data.approvedAmount ? `رصيد الخدمات المعتمد: ${data.approvedAmount.toLocaleString('ar-SA')} ر.س` : ''}
تاريخ التحديث: ${data.updatedAt}
---

${content.additionalNote ? `⚠️ ${content.additionalNote}\n\n` : ''}`;

  if (content.showDisclaimer) {
    text += `\n${FINANCING_DISCLAIMER}\n`;
  }

  text += `
---
${content.ctaText}: ${data.baseUrl}${content.ctaPath}
---

هذا البريد مُرسل تلقائيًا من منصة MaxioCore
شركة علي صالح الشهري القابضة - المملكة العربية السعودية

© ${new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.`;

  return text;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      applicationId,
      status,
      recipientEmail,
      recipientName,
      applicationNumber,
      approvedAmount,
      baseUrl
    }: EmailRequest = await req.json();

    console.log(`Sending financing status email: ${status} to ${recipientEmail}`);

    // التحقق من وجود محتوى للحالة
    const content = EMAIL_CONTENT[status.toUpperCase()];
    if (!content) {
      console.log(`No email content defined for status: ${status}`);
      return new Response(
        JSON.stringify({ success: true, message: "No email required for this status" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // تنسيق التاريخ
    const now = new Date();
    const updatedAt = now.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailData = {
      recipientName,
      applicationNumber,
      approvedAmount,
      baseUrl,
      updatedAt
    };

    // إنشاء البريد
    const htmlContent = generateEmailHtml(content, emailData);
    const textContent = generatePlainText(content, emailData);

    // إرسال البريد
    const emailResponse = await resend.emails.send({
      from: "MaxioCore <notifications@maxiocore.com>",
      to: [recipientEmail],
      subject: content.subject,
      html: htmlContent,
      text: textContent,
      headers: {
        "X-Application-Id": applicationId,
        "X-Status": status
      }
    });

    console.log("Email sent successfully:", emailResponse);

    // تسجيل الإرسال في قاعدة البيانات
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseClient.from("emails").insert({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject: content.subject,
      content: htmlContent,
      status: "sent",
      sent_at: now.toISOString()
    });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending financing status email:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
