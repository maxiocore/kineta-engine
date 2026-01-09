/**
 * Step 6: Review & Confirm
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit2,
  FileText,
  Banknote,
  Calendar,
  Calculator,
  Briefcase,
  Wallet
} from "lucide-react";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface ReviewConfirmStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
}

const PRODUCT_LABELS: Record<string, string> = {
  personal: "تمويل شخصي",
  business: "تمويل تجاري",
  service: "تمويل الخدمات",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  government: "موظف حكومي",
  private: "موظف قطاع خاص",
  self_employed: "عمل حر / مستقل",
  business_owner: "صاحب عمل",
  retired: "متقاعد",
  other: "آخر",
};

export function ReviewConfirmStep({ 
  data, 
  goNext, 
  goBack 
}: ReviewConfirmStepProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const sections = [
    {
      title: "نوع التمويل",
      icon: FileText,
      items: [
        { label: "النوع", value: PRODUCT_LABELS[data.productType] || "-" },
      ],
    },
    {
      title: "تفاصيل المبلغ",
      icon: Banknote,
      items: [
        { label: "مبلغ التمويل", value: `${formatAmount(data.amount)} ر.س` },
        { label: "مدة السداد", value: `${data.tenorMonths} شهر` },
      ],
    },
    {
      title: "الأقساط والرسوم",
      icon: Calculator,
      items: [
        { label: "القسط الشهري", value: `${formatAmount(data.monthlyInstallment)} ر.س`, highlight: true },
        { label: "إجمالي الرسوم", value: `${formatAmount(data.fees)} ر.س` },
        { label: "إجمالي المبلغ", value: `${formatAmount(data.totalAmount)} ر.س` },
      ],
    },
  ];

  // Add optional info if provided
  if (data.purpose || data.employmentType || data.monthlyIncome) {
    sections.push({
      title: "معلومات إضافية",
      icon: Briefcase,
      items: [
        ...(data.purpose ? [{ label: "الغرض", value: data.purpose }] : []),
        ...(data.employmentType ? [{ label: "نوع العمل", value: EMPLOYMENT_LABELS[data.employmentType] || "-" }] : []),
        ...(data.monthlyIncome ? [{ label: "الدخل الشهري", value: `${formatAmount(data.monthlyIncome)} ر.س` }] : []),
      ],
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-500 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>المراجعة النهائية</span>
        </div>
        <h2 className="text-2xl font-bold">مراجعة وتأكيد الطلب</h2>
        <p className="text-muted-foreground">
          يرجى مراجعة جميع البيانات قبل الإرسال
        </p>
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <section.icon className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{section.title}</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs gap-1"
                    onClick={goBack}
                  >
                    <Edit2 className="w-3 h-3" />
                    تعديل
                  </Button>
                </div>

                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className={`
                        flex items-center justify-between py-2 px-3 rounded-lg
                        ${item.highlight ? "bg-primary/10" : "bg-muted/50"}
                      `}
                    >
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={`font-medium ${item.highlight ? "text-primary" : ""}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">القسط الشهري</p>
                <p className="text-3xl font-bold text-primary">
                  {formatAmount(data.monthlyInstallment)} ر.س
                </p>
              </div>
              <div className="text-left">
                <Badge variant="secondary" className="mb-1">
                  {data.tenorMonths} شهر
                </Badge>
                <p className="text-xs text-muted-foreground">
                  إجمالي: {formatAmount(data.totalAmount)} ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-muted/50 rounded-lg text-center"
      >
        <p className="text-sm text-muted-foreground">
          بالضغط على "إرسال الطلب" فإنك توافق على جميع{" "}
          <a href="/terms-of-service" target="_blank" className="text-primary underline">
            الشروط والأحكام
          </a>{" "}
          وتؤكد صحة البيانات المقدمة.
        </p>
      </motion.div>

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
          className="flex-1 h-12 gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <span>إرسال الطلب</span>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
