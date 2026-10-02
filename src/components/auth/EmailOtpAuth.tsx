import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

interface EmailOtpAuthProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
  isSignUp?: boolean;
}

export const EmailOtpAuth = ({ onSuccess, onBack }: EmailOtpAuthProps) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const autoVerifyTriggered = useRef(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSendOTP = async () => {
    if (!isValidEmail(email)) {
      toast({
        title: t("خطأ", "Error"),
        description: t("يرجى إدخال بريد إلكتروني صحيح", "Please enter a valid email address"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: res, error } = await supabase.functions.invoke('email-login-otp', {
        body: { action: 'send', email: email.trim().toLowerCase() },
      });

      if (error || !res?.ok) throw new Error(res?.error === 'rate_limited' ? 'rate' : (error?.message || 'failed'));

      setStep('otp');
      setOtp('');
      autoVerifyTriggered.current = false;
      setCooldown(60);

      toast({
        title: t("تم الإرسال", "Sent"),
        description: t("تم إرسال رمز التحقق إلى بريدك الإلكتروني", "Verification code sent to your email"),
      });
    } catch (error: any) {
      console.error('Email OTP error:', error);
      toast({
        title: t("خطأ", "Error"),
        description: error?.message?.includes("rate")
          ? t("تم تجاوز حد الإرسال، حاول لاحقاً", "Send rate limit exceeded, try later")
          : t("حدث خطأ أثناء إرسال رمز التحقق", "An error occurred while sending the code"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = useCallback(async (otpValue?: string) => {
    const otpToVerify = otpValue || otp;
    if (!otpToVerify || otpToVerify.length !== 6) return;
    if (isLoading) return;

    setIsLoading(true);

    try {
      const { data: res, error: fnError } = await supabase.functions.invoke('email-login-otp', {
        body: { action: 'verify', email: email.trim().toLowerCase(), code: otpToVerify },
      });
      if (fnError || !res?.token_hash) throw fnError || new Error('invalid');
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: res.token_hash,
        type: 'magiclink',
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: t("مرحباً بك!", "Welcome!"),
          description: t("تم تسجيل دخولك بنجاح", "You have logged in successfully"),
        });
        onSuccess(email);
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error('Verify email OTP error:', error);
      toast({
        title: t("خطأ", "Error"),
        description: t("رمز التحقق غير صحيح أو منتهي الصلاحية", "Invalid or expired verification code"),
        variant: "destructive",
      });
      autoVerifyTriggered.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [otp, email, isLoading, toast, t, onSuccess, navigate]);

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6 && !autoVerifyTriggered.current && !isLoading) {
      autoVerifyTriggered.current = true;
      setTimeout(() => {
        handleVerifyOTP(value);
      }, 300);
    }
    if (value.length < 6) {
      autoVerifyTriggered.current = false;
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {step === 'email' ? (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
            className="space-y-5"
          >
            <div className="flex justify-center">
              <motion.div
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Mail className="w-8 h-8 text-primary" />
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {t("الدخول برمز التحقق", "Login with Verification Code")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("أدخل بريدك الإلكتروني وسنرسل لك رمز دخول مكوناً من 6 أرقام — بدون كلمة مرور", "Enter your email and we'll send you a 6-digit login code — no password needed")}
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="otp-email" className="text-sm font-medium">
                {t("البريد الإلكتروني", "Email Address")}
              </Label>
              <div className="relative">
                <Mail className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
                <Input
                  id="otp-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${isRtl ? 'pr-10' : 'pl-10'} h-12 text-base rounded-xl bg-background`}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1 h-12 rounded-xl"
              >
                {isRtl && <ArrowRight className="w-4 h-4 ml-2" />}
                {t("رجوع", "Back")}
                {!isRtl && <ArrowRight className="w-4 h-4 mr-2 rotate-180" />}
              </Button>
              <Button
                type="button"
                onClick={handleSendOTP}
                disabled={isLoading || cooldown > 0 || !isValidEmail(email)}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : cooldown > 0 ? (
                  t(`انتظر ${cooldown} ثانية`, `Wait ${cooldown}s`)
                ) : (
                  <>
                    <KeyRound className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {t("إرسال الرمز", "Send Code")}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
            className="space-y-5"
          >
            <div className="flex justify-center">
              <motion.div
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {isLoading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                )}
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {t('أدخل رمز التحقق', 'Enter Verification Code')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("تم إرسال رمز مكون من 6 أرقام إلى", "A 6-digit code was sent to")}
              </p>
              <p className="text-sm font-medium text-primary" dir="ltr">{email}</p>
              {isLoading && (
                <motion.p
                  className="text-xs text-primary font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {t("جاري التحقق...", "Verifying...")}
                </motion.p>
              )}
            </div>

            <div className="flex justify-center" dir="ltr">
              <InputOTP value={otp} onChange={handleOtpChange} maxLength={6} disabled={isLoading}>
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} className="w-12 h-12 text-lg rounded-xl border-2" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setStep('email'); setOtp(''); autoVerifyTriggered.current = false; }}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
              >
                {t("تغيير البريد", "Change Email")}
              </Button>
              <Button
                type="button"
                onClick={() => handleVerifyOTP()}
                disabled={isLoading || otp.length !== 6}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t("تسجيل الدخول", "Sign In")
                )}
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={cooldown > 0 || isLoading}
                className="text-sm text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors"
              >
                {cooldown > 0
                  ? t(`إعادة الإرسال بعد ${cooldown} ثانية`, `Resend in ${cooldown}s`)
                  : t('إعادة إرسال الرمز', 'Resend Code')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
