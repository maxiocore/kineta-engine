/**
 * Step 4: Installment Simulator
 * Premium UI with animated numbers, tooltips, and skeleton loading
 */

import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ArrowLeft,
  ArrowRight,
  Calculator,
  Receipt,
  Percent,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Wallet,
  CalendarDays,
  BadgePercent,
  Sparkles,
  CheckCircle2,
  PiggyBank,
  FileText
} from "lucide-react";
import { AnimatedButton } from "../animations";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface InstallmentSimulatorStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
}

// Fee calculation constants
const ADMIN_FEE_PERCENT = 1.5;
const VAT_PERCENT = 15;
const PROFIT_RATE = 0; // 0% for Murabaha-style (no interest)

// Animated counter component
function AnimatedNumber({ 
  value, 
  duration = 0.5,
  formatOptions = {} 
}: { 
  value: number; 
  duration?: number;
  formatOptions?: Intl.NumberFormatOptions;
}) {
  const springValue = useSpring(value, { 
    stiffness: 100, 
    damping: 30, 
    duration: duration * 1000 
  });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <span>
      {new Intl.NumberFormat("ar-SA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...formatOptions,
      }).format(displayValue)}
    </span>
  );
}

// Info item with tooltip
function InfoItem({ 
  icon: Icon, 
  label, 
  value, 
  tooltip,
  highlight = false,
  isLoading = false
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tooltip: string;
  highlight?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-3 px-4 rounded-xl transition-all ${
      highlight ? 'bg-primary/5 border border-primary/10' : 'bg-muted/30'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          highlight ? 'bg-primary/10' : 'bg-background'
        }`}>
          <Icon className={`w-4 h-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm ${highlight ? 'font-medium' : ''}`}>{label}</span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px] text-center">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {isLoading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <motion.span 
          className={`font-semibold ${highlight ? 'text-primary' : ''}`}
          key={value}
          initial={{ opacity: 0.5, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatedNumber value={value} /> ر.س
        </motion.span>
      )}
    </div>
  );
}

export function InstallmentSimulatorStep({ 
  data, 
  updateData, 
  goNext, 
  goBack 
}: InstallmentSimulatorStepProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const prevDataRef = useRef({ amount: data.amount, tenorMonths: data.tenorMonths });

  // Simulate calculation delay for better UX
  useEffect(() => {
    if (
      prevDataRef.current.amount !== data.amount || 
      prevDataRef.current.tenorMonths !== data.tenorMonths
    ) {
      setIsCalculating(true);
      const timer = setTimeout(() => {
        setIsCalculating(false);
      }, 400);
      prevDataRef.current = { amount: data.amount, tenorMonths: data.tenorMonths };
      return () => clearTimeout(timer);
    }
  }, [data.amount, data.tenorMonths]);

  // Calculate installment details
  const calculations = useMemo(() => {
    const principal = data.amount;
    const months = data.tenorMonths;
    
    // Admin fee
    const adminFee = (principal * ADMIN_FEE_PERCENT) / 100;
    const vatOnFee = (adminFee * VAT_PERCENT) / 100;
    const totalFees = adminFee + vatOnFee;
    
    // Profit (if applicable - for display purposes)
    const profitAmount = (principal * PROFIT_RATE) / 100;
    
    // Total amount to repay
    const totalAmount = principal + totalFees + profitAmount;
    
    // Monthly installment
    const monthlyInstallment = totalAmount / months;
    
    // Effective annual rate (for transparency)
    const effectiveRate = ((totalFees / principal) / (months / 12)) * 100;
    
    return {
      principal,
      months,
      adminFee,
      vatOnFee,
      totalFees,
      profitAmount,
      totalAmount,
      monthlyInstallment,
      effectiveRate,
    };
  }, [data.amount, data.tenorMonths]);

  // Update parent data with calculations
  useEffect(() => {
    updateData({
      monthlyInstallment: calculations.monthlyInstallment,
      totalAmount: calculations.totalAmount,
      fees: calculations.totalFees,
    });
  }, [calculations, updateData]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm">
          <Calculator className="w-4 h-4" />
          <span>محاكاة التمويل</span>
        </div>
        <h2 className="text-2xl font-bold">تفاصيل التمويل والأقساط</h2>
        <p className="text-muted-foreground text-sm">
          كل المعلومات واضحة وشفافة بدون رسوم مخفية
        </p>
      </motion.div>

      {/* Hero Card - Monthly Installment */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/5 border-emerald-500/30 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl" />
          </div>
          
          <CardContent className="p-6 relative z-10">
            {/* Monthly Installment - Main Focus */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                <p className="text-sm text-muted-foreground">القسط الشهري</p>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">المبلغ الذي ستدفعه كل شهر حتى نهاية فترة التمويل</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <AnimatePresence mode="wait">
                {isCalculating ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center"
                  >
                    <Skeleton className="h-14 w-48" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="value"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-5xl font-bold text-primary tracking-tight"
                  >
                    <AnimatedNumber value={calculations.monthlyInstallment} />
                    <span className="text-lg text-muted-foreground mr-2">ر.س</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                className="mt-3 flex items-center justify-center gap-4 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  <span>{calculations.months} شهر</span>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>بدون فوائد</span>
                </span>
              </motion.div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-xl p-3 text-center border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">إجمالي السداد</p>
                {isCalculating ? (
                  <Skeleton className="h-6 w-20 mx-auto" />
                ) : (
                  <p className="font-bold text-lg">
                    <AnimatedNumber value={calculations.totalAmount} />
                    <span className="text-xs text-muted-foreground mr-1">ر.س</span>
                  </p>
                )}
              </div>
              <div className="bg-background/50 rounded-xl p-3 text-center border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">التكلفة الإضافية</p>
                {isCalculating ? (
                  <Skeleton className="h-6 w-20 mx-auto" />
                ) : (
                  <p className="font-bold text-lg">
                    <AnimatedNumber value={calculations.totalFees} />
                    <span className="text-xs text-muted-foreground mr-1">ر.س</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">تفاصيل الحساب</h3>
              <span className="text-xs text-muted-foreground">(كل شيء شفاف)</span>
            </div>

            <div className="space-y-2">
              <InfoItem
                icon={PiggyBank}
                label="مبلغ التمويل الأصلي"
                value={calculations.principal}
                tooltip="المبلغ الذي طلبته للتمويل بدون أي رسوم إضافية"
                isLoading={isCalculating}
              />
              
              <InfoItem
                icon={Receipt}
                label={`رسوم إدارية (${ADMIN_FEE_PERCENT}%)`}
                value={calculations.adminFee}
                tooltip="رسوم معالجة الطلب والخدمات الإدارية - تُحسب مرة واحدة فقط"
                isLoading={isCalculating}
              />
              
              <InfoItem
                icon={Percent}
                label={`ضريبة القيمة المضافة (${VAT_PERCENT}%)`}
                value={calculations.vatOnFee}
                tooltip="الضريبة المضافة على الرسوم الإدارية فقط وليس على مبلغ التمويل"
                isLoading={isCalculating}
              />

              {PROFIT_RATE > 0 && (
                <InfoItem
                  icon={TrendingUp}
                  label={`هامش الربح (${PROFIT_RATE}%)`}
                  value={calculations.profitAmount}
                  tooltip="نسبة الربح المتفق عليها - متوافقة مع أحكام الشريعة الإسلامية"
                  isLoading={isCalculating}
                />
              )}

              <Separator className="my-3" />

              <InfoItem
                icon={Wallet}
                label="إجمالي المبلغ المستحق"
                value={calculations.totalAmount}
                tooltip="المبلغ الكلي الذي ستسدده على مدار فترة التمويل"
                highlight={true}
                isLoading={isCalculating}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* APR/Rate Transparency Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <BadgePercent className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">معدل التكلفة الفعلي</h4>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px]">
                        <p className="text-xs">
                          هذا المعدل يوضح التكلفة الإجمالية للتمويل كنسبة سنوية، ويساعدك على المقارنة بين عروض التمويل المختلفة
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-baseline gap-2">
                  {isCalculating ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <span className="text-2xl font-bold text-blue-500">
                      {calculations.effectiveRate.toFixed(2)}%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">سنوياً</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  يشمل جميع الرسوم والتكاليف الإدارية
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Schedule Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                جدول السداد المتوقع
              </h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {calculations.months} قسط
              </span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
              {Array.from({ length: Math.min(calculations.months, 4) }).map((_, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">
                      القسط {index + 1}
                    </span>
                  </div>
                  {isCalculating ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    <span className="font-medium">
                      {formatAmount(calculations.monthlyInstallment)} ر.س
                    </span>
                  )}
                </motion.div>
              ))}
              
              {calculations.months > 4 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center py-3 text-sm text-muted-foreground flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>و {calculations.months - 4} أقساط أخرى بنفس القيمة</span>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10"
      >
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
            ملاحظة مهمة
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            هذه محاكاة تقديرية للتوضيح فقط. المبالغ والرسوم النهائية قد تختلف بناءً على نتيجة دراسة الطلب والتقييم الائتماني. سيتم تأكيد التفاصيل النهائية قبل التوقيع على العقد.
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div 
        className="flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <AnimatedButton
          variant="outline"
          onClick={goBack}
          className="flex-1 h-12 gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تعديل المبلغ</span>
        </AnimatedButton>
        
        <AnimatedButton
          onClick={goNext}
          pulseOnHover
          className="flex-1 h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <span>موافق، التالي</span>
          <ArrowLeft className="w-4 h-4" />
        </AnimatedButton>
      </motion.div>
    </div>
  );
}
