// ============================================
// Shared SMS Helper - ASH HOLDING
// Powered by Msegat SMS Gateway (msegat.com)
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MSEGAT_USERNAME = Deno.env.get('MSEGAT_USERNAME');
const MSEGAT_API_KEY = Deno.env.get('MSEGAT_API_KEY');
const MSEGAT_SENDER_NAME = Deno.env.get('MSEGAT_SENDER_NAME') || 'ASH HOLDING';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Msegat API endpoints
const MSEGAT_SEND_URL = 'https://www.msegat.com/gw/sendsms.php';
const MSEGAT_SEND_OTP_URL = 'https://www.msegat.com/gw/sendOTPCode.php';
const MSEGAT_VERIFY_OTP_URL = 'https://www.msegat.com/gw/verifyOTPCode.php';
const MSEGAT_BALANCE_URL = 'https://www.msegat.com/gw/Credits.php';

// ============================================
// Types
// ============================================

interface SMSResult {
  success: boolean;
  error?: string;
  provider: string;
  messageId?: string;
}

interface OTPSendResult {
  success: boolean;
  error?: string;
  otpId?: number;
}

interface OTPVerifyResult {
  success: boolean;
  valid?: boolean;
  error?: string;
}

// ============================================
// Msegat Error Codes
// ============================================

const MSEGAT_ERROR_CODES: Record<string, string> = {
  '1': 'نجاح',
  'M0000': 'نجاح',
  'M0001': 'متغيرات مفقودة',
  'M0002': 'بيانات تسجيل دخول غير صالحة',
  '1010': 'متغيرات مفقودة',
  '1020': 'بيانات تسجيل دخول غير صالحة',
  '1050': 'نص الرسالة فارغ',
  '1060': 'الرصيد غير كافي',
  '1061': 'رسالة مكررة',
  '1064': 'محتوى OTP غير صالح',
  '1110': 'اسم المرسل مفقود أو غير صحيح',
  '1120': 'أرقام الجوال غير صحيحة',
  '1140': 'طول الرسالة طويل جداً',
  '400': 'انتهت صلاحية الرمز',
  '404': 'الرمز غير موجود',
  'M0008': 'بادئة رقم الجوال غير صحيحة',
  'M0029': 'اسم المرسل غير صالح',
  'M0037': 'يرجى الإرسال من IP ثابت',
  'M0090': 'الرسالة لا تتطابق مع أي قالب',
};

function getMsegatErrorMessage(code: string): string {
  return MSEGAT_ERROR_CODES[code] || `خطأ غير معروف (${code})`;
}

// ============================================
// Phone Number Formatting
// ============================================

/**
 * Format phone number to Saudi international format (without +)
 * Msegat requires format: 966xxxxxxxxx (no + prefix, no leading zeros)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading + if present (already cleaned but just in case)
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
 * Format phone number with + prefix for E.164
 */
export function formatPhoneE164(phone: string): string {
  return '+' + formatPhoneNumber(phone);
}

// ============================================
// SMS Sending via Msegat
// ============================================

/**
 * Send SMS via Msegat API
 */
async function sendSMSMsegat(phone: string, message: string): Promise<SMSResult> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[Msegat] Credentials are not configured');
    return { success: false, error: 'بيانات اعتماد Msegat غير مُعدّة', provider: 'msegat' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    console.log(`[Msegat] Sending SMS to ${formattedPhone} from ${MSEGAT_SENDER_NAME}`);
    
    const response = await fetch(MSEGAT_SEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName: MSEGAT_USERNAME,
        apiKey: MSEGAT_API_KEY,
        numbers: formattedPhone,
        userSender: MSEGAT_SENDER_NAME,
        msg: message,
        msgEncoding: 'UTF8',
        reqBulkId: 'true',
        reqDlr: 'true',
        By: 'ASH HOLDING',
      }),
    });

    const responseText = await response.text();
    console.log('[Msegat] Raw API response:', responseText);

    // Msegat returns various formats
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Response might be a simple string/number
      data = responseText.trim();
    }

    // Check for success - Msegat returns "1" or { code: "1" } or { code: "M0000" } on success
    const isSuccess = 
      data === '1' || 
      data === 1 ||
      data?.code === '1' || 
      data?.code === 'M0000' ||
      data?.message === 'Success';

    if (isSuccess) {
      const messageId = data?.id || data?.bulkId || String(Date.now());
      console.log(`[Msegat] SMS sent successfully. ID: ${messageId}`);
      return { success: true, provider: 'msegat', messageId: String(messageId) };
    } else {
      const errorCode = data?.code || data?.toString() || 'unknown';
      const errorMsg = getMsegatErrorMessage(String(errorCode));
      console.error(`[Msegat] Failed to send SMS. Code: ${errorCode}, Message: ${errorMsg}`);
      return { success: false, error: `${errorMsg} (${errorCode})`, provider: 'msegat' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Msegat] Error sending SMS:', error);
    return { success: false, error: errorMessage, provider: 'msegat' };
  }
}

// ============================================
// OTP Functions via Msegat
// ============================================

/**
 * Send OTP code via Msegat
 * Uses Msegat's built-in OTP service (sendOTPCode.php)
 */
export async function sendOTP(phone: string): Promise<OTPSendResult> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[Msegat OTP] Credentials are not configured');
    return { success: false, error: 'بيانات اعتماد Msegat غير مُعدّة' };
  }

  const formattedPhone = formatPhoneNumber(phone);

  try {
    console.log(`[Msegat OTP] Sending OTP to ${formattedPhone}`);

    const response = await fetch(MSEGAT_SEND_OTP_URL, {
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
    console.log('[Msegat OTP] Send response:', JSON.stringify(data));

    if (data.code === '1' || data.code === 'M0000' || data.message === 'Success') {
      console.log(`[Msegat OTP] OTP sent successfully. ID: ${data.id}`);
      return { success: true, otpId: data.id };
    } else {
      const errorMsg = getMsegatErrorMessage(String(data.code || ''));
      console.error(`[Msegat OTP] Failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Msegat OTP] Error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify OTP code via Msegat
 * Uses Msegat's built-in OTP verification (verifyOTPCode.php)
 */
export async function verifyOTP(code: string, otpId: number): Promise<OTPVerifyResult> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    console.error('[Msegat OTP] Credentials are not configured');
    return { success: false, error: 'بيانات اعتماد Msegat غير مُعدّة' };
  }

  try {
    console.log(`[Msegat OTP] Verifying code for OTP ID: ${otpId}`);

    const response = await fetch(MSEGAT_VERIFY_OTP_URL, {
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
    console.log('[Msegat OTP] Verify response:', JSON.stringify(data));

    if (data.code === '1' || data.code === 'M0000' || data.message === 'Success') {
      return { success: true, valid: true };
    } else {
      const errorMsg = getMsegatErrorMessage(String(data.code || ''));
      return { success: true, valid: false, error: errorMsg };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Msegat OTP] Error:', error);
    return { success: false, error: errorMessage };
  }
}

// ============================================
// Balance Check
// ============================================

/**
 * Check Msegat account balance
 */
export async function checkBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
  if (!MSEGAT_USERNAME || !MSEGAT_API_KEY) {
    return { success: false, error: 'بيانات اعتماد Msegat غير مُعدّة' };
  }

  try {
    const response = await fetch(MSEGAT_BALANCE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: MSEGAT_USERNAME,
        apiKey: MSEGAT_API_KEY,
        msgEncoding: 'UTF8',
      }),
    });

    const data = await response.json();
    
    if (data.userBalance !== undefined) {
      return { success: true, balance: Number(data.userBalance) };
    } else {
      return { success: false, error: data.error || 'فشل في استعلام الرصيد' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// ============================================
// SMS Enabled Check
// ============================================

async function isSMSEnabled(): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_notifications_enabled')
      .maybeSingle();

    return settings?.value !== 'false';
  } catch (error) {
    console.error('[Msegat] Error checking SMS enabled status:', error);
    return true; // Default to enabled
  }
}

// ============================================
// Main SMS Function
// ============================================

/**
 * Send SMS using Msegat - Main entry point for all edge functions
 */
export async function sendSMS(
  phone: string, 
  message: string,
  type: string = 'notification',
  userId?: string,
  referenceId?: string
): Promise<SMSResult> {
  if (!phone) {
    return { success: false, error: 'رقم الجوال مطلوب', provider: 'none' };
  }

  // Check if SMS is enabled
  const enabled = await isSMSEnabled();
  if (!enabled) {
    console.log('[Msegat] SMS notifications are disabled');
    return { success: false, error: 'إشعارات الرسائل النصية معطلة', provider: 'none' };
  }

  console.log(`[Msegat] Sending SMS to ${phone} | Type: ${type}`);

  // Send via Msegat
  const result = await sendSMSMsegat(phone, message);

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
      provider: 'msegat',
      external_id: result.messageId || null,
    });
  } catch (err) {
    console.error('[Msegat] Error logging SMS:', err);
  }

  return result;
}

/**
 * Send SMS with OTP for contract signing and verification
 * Uses Msegat's custom SMS (not the built-in OTP) for more control over message format
 */
export async function sendCustomOTP(
  phone: string,
  otp: string,
  message: string,
  type: string = 'otp',
  userId?: string,
  referenceId?: string
): Promise<SMSResult> {
  // For custom OTP, we embed the code in the message ourselves
  return sendSMS(phone, message, type, userId, referenceId);
}
