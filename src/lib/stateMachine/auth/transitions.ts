/**
 * ASH HOLDING - Auth State Machine Transitions
 * انتقالات حالات المصادقة
 */

import { StateTransition, AuthStatus, TransitionTrigger } from '../core/types';

/**
 * جميع الانتقالات المسموح بها في نظام المصادقة
 */
export const AUTH_TRANSITIONS: StateTransition<AuthStatus>[] = [
  // ============================================
  // انتقالات التسجيل
  // ============================================
  
  {
    from: 'SIGNUP_STARTED',
    to: 'EMAIL_VERIFICATION_SENT',
    trigger: ['system'],
    condition: 'User submits valid registration data',
    conditionAr: 'تقديم بيانات تسجيل صحيحة',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  },

  {
    from: 'EMAIL_VERIFICATION_SENT',
    to: 'EMAIL_VERIFIED',
    trigger: ['customer'],
    condition: 'User enters correct OTP code',
    conditionAr: 'إدخال رمز التحقق الصحيح',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'EMAIL_VERIFICATION_SENT',
    to: 'SIGNUP_STARTED',
    trigger: ['customer'],
    condition: 'User requests new OTP',
    conditionAr: 'طلب رمز تحقق جديد',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY', 'RESET_ATTEMPTS']
  },

  {
    from: 'EMAIL_VERIFIED',
    to: 'SIGNUP_COMPLETED',
    trigger: ['system'],
    condition: 'Account created and profile set up',
    conditionAr: 'إنشاء الحساب وإعداد الملف الشخصي',
    sideEffects: ['CREATE_NOTIFICATION', 'LOG_ACTIVITY']
  },

  {
    from: 'SIGNUP_COMPLETED',
    to: 'LOGIN_SUCCESS',
    trigger: ['system'],
    condition: 'Auto-login after signup',
    conditionAr: 'تسجيل دخول تلقائي بعد التسجيل',
    sideEffects: ['LOG_ACTIVITY']
  },

  // ============================================
  // انتقالات تسجيل الدخول
  // ============================================

  // لا نكشف هل فشل بسبب البريد أم كلمة المرور
  {
    from: 'LOGGED_OUT',
    to: 'LOGIN_SUCCESS',
    trigger: ['customer'],
    condition: 'Valid credentials provided',
    conditionAr: 'بيانات دخول صحيحة',
    sideEffects: ['LOG_ACTIVITY', 'RESET_ATTEMPTS']
  },

  {
    from: 'LOGGED_OUT',
    to: 'LOGIN_FAILED',
    trigger: ['system'],
    condition: 'Invalid credentials - generic error shown to user',
    conditionAr: 'بيانات غير صحيحة - يتم عرض رسالة عامة',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'LOGIN_FAILED',
    to: 'LOGIN_SUCCESS',
    trigger: ['customer'],
    condition: 'User provides correct credentials on retry',
    conditionAr: 'إعادة المحاولة ببيانات صحيحة',
    sideEffects: ['LOG_ACTIVITY', 'RESET_ATTEMPTS']
  },

  {
    from: 'LOGIN_FAILED',
    to: 'ACCOUNT_LOCKED',
    trigger: ['system'],
    condition: 'Too many failed attempts (5+)',
    conditionAr: 'تجاوز الحد المسموح من المحاولات الفاشلة',
    sideEffects: ['LOCK_ACCOUNT', 'SEND_EMAIL', 'LOG_ACTIVITY']
  },

  {
    from: 'LOGIN_FAILED',
    to: 'PASSWORD_RESET_REQUESTED',
    trigger: ['customer'],
    condition: 'User clicks forgot password',
    conditionAr: 'الضغط على نسيت كلمة المرور',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  },

  // ============================================
  // انتقالات قفل الحساب
  // ============================================

  {
    from: 'ACCOUNT_LOCKED',
    to: 'LOGGED_OUT',
    trigger: ['admin', 'system'],
    condition: 'Account unlocked by admin or timeout',
    conditionAr: 'فك القفل بواسطة المسؤول أو انتهاء المهلة',
    sideEffects: ['UNLOCK_ACCOUNT', 'SEND_EMAIL', 'LOG_ACTIVITY']
  },

  {
    from: 'ACCOUNT_LOCKED',
    to: 'PASSWORD_RESET_REQUESTED',
    trigger: ['customer'],
    condition: 'User requests password reset while locked',
    conditionAr: 'طلب استعادة كلمة المرور أثناء القفل',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  },

  // ============================================
  // انتقالات استعادة كلمة المرور
  // ============================================

  {
    from: 'PASSWORD_RESET_REQUESTED',
    to: 'PASSWORD_RESET_COMPLETED',
    trigger: ['customer'],
    condition: 'User sets new password via reset link',
    conditionAr: 'تعيين كلمة مرور جديدة عبر رابط الاستعادة',
    sideEffects: ['UNLOCK_ACCOUNT', 'SEND_EMAIL', 'LOG_ACTIVITY', 'RESET_ATTEMPTS']
  },

  {
    from: 'PASSWORD_RESET_COMPLETED',
    to: 'LOGIN_SUCCESS',
    trigger: ['customer'],
    condition: 'User logs in with new password',
    conditionAr: 'تسجيل الدخول بكلمة المرور الجديدة',
    sideEffects: ['LOG_ACTIVITY']
  },

  // ============================================
  // انتقالات الجلسة
  // ============================================

  {
    from: 'LOGIN_SUCCESS',
    to: 'SESSION_EXPIRED',
    trigger: ['system'],
    condition: 'Session token expired (24h default)',
    conditionAr: 'انتهاء صلاحية الجلسة',
    timeoutDays: 1,
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'LOGIN_SUCCESS',
    to: 'LOGGED_OUT',
    trigger: ['customer'],
    condition: 'User manually logs out',
    conditionAr: 'تسجيل الخروج يدوياً',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'SESSION_EXPIRED',
    to: 'LOGIN_SUCCESS',
    trigger: ['customer'],
    condition: 'User re-authenticates',
    conditionAr: 'إعادة تسجيل الدخول',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'SESSION_EXPIRED',
    to: 'LOGGED_OUT',
    trigger: ['system'],
    condition: 'Session cleanup',
    conditionAr: 'تنظيف الجلسة تلقائياً',
    sideEffects: ['LOG_ACTIVITY']
  }
];

/**
 * الحصول على الانتقالات المسموح بها من حالة معينة
 */
export function getAvailableAuthTransitions(currentStatus: AuthStatus): StateTransition<AuthStatus>[] {
  return AUTH_TRANSITIONS.filter(t => t.from === currentStatus);
}

/**
 * الحصول على الانتقالات لمحفز معين
 */
export function getAuthTransitionsForTrigger(
  currentStatus: AuthStatus,
  trigger: TransitionTrigger
): StateTransition<AuthStatus>[] {
  return AUTH_TRANSITIONS.filter(
    t => t.from === currentStatus && t.trigger.includes(trigger)
  );
}

/**
 * التحقق من وجود انتقال
 */
export function authTransitionExists(from: AuthStatus, to: AuthStatus): boolean {
  return AUTH_TRANSITIONS.some(t => t.from === from && t.to === to);
}

/**
 * الحصول على تفاصيل انتقال
 */
export function getAuthTransition(from: AuthStatus, to: AuthStatus): StateTransition<AuthStatus> | undefined {
  return AUTH_TRANSITIONS.find(t => t.from === from && t.to === to);
}

/**
 * الحالات التالية الممكنة
 */
export function getNextAuthStates(currentStatus: AuthStatus): AuthStatus[] {
  return getAvailableAuthTransitions(currentStatus).map(t => t.to);
}
