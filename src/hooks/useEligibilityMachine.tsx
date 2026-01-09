// ============================================
// Eligibility Machine Hook - MaxioCore
// React hook for managing eligibility state
// ============================================

import * as React from 'react';
const { useState, useCallback, useEffect } = React;
import { useAuth } from './useAuth';
import {
  EligibilityContext,
  EligibilityEvent,
  EligibilityState,
  DecisionResult,
  createInitialContext,
  transition,
  verifyIdentity,
  verifyPhone,
  verifyEmail,
  checkHistory,
  assessRisk,
  makeDecision,
  ELIGIBILITY_CONFIG,
} from '@/lib/eligibility';

const STORAGE_KEY = 'maxio_eligibility_result';

interface UseEligibilityMachineReturn {
  context: EligibilityContext;
  currentState: EligibilityState;
  isProcessing: boolean;
  error: string | null;
  decision: DecisionResult | null;
  
  // Actions
  startVerification: (identityData: {
    nationalId: string;
    nationality: string;
    age: number;
  }) => Promise<void>;
  reset: () => void;
  
  // Helpers
  isStepComplete: (stepId: string) => boolean;
  getProgress: () => number;
  canApply: () => boolean;
  getTimeRemaining: () => number;
}

export function useEligibilityMachine(): UseEligibilityMachineReturn {
  const { user } = useAuth();
  const [context, setContext] = useState<EligibilityContext>(() => 
    createInitialContext(user?.id || '')
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved decision on mount
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as DecisionResult;
          const now = new Date();
          const expiresAt = new Date(parsed.expiresAt);
          
          if (now < expiresAt) {
            // Reconstruct context with saved decision
            const restoredContext = createInitialContext(user.id);
            restoredContext.decision = parsed;
            restoredContext.currentState = parsed.eligible ? 'approved' : 'rejected';
            restoredContext.completedAt = parsed.verifiedAt;
            setContext(restoredContext);
          } else {
            localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
          }
        } catch {
          localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
        }
      }
    }
  }, [user?.id]);

  // Dispatch event to state machine
  const dispatch = useCallback((event: EligibilityEvent) => {
    setContext(prev => transition(prev, event));
  }, []);

  // Main verification flow
  const startVerification = useCallback(async (identityData: {
    nationalId: string;
    nationality: string;
    age: number;
  }) => {
    if (!user?.id) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    // Reset to initial state
    dispatch({ type: 'RESET' });
    await new Promise(r => setTimeout(r, 100));
    
    // Start verification
    dispatch({ type: 'START_VERIFICATION' });
    
    try {
      // Step 1: Identity Verification
      const identityResult = await verifyIdentity(
        user.id,
        identityData.nationalId,
        identityData.nationality,
        identityData.age
      );
      
      if (!identityResult.verified) {
        dispatch({ 
          type: 'IDENTITY_FAILED', 
          payload: { reason: 'فشل التحقق من الهوية - تأكد من صحة البيانات' } 
        });
        setIsProcessing(false);
        return;
      }
      
      dispatch({ type: 'IDENTITY_VERIFIED', payload: identityResult });
      
      // Step 2: Phone Verification
      const phoneResult = await verifyPhone(user.id);
      
      if (!phoneResult.verified) {
        dispatch({ 
          type: 'PHONE_FAILED', 
          payload: { reason: 'رقم الجوال غير موثق - يرجى تأكيد رقم الجوال' } 
        });
        setIsProcessing(false);
        return;
      }
      
      dispatch({ type: 'PHONE_VERIFIED', payload: phoneResult });
      
      // Step 3: Email Verification
      const emailResult = await verifyEmail(user.id);
      
      if (!emailResult.verified) {
        dispatch({ 
          type: 'EMAIL_FAILED', 
          payload: { reason: 'البريد الإلكتروني غير مؤكد' } 
        });
        setIsProcessing(false);
        return;
      }
      
      dispatch({ type: 'EMAIL_VERIFIED', payload: emailResult });
      
      // Step 4: History Check
      const historyResult = await checkHistory(user.id);
      dispatch({ type: 'HISTORY_CHECKED', payload: historyResult });
      
      // Step 5: Risk Assessment
      // Get updated context after all verifications
      const updatedContext: EligibilityContext = {
        ...createInitialContext(user.id),
        currentState: 'risk_assessment',
        identityResult,
        phoneResult,
        emailResult,
        historyResult,
        steps: [
          { id: 'identity', name: 'Identity', nameAr: 'الهوية', status: 'verified', score: identityResult.score, maxScore: 35 },
          { id: 'phone', name: 'Phone', nameAr: 'الجوال', status: 'verified', score: phoneResult.score, maxScore: 15 },
          { id: 'email', name: 'Email', nameAr: 'البريد', status: 'verified', score: emailResult.score, maxScore: 10 },
          { id: 'history', name: 'History', nameAr: 'السجل', status: 'verified', score: historyResult.score, maxScore: 50 },
        ],
        startedAt: new Date().toISOString(),
      };
      
      const riskResult = assessRisk(updatedContext);
      dispatch({ type: 'RISK_ASSESSED', payload: riskResult });
      
      // Step 6: Final Decision
      const finalContext = { ...updatedContext, riskResult };
      const decision = makeDecision(finalContext);
      dispatch({ type: 'DECISION_MADE', payload: decision });
      
      // Save decision to localStorage
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(decision));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, dispatch]);

  // Reset verification
  const reset = useCallback(() => {
    if (user?.id) {
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
    }
    dispatch({ type: 'RESET' });
    setError(null);
  }, [user?.id, dispatch]);

  // Check if step is complete
  const isStepComplete = useCallback((stepId: string): boolean => {
    const step = context.steps.find(s => s.id === stepId);
    return step?.status === 'verified';
  }, [context.steps]);

  // Get verification progress (0-100)
  const getProgress = useCallback((): number => {
    const totalSteps = context.steps.length + 2; // +2 for risk & decision
    let completedSteps = context.steps.filter(s => s.status === 'verified').length;
    
    if (context.riskResult) completedSteps++;
    if (context.decision) completedSteps++;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }, [context]);

  // Check if user can apply for financing
  const canApply = useCallback((): boolean => {
    if (!context.decision) return false;
    
    const now = new Date();
    const expiresAt = new Date(context.decision.expiresAt);
    
    return context.decision.eligible && now < expiresAt;
  }, [context.decision]);

  // Get remaining time until expiry
  const getTimeRemaining = useCallback((): number => {
    if (!context.decision) return 0;
    
    const now = Date.now();
    const expiresAt = new Date(context.decision.expiresAt).getTime();
    
    return Math.max(0, expiresAt - now);
  }, [context.decision]);

  return {
    context,
    currentState: context.currentState,
    isProcessing,
    error,
    decision: context.decision || null,
    startVerification,
    reset,
    isStepComplete,
    getProgress,
    canApply,
    getTimeRemaining,
  };
}
