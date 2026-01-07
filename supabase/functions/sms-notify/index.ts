import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SMSRequest {
  phone: string;
  message: string;
  type?: 'order_status' | 'deposit' | 'balance' | 'notification' | 'otp' | 'general';
  userId?: string;
  referenceId?: string;
}

// Format phone number to international format
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 966
  if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  }
  
  // If doesn't start with country code, add 966
  if (!cleaned.startsWith('966')) {
    cleaned = '966' + cleaned;
  }
  
  // Add + prefix for E.164 format
  return '+' + cleaned;
}

// Send SMS via Twilio API
async function sendSMSTwilio(phone: string, message: string): Promise<{ success: boolean; error?: string; provider: string; messageId?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio credentials are not configured');
    return { success: false, error: 'Twilio credentials not configured', provider: 'twilio' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`[Twilio] Sending SMS to ${formattedPhone}`);
    
    // Twilio REST API - using Basic Auth
    const authString = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`,
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    );

    const data = await response.json();
    console.log('[Twilio] API response:', JSON.stringify(data));

    if (response.ok && data.sid) {
      return { success: true, provider: 'twilio', messageId: data.sid };
    } else {
      const errorMsg = data.message || data.error_message || 'Failed to send SMS via Twilio';
      return { success: false, error: errorMsg, provider: 'twilio' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Twilio] Error sending SMS:', error);
    return { success: false, error: errorMessage, provider: 'twilio' };
  }
}

// Log SMS to database
async function logSMS(
  supabase: any,
  phone: string,
  message: string,
  type: string,
  success: boolean,
  userId?: string,
  referenceId?: string,
  error?: string,
  messageId?: string
) {
  try {
    await supabase.from('sms_logs').insert({
      phone,
      message,
      type,
      status: success ? 'sent' : 'failed',
      user_id: userId || null,
      reference_id: referenceId || null,
      error_message: error || null,
      provider: 'twilio',
      external_id: messageId || null,
    });
  } catch (err) {
    console.error('Error logging SMS:', err);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { phone, message, type = 'general', userId, referenceId } = await req.json() as SMSRequest;

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if SMS notifications are enabled in settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_notifications_enabled')
      .single();

    if (settings && settings.value === 'false') {
      console.log('SMS notifications are disabled');
      return new Response(
        JSON.stringify({ success: false, error: 'SMS notifications are disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send SMS via Twilio
    const result = await sendSMSTwilio(phone, message);

    // Log the SMS
    await logSMS(supabase, phone, message, type, result.success, userId, referenceId, result.error, result.messageId);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in sms-notify function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
