// ============================================
// Eligibility System - MaxioCore
// Main entry point and exports
// ============================================

// Types
export * from './types';

// Configuration
export { ELIGIBILITY_CONFIG, ELIGIBILITY_RULES, VERIFICATION_STEPS } from './config';

// State Machine
export { 
  createInitialContext, 
  transition, 
  canTransition, 
  getNextRequiredStep,
  getTotalScore,
  getMaxPossibleScore,
} from './stateMachine';

// Verification Services
export { 
  verifyIdentity, 
  verifyPhone, 
  verifyEmail, 
  checkHistory 
} from './verificationServices';

// Decision Engine
export { 
  assessRisk, 
  makeDecision, 
  getTierInfo 
} from './decisionEngine';
