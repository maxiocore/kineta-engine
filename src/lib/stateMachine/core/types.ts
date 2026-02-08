/**
 * ASH HOLDING State Machine - Core Types
 * نظام إدارة الحالات الموحد
 * 
 * ⚠️ أمان: لا يتم كشف تفاصيل حساسة للمستخدم
 */

// ============================================
// الأنواع الأساسية
// ============================================

/**
 * المجالات الرئيسية للحالات
 */
export type StateDomain = 'AUTH' | 'WALLET' | 'FINANCING';

/**
 * من يمكنه تحفيز الانتقال
 */
export type TransitionTrigger = 'customer' | 'system' | 'reviewer' | 'admin';

/**
 * مستوى خطورة الحالة
 */
export type StateSeverity = 'info' | 'warning' | 'error' | 'success';

/**
 * ألوان العرض
 */
export type StateColor = 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'orange';

// ============================================
// حالات المصادقة (Auth States)
// ============================================

export type AuthStatus =
  | 'SIGNUP_STARTED'           // بدء التسجيل
  | 'EMAIL_VERIFICATION_SENT'  // تم إرسال رمز التحقق
  | 'EMAIL_VERIFIED'           // تم التحقق من البريد
  | 'SIGNUP_COMPLETED'         // اكتمل التسجيل
  | 'LOGIN_SUCCESS'            // نجاح تسجيل الدخول
  | 'LOGIN_FAILED'             // فشل تسجيل الدخول
  | 'ACCOUNT_LOCKED'           // الحساب مقفل
  | 'PASSWORD_RESET_REQUESTED' // طلب استعادة كلمة المرور
  | 'PASSWORD_RESET_COMPLETED' // تم تغيير كلمة المرور
  | 'SESSION_EXPIRED'          // انتهت الجلسة
  | 'LOGGED_OUT';              // تم تسجيل الخروج

// ============================================
// حالات المحفظة (Wallet States)
// ============================================

export type WalletStatus =
  | 'WALLET_NOT_AVAILABLE'     // المحفظة غير متاحة
  | 'WALLET_ACTIVE'            // المحفظة نشطة
  | 'WALLET_SUSPENDED'         // المحفظة موقوفة
  | 'WALLET_CREDITED'          // تم إضافة رصيد
  | 'WALLET_DEBITED'           // تم خصم رصيد
  | 'WALLET_INSUFFICIENT'      // رصيد غير كافٍ
  | 'WALLET_PENDING_DEPOSIT'   // بانتظار إيداع
  | 'WALLET_DEPOSIT_FAILED';   // فشل الإيداع

// ============================================
// حالات التمويل (Financing States)
// ============================================

export type FinancingStatus =
  | 'FIN_DRAFT'                    // مسودة
  | 'FIN_SUBMITTED'                // تم الإرسال
  | 'FIN_UNDER_REVIEW'             // قيد المراجعة
  | 'FIN_ADDITIONAL_INFO_REQUIRED' // مطلوب معلومات إضافية
  | 'FIN_APPROVED'                 // موافقة
  | 'FIN_APPROVED_WITH_LIMITS'     // موافقة مع قيود
  | 'FIN_DECLINED'                 // مرفوض
  | 'FIN_CONTRACT_PRESENTED'       // تم عرض العقد
  | 'FIN_CONTRACT_ACCEPTED'        // قبول العقد
  | 'FIN_CONTRACT_FINALIZED'       // اعتماد العقد
  | 'FIN_CREDIT_DEPOSIT_PENDING'   // قيد إضافة الرصيد
  | 'FIN_CREDIT_DEPOSITED'         // تم إضافة الرصيد
  | 'FIN_COMPLETED'                // مكتمل
  | 'FIN_CANCELLED'                // ملغي
  | 'FIN_EXPIRED';                 // منتهي الصلاحية

// ============================================
// الحالة الموحدة
// ============================================

export type UnifiedStatus = AuthStatus | WalletStatus | FinancingStatus;

// ============================================
// تعريف الحالة
// ============================================

export interface StateDefinition<T extends UnifiedStatus = UnifiedStatus> {
  /** معرف الحالة */
  status: T;
  /** المجال */
  domain: StateDomain;
  /** الاسم بالعربية */
  nameAr: string;
  /** الاسم بالإنجليزية */
  nameEn: string;
  /** وصف داخلي (للمطورين فقط) */
  internalDescription: string;
  /** رسالة للمستخدم (آمنة - بدون تفاصيل حساسة) */
  userMessage: string;
  /** هل هي حالة نهائية */
  isTerminal: boolean;
  /** الإجراء المطلوب (إن وجد) */
  requiredAction?: string;
  /** مهلة الانتقال التلقائي (بالأيام) */
  timeoutDays?: number;
  /** لون العرض */
  color: StateColor;
  /** اسم الأيقونة */
  icon: string;
  /** مستوى الخطورة */
  severity: StateSeverity;
  /** هل يتم إخفاء التفاصيل الأمنية */
  hideSecurityDetails: boolean;
}

// ============================================
// تعريف الانتقال
// ============================================

export interface StateTransition<T extends UnifiedStatus = UnifiedStatus> {
  /** الحالة الحالية */
  from: T;
  /** الحالة المستهدفة */
  to: T;
  /** من يمكنه تحفيز الانتقال */
  trigger: TransitionTrigger[];
  /** شرط الانتقال (للتوثيق) */
  condition: string;
  /** شرط الانتقال بالعربية */
  conditionAr: string;
  /** مهلة الانتقال التلقائي (بالأيام) */
  timeoutDays?: number;
  /** هل يتطلب تأكيد */
  requiresConfirmation?: boolean;
  /** إجراءات جانبية */
  sideEffects?: TransitionSideEffect[];
}

// ============================================
// الآثار الجانبية للانتقال
// ============================================

export type TransitionSideEffect =
  | 'SEND_EMAIL'
  | 'SEND_SMS'
  | 'SEND_WHATSAPP'
  | 'LOG_ACTIVITY'
  | 'UPDATE_BALANCE'
  | 'CREATE_NOTIFICATION'
  | 'LOCK_ACCOUNT'
  | 'UNLOCK_ACCOUNT'
  | 'RESET_ATTEMPTS';

// ============================================
// نتيجة التحقق من الانتقال
// ============================================

export interface TransitionValidationResult {
  /** هل الانتقال صالح */
  valid: boolean;
  /** رسالة الخطأ (للمطورين) */
  error?: string;
  /** رسالة الخطأ للمستخدم (آمنة) */
  errorAr?: string;
  /** رمز الخطأ */
  errorCode?: string;
}

// ============================================
// سجل تغيير الحالة
// ============================================

export interface StatusChangeLog {
  /** معرف السجل */
  id: string;
  /** معرف الكيان (طلب تمويل، مستخدم، إلخ) */
  entityId: string;
  /** نوع الكيان */
  entityType: StateDomain;
  /** الحالة السابقة */
  fromStatus: UnifiedStatus | null;
  /** الحالة الجديدة */
  toStatus: UnifiedStatus;
  /** معرف من قام بالتغيير */
  changedBy: string | null;
  /** دور من قام بالتغيير */
  changedByRole: TransitionTrigger;
  /** السبب (لا يُعرض للمستخدم إذا كان حساساً) */
  reason?: string;
  /** هل السبب حساس */
  isReasonSensitive?: boolean;
  /** بيانات إضافية */
  metadata?: Record<string, unknown>;
  /** وقت الإنشاء */
  createdAt: string;
}

// ============================================
// رسائل الخطأ الآمنة
// ============================================

/**
 * رسائل خطأ عامة لا تكشف تفاصيل أمنية
 */
export const SAFE_ERROR_MESSAGES = {
  // أخطاء المصادقة
  AUTH_FAILED: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  ACCOUNT_ISSUE: 'حدثت مشكلة في الحساب، يرجى التواصل مع الدعم',
  SESSION_EXPIRED: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
  
  // أخطاء المحفظة
  WALLET_ISSUE: 'حدثت مشكلة في المحفظة، يرجى التواصل مع الدعم',
  INSUFFICIENT_BALANCE: 'الرصيد غير كافٍ لإتمام العملية',
  
  // أخطاء التمويل
  FINANCING_ISSUE: 'حدثت مشكلة في طلب التمويل، يرجى التواصل مع الدعم',
  APPLICATION_DECLINED: 'نعتذر، لم تتم الموافقة على طلبك. يمكنك تقديم طلب جديد لاحقاً',
  
  // أخطاء عامة
  GENERAL_ERROR: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً',
  INVALID_OPERATION: 'العملية غير مسموحة حالياً',
} as const;

export type SafeErrorKey = keyof typeof SAFE_ERROR_MESSAGES;
