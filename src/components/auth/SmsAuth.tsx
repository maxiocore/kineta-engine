import { useState, useEffect } from "react";
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

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

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
        title: "خطأ",
        description: "يرجى إدخال رقم جوال صحيح",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('sms-auth', {
        body: { action: 'send', phone },
      });

      if (error) throw error;

      if (data.success) {
        setStep('otp');
        setExpiresIn(data.expires_in || 300);
        setIsExistingUser(data.is_existing_user || false);
        setExistingUserName(data.user_name || '');

        toast({
          title: "تم الإرسال",
          description: data.is_existing_user
            ? `مرحباً ${data.user_name || 'بك'}! تم إرسال رمز التحقق عبر SMS`
            : "تم إرسال رمز التحقق عبر SMS",
        });
      } else {
        if (data.cooldown) setCooldown(data.cooldown);
        toast({
          title: "خطأ",
          description: data.error || "فشل إرسال رمز التحقق",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('SMS OTP error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال رمز التحقق",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز التحقق المكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('sms-auth', {
        body: { action: 'verify', phone, otp },
      });

      if (error) throw error;

      if (data.success) {
        if (data.is_existing_user && data.user_email) {
          try {
            if (data.token_hash) {
              const { error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: data.token_hash,
                type: 'magiclink',
              });

              if (!verifyError) {
                toast({
                  title: "مرحباً بعودتك!",
                  description: `${data.user_name || 'تم تسجيل الدخول بنجاح'}`,
                });
                onSuccess(data.phone);
                navigate("/dashboard");
                return;
              }
            }

            const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
              email: data.user_email,
              password: data.phone,
            });

            if (!signInError && sessionData.session) {
              toast({
                title: "مرحباً بعودتك!",
                description: `${data.user_name || 'تم تسجيل الدخول بنجاح'}`,
              });
              onSuccess(data.phone);
              navigate("/dashboard");
              return;
            }

            toast({
              title: "تم التحقق من الرقم",
              description: "يرجى تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور",
              variant: "default",
            });
            onBack();
          } catch (signInErr) {
            console.error('Auto sign-in error:', signInErr);
            toast({
              title: "تم التحقق من الرقم",
              description: "يرجى تسجيل الدخول باستخدام البريد الإلكتروني",
            });
            onBack();
          }
        } else if (data.needs_registration) {
          setVerifiedPhone(data.phone);
          setStep('register');
          toast({
            title: "تم التحقق",
            description: "أكمل بياناتك لإنشاء حسابك",
          });
        } else {
          onSuccess(data.phone || phone);
        }
      } else {
        toast({
          title: "خطأ",
          description: data.error || "رمز التحقق غير صحيح",
          variant: "destructive",
        });
        if (data.remaining_attempts !== undefined && data.remaining_attempts <= 0) {
          setStep('phone');
          setOtp('');
        }
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحقق",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.name.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال الاسم", variant: "destructive" });
      return;
    }
    if (!registerData.email.trim() || !registerData.email.includes('@')) {
      toast({ title: "خطأ", description: "يرجى إدخال بريد إلكتروني صحيح", variant: "destructive" });
      return;
    }
    if (!registerData.password || registerData.password.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
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
          toast({ title: "خطأ", description: "هذا البريد الإلكتروني مسجل بالفعل", variant: "destructive" });
        } else {
          toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ phone: formattedPhone, phone_verified: true })
            .eq('id', user.id);
        }

        toast({ title: "تم إنشاء الحساب!", description: "مرحباً بك في ASH HOLDING" });
        onSuccess(formattedPhone);
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء الحساب", variant: "destructive" });
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
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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
              <h3 className="text-lg font-semibold">الدخول عبر رسالة نصية</h3>
              <p className="text-sm text-muted-foreground">
                أدخل رقم جوالك وسنرسل لك رمز التحقق عبر SMS
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="sms-phone" className="text-sm font-medium">رقم الجوال</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  +966
                </div>
                <Input
                  id="sms-phone"
                  type="tel"
                  placeholder="5XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                  className="pr-10 pl-14 h-12 text-base rounded-xl bg-background"
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
                <ArrowRight className="w-4 h-4 ml-2" />
                رجوع
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
                  `انتظر ${cooldown} ثانية`
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 ml-2" />
                    إرسال الرمز
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : step === 'otp' ? (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="flex justify-center">
              <motion.div
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {isExistingUser ? `مرحباً ${existingUserName || 'بك'}!` : 'أدخل رمز التحقق'}
              </h3>
              <p className="text-sm text-muted-foreground">
                تم إرسال رمز مكون من 6 أرقام عبر SMS إلى الرقم
              </p>
              <p className="text-sm font-medium text-primary" dir="ltr">+966{phone}</p>
              {expiresIn > 0 && (
                <p className="text-xs text-muted-foreground">ينتهي خلال {formatTime(expiresIn)}</p>
              )}
            </div>

            <div className="flex justify-center" dir="ltr">
              <InputOTP value={otp} onChange={setOtp} maxLength={6}>
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
                onClick={() => { setStep('phone'); setOtp(''); }}
                className="flex-1 h-12 rounded-xl"
              >
                تغيير الرقم
              </Button>
              <Button
                type="button"
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  isExistingUser ? "تسجيل الدخول" : "تحقق"
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
                {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="register-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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
              <h3 className="text-lg font-semibold">إنشاء حساب جديد</h3>
              <p className="text-sm text-muted-foreground">
                تم التحقق من رقمك. أكمل بياناتك لإنشاء حسابك
              </p>
              <p className="text-sm font-medium text-primary" dir="ltr">+966{phone}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sms-name" className="text-sm font-medium">الاسم الكامل</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="sms-name"
                    placeholder="محمد أحمد"
                    value={registerData.name}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                    className="pr-10 h-12 rounded-xl bg-background text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-email" className="text-sm font-medium">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="sms-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className="pr-10 h-12 rounded-xl bg-background"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-password" className="text-sm font-medium">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="sms-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className="pr-10 h-12 rounded-xl bg-background"
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
                رجوع
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
                  "إنشاء الحساب"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
