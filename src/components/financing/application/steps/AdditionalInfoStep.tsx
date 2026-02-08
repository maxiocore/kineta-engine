/**
 * Step 5: Additional Information (Optional)
 * Premium Fintech · RTL · iOS-first
 * Business Logic: UNCHANGED
 */

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  SkipForward,
  Info,
} from "lucide-react";
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

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export function AdditionalInfoStep({
  data,
  updateData,
  goNext,
  goBack,
  validationErrors,
}: AdditionalInfoStepProps) {
  const formatAmount = (amount: number) => new Intl.NumberFormat("ar-SA").format(amount);

  return (
    <motion.div className="space-y-6" variants={stagger} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={fadeUp} className="text-center space-y-2">
        <Badge variant="secondary" className="gap-1.5">
          <Info className="w-3 h-3" />
          معلومات اختيارية
        </Badge>
        <h2 className="text-2xl font-bold">معلومات إضافية</h2>
        <p className="text-muted-foreground text-sm">
          اختيارية، لكنها تساعد في تسريع دراسة طلبك
        </p>
      </motion.div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Purpose */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <Label className="font-semibold text-sm">الغرض من التمويل</Label>
              </div>
              <Textarea
                placeholder="صف باختصار الغرض من طلب التمويل..."
                value={data.purpose}
                onChange={(e) => updateData({ purpose: e.target.value })}
                className="resize-none h-20 bg-background/50"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Employment */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <Label className="font-semibold text-sm">نوع العمل</Label>
              </div>
              <Select
                value={data.employmentType}
                onValueChange={(value) => updateData({ employmentType: value })}
              >
                <SelectTrigger className="bg-background/50">
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Income */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <Label className="font-semibold text-sm">الدخل الشهري التقريبي</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={data.monthlyIncome || ""}
                  onChange={(e) => updateData({ monthlyIncome: parseInt(e.target.value) || 0 })}
                  className="text-right bg-background/50"
                />
                <span className="text-muted-foreground whitespace-nowrap text-sm">ر.س / شهر</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[5000, 10000, 15000, 20000].map((amount) => (
                  <Button
                    key={amount}
                    variant={data.monthlyIncome === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateData({ monthlyIncome: amount })}
                    className="text-xs"
                  >
                    {formatAmount(amount)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Errors */}
      {validationErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-destructive space-y-1 bg-destructive/5 p-3 rounded-lg border border-destructive/20"
        >
          {validationErrors.map((error, index) => (
            <p key={index}>• {error}</p>
          ))}
        </motion.div>
      )}

      {/* Navigation */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex gap-3">
          <Button variant="outline" onClick={goBack} className="flex-1 h-12 gap-2">
            <ArrowRight className="w-4 h-4" />
            <span>رجوع</span>
          </Button>
          <Button
            onClick={goNext}
            className="flex-1 h-12 gap-2 bg-gradient-to-l from-primary to-primary/90 shadow-lg shadow-primary/15"
          >
            <span>التالي</span>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
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
  );
}
