/**
 * نظام أحداث التمويل
 * Financing Events System
 */

export {
  emitStatusChanged,
  handleStatusTransition
} from './eventEmitter';

export {
  type ApplicationStatusChangedEvent,
  type EventProcessingResult,
  type ActivityLogEntry,
  type SafeEmailPayload,
  APPROVED_EMAIL_STATUSES,
  ADMIN_ONLY_EVENTS,
  shouldSendEmailForStatus,
  isEventVisibleToCustomer,
  getEmailTemplateId
} from './types';
