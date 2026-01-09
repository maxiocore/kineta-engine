/**
 * Identity Screen - KYC Identity Verification
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Fingerprint,
  User,
  Calendar,
  Loader2,
  AlertTriangle,
  Lock,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { MICROCOPY } from "@/lib/financing/journeyConfig";
import type { JourneyFormData } from "../FinancingJourneyWizard";

interface IdentityScreenProps {
  formData: JourneyFormData;
  updateFormData: (updates: Partial<JourneyFormData>) => void;
  goNext: () => void;
  goBack: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

export function IdentityScreen({ 
  formData, 
  updateFormData, 
  goNext,
  isProcessing,
  setIsProcessing
}: IdentityScreenProps) {
  const { identity } = MICROCOPY;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationStep, setVerificationStep] = useState<"input" | "verifying" | "verified">("input");

  const validateNationalId = (id: string) => {
    // Saudi ID starts with 1, Resident ID starts with 2
    return /^[12]\d{9}$/.test(id);
  };

  const validateAndProceed = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.national_id) {
      newErrors.national_id = "رقم الهوية مطلوب";
    } else if (!validateNationalId(formData.national_id)) {
      newErrors.national_id = "رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2";
    }

    if (!formData.full_name || formData.full_name.trim().length < 4) {
      newErrors.full_name = "الاسم الكامل مطلوب (4 أحرف على الأقل)";
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "تاريخ الميلاد مطلوب";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsProcessing(true);
      setVerificationStep("verifying");
      
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerificationStep("verified");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsProcessing(false);
      goNext();
    }
  };

  if (verificationStep === "verifying") {
    return (
      <motion.div 
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 blur-xl opacity-50" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
            <Fingerprint className="h-12 w-12 text-white" />
          </div>
        </motion.div>
        <h3 className="text-xl font-bold mb-2">{identity.processing}</h3>
        <p className="text-muted-foreground">{identity.verification_note}</p>
      </motion.div>
    );
  }

  if (verificationStep === "verified") {
    return (
      <motion.div 
        className="text-center py-12"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        </motion.div>
        <h3 className="text-xl font-bold text-emerald-400">تم التحقق بنجاح!</h3>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-4">
          <Lock className="h-3 w-3 ml-1" />
          {identity.security_badge}
        </Badge>
        <h2 className="text-2xl font-bold mb-2">{identity.title}</h2>
        <p className="text-muted-foreground">{identity.subtitle}</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* National ID */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
            {identity.national_id_label}
          </Label>
          <Input
            type="text"
            value={formData.national_id}
            onChange={(e) => updateFormData({ 
              national_id: e.target.value.replace(/\D/g, "").slice(0, 10) 
            })}
            placeholder="1234567890"
            className={`text-lg tracking-wider ${errors.national_id ? "border-red-500" : ""}`}
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">{identity.national_id_hint}</p>
          {errors.national_id && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.national_id}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {identity.full_name_label}
          </Label>
          <Input
            type="text"
            value={formData.full_name}
            onChange={(e) => updateFormData({ full_name: e.target.value })}
            placeholder="محمد عبدالله الأحمد"
            className={errors.full_name ? "border-red-500" : ""}
          />
          <p className="text-xs text-muted-foreground">{identity.full_name_hint}</p>
          {errors.full_name && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.full_name}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {identity.dob_label}
          </Label>
          <Input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => updateFormData({ date_of_birth: e.target.value })}
            className={errors.date_of_birth ? "border-red-500" : ""}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.date_of_birth}
            </p>
          )}
        </div>
      </div>

      {/* Verification Note */}
      <Card className="bg-muted/50 border-border/50">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>{identity.verification_note}</p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={validateAndProceed}
        disabled={isProcessing}
        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
            جارٍ التحقق...
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5 ml-2" />
            {identity.cta}
          </>
        )}
      </Button>
    </div>
  );
}
