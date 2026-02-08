// ============================================
// KYC System Types - ASH HOLDING FinTech
// ID Verification, OCR, Liveness Detection
// ============================================

export type KYCStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'EXPIRED' | 'DUPLICATE';

export type DocumentType = 'national_id' | 'iqama' | 'passport';

export interface OCRResult {
  success: boolean;
  confidence: number;
  extractedData: {
    fullName?: string;
    fullNameAr?: string;
    nationalId?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    nationality?: string;
    gender?: string;
    issueDate?: string;
  };
  rawText?: string;
  processingTime: number;
}

export interface DocumentValidation {
  isValid: boolean;
  isExpired: boolean;
  expiryDate?: Date;
  daysUntilExpiry?: number;
  documentType: DocumentType;
  errors: string[];
}

export interface LivenessResult {
  passed: boolean;
  confidence: number;
  challenges: LivenessChallenge[];
  sessionId: string;
  processingTime: number;
  spoofAttempt: boolean;
}

export interface LivenessChallenge {
  type: 'blink' | 'smile' | 'turn_left' | 'turn_right' | 'nod';
  completed: boolean;
  confidence: number;
}

export interface FaceMatchResult {
  matched: boolean;
  similarity: number; // 0-100
  documentFaceQuality: number;
  selfieQuality: number;
  errors: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingUserId?: string;
  existingApplicationDate?: string;
  reason?: string;
}

export interface KYCVerificationResult {
  status: KYCStatus;
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  
  // Document verification
  documentUploaded: boolean;
  documentType?: DocumentType;
  ocrResult?: OCRResult;
  documentValidation?: DocumentValidation;
  
  // Biometric verification
  livenessResult?: LivenessResult;
  faceMatchResult?: FaceMatchResult;
  
  // Duplicate check
  duplicateCheck?: DuplicateCheckResult;
  
  // Final decision
  overallScore: number;
  failureReasons: string[];
  recommendations: string[];
  
  // Extracted verified data
  verifiedData?: VerifiedIdentityData;
}

export interface VerifiedIdentityData {
  nationalId: string;
  fullName: string;
  fullNameAr?: string;
  dateOfBirth: string;
  age: number;
  nationality: string;
  documentType: DocumentType;
  documentExpiry: string;
  verifiedAt: string;
}

export interface KYCSessionState {
  sessionId: string;
  userId: string;
  currentStep: KYCStep;
  status: KYCStatus;
  
  // Step completion
  documentUploadComplete: boolean;
  ocrComplete: boolean;
  livenessComplete: boolean;
  faceMatchComplete: boolean;
  duplicateCheckComplete: boolean;
  
  // Results storage
  uploadedDocumentUrl?: string;
  uploadedSelfieUrl?: string;
  ocrResult?: OCRResult;
  documentValidation?: DocumentValidation;
  livenessResult?: LivenessResult;
  faceMatchResult?: FaceMatchResult;
  duplicateCheck?: DuplicateCheckResult;
  
  // Timestamps
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
  
  // Error handling
  errors: string[];
  retryCount: number;
  maxRetries: number;
}

export type KYCStep = 
  | 'document_upload'
  | 'document_processing'
  | 'liveness_check'
  | 'face_matching'
  | 'duplicate_check'
  | 'final_review'
  | 'completed'
  | 'failed';

export interface KYCStepConfig {
  id: KYCStep;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  required: boolean;
  maxAttempts: number;
}

export const KYC_STEPS_CONFIG: KYCStepConfig[] = [
  {
    id: 'document_upload',
    name: 'Document Upload',
    nameAr: 'رفع الوثيقة',
    description: 'Upload your ID or residence permit',
    descriptionAr: 'ارفع صورة هويتك أو إقامتك',
    icon: 'FileUp',
    required: true,
    maxAttempts: 3,
  },
  {
    id: 'document_processing',
    name: 'Document Processing',
    nameAr: 'معالجة الوثيقة',
    description: 'Extracting and validating document data',
    descriptionAr: 'استخراج البيانات والتحقق منها',
    icon: 'Scan',
    required: true,
    maxAttempts: 1,
  },
  {
    id: 'liveness_check',
    name: 'Liveness Detection',
    nameAr: 'التحقق الحيوي',
    description: 'Verify you are a real person',
    descriptionAr: 'تأكد أنك شخص حقيقي',
    icon: 'Camera',
    required: true,
    maxAttempts: 3,
  },
  {
    id: 'face_matching',
    name: 'Face Matching',
    nameAr: 'مطابقة الوجه',
    description: 'Match your face with document photo',
    descriptionAr: 'مطابقة وجهك مع صورة الوثيقة',
    icon: 'UserCheck',
    required: true,
    maxAttempts: 3,
  },
  {
    id: 'duplicate_check',
    name: 'Duplicate Check',
    nameAr: 'فحص التكرار',
    description: 'Verify document uniqueness',
    descriptionAr: 'التحقق من عدم استخدام الوثيقة سابقاً',
    icon: 'ShieldCheck',
    required: true,
    maxAttempts: 1,
  },
  {
    id: 'final_review',
    name: 'Final Review',
    nameAr: 'المراجعة النهائية',
    description: 'Reviewing all verification results',
    descriptionAr: 'مراجعة جميع نتائج التحقق',
    icon: 'CheckCircle',
    required: true,
    maxAttempts: 1,
  },
];

export interface KYCConfig {
  // Document validation
  minDocumentAge: number; // Minimum age allowed
  maxDocumentAge: number; // Maximum age allowed
  minExpiryDays: number; // Minimum days until expiry
  
  // OCR thresholds
  minOcrConfidence: number; // Minimum OCR confidence (0-1)
  
  // Liveness thresholds
  minLivenessConfidence: number; // Minimum liveness confidence (0-1)
  requiredChallenges: number; // Number of liveness challenges
  
  // Face matching
  minFaceMatchScore: number; // Minimum face match score (0-100)
  minFaceQuality: number; // Minimum face quality score
  
  // Session settings
  sessionTimeoutMinutes: number;
  maxRetries: number;
}

export const KYC_CONFIG: KYCConfig = {
  minDocumentAge: 18,
  maxDocumentAge: 80,
  minExpiryDays: 30,
  minOcrConfidence: 0.85,
  minLivenessConfidence: 0.90,
  requiredChallenges: 2,
  minFaceMatchScore: 80,
  minFaceQuality: 0.7,
  sessionTimeoutMinutes: 30,
  maxRetries: 3,
};
