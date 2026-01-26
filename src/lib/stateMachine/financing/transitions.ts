/**
 * MaxioCore - Financing State Machine Transitions (Unified Prefix)
 * انتقالات حالات التمويل
 * 
 * ⚠️ تنبيه: التمويل غير نقدي - رصيد خدمات داخل المنصة فقط
 */

import { StateTransition, FinancingStatus, TransitionTrigger } from '../core/types';

/**
 * جميع الانتقالات المسموح بها في نظام التمويل
 */
export const FINANCING_TRANSITIONS: StateTransition<FinancingStatus>[] = [
  // ============================================
  // مرحلة التقديم
  // ============================================
  
  {
    from: 'FIN_DRAFT',
    to: 'FIN_SUBMITTED',
    trigger: ['customer'],
    condition: 'Application data and documents complete',
    conditionAr: 'اكتمال البيانات والمستندات الأساسية',
    sideEffects: ['SEND_EMAIL', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_DRAFT',
    to: 'FIN_CANCELLED',
    trigger: ['customer'],
    condition: 'Customer cancellation request',
    conditionAr: 'طلب إلغاء من العميل',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'FIN_DRAFT',
    to: 'FIN_EXPIRED',
    trigger: ['system'],
    condition: 'Draft timeout (30 days)',
    conditionAr: 'انتهاء مهلة المسودة (30 يوم)',
    timeoutDays: 30,
    sideEffects: ['LOG_ACTIVITY']
  },

  // ============================================
  // مرحلة المراجعة
  // ============================================

  {
    from: 'FIN_SUBMITTED',
    to: 'FIN_UNDER_REVIEW',
    trigger: ['system'],
    condition: 'Automatic after submission',
    conditionAr: 'تلقائي بعد الاستلام',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'FIN_SUBMITTED',
    to: 'FIN_CANCELLED',
    trigger: ['customer'],
    condition: 'Customer cancellation request',
    conditionAr: 'طلب إلغاء من العميل',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  },

  {
    from: 'FIN_UNDER_REVIEW',
    to: 'FIN_ADDITIONAL_INFO_REQUIRED',
    trigger: ['reviewer'],
    condition: 'Missing documents or data',
    conditionAr: 'نقص في المستندات أو البيانات',
    sideEffects: ['SEND_EMAIL', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_UNDER_REVIEW',
    to: 'FIN_APPROVED',
    trigger: ['reviewer'],
    condition: 'Full approval after review',
    conditionAr: 'اجتياز المراجعة بالكامل',
    sideEffects: ['SEND_EMAIL', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_UNDER_REVIEW',
    to: 'FIN_APPROVED_WITH_LIMITS',
    trigger: ['reviewer'],
    condition: 'Partial approval or with conditions',
    conditionAr: 'موافقة جزئية أو بشروط',
    sideEffects: ['SEND_EMAIL', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_UNDER_REVIEW',
    to: 'FIN_DECLINED',
    trigger: ['reviewer'],
    condition: 'Application declined - generic message to customer',
    conditionAr: 'رفض الطلب - رسالة عامة للعميل',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_UNDER_REVIEW',
    to: 'FIN_CANCELLED',
    trigger: ['customer'],
    condition: 'Customer cancellation request',
    conditionAr: 'طلب إلغاء من العميل',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  },

  // معلومات إضافية
  {
    from: 'FIN_ADDITIONAL_INFO_REQUIRED',
    to: 'FIN_UNDER_REVIEW',
    trigger: ['customer'],
    condition: 'Required documents submitted',
    conditionAr: 'تقديم المستندات المطلوبة',
    sideEffects: ['LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_ADDITIONAL_INFO_REQUIRED',
    to: 'FIN_EXPIRED',
    trigger: ['system'],
    condition: 'Timeout (14 days)',
    conditionAr: 'انتهاء مهلة 14 يوم',
    timeoutDays: 14,
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  },

  {
    from: 'FIN_ADDITIONAL_INFO_REQUIRED',
    to: 'FIN_CANCELLED',
    trigger: ['customer'],
    condition: 'Customer cancellation request',
    conditionAr: 'طلب إلغاء من العميل',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  },

  // ============================================
  // مرحلة العقد
  // ============================================

  {
    from: 'FIN_APPROVED',
    to: 'FIN_CONTRACT_PRESENTED',
    trigger: ['system'],
    condition: 'Contract generated automatically',
    conditionAr: 'إنشاء العقد تلقائياً',
    sideEffects: ['SEND_EMAIL', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_APPROVED_WITH_LIMITS',
    to: 'FIN_CONTRACT_PRESENTED',
    trigger: ['system'],
    condition: 'Contract generated with adjusted terms',
    conditionAr: 'إنشاء العقد بالشروط المعدّلة',
    sideEffects: ['SEND_EMAIL', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_CONTRACT_PRESENTED',
    to: 'FIN_CONTRACT_ACCEPTED',
    trigger: ['customer'],
    condition: 'Electronic signature completed',
    conditionAr: 'توقيع العقد إلكترونياً',
    requiresConfirmation: true,
    sideEffects: ['SEND_EMAIL', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_CONTRACT_PRESENTED',
    to: 'FIN_DECLINED',
    trigger: ['customer'],
    condition: 'Customer rejects contract - generic confirmation',
    conditionAr: 'رفض العقد من قبل العميل',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  },

  {
    from: 'FIN_CONTRACT_PRESENTED',
    to: 'FIN_EXPIRED',
    trigger: ['system'],
    condition: 'Contract timeout (7 days)',
    conditionAr: 'انتهاء مهلة 7 أيام',
    timeoutDays: 7,
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  },

  {
    from: 'FIN_CONTRACT_ACCEPTED',
    to: 'FIN_CONTRACT_FINALIZED',
    trigger: ['admin'],
    condition: 'Final admin approval',
    conditionAr: 'اعتماد إداري نهائي',
    sideEffects: ['SEND_EMAIL', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  // ============================================
  // مرحلة الرصيد
  // ============================================

  {
    from: 'FIN_CONTRACT_FINALIZED',
    to: 'FIN_CREDIT_DEPOSIT_PENDING',
    trigger: ['system'],
    condition: 'Credit deposit process started',
    conditionAr: 'بدء عملية إضافة الرصيد',
    sideEffects: ['LOG_ACTIVITY']
  },

  {
    from: 'FIN_CREDIT_DEPOSIT_PENDING',
    to: 'FIN_CREDIT_DEPOSITED',
    trigger: ['system'],
    condition: 'Service credit deposited successfully',
    conditionAr: 'نجاح إضافة رصيد الخدمات',
    sideEffects: ['UPDATE_BALANCE', 'SEND_EMAIL', 'SEND_WHATSAPP', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_CREDIT_DEPOSITED',
    to: 'FIN_COMPLETED',
    trigger: ['system'],
    condition: 'All credit used for services',
    conditionAr: 'استخدام كامل الرصيد',
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY', 'CREATE_NOTIFICATION']
  },

  {
    from: 'FIN_CREDIT_DEPOSITED',
    to: 'FIN_EXPIRED',
    trigger: ['system'],
    condition: 'Credit validity expired (365 days)',
    conditionAr: 'انتهاء صلاحية الرصيد (365 يوم)',
    timeoutDays: 365,
    sideEffects: ['SEND_EMAIL', 'LOG_ACTIVITY']
  }
];

/**
 * الحصول على الانتقالات المسموح بها من حالة معينة
 */
export function getAvailableFinancingTransitions(currentStatus: FinancingStatus): StateTransition<FinancingStatus>[] {
  return FINANCING_TRANSITIONS.filter(t => t.from === currentStatus);
}

/**
 * الحصول على الانتقالات لمحفز معين
 */
export function getFinancingTransitionsForTrigger(
  currentStatus: FinancingStatus,
  trigger: TransitionTrigger
): StateTransition<FinancingStatus>[] {
  return FINANCING_TRANSITIONS.filter(
    t => t.from === currentStatus && t.trigger.includes(trigger)
  );
}

/**
 * التحقق من وجود انتقال
 */
export function financingTransitionExists(from: FinancingStatus, to: FinancingStatus): boolean {
  return FINANCING_TRANSITIONS.some(t => t.from === from && t.to === to);
}

/**
 * الحصول على تفاصيل انتقال
 */
export function getFinancingTransition(from: FinancingStatus, to: FinancingStatus): StateTransition<FinancingStatus> | undefined {
  return FINANCING_TRANSITIONS.find(t => t.from === from && t.to === to);
}

/**
 * الحالات التالية الممكنة
 */
export function getNextFinancingStates(currentStatus: FinancingStatus): FinancingStatus[] {
  return getAvailableFinancingTransitions(currentStatus).map(t => t.to);
}

/**
 * هل يمكن للعميل إلغاء الطلب
 */
export function canCustomerCancelFinancing(status: FinancingStatus): boolean {
  const cancellableStates: FinancingStatus[] = [
    'FIN_DRAFT',
    'FIN_SUBMITTED',
    'FIN_UNDER_REVIEW',
    'FIN_ADDITIONAL_INFO_REQUIRED'
  ];
  return cancellableStates.includes(status);
}

/**
 * هل الطلب يتطلب إجراء من العميل
 */
export function requiresCustomerAction(status: FinancingStatus): boolean {
  const customerActionStates: FinancingStatus[] = [
    'FIN_DRAFT',
    'FIN_ADDITIONAL_INFO_REQUIRED',
    'FIN_CONTRACT_PRESENTED',
    'FIN_CREDIT_DEPOSITED'
  ];
  return customerActionStates.includes(status);
}

/**
 * هل الطلب يتطلب إجراء من المراجع
 */
export function requiresReviewerAction(status: FinancingStatus): boolean {
  return status === 'FIN_UNDER_REVIEW';
}

/**
 * هل الطلب يتطلب إجراء من المسؤول
 */
export function requiresAdminAction(status: FinancingStatus): boolean {
  return status === 'FIN_CONTRACT_ACCEPTED';
}
