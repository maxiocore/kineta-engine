// ============================================
// Phone Verification Edge Function - ASH HOLDING
// Powered by Msegat OTP Service
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MSEGAT_USERNAME = Deno.env.get('MSEGAT_USERNAME');
const MSEGAT_API_KEY = Deno.env.get('MSEGAT_API_KEY');
const MSEGAT_SENDER_NAME = Deno.env.get('MSEGAT_SENDER_NAME') || 'ASH HOLDING';

interface VerifyRequest {
  phone: string;
  action: 'send' | 'verify';
  code?: string;
  userId?: string;
  otpId?: number; // Required for verify action - returned from send action
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('00966')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('966')) {
    cleaned = '966' + cleaned;
  }
  
  return cleaned;
}

/**
 * Send OTP via Msegat's sendOTPCode API
 */
async function sendVerificationCode(phone: string): Promise<{ success: boolean; error?: string; otpId?: number }> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[Msegat Verify] Missing credentials');
    return { success: false, error: 'بيانات اعتماد Msegat غير مُعدّة' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  console.log(`[Msegat Verify] Sending OTP to ${formattedPhone}`);

  try {
    const response = await fetch('https://www.msegat.com/gw/sendOTPCode.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'lang': 'Ar',
      },
      body: JSON.stringify({
        userName: MSEGAT_USERNAME,
        apiKey: MSEGAT_API_KEY,
        number: formattedPhone,
        userSender: MSEGAT_SENDER_NAME,
        lang: 'Ar',
      }),
    });

    const data = await response.json();
    console.log('[Msegat Verify] Send response:', JSON.stringify(data));

    if (data.code === '1' || data.code === 'M0000' || data.message === 'Success') {
      console.log(`[Msegat Verify] OTP sent successfully. ID: ${data.id}`);
      return { success: true, otpId: data.id };
    } else {
      const errorMessages: Record<string, string> = {
        'M0001': 'متغيرات مفقودة',
        'M0002': 'بيانات دخول غير صالحة',
        '1060': 'الرصيد غير كافي',
        '1120': 'رقم الجوال غير صحيح',
        'M0008': 'بادئة رقم الجوال غير صحيحة',
      };
      const errorMsg = errorMessages[data.code] || data.message || `خطأ Msegat: ${data.code}`;
      return { success: false, error: errorMsg };
    }
  } catch (error: unknown) {
    console.error('[Msegat Verify] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify OTP via Msegat's verifyOTPCode API
 */
async function checkVerificationCode(code: string, otpId: number): Promise<{ success: boolean; valid?: boolean; error?: string }> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[Msegat Verify] Missing credentials');
    return { success: false, error: 'بيانات اعتماد Msegat غير مُعدّة' };
  }

  console.log(`[Msegat Verify] Checking code for OTP ID: ${otpId}`);

  try {
    const response = await fetch('https://www.msegat.com/gw/verifyOTPCode.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'lang': 'Ar',
      },
      body: JSON.stringify({
        userName: MSEGAT_USERNAME,
        apiKey: MSEGAT_API_KEY,
        code: code,
        id: otpId,
        userSender: MSEGAT_SENDER_NAME,
        lang: 'Ar',
      }),
    });

    const data = await response.json();
    console.log('[Msegat Verify] Check response:', JSON.stringify(data));

    if (data.code === '1' || data.code === 'M0000' || data.message === 'Success') {
      return { success: true, valid: true };
    } else {
      const errorMessages: Record<string, string> = {
        '400': 'انتهت صلاحية الرمز',
        '404': 'الرمز غير موجود أو غير صحيح',
        'M0001': 'متغيرات مفقودة',
      };
      const errorMsg = errorMessages[data.code] || data.message || `خطأ في التحقق: ${data.code}`;
      return { success: true, valid: false, error: errorMsg };
    }
  } catch (error: unknown) {
    console.error('[Msegat Verify] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, action, code, userId, otpId }: VerifyRequest = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'رقم الجوال مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send') {
      const result = await sendVerificationCode(phone);
      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'verify') {
      if (!code) {
        return new Response(
          JSON.stringify({ success: false, error: 'رمز التحقق مطلوب' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!otpId) {
        return new Response(
          JSON.stringify({ success: false, error: 'معرف OTP مطلوب (otpId)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await checkVerificationCode(code, otpId);
      
      // If verification successful and userId provided, update user's phone_verified status
      if (result.success && result.valid && userId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const formattedPhone = '+' + formatPhoneNumber(phone);
        await supabase
          .from('profiles')
          .update({ phone_verified: true, phone: formattedPhone })
          .eq('id', userId);
        
        console.log(`[Msegat Verify] Phone verified for user: ${userId}`);
      }

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'إجراء غير صالح. استخدم "send" أو "verify"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('[Msegat Verify] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
