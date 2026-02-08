/**
 * ASH HOLDING Financing System v3 - Type Definitions
 * نظام التمويل الجديد - تعريفات الأنواع (FinTech Style)
 */

// ═══════════════════════════════════════════════════════════════════
// Re-export V2 types for compatibility
// ═══════════════════════════════════════════════════════════════════
export type {
  FinancingStatus,
  FinancingPhase,
  FinancingApplication,
  FinancingPlan,
  FinancingInstallment,
  ServiceCredit,
  TimelineStep,
  StatusConfig,
  CustomerAction,
  AdminAction,
} from '../v2/types';

// ═══════════════════════════════════════════════════════════════════
// V3 Enhanced Types
// ═══════════════════════════════════════════════════════════════════

export interface FinancingStats {
  totalApproved: number;
  totalUsed: number;
  availableBalance: number;
  nextInstallmentAmount: number;
  nextInstallmentDate: string | null;
  totalInstallments: number;
  paidInstallments: number;
  overdueInstallments: number;
}

export interface QuickAction {
  id: string;
  type: 'transfer' | 'use_credit' | 'sign' | 'view_details' | 'apply' | 'support';
  label: string;
  description: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'ghost';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

export interface ActivityItem {
  id: string;
  type: 'status_change' | 'action' | 'system' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending';
  icon: string;
}

export type ViewMode = 'home' | 'status' | 'wallet' | 'services';

// ═══════════════════════════════════════════════════════════════════
// Segment Control Types
// ═══════════════════════════════════════════════════════════════════

export interface SegmentItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
}
