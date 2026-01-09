/**
 * =====================================================
 * MaxioCore Financing Journey Wizard
 * Bank-Grade Financing Application Experience
 * =====================================================
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEligibilityMachine } from "@/hooks/useEligibilityMachine";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  JOURNEY_SCREENS, 
  DECISION_STATES,
  MICROCOPY,
  type JourneyScreen,
  type DecisionState 
} from "@/lib/financing/journeyConfig";

// Screen Components
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { EligibilityScreen } from "./screens/EligibilityScreen";
import { IdentityScreen } from "./screens/IdentityScreen";
import { EmploymentScreen } from "./screens/EmploymentScreen";
import { FinancingDetailsScreen } from "./screens/FinancingDetailsScreen";
import { TermsDisclosureScreen } from "./screens/TermsDisclosureScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { VerificationScreen } from "./screens/VerificationScreen";
import { DecisionScreen } from "./screens/DecisionScreen";
import { ContractScreen } from "./screens/ContractScreen";
import { CompletionScreen } from "./screens/CompletionScreen";
import { JourneyProgress } from "./JourneyProgress";
import { JourneyHeader } from "./JourneyHeader";

// Types
export interface JourneyFormData {
  // Eligibility
  nationality: string;
  age: number;
  employment_status: string;
  
  // Identity
  national_id: string;
  full_name: string;
  date_of_birth: string;
  
  // Employment
  employment_type: string;
  employer_name: string;
  job_title: string;
  monthly_income: number;
  employment_duration: number;
  
  // Financing
  amount: number;
  plan_id: string;
  service_type: string;
  service_description: string;
  
  // Contact
  phone: string;
  email: string;
  address: string;
  
  // Terms
  accept_terms: boolean;
  acknowledge_fees: boolean;
  confirm_accuracy: boolean;
}

const initialFormData: JourneyFormData = {
  nationality: "",
  age: 0,
  employment_status: "",
  national_id: "",
  full_name: "",
  date_of_birth: "",
  employment_type: "",
  employer_name: "",
  job_title: "",
  monthly_income: 0,
  employment_duration: 0,
  amount: 0,
  plan_id: "",
  service_type: "",
  service_description: "",
  phone: "",
  email: "",
  address: "",
  accept_terms: false,
  acknowledge_fees: false,
  confirm_accuracy: false,
};

export function FinancingJourneyWizard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const eligibilityMachine = useEligibilityMachine();
  
  const [currentScreen, setCurrentScreen] = useState<JourneyScreen>("welcome");
  const [formData, setFormData] = useState<JourneyFormData>({
    ...initialFormData,
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [decisionState, setDecisionState] = useState<DecisionState | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [declineReasons, setDeclineReasons] = useState<string[]>([]);

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || prev.full_name,
        phone: profile.phone || prev.phone,
        email: profile.email || prev.email,
      }));
    }
  }, [profile]);

  // Calculate current step index
  const screenOrder = Object.values(JOURNEY_SCREENS).sort((a, b) => a.order - b.order);
  const currentStepIndex = screenOrder.findIndex(s => s.id === currentScreen);

  // Navigation handlers
  const goToScreen = useCallback((screen: JourneyScreen) => {
    setCurrentScreen(screen);
  }, []);

  const goNext = useCallback(() => {
    const currentIndex = screenOrder.findIndex(s => s.id === currentScreen);
    if (currentIndex < screenOrder.length - 1) {
      setCurrentScreen(screenOrder[currentIndex + 1].id);
    }
  }, [currentScreen, screenOrder]);

  const goBack = useCallback(() => {
    const currentIndex = screenOrder.findIndex(s => s.id === currentScreen);
    const currentConfig = JOURNEY_SCREENS[currentScreen];
    
    if (currentConfig.canGoBack && currentIndex > 0) {
      setCurrentScreen(screenOrder[currentIndex - 1].id);
    }
  }, [currentScreen, screenOrder]);

  // Update form data
  const updateFormData = useCallback((updates: Partial<JourneyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Submit application
  const submitApplication = useCallback(async () => {
    if (!user?.id) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }

    setIsProcessing(true);
    try {
      const applicationNumber = `FIN-${Date.now()}`;
      
      const { data, error } = await supabase
        .from("financing_applications")
        .insert([{
          user_id: user.id,
          plan_id: formData.plan_id,
          full_name: formData.full_name,
          national_id: formData.national_id,
          phone: formData.phone,
          email: formData.email,
          address: formData.address || null,
          requested_amount: formData.amount,
          service_description: `${formData.service_type}: ${formData.service_description}`,
          application_number: applicationNumber,
          status: "pending"
        }])
        .select()
        .single();

      if (error) throw error;

      setApplicationId(data.id);
      
      // Simulate decision based on eligibility
      const eligibilityScore = eligibilityMachine.decision?.score || 0;
      
      if (eligibilityScore >= 80) {
        setDecisionState("approved");
        setApprovedAmount(formData.amount);
      } else if (eligibilityScore >= 60) {
        setDecisionState("approved_limited");
        setApprovedAmount(Math.floor(formData.amount * 0.7));
      } else if (eligibilityScore >= 40) {
        setDecisionState("pending_review");
      } else {
        setDecisionState("declined");
        setDeclineReasons([
          "درجة الأهلية أقل من الحد المطلوب",
          "يرجى تحسين عوامل الأهلية والمحاولة لاحقاً"
        ]);
      }

      goToScreen("decision");
    } catch (error) {
      console.error("Application submission error:", error);
      toast.error("حدث خطأ أثناء تقديم الطلب");
    } finally {
      setIsProcessing(false);
    }
  }, [user, formData, eligibilityMachine.decision, goToScreen]);

  // Render current screen
  const renderScreen = () => {
    const screenProps = {
      formData,
      updateFormData,
      goNext,
      goBack,
      isProcessing,
      setIsProcessing,
    };

    switch (currentScreen) {
      case "welcome":
        return <WelcomeScreen {...screenProps} />;
      case "eligibility":
        return (
          <EligibilityScreen 
            {...screenProps} 
            eligibilityMachine={eligibilityMachine}
          />
        );
      case "identity":
        return <IdentityScreen {...screenProps} />;
      case "employment":
        return <EmploymentScreen {...screenProps} />;
      case "financing_details":
        return <FinancingDetailsScreen {...screenProps} />;
      case "terms_disclosure":
        return <TermsDisclosureScreen {...screenProps} />;
      case "review":
        return (
          <ReviewScreen 
            {...screenProps} 
            onSubmit={submitApplication}
          />
        );
      case "verification":
        return (
          <VerificationScreen 
            {...screenProps}
            onVerified={() => goToScreen("decision")}
          />
        );
      case "decision":
        return (
          <DecisionScreen
            decisionState={decisionState}
            approvedAmount={approvedAmount}
            requestedAmount={formData.amount}
            declineReasons={declineReasons}
            onProceed={() => goToScreen("contract")}
            onRestart={() => {
              setCurrentScreen("welcome");
              setFormData(initialFormData);
              setDecisionState(null);
            }}
          />
        );
      case "contract":
        return (
          <ContractScreen
            {...screenProps}
            applicationId={applicationId}
            approvedAmount={approvedAmount}
            onSigned={() => goToScreen("completion")}
          />
        );
      case "completion":
        return (
          <CompletionScreen
            applicationId={applicationId}
            approvedAmount={approvedAmount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header - Only show if not on welcome/completion */}
      {currentScreen !== "welcome" && currentScreen !== "completion" && (
        <JourneyHeader 
          currentScreen={currentScreen}
          onBack={goBack}
          canGoBack={JOURNEY_SCREENS[currentScreen].canGoBack}
        />
      )}

      {/* Progress Bar - Only show during form screens */}
      {currentScreen !== "welcome" && 
       currentScreen !== "decision" && 
       currentScreen !== "contract" && 
       currentScreen !== "completion" && (
        <JourneyProgress 
          currentStep={currentStepIndex}
          totalSteps={screenOrder.length - 3} // Exclude welcome, decision, contract, completion
          currentScreen={currentScreen}
        />
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
