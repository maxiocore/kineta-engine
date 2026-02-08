/**
 * ASH HOLDING Financing System v2 - Type Definitions
 * نظام التمويل الجديد - تعريفات الأنواع
 */

// ═══════════════════════════════════════════════════════════════════
// Application Status Types
// ═══════════════════════════════════════════════════════════════════

export type FinancingStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'OFFER_READY'
  | 'ACK_PENDING'
  | 'ACK_SENT'
  | 'ACK_SIGNED'
  | 'CONTRACT_PENDING'
  | 'CONTRACT_SENT'
  | 'CONTRACT_SIGNED'
  | 'CONTRACT_FINALIZED'
  | 'SIGNING_OTP_SENT'
  | 'BOND_PENDING'
  | 'BOND_ISSUING'
  | 'BOND_ISSUED'
  | 'BOND_SENT_TO_CLIENT'
  | 'BOND_SIGNED'
  | 'BOND_SIGNED_BY_CLIENT'
  | 'BOND_VERIFIED_BY_ADMIN'
  | 'CREDIT_ACTIVE'
  | 'CREDIT_DEPOSITED'
  | 'FIN_CREDIT_DEPOSITED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DECLINED'
  | 'REJECTED';

export type FinancingPhase = 
  | 'application'
  | 'review'
  | 'offer'
  | 'acknowledgment'
  | 'contract'
  | 'bond'
  | 'active'
  | 'terminal';

// ═══════════════════════════════════════════════════════════════════
// Application Data Types
// ═══════════════════════════════════════════════════════════════════

export interface FinancingApplication {
  id: string;
  application_number: string;
  user_id: string;
  status: FinancingStatus;
  
  // Customer Info
  full_name: string;
  national_id: string;
  email: string;
  phone: string;
  address?: string;
  
  // Company Info (optional)
  company_name?: string;
  commercial_register?: string;
  tax_number?: string;
  
  // Financing Details
  requested_amount: number;
  approved_amount?: number;
  service_description?: string;
  
  // Contract Info
  contract_version: number;
  contract_number?: string;
  contract_signed_at?: string;
  
  // Admin Overrides
  contract_override_name?: string;
  contract_override_installments?: number;
  
  // Timestamps
  submitted_at: string;
  approved_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancingPlan {
  id: string;
  name: string;
  name_ar: string;
  min_amount: number;
  max_amount: number;
  default_duration_months: number;
  profit_rate: number;
  is_active: boolean;
}

export interface FinancingInstallment {
  id: string;
  application_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  late_fee?: number;
  notes?: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  paid_at?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Service Credit Types
// ═══════════════════════════════════════════════════════════════════

export interface ServiceCredit {
  id: string;
  user_id: string;
  total_credited: number;
  total_used: number;
  available_balance: number;
  is_active: boolean;
  is_frozen: boolean;
  expires_at?: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// Timeline & Status Display Types
// ═══════════════════════════════════════════════════════════════════

export interface TimelineStep {
  id: string;
  status: FinancingStatus;
  label: string;
  description: string;
  phase: FinancingPhase;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  date?: string;
  icon: string;
}

export interface StatusConfig {
  status: FinancingStatus;
  phase: FinancingPhase;
  nameAr: string;
  descriptionAr: string;
  customerMessageAr: string;
  color: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  icon: string;
  isTerminal: boolean;
  requiredAction?: string;
  requiredActionActor?: 'customer' | 'admin';
}

// ═══════════════════════════════════════════════════════════════════
// Action Types
// ═══════════════════════════════════════════════════════════════════

export interface CustomerAction {
  id: string;
  type: 'sign_acknowledgment' | 'sign_contract' | 'confirm_bond' | 'transfer_credit' | 'use_credit';
  label: string;
  description: string;
  isPrimary: boolean;
  isEnabled: boolean;
  icon: string;
}

export interface AdminAction {
  id: string;
  type: 'update_amount' | 'update_duration' | 'resend_contract' | 'cancel' | 'approve' | 'issue_bond' | 'activate_credit';
  label: string;
  description: string;
  requiresReason: boolean;
  isDestructive: boolean;
  icon: string;
}

// ═══════════════════════════════════════════════════════════════════
// Audit Types
// ═══════════════════════════════════════════════════════════════════

export interface AdminAuditLog {
  id: string;
  application_id: string;
  admin_id: string;
  action_type: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  reason: string;
  contract_version?: number;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// Hook Return Types
// ═══════════════════════════════════════════════════════════════════

export interface UseFinancingReturn {
  application: FinancingApplication | null;
  serviceCredit: ServiceCredit | null;
  installments: FinancingInstallment[];
  timelineSteps: TimelineStep[];
  customerActions: CustomerAction[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseAdminFinancingReturn {
  applications: FinancingApplication[];
  selectedApplication: FinancingApplication | null;
  isLoading: boolean;
  error: Error | null;
  filters: {
    status: FinancingStatus | 'all';
    search: string;
    dateRange: { from?: Date; to?: Date };
  };
  setFilters: (filters: Partial<UseAdminFinancingReturn['filters']>) => void;
  selectApplication: (id: string) => void;
  performAction: (action: AdminAction, data?: Record<string, unknown>) => Promise<void>;
  refetch: () => Promise<void>;
}
