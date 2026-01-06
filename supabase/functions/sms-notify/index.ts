import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUTHENTICA_API_KEY = Deno.env.get('AUTHENTICA_API_KEY');
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
  
  return cleaned;
}

// Send SMS via Authentica API
async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!AUTHENTICA_API_KEY) {
    console.error('AUTHENTICA_API_KEY is not configured');
    return { success: false, error: 'SMS API key not configured' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`Sending SMS to ${formattedPhone}`);
    
    const response = await fetch('https://api.authentica.sa/api/v2/send-sms', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Authorization': AUTHENTICA_API_KEY,
      },
      body: JSON.stringify({
        phone: `+${formattedPhone}`,
        message: message,
      }),
    });

    const data = await response.json();
    console.log('Authentica API response:', data);

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.message || data.error || 'Failed to send SMS' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending SMS:', error);
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
  error?: string
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

    // Send SMS
    const result = await sendSMS(phone, message);

    // Log the SMS
    await logSMS(supabase, phone, message, type, result.success, userId, referenceId, result.error);

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
