// Shared SMS helper for all edge functions
// This helper reads the SMS configuration and sends via the configured provider

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTHENTICA_API_KEY = Deno.env.get('AUTHENTICA_API_KEY');
const INFOBIP_API_KEY = Deno.env.get('INFOBIP_API_KEY');
const INFOBIP_BASE_URL = Deno.env.get('INFOBIP_BASE_URL');
const MESSAGEBIRD_API_KEY = Deno.env.get('MESSAGEBIRD_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SMSConfig {
  provider: 'authentica' | 'infobip' | 'messagebird';
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

// Send SMS via Authentica API
async function sendSMSAuthentica(phone: string, message: string, senderName: string): Promise<SMSResult> {
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
async function sendSMSInfobip(phone: string, message: string, senderName: string): Promise<SMSResult> {
  if (!INFOBIP_API_KEY || !INFOBIP_BASE_URL) {
    console.error('INFOBIP_API_KEY or INFOBIP_BASE_URL is not configured');
    return { success: false, error: 'Infobip API credentials not configured', provider: 'infobip' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`[Infobip] Sending SMS to ${formattedPhone}`);
    
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
            destinations: [{ to: formattedPhone }],
            content: { text: message }
          }
        ]
      }),
    });

    const data = await response.json();
    console.log('[Infobip] API response:', JSON.stringify(data));

    if (response.ok) {
      const messageStatus = data?.messages?.[0]?.status;
      if (messageStatus?.groupId === 1 || messageStatus?.groupName === 'PENDING' ||
          messageStatus?.groupId === 3 || messageStatus?.groupName === 'DELIVERED') {
        return { success: true, provider: 'infobip' };
      } else if (messageStatus?.groupId === 4 || messageStatus?.groupId === 5) {
        return { success: false, error: `Message ${messageStatus?.groupName}: ${messageStatus?.description}`, provider: 'infobip' };
      }
      return { success: true, provider: 'infobip' };
    } else {
      const errorMsg = data?.requestError?.serviceException?.text || data?.message || 'Failed to send SMS via Infobip';
      return { success: false, error: errorMsg, provider: 'infobip' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Infobip] Error sending SMS:', error);
    return { success: false, error: errorMessage, provider: 'infobip' };
  }
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
        provider: smsConfig.value.provider || 'messagebird',
        sender_name: smsConfig.value.sender_name || 'MaxioCore',
      };
    }
  } catch (error) {
    console.error('Error fetching SMS config:', error);
  }

  return {
    provider: 'messagebird',
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

// Main function to send SMS using configured provider
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
  console.log(`Sending SMS via ${config.provider} to ${phone}`);

  // Send via configured provider
  let result: SMSResult;
  if (config.provider === 'infobip') {
    result = await sendSMSInfobip(phone, message, config.sender_name);
  } else if (config.provider === 'messagebird') {
    result = await sendSMSMessageBird(phone, message, config.sender_name);
  } else {
    result = await sendSMSAuthentica(phone, message, config.sender_name);
  }

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
      provider: result.provider,
    });
  } catch (err) {
    console.error('Error logging SMS:', err);
  }

  return result;
}
