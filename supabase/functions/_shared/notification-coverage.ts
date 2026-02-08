/**
 * Notification Coverage Documentation
 * توثيق تغطية الإشعارات لجميع حالات النظام
 * 
 * This file documents the complete notification coverage matrix
 * for Auth, Financing, and Wallet states.
 */

import { 
  NOTIFICATION_REGISTRY, 
  getCoverageReport,
  type NotificationEventType 
} from './notification-registry.ts';

// ═══════════════════════════════════════════════════════════════
// COVERAGE MATRIX
// ═══════════════════════════════════════════════════════════════

export const COVERAGE_MATRIX: Record<NotificationEventType, {
  event: string;
  event_ar: string;
  email_template: string;
  whatsapp_template: string | null;
  channels: string[];
  priority: string;
  security: boolean;
  rate_limit_min: number;
  notes: string;
}> = {
  // ─────────────────────────────────────────────────────────────
  // AUTH EVENTS (8 total)
  // ─────────────────────────────────────────────────────────────
  'EMAIL_VERIFICATION_SENT': {
    event: 'Email Verification Sent',
    event_ar: 'تم إرسال رابط تأكيد البريد',
    email_template: 'auth_email_verification',
    whatsapp_template: 'auth_verification_reminder',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: false,
    rate_limit_min: 5,
    notes: 'Verification link in email only, WhatsApp just reminds to check email'
  },
  
  'EMAIL_VERIFIED': {
    event: 'Email Verified',
    event_ar: 'تم تأكيد البريد الإلكتروني',
    email_template: 'auth_email_verified',
    whatsapp_template: 'auth_welcome',
    channels: ['Email', 'WhatsApp'],
    priority: 'Normal',
    security: false,
    rate_limit_min: 60,
    notes: 'Welcome message after verification'
  },
  
  'LOGIN_SUCCESS': {
    event: 'Login Success',
    event_ar: 'تسجيل دخول ناجح',
    email_template: 'auth_login_success',
    whatsapp_template: 'auth_login_alert',
    channels: ['Email', 'WhatsApp'],
    priority: 'Normal',
    security: true,
    rate_limit_min: 30,
    notes: 'Security alert with device/location info, security link in email only'
  },
  
  'LOGIN_FAILED_REPEATED': {
    event: 'Repeated Login Failures',
    event_ar: 'محاولات دخول فاشلة متكررة',
    email_template: 'auth_login_failed',
    whatsapp_template: null,
    channels: ['Email'],
    priority: 'High',
    security: true,
    rate_limit_min: 15,
    notes: 'Email only - security sensitive'
  },
  
  'ACCOUNT_LOCKED': {
    event: 'Account Locked',
    event_ar: 'تم قفل الحساب',
    email_template: 'auth_account_locked',
    whatsapp_template: 'auth_locked_alert',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: true,
    rate_limit_min: 30,
    notes: 'WhatsApp notification without sensitive details'
  },
  
  'PASSWORD_RESET_REQUESTED': {
    event: 'Password Reset Requested',
    event_ar: 'طلب استعادة كلمة المرور',
    email_template: 'auth_password_reset',
    whatsapp_template: null,
    channels: ['Email'],
    priority: 'High',
    security: true,
    rate_limit_min: 5,
    notes: 'Email ONLY - NEVER send reset links via WhatsApp'
  },
  
  'PASSWORD_RESET_COMPLETED': {
    event: 'Password Reset Completed',
    event_ar: 'تم إعادة تعيين كلمة المرور',
    email_template: 'auth_password_reset_complete',
    whatsapp_template: 'auth_password_changed',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: true,
    rate_limit_min: 0,
    notes: 'Always send - critical security confirmation'
  },
  
  'PASSWORD_CHANGED': {
    event: 'Password Changed',
    event_ar: 'تم تغيير كلمة المرور',
    email_template: 'auth_password_changed',
    whatsapp_template: 'auth_password_changed',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: true,
    rate_limit_min: 0,
    notes: 'Always send - critical security confirmation'
  },
  
  // ─────────────────────────────────────────────────────────────
  // FINANCING EVENTS (12 total)
  // ─────────────────────────────────────────────────────────────
  'FIN_SUBMITTED': {
    event: 'Application Submitted',
    event_ar: 'تم تقديم الطلب',
    email_template: 'financing_submitted',
    whatsapp_template: 'financing_submitted',
    channels: ['Email', 'WhatsApp'],
    priority: 'Normal',
    security: false,
    rate_limit_min: 60,
    notes: 'Confirmation with application number'
  },
  
  'FIN_UNDER_REVIEW': {
    event: 'Under Review',
    event_ar: 'الطلب قيد المراجعة',
    email_template: 'financing_under_review',
    whatsapp_template: null,
    channels: ['Email'],
    priority: 'Low',
    security: false,
    rate_limit_min: 60,
    notes: 'Status update - email only'
  },
  
  'FIN_ADDITIONAL_INFO_REQUIRED': {
    event: 'Additional Info Required',
    event_ar: 'مطلوب مستندات إضافية',
    email_template: 'financing_docs_required',
    whatsapp_template: 'financing_docs_required',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: false,
    rate_limit_min: 30,
    notes: 'Action required - both channels'
  },
  
  'FIN_CONTRACT_PRESENTED': {
    event: 'Contract Presented',
    event_ar: 'العقد جاهز للمراجعة',
    email_template: 'financing_contract_ready',
    whatsapp_template: 'financing_contract_ready',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: false,
    rate_limit_min: 60,
    notes: 'Action required - review and sign contract'
  },
  
  'FIN_CONTRACT_ACCEPTED': {
    event: 'Contract Accepted',
    event_ar: 'تم قبول العقد',
    email_template: 'financing_contract_accepted',
    whatsapp_template: 'financing_contract_accepted',
    channels: ['Email', 'WhatsApp'],
    priority: 'Normal',
    security: false,
    rate_limit_min: 60,
    notes: 'Confirmation of acceptance'
  },
  
  'FIN_CONTRACT_FINALIZED': {
    event: 'Contract Finalized',
    event_ar: 'تم اعتماد العقد',
    email_template: 'financing_contract_finalized',
    whatsapp_template: 'financing_contract_finalized',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: false,
    rate_limit_min: 60,
    notes: 'Final confirmation - credit will be deposited'
  },
  
  'FIN_APPROVED': {
    event: 'Application Approved',
    event_ar: 'تمت الموافقة على الطلب',
    email_template: 'financing_approved',
    whatsapp_template: 'financing_approved',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: false,
    rate_limit_min: 60,
    notes: 'Approval with amount details'
  },
  
  'FIN_APPROVED_WITH_LIMITS': {
    event: 'Approved with Conditions',
    event_ar: 'موافقة مشروطة',
    email_template: 'financing_approved_conditional',
    whatsapp_template: 'financing_approved_conditional',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: false,
    rate_limit_min: 60,
    notes: 'Conditional approval - action may be required'
  },
  
  'FIN_DECLINED': {
    event: 'Application Declined',
    event_ar: 'تم رفض الطلب',
    email_template: 'financing_rejected',
    whatsapp_template: 'financing_rejected',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: false,
    rate_limit_min: 60,
    notes: 'Generic rejection reason only - no sensitive details'
  },
  
  'FIN_CREDIT_DEPOSITED': {
    event: 'Credit Deposited',
    event_ar: 'تم إضافة رصيد الخدمات',
    email_template: 'financing_credit_deposited',
    whatsapp_template: 'financing_credit_deposited',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: false,
    rate_limit_min: 0,
    notes: 'Always send - important financial event'
  },
  
  'FIN_CANCELLED': {
    event: 'Application Cancelled',
    event_ar: 'تم إلغاء الطلب',
    email_template: 'financing_cancelled',
    whatsapp_template: null,
    channels: ['Email'],
    priority: 'Normal',
    security: false,
    rate_limit_min: 60,
    notes: 'Cancellation confirmation - email only'
  },
  
  'FIN_EXPIRED': {
    event: 'Application Expired',
    event_ar: 'انتهت صلاحية الطلب',
    email_template: 'financing_expired',
    whatsapp_template: null,
    channels: ['Email'],
    priority: 'Normal',
    security: false,
    rate_limit_min: 60,
    notes: 'Expiry notification - email only'
  },
  
  // ─────────────────────────────────────────────────────────────
  // WALLET EVENTS (4 total)
  // ─────────────────────────────────────────────────────────────
  'WALLET_CREDITED': {
    event: 'Wallet Credited',
    event_ar: 'تم إضافة رصيد للمحفظة',
    email_template: 'wallet_credited',
    whatsapp_template: 'wallet_credited',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: false,
    rate_limit_min: 0,
    notes: 'Always send - important financial event'
  },
  
  'WALLET_DEBITED': {
    event: 'Wallet Debited',
    event_ar: 'تم خصم من المحفظة',
    email_template: 'wallet_debited',
    whatsapp_template: null,
    channels: ['Email'],
    priority: 'Normal',
    security: false,
    rate_limit_min: 5,
    notes: 'Debit notification - email only to reduce noise'
  },
  
  'WALLET_INSUFFICIENT': {
    event: 'Insufficient Balance',
    event_ar: 'رصيد غير كافي',
    email_template: 'wallet_insufficient',
    whatsapp_template: null,
    channels: ['Email'],
    priority: 'Low',
    security: false,
    rate_limit_min: 60,
    notes: 'Balance warning - email only'
  },
  
  'WALLET_SUSPENDED': {
    event: 'Wallet Suspended',
    event_ar: 'تم تعليق المحفظة',
    email_template: 'wallet_suspended',
    whatsapp_template: 'wallet_suspended',
    channels: ['Email', 'WhatsApp'],
    priority: 'High',
    security: true,
    rate_limit_min: 0,
    notes: 'Critical - always send, security event'
  }
};

// ═══════════════════════════════════════════════════════════════
// COVERAGE STATISTICS
// ═══════════════════════════════════════════════════════════════

export function generateCoverageReport(): string {
  const report = getCoverageReport();
  
  return `
╔══════════════════════════════════════════════════════════════╗
║        ASH HOLDING NOTIFICATION COVERAGE REPORT                 ║
╠══════════════════════════════════════════════════════════════╣
║ Total Events Covered: ${report.total}                                     ║
╠══════════════════════════════════════════════════════════════╣
║ BY CATEGORY:                                                  ║
║   • Auth Events:      ${report.byCategory.auth} notifications                        ║
║   • Financing Events: ${report.byCategory.financing} notifications                       ║
║   • Wallet Events:    ${report.byCategory.wallet} notifications                         ║
╠══════════════════════════════════════════════════════════════╣
║ BY CHANNEL:                                                   ║
║   • Email:    ${report.byChannel.email} events (100% coverage)                     ║
║   • WhatsApp: ${report.byChannel.whatsapp} events (selective - no sensitive data)    ║
╠══════════════════════════════════════════════════════════════╣
║ SECURITY EVENTS: ${report.securityEvents} (always sent, no rate limit)              ║
╚══════════════════════════════════════════════════════════════╝
  `.trim();
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Validate that all required events have notifications configured
 */
export function validateCoverage(): { valid: boolean; missing: string[] } {
  const requiredEvents: NotificationEventType[] = [
    // Auth
    'EMAIL_VERIFICATION_SENT',
    'EMAIL_VERIFIED',
    'LOGIN_SUCCESS',
    'ACCOUNT_LOCKED',
    'PASSWORD_RESET_REQUESTED',
    'PASSWORD_CHANGED',
    // Financing
    'FIN_SUBMITTED',
    'FIN_CONTRACT_PRESENTED',
    'FIN_APPROVED',
    'FIN_DECLINED',
    'FIN_CREDIT_DEPOSITED',
    // Wallet
    'WALLET_CREDITED',
    'WALLET_SUSPENDED'
  ];

  const missing = requiredEvents.filter(
    event => !NOTIFICATION_REGISTRY[event]
  );

  return {
    valid: missing.length === 0,
    missing
  };
}
