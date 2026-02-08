/**
 * WhatsApp Provider Module for ASH HOLDING
 * Using SmartWats API v1.3
 * 
 * Features:
 * - Retry mechanism with exponential backoff
 * - Error classification (network/token/number)
 * - Rate limiting support
 * - Professional Arabic banking-style messages
 * - Deep link support for status tracking
 * - Template-based financing messages
 */

import {
  TEMPLATES_REGISTRY,
  buildMessage,
  generateDeepLink,
  formatDateArabic,
  formatAmount,
  type TemplateVariables,
  type WhatsAppTemplate,
} from './whatsapp-templates.ts';

// Re-export template utilities
export { 
  TEMPLATES_REGISTRY, 
  buildMessage, 
  generateDeepLink, 
  formatDateArabic, 
  formatAmount 
};
export type { TemplateVariables, WhatsAppTemplate };

// ============================================================================
// CONFIGURATION & TYPES
// ============================================================================

const SMARTWATS_BASE_URL = 'https://app.smartwats.com/api';
const SMARTWATS_INSTANCE_ID = Deno.env.get('SMARTWATS_INSTANCE_ID');
const SMARTWATS_ACCESS_TOKEN = Deno.env.get('SMARTWATS_ACCESS_TOKEN');
// استخدام الرابط الرسمي للموقع - لا نكشف روابط Supabase الداخلية
const BASE_URL = 'https://ashholding.com';

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;

// Error classification
export enum WhatsAppErrorType {
  NETWORK = 'NETWORK_ERROR',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_NUMBER = 'INVALID_NUMBER',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN_ERROR',
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND'
}

export interface WhatsAppError {
  type: WhatsAppErrorType;
  message: string;
  retryable: boolean;
  originalError?: unknown;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: WhatsAppError;
  attempts: number;
  timestamp: string;
}

export interface WhatsAppMessageMeta {
  type?: 'order' | 'financing' | 'deposit' | 'ticket' | 'balance' | 'auth' | 'general';
  referenceId?: string;
  priority?: 'high' | 'normal' | 'low';
  skipRateLimit?: boolean;
}

export interface TemplateStatusParams {
  status: string;
  applicationNumber?: string;
  orderNumber?: string;
  amount?: number;
  customerName?: string;
}

// Financing-specific params
export interface FinancingNotificationParams {
  status: string;
  customerName: string;
  applicationNumber: string;
  approvedAmount?: number;
  installmentsCount?: number;
  installmentAmount?: number;
  nextPaymentDate?: string;
  contractExpiry?: string;
  rejectionReason?: string;
  requiredDocuments?: string[];
  conditionsList?: string[];
}

// ============================================================================
// PHONE NUMBER UTILITIES
// ============================================================================

/**
 * Formats phone number to Saudi format (966XXXXXXXXX)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle various Saudi number formats
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

/**
 * Validates if a phone number is valid Saudi number
 */
export function isValidSaudiNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Saudi numbers: 966 + 5XXXXXXXX (9 digits starting with 5)
  return /^9665[0-9]{8}$/.test(formatted);
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

function classifyError(error: unknown, response?: Response, responseBody?: unknown): WhatsAppError {
  // Network errors
  if (error instanceof TypeError && String(error).includes('fetch')) {
    return {
      type: WhatsAppErrorType.NETWORK,
      message: 'فشل الاتصال بخدمة الرسائل',
      retryable: true,
      originalError: error
    };
  }

  // Check response status
  if (response) {
    if (response.status === 401 || response.status === 403) {
      return {
        type: WhatsAppErrorType.INVALID_TOKEN,
        message: 'خطأ في مصادقة خدمة الرسائل',
        retryable: false,
        originalError: responseBody
      };
    }
    
    if (response.status === 429) {
      return {
        type: WhatsAppErrorType.RATE_LIMITED,
        message: 'تم تجاوز الحد الأقصى للرسائل',
        retryable: true,
        originalError: responseBody
      };
    }
    
    if (response.status >= 500) {
      return {
        type: WhatsAppErrorType.SERVICE_UNAVAILABLE,
        message: 'خدمة الرسائل غير متاحة مؤقتاً',
        retryable: true,
        originalError: responseBody
      };
    }
  }

  // Check response body for specific errors
  if (responseBody && typeof responseBody === 'object') {
    const body = responseBody as Record<string, unknown>;
    const errorMsg = String(body.message || body.error || '').toLowerCase();
    
    if (errorMsg.includes('invalid number') || errorMsg.includes('number not found')) {
      return {
        type: WhatsAppErrorType.INVALID_NUMBER,
        message: 'رقم الجوال غير صالح',
        retryable: false,
        originalError: responseBody
      };
    }
    
    if (errorMsg.includes('token') || errorMsg.includes('auth') || errorMsg.includes('credential')) {
      return {
        type: WhatsAppErrorType.INVALID_TOKEN,
        message: 'خطأ في مصادقة خدمة الرسائل',
        retryable: false,
        originalError: responseBody
      };
    }
  }

  return {
    type: WhatsAppErrorType.UNKNOWN,
    message: 'حدث خطأ غير متوقع',
    retryable: false,
    originalError: error
  };
}

// ============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number): number {
  // Exponential backoff with jitter
  const exponentialDelay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
  return exponentialDelay + jitter;
}

// ============================================================================
// CORE SEND FUNCTION
// ============================================================================

/**
 * Core function to send text message via SmartWats API
 */
async function sendWithRetry(
  phone: string,
  message: string,
  meta: WhatsAppMessageMeta = {}
): Promise<WhatsAppSendResult> {
  // Check configuration
  if (!SMARTWATS_INSTANCE_ID || !SMARTWATS_ACCESS_TOKEN) {
    console.error('[WhatsApp] SmartWats credentials not configured');
    return {
      success: false,
      error: {
        type: WhatsAppErrorType.NOT_CONFIGURED,
        message: 'خدمة الرسائل غير مُعدة',
        retryable: false
      },
      attempts: 0,
      timestamp: new Date().toISOString()
    };
  }

  // Validate phone number
  const formattedPhone = formatPhoneNumber(phone);
  if (!isValidSaudiNumber(formattedPhone)) {
    console.warn(`[WhatsApp] Invalid Saudi number: ${phone} -> ${formattedPhone}`);
    return {
      success: false,
      error: {
        type: WhatsAppErrorType.INVALID_NUMBER,
        message: 'رقم الجوال غير صالح',
        retryable: false
      },
      attempts: 0,
      timestamp: new Date().toISOString()
    };
  }

  const payload = {
    number: formattedPhone,
    type: 'text',
    message: message,
    instance_id: SMARTWATS_INSTANCE_ID,
    access_token: SMARTWATS_ACCESS_TOKEN,
  };

  let lastError: WhatsAppError | undefined;
  let attempts = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    attempts = attempt + 1;
    
    try {
      console.log(`[WhatsApp] Attempt ${attempts}/${MAX_RETRIES + 1} - Sending to ${formattedPhone}`);
      
      const response = await fetch(`${SMARTWATS_BASE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log(`[WhatsApp] Response:`, JSON.stringify(result));

      // Check for success
      if (result.status === 'success' || result.status === true || response.ok) {
        console.log(`[WhatsApp] ✅ Message sent successfully`);
        return {
          success: true,
          messageId: result.id || result.message_id || result.msg_id,
          attempts,
          timestamp: new Date().toISOString()
        };
      }

      // Classify error
      lastError = classifyError(null, response, result);
      
      if (!lastError.retryable || attempt === MAX_RETRIES) {
        console.error(`[WhatsApp] ❌ Non-retryable error or max retries reached:`, lastError);
        break;
      }

      // Wait before retry
      const delay = calculateBackoff(attempt);
      console.log(`[WhatsApp] ⏳ Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);

    } catch (error) {
      lastError = classifyError(error);
      console.error(`[WhatsApp] Error on attempt ${attempts}:`, error);
      
      if (!lastError.retryable || attempt === MAX_RETRIES) {
        break;
      }

      const delay = calculateBackoff(attempt);
      console.log(`[WhatsApp] ⏳ Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// PUBLIC API - WHATSAPP PROVIDER MODULE
// ============================================================================

export const WhatsAppProvider = {
  /**
   * Send a text message
   */
  async sendText(
    to: string,
    message: string,
    meta: WhatsAppMessageMeta = {}
  ): Promise<WhatsAppSendResult> {
    console.log(`[WhatsApp] sendText called - to: ${to}, type: ${meta.type || 'general'}`);
    return sendWithRetry(to, message, meta);
  },

  /**
   * Send financing notification using template
   */
  async sendFinancingNotification(
    to: string,
    params: FinancingNotificationParams
  ): Promise<WhatsAppSendResult> {
    const { status, customerName, applicationNumber } = params;
    
    // Get template for this status
    const template = TEMPLATES_REGISTRY[status.toUpperCase()];
    
    if (!template) {
      console.warn(`[WhatsApp] No template found for status: ${status}`);
      return {
        success: false,
        error: {
          type: WhatsAppErrorType.TEMPLATE_NOT_FOUND,
          message: `قالب غير موجود للحالة: ${status}`,
          retryable: false
        },
        attempts: 0,
        timestamp: new Date().toISOString()
      };
    }

    // Build variables
    const variables: Partial<TemplateVariables> = {
      customer_name: customerName,
      application_number: applicationNumber,
      deep_link: generateDeepLink(BASE_URL, applicationNumber),
    };

    // Add optional variables
    if (params.approvedAmount) {
      variables.approved_amount = params.approvedAmount;
    }
    if (params.installmentsCount) {
      variables.installments_count = params.installmentsCount;
    }
    if (params.installmentAmount) {
      variables.installment_amount = params.installmentAmount;
    }
    if (params.nextPaymentDate) {
      variables.next_payment_date = formatDateArabic(params.nextPaymentDate);
    }
    if (params.contractExpiry) {
      variables.contract_expiry = formatDateArabic(params.contractExpiry);
    }
    if (params.rejectionReason) {
      variables.rejection_reason = params.rejectionReason;
    }
    if (params.requiredDocuments) {
      variables.required_documents = params.requiredDocuments;
    }

    // Build message from template
    const message = buildMessage(template, variables);
    
    console.log(`[WhatsApp] Sending financing notification - Status: ${status}, Application: ${applicationNumber}`);
    
    return sendWithRetry(to, message, { 
      type: 'financing',
      referenceId: applicationNumber,
      priority: 'high'
    });
  },

  /**
   * Send a status update with deep link (legacy support)
   */
  async sendTemplateStatus(
    to: string,
    params: TemplateStatusParams,
    deepLinkPath: string = '/dashboard'
  ): Promise<WhatsAppSendResult> {
    const { status, applicationNumber, orderNumber, amount, customerName } = params;
    
    // Use new template system for financing
    if (applicationNumber) {
      return this.sendFinancingNotification(to, {
        status,
        customerName: customerName || 'العميل الكريم',
        applicationNumber,
        approvedAmount: amount,
      });
    }
    
    // Build status message for orders
    let message: string;
    if (orderNumber) {
      message = buildOrderStatusMessage(orderNumber, status, deepLinkPath);
    } else {
      message = buildGenericStatusMessage(status, deepLinkPath);
    }
    
    return sendWithRetry(to, message, { 
      type: 'order',
      referenceId: orderNumber
    });
  },

  /**
   * Send OTP email fallback notice
   */
  async sendOTPEmailFallbackNotice(to: string): Promise<WhatsAppSendResult> {
    const message = `📧 *إشعار - رمز التحقق*
━━━━━━━━━━━━━━━━━━━━━

نظرًا لعدم توفر خدمة الواتساب حاليًا، تم إرسال رمز التحقق إلى بريدكم الإلكتروني المسجل.

💡 يرجى التحقق من صندوق الوارد (وربما مجلد الرسائل غير المرغوبة).

━━━━━━━━━━━━━━━━━━━━━
_ASH HOLDING_`;
    
    return sendWithRetry(to, message, { type: 'auth' });
  },

  /**
   * Send welcome message for new users
   */
  async sendWelcome(to: string, customerName?: string): Promise<WhatsAppSendResult> {
    const message = `مرحباً بك في ASH HOLDING 🎉
━━━━━━━━━━━━━━━━━━━━━

${customerName ? `أهلاً *${customerName}*!\n` : ''}نحن سعداء بانضمامك إلينا.

🚀 *ابدأ الآن واستفد من خدماتنا:*
• خدمات سوشيال ميديا احترافية
• تمويل الخدمات (رصيد داخل المنصة)
• دعم فني على مدار الساعة

🔗 استكشف المنصة:
${BASE_URL}/dashboard

━━━━━━━━━━━━━━━━━━━━━
_شركة علي صالح الشهري القابضة_
_ASH HOLDING - شريكك التقني_`;
    
    return sendWithRetry(to, message, { type: 'general' });
  },

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(
    to: string,
    params: {
      customerName: string;
      installmentAmount: number;
      dueDate: string;
      applicationNumber: string;
    }
  ): Promise<WhatsAppSendResult> {
    return this.sendFinancingNotification(to, {
      status: 'PAYMENT_DUE',
      customerName: params.customerName,
      applicationNumber: params.applicationNumber,
      installmentAmount: params.installmentAmount,
      nextPaymentDate: params.dueDate,
    });
  },

  /**
   * Send payment overdue notice
   */
  async sendPaymentOverdue(
    to: string,
    params: {
      customerName: string;
      installmentAmount: number;
      dueDate: string;
      applicationNumber: string;
    }
  ): Promise<WhatsAppSendResult> {
    return this.sendFinancingNotification(to, {
      status: 'PAYMENT_OVERDUE',
      customerName: params.customerName,
      applicationNumber: params.applicationNumber,
      installmentAmount: params.installmentAmount,
      nextPaymentDate: params.dueDate,
    });
  },

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!(SMARTWATS_INSTANCE_ID && SMARTWATS_ACCESS_TOKEN);
  },

  /**
   * Validate a phone number
   */
  validateNumber(phone: string): { valid: boolean; formatted: string } {
    const formatted = formatPhoneNumber(phone);
    return {
      valid: isValidSaudiNumber(formatted),
      formatted
    };
  },

  /**
   * Get available template statuses
   */
  getAvailableStatuses(): string[] {
    return Object.keys(TEMPLATES_REGISTRY);
  }
};

// ============================================================================
// MESSAGE BUILDERS - PROFESSIONAL ARABIC BANKING STYLE
// ============================================================================

function buildFinancingStatusMessage(
  applicationNumber: string,
  status: string,
  amount?: number,
  customerName?: string,
  deepLinkPath: string = '/dashboard/financing'
): string {
  // Status mapping - Professional Arabic
  const statusMap: Record<string, { emoji: string; ar: string; desc: string }> = {
    'SUBMITTED': { emoji: '📋', ar: 'تم استلام الطلب', desc: 'سيتم مراجعة طلبكم خلال 1-3 أيام عمل' },
    'UNDER_REVIEW': { emoji: '🔍', ar: 'قيد المراجعة', desc: 'فريقنا يدرس طلبكم حالياً' },
    'ADDITIONAL_INFO_REQUIRED': { emoji: '⚠️', ar: 'مطلوب مستندات', desc: 'يرجى رفع المستندات الإضافية' },
    'APPROVED': { emoji: '✅', ar: 'تمت الموافقة', desc: 'الخطوة التالية: توقيع العقد' },
    'APPROVED_WITH_LIMITS': { emoji: '✅', ar: 'موافقة بقيمة معدّلة', desc: 'تمت الموافقة بقيمة معدّلة' },
    'CONTRACT_PRESENTED': { emoji: '📄', ar: 'العقد جاهز', desc: 'يرجى مراجعة العقد والتوقيع' },
    'CONTRACT_ACCEPTED': { emoji: '✍️', ar: 'تم توقيع العقد', desc: 'الخطوة التالية: توقيع السند لأمر' },
    'PROMISSORY_SIGNED': { emoji: '📝', ar: 'تم توقيع السند', desc: 'جارٍ اعتماد العقد' },
    'CONTRACT_FINALIZED': { emoji: '🏛️', ar: 'تم اعتماد العقد', desc: 'جارٍ إضافة رصيد الخدمات' },
    'CREDIT_DEPOSITED': { emoji: '💎', ar: 'تم الإيداع', desc: 'رصيد الخدمات متاح الآن!' },
    'COMPLETED': { emoji: '🏆', ar: 'سداد كامل', desc: 'شكرًا لالتزامكم' },
    'DECLINED': { emoji: '❌', ar: 'لم تتم الموافقة', desc: 'يمكنكم المحاولة لاحقاً' },
    'CANCELLED': { emoji: '🚫', ar: 'ملغي', desc: 'تم إلغاء الطلب' },
    'EXPIRED': { emoji: '⏰', ar: 'منتهي الصلاحية', desc: 'يمكنكم تقديم طلب جديد' }
  };

  const info = statusMap[status] || { emoji: '📋', ar: status, desc: '' };

  return `${info.emoji} *إشعار تمويل الخدمات*
━━━━━━━━━━━━━━━━━━━━━

${customerName ? `👤 العميل الكريم: *${customerName}*\n` : ''}
📋 *رقم الطلب:* ${applicationNumber}
📊 *الحالة:* ${info.ar}
${amount ? `💰 *المبلغ:* ${amount.toLocaleString('ar-SA')} ريال\n` : ''}
📝 ${info.desc}

━━━━━━━━━━━━━━━━━━━━━
🔗 *متابعة الطلب:*
ashholding.com${deepLinkPath}

📞 الدعم: متاح على مدار الساعة

_شركة علي صالح الشهري القابضة - ASH HOLDING_`;
}

function buildOrderStatusMessage(
  orderNumber: string,
  status: string,
  deepLinkPath: string = '/dashboard/orders'
): string {
  const statusMap: Record<string, { emoji: string; ar: string }> = {
    'pending': { emoji: '⏳', ar: 'قيد الانتظار' },
    'confirmed': { emoji: '✅', ar: 'تم التأكيد' },
    'processing': { emoji: '⚙️', ar: 'قيد المعالجة' },
    'in_progress': { emoji: '🔄', ar: 'قيد التنفيذ' },
    'completed': { emoji: '🎉', ar: 'مكتمل' },
    'partial': { emoji: '📊', ar: 'مكتمل جزئياً' },
    'cancelled': { emoji: '❌', ar: 'ملغي' },
    'refunded': { emoji: '💰', ar: 'مسترد' }
  };

  const info = statusMap[status] || { emoji: '📦', ar: status };

  return `${info.emoji} *تحديث حالة الطلب*
━━━━━━━━━━━━━━━━━━━━━

📋 *رقم الطلب:* ${orderNumber}
📊 *الحالة:* ${info.ar}

━━━━━━━━━━━━━━━━━━━━━
🔗 *تتبع الطلب:*
ashholding.com${deepLinkPath}

_ASH HOLDING_`;
}

function buildGenericStatusMessage(
  status: string,
  deepLinkPath: string = '/dashboard'
): string {
  return `📋 *تحديث الحالة*
━━━━━━━━━━━━━━━━━━━━━

📊 الحالة: *${status}*

━━━━━━━━━━━━━━━━━━━━━
🔗 *التفاصيل:*
ashholding.com${deepLinkPath}

_ASH HOLDING_`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default WhatsAppProvider;
