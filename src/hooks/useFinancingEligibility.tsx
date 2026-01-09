import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

interface EligibilityResult {
  eligible: boolean;
  score: number;
  reasons: string[];
  recommendations: string[];
  verifiedAt: string;
  expiresAt: string;
}

const ELIGIBILITY_KEY = "financing_eligibility";
const ELIGIBILITY_DURATION_HOURS = 24; // صلاحية التحقق 24 ساعة

export function useFinancingEligibility() {
  const { user } = useAuth();
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);

  // تحميل نتيجة التحقق المحفوظة
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`${ELIGIBILITY_KEY}_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as EligibilityResult;
          const now = new Date();
          const expiresAt = new Date(parsed.expiresAt);
          
          // تحقق من صلاحية النتيجة
          if (now < expiresAt) {
            setEligibilityResult(parsed);
          } else {
            // انتهت الصلاحية، احذف النتيجة
            localStorage.removeItem(`${ELIGIBILITY_KEY}_${user.id}`);
            setEligibilityResult(null);
          }
        } catch {
          localStorage.removeItem(`${ELIGIBILITY_KEY}_${user.id}`);
        }
      }
    }
  }, [user?.id]);

  // حفظ نتيجة التحقق
  const saveEligibility = useCallback((result: Omit<EligibilityResult, "verifiedAt" | "expiresAt">) => {
    if (!user?.id) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ELIGIBILITY_DURATION_HOURS * 60 * 60 * 1000);

    const fullResult: EligibilityResult = {
      ...result,
      verifiedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    localStorage.setItem(`${ELIGIBILITY_KEY}_${user.id}`, JSON.stringify(fullResult));
    setEligibilityResult(fullResult);
  }, [user?.id]);

  // مسح نتيجة التحقق
  const clearEligibility = useCallback(() => {
    if (user?.id) {
      localStorage.removeItem(`${ELIGIBILITY_KEY}_${user.id}`);
      setEligibilityResult(null);
    }
  }, [user?.id]);

  // التحقق من الأهلية
  const isEligible = eligibilityResult?.eligible ?? false;
  const hasChecked = eligibilityResult !== null;

  // حساب الوقت المتبقي حتى انتهاء الصلاحية
  const timeRemaining = eligibilityResult
    ? Math.max(0, new Date(eligibilityResult.expiresAt).getTime() - Date.now())
    : 0;

  return {
    eligibilityResult,
    isEligible,
    hasChecked,
    timeRemaining,
    saveEligibility,
    clearEligibility,
  };
}
