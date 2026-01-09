/**
 * Employment Screen - Employment Information
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Briefcase,
  Building2,
  Wallet,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Info
} from "lucide-react";
import { MICROCOPY } from "@/lib/financing/journeyConfig";
import type { JourneyFormData } from "../FinancingJourneyWizard";

interface EmploymentScreenProps {
  formData: JourneyFormData;
  updateFormData: (updates: Partial<JourneyFormData>) => void;
  goNext: () => void;
  goBack: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

export function EmploymentScreen({ 
  formData, 
  updateFormData, 
  goNext,
}: EmploymentScreenProps) {
  const { employment } = MICROCOPY;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employer_name || formData.employer_name.trim().length < 2) {
      newErrors.employer_name = "جهة العمل مطلوبة";
    }

    if (!formData.job_title || formData.job_title.trim().length < 2) {
      newErrors.job_title = "المسمى الوظيفي مطلوب";
    }

    if (!formData.monthly_income || formData.monthly_income < 3000) {
      newErrors.monthly_income = "الدخل الشهري يجب أن يكون 3,000 ر.س على الأقل";
    }

    if (!formData.employment_duration || formData.employment_duration < 3) {
      newErrors.employment_duration = "مدة العمل يجب أن تكون 3 أشهر على الأقل";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      goNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{employment.title}</h2>
        <p className="text-muted-foreground">{employment.subtitle}</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Employer Name */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {employment.employer_label}
          </Label>
          <Input
            type="text"
            value={formData.employer_name}
            onChange={(e) => updateFormData({ employer_name: e.target.value })}
            placeholder={employment.employer_hint}
            className={errors.employer_name ? "border-red-500" : ""}
          />
          {errors.employer_name && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.employer_name}
            </p>
          )}
        </div>

        {/* Job Title */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            {employment.job_title_label}
          </Label>
          <Input
            type="text"
            value={formData.job_title}
            onChange={(e) => updateFormData({ job_title: e.target.value })}
            placeholder="مهندس برمجيات"
            className={errors.job_title ? "border-red-500" : ""}
          />
          {errors.job_title && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.job_title}
            </p>
          )}
        </div>

        {/* Monthly Income */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            {employment.income_label}
          </Label>
          <div className="relative">
            <Input
              type="number"
              value={formData.monthly_income || ""}
              onChange={(e) => updateFormData({ monthly_income: parseInt(e.target.value) || 0 })}
              placeholder="10000"
              min={3000}
              className={`pl-16 ${errors.monthly_income ? "border-red-500" : ""}`}
              dir="ltr"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              ر.س
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{employment.income_hint}</p>
          {errors.monthly_income && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.monthly_income}
            </p>
          )}
        </div>

        {/* Employment Duration */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            مدة العمل بالأشهر
          </Label>
          <div className="relative">
            <Input
              type="number"
              value={formData.employment_duration || ""}
              onChange={(e) => updateFormData({ employment_duration: parseInt(e.target.value) || 0 })}
              placeholder="12"
              min={3}
              className={`pl-16 ${errors.employment_duration ? "border-red-500" : ""}`}
              dir="ltr"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              شهر
            </span>
          </div>
          <p className="text-xs text-muted-foreground">الحد الأدنى 3 أشهر</p>
          {errors.employment_duration && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.employment_duration}
            </p>
          )}
        </div>
      </div>

      {/* Income Tip */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-blue-400 mb-1">نصيحة</p>
            <p>كلما زاد دخلك ومدة عملك، زاد مبلغ التمويل المتاح لك.</p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={validateAndProceed}
        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
      >
        متابعة
        <ArrowLeft className="h-5 w-5 mr-2" />
      </Button>
    </div>
  );
}
