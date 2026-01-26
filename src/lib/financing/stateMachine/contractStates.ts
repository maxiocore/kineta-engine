/**
 * حالات العقد والسند التنفيذي - منفصلة تماماً
 * Contract and Executive Bond States - Completely Separated
 * 
 * هذا الملف يحدد:
 * 1. حالات العقد (Contract States)
 * 2. حالات السند التنفيذي (Executive Bond States)
 * 
 * ⚠️ مهم: لا يوجد كمبيالة - تم حذفها نهائياً
 */

// ============================================
// حالات العقد - Contract States
// ============================================

export type ContractState =
  | 'DRAFT'           // مسودة - لم يتم عرض العقد بعد
  | 'PRESENTED'       // تم عرض العقد للعميل
  | 'READ_CONFIRMED'  // أكد العميل قراءة العقد كاملاً
  | 'ACCEPTED'        // تم قبول العقد والموافقة على الشروط
  | 'FINALIZED';      // تم اعتماد العقد رسمياً من الإدارة

export interface ContractStateDefinition {
  state: ContractState;
  nameAr: string;
  nameEn: string;
  description: string;
  userMessage: string;
  adminMessage: string;
  requiredAction?: string;
  isTerminal: boolean;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'orange';
  icon: string;
}

export const CONTRACT_STATE_DEFINITIONS: Record<ContractState, ContractStateDefinition> = {
  DRAFT: {
    state: 'DRAFT',
    nameAr: 'مسودة العقد',
    nameEn: 'Contract Draft',
    description: 'تم إنشاء العقد ولم يُعرض للعميل بعد',
    userMessage: 'جاري تحضير العقد',
    adminMessage: 'العقد في مرحلة التحضير',
    isTerminal: false,
    color: 'gray',
    icon: 'FileEdit'
  },
  PRESENTED: {
    state: 'PRESENTED',
    nameAr: 'تم عرض العقد',
    nameEn: 'Contract Presented',
    description: 'العقد معروض للعميل وينتظر القراءة',
    userMessage: 'يرجى قراءة العقد كاملاً قبل الموافقة',
    adminMessage: 'العقد معروض للعميل وبانتظار القراءة',
    requiredAction: 'قراءة العقد كاملاً',
    isTerminal: false,
    color: 'blue',
    icon: 'FileText'
  },
  READ_CONFIRMED: {
    state: 'READ_CONFIRMED',
    nameAr: 'تم تأكيد القراءة',
    nameEn: 'Reading Confirmed',
    description: 'أكد العميل قراءة العقد بالكامل',
    userMessage: 'تم تأكيد قراءة العقد - يمكنك الآن الموافقة',
    adminMessage: 'العميل قرأ العقد وبانتظار الموافقة',
    requiredAction: 'الموافقة على الشروط',
    isTerminal: false,
    color: 'yellow',
    icon: 'Eye'
  },
  ACCEPTED: {
    state: 'ACCEPTED',
    nameAr: 'تم قبول العقد',
    nameEn: 'Contract Accepted',
    description: 'وافق العميل على العقد والشروط',
    userMessage: 'تم قبول العقد - بانتظار الاعتماد النهائي',
    adminMessage: 'العميل وافق على العقد - بانتظار الاعتماد',
    requiredAction: 'انتظار اعتماد الإدارة',
    isTerminal: false,
    color: 'green',
    icon: 'FileCheck'
  },
  FINALIZED: {
    state: 'FINALIZED',
    nameAr: 'العقد معتمد',
    nameEn: 'Contract Finalized',
    description: 'تم اعتماد العقد رسمياً من الإدارة',
    userMessage: 'تم اعتماد العقد رسمياً',
    adminMessage: 'العقد معتمد ونافذ',
    isTerminal: true,
    color: 'green',
    icon: 'BadgeCheck'
  }
};

// ============================================
// حالات السند التنفيذي - Executive Bond States
// ============================================

export type ExecutiveBondState =
  | 'NOT_ISSUED'        // لم يتم إصداره بعد
  | 'ISSUING'           // جاري إصداره عبر نافذ
  | 'ISSUED'            // تم إصداره وبانتظار توقيع العميل
  | 'SIGNED_BY_CLIENT'; // تم توقيعه من العميل

export interface ExecutiveBondStateDefinition {
  state: ExecutiveBondState;
  nameAr: string;
  nameEn: string;
  description: string;
  userMessage: string;
  adminMessage: string;
  requiredAction?: string;
  adminAction?: string;
  isTerminal: boolean;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'orange' | 'purple';
  icon: string;
}

export const EXECUTIVE_BOND_STATE_DEFINITIONS: Record<ExecutiveBondState, ExecutiveBondStateDefinition> = {
  NOT_ISSUED: {
    state: 'NOT_ISSUED',
    nameAr: 'لم يُصدر بعد',
    nameEn: 'Not Issued',
    description: 'السند التنفيذي لم يُصدر بعد - سيتم إصداره بعد اعتماد العقد',
    userMessage: 'سيتم إصدار السند التنفيذي بعد اعتماد العقد',
    adminMessage: 'بانتظار اعتماد العقد لإصدار السند التنفيذي',
    adminAction: 'انتظار اعتماد العقد',
    isTerminal: false,
    color: 'gray',
    icon: 'Clock'
  },
  ISSUING: {
    state: 'ISSUING',
    nameAr: 'جاري إصدار السند',
    nameEn: 'Issuing Bond',
    description: 'جاري إصدار السند التنفيذي عبر منصة نافذ',
    userMessage: 'جاري إصدار السند التنفيذي - سنُعلمك عند الجاهزية',
    adminMessage: 'قم بإصدار السند التنفيذي عبر منصة نافذ',
    adminAction: 'إصدار السند عبر نافذ ثم تحديث الحالة',
    isTerminal: false,
    color: 'blue',
    icon: 'Loader'
  },
  ISSUED: {
    state: 'ISSUED',
    nameAr: 'تم إصدار السند',
    nameEn: 'Bond Issued',
    description: 'السند التنفيذي جاهز وبانتظار توقيع العميل عبر نافذ',
    userMessage: 'السند التنفيذي جاهز - يرجى توقيعه عبر منصة نافذ',
    adminMessage: 'السند جاهز - بانتظار توقيع العميل عبر نافذ',
    requiredAction: 'توقيع السند التنفيذي عبر منصة نافذ',
    isTerminal: false,
    color: 'orange',
    icon: 'FileSignature'
  },
  SIGNED_BY_CLIENT: {
    state: 'SIGNED_BY_CLIENT',
    nameAr: 'تم التوقيع',
    nameEn: 'Signed by Client',
    description: 'تم توقيع السند التنفيذي من قبل العميل',
    userMessage: 'تم توقيع السند التنفيذي بنجاح',
    adminMessage: 'العميل وقّع السند التنفيذي - جميع المستندات مكتملة',
    isTerminal: true,
    color: 'green',
    icon: 'CheckCircle2'
  }
};

// ============================================
// انتقالات العقد المسموحة
// ============================================

export interface ContractTransition {
  from: ContractState;
  to: ContractState;
  trigger: 'customer' | 'system' | 'admin';
  condition: string;
}

export const CONTRACT_TRANSITIONS: ContractTransition[] = [
  // من المسودة
  { from: 'DRAFT', to: 'PRESENTED', trigger: 'system', condition: 'بعد الموافقة على الطلب' },
  
  // من تم العرض
  { from: 'PRESENTED', to: 'READ_CONFIRMED', trigger: 'customer', condition: 'بعد قراءة العقد كاملاً والتأكيد' },
  
  // من تم تأكيد القراءة
  { from: 'READ_CONFIRMED', to: 'ACCEPTED', trigger: 'customer', condition: 'بعد الموافقة على الشروط والأحكام' },
  
  // من تم القبول
  { from: 'ACCEPTED', to: 'FINALIZED', trigger: 'admin', condition: 'اعتماد إداري نهائي' }
];

// ============================================
// انتقالات السند التنفيذي المسموحة
// ============================================

export interface ExecutiveBondTransition {
  from: ExecutiveBondState;
  to: ExecutiveBondState;
  trigger: 'customer' | 'system' | 'admin';
  condition: string;
}

export const EXECUTIVE_BOND_TRANSITIONS: ExecutiveBondTransition[] = [
  // من لم يُصدر
  { from: 'NOT_ISSUED', to: 'ISSUING', trigger: 'admin', condition: 'بدء إصدار السند عبر نافذ' },
  
  // من جاري الإصدار
  { from: 'ISSUING', to: 'ISSUED', trigger: 'admin', condition: 'تم إصدار السند بنجاح من نافذ' },
  
  // من تم الإصدار
  { from: 'ISSUED', to: 'SIGNED_BY_CLIENT', trigger: 'customer', condition: 'تأكيد التوقيع عبر نافذ' }
];

// ============================================
// الدوال المساعدة
// ============================================

/**
 * التحقق من إمكانية الانتقال
 */
export function canTransitionContract(from: ContractState, to: ContractState): boolean {
  return CONTRACT_TRANSITIONS.some(t => t.from === from && t.to === to);
}

export function canTransitionBond(from: ExecutiveBondState, to: ExecutiveBondState): boolean {
  return EXECUTIVE_BOND_TRANSITIONS.some(t => t.from === from && t.to === to);
}

/**
 * الحصول على الحالة التالية المتاحة
 */
export function getNextContractStates(current: ContractState): ContractState[] {
  return CONTRACT_TRANSITIONS.filter(t => t.from === current).map(t => t.to);
}

export function getNextBondStates(current: ExecutiveBondState): ExecutiveBondState[] {
  return EXECUTIVE_BOND_TRANSITIONS.filter(t => t.from === current).map(t => t.to);
}

/**
 * التحقق من اكتمال العقد
 */
export function isContractComplete(state: ContractState): boolean {
  return state === 'FINALIZED';
}

/**
 * التحقق من اكتمال السند
 */
export function isBondComplete(state: ExecutiveBondState): boolean {
  return state === 'SIGNED_BY_CLIENT';
}

/**
 * هل يمكن للعميل الإجراء؟
 */
export function isCustomerActionRequired(contractState: ContractState, bondState: ExecutiveBondState): {
  required: boolean;
  action: string;
  target: 'contract' | 'bond';
} {
  // أولاً: التحقق من العقد
  if (contractState === 'PRESENTED') {
    return { required: true, action: 'قراءة العقد كاملاً', target: 'contract' };
  }
  if (contractState === 'READ_CONFIRMED') {
    return { required: true, action: 'الموافقة على العقد', target: 'contract' };
  }
  
  // ثانياً: التحقق من السند
  if (bondState === 'ISSUED') {
    return { required: true, action: 'توقيع السند التنفيذي عبر نافذ', target: 'bond' };
  }
  
  return { required: false, action: '', target: 'contract' };
}
