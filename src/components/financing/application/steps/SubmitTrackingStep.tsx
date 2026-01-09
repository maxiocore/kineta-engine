/**
 * Step 7: Submit & Tracking
 * With Professional Animations
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight,
  Send,
  Shield,
  Clock,
  Bell,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { AnimatedButton, SuccessCheckmark, DotsLoader } from "../animations";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface SubmitTrackingStepProps {
  data: LoanApplicationData;
  goBack: () => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}

const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const NEXT_STEPS = [
  {
    icon: Shield,
    title: "مراجعة الطلب",
    description: "سيتم مراجعة طلبك من قبل فريقنا المختص",
    color: "blue",
  },
  {
    icon: Clock,
    title: "نتيجة سريعة",
    description: "ستحصل على النتيجة فوراً أو خلال 24 ساعة كحد أقصى",
    color: "emerald",
  },
  {
    icon: Bell,
    title: "إشعار فوري",
    description: "سيصلك إشعار عند تحديث حالة طلبك",
    color: "purple",
  },
];

export function SubmitTrackingStep({ 
  data, 
  goBack, 
  onSubmit,
  isLoading 
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto"
        >
          <Send className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold">جاهز للإرسال</h2>
        <p className="text-muted-foreground">
          خطوة أخيرة قبل إرسال طلبك للمراجعة
        </p>
      </motion.div>

      {/* Summary Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
          <CardContent className="p-5 relative">
            {/* Decorative background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div 
                className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center relative">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm text-muted-foreground">مبلغ التمويل</p>
                <p className="text-2xl font-bold">{formatAmount(data.amount)} ر.س</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-muted-foreground">القسط الشهري</p>
                <p className="text-2xl font-bold text-primary">
                  {formatAmount(data.monthlyInstallment)} ر.س
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What happens next */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">ماذا سيحدث بعد الإرسال؟</h3>
            
            <div className="space-y-4">
              {NEXT_STEPS.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <motion.div 
                    className={`w-8 h-8 rounded-full bg-${step.color}-500/10 flex items-center justify-center flex-shrink-0`}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                  >
                    <step.icon className={`w-4 h-4 text-${step.color}-500`} />
                  </motion.div>
                  <div>
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmations */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
            <motion.div 
              className="flex items-start gap-3"
              whileTap={{ scale: 0.99 }}
            >
              <Checkbox
                id="accuracy"
                checked={confirmAccuracy}
                onCheckedChange={(checked) => setConfirmAccuracy(checked as boolean)}
                className="mt-1 transition-all data-[state=checked]:scale-110"
              />
              <label 
                htmlFor="accuracy" 
                className="text-sm cursor-pointer leading-relaxed select-none"
              >
                أقر بأن جميع المعلومات المقدمة صحيحة ودقيقة، وأتحمل المسؤولية الكاملة عن صحتها.
              </label>
            </motion.div>

            <motion.div 
              className="flex items-start gap-3"
              whileTap={{ scale: 0.99 }}
            >
              <Checkbox
                id="notifications"
                checked={confirmNotifications}
                onCheckedChange={(checked) => setConfirmNotifications(checked as boolean)}
                className="mt-1 transition-all data-[state=checked]:scale-110"
              />
              <label 
                htmlFor="notifications" 
                className="text-sm cursor-pointer leading-relaxed text-muted-foreground select-none"
              >
                أوافق على استلام إشعارات بخصوص حالة طلبي عبر البريد الإلكتروني والرسائل النصية.
              </label>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <motion.div variants={itemVariants} className="flex gap-3">
        <AnimatedButton
          variant="outline"
          onClick={goBack}
          disabled={isSubmitting}
          className="flex-1 h-12 gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </AnimatedButton>
        
        <AnimatedButton
          onClick={handleSubmit}
          disabled={!confirmAccuracy || isSubmitting}
          isLoading={isSubmitting}
          loadingText="جارٍ الإرسال..."
          pulseOnHover
          className="flex-1 h-14 gap-2 text-lg font-semibold bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <Send className="w-5 h-5" />
          <span>إرسال الطلب</span>
        </AnimatedButton>
      </motion.div>
    </motion.div>
  );
}
