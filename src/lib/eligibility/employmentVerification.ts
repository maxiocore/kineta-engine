// Employment Verification Engine
// Strict conditional logic for employment status validation

import {
  EmploymentStatus,
  EmploymentTypeConfig,
  RequiredDocument,
  DocumentType,
  VerificationStatus as EmpVerificationStatus,
  EMPLOYMENT_CONFIGS,
  getEmploymentConfig,
  getMaxFinancingAmount,
} from './employmentTypes';

export interface UploadedDocument {
  type: DocumentType;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'pending' | 'verified' | 'rejected';
  extractedData?: Record<string, any>;
  rejectionReason?: string;
}

export interface IncomeVerificationResult {
  isVerified: boolean;
  declaredIncome: number;
  verifiedIncome: number;
  incomeSource: string;
  consecutiveMonths: number;
  discrepancy?: number;
  discrepancyPercentage?: number;
  flags: string[];
}

export interface GuarantorInfo {
  nationalId: string;
  name: string;
  employmentStatus: EmploymentStatus;
  monthlyIncome: number;
  isVerified: boolean;
  relationship: string;
}

export interface EmploymentVerificationState {
  employmentStatus: EmploymentStatus | null;
  verificationStatus: EmpVerificationStatus;
  uploadedDocuments: UploadedDocument[];
  incomeVerification: IncomeVerificationResult | null;
  guarantor: GuarantorInfo | null;
  eligibilityScore: number;
  maxFinancingAmount: number;
  isEligible: boolean;
  pendingRequirements: string[];
  rejectionReasons: string[];
  warnings: string[];
  completionPercentage: number;
}

export interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
}

// Initial state
export function createInitialState(): EmploymentVerificationState {
  return {
    employmentStatus: null,
    verificationStatus: 'not_started',
    uploadedDocuments: [],
    incomeVerification: null,
    guarantor: null,
    eligibilityScore: 0,
    maxFinancingAmount: 0,
    isEligible: false,
    pendingRequirements: [],
    rejectionReasons: [],
    warnings: [],
    completionPercentage: 0,
  };
}

// Validate employment selection
export function validateEmploymentSelection(
  status: EmploymentStatus,
  additionalInfo?: Record<string, any>
): { isValid: boolean; warnings: string[]; blockers: string[] } {
  const config = getEmploymentConfig(status);
  const warnings: string[] = [];
  const blockers: string[] = [];

  // Check if employment type is eligible
  if (!config.isEligible) {
    blockers.push('هذا النوع من التوظيف غير مؤهل للتمويل حالياً');
  }

  // Employment-specific validations
  switch (status) {
    case 'employed':
      if (additionalInfo?.employmentMonths && additionalInfo.employmentMonths < 6) {
        blockers.push('يجب أن تكون مدة العمل 6 أشهر على الأقل');
      }
      if (additionalInfo?.salary && additionalInfo.salary < config.incomeRequirement.minMonthlyIncome) {
        blockers.push(`الحد الأدنى للراتب ${config.incomeRequirement.minMonthlyIncome} ر.س`);
      }
      break;

    case 'business_owner':
      if (additionalInfo?.businessAge && additionalInfo.businessAge < 12) {
        blockers.push('يجب أن يكون عمر المنشأة سنة على الأقل');
      }
      if (additionalInfo?.sector && config.restrictions.blockedSectors?.includes(additionalInfo.sector)) {
        blockers.push('قطاع العمل غير مؤهل للتمويل');
      }
      break;

    case 'student':
      warnings.push('التمويل للطلاب يتطلب كفيل موظف أو صاحب عمل');
      warnings.push('الحد الأقصى للتمويل 15,000 ر.س');
      break;

    case 'other':
      warnings.push('هذه الفئة تتطلب مراجعة إضافية');
      warnings.push('يجب توفير كفيل مؤهل');
      break;
  }

  return {
    isValid: blockers.length === 0,
    warnings,
    blockers,
  };
}

// Check document completeness
export function checkDocumentCompleteness(
  status: EmploymentStatus,
  uploadedDocs: UploadedDocument[]
): { 
  isComplete: boolean; 
  missingRequired: RequiredDocument[]; 
  missingOptional: RequiredDocument[];
  completionPercentage: number;
} {
  const config = getEmploymentConfig(status);
  const uploadedTypes = new Set(uploadedDocs.map(d => d.type));
  
  const missingRequired = config.requiredDocuments.filter(
    doc => !uploadedTypes.has(doc.type)
  );
  
  const missingOptional = config.optionalDocuments.filter(
    doc => !uploadedTypes.has(doc.type)
  );

  const totalRequired = config.requiredDocuments.length;
  const uploadedRequired = totalRequired - missingRequired.length;
  const completionPercentage = Math.round((uploadedRequired / totalRequired) * 100);

  return {
    isComplete: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    completionPercentage,
  };
}

// Verify document validity
export function verifyDocumentValidity(
  doc: UploadedDocument,
  docConfig: RequiredDocument
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file size
  const maxSizeBytes = docConfig.maxSizeMB * 1024 * 1024;
  if (doc.fileSize > maxSizeBytes) {
    errors.push(`حجم الملف يتجاوز ${docConfig.maxSizeMB} ميجابايت`);
  }

  // Check file format
  const extension = doc.fileName.split('.').pop()?.toLowerCase();
  if (!extension || !docConfig.acceptedFormats.includes(extension)) {
    errors.push(`صيغة الملف غير مقبولة. الصيغ المقبولة: ${docConfig.acceptedFormats.join(', ')}`);
  }

  // Check validity period
  if (docConfig.validityMonths) {
    const docAge = (Date.now() - doc.uploadedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (docAge > docConfig.validityMonths) {
      errors.push(`المستند قديم. يجب أن يكون صادراً خلال ${docConfig.validityMonths} شهر`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Verify income - Mock implementation (would connect to real verification services)
export async function verifyIncome(
  status: EmploymentStatus,
  declaredIncome: number,
  documents: UploadedDocument[]
): Promise<IncomeVerificationResult> {
  const config = getEmploymentConfig(status);
  const flags: string[] = [];
  
  // Simulate income extraction from documents
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock verified income (in real system, this would come from OCR/API)
  const verifiedIncome = declaredIncome * (0.9 + Math.random() * 0.2); // 90-110% of declared
  const discrepancy = Math.abs(declaredIncome - verifiedIncome);
  const discrepancyPercentage = (discrepancy / declaredIncome) * 100;

  // Check minimum income
  if (verifiedIncome < config.incomeRequirement.minMonthlyIncome) {
    flags.push('BELOW_MINIMUM_INCOME');
  }

  // Check discrepancy
  if (discrepancyPercentage > 10) {
    flags.push('INCOME_DISCREPANCY');
  }

  // Simulate consecutive months check
  const consecutiveMonths = Math.floor(Math.random() * 6) + 3;
  if (consecutiveMonths < config.incomeRequirement.consecutiveMonths) {
    flags.push('INSUFFICIENT_INCOME_HISTORY');
  }

  const incomeSource = status === 'employed' ? 'salary' : 
                       status === 'business_owner' ? 'business_revenue' :
                       'other';

  return {
    isVerified: flags.length === 0,
    declaredIncome,
    verifiedIncome: Math.round(verifiedIncome),
    incomeSource,
    consecutiveMonths,
    discrepancy: Math.round(discrepancy),
    discrepancyPercentage: Math.round(discrepancyPercentage * 10) / 10,
    flags,
  };
}

// Verify guarantor
export async function verifyGuarantor(
  guarantor: Omit<GuarantorInfo, 'isVerified'>
): Promise<{ isVerified: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check guarantor's employment status
  if (guarantor.employmentStatus !== 'employed' && guarantor.employmentStatus !== 'business_owner') {
    errors.push('الكفيل يجب أن يكون موظفاً أو صاحب عمل');
  }

  // Check guarantor's income
  const guarantorConfig = getEmploymentConfig(guarantor.employmentStatus);
  if (guarantor.monthlyIncome < guarantorConfig.incomeRequirement.minMonthlyIncome) {
    errors.push('دخل الكفيل أقل من الحد المطلوب');
  }

  // Validate national ID format
  if (!/^[12]\d{9}$/.test(guarantor.nationalId)) {
    errors.push('رقم هوية الكفيل غير صحيح');
  }

  return {
    isVerified: errors.length === 0,
    errors,
  };
}

// Calculate final eligibility
export function calculateEligibility(state: EmploymentVerificationState): {
  isEligible: boolean;
  score: number;
  maxAmount: number;
  reasons: string[];
} {
  if (!state.employmentStatus) {
    return {
      isEligible: false,
      score: 0,
      maxAmount: 0,
      reasons: ['لم يتم تحديد الحالة الوظيفية'],
    };
  }

  const config = getEmploymentConfig(state.employmentStatus);
  let score = config.eligibilityScore;
  const reasons: string[] = [];

  // Check documents
  const docCheck = checkDocumentCompleteness(state.employmentStatus, state.uploadedDocuments);
  if (!docCheck.isComplete) {
    score -= 20;
    reasons.push('المستندات المطلوبة غير مكتملة');
  }

  // Check income
  if (state.incomeVerification) {
    if (!state.incomeVerification.isVerified) {
      score -= 30;
      if (state.incomeVerification.flags.includes('BELOW_MINIMUM_INCOME')) {
        reasons.push('الدخل أقل من الحد الأدنى المطلوب');
      }
      if (state.incomeVerification.flags.includes('INCOME_DISCREPANCY')) {
        reasons.push('هناك تباين كبير بين الدخل المصرح والمُثبت');
      }
    }
  } else {
    score -= 25;
    reasons.push('لم يتم التحقق من الدخل');
  }

  // Check guarantor if required
  if (config.restrictions.requiresGuarantor) {
    if (!state.guarantor) {
      score -= 30;
      reasons.push('يجب توفير كفيل');
    } else if (!state.guarantor.isVerified) {
      score -= 15;
      reasons.push('لم يتم التحقق من الكفيل');
    }
  }

  // Calculate max financing amount
  const monthlyIncome = state.incomeVerification?.verifiedIncome || 0;
  const maxAmount = getMaxFinancingAmount(state.employmentStatus, monthlyIncome);

  // Determine eligibility
  const isEligible = score >= 60 && reasons.length === 0;

  return {
    isEligible,
    score: Math.max(0, Math.min(100, score)),
    maxAmount,
    reasons,
  };
}

// Full verification process
export async function runFullVerification(
  status: EmploymentStatus,
  documents: UploadedDocument[],
  declaredIncome: number,
  guarantorInfo?: Omit<GuarantorInfo, 'isVerified'>
): Promise<EmploymentVerificationState> {
  const state = createInitialState();
  state.employmentStatus = status;
  state.uploadedDocuments = documents;

  // Step 1: Validate employment selection
  const selectionValidation = validateEmploymentSelection(status);
  if (!selectionValidation.isValid) {
    state.verificationStatus = 'rejected';
    state.rejectionReasons = selectionValidation.blockers;
    return state;
  }
  state.warnings = selectionValidation.warnings;

  // Step 2: Check document completeness
  const docCheck = checkDocumentCompleteness(status, documents);
  state.completionPercentage = docCheck.completionPercentage;
  
  if (!docCheck.isComplete) {
    state.verificationStatus = 'pending_documents';
    state.pendingRequirements = docCheck.missingRequired.map(d => d.nameAr);
    return state;
  }

  state.verificationStatus = 'under_review';

  // Step 3: Verify income
  const incomeResult = await verifyIncome(status, declaredIncome, documents);
  state.incomeVerification = incomeResult;

  // Step 4: Verify guarantor if required
  const config = getEmploymentConfig(status);
  if (config.restrictions.requiresGuarantor) {
    if (guarantorInfo) {
      const guarantorResult = await verifyGuarantor(guarantorInfo);
      state.guarantor = {
        ...guarantorInfo,
        isVerified: guarantorResult.isVerified,
      };
      if (!guarantorResult.isVerified) {
        state.warnings.push(...guarantorResult.errors);
      }
    } else {
      state.pendingRequirements.push('توفير كفيل');
    }
  }

  // Step 5: Calculate final eligibility
  const eligibility = calculateEligibility(state);
  state.eligibilityScore = eligibility.score;
  state.maxFinancingAmount = eligibility.maxAmount;
  state.isEligible = eligibility.isEligible;

  if (eligibility.isEligible) {
    state.verificationStatus = 'verified';
  } else {
    state.verificationStatus = 'rejected';
    state.rejectionReasons = eligibility.reasons;
  }

  return state;
}
