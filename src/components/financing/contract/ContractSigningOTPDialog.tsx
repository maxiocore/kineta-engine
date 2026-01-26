/**
 * مكون إدخال رمز التحقق لتوقيع العقد
 * Contract Signing OTP Input Component
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Smartphone, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCw,
  Lock,
  Shield
} from 'lucide-react';

interface ContractSigningOTPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  applicationId: string;
  contractNumber: string;
  phoneMasked: string;
  onSuccess: () => void;
  readingTimeSeconds: number;
  scrollPercentage: number;
}

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60;

export function ContractSigningOTPDialog({
  open,
  onOpenChange,
  contractId,
  applicationId,
  contractNumber,
  phoneMasked,
  onSuccess,
  readingTimeSeconds,
  scrollPercentage
}: ContractSigningOTPDialogProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [expiresIn, setExpiresIn] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [idempotencyKey] = useState(() => `sign-${contractId}-${Date.now()}`);

  // Countdown timers
  useEffect(() => {
    if (!otpSent || !open) return;

    const timer = setInterval(() => {
      setExpiresIn(prev => {
        if (prev <= 0) {
          setError('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent, open]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Send OTP
  const handleSendOTP = async () => {
    setIsSending(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'contract-signing-otp',
        {
          body: {
            action: 'send',
            contract_id: contractId,
            application_id: applicationId,
            idempotency_key: idempotencyKey,
            reading_time_seconds: readingTimeSeconds,
            scroll_percentage: scrollPercentage
          }
        }
      );

      if (invokeError) throw invokeError;

      if (!data.success) {
        if (data.locked) {
          setIsLocked(true);
          setError(data.error);
          return;
        }
        throw new Error(data.error);
      }

      setOtpSent(true);
      setExpiresIn(data.expires_in || OTP_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success('تم إرسال رمز التحقق عبر واتساب');
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err instanceof Error ? err.message : 'فشل إرسال رمز التحقق');
    } finally {
      setIsSending(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== OTP_LENGTH) {
      setError('يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'contract-signing-otp',
        {
          body: {
            action: 'verify',
            contract_id: contractId,
            application_id: applicationId,
            otp
          }
        }
      );

      if (invokeError) throw invokeError;

      if (!data.success) {
        if (data.locked) {
          setIsLocked(true);
        }
        if (data.remaining_attempts !== undefined) {
          setRemainingAttempts(data.remaining_attempts);
        }
        setError(data.error);
        setOtp('');
        return;
      }

      toast.success('تم توقيع العقد بنجاح! 🎉');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err instanceof Error ? err.message : 'فشل التحقق من الرمز');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setOtp('');
      setError(null);
      setOtpSent(false);
    }
  }, [open]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            تأكيد توقيع العقد
          </DialogTitle>
          <DialogDescription>
            عقد رقم: {contractNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Locked State */}
          {isLocked && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                {error || 'تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Initial State - Send OTP */}
          {!otpSent && !isLocked && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-medium">التحقق عبر واتساب</h3>
                <p className="text-sm text-muted-foreground">
                  سيتم إرسال رمز تحقق إلى رقم الجوال المسجل
                </p>
                <p className="text-sm font-mono bg-muted p-2 rounded">
                  {phoneMasked}
                </p>
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={isSending}
                className="w-full gap-2"
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جارٍ الإرسال...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    إرسال رمز التحقق
                  </>
                )}
              </Button>
            </div>
          )}

          {/* OTP Input State */}
          {otpSent && !isLocked && (
            <div className="space-y-4">
              {/* Timer */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>صلاحية الرمز:</span>
                </div>
                <span className={expiresIn < 60 ? 'text-red-500 font-medium' : ''}>
                  {formatTime(expiresIn)}
                </span>
              </div>
              <Progress value={(expiresIn / OTP_EXPIRY_SECONDS) * 100} className="h-1.5" />

              {/* OTP Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-center block">
                  أدخل رمز التحقق المرسل عبر واتساب
                </label>
                <div className="flex justify-center" dir="ltr">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={OTP_LENGTH}
                    disabled={isVerifying || expiresIn === 0}
                  >
                    <InputOTPGroup>
                      {[...Array(OTP_LENGTH)].map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Remaining Attempts Warning */}
              {remainingAttempts < 3 && remainingAttempts > 0 && (
                <Alert>
                  <AlertDescription className="text-amber-600">
                    ⚠️ المحاولات المتبقية: {remainingAttempts}
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== OTP_LENGTH || isVerifying || expiresIn === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جارٍ التحقق...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      تأكيد وتوقيع العقد
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSendOTP}
                  disabled={resendCooldown > 0 || isSending}
                  className="w-full gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {resendCooldown > 0
                    ? `إعادة الإرسال (${resendCooldown})`
                    : 'إعادة إرسال الرمز'
                  }
                </Button>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>🔒 جميع البيانات مشفرة ومحمية</p>
            <p>لن نطلب منك هذا الرمز عبر الهاتف أو الواتساب</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
