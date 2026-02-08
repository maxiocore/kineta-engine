// ============================================
// Eligibility Wizard - ASH HOLDING FinTech
// Professional KYC-style verification wizard
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEligibilityMachine } from "@/hooks/useEligibilityMachine";
import { getTierInfo, EligibilityState } from "@/lib/eligibility";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Mail,
  History,
  Brain,
  Fingerprint,
  Scan,
  Lock,
  Loader2,
  RefreshCw,
  Sparkles,
  Crown,
  Award,
  Medal,
  Star,
  TrendingUp,
  FileCheck,
  Clock,
} from "lucide-react";

// ============================================
// Sub-components
// ============================================

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  requiredState: EligibilityState[];
}

const WIZARD_STEPS: StepConfig[] = [
  {
    id: "identity",
    title: "التحقق من الهوية",
    description: "التحقق من بياناتك الشخصية",
    icon: Fingerprint,
    requiredState: ["idle", "identity_verification"],
  },
  {
    id: "phone",
    title: "التحقق من الجوال",
    description: "التأكد من رقم الجوال المسجل",
    icon: Phone,
    requiredState: ["phone_verification"],
  },
  {
    id: "email",
    title: "التحقق من البريد",
    description: "تأكيد البريد الإلكتروني",
    icon: Mail,
    requiredState: ["email_verification"],
  },
  {
    id: "history",
    title: "فحص السجل",
    description: "تحليل سجل التعاملات",
    icon: History,
    requiredState: ["history_check", "risk_assessment"],
  },
  {
    id: "decision",
    title: "النتيجة",
    description: "قرار الأهلية النهائي",
    icon: Brain,
    requiredState: ["decision", "approved", "rejected"],
  },
];

// Step Progress Indicator
const WizardProgress = ({ 
  currentStep, 
  steps, 
  context 
}: { 
  currentStep: number; 
  steps: StepConfig[];
  context: ReturnType<typeof useEligibilityMachine>["context"];
}) => {
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isFailed = context.currentState === "rejected" && index === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              <motion.div
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  transition-all duration-300 border-2
                  ${isActive 
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500 shadow-lg shadow-emerald-500/30" 
                    : isCompleted
                      ? "bg-emerald-500/20 border-emerald-500"
                      : isFailed
                        ? "bg-red-500/20 border-red-500"
                        : "bg-muted border-border"
                  }
                `}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : isFailed ? (
                  <XCircle className="h-5 w-5 text-red-400" />
                ) : (
                  <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                )}

                {/* Active pulse */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-emerald-500"
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              <span className={`
                text-xs mt-2 font-medium text-center max-w-[80px]
                ${isActive ? "text-emerald-400" : "text-muted-foreground"}
              `}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Identity Input Step
const IdentityStep = ({ 
  onSubmit, 
  isProcessing 
}: { 
  onSubmit: (data: { nationalId: string; nationality: string; age: number }) => void;
  isProcessing: boolean;
}) => {
  const [nationalId, setNationalId] = useState("");
  const [nationality, setNationality] = useState<string>("");
  const [age, setAge] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndSubmit = () => {
    const newErrors: Record<string, string> = {};

    // Validate National ID
    if (!nationalId) {
      newErrors.nationalId = "رقم الهوية مطلوب";
    } else if (!/^[12]\d{9}$/.test(nationalId)) {
      newErrors.nationalId = "رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2";
    }

    // Validate nationality
    if (!nationality) {
      newErrors.nationality = "الجنسية مطلوبة";
    }

    // Validate age
    const ageNum = parseInt(age);
    if (!age) {
      newErrors.age = "العمر مطلوب";
    } else if (isNaN(ageNum) || ageNum < 18 || ageNum > 80) {
      newErrors.age = "العمر يجب أن يكون بين 18 و 80 سنة";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit({ nationalId, nationality, age: ageNum });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">بياناتك محمية ومشفرة</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">التحقق من الهوية</h2>
        <p className="text-muted-foreground">
          أدخل بياناتك الرسمية للتحقق من أهليتك
        </p>
      </div>

      <div className="space-y-4">
        {/* National ID */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
            رقم الهوية الوطنية / الإقامة
          </Label>
          <Input
            type="text"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="1234567890"
            className={`text-lg tracking-wider ${errors.nationalId ? "border-red-500" : ""}`}
            dir="ltr"
            disabled={isProcessing}
          />
          {errors.nationalId && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.nationalId}
            </p>
          )}
        </div>

        {/* Nationality Selection */}
        <div className="space-y-2">
          <Label>الجنسية</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "سعودي", label: "سعودي", icon: Crown },
              { value: "مقيم", label: "مقيم", icon: Award },
            ].map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setNationality(option.value)}
                disabled={isProcessing}
                className={`
                  p-4 rounded-xl border-2 text-center transition-all
                  ${nationality === option.value
                    ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                    : "border-border bg-card hover:border-emerald-500/50"
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <option.icon className={`h-6 w-6 mx-auto mb-2 ${
                  nationality === option.value ? "text-emerald-400" : "text-muted-foreground"
                }`} />
                <span className={nationality === option.value ? "text-foreground" : "text-muted-foreground"}>
                  {option.label}
                </span>
              </motion.button>
            ))}
          </div>
          {errors.nationality && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.nationality}
            </p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            العمر
          </Label>
          <Input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
            min={18}
            max={80}
            className={errors.age ? "border-red-500" : ""}
            disabled={isProcessing}
          />
          {errors.age && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.age}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={validateAndSubmit}
        disabled={isProcessing}
        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
            جارٍ التحقق...
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5 ml-2" />
            بدء التحقق
          </>
        )}
      </Button>
    </motion.div>
  );
};

// Processing Animation Step
const ProcessingStep = ({ 
  stepName, 
  stepIcon: StepIcon,
  progress 
}: { 
  stepName: string;
  stepIcon: React.ElementType;
  progress: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center py-12"
    >
      {/* Animated Icon */}
      <motion.div
        className="relative w-32 h-32 mx-auto mb-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 blur-xl opacity-50" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <StepIcon className="h-12 w-12 text-white" />
          </motion.div>
        </div>
        
        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-emerald-400"
            style={{ top: "50%", left: "50%", marginTop: -6, marginLeft: -6 }}
            animate={{
              x: [0, 50 * Math.cos((i * 2 * Math.PI) / 3 + Date.now() / 1000), 0],
              y: [0, 50 * Math.sin((i * 2 * Math.PI) / 3 + Date.now() / 1000), 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </motion.div>

      <h3 className="text-xl font-bold mb-2">{stepName}</h3>
      <p className="text-muted-foreground mb-6">جارٍ التحقق من البيانات...</p>

      {/* Progress */}
      <div className="max-w-xs mx-auto">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
      </div>
    </motion.div>
  );
};

// Result Step
const ResultStep = ({ 
  decision, 
  onReset,
  onApply 
}: { 
  decision: NonNullable<ReturnType<typeof useEligibilityMachine>["decision"]>;
  onReset: () => void;
  onApply: () => void;
}) => {
  const tierInfo = getTierInfo(decision.tier);
  const isEligible = decision.eligible;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      {/* Result Icon */}
      <motion.div
        className={`
          relative w-32 h-32 mx-auto mb-6 rounded-full
          ${isEligible 
            ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20" 
            : "bg-gradient-to-br from-red-500/20 to-orange-500/20"
          }
        `}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <motion.div
          className={`
            absolute inset-4 rounded-full flex items-center justify-center
            ${isEligible 
              ? "bg-gradient-to-br from-emerald-500 to-teal-600" 
              : "bg-gradient-to-br from-red-500 to-orange-600"
            }
          `}
          animate={{ 
            boxShadow: isEligible
              ? ["0 0 30px rgba(16, 185, 129, 0.3)", "0 0 50px rgba(16, 185, 129, 0.5)", "0 0 30px rgba(16, 185, 129, 0.3)"]
              : ["0 0 30px rgba(239, 68, 68, 0.3)", "0 0 50px rgba(239, 68, 68, 0.5)", "0 0 30px rgba(239, 68, 68, 0.3)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isEligible ? (
            <ShieldCheck className="h-12 w-12 text-white" />
          ) : (
            <ShieldX className="h-12 w-12 text-white" />
          )}
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className={`text-3xl font-bold mb-2 ${isEligible ? "text-emerald-400" : "text-red-400"}`}>
          {isEligible ? "مبروك! أنت مؤهل للتمويل" : "للأسف، لم تستوفِ الشروط"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {isEligible 
            ? "تم التحقق من بياناتك بنجاح ويمكنك التقديم على التمويل الآن"
            : "بناءً على التحقق من البيانات، لا تستوفي شروط التمويل حالياً"
          }
        </p>
      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <Card className={`
          border-2 overflow-hidden
          ${isEligible ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}
        `}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">نقاط الأهلية</p>
                <p className={`text-4xl font-bold ${isEligible ? "text-emerald-400" : "text-red-400"}`}>
                  {decision.score}
                  <span className="text-lg text-muted-foreground">/100</span>
                </p>
              </div>
              
              {isEligible && (
                <div className="text-center">
                  <Badge className={`bg-gradient-to-r ${tierInfo.color} text-white text-lg px-4 py-2`}>
                    <span className="ml-2">{tierInfo.icon}</span>
                    {tierInfo.nameAr}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    الحد الأقصى: {decision.maxAmount.toLocaleString()} ر.س
                  </p>
                </div>
              )}
            </div>

            {/* Reasons */}
            {decision.reasons.length > 0 && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm font-medium mb-3 text-right">
                  {isEligible ? "نقاط القوة:" : "أسباب عدم الأهلية:"}
                </p>
                <ul className="space-y-2">
                  {decision.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-right">
                      {isEligible ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="text-muted-foreground">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {decision.recommendations.length > 0 && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm font-medium mb-3 text-right">التوصيات:</p>
                <ul className="space-y-2">
                  {decision.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-right">
                      <Sparkles className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Validity Notice */}
      {isEligible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6"
        >
          <Clock className="h-4 w-4" />
          <span>
            صالح حتى: {new Date(decision.expiresAt).toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        {isEligible ? (
          <>
            <Button
              onClick={onApply}
              className="h-14 px-8 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <FileCheck className="h-5 w-5 ml-2" />
              تقديم طلب التمويل
            </Button>
            <Button
              variant="outline"
              onClick={onReset}
              className="h-14 px-8"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة التحقق
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={onReset}
              className="h-14 px-8 text-lg"
            >
              <RefreshCw className="h-5 w-5 ml-2" />
              إعادة المحاولة
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-14 px-8"
            >
              <Link to="/dashboard/financing">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Link>
            </Button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ============================================
// Main Wizard Component
// ============================================

export function EligibilityWizard() {
  const {
    context,
    currentState,
    isProcessing,
    error,
    decision,
    startVerification,
    reset,
    getProgress,
  } = useEligibilityMachine();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Update step index based on state machine state
  useEffect(() => {
    const stateToStep: Record<EligibilityState, number> = {
      idle: 0,
      identity_verification: 0,
      phone_verification: 1,
      email_verification: 2,
      history_check: 3,
      risk_assessment: 3,
      decision: 4,
      approved: 4,
      rejected: 4,
    };
    setCurrentStepIndex(stateToStep[currentState] || 0);
  }, [currentState]);

  // Get current step icon for processing
  const getCurrentStepInfo = () => {
    const stepMap: Record<EligibilityState, { name: string; icon: React.ElementType }> = {
      idle: { name: "البدء", icon: Shield },
      identity_verification: { name: "التحقق من الهوية", icon: Fingerprint },
      phone_verification: { name: "التحقق من الجوال", icon: Phone },
      email_verification: { name: "التحقق من البريد", icon: Mail },
      history_check: { name: "فحص السجل", icon: History },
      risk_assessment: { name: "تقييم المخاطر", icon: Brain },
      decision: { name: "اتخاذ القرار", icon: Scan },
      approved: { name: "تمت الموافقة", icon: ShieldCheck },
      rejected: { name: "مرفوض", icon: ShieldX },
    };
    return stepMap[currentState] || stepMap.idle;
  };

  const handleIdentitySubmit = (data: { nationalId: string; nationality: string; age: number }) => {
    startVerification(data);
  };

  const handleReset = () => {
    reset();
    setCurrentStepIndex(0);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            التحقق من الأهلية
          </h1>
          <p className="text-muted-foreground mt-1">نظام تحقق ذكي ومتقدم</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/financing">
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة
          </Link>
        </Button>
      </div>

      {/* Progress */}
      <WizardProgress
        currentStep={currentStepIndex}
        steps={WIZARD_STEPS}
        context={context}
      />

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-red-500/30 bg-red-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-400">حدث خطأ</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="mr-auto"
                >
                  <RefreshCw className="h-4 w-4 ml-1" />
                  إعادة
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <Card className="border-0 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {/* Initial State - Show Identity Form */}
            {currentState === "idle" && !isProcessing && (
              <IdentityStep
                key="identity"
                onSubmit={handleIdentitySubmit}
                isProcessing={isProcessing}
              />
            )}

            {/* Processing States */}
            {isProcessing && currentState !== "approved" && currentState !== "rejected" && (
              <ProcessingStep
                key="processing"
                stepName={getCurrentStepInfo().name}
                stepIcon={getCurrentStepInfo().icon}
                progress={getProgress()}
              />
            )}

            {/* Result State */}
            {decision && (currentState === "approved" || currentState === "rejected") && (
              <ResultStep
                key="result"
                decision={decision}
                onReset={handleReset}
                onApply={() => window.location.href = "/dashboard/financing"}
              />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>جميع البيانات مشفرة ومحمية وفقاً لأعلى معايير الأمان</span>
      </div>
    </div>
  );
}
