import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

interface VerifyRequest {
  phone: string;
  action: 'send' | 'verify';
  code?: string;
  userId?: string;
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('966')) {
    cleaned = '966' + cleaned;
  }
  
  return '+' + cleaned;
}

async function sendVerificationCode(phone: string): Promise<{ success: boolean; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    console.error('[Twilio Verify] Missing credentials');
    return { success: false, error: 'Missing Twilio credentials' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  console.log(`[Twilio Verify] Sending code to ${formattedPhone}`);

  try {
    const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': formattedPhone,
        'Channel': 'sms',
      }),
    });

    const data = await response.json();
    console.log('[Twilio Verify] Send response:', JSON.stringify(data));

    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to send verification code' };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('[Twilio Verify] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

async function checkVerificationCode(phone: string, code: string): Promise<{ success: boolean; valid?: boolean; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    console.error('[Twilio Verify] Missing credentials');
    return { success: false, error: 'Missing Twilio credentials' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  console.log(`[Twilio Verify] Checking code for ${formattedPhone}`);

  try {
    const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': formattedPhone,
        'Code': code,
      }),
    });

    const data = await response.json();
    console.log('[Twilio Verify] Check response:', JSON.stringify(data));

    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to verify code' };
    }

    return { success: true, valid: data.status === 'approved' };
  } catch (error: unknown) {
    console.error('[Twilio Verify] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, action, code, userId }: VerifyRequest = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
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
          JSON.stringify({ success: false, error: 'Verification code is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await checkVerificationCode(phone, code);
      
      // If verification successful and userId provided, update user's phone_verified status
      if (result.success && result.valid && userId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('profiles')
          .update({ phone_verified: true, phone: formatPhoneNumber(phone) })
          .eq('id', userId);
      }

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action. Use "send" or "verify"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('[Verify Phone] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
