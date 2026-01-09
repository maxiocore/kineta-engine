import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Clock, 
  AlertTriangle,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useEmailVerification, EmailVerificationStatus } from '@/hooks/useEmailVerification';
import { cn } from '@/lib/utils';

interface EmailVerificationStepProps {
  onVerified: (email: string) => void;
  onStatusChange?: (status: EmailVerificationStatus) => void;
  purpose?: string;
  initialEmail?: string;
}

const StatusIndicator = ({ status }: { status: EmailVerificationStatus }) => {
  const config = {
    NOT_STARTED: { icon: Mail, color: 'text-muted-foreground', bg: 'bg-muted', label: 'لم تبدأ' },
    PENDING: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'في الانتظار' },
    PASSED: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'تم التحقق' },
    FAILED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'فشل' },
    EXPIRED: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'انتهت الصلاحية' },
    LOCKED: { icon: Lock, color: 'text-red-500', bg: 'bg-red-500/10', label: 'مقفل' },
    LOCK_EXPIRED: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'أعد المحاولة' },
  };

  const { icon: Icon, color, bg, label } = config[status];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", bg, color)}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </motion.div>
  );
};

const CountdownTimer = ({ seconds, label }: { seconds: number; label: string }) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds <= 60;

  return (
    <motion.div 
      className={cn(
        "flex items-center gap-2 font-mono text-lg",
        isLow ? "text-red-500" : "text-amber-500"
      )}
      animate={isLow ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: isLow ? Infinity : 0, duration: 1 }}
    >
      <Clock className="h-5 w-5" />
      <span>{String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </motion.div>
  );
};

const AttemptsIndicator = ({ current, max }: { current: number; max: number }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">المحاولات:</span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              i < current ? "bg-red-500" : "bg-muted"
            )}
            initial={i === current - 1 ? { scale: 0 } : {}}
            animate={i === current - 1 ? { scale: 1 } : {}}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        ({max - current} متبقية)
      </span>
    </div>
  );
};

export function EmailVerificationStep({ 
  onVerified, 
  onStatusChange,
  purpose = 'financing_eligibility',
  initialEmail = ''
}: EmailVerificationStepProps) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [showEmail, setShowEmail] = useState(true);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    maskedEmail,
    attemptsCount,
    maxAttempts,
    countdown,
    resendCooldown,
    error,
    errorCode,
    remainingAttempts,
    lockedRemainingMinutes,
    isLoading,
    isSending,
    isVerifying,
    sendOTP,
    verifyOTP,
    checkStatus,
    reset,
    canResend,
    isPassed,
    isLocked,
    isPending,
  } = useEmailVerification({
    purpose,
    onVerified,
    onLocked: () => {
      setOtp('');
    }
  });

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Notify parent of status changes
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && isPending) {
      verifyOTP(otp);
    }
  }, [otp, isPending, verifyOTP]);

  // Email validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOTP = async () => {
    if (!isValidEmail) return;
    const success = await sendOTP(email);
    if (success) {
      setOtp('');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    await sendOTP(email);
    setOtp('');
  };

  // Render based on status
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">جارِ التحقق من الحالة...</p>
      </div>
    );
  }

  if (isPassed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-8 gap-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </motion.div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-emerald-500 mb-2">تم التحقق بنجاح</h3>
          <p className="text-muted-foreground">
            تم تأكيد البريد الإلكتروني: <span className="text-foreground font-medium">{maskedEmail}</span>
          </p>
        </div>
        <StatusIndicator status="PASSED" />
      </motion.div>
    );
  }

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center py-8 gap-6"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
          className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center"
        >
          <Lock className="h-10 w-10 text-red-500" />
        </motion.div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-500 mb-2">الحساب مقفل مؤقتاً</h3>
          <p className="text-muted-foreground mb-4">
            تم تجاوز الحد الأقصى لمحاولات التحقق
          </p>
          {lockedRemainingMinutes && lockedRemainingMinutes > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-medium">
                أعد المحاولة بعد {lockedRemainingMinutes} دقيقة
              </p>
            </div>
          )}
        </div>
        <StatusIndicator status="LOCKED" />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">التحقق من البريد الإلكتروني</h3>
            <p className="text-sm text-muted-foreground">أدخل بريدك الإلكتروني لتلقي رمز التحقق</p>
          </div>
        </div>
        <StatusIndicator status={status} />
      </div>

      {/* Email Input Phase */}
      <AnimatePresence mode="wait">
        {status === 'NOT_STARTED' || status === 'EXPIRED' || status === 'LOCK_EXPIRED' ? (
          <motion.div
            key="email-input"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                البريد الإلكتروني
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type={showEmail ? 'email' : 'password'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@company.com"
                  className="pl-10 text-left ltr"
                  dir="ltr"
                  disabled={isSending}
                />
                <button
                  type="button"
                  onClick={() => setShowEmail(!showEmail)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showEmail ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {email && !isValidEmail && (
                <p className="text-sm text-destructive">صيغة البريد الإلكتروني غير صحيحة</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-200">
                <p className="font-medium mb-1">تنبيه أمني:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                  <li>لا نقبل البريد المؤقت (Disposable Email)</li>
                  <li>لا يمكن استخدام نفس البريد لأكثر من حساب</li>
                  <li>الرمز صالح لـ 10 دقائق فقط</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={handleSendOTP}
              disabled={!isValidEmail || isSending}
              className="w-full"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جارِ الإرسال...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  إرسال رمز التحقق
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="otp-input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Countdown & Attempts */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <CountdownTimer seconds={countdown} label="الوقت المتبقي" />
              <AttemptsIndicator current={attemptsCount} max={maxAttempts} />
            </div>

            {/* Masked Email Display */}
            <div className="text-center">
              <p className="text-muted-foreground mb-1">تم إرسال الرمز إلى:</p>
              <p className="font-mono text-lg tracking-wide">{maskedEmail || email}</p>
            </div>

            {/* OTP Input */}
            <div className="flex flex-col items-center gap-4">
              <Label className="text-center">أدخل رمز التحقق المكون من 6 أرقام</Label>
              <InputOTP 
                maxLength={6} 
                value={otp} 
                onChange={setOtp}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => verifyOTP(otp)}
                disabled={otp.length !== 6 || isVerifying}
                className="flex-1"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جارِ التحقق...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                    تحقق
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleResend}
                disabled={!canResend || isSending || resendCooldown > 0}
                className="flex-1"
                size="lg"
              >
                {resendCooldown > 0 ? (
                  <>
                    <Clock className="h-4 w-4 ml-2" />
                    إعادة الإرسال ({resendCooldown}ث)
                  </>
                ) : isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جارِ الإرسال...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 ml-2" />
                    إعادة الإرسال
                  </>
                )}
              </Button>
            </div>

            {/* Change Email */}
            <button
              onClick={reset}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline mx-auto block"
            >
              تغيير البريد الإلكتروني
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
