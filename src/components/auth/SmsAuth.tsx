import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Loader2, CheckCircle2, ArrowRight, User, Mail, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

interface SmsAuthProps {
  onSuccess: (phone: string) => void;
  onBack: () => void;
  isSignUp?: boolean;
}

export const SmsAuth = ({ onSuccess, onBack, isSignUp = false }: SmsAuthProps) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingUserName, setExistingUserName] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const autoVerifyTriggered = useRef(false);

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const { t, isRtl } = useLanguage();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [expiresIn]);

  const formatPhoneDisplay = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(0, 10);
    }
    return cleaned;
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 9) {
      toast({
        title: t("خطأ", "Error"),
        description: t("يرجى إدخال رقم جوال صحيح", "Please enter a valid phone number"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('sms-auth', {
        body: { action: 'send', phone },
      });

      if (error && !data) throw error;

      if (data.success) {
        setStep('otp');
        setOtp('');
        autoVerifyTriggered.current = false;
        setExpiresIn(data.expires_in || 300);
        setIsExistingUser(data.is_existing_user || false);
        setExistingUserName(data.user_name || '');

        toast({
          title: t("تم الإرسال", "Sent"),
          description: data.is_existing_user
            ? t(
                `مرحباً ${data.user_name || 'بك'}! تم إرسال رمز التحقق عبر SMS`,
                `Welcome back ${data.user_name || ''}! OTP sent via SMS`
              )
            : t("تم إرسال رمز التحقق عبر SMS", "Verification code sent via SMS"),
        });
      } else {
        if (data.cooldown) setCooldown(data.cooldown);
        toast({
          title: t("خطأ", "Error"),
          description: data.error || t("فشل إرسال رمز التحقق", "Failed to send verification code"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('SMS OTP error:', error);
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء إرسال رمز التحقق", "An error occurred while sending the code"),
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
      const { data, error } = await supabase.functions.invoke('sms-auth', {
        body: { action: 'verify', phone, otp: otpToVerify },
      });

      const responseData = data || (error ? await (async () => {
        try {
          if (error instanceof Error && 'context' in error) {
            const ctx = (error as any).context;
            if (ctx?.json) return await ctx.json();
            if (ctx?.body) return JSON.parse(await ctx.text());
          }
          return null;
        } catch { return null; }
      })() : null);

      if (!responseData && error) throw error;

      if (responseData?.success) {
        const d = responseData;
        if (d.is_existing_user && d.user_email) {
          try {
            if (d.token_hash) {
              const { error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: d.token_hash,
                type: 'magiclink',
              });

              if (!verifyError) {
                toast({
                  title: t("مرحباً بعودتك!", "Welcome back!"),
                  description: `${d.user_name || t('تم تسجيل الدخول بنجاح', 'Logged in successfully')}`,
                });
                onSuccess(d.phone);
                navigate("/dashboard");
                return;
              }
            }

            const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
              email: d.user_email,
              password: d.phone,
            });

            if (!signInError && sessionData.session) {
              toast({
                title: t("مرحباً بعودتك!", "Welcome back!"),
                description: `${d.user_name || t('تم تسجيل الدخول بنجاح', 'Logged in successfully')}`,
              });
              onSuccess(d.phone);
              navigate("/dashboard");
              return;
            }

            toast({
              title: t("تم التحقق من الرقم", "Number verified"),
              description: t("يرجى تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور", "Please login with your email and password"),
              variant: "default",
            });
            onBack();
          } catch (signInErr) {
            console.error('Auto sign-in error:', signInErr);
            toast({
              title: t("تم التحقق من الرقم", "Number verified"),
              description: t("يرجى تسجيل الدخول باستخدام البريد الإلكتروني", "Please login with your email"),
            });
            onBack();
          }
        } else if (d.needs_registration) {
          setVerifiedPhone(d.phone);
          setStep('register');
          toast({
            title: t("تم التحقق", "Verified"),
            description: t("أكمل بياناتك لإنشاء حسابك", "Complete your details to create your account"),
          });
        } else {
          onSuccess(d.phone || phone);
        }
      } else {
        const errData = responseData || {};
        toast({
          title: t("خطأ", "Error"),
          description: errData.error || t("رمز التحقق غير صحيح", "Invalid verification code"),
          variant: "destructive",
        });
        if (errData.remaining_attempts !== undefined && errData.remaining_attempts <= 0) {
          setStep('phone');
          setOtp('');
        }
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({
        title: t("خطأ", "Error"),
        description: t("حدث خطأ أثناء التحقق", "An error occurred during verification"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [otp, phone, isLoading, toast, t, onSuccess, onBack, navigate]);

  // Auto-verify when OTP reaches 6 digits
  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6 && !autoVerifyTriggered.current && !isLoading) {
      autoVerifyTriggered.current = true;
      // Small delay to let the UI update
      setTimeout(() => {
        handleVerifyOTP(value);
      }, 300);
    }
    if (value.length < 6) {
      autoVerifyTriggered.current = false;
    }
  };

  const handleRegister = async () => {
    if (!registerData.name.trim()) {
      toast({ title: t("خطأ", "Error"), description: t("يرجى إدخال الاسم", "Please enter your name"), variant: "destructive" });
      return;
    }
    if (!registerData.email.trim() || !registerData.email.includes('@')) {
      toast({ title: t("خطأ", "Error"), description: t("يرجى إدخال بريد إلكتروني صحيح", "Please enter a valid email"), variant: "destructive" });
      return;
    }
    if (!registerData.password || registerData.password.length < 6) {
      toast({ title: t("خطأ", "Error"), description: t("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "Password must be at least 6 characters"), variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '966' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('966') && formattedPhone.length === 9) {
        formattedPhone = '966' + formattedPhone;
      }

      const { error } = await signUp(
        registerData.email,
        registerData.password,
        registerData.name,
        formattedPhone
      );

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({ title: t("خطأ", "Error"), description: t("هذا البريد الإلكتروني مسجل بالفعل", "This email is already registered"), variant: "destructive" });
        } else {
          toast({ title: t("خطأ", "Error"), description: error.message, variant: "destructive" });
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ phone: formattedPhone, phone_verified: true })
            .eq('id', user.id);
        }

        toast({ title: t("تم إنشاء الحساب!", "Account created!"), description: t("مرحباً بك في ASH HOLDING", "Welcome to ASH HOLDING") });
        onSuccess(formattedPhone);
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({ title: t("خطأ", "Error"), description: t("حدث خطأ أثناء إنشاء الحساب", "An error occurred during registration"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone-step"
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
                <Smartphone className="w-8 h-8 text-primary" />
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {t("الدخول عبر رسالة نصية", "Login via SMS")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("أدخل رقم جوالك وسنرسل لك رمز التحقق عبر SMS", "Enter your phone number and we'll send you a verification code via SMS")}
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="sms-phone" className="text-sm font-medium">
                {t("رقم الجوال", "Phone Number")}
              </Label>
              <div className="relative">
                <Phone className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
                <div className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium`}>
                  +966
                </div>
                <Input
                  id="sms-phone"
                  type="tel"
                  placeholder="5XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                  className={`${isRtl ? 'pr-10 pl-14' : 'pl-10 pr-14'} h-12 text-base rounded-xl bg-background`}
                  dir="ltr"
                  maxLength={10}
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
                disabled={isLoading || cooldown > 0 || phone.length < 9}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : cooldown > 0 ? (
                  t(`انتظر ${cooldown} ثانية`, `Wait ${cooldown}s`)
                ) : (
                  <>
                    <Smartphone className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {t("إرسال الرمز", "Send Code")}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : step === 'otp' ? (
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
                {isExistingUser 
                  ? t(`مرحباً ${existingUserName || 'بك'}!`, `Welcome ${existingUserName || 'back'}!`)
                  : t('أدخل رمز التحقق', 'Enter Verification Code')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("تم إرسال رمز مكون من 6 أرقام عبر SMS إلى الرقم", "A 6-digit code was sent via SMS to")}
              </p>
              <p className="text-sm font-medium text-primary" dir="ltr">+966{phone}</p>
              {expiresIn > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t(`ينتهي خلال ${formatTime(expiresIn)}`, `Expires in ${formatTime(expiresIn)}`)}
                </p>
              )}
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
                onClick={() => { setStep('phone'); setOtp(''); autoVerifyTriggered.current = false; }}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
              >
                {t("تغيير الرقم", "Change Number")}
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
                  isExistingUser ? t("تسجيل الدخول", "Sign In") : t("تحقق", "Verify")
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
        ) : (
          <motion.div
            key="register-step"
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
                <User className="w-8 h-8 text-primary" />
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{t("إنشاء حساب جديد", "Create New Account")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("تم التحقق من رقمك. أكمل بياناتك لإنشاء حسابك", "Your number is verified. Complete your details to create your account")}
              </p>
              <p className="text-sm font-medium text-primary" dir="ltr">+966{phone}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sms-name" className="text-sm font-medium">{t("الاسم الكامل", "Full Name")}</Label>
                <div className="relative">
                  <User className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
                  <Input
                    id="sms-name"
                    placeholder={t("محمد أحمد", "John Doe")}
                    value={registerData.name}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                    className={`${isRtl ? 'pr-10' : 'pl-10'} h-12 rounded-xl bg-background`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-email" className="text-sm font-medium">{t("البريد الإلكتروني", "Email")}</Label>
                <div className="relative">
                  <Mail className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
                  <Input
                    id="sms-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className={`${isRtl ? 'pr-10' : 'pl-10'} h-12 rounded-xl bg-background`}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-password" className="text-sm font-medium">{t("كلمة المرور", "Password")}</Label>
                <div className="relative">
                  <Lock className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
                  <Input
                    id="sms-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className={`${isRtl ? 'pr-10' : 'pl-10'} h-12 rounded-xl bg-background`}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setStep('phone'); setOtp(''); }}
                className="flex-1 h-12 rounded-xl"
              >
                {t("رجوع", "Back")}
              </Button>
              <Button
                type="button"
                onClick={handleRegister}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t("إنشاء الحساب", "Create Account")
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
