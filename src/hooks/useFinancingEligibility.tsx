// ============================================
// Financing Eligibility Hook - ASH HOLDING
// Wrapper for backward compatibility
// ============================================

import { useEligibilityMachine } from "./useEligibilityMachine";

export interface EligibilityResult {
  eligible: boolean;
  score: number;
  reasons: string[];
  recommendations: string[];
  verifiedAt: string;
  expiresAt: string;
}

export function useFinancingEligibility() {
  const {
    decision,
    canApply,
    getTimeRemaining,
    reset,
  } = useEligibilityMachine();

  // Convert decision to legacy format
  const eligibilityResult: EligibilityResult | null = decision
    ? {
        eligible: decision.eligible,
        score: decision.score,
        reasons: decision.reasons,
        recommendations: decision.recommendations,
        verifiedAt: decision.verifiedAt,
        expiresAt: decision.expiresAt,
      }
    : null;

  return {
    eligibilityResult,
    isEligible: canApply(),
    hasChecked: decision !== null,
    timeRemaining: getTimeRemaining(),
    saveEligibility: () => {}, // Handled internally now
    clearEligibility: reset,
  };
}
