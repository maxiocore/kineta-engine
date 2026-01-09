/**
 * Step 4: Installment Simulator
 */

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  ArrowRight,
  Calculator,
  Receipt,
  Percent,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface InstallmentSimulatorStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
}

// Fee calculation constants
const ADMIN_FEE_PERCENT = 1.5; // 1.5% admin fee
const VAT_PERCENT = 15; // 15% VAT on fees

export function InstallmentSimulatorStep({ 
  data, 
  updateData, 
  goNext, 
  goBack 
}: InstallmentSimulatorStepProps) {
  // Calculate installment details
  const calculations = useMemo(() => {
    const principal = data.amount;
    const months = data.tenorMonths;
    
    // Admin fee
    const adminFee = (principal * ADMIN_FEE_PERCENT) / 100;
    const vatOnFee = (adminFee * VAT_PERCENT) / 100;
    const totalFees = adminFee + vatOnFee;
    
    // Total amount to repay
    const totalAmount = principal + totalFees;
    
    // Monthly installment
    const monthlyInstallment = totalAmount / months;
    
    return {
      principal,
      months,
      adminFee,
      vatOnFee,
      totalFees,
      totalAmount,
      monthlyInstallment,
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
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm">
          <Calculator className="w-4 h-4" />
          <span>محاكاة الأقساط</span>
        </div>
        <h2 className="text-2xl font-bold">تفاصيل التمويل والأقساط</h2>
        <p className="text-muted-foreground">
          مراجعة تفصيلية للمبلغ والرسوم والأقساط الشهرية
        </p>
      </div>

      {/* Main Calculation Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
          <CardContent className="p-6">
            {/* Monthly Installment - Highlighted */}
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">القسط الشهري</p>
              <div className="text-5xl font-bold text-primary">
                {formatAmount(calculations.monthlyInstallment)}
                <span className="text-lg text-muted-foreground mr-2">ر.س</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                لمدة {calculations.months} شهر
              </p>
            </div>

            <Separator className="my-4" />

            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">مبلغ التمويل</span>
                </div>
                <span className="font-semibold">{formatAmount(calculations.principal)} ر.س</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">رسوم إدارية ({ADMIN_FEE_PERCENT}%)</span>
                </div>
                <span className="font-semibold">{formatAmount(calculations.adminFee)} ر.س</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">ضريبة القيمة المضافة ({VAT_PERCENT}%)</span>
                </div>
                <span className="font-semibold">{formatAmount(calculations.vatOnFee)} ر.س</span>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">إجمالي المبلغ</span>
                <span className="font-bold text-primary">
                  {formatAmount(calculations.totalAmount)} ر.س
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Schedule Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              جدول السداد
            </h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Array.from({ length: Math.min(calculations.months, 6) }).map((_, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg text-sm"
                >
                  <span className="text-muted-foreground">
                    القسط {index + 1}
                  </span>
                  <span className="font-medium">
                    {formatAmount(calculations.monthlyInstallment)} ر.س
                  </span>
                </div>
              ))}
              
              {calculations.months > 6 && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  ... و {calculations.months - 6} أقساط أخرى بنفس القيمة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-start gap-2 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10"
      >
        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">تنبيه:</strong> هذه محاكاة تقديرية. المبلغ النهائي قد يختلف بناءً على نتيجة دراسة الطلب والموافقة عليه.
        </p>
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={goBack}
          className="flex-1 h-12 gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </Button>
        
        <Button
          onClick={goNext}
          className="flex-1 h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <span>التالي</span>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
