// Shared SMS helper for all edge functions
// This helper reads the SMS configuration and sends via MessageBird

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MESSAGEBIRD_API_KEY = Deno.env.get('MESSAGEBIRD_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SMSConfig {
  sender_name: string;
}

interface SMSResult {
  success: boolean;
  error?: string;
  provider: string;
}

// Format phone number to international format
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('966')) {
    cleaned = '966' + cleaned;
  }
  
  return cleaned;
}

// Send SMS via MessageBird API
async function sendSMSMessageBird(phone: string, message: string, senderName: string): Promise<SMSResult> {
  if (!MESSAGEBIRD_API_KEY) {
    console.error('MESSAGEBIRD_API_KEY is not configured');
    return { success: false, error: 'MessageBird API key not configured', provider: 'messagebird' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`[MessageBird] Sending SMS to ${formattedPhone}`);
    
    const response = await fetch('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `AccessKey ${MESSAGEBIRD_API_KEY}`,
      },
      body: JSON.stringify({
        originator: senderName || 'MaxioCore',
        recipients: [formattedPhone],
        body: message,
      }),
    });

    const data = await response.json();
    console.log('[MessageBird] API response:', JSON.stringify(data));

    if (response.ok) {
      if (data.recipients?.totalSentCount > 0 || data.id) {
        return { success: true, provider: 'messagebird' };
      }
      const recipientError = data.recipients?.items?.[0]?.status;
      if (recipientError && recipientError !== 'sent' && recipientError !== 'delivered' && recipientError !== 'scheduled') {
        return { success: false, error: `Message status: ${recipientError}`, provider: 'messagebird' };
      }
      return { success: true, provider: 'messagebird' };
    } else {
      const errorMsg = data.errors?.[0]?.description || data.message || 'Failed to send SMS via MessageBird';
      return { success: false, error: errorMsg, provider: 'messagebird' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[MessageBird] Error sending SMS:', error);
    return { success: false, error: errorMessage, provider: 'messagebird' };
  }
}

// Get SMS configuration from database
async function getSMSConfig(): Promise<SMSConfig> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { data: smsConfig } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_config')
      .single();

    if (smsConfig?.value) {
      return {
        sender_name: smsConfig.value.sender_name || 'MaxioCore',
      };
    }
  } catch (error) {
    console.error('Error fetching SMS config:', error);
  }

  return {
    sender_name: 'MaxioCore',
  };
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

// Main function to send SMS using MessageBird
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

  // Get configuration
  const config = await getSMSConfig();
  console.log(`Sending SMS via MessageBird to ${phone}`);

  // Send via MessageBird
  const result = await sendSMSMessageBird(phone, message, config.sender_name);

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
    });
  } catch (err) {
    console.error('Error logging SMS:', err);
  }

  return result;
}
