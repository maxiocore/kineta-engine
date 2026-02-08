/**
 * ASH HOLDING Financing Admin V2 - Actions Configuration
 * تكوين إجراءات الأدمن
 */

import type { AdminActionConfig, AdminActionType } from '../types';
import type { FinancingStatus } from '../../types';

// Re-export AdminActionConfig for use in other modules
export type { AdminActionConfig } from '../types';

// ═══════════════════════════════════════════════════════════════════
// Admin Actions Registry
// ═══════════════════════════════════════════════════════════════════

export const ADMIN_ACTIONS: Record<AdminActionType, AdminActionConfig> = {
  review_application: {
    id: 'review_application',
    nameAr: 'بدء المراجعة',
    descriptionAr: 'نقل الطلب لحالة قيد المراجعة',
    icon: 'Search',
    color: 'primary',
    requiresConfirmation: false,
    requiresReason: false,
    applicableStatuses: ['SUBMITTED'],
    targetStatus: 'UNDER_REVIEW',
    permission: 'basic',
  },
  prepare_offer: {
    id: 'prepare_offer',
    nameAr: 'تجهيز العرض',
    descriptionAr: 'إعداد عرض التمويل للعميل',
    icon: 'FileCheck',
    color: 'success',
    requiresConfirmation: false,
    requiresReason: false,
    applicableStatuses: ['UNDER_REVIEW'],
    targetStatus: 'OFFER_READY',
    permission: 'basic',
  },
  send_acknowledgment: {
    id: 'send_acknowledgment',
    nameAr: 'إرسال الإقرار',
    descriptionAr: 'إرسال إقرار الشروط والأحكام للعميل',
    icon: 'Send',
    color: 'primary',
    requiresConfirmation: true,
    requiresReason: false,
    applicableStatuses: ['OFFER_READY'],
    targetStatus: 'ACK_SENT',
    permission: 'basic',
  },
  send_contract: {
    id: 'send_contract',
    nameAr: 'إرسال العقد',
    descriptionAr: 'إرسال عقد التمويل للعميل',
    icon: 'FileText',
    color: 'primary',
    requiresConfirmation: true,
    requiresReason: false,
    applicableStatuses: ['ACK_SIGNED'],
    targetStatus: 'CONTRACT_SENT',
    permission: 'basic',
  },
  issue_bond: {
    id: 'issue_bond',
    nameAr: 'إصدار السند',
    descriptionAr: 'إصدار سند الأمر عبر نافذ',
    icon: 'Stamp',
    color: 'warning',
    requiresConfirmation: true,
    requiresReason: false,
    applicableStatuses: ['CONTRACT_SIGNED', 'CONTRACT_FINALIZED'],
    targetStatus: 'BOND_ISSUING',
    permission: 'senior',
  },
  activate_credit: {
    id: 'activate_credit',
    nameAr: 'تفعيل الرصيد',
    descriptionAr: 'تفعيل رصيد الخدمات للعميل',
    icon: 'Wallet',
    color: 'success',
    requiresConfirmation: true,
    requiresReason: false,
    applicableStatuses: ['BOND_SIGNED', 'BOND_SIGNED_BY_CLIENT', 'BOND_VERIFIED_BY_ADMIN'],
    targetStatus: 'CREDIT_DEPOSITED',
    permission: 'manager',
  },
  update_amount: {
    id: 'update_amount',
    nameAr: 'تعديل المبلغ',
    descriptionAr: 'تعديل مبلغ التمويل المعتمد',
    icon: 'DollarSign',
    color: 'warning',
    requiresConfirmation: true,
    requiresReason: true,
    applicableStatuses: ['UNDER_REVIEW', 'OFFER_READY'],
    permission: 'senior',
  },
  update_installments: {
    id: 'update_installments',
    nameAr: 'تعديل الأقساط',
    descriptionAr: 'تعديل عدد الأقساط',
    icon: 'Calendar',
    color: 'warning',
    requiresConfirmation: true,
    requiresReason: true,
    applicableStatuses: ['UNDER_REVIEW', 'OFFER_READY'],
    permission: 'senior',
  },
  resend_document: {
    id: 'resend_document',
    nameAr: 'إعادة الإرسال',
    descriptionAr: 'إعادة إرسال المستند للعميل',
    icon: 'RefreshCw',
    color: 'secondary',
    requiresConfirmation: true,
    requiresReason: true,
    applicableStatuses: ['ACK_SENT', 'CONTRACT_SENT', 'BOND_ISSUING', 'BOND_ISSUED', 'BOND_SENT_TO_CLIENT'],
    permission: 'basic',
  },
  decline_application: {
    id: 'decline_application',
    nameAr: 'رفض الطلب',
    descriptionAr: 'رفض طلب التمويل',
    icon: 'XCircle',
    color: 'destructive',
    requiresConfirmation: true,
    requiresReason: true,
    applicableStatuses: ['SUBMITTED', 'UNDER_REVIEW'],
    targetStatus: 'DECLINED',
    permission: 'senior',
  },
  cancel_application: {
    id: 'cancel_application',
    nameAr: 'إلغاء الطلب',
    descriptionAr: 'إلغاء طلب التمويل',
    icon: 'Ban',
    color: 'destructive',
    requiresConfirmation: true,
    requiresReason: true,
    applicableStatuses: [
      'SUBMITTED',
      'UNDER_REVIEW', 
      'OFFER_READY', 
      'ACK_SENT',
      'ACK_SIGNED',
      'CONTRACT_SENT',
      'CONTRACT_SIGNED',
      'CONTRACT_FINALIZED',
      'BOND_ISSUING',
      'BOND_ISSUED',
      'BOND_SENT_TO_CLIENT',
      'BOND_SIGNED_BY_CLIENT',
    ],
    targetStatus: 'CANCELLED',
    permission: 'basic', // أي أدمن يستطيع الإلغاء
  },
};

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

export function getActionsForStatus(status: FinancingStatus): AdminActionConfig[] {
  return Object.values(ADMIN_ACTIONS).filter(action => 
    action.applicableStatuses.includes(status)
  );
}

export function getPrimaryAction(status: FinancingStatus): AdminActionConfig | null {
  const actions = getActionsForStatus(status);
  // Return first non-destructive action with targetStatus
  return actions.find(a => a.targetStatus && a.color !== 'destructive') || null;
}

export function getSecondaryActions(status: FinancingStatus): AdminActionConfig[] {
  const primary = getPrimaryAction(status);
  return getActionsForStatus(status).filter(a => a.id !== primary?.id);
}
