/**
 * نظام حالات طلب تمويل الخدمات
 * Service Financing Application State Machine Types
 */

// جميع الحالات الممكنة
export type FinancingApplicationStatus =
  | 'DRAFT'                      // مسودة
  | 'SUBMITTED'                  // تم الاستلام
  | 'UNDER_REVIEW'               // قيد المراجعة
  | 'ADDITIONAL_INFO_REQUIRED'   // مطلوب معلومات إضافية
  | 'RISK_CHECK'                 // فحص المخاطر
  | 'APPROVED'                   // موافقة
  | 'APPROVED_WITH_LIMITS'       // موافقة مع قيود
  | 'DECLINED'                   // مرفوض
  | 'CONTRACT_PRESENTED'         // تم عرض العقد
  | 'CONTRACT_ACCEPTED'          // قبول العقد
  | 'CONTRACT_FINALIZED'         // اعتماد العقد
  | 'CREDIT_DEPOSIT_PENDING'     // قيد إضافة الرصيد
  | 'CREDIT_DEPOSITED'           // تم إضافة الرصيد
  | 'ORDER_PAYMENT_IN_PROGRESS'  // جاري الاستخدام
  | 'COMPLETED'                  // مكتمل
  | 'EXPIRED'                    // منتهي الصلاحية
  | 'CANCELLED';                 // ملغي

// من يمكنه تحفيز الانتقال
export type TransitionTrigger = 'customer' | 'system' | 'reviewer' | 'admin';

// تعريف الانتقال
export interface StateTransition {
  from: FinancingApplicationStatus;
  to: FinancingApplicationStatus;
  trigger: TransitionTrigger[];
  condition?: string;
  timeoutDays?: number;
}

// تعريف الحالة
export interface StateDefinition {
  status: FinancingApplicationStatus;
  nameAr: string;
  nameEn: string;
  description: string;
  userMessage: string;
  isTerminal: boolean;
  requiredAction?: string;
  timeoutDays?: number;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'orange';
  icon: string;
}

// نتيجة التحقق من الانتقال
export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
  errorAr?: string;
}

// سجل تغيير الحالة
export interface StatusChangeLog {
  id: string;
  applicationId: string;
  fromStatus: FinancingApplicationStatus | null;
  toStatus: FinancingApplicationStatus;
  changedBy: string;
  changedByRole: TransitionTrigger;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
