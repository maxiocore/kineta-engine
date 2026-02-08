// ============================================
// SMS Notification Edge Function - ASH HOLDING
// Powered by Msegat SMS Gateway
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

interface SMSRequest {
  phone: string;
  message: string;
  type?: 'order_status' | 'deposit' | 'balance' | 'notification' | 'otp' | 'general' | 'auth' | 'financing' | 'contract' | 'kyc' | 'support';
  userId?: string;
  referenceId?: string;
}

// Format phone number for Msegat (966xxxxxxxxx format, no +)
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

// Send SMS via Msegat API
async function sendSMSMsegat(phone: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[Msegat] Credentials are not configured');
    return { success: false, error: 'بيانات اعتماد Msegat غير مُعدّة' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`[Msegat] Sending SMS to ${formattedPhone} from ${MSEGAT_SENDER_NAME}`);
    
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
    console.log('[Msegat] Raw API response:', responseText);

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

    if (isSuccess) {
      const messageId = data?.id || data?.bulkId || String(Date.now());
      return { success: true, messageId: String(messageId) };
    } else {
      const errorCode = data?.code || data?.toString() || 'unknown';
      return { success: false, error: `Msegat error: ${errorCode}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Msegat] Error sending SMS:', error);
    return { success: false, error: errorMessage };
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
      provider: 'msegat',
      external_id: messageId || null,
    });
  } catch (err) {
    console.error('[Msegat] Error logging SMS:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Check if SMS notifications are enabled
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_notifications_enabled')
      .maybeSingle();

    if (settings && settings.value === 'false') {
      console.log('[Msegat] SMS notifications are disabled');
      return new Response(
        JSON.stringify({ success: false, error: 'SMS notifications are disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send SMS via Msegat
    const result = await sendSMSMsegat(phone, message);

    // Log the SMS
    await logSMS(supabase, phone, message, type, result.success, userId, referenceId, result.error, result.messageId);

    return new Response(
      JSON.stringify({ success: result.success, error: result.error, provider: 'msegat', messageId: result.messageId }),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Msegat] Error in sms-notify function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
