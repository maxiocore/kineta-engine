/**
 * قواعد انتقال الحالات
 * State Transition Rules
 */

import { 
  StateTransition, 
  ApplicationStatus, 
  ContractStatus,
  AcknowledgmentStatus,
  ExecutiveBondStatus,
  TransitionActor 
} from './types';

// ==========================================
// انتقالات حالات الطلب
// ==========================================
export const APPLICATION_TRANSITIONS: StateTransition<ApplicationStatus>[] = [
  // من مسودة
  {
    from: 'DRAFT',
    to: 'REQUEST_SUBMITTED',
    actors: ['customer'],
    condition: 'Customer submits basic application data',
    conditionAr: 'العميل يقدم البيانات الأساسية للطلب',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'DRAFT',
    to: 'CANCELLED',
    actors: ['customer'],
    conditionAr: 'إلغاء من العميل',
    requiresAudit: true,
    customerVisible: true
  },
  
  // من طلب مقدم
  {
    from: 'REQUEST_SUBMITTED',
    to: 'UNDER_REVIEW',
    actors: ['system', 'admin'],
    conditionAr: 'استلام تلقائي أو يدوي',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'REQUEST_SUBMITTED',
    to: 'CANCELLED',
    actors: ['customer'],
    conditionAr: 'إلغاء من العميل',
    requiresAudit: true,
    customerVisible: true
  },
  
  // من قيد المراجعة
  {
    from: 'UNDER_REVIEW',
    to: 'INFO_REQUIRED',
    actors: ['admin'],
    conditionAr: 'طلب مستندات إضافية',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'UNDER_REVIEW',
    to: 'ADMIN_SETUP',
    actors: ['admin'],
    conditionAr: 'موافقة مبدئية - الأدمن يضبط التفاصيل',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'UNDER_REVIEW',
    to: 'DECLINED',
    actors: ['admin'],
    conditionAr: 'رفض الطلب',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'UNDER_REVIEW',
    to: 'CANCELLED',
    actors: ['customer'],
    conditionAr: 'إلغاء من العميل',
    requiresAudit: true,
    customerVisible: true
  },
  
  // من مطلوب معلومات إضافية
  {
    from: 'INFO_REQUIRED',
    to: 'UNDER_REVIEW',
    actors: ['customer'],
    conditionAr: 'تقديم المستندات المطلوبة',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'INFO_REQUIRED',
    to: 'EXPIRED',
    actors: ['system'],
    conditionAr: 'انتهاء مهلة 14 يوم',
    timeoutDays: 14,
    requiresAudit: true,
    customerVisible: true
  },
  
  // من ضبط الأدمن
  {
    from: 'ADMIN_SETUP',
    to: 'OFFER_READY',
    actors: ['admin'],
    conditionAr: 'إكمال ضبط العرض (القيمة، المدة، الاسم)',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'ADMIN_SETUP',
    to: 'DECLINED',
    actors: ['admin'],
    conditionAr: 'رفض الطلب',
    requiresAudit: true,
    customerVisible: true
  },
  
  // من العرض جاهز
  {
    from: 'OFFER_READY',
    to: 'CONTRACT_PHASE',
    actors: ['admin'],
    conditionAr: 'إرسال العقد للعميل',
    requiresAudit: true,
    customerVisible: true
  },
  
  // من مرحلة العقد
  {
    from: 'CONTRACT_PHASE',
    to: 'ACK_PHASE',
    actors: ['admin'],
    conditionAr: 'اعتماد العقد وإرسال الإقرار',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'CONTRACT_PHASE',
    to: 'DECLINED',
    actors: ['customer'],
    conditionAr: 'رفض العقد من قبل العميل',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'CONTRACT_PHASE',
    to: 'EXPIRED',
    actors: ['system'],
    conditionAr: 'انتهاء مهلة 7 أيام',
    timeoutDays: 7,
    requiresAudit: true,
    customerVisible: true
  },
  
  // من مرحلة الإقرار
  {
    from: 'ACK_PHASE',
    to: 'BOND_PHASE',
    actors: ['admin'],
    conditionAr: 'توقيع الإقرار - بدء مرحلة السند',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'ACK_PHASE',
    to: 'EXPIRED',
    actors: ['system'],
    conditionAr: 'انتهاء مهلة 7 أيام',
    timeoutDays: 7,
    requiresAudit: true,
    customerVisible: true
  },
  
  // من مرحلة سند الأمر
  {
    from: 'BOND_PHASE',
    to: 'CREDIT_PENDING',
    actors: ['admin'],
    conditionAr: 'تأكيد توقيع السند - بدء إضافة الرصيد',
    requiresAudit: true,
    customerVisible: false
  },
  
  // من قيد إضافة الرصيد
  {
    from: 'CREDIT_PENDING',
    to: 'CREDIT_ACTIVE',
    actors: ['system'],
    conditionAr: 'نجاح إضافة رصيد الخدمات',
    requiresAudit: true,
    customerVisible: true
  },
  
  // من رصيد نشط
  {
    from: 'CREDIT_ACTIVE',
    to: 'IN_USE',
    actors: ['customer'],
    conditionAr: 'بدء استخدام الرصيد',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'CREDIT_ACTIVE',
    to: 'EXPIRED',
    actors: ['system'],
    conditionAr: 'انتهاء صلاحية الرصيد (365 يوم)',
    timeoutDays: 365,
    requiresAudit: true,
    customerVisible: true
  },
  
  // من جاري الاستخدام
  {
    from: 'IN_USE',
    to: 'CREDIT_ACTIVE',
    actors: ['customer', 'system'],
    conditionAr: 'إلغاء طلب الخدمة',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'IN_USE',
    to: 'COMPLETED',
    actors: ['system'],
    conditionAr: 'استخدام كامل الرصيد وسداد الأقساط',
    requiresAudit: true,
    customerVisible: true
  }
];

// ==========================================
// انتقالات حالات العقد
// ==========================================
export const CONTRACT_TRANSITIONS: StateTransition<ContractStatus>[] = [
  {
    from: 'NOT_SENT',
    to: 'SENT',
    actors: ['admin'],
    conditionAr: 'الأدمن يرسل العقد PDF',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'SENT',
    to: 'VIEWED',
    actors: ['customer'],
    conditionAr: 'العميل يفتح العقد',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'VIEWED',
    to: 'SIGNED',
    actors: ['customer'],
    conditionAr: 'العميل يوقع العقد إلكترونياً',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'SIGNED',
    to: 'FINALIZED',
    actors: ['admin'],
    conditionAr: 'الأدمن يعتمد العقد',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'SENT',
    to: 'EXPIRED',
    actors: ['system'],
    conditionAr: 'انتهاء المهلة',
    timeoutDays: 7,
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'VIEWED',
    to: 'REJECTED',
    actors: ['customer'],
    conditionAr: 'العميل يرفض العقد',
    requiresAudit: true,
    customerVisible: true
  }
];

// ==========================================
// انتقالات حالات الإقرار
// ==========================================
export const ACKNOWLEDGMENT_TRANSITIONS: StateTransition<AcknowledgmentStatus>[] = [
  {
    from: 'NOT_SENT',
    to: 'SENT',
    actors: ['admin'],
    conditionAr: 'الأدمن يرسل الإقرار PDF',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'SENT',
    to: 'VIEWED',
    actors: ['customer'],
    conditionAr: 'العميل يفتح الإقرار',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'VIEWED',
    to: 'SIGNED',
    actors: ['customer'],
    conditionAr: 'العميل يوقع الإقرار',
    requiresAudit: true,
    customerVisible: true
  }
];

// ==========================================
// انتقالات حالات سند الأمر (محدثة)
// ==========================================
export const BOND_TRANSITIONS: StateTransition<ExecutiveBondStatus>[] = [
  {
    from: 'NOT_ISSUED',
    to: 'ISSUING',
    actors: ['admin'],
    conditionAr: 'بدء إصدار السند في نافذ',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'ISSUING',
    to: 'ISSUED',
    actors: ['admin'],
    conditionAr: 'تم إصدار السند في نافذ',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'ISSUING',
    to: 'SENT_TO_CLIENT',
    actors: ['admin'],
    conditionAr: 'إرسال السند مباشرة للعميل',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'ISSUED',
    to: 'SENT_TO_CLIENT',
    actors: ['admin'],
    conditionAr: 'إرسال إشعار للعميل',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'SENT_TO_CLIENT',
    to: 'SIGNED_BY_CLIENT',
    actors: ['customer'],
    conditionAr: 'تأكيد توقيع العميل',
    requiresAudit: true,
    customerVisible: true
  },
  {
    from: 'SIGNED_BY_CLIENT',
    to: 'VERIFIED_BY_ADMIN',
    actors: ['admin'],
    conditionAr: 'اعتماد السند من الإدارة',
    requiresAudit: true,
    customerVisible: true
  }
];

// ==========================================
// دوال مساعدة
// ==========================================

/**
 * الحصول على الانتقالات المتاحة من حالة معينة
 */
export function getAvailableTransitions<T extends string>(
  transitions: StateTransition<T>[],
  currentStatus: T
): StateTransition<T>[] {
  return transitions.filter(t => t.from === currentStatus);
}

/**
 * الحصول على الانتقالات المتاحة لـ actor معين
 */
export function getTransitionsForActor<T extends string>(
  transitions: StateTransition<T>[],
  currentStatus: T,
  actor: TransitionActor
): StateTransition<T>[] {
  return transitions.filter(
    t => t.from === currentStatus && t.actors.includes(actor)
  );
}

/**
 * التحقق من وجود انتقال
 */
export function transitionExists<T extends string>(
  transitions: StateTransition<T>[],
  from: T,
  to: T
): boolean {
  return transitions.some(t => t.from === from && t.to === to);
}

/**
 * الحصول على انتقال معين
 */
export function getTransition<T extends string>(
  transitions: StateTransition<T>[],
  from: T,
  to: T
): StateTransition<T> | undefined {
  return transitions.find(t => t.from === from && t.to === to);
}

/**
 * الحصول على الحالات التالية الممكنة
 */
export function getNextPossibleStates<T extends string>(
  transitions: StateTransition<T>[],
  currentStatus: T
): T[] {
  return getAvailableTransitions(transitions, currentStatus).map(t => t.to);
}
