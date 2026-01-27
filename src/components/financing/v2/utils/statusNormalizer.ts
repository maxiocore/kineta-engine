/**
 * MaxioCore Financing V2 - Status Normalizer
 * تحويل الحالات القديمة إلى الحالات الجديدة
 */

import type { FinancingStatus } from '../types';

// Map old database statuses to new V2 statuses
const STATUS_MAP: Record<string, FinancingStatus> = {
  // Direct mappings
  'DRAFT': 'DRAFT',
  'SUBMITTED': 'SUBMITTED',
  'UNDER_REVIEW': 'UNDER_REVIEW',
  'OFFER_READY': 'OFFER_READY',
  'ACK_PENDING': 'ACK_PENDING',
  'ACK_SENT': 'ACK_PENDING',
  'ACK_SIGNED': 'ACK_SIGNED',
  'CONTRACT_PENDING': 'CONTRACT_PENDING',
  'CONTRACT_SENT': 'CONTRACT_PENDING',
  'CONTRACT_SIGNED': 'CONTRACT_SIGNED',
  'CONTRACT_FINALIZED': 'CONTRACT_SIGNED',
  'SIGNING_OTP_SENT': 'CONTRACT_PENDING',
  'BOND_PENDING': 'BOND_PENDING',
  'BOND_ISSUING': 'BOND_PENDING',
  'BOND_ISSUED': 'BOND_PENDING',
  'BOND_SENT_TO_CLIENT': 'BOND_PENDING',
  'BOND_SIGNED': 'BOND_SIGNED',
  'BOND_SIGNED_BY_CLIENT': 'BOND_SIGNED',
  'BOND_VERIFIED_BY_ADMIN': 'BOND_SIGNED',
  'CREDIT_ACTIVE': 'CREDIT_ACTIVE',
  'CREDIT_DEPOSITED': 'CREDIT_ACTIVE',
  'FIN_CREDIT_DEPOSITED': 'CREDIT_ACTIVE',
  'COMPLETED': 'COMPLETED',
  'CANCELLED': 'CANCELLED',
  'DECLINED': 'DECLINED',
  'REJECTED': 'DECLINED',
  
  // Legacy lowercase mappings
  'draft': 'DRAFT',
  'pending': 'SUBMITTED',
  'submitted': 'SUBMITTED',
  'under_review': 'UNDER_REVIEW',
  'approved': 'OFFER_READY',
  'approved_limited': 'OFFER_READY',
  'pending_review': 'UNDER_REVIEW',
  'awaiting_acknowledgment': 'ACK_PENDING',
  'awaiting_signature': 'CONTRACT_PENDING',
  'contract_signed': 'CONTRACT_SIGNED',
  'awaiting_bond': 'BOND_PENDING',
  'active': 'CREDIT_ACTIVE',
  'completed': 'COMPLETED',
  'cancelled': 'CANCELLED',
  'declined': 'DECLINED',
  'rejected': 'DECLINED',
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
    acknowledgment: ['ACK_PENDING', 'ACK_SIGNED'],
    contract: ['CONTRACT_PENDING', 'CONTRACT_SIGNED'],
    bond: ['BOND_PENDING', 'BOND_SIGNED'],
    active: ['CREDIT_ACTIVE'],
    terminal: ['COMPLETED', 'CANCELLED', 'DECLINED'],
  };
  
  return phaseMap[phase]?.includes(status) ?? false;
}

/**
 * Get the database status value to store
 */
export function toDatabaseStatus(status: FinancingStatus): string {
  // Map V2 status to database constraint values
  const dbMap: Record<FinancingStatus, string> = {
    'DRAFT': 'DRAFT',
    'SUBMITTED': 'UNDER_REVIEW', // Submitted goes directly to review
    'UNDER_REVIEW': 'UNDER_REVIEW',
    'OFFER_READY': 'OFFER_READY',
    'ACK_PENDING': 'ACK_SENT',
    'ACK_SIGNED': 'ACK_SIGNED',
    'CONTRACT_PENDING': 'CONTRACT_SENT',
    'CONTRACT_SIGNED': 'CONTRACT_FINALIZED',
    'BOND_PENDING': 'BOND_SENT_TO_CLIENT',
    'BOND_SIGNED': 'BOND_VERIFIED_BY_ADMIN',
    'CREDIT_ACTIVE': 'CREDIT_DEPOSITED',
    'COMPLETED': 'CREDIT_DEPOSITED', // Terminal state
    'CANCELLED': 'DRAFT', // Keep original or handle separately
    'DECLINED': 'DRAFT', // Keep original or handle separately
  };
  
  return dbMap[status] || status;
}
