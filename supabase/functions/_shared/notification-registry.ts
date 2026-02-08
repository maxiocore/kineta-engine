/**
 * Unified Notification Registry - سجل الإشعارات الموحد
 * ASH HOLDING Banking-Grade Notification System
 * 
 * Coverage Matrix:
 * - Auth Events: 8 notifications
 * - Financing Events: 13 notifications
 * - Wallet Events: 4 notifications
 * 
 * Channels:
 * - Email (primary)
 * - SMS via Msegat (real-time alerts)
 * - WhatsApp (non-sensitive alerts)
 * 
 * Features:
 * - Rate limiting per event type
 * - Idempotency with event hashing
 * - Multi-channel support (Email + SMS + WhatsApp)
 * - Arabic RTL templates
 * - Audit logging
 */

// ═══════════════════════════════════════════════════════════════
// EVENT TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type AuthEventType = 
  | 'EMAIL_VERIFICATION_SENT'
  | 'EMAIL_VERIFIED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED_REPEATED'
  | 'ACCOUNT_LOCKED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'PASSWORD_CHANGED';

export type FinancingEventType =
  | 'FIN_SUBMITTED'
  | 'FIN_UNDER_REVIEW'
  | 'FIN_ADDITIONAL_INFO_REQUIRED'
  | 'FIN_CONTRACT_PRESENTED'
  | 'FIN_CONTRACT_ACCEPTED'
  | 'FIN_CONTRACT_FINALIZED'
  | 'FIN_APPROVED'
  | 'FIN_APPROVED_WITH_LIMITS'
  | 'FIN_DECLINED'
  | 'FIN_CREDIT_DEPOSITED'
  | 'FIN_CANCELLED'
  | 'FIN_EXPIRED';

export type WalletEventType =
  | 'WALLET_CREDITED'
  | 'WALLET_DEBITED'
  | 'WALLET_INSUFFICIENT'
  | 'WALLET_SUSPENDED';

export type NotificationEventType = AuthEventType | FinancingEventType | WalletEventType;

// ═══════════════════════════════════════════════════════════════
// CHANNEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export interface NotificationChannel {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push?: boolean;
}

export interface NotificationConfig {
  eventType: NotificationEventType;
  channels: NotificationChannel;
  emailTemplateId: string;
  smsTemplateId?: string;
  whatsappTemplateId?: string;
  rateLimitMinutes: number;
  priority: 'high' | 'normal' | 'low';
  isSecurityEvent: boolean;
  requiresEmailOnly: boolean; // For sensitive events like OTP
  description: string;
  description_ar: string;
  smsMessage_ar?: string; // Short SMS message template
}

// ═══════════════════════════════════════════════════════════════
// SMS MESSAGE TEMPLATES (Arabic, concise for SMS)
// ═══════════════════════════════════════════════════════════════

export const SMS_TEMPLATES: Record<NotificationEventType, string> = {
  // Auth Events
  'EMAIL_VERIFICATION_SENT': 'ASH HOLDING: تم إرسال رمز تأكيد البريد الإلكتروني. يرجى التحقق من بريدك.',
  'EMAIL_VERIFIED': 'ASH HOLDING: تم تأكيد بريدك الإلكتروني بنجاح. مرحباً بك!',
  'LOGIN_SUCCESS': 'ASH HOLDING: تم تسجيل دخول جديد لحسابك. إذا لم يكن أنت، يرجى تغيير كلمة المرور فوراً.',
  'LOGIN_FAILED_REPEATED': 'ASH HOLDING: تحذير أمني - محاولات دخول فاشلة متكررة على حسابك.',
  'ACCOUNT_LOCKED': 'ASH HOLDING: تم قفل حسابك مؤقتاً بسبب محاولات دخول فاشلة متكررة.',
  'PASSWORD_RESET_REQUESTED': 'ASH HOLDING: تم طلب استعادة كلمة المرور. تحقق من بريدك الإلكتروني.',
  'PASSWORD_RESET_COMPLETED': 'ASH HOLDING: تم إعادة تعيين كلمة المرور بنجاح.',
  'PASSWORD_CHANGED': 'ASH HOLDING: تم تغيير كلمة المرور بنجاح. إذا لم يكن أنت، تواصل معنا فوراً.',
  
  // Financing Events
  'FIN_SUBMITTED': 'ASH HOLDING: تم استلام طلب التمويل بنجاح وسيتم مراجعته قريباً.',
  'FIN_UNDER_REVIEW': 'ASH HOLDING: طلب التمويل الخاص بك قيد المراجعة حالياً.',
  'FIN_ADDITIONAL_INFO_REQUIRED': 'ASH HOLDING: مطلوب مستندات إضافية لطلب التمويل. يرجى الدخول للمنصة.',
  'FIN_CONTRACT_PRESENTED': 'ASH HOLDING: العقد جاهز للمراجعة والتوقيع. يرجى الدخول للمنصة.',
  'FIN_CONTRACT_ACCEPTED': 'ASH HOLDING: تم قبول العقد بنجاح. شكراً لثقتكم.',
  'FIN_CONTRACT_FINALIZED': 'ASH HOLDING: تم اعتماد العقد نهائياً. سيتم إيداع المبلغ قريباً.',
  'FIN_APPROVED': 'ASH HOLDING: تمت الموافقة على طلب التمويل! يرجى مراجعة التفاصيل في المنصة.',
  'FIN_APPROVED_WITH_LIMITS': 'ASH HOLDING: تمت الموافقة المشروطة على التمويل. راجع التفاصيل في المنصة.',
  'FIN_DECLINED': 'ASH HOLDING: نأسف، لم تتم الموافقة على طلب التمويل. يمكنك التقديم مجدداً لاحقاً.',
  'FIN_CREDIT_DEPOSITED': 'ASH HOLDING: تم إيداع رصيد الخدمات في حسابك بنجاح!',
  'FIN_CANCELLED': 'ASH HOLDING: تم إلغاء طلب التمويل.',
  'FIN_EXPIRED': 'ASH HOLDING: انتهت صلاحية طلب التمويل. يمكنك التقديم مجدداً.',
  
  // Wallet Events
  'WALLET_CREDITED': 'ASH HOLDING: تم إضافة رصيد لمحفظتك بنجاح.',
  'WALLET_DEBITED': 'ASH HOLDING: تم خصم مبلغ من محفظتك.',
  'WALLET_INSUFFICIENT': 'ASH HOLDING: رصيد المحفظة غير كافي لإتمام العملية.',
  'WALLET_SUSPENDED': 'ASH HOLDING: تم تعليق محفظتك. يرجى التواصل مع الدعم.',
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION REGISTRY
// ═══════════════════════════════════════════════════════════════

export const NOTIFICATION_REGISTRY: Record<NotificationEventType, NotificationConfig> = {
  // ─────────────────────────────────────────────────────────────
  // AUTH EVENTS
  // ─────────────────────────────────────────────────────────────
  'EMAIL_VERIFICATION_SENT': {
    eventType: 'EMAIL_VERIFICATION_SENT',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'auth_email_verification',
    smsTemplateId: 'auth_verification',
    whatsappTemplateId: 'auth_verification_reminder',
    rateLimitMinutes: 5,
    priority: 'high',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Email verification link sent',
    description_ar: 'تم إرسال رابط تأكيد البريد'
  },

  'EMAIL_VERIFIED': {
    eventType: 'EMAIL_VERIFIED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'auth_email_verified',
    smsTemplateId: 'auth_welcome',
    whatsappTemplateId: 'auth_welcome',
    rateLimitMinutes: 60,
    priority: 'normal',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Email verified successfully',
    description_ar: 'تم تأكيد البريد الإلكتروني بنجاح'
  },

  'LOGIN_SUCCESS': {
    eventType: 'LOGIN_SUCCESS',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'auth_login_success',
    smsTemplateId: 'auth_login_alert',
    whatsappTemplateId: 'auth_login_alert',
    rateLimitMinutes: 30,
    priority: 'normal',
    isSecurityEvent: true,
    requiresEmailOnly: false,
    description: 'Successful login notification',
    description_ar: 'إشعار تسجيل دخول ناجح'
  },

  'LOGIN_FAILED_REPEATED': {
    eventType: 'LOGIN_FAILED_REPEATED',
    channels: { email: true, sms: true, whatsapp: false },
    emailTemplateId: 'auth_login_failed',
    smsTemplateId: 'auth_login_failed',
    rateLimitMinutes: 15,
    priority: 'high',
    isSecurityEvent: true,
    requiresEmailOnly: false,
    description: 'Multiple failed login attempts',
    description_ar: 'محاولات دخول فاشلة متكررة'
  },

  'ACCOUNT_LOCKED': {
    eventType: 'ACCOUNT_LOCKED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'auth_account_locked',
    smsTemplateId: 'auth_locked',
    whatsappTemplateId: 'auth_locked_alert',
    rateLimitMinutes: 30,
    priority: 'high',
    isSecurityEvent: true,
    requiresEmailOnly: false,
    description: 'Account locked due to failed attempts',
    description_ar: 'تم قفل الحساب بسبب المحاولات الفاشلة'
  },

  'PASSWORD_RESET_REQUESTED': {
    eventType: 'PASSWORD_RESET_REQUESTED',
    channels: { email: true, sms: true, whatsapp: false },
    emailTemplateId: 'auth_password_reset',
    smsTemplateId: 'auth_password_reset',
    rateLimitMinutes: 5,
    priority: 'high',
    isSecurityEvent: true,
    requiresEmailOnly: true, // NEVER send reset links via SMS/WhatsApp
    description: 'Password reset link sent',
    description_ar: 'تم إرسال رابط استعادة كلمة المرور'
  },

  'PASSWORD_RESET_COMPLETED': {
    eventType: 'PASSWORD_RESET_COMPLETED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'auth_password_reset_complete',
    smsTemplateId: 'auth_password_changed',
    whatsappTemplateId: 'auth_password_changed',
    rateLimitMinutes: 0,
    priority: 'high',
    isSecurityEvent: true,
    requiresEmailOnly: false,
    description: 'Password was reset',
    description_ar: 'تم إعادة تعيين كلمة المرور'
  },

  'PASSWORD_CHANGED': {
    eventType: 'PASSWORD_CHANGED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'auth_password_changed',
    smsTemplateId: 'auth_password_changed',
    whatsappTemplateId: 'auth_password_changed',
    rateLimitMinutes: 0,
    priority: 'high',
    isSecurityEvent: true,
    requiresEmailOnly: false,
    description: 'Password was changed',
    description_ar: 'تم تغيير كلمة المرور'
  },

  // ─────────────────────────────────────────────────────────────
  // FINANCING EVENTS
  // ─────────────────────────────────────────────────────────────
  'FIN_SUBMITTED': {
    eventType: 'FIN_SUBMITTED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'financing_submitted',
    smsTemplateId: 'financing_submitted',
    whatsappTemplateId: 'financing_submitted',
    rateLimitMinutes: 60,
    priority: 'normal',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Financing application submitted',
    description_ar: 'تم تقديم طلب التمويل'
  },

  'FIN_UNDER_REVIEW': {
    eventType: 'FIN_UNDER_REVIEW',
    channels: { email: true, sms: true, whatsapp: false },
    emailTemplateId: 'financing_under_review',
    smsTemplateId: 'financing_under_review',
    rateLimitMinutes: 60,
    priority: 'low',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Application under review',
    description_ar: 'الطلب قيد المراجعة'
  },

  'FIN_ADDITIONAL_INFO_REQUIRED': {
    eventType: 'FIN_ADDITIONAL_INFO_REQUIRED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'financing_docs_required',
    smsTemplateId: 'financing_docs_required',
    whatsappTemplateId: 'financing_docs_required',
    rateLimitMinutes: 30,
    priority: 'high',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Additional documents required',
    description_ar: 'مطلوب مستندات إضافية'
  },

  'FIN_CONTRACT_PRESENTED': {
    eventType: 'FIN_CONTRACT_PRESENTED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'financing_contract_ready',
    smsTemplateId: 'financing_contract_ready',
    whatsappTemplateId: 'financing_contract_ready',
    rateLimitMinutes: 60,
    priority: 'high',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Contract ready for review',
    description_ar: 'العقد جاهز للمراجعة'
  },

  'FIN_CONTRACT_ACCEPTED': {
    eventType: 'FIN_CONTRACT_ACCEPTED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'financing_contract_accepted',
    smsTemplateId: 'financing_contract_accepted',
    whatsappTemplateId: 'financing_contract_accepted',
    rateLimitMinutes: 60,
    priority: 'normal',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Contract accepted',
    description_ar: 'تم قبول العقد'
  },

  'FIN_CONTRACT_FINALIZED': {
    eventType: 'FIN_CONTRACT_FINALIZED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'financing_contract_finalized',
    smsTemplateId: 'financing_contract_finalized',
    whatsappTemplateId: 'financing_contract_finalized',
    rateLimitMinutes: 60,
    priority: 'high',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Contract finalized',
    description_ar: 'تم اعتماد العقد'
  },

  'FIN_APPROVED': {
    eventType: 'FIN_APPROVED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'financing_approved',
    smsTemplateId: 'financing_approved',
    whatsappTemplateId: 'financing_approved',
    rateLimitMinutes: 60,
    priority: 'high',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Application approved',
    description_ar: 'تمت الموافقة على الطلب'
  },

  'FIN_APPROVED_WITH_LIMITS': {
    eventType: 'FIN_APPROVED_WITH_LIMITS',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'financing_approved_conditional',
    smsTemplateId: 'financing_approved_conditional',
    whatsappTemplateId: 'financing_approved_conditional',
    rateLimitMinutes: 60,
    priority: 'high',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Application approved with conditions',
    description_ar: 'تمت الموافقة المشروطة'
  },

  'FIN_DECLINED': {
    eventType: 'FIN_DECLINED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'financing_rejected',
    smsTemplateId: 'financing_rejected',
    whatsappTemplateId: 'financing_rejected',
    rateLimitMinutes: 60,
    priority: 'high',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Application declined',
    description_ar: 'تم رفض الطلب'
  },

  'FIN_CREDIT_DEPOSITED': {
    eventType: 'FIN_CREDIT_DEPOSITED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'financing_credit_deposited',
    smsTemplateId: 'financing_credit_deposited',
    whatsappTemplateId: 'financing_credit_deposited',
    rateLimitMinutes: 0,
    priority: 'high',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Service credit deposited',
    description_ar: 'تم إضافة رصيد الخدمات'
  },

  'FIN_CANCELLED': {
    eventType: 'FIN_CANCELLED',
    channels: { email: true, sms: true, whatsapp: false },
    emailTemplateId: 'financing_cancelled',
    smsTemplateId: 'financing_cancelled',
    rateLimitMinutes: 60,
    priority: 'normal',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Application cancelled',
    description_ar: 'تم إلغاء الطلب'
  },

  'FIN_EXPIRED': {
    eventType: 'FIN_EXPIRED',
    channels: { email: true, sms: true, whatsapp: false },
    emailTemplateId: 'financing_expired',
    smsTemplateId: 'financing_expired',
    rateLimitMinutes: 60,
    priority: 'normal',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Application expired',
    description_ar: 'انتهت صلاحية الطلب'
  },

  // ─────────────────────────────────────────────────────────────
  // WALLET EVENTS
  // ─────────────────────────────────────────────────────────────
  'WALLET_CREDITED': {
    eventType: 'WALLET_CREDITED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'wallet_credited',
    smsTemplateId: 'wallet_credited',
    whatsappTemplateId: 'wallet_credited',
    rateLimitMinutes: 0,
    priority: 'high',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Wallet credited',
    description_ar: 'تم إضافة رصيد للمحفظة'
  },

  'WALLET_DEBITED': {
    eventType: 'WALLET_DEBITED',
    channels: { email: true, sms: true, whatsapp: false },
    emailTemplateId: 'wallet_debited',
    smsTemplateId: 'wallet_debited',
    rateLimitMinutes: 5,
    priority: 'normal',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Wallet debited',
    description_ar: 'تم خصم من المحفظة'
  },

  'WALLET_INSUFFICIENT': {
    eventType: 'WALLET_INSUFFICIENT',
    channels: { email: true, sms: false, whatsapp: false },
    emailTemplateId: 'wallet_insufficient',
    rateLimitMinutes: 60,
    priority: 'low',
    isSecurityEvent: false,
    requiresEmailOnly: false,
    description: 'Insufficient wallet balance',
    description_ar: 'رصيد غير كافي'
  },

  'WALLET_SUSPENDED': {
    eventType: 'WALLET_SUSPENDED',
    channels: { email: true, sms: true, whatsapp: true },
    emailTemplateId: 'wallet_suspended',
    smsTemplateId: 'wallet_suspended',
    whatsappTemplateId: 'wallet_suspended',
    rateLimitMinutes: 0,
    priority: 'high',
    isSecurityEvent: true,
    requiresEmailOnly: false,
    description: 'Wallet suspended',
    description_ar: 'تم تعليق المحفظة'
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get notification config by event type
 */
export function getNotificationConfig(eventType: NotificationEventType): NotificationConfig | null {
  return NOTIFICATION_REGISTRY[eventType] || null;
}

/**
 * Get SMS message for an event type
 */
export function getSMSMessage(eventType: NotificationEventType): string {
  return SMS_TEMPLATES[eventType] || '';
}

/**
 * Generate idempotency key for notification
 */
export function generateIdempotencyKey(
  eventType: NotificationEventType,
  userId: string,
  deviceFingerprint?: string,
  referenceId?: string
): string {
  const parts = [eventType, userId];
  if (deviceFingerprint) parts.push(deviceFingerprint);
  if (referenceId) parts.push(referenceId);
  parts.push(Math.floor(Date.now() / 60000).toString());
  return parts.join('_');
}

/**
 * Check if event should send notification based on rate limit
 */
export function shouldSendNotification(
  config: NotificationConfig,
  lastSentAt?: Date
): boolean {
  if (config.rateLimitMinutes === 0) return true;
  if (!lastSentAt) return true;
  
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSentAt.getTime()) / 60000;
  return diffMinutes >= config.rateLimitMinutes;
}

/**
 * Get all security events
 */
export function getSecurityEvents(): NotificationEventType[] {
  return Object.values(NOTIFICATION_REGISTRY)
    .filter(config => config.isSecurityEvent)
    .map(config => config.eventType);
}

/**
 * Get events by channel
 */
export function getEventsByChannel(channel: keyof NotificationChannel): NotificationEventType[] {
  return Object.values(NOTIFICATION_REGISTRY)
    .filter(config => config.channels[channel])
    .map(config => config.eventType);
}

/**
 * Coverage report for documentation
 */
export function getCoverageReport(): {
  total: number;
  byCategory: Record<string, number>;
  byChannel: Record<string, number>;
  securityEvents: number;
} {
  const all = Object.values(NOTIFICATION_REGISTRY);
  
  return {
    total: all.length,
    byCategory: {
      auth: all.filter(c => c.eventType.startsWith('EMAIL') || c.eventType.startsWith('LOGIN') || c.eventType.startsWith('ACCOUNT') || c.eventType.startsWith('PASSWORD')).length,
      financing: all.filter(c => c.eventType.startsWith('FIN_')).length,
      wallet: all.filter(c => c.eventType.startsWith('WALLET_')).length
    },
    byChannel: {
      email: all.filter(c => c.channels.email).length,
      sms: all.filter(c => c.channels.sms).length,
      whatsapp: all.filter(c => c.channels.whatsapp).length
    },
    securityEvents: all.filter(c => c.isSecurityEvent).length
  };
}
