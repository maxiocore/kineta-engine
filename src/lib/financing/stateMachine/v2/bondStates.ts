/**
 * تعريفات حالات سند الأمر المستقل
 * Independent Executive Bond States
 * 
 * الحالات:
 * - NOT_ISSUED: لم يصدر بعد
 * - ISSUING: جاري الإصدار (في نافذ)
 * - SENT_TO_CLIENT: تم الإرسال للعميل
 * - SIGNED_BY_CLIENT: موقع من العميل
 * - VERIFIED_BY_ADMIN: معتمد من الأدمن
 */

export type ExecutiveBondStatus =
  | 'NOT_ISSUED'
  | 'ISSUING'
  | 'ISSUED'
  | 'SENT_TO_CLIENT'
  | 'SIGNED_BY_CLIENT'
  | 'VERIFIED_BY_ADMIN';

export interface BondStateDefinition {
  status: ExecutiveBondStatus;
  nameAr: string;
  nameEn: string;
  description: string;
  customerMessage: string;
  adminMessage: string;
  requiredAction?: string;
  actionActor?: 'admin' | 'customer';
  isTerminal: boolean;
  customerVisible: boolean;
  color: 'gray' | 'blue' | 'yellow' | 'orange' | 'green' | 'red';
  icon: string;
  order: number;
}

export const BOND_STATES: Record<ExecutiveBondStatus, BondStateDefinition> = {
  NOT_ISSUED: {
    status: 'NOT_ISSUED',
    nameAr: 'لم يصدر بعد',
    nameEn: 'Not Issued',
    description: 'سند الأمر لم يصدر بعد - سيتم إصداره بعد اعتماد العقد والإقرار',
    customerMessage: 'جاري تجهيز سند الأمر',
    adminMessage: 'بانتظار بدء إصدار السند في نافذ',
    requiredAction: 'بدء إصدار السند',
    actionActor: 'admin',
    isTerminal: false,
    customerVisible: true,
    color: 'gray',
    icon: 'Clock',
    order: 1
  },
  ISSUING: {
    status: 'ISSUING',
    nameAr: 'جاري إصدار السند',
    nameEn: 'Issuing Bond',
    description: 'جاري إصدار سند الأمر عبر منصة نافذ',
    customerMessage: 'جاري إصدار سند الأمر - سيتم إعلامك فور جاهزيته',
    adminMessage: 'قم بإصدار السند في نافذ ثم انتقل للحالة التالية',
    requiredAction: 'إكمال الإصدار في نافذ',
    actionActor: 'admin',
    isTerminal: false,
    customerVisible: true,
    color: 'blue',
    icon: 'Loader2',
    order: 2
  },
  ISSUED: {
    status: 'ISSUED',
    nameAr: 'تم إصدار السند',
    nameEn: 'Bond Issued',
    description: 'تم إصدار السند وبانتظار إرساله للعميل',
    customerMessage: 'تم إصدار السند - سيتم إرساله إليك قريباً',
    adminMessage: 'السند جاهز - اضغط لإرساله للعميل',
    requiredAction: 'إرسال السند للعميل',
    actionActor: 'admin',
    isTerminal: false,
    customerVisible: true,
    color: 'yellow',
    icon: 'FileCheck',
    order: 3
  },
  SENT_TO_CLIENT: {
    status: 'SENT_TO_CLIENT',
    nameAr: 'تم إرسال السند للعميل',
    nameEn: 'Sent to Client',
    description: 'السند جاهز للتوقيع عبر منصة نافذ',
    customerMessage: 'سند الأمر جاهز للتوقيع! يرجى توقيعه عبر منصة نافذ ثم تأكيد التوقيع هنا',
    adminMessage: 'بانتظار توقيع العميل على السند',
    requiredAction: 'توقيع السند وتأكيده',
    actionActor: 'customer',
    isTerminal: false,
    customerVisible: true,
    color: 'orange',
    icon: 'FileSignature',
    order: 4
  },
  SIGNED_BY_CLIENT: {
    status: 'SIGNED_BY_CLIENT',
    nameAr: 'موقع من العميل',
    nameEn: 'Signed by Client',
    description: 'تم تأكيد توقيع العميل - بانتظار اعتماد الإدارة',
    customerMessage: 'تم استلام تأكيد توقيعك! جاري المراجعة من قبل الإدارة',
    adminMessage: 'العميل أكد توقيعه - تحقق واعتمد السند',
    requiredAction: 'التحقق واعتماد السند',
    actionActor: 'admin',
    isTerminal: false,
    customerVisible: true,
    color: 'blue',
    icon: 'ClipboardCheck',
    order: 5
  },
  VERIFIED_BY_ADMIN: {
    status: 'VERIFIED_BY_ADMIN',
    nameAr: 'معتمد من الإدارة',
    nameEn: 'Verified by Admin',
    description: 'تم اعتماد سند الأمر - جميع المستندات مكتملة',
    customerMessage: '✅ تم اعتماد سند الأمر بنجاح! سيتم تفعيل رصيدك قريباً',
    adminMessage: 'السند معتمد - انتقل لتفعيل الرصيد',
    isTerminal: true,
    customerVisible: true,
    color: 'green',
    icon: 'BadgeCheck',
    order: 6
  }
};

/**
 * الحصول على تعريف حالة السند
 */
export function getBondState(status: ExecutiveBondStatus): BondStateDefinition {
  return BOND_STATES[status] || BOND_STATES.NOT_ISSUED;
}

/**
 * هل هي حالة نهائية؟
 */
export function isBondTerminal(status: ExecutiveBondStatus): boolean {
  return BOND_STATES[status]?.isTerminal ?? false;
}

/**
 * هل يمكن للعميل اتخاذ إجراء؟
 */
export function canCustomerAct(status: ExecutiveBondStatus): boolean {
  const state = BOND_STATES[status];
  return state?.actionActor === 'customer' && !state.isTerminal;
}

/**
 * الحصول على الحالة التالية المتوقعة
 */
export function getNextExpectedStatus(current: ExecutiveBondStatus): ExecutiveBondStatus | null {
  const statusOrder: ExecutiveBondStatus[] = [
    'NOT_ISSUED',
    'ISSUING',
    'ISSUED',
    'SENT_TO_CLIENT',
    'SIGNED_BY_CLIENT',
    'VERIFIED_BY_ADMIN'
  ];
  
  const currentIndex = statusOrder.indexOf(current);
  if (currentIndex === -1 || currentIndex >= statusOrder.length - 1) {
    return null;
  }
  
  return statusOrder[currentIndex + 1];
}

/**
 * الحصول على جميع الحالات مرتبة
 */
export function getOrderedBondStates(): BondStateDefinition[] {
  return Object.values(BOND_STATES).sort((a, b) => a.order - b.order);
}

/**
 * حساب نسبة التقدم
 */
export function getBondProgress(status: ExecutiveBondStatus): number {
  const state = BOND_STATES[status];
  if (!state) return 0;
  
  const totalStates = Object.keys(BOND_STATES).length;
  return Math.round((state.order / totalStates) * 100);
}
