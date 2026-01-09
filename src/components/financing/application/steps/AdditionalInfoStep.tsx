/**
 * Step 5: Additional Information (Optional)
 * With Animation System
 */

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  ArrowRight,
  FileText,
  Briefcase,
  Wallet,
  SkipForward
} from "lucide-react";
import { AnimatedButton, AnimatedCard } from "../animations";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface AdditionalInfoStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
  validationErrors: string[];
}

const EMPLOYMENT_TYPES = [
  { value: "government", label: "موظف حكومي" },
  { value: "private", label: "موظف قطاع خاص" },
  { value: "self_employed", label: "عمل حر / مستقل" },
  { value: "business_owner", label: "صاحب عمل" },
  { value: "retired", label: "متقاعد" },
  { value: "other", label: "آخر" },
];

const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function AdditionalInfoStep({ 
  data, 
  updateData, 
  goNext, 
  goBack,
  validationErrors 
}: AdditionalInfoStepProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ar-SA").format(amount);
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-500 text-sm"
          whileHover={{ scale: 1.05 }}
        >
          <FileText className="w-4 h-4" />
          <span>معلومات اختيارية</span>
        </motion.div>
        <h2 className="text-2xl font-bold">معلومات إضافية</h2>
        <p className="text-muted-foreground">
          هذه المعلومات اختيارية ولكنها تساعد في تسريع دراسة طلبك
        </p>
      </motion.div>

      {/* Form */}
      <div className="space-y-4">
        {/* Purpose */}
        <AnimatedCard index={0} hoverEffect="border" showCheckmark={false}>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <Label className="font-semibold">الغرض من التمويل</Label>
            </div>
            <Textarea
              placeholder="صف باختصار الغرض من طلب التمويل..."
              value={data.purpose}
              onChange={(e) => updateData({ purpose: e.target.value })}
              className="resize-none h-24 transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </AnimatedCard>

        {/* Employment */}
        <AnimatedCard index={1} hoverEffect="border" showCheckmark={false}>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <Label className="font-semibold">نوع العمل</Label>
            </div>
            <Select
              value={data.employmentType}
              onValueChange={(value) => updateData({ employmentType: value })}
            >
              <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="اختر نوع العمل" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </AnimatedCard>

        {/* Monthly Income */}
        <AnimatedCard index={2} hoverEffect="border" showCheckmark={false}>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <Label className="font-semibold">الدخل الشهري التقريبي</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0"
                value={data.monthlyIncome || ""}
                onChange={(e) => updateData({ monthlyIncome: parseInt(e.target.value) || 0 })}
                className="text-right transition-all focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-muted-foreground whitespace-nowrap">ر.س / شهر</span>
            </div>
            
            {/* Quick Income Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[5000, 10000, 15000, 20000].map((amount, index) => (
                <motion.div 
                  key={amount}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={data.monthlyIncome === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateData({ monthlyIncome: amount })}
                    className={`text-xs w-full transition-all ${
                      data.monthlyIncome === amount 
                        ? "bg-gradient-to-l from-emerald-600 to-teal-600" 
                        : ""
                    }`}
                  >
                    {formatAmount(amount)}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-sm text-destructive space-y-1"
        >
          {validationErrors.map((error, index) => (
            <p key={index}>• {error}</p>
          ))}
        </motion.div>
      )}

      {/* Navigation */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex gap-3">
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
            pulseOnHover
            className="flex-1 h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            <span>التالي</span>
            <ArrowLeft className="w-4 h-4" />
          </AnimatedButton>
        </div>
        
        {/* Skip Option */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            onClick={goNext}
            className="w-full h-10 text-muted-foreground gap-2 hover:text-foreground"
          >
            <SkipForward className="w-4 h-4" />
            <span>تخطي هذه الخطوة</span>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
