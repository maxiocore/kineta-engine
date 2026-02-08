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
  | 'application_rejected'
  | 'acknowledgment_signed'
  | 'contract_signed'
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
}

// ============================================
// SMS Templates - Professional Arabic
// ============================================

function buildSMSMessage(event: FinancingSMSEvent, data: FinancingSMSRequest): string {
  const name = data.customerName || 'عميلنا الكريم';
  const appNum = data.applicationNumber || '';
  const amount = data.approvedAmount
    ? data.approvedAmount.toLocaleString('ar-SA')
    : '';

  switch (event) {
    case 'eligibility_passed':
      return [
        `عزيزي ${name}،`,
        `يسعدنا إبلاغك بأنك مؤهل للحصول على تمويل خدمات ASH HOLDING.`,
        `يمكنك الآن إكمال طلب التمويل من خلال حسابك.`,
        `فريق ASH HOLDING`,
      ].join('\n');

    case 'eligibility_failed':
      return [
        `عزيزي ${name}،`,
        `نأسف لإبلاغك بأنك غير مؤهل حالياً للحصول على التمويل.`,
        `يمكنك إعادة المحاولة لاحقاً أو التواصل مع فريق الدعم.`,
        `فريق ASH HOLDING`,
      ].join('\n');

    case 'application_submitted':
      return [
        `عزيزي ${name}،`,
        `تم استلام طلب التمويل رقم ${appNum} بنجاح.`,
        `سيتم مراجعة طلبك من قبل فريقنا المختص وإبلاغك بالنتيجة.`,
        `فريق ASH HOLDING`,
      ].join('\n');

    case 'application_approved':
      return [
        `عزيزي ${name}،`,
        `يسعدنا إبلاغك بالموافقة على طلب التمويل رقم ${appNum}.`,
        amount ? `المبلغ المعتمد: ${amount} ر.س` : '',
        `يرجى الدخول لحسابك لإتمام الإجراءات المطلوبة.`,
        `فريق ASH HOLDING`,
      ].filter(Boolean).join('\n');

    case 'application_rejected':
      return [
        `عزيزي ${name}،`,
        `نأسف لإبلاغك بأنه لم تتم الموافقة على طلب التمويل رقم ${appNum}.`,
        data.rejectionReason ? `السبب: ${data.rejectionReason}` : '',
        `يمكنك التواصل مع فريق الدعم لمزيد من التفاصيل.`,
        `فريق ASH HOLDING`,
      ].filter(Boolean).join('\n');

    case 'acknowledgment_signed':
      return [
        `عزيزي ${name}،`,
        `تم توقيع إقرار الشروط والأحكام لطلب التمويل رقم ${appNum} بنجاح.`,
        `سيتم إرسال العقد الرسمي لك قريباً لإتمام التوقيع.`,
        `فريق ASH HOLDING`,
      ].join('\n');

    case 'contract_signed':
      return [
        `عزيزي ${name}،`,
        `تم توقيع عقد التمويل رقم ${appNum} بنجاح.`,
        `سيتم استكمال الإجراءات اللازمة وإبلاغك عند تفعيل رصيد الخدمات.`,
        `فريق ASH HOLDING`,
      ].join('\n');

    case 'financing_completed':
      return [
        `عزيزي ${name}،`,
        `تهانينا! تم تفعيل رصيد خدماتك بنجاح.`,
        amount ? `الرصيد المتاح: ${amount} ر.س` : '',
        `يمكنك الآن استخدام رصيدك من خلال منصة ASH HOLDING.`,
        `شكراً لثقتك بنا.`,
        `فريق ASH HOLDING`,
      ].filter(Boolean).join('\n');

    default:
      return `عزيزي ${name}، لديك تحديث جديد على طلب التمويل الخاص بك. يرجى الدخول لحسابك. فريق ASH HOLDING`;
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
      'application_approved', 'application_rejected',
      'acknowledgment_signed',
      'contract_signed',
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
