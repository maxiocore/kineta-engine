import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppMessage, getFinancingStatusMessage } from "../_shared/whatsapp-helper.ts";

// ============= Msegat SMS Configuration =============
const MSEGAT_USERNAME = Deno.env.get('MSEGAT_USERNAME');
const MSEGAT_API_KEY = Deno.env.get('MSEGAT_API_KEY');
const MSEGAT_SENDER_NAME = Deno.env.get('MSEGAT_SENDER_NAME') || 'ASH HOLDING';

// Format phone for Msegat (966xxxxxxxxx, no +)
function formatPhoneForSMS(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('00966')) cleaned = cleaned.substring(2);
  else if (cleaned.startsWith('0')) cleaned = '966' + cleaned.substring(1);
  if (!cleaned.startsWith('966')) cleaned = '966' + cleaned;
  return cleaned;
}

// Send SMS via Msegat API
async function sendFinancingSMS(phone: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[SMS-Financing] Msegat credentials not configured');
    return { success: false, error: 'Msegat credentials not configured' };
  }

  const formattedPhone = formatPhoneForSMS(phone);

  try {
    console.log(`[SMS-Financing] Sending SMS to ${formattedPhone}`);
    
    const response = await fetch('https://www.msegat.com/gw/sendsms.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: MSEGAT_USERNAME,
        apiKey: MSEGAT_API_KEY,
        numbers: formattedPhone,
        userSender: MSEGAT_SENDER_NAME,
        msg: message,
        msgEncoding: 'UTF8',
        reqBulkId: 'true',
        By: 'ASH HOLDING',
      }),
    });

    const responseText = await response.text();
    console.log('[SMS-Financing] Msegat response:', responseText);

    let data: any;
    try { data = JSON.parse(responseText); } catch { data = responseText.trim(); }

    const isSuccess = data === '1' || data === 1 || data?.code === '1' || data?.code === 'M0000' || data?.message === 'Success';

    if (isSuccess) {
      const messageId = data?.id || data?.bulkId || String(Date.now());
      return { success: true, messageId: String(messageId) };
    } else {
      const errorCode = data?.code || data?.toString() || 'unknown';
      return { success: false, error: `Msegat error: ${errorCode}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SMS-Financing] Error:', error);
    return { success: false, error: errorMessage };
  }
}

// SMS message templates for financing statuses (concise for SMS)
const SMS_MESSAGES: Record<string, {
  text: string;
}> = {
  SUBMITTED: {
    text: 'ASH HOLDING: تم استلام طلب التمويل رقم {{APP_NO}} بنجاح. سيتم مراجعته خلال 1-3 أيام عمل. تابع عبر المنصة.'
  },
  UNDER_REVIEW: {
    text: 'ASH HOLDING: طلب التمويل رقم {{APP_NO}} قيد المراجعة الآن من الفريق المختص. سنوافيكم بالنتيجة قريباً.'
  },
  ADDITIONAL_INFO_REQUIRED: {
    text: 'ASH HOLDING: مطلوب مستندات إضافية لطلب التمويل رقم {{APP_NO}}. يرجى رفعها عبر المنصة خلال 14 يوماً.'
  },
  APPROVED: {
    text: 'ASH HOLDING: تهانينا! تمت الموافقة على طلب التمويل رقم {{APP_NO}}{{AMOUNT}}. يرجى مراجعة العقد والتوقيع عبر المنصة.'
  },
  APPROVED_WITH_LIMITS: {
    text: 'ASH HOLDING: تمت الموافقة على طلب التمويل رقم {{APP_NO}} بقيمة معدّلة{{AMOUNT}}. راجع التفاصيل عبر المنصة.'
  },
  OFFER_READY: {
    text: 'ASH HOLDING: العرض جاهز لطلب التمويل رقم {{APP_NO}}{{AMOUNT}}. يرجى مراجعة العرض عبر المنصة.'
  },
  ACK_SENT: {
    text: 'ASH HOLDING: تم إرسال إقرار التمويل لطلب رقم {{APP_NO}}. يرجى مراجعته والتوقيع عبر المنصة.'
  },
  ACK_SIGNED: {
    text: 'ASH HOLDING: تم توقيع الإقرار بنجاح لطلب التمويل رقم {{APP_NO}}. جارٍ إعداد العقد.'
  },
  CONTRACT_PRESENTED: {
    text: 'ASH HOLDING: عقد التمويل رقم {{APP_NO}} جاهز للتوقيع. يرجى مراجعة البنود والتوقيع خلال 7 أيام عبر المنصة.'
  },
  CONTRACT_SENT: {
    text: 'ASH HOLDING: تم إرسال عقد التمويل لطلب رقم {{APP_NO}}. يرجى مراجعته والتوقيع عبر المنصة.'
  },
  CONTRACT_ACCEPTED: {
    text: 'ASH HOLDING: تم توقيع عقد التمويل رقم {{APP_NO}} بنجاح. الخطوة التالية: توقيع السند لأمر.'
  },
  CONTRACT_FINALIZED: {
    text: 'ASH HOLDING: تم اعتماد عقد التمويل رقم {{APP_NO}} رسمياً. جارٍ إضافة رصيد الخدمات لحسابكم.'
  },
  SIGNING_OTP_SENT: {
    text: 'ASH HOLDING: تم إرسال رمز التحقق لتوقيع عقد التمويل رقم {{APP_NO}}. يرجى إدخاله عبر المنصة.'
  },
  PROMISSORY_SIGNED: {
    text: 'ASH HOLDING: تم توقيع السند لأمر بنجاح لطلب {{APP_NO}}. جارٍ اعتماد العقد وإضافة الرصيد.'
  },
  BOND_ISSUING: {
    text: 'ASH HOLDING: جارٍ إصدار السند التنفيذي لطلب التمويل رقم {{APP_NO}} عبر نافذ. سنشعركم فور الانتهاء.'
  },
  BOND_ISSUED: {
    text: 'ASH HOLDING: تم إصدار السند التنفيذي لطلب {{APP_NO}} عبر نافذ. يرجى تأكيد التوقيع عبر المنصة خلال 7 أيام.'
  },
  BOND_SENT_TO_CLIENT: {
    text: 'ASH HOLDING: تم إرسال السند التنفيذي لطلب {{APP_NO}} عبر نافذ. يرجى توقيعه ثم تأكيد التوقيع عبر المنصة.'
  },
  BOND_SIGNED_BY_CLIENT: {
    text: 'ASH HOLDING: تم تأكيد توقيعكم على السند التنفيذي لطلب {{APP_NO}} بنجاح. جارٍ المراجعة النهائية.'
  },
  BOND_VERIFIED_BY_ADMIN: {
    text: 'ASH HOLDING: تم التحقق من السند التنفيذي لطلب {{APP_NO}}. جارٍ إضافة رصيد الخدمات لحسابكم.'
  },
  FIN_CREDIT_DEPOSITED: {
    text: 'ASH HOLDING: تهانينا! تم إيداع رصيد الخدمات لطلب {{APP_NO}}{{AMOUNT}} بنجاح. استمتعوا بخدماتنا عبر المنصة.'
  },
  CREDIT_DEPOSITED: {
    text: 'ASH HOLDING: تهانينا! تم إيداع رصيد الخدمات لطلب {{APP_NO}}{{AMOUNT}} بنجاح. استمتعوا بخدماتنا عبر المنصة.'
  },
  DECLINED: {
    text: 'ASH HOLDING: نأسف، لم تتم الموافقة على طلب التمويل رقم {{APP_NO}} حالياً. يمكنكم المحاولة مجدداً لاحقاً.'
  },
  CANCELLED: {
    text: 'ASH HOLDING: تم إلغاء طلب التمويل رقم {{APP_NO}}. يمكنكم تقديم طلب جديد في أي وقت عبر المنصة.'
  },
  EXPIRED: {
    text: 'ASH HOLDING: انتهت صلاحية طلب التمويل رقم {{APP_NO}}. يمكنكم تقديم طلب جديد عبر المنصة.'
  },
};

// Build SMS text from template
function buildFinancingSMSText(status: string, applicationNumber: string, approvedAmount?: number): string | null {
  const template = SMS_MESSAGES[status.toUpperCase()];
  if (!template) return null;
  
  let text = template.text.replace('{{APP_NO}}', applicationNumber);
  
  if (approvedAmount) {
    text = text.replace('{{AMOUNT}}', ` بقيمة ${approvedAmount.toLocaleString('ar-SA')} ر.س`);
  } else {
    text = text.replace('{{AMOUNT}}', '');
  }
  
  return text;
}

// Send SMS and log result for financing
async function sendAndLogFinancingSMS(
  supabase: any,
  phone: string,
  status: string,
  applicationNumber: string,
  applicationId: string,
  userId: string,
  recipientName: string,
  approvedAmount?: number,
): Promise<void> {
  try {
    const smsText = buildFinancingSMSText(status, applicationNumber, approvedAmount);
    if (!smsText) {
      console.log(`[SMS-Financing] No SMS template for status: ${status}`);
      return;
    }

    const result = await sendFinancingSMS(phone, smsText);
    console.log(`[SMS-Financing] Result for ${status}:`, result);

    // Log to sms_logs table
    try {
      await supabase.from('sms_logs').insert({
        phone,
        message: smsText,
        type: 'sms_financing',
        status: result.success ? 'sent' : 'failed',
        user_id: userId,
        reference_id: applicationId,
        error_message: result.error || null,
        provider: 'msegat',
        external_id: result.messageId || null,
      });
    } catch (logErr) {
      console.error('[SMS-Financing] Error logging SMS:', logErr);
    }
  } catch (err) {
    console.error('[SMS-Financing] Error sending SMS:', err);
  }
}

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
  FROM_EMAIL: "ASH HOLDING <notifications@ash-holding.sa>",
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
    subject: 'تم استلام طلب تمويل الخدمات | ASH HOLDING',
    headline: 'تم استلام طلبكم بنجاح',
    description: 'شكرًا لتقديمكم طلب تمويل الخدمات. تم استلام طلبكم وسيتم مراجعته من قِبل الفريق المختص في أقرب وقت ممكن.',
    ctaText: 'عرض حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'info',
    showDisclaimer: true,
    priority: 3
  },
  UNDER_REVIEW: {
    subject: 'طلبكم قيد المراجعة | ASH HOLDING',
    headline: 'طلبكم قيد المراجعة',
    description: 'يقوم فريقنا المختص حاليًا بمراجعة طلب تمويل الخدمات المقدم منكم. تستغرق هذه المرحلة عادةً من يوم إلى ثلاثة أيام عمل.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'info',
    showDisclaimer: true,
    priority: 5
  },
  ADDITIONAL_INFO_REQUIRED: {
    subject: '⚠️ مطلوب معلومات إضافية لطلب التمويل | ASH HOLDING',
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
    subject: '✅ تهانينا! تمت الموافقة على طلب التمويل | ASH HOLDING',
    headline: 'تهانينا! تمت الموافقة على طلبكم',
    description: 'يسرنا إبلاغكم بالموافقة على طلب تمويل الخدمات الخاص بكم بالكامل. الخطوة التالية هي مراجعة العقد والموافقة عليه إلكترونيًا.',
    ctaText: 'مراجعة العقد والتوقيع',
    ctaPath: '/dashboard/financing/contract',
    type: 'success',
    showDisclaimer: true,
    priority: 1
  },
  APPROVED_WITH_LIMITS: {
    subject: '✅ تمت الموافقة على طلب التمويل بقيمة معدّلة | ASH HOLDING',
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
    subject: '📄 العقد جاهز للتوقيع | ASH HOLDING',
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
    subject: '✅ تم قبول العقد بنجاح | ASH HOLDING',
    headline: 'تم قبول العقد بنجاح',
    description: 'شكرًا لتوقيعكم على عقد تمويل الخدمات. الخطوة التالية هي توقيع السند لأمر (الكمبيالة) لإتمام الإجراءات.',
    ctaText: 'توقيع السند لأمر',
    ctaPath: '/dashboard/financing/promissory',
    additionalNote: 'يُرجى توقيع السند لأمر خلال 7 أيام لاستكمال الإجراءات.',
    type: 'success',
    showDisclaimer: true,
    priority: 1
  },
  PROMISSORY_SIGNED: {
    subject: '📝 تم توقيع السند لأمر بنجاح | ASH HOLDING',
    headline: 'تم توقيع السند لأمر (الكمبيالة) بنجاح',
    description: 'شكرًا لإتمامكم جميع الإجراءات المطلوبة. تم توقيع السند لأمر بنجاح وجميع المستندات مكتملة الآن. جارٍ اعتماد العقد من الإدارة المختصة.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    additionalNote: 'سيتم اعتماد العقد وإضافة رصيد الخدمات إلى حسابكم قريبًا.',
    type: 'success',
    showDisclaimer: true,
    priority: 2
  },
  CONTRACT_FINALIZED: {
    subject: '🏛️ تم اعتماد العقد رسميًا | ASH HOLDING',
    headline: 'تم اعتماد العقد رسميًا من الإدارة',
    description: 'يسرنا إبلاغكم بأنه تم اعتماد عقد تمويل الخدمات بشكل رسمي ونهائي. جارٍ الآن إضافة رصيد الخدمات إلى حسابكم.',
    ctaText: 'عرض تفاصيل التمويل',
    ctaPath: '/dashboard/financing/status',
    additionalNote: 'سيتم إضافة رصيد الخدمات خلال ساعات قليلة.',
    type: 'success',
    showDisclaimer: true,
    priority: 1
  },
  // Bond lifecycle statuses
  BOND_ISSUING: {
    subject: '⏳ جاري إصدار السند التنفيذي | ASH HOLDING',
    headline: 'جاري إصدار السند التنفيذي',
    description: 'تم البدء في إصدار السند التنفيذي (سند لأمر) عبر منصة نافذ لطلب التمويل الخاص بكم. سنُشعركم فور اكتمال الإصدار.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'info',
    showDisclaimer: true,
    priority: 2
  },
  BOND_ISSUED: {
    subject: '✅ تم إصدار السند التنفيذي | ASH HOLDING',
    headline: 'تم إصدار السند التنفيذي بنجاح',
    description: 'تم إصدار السند التنفيذي بنجاح عبر منصة نافذ. سيتم إرساله إليكم قريبًا لتأكيد التوقيع.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'success',
    showDisclaimer: true,
    priority: 1
  },
  BOND_SENT_TO_CLIENT: {
    subject: '📄 تم إرسال السند التنفيذي للتوقيع | ASH HOLDING',
    headline: 'السند التنفيذي جاهز للتوقيع',
    description: 'تم إرسال السند التنفيذي إليكم عبر منصة نافذ. يُرجى مراجعته وتوقيعه ثم تأكيد التوقيع عبر المنصة.',
    ctaText: 'تأكيد التوقيع',
    ctaPath: '/dashboard/financing/status',
    additionalNote: 'يُرجى تأكيد التوقيع خلال 7 أيام.',
    type: 'info',
    showDisclaimer: true,
    priority: 1
  },
  BOND_SIGNED_BY_CLIENT: {
    subject: '✅ تم تأكيد توقيع السند | ASH HOLDING',
    headline: 'تم تأكيد توقيعكم على السند',
    description: 'تم استلام تأكيد توقيعكم على السند التنفيذي بنجاح. جارٍ المراجعة النهائية واعتماد السند من الإدارة.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    type: 'success',
    showDisclaimer: true,
    priority: 2
  },
  BOND_VERIFIED_BY_ADMIN: {
    subject: '🎉 تم اعتماد السند التنفيذي | ASH HOLDING',
    headline: 'تم اعتماد السند التنفيذي',
    description: 'تم التحقق من السند التنفيذي واعتماده بنجاح. جارٍ إضافة رصيد الخدمات إلى حسابكم.',
    ctaText: 'متابعة حالة الطلب',
    ctaPath: '/dashboard/financing/status',
    additionalNote: 'سيتم إضافة رصيد الخدمات خلال ساعات قليلة.',
    type: 'success',
    showDisclaimer: true,
    priority: 1
  },
  CREDIT_DEPOSITED: {
    subject: '🎉💎 تم إيداع رصيد الخدمات بنجاح! | ASH HOLDING',
    headline: 'تهانينا! رصيد الخدمات جاهز للاستخدام!',
    description: 'تم بنجاح إضافة رصيد خدمات التمويل إلى حسابكم. يمكنكم الآن استخدامه لشراء جميع الخدمات المتاحة على المنصة. صلاحية الرصيد: 12 شهرًا.',
    ctaText: 'استكشف الخدمات وابدأ الآن',
    ctaPath: '/dashboard/services',
    additionalNote: 'استفيدوا من رصيدكم واستكشفوا خدماتنا المتميزة. تذكّروا مواعيد الأقساط الشهرية.',
    type: 'success',
    showDisclaimer: true,
    priority: 1
  },
  DECLINED: {
    subject: 'نتيجة طلب تمويل الخدمات | ASH HOLDING',
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
    subject: 'انتهت صلاحية طلب التمويل | ASH HOLDING',
    headline: 'انتهت صلاحية الطلب',
    description: 'انتهت صلاحية طلب تمويل الخدمات بسبب عدم استكمال الإجراءات المطلوبة خلال المهلة المحددة.',
    ctaText: 'تقديم طلب جديد',
    ctaPath: '/dashboard/financing/apply',
    type: 'warning',
    showDisclaimer: false,
    priority: 4
  },
  CANCELLED: {
    subject: 'تم إلغاء طلب التمويل | ASH HOLDING',
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
  eventId?: string;
  emailTemplateId?: string;
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

// ============= Email Bounce Check =============
async function checkEmailBounced(
  supabase: SupabaseClientType,
  email: string
): Promise<{ bounced: boolean; reason?: string }> {
  // Check if email is bounced in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('email_bounced, email_bounce_reason')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Email bounce check error:', error);
    return { bounced: false };
  }
  
  if (data?.email_bounced) {
    return { bounced: true, reason: data.email_bounce_reason };
  }
  
  return { bounced: false };
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
      next_retry_at: new Date().toISOString(),
      event_id: request.eventId || null,
      email_template_id: request.emailTemplateId || `financing_status_${request.status.toLowerCase()}`
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
  
  // Icon mapping based on type
  const typeIcons = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Language" content="ar">
  <meta name="x-apple-disable-message-reformatting">
  <title>${content.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table { border-collapse: collapse; }
    td { font-family: Tahoma, Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: right;">
  
  <!-- Main Wrapper Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <!-- Email Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0ea5e9 100%); padding: 36px 32px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background-color: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 24px;">
                          <span style="color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 1px;">ASH HOLDING</span>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #94a3b8; font-size: 13px; margin: 12px 0 0 0; font-weight: 500;">شركة علي صالح الشهري القابضة</p>
                    <p style="color: #64748b; font-size: 11px; margin: 4px 0 0 0;">منصة الخدمات الرقمية المتكاملة</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 32px; direction: rtl; text-align: right;">
              
              <!-- Greeting -->
              <p style="font-size: 18px; color: #1e293b; margin: 0 0 24px 0; font-weight: 600; text-align: right;">
                السلام عليكم ${data.recipientName}،
              </p>
              
              <!-- Status Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${colors.bg}; border-radius: 12px; margin-bottom: 24px; border-right: 5px solid ${colors.border};">
                <tr>
                  <td style="padding: 24px; text-align: right;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="text-align: right;">
                          <span style="font-size: 32px; display: inline-block; margin-bottom: 8px;">${typeIcons[content.type]}</span>
                          <h2 style="font-size: 22px; font-weight: bold; color: ${colors.text}; margin: 8px 0 16px 0; text-align: right;">${content.headline}</h2>
                          <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 0; text-align: right;">${content.description}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Info Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="color: #64748b; font-size: 13px; text-align: right; width: 40%;">رقم الطلب</td>
                        <td style="color: #0f172a; font-size: 15px; font-weight: 700; text-align: left; font-family: 'Courier New', monospace; letter-spacing: 1px;">${data.applicationNumber}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${data.approvedAmount ? `
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="color: #64748b; font-size: 13px; text-align: right; width: 40%;">رصيد الخدمات المعتمد</td>
                        <td style="text-align: left;">
                          <span style="background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; padding: 8px 16px; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">${data.approvedAmount.toLocaleString('ar-SA')} ر.س</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 20px 24px; text-align: right;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="color: #64748b; font-size: 13px; text-align: right; width: 40%;">تاريخ التحديث</td>
                        <td style="color: #475569; font-size: 14px; text-align: left;">${data.updatedAt}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${content.additionalNote ? `
              <!-- Additional Note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-radius: 12px; margin-bottom: 24px; border-right: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 20px 24px; text-align: right;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 14px; color: #92400e; line-height: 1.7; text-align: right;">
                          <span style="font-size: 18px; margin-left: 8px;">⚠️</span>
                          <strong>تنبيه هام:</strong> ${content.additionalNote}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" target="_blank" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);">
                      ${content.ctaText} ←
                    </a>
                  </td>
                </tr>
              </table>
              
              ${content.showDisclaimer ? `
              <!-- Disclaimer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 12px; margin-top: 24px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 20px 24px; text-align: right;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 13px; color: #92400e; line-height: 1.8; text-align: right;">
                          <span style="font-size: 16px; margin-left: 8px;">ℹ️</span>
                          <strong>تنويه مهم:</strong><br>
                          ${FINANCING_DISCLAIMER}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px 0;">
                      هذا البريد مُرسل تلقائيًا من منصة ASH HOLDING
                    </p>
                    <p style="color: #64748b; font-size: 12px; margin: 0 0 16px 0;">
                      شركة علي صالح الشهري القابضة - المملكة العربية السعودية
                    </p>
                    
                    <!-- Footer Links -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 16px auto;">
                      <tr>
                        <td style="padding: 0 12px;">
                          <a href="${data.baseUrl}/help" style="color: #3b82f6; text-decoration: none; font-size: 12px;">مركز المساعدة</a>
                        </td>
                        <td style="color: #475569;">|</td>
                        <td style="padding: 0 12px;">
                          <a href="${data.baseUrl}/contact" style="color: #3b82f6; text-decoration: none; font-size: 12px;">تواصل معنا</a>
                        </td>
                        <td style="color: #475569;">|</td>
                        <td style="padding: 0 12px;">
                          <a href="${data.baseUrl}/privacy" style="color: #3b82f6; text-decoration: none; font-size: 12px;">سياسة الخصوصية</a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #475569; font-size: 11px; margin: 16px 0 0 0;">
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

هذا البريد مُرسل تلقائيًا من منصة ASH HOLDING
شركة علي صالح الشهري القابضة - المملكة العربية السعودية

© ${new Date().getFullYear()} ASH HOLDING. جميع الحقوق محفوظة.`;

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
  
  // 1. Email Bounce Check
  const bounceCheck = await checkEmailBounced(supabase, request.recipientEmail);
  if (bounceCheck.bounced) {
    console.log(`Email bounced - skipping: ${request.recipientEmail}`);
    
    await logEmailResult(
      supabase,
      null,
      request.applicationId,
      request.recipientEmail,
      content.subject,
      request.status,
      'skipped',
      { errorMessage: `Email bounced: ${bounceCheck.reason || 'Unknown reason'}` }
    );
    
    return {
      success: false,
      action: 'skipped' as 'skipped',
      message: `Email bounced - ${bounceCheck.reason || 'delivery failed previously'}`
    };
  }
  
  // 2. Idempotency Check
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
    
    // ⚡ Still send WhatsApp even if email is rate-limited
    try {
      const { data: application } = await supabase
        .from('financing_applications')
        .select('user_id, phone')
        .eq('id', request.applicationId)
        .single();
      
      if (application?.phone) {
        const whatsappMessage = getFinancingStatusMessage(
          request.applicationNumber,
          request.status,
          request.approvedAmount,
          request.recipientName
        );
        
        const whatsappResult = await sendWhatsAppMessage({
          phone: application.phone,
          message: whatsappMessage,
          type: 'financing'
        });
        
        console.log("WhatsApp (rate-limited) notification result:", whatsappResult);
        
        await supabase.from("sms_logs").insert({
          phone: application.phone,
          message: whatsappMessage,
          type: 'whatsapp_financing',
          status: whatsappResult.success ? 'sent' : 'failed',
          user_id: application.user_id,
          reference_id: request.applicationId,
          error_message: whatsappResult.error || null,
        });
      }
    } catch (waError) {
      console.error("WhatsApp (rate-limited) notification error:", waError);
    }

    // Also send SMS even if email is rate-limited
    try {
      const { data: appForSMS } = await supabase
        .from('financing_applications')
        .select('user_id, phone')
        .eq('id', request.applicationId)
        .single();

      if (appForSMS?.phone) {
        await sendAndLogFinancingSMS(
          supabase,
          appForSMS.phone,
          request.status,
          request.applicationNumber,
          request.applicationId,
          appForSMS.user_id,
          request.recipientName,
          request.approvedAmount,
        );
      }
    } catch (smsError) {
      console.error("SMS (rate-limited) notification error:", smsError);
    }
    
    return {
      success: true,
      action: 'rate_limited',
      message: 'Rate limit exceeded - email queued, WhatsApp sent',
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

    // 10. Send WhatsApp notification
    try {
      // Get user phone from profile
      const { data: application } = await supabase
        .from('financing_applications')
        .select('user_id, phone')
        .eq('id', request.applicationId)
        .single();
      
      if (application?.phone) {
        const whatsappMessage = getFinancingStatusMessage(
          request.applicationNumber,
          request.status,
          request.approvedAmount,
          request.recipientName
        );
        
        const whatsappResult = await sendWhatsAppMessage({
          phone: application.phone,
          message: whatsappMessage,
          type: 'financing'
        });
        
        console.log("WhatsApp financing notification result:", whatsappResult);
        
        // Log WhatsApp
        await supabase.from("sms_logs").insert({
          phone: application.phone,
          message: whatsappMessage,
          type: 'whatsapp_financing',
          status: whatsappResult.success ? 'sent' : 'failed',
          user_id: application.user_id,
          reference_id: request.applicationId,
          error_message: whatsappResult.error || null,
        });
      }
    } catch (waError) {
      console.error("WhatsApp notification error:", waError);
    }

    // 11. Send SMS notification via Msegat
    try {
      const { data: appForSMS } = await supabase
        .from('financing_applications')
        .select('user_id, phone')
        .eq('id', request.applicationId)
        .single();

      if (appForSMS?.phone) {
        await sendAndLogFinancingSMS(
          supabase,
          appForSMS.phone,
          request.status,
          request.applicationNumber,
          request.applicationId,
          appForSMS.user_id,
          request.recipientName,
          request.approvedAmount,
        );
      }
    } catch (smsError) {
      console.error("SMS financing notification error:", smsError);
    }
    
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
