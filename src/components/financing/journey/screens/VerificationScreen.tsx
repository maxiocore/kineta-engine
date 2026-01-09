/**
 * Verification Screen - OTP Verification
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck,
  Loader2,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { MICROCOPY } from "@/lib/financing/journeyConfig";
import type { JourneyFormData } from "../FinancingJourneyWizard";

interface VerificationScreenProps {
  formData: JourneyFormData;
  updateFormData: (updates: Partial<JourneyFormData>) => void;
  goNext: () => void;
  goBack: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  onVerified: () => void;
}

export function VerificationScreen({ 
  formData,
  isProcessing,
  setIsProcessing,
  onVerified
}: VerificationScreenProps) {
  const { verification } = MICROCOPY;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("يرجى إدخال الرمز كاملاً");
      return;
    }

    setIsVerifying(true);
    setError("");

    // Simulate OTP verification
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo, accept any 6-digit code
    if (otp.length === 6) {
      setIsVerified(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onVerified();
    } else {
      setError("رمز التحقق غير صحيح");
    }

    setIsVerifying(false);
  };

  const handleResend = async () => {
    setResendCountdown(60);
    toast.success("تم إرسال رمز جديد");
  };

  if (isVerified) {
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
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Smartphone className="h-10 w-10 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">{verification.title}</h2>
        <p className="text-muted-foreground">{verification.subtitle}</p>
      </div>

      {/* Phone Number Display */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">تم إرسال رمز التحقق إلى</p>
          <p className="text-lg font-mono font-bold" dir="ltr">
            {formData.phone ? `+966 ${formData.phone.slice(-9)}` : "رقم الجوال المسجل"}
          </p>
        </CardContent>
      </Card>

      {/* OTP Input */}
      <div className="flex flex-col items-center gap-4">
        <InputOTP
          value={otp}
          onChange={setOtp}
          maxLength={6}
          disabled={isVerifying}
        >
          <InputOTPGroup className="gap-2" dir="ltr">
            <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
          </InputOTPGroup>
        </InputOTP>

        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>

      {/* Verify Button */}
      <Button
        onClick={handleVerify}
        disabled={otp.length !== 6 || isVerifying}
        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
            جارٍ التحقق...
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5 ml-2" />
            تأكيد الرمز
          </>
        )}
      </Button>

      {/* Resend */}
      <div className="text-center">
        {resendCountdown > 0 ? (
          <p className="text-sm text-muted-foreground">
            إعادة الإرسال بعد {resendCountdown} ثانية
          </p>
        ) : (
          <Button
            variant="ghost"
            onClick={handleResend}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة إرسال الرمز
          </Button>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-center text-muted-foreground">
        لم يصلك الرمز؟ تأكد من صحة رقم الجوال أو تواصل مع الدعم
      </p>
    </div>
  );
}
