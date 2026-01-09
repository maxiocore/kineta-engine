/**
 * Step 5: Additional Information (Optional)
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-500 text-sm">
          <FileText className="w-4 h-4" />
          <span>معلومات اختيارية</span>
        </div>
        <h2 className="text-2xl font-bold">معلومات إضافية</h2>
        <p className="text-muted-foreground">
          هذه المعلومات اختيارية ولكنها تساعد في تسريع دراسة طلبك
        </p>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Purpose */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <Label className="font-semibold">الغرض من التمويل</Label>
            </div>
            <Textarea
              placeholder="صف باختصار الغرض من طلب التمويل..."
              value={data.purpose}
              onChange={(e) => updateData({ purpose: e.target.value })}
              className="resize-none h-24"
            />
          </CardContent>
        </Card>

        {/* Employment */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <Label className="font-semibold">نوع العمل</Label>
            </div>
            <Select
              value={data.employmentType}
              onValueChange={(value) => updateData({ employmentType: value })}
            >
              <SelectTrigger>
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

        {/* Monthly Income */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
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
                className="text-right"
              />
              <span className="text-muted-foreground whitespace-nowrap">ر.س / شهر</span>
            </div>
            
            {/* Quick Income Buttons */}
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

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="text-sm text-destructive space-y-1">
          {validationErrors.map((error, index) => (
            <p key={index}>• {error}</p>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="space-y-3">
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
        
        {/* Skip Option */}
        <Button
          variant="ghost"
          onClick={goNext}
          className="w-full h-10 text-muted-foreground gap-2"
        >
          <SkipForward className="w-4 h-4" />
          <span>تخطي هذه الخطوة</span>
        </Button>
      </div>
    </div>
  );
}
