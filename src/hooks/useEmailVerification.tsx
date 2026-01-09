import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EmailVerificationStatus = 
  | 'NOT_STARTED' 
  | 'PENDING' 
  | 'PASSED' 
  | 'FAILED' 
  | 'EXPIRED' 
  | 'LOCKED'
  | 'LOCK_EXPIRED';

interface VerificationState {
  status: EmailVerificationStatus;
  email?: string;
  maskedEmail?: string;
  attemptsCount: number;
  maxAttempts: number;
  expiresAt?: Date;
  expiresInSeconds?: number;
  lockedUntil?: Date;
  lockedRemainingMinutes?: number;
  verifiedAt?: Date;
  error?: string;
  errorCode?: string;
  remainingAttempts?: number;
}

interface UseEmailVerificationOptions {
  purpose?: string;
  onVerified?: (email: string) => void;
  onLocked?: () => void;
}

export function useEmailVerification(options: UseEmailVerificationOptions = {}) {
  const { 
    purpose = 'financing_eligibility', 
    onVerified, 
    onLocked 
  } = options;

  const [state, setState] = useState<VerificationState>({
    status: 'NOT_STARTED',
    attemptsCount: 0,
    maxAttempts: 3,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const countdownRef = useRef<NodeJS.Timeout>();
  const resendCooldownRef = useRef<NodeJS.Timeout>();

  // Clear intervals on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setState(s => ({ ...s, status: 'EXPIRED' }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [countdown]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      resendCooldownRef.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(resendCooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
    };
  }, [resendCooldown]);

  // Check current status
  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(s => ({ ...s, error: 'يجب تسجيل الدخول أولاً', errorCode: 'NOT_AUTHENTICATED' }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('email-otp', {
        body: { action: 'status', purpose },
      });

      if (error) throw error;

      setState({
        status: data.status as EmailVerificationStatus,
        email: data.email,
        attemptsCount: data.attempts_count || 0,
        maxAttempts: data.max_attempts || 3,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        lockedUntil: data.locked_until ? new Date(data.locked_until) : undefined,
        verifiedAt: data.verified_at ? new Date(data.verified_at) : undefined,
      });

      // Set countdown if pending
      if (data.status === 'PENDING' && data.expires_at) {
        const remaining = Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000));
        setCountdown(remaining);
      }

      // Calculate locked remaining time
      if (data.status === 'LOCKED' && data.locked_until) {
        const remaining = Math.max(0, Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 60000));
        setState(s => ({ ...s, lockedRemainingMinutes: remaining }));
      }

    } catch (err: any) {
      console.error('Status check error:', err);
      setState(s => ({ ...s, error: 'فشل جلب الحالة', errorCode: 'STATUS_CHECK_FAILED' }));
    } finally {
      setIsLoading(false);
    }
  }, [purpose]);

  // Send OTP
  const sendOTP = useCallback(async (email: string) => {
    setIsSending(true);
    setState(s => ({ ...s, error: undefined, errorCode: undefined }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(s => ({ ...s, error: 'يجب تسجيل الدخول أولاً', errorCode: 'NOT_AUTHENTICATED' }));
        return false;
      }

      const { data, error } = await supabase.functions.invoke('email-otp', {
        body: { action: 'send', email, purpose },
      });

      if (error) {
        const errorData = error.message ? JSON.parse(error.message) : { error: 'فشل الإرسال' };
        setState(s => ({ 
          ...s, 
          error: errorData.error, 
          errorCode: errorData.code,
          lockedRemainingMinutes: errorData.remaining_minutes
        }));

        if (errorData.code === 'RESEND_COOLDOWN') {
          setResendCooldown(errorData.remaining_seconds || 60);
        }

        return false;
      }

      setState(s => ({
        ...s,
        status: 'PENDING',
        email: email,
        maskedEmail: data.masked_email,
        expiresAt: new Date(data.expires_at),
        expiresInSeconds: data.expires_in_seconds,
        attemptsCount: 0,
        error: undefined,
        errorCode: undefined,
      }));

      setCountdown(data.expires_in_seconds || 600);
      setResendCooldown(60);

      return true;

    } catch (err: any) {
      console.error('Send OTP error:', err);
      
      // Try to parse error message
      let errorMessage = 'فشل إرسال الرمز. حاول مرة أخرى.';
      let errorCode = 'SEND_FAILED';
      
      try {
        const parsed = JSON.parse(err.message);
        errorMessage = parsed.error || errorMessage;
        errorCode = parsed.code || errorCode;
        
        if (parsed.remaining_seconds) {
          setResendCooldown(parsed.remaining_seconds);
        }
      } catch {}

      setState(s => ({ ...s, error: errorMessage, errorCode }));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [purpose]);

  // Verify OTP
  const verifyOTP = useCallback(async (otp: string) => {
    setIsVerifying(true);
    setState(s => ({ ...s, error: undefined, errorCode: undefined }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(s => ({ ...s, error: 'يجب تسجيل الدخول أولاً', errorCode: 'NOT_AUTHENTICATED' }));
        return false;
      }

      const { data, error } = await supabase.functions.invoke('email-otp', {
        body: { action: 'verify', otp, purpose },
      });

      if (error) {
        let errorData;
        try {
          errorData = JSON.parse(error.message);
        } catch {
          errorData = { error: 'فشل التحقق', code: 'VERIFY_FAILED' };
        }

        setState(s => ({ 
          ...s, 
          error: errorData.error, 
          errorCode: errorData.code,
          remainingAttempts: errorData.remaining_attempts,
          attemptsCount: s.maxAttempts - (errorData.remaining_attempts || 0),
        }));

        if (errorData.code === 'ACCOUNT_LOCKED') {
          setState(s => ({ 
            ...s, 
            status: 'LOCKED',
            lockedUntil: new Date(errorData.locked_until)
          }));
          onLocked?.();
        }

        return false;
      }

      if (data.success && data.status === 'PASSED') {
        setState(s => ({
          ...s,
          status: 'PASSED',
          verifiedAt: new Date(),
          email: data.verified_email,
          error: undefined,
          errorCode: undefined,
        }));

        setCountdown(0);
        onVerified?.(data.verified_email);
        return true;
      }

      return false;

    } catch (err: any) {
      console.error('Verify OTP error:', err);
      
      let errorMessage = 'فشل التحقق. حاول مرة أخرى.';
      let errorCode = 'VERIFY_FAILED';
      let remainingAttempts;
      
      try {
        const parsed = JSON.parse(err.message);
        errorMessage = parsed.error || errorMessage;
        errorCode = parsed.code || errorCode;
        remainingAttempts = parsed.remaining_attempts;
        
        if (parsed.code === 'ACCOUNT_LOCKED') {
          setState(s => ({ 
            ...s, 
            status: 'LOCKED',
            lockedUntil: parsed.locked_until ? new Date(parsed.locked_until) : undefined
          }));
          onLocked?.();
        }
      } catch {}

      setState(s => ({ 
        ...s, 
        error: errorMessage, 
        errorCode,
        remainingAttempts
      }));
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [purpose, onVerified, onLocked]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      status: 'NOT_STARTED',
      attemptsCount: 0,
      maxAttempts: 3,
    });
    setCountdown(0);
    setResendCooldown(0);
  }, []);

  // Format countdown
  const formatCountdown = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    ...state,
    countdown,
    resendCooldown,
    formattedCountdown: formatCountdown(countdown),
    formattedResendCooldown: formatCountdown(resendCooldown),
    
    // Loading states
    isLoading,
    isSending,
    isVerifying,
    
    // Actions
    checkStatus,
    sendOTP,
    verifyOTP,
    reset,
    
    // Computed
    canResend: resendCooldown === 0 && state.status !== 'LOCKED' && state.status !== 'PASSED',
    isPassed: state.status === 'PASSED',
    isLocked: state.status === 'LOCKED',
    isPending: state.status === 'PENDING',
    isExpired: state.status === 'EXPIRED' || countdown === 0,
  };
}
