/**
 * ASH HOLDING - Auth State Machine States
 * نظام حالات المصادقة والتسجيل
 */

import { StateDefinition, AuthStatus } from '../core/types';

/**
 * تعريفات حالات المصادقة
 */
export const AUTH_STATE_DEFINITIONS: Record<AuthStatus, StateDefinition<AuthStatus>> = {
  // ============================================
  // مراحل التسجيل
  // ============================================
  
  SIGNUP_STARTED: {
    status: 'SIGNUP_STARTED',
    domain: 'AUTH',
    nameAr: 'بدء التسجيل',
    nameEn: 'Signup Started',
    internalDescription: 'المستخدم بدأ عملية إنشاء حساب جديد',
    userMessage: 'جاري إنشاء حسابك...',
    isTerminal: false,
    color: 'blue',
    icon: 'UserPlus',
    severity: 'info',
    hideSecurityDetails: false
  },

  EMAIL_VERIFICATION_SENT: {
    status: 'EMAIL_VERIFICATION_SENT',
    domain: 'AUTH',
    nameAr: 'بانتظار التحقق',
    nameEn: 'Email Verification Sent',
    internalDescription: 'تم إرسال رمز التحقق إلى البريد الإلكتروني',
    userMessage: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
    isTerminal: false,
    requiredAction: 'إدخال رمز التحقق المرسل للبريد',
    timeoutDays: 1, // يوم واحد لانتهاء صلاحية الرمز
    color: 'yellow',
    icon: 'Mail',
    severity: 'warning',
    hideSecurityDetails: false
  },

  EMAIL_VERIFIED: {
    status: 'EMAIL_VERIFIED',
    domain: 'AUTH',
    nameAr: 'تم التحقق',
    nameEn: 'Email Verified',
    internalDescription: 'تم التحقق من البريد الإلكتروني بنجاح',
    userMessage: 'تم التحقق من بريدك الإلكتروني بنجاح',
    isTerminal: false,
    color: 'green',
    icon: 'CheckCircle',
    severity: 'success',
    hideSecurityDetails: false
  },

  SIGNUP_COMPLETED: {
    status: 'SIGNUP_COMPLETED',
    domain: 'AUTH',
    nameAr: 'اكتمل التسجيل',
    nameEn: 'Signup Completed',
    internalDescription: 'تم إنشاء الحساب بنجاح وجاهز للاستخدام',
    userMessage: 'تهانينا! تم إنشاء حسابك بنجاح',
    isTerminal: true,
    color: 'green',
    icon: 'UserCheck',
    severity: 'success',
    hideSecurityDetails: false
  },

  // ============================================
  // مراحل تسجيل الدخول
  // ============================================

  LOGIN_SUCCESS: {
    status: 'LOGIN_SUCCESS',
    domain: 'AUTH',
    nameAr: 'تسجيل دخول ناجح',
    nameEn: 'Login Success',
    internalDescription: 'تم تسجيل الدخول بنجاح',
    userMessage: 'مرحباً بك!',
    isTerminal: true,
    color: 'green',
    icon: 'LogIn',
    severity: 'success',
    hideSecurityDetails: false
  },

  LOGIN_FAILED: {
    status: 'LOGIN_FAILED',
    domain: 'AUTH',
    nameAr: 'فشل تسجيل الدخول',
    nameEn: 'Login Failed',
    // لا نكشف السبب الحقيقي (بريد غير موجود أو كلمة مرور خاطئة)
    internalDescription: 'فشل تسجيل الدخول - قد يكون السبب بريد غير مسجل أو كلمة مرور خاطئة',
    userMessage: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    isTerminal: false,
    color: 'red',
    icon: 'XCircle',
    severity: 'error',
    hideSecurityDetails: true // مهم: إخفاء السبب الحقيقي
  },

  ACCOUNT_LOCKED: {
    status: 'ACCOUNT_LOCKED',
    domain: 'AUTH',
    nameAr: 'الحساب مقفل',
    nameEn: 'Account Locked',
    // لا نكشف سبب القفل بالتفصيل
    internalDescription: 'تم قفل الحساب بسبب محاولات دخول فاشلة متكررة أو نشاط مشبوه',
    userMessage: 'تم قفل حسابك مؤقتاً. يرجى التواصل مع الدعم',
    isTerminal: true,
    color: 'red',
    icon: 'Lock',
    severity: 'error',
    hideSecurityDetails: true // مهم: إخفاء سبب القفل
  },

  // ============================================
  // استعادة كلمة المرور
  // ============================================

  PASSWORD_RESET_REQUESTED: {
    status: 'PASSWORD_RESET_REQUESTED',
    domain: 'AUTH',
    nameAr: 'طلب استعادة كلمة المرور',
    nameEn: 'Password Reset Requested',
    // رسالة موحدة سواء كان البريد مسجلاً أم لا
    internalDescription: 'تم طلب استعادة كلمة المرور',
    userMessage: 'إذا كان البريد مسجلاً لدينا، سيصلك رابط استعادة كلمة المرور',
    isTerminal: false,
    requiredAction: 'التحقق من البريد الإلكتروني',
    timeoutDays: 1,
    color: 'yellow',
    icon: 'KeyRound',
    severity: 'warning',
    hideSecurityDetails: true // مهم: لا نكشف هل البريد مسجل
  },

  PASSWORD_RESET_COMPLETED: {
    status: 'PASSWORD_RESET_COMPLETED',
    domain: 'AUTH',
    nameAr: 'تم تغيير كلمة المرور',
    nameEn: 'Password Reset Completed',
    internalDescription: 'تم تغيير كلمة المرور بنجاح',
    userMessage: 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن',
    isTerminal: true,
    color: 'green',
    icon: 'KeyRound',
    severity: 'success',
    hideSecurityDetails: false
  },

  // ============================================
  // حالات الجلسة
  // ============================================

  SESSION_EXPIRED: {
    status: 'SESSION_EXPIRED',
    domain: 'AUTH',
    nameAr: 'انتهت الجلسة',
    nameEn: 'Session Expired',
    internalDescription: 'انتهت صلاحية جلسة المستخدم',
    userMessage: 'انتهت صلاحية جلستك، يرجى تسجيل الدخول مجدداً',
    isTerminal: true,
    color: 'yellow',
    icon: 'Clock',
    severity: 'warning',
    hideSecurityDetails: false
  },

  LOGGED_OUT: {
    status: 'LOGGED_OUT',
    domain: 'AUTH',
    nameAr: 'تم تسجيل الخروج',
    nameEn: 'Logged Out',
    internalDescription: 'قام المستخدم بتسجيل الخروج',
    userMessage: 'تم تسجيل خروجك بنجاح',
    isTerminal: true,
    color: 'gray',
    icon: 'LogOut',
    severity: 'info',
    hideSecurityDetails: false
  }
};

/**
 * الحصول على تعريف حالة معينة
 */
export function getAuthStateDefinition(status: AuthStatus): StateDefinition<AuthStatus> {
  return AUTH_STATE_DEFINITIONS[status];
}

/**
 * الحالات النهائية للمصادقة
 */
export function getAuthTerminalStates(): AuthStatus[] {
  return Object.values(AUTH_STATE_DEFINITIONS)
    .filter(state => state.isTerminal)
    .map(state => state.status);
}

/**
 * هل الحالة نهائية
 */
export function isAuthTerminalState(status: AuthStatus): boolean {
  return AUTH_STATE_DEFINITIONS[status].isTerminal;
}

/**
 * الحصول على رسالة آمنة للمستخدم
 */
export function getAuthUserMessage(status: AuthStatus): string {
  return AUTH_STATE_DEFINITIONS[status].userMessage;
}
