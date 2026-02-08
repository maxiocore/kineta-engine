// ============================================
// Financing SMS Notification Edge Function
// ASH HOLDING - Powered by Msegat
// ============================================
// Sends professional Arabic SMS for financing status changes
// with idempotency (deduplication) and full logging.
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MSEGAT_USERNAME = Deno.env.get('MSEGAT_USERNAME');
const MSEGAT_API_KEY = Deno.env.get('MSEGAT_API_KEY');
const MSEGAT_SENDER_NAME = Deno.env.get('MSEGAT_SENDER_NAME') || 'ASH HOLDING';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================
// Types
// ============================================

type FinancingSMSEvent =
  | 'eligibility_passed'
  | 'eligibility_failed'
  | 'application_submitted'
  | 'application_approved'
  | 'application_approved_limited'
  | 'application_rejected'
  | 'offer_ready'
  | 'acknowledgment_sent'
  | 'acknowledgment_signed'
  | 'contract_sent'
  | 'contract_signed'
  | 'contract_finalized'
  | 'bond_issuing'
  | 'bond_issued'
  | 'bond_sent'
  | 'bond_signed'
  | 'bond_verified'
  | 'credit_deposited'
  | 'financing_completed';

interface FinancingSMSRequest {
  event: FinancingSMSEvent;
  phone: string;
  customerName: string;
  applicationId: string;
  applicationNumber?: string;
  approvedAmount?: number;
  rejectionReason?: string;
  userId?: string;
  installmentCount?: number;
  monthlyPayment?: number;
}

// ============================================
// SMS Templates - Banking-Grade Arabic 🏦
// ============================================

function buildSMSMessage(event: FinancingSMSEvent, data: FinancingSMSRequest): string {
  const name = (data.customerName || '').split(' ')[0] || 'عميلنا الكريم';
  const appNum = data.applicationNumber || '';
  const amount = data.approvedAmount
    ? data.approvedAmount.toLocaleString('ar-SA')
    : '';

  switch (event) {
    case 'eligibility_passed':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `✅ تهانينا! أنت مؤهل للحصول على تمويل خدمات.`,
        ``,
        `📋 يمكنك الآن إكمال طلبك من حسابك`,
        `⏱️ الإجراء سريع ومبسّط`,
        ``,
        `🔒 ASH HOLDING | تمويل آمن ومرن`,
      ].join('\n');

    case 'eligibility_failed':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `عزيزي ${name}،`,
        `📋 بعد مراجعة بياناتك، لم تستوفِ شروط الأهلية حالياً.`,
        ``,
        `🔄 يمكنك إعادة المحاولة لاحقاً`,
        `📞 أو التواصل مع فريق الدعم`,
        ``,
        `ASH HOLDING`,
      ].join('\n');

    case 'application_submitted':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `📩 تم استلام طلب التمويل بنجاح`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ المطلوب: ${amount} ر.س` : '',
        ``,
        `⏳ جاري المراجعة من الفريق المختص`,
        `📱 سيصلك إشعار بالنتيجة`,
        ``,
        `🔒 ASH HOLDING | خدماتك المالية بأمان`,
      ].filter(Boolean).join('\n');

    case 'application_approved':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `تهانينا ${name}! 🎉`,
        `✅ تمت الموافقة على طلب التمويل`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ المعتمد: ${amount} ر.س` : '',
        ``,
        `📋 الخطوة التالية: مراجعة العرض والإقرار`,
        `📱 يرجى الدخول لحسابك لإتمام الإجراءات`,
        ``,
        `🔒 ASH HOLDING | شريكك المالي الموثوق`,
      ].filter(Boolean).join('\n');

    case 'application_approved_limited':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `✅ تمت الموافقة المشروطة على طلب التمويل`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ المعتمد: ${amount} ر.س` : '',
        ``,
        `ℹ️ يرجى مراجعة الشروط في حسابك`,
        ``,
        `🔒 ASH HOLDING`,
      ].filter(Boolean).join('\n');

    case 'application_rejected':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `عزيزي ${name}،`,
        `📋 بعد الدراسة الائتمانية لطلبك رقم #${appNum}`,
        `❌ لم تتم الموافقة على الطلب`,
        data.rejectionReason ? `📝 الملاحظة: ${data.rejectionReason}` : '',
        ``,
        `📞 يمكنك التواصل مع فريقنا للمزيد`,
        ``,
        `ASH HOLDING`,
      ].filter(Boolean).join('\n');

    case 'offer_ready':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `📋 عرض التمويل جاهز لمراجعتك!`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ: ${amount} ر.س` : '',
        ``,
        `📱 يرجى الدخول لحسابك لمراجعة العرض`,
        `⏱️ العرض صالح لمدة محدودة`,
        ``,
        `🔒 ASH HOLDING | تمويل شفاف ومرن`,
      ].filter(Boolean).join('\n');

    case 'acknowledgment_sent':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `📄 تم إرسال إقرار الشروط والأحكام لطلب #${appNum}`,
        ``,
        `📱 يرجى مراجعة الإقرار والتوقيع عليه`,
        `⏱️ من حسابك في المنصة`,
        ``,
        `🔒 ASH HOLDING`,
      ].join('\n');

    case 'acknowledgment_signed':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `✅ تم توقيع إقرار الشروط بنجاح`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `📋 الخطوة التالية: إرسال العقد الرسمي`,
        `⏳ سيتم إرسال العقد قريباً`,
        ``,
        `🔒 ASH HOLDING | إجراءاتك محفوظة بأمان`,
      ].join('\n');

    case 'contract_sent':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `📑 تم إرسال عقد التمويل الرسمي`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ: ${amount} ر.س` : '',
        ``,
        `📱 يرجى مراجعة العقد والتوقيع عليه`,
        `🔐 التوقيع يتطلب رمز تحقق OTP`,
        ``,
        `🔒 ASH HOLDING | عقد رسمي وملزم`,
      ].filter(Boolean).join('\n');

    case 'contract_signed':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `تهانينا ${name}! 🎉`,
        `✅ تم توقيع عقد التمويل بنجاح`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `📋 الخطوة التالية: إصدار السند التنفيذي`,
        `⏳ جاري استكمال الإجراءات`,
        ``,
        `🔒 ASH HOLDING | التزامك ثقة`,
      ].join('\n');

    case 'contract_finalized':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `✅ تم اعتماد العقد رسمياً`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `📋 جاري استكمال الإجراءات النهائية`,
        ``,
        `🔒 ASH HOLDING`,
      ].join('\n');

    case 'bond_issuing':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `📋 جاري إصدار السند التنفيذي لطلب #${appNum}`,
        ``,
        `⏳ يتم إعداد السند عبر نظام نافذ`,
        `📱 سيصلك إشعار عند الجاهزية`,
        ``,
        `🔒 ASH HOLDING | إجراءات رسمية وموثقة`,
      ].join('\n');

    case 'bond_issued':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `✅ تم إصدار السند التنفيذي`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `📋 الخطوة التالية: التوقيع على السند`,
        ``,
        `🔒 ASH HOLDING`,
      ].join('\n');

    case 'bond_sent':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `📩 تم إرسال السند التنفيذي لطلب #${appNum}`,
        ``,
        `📱 يرجى مراجعة السند والتوقيع عليه`,
        `⚡ التوقيع مطلوب لاستكمال الإجراءات`,
        ``,
        `🔒 ASH HOLDING | سند رسمي وموثق`,
      ].join('\n');

    case 'bond_signed':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `✅ تم توقيع السند التنفيذي بنجاح`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `⏳ جاري التحقق من الإدارة`,
        ``,
        `🔒 ASH HOLDING | إجراءاتك محفوظة`,
      ].join('\n');

    case 'bond_verified':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `✅ تم التحقق من السند التنفيذي واعتماده`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `💰 جاري إيداع رصيد الخدمات`,
        `📱 سيصلك إشعار عند الإيداع`,
        ``,
        `🔒 ASH HOLDING | ثقتك أولويتنا`,
      ].join('\n');

    case 'credit_deposited':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `تهانينا ${name}! 🎊`,
        `💰 تم إيداع رصيد الخدمات في حسابك`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💳 الرصيد المودع: ${amount} ر.س` : '',
        ``,
        `✅ يمكنك الآن استخدام رصيدك لطلب الخدمات`,
        `📱 من خلال منصة ASH HOLDING`,
        ``,
        `⚠️ ملاحظة: الرصيد غير قابل للسحب النقدي`,
        `🔒 ASH HOLDING | رصيدك جاهز للاستخدام`,
      ].filter(Boolean).join('\n');

    case 'financing_completed':
      return [
        `🏦 ASH HOLDING | التمويل`,
        ``,
        `تهانينا ${name}! 🎉🥳`,
        `✅ تم تفعيل رصيد خدماتك بالكامل`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💳 الرصيد المتاح: ${amount} ر.س` : '',
        ``,
        `🛒 ابدأ طلب خدماتك الآن من المنصة`,
        ``,
        `⚠️ الرصيد لاستخدام الخدمات فقط`,
        `📞 للدعم: فريق ASH HOLDING`,
        ``,
        `شكراً لثقتك بنا 🤝`,
        `🔒 ASH HOLDING | شريكك المالي الموثوق`,
      ].filter(Boolean).join('\n');

    default:
      return `🏦 ASH HOLDING | التمويل\n\nمرحباً ${name} 👋\n📋 لديك تحديث جديد على طلب التمويل #${appNum}\n\n📱 يرجى مراجعة حسابك\n\n🔒 ASH HOLDING`;
  }
}

// ============================================
// Phone Formatting
// ============================================

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('00966')) cleaned = cleaned.substring(2);
  else if (cleaned.startsWith('0')) cleaned = '966' + cleaned.substring(1);
  if (!cleaned.startsWith('966')) cleaned = '966' + cleaned;
  return cleaned;
}

// ============================================
// Msegat Send
// ============================================

async function sendViaMsegat(phone: string, message: string): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[Financing-SMS] Msegat credentials not configured');
    return { success: false, error: 'Msegat credentials not configured' };
  }

  const formattedPhone = formatPhoneNumber(phone);

  try {
    console.log(`[Financing-SMS] Sending to ${formattedPhone}`);

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
    console.log('[Financing-SMS] Msegat response:', responseText);

    let data: any;
    try { data = JSON.parse(responseText); } catch { data = responseText.trim(); }

    const isSuccess =
      data === '1' || data === 1 ||
      data?.code === '1' || data?.code === 'M0000' ||
      data?.message === 'Success';

    if (isSuccess) {
      const messageId = data?.id || data?.bulkId || String(Date.now());
      return { success: true, messageId: String(messageId) };
    } else {
      const errorCode = data?.code || data?.toString() || 'unknown';
      return { success: false, error: `Msegat error: ${errorCode}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Financing-SMS] Send error:', error);
    return { success: false, error: msg };
  }
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json() as FinancingSMSRequest;
    const { event, phone, customerName, applicationId, applicationNumber, approvedAmount, rejectionReason, userId } = body;

    // ── Validation ──────────────────────────────────────
    if (!event || !phone || !applicationId) {
      console.error('[Financing-SMS] Missing required fields', { event, phone: !!phone, applicationId: !!applicationId });
      return new Response(
        JSON.stringify({ success: false, error: 'event, phone, and applicationId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validEvents: FinancingSMSEvent[] = [
      'eligibility_passed', 'eligibility_failed',
      'application_submitted',
      'application_approved', 'application_approved_limited', 'application_rejected',
      'offer_ready',
      'acknowledgment_sent', 'acknowledgment_signed',
      'contract_sent', 'contract_signed', 'contract_finalized',
      'bond_issuing', 'bond_issued', 'bond_sent', 'bond_signed', 'bond_verified',
      'credit_deposited',
      'financing_completed',
    ];

    if (!validEvents.includes(event)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid event: ${event}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Idempotency Check ───────────────────────────────
    const idempotencyKey = `financing:${applicationId}:${event}`;

    const { data: existingLog } = await supabase
      .from('sms_logs')
      .select('id, created_at')
      .eq('idempotency_key', idempotencyKey)
      .eq('status', 'sent')
      .maybeSingle();

    if (existingLog) {
      console.log(`[Financing-SMS] Duplicate detected. Key=${idempotencyKey}, sent at ${existingLog.created_at}`);
      return new Response(
        JSON.stringify({
          success: true,
          deduplicated: true,
          message: 'SMS already sent for this event',
          originalSentAt: existingLog.created_at,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Build Message ───────────────────────────────────
    const message = buildSMSMessage(event, body);
    console.log(`[Financing-SMS] Event=${event}, App=${applicationId}, Message length=${message.length}`);

    // ── Send SMS ────────────────────────────────────────
    const result = await sendViaMsegat(phone, message);
    const processingMs = Date.now() - startTime;

    // ── Log to Database ─────────────────────────────────
    try {
      await supabase.from('sms_logs').insert({
        phone: formatPhoneNumber(phone),
        message,
        type: 'financing',
        status: result.success ? 'sent' : 'failed',
        user_id: userId || null,
        reference_id: applicationId,
        error_message: result.error || null,
        provider: 'msegat',
        external_id: result.messageId || null,
        idempotency_key: idempotencyKey,
      });
      console.log(`[Financing-SMS] Logged to sms_logs. Key=${idempotencyKey}`);
    } catch (logErr) {
      console.error('[Financing-SMS] Failed to log SMS:', logErr);
    }

    // ── Log activity ────────────────────────────────────
    try {
      await supabase.from('financing_activity_log').insert({
        application_id: applicationId,
        event_type: `sms_${event}`,
        from_status: event,
        to_status: event,
        triggered_by: 'system',
        is_visible_to_customer: false,
        metadata: {
          sms_success: result.success,
          processing_ms: processingMs,
          provider: 'msegat',
          message_id: result.messageId,
        },
      });
    } catch (actErr) {
      console.error('[Financing-SMS] Failed to log activity:', actErr);
    }

    console.log(`[Financing-SMS] Complete. Event=${event}, Success=${result.success}, Time=${processingMs}ms`);

    return new Response(
      JSON.stringify({
        success: result.success,
        event,
        applicationId,
        deduplicated: false,
        messageId: result.messageId,
        processingMs,
        error: result.error,
      }),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Financing-SMS] Unhandled error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
