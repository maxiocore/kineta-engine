import { StateTransition, FinancingApplicationStatus, TransitionTrigger } from './types';

/**
 * جميع الانتقالات المسموح بها في النظام
 */
export const ALLOWED_TRANSITIONS: StateTransition[] = [
  // من مسودة
  {
    from: 'DRAFT',
    to: 'SUBMITTED',
    trigger: ['customer'],
    condition: 'اكتمال البيانات والمستندات الأساسية'
  },
  {
    from: 'DRAFT',
    to: 'CANCELLED',
    trigger: ['customer'],
    condition: 'طلب إلغاء من العميل'
  },

  // من تم الاستلام
  {
    from: 'SUBMITTED',
    to: 'UNDER_REVIEW',
    trigger: ['system'],
    condition: 'تلقائي بعد الاستلام'
  },
  {
    from: 'SUBMITTED',
    to: 'CANCELLED',
    trigger: ['customer'],
    condition: 'طلب إلغاء من العميل'
  },

  // من قيد المراجعة
  {
    from: 'UNDER_REVIEW',
    to: 'ADDITIONAL_INFO_REQUIRED',
    trigger: ['reviewer'],
    condition: 'نقص في المستندات أو البيانات'
  },
  {
    from: 'UNDER_REVIEW',
    to: 'RISK_CHECK',
    trigger: ['reviewer'],
    condition: 'اكتمال المراجعة الأولية'
  },
  {
    from: 'UNDER_REVIEW',
    to: 'CANCELLED',
    trigger: ['customer'],
    condition: 'طلب إلغاء من العميل'
  },

  // من مطلوب معلومات إضافية
  {
    from: 'ADDITIONAL_INFO_REQUIRED',
    to: 'UNDER_REVIEW',
    trigger: ['customer'],
    condition: 'تقديم المستندات المطلوبة'
  },
  {
    from: 'ADDITIONAL_INFO_REQUIRED',
    to: 'EXPIRED',
    trigger: ['system'],
    condition: 'انتهاء مهلة 14 يوم',
    timeoutDays: 14
  },

  // من فحص المخاطر
  {
    from: 'RISK_CHECK',
    to: 'APPROVED',
    trigger: ['system', 'reviewer'],
    condition: 'اجتياز فحص المخاطر بالكامل'
  },
  {
    from: 'RISK_CHECK',
    to: 'APPROVED_WITH_LIMITS',
    trigger: ['reviewer'],
    condition: 'موافقة جزئية أو بشروط'
  },
  {
    from: 'RISK_CHECK',
    to: 'DECLINED',
    trigger: ['system', 'reviewer'],
    condition: 'فشل فحص المخاطر'
  },

  // من موافقة
  {
    from: 'APPROVED',
    to: 'CONTRACT_PRESENTED',
    trigger: ['system'],
    condition: 'إنشاء العقد تلقائياً'
  },

  // من موافقة مع قيود
  {
    from: 'APPROVED_WITH_LIMITS',
    to: 'CONTRACT_PRESENTED',
    trigger: ['system'],
    condition: 'إنشاء العقد بالشروط المعدّلة'
  },

  // من عرض العقد
  {
    from: 'CONTRACT_PRESENTED',
    to: 'CONTRACT_ACCEPTED',
    trigger: ['customer'],
    condition: 'توقيع العقد إلكترونياً'
  },
  {
    from: 'CONTRACT_PRESENTED',
    to: 'DECLINED',
    trigger: ['customer'],
    condition: 'رفض العقد من قبل العميل'
  },
  {
    from: 'CONTRACT_PRESENTED',
    to: 'EXPIRED',
    trigger: ['system'],
    condition: 'انتهاء مهلة 7 أيام',
    timeoutDays: 7
  },

  // من قبول العقد
  {
    from: 'CONTRACT_ACCEPTED',
    to: 'CONTRACT_FINALIZED',
    trigger: ['admin'],
    condition: 'اعتماد إداري نهائي'
  },

  // من اعتماد العقد
  {
    from: 'CONTRACT_FINALIZED',
    to: 'CREDIT_DEPOSIT_PENDING',
    trigger: ['system'],
    condition: 'بدء عملية إضافة الرصيد'
  },

  // من قيد إضافة الرصيد
  {
    from: 'CREDIT_DEPOSIT_PENDING',
    to: 'CREDIT_DEPOSITED',
    trigger: ['system'],
    condition: 'نجاح إضافة رصيد الخدمات'
  },

  // من تم إضافة الرصيد
  {
    from: 'CREDIT_DEPOSITED',
    to: 'ORDER_PAYMENT_IN_PROGRESS',
    trigger: ['customer'],
    condition: 'بدء شراء خدمة'
  },
  {
    from: 'CREDIT_DEPOSITED',
    to: 'EXPIRED',
    trigger: ['system'],
    condition: 'انتهاء صلاحية الرصيد (365 يوم)',
    timeoutDays: 365
  },

  // من جاري الاستخدام
  {
    from: 'ORDER_PAYMENT_IN_PROGRESS',
    to: 'CREDIT_DEPOSITED',
    trigger: ['customer', 'system'],
    condition: 'إلغاء طلب الخدمة'
  },
  {
    from: 'ORDER_PAYMENT_IN_PROGRESS',
    to: 'COMPLETED',
    trigger: ['system'],
    condition: 'استخدام كامل الرصيد'
  }
];

/**
 * الحصول على الانتقالات المسموح بها من حالة معينة
 */
export function getAvailableTransitions(
  currentStatus: FinancingApplicationStatus
): StateTransition[] {
  return ALLOWED_TRANSITIONS.filter(t => t.from === currentStatus);
}

/**
 * الحصول على الانتقالات المسموح بها لمحفز معين
 */
export function getTransitionsForTrigger(
  currentStatus: FinancingApplicationStatus,
  trigger: TransitionTrigger
): StateTransition[] {
  return ALLOWED_TRANSITIONS.filter(
    t => t.from === currentStatus && t.trigger.includes(trigger)
  );
}

/**
 * الحصول على الحالات التي يمكن الانتقال إليها
 */
export function getNextPossibleStates(
  currentStatus: FinancingApplicationStatus
): FinancingApplicationStatus[] {
  return getAvailableTransitions(currentStatus).map(t => t.to);
}

/**
 * التحقق من وجود انتقال مسموح
 */
export function transitionExists(
  from: FinancingApplicationStatus,
  to: FinancingApplicationStatus
): boolean {
  return ALLOWED_TRANSITIONS.some(t => t.from === from && t.to === to);
}

/**
 * الحصول على تفاصيل انتقال معين
 */
export function getTransition(
  from: FinancingApplicationStatus,
  to: FinancingApplicationStatus
): StateTransition | undefined {
  return ALLOWED_TRANSITIONS.find(t => t.from === from && t.to === to);
}
