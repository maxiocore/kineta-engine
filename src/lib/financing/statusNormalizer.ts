/**
 * نظام توحيد حالات التمويل
 * Financing Status Normalizer
 * 
 * يربط بين الحالات المخزنة في قاعدة البيانات والحالات المستخدمة في الواجهة
 */

import { FinancingApplicationStatus } from './stateMachine/types';

/**
 * خريطة ربط الحالات من DB إلى UI
 * بعض الحالات تُخزن بتنسيقات مختلفة في قاعدة البيانات
 */
const DB_TO_UI_STATUS_MAP: Record<string, FinancingApplicationStatus> = {
  // الحالات الأساسية (lowercase)
  'draft': 'DRAFT',
  'pending': 'DRAFT',
  'submitted': 'SUBMITTED',
  'under_review': 'UNDER_REVIEW',
  'additional_info_required': 'ADDITIONAL_INFO_REQUIRED',
  'risk_check': 'RISK_CHECK',
  'approved': 'APPROVED',
  'approved_with_limits': 'APPROVED_WITH_LIMITS',
  'declined': 'DECLINED',
  'rejected': 'DECLINED',
  
  // حالات العقد
  'contract_presented': 'CONTRACT_PRESENTED',
  'awaiting_contract': 'CONTRACT_PRESENTED',
  'awaiting_signature': 'CONTRACT_PRESENTED',
  'contract_accepted': 'CONTRACT_ACCEPTED',
  'contract_signed': 'CONTRACT_FINALIZED',
  'contract_finalized': 'CONTRACT_FINALIZED',
  
  // حالات الرصيد
  'credit_deposit_pending': 'CREDIT_DEPOSIT_PENDING',
  'credit_deposited': 'CREDIT_DEPOSITED',
  'order_payment_in_progress': 'ORDER_PAYMENT_IN_PROGRESS',
  'completed': 'COMPLETED',
  'expired': 'EXPIRED',
  'cancelled': 'CANCELLED',
  
  // الحالات بأحرف كبيرة (UPPERCASE) - تمرر كما هي
  'DRAFT': 'DRAFT',
  'SUBMITTED': 'SUBMITTED',
  'UNDER_REVIEW': 'UNDER_REVIEW',
  'ADDITIONAL_INFO_REQUIRED': 'ADDITIONAL_INFO_REQUIRED',
  'RISK_CHECK': 'RISK_CHECK',
  'APPROVED': 'APPROVED',
  'APPROVED_WITH_LIMITS': 'APPROVED_WITH_LIMITS',
  'DECLINED': 'DECLINED',
  'CONTRACT_PRESENTED': 'CONTRACT_PRESENTED',
  'CONTRACT_ACCEPTED': 'CONTRACT_ACCEPTED',
  'CONTRACT_FINALIZED': 'CONTRACT_FINALIZED',
  'CREDIT_DEPOSIT_PENDING': 'CREDIT_DEPOSIT_PENDING',
  'CREDIT_DEPOSITED': 'CREDIT_DEPOSITED',
  'ORDER_PAYMENT_IN_PROGRESS': 'ORDER_PAYMENT_IN_PROGRESS',
  'COMPLETED': 'COMPLETED',
  'EXPIRED': 'EXPIRED',
  'CANCELLED': 'CANCELLED',
};

/**
 * تحويل الحالة من تنسيق قاعدة البيانات إلى تنسيق الواجهة
 */
export function normalizeStatus(dbStatus: string | null | undefined): FinancingApplicationStatus {
  if (!dbStatus) {
    return 'DRAFT';
  }
  
  const normalized = DB_TO_UI_STATUS_MAP[dbStatus];
  
  if (normalized) {
    return normalized;
  }
  
  // محاولة التحويل المباشر للحروف الكبيرة
  const upperStatus = dbStatus.toUpperCase().replace(/-/g, '_') as FinancingApplicationStatus;
  
  // التحقق من أن الحالة صالحة
  const validStatuses: FinancingApplicationStatus[] = [
    'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED',
    'RISK_CHECK', 'APPROVED', 'APPROVED_WITH_LIMITS', 'DECLINED',
    'CONTRACT_PRESENTED', 'CONTRACT_ACCEPTED', 'CONTRACT_FINALIZED',
    'CREDIT_DEPOSIT_PENDING', 'CREDIT_DEPOSITED', 'ORDER_PAYMENT_IN_PROGRESS',
    'COMPLETED', 'EXPIRED', 'CANCELLED'
  ];
  
  if (validStatuses.includes(upperStatus)) {
    return upperStatus;
  }
  
  // في حالة عدم التعرف على الحالة، نرجع DRAFT كقيمة افتراضية
  console.warn(`Unknown financing status: ${dbStatus}, defaulting to DRAFT`);
  return 'DRAFT';
}

/**
 * التحقق من صحة الحالة
 */
export function isValidStatus(status: string): status is FinancingApplicationStatus {
  return status in DB_TO_UI_STATUS_MAP || 
         DB_TO_UI_STATUS_MAP[status.toLowerCase()] !== undefined;
}

/**
 * الحصول على ترتيب الحالة في المسار
 */
export function getStatusOrder(status: FinancingApplicationStatus): number {
  const ORDER: FinancingApplicationStatus[] = [
    'DRAFT',
    'SUBMITTED', 
    'UNDER_REVIEW',
    'RISK_CHECK',
    'APPROVED',
    'CONTRACT_PRESENTED',
    'CONTRACT_ACCEPTED',
    'CONTRACT_FINALIZED',
    'CREDIT_DEPOSIT_PENDING',
    'CREDIT_DEPOSITED',
    'COMPLETED'
  ];
  
  const index = ORDER.indexOf(status);
  return index >= 0 ? index : 0;
}

/**
 * التحقق من أن الحالة نهائية
 */
export function isTerminalStatus(status: FinancingApplicationStatus): boolean {
  return ['DECLINED', 'EXPIRED', 'CANCELLED', 'COMPLETED'].includes(status);
}

/**
 * التحقق من أن الحالة سلبية
 */
export function isNegativeStatus(status: FinancingApplicationStatus): boolean {
  return ['DECLINED', 'EXPIRED', 'CANCELLED'].includes(status);
}
