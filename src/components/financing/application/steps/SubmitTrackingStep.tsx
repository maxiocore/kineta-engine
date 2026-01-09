/**
 * Step 7: Submit & Tracking
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight,
  Send,
  Shield,
  Clock,
  Bell,
  Loader2
} from "lucide-react";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface SubmitTrackingStepProps {
  data: LoanApplicationData;
  goBack: () => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto"
        >
          <Send className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold">جاهز للإرسال</h2>
        <p className="text-muted-foreground">
          خطوة أخيرة قبل إرسال طلبك للمراجعة
        </p>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">مبلغ التمويل</p>
                <p className="text-2xl font-bold">{formatAmount(data.amount)} ر.س</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">القسط الشهري</p>
                <p className="text-2xl font-bold text-primary">
                  {formatAmount(data.monthlyInstallment)} ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What happens next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">ماذا سيحدث بعد الإرسال؟</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">مراجعة الطلب</p>
                  <p className="text-xs text-muted-foreground">
                    سيتم مراجعة طلبك من قبل فريقنا المختص
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">نتيجة سريعة</p>
                  <p className="text-xs text-muted-foreground">
                    ستحصل على النتيجة فوراً أو خلال 24 ساعة كحد أقصى
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">إشعار فوري</p>
                  <p className="text-xs text-muted-foreground">
                    سيصلك إشعار عند تحديث حالة طلبك
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accuracy"
                checked={confirmAccuracy}
                onCheckedChange={(checked) => setConfirmAccuracy(checked as boolean)}
                className="mt-1"
              />
              <label 
                htmlFor="accuracy" 
                className="text-sm cursor-pointer leading-relaxed"
              >
                أقر بأن جميع المعلومات المقدمة صحيحة ودقيقة، وأتحمل المسؤولية الكاملة عن صحتها.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="notifications"
                checked={confirmNotifications}
                onCheckedChange={(checked) => setConfirmNotifications(checked as boolean)}
                className="mt-1"
              />
              <label 
                htmlFor="notifications" 
                className="text-sm cursor-pointer leading-relaxed text-muted-foreground"
              >
                أوافق على استلام إشعارات بخصوص حالة طلبي عبر البريد الإلكتروني والرسائل النصية.
              </label>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3">
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
          className="flex-1 h-14 gap-2 text-lg font-semibold bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جارٍ الإرسال...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>إرسال الطلب</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
