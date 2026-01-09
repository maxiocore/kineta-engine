/**
 * Financing Details Screen - Amount and Plan Selection
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  CreditCard,
  Wallet,
  Calculator,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  Code,
  Palette,
  Share2,
  Globe
} from "lucide-react";
import { MICROCOPY } from "@/lib/financing/journeyConfig";
import type { JourneyFormData } from "../FinancingJourneyWizard";

interface FinancingDetailsScreenProps {
  formData: JourneyFormData;
  updateFormData: (updates: Partial<JourneyFormData>) => void;
  goNext: () => void;
  goBack: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

interface FinancingPlan {
  id: string;
  name_ar: string;
  installments_count: number;
  duration_months: number;
  min_amount: number;
  max_amount: number | null;
}

const serviceTypes = [
  { value: "development", label: "برمجة وتطوير", icon: Code },
  { value: "design", label: "تصميم جرافيك", icon: Palette },
  { value: "social", label: "إدارة سوشيال ميديا", icon: Share2 },
  { value: "hosting", label: "استضافة ودومينات", icon: Globe },
];

export function FinancingDetailsScreen({ 
  formData, 
  updateFormData, 
  goNext,
}: FinancingDetailsScreenProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch plans
  const { data: plans = [] } = useQuery({
    queryKey: ["financing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financing_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as FinancingPlan[];
    },
  });

  const selectedPlan = plans.find(p => p.id === formData.plan_id);
  const monthlyInstallment = selectedPlan && formData.amount
    ? formData.amount / selectedPlan.installments_count
    : 0;

  // Calculate max amount based on income
  const maxAmount = Math.min(formData.monthly_income * 6, 50000);
  const minAmount = 1000;

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount < minAmount) {
      newErrors.amount = `المبلغ يجب أن يكون ${minAmount.toLocaleString()} ر.س على الأقل`;
    }
    if (formData.amount > maxAmount) {
      newErrors.amount = `المبلغ لا يمكن أن يتجاوز ${maxAmount.toLocaleString()} ر.س`;
    }

    if (!formData.plan_id) {
      newErrors.plan_id = "يرجى اختيار خطة التمويل";
    }

    if (!formData.service_type) {
      newErrors.service_type = "يرجى اختيار نوع الخدمة";
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
        <h2 className="text-2xl font-bold mb-2">تفاصيل التمويل</h2>
        <p className="text-muted-foreground">حدد المبلغ وخطة السداد المناسبة</p>
      </div>

      {/* Amount Selection */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          المبلغ المطلوب
        </Label>
        
        {/* Amount Display */}
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-emerald-400">
            {(formData.amount || minAmount).toLocaleString()}
          </div>
          <div className="text-muted-foreground">ريال سعودي</div>
        </div>

        {/* Slider */}
        <Slider
          value={[formData.amount || minAmount]}
          onValueChange={(value) => updateFormData({ amount: value[0] })}
          min={minAmount}
          max={maxAmount}
          step={500}
          className="py-4"
        />
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{minAmount.toLocaleString()} ر.س</span>
          <span>{maxAmount.toLocaleString()} ر.س</span>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[5000, 10000, 20000, 30000].filter(amt => amt <= maxAmount).map((amt) => (
            <Button
              key={amt}
              variant={formData.amount === amt ? "default" : "outline"}
              size="sm"
              onClick={() => updateFormData({ amount: amt })}
              className={formData.amount === amt ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {(amt / 1000).toFixed(0)}K
            </Button>
          ))}
        </div>

        {errors.amount && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {errors.amount}
          </p>
        )}
      </div>

      {/* Plan Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          خطة السداد
        </Label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {plans.map((plan) => (
            <motion.button
              key={plan.id}
              type="button"
              onClick={() => updateFormData({ plan_id: plan.id })}
              className={`
                p-4 rounded-xl border-2 text-center transition-all
                ${formData.plan_id === plan.id
                  ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                  : "border-border bg-card hover:border-emerald-500/50"
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`text-3xl font-bold ${
                formData.plan_id === plan.id ? "text-emerald-400" : "text-foreground"
              }`}>
                {plan.installments_count}
              </div>
              <div className="text-sm text-muted-foreground">
                {plan.installments_count === 1 ? "دفعة واحدة" : "أقساط"}
              </div>
            </motion.button>
          ))}
        </div>

        {errors.plan_id && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {errors.plan_id}
          </p>
        )}
      </div>

      {/* Monthly Installment Preview */}
      {selectedPlan && formData.amount > 0 && (
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-muted-foreground">القسط الشهري المتوقع</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {monthlyInstallment.toLocaleString(undefined, { maximumFractionDigits: 0 })} ر.س
            </div>
            <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Sparkles className="h-3 w-3 ml-1" />
              بدون فوائد
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Service Type */}
      <div className="space-y-3">
        <Label>نوع الخدمة المطلوبة</Label>
        <div className="grid grid-cols-2 gap-2">
          {serviceTypes.map((service) => (
            <motion.button
              key={service.value}
              type="button"
              onClick={() => updateFormData({ service_type: service.value })}
              className={`
                p-3 rounded-xl border-2 flex items-center gap-3 transition-all
                ${formData.service_type === service.value
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border bg-card hover:border-emerald-500/50"
                }
              `}
              whileTap={{ scale: 0.98 }}
            >
              <service.icon className={`h-5 w-5 ${
                formData.service_type === service.value ? "text-emerald-400" : "text-muted-foreground"
              }`} />
              <span className={`text-sm ${
                formData.service_type === service.value ? "font-medium" : "text-muted-foreground"
              }`}>
                {service.label}
              </span>
            </motion.button>
          ))}
        </div>
        {errors.service_type && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {errors.service_type}
          </p>
        )}
      </div>

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
