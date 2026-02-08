/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *        نظام توقيع العقد مع تحقق ثنائي - Contract Signing OTP System
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * متطلبات الأمان:
 * ✅ OTP صالح لمدة 5 دقائق
 * ✅ حد محاولات (3) ثم قفل مؤقت
 * ✅ Idempotency لمنع الإرسال المتكرر
 * ✅ تسجيل كل الأحداث في Audit Log
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// Configuration
// ============================================

const MSEGAT_USERNAME = Deno.env.get('MSEGAT_USERNAME');
const MSEGAT_API_KEY = Deno.env.get('MSEGAT_API_KEY');
const MSEGAT_SENDER_NAME = Deno.env.get('MSEGAT_SENDER_NAME') || 'ASH HOLDING';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// OTP Settings
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;

// ============================================
// Types
// ============================================

interface SigningOTPRequest {
  action: 'send' | 'verify' | 'status';
  contract_id: string;
  application_id: string;
  user_id?: string;
  otp?: string;
  reading_time_seconds?: number;
  scroll_percentage?: number;
  idempotency_key?: string;
}

interface ContractSigningOTP {
  id: string;
  contract_id: string;
  application_id: string;
  user_id: string;
  phone: string;
  otp_hash: string;
  status: 'pending' | 'verified' | 'expired' | 'locked';
  attempts_count: number;
  expires_at: string;
  locked_until: string | null;
  idempotency_key: string | null;
  created_at: string;
  verified_at: string | null;
  reading_time_seconds: number | null;
  scroll_percentage: number | null;
  signature_ip: string | null;
  signature_user_agent: string | null;
}

// ============================================
// Helper Functions
// ============================================

function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(OTP_LENGTH, '0');
}

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  } else if (!cleaned.startsWith('966') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }
  
  return cleaned;
}

async function sendSigningOTPviaSMS(
  phone: string, 
  otp: string,
  contractNumber: string,
  customerName: string
): Promise<boolean> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[Contract Signing OTP] Msegat credentials not configured');
    return false;
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  const message = `ASH HOLDING - رمز توقيع العقد

مرحباً ${customerName}،
رمز التحقق لتوقيع العقد رقم: ${contractNumber}

الرمز: ${otp}

صالح لمدة ${OTP_EXPIRY_MINUTES} دقائق فقط.

تحذير: لا تشارك هذا الرمز مع أي شخص.
شركة علي صالح الشهري القابضة`;

  try {
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
        By: 'ASH HOLDING',
      }),
    });

    const responseText = await response.text();
    console.log('[Contract Signing OTP] Msegat response:', responseText);
    
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText.trim();
    }

    const isSuccess = 
      data === '1' || data === 1 ||
      data?.code === '1' || data?.code === 'M0000' ||
      data?.message === 'Success';

    return isSuccess;
  } catch (error) {
    console.error('[Contract Signing OTP] Error sending SMS:', error);
    return false;
  }
}

async function logAuditEvent(
  supabase: any,
  eventType: string,
  applicationId: string,
  contractId: string,
  userId: string,
  metadata: Record<string, any>,
  req: Request
): Promise<void> {
  try {
    // Log to financing_activity_log
    await supabase.from('financing_activity_log').insert({
      application_id: applicationId,
      event_type: eventType,
      from_status: null,
      to_status: eventType === 'contract_signed' ? 'CONTRACT_SIGNED' : 'SIGNING_OTP_SENT',
      triggered_by: 'system',
      actor_id: userId,
      is_visible_to_customer: false,
      metadata: {
        ...metadata,
        contract_id: contractId,
        user_agent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      }
    });

    // Also log to audit_logs for security tracking
    await supabase.from('audit_logs').insert({
      action: eventType,
      table_name: 'financing_contracts',
      record_id: contractId,
      user_id: userId,
      user_agent: req.headers.get('user-agent'),
      metadata: {
        ...metadata,
        application_id: applicationId,
      }
    });
  } catch (error) {
    console.error('[Audit Log] Error:', error);
  }
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body: SigningOTPRequest = await req.json();
    const { action, contract_id, application_id, user_id, otp, reading_time_seconds, scroll_percentage, idempotency_key } = body;

    console.log(`[Contract Signing OTP] Action: ${action}, Contract: ${contract_id}`);

    // ==================== ACTION: SEND OTP ====================
    if (action === 'send') {
      if (!contract_id || !application_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'contract_id و application_id مطلوبان' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Idempotency check
      if (idempotency_key) {
        const { data: existingOTP } = await supabase
          .from('contract_signing_otps')
          .select('*')
          .eq('idempotency_key', idempotency_key)
          .eq('status', 'pending')
          .maybeSingle();

        if (existingOTP) {
          console.log('[Contract Signing OTP] Idempotency hit - returning existing OTP session');
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'تم إرسال رمز التحقق مسبقاً',
              expires_in: Math.max(0, Math.floor((new Date(existingOTP.expires_at).getTime() - Date.now()) / 1000)),
              otp_id: existingOTP.id,
              idempotent: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Fetch contract and application data
      const { data: contract, error: contractError } = await supabase
        .from('financing_contract_documents')
        .select(`
          *,
          application:financing_applications(
            id, phone, full_name, contract_override_name, application_number, user_id
          )
        `)
        .eq('id', contract_id)
        .single();

      if (contractError || !contract) {
        return new Response(
          JSON.stringify({ success: false, error: 'العقد غير موجود' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const application = contract.application;
      const customerName = application.contract_override_name || application.full_name;
      const phone = application.phone;

      // Check for lockout
      const { data: lockedOTP } = await supabase
        .from('contract_signing_otps')
        .select('*')
        .eq('contract_id', contract_id)
        .eq('status', 'locked')
        .gt('locked_until', new Date().toISOString())
        .maybeSingle();

      if (lockedOTP) {
        const lockRemaining = Math.ceil((new Date(lockedOTP.locked_until).getTime() - Date.now()) / 60000);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `تم تجاوز عدد المحاولات. يرجى المحاولة بعد ${lockRemaining} دقيقة`,
            locked: true,
            lock_remaining_minutes: lockRemaining
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check cooldown
      const { data: recentOTP } = await supabase
        .from('contract_signing_otps')
        .select('*')
        .eq('contract_id', contract_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentOTP) {
        const createdAt = new Date(recentOTP.created_at);
        const diffSeconds = (Date.now() - createdAt.getTime()) / 1000;
        
        if (diffSeconds < RESEND_COOLDOWN_SECONDS) {
          const remainingSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - diffSeconds);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `يرجى الانتظار ${remainingSeconds} ثانية قبل إعادة الإرسال`,
              cooldown: remainingSeconds
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Generate OTP
      const generatedOTP = generateOTP();
      const otpHash = await hashOTP(generatedOTP);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Expire old pending OTPs
      await supabase
        .from('contract_signing_otps')
        .update({ status: 'expired' })
        .eq('contract_id', contract_id)
        .eq('status', 'pending');

      // Store new OTP
      const { data: newOTP, error: insertError } = await supabase
        .from('contract_signing_otps')
        .insert({
          contract_id,
          application_id,
          user_id: application.user_id,
          phone: formatPhoneNumber(phone),
          otp_hash: otpHash,
          status: 'pending',
          attempts_count: 0,
          expires_at: expiresAt.toISOString(),
          idempotency_key,
          reading_time_seconds,
          scroll_percentage,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Contract Signing OTP] Insert error:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'حدث خطأ في النظام' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update contract status
      await supabase
        .from('financing_contract_documents')
        .update({ 
          status: 'SIGNING_OTP_SENT',
          updated_at: new Date().toISOString()
        })
        .eq('id', contract_id);

      // Send OTP via SMS (Msegat)
      const sent = await sendSigningOTPviaSMS(phone, generatedOTP, contract.contract_number, customerName);

      if (!sent) {
        // Mark as failed but don't delete - for audit
        await supabase
          .from('contract_signing_otps')
          .update({ status: 'expired' })
          .eq('id', newOTP.id);

        return new Response(
          JSON.stringify({ success: false, error: 'فشل إرسال رمز التحقق عبر SMS' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log audit event
      await logAuditEvent(
        supabase,
        'contract_signing_otp_sent',
        application_id,
        contract_id,
        application.user_id,
        { 
          phone: formatPhoneNumber(phone),
          otp_id: newOTP.id,
          contract_number: contract.contract_number
        },
        req
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'تم إرسال رمز التحقق عبر واتساب',
          expires_in: OTP_EXPIRY_MINUTES * 60,
          otp_id: newOTP.id,
          phone_masked: `*******${phone.slice(-4)}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==================== ACTION: VERIFY OTP ====================
    if (action === 'verify') {
      if (!contract_id || !otp) {
        return new Response(
          JSON.stringify({ success: false, error: 'contract_id و otp مطلوبان' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const inputHash = await hashOTP(otp);

      // Get pending OTP
      const { data: verification } = await supabase
        .from('contract_signing_otps')
        .select('*')
        .eq('contract_id', contract_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!verification) {
        return new Response(
          JSON.stringify({ success: false, error: 'لا يوجد رمز تحقق نشط. يرجى طلب رمز جديد.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiry
      if (new Date(verification.expires_at) < new Date()) {
        await supabase
          .from('contract_signing_otps')
          .update({ status: 'expired' })
          .eq('id', verification.id);

        return new Response(
          JSON.stringify({ success: false, error: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check lockout
      if (verification.locked_until && new Date(verification.locked_until) > new Date()) {
        const lockRemaining = Math.ceil((new Date(verification.locked_until).getTime() - Date.now()) / 60000);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `تم تجاوز عدد المحاولات. يرجى المحاولة بعد ${lockRemaining} دقيقة`,
            locked: true
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check attempts
      if (verification.attempts_count >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await supabase
          .from('contract_signing_otps')
          .update({ 
            status: 'locked',
            locked_until: lockedUntil.toISOString()
          })
          .eq('id', verification.id);

        await logAuditEvent(
          supabase,
          'contract_signing_otp_locked',
          application_id,
          contract_id,
          verification.user_id,
          { attempts: verification.attempts_count + 1, locked_until: lockedUntil.toISOString() },
          req
        );

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `تم تجاوز عدد المحاولات. تم القفل لمدة ${LOCKOUT_MINUTES} دقيقة.`,
            locked: true
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Increment attempts
      await supabase
        .from('contract_signing_otps')
        .update({ attempts_count: verification.attempts_count + 1 })
        .eq('id', verification.id);

      // Verify OTP
      if (inputHash !== verification.otp_hash) {
        const remainingAttempts = MAX_ATTEMPTS - verification.attempts_count - 1;
        
        await logAuditEvent(
          supabase,
          'contract_signing_otp_failed',
          application_id,
          contract_id,
          verification.user_id,
          { attempts: verification.attempts_count + 1, remaining: remainingAttempts },
          req
        );

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}`,
            remaining_attempts: remainingAttempts
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ✅ OTP Verified - Sign the contract
      const signedAt = new Date().toISOString();

      // Update OTP record
      await supabase
        .from('contract_signing_otps')
        .update({ 
          status: 'verified',
          verified_at: signedAt,
          signature_ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
          signature_user_agent: req.headers.get('user-agent'),
        })
        .eq('id', verification.id);

      // Update contract document
      await supabase
        .from('financing_contract_documents')
        .update({ 
          status: 'SIGNED',
          signed_at: signedAt,
          signature_ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
          signature_user_agent: req.headers.get('user-agent'),
          signature_device_info: {
            verified_via: 'whatsapp_otp',
            otp_id: verification.id,
            reading_time_seconds: verification.reading_time_seconds,
            scroll_percentage: verification.scroll_percentage,
          },
          reading_time_seconds: verification.reading_time_seconds,
          scroll_percentage: verification.scroll_percentage,
          updated_at: signedAt
        })
        .eq('id', contract_id);

      // Update application workflow status
      await supabase
        .from('financing_applications')
        .update({ 
          workflow_status: 'CONTRACT_SIGNED',
          phase_updated_at: signedAt,
          contract_signed_at: signedAt,
          updated_at: signedAt
        })
        .eq('id', application_id);

      // Log audit event
      await logAuditEvent(
        supabase,
        'contract_signed',
        application_id,
        contract_id,
        verification.user_id,
        { 
          signed_at: signedAt,
          verification_method: 'whatsapp_otp',
          otp_id: verification.id,
          reading_time_seconds: verification.reading_time_seconds,
          scroll_percentage: verification.scroll_percentage,
        },
        req
      );

      // Send SMS notification for contract_signed
      try {
        const { data: appData } = await supabase
          .from('financing_applications')
          .select('phone, full_name, application_number, approved_amount, requested_amount, user_id')
          .eq('id', application_id)
          .single();

        if (appData?.phone) {
          await supabase.functions.invoke('financing-sms-notify', {
            body: {
              event: 'contract_signed',
              phone: appData.phone,
              customerName: appData.full_name,
              applicationId: application_id,
              applicationNumber: appData.application_number,
              approvedAmount: appData.approved_amount || appData.requested_amount,
              userId: appData.user_id,
            }
          });
          console.log('[Contract-OTP] SMS sent for contract_signed');
        }
      } catch (smsErr) {
        console.error('[Contract-OTP] SMS send error:', smsErr);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'تم توقيع العقد بنجاح',
          signed_at: signedAt,
          contract_status: 'SIGNED'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==================== ACTION: STATUS ====================
    if (action === 'status') {
      if (!contract_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'contract_id مطلوب' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: latestOTP } = await supabase
        .from('contract_signing_otps')
        .select('*')
        .eq('contract_id', contract_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: contractDoc } = await supabase
        .from('financing_contract_documents')
        .select('status, signed_at')
        .eq('id', contract_id)
        .single();

      return new Response(
        JSON.stringify({ 
          success: true,
          otp_status: latestOTP?.status || null,
          contract_status: contractDoc?.status || null,
          is_signed: contractDoc?.status === 'SIGNED',
          signed_at: contractDoc?.signed_at,
          can_request_otp: !latestOTP || latestOTP.status !== 'pending' || 
            new Date(latestOTP.expires_at) < new Date(),
          is_locked: latestOTP?.status === 'locked' && 
            latestOTP?.locked_until && 
            new Date(latestOTP.locked_until) > new Date(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'إجراء غير صالح' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Contract Signing OTP] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'حدث خطأ في النظام' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
