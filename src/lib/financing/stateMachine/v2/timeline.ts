/**
 * Timeline للعرض البنكي
 * Banking-style Timeline
 */

import { WorkflowAuditEntry, ApplicationStatus, WorkflowPhase } from './types';
import { APPLICATION_STATES } from './applicationStates';

export interface TimelineEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  phase: WorkflowPhase;
  icon: string;
  color: string;
  isCustomerVisible: boolean;
  actor?: {
    role: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * تحويل سجلات التدقيق إلى أحداث Timeline
 */
export function getTimelineEvents(
  auditLogs: WorkflowAuditEntry[],
  currentStatus: ApplicationStatus,
  isAdmin: boolean = false
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  // ترتيب السجلات حسب التاريخ
  const sortedLogs = [...auditLogs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  for (const log of sortedLogs) {
    // تخطي الأحداث غير المرئية للعميل إذا لم يكن أدمن
    if (!isAdmin && !log.isCustomerVisible) continue;
    
    const event = formatTimelineEvent(log, currentStatus);
    events.push(event);
  }
  
  return events;
}

/**
 * تنسيق حدث واحد
 */
export function formatTimelineEvent(
  log: WorkflowAuditEntry,
  currentStatus: ApplicationStatus
): TimelineEvent {
  const date = new Date(log.createdAt);
  const stateInfo = log.toStatus ? APPLICATION_STATES[log.toStatus as ApplicationStatus] : null;
  
  // تحديد حالة الحدث
  let eventStatus: TimelineEvent['status'] = 'completed';
  if (log.toStatus === currentStatus) {
    eventStatus = 'current';
  } else if (log.toStatus === 'DECLINED' || log.toStatus === 'EXPIRED' || log.toStatus === 'CANCELLED') {
    eventStatus = 'failed';
  }
  
  // تحديد العنوان والوصف
  const title = getEventTitle(log);
  const description = getEventDescription(log);
  
  return {
    id: log.id,
    date: formatDate(date),
    time: formatTime(date),
    title,
    description,
    status: eventStatus,
    phase: stateInfo?.phase || 'application',
    icon: stateInfo?.icon || 'Circle',
    color: getEventColor(eventStatus),
    isCustomerVisible: log.isCustomerVisible,
    actor: log.actorRole ? {
      role: getActorRoleAr(log.actorRole),
      name: log.actorEmail
    } : undefined,
    metadata: log.newData as Record<string, unknown>
  };
}

/**
 * الحصول على عنوان الحدث
 */
function getEventTitle(log: WorkflowAuditEntry): string {
  const statusTitles: Record<string, string> = {
    'DRAFT': 'بدء الطلب',
    'REQUEST_SUBMITTED': 'تم تقديم الطلب',
    'UNDER_REVIEW': 'بدء المراجعة',
    'INFO_REQUIRED': 'طلب معلومات إضافية',
    'ADMIN_SETUP': 'إعداد العرض',
    'OFFER_READY': 'العرض جاهز',
    'CONTRACT_PHASE': 'إرسال العقد',
    'ACK_PHASE': 'إرسال الإقرار',
    'BOND_PHASE': 'مرحلة سند الأمر',
    'CREDIT_PENDING': 'جاري إضافة الرصيد',
    'CREDIT_ACTIVE': 'تم تفعيل الرصيد',
    'IN_USE': 'بدء الاستخدام',
    'COMPLETED': 'اكتمال التمويل',
    'DECLINED': 'رفض الطلب',
    'CANCELLED': 'إلغاء الطلب',
    'EXPIRED': 'انتهاء الصلاحية'
  };
  
  if (log.toStatus && statusTitles[log.toStatus]) {
    return statusTitles[log.toStatus];
  }
  
  // عناوين حسب نوع الكيان
  if (log.entityType === 'contract') {
    return 'تحديث العقد';
  }
  if (log.entityType === 'acknowledgment') {
    return 'تحديث الإقرار';
  }
  if (log.entityType === 'bond') {
    return 'تحديث السند';
  }
  if (log.entityType === 'offer_setup') {
    return 'تحديث العرض';
  }
  
  return log.eventType;
}

/**
 * الحصول على وصف الحدث
 */
function getEventDescription(log: WorkflowAuditEntry): string {
  const statusDescriptions: Record<string, string> = {
    'DRAFT': 'تم إنشاء طلب تمويل جديد',
    'REQUEST_SUBMITTED': 'تم تقديم الطلب وبانتظار المراجعة',
    'UNDER_REVIEW': 'الطلب قيد المراجعة من قبل فريق التمويل',
    'INFO_REQUIRED': 'يرجى تزويدنا بالمستندات المطلوبة',
    'ADMIN_SETUP': 'جاري إعداد تفاصيل العرض',
    'OFFER_READY': 'تم إعداد العرض وسيتم إرسال العقد قريباً',
    'CONTRACT_PHASE': 'يرجى مراجعة العقد وتوقيعه',
    'ACK_PHASE': 'يرجى مراجعة الإقرار وتوقيعه',
    'BOND_PHASE': 'جاري إصدار سند الأمر',
    'CREDIT_PENDING': 'جاري إضافة رصيد الخدمات لحسابك',
    'CREDIT_ACTIVE': 'رصيد الخدمات جاهز للاستخدام!',
    'IN_USE': 'جاري استخدام رصيد الخدمات',
    'COMPLETED': 'تم إتمام عقد التمويل بنجاح',
    'DECLINED': log.reason || 'تم رفض الطلب',
    'CANCELLED': log.reason || 'تم إلغاء الطلب',
    'EXPIRED': 'انتهت صلاحية الطلب'
  };
  
  if (log.toStatus && statusDescriptions[log.toStatus]) {
    return statusDescriptions[log.toStatus];
  }
  
  return log.reason || '';
}

/**
 * تنسيق التاريخ
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * تنسيق الوقت
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * الحصول على لون الحدث
 */
function getEventColor(status: TimelineEvent['status']): string {
  switch (status) {
    case 'completed':
      return 'green';
    case 'current':
      return 'blue';
    case 'pending':
      return 'gray';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * الحصول على دور الفاعل بالعربية
 */
function getActorRoleAr(role: string): string {
  const roles: Record<string, string> = {
    'customer': 'العميل',
    'admin': 'الإدارة',
    'system': 'النظام'
  };
  return roles[role] || role;
}

/**
 * إنشاء Timeline كامل مع الحالات المتوقعة
 */
export function getFullTimeline(
  currentStatus: ApplicationStatus,
  auditLogs: WorkflowAuditEntry[],
  isAdmin: boolean = false
): TimelineEvent[] {
  const completedEvents = getTimelineEvents(auditLogs, currentStatus, isAdmin);
  
  // الحالات المتوقعة بعد الحالة الحالية
  const expectedStates = getExpectedNextStates(currentStatus);
  
  const pendingEvents: TimelineEvent[] = expectedStates.map((status, index) => {
    const stateInfo = APPLICATION_STATES[status];
    return {
      id: `pending-${index}`,
      date: '',
      time: '',
      title: stateInfo.nameAr,
      description: stateInfo.customerMessage,
      status: 'pending' as const,
      phase: stateInfo.phase,
      icon: stateInfo.icon,
      color: 'gray',
      isCustomerVisible: stateInfo.customerVisible
    };
  });
  
  return [...completedEvents, ...pendingEvents];
}

/**
 * الحصول على الحالات المتوقعة التالية
 */
function getExpectedNextStates(currentStatus: ApplicationStatus): ApplicationStatus[] {
  // مسار سعيد (Happy Path)
  const happyPath: ApplicationStatus[] = [
    'DRAFT',
    'REQUEST_SUBMITTED',
    'UNDER_REVIEW',
    'ADMIN_SETUP',
    'OFFER_READY',
    'CONTRACT_PHASE',
    'ACK_PHASE',
    'BOND_PHASE',
    'CREDIT_PENDING',
    'CREDIT_ACTIVE',
    'COMPLETED'
  ];
  
  const currentIndex = happyPath.indexOf(currentStatus);
  if (currentIndex === -1) return [];
  
  return happyPath.slice(currentIndex + 1);
}
