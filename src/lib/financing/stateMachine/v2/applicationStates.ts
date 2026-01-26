/**
 * حالات الطلب الرئيسية
 * Application Status Definitions
 */

import { StateDefinition, ApplicationStatus } from './types';

export const APPLICATION_STATES: Record<ApplicationStatus, StateDefinition<ApplicationStatus>> = {
  DRAFT: {
    status: 'DRAFT',
    nameAr: 'مسودة',
    nameEn: 'Draft',
    description: 'طلب غير مكتمل - لم يتم إرساله بعد',
    customerMessage: 'أكمل طلبك للحصول على تمويل الخدمات',
    phase: 'application',
    isTerminal: false,
    requiredAction: 'إكمال البيانات الأساسية',
    requiredActionActor: 'customer',
    timeoutDays: 30,
    color: 'gray',
    icon: 'FileEdit',
    customerVisible: true
  },
  
  REQUEST_SUBMITTED: {
    status: 'REQUEST_SUBMITTED',
    nameAr: 'طلب مقدم',
    nameEn: 'Request Submitted',
    description: 'تم تقديم الطلب وبانتظار المراجعة الأولية',
    customerMessage: 'تم استلام طلبك بنجاح وسيتم مراجعته قريباً',
    phase: 'application',
    isTerminal: false,
    color: 'blue',
    icon: 'Send',
    customerVisible: true
  },
  
  UNDER_REVIEW: {
    status: 'UNDER_REVIEW',
    nameAr: 'قيد المراجعة',
    nameEn: 'Under Review',
    description: 'الطلب قيد الدراسة من قبل فريق التمويل',
    customerMessage: 'طلبك قيد المراجعة حالياً',
    phase: 'application',
    isTerminal: false,
    requiredAction: 'مراجعة الطلب',
    requiredActionActor: 'admin',
    color: 'blue',
    icon: 'Search',
    customerVisible: true
  },
  
  INFO_REQUIRED: {
    status: 'INFO_REQUIRED',
    nameAr: 'مطلوب معلومات إضافية',
    nameEn: 'Additional Info Required',
    description: 'يحتاج الطلب لمستندات أو معلومات إضافية',
    customerMessage: 'يرجى تزويدنا بالمعلومات أو المستندات الإضافية المطلوبة',
    phase: 'application',
    isTerminal: false,
    requiredAction: 'تحميل المستندات المطلوبة',
    requiredActionActor: 'customer',
    timeoutDays: 14,
    color: 'yellow',
    icon: 'AlertCircle',
    customerVisible: true
  },
  
  ADMIN_SETUP: {
    status: 'ADMIN_SETUP',
    nameAr: 'قيد الإعداد',
    nameEn: 'Admin Setup',
    description: 'الأدمن يقوم بضبط تفاصيل العرض (القيمة، المدة، الاسم)',
    customerMessage: 'جاري إعداد عرض التمويل الخاص بك',
    phase: 'admin_setup',
    isTerminal: false,
    requiredAction: 'ضبط تفاصيل العرض',
    requiredActionActor: 'admin',
    color: 'purple',
    icon: 'Settings',
    customerVisible: true
  },
  
  OFFER_READY: {
    status: 'OFFER_READY',
    nameAr: 'العرض جاهز',
    nameEn: 'Offer Ready',
    description: 'تم إعداد العرض وجاهز لإرسال العقد',
    customerMessage: 'عرض التمويل جاهز! سيتم إرسال العقد قريباً',
    phase: 'admin_setup',
    isTerminal: false,
    requiredAction: 'إرسال العقد',
    requiredActionActor: 'admin',
    color: 'green',
    icon: 'CheckCircle',
    customerVisible: true
  },
  
  CONTRACT_PHASE: {
    status: 'CONTRACT_PHASE',
    nameAr: 'مرحلة العقد',
    nameEn: 'Contract Phase',
    description: 'العقد قيد المراجعة والتوقيع',
    customerMessage: 'يرجى مراجعة العقد وتوقيعه',
    phase: 'contract',
    isTerminal: false,
    requiredAction: 'توقيع العقد',
    requiredActionActor: 'customer',
    timeoutDays: 7,
    color: 'blue',
    icon: 'FileText',
    customerVisible: true
  },
  
  ACK_PHASE: {
    status: 'ACK_PHASE',
    nameAr: 'مرحلة الإقرار',
    nameEn: 'Acknowledgment Phase',
    description: 'الإقرار بالشروط قيد المراجعة والتوقيع',
    customerMessage: 'يرجى مراجعة الإقرار وتوقيعه',
    phase: 'acknowledgment',
    isTerminal: false,
    requiredAction: 'توقيع الإقرار',
    requiredActionActor: 'customer',
    timeoutDays: 7,
    color: 'blue',
    icon: 'FileCheck',
    customerVisible: true
  },
  
  BOND_PHASE: {
    status: 'BOND_PHASE',
    nameAr: 'مرحلة سند الأمر',
    nameEn: 'Executive Bond Phase',
    description: 'سند الأمر قيد الإصدار والتوقيع',
    customerMessage: 'جاري إصدار سند الأمر - سيتم إشعارك عند الحاجة للتوقيع',
    phase: 'bond',
    isTerminal: false,
    requiredAction: 'إصدار السند',
    requiredActionActor: 'admin',
    color: 'purple',
    icon: 'Stamp',
    customerVisible: true
  },
  
  CREDIT_PENDING: {
    status: 'CREDIT_PENDING',
    nameAr: 'قيد إضافة الرصيد',
    nameEn: 'Credit Pending',
    description: 'جاري إضافة رصيد الخدمات للحساب',
    customerMessage: 'جاري تفعيل رصيد الخدمات في حسابك...',
    phase: 'activation',
    isTerminal: false,
    color: 'blue',
    icon: 'Loader',
    customerVisible: false  // حالة داخلية
  },
  
  CREDIT_ACTIVE: {
    status: 'CREDIT_ACTIVE',
    nameAr: 'رصيد الخدمات نشط',
    nameEn: 'Credit Active',
    description: 'رصيد الخدمات متاح للاستخدام',
    customerMessage: 'رصيد الخدمات جاهز! يمكنك استخدامه الآن لشراء الخدمات',
    phase: 'usage',
    isTerminal: false,
    requiredAction: 'استخدام الرصيد لشراء الخدمات',
    requiredActionActor: 'customer',
    timeoutDays: 365,
    color: 'green',
    icon: 'Wallet',
    customerVisible: true
  },
  
  IN_USE: {
    status: 'IN_USE',
    nameAr: 'جاري الاستخدام',
    nameEn: 'In Use',
    description: 'يتم استخدام الرصيد لشراء الخدمات',
    customerMessage: 'جاري استخدام رصيد الخدمات',
    phase: 'usage',
    isTerminal: false,
    color: 'blue',
    icon: 'CreditCard',
    customerVisible: true
  },
  
  COMPLETED: {
    status: 'COMPLETED',
    nameAr: 'مكتمل',
    nameEn: 'Completed',
    description: 'تم استخدام كامل رصيد الخدمات وسداد الأقساط',
    customerMessage: 'تم إتمام عقد التمويل بنجاح',
    phase: 'terminal',
    isTerminal: true,
    color: 'green',
    icon: 'CheckCircle2',
    customerVisible: true
  },
  
  DECLINED: {
    status: 'DECLINED',
    nameAr: 'مرفوض',
    nameEn: 'Declined',
    description: 'تم رفض طلب التمويل',
    customerMessage: 'نعتذر، لم تتم الموافقة على طلبك. يمكنك تقديم طلب جديد لاحقاً',
    phase: 'terminal',
    isTerminal: true,
    color: 'red',
    icon: 'XCircle',
    customerVisible: true
  },
  
  CANCELLED: {
    status: 'CANCELLED',
    nameAr: 'ملغي',
    nameEn: 'Cancelled',
    description: 'تم إلغاء الطلب',
    customerMessage: 'تم إلغاء الطلب. يمكنك تقديم طلب جديد في أي وقت',
    phase: 'terminal',
    isTerminal: true,
    color: 'gray',
    icon: 'Ban',
    customerVisible: true
  },
  
  EXPIRED: {
    status: 'EXPIRED',
    nameAr: 'منتهي الصلاحية',
    nameEn: 'Expired',
    description: 'انتهت المهلة المحددة للطلب',
    customerMessage: 'انتهت صلاحية الطلب. يمكنك تقديم طلب جديد',
    phase: 'terminal',
    isTerminal: true,
    color: 'yellow',
    icon: 'Clock',
    customerVisible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // حالات الإيداع الجديدة (Deposit States)
  // ═══════════════════════════════════════════════════════════════
  
  CREDIT_DEPOSIT_PENDING: {
    status: 'CREDIT_DEPOSIT_PENDING',
    nameAr: 'قيد معالجة الإيداع',
    nameEn: 'Credit Deposit Pending',
    description: 'جاري معالجة إيداع رصيد الخدمات',
    customerMessage: 'جاري إضافة رصيد الخدمات إلى حسابك...',
    phase: 'activation',
    isTerminal: false,
    color: 'blue',
    icon: 'Loader',
    customerVisible: false
  },

  CREDIT_DEPOSITED: {
    status: 'CREDIT_DEPOSITED',
    nameAr: 'تم الإيداع',
    nameEn: 'Credit Deposited',
    description: 'تم إيداع رصيد الخدمات بنجاح',
    customerMessage: 'تم إيداع رصيد الخدمات بنجاح! يمكنك استخدامه الآن',
    phase: 'activation',
    isTerminal: false,
    color: 'green',
    icon: 'CheckCircle',
    customerVisible: true
  },

  CREDIT_DEPOSIT_FAILED: {
    status: 'CREDIT_DEPOSIT_FAILED',
    nameAr: 'فشل الإيداع',
    nameEn: 'Credit Deposit Failed',
    description: 'فشلت عملية إيداع رصيد الخدمات',
    customerMessage: 'حدث خطأ أثناء إضافة الرصيد. فريقنا يعمل على حل المشكلة',
    phase: 'activation',
    isTerminal: false,
    requiredAction: 'إعادة محاولة الإيداع',
    requiredActionActor: 'admin',
    color: 'red',
    icon: 'AlertCircle',
    customerVisible: false
  },

  RETRY_SCHEDULED: {
    status: 'RETRY_SCHEDULED',
    nameAr: 'مجدول لإعادة المحاولة',
    nameEn: 'Retry Scheduled',
    description: 'تم جدولة إعادة محاولة الإيداع تلقائياً',
    customerMessage: 'جاري إعادة محاولة إضافة الرصيد...',
    phase: 'activation',
    isTerminal: false,
    color: 'orange',
    icon: 'RefreshCw',
    customerVisible: false
  }
};

/**
 * الحصول على تعريف حالة معينة
 */
export function getApplicationState(status: ApplicationStatus): StateDefinition<ApplicationStatus> {
  return APPLICATION_STATES[status];
}

/**
 * التحقق مما إذا كانت الحالة نهائية
 */
export function isTerminalState(status: ApplicationStatus): boolean {
  return APPLICATION_STATES[status].isTerminal;
}

/**
 * الحصول على جميع الحالات النهائية
 */
export function getTerminalStates(): ApplicationStatus[] {
  return Object.values(APPLICATION_STATES)
    .filter(state => state.isTerminal)
    .map(state => state.status);
}

/**
 * الحصول على الحالات حسب المرحلة
 */
export function getStatesByPhase(phase: string): ApplicationStatus[] {
  return Object.values(APPLICATION_STATES)
    .filter(state => state.phase === phase)
    .map(state => state.status);
}

/**
 * الحصول على الحالات المرئية للعميل
 */
export function getCustomerVisibleStates(): ApplicationStatus[] {
  return Object.values(APPLICATION_STATES)
    .filter(state => state.customerVisible)
    .map(state => state.status);
}
