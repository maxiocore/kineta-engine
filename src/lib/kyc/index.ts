// ============================================
// KYC System Exports - MaxioCore
// ============================================

// Types
export * from './types';

// Services
export { extractDocumentData, validateNationalIdFormat, parseDocumentDate, calculateAge } from './services/ocrService';
export { validateDocument, validateDocumentImage, crossValidateWithInput } from './services/documentValidation';
export { 
  generateLivenessChallenges, 
  getChallengeInstruction, 
  performLivenessCheck,
  performPassiveLiveness,
  checkCameraCapabilities,
  requestCameraAccess,
  stopCameraStream,
} from './services/livenessService';
export { 
  compareFaces, 
  captureSelfie, 
  analyzeFacePosition, 
  validateSelfieQuality 
} from './services/faceMatchService';
export {
  checkForDuplicates,
  hasPendingVerification,
  getVerificationHistory,
  recordVerificationAttempt,
  updateVerificationResult,
} from './services/duplicateCheck';
