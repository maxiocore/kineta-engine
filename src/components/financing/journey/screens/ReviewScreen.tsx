/**
 * Review Screen - Application Summary
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Eye,
  User,
  Briefcase,
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Edit,
  FileText,
  Wallet,
  Calendar
} from "lucide-react";
import { MICROCOPY } from "@/lib/financing/journeyConfig";
import type { JourneyFormData } from "../FinancingJourneyWizard";

interface ReviewScreenProps {
  formData: JourneyFormData;
  updateFormData: (updates: Partial<JourneyFormData>) => void;
  goNext: () => void;
  goBack: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  onSubmit: () => Promise<void>;
}

interface FinancingPlan {
  id: string;
  name_ar: string;
  installments_count: number;
}

export function ReviewScreen({ 
  formData, 
  updateFormData, 
  isProcessing,
  onSubmit
}: ReviewScreenProps) {
  const { review } = MICROCOPY;
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch selected plan
  const { data: selectedPlan } = useQuery({
    queryKey: ["financing-plan", formData.plan_id],
    queryFn: async () => {
      if (!formData.plan_id) return null;
      const { data, error } = await supabase
        .from("financing_plans")
        .select("*")
        .eq("id", formData.plan_id)
        .single();
      if (error) throw error;
      return data as FinancingPlan;
    },
    enabled: !!formData.plan_id,
  });

  const monthlyInstallment = selectedPlan 
    ? formData.amount / selectedPlan.installments_count 
    : 0;

  const validateAndSubmit = async () => {
    if (!formData.confirm_accuracy) {
      setErrors({ confirm_accuracy: "يجب تأكيد صحة البيانات" });
      return;
    }
    setErrors({});
    await onSubmit();
  };

  const serviceTypeLabels: Record<string, string> = {
    development: "برمجة وتطوير",
    design: "تصميم جرافيك",
    social: "إدارة سوشيال ميديا",
    hosting: "استضافة ودومينات",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{review.title}</h2>
        <p className="text-muted-foreground">{review.subtitle}</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              {review.section_personal}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الاسم</span>
            <span className="font-medium">{formData.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">رقم الهوية</span>
            <span className="font-medium font-mono" dir="ltr">{formData.national_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الجوال</span>
            <span className="font-medium font-mono" dir="ltr">{formData.phone || "غير محدد"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">البريد</span>
            <span className="font-medium" dir="ltr">{formData.email || "غير محدد"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-5 w-5 text-emerald-400" />
            {review.section_employment}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">جهة العمل</span>
            <span className="font-medium">{formData.employer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المسمى الوظيفي</span>
            <span className="font-medium">{formData.job_title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الدخل الشهري</span>
            <span className="font-medium">{formData.monthly_income.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">مدة العمل</span>
            <span className="font-medium">{formData.employment_duration} شهر</span>
          </div>
        </CardContent>
      </Card>

      {/* Financing Details */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            {review.section_financing}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">مبلغ التمويل</span>
            <span className="text-2xl font-bold text-emerald-400">
              {formData.amount.toLocaleString()} ر.س
            </span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">خطة السداد</span>
            <Badge className="bg-emerald-500/20 text-emerald-400">
              {selectedPlan?.installments_count || 0} {(selectedPlan?.installments_count || 0) === 1 ? "دفعة" : "أقساط"}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">القسط الشهري</span>
            <span className="font-bold">
              {monthlyInstallment.toLocaleString(undefined, { maximumFractionDigits: 0 })} ر.س
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">نوع الخدمة</span>
            <span className="font-medium">{serviceTypeLabels[formData.service_type] || formData.service_type}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">إجمالي المبلغ</span>
            <div className="text-left">
              <span className="text-xl font-bold">{formData.amount.toLocaleString()} ر.س</span>
              <Badge className="mr-2 bg-emerald-500/20 text-emerald-400 text-xs">
                0% فوائد
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Checkbox */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="confirm_accuracy"
            checked={formData.confirm_accuracy}
            onCheckedChange={(checked) => updateFormData({ confirm_accuracy: checked === true })}
          />
          <Label htmlFor="confirm_accuracy" className="text-sm leading-relaxed cursor-pointer">
            أقر بأن جميع البيانات المدخلة صحيحة ودقيقة، وأتحمل المسؤولية الكاملة عن صحتها
          </Label>
        </div>
        {errors.confirm_accuracy && (
          <p className="text-sm text-red-400 flex items-center gap-1 mr-6">
            <AlertTriangle className="h-3 w-3" />
            {errors.confirm_accuracy}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={validateAndSubmit}
        disabled={isProcessing || !formData.confirm_accuracy}
        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
            جارٍ تقديم الطلب...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5 ml-2" />
            تقديم الطلب
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        بالضغط على "تقديم الطلب" أنت توافق على جميع الشروط والأحكام
      </p>
    </div>
  );
}
