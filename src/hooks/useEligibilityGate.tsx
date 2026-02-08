// ============================================
// Eligibility Gate Hook - ASH HOLDING FinTech
// Bridge between Eligibility Engine & Loan Application
// ============================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useEligibilityMachine } from './useEligibilityMachine';
import { useAuth } from './useAuth';
import {
  EligibilityGateResult,
  EligibilityDecisionStatus,
  EligibilityLimits,
  RequiredItem,
  buildEligibilityGateResult,
  canProceedToApplication,
  isAmountWithinLimits,
  isTenorWithinLimits,
  isProductAvailable,
  getLimitsMessage,
  TIER_LIMITS,
} from '@/lib/financing/eligibilityContract';

const GATE_STORAGE_KEY = 'maxio_eligibility_gate';

interface UseEligibilityGateReturn {
  // State
  gateResult: EligibilityGateResult | null;
  isLoading: boolean;
  isExpired: boolean;
  
  // Status checks
  status: EligibilityDecisionStatus | null;
  canApply: boolean;
  isApproved: boolean;
  isApprovedWithLimits: boolean;
  isManualReview: boolean;
  isSoftDecline: boolean;
  isHardDecline: boolean;
  
  // Limits
  limits: EligibilityLimits | null;
  maxAmount: number;
  maxTenor: number;
  
  // Validation helpers
  validateAmount: (amount: number) => { valid: boolean; message?: string };
  validateTenor: (months: number) => { valid: boolean; message?: string };
  validateProduct: (product: 'personal' | 'business' | 'service') => { valid: boolean; message?: string };
  
  // UI helpers
  getLimitationsMessage: () => string;
  getDeclineMessage: () => string;
  getRequiredItems: () => RequiredItem[];
  canRetry: () => boolean;
  getRetryDate: () => Date | null;
  
  // Actions
  refreshGate: () => void;
  clearGate: () => void;
}

export function useEligibilityGate(): UseEligibilityGateReturn {
  const { user } = useAuth();
  const eligibilityMachine = useEligibilityMachine();
  const [gateResult, setGateResult] = useState<EligibilityGateResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Build/rebuild gate result when eligibility decision changes
  useEffect(() => {
    setIsLoading(true);
    
    if (!user?.id) {
      setGateResult(null);
      setIsLoading(false);
      return;
    }

    // Check for cached gate result
    const cached = localStorage.getItem(`${GATE_STORAGE_KEY}_${user.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as EligibilityGateResult;
        const now = new Date();
        const expiresAt = new Date(parsed.expiresAt);
        
        if (now < expiresAt) {
          setGateResult(parsed);
          setIsLoading(false);
          return;
        }
      } catch {
        // Invalid cache, continue to rebuild
      }
    }

    // Build from eligibility machine
    if (eligibilityMachine.decision) {
      const result = buildEligibilityGateResult(
        eligibilityMachine.decision,
        eligibilityMachine.context.riskResult || null,
        {
          isBlacklisted: false, // Would come from fraud detection system
          fraudDetected: false,
          requiresManualReview: false,
        }
      );
      
      setGateResult(result);
      
      // Cache the result
      localStorage.setItem(`${GATE_STORAGE_KEY}_${user.id}`, JSON.stringify(result));
    }
    
    setIsLoading(false);
  }, [user?.id, eligibilityMachine.decision, eligibilityMachine.context.riskResult]);

  // Check if gate is expired
  const isExpired = useMemo(() => {
    if (!gateResult) return true;
    return new Date() >= new Date(gateResult.expiresAt);
  }, [gateResult]);

  // Status derived values
  const status = gateResult?.status || null;
  
  const canApply = useMemo(() => {
    if (!gateResult || isExpired) return false;
    return canProceedToApplication(gateResult);
  }, [gateResult, isExpired]);

  const isApproved = status === 'APPROVED';
  const isApprovedWithLimits = status === 'APPROVED_WITH_LIMITS';
  const isManualReview = status === 'MANUAL_REVIEW';
  const isSoftDecline = status === 'SOFT_DECLINE';
  const isHardDecline = status === 'HARD_DECLINE';

  // Limits
  const limits = gateResult?.limits || null;
  const maxAmount = limits?.maxAmount || 0;
  const maxTenor = limits?.maxTenorMonths || 0;

  // Validation helpers
  const validateAmount = useCallback((amount: number): { valid: boolean; message?: string } => {
    if (!gateResult) {
      return { valid: false, message: 'لم يتم التحقق من الأهلية' };
    }

    if (isHardDecline) {
      return { valid: false, message: 'غير مؤهل للتمويل' };
    }

    if (!isAmountWithinLimits(gateResult, amount)) {
      if (amount < (limits?.minAmount || 0)) {
        return { 
          valid: false, 
          message: `الحد الأدنى للتمويل ${(limits?.minAmount || 0).toLocaleString('ar-SA')} ر.س` 
        };
      }
      return { 
        valid: false, 
        message: `الحد الأقصى المتاح لك ${(limits?.maxAmount || 0).toLocaleString('ar-SA')} ر.س` 
      };
    }

    return { valid: true };
  }, [gateResult, limits, isHardDecline]);

  const validateTenor = useCallback((months: number): { valid: boolean; message?: string } => {
    if (!gateResult) {
      return { valid: false, message: 'لم يتم التحقق من الأهلية' };
    }

    if (!isTenorWithinLimits(gateResult, months)) {
      if (months < (limits?.minTenorMonths || 0)) {
        return { 
          valid: false, 
          message: `الحد الأدنى للمدة ${limits?.minTenorMonths || 1} شهر` 
        };
      }
      return { 
        valid: false, 
        message: `الحد الأقصى للمدة المتاح لك ${limits?.maxTenorMonths || 0} شهر` 
      };
    }

    return { valid: true };
  }, [gateResult, limits]);

  const validateProduct = useCallback((product: 'personal' | 'business' | 'service'): { valid: boolean; message?: string } => {
    if (!gateResult) {
      return { valid: false, message: 'لم يتم التحقق من الأهلية' };
    }

    if (!isProductAvailable(gateResult, product)) {
      const productNames = {
        personal: 'التمويل الشخصي',
        business: 'تمويل الأعمال',
        service: 'تمويل الخدمات',
      };
      return { 
        valid: false, 
        message: `${productNames[product]} غير متاح في باقتك الحالية` 
      };
    }

    return { valid: true };
  }, [gateResult]);

  // UI helpers
  const getLimitationsMessage = useCallback((): string => {
    if (!gateResult) return '';
    return getLimitsMessage(gateResult);
  }, [gateResult]);

  const getDeclineMessage = useCallback((): string => {
    return gateResult?.declineMessageAr || '';
  }, [gateResult]);

  const getRequiredItems = useCallback((): RequiredItem[] => {
    return gateResult?.retryConfig?.requiredItems || [];
  }, [gateResult]);

  const canRetry = useCallback((): boolean => {
    return gateResult?.retryConfig?.canRetry || false;
  }, [gateResult]);

  const getRetryDate = useCallback((): Date | null => {
    if (!gateResult?.retryConfig?.retryAfterDate) return null;
    return new Date(gateResult.retryConfig.retryAfterDate);
  }, [gateResult]);

  // Actions
  const refreshGate = useCallback(() => {
    if (user?.id) {
      localStorage.removeItem(`${GATE_STORAGE_KEY}_${user.id}`);
    }
    eligibilityMachine.reset();
  }, [user?.id, eligibilityMachine]);

  const clearGate = useCallback(() => {
    if (user?.id) {
      localStorage.removeItem(`${GATE_STORAGE_KEY}_${user.id}`);
    }
    setGateResult(null);
  }, [user?.id]);

  return {
    gateResult,
    isLoading,
    isExpired,
    status,
    canApply,
    isApproved,
    isApprovedWithLimits,
    isManualReview,
    isSoftDecline,
    isHardDecline,
    limits,
    maxAmount,
    maxTenor,
    validateAmount,
    validateTenor,
    validateProduct,
    getLimitationsMessage,
    getDeclineMessage,
    getRequiredItems,
    canRetry,
    getRetryDate,
    refreshGate,
    clearGate,
  };
}
