// ============================================
// Decision Engine - MaxioCore Risk Assessment
// Central rule engine for eligibility decisions
// ============================================

import { 
  EligibilityContext, 
  RiskAssessmentResult, 
  DecisionResult,
  RiskFactor 
} from './types';
import { ELIGIBILITY_CONFIG, ELIGIBILITY_RULES } from './config';

/**
 * Assess Risk Level
 * Evaluates all risk factors and calculates risk score
 */
export function assessRisk(context: EligibilityContext): RiskAssessmentResult {
  const factors: RiskFactor[] = [];
  let riskScore = 100; // Start at 100, deduct for risk factors
  
  // Evaluate identity factors
  if (!context.identityResult?.verified) {
    riskScore -= 30;
    factors.push({
      name: 'Unverified Identity',
      nameAr: 'هوية غير موثقة',
      impact: 'negative',
      weight: 3,
      description: 'لم يتم التحقق من الهوية بنجاح',
    });
  }
  
  // Age factor
  const age = context.identityResult?.age || 0;
  if (age < 25) {
    riskScore -= 10;
    factors.push({
      name: 'Young Age',
      nameAr: 'عمر صغير',
      impact: 'negative',
      weight: 1,
      description: 'العمر أقل من 25 سنة يزيد من المخاطر',
    });
  } else if (age >= 35 && age <= 55) {
    riskScore += 5;
    factors.push({
      name: 'Prime Age',
      nameAr: 'عمر مثالي',
      impact: 'positive',
      weight: 0.5,
      description: 'الفئة العمرية المثالية للتمويل',
    });
  }
  
  // History factors
  const history = context.historyResult;
  if (history) {
    if (history.hasDefaults) {
      riskScore -= 40;
      factors.push({
        name: 'Previous Defaults',
        nameAr: 'تعثرات سابقة',
        impact: 'negative',
        weight: 4,
        description: 'وجود تعثرات في السداد سابقاً',
      });
    }
    
    if (history.completedOrders >= 10) {
      riskScore += 10;
      factors.push({
        name: 'High Order Volume',
        nameAr: 'حجم طلبات عالي',
        impact: 'positive',
        weight: 1,
        description: 'عدد طلبات مكتملة كبير',
      });
    }
    
    if (history.totalSpending >= 5000) {
      riskScore += 10;
      factors.push({
        name: 'High Spending',
        nameAr: 'إنفاق عالي',
        impact: 'positive',
        weight: 1,
        description: 'إجمالي إنفاق مرتفع',
      });
    }
    
    if (history.accountAge < 30) {
      riskScore -= 15;
      factors.push({
        name: 'New Account',
        nameAr: 'حساب جديد',
        impact: 'negative',
        weight: 1.5,
        description: 'الحساب أقل من 30 يوم',
      });
    } else if (history.accountAge >= 180) {
      riskScore += 10;
      factors.push({
        name: 'Established Account',
        nameAr: 'حساب قديم',
        impact: 'positive',
        weight: 1,
        description: 'حساب قديم موثوق',
      });
    }
  }
  
  // Phone verification factor
  if (!context.phoneResult?.verified) {
    riskScore -= 10;
    factors.push({
      name: 'Unverified Phone',
      nameAr: 'جوال غير موثق',
      impact: 'negative',
      weight: 1,
      description: 'رقم الجوال غير موثق',
    });
  }
  
  // Email verification factor
  if (!context.emailResult?.verified) {
    riskScore -= 5;
    factors.push({
      name: 'Unverified Email',
      nameAr: 'بريد غير موثق',
      impact: 'negative',
      weight: 0.5,
      description: 'البريد الإلكتروني غير مؤكد',
    });
  }
  
  // Clamp risk score between 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  // Determine risk level
  let riskLevel: RiskAssessmentResult['riskLevel'];
  if (riskScore >= 80) riskLevel = 'low';
  else if (riskScore >= 60) riskLevel = 'medium';
  else if (riskScore >= 40) riskLevel = 'high';
  else riskLevel = 'critical';
  
  // Calculate max approved amount based on risk
  let maxApprovedAmount = 0;
  if (riskLevel === 'low') maxApprovedAmount = ELIGIBILITY_CONFIG.amountTiers.platinum;
  else if (riskLevel === 'medium') maxApprovedAmount = ELIGIBILITY_CONFIG.amountTiers.gold;
  else if (riskLevel === 'high') maxApprovedAmount = ELIGIBILITY_CONFIG.amountTiers.bronze;
  
  return {
    assessed: true,
    riskLevel,
    riskScore,
    factors,
    maxApprovedAmount,
  };
}

/**
 * Make Final Decision
 * Applies all rules and produces final eligibility decision
 */
export function makeDecision(context: EligibilityContext): DecisionResult {
  const reasons: string[] = [];
  const recommendations: string[] = [];
  
  // Calculate total score from verification steps
  const verificationScore = context.steps.reduce((sum, step) => sum + step.score, 0);
  
  // Apply eligibility rules
  let ruleScore = 0;
  let passedRules = 0;
  
  for (const rule of ELIGIBILITY_RULES) {
    const passed = rule.condition(context);
    if (passed) {
      ruleScore += rule.score * rule.weight;
      passedRules++;
    } else {
      reasons.push(rule.failureReason);
      recommendations.push(rule.recommendation);
    }
  }
  
  // Combine scores (verification 60%, rules 40%)
  const maxVerificationScore = 100;
  const maxRuleScore = ELIGIBILITY_RULES.reduce((sum, r) => sum + r.score * r.weight, 0);
  
  const normalizedVerificationScore = (verificationScore / maxVerificationScore) * 60;
  const normalizedRuleScore = (ruleScore / maxRuleScore) * 40;
  const finalScore = Math.round(normalizedVerificationScore + normalizedRuleScore);
  
  // Determine eligibility and tier
  const eligible = finalScore >= ELIGIBILITY_CONFIG.minScore && 
    !context.historyResult?.hasDefaults &&
    context.identityResult?.verified === true;
  
  let tier: DecisionResult['tier'];
  let maxAmount = 0;
  
  if (!eligible) {
    tier = 'rejected';
    maxAmount = 0;
  } else if (finalScore >= ELIGIBILITY_CONFIG.scoreThresholds.platinum) {
    tier = 'platinum';
    maxAmount = ELIGIBILITY_CONFIG.amountTiers.platinum;
  } else if (finalScore >= ELIGIBILITY_CONFIG.scoreThresholds.gold) {
    tier = 'gold';
    maxAmount = ELIGIBILITY_CONFIG.amountTiers.gold;
  } else if (finalScore >= ELIGIBILITY_CONFIG.scoreThresholds.silver) {
    tier = 'silver';
    maxAmount = ELIGIBILITY_CONFIG.amountTiers.silver;
  } else {
    tier = 'bronze';
    maxAmount = ELIGIBILITY_CONFIG.amountTiers.bronze;
  }
  
  // Add positive reasons if eligible
  if (eligible) {
    if (context.historyResult?.completedOrders && context.historyResult.completedOrders >= 5) {
      reasons.push('سجل طلبات ممتاز');
    }
    if (context.historyResult?.accountAge && context.historyResult.accountAge >= 90) {
      reasons.push('حساب قديم وموثوق');
    }
    if (context.phoneResult?.verified && context.emailResult?.verified) {
      reasons.push('معلومات التواصل موثقة');
    }
  }
  
  // Add recommendations for improvement
  if (tier !== 'platinum' && eligible) {
    if (context.historyResult?.completedOrders && context.historyResult.completedOrders < 10) {
      recommendations.push('أكمل المزيد من الطلبات لرفع حد التمويل');
    }
    if (!context.phoneResult?.verified) {
      recommendations.push('وثق رقم جوالك لتحسين تقييمك');
    }
  }
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ELIGIBILITY_CONFIG.validityHours * 60 * 60 * 1000);
  
  return {
    eligible,
    score: finalScore,
    tier,
    maxAmount,
    reasons: reasons.slice(0, 5), // Limit to 5 reasons
    recommendations: recommendations.slice(0, 3), // Limit to 3 recommendations
    verifiedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Get tier display information
 */
export function getTierInfo(tier: DecisionResult['tier']): {
  name: string;
  nameAr: string;
  color: string;
  icon: string;
} {
  const tiers = {
    platinum: { name: 'Platinum', nameAr: 'بلاتيني', color: 'from-slate-300 to-slate-500', icon: '💎' },
    gold: { name: 'Gold', nameAr: 'ذهبي', color: 'from-yellow-400 to-amber-500', icon: '🥇' },
    silver: { name: 'Silver', nameAr: 'فضي', color: 'from-gray-300 to-gray-400', icon: '🥈' },
    bronze: { name: 'Bronze', nameAr: 'برونزي', color: 'from-orange-400 to-orange-600', icon: '🥉' },
    rejected: { name: 'Rejected', nameAr: 'مرفوض', color: 'from-red-500 to-red-700', icon: '❌' },
  };
  
  return tiers[tier];
}
