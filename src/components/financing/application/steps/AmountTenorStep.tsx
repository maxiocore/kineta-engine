/**
 * Step 3: Amount and Tenor Selection
 * Premium Fintech · RTL · iOS-first
 * Business Logic: UNCHANGED
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Calendar,
  Info,
  AlertTriangle,
  TrendingUp,
  Check,
  Sparkles,
} from "lucide-react";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface AmountTenorStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
  validationErrors: string[];
}

interface UserLimits {
  minAmount: number;
  maxAmount: number;
  maxTenor: number;
  downPaymentPercent: number | null;
  approvedLimit: number;
}

const DEFAULT_LIMITS: UserLimits = {
  minAmount: 1000,
  maxAmount: 75000,
  maxTenor: 24,
  downPaymentPercent: null,
  approvedLimit: 75000,
};

const STEP_AMOUNT = 500;

const TENOR_OPTIONS = [
  { months: 3, label: "3 أشهر" },
  { months: 6, label: "6 أشهر" },
  { months: 9, label: "9 أشهر" },
  { months: 12, label: "12 شهر" },
  { months: 18, label: "18 شهر" },
  { months: 24, label: "24 شهر" },
];

function calculateInstallment(amount: number, months: number, adminFeePercent = 1.5) {
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
  validationErrors,
}: AmountTenorStepProps) {
  const [localAmount, setLocalAmount] = useState(data.amount || DEFAULT_LIMITS.minAmount);
  const [inputValue, setInputValue] = useState(String(data.amount || DEFAULT_LIMITS.minAmount));
  const [isAtLimit, setIsAtLimit] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  const limits = DEFAULT_LIMITS;

  const installmentInfo = useMemo(() => {
    return calculateInstallment(localAmount, data.tenorMonths || 3);
  }, [localAmount, data.tenorMonths]);

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

  useEffect(() => {
    const atMax = localAmount >= limits.maxAmount;
    setIsAtLimit(atMax);
    if (atMax && !showLimitWarning) {
      setShowLimitWarning(true);
      setTimeout(() => setShowLimitWarning(false), 3000);
    }
  }, [localAmount, limits.maxAmount]);

  const formatAmount = (amount: number) => new Intl.NumberFormat("ar-SA").format(amount);

  const handleSliderChange = ([value]: number[]) => {
    setLocalAmount(value);
    setInputValue(String(value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    setInputValue(rawValue);
    const numValue = parseInt(rawValue) || limits.minAmount;
    const clampedValue = Math.min(Math.max(numValue, limits.minAmount), limits.maxAmount);
    setLocalAmount(clampedValue);
  };

  const handleInputBlur = () => setInputValue(String(localAmount));

  const quickAmounts = useMemo(() => {
    const amounts = [];
    const step = limits.maxAmount / 4;
    for (let i = 1; i <= 4; i++) {
      const amount = Math.round((step * i) / 1000) * 1000;
      if (amount <= limits.maxAmount && amount >= limits.minAmount) amounts.push(amount);
    }
    return amounts.slice(0, 4);
  }, [limits]);

  const availableTenors = TENOR_OPTIONS.filter(t => t.months <= limits.maxTenor);
  const isHardBlocked = localAmount > limits.maxAmount;
  const progressPercent = ((localAmount - limits.minAmount) / (limits.maxAmount - limits.minAmount)) * 100;

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-2 bg-blue-500/8 border border-blue-500/15 rounded-xl text-sm"
      >
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-blue-600 dark:text-blue-400 text-xs">
          قيمة التمويل = قيمة الخدمات المختارة • الدفع مباشرة لمزود الخدمة
        </span>
      </motion.div>

      {/* Header */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/8 rounded-full text-primary text-xs font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>الحد المتاح: {formatAmount(limits.approvedLimit)} ر.س</span>
        </div>
        <h2 className="text-2xl font-bold">حدد قيمة الخدمات ومدة السداد</h2>
      </motion.div>

      {/* Amount Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`border-border/40 bg-card/60 transition-colors ${isHardBlocked ? "border-destructive/40" : ""}`}>
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAtLimit ? "bg-amber-500/10" : "bg-primary/10"}`}>
                  <Banknote className={`w-4.5 h-4.5 ${isAtLimit ? "text-amber-500" : "text-primary"}`} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">قيمة الخدمات</Label>
                  <p className="text-[11px] text-muted-foreground">
                    {formatAmount(limits.minAmount)} - {formatAmount(limits.maxAmount)} ر.س
                  </p>
                </div>
              </div>
              <span className={`text-xs font-medium ${progressPercent > 90 ? "text-amber-500" : "text-muted-foreground"}`}>
                {Math.round(progressPercent)}%
              </span>
            </div>

            {/* Big Amount Display */}
            <motion.div
              className="text-center py-4"
              key={localAmount}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={`text-4xl sm:text-5xl font-bold tracking-tight transition-colors ${
                isHardBlocked ? "text-destructive" : isAtLimit ? "text-amber-500" : "text-primary"
              }`}>
                {formatAmount(localAmount)}
              </div>
              <span className="text-sm text-muted-foreground">ريال سعودي</span>

              <AnimatePresence>
                {showLimitWarning && isAtLimit && !isHardBlocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-2 flex justify-center"
                  >
                    <span className="px-2.5 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      وصلت للحد الأقصى
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Slider */}
            <div className="px-1 space-y-2">
              <Slider
                value={[localAmount]}
                onValueChange={handleSliderChange}
                min={limits.minAmount}
                max={limits.maxAmount}
                step={STEP_AMOUNT}
                className="w-full"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{formatAmount(limits.minAmount)}</span>
                <span>{formatAmount(limits.maxAmount)}</span>
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={localAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setLocalAmount(amount);
                    setInputValue(String(amount));
                  }}
                  className={`text-xs ${localAmount === amount ? "shadow-sm shadow-primary/20" : ""}`}
                >
                  {formatAmount(amount)}
                </Button>
              ))}
            </div>

            {/* Precise Input */}
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="text-center text-lg font-semibold pl-12 h-12"
                placeholder={String(limits.minAmount)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">ر.س</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hard Block Warning */}
      <AnimatePresence>
        {isHardBlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-destructive/8 border-destructive/25">
              <CardContent className="p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">تجاوزت الحد المسموح</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    الحد الأقصى المتاح لك هو {formatAmount(limits.maxAmount)} ر.س
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tenor Section */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5 text-blue-500" />
              </div>
              <div>
                <Label className="text-sm font-semibold">مدة السداد</Label>
                <p className="text-[11px] text-muted-foreground">الحد الأقصى: {limits.maxTenor} شهر</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {availableTenors.map((option) => {
                const isSelected = data.tenorMonths === option.months;
                const tenorInstallment = calculateInstallment(localAmount, option.months);
                return (
                  <Button
                    key={option.months}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => updateData({ tenorMonths: option.months })}
                    className={`h-auto flex-col gap-0.5 py-3 ${
                      isSelected ? "shadow-sm shadow-primary/20" : ""
                    }`}
                  >
                    <span className="text-lg font-bold">{option.months}</span>
                    <span className="text-[10px] opacity-70">شهر</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">
                      {formatAmount(tenorInstallment.monthlyInstallment)}/شهر
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Live Preview */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-primary/5 border-primary/15">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">القسط الشهري المتوقع</span>
              <span className="flex items-center gap-1 text-xs text-primary">
                <Check className="w-3 h-3" />
                تحديث مباشر
              </span>
            </div>
            <motion.div
              key={`${localAmount}-${data.tenorMonths}`}
              initial={{ opacity: 0.5, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-primary">
                {formatAmount(installmentInfo.monthlyInstallment)}
                <span className="text-base text-muted-foreground mr-1">ر.س/شهر</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={goBack} className="flex-1 h-12 gap-2">
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </Button>
        <Button
          onClick={goNext}
          disabled={isHardBlocked || localAmount < limits.minAmount}
          className="flex-1 h-12 gap-2 bg-gradient-to-l from-primary to-primary/90 shadow-lg shadow-primary/15 disabled:shadow-none"
        >
          <span>التالي</span>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
