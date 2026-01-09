/**
 * نظام حالات طلب تمويل الخدمات
 * Service Financing Application State Machine
 * 
 * MaxioCore - Ali Saleh Al-Shehri Holding Company
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

// Re-export a convenience function to get status info
export function getStatusInfo(status: string) {
  const { STATE_DEFINITIONS } = require('./states');
  return STATE_DEFINITIONS[status] || null;
}
