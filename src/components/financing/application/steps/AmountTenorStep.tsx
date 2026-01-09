/**
 * Step 3: Amount and Tenor Selection
 * Premium UX with live installment updates, limits, and mobile-friendly design
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  ArrowRight,
  Banknote,
  Calendar,
  Info,
  AlertTriangle,
  TrendingUp,
  Shield,
  Sparkles,
  Check
} from "lucide-react";
import { AnimatedButton, AnimatedCard } from "../animations";
import { Button } from "@/components/ui/button";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface AmountTenorStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
  validationErrors: string[];
}

// User eligibility limits (would come from eligibility check in production)
interface UserLimits {
  minAmount: number;
  maxAmount: number;
  maxTenor: number;
  downPaymentPercent: number | null;
  approvedLimit: number;
}

const DEFAULT_LIMITS: UserLimits = {
  minAmount: 1000,
  maxAmount: 75000, // User's approved max based on eligibility
  maxTenor: 24,
  downPaymentPercent: null,
  approvedLimit: 75000,
};

const STEP_AMOUNT = 500;

const TENOR_OPTIONS = [
  { months: 3, label: "3 أشهر", icon: "⚡" },
  { months: 6, label: "6 أشهر", icon: "🎯" },
  { months: 9, label: "9 أشهر", icon: "📊" },
  { months: 12, label: "12 شهر", icon: "📅" },
  { months: 18, label: "18 شهر", icon: "🔄" },
  { months: 24, label: "24 شهر", icon: "🏆" },
];

// Calculate monthly installment (simplified)
function calculateInstallment(amount: number, months: number, adminFeePercent = 1.5): {
  monthlyInstallment: number;
  totalAmount: number;
  adminFee: number;
} {
  const adminFee = amount * (adminFeePercent / 100);
  const totalAmount = amount + adminFee;
  const monthlyInstallment = totalAmount / months;
  
  return {
    monthlyInstallment: Math.ceil(monthlyInstallment),
    totalAmount: Math.ceil(totalAmount),
    adminFee: Math.ceil(adminFee),
  };
}

export function AmountTenorStep({ 
  data, 
  updateData, 
  goNext, 
  goBack,
  validationErrors 
}: AmountTenorStepProps) {
  const [localAmount, setLocalAmount] = useState(data.amount || DEFAULT_LIMITS.minAmount);
  const [inputValue, setInputValue] = useState(String(data.amount || DEFAULT_LIMITS.minAmount));
  const [isAtLimit, setIsAtLimit] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  
  // User limits (in production, fetch from eligibility API)
  const limits = DEFAULT_LIMITS;
  
  // Calculate live installment
  const installmentInfo = useMemo(() => {
    return calculateInstallment(localAmount, data.tenorMonths || 3);
  }, [localAmount, data.tenorMonths]);

  // Sync local amount with data (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateData({ 
        amount: localAmount,
        monthlyInstallment: installmentInfo.monthlyInstallment,
        totalAmount: installmentInfo.totalAmount,
        fees: installmentInfo.adminFee,
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [localAmount, installmentInfo, updateData]);

  // Check if at limit
  useEffect(() => {
    const atMax = localAmount >= limits.maxAmount;
    setIsAtLimit(atMax);
    if (atMax && !showLimitWarning) {
      setShowLimitWarning(true);
      setTimeout(() => setShowLimitWarning(false), 3000);
    }
  }, [localAmount, limits.maxAmount]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ar-SA").format(amount);
  };

  const handleSliderChange = ([value]: number[]) => {
    setLocalAmount(value);
    setInputValue(String(value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    setInputValue(rawValue);
    
    const numValue = parseInt(rawValue) || limits.minAmount;
    const clampedValue = Math.min(Math.max(numValue, limits.minAmount), limits.maxAmount);
    setLocalAmount(clampedValue);
  };

  const handleInputBlur = () => {
    setInputValue(String(localAmount));
  };

  const quickAmounts = useMemo(() => {
    const amounts = [];
    const step = limits.maxAmount / 4;
    for (let i = 1; i <= 4; i++) {
      const amount = Math.round((step * i) / 1000) * 1000;
      if (amount <= limits.maxAmount && amount >= limits.minAmount) {
        amounts.push(amount);
      }
    }
    return amounts.slice(0, 4);
  }, [limits]);

  const availableTenors = TENOR_OPTIONS.filter(t => t.months <= limits.maxTenor);

  const isHardBlocked = localAmount > limits.maxAmount;
  const progressPercent = ((localAmount - limits.minAmount) / (limits.maxAmount - limits.minAmount)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full text-emerald-500 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>الحد المتاح: {formatAmount(limits.approvedLimit)} ر.س</span>
        </div>
        <h2 className="text-2xl font-bold">حدد مبلغ ومدة التمويل</h2>
        <p className="text-muted-foreground text-sm">
          اختر المبلغ المناسب وستظهر لك تفاصيل القسط مباشرة
        </p>
      </motion.div>

      {/* Amount Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`bg-card/50 border-border/50 transition-all duration-300 ${
          isHardBlocked ? 'border-destructive/50 bg-destructive/5' : ''
        }`}>
          <CardContent className="p-5 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isAtLimit ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                }`}>
                  <Banknote className={`w-5 h-5 transition-colors ${
                    isAtLimit ? 'text-amber-500' : 'text-emerald-500'
                  }`} />
                </div>
                <div>
                  <Label className="text-base font-semibold">مبلغ التمويل</Label>
                  <p className="text-xs text-muted-foreground">
                    الحد: {formatAmount(limits.minAmount)} - {formatAmount(limits.maxAmount)} ر.س
                  </p>
                </div>
              </div>
              
              {/* Usage indicator */}
              <div className="text-left">
                <span className={`text-xs font-medium ${
                  progressPercent > 90 ? 'text-amber-500' : 'text-muted-foreground'
                }`}>
                  {Math.round(progressPercent)}% من الحد
                </span>
              </div>
            </div>

            {/* Amount Display - Big & Bold */}
            <motion.div 
              className="text-center py-6 relative"
              key={localAmount}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={`text-5xl font-bold tracking-tight transition-colors ${
                isHardBlocked ? 'text-destructive' : isAtLimit ? 'text-amber-500' : 'text-primary'
              }`}>
                {formatAmount(localAmount)}
              </div>
              <span className="text-lg text-muted-foreground">ريال سعودي</span>
              
              {/* Limit reached feedback */}
              <AnimatePresence>
                {showLimitWarning && isAtLimit && !isHardBlocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-x-0 -bottom-2 flex justify-center"
                  >
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-xs rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      وصلت للحد الأقصى المتاح لك
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Amount Slider */}
            <div className="px-2 space-y-3">
              <div className="relative">
                <Slider
                  value={[localAmount]}
                  onValueChange={handleSliderChange}
                  min={limits.minAmount}
                  max={limits.maxAmount}
                  step={STEP_AMOUNT}
                  className="w-full"
                />
                {/* Progress overlay for visual feedback */}
                <div 
                  className="absolute top-1/2 right-0 h-1 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none -translate-y-1/2 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatAmount(limits.minAmount)}</span>
                <span>{formatAmount(limits.maxAmount)}</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <motion.div key={amount} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={localAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setLocalAmount(amount);
                      setInputValue(String(amount));
                    }}
                    className={`text-xs w-full transition-all ${
                      localAmount === amount 
                        ? 'bg-gradient-to-l from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20' 
                        : 'hover:border-emerald-500/50'
                    }`}
                  >
                    {formatAmount(amount)}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Precise Input */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className="text-center text-lg font-semibold pl-12"
                  placeholder={String(limits.minAmount)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ر.س
                </span>
              </div>
            </div>

            {/* Down Payment Notice (if applicable) */}
            {limits.downPaymentPercent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10"
              >
                <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  الدفعة الأولى المطلوبة: <strong className="text-foreground">{limits.downPaymentPercent}%</strong> ({formatAmount(localAmount * limits.downPaymentPercent / 100)} ر.س)
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Hard Block Warning */}
      <AnimatePresence>
        {isHardBlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">تجاوزت الحد المسموح</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    الحد الأقصى المتاح لك هو {formatAmount(limits.maxAmount)} ر.س بناءً على تقييم الأهلية.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tenor Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <Label className="text-base font-semibold">مدة السداد</Label>
                <p className="text-xs text-muted-foreground">
                  الحد الأقصى: {limits.maxTenor} شهر
                </p>
              </div>
            </div>

            {/* Tenor Grid */}
            <div className="grid grid-cols-3 gap-2">
              {availableTenors.map((option, index) => {
                const isSelected = data.tenorMonths === option.months;
                const tenorInstallment = calculateInstallment(localAmount, option.months);
                
                return (
                  <motion.div
                    key={option.months}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => updateData({ tenorMonths: option.months })}
                      className={`h-auto w-full flex-col gap-1 py-3 transition-all ${
                        isSelected 
                          ? "bg-gradient-to-l from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20" 
                          : "hover:border-emerald-500/50"
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-lg font-bold">{option.months}</span>
                      <span className="text-[10px] opacity-80">شهر</span>
                      <span className="text-[10px] font-medium opacity-90 mt-1">
                        {formatAmount(tenorInstallment.monthlyInstallment)}/شهر
                      </span>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Live Installment Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-l from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">القسط الشهري المتوقع</span>
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <Check className="w-3 h-3" />
                تحديث مباشر
              </span>
            </div>
            
            <motion.div
              key={`${localAmount}-${data.tenorMonths}`}
              initial={{ opacity: 0.5, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-emerald-500">
                {formatAmount(installmentInfo.monthlyInstallment)}
                <span className="text-base text-muted-foreground mr-1">ر.س/شهر</span>
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
                <span>الإجمالي: {formatAmount(installmentInfo.totalAmount)} ر.س</span>
                <span>رسوم إدارية: {formatAmount(installmentInfo.adminFee)} ر.س</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10"
      >
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          هذه الحسابات تقديرية. سيتم عرض التفاصيل النهائية في خطوة المحاكاة.
        </p>
      </motion.div>

      {/* Validation Errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-destructive space-y-1"
          >
            {validationErrors.map((error, index) => (
              <p key={index}>• {error}</p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.div 
        className="flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <AnimatedButton
          variant="outline"
          onClick={goBack}
          className="flex-1 h-12 gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </AnimatedButton>
        
        <AnimatedButton
          onClick={goNext}
          disabled={isHardBlocked || localAmount < limits.minAmount || !data.tenorMonths}
          pulseOnHover
          className="flex-1 h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
        >
          <span>التالي</span>
          <ArrowLeft className="w-4 h-4" />
        </AnimatedButton>
      </motion.div>
    </div>
  );
}
