/**
 * =====================================================
 * ASH HOLDING - Loan Application Wizard (Redesigned)
 * Premium Fintech UX · RTL-First · iOS-Inspired
 * Business Logic: UNCHANGED
 * =====================================================
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEligibilityGate } from "@/hooks/useEligibilityGate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifySubmitted } from "@/lib/financing/notifications/unifiedEmailService";
import { Loader2, ShieldCheck } from "lucide-react";

// Step Components
import { IntroStep } from "./steps/IntroStep";
import { ProductSelectionStep } from "./steps/ProductSelectionStep";
import { AmountTenorStep } from "./steps/AmountTenorStep";
import { InstallmentSimulatorStep } from "./steps/InstallmentSimulatorStep";
import { AdditionalInfoStep } from "./steps/AdditionalInfoStep";
import { ReviewConfirmStep } from "./steps/ReviewConfirmStep";
import { SubmitTrackingStep } from "./steps/SubmitTrackingStep";
import { ResultStep } from "./steps/ResultStep";

// Eligibility Gate
import { EligibilityGateScreen } from "../eligibility/EligibilityGateScreen";

// New Stepper
import { WizardStepper } from "./WizardStepper";

// Types
export interface LoanApplicationData {
  // Step 0 - Eligibility Gate (new)
  eligibilityChecked: boolean;
  eligibilityStatus: string;
  
  // Step 1 - Intro
  acceptedTerms: boolean;
  acceptedConditions: boolean;
  
  // Step 2 - Product
  productType: "personal" | "business" | "service" | "";
  serviceCategory: string;
  
  // Step 3 - Amount & Tenor
  amount: number;
  tenorMonths: number;
  
  // Step 4 - Simulator (calculated)
  monthlyInstallment: number;
  totalAmount: number;
  fees: number;
  
  // Step 5 - Additional Info
  purpose: string;
  monthlyIncome: number;
  employmentType: string;
  
  // Metadata
  currentStep: number;
  applicationId: string | null;
  applicationNumber: string | null;
  status: "draft" | "submitted" | "approved" | "rejected" | "under_review";
  lastSavedAt: string | null;
  
  // Eligibility limits
  maxAllowedAmount: number;
  maxAllowedTenor: number;
}

const initialData: LoanApplicationData = {
  eligibilityChecked: false,
  eligibilityStatus: "",
  acceptedTerms: false,
  acceptedConditions: false,
  productType: "",
  serviceCategory: "",
  amount: 0,
  tenorMonths: 3,
  monthlyInstallment: 0,
  totalAmount: 0,
  fees: 0,
  purpose: "",
  monthlyIncome: 0,
  employmentType: "",
  currentStep: 0,
  applicationId: null,
  applicationNumber: null,
  status: "draft",
  lastSavedAt: null,
  maxAllowedAmount: 100000,
  maxAllowedTenor: 24,
};

// Updated steps to include eligibility gate
export const STEPS = [
  { id: 0, title: "فحص الأهلية", icon: "🛡️" },
  { id: 1, title: "البداية", icon: "🚀" },
  { id: 2, title: "نوع التمويل", icon: "📦" },
  { id: 3, title: "المبلغ والمدة", icon: "💰" },
  { id: 4, title: "محاكاة الأقساط", icon: "📊" },
  { id: 5, title: "معلومات إضافية", icon: "📝" },
  { id: 6, title: "المراجعة", icon: "✅" },
  { id: 7, title: "الإرسال", icon: "📤" },
  { id: 8, title: "النتيجة", icon: "🎯" },
];

const STORAGE_KEY = "ashholding_loan_application";

// Step transition animation variants
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
    filter: "blur(4px)",
  }),
};

export function LoanApplicationWizard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const eligibilityGate = useEligibilityGate();
  
  const [data, setData] = useState<LoanApplicationData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [direction, setDirection] = useState(0);
  
  const prevStepRef = useRef(data.currentStep);

  // ═══════════════════════════════════════════════════
  // BUSINESS LOGIC (UNCHANGED)
  // ═══════════════════════════════════════════════════

  // Load saved progress on mount AND check for existing active applications
  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        if (user?.id) {
          const { data: activeApp } = await supabase
            .from("financing_applications")
            .select("*")
            .eq("user_id", user.id)
            .in("status", ["pending", "active", "under_review", "approved", "completed"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (activeApp) {
            let appStatus: LoanApplicationData["status"] = "submitted";
            
            if (activeApp.status === "approved" || activeApp.status === "completed") {
              appStatus = "approved";
            } else if (activeApp.status === "under_review") {
              appStatus = "under_review";
            } else if (activeApp.status === "active" || activeApp.status === "pending") {
              appStatus = "submitted";
            }
            
            setData({
              ...initialData,
              applicationId: activeApp.id,
              applicationNumber: activeApp.application_number || null,
              amount: activeApp.requested_amount || 0,
              tenorMonths: 12,
              monthlyInstallment: (activeApp.requested_amount || 0) / 12,
              status: appStatus,
              currentStep: 7,
            });
            setIsLoading(false);
            return;
          }
        }
        
        const savedLocal = localStorage.getItem(STORAGE_KEY);
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          setData(parsed);
        }
        
        if (user?.id) {
          const { data: draft } = await supabase
            .from("financing_applications")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (draft) {
            const serverDate = new Date(draft.updated_at).getTime();
            const localDate = savedLocal ? new Date(JSON.parse(savedLocal).lastSavedAt || 0).getTime() : 0;
            
            if (serverDate > localDate) {
              setData(prev => ({
                ...prev,
                applicationId: draft.id,
                amount: draft.requested_amount || prev.amount,
                status: "draft",
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error loading saved progress:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    
    loadSavedProgress();
  }, [user?.id]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!isLoading && data.currentStep > 0) {
      const saveData = { ...data, lastSavedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    }
  }, [data, isLoading]);

  // Track step direction for animations
  useEffect(() => {
    if (data.currentStep > prevStepRef.current) {
      setDirection(1);
    } else if (data.currentStep < prevStepRef.current) {
      setDirection(-1);
    }
    prevStepRef.current = data.currentStep;
  }, [data.currentStep]);

  // Validate current step before proceeding
  const validateStep = useCallback((step: number): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 0:
        if (!data.acceptedTerms) errors.push("يجب الموافقة على الشروط والأحكام");
        if (!data.acceptedConditions) errors.push("يجب قراءة وقبول شروط التمويل");
        break;
      case 1:
        if (!data.productType) errors.push("يرجى اختيار نوع التمويل");
        break;
      case 2:
        if (data.amount < 1000) errors.push("الحد الأدنى للتمويل 1,000 ر.س");
        if (data.amount > 100000) errors.push("الحد الأقصى للتمويل 100,000 ر.س");
        if (data.tenorMonths < 1 || data.tenorMonths > 24) errors.push("مدة التمويل يجب أن تكون بين 1-24 شهر");
        break;
      case 3:
        break;
      case 4:
        if (data.monthlyIncome > 0 && data.monthlyIncome < 3000) {
          errors.push("الحد الأدنى للدخل الشهري 3,000 ر.س");
        }
        break;
      case 5:
        break;
    }
    
    return errors;
  }, [data]);

  // Navigate to next step with validation
  const goNext = useCallback(() => {
    const errors = validateStep(data.currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      errors.forEach(err => toast.error(err));
      return;
    }
    
    setValidationErrors([]);
    setDirection(1);
    setData(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, STEPS.length - 1) }));
  }, [data.currentStep, validateStep]);

  // Navigate to previous step
  const goBack = useCallback(() => {
    setValidationErrors([]);
    setDirection(-1);
    setData(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 0) }));
  }, []);

  // Update data
  const updateData = useCallback((updates: Partial<LoanApplicationData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  // Submit application
  const submitApplication = useCallback(async () => {
    if (!user?.id) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }

    setIsSaving(true);
    try {
      const applicationNumber = `LOAN-${Date.now()}`;
      
      const { data: newApp, error } = await supabase
        .from("financing_applications")
        .insert([{
          user_id: user.id,
          full_name: profile?.full_name || "",
          national_id: "",
          phone: profile?.phone || "",
          email: profile?.email || "",
          requested_amount: data.amount,
          service_description: `${data.productType}: ${data.purpose}`,
          application_number: applicationNumber,
          status: "pending"
        }])
        .select()
        .single();

      if (error) throw error;

      try {
        await notifySubmitted(
          newApp.id,
          newApp.application_number,
          profile?.email || "",
          profile?.full_name || ""
        );
        console.log("Loan application notification sent (WhatsApp + Email)");
      } catch (notifyError) {
        console.error("Failed to send submission notification:", notifyError);
      }

      localStorage.removeItem(STORAGE_KEY);
      
      setData(prev => ({
        ...prev,
        applicationId: newApp.id,
        applicationNumber: newApp.application_number,
        status: "submitted",
        currentStep: 7,
      }));

      toast.success("تم إرسال طلبك بنجاح!");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsSaving(false);
    }
  }, [user, profile, data]);

  // Reset application
  const resetApplication = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(initialData);
  }, []);

  // ═══════════════════════════════════════════════════
  // RENDER (REDESIGNED UI)
  // ═══════════════════════════════════════════════════

  const renderStep = () => {
    const stepProps = {
      data,
      updateData,
      goNext,
      goBack,
      validationErrors,
      isLoading: isSaving,
    };

    switch (data.currentStep) {
      case 0:
        return <IntroStep {...stepProps} />;
      case 1:
        return <ProductSelectionStep {...stepProps} />;
      case 2:
        return <AmountTenorStep {...stepProps} />;
      case 3:
        return <InstallmentSimulatorStep {...stepProps} />;
      case 4:
        return <AdditionalInfoStep {...stepProps} />;
      case 5:
        return <ReviewConfirmStep {...stepProps} />;
      case 6:
        return <SubmitTrackingStep {...stepProps} onSubmit={submitApplication} />;
      case 7:
        return <ResultStep data={data} onReset={resetApplication} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ShieldCheck className="w-8 h-8 text-primary" />
          </motion.div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">جاري تحميل طلبك...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      {/* Processing Overlay */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-4 p-8"
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="text-lg font-semibold">جاري إرسال طلبك...</p>
              <p className="text-sm text-muted-foreground">يرجى عدم إغلاق الصفحة</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stepper */}
      {data.currentStep < 7 && (
        <WizardStepper 
          steps={STEPS}
          currentStep={data.currentStep}
          lastSavedAt={data.lastSavedAt}
        />
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={data.currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              filter: { duration: 0.2 },
            }}
            className="will-change-transform"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
