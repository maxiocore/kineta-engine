/**
 * أنواع الأحداث لنظام التمويل
 * Financing Events Type Definitions
 */

import { FinancingApplicationStatus, TransitionTrigger } from '../stateMachine/types';

/**
 * حدث تغيير حالة الطلب
 */
export interface ApplicationStatusChangedEvent {
  eventType: 'APPLICATION_STATUS_CHANGED';
  applicationId: string;
  applicationNumber: string;
  userId: string;
  fromStatus: FinancingApplicationStatus | null;
  toStatus: FinancingApplicationStatus;
  triggeredBy: TransitionTrigger;
  actorId: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * نتيجة معالجة الحدث
 */
export interface EventProcessingResult {
  success: boolean;
  activityLogId?: string;
  emailQueued?: boolean;
  emailQueueId?: string;
  errors?: string[];
}

/**
 * تفاصيل تسجيل النشاط
 */
export interface ActivityLogEntry {
  id: string;
  applicationId: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string;
  triggeredBy: TransitionTrigger;
  actorId: string | null;
  reason?: string;
  metadata: Record<string, unknown>;
  isVisibleToCustomer: boolean;
  createdAt: string;
}

/**
 * بيانات الإيميل الآمنة (بدون بيانات حساسة)
 */
export interface SafeEmailPayload {
  applicationId: string;
  applicationNumber: string;
  status: FinancingApplicationStatus;
  recipientEmail: string;
  recipientName: string;
  emailTemplateId: string;
  approvedAmount?: number;
  timestamp: string;
  eventId: string;
}

/**
 * حالات الإيميل المعتمدة للإشعارات
 */
export const APPROVED_EMAIL_STATUSES: FinancingApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ADDITIONAL_INFO_REQUIRED',
  'APPROVED',
  'APPROVED_WITH_LIMITS',
  'CONTRACT_PRESENTED',
  'CONTRACT_ACCEPTED',
  'CONTRACT_FINALIZED',
  'CREDIT_DEPOSITED',
  'DECLINED',
  'EXPIRED',
  'CANCELLED'
];

/**
 * أحداث مخفية عن العميل (للأدمن فقط)
 */
export const ADMIN_ONLY_EVENTS: FinancingApplicationStatus[] = [
  'RISK_CHECK',
  'CREDIT_DEPOSIT_PENDING'
];

/**
 * التحقق من إمكانية إرسال إيميل للحالة
 */
export function shouldSendEmailForStatus(status: FinancingApplicationStatus): boolean {
  return APPROVED_EMAIL_STATUSES.includes(status);
}

/**
 * التحقق مما إذا كان الحدث مرئياً للعميل
 */
export function isEventVisibleToCustomer(status: FinancingApplicationStatus): boolean {
  return !ADMIN_ONLY_EVENTS.includes(status);
}

/**
 * الحصول على معرف قالب الإيميل
 */
export function getEmailTemplateId(status: FinancingApplicationStatus): string {
  return `financing_status_${status.toLowerCase()}`;
}
