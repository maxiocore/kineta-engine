/**
 * Step 7: Submit & Tracking
 * Premium Fintech · RTL · iOS-first
 * Business Logic: UNCHANGED
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Send,
  Shield,
  Clock,
  Bell,
  Loader2,
} from "lucide-react";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface SubmitTrackingStepProps {
  data: LoanApplicationData;
  goBack: () => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const NEXT_STEPS = [
  {
    icon: Shield,
    title: "مراجعة الطلب",
    description: "سيتم مراجعة طلبك من قبل فريقنا المختص",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Clock,
    title: "نتيجة سريعة",
    description: "ستحصل على النتيجة فوراً أو خلال 24 ساعة كحد أقصى",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Bell,
    title: "إشعار فوري",
    description: "سيصلك إشعار عند تحديث حالة طلبك",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export function SubmitTrackingStep({
  data,
  goBack,
  onSubmit,
  isLoading,
}: SubmitTrackingStepProps) {
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [confirmNotifications, setConfirmNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!confirmAccuracy) return;
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <motion.div className="space-y-6" variants={stagger} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={fadeUp} className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto"
        >
          <Send className="w-7 h-7 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold">جاهز للإرسال</h2>
        <p className="text-muted-foreground text-sm">خطوة أخيرة قبل إرسال طلبك للمراجعة</p>
      </motion.div>

      {/* Summary */}
      <motion.div variants={fadeUp}>
        <Card className="bg-primary/5 border-primary/15 overflow-hidden">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">مبلغ التمويل</p>
                <p className="text-xl font-bold">{formatAmount(data.amount)} ر.س</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">القسط الشهري</p>
                <p className="text-xl font-bold text-primary">{formatAmount(data.monthlyInstallment)} ر.س</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What Happens Next */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-4">ماذا سيحدث بعد الإرسال؟</h3>
            <div className="space-y-3">
              {NEXT_STEPS.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className={`w-8 h-8 rounded-lg ${step.bg} flex items-center justify-center flex-shrink-0`}>
                    <step.icon className={`w-4 h-4 ${step.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmations */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accuracy"
                checked={confirmAccuracy}
                onCheckedChange={(checked) => setConfirmAccuracy(checked as boolean)}
                className="mt-0.5"
              />
              <label htmlFor="accuracy" className="text-sm cursor-pointer leading-relaxed select-none">
                أقر بأن جميع المعلومات المقدمة صحيحة ودقيقة، وأتحمل المسؤولية الكاملة عن صحتها.
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="notifications"
                checked={confirmNotifications}
                onCheckedChange={(checked) => setConfirmNotifications(checked as boolean)}
                className="mt-0.5"
              />
              <label htmlFor="notifications" className="text-sm cursor-pointer leading-relaxed text-muted-foreground select-none">
                أوافق على استلام إشعارات بخصوص حالة طلبي.
              </label>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <motion.div variants={fadeUp} className="flex gap-3">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={isSubmitting}
          className="flex-1 h-12 gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!confirmAccuracy || isSubmitting}
          className="flex-1 h-14 gap-2 text-base font-semibold bg-gradient-to-l from-primary to-primary/90 shadow-lg shadow-primary/20 disabled:shadow-none"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>إرسال الطلب</span>
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
