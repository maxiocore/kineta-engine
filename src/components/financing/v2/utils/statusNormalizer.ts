/**
 * ASH HOLDING Financing V2 - Status Normalizer
 * تحويل الحالات القديمة إلى الحالات الجديدة
 */

import type { FinancingStatus } from '../types';

// Map old database statuses to new V2 statuses
const STATUS_MAP: Record<string, FinancingStatus> = {
  // Direct mappings (DB values → keep as-is)
  'DRAFT': 'DRAFT',
  'SUBMITTED': 'SUBMITTED',
  'UNDER_REVIEW': 'UNDER_REVIEW',
  'OFFER_READY': 'OFFER_READY',
  'ACK_PENDING': 'ACK_SENT',
  'ACK_SENT': 'ACK_SENT',
  'ACK_SIGNED': 'ACK_SIGNED',
  'CONTRACT_PENDING': 'CONTRACT_SENT',
  'CONTRACT_SENT': 'CONTRACT_SENT',
  'CONTRACT_SIGNED': 'CONTRACT_SIGNED',
  'CONTRACT_FINALIZED': 'CONTRACT_FINALIZED',
  'CONTRACT_PRESENTED': 'CONTRACT_SENT',
  'CONTRACT_ACCEPTED': 'CONTRACT_SIGNED',
  'SIGNING_OTP_SENT': 'SIGNING_OTP_SENT',
  'BOND_PENDING': 'BOND_ISSUING',
  'BOND_ISSUING': 'BOND_ISSUING',
  'BOND_ISSUED': 'BOND_ISSUED',
  'BOND_SENT_TO_CLIENT': 'BOND_SENT_TO_CLIENT',
  'BOND_SIGNED': 'BOND_SIGNED_BY_CLIENT',
  'BOND_SIGNED_BY_CLIENT': 'BOND_SIGNED_BY_CLIENT',
  'BOND_VERIFIED_BY_ADMIN': 'BOND_VERIFIED_BY_ADMIN',
  'CREDIT_ACTIVE': 'CREDIT_DEPOSITED',
  'CREDIT_DEPOSITED': 'CREDIT_DEPOSITED',
  'FIN_CREDIT_DEPOSITED': 'FIN_CREDIT_DEPOSITED',
  'COMPLETED': 'COMPLETED',
  'CANCELLED': 'CANCELLED',
  'DECLINED': 'DECLINED',
  'REJECTED': 'REJECTED',
  'REQUEST_SUBMITTED': 'SUBMITTED',
  'ADMIN_SETUP': 'UNDER_REVIEW',
  'PROMISSORY_SIGNED': 'BOND_SIGNED_BY_CLIENT',
  
  // Legacy lowercase mappings
  'draft': 'DRAFT',
  'pending': 'SUBMITTED',
  'submitted': 'SUBMITTED',
  'under_review': 'UNDER_REVIEW',
  'approved': 'OFFER_READY',
  'approved_limited': 'OFFER_READY',
  'pending_review': 'UNDER_REVIEW',
  'awaiting_acknowledgment': 'ACK_SENT',
  'awaiting_signature': 'CONTRACT_SENT',
  'contract_signed': 'CONTRACT_SIGNED',
  'awaiting_bond': 'BOND_ISSUING',
  'awaiting_contract': 'CONTRACT_SENT',
  'active': 'CREDIT_DEPOSITED',
  'completed': 'COMPLETED',
  'cancelled': 'CANCELLED',
  'declined': 'DECLINED',
  'rejected': 'REJECTED',
  'documents_required': 'UNDER_REVIEW',
};

/**
 * Normalize any status string to a valid V2 FinancingStatus
 */
export function normalizeStatus(status: string | null | undefined): FinancingStatus {
  if (!status) return 'DRAFT';
  
  const normalized = STATUS_MAP[status];
  if (normalized) return normalized;
  
  // Try uppercase
  const upper = status.toUpperCase();
  if (STATUS_MAP[upper]) return STATUS_MAP[upper];
  
  // Default fallback
  console.warn(`[StatusNormalizer] Unknown status: ${status}, defaulting to DRAFT`);
  return 'DRAFT';
}

/**
 * Check if status is in a specific phase
 */
export function isInPhase(status: FinancingStatus, phase: string): boolean {
  const phaseMap: Record<string, FinancingStatus[]> = {
    application: ['DRAFT', 'SUBMITTED'],
    review: ['UNDER_REVIEW'],
    offer: ['OFFER_READY'],
    acknowledgment: ['ACK_SENT', 'ACK_PENDING', 'ACK_SIGNED'],
    contract: ['CONTRACT_SENT', 'CONTRACT_PENDING', 'CONTRACT_SIGNED', 'CONTRACT_FINALIZED', 'SIGNING_OTP_SENT'],
    bond: ['BOND_ISSUING', 'BOND_ISSUED', 'BOND_SENT_TO_CLIENT', 'BOND_SIGNED_BY_CLIENT', 'BOND_VERIFIED_BY_ADMIN', 'BOND_PENDING', 'BOND_SIGNED'],
    active: ['CREDIT_DEPOSITED', 'FIN_CREDIT_DEPOSITED', 'CREDIT_ACTIVE'],
    terminal: ['COMPLETED', 'CANCELLED', 'DECLINED', 'REJECTED'],
  };
  
  return phaseMap[phase]?.includes(status) ?? false;
}

/**
 * Get the database status value to store
 */
export function toDatabaseStatus(status: FinancingStatus): string {
  // Map V2 status to database constraint values
  const dbMap: Partial<Record<FinancingStatus, string>> = {
    'ACK_PENDING': 'ACK_SENT',
    'CONTRACT_PENDING': 'CONTRACT_SENT',
    'BOND_PENDING': 'BOND_ISSUING',
  };
  
  return dbMap[status] || status;
}
