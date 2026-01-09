/**
 * Terms Disclosure Screen - Terms and Fees Transparency
 */

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  FileText,
  Shield,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
  Percent,
  Clock,
  CreditCard,
  Gavel
} from "lucide-react";
import { MICROCOPY } from "@/lib/financing/journeyConfig";
import type { JourneyFormData } from "../FinancingJourneyWizard";

interface TermsDisclosureScreenProps {
  formData: JourneyFormData;
  updateFormData: (updates: Partial<JourneyFormData>) => void;
  goNext: () => void;
  goBack: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

export function TermsDisclosureScreen({ 
  formData, 
  updateFormData, 
  goNext,
}: TermsDisclosureScreenProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [readTime, setReadTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track reading time
  useEffect(() => {
    const interval = setInterval(() => {
      setReadTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check scroll position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accept_terms) {
      newErrors.accept_terms = "يجب الموافقة على الشروط والأحكام";
    }

    if (!formData.acknowledge_fees) {
      newErrors.acknowledge_fees = "يجب الإقرار بقراءة الرسوم";
    }

    if (readTime < 10) {
      newErrors.readTime = "يرجى قراءة الشروط والأحكام بتأنٍّ";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      goNext();
    }
  };

  const feeItems = [
    { icon: Percent, label: "نسبة الفائدة", value: "0%", highlight: true },
    { icon: CreditCard, label: "رسوم إدارية", value: "0 ر.س" },
    { icon: Clock, label: "رسوم التأخير", value: "50 ر.س / يوم" },
    { icon: Gavel, label: "رسوم التحصيل القانوني", value: "حسب النظام" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">الإفصاح عن الشروط والرسوم</h2>
        <p className="text-muted-foreground">راجع جميع الشروط والرسوم قبل المتابعة</p>
      </div>

      {/* Fees Disclosure - Clear and Prominent */}
      <Card className="border-2 border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="h-5 w-5" />
            جدول الرسوم والتكاليف
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feeItems.map((item, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                item.highlight ? "bg-emerald-500/10" : "bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-5 w-5 ${item.highlight ? "text-emerald-400" : "text-muted-foreground"}`} />
                <span>{item.label}</span>
              </div>
              <Badge className={item.highlight ? "bg-emerald-500 text-white" : ""}>
                {item.value}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            الشروط والأحكام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea 
            className="h-48 border rounded-lg p-4"
            onScrollCapture={handleScroll}
          >
            <div className="space-y-4 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">1. التعريفات</h4>
              <p>
                "التمويل" يشير إلى المبلغ المقدم من MaxioCore للعميل لتمويل الخدمات الرقمية.
                "العميل" هو الشخص الطبيعي أو الاعتباري المستفيد من التمويل.
                "الأقساط" هي المبالغ الدورية الواجب سدادها.
              </p>

              <h4 className="font-semibold text-foreground">2. شروط التمويل</h4>
              <p>
                - الحد الأدنى للعمر 18 سنة والحد الأقصى 65 سنة.
                - يجب أن يكون العميل سعودي الجنسية أو مقيماً بإقامة سارية.
                - الحد الأدنى للدخل الشهري 3,000 ريال سعودي.
                - يجب أن يكون العميل موظفاً لمدة لا تقل عن 3 أشهر.
              </p>

              <h4 className="font-semibold text-foreground">3. التزامات العميل</h4>
              <p>
                - سداد الأقساط في مواعيدها المحددة.
                - إخطار MaxioCore بأي تغيير في بيانات التواصل.
                - عدم استخدام التمويل لأغراض غير مشروعة.
                - الحفاظ على سرية بيانات الحساب.
              </p>

              <h4 className="font-semibold text-foreground">4. حالات التأخر والتعثر</h4>
              <p>
                - في حال التأخر عن السداد، تُفرض رسوم تأخير بقيمة 50 ريال عن كل يوم تأخير.
                - في حال التعثر المتكرر، يحق لـ MaxioCore اتخاذ الإجراءات القانونية.
                - يتم الإبلاغ للجهات الائتمانية المختصة (سمة).
              </p>

              <h4 className="font-semibold text-foreground">5. السداد المبكر</h4>
              <p>
                يحق للعميل السداد المبكر للتمويل دون أي رسوم أو غرامات إضافية.
              </p>

              <h4 className="font-semibold text-foreground">6. إنهاء العقد</h4>
              <p>
                - ينتهي العقد تلقائياً بسداد كامل المبلغ.
                - يحق لـ MaxioCore إنهاء العقد في حال مخالفة الشروط.
                - في حال الإنهاء، يصبح كامل المبلغ المتبقي مستحقاً فوراً.
              </p>

              <h4 className="font-semibold text-foreground">7. القانون المطبق</h4>
              <p>
                يخضع هذا العقد لأنظمة المملكة العربية السعودية، ويختص بنظر أي نزاع 
                الجهات القضائية المختصة في المملكة العربية السعودية.
              </p>
            </div>
          </ScrollArea>
          
          {!hasScrolledToBottom && (
            <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3" />
              اقرأ حتى النهاية للمتابعة
            </p>
          )}
        </CardContent>
      </Card>

      {/* Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="accept_terms"
            checked={formData.accept_terms}
            onCheckedChange={(checked) => updateFormData({ accept_terms: checked === true })}
          />
          <Label htmlFor="accept_terms" className="text-sm leading-relaxed cursor-pointer">
            أقر بأنني قرأت وفهمت الشروط والأحكام أعلاه وأوافق عليها بالكامل
          </Label>
        </div>
        {errors.accept_terms && (
          <p className="text-sm text-red-400 flex items-center gap-1 mr-6">
            <AlertTriangle className="h-3 w-3" />
            {errors.accept_terms}
          </p>
        )}

        <div className="flex items-start gap-3">
          <Checkbox
            id="acknowledge_fees"
            checked={formData.acknowledge_fees}
            onCheckedChange={(checked) => updateFormData({ acknowledge_fees: checked === true })}
          />
          <Label htmlFor="acknowledge_fees" className="text-sm leading-relaxed cursor-pointer">
            أقر بأنني اطلعت على جدول الرسوم وأفهم الالتزامات المالية المترتبة
          </Label>
        </div>
        {errors.acknowledge_fees && (
          <p className="text-sm text-red-400 flex items-center gap-1 mr-6">
            <AlertTriangle className="h-3 w-3" />
            {errors.acknowledge_fees}
          </p>
        )}

        {errors.readTime && (
          <p className="text-sm text-amber-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {errors.readTime}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={validateAndProceed}
        disabled={!formData.accept_terms || !formData.acknowledge_fees}
        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50"
      >
        <CheckCircle2 className="h-5 w-5 ml-2" />
        موافق ومتابعة
        <ArrowLeft className="h-5 w-5 mr-2" />
      </Button>
    </div>
  );
}
