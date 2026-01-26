/**
 * خدمة المصادقة الموحدة - Email Only + WhatsApp Notifications
 * Unified Auth Service with Login Lockout & Notifications
 * 
 * Features:
 * - Email-only authentication
 * - Login attempt tracking with lockout after 5 failures
 * - Password reset via email only
 * - WhatsApp notifications for security events (no OTP/sensitive data)
 */

import { supabase } from '@/integrations/supabase/client';

// Configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const LOCKOUT_KEY_PREFIX = 'auth_lockout_';

interface LoginAttemptInfo {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

interface AuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  lockedUntil?: Date;
  remainingAttempts?: number;
}

interface SignUpResult extends AuthResult {
  userId?: string;
  requiresVerification?: boolean;
}

/**
 * Get lockout info from localStorage
 */
function getLockoutInfo(email: string): LoginAttemptInfo | null {
  const key = LOCKOUT_KEY_PREFIX + email.toLowerCase();
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Save lockout info to localStorage
 */
function saveLockoutInfo(email: string, info: LoginAttemptInfo): void {
  const key = LOCKOUT_KEY_PREFIX + email.toLowerCase();
  localStorage.setItem(key, JSON.stringify(info));
}

/**
 * Clear lockout info
 */
function clearLockoutInfo(email: string): void {
  const key = LOCKOUT_KEY_PREFIX + email.toLowerCase();
  localStorage.removeItem(key);
}

/**
 * Check if account is currently locked
 */
export function isAccountLocked(email: string): { locked: boolean; lockedUntil?: Date; remainingMinutes?: number } {
  const info = getLockoutInfo(email);
  if (!info?.lockedUntil) {
    return { locked: false };
  }

  const now = Date.now();
  if (now >= info.lockedUntil) {
    // Lock expired, clear it
    clearLockoutInfo(email);
    return { locked: false };
  }

  const remainingMinutes = Math.ceil((info.lockedUntil - now) / 60000);
  return {
    locked: true,
    lockedUntil: new Date(info.lockedUntil),
    remainingMinutes
  };
}

/**
 * Record a failed login attempt
 */
async function recordFailedAttempt(email: string, phone?: string, name?: string): Promise<{ locked: boolean; remainingAttempts: number; lockedUntil?: Date }> {
  const info = getLockoutInfo(email) || { attempts: 0, lastAttempt: 0 };
  const now = Date.now();

  // Reset attempts if last attempt was more than 1 hour ago
  if (now - info.lastAttempt > 3600000) {
    info.attempts = 0;
  }

  info.attempts += 1;
  info.lastAttempt = now;

  const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - info.attempts);

  if (info.attempts >= MAX_LOGIN_ATTEMPTS) {
    // Lock the account
    info.lockedUntil = now + LOCKOUT_DURATION_MINUTES * 60000;
    saveLockoutInfo(email, info);

    // Send lockout notification
    try {
      await supabase.functions.invoke('auth-notify', {
        body: {
          action: 'account_locked',
          email,
          phone,
          name: name || 'العميل',
          data: {
            unlockTime: new Date(info.lockedUntil).toLocaleString('ar-SA'),
            lockDurationMinutes: LOCKOUT_DURATION_MINUTES,
            reason: 'تجاوز عدد محاولات تسجيل الدخول المسموحة'
          }
        }
      });
    } catch (e) {
      console.error('Failed to send lockout notification:', e);
    }

    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: new Date(info.lockedUntil)
    };
  }

  saveLockoutInfo(email, info);
  return { locked: false, remainingAttempts };
}

/**
 * Sign up with email verification
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  phone?: string
): Promise<SignUpResult> {
  try {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone || '',
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        return {
          success: false,
          error: 'هذا البريد الإلكتروني مسجل بالفعل',
          errorCode: 'EMAIL_EXISTS'
        };
      }
      return {
        success: false,
        error: error.message,
        errorCode: 'SIGNUP_FAILED'
      };
    }

    // Send account created notification
    try {
      await supabase.functions.invoke('auth-notify', {
        body: {
          action: 'account_created',
          userId: data.user?.id,
          email,
          phone,
          name: fullName,
          data: {
            verificationLink: `${window.location.origin}/auth/verify?email=${encodeURIComponent(email)}`
          }
        }
      });
    } catch (e) {
      console.error('Failed to send account created notification:', e);
    }

    return {
      success: true,
      userId: data.user?.id,
      requiresVerification: !data.user?.email_confirmed_at
    };
  } catch (e: any) {
    return {
      success: false,
      error: 'حدث خطأ غير متوقع',
      errorCode: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  // Check if account is locked
  const lockStatus = isAccountLocked(email);
  if (lockStatus.locked) {
    return {
      success: false,
      error: `الحساب مقفل. حاول مرة أخرى بعد ${lockStatus.remainingMinutes} دقيقة.`,
      errorCode: 'ACCOUNT_LOCKED',
      lockedUntil: lockStatus.lockedUntil
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Get user info for notifications
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('email', email)
        .maybeSingle();

      const attemptResult = await recordFailedAttempt(
        email,
        profileData?.phone,
        profileData?.full_name
      );

      if (attemptResult.locked) {
        return {
          success: false,
          error: `تم قفل الحساب لمدة ${LOCKOUT_DURATION_MINUTES} دقيقة بسبب المحاولات الفاشلة.`,
          errorCode: 'ACCOUNT_LOCKED',
          lockedUntil: attemptResult.lockedUntil,
          remainingAttempts: 0
        };
      }

      return {
        success: false,
        error: `بيانات الدخول غير صحيحة. ${attemptResult.remainingAttempts} محاولات متبقية.`,
        errorCode: 'INVALID_CREDENTIALS',
        remainingAttempts: attemptResult.remainingAttempts
      };
    }

    // Success - clear any lockout info
    clearLockoutInfo(email);

    // Send login alert notification (only if email is verified)
    if (data.user?.email_confirmed_at) {
      sendLoginAlertNotification(data.user.id, email);
    }

    return { success: true };
  } catch (e: unknown) {
    return {
      success: false,
      error: 'حدث خطأ غير متوقع',
      errorCode: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Send login alert notification (async - non-blocking)
 */
async function sendLoginAlertNotification(userId: string, email: string): Promise<void> {
  try {
    // Get user profile for name and phone
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', userId)
      .maybeSingle();

    // Collect device info
    const deviceInfo = collectDeviceInfo();

    await supabase.functions.invoke('login-alert', {
      body: {
        userId,
        email,
        phone: profile?.phone,
        name: profile?.full_name || 'العميل',
        deviceFingerprint: deviceInfo.fingerprint,
        deviceType: deviceInfo.deviceType,
        userAgent: navigator.userAgent,
        geoCity: undefined, // Could be obtained from IP geolocation service
        geoCountry: undefined,
        isEmailVerified: true,
        baseUrl: window.location.origin
      }
    });
  } catch (e) {
    // Non-blocking - just log the error
    console.error('Failed to send login alert:', e);
  }
}

/**
 * Collect device information for login alerts
 */
function collectDeviceInfo(): { fingerprint: string; deviceType: string } {
  // Simple fingerprint based on available browser info
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString()
  ];
  
  const fingerprint = btoa(components.join('|')).substring(0, 32);
  
  // Detect device type
  const ua = navigator.userAgent.toLowerCase();
  let deviceType = 'متصفح ويب';
  
  if (/iphone/.test(ua)) deviceType = 'آيفون';
  else if (/ipad/.test(ua)) deviceType = 'آيباد';
  else if (/android.*mobile/.test(ua)) deviceType = 'هاتف أندرويد';
  else if (/android/.test(ua)) deviceType = 'جهاز أندرويد';
  else if (/macintosh|mac os/.test(ua)) deviceType = 'ماك';
  else if (/windows/.test(ua)) deviceType = 'ويندوز';
  else if (/linux/.test(ua)) deviceType = 'لينكس';
  
  return { fingerprint, deviceType };
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'RESET_FAILED'
      };
    }

    // Note: Supabase handles sending the reset email automatically
    // We could also trigger our custom auth-notify function for a branded email

    return { success: true };
  } catch (e: any) {
    return {
      success: false,
      error: 'حدث خطأ غير متوقع',
      errorCode: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'UPDATE_FAILED'
      };
    }

    // Send password changed notification
    if (userData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', userData.user.id)
        .maybeSingle();

      try {
        await supabase.functions.invoke('auth-notify', {
          body: {
            action: 'password_changed',
            userId: userData.user.id,
            email: userData.user.email,
            phone: profile?.phone,
            name: profile?.full_name || 'العميل'
          }
        });
      } catch (e) {
        console.error('Failed to send password changed notification:', e);
      }
    }

    return { success: true };
  } catch (e: any) {
    return {
      success: false,
      error: 'حدث خطأ غير متوقع',
      errorCode: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'RESEND_FAILED'
      };
    }

    return { success: true };
  } catch (e: any) {
    return {
      success: false,
      error: 'حدث خطأ غير متوقع',
      errorCode: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Check if email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user?.email_confirmed_at;
}
