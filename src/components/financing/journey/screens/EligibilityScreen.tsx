/**
 * Eligibility Screen - Quick eligibility assessment
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Award, 
  Building2, 
  Briefcase, 
  Shield as ShieldIcon, 
  UserCog,
  Store,
  GraduationCap,
  Loader2,
  Lock,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { MICROCOPY } from "@/lib/financing/journeyConfig";
import type { JourneyFormData } from "../FinancingJourneyWizard";
import type { useEligibilityMachine } from "@/hooks/useEligibilityMachine";

interface EligibilityScreenProps {
  formData: JourneyFormData;
  updateFormData: (updates: Partial<JourneyFormData>) => void;
  goNext: () => void;
  goBack: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  eligibilityMachine: ReturnType<typeof useEligibilityMachine>;
}

const nationalityOptions = [
  { value: "سعودي", label: "سعودي", icon: Crown },
  { value: "مقيم", label: "مقيم", icon: Award },
];

const employmentOptions = [
  { value: "government", label: "موظف حكومي", icon: Building2 },
  { value: "private", label: "موظف قطاع خاص", icon: Briefcase },
  { value: "military", label: "عسكري", icon: ShieldIcon },
  { value: "retired", label: "متقاعد", icon: UserCog },
  { value: "self_employed", label: "عمل حر", icon: GraduationCap },
  { value: "business_owner", label: "صاحب منشأة", icon: Store },
];

export function EligibilityScreen({ 
  formData, 
  updateFormData, 
  goNext, 
  isProcessing,
  setIsProcessing,
  eligibilityMachine 
}: EligibilityScreenProps) {
  const { eligibility } = MICROCOPY;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndProceed = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nationality) {
      newErrors.nationality = "الجنسية مطلوبة";
    }
    if (!formData.age || formData.age < 18) {
      newErrors.age = "العمر يجب أن يكون 18 سنة على الأقل";
    }
    if (formData.age > 65) {
      newErrors.age = "العمر يجب أن لا يتجاوز 65 سنة";
    }
    if (!formData.employment_status) {
      newErrors.employment_status = "الحالة الوظيفية مطلوبة";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsProcessing(true);
      
      // Simulate eligibility check
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsProcessing(false);
      goNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-4">
          <Lock className="h-3 w-3 ml-1" />
          {eligibility.privacy_note}
        </Badge>
        <h2 className="text-2xl font-bold mb-2">{eligibility.title}</h2>
        <p className="text-muted-foreground">{eligibility.subtitle}</p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Nationality */}
        <div className="space-y-3">
          <Label>{eligibility.nationality_label}</Label>
          <div className="grid grid-cols-2 gap-3">
            {nationalityOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => updateFormData({ nationality: option.value })}
                className={`
                  p-4 rounded-xl border-2 text-center transition-all
                  ${formData.nationality === option.value
                    ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                    : "border-border bg-card hover:border-emerald-500/50"
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <option.icon className={`h-8 w-8 mx-auto mb-2 ${
                  formData.nationality === option.value ? "text-emerald-400" : "text-muted-foreground"
                }`} />
                <span className={formData.nationality === option.value ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {option.label}
                </span>
              </motion.button>
            ))}
          </div>
          {errors.nationality && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.nationality}
            </p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label>{eligibility.age_label}</Label>
          <Input
            type="number"
            value={formData.age || ""}
            onChange={(e) => updateFormData({ age: parseInt(e.target.value) || 0 })}
            placeholder="25"
            min={18}
            max={65}
            className={errors.age ? "border-red-500" : ""}
          />
          <p className="text-xs text-muted-foreground">{eligibility.age_hint}</p>
          {errors.age && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.age}
            </p>
          )}
        </div>

        {/* Employment Status */}
        <div className="space-y-3">
          <Label>{eligibility.employment_label}</Label>
          <div className="grid grid-cols-2 gap-2">
            {employmentOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => updateFormData({ employment_status: option.value })}
                className={`
                  p-3 rounded-xl border-2 text-right transition-all flex items-center gap-3
                  ${formData.employment_status === option.value
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border bg-card hover:border-emerald-500/50"
                  }
                `}
                whileTap={{ scale: 0.98 }}
              >
                <option.icon className={`h-5 w-5 flex-shrink-0 ${
                  formData.employment_status === option.value ? "text-emerald-400" : "text-muted-foreground"
                }`} />
                <span className={`text-sm ${formData.employment_status === option.value ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {option.label}
                </span>
              </motion.button>
            ))}
          </div>
          {errors.employment_status && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.employment_status}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={validateAndProceed}
        disabled={isProcessing}
        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
            {eligibility.processing}
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5 ml-2" />
            {eligibility.cta}
          </>
        )}
      </Button>
    </div>
  );
}
