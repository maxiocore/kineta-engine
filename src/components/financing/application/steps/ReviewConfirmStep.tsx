/**
 * Step 6: Final Review & Confirm
 * Complete review with terms agreement, restrictions warnings, and confirmation modal
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Banknote,
  Calendar,
  Calculator,
  FileText,
  Lock,
  Info,
  Loader2,
  Sparkles,
  Receipt,
  Scale,
  Clock,
  XCircle
} from "lucide-react";
import { AnimatedButton } from "../animations";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface ReviewConfirmStepProps {
  data: LoanApplicationData;
  updateData: (updates: Partial<LoanApplicationData>) => void;
  goNext: () => void;
  goBack: () => void;
  isLoading?: boolean;
}

interface Restriction {
  type: "warning" | "error";
  message: string;
  reason: string;
}

const PRODUCT_LABELS: Record<string, string> = {
  personal: "تمويل شخصي",
  business: "تمويل تجاري",
  service: "تمويل الخدمات",
};

export function ReviewConfirmStep({ 
  data, 
  updateData,
  goNext, 
  goBack,
  isLoading = false
}: ReviewConfirmStepProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedSections, setRevealedSections] = useState<number[]>([]);

  // Gradual reveal animation
  useEffect(() => {
    const timer = setInterval(() => {
      setRevealedSections(prev => {
        if (prev.length < 5) {
          return [...prev, prev.length];
        }
        clearInterval(timer);
        return prev;
      });
    }, 150);
    return () => clearInterval(timer);
  }, []);

  // Check for restrictions
  useEffect(() => {
    const checkRestrictions = () => {
      const newRestrictions: Restriction[] = [];

      // Check if application is under review
      if (data.status === "under_review") {
        newRestrictions.push({
          type: "error",
          message: "طلب قيد المراجعة",
          reason: "لديك طلب سابق قيد المراجعة. يرجى انتظار نتيجة الطلب الحالي."
        });
      }

      // Check amount limits
      if (data.amount > 50000) {
        newRestrictions.push({
          type: "warning",
          message: "مبلغ مرتفع",
          reason: "المبالغ أعلى من 50,000 ر.س قد تحتاج موافقات إضافية وتستغرق وقتاً أطول."
        });
      }

      // Check tenor limits
      if (data.tenorMonths > 12) {
        newRestrictions.push({
          type: "warning",
          message: "مدة طويلة",
          reason: "فترات السداد الأطول من 12 شهر قد تتطلب ضمانات إضافية."
        });
      }

      // Check debt-to-income ratio if income provided
      if (data.monthlyIncome > 0) {
        const dti = (data.monthlyInstallment / data.monthlyIncome) * 100;
        if (dti > 40) {
          newRestrictions.push({
            type: "warning",
            message: "نسبة الالتزام مرتفعة",
            reason: `نسبة القسط إلى الدخل (${dti.toFixed(0)}%) مرتفعة. يُفضل أن تكون أقل من 40%.`
          });
        }
      }

      setRestrictions(newRestrictions);
    };

    checkRestrictions();
  }, [data]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const canSubmit = termsAccepted && privacyAccepted && !restrictions.some(r => r.type === "error");

  const handleSubmitClick = () => {
    if (!canSubmit) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    // Simulate processing delay for animation
    await new Promise(r => setTimeout(r, 500));
    setShowConfirmModal(false);
    goNext();
  };

  const keyTerms = [
    { icon: Banknote, text: "التمويل متوافق مع أحكام الشريعة الإسلامية" },
    { icon: Calendar, text: "السداد عبر أقساط شهرية متساوية" },
    { icon: Scale, text: "لا يوجد فوائد - هامش ربح ثابت ومعلن" },
    { icon: Lock, text: "بياناتك محمية ولا تُشارك مع أطراف خارجية" },
  ];

  const hasErrors = restrictions.some(r => r.type === "error");

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-500 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>الخطوة الأخيرة</span>
        </div>
        <h2 className="text-2xl font-bold">المراجعة النهائية</h2>
        <p className="text-muted-foreground">
          راجع طلبك ووافق على الشروط للإرسال
        </p>
      </motion.div>

      {/* Restrictions/Warnings */}
      <AnimatePresence>
        {restrictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {restrictions.map((restriction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-2 ${
                  restriction.type === "error" 
                    ? "border-red-500/50 bg-red-500/10" 
                    : "border-yellow-500/50 bg-yellow-500/10"
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {restriction.type === "error" ? (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`font-semibold ${
                          restriction.type === "error" ? "text-red-500" : "text-yellow-500"
                        }`}>
                          {restriction.message}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {restriction.reason}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Application Summary - Gradual Reveal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-primary/20">
          <CardContent className="p-0">
            {/* Header Section */}
            <motion.div 
              className="p-5 bg-gradient-to-l from-emerald-600/20 to-teal-600/10 border-b border-primary/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: revealedSections.includes(0) ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Receipt className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ملخص الطلب</p>
                    <p className="font-semibold">{PRODUCT_LABELS[data.productType] || "تمويل"}</p>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Sparkles className="w-3 h-3 ml-1" />
                  بدون فوائد
                </Badge>
              </div>
            </motion.div>

            {/* Summary Grid */}
            <div className="p-5 grid grid-cols-2 gap-4">
              {/* Amount */}
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: revealedSections.includes(1) ? 1 : 0,
                  y: revealedSections.includes(1) ? 0 : 10
                }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Banknote className="w-4 h-4" />
                  <span>مبلغ التمويل</span>
                </div>
                <p className="text-xl font-bold">{formatAmount(data.amount)} ر.س</p>
              </motion.div>

              {/* Tenor */}
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: revealedSections.includes(1) ? 1 : 0,
                  y: revealedSections.includes(1) ? 0 : 10
                }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>مدة السداد</span>
                </div>
                <p className="text-xl font-bold">{data.tenorMonths} شهر</p>
              </motion.div>

              {/* Monthly Installment */}
              <motion.div 
                className="col-span-2 mt-2 p-4 bg-primary/10 rounded-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: revealedSections.includes(2) ? 1 : 0,
                  scale: revealedSections.includes(2) ? 1 : 0.95
                }}
                transition={{ duration: 0.4, type: "spring" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calculator className="w-5 h-5 text-primary" />
                    <span>القسط الشهري</span>
                  </div>
                  <motion.p 
                    className="text-3xl font-bold text-primary"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {formatAmount(data.monthlyInstallment)} ر.س
                  </motion.p>
                </div>
              </motion.div>

              {/* Total & Fees */}
              <motion.div 
                className="col-span-2 flex justify-between items-center pt-3 border-t border-border/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: revealedSections.includes(3) ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-sm">
                  <span className="text-muted-foreground">الرسوم الإدارية: </span>
                  <span className="font-medium">{formatAmount(data.fees)} ر.س</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">الإجمالي: </span>
                  <span className="font-bold text-lg">{formatAmount(data.totalAmount)} ر.س</span>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Terms - Abbreviated */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: revealedSections.includes(4) ? 1 : 0,
          y: revealedSections.includes(4) ? 0 : 20
        }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="font-semibold text-sm">الشروط الأساسية</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {keyTerms.map((term, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <term.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{term.text}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agreement Checkboxes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        <Card className={`border-2 transition-all ${
          termsAccepted && privacyAccepted 
            ? "border-emerald-500/50 bg-emerald-500/5" 
            : "border-border"
        }`}>
          <CardContent className="p-4 space-y-4">
            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                أوافق على{" "}
                <a 
                  href="/terms-of-service" 
                  target="_blank" 
                  className="text-primary underline hover:no-underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  الشروط والأحكام
                </a>{" "}
                الخاصة بخدمة التمويل وأقر بأنني قرأتها وفهمتها بالكامل.
              </Label>
            </div>

            {/* Privacy Agreement */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy"
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                أوافق على{" "}
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  className="text-primary underline hover:no-underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  سياسة الخصوصية
                </a>{" "}
                ومعالجة بياناتي الشخصية لأغراض طلب التمويل.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Validation Message */}
        <AnimatePresence>
          {(!termsAccepted || !privacyAccepted) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Info className="w-4 h-4" />
              <span>يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation */}
      <motion.div 
        className="flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <AnimatedButton
          variant="outline"
          onClick={goBack}
          className="flex-1 h-12 gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </AnimatedButton>
        
        <AnimatedButton
          onClick={handleSubmitClick}
          disabled={!canSubmit || isLoading}
          pulseOnHover={canSubmit}
          className={`flex-1 h-12 gap-2 transition-all ${
            canSubmit 
              ? "bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" 
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>إرسال الطلب</span>
              <ArrowLeft className="w-4 h-4" />
            </>
          )}
        </AnimatedButton>
      </motion.div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader className="text-center sm:text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
            >
              <FileText className="w-8 h-8 text-white" />
            </motion.div>
            <DialogTitle className="text-xl">تأكيد إرسال الطلب</DialogTitle>
            <DialogDescription className="text-center">
              هل أنت متأكد من إرسال طلب التمويل؟
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المبلغ</span>
                <span className="font-medium">{formatAmount(data.amount)} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المدة</span>
                <span className="font-medium">{data.tenorMonths} شهر</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground">القسط الشهري</span>
                <span className="font-bold text-primary">{formatAmount(data.monthlyInstallment)} ر.س</span>
              </div>
            </div>

            {/* Warning Note */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-yellow-500/10 p-3 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p>
                سيتم مراجعة طلبك خلال 24-48 ساعة عمل. ستصلك إشعارات على الإيميل والجوال.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 ml-2" />
              )}
              تأكيد الإرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
