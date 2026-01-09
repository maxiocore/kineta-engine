/**
 * Step 3: Amount and Tenor Selection
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  ArrowRight,
  Banknote,
  Calendar,
  Info
} from "lucide-react";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface AmountTenorStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
  validationErrors: string[];
}

const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 100000;
const STEP_AMOUNT = 500;

const TENOR_OPTIONS = [
  { months: 3, label: "3 أشهر" },
  { months: 6, label: "6 أشهر" },
  { months: 9, label: "9 أشهر" },
  { months: 12, label: "12 شهر" },
  { months: 18, label: "18 شهر" },
  { months: 24, label: "24 شهر" },
];

export function AmountTenorStep({ 
  data, 
  updateData, 
  goNext, 
  goBack,
  validationErrors 
}: AmountTenorStepProps) {
  const [localAmount, setLocalAmount] = useState(data.amount || MIN_AMOUNT);

  // Sync local amount with data
  useEffect(() => {
    const timer = setTimeout(() => {
      updateData({ amount: localAmount });
    }, 300);
    return () => clearTimeout(timer);
  }, [localAmount, updateData]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ar-SA").format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">حدد مبلغ ومدة التمويل</h2>
        <p className="text-muted-foreground">
          اختر المبلغ المطلوب وفترة السداد المناسبة
        </p>
      </div>

      {/* Amount Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <Label className="text-base font-semibold">مبلغ التمويل</Label>
                <p className="text-xs text-muted-foreground">
                  من {formatAmount(MIN_AMOUNT)} إلى {formatAmount(MAX_AMOUNT)} ر.س
                </p>
              </div>
            </div>

            {/* Amount Display */}
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-primary">
                {formatAmount(localAmount)}
                <span className="text-lg text-muted-foreground mr-2">ر.س</span>
              </div>
            </div>

            {/* Amount Slider */}
            <div className="px-2">
              <Slider
                value={[localAmount]}
                onValueChange={([value]) => setLocalAmount(value)}
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step={STEP_AMOUNT}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{formatAmount(MIN_AMOUNT)} ر.س</span>
                <span>{formatAmount(MAX_AMOUNT)} ر.س</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[5000, 10000, 25000, 50000].map((amount) => (
                <Button
                  key={amount}
                  variant={localAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocalAmount(amount)}
                  className="text-xs"
                >
                  {formatAmount(amount)}
                </Button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={localAmount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || MIN_AMOUNT;
                  setLocalAmount(Math.min(Math.max(val, MIN_AMOUNT), MAX_AMOUNT));
                }}
                className="text-center"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
              />
              <span className="text-muted-foreground">ر.س</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tenor Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
                  اختر المدة المناسبة لقدرتك المالية
                </p>
              </div>
            </div>

            {/* Tenor Options */}
            <div className="grid grid-cols-3 gap-2">
              {TENOR_OPTIONS.map((option) => {
                const isSelected = data.tenorMonths === option.months;
                
                return (
                  <Button
                    key={option.months}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => updateData({ tenorMonths: option.months })}
                    className={`h-14 flex-col gap-0.5 ${
                      isSelected 
                        ? "bg-gradient-to-l from-emerald-600 to-teal-600" 
                        : ""
                    }`}
                  >
                    <span className="text-lg font-bold">{option.months}</span>
                    <span className="text-xs opacity-80">شهر</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10"
      >
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          كلما زادت مدة السداد، قل مبلغ القسط الشهري. سيتم عرض تفاصيل الأقساط في الخطوة التالية.
        </p>
      </motion.div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="text-sm text-destructive space-y-1">
          {validationErrors.map((error, index) => (
            <p key={index}>• {error}</p>
          ))}
        </div>
      )}

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
          disabled={localAmount < MIN_AMOUNT || !data.tenorMonths}
          className="flex-1 h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <span>التالي</span>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
