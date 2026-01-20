import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SMARTWATS_INSTANCE_ID = Deno.env.get('SMARTWATS_INSTANCE_ID');
const SMARTWATS_ACCESS_TOKEN = Deno.env.get('SMARTWATS_ACCESS_TOKEN');
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
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Saudi numbers
  if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  } else if (!cleaned.startsWith('966') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }
  
  return cleaned;
}

async function sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
  if (!SMARTWATS_INSTANCE_ID || !SMARTWATS_ACCESS_TOKEN) {
    console.error('SmartWats credentials not configured');
    return false;
  }

  const formattedPhone = formatPhoneNumber(phone);
  const message = `رمز التحقق الخاص بك هو: ${otp}\n\nصالح لمدة ${OTP_EXPIRY_MINUTES} دقائق.\n\nلا تشارك هذا الرمز مع أي شخص.`;

  try {
    const response = await fetch('https://app.smartwats.com/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: formattedPhone,
        type: 'text',
        message: message,
        instance_id: SMARTWATS_INSTANCE_ID,
        access_token: SMARTWATS_ACCESS_TOKEN,
      }),
    });

    const result = await response.json();
    console.log('SmartWats response:', result);
    
    return result.status === 'success' || result.status === true;
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, phone, otp, user_id } = await req.json();

    console.log(`WhatsApp OTP action: ${action}, phone: ${phone}`);

    // Check if phone exists in database
    if (action === 'check_phone') {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'رقم الهاتف مطلوب' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const formattedPhone = formatPhoneNumber(phone);

      // Check if phone exists and is verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, phone, phone_verified')
        .eq('phone', formattedPhone)
        .maybeSingle();

      return new Response(
        JSON.stringify({ 
          success: true,
          exists: !!profile,
          verified: profile?.phone_verified || false,
          user_id: profile?.id || null,
          name: profile?.full_name || null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send') {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'رقم الهاتف مطلوب' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const formattedPhone = formatPhoneNumber(phone);

      // Check for recent OTP (cooldown)
      const { data: recentOTP } = await supabase
        .from('whatsapp_verifications')
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
              cooldown: remainingSeconds
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check if phone exists in profiles (for login vs signup flow)
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
        .from('whatsapp_verifications')
        .update({ status: 'expired' })
        .eq('phone', formattedPhone)
        .eq('status', 'pending');

      // Store OTP with existing user_id if found
      const { error: insertError } = await supabase
        .from('whatsapp_verifications')
        .insert({
          phone: formattedPhone,
          otp_hash: otpHash,
          expires_at: expiresAt.toISOString(),
          user_id: existingProfile?.id || user_id || null,
          status: 'pending',
          attempts_count: 0,
        });

      if (insertError) {
        console.error('Error storing OTP:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'حدث خطأ في النظام' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send OTP via WhatsApp
      const sent = await sendWhatsAppOTP(phone, generatedOTP);

      if (!sent) {
        return new Response(
          JSON.stringify({ success: false, error: 'فشل إرسال الرسالة عبر واتساب' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'تم إرسال رمز التحقق عبر واتساب',
          expires_in: OTP_EXPIRY_MINUTES * 60,
          is_existing_user: !!existingProfile,
          user_name: existingProfile?.full_name || null
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
        .from('whatsapp_verifications')
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

      // Check if expired
      if (new Date(verification.expires_at) < new Date()) {
        await supabase
          .from('whatsapp_verifications')
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
          .from('whatsapp_verifications')
          .update({ status: 'locked' })
          .eq('id', verification.id);

        return new Response(
          JSON.stringify({ success: false, error: 'تم تجاوز عدد المحاولات المسموح' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Increment attempts
      await supabase
        .from('whatsapp_verifications')
        .update({ attempts_count: verification.attempts_count + 1 })
        .eq('id', verification.id);

      // Verify OTP
      if (inputHash !== verification.otp_hash) {
        const remainingAttempts = MAX_ATTEMPTS - verification.attempts_count - 1;
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}`,
            remaining_attempts: remainingAttempts
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark as verified
      await supabase
        .from('whatsapp_verifications')
        .update({ 
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', verification.id);

      // Check if user exists with this phone
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_verified')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (existingProfile) {
        // Existing user - update phone_verified
        await supabase
          .from('profiles')
          .update({ phone_verified: true })
          .eq('id', existingProfile.id);

        // Get the auth user to generate a magic link token
        const { data: authUser } = await supabase.auth.admin.getUserById(existingProfile.id);
        
        if (authUser?.user?.email) {
          // Generate a one-time login link for the user
          const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: authUser.user.email,
          });

          if (linkError) {
            console.error('Error generating magic link:', linkError);
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
              // Include the token for auto-login
              access_token: linkData?.properties?.hashed_token || null,
              token_hash: linkData?.properties?.hashed_token || null
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
            user_name: existingProfile.full_name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // New user - needs to complete registration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'تم التحقق بنجاح',
          phone: formattedPhone,
          is_existing_user: false,
          needs_registration: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check') {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'رقم الهاتف مطلوب' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const formattedPhone = formatPhoneNumber(phone);

      // Check if phone exists and is verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, phone_verified')
        .eq('phone', formattedPhone)
        .eq('phone_verified', true)
        .maybeSingle();

      return new Response(
        JSON.stringify({ 
          success: true,
          exists: !!profile,
          verified: profile?.phone_verified || false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'إجراء غير صالح' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('WhatsApp OTP error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'حدث خطأ في النظام' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
