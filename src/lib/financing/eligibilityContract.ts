// ============================================
// Eligibility Contract - MaxioCore FinTech
// Data Contract between Eligibility Engine & Loan Application
// ============================================

import { DecisionResult, RiskAssessmentResult } from '@/lib/eligibility/types';

// =============================================
// ELIGIBILITY DECISION STATUSES
// =============================================

/**
 * The five possible eligibility decision statuses
 */
export type EligibilityDecisionStatus = 
  | 'APPROVED'              // Full approval - all options open
  | 'APPROVED_WITH_LIMITS'  // Partial approval - some restrictions apply
  | 'MANUAL_REVIEW'         // Pending human review
  | 'SOFT_DECLINE'          // Temporary decline - can retry after fixing issues
  | 'HARD_DECLINE';         // Permanent decline - no retry allowed

/**
 * Reasons that could lead to each decision status
 */
export type DeclineReason = 
  | 'identity_verification_failed'
  | 'age_out_of_range'
  | 'account_too_new'
  | 'insufficient_history'
  | 'low_spending'
  | 'previous_defaults'
  | 'blacklisted'
  | 'fraud_detected'
  | 'phone_not_verified'
  | 'email_not_verified'
  | 'income_insufficient'
  | 'high_risk_score';

/**
 * Actions user can take based on decision status
 */
export type AllowedAction = 
  | 'apply_full'           // Can apply for any amount
  | 'apply_limited'        // Can apply within limits
  | 'submit_for_review'    // Submit and wait for manual review
  | 'retry_after_fix'      // Fix issues and retry
  | 'retry_after_period'   // Wait for cooldown period
  | 'contact_support'      // Manual intervention needed
  | 'blocked';             // No action available

// =============================================
// ELIGIBILITY LIMITS STRUCTURE
// =============================================

/**
 * Financial limits based on eligibility
 */
export interface EligibilityLimits {
  minAmount: number;
  maxAmount: number;
  maxTenorMonths: number;
  minTenorMonths: number;
  availableProducts: ('personal' | 'business' | 'service')[];
  installmentCapPercentage: number; // Max % of monthly income
}

/**
 * Default limits for each tier
 */
export const TIER_LIMITS: Record<string, EligibilityLimits> = {
  platinum: {
    minAmount: 1000,
    maxAmount: 100000,
    maxTenorMonths: 24,
    minTenorMonths: 1,
    availableProducts: ['personal', 'business', 'service'],
    installmentCapPercentage: 50,
  },
  gold: {
    minAmount: 1000,
    maxAmount: 50000,
    maxTenorMonths: 18,
    minTenorMonths: 1,
    availableProducts: ['personal', 'business', 'service'],
    installmentCapPercentage: 40,
  },
  silver: {
    minAmount: 1000,
    maxAmount: 25000,
    maxTenorMonths: 12,
    minTenorMonths: 1,
    availableProducts: ['personal', 'service'],
    installmentCapPercentage: 35,
  },
  bronze: {
    minAmount: 1000,
    maxAmount: 10000,
    maxTenorMonths: 6,
    minTenorMonths: 1,
    availableProducts: ['personal'],
    installmentCapPercentage: 30,
  },
  rejected: {
    minAmount: 0,
    maxAmount: 0,
    maxTenorMonths: 0,
    minTenorMonths: 0,
    availableProducts: [],
    installmentCapPercentage: 0,
  },
};

// =============================================
// ELIGIBILITY GATE RESULT
// =============================================

/**
 * Required items for soft decline/manual review
 */
export interface RequiredItem {
  id: string;
  type: 'document' | 'verification' | 'information' | 'waiting_period';
  titleAr: string;
  descriptionAr: string;
  isCompleted: boolean;
  actionUrl?: string;
}

/**
 * Retry configuration for soft declines
 */
export interface RetryConfig {
  canRetry: boolean;
  retryAfterDate?: string; // ISO date
  retryAfterDays?: number;
  requiredItems: RequiredItem[];
  message: string;
  messageAr: string;
}

/**
 * The main contract interface - output from Eligibility Engine
 * consumed by Loan Application Wizard
 */
export interface EligibilityGateResult {
  // Core Decision
  status: EligibilityDecisionStatus;
  
  // From Decision Engine
  decision: DecisionResult | null;
  riskAssessment: RiskAssessmentResult | null;
  
  // Computed Limits (null for HARD_DECLINE)
  limits: EligibilityLimits | null;
  
  // Allowed Actions
  allowedActions: AllowedAction[];
  
  // For declines
  declineReasons: DeclineReason[];
  declineMessageAr: string;
  
  // For soft decline / manual review
  retryConfig: RetryConfig | null;
  
  // Timestamps
  checkedAt: string;
  expiresAt: string;
  
  // Metadata
  sessionId: string;
  checksum: string; // For integrity verification
}

// =============================================
// STATUS DETERMINATION LOGIC
// =============================================

/**
 * Determine eligibility status from DecisionResult
 */
export function determineEligibilityStatus(
  decision: DecisionResult | null,
  riskAssessment: RiskAssessmentResult | null,
  additionalFlags?: {
    isBlacklisted?: boolean;
    fraudDetected?: boolean;
    requiresManualReview?: boolean;
  }
): EligibilityDecisionStatus {
  // No decision yet
  if (!decision) {
    return 'HARD_DECLINE';
  }

  // Check for hard blocks first
  if (additionalFlags?.fraudDetected || additionalFlags?.isBlacklisted) {
    return 'HARD_DECLINE';
  }

  // Check for manual review flag
  if (additionalFlags?.requiresManualReview) {
    return 'MANUAL_REVIEW';
  }

  // Not eligible at all
  if (!decision.eligible) {
    // Check if it's recoverable
    const isRecoverable = checkIfRecoverable(decision.reasons);
    if (isRecoverable) {
      return 'SOFT_DECLINE';
    }
    return 'HARD_DECLINE';
  }

  // Eligible but with restrictions
  if (decision.tier === 'bronze' || decision.tier === 'silver') {
    return 'APPROVED_WITH_LIMITS';
  }

  // Check risk level for potential limits
  if (riskAssessment && riskAssessment.riskLevel === 'medium') {
    return 'APPROVED_WITH_LIMITS';
  }

  // Full approval
  return 'APPROVED';
}

/**
 * Check if decline reasons are recoverable
 */
function checkIfRecoverable(reasons: string[]): boolean {
  const recoverablePatterns = [
    'جوال غير موثق',
    'بريد غير مؤكد',
    'حساب جديد',
    'طلبات قليلة',
    'إنفاق قليل',
  ];

  return reasons.some(reason => 
    recoverablePatterns.some(pattern => reason.includes(pattern))
  );
}

// =============================================
// BUILD ELIGIBILITY GATE RESULT
// =============================================

/**
 * Build complete EligibilityGateResult from engine outputs
 */
export function buildEligibilityGateResult(
  decision: DecisionResult | null,
  riskAssessment: RiskAssessmentResult | null,
  additionalFlags?: {
    isBlacklisted?: boolean;
    fraudDetected?: boolean;
    requiresManualReview?: boolean;
  }
): EligibilityGateResult {
  const status = determineEligibilityStatus(decision, riskAssessment, additionalFlags);
  const now = new Date();
  const sessionId = `session_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine limits
  let limits: EligibilityLimits | null = null;
  if (status === 'APPROVED' || status === 'APPROVED_WITH_LIMITS') {
    limits = decision ? TIER_LIMITS[decision.tier] : null;
  }

  // Determine allowed actions
  const allowedActions = getAllowedActions(status);

  // Build decline reasons
  const declineReasons = buildDeclineReasons(decision, riskAssessment, additionalFlags);
  
  // Build decline message
  const declineMessageAr = buildDeclineMessage(status, declineReasons);

  // Build retry config for soft decline
  const retryConfig = buildRetryConfig(status, decision);

  // Calculate checksum for integrity
  const checksum = generateChecksum({
    status,
    tier: decision?.tier,
    maxAmount: limits?.maxAmount,
    sessionId,
  });

  return {
    status,
    decision,
    riskAssessment,
    limits,
    allowedActions,
    declineReasons,
    declineMessageAr,
    retryConfig,
    checkedAt: now.toISOString(),
    expiresAt: decision?.expiresAt || new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    sessionId,
    checksum,
  };
}

/**
 * Get allowed actions for a status
 */
function getAllowedActions(status: EligibilityDecisionStatus): AllowedAction[] {
  switch (status) {
    case 'APPROVED':
      return ['apply_full'];
    case 'APPROVED_WITH_LIMITS':
      return ['apply_limited'];
    case 'MANUAL_REVIEW':
      return ['submit_for_review', 'contact_support'];
    case 'SOFT_DECLINE':
      return ['retry_after_fix', 'contact_support'];
    case 'HARD_DECLINE':
      return ['contact_support', 'blocked'];
    default:
      return ['blocked'];
  }
}

/**
 * Build decline reasons list
 */
function buildDeclineReasons(
  decision: DecisionResult | null,
  riskAssessment: RiskAssessmentResult | null,
  additionalFlags?: { isBlacklisted?: boolean; fraudDetected?: boolean }
): DeclineReason[] {
  const reasons: DeclineReason[] = [];

  if (additionalFlags?.fraudDetected) {
    reasons.push('fraud_detected');
  }

  if (additionalFlags?.isBlacklisted) {
    reasons.push('blacklisted');
  }

  if (!decision) return reasons;

  decision.reasons.forEach(reason => {
    if (reason.includes('هوية')) reasons.push('identity_verification_failed');
    if (reason.includes('عمر')) reasons.push('age_out_of_range');
    if (reason.includes('جديد')) reasons.push('account_too_new');
    if (reason.includes('طلبات')) reasons.push('insufficient_history');
    if (reason.includes('إنفاق')) reasons.push('low_spending');
    if (reason.includes('تعثر')) reasons.push('previous_defaults');
    if (reason.includes('جوال')) reasons.push('phone_not_verified');
    if (reason.includes('بريد')) reasons.push('email_not_verified');
  });

  if (riskAssessment?.riskLevel === 'critical' || riskAssessment?.riskLevel === 'high') {
    reasons.push('high_risk_score');
  }

  return [...new Set(reasons)]; // Remove duplicates
}

/**
 * Build Arabic decline message
 */
function buildDeclineMessage(
  status: EligibilityDecisionStatus,
  reasons: DeclineReason[]
): string {
  if (status === 'APPROVED' || status === 'APPROVED_WITH_LIMITS') {
    return '';
  }

  if (status === 'MANUAL_REVIEW') {
    return 'طلبك يحتاج إلى مراجعة إضافية من فريقنا. سنتواصل معك خلال 24-48 ساعة.';
  }

  if (status === 'SOFT_DECLINE') {
    return 'لم نتمكن من الموافقة على طلبك حالياً، لكن يمكنك المحاولة مرة أخرى بعد استكمال المتطلبات الناقصة.';
  }

  // HARD_DECLINE
  if (reasons.includes('fraud_detected')) {
    return 'تم رفض طلبك لأسباب أمنية. يرجى التواصل مع الدعم إذا كنت تعتقد أن هذا خطأ.';
  }

  if (reasons.includes('blacklisted')) {
    return 'عذراً، لا يمكننا معالجة طلبك في الوقت الحالي.';
  }

  if (reasons.includes('previous_defaults')) {
    return 'بناءً على سجل السداد السابق، لا يمكننا الموافقة على طلب تمويل جديد.';
  }

  return 'عذراً، لم تستوفِ متطلبات الأهلية للتمويل. يمكنك المحاولة لاحقاً أو التواصل مع فريق الدعم.';
}

/**
 * Build retry configuration for soft decline
 */
function buildRetryConfig(
  status: EligibilityDecisionStatus,
  decision: DecisionResult | null
): RetryConfig | null {
  if (status !== 'SOFT_DECLINE') {
    return null;
  }

  const requiredItems: RequiredItem[] = [];

  if (decision) {
    decision.reasons.forEach((reason, index) => {
      if (reason.includes('جوال')) {
        requiredItems.push({
          id: `req_${index}_phone`,
          type: 'verification',
          titleAr: 'توثيق رقم الجوال',
          descriptionAr: 'قم بتوثيق رقم جوالك للمتابعة',
          isCompleted: false,
          actionUrl: '/dashboard/settings/phone',
        });
      }
      if (reason.includes('بريد')) {
        requiredItems.push({
          id: `req_${index}_email`,
          type: 'verification',
          titleAr: 'تأكيد البريد الإلكتروني',
          descriptionAr: 'قم بتأكيد بريدك الإلكتروني',
          isCompleted: false,
          actionUrl: '/dashboard/settings/email',
        });
      }
      if (reason.includes('جديد')) {
        requiredItems.push({
          id: `req_${index}_account_age`,
          type: 'waiting_period',
          titleAr: 'عمر الحساب',
          descriptionAr: 'حسابك جديد، انتظر 30 يوماً ثم أعد المحاولة',
          isCompleted: false,
        });
      }
      if (reason.includes('طلبات') || reason.includes('إنفاق')) {
        requiredItems.push({
          id: `req_${index}_history`,
          type: 'information',
          titleAr: 'بناء سجل الشراء',
          descriptionAr: 'قم ببعض عمليات الشراء لبناء سجلك',
          isCompleted: false,
          actionUrl: '/services',
        });
      }
    });
  }

  // Default retry after 30 days if waiting period required
  const hasWaitingPeriod = requiredItems.some(item => item.type === 'waiting_period');
  
  return {
    canRetry: true,
    retryAfterDays: hasWaitingPeriod ? 30 : undefined,
    retryAfterDate: hasWaitingPeriod 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    requiredItems,
    message: 'You can retry after completing the required items.',
    messageAr: 'يمكنك إعادة المحاولة بعد استكمال المتطلبات.',
  };
}

/**
 * Generate integrity checksum
 */
function generateChecksum(data: Record<string, unknown>): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// =============================================
// VALIDATION HELPERS
// =============================================

/**
 * Check if user can proceed to loan application
 */
export function canProceedToApplication(gate: EligibilityGateResult): boolean {
  return gate.status === 'APPROVED' || 
         gate.status === 'APPROVED_WITH_LIMITS' ||
         gate.status === 'MANUAL_REVIEW';
}

/**
 * Check if amount is within limits
 */
export function isAmountWithinLimits(gate: EligibilityGateResult, amount: number): boolean {
  if (!gate.limits) return false;
  return amount >= gate.limits.minAmount && amount <= gate.limits.maxAmount;
}

/**
 * Check if tenor is within limits
 */
export function isTenorWithinLimits(gate: EligibilityGateResult, tenorMonths: number): boolean {
  if (!gate.limits) return false;
  return tenorMonths >= gate.limits.minTenorMonths && tenorMonths <= gate.limits.maxTenorMonths;
}

/**
 * Check if product type is available
 */
export function isProductAvailable(
  gate: EligibilityGateResult, 
  product: 'personal' | 'business' | 'service'
): boolean {
  if (!gate.limits) return false;
  return gate.limits.availableProducts.includes(product);
}

/**
 * Get restriction message for limits
 */
export function getLimitsMessage(gate: EligibilityGateResult): string {
  if (!gate.limits) return '';
  
  if (gate.status === 'APPROVED') {
    return '';
  }

  const { maxAmount, maxTenorMonths, availableProducts } = gate.limits;
  const messages: string[] = [];

  messages.push(`الحد الأقصى للتمويل: ${maxAmount.toLocaleString('ar-SA')} ر.س`);
  messages.push(`أقصى مدة: ${maxTenorMonths} شهر`);
  
  if (!availableProducts.includes('business')) {
    messages.push('تمويل الأعمال غير متاح حالياً');
  }

  return messages.join(' • ');
}
