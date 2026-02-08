// ============================================
// Advanced Decision Engine - ASH HOLDING
// Risk & Eligibility with Hard/Soft Gates
// ============================================

import { EligibilityContext } from './types';
import { EmploymentVerificationState } from './employmentVerification';
import { 
  EmploymentStatus, 
  getEmploymentConfig, 
  getMaxFinancingAmount,
  EMPLOYMENT_CONFIGS 
} from './employmentTypes';

// ============================================
// Decision Types
// ============================================

export type DecisionOutcome = 
  | 'APPROVED'
  | 'APPROVED_WITH_LIMITS'
  | 'MANUAL_REVIEW'
  | 'SOFT_DECLINE'
  | 'HARD_DECLINE';

export interface FinancingLimit {
  maxAmount: number;
  maxTenure: number; // months
  minDownPayment: number; // percentage
  interestRate: number; // percentage
  reason: string;
  reasonAr: string;
}

export interface DecisionGate {
  id: string;
  name: string;
  nameAr: string;
  type: 'hard' | 'soft';
  category: 'identity' | 'employment' | 'income' | 'history' | 'documents' | 'risk';
  check: (context: FullVerificationContext) => GateResult;
  weight: number;
  order: number; // execution order
}

export interface GateResult {
  passed: boolean;
  score: number;
  maxScore: number;
  reason?: string;
  reasonAr?: string;
  data?: Record<string, unknown>;
}

export interface FullVerificationContext {
  eligibility: EligibilityContext;
  employment: EmploymentVerificationState;
  additionalData?: {
    simahScore?: number;
    monthlyIncome?: number;
    monthlyObligations?: number;
    employerVerified?: boolean;
    bankStatementVerified?: boolean;
  };
}

export interface DecisionOutput {
  outcome: DecisionOutcome;
  score: number;
  maxScore: number;
  tier: 'premium' | 'standard' | 'limited' | 'none';
  limits: FinancingLimit | null;
  reasons: DecisionReason[];
  recommendations: string[];
  gateResults: GateResultSummary[];
  requiresManualReview: boolean;
  manualReviewReasons: string[];
  decidedAt: string;
  validUntil: string;
}

export interface DecisionReason {
  type: 'positive' | 'negative' | 'warning' | 'info';
  category: DecisionGate['category'];
  message: string;
  messageAr: string;
  impact: 'high' | 'medium' | 'low';
}

export interface GateResultSummary {
  gateId: string;
  gateName: string;
  gateNameAr: string;
  type: 'hard' | 'soft';
  passed: boolean;
  score: number;
  maxScore: number;
}

// ============================================
// Gate Configuration - Easily Modifiable
// ============================================

const HARD_GATES: DecisionGate[] = [
  // Hard Gate 1: Age Requirement
  {
    id: 'age_requirement',
    name: 'Age Requirement',
    nameAr: 'شرط العمر',
    type: 'hard',
    category: 'identity',
    weight: 1,
    order: 1,
    check: (ctx) => {
      const age = ctx.eligibility.identityResult?.age || 0;
      const passed = age >= 21 && age <= 60;
      return {
        passed,
        score: passed ? 10 : 0,
        maxScore: 10,
        reason: passed ? 'Age within acceptable range' : 'Age outside acceptable range (21-60)',
        reasonAr: passed ? 'العمر ضمن النطاق المقبول' : 'العمر خارج النطاق المسموح (21-60 سنة)',
      };
    },
  },
  
  // Hard Gate 2: Identity Verification
  {
    id: 'identity_verified',
    name: 'Identity Verification',
    nameAr: 'التحقق من الهوية',
    type: 'hard',
    category: 'identity',
    weight: 1,
    order: 2,
    check: (ctx) => {
      const verified = ctx.eligibility.identityResult?.verified === true;
      const idValid = ctx.eligibility.identityResult?.idExpiryValid === true;
      const passed = verified && idValid;
      return {
        passed,
        score: passed ? 15 : 0,
        maxScore: 15,
        reason: passed ? 'Identity verified successfully' : 'Identity verification failed or ID expired',
        reasonAr: passed ? 'تم التحقق من الهوية بنجاح' : 'فشل التحقق من الهوية أو الهوية منتهية',
      };
    },
  },
  
  // Hard Gate 3: No Previous Defaults
  {
    id: 'no_defaults',
    name: 'No Payment Defaults',
    nameAr: 'لا تعثرات سابقة',
    type: 'hard',
    category: 'history',
    weight: 1,
    order: 3,
    check: (ctx) => {
      const hasDefaults = ctx.eligibility.historyResult?.hasDefaults === true;
      const passed = !hasDefaults;
      return {
        passed,
        score: passed ? 20 : 0,
        maxScore: 20,
        reason: passed ? 'No payment defaults found' : 'Previous payment defaults detected',
        reasonAr: passed ? 'لا توجد تعثرات في السداد' : 'تم اكتشاف تعثرات سابقة في السداد',
      };
    },
  },
  
  // Hard Gate 4: Employment Status Valid
  {
    id: 'employment_valid',
    name: 'Valid Employment Status',
    nameAr: 'حالة وظيفية صالحة',
    type: 'hard',
    category: 'employment',
    weight: 1,
    order: 4,
    check: (ctx) => {
      const status = ctx.employment.employmentStatus;
      const config = status ? getEmploymentConfig(status) : null;
      
      // Check if employment status is eligible (isEligible is on config, not restrictions)
      const isEligible = config?.isEligible === true;
      const passed = isEligible && status !== 'other';
      
      return {
        passed,
        score: passed ? 15 : 0,
        maxScore: 15,
        reason: passed ? 'Employment status eligible' : 'Employment status not eligible for financing',
        reasonAr: passed ? 'الحالة الوظيفية مؤهلة' : 'الحالة الوظيفية غير مؤهلة للتمويل',
        data: { employmentStatus: status },
      };
    },
  },
  
  // Hard Gate 5: Minimum Income (for employees)
  {
    id: 'minimum_income',
    name: 'Minimum Income Requirement',
    nameAr: 'الحد الأدنى للدخل',
    type: 'hard',
    category: 'income',
    weight: 1,
    order: 5,
    check: (ctx) => {
      const status = ctx.employment.employmentStatus;
      const config = status ? getEmploymentConfig(status) : null;
      const monthlyIncome = ctx.additionalData?.monthlyIncome || 0;
      const minIncome = config?.incomeRequirement.minMonthlyIncome || 0;
      
      // Skip for business owners (they have different criteria)
      if (status === 'business_owner') {
        return {
          passed: true,
          score: 15,
          maxScore: 15,
          reason: 'Business owner - income verified separately',
          reasonAr: 'صاحب عمل - يتم التحقق من الدخل بشكل منفصل',
        };
      }
      
      const passed = monthlyIncome >= minIncome;
      return {
        passed,
        score: passed ? 15 : 0,
        maxScore: 15,
        reason: passed ? 'Income meets minimum requirement' : `Income below minimum (${minIncome} SAR)`,
        reasonAr: passed ? 'الدخل يفي بالحد الأدنى' : `الدخل أقل من الحد الأدنى (${minIncome} ر.س)`,
        data: { monthlyIncome, minIncome },
      };
    },
  },
  
  // Hard Gate 6: Required Documents Submitted
  {
    id: 'required_documents',
    name: 'Required Documents',
    nameAr: 'المستندات المطلوبة',
    type: 'hard',
    category: 'documents',
    weight: 1,
    order: 6,
    check: (ctx) => {
      const status = ctx.employment.employmentStatus;
      const config = status ? getEmploymentConfig(status) : null;
      const uploadedDocs = ctx.employment.uploadedDocuments || [];
      
      if (!config) {
        return {
          passed: false,
          score: 0,
          maxScore: 15,
          reason: 'Employment status not selected',
          reasonAr: 'لم يتم تحديد الحالة الوظيفية',
        };
      }
      
      const requiredDocs = config.requiredDocuments.filter(d => d.isRequired);
      const uploadedTypes = uploadedDocs.map(d => d.type);
      const missingDocs = requiredDocs.filter(d => !uploadedTypes.includes(d.type));
      
      const passed = missingDocs.length === 0;
      return {
        passed,
        score: passed ? 15 : 0,
        maxScore: 15,
        reason: passed ? 'All required documents submitted' : `Missing ${missingDocs.length} required documents`,
        reasonAr: passed ? 'تم تقديم جميع المستندات المطلوبة' : `ينقص ${missingDocs.length} مستندات مطلوبة`,
        data: { missingDocs: missingDocs.map(d => d.type) },
      };
    },
  },
];

const SOFT_GATES: DecisionGate[] = [
  // Soft Gate 1: Phone Verification
  {
    id: 'phone_verified',
    name: 'Phone Verification',
    nameAr: 'التحقق من الجوال',
    type: 'soft',
    category: 'identity',
    weight: 0.5,
    order: 10,
    check: (ctx) => {
      const verified = ctx.eligibility.phoneResult?.verified === true;
      return {
        passed: verified,
        score: verified ? 10 : 5, // Partial score even if not verified
        maxScore: 10,
        reason: verified ? 'Phone number verified' : 'Phone number not verified',
        reasonAr: verified ? 'تم التحقق من رقم الجوال' : 'لم يتم التحقق من رقم الجوال',
      };
    },
  },
  
  // Soft Gate 2: Email Verification
  {
    id: 'email_verified',
    name: 'Email Verification',
    nameAr: 'التحقق من البريد',
    type: 'soft',
    category: 'identity',
    weight: 0.3,
    order: 11,
    check: (ctx) => {
      const verified = ctx.eligibility.emailResult?.verified === true;
      return {
        passed: verified,
        score: verified ? 5 : 2,
        maxScore: 5,
        reason: verified ? 'Email verified' : 'Email not verified',
        reasonAr: verified ? 'تم التحقق من البريد' : 'لم يتم التحقق من البريد',
      };
    },
  },
  
  // Soft Gate 3: Account Age
  {
    id: 'account_age',
    name: 'Account Age',
    nameAr: 'عمر الحساب',
    type: 'soft',
    category: 'history',
    weight: 0.5,
    order: 12,
    check: (ctx) => {
      const accountAge = ctx.eligibility.historyResult?.accountAge || 0;
      let score = 0;
      let reason = '';
      let reasonAr = '';
      
      if (accountAge >= 365) {
        score = 10;
        reason = 'Account over 1 year old';
        reasonAr = 'الحساب أكثر من سنة';
      } else if (accountAge >= 180) {
        score = 8;
        reason = 'Account over 6 months old';
        reasonAr = 'الحساب أكثر من 6 أشهر';
      } else if (accountAge >= 90) {
        score = 5;
        reason = 'Account over 3 months old';
        reasonAr = 'الحساب أكثر من 3 أشهر';
      } else if (accountAge >= 30) {
        score = 3;
        reason = 'Account over 1 month old';
        reasonAr = 'الحساب أكثر من شهر';
      } else {
        score = 0;
        reason = 'Account less than 1 month old';
        reasonAr = 'الحساب أقل من شهر';
      }
      
      return {
        passed: accountAge >= 30,
        score,
        maxScore: 10,
        reason,
        reasonAr,
        data: { accountAge },
      };
    },
  },
  
  // Soft Gate 4: Order History
  {
    id: 'order_history',
    name: 'Order History',
    nameAr: 'سجل الطلبات',
    type: 'soft',
    category: 'history',
    weight: 0.7,
    order: 13,
    check: (ctx) => {
      const completedOrders = ctx.eligibility.historyResult?.completedOrders || 0;
      const totalSpending = ctx.eligibility.historyResult?.totalSpending || 0;
      
      let score = 0;
      if (completedOrders >= 20 && totalSpending >= 10000) score = 15;
      else if (completedOrders >= 10 && totalSpending >= 5000) score = 12;
      else if (completedOrders >= 5 && totalSpending >= 2000) score = 8;
      else if (completedOrders >= 1) score = 4;
      
      return {
        passed: completedOrders >= 1,
        score,
        maxScore: 15,
        reason: `${completedOrders} completed orders, ${totalSpending} SAR total spending`,
        reasonAr: `${completedOrders} طلب مكتمل، ${totalSpending} ر.س إجمالي الإنفاق`,
        data: { completedOrders, totalSpending },
      };
    },
  },
  
  // Soft Gate 5: Employer Verification (for employees)
  {
    id: 'employer_verified',
    name: 'Employer Verification',
    nameAr: 'التحقق من جهة العمل',
    type: 'soft',
    category: 'employment',
    weight: 0.6,
    order: 14,
    check: (ctx) => {
      const status = ctx.employment.employmentStatus;
      
      // Only applicable for employees
      if (status !== 'employed') {
        return {
          passed: true,
          score: 10,
          maxScore: 10,
          reason: 'Not applicable for this employment type',
          reasonAr: 'لا ينطبق على هذا النوع من التوظيف',
        };
      }
      
      const verified = ctx.additionalData?.employerVerified === true;
      return {
        passed: verified,
        score: verified ? 10 : 3,
        maxScore: 10,
        reason: verified ? 'Employer verified' : 'Employer not verified',
        reasonAr: verified ? 'تم التحقق من جهة العمل' : 'لم يتم التحقق من جهة العمل',
      };
    },
  },
  
  // Soft Gate 6: Bank Statement Verification
  {
    id: 'bank_statement',
    name: 'Bank Statement Verification',
    nameAr: 'التحقق من كشف الحساب',
    type: 'soft',
    category: 'income',
    weight: 0.6,
    order: 15,
    check: (ctx) => {
      const verified = ctx.additionalData?.bankStatementVerified === true;
      return {
        passed: verified,
        score: verified ? 10 : 0,
        maxScore: 10,
        reason: verified ? 'Bank statement verified' : 'Bank statement not provided',
        reasonAr: verified ? 'تم التحقق من كشف الحساب البنكي' : 'لم يتم تقديم كشف الحساب البنكي',
      };
    },
  },
  
  // Soft Gate 7: Debt-to-Income Ratio
  {
    id: 'dti_ratio',
    name: 'Debt-to-Income Ratio',
    nameAr: 'نسبة الدين للدخل',
    type: 'soft',
    category: 'income',
    weight: 0.8,
    order: 16,
    check: (ctx) => {
      const income = ctx.additionalData?.monthlyIncome || 0;
      const obligations = ctx.additionalData?.monthlyObligations || 0;
      
      if (income === 0) {
        return {
          passed: false,
          score: 0,
          maxScore: 15,
          reason: 'Income not provided',
          reasonAr: 'لم يتم تقديم معلومات الدخل',
        };
      }
      
      const dtiRatio = (obligations / income) * 100;
      let score = 0;
      let passed = false;
      
      if (dtiRatio <= 30) {
        score = 15;
        passed = true;
      } else if (dtiRatio <= 45) {
        score = 10;
        passed = true;
      } else if (dtiRatio <= 60) {
        score = 5;
        passed = true;
      } else {
        score = 0;
        passed = false;
      }
      
      return {
        passed,
        score,
        maxScore: 15,
        reason: `DTI Ratio: ${dtiRatio.toFixed(1)}%`,
        reasonAr: `نسبة الدين للدخل: ${dtiRatio.toFixed(1)}%`,
        data: { dtiRatio, income, obligations },
      };
    },
  },
  
  // Soft Gate 8: Optional Documents Bonus
  {
    id: 'optional_documents',
    name: 'Optional Documents',
    nameAr: 'مستندات إضافية',
    type: 'soft',
    category: 'documents',
    weight: 0.3,
    order: 17,
    check: (ctx) => {
      const status = ctx.employment.employmentStatus;
      const config = status ? getEmploymentConfig(status) : null;
      const uploadedDocs = ctx.employment.uploadedDocuments || [];
      
      if (!config) {
        return {
          passed: true,
          score: 0,
          maxScore: 5,
          reason: 'No optional documents applicable',
          reasonAr: 'لا توجد مستندات اختيارية',
        };
      }
      
      const optionalDocs = config.requiredDocuments.filter(d => !d.isRequired);
      const uploadedOptional = uploadedDocs.filter(d => 
        optionalDocs.some(od => od.type === d.type)
      );
      
      const score = Math.min(uploadedOptional.length * 2, 5);
      return {
        passed: true,
        score,
        maxScore: 5,
        reason: `${uploadedOptional.length} optional documents provided`,
        reasonAr: `تم تقديم ${uploadedOptional.length} مستندات إضافية`,
      };
    },
  },
];

// ============================================
// Decision Engine
// ============================================

export class AdvancedDecisionEngine {
  private hardGates: DecisionGate[];
  private softGates: DecisionGate[];
  
  constructor() {
    // Sort gates by order
    this.hardGates = [...HARD_GATES].sort((a, b) => a.order - b.order);
    this.softGates = [...SOFT_GATES].sort((a, b) => a.order - b.order);
  }
  
  /**
   * Run the full decision process
   */
  evaluate(context: FullVerificationContext): DecisionOutput {
    const gateResults: GateResultSummary[] = [];
    const reasons: DecisionReason[] = [];
    const recommendations: string[] = [];
    const manualReviewReasons: string[] = [];
    
    let totalScore = 0;
    let maxScore = 0;
    let hardGateFailed = false;
    let failedHardGate: DecisionGate | null = null;
    
    // Step 1: Evaluate Hard Gates (must all pass)
    for (const gate of this.hardGates) {
      const result = gate.check(context);
      maxScore += result.maxScore;
      
      gateResults.push({
        gateId: gate.id,
        gateName: gate.name,
        gateNameAr: gate.nameAr,
        type: 'hard',
        passed: result.passed,
        score: result.score,
        maxScore: result.maxScore,
      });
      
      if (!result.passed) {
        hardGateFailed = true;
        failedHardGate = gate;
        
        reasons.push({
          type: 'negative',
          category: gate.category,
          message: result.reason || 'Hard gate failed',
          messageAr: result.reasonAr || 'فشل الشرط الأساسي',
          impact: 'high',
        });
        
        // For HARD gates, we stop at first failure
        break;
      } else {
        totalScore += result.score;
        
        reasons.push({
          type: 'positive',
          category: gate.category,
          message: result.reason || 'Gate passed',
          messageAr: result.reasonAr || 'تم اجتياز الشرط',
          impact: 'high',
        });
      }
    }
    
    // If hard gate failed, return appropriate decision
    if (hardGateFailed && failedHardGate) {
      return this.buildDecision(
        this.determineHardDeclineOutcome(failedHardGate),
        totalScore,
        maxScore,
        reasons,
        recommendations,
        gateResults,
        manualReviewReasons
      );
    }
    
    // Step 2: Evaluate Soft Gates (accumulate score)
    let softGatesPassed = 0;
    let softGatesFailed = 0;
    
    for (const gate of this.softGates) {
      const result = gate.check(context);
      maxScore += result.maxScore;
      totalScore += result.score;
      
      gateResults.push({
        gateId: gate.id,
        gateName: gate.name,
        gateNameAr: gate.nameAr,
        type: 'soft',
        passed: result.passed,
        score: result.score,
        maxScore: result.maxScore,
      });
      
      if (result.passed) {
        softGatesPassed++;
        if (result.score === result.maxScore) {
          reasons.push({
            type: 'positive',
            category: gate.category,
            message: result.reason || 'Gate passed',
            messageAr: result.reasonAr || 'تم اجتياز الشرط',
            impact: 'low',
          });
        }
      } else {
        softGatesFailed++;
        reasons.push({
          type: 'warning',
          category: gate.category,
          message: result.reason || 'Soft gate not passed',
          messageAr: result.reasonAr || 'لم يتم اجتياز الشرط',
          impact: 'medium',
        });
        
        // Add recommendation for improvement
        this.addRecommendation(gate, recommendations);
      }
    }
    
    // Step 3: Determine outcome based on score
    const scorePercentage = (totalScore / maxScore) * 100;
    const outcome = this.determineOutcome(scorePercentage, softGatesFailed, context);
    
    // Step 4: Check for manual review triggers
    this.checkManualReviewTriggers(context, manualReviewReasons);
    
    return this.buildDecision(
      outcome,
      totalScore,
      maxScore,
      reasons,
      recommendations,
      gateResults,
      manualReviewReasons
    );
  }
  
  /**
   * Determine outcome for hard gate failures
   */
  private determineHardDeclineOutcome(gate: DecisionGate): DecisionOutcome {
    // Some hard failures warrant soft decline (recoverable)
    const softDeclineGates = ['minimum_income', 'required_documents'];
    
    if (softDeclineGates.includes(gate.id)) {
      return 'SOFT_DECLINE';
    }
    
    // No defaults is a hard decline
    if (gate.id === 'no_defaults') {
      return 'HARD_DECLINE';
    }
    
    // Identity and age are usually hard declines
    return 'HARD_DECLINE';
  }
  
  /**
   * Determine final outcome based on scores
   */
  private determineOutcome(
    scorePercentage: number,
    softGatesFailed: number,
    context: FullVerificationContext
  ): DecisionOutcome {
    // High score = Approved
    if (scorePercentage >= 85 && softGatesFailed <= 1) {
      return 'APPROVED';
    }
    
    // Good score with some limitations
    if (scorePercentage >= 70) {
      return 'APPROVED_WITH_LIMITS';
    }
    
    // Borderline - needs manual review
    if (scorePercentage >= 55) {
      return 'MANUAL_REVIEW';
    }
    
    // Low score but recoverable
    if (scorePercentage >= 40) {
      return 'SOFT_DECLINE';
    }
    
    // Very low score
    return 'HARD_DECLINE';
  }
  
  /**
   * Check for manual review triggers
   */
  private checkManualReviewTriggers(
    context: FullVerificationContext,
    reasons: string[]
  ): void {
    // High income but new account
    const income = context.additionalData?.monthlyIncome || 0;
    const accountAge = context.eligibility.historyResult?.accountAge || 0;
    
    if (income >= 30000 && accountAge < 90) {
      reasons.push('دخل مرتفع مع حساب جديد');
    }
    
    // Business owner requesting high amount
    if (context.employment.employmentStatus === 'business_owner') {
      const maxAmount = getMaxFinancingAmount('business_owner');
      if (maxAmount >= 100000) {
        reasons.push('صاحب عمل - يتطلب مراجعة إضافية');
      }
    }
    
    // Student with income
    if (context.employment.employmentStatus === 'student' && income > 0) {
      reasons.push('طالب بدخل - يتطلب التحقق من مصدر الدخل');
    }
  }
  
  /**
   * Add improvement recommendation
   */
  private addRecommendation(gate: DecisionGate, recommendations: string[]): void {
    const recMap: Record<string, string> = {
      'phone_verified': 'قم بتأكيد رقم جوالك لتحسين تقييمك',
      'email_verified': 'قم بتأكيد بريدك الإلكتروني',
      'account_age': 'انتظر حتى يصبح حسابك أقدم لتحسين فرص القبول',
      'order_history': 'أكمل المزيد من الطلبات لبناء سجل موثوق',
      'employer_verified': 'تواصل مع جهة العمل للتحقق من بياناتك',
      'bank_statement': 'قدم كشف حساب بنكي لآخر 3 أشهر',
      'dti_ratio': 'قلل التزاماتك الشهرية لتحسين نسبة الدين للدخل',
      'optional_documents': 'قدم مستندات إضافية لتعزيز طلبك',
    };
    
    const rec = recMap[gate.id];
    if (rec && !recommendations.includes(rec)) {
      recommendations.push(rec);
    }
  }
  
  /**
   * Build the final decision output
   */
  private buildDecision(
    outcome: DecisionOutcome,
    score: number,
    maxScore: number,
    reasons: DecisionReason[],
    recommendations: string[],
    gateResults: GateResultSummary[],
    manualReviewReasons: string[]
  ): DecisionOutput {
    const now = new Date();
    const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return {
      outcome,
      score,
      maxScore,
      tier: this.determineTier(outcome, score, maxScore),
      limits: this.calculateLimits(outcome, score, maxScore),
      reasons,
      recommendations: recommendations.slice(0, 5),
      gateResults,
      requiresManualReview: outcome === 'MANUAL_REVIEW' || manualReviewReasons.length > 0,
      manualReviewReasons,
      decidedAt: now.toISOString(),
      validUntil: validUntil.toISOString(),
    };
  }
  
  /**
   * Determine tier based on outcome and score
   */
  private determineTier(
    outcome: DecisionOutcome,
    score: number,
    maxScore: number
  ): DecisionOutput['tier'] {
    if (outcome === 'HARD_DECLINE' || outcome === 'SOFT_DECLINE') {
      return 'none';
    }
    
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 85) return 'premium';
    if (percentage >= 70) return 'standard';
    return 'limited';
  }
  
  /**
   * Calculate financing limits based on decision
   */
  private calculateLimits(
    outcome: DecisionOutcome,
    score: number,
    maxScore: number
  ): FinancingLimit | null {
    if (outcome === 'HARD_DECLINE' || outcome === 'SOFT_DECLINE') {
      return null;
    }
    
    const percentage = (score / maxScore) * 100;
    
    if (outcome === 'APPROVED' && percentage >= 85) {
      return {
        maxAmount: 100000,
        maxTenure: 36,
        minDownPayment: 0,
        interestRate: 0,
        reason: 'Full approval with premium terms',
        reasonAr: 'موافقة كاملة بشروط مميزة',
      };
    }
    
    if (outcome === 'APPROVED' || percentage >= 70) {
      return {
        maxAmount: 50000,
        maxTenure: 24,
        minDownPayment: 10,
        interestRate: 0,
        reason: 'Approved with standard terms',
        reasonAr: 'موافقة بشروط قياسية',
      };
    }
    
    if (outcome === 'APPROVED_WITH_LIMITS' || outcome === 'MANUAL_REVIEW') {
      return {
        maxAmount: 25000,
        maxTenure: 12,
        minDownPayment: 20,
        interestRate: 0,
        reason: 'Approved with limited terms',
        reasonAr: 'موافقة بشروط محدودة',
      };
    }
    
    return null;
  }
  
  /**
   * Get all gates for display/configuration
   */
  getAllGates(): DecisionGate[] {
    return [...this.hardGates, ...this.softGates];
  }
  
  /**
   * Get outcome display info
   */
  static getOutcomeInfo(outcome: DecisionOutcome): {
    label: string;
    labelAr: string;
    color: string;
    icon: string;
    description: string;
    descriptionAr: string;
  } {
    const info: Record<DecisionOutcome, ReturnType<typeof AdvancedDecisionEngine.getOutcomeInfo>> = {
      'APPROVED': {
        label: 'Approved',
        labelAr: 'موافق عليه',
        color: 'text-green-600 bg-green-50',
        icon: 'CheckCircle',
        description: 'Your application has been approved',
        descriptionAr: 'تمت الموافقة على طلبك',
      },
      'APPROVED_WITH_LIMITS': {
        label: 'Approved with Limits',
        labelAr: 'موافق عليه بقيود',
        color: 'text-emerald-600 bg-emerald-50',
        icon: 'CheckCircle2',
        description: 'Approved with some limitations',
        descriptionAr: 'تمت الموافقة مع بعض القيود',
      },
      'MANUAL_REVIEW': {
        label: 'Manual Review',
        labelAr: 'قيد المراجعة',
        color: 'text-amber-600 bg-amber-50',
        icon: 'Clock',
        description: 'Your application requires additional review',
        descriptionAr: 'طلبك يتطلب مراجعة إضافية',
      },
      'SOFT_DECLINE': {
        label: 'Not Eligible',
        labelAr: 'غير مؤهل حالياً',
        color: 'text-orange-600 bg-orange-50',
        icon: 'AlertCircle',
        description: 'Not eligible now, but can improve',
        descriptionAr: 'غير مؤهل حالياً، لكن يمكن التحسين',
      },
      'HARD_DECLINE': {
        label: 'Declined',
        labelAr: 'مرفوض',
        color: 'text-red-600 bg-red-50',
        icon: 'XCircle',
        description: 'Application declined',
        descriptionAr: 'تم رفض الطلب',
      },
    };
    
    return info[outcome];
  }
}

// Export singleton instance
export const decisionEngine = new AdvancedDecisionEngine();
