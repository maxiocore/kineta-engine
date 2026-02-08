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
        `✅ تهانينا! أنت مؤهل للتمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `تهانينا! أنت مؤهل للحصول على تمويل خدمات.`,
        ``,
        `📋 يمكنك الآن إكمال طلبك من حسابك`,
        `⏱️ الإجراء سريع ومبسّط`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'eligibility_failed':
      return [
        `📋 نتيجة فحص الأهلية`,
        ``,
        `عزيزي ${name}،`,
        `بعد مراجعة بياناتك، لم تستوفِ شروط الأهلية حالياً.`,
        ``,
        `🔄 يمكنك إعادة المحاولة لاحقاً`,
        `📞 أو التواصل مع فريق الدعم`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'application_submitted':
      return [
        `📩 تم استلام طلب التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `تم استلام طلب التمويل بنجاح`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ المطلوب: ${amount} ر.س` : '',
        ``,
        `⏳ جاري المراجعة من الفريق المختص`,
        `📱 سيصلك إشعار بالنتيجة`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].filter(Boolean).join('\n');

    case 'application_approved':
      return [
        `✅ تمت الموافقة على التمويل`,
        ``,
        `تهانينا ${name}! 🎉`,
        `تمت الموافقة على طلب التمويل`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ المعتمد: ${amount} ر.س` : '',
        ``,
        `📋 الخطوة التالية: مراجعة العرض والإقرار`,
        `📱 يرجى الدخول لحسابك لإتمام الإجراءات`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].filter(Boolean).join('\n');

    case 'application_approved_limited':
      return [
        `✅ موافقة مشروطة على التمويل`,
        ``,
        `مرحباً ${name} 👋`,
        `تمت الموافقة المشروطة على طلب التمويل`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ المعتمد: ${amount} ر.س` : '',
        ``,
        `ℹ️ يرجى مراجعة الشروط في حسابك`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].filter(Boolean).join('\n');

    case 'application_rejected':
      return [
        `📋 نتيجة دراسة طلب التمويل`,
        ``,
        `عزيزي ${name}،`,
        `بعد الدراسة الائتمانية لطلبك رقم #${appNum}`,
        `❌ لم تتم الموافقة على الطلب`,
        data.rejectionReason ? `📝 الملاحظة: ${data.rejectionReason}` : '',
        ``,
        `📞 يمكنك التواصل مع فريقنا للمزيد`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].filter(Boolean).join('\n');

    case 'offer_ready':
      return [
        `📋 عرض التمويل جاهز`,
        ``,
        `مرحباً ${name} 👋`,
        `عرض التمويل جاهز لمراجعتك!`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ: ${amount} ر.س` : '',
        ``,
        `📱 يرجى الدخول لحسابك لمراجعة العرض`,
        `⏱️ العرض صالح لمدة محدودة`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].filter(Boolean).join('\n');

    case 'acknowledgment_sent':
      return [
        `📄 إقرار الشروط والأحكام`,
        ``,
        `مرحباً ${name} 👋`,
        `تم إرسال إقرار الشروط والأحكام لطلب #${appNum}`,
        ``,
        `📱 يرجى مراجعة الإقرار والتوقيع عليه`,
        `⏱️ من حسابك في المنصة`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'acknowledgment_signed':
      return [
        `✅ تم توقيع الإقرار`,
        ``,
        `مرحباً ${name} 👋`,
        `تم توقيع إقرار الشروط بنجاح`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `📋 الخطوة التالية: إرسال العقد الرسمي`,
        `⏳ سيتم إرسال العقد قريباً`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'contract_sent':
      return [
        `📑 عقد التمويل الرسمي`,
        ``,
        `مرحباً ${name} 👋`,
        `تم إرسال عقد التمويل الرسمي`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💰 المبلغ: ${amount} ر.س` : '',
        ``,
        `📱 يرجى مراجعة العقد والتوقيع عليه`,
        `🔐 التوقيع يتطلب رمز تحقق OTP`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].filter(Boolean).join('\n');

    case 'contract_signed':
      return [
        `✅ تم توقيع العقد`,
        ``,
        `تهانينا ${name}! 🎉`,
        `تم توقيع عقد التمويل بنجاح`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `📋 الخطوة التالية: إصدار السند التنفيذي`,
        `⏳ جاري استكمال الإجراءات`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'contract_finalized':
      return [
        `✅ تم اعتماد العقد رسمياً`,
        ``,
        `مرحباً ${name} 👋`,
        `تم اعتماد العقد رسمياً`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `📋 جاري استكمال الإجراءات النهائية`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'bond_issuing':
      return [
        `📋 جاري إصدار السند التنفيذي`,
        ``,
        `مرحباً ${name} 👋`,
        `جاري إصدار السند التنفيذي لطلب #${appNum}`,
        ``,
        `⏳ يتم إعداد السند عبر نظام نافذ`,
        `📱 سيصلك إشعار عند الجاهزية`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'bond_issued':
      return [
        `✅ تم إصدار السند التنفيذي`,
        ``,
        `مرحباً ${name} 👋`,
        `تم إصدار السند التنفيذي`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `📋 الخطوة التالية: التوقيع على السند`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'bond_sent':
      return [
        `📩 السند التنفيذي`,
        ``,
        `مرحباً ${name} 👋`,
        `تم إرسال السند التنفيذي لطلب #${appNum}`,
        ``,
        `📱 يرجى مراجعة السند والتوقيع عليه`,
        `⚡ التوقيع مطلوب لاستكمال الإجراءات`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'bond_signed':
      return [
        `✅ تم توقيع السند التنفيذي`,
        ``,
        `مرحباً ${name} 👋`,
        `تم توقيع السند التنفيذي بنجاح`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `⏳ جاري التحقق من الإدارة`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'bond_verified':
      return [
        `✅ تم اعتماد السند التنفيذي`,
        ``,
        `مرحباً ${name} 👋`,
        `تم التحقق من السند التنفيذي واعتماده`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        `💰 جاري إيداع رصيد الخدمات`,
        `📱 سيصلك إشعار عند الإيداع`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].join('\n');

    case 'credit_deposited':
      return [
        `💰 تم إيداع رصيد الخدمات`,
        ``,
        `تهانينا ${name}! 🎊`,
        `تم إيداع رصيد الخدمات في حسابك`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💳 الرصيد المودع: ${amount} ر.س` : '',
        ``,
        `✅ يمكنك الآن استخدام رصيدك لطلب الخدمات`,
        `⚠️ الرصيد غير قابل للسحب النقدي`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].filter(Boolean).join('\n');

    case 'financing_completed':
      return [
        `🎉 تم تفعيل رصيد خدماتك`,
        ``,
        `تهانينا ${name}! 🥳`,
        `تم تفعيل رصيد خدماتك بالكامل`,
        ``,
        `📄 رقم الطلب: #${appNum}`,
        amount ? `💳 الرصيد المتاح: ${amount} ر.س` : '',
        ``,
        `🛒 ابدأ طلب خدماتك الآن من المنصة`,
        `⚠️ الرصيد لاستخدام الخدمات فقط`,
        ``,
        `شكراً لثقتك بنا 🤝`,
        `━━━━━━━━━━━━━━`,
        `فريق التمويل | ASH HOLDING`,
        `ash-holding.sa`,
      ].filter(Boolean).join('\n');

    default:
      return `📋 تحديث على طلب التمويل\n\nمرحباً ${name} 👋\nلديك تحديث جديد على طلب التمويل #${appNum}\n\n📱 يرجى مراجعة حسابك\n━━━━━━━━━━━━━━\nفريق التمويل | ASH HOLDING\nash-holding.sa`;
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
