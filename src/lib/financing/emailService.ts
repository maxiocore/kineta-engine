import { supabase } from '@/integrations/supabase/client';
import { FinancingApplicationStatus } from './stateMachine/types';

const BASE_URL = 'https://ashholding.com';

interface SendStatusEmailParams {
  applicationId: string;
  status: FinancingApplicationStatus;
  recipientEmail: string;
  recipientName: string;
  applicationNumber: string;
  approvedAmount?: number;
  forceResend?: boolean;
  eventId?: string;
  emailTemplateId?: string;
}

interface EmailQueueResult {
  success: boolean;
  action: 'sent' | 'queued' | 'skipped' | 'rate_limited' | 'bounced' | 'failed';
  message: string;
  queueId?: string;
  resendId?: string;
}

/**
 * إرسال بريد إلكتروني بحالة طلب التمويل
 * يدعم: Idempotency + Rate Limiting + Queue + Logging + Bounce Check
 */
export async function sendFinancingStatusEmail(params: SendStatusEmailParams): Promise<EmailQueueResult> {
  try {
    const { data, error } = await supabase.functions.invoke('financing-status-email', {
      body: {
        ...params,
        baseUrl: BASE_URL
      }
    });

    if (error) {
      console.error('Error sending financing status email:', error);
      return {
        success: false,
        action: 'failed',
        message: error.message || 'Unknown error'
      };
    }

    console.log('Financing status email result:', data);
    return data as EmailQueueResult;
  } catch (error) {
    console.error('Failed to send financing status email:', error);
    return {
      success: false,
      action: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * الحالات التي تتطلب إرسال بريد إلكتروني
 */
export const EMAIL_TRIGGER_STATUSES: FinancingApplicationStatus[] = [
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
 * التحقق مما إذا كانت الحالة تتطلب إرسال بريد
 */
export function shouldSendStatusEmail(status: FinancingApplicationStatus): boolean {
  return EMAIL_TRIGGER_STATUSES.includes(status);
}

/**
 * مثال Payload لإرسال الإيميل عند تغير الحالة
 * 
 * @example
 * // Payload المرسل للـ Edge Function
 * const payload = {
 *   applicationId: "uuid-of-application",
 *   status: "APPROVED",
 *   recipientEmail: "customer@example.com",
 *   recipientName: "أحمد محمد",
 *   applicationNumber: "FIN-1704067200000",
 *   approvedAmount: 15000,
 *   baseUrl: "https://ashholding.com",
 *   eventId: "uuid-of-activity-log-event",
 *   emailTemplateId: "financing_status_approved"
 * }
 * 
 * // الاستخدام من نظام الأحداث
 * import { handleStatusTransition } from '@/lib/financing/events';
 * 
 * await handleStatusTransition(
 *   applicationId,
 *   'UNDER_REVIEW',     // fromStatus
 *   'APPROVED',         // toStatus
 *   'reviewer',         // triggeredBy
 *   {
 *     actorId: adminUserId,
 *     reason: 'تمت الموافقة بعد المراجعة',
 *     metadata: { reviewerId: adminUserId }
 *   }
 * );
 * 
 * // أو باستخدام الـ Hook
 * const { transition } = useFinancingStatusTransition();
 * 
 * await transition(
 *   applicationId,
 *   'UNDER_REVIEW',
 *   'APPROVED',
 *   'reviewer',
 *   { reason: 'تمت الموافقة', showToast: true }
 * );
 */
export const EXAMPLE_EMAIL_PAYLOAD = {
  applicationId: "uuid-of-application",
  status: "APPROVED" as FinancingApplicationStatus,
  recipientEmail: "customer@example.com",
  recipientName: "أحمد محمد",
  applicationNumber: "FIN-1704067200000",
  approvedAmount: 15000,
  baseUrl: "https://ashholding.com",
  eventId: "uuid-of-activity-log-event",
  emailTemplateId: "financing_status_approved"
};
