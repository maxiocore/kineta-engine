import { StateDefinition, FinancingApplicationStatus } from './types';

/**
 * تعريفات جميع الحالات مع التفاصيل
 */
export const STATE_DEFINITIONS: Record<FinancingApplicationStatus, StateDefinition> = {
  DRAFT: {
    status: 'DRAFT',
    nameAr: 'مسودة',
    nameEn: 'Draft',
    description: 'طلب غير مكتمل - لم يتم إرساله بعد',
    userMessage: 'أكمل طلبك للحصول على تمويل الخدمات',
    isTerminal: false,
    requiredAction: 'إكمال البيانات والمستندات المطلوبة',
    timeoutDays: 30,
    color: 'gray',
    icon: 'FileEdit'
  },
  SUBMITTED: {
    status: 'SUBMITTED',
    nameAr: 'تم الاستلام',
    nameEn: 'Submitted',
    description: 'تم إرسال الطلب وهو بانتظار المراجعة',
    userMessage: 'تم استلام طلبك بنجاح وسيتم مراجعته قريباً',
    isTerminal: false,
    color: 'blue',
    icon: 'Send'
  },
  UNDER_REVIEW: {
    status: 'UNDER_REVIEW',
    nameAr: 'قيد المراجعة',
    nameEn: 'Under Review',
    description: 'الطلب قيد الدراسة من قبل فريق التمويل',
    userMessage: 'طلبك قيد المراجعة حالياً',
    isTerminal: false,
    color: 'blue',
    icon: 'Search'
  },
  ADDITIONAL_INFO_REQUIRED: {
    status: 'ADDITIONAL_INFO_REQUIRED',
    nameAr: 'مطلوب معلومات إضافية',
    nameEn: 'Additional Info Required',
    description: 'يحتاج الطلب لمستندات أو معلومات إضافية',
    userMessage: 'يرجى تزويدنا بالمعلومات أو المستندات الإضافية المطلوبة',
    isTerminal: false,
    requiredAction: 'تحميل المستندات المطلوبة',
    timeoutDays: 14,
    color: 'yellow',
    icon: 'AlertCircle'
  },
  RISK_CHECK: {
    status: 'RISK_CHECK',
    nameAr: 'فحص المخاطر',
    nameEn: 'Risk Check',
    description: 'جاري التحقق من الجدارة الائتمانية',
    userMessage: 'جاري التحقق من بيانات الطلب',
    isTerminal: false,
    color: 'purple',
    icon: 'Shield'
  },
  APPROVED: {
    status: 'APPROVED',
    nameAr: 'موافقة',
    nameEn: 'Approved',
    description: 'تمت الموافقة على طلب التمويل بالكامل',
    userMessage: 'تهانينا! تمت الموافقة على طلب تمويل الخدمات',
    isTerminal: false,
    color: 'green',
    icon: 'CheckCircle'
  },
  APPROVED_WITH_LIMITS: {
    status: 'APPROVED_WITH_LIMITS',
    nameAr: 'موافقة مع قيود',
    nameEn: 'Approved with Limits',
    description: 'تمت الموافقة بمبلغ أقل أو شروط إضافية',
    userMessage: 'تمت الموافقة على طلبك بقيمة معدّلة',
    isTerminal: false,
    color: 'orange',
    icon: 'CheckCircle'
  },
  DECLINED: {
    status: 'DECLINED',
    nameAr: 'مرفوض',
    nameEn: 'Declined',
    description: 'تم رفض طلب التمويل',
    userMessage: 'نعتذر، لم تتم الموافقة على طلبك. يمكنك تقديم طلب جديد لاحقاً',
    isTerminal: true,
    color: 'red',
    icon: 'XCircle'
  },
  CONTRACT_PRESENTED: {
    status: 'CONTRACT_PRESENTED',
    nameAr: 'تم عرض العقد',
    nameEn: 'Contract Presented',
    description: 'العقد جاهز للمراجعة والتوقيع',
    userMessage: 'العقد جاهز - يرجى مراجعته والتوقيع إلكترونياً',
    isTerminal: false,
    requiredAction: 'مراجعة وتوقيع العقد',
    timeoutDays: 7,
    color: 'blue',
    icon: 'FileText'
  },
  CONTRACT_ACCEPTED: {
    status: 'CONTRACT_ACCEPTED',
    nameAr: 'قبول العقد',
    nameEn: 'Contract Accepted',
    description: 'وقّع العميل على العقد إلكترونياً',
    userMessage: 'تم قبول العقد - بانتظار الاعتماد النهائي',
    isTerminal: false,
    color: 'green',
    icon: 'FileCheck'
  },
  CONTRACT_FINALIZED: {
    status: 'CONTRACT_FINALIZED',
    nameAr: 'اعتماد العقد',
    nameEn: 'Contract Finalized',
    description: 'تم اعتماد العقد رسمياً',
    userMessage: 'تم اعتماد العقد رسمياً',
    isTerminal: false,
    color: 'green',
    icon: 'BadgeCheck'
  },
  CREDIT_DEPOSIT_PENDING: {
    status: 'CREDIT_DEPOSIT_PENDING',
    nameAr: 'قيد إضافة الرصيد',
    nameEn: 'Credit Deposit Pending',
    description: 'جاري إضافة رصيد الخدمات للحساب',
    userMessage: 'جاري تفعيل رصيد الخدمات في حسابك...',
    isTerminal: false,
    color: 'blue',
    icon: 'Loader'
  },
  CREDIT_DEPOSITED: {
    status: 'CREDIT_DEPOSITED',
    nameAr: 'تم إضافة الرصيد',
    nameEn: 'Credit Deposited',
    description: 'رصيد الخدمات متاح للاستخدام',
    userMessage: 'رصيد الخدمات جاهز! يمكنك استخدامه الآن لشراء الخدمات',
    isTerminal: false,
    requiredAction: 'استخدام الرصيد لشراء الخدمات',
    timeoutDays: 365,
    color: 'green',
    icon: 'Wallet'
  },
  ORDER_PAYMENT_IN_PROGRESS: {
    status: 'ORDER_PAYMENT_IN_PROGRESS',
    nameAr: 'جاري الاستخدام',
    nameEn: 'Order Payment In Progress',
    description: 'يتم استخدام الرصيد لشراء خدمة',
    userMessage: 'جاري تطبيق رصيد الخدمات على طلبك',
    isTerminal: false,
    color: 'blue',
    icon: 'CreditCard'
  },
  COMPLETED: {
    status: 'COMPLETED',
    nameAr: 'مكتمل',
    nameEn: 'Completed',
    description: 'تم استخدام كامل رصيد الخدمات بنجاح',
    userMessage: 'تم استخدام رصيد الخدمات بالكامل',
    isTerminal: true,
    color: 'green',
    icon: 'CheckCircle2'
  },
  EXPIRED: {
    status: 'EXPIRED',
    nameAr: 'منتهي الصلاحية',
    nameEn: 'Expired',
    description: 'انتهت المهلة المحددة للطلب أو العقد',
    userMessage: 'انتهت صلاحية الطلب. يمكنك تقديم طلب جديد',
    isTerminal: true,
    color: 'yellow',
    icon: 'Clock'
  },
  CANCELLED: {
    status: 'CANCELLED',
    nameAr: 'ملغي',
    nameEn: 'Cancelled',
    description: 'تم إلغاء الطلب من قبل العميل',
    userMessage: 'تم إلغاء الطلب. يمكنك تقديم طلب جديد في أي وقت',
    isTerminal: true,
    color: 'gray',
    icon: 'Ban'
  }
};

/**
 * الحصول على تعريف حالة معينة
 */
export function getStateDefinition(status: FinancingApplicationStatus): StateDefinition {
  return STATE_DEFINITIONS[status];
}

/**
 * التحقق مما إذا كانت الحالة نهائية
 */
export function isTerminalState(status: FinancingApplicationStatus): boolean {
  return STATE_DEFINITIONS[status].isTerminal;
}

/**
 * الحصول على جميع الحالات النهائية
 */
export function getTerminalStates(): FinancingApplicationStatus[] {
  return Object.values(STATE_DEFINITIONS)
    .filter(state => state.isTerminal)
    .map(state => state.status);
}

/**
 * الحصول على الحالات التي تتطلب إجراء من المستخدم
 */
export function getStatesRequiringUserAction(): FinancingApplicationStatus[] {
  return Object.values(STATE_DEFINITIONS)
    .filter(state => state.requiredAction)
    .map(state => state.status);
}
