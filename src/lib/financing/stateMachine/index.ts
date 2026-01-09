/**
 * نظام حالات طلب تمويل الخدمات
 * Service Financing Application State Machine
 * 
 * MaxioCore - Ali Saleh Al-Shehri Holding Company
 * 
 * ⚠️ تنبيه: التمويل غير نقدي - رصيد خدمات داخل المنصة فقط
 */

// Types
export type {
  FinancingApplicationStatus,
  TransitionTrigger,
  StateTransition,
  StateDefinition,
  TransitionValidationResult,
  StatusChangeLog
} from './types';

// State Definitions
export {
  STATE_DEFINITIONS,
  getStateDefinition,
  isTerminalState,
  getTerminalStates,
  getStatesRequiringUserAction
} from './states';

// Transitions
export {
  ALLOWED_TRANSITIONS,
  getAvailableTransitions,
  getTransitionsForTrigger,
  getNextPossibleStates,
  transitionExists,
  getTransition
} from './transitions';

// Validation
export {
  validateTransition,
  canCustomerCancel,
  requiresCustomerAction,
  requiresReviewerAction,
  requiresAdminAction,
  getCustomerActions,
  validateTransitionData
} from './validator';

// State Content (Arabic UX Copy)
export {
  STATE_CONTENT,
  getStateContent,
  getNotificationMessage,
  getSmsMessage,
  hasFinancingNote,
  getStatesWithFinancingNote
} from './stateContent';

export type { StateContent } from './stateContent';

// Email Content
export {
  EMAIL_CONTENT,
  FINANCING_DISCLAIMER,
  getEmailContent,
  shouldSendEmail,
  getEmailTriggerStatuses
} from './emailContent';

export type { EmailContent } from './emailContent';

// Re-export a convenience function to get status info
export function getStatusInfo(status: string) {
  const { STATE_DEFINITIONS } = require('./states');
  return STATE_DEFINITIONS[status] || null;
}
