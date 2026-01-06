import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUTHENTICA_API_KEY = Deno.env.get('AUTHENTICA_API_KEY');
const INFOBIP_API_KEY = Deno.env.get('INFOBIP_API_KEY');
const INFOBIP_BASE_URL = Deno.env.get('INFOBIP_BASE_URL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SMSRequest {
  phone: string;
  message: string;
  type?: 'order_status' | 'deposit' | 'balance' | 'notification' | 'otp' | 'general';
  userId?: string;
  referenceId?: string;
}

interface SMSConfig {
  provider: 'authentica' | 'infobip';
  sender_name: string;
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
async function sendSMSAuthentica(phone: string, message: string, senderName: string): Promise<{ success: boolean; error?: string; provider: string }> {
  if (!AUTHENTICA_API_KEY) {
    console.error('AUTHENTICA_API_KEY is not configured');
    return { success: false, error: 'Authentica API key not configured', provider: 'authentica' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`[Authentica] Sending SMS to ${formattedPhone}`);
    
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
        sender_name: senderName || 'Authentica',
      }),
    });

    const data = await response.json();
    console.log('[Authentica] API response:', data);

    if (response.ok) {
      return { success: true, provider: 'authentica' };
    } else {
      return { success: false, error: data.message || data.error || 'Failed to send SMS via Authentica', provider: 'authentica' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Authentica] Error sending SMS:', error);
    return { success: false, error: errorMessage, provider: 'authentica' };
  }
}

// Send SMS via Infobip API
async function sendSMSInfobip(phone: string, message: string, senderName: string): Promise<{ success: boolean; error?: string; provider: string }> {
  if (!INFOBIP_API_KEY || !INFOBIP_BASE_URL) {
    console.error('INFOBIP_API_KEY or INFOBIP_BASE_URL is not configured');
    return { success: false, error: 'Infobip API credentials not configured', provider: 'infobip' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`[Infobip] Sending SMS to ${formattedPhone}`);
    
    // Infobip API v3 endpoint
    const response = await fetch(`${INFOBIP_BASE_URL}/sms/3/messages`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `App ${INFOBIP_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            sender: senderName || 'ServiceSMS',
            destinations: [
              {
                to: formattedPhone,
              }
            ],
            content: {
              text: message,
            }
          }
        ]
      }),
    });

    const data = await response.json();
    console.log('[Infobip] API response:', JSON.stringify(data));

    if (response.ok) {
      // Check the message status
      const messageStatus = data?.messages?.[0]?.status;
      if (messageStatus?.groupId === 1 || messageStatus?.groupName === 'PENDING') {
        return { success: true, provider: 'infobip' };
      } else if (messageStatus?.groupId === 3 || messageStatus?.groupName === 'DELIVERED') {
        return { success: true, provider: 'infobip' };
      } else if (messageStatus?.groupId === 4 || messageStatus?.groupName === 'EXPIRED') {
        return { success: false, error: `Message expired: ${messageStatus?.description}`, provider: 'infobip' };
      } else if (messageStatus?.groupId === 5 || messageStatus?.groupName === 'REJECTED') {
        return { success: false, error: `Message rejected: ${messageStatus?.description}`, provider: 'infobip' };
      }
      return { success: true, provider: 'infobip' };
    } else {
      const errorMsg = data?.requestError?.serviceException?.text || 
                       data?.requestError?.serviceException?.messageId ||
                       data?.message || 
                       'Failed to send SMS via Infobip';
      return { success: false, error: errorMsg, provider: 'infobip' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Infobip] Error sending SMS:', error);
    return { success: false, error: errorMessage, provider: 'infobip' };
  }
}

// Main send SMS function that routes to the appropriate provider
async function sendSMS(phone: string, message: string, config: SMSConfig): Promise<{ success: boolean; error?: string; provider: string }> {
  console.log(`Sending SMS via ${config.provider} to ${phone}`);
  
  if (config.provider === 'infobip') {
    return sendSMSInfobip(phone, message, config.sender_name);
  } else {
    // Default to Authentica
    return sendSMSAuthentica(phone, message, config.sender_name);
  }
}

// Log SMS to database
async function logSMS(
  supabase: any,
  phone: string,
  message: string,
  type: string,
  success: boolean,
  provider: string,
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
      provider: provider,
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

    // Get SMS provider configuration
    const { data: smsConfig } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_config')
      .single();

    const config: SMSConfig = smsConfig?.value ? {
      provider: smsConfig.value.provider || 'authentica',
      sender_name: smsConfig.value.sender_name || 'Authentica',
    } : {
      provider: 'authentica',
      sender_name: 'Authentica',
    };

    console.log('Using SMS config:', config);

    // Send SMS
    const result = await sendSMS(phone, message, config);

    // Log the SMS
    await logSMS(supabase, phone, message, type, result.success, result.provider, userId, referenceId, result.error);

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
