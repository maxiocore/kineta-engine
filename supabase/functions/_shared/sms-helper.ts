// Shared SMS helper for all edge functions
// This helper sends SMS via Twilio

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
// Use Alphanumeric Sender ID for Saudi Arabia (e.g., "ASH HOLDING")
// Or a Saudi number if available
const TWILIO_SENDER_ID = Deno.env.get('TWILIO_SENDER_ID') || Deno.env.get('TWILIO_PHONE_NUMBER') || 'ASH HOLDING';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SMSResult {
  success: boolean;
  error?: string;
  provider: string;
  messageId?: string;
}

// Format phone number to international format (E.164)
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('966')) {
    cleaned = '966' + cleaned;
  }
  
  return '+' + cleaned;
}

// Send SMS via Twilio API
async function sendSMSTwilio(phone: string, message: string): Promise<SMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_SENDER_ID) {
    console.error('Twilio credentials are not configured');
    return { success: false, error: 'Twilio credentials not configured', provider: 'twilio' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`[Twilio] Sending SMS to ${formattedPhone} from ${TWILIO_SENDER_ID}`);
    
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
          From: TWILIO_SENDER_ID,
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

// Check if SMS is enabled
async function isSMSEnabled(): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_notifications_enabled')
      .single();

    return settings?.value !== 'false';
  } catch (error) {
    console.error('Error checking SMS enabled status:', error);
    return true; // Default to enabled
  }
}

// Main function to send SMS using Twilio
export async function sendSMS(
  phone: string, 
  message: string,
  type: string = 'notification',
  userId?: string,
  referenceId?: string
): Promise<SMSResult> {
  if (!phone) {
    return { success: false, error: 'Phone number is required', provider: 'none' };
  }

  // Check if SMS is enabled
  const enabled = await isSMSEnabled();
  if (!enabled) {
    console.log('SMS notifications are disabled');
    return { success: false, error: 'SMS notifications are disabled', provider: 'none' };
  }

  console.log(`Sending SMS via Twilio to ${phone}`);

  // Send via Twilio
  const result = await sendSMSTwilio(phone, message);

  // Log to database
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('sms_logs').insert({
      phone,
      message,
      type,
      status: result.success ? 'sent' : 'failed',
      user_id: userId || null,
      reference_id: referenceId || null,
      error_message: result.error || null,
      provider: 'twilio',
      external_id: result.messageId || null,
    });
  } catch (err) {
    console.error('Error logging SMS:', err);
  }

  return result;
}
