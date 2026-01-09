/**
 * خدمة الإيميل الموحدة لنظام التمويل
 * Unified Email Service for Financing System
 * 
 * هذا هو المصدر الوحيد لإشعارات الإيميل في نظام التمويل.
 * يستخدم النظام الجديد (financing-status-email) فقط.
 * 
 * @deprecated جميع functions القديمة في emailService.ts (sendFinancingApprovedEmail, etc.)
 */

import { supabase } from '@/integrations/supabase/client';
import { FinancingApplicationStatus, TransitionTrigger } from '../stateMachine/types';

/**
 * نتيجة إرسال الإيميل
 */
export interface EmailSendResult {
  success: boolean;
  action: 'sent' | 'queued' | 'skipped' | 'rate_limited' | 'failed';
  message: string;
  queueId?: string;
  resendId?: string;
  error?: string;
}

/**
 * معلمات إرسال إشعار تغيير الحالة
 */
export interface StatusChangeNotificationParams {
  applicationId: string;
  applicationNumber: string;
  recipientEmail: string;
  recipientName: string;
  status: FinancingApplicationStatus;
  approvedAmount?: number;
  triggeredBy: TransitionTrigger;
  actorId?: string;
  reason?: string;
  forceResend?: boolean;
}

/**
 * إرسال إشعار تغيير حالة التمويل
 * 
 * هذه الدالة هي الطريقة الوحيدة لإرسال إشعارات الإيميل لحالات التمويل.
 * تستخدم النظام الجديد مع:
 * - Idempotency (منع التكرار)
 * - Rate Limiting
 * - Audit Logging
 * - RTL Arabic Templates
 */
export async function sendStatusChangeNotification(
  params: StatusChangeNotificationParams
): Promise<EmailSendResult> {
  console.log(`📧 Sending status notification: ${params.status} to ${params.recipientEmail}`);

  try {
    const { data, error } = await supabase.functions.invoke('financing-status-email', {
      body: {
        applicationId: params.applicationId,
        status: params.status,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        applicationNumber: params.applicationNumber,
        approvedAmount: params.approvedAmount,
        baseUrl: window.location.origin,
        forceResend: params.forceResend,
        // Event metadata for activity logging
        triggeredBy: params.triggeredBy,
        actorId: params.actorId,
        reason: params.reason,
      }
    });

    if (error) {
      console.error('❌ Email notification failed:', error);
      return {
        success: false,
        action: 'failed',
        message: error.message,
        error: error.message
      };
    }

    console.log('✅ Email notification result:', data);
    return {
      success: data?.success ?? false,
      action: data?.action ?? 'failed',
      message: data?.message ?? 'Unknown result',
      queueId: data?.queueId,
      resendId: data?.resendId
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Email notification exception:', error);
    return {
      success: false,
      action: 'failed',
      message,
      error: message
    };
  }
}

/**
 * Helper: إرسال إشعار عند بدء المراجعة
 */
export async function notifyUnderReview(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  actorId?: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'UNDER_REVIEW',
    triggeredBy: 'admin',
    actorId
  });
}

/**
 * Helper: إرسال إشعار عند طلب مستندات
 */
export async function notifyDocumentsRequired(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  reason?: string,
  actorId?: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'ADDITIONAL_INFO_REQUIRED',
    triggeredBy: 'admin',
    reason,
    actorId
  });
}

/**
 * Helper: إرسال إشعار عند الموافقة
 */
export async function notifyApproved(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  approvedAmount: number,
  actorId?: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'APPROVED',
    approvedAmount,
    triggeredBy: 'admin',
    actorId
  });
}

/**
 * Helper: إرسال إشعار عند الموافقة بقيمة معدلة
 */
export async function notifyApprovedWithLimits(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  approvedAmount: number,
  actorId?: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'APPROVED_WITH_LIMITS',
    approvedAmount,
    triggeredBy: 'admin',
    actorId
  });
}

/**
 * Helper: إرسال إشعار عند عرض العقد
 */
export async function notifyContractPresented(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  approvedAmount: number,
  actorId?: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'CONTRACT_PRESENTED',
    approvedAmount,
    triggeredBy: 'admin',
    actorId
  });
}

/**
 * Helper: إرسال إشعار عند قبول العقد
 */
export async function notifyContractAccepted(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  approvedAmount: number
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'CONTRACT_ACCEPTED',
    approvedAmount,
    triggeredBy: 'customer'
  });
}

/**
 * Helper: إرسال إشعار عند اعتماد العقد
 */
export async function notifyContractFinalized(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  approvedAmount: number,
  actorId?: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'CONTRACT_FINALIZED',
    approvedAmount,
    triggeredBy: 'admin',
    actorId
  });
}

/**
 * Helper: إرسال إشعار عند إيداع الرصيد
 */
export async function notifyCreditDeposited(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  approvedAmount: number,
  actorId?: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'CREDIT_DEPOSITED',
    approvedAmount,
    triggeredBy: 'system',
    actorId
  });
}

/**
 * Helper: إرسال إشعار عند الرفض
 */
export async function notifyDeclined(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  reason?: string,
  actorId?: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'DECLINED',
    triggeredBy: 'admin',
    reason,
    actorId
  });
}

/**
 * Helper: إرسال إشعار عند انتهاء الصلاحية
 */
export async function notifyExpired(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'EXPIRED',
    triggeredBy: 'system'
  });
}

/**
 * Helper: إرسال إشعار عند الإلغاء
 */
export async function notifyCancelled(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string,
  reason?: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'CANCELLED',
    triggeredBy: 'customer',
    reason
  });
}

/**
 * Helper: إرسال إشعار الطلب المستلم
 */
export async function notifySubmitted(
  applicationId: string,
  applicationNumber: string,
  email: string,
  name: string
): Promise<EmailSendResult> {
  return sendStatusChangeNotification({
    applicationId,
    applicationNumber,
    recipientEmail: email,
    recipientName: name,
    status: 'SUBMITTED',
    triggeredBy: 'customer'
  });
}
