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

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

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

async function sendSmsOTP(phone: string, otp: string): Promise<boolean> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[SMS Auth] Missing Msegat credentials');
    return false;
  }

  const formattedPhone = formatPhoneNumber(phone);
  const message = `رمز التحقق الخاص بك هو: ${otp}\n\nصالح لمدة ${OTP_EXPIRY_MINUTES} دقائق.\nلا تشارك هذا الرمز مع أي شخص.\n\nASH HOLDING`;

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
      }),
    });

    const data = await response.json();
    console.log('[SMS Auth] Msegat response:', JSON.stringify(data));

    return data.code === '1' || data.code === 'M0000' || data.message === 'Success';
  } catch (error) {
    console.error('[SMS Auth] Error sending SMS:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, phone, otp } = await req.json();

    console.log(`[SMS Auth] Action: ${action}, Phone: ${phone}`);

    if (action === 'send') {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'رقم الهاتف مطلوب' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const formattedPhone = formatPhoneNumber(phone);

      // Check cooldown
      const { data: recentOTP } = await supabase
        .from('sms_verifications')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentOTP) {
        const createdAt = new Date(recentOTP.created_at);
        const now = new Date();
        const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000;

        if (diffSeconds < RESEND_COOLDOWN_SECONDS) {
          const remainingSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - diffSeconds);
          return new Response(
            JSON.stringify({
              success: false,
              error: `يرجى الانتظار ${remainingSeconds} ثانية قبل إعادة الإرسال`,
              cooldown: remainingSeconds,
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check if phone exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name, phone_verified')
        .eq('phone', formattedPhone)
        .maybeSingle();

      // Generate OTP
      const generatedOTP = generateOTP();
      const otpHash = await hashOTP(generatedOTP);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Invalidate previous pending OTPs
      await supabase
        .from('sms_verifications')
        .update({ status: 'expired' })
        .eq('phone', formattedPhone)
        .eq('status', 'pending');

      // Store OTP
      const { error: insertError } = await supabase
        .from('sms_verifications')
        .insert({
          phone: formattedPhone,
          otp_hash: otpHash,
          expires_at: expiresAt.toISOString(),
          user_id: existingProfile?.id || null,
          status: 'pending',
          attempts_count: 0,
        });

      if (insertError) {
        console.error('[SMS Auth] Error storing OTP:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'حدث خطأ في النظام' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send SMS via Msegat
      const sent = await sendSmsOTP(phone, generatedOTP);

      if (!sent) {
        return new Response(
          JSON.stringify({ success: false, error: 'فشل إرسال الرسالة النصية' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'تم إرسال رمز التحقق عبر SMS',
          expires_in: OTP_EXPIRY_MINUTES * 60,
          is_existing_user: !!existingProfile,
          user_name: existingProfile?.full_name || null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      if (!phone || !otp) {
        return new Response(
          JSON.stringify({ success: false, error: 'رقم الهاتف ورمز التحقق مطلوبان' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const formattedPhone = formatPhoneNumber(phone);
      const inputHash = await hashOTP(otp);

      // Get pending verification
      const { data: verification } = await supabase
        .from('sms_verifications')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!verification) {
        return new Response(
          JSON.stringify({ success: false, error: 'لا يوجد رمز تحقق لهذا الرقم' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiry
      if (new Date(verification.expires_at) < new Date()) {
        await supabase
          .from('sms_verifications')
          .update({ status: 'expired' })
          .eq('id', verification.id);

        return new Response(
          JSON.stringify({ success: false, error: 'انتهت صلاحية رمز التحقق' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check attempts
      if (verification.attempts_count >= MAX_ATTEMPTS) {
        await supabase
          .from('sms_verifications')
          .update({ status: 'locked' })
          .eq('id', verification.id);

        return new Response(
          JSON.stringify({ success: false, error: 'تم تجاوز عدد المحاولات المسموح' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Increment attempts
      await supabase
        .from('sms_verifications')
        .update({ attempts_count: verification.attempts_count + 1 })
        .eq('id', verification.id);

      // Verify OTP
      if (inputHash !== verification.otp_hash) {
        const remainingAttempts = MAX_ATTEMPTS - verification.attempts_count - 1;
        return new Response(
          JSON.stringify({
            success: false,
            error: `رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}`,
            remaining_attempts: remainingAttempts,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark as verified
      await supabase
        .from('sms_verifications')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', verification.id);

      // Check if user exists with this phone
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_verified')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (existingProfile) {
        // Update phone_verified
        await supabase
          .from('profiles')
          .update({ phone_verified: true })
          .eq('id', existingProfile.id);

        // Generate magic link for auto-login
        const { data: authUser } = await supabase.auth.admin.getUserById(existingProfile.id);

        if (authUser?.user?.email) {
          const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: authUser.user.email,
          });

          if (linkError) {
            console.error('[SMS Auth] Error generating magic link:', linkError);
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: 'تم التحقق بنجاح',
              phone: formattedPhone,
              is_existing_user: true,
              user_id: existingProfile.id,
              user_email: authUser.user.email,
              user_name: existingProfile.full_name,
              token_hash: linkData?.properties?.hashed_token || null,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'تم التحقق بنجاح',
            phone: formattedPhone,
            is_existing_user: true,
            user_id: existingProfile.id,
            user_email: existingProfile.email,
            user_name: existingProfile.full_name,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // New user - needs registration
      return new Response(
        JSON.stringify({
          success: true,
          message: 'تم التحقق بنجاح',
          phone: formattedPhone,
          is_existing_user: false,
          needs_registration: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'إجراء غير صالح' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SMS Auth] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'حدث خطأ في النظام' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
