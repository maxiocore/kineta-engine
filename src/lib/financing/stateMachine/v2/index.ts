/**
 * نظام حالات طلب تمويل الخدمات - الإصدار الثاني
 * Service Financing Application State Machine V2
 * 
 * MaxioCore - Ali Saleh Al-Shehri Holding Company
 * 
 * ⚠️ تنبيه: التمويل غير نقدي - رصيد خدمات داخل المنصة فقط
 */

// Types
export type {
  ApplicationStatus,
  ContractStatus,
  AcknowledgmentStatus,
  ExecutiveBondStatus,
  TransitionActor,
  WorkflowPhase,
  StateTransition,
  StateDefinition,
  TransitionValidationResult,
  OfferSetup,
  WorkflowAuditEntry,
  AdminPermission,
  AdminAction,
  FinancingWorkflowState
} from './types';

// Application States
export {
  APPLICATION_STATES,
  getApplicationState,
  isTerminalState,
  getTerminalStates,
  getStatesByPhase,
  getCustomerVisibleStates
} from './applicationStates';

// Transitions
export {
  APPLICATION_TRANSITIONS,
  CONTRACT_TRANSITIONS,
  ACKNOWLEDGMENT_TRANSITIONS,
  BOND_TRANSITIONS,
  getAvailableTransitions,
  getTransitionsForActor,
  transitionExists,
  getTransition,
  getNextPossibleStates
} from './transitions';

// Admin Actions
export {
  ADMIN_ACTIONS,
  getActionsForStatus,
  getActionsForPermission,
  getAction,
  canExecuteAction,
  PERMISSION_DESCRIPTIONS
} from './adminActions';

// Validation
export {
  validateTransition,
  validateOfferSetup,
  validateContractSignature,
  canCustomerCancel,
  getRequiredFields
} from './validator';

// Timeline
export {
  getTimelineEvents,
  formatTimelineEvent,
  getFullTimeline,
  type TimelineEvent
} from './timeline';
