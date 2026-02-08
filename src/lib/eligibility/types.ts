// ============================================
// Eligibility System Types - ASH HOLDING FinTech
// ============================================

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';

export type EligibilityState = 
  | 'idle'
  | 'identity_verification'
  | 'phone_verification'
  | 'email_verification'
  | 'history_check'
  | 'risk_assessment'
  | 'decision'
  | 'approved'
  | 'rejected';

export type EligibilityEvent =
  | { type: 'START_VERIFICATION' }
  | { type: 'IDENTITY_VERIFIED'; payload: IdentityVerificationResult }
  | { type: 'IDENTITY_FAILED'; payload: { reason: string } }
  | { type: 'PHONE_VERIFIED'; payload: PhoneVerificationResult }
  | { type: 'PHONE_FAILED'; payload: { reason: string } }
  | { type: 'EMAIL_VERIFIED'; payload: EmailVerificationResult }
  | { type: 'EMAIL_FAILED'; payload: { reason: string } }
  | { type: 'HISTORY_CHECKED'; payload: HistoryCheckResult }
  | { type: 'RISK_ASSESSED'; payload: RiskAssessmentResult }
  | { type: 'DECISION_MADE'; payload: DecisionResult }
  | { type: 'RESET' };

export interface IdentityVerificationResult {
  verified: boolean;
  nationalId: string;
  fullName: string;
  nationality: string;
  age: number;
  idExpiryValid: boolean;
  score: number;
}

export interface PhoneVerificationResult {
  verified: boolean;
  phone: string;
  isRegistered: boolean;
  operatorVerified: boolean;
  score: number;
}

export interface EmailVerificationResult {
  verified: boolean;
  email: string;
  isActive: boolean;
  domainValid: boolean;
  score: number;
}

export interface HistoryCheckResult {
  checked: boolean;
  totalOrders: number;
  completedOrders: number;
  totalSpending: number;
  hasDefaults: boolean;
  accountAge: number; // in days
  score: number;
}

export interface RiskAssessmentResult {
  assessed: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: RiskFactor[];
  maxApprovedAmount: number;
}

export interface RiskFactor {
  name: string;
  nameAr: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface DecisionResult {
  eligible: boolean;
  score: number;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'rejected';
  maxAmount: number;
  reasons: string[];
  recommendations: string[];
  verifiedAt: string;
  expiresAt: string;
}

export interface VerificationStep {
  id: string;
  name: string;
  nameAr: string;
  status: VerificationStatus;
  score: number;
  maxScore: number;
  result?: unknown;
  errorMessage?: string;
  completedAt?: string;
}

export interface EligibilityContext {
  currentState: EligibilityState;
  userId: string;
  steps: VerificationStep[];
  identityResult?: IdentityVerificationResult;
  phoneResult?: PhoneVerificationResult;
  emailResult?: EmailVerificationResult;
  historyResult?: HistoryCheckResult;
  riskResult?: RiskAssessmentResult;
  decision?: DecisionResult;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// Decision Engine Rules
export interface EligibilityRule {
  id: string;
  name: string;
  condition: (context: EligibilityContext) => boolean;
  score: number;
  weight: number;
  failureReason: string;
  recommendation: string;
}

export interface EligibilityConfig {
  minAge: number;
  maxAge: number;
  minAccountAge: number; // days
  minOrders: number;
  minSpending: number;
  minScore: number;
  scoreThresholds: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  amountTiers: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  validityHours: number;
}
