import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= Configuration =============
const CONFIG = {
  MAX_EMAILS_PER_HOUR: 5,
  MAX_EMAILS_PER_DAY: 20,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAYS: [60, 300, 900], // seconds: 1min, 5min, 15min
  FROM_EMAIL: "MaxioCore <notifications@maxiocore.com>",
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
  priority: number;
}> = {
  SUBMITTED: {
    subject: 'تم استلام طلب تمويل الخدمات | MaxioCore',
    headline: 'تم استلام طلبكم بنجاح',
    description: 'شكرًا لتقديمكم طلب تمويل الخدمات. تم استلام طلبكم وسيتم مراجعته من قِبل الفريق المختص في أقرب وقت ممكن.',
    ctaText: 'عرض حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'info',
    showDisclaimer: true,
    priority: 3
  },
  UNDER_REVIEW: {
    subject: 'طلبكم قيد المراجعة | MaxioCore',
    headline: 'طلبكم قيد المراجعة',
    description: 'يقوم فريقنا المختص حاليًا بمراجعة طلب تمويل الخدمات المقدم منكم. تستغرق هذه المرحلة عادةً من يوم إلى ثلاثة أيام عمل.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'info',
    showDisclaimer: true,
    priority: 5
  },
  ADDITIONAL_INFO_REQUIRED: {
    subject: '⚠️ مطلوب معلومات إضافية لطلب التمويل | MaxioCore',
    headline: 'مطلوب معلومات إضافية',
    description: 'لاستكمال دراسة طلبكم، نحتاج إلى بعض المعلومات أو المستندات الإضافية. يُرجى تزويدنا بها خلال 14 يومًا.',
    ctaText: 'رفع المستندات المطلوبة',
    ctaPath: '/dashboard/financing/documents',
    additionalNote: 'المهلة المتاحة: 14 يومًا. عدم الاستجابة قد يؤدي لانتهاء صلاحية الطلب.',
    type: 'warning',
    showDisclaimer: true,
    priority: 1
  },
  APPROVED: {
    subject: '✅ تهانينا! تمت الموافقة على طلب التمويل | MaxioCore',
    headline: 'تهانينا! تمت الموافقة على طلبكم',
    description: 'يسرنا إبلاغكم بالموافقة على طلب تمويل الخدمات الخاص بكم بالكامل. الخطوة التالية هي مراجعة العقد والموافقة عليه إلكترونيًا.',
    ctaText: 'مراجعة العقد والتوقيع',
    ctaPath: '/dashboard/financing/contract',
    type: 'success',
    showDisclaimer: true,
    priority: 1
  },
  APPROVED_WITH_LIMITS: {
    subject: '✅ تمت الموافقة على طلب التمويل بقيمة معدّلة | MaxioCore',
    headline: 'تمت الموافقة بقيمة معدّلة',
    description: 'تمت الموافقة على طلب تمويل الخدمات الخاص بكم بقيمة معدّلة. يمكنكم مراجعة التفاصيل في العقد.',
    ctaText: 'مراجعة العقد والقيمة المعتمدة',
    ctaPath: '/dashboard/financing/contract',
    additionalNote: 'في حال عدم الموافقة على القيمة المعدّلة، يمكنكم رفض العقد وتقديم طلب جديد لاحقًا.',
    type: 'success',
    showDisclaimer: true,
    priority: 1
  },
  CONTRACT_PRESENTED: {
    subject: '📄 العقد جاهز للتوقيع | MaxioCore',
    headline: 'العقد جاهز للمراجعة والتوقيع',
    description: 'تم إعداد عقد تمويل الخدمات الخاص بكم. يُرجى مراجعة البنود والشروط بعناية قبل التوقيع الإلكتروني.',
    ctaText: 'عرض العقد والتوقيع',
    ctaPath: '/dashboard/financing/contract',
    additionalNote: 'المهلة المتاحة للتوقيع: 7 أيام.',
    type: 'info',
    showDisclaimer: true,
    priority: 2
  },
  CONTRACT_ACCEPTED: {
    subject: '✅ تم قبول العقد بنجاح | MaxioCore',
    headline: 'تم قبول العقد بنجاح',
    description: 'شكرًا لتوقيعكم على عقد تمويل الخدمات. العقد بانتظار الاعتماد النهائي من الإدارة المختصة.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'success',
    showDisclaimer: true,
    priority: 3
  },
  CONTRACT_FINALIZED: {
    subject: '🎉 تم اعتماد العقد رسميًا | MaxioCore',
    headline: 'تم اعتماد العقد رسميًا',
    description: 'تم اعتماد عقد تمويل الخدمات بشكل نهائي. جارٍ إضافة رصيد الخدمات إلى حسابكم.',
    ctaText: 'عرض حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'success',
    showDisclaimer: true,
    priority: 2
  },
  CREDIT_DEPOSITED: {
    subject: '🎉 رصيد الخدمات جاهز للاستخدام! | MaxioCore',
    headline: 'رصيد الخدمات جاهز للاستخدام!',
    description: 'تم بنجاح إضافة رصيد الخدمات إلى حسابكم. يمكنكم الآن استخدامه لشراء الخدمات المتاحة. صلاحية الرصيد: 12 شهرًا.',
    ctaText: 'تصفّح الخدمات واستخدم الرصيد',
    ctaPath: '/dashboard/services',
    additionalNote: 'استكشفوا مجموعة الخدمات المتاحة واستفيدوا من رصيدكم الآن.',
    type: 'success',
    showDisclaimer: true,
    priority: 1
  },
  DECLINED: {
    subject: 'نتيجة طلب تمويل الخدمات | MaxioCore',
    headline: 'نتيجة طلب التمويل',
    description: 'نأسف لإبلاغكم بأنه لم يتم الموافقة على طلب تمويل الخدمات في الوقت الحالي، وذلك لعدم استيفاء بعض متطلبات الأهلية.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    additionalNote: 'قرار الرفض لا يعكس تقييمًا شخصيًا ويمكنكم المحاولة مجددًا.',
    type: 'error',
    showDisclaimer: false,
    priority: 2
  },
  EXPIRED: {
    subject: 'انتهت صلاحية طلب التمويل | MaxioCore',
    headline: 'انتهت صلاحية الطلب',
    description: 'انتهت صلاحية طلب تمويل الخدمات بسبب عدم استكمال الإجراءات المطلوبة خلال المهلة المحددة.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    type: 'warning',
    showDisclaimer: false,
    priority: 4
  },
  CANCELLED: {
    subject: 'تم إلغاء طلب التمويل | MaxioCore',
    headline: 'تم إلغاء الطلب',
    description: 'تم إلغاء طلب تمويل الخدمات بناءً على طلبكم. يمكنكم التقدم بطلب جديد في أي وقت.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    type: 'info',
    showDisclaimer: false,
    priority: 5
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
  forceResend?: boolean;
}

interface QueueResult {
  success: boolean;
  action: 'sent' | 'queued' | 'skipped' | 'rate_limited' | 'failed';
  message: string;
  queueId?: string;
  resendId?: string;
}

// deno-lint-ignore no-explicit-any
type SupabaseClientType = any;

// ============= Supabase Client =============
function getSupabaseClient(): SupabaseClientType {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// ============= Idempotency Check =============
async function checkIdempotency(
  supabase: SupabaseClientType,
  applicationId: string,
  status: string
): Promise<{ isDuplicate: boolean; existingId?: string }> {
  const idempotencyKey = `${applicationId}:${status}`;
  
  const { data, error } = await supabase
    .from('financing_email_queue')
    .select('id, queue_status')
    .eq('idempotency_key', idempotencyKey)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Idempotency check error:', error);
  }
  
  if (data) {
    return { isDuplicate: true, existingId: data.id };
  }
  
  return { isDuplicate: false };
}

// ============= Rate Limiting =============
async function checkRateLimit(
  supabase: SupabaseClientType,
  email: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_email_rate_limit', {
    p_email: email,
    p_max_per_hour: CONFIG.MAX_EMAILS_PER_HOUR,
    p_max_per_day: CONFIG.MAX_EMAILS_PER_DAY
  });
  
  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow if check fails (fail open)
  }
  
  return data === true;
}

async function incrementRateLimit(
  supabase: SupabaseClientType,
  email: string
): Promise<void> {
  const { error } = await supabase.rpc('increment_email_rate_limit', {
    p_email: email
  });
  
  if (error) {
    console.error('Rate limit increment error:', error);
  }
}

// ============= Queue Operations =============
async function addToQueue(
  supabase: SupabaseClientType,
  request: EmailRequest,
  priority: number
): Promise<string> {
  const idempotencyKey = `${request.applicationId}:${request.status}`;
  
  const { data, error } = await supabase
    .from('financing_email_queue')
    .insert({
      idempotency_key: idempotencyKey,
      application_id: request.applicationId,
      recipient_email: request.recipientEmail,
      recipient_name: request.recipientName,
      application_number: request.applicationNumber,
      status: request.status,
      approved_amount: request.approvedAmount,
      priority: priority,
      queue_status: 'pending',
      next_retry_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to add to queue: ${error.message}`);
  }
  
  return data.id;
}

async function updateQueueStatus(
  supabase: SupabaseClientType,
  queueId: string,
  status: 'processing' | 'sent' | 'failed' | 'skipped',
  additionalData?: {
    resend_id?: string;
    last_error?: string;
    response_data?: Record<string, unknown>;
  }
): Promise<void> {
  // deno-lint-ignore no-explicit-any
  const updateData: Record<string, any> = {
    queue_status: status,
    processed_at: new Date().toISOString(),
    ...(additionalData || {})
  };
  
  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString();
  }
  
  const { error } = await supabase
    .from('financing_email_queue')
    .update(updateData)
    .eq('id', queueId);
  
  if (error) {
    console.error('Failed to update queue status:', error);
  }
}

async function incrementRetry(
  supabase: SupabaseClientType,
  queueId: string,
  errorMessage: string
): Promise<void> {
  // Get current attempts
  const { data: current } = await supabase
    .from('financing_email_queue')
    .select('attempts, max_attempts')
    .eq('id', queueId)
    .single();
  
  if (!current) return;
  
  const newAttempts = current.attempts + 1;
  const nextRetryDelay = CONFIG.RETRY_DELAYS[Math.min(newAttempts - 1, CONFIG.RETRY_DELAYS.length - 1)];
  const nextRetryAt = new Date(Date.now() + nextRetryDelay * 1000).toISOString();
  
  // deno-lint-ignore no-explicit-any
  const updateData: Record<string, any> = {
    attempts: newAttempts,
    last_error: errorMessage,
    next_retry_at: nextRetryAt
  };
  
  // Mark as failed if max attempts reached
  if (newAttempts >= current.max_attempts) {
    updateData.queue_status = 'failed';
    updateData.processed_at = new Date().toISOString();
  }
  
  await supabase
    .from('financing_email_queue')
    .update(updateData)
    .eq('id', queueId);
}

// ============= Logging =============
async function logEmailResult(
  supabase: SupabaseClientType,
  queueId: string | null,
  applicationId: string,
  recipientEmail: string,
  subject: string,
  status: string,
  result: 'success' | 'failure' | 'skipped' | 'rate_limited',
  options?: {
    errorMessage?: string;
    errorCode?: string;
    resendId?: string;
    responseTimeMs?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from('financing_email_logs')
    .insert({
      queue_id: queueId,
      application_id: applicationId,
      recipient_email: recipientEmail,
      subject: subject,
      status: status,
      result: result,
      error_message: options?.errorMessage,
      error_code: options?.errorCode,
      resend_id: options?.resendId,
      response_time_ms: options?.responseTimeMs
    });
  
  if (error) {
    console.error('Failed to log email result:', error);
  }
}

// ============= HTML Email Generator =============
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

// ============= Plain Text Generator =============
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

// ============= Main Email Sending Logic =============
async function processEmailRequest(request: EmailRequest): Promise<QueueResult> {
  const supabase = getSupabaseClient();
  const startTime = Date.now();
  
  const content = EMAIL_CONTENT[request.status.toUpperCase()];
  if (!content) {
    console.log(`No email content defined for status: ${request.status}`);
    return {
      success: true,
      action: 'skipped',
      message: 'No email required for this status'
    };
  }
  
  // 1. Idempotency Check
  if (!request.forceResend) {
    const { isDuplicate, existingId } = await checkIdempotency(
      supabase,
      request.applicationId,
      request.status
    );
    
    if (isDuplicate) {
      console.log(`Duplicate email skipped: ${request.applicationId}:${request.status}`);
      
      await logEmailResult(
        supabase,
        existingId || null,
        request.applicationId,
        request.recipientEmail,
        content.subject,
        request.status,
        'skipped',
        { errorMessage: 'Duplicate email - idempotency check failed' }
      );
      
      return {
        success: true,
        action: 'skipped',
        message: 'Email already sent for this status',
        queueId: existingId
      };
    }
  }
  
  // 2. Rate Limit Check
  const withinRateLimit = await checkRateLimit(supabase, request.recipientEmail);
  if (!withinRateLimit) {
    console.log(`Rate limit exceeded for: ${request.recipientEmail}`);
    
    // Add to queue for later processing
    const queueId = await addToQueue(supabase, request, content.priority);
    
    await logEmailResult(
      supabase,
      queueId,
      request.applicationId,
      request.recipientEmail,
      content.subject,
      request.status,
      'rate_limited'
    );
    
    return {
      success: true,
      action: 'rate_limited',
      message: 'Rate limit exceeded - email queued for later',
      queueId
    };
  }
  
  // 3. Add to Queue
  const queueId = await addToQueue(supabase, request, content.priority);
  await updateQueueStatus(supabase, queueId, 'processing');
  
  try {
    // 4. Generate Email Content
    const now = new Date();
    const updatedAt = now.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const emailData = {
      recipientName: request.recipientName,
      applicationNumber: request.applicationNumber,
      approvedAmount: request.approvedAmount,
      baseUrl: request.baseUrl,
      updatedAt
    };
    
    const htmlContent = generateEmailHtml(content, emailData);
    const textContent = generatePlainText(content, emailData);
    
    // 5. Send Email via Resend
    const emailResponse = await resend.emails.send({
      from: CONFIG.FROM_EMAIL,
      to: [request.recipientEmail],
      subject: content.subject,
      html: htmlContent,
      text: textContent,
      headers: {
        "X-Application-Id": request.applicationId,
        "X-Status": request.status,
        "X-Queue-Id": queueId
      }
    });
    
    const responseTime = Date.now() - startTime;
    // deno-lint-ignore no-explicit-any
    const resendId = (emailResponse as any)?.id || 'unknown';
    console.log(`Email sent successfully in ${responseTime}ms:`, emailResponse);
    
    // 6. Update Queue Status
    await updateQueueStatus(supabase, queueId, 'sent', {
      resend_id: resendId,
      response_data: JSON.parse(JSON.stringify(emailResponse))
    });
    
    // 7. Increment Rate Limit Counter
    await incrementRateLimit(supabase, request.recipientEmail);
    
    // 8. Log Success
    await logEmailResult(
      supabase,
      queueId,
      request.applicationId,
      request.recipientEmail,
      content.subject,
      request.status,
      'success',
      {
        resendId: resendId,
        responseTimeMs: responseTime
      }
    );
    
    // 9. Also log to general emails table for compatibility
    await supabase.from("emails").insert({
      recipient_email: request.recipientEmail,
      recipient_name: request.recipientName,
      subject: content.subject,
      content: htmlContent,
      status: "sent",
      sent_at: now.toISOString()
    });
    
    return {
      success: true,
      action: 'sent',
      message: 'Email sent successfully',
      queueId,
      resendId: resendId
    };
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const responseTime = Date.now() - startTime;
    
    console.error(`Email sending failed in ${responseTime}ms:`, errorMessage);
    
    // Update retry info
    await incrementRetry(supabase, queueId, errorMessage);
    
    // Log Failure
    await logEmailResult(
      supabase,
      queueId,
      request.applicationId,
      request.recipientEmail,
      content.subject,
      request.status,
      'failure',
      {
        errorMessage,
        responseTimeMs: responseTime
      }
    );
    
    return {
      success: false,
      action: 'failed',
      message: errorMessage,
      queueId
    };
  }
}

// ============= HTTP Handler =============
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: EmailRequest = await req.json();
    
    console.log(`Processing financing email: ${request.status} for ${request.recipientEmail}`);
    
    const result = await processEmailRequest(request);
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in financing-status-email:", errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        action: 'failed',
        message: errorMessage 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
