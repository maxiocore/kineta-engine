/**
 * WhatsApp Integration Module for MaxioCore
 * Frontend utilities for WhatsApp notifications
 */

export * from './types';

// Phone number utilities (matching backend)
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('00966')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('+966')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  } else if (!cleaned.startsWith('966') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }
  
  return cleaned;
}

export function isValidSaudiNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return /^9665[0-9]{8}$/.test(formatted);
}

// Display helpers
export function formatPhoneForDisplay(phone: string): string {
  const formatted = formatPhoneNumber(phone);
  if (formatted.length === 12 && formatted.startsWith('966')) {
    // Format: +966 5X XXX XXXX
    return `+${formatted.slice(0, 3)} ${formatted.slice(3, 5)} ${formatted.slice(5, 8)} ${formatted.slice(8)}`;
  }
  return phone;
}

// Error message helpers
export function getErrorMessageAr(errorType: string): string {
  const messages: Record<string, string> = {
    NETWORK_ERROR: 'فشل الاتصال بخدمة الرسائل، يرجى المحاولة لاحقاً',
    INVALID_TOKEN: 'خطأ في إعدادات خدمة الرسائل',
    INVALID_NUMBER: 'رقم الجوال غير صالح',
    RATE_LIMITED: 'تم تجاوز الحد الأقصى للرسائل، يرجى الانتظار',
    SERVICE_UNAVAILABLE: 'خدمة الرسائل غير متاحة مؤقتاً',
    NOT_CONFIGURED: 'خدمة الرسائل غير مُعدة',
    UNKNOWN_ERROR: 'حدث خطأ غير متوقع'
  };
  
  return messages[errorType] || messages.UNKNOWN_ERROR;
}

// Status badge helpers
export function getStatusBadge(status: string): { color: string; text: string } {
  const badges: Record<string, { color: string; text: string }> = {
    sent: { color: 'bg-green-500', text: 'تم الإرسال' },
    failed: { color: 'bg-red-500', text: 'فشل الإرسال' },
    pending: { color: 'bg-yellow-500', text: 'قيد الإرسال' }
  };
  
  return badges[status] || { color: 'bg-gray-500', text: status };
}
