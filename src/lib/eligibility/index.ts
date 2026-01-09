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

// Advanced Decision Engine
export {
  type DecisionOutcome,
  type FinancingLimit,
  type DecisionGate,
  type GateResult,
  type FullVerificationContext,
  type DecisionOutput,
  type DecisionReason,
  type GateResultSummary,
  AdvancedDecisionEngine,
  decisionEngine,
} from './advancedDecisionEngine';

// Employment Types (with renamed VerificationStatus to avoid conflict)
export { 
  type EmploymentStatus,
  type DocumentType,
  type RequiredDocument,
  type IncomeRequirement,
  type EmploymentRestriction,
  type EmploymentTypeConfig,
  EMPLOYMENT_CONFIGS,
  getEmploymentConfig,
  getAllEmploymentTypes,
  getRequiredDocuments,
  getOptionalDocuments,
  getMinIncome,
  requiresGuarantor,
  getMaxFinancingAmount,
} from './employmentTypes';

// Employment Verification
export { 
  createInitialState,
  validateEmploymentSelection,
  checkDocumentCompleteness,
  verifyDocumentValidity,
  verifyIncome,
  verifyGuarantor,
  calculateEligibility,
  runFullVerification,
  type UploadedDocument,
  type IncomeVerificationResult,
  type GuarantorInfo,
  type EmploymentVerificationState,
} from './employmentVerification';
