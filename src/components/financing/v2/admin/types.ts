/**
 * MaxioCore Financing Admin V2 - Type Definitions
 * أنواع لوحة تحكم الأدمن الجديدة
 */

import type { FinancingStatus, FinancingApplication } from '../types';

// ═══════════════════════════════════════════════════════════════════
// Admin Action Types
// ═══════════════════════════════════════════════════════════════════

export type AdminActionType =
  | 'review_application'      // بدء مراجعة الطلب
  | 'prepare_offer'          // تجهيز العرض
  | 'send_acknowledgment'    // إرسال الإقرار
  | 'send_contract'          // إرسال العقد
  | 'issue_bond'             // إصدار السند
  | 'activate_credit'        // تفعيل الرصيد
  | 'update_amount'          // تعديل المبلغ
  | 'update_installments'    // تعديل عدد الأقساط
  | 'resend_document'        // إعادة إرسال مستند
  | 'decline_application'    // رفض الطلب
  | 'cancel_application';    // إلغاء الطلب

export interface AdminActionConfig {
  id: AdminActionType;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'destructive' | 'secondary';
  requiresConfirmation: boolean;
  requiresReason: boolean;
  applicableStatuses: FinancingStatus[];
  targetStatus?: FinancingStatus;
  permission: 'basic' | 'senior' | 'manager';
}

// ═══════════════════════════════════════════════════════════════════
// Filter & Sort Types
// ═══════════════════════════════════════════════════════════════════

export interface AdminFilters {
  status: FinancingStatus | 'all';
  search: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: 'submitted_at' | 'updated_at' | 'requested_amount';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_FILTERS: AdminFilters = {
  status: 'all',
  search: '',
  sortBy: 'submitted_at',
  sortOrder: 'desc',
};

// ═══════════════════════════════════════════════════════════════════
// Stats Types
// ═══════════════════════════════════════════════════════════════════

export interface AdminStats {
  totalApplications: number;
  pendingReview: number;
  activeFinancing: number;
  totalFinanced: number;
  thisMonthApplications: number;
  approvalRate: number;
}

// ═══════════════════════════════════════════════════════════════════
// Application Extended (with admin-specific fields)
// ═══════════════════════════════════════════════════════════════════

export interface AdminApplicationView extends FinancingApplication {
  // Plan info
  plan_name_ar?: string;
  plan_installments_count?: number;
  plan_duration_months?: number;
  
  // Workflow info
  workflow_status?: string;
  current_phase?: string;
  phase_updated_at?: string;
  
  // Admin notes
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  
  // Bond info
  executive_bond_state?: string;
  executive_bond_sent_at?: string;
  executive_bond_signed_at?: string;
}
