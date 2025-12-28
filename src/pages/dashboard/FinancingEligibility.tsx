import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  CreditCard,
  FileText,
  Sparkles,
  Clock,
  Zap,
  Star,
  Target,
  TrendingUp,
  Award,
  Brain,
  Fingerprint,
  Scan,
  ChevronDown,
} from "lucide-react";

interface FormData {
  nationality: string;
  age: string;
  hasValidId: boolean;
  hasRegisteredPhone: boolean;
  hasActiveEmail: boolean;
  hasPreviousDefaults: boolean;
  requestedAmount: string;
  employmentStatus: string;
}

const initialFormData: FormData = {
  nationality: "",
  age: "",
  hasValidId: false,
  hasRegisteredPhone: false,
  hasActiveEmail: false,
  hasPreviousDefaults: false,
  requestedAmount: "",
  employmentStatus: "",
};

// Animated Background Orbs
const FloatingOrb = ({ delay, size, color, x, y }: { delay: number; size: number; color: string; x: string; y: string }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-20 ${color}`}
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.1, 0.3, 0.1],
      x: [0, 30, 0],
      y: [0, -20, 0],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Animated Progress Ring
const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const springProgress = useSpring(progress, { damping: 30, stiffness: 100 });
  const offset = useTransform(springProgress, (p) => circumference - (p / 100) * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"
          key={progress}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
};

// Interactive Selection Card
const SelectionCard = ({ 
  selected, 
  onClick, 
  icon: Icon, 
  title, 
  description,
  color = "emerald"
}: { 
  selected: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  title: string; 
  description: string;
  color?: string;
}) => {
  const colorClasses = {
    emerald: {
      border: selected ? "border-emerald-500 shadow-emerald-500/25" : "border-border hover:border-emerald-500/50",
      bg: selected ? "bg-emerald-500/10" : "bg-card hover:bg-emerald-500/5",
      icon: selected ? "text-emerald-400" : "text-muted-foreground",
      iconBg: selected ? "bg-emerald-500/20" : "bg-muted",
    },
    yellow: {
      border: selected ? "border-yellow-500 shadow-yellow-500/25" : "border-border hover:border-yellow-500/50",
      bg: selected ? "bg-yellow-500/10" : "bg-card hover:bg-yellow-500/5",
      icon: selected ? "text-yellow-400" : "text-muted-foreground",
      iconBg: selected ? "bg-yellow-500/20" : "bg-muted",
    },
  };
  
  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald;

  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full p-4 rounded-2xl border-2 text-right transition-all duration-300 ${colors.border} ${colors.bg} ${selected ? 'shadow-lg' : ''}`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="flex items-center gap-4">
        <motion.div 
          className={`p-3 rounded-xl ${colors.iconBg} transition-colors duration-300`}
          animate={selected ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Icon className={`h-6 w-6 ${colors.icon} transition-colors duration-300`} />
        </motion.div>
        <div className="flex-1">
          <p className={`font-semibold ${selected ? 'text-foreground' : 'text-foreground/80'}`}>{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="p-1.5 rounded-full bg-emerald-500"
            >
              <CheckCircle2 className="h-4 w-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Animated border glow */}
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent)',
            backgroundSize: '200% 100%',
          }}
        />
      )}
    </motion.button>
  );
};

// Checkbox Card with Animation
const CheckboxCard = ({ 
  checked, 
  onChange, 
  icon: Icon, 
  title, 
  description,
  variant = "default"
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  icon: React.ElementType; 
  title: string; 
  description: string;
  variant?: "default" | "warning";
}) => {
  const isWarning = variant === "warning";
  
  return (
    <motion.button
      onClick={() => onChange(!checked)}
      className={`relative w-full p-5 rounded-2xl border-2 text-right transition-all duration-300 ${
        checked 
          ? isWarning 
            ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/10' 
            : 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
          : 'border-border bg-card hover:border-primary/30 hover:bg-accent/50'
      }`}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <div className="flex items-start gap-4">
        <motion.div 
          className={`relative p-3 rounded-xl transition-colors duration-300 ${
            checked 
              ? isWarning ? 'bg-yellow-500/20' : 'bg-emerald-500/20'
              : 'bg-muted'
          }`}
          animate={checked ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Icon className={`h-6 w-6 transition-colors duration-300 ${
            checked 
              ? isWarning ? 'text-yellow-400' : 'text-emerald-400'
              : 'text-muted-foreground'
          }`} />
          
          {/* Animated ring */}
          <AnimatePresence>
            {checked && (
              <motion.div
                className={`absolute inset-0 rounded-xl border-2 ${isWarning ? 'border-yellow-500' : 'border-emerald-500'}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </AnimatePresence>
        </motion.div>
        
        <div className="flex-1">
          <p className={`font-semibold mb-1 ${
            checked 
              ? isWarning ? 'text-yellow-400' : 'text-foreground'
              : 'text-foreground/80'
          }`}>{title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        
        {/* Custom Checkbox */}
        <motion.div 
          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
            checked 
              ? isWarning 
                ? 'bg-yellow-500 border-yellow-500' 
                : 'bg-emerald-500 border-emerald-500'
              : 'border-muted-foreground/30 bg-transparent'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
              >
                <CheckCircle2 className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.button>
  );
};

// Step Indicator
const StepIndicator = ({ step, totalSteps, progress }: { step: number; totalSteps: number; progress: number }) => {
  const icons = [User, FileText, CreditCard];
  const labels = ["المعلومات", "التوثيق", "التفاصيل"];
  
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const Icon = icons[index];
        const isActive = index + 1 === step;
        const isCompleted = index + 1 < step;
        
        return (
          <div key={index} className="flex items-center">
            <motion.div
              className={`relative flex flex-col items-center ${index < totalSteps - 1 ? 'ml-2' : ''}`}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
            >
              <motion.div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  isActive 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30' 
                    : isCompleted 
                      ? 'bg-emerald-500/20 border-2 border-emerald-500'
                      : 'bg-muted border-2 border-border'
                }`}
                whileHover={{ scale: 1.1 }}
                layout
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring" }}
                  >
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </motion.div>
                ) : (
                  <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                )}
                
                {/* Pulse effect for active */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-emerald-500"
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <span className={`text-xs mt-2 font-medium ${isActive ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                {labels[index]}
              </span>
            </motion.div>
            
            {index < totalSteps - 1 && (
              <div className="w-12 h-1 mx-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Score Animation Component
const ScoreReveal = ({ score, eligible }: { score: number; eligible: boolean }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const springScore = useSpring(0, { damping: 20, stiffness: 50 });
  
  useEffect(() => {
    springScore.set(score);
    const unsubscribe = springScore.on("change", (v) => setDisplayScore(Math.round(v)));
    return () => unsubscribe();
  }, [score, springScore]);
  
  return (
    <motion.div 
      className="relative mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Score Circle */}
      <div className="relative w-48 h-48 mx-auto">
        {/* Outer glow */}
        <motion.div
          className={`absolute inset-0 rounded-full blur-2xl ${eligible ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Main circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={eligible ? "url(#scoreGradient)" : "url(#scoreGradientRed)"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - displayScore / 100) }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="scoreGradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={`text-5xl font-bold ${eligible ? 'text-emerald-400' : 'text-red-400'}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.5 }}
          >
            {displayScore}
          </motion.span>
          <span className="text-sm text-muted-foreground">من 100</span>
        </div>
      </div>
    </motion.div>
  );
};

// AI Analysis Animation
const AIAnalysisAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [analysisStep, setAnalysisStep] = useState(0);
  const analysisSteps = [
    { icon: Brain, text: "تحليل البيانات...", delay: 0 },
    { icon: Fingerprint, text: "التحقق من الهوية...", delay: 800 },
    { icon: Scan, text: "فحص الأهلية...", delay: 1600 },
    { icon: Target, text: "حساب النتيجة...", delay: 2400 },
  ];

  useEffect(() => {
    const timers = analysisSteps.map((_, index) => 
      setTimeout(() => setAnalysisStep(index + 1), analysisSteps[index].delay)
    );
    
    const completeTimer = setTimeout(onComplete, 3200);
    
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        {/* Animated Logo */}
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 blur-xl opacity-50" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
            <Shield className="h-12 w-12 text-emerald-400" />
          </div>
          
          {/* Orbiting dots */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-emerald-400"
              style={{ top: '50%', left: '50%' }}
              animate={{
                x: [0, 50 * Math.cos((i * 2 * Math.PI) / 3), 0],
                y: [0, 50 * Math.sin((i * 2 * Math.PI) / 3), 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
        
        {/* Analysis Steps */}
        <div className="space-y-4">
          {analysisSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = analysisStep >= index + 1;
            
            return (
              <motion.div
                key={index}
                className={`flex items-center justify-center gap-3 transition-all duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-30'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isActive ? 1 : 0.3, x: 0 }}
                transition={{ delay: index * 0.3 }}
              >
                <motion.div
                  animate={isActive ? { rotate: 360 } : {}}
                  transition={{ duration: 1 }}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                </motion.div>
                <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                  {step.text}
                </span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default function FinancingEligibility() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showResult, setShowResult] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: boolean;
    score: number;
    reasons: string[];
    recommendations: string[];
  } | null>(null);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setShowAnalysis(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const calculateEligibility = useCallback(() => {
    let score = 0;
    const reasons: string[] = [];
    const recommendations: string[] = [];

    if (formData.nationality === "saudi" || formData.nationality === "resident") {
      score += 25;
    } else {
      reasons.push("غير مؤهل: يجب أن تكون سعودي الجنسية أو مقيم بإقامة سارية");
    }

    const age = parseInt(formData.age);
    if (age >= 21 && age <= 65) {
      score += 20;
    } else if (age < 21) {
      reasons.push("العمر أقل من 21 سنة (الحد الأدنى المطلوب)");
    } else {
      reasons.push("العمر أكبر من 65 سنة");
    }

    if (formData.hasValidId) {
      score += 15;
    } else {
      reasons.push("يجب توفر هوية وطنية أو إقامة سارية");
      recommendations.push("تأكد من تجديد هويتك قبل التقديم");
    }

    if (formData.hasRegisteredPhone) {
      score += 10;
    } else {
      reasons.push("يجب توفر رقم جوال مسجل باسمك");
      recommendations.push("سجل رقم جوالك باسمك من خلال مزود الخدمة");
    }

    if (formData.hasActiveEmail) {
      score += 10;
    } else {
      reasons.push("يجب توفر بريد إلكتروني فعّال");
    }

    if (!formData.hasPreviousDefaults) {
      score += 15;
    } else {
      reasons.push("وجود تعثرات سابقة يقلل من فرص الموافقة");
      recommendations.push("حاول تسوية التعثرات السابقة قبل التقديم");
    }

    if (formData.employmentStatus === "employed" || formData.employmentStatus === "business") {
      score += 5;
    }

    const eligible = score >= 70 && reasons.length === 0;

    if (eligible) {
      recommendations.push("أنت مؤهل للتقديم! يمكنك البدء الآن.");
    }

    setEligibilityResult({ eligible, score, reasons, recommendations });
    setShowResult(true);
  }, [formData]);

  const handleAnalysisComplete = useCallback(() => {
    setShowAnalysis(false);
    calculateEligibility();
  }, [calculateEligibility]);

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(1);
    setShowResult(false);
    setEligibilityResult(null);
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.nationality && formData.age;
    }
    if (step === 2) {
      return true;
    }
    if (step === 3) {
      return formData.employmentStatus;
    }
    return false;
  };

  return (
    <ClientDashboardLayout>
      {/* AI Analysis Animation */}
      <AnimatePresence>
        {showAnalysis && <AIAnalysisAnimation onComplete={handleAnalysisComplete} />}
      </AnimatePresence>
      
      <motion.div
        className="relative min-h-screen py-4"
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Floating Background Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <FloatingOrb delay={0} size={300} color="bg-emerald-500" x="10%" y="20%" />
          <FloatingOrb delay={2} size={200} color="bg-teal-500" x="70%" y="60%" />
          <FloatingOrb delay={4} size={250} color="bg-cyan-500" x="80%" y="10%" />
        </div>
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              animate={{ 
                boxShadow: [
                  "0 10px 30px -10px rgba(16, 185, 129, 0.3)",
                  "0 10px 40px -10px rgba(16, 185, 129, 0.5)",
                  "0 10px 30px -10px rgba(16, 185, 129, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-2">التحقق من الأهلية</h1>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              نظام ذكي للتحقق خلال دقيقتين
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Step Indicator */}
                <StepIndicator step={step} totalSteps={totalSteps} progress={progress} />
                
                {/* Form Card */}
                <Card className="overflow-hidden border-0 bg-card/80 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-8">
                    <AnimatePresence mode="wait">
                      {step === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          className="space-y-6"
                        >
                          <div className="text-center mb-8">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", delay: 0.2 }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 mb-4"
                            >
                              <User className="h-4 w-4" />
                              <span className="text-sm font-medium">المعلومات الشخصية</span>
                            </motion.div>
                            <p className="text-muted-foreground">أخبرنا عن نفسك</p>
                          </div>
                          
                          <div className="space-y-4">
                            <Label className="text-lg font-medium">الجنسية / الإقامة</Label>
                            <div className="grid gap-3">
                              <SelectionCard
                                selected={formData.nationality === "saudi"}
                                onClick={() => setFormData({ ...formData, nationality: "saudi" })}
                                icon={Star}
                                title="سعودي الجنسية"
                                description="مواطن سعودي"
                              />
                              <SelectionCard
                                selected={formData.nationality === "resident"}
                                onClick={() => setFormData({ ...formData, nationality: "resident" })}
                                icon={Award}
                                title="مقيم بإقامة سارية"
                                description="إقامة نظامية سارية المفعول"
                              />
                              <SelectionCard
                                selected={formData.nationality === "visitor"}
                                onClick={() => setFormData({ ...formData, nationality: "visitor" })}
                                icon={User}
                                title="زائر"
                                description="تأشيرة زيارة"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label htmlFor="age" className="text-lg font-medium">العمر</Label>
                            <div className="relative">
                              <Input
                                id="age"
                                type="number"
                                placeholder="أدخل عمرك"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                className="h-14 text-lg bg-muted/50 border-0 rounded-xl pr-14"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <User className="h-5 w-5" />
                              </div>
                            </div>
                            <motion.p 
                              className="text-sm text-muted-foreground flex items-center gap-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                              الحد الأدنى للعمر: 21 سنة
                            </motion.p>
                          </div>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          className="space-y-6"
                        >
                          <div className="text-center mb-8">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", delay: 0.2 }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 mb-4"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="text-sm font-medium">المستندات والتوثيق</span>
                            </motion.div>
                            <p className="text-muted-foreground">تحقق من توفر المستندات المطلوبة</p>
                          </div>
                          
                          <div className="space-y-4">
                            <CheckboxCard
                              checked={formData.hasValidId}
                              onChange={(checked) => setFormData({ ...formData, hasValidId: checked })}
                              icon={Fingerprint}
                              title="لدي هوية وطنية / إقامة سارية"
                              description="يجب أن تكون الهوية سارية المفعول وغير منتهية"
                            />
                            
                            <CheckboxCard
                              checked={formData.hasRegisteredPhone}
                              onChange={(checked) => setFormData({ ...formData, hasRegisteredPhone: checked })}
                              icon={Zap}
                              title="رقم جوالي مسجل باسمي"
                              description="يجب أن يكون الرقم مسجلاً باسمك لدى مزود الخدمة"
                            />
                            
                            <CheckboxCard
                              checked={formData.hasActiveEmail}
                              onChange={(checked) => setFormData({ ...formData, hasActiveEmail: checked })}
                              icon={TrendingUp}
                              title="لدي بريد إلكتروني فعّال"
                              description="سيتم التواصل معك عبر البريد الإلكتروني"
                            />
                          </div>
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          className="space-y-6"
                        >
                          <div className="text-center mb-8">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", delay: 0.2 }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 mb-4"
                            >
                              <CreditCard className="h-4 w-4" />
                              <span className="text-sm font-medium">معلومات إضافية</span>
                            </motion.div>
                            <p className="text-muted-foreground">آخر خطوة للتحقق من أهليتك</p>
                          </div>
                          
                          <div className="space-y-4">
                            <Label className="text-lg font-medium">الحالة الوظيفية</Label>
                            <div className="grid gap-3">
                              <SelectionCard
                                selected={formData.employmentStatus === "employed"}
                                onClick={() => setFormData({ ...formData, employmentStatus: "employed" })}
                                icon={Award}
                                title="موظف"
                                description="موظف في القطاع العام أو الخاص"
                              />
                              <SelectionCard
                                selected={formData.employmentStatus === "business"}
                                onClick={() => setFormData({ ...formData, employmentStatus: "business" })}
                                icon={TrendingUp}
                                title="صاحب عمل حر / تجاري"
                                description="لديك سجل تجاري أو عمل حر"
                              />
                              <SelectionCard
                                selected={formData.employmentStatus === "student"}
                                onClick={() => setFormData({ ...formData, employmentStatus: "student" })}
                                icon={Star}
                                title="طالب"
                                description="طالب جامعي أو ثانوي"
                              />
                              <SelectionCard
                                selected={formData.employmentStatus === "other"}
                                onClick={() => setFormData({ ...formData, employmentStatus: "other" })}
                                icon={User}
                                title="أخرى"
                                description="حالة وظيفية أخرى"
                              />
                            </div>
                          </div>

                          <CheckboxCard
                            checked={formData.hasPreviousDefaults}
                            onChange={(checked) => setFormData({ ...formData, hasPreviousDefaults: checked })}
                            icon={AlertTriangle}
                            title="لدي تعثرات سابقة في السداد"
                            description="التعثرات السابقة قد تؤثر على قرار الموافقة"
                            variant="warning"
                          />

                          <div className="space-y-4">
                            <Label htmlFor="requestedAmount" className="text-lg font-medium">المبلغ المطلوب (تقريبي)</Label>
                            <div className="relative">
                              <Input
                                id="requestedAmount"
                                type="number"
                                placeholder="مثال: 5000"
                                value={formData.requestedAmount}
                                onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                                className="h-14 text-lg bg-muted/50 border-0 rounded-xl pr-14"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <CreditCard className="h-5 w-5" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex justify-between pt-8 mt-8 border-t border-border">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          onClick={handleBack}
                          disabled={step === 1}
                          className="h-12 px-6 rounded-xl"
                        >
                          <ArrowRight className="h-4 w-4 ml-2" />
                          السابق
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleNext}
                          disabled={!canProceed()}
                          className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                        >
                          {step === totalSteps ? (
                            <>
                              <Sparkles className="h-4 w-4 ml-2" />
                              تحقق الآن
                            </>
                          ) : (
                            <>
                              التالي
                              <ArrowLeft className="h-4 w-4 mr-2" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" }}
              >
                <Card className={`overflow-hidden border-0 bg-card/80 backdrop-blur-xl shadow-2xl ${
                  eligibilityResult?.eligible 
                    ? "ring-2 ring-emerald-500/50" 
                    : "ring-2 ring-red-500/50"
                }`}>
                  <CardContent className="p-8">
                    {/* Result Icon */}
                    <motion.div
                      className="flex justify-center mb-6"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.2 }}
                    >
                      <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center ${
                        eligibilityResult?.eligible 
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30" 
                          : "bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/30"
                      }`}>
                        {eligibilityResult?.eligible ? (
                          <CheckCircle2 className="h-12 w-12 text-white" />
                        ) : (
                          <XCircle className="h-12 w-12 text-white" />
                        )}
                        
                        {/* Celebration particles for eligible */}
                        {eligibilityResult?.eligible && (
                          <>
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-emerald-400"
                                initial={{ x: 0, y: 0, opacity: 1 }}
                                animate={{
                                  x: Math.cos((i * Math.PI * 2) / 8) * 60,
                                  y: Math.sin((i * Math.PI * 2) / 8) * 60,
                                  opacity: 0,
                                  scale: 0,
                                }}
                                transition={{ duration: 1, delay: 0.5 }}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h2 
                      className="text-2xl font-bold text-center mb-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {eligibilityResult?.eligible 
                        ? "🎉 مبروك! أنت مؤهل للتمويل" 
                        : "للأسف، لست مؤهلاً حالياً"}
                    </motion.h2>

                    {/* Score */}
                    {eligibilityResult && (
                      <ScoreReveal score={eligibilityResult.score} eligible={eligibilityResult.eligible} />
                    )}

                    {/* Reasons */}
                    {eligibilityResult && eligibilityResult.reasons.length > 0 && (
                      <motion.div 
                        className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-400">
                          <AlertTriangle className="h-5 w-5" />
                          الملاحظات:
                        </h3>
                        <ul className="space-y-3">
                          {eligibilityResult.reasons.map((reason, index) => (
                            <motion.li 
                              key={index} 
                              className="flex items-start gap-3 text-sm text-muted-foreground"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + index * 0.1 }}
                            >
                              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                              {reason}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}

                    {/* Recommendations */}
                    {eligibilityResult && eligibilityResult.recommendations.length > 0 && (
                      <motion.div 
                        className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-400">
                          <Sparkles className="h-5 w-5" />
                          التوصيات:
                        </h3>
                        <ul className="space-y-3">
                          {eligibilityResult.recommendations.map((rec, index) => (
                            <motion.li 
                              key={index} 
                              className="flex items-start gap-3 text-sm text-muted-foreground"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.8 + index * 0.1 }}
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              {rec}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div 
                      className="flex flex-wrap justify-center gap-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      {eligibilityResult?.eligible ? (
                        <>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              asChild
                              size="lg"
                              className="h-14 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                            >
                              <Link to="/dashboard/financing/apply">
                                <Sparkles className="h-5 w-5 ml-2" />
                                تقديم طلب التمويل الآن
                              </Link>
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              asChild
                              size="lg"
                              variant="outline"
                              className="h-14 px-8 rounded-xl"
                            >
                              <Link to="/dashboard/financing/calculator">
                                <CreditCard className="h-5 w-5 ml-2" />
                                حاسبة التمويل
                              </Link>
                            </Button>
                          </motion.div>
                        </>
                      ) : (
                        <>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              onClick={resetForm}
                              size="lg"
                              variant="outline"
                              className="h-14 px-8 rounded-xl"
                            >
                              <Clock className="h-5 w-5 ml-2" />
                              إعادة التحقق
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              asChild
                              size="lg"
                              variant="outline"
                              className="h-14 px-8 rounded-xl"
                            >
                              <Link to="/dashboard/financing/guide">
                                <FileText className="h-5 w-5 ml-2" />
                                تعليمات التمويل
                              </Link>
                            </Button>
                          </motion.div>
                        </>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back Button */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button asChild variant="ghost" className="text-muted-foreground">
              <Link to="/dashboard/financing">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة للتمويل
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </ClientDashboardLayout>
  );
}
