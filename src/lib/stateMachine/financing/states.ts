/**
 * MaxioCore - Financing State Machine States (Unified Prefix)
 * نظام حالات التمويل (تمويل خدمات غير نقدي)
 * 
 * ⚠️ تنبيه: التمويل غير نقدي - رصيد خدمات داخل المنصة فقط
 */

import { StateDefinition, FinancingStatus } from '../core/types';

/**
 * تعريفات حالات التمويل (مع Prefix موحد)
 */
export const FINANCING_STATE_DEFINITIONS: Record<FinancingStatus, StateDefinition<FinancingStatus>> = {
  // ============================================
  // مرحلة التقديم
  // ============================================
  
  FIN_DRAFT: {
    status: 'FIN_DRAFT',
    domain: 'FINANCING',
    nameAr: 'مسودة',
    nameEn: 'Draft',
    internalDescription: 'طلب غير مكتمل - لم يتم إرساله بعد',
    userMessage: 'أكمل طلبك للحصول على تمويل الخدمات',
    isTerminal: false,
    requiredAction: 'إكمال البيانات والمستندات المطلوبة',
    timeoutDays: 30,
    color: 'gray',
    icon: 'FileEdit',
    severity: 'info',
    hideSecurityDetails: false
  },

  FIN_SUBMITTED: {
    status: 'FIN_SUBMITTED',
    domain: 'FINANCING',
    nameAr: 'تم الاستلام',
    nameEn: 'Submitted',
    internalDescription: 'تم إرسال الطلب وهو بانتظار المراجعة',
    userMessage: 'تم استلام طلبك بنجاح وسيتم مراجعته قريباً',
    isTerminal: false,
    color: 'blue',
    icon: 'Send',
    severity: 'info',
    hideSecurityDetails: false
  },

  FIN_UNDER_REVIEW: {
    status: 'FIN_UNDER_REVIEW',
    domain: 'FINANCING',
    nameAr: 'قيد المراجعة',
    nameEn: 'Under Review',
    internalDescription: 'الطلب قيد الدراسة من قبل فريق التمويل',
    userMessage: 'طلبك قيد المراجعة حالياً',
    isTerminal: false,
    color: 'blue',
    icon: 'Search',
    severity: 'info',
    hideSecurityDetails: false
  },

  FIN_ADDITIONAL_INFO_REQUIRED: {
    status: 'FIN_ADDITIONAL_INFO_REQUIRED',
    domain: 'FINANCING',
    nameAr: 'مطلوب معلومات إضافية',
    nameEn: 'Additional Info Required',
    internalDescription: 'يحتاج الطلب لمستندات أو معلومات إضافية',
    userMessage: 'يرجى تزويدنا بالمعلومات أو المستندات الإضافية المطلوبة',
    isTerminal: false,
    requiredAction: 'تحميل المستندات المطلوبة',
    timeoutDays: 14,
    color: 'yellow',
    icon: 'AlertCircle',
    severity: 'warning',
    hideSecurityDetails: false
  },

  // ============================================
  // مرحلة القرار
  // ============================================

  FIN_APPROVED: {
    status: 'FIN_APPROVED',
    domain: 'FINANCING',
    nameAr: 'موافقة',
    nameEn: 'Approved',
    internalDescription: 'تمت الموافقة على طلب التمويل بالكامل',
    userMessage: 'تهانينا! تمت الموافقة على طلب تمويل الخدمات',
    isTerminal: false,
    color: 'green',
    icon: 'CheckCircle',
    severity: 'success',
    hideSecurityDetails: false
  },

  FIN_APPROVED_WITH_LIMITS: {
    status: 'FIN_APPROVED_WITH_LIMITS',
    domain: 'FINANCING',
    nameAr: 'موافقة مع قيود',
    nameEn: 'Approved with Limits',
    internalDescription: 'تمت الموافقة بمبلغ أقل أو شروط إضافية',
    userMessage: 'تمت الموافقة على طلبك بقيمة معدّلة',
    isTerminal: false,
    color: 'orange',
    icon: 'CheckCircle',
    severity: 'success',
    hideSecurityDetails: false
  },

  FIN_DECLINED: {
    status: 'FIN_DECLINED',
    domain: 'FINANCING',
    nameAr: 'مرفوض',
    nameEn: 'Declined',
    // لا نكشف سبب الرفض الحقيقي
    internalDescription: 'تم رفض طلب التمويل - قد يكون السبب عدم الأهلية أو مخاطر ائتمانية',
    userMessage: 'نعتذر، لم تتم الموافقة على طلبك. يمكنك تقديم طلب جديد لاحقاً',
    isTerminal: true,
    color: 'red',
    icon: 'XCircle',
    severity: 'error',
    hideSecurityDetails: true // مهم: إخفاء سبب الرفض
  },

  // ============================================
  // مرحلة العقد
  // ============================================

  FIN_CONTRACT_PRESENTED: {
    status: 'FIN_CONTRACT_PRESENTED',
    domain: 'FINANCING',
    nameAr: 'تم عرض العقد',
    nameEn: 'Contract Presented',
    internalDescription: 'العقد جاهز للمراجعة والتوقيع',
    userMessage: 'العقد جاهز - يرجى مراجعته والتوقيع إلكترونياً',
    isTerminal: false,
    requiredAction: 'مراجعة وتوقيع العقد',
    timeoutDays: 7,
    color: 'blue',
    icon: 'FileText',
    severity: 'info',
    hideSecurityDetails: false
  },

  FIN_CONTRACT_ACCEPTED: {
    status: 'FIN_CONTRACT_ACCEPTED',
    domain: 'FINANCING',
    nameAr: 'قبول العقد',
    nameEn: 'Contract Accepted',
    internalDescription: 'وقّع العميل على العقد إلكترونياً',
    userMessage: 'تم قبول العقد - بانتظار الاعتماد النهائي',
    isTerminal: false,
    color: 'green',
    icon: 'FileCheck',
    severity: 'success',
    hideSecurityDetails: false
  },

  FIN_CONTRACT_FINALIZED: {
    status: 'FIN_CONTRACT_FINALIZED',
    domain: 'FINANCING',
    nameAr: 'اعتماد العقد',
    nameEn: 'Contract Finalized',
    internalDescription: 'تم اعتماد العقد رسمياً',
    userMessage: 'تم اعتماد العقد رسمياً',
    isTerminal: false,
    color: 'green',
    icon: 'BadgeCheck',
    severity: 'success',
    hideSecurityDetails: false
  },

  // ============================================
  // مرحلة الرصيد
  // ============================================

  FIN_CREDIT_DEPOSIT_PENDING: {
    status: 'FIN_CREDIT_DEPOSIT_PENDING',
    domain: 'FINANCING',
    nameAr: 'قيد إضافة الرصيد',
    nameEn: 'Credit Deposit Pending',
    internalDescription: 'جاري إضافة رصيد الخدمات للحساب',
    userMessage: 'جاري تفعيل رصيد الخدمات في حسابك...',
    isTerminal: false,
    color: 'blue',
    icon: 'Loader',
    severity: 'info',
    hideSecurityDetails: false
  },

  FIN_CREDIT_DEPOSITED: {
    status: 'FIN_CREDIT_DEPOSITED',
    domain: 'FINANCING',
    nameAr: 'تم إضافة الرصيد',
    nameEn: 'Credit Deposited',
    internalDescription: 'رصيد الخدمات متاح للاستخدام',
    userMessage: 'رصيد الخدمات جاهز! يمكنك استخدامه الآن لشراء الخدمات',
    isTerminal: false,
    requiredAction: 'استخدام الرصيد لشراء الخدمات',
    timeoutDays: 365,
    color: 'green',
    icon: 'Wallet',
    severity: 'success',
    hideSecurityDetails: false
  },

  // ============================================
  // الحالات النهائية
  // ============================================

  FIN_COMPLETED: {
    status: 'FIN_COMPLETED',
    domain: 'FINANCING',
    nameAr: 'مكتمل',
    nameEn: 'Completed',
    internalDescription: 'تم استخدام كامل رصيد الخدمات بنجاح',
    userMessage: 'تم استخدام رصيد الخدمات بالكامل',
    isTerminal: true,
    color: 'green',
    icon: 'CheckCircle2',
    severity: 'success',
    hideSecurityDetails: false
  },

  FIN_EXPIRED: {
    status: 'FIN_EXPIRED',
    domain: 'FINANCING',
    nameAr: 'منتهي الصلاحية',
    nameEn: 'Expired',
    internalDescription: 'انتهت المهلة المحددة للطلب أو العقد',
    userMessage: 'انتهت صلاحية الطلب. يمكنك تقديم طلب جديد',
    isTerminal: true,
    color: 'yellow',
    icon: 'Clock',
    severity: 'warning',
    hideSecurityDetails: false
  },

  FIN_CANCELLED: {
    status: 'FIN_CANCELLED',
    domain: 'FINANCING',
    nameAr: 'ملغي',
    nameEn: 'Cancelled',
    internalDescription: 'تم إلغاء الطلب من قبل العميل',
    userMessage: 'تم إلغاء الطلب. يمكنك تقديم طلب جديد في أي وقت',
    isTerminal: true,
    color: 'gray',
    icon: 'Ban',
    severity: 'info',
    hideSecurityDetails: false
  }
};

/**
 * الحصول على تعريف حالة معينة
 */
export function getFinancingStateDefinition(status: FinancingStatus): StateDefinition<FinancingStatus> {
  return FINANCING_STATE_DEFINITIONS[status];
}

/**
 * الحالات النهائية للتمويل
 */
export function getFinancingTerminalStates(): FinancingStatus[] {
  return Object.values(FINANCING_STATE_DEFINITIONS)
    .filter(state => state.isTerminal)
    .map(state => state.status);
}

/**
 * هل الحالة نهائية
 */
export function isFinancingTerminalState(status: FinancingStatus): boolean {
  return FINANCING_STATE_DEFINITIONS[status].isTerminal;
}

/**
 * الحصول على رسالة آمنة للمستخدم
 */
export function getFinancingUserMessage(status: FinancingStatus): string {
  return FINANCING_STATE_DEFINITIONS[status].userMessage;
}

/**
 * الحالات التي تتطلب إجراء من المستخدم
 */
export function getFinancingStatesRequiringAction(): FinancingStatus[] {
  return Object.values(FINANCING_STATE_DEFINITIONS)
    .filter(state => state.requiredAction)
    .map(state => state.status);
}
