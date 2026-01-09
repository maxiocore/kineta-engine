/**
 * نظام الأحداث المركزي لطلبات التمويل
 * Central Event Emitter for Financing Applications
 */

import { supabase } from '@/integrations/supabase/client';
import { FinancingApplicationStatus, TransitionTrigger } from '../stateMachine/types';
import {
  ApplicationStatusChangedEvent,
  EventProcessingResult,
  SafeEmailPayload,
  shouldSendEmailForStatus,
  isEventVisibleToCustomer,
  getEmailTemplateId
} from './types';

/**
 * معلمات إنشاء حدث تغيير الحالة
 */
interface EmitStatusChangeParams {
  applicationId: string;
  applicationNumber: string;
  userId: string;
  fromStatus: FinancingApplicationStatus | null;
  toStatus: FinancingApplicationStatus;
  triggeredBy: TransitionTrigger;
  actorId?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
  // بيانات الإيميل
  recipientEmail: string;
  recipientName: string;
  approvedAmount?: number;
}

/**
 * إنشاء وإرسال حدث تغيير الحالة
 * يقوم بـ:
 * 1. تسجيل في Activity Log
 * 2. إضافة للـ Email Queue (إذا كانت الحالة معتمدة)
 */
export async function emitStatusChanged(
  params: EmitStatusChangeParams
): Promise<EventProcessingResult> {
  const timestamp = new Date().toISOString();
  const errors: string[] = [];
  
  // إنشاء الحدث
  const event: ApplicationStatusChangedEvent = {
    eventType: 'APPLICATION_STATUS_CHANGED',
    applicationId: params.applicationId,
    applicationNumber: params.applicationNumber,
    userId: params.userId,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    triggeredBy: params.triggeredBy,
    actorId: params.actorId || null,
    reason: params.reason,
    metadata: params.metadata,
    timestamp
  };

  console.log('📢 Emitting status change event:', event.eventType, event.toStatus);

  // 1. تسجيل في Activity Log
  let activityLogId: string | undefined;
  try {
    activityLogId = await logActivity(event);
    console.log('✅ Activity logged:', activityLogId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Activity log failed: ${message}`);
    console.error('❌ Activity log failed:', error);
  }

  // 2. إضافة للـ Email Queue (إذا كانت الحالة معتمدة)
  let emailQueued = false;
  let emailQueueId: string | undefined;

  if (shouldSendEmailForStatus(params.toStatus)) {
    try {
      const emailPayload: SafeEmailPayload = {
        applicationId: params.applicationId,
        applicationNumber: params.applicationNumber,
        status: params.toStatus,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        emailTemplateId: getEmailTemplateId(params.toStatus),
        approvedAmount: params.approvedAmount,
        timestamp,
        eventId: activityLogId || ''
      };

      const result = await queueEmail(emailPayload, activityLogId);
      emailQueued = result.queued;
      emailQueueId = result.queueId;
      
      console.log('✅ Email queued:', emailQueueId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Email queue failed: ${message}`);
      console.error('❌ Email queue failed:', error);
    }
  } else {
    console.log('ℹ️ Email not required for status:', params.toStatus);
  }

  return {
    success: errors.length === 0,
    activityLogId,
    emailQueued,
    emailQueueId,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * تسجيل النشاط في قاعدة البيانات
 */
async function logActivity(event: ApplicationStatusChangedEvent): Promise<string> {
  // استخدام Edge Function للتسجيل مع service role
  const { data, error } = await supabase.functions.invoke('financing-activity-log', {
    body: {
      applicationId: event.applicationId,
      eventType: event.eventType,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      triggeredBy: event.triggeredBy,
      actorId: event.actorId,
      reason: event.reason,
      metadata: event.metadata || {},
      isVisibleToCustomer: isEventVisibleToCustomer(event.toStatus)
    }
  });

  if (error) {
    throw new Error(`Activity log error: ${error.message}`);
  }

  return data.id;
}

/**
 * إضافة الإيميل للـ Queue
 */
async function queueEmail(
  payload: SafeEmailPayload,
  eventId?: string
): Promise<{ queued: boolean; queueId?: string }> {
  // استدعاء Edge Function للإيميل
  const { data, error } = await supabase.functions.invoke('financing-status-email', {
    body: {
      applicationId: payload.applicationId,
      status: payload.status,
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      applicationNumber: payload.applicationNumber,
      approvedAmount: payload.approvedAmount,
      baseUrl: window.location.origin,
      eventId,
      emailTemplateId: payload.emailTemplateId
    }
  });

  if (error) {
    throw new Error(`Email queue error: ${error.message}`);
  }

  return {
    queued: data?.success && (data?.action === 'sent' || data?.action === 'queued'),
    queueId: data?.queueId
  };
}

/**
 * معالج تغيير الحالة المباشر (للاستخدام مع State Machine)
 */
export async function handleStatusTransition(
  applicationId: string,
  fromStatus: FinancingApplicationStatus | null,
  toStatus: FinancingApplicationStatus,
  triggeredBy: TransitionTrigger,
  options?: {
    actorId?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<EventProcessingResult> {
  // جلب بيانات الطلب
  const { data: application, error } = await supabase
    .from('financing_applications')
    .select('application_number, user_id, email, full_name, approved_amount')
    .eq('id', applicationId)
    .single();

  if (error || !application) {
    return {
      success: false,
      errors: [`Application not found: ${error?.message || 'Unknown'}`]
    };
  }

  return emitStatusChanged({
    applicationId,
    applicationNumber: application.application_number,
    userId: application.user_id,
    fromStatus,
    toStatus,
    triggeredBy,
    actorId: options?.actorId,
    reason: options?.reason,
    metadata: options?.metadata,
    recipientEmail: application.email,
    recipientName: application.full_name,
    approvedAmount: application.approved_amount
  });
}
