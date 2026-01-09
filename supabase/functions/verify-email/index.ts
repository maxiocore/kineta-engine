/**
 * Email Verification API
 * 
 * Endpoint: /verify/email
 * Method: POST
 * 
 * Purpose: Sends and verifies OTP codes via email for email verification
 * 
 * Actions:
 *   - send: Send OTP to email address
 *   - verify: Verify the OTP code
 *   - status: Check verification status
 * 
 * Input (send):
 *   - action: 'send'
 *   - email: string
 *   - session_id: string
 *   - purpose: 'eligibility' | 'account' | 'transaction'
 * 
 * Input (verify):
 *   - action: 'verify'
 *   - email: string
 *   - otp: string (6 digits)
 *   - session_id: string
 * 
 * Output (send - Success):
 *   - success: true
 *   - data: {
 *       message: string
 *       expires_in: number
 *       attempts_remaining: number
 *     }
 * 
 * Output (verify - Success):
 *   - success: true
 *   - data: {
 *       verified: true
 *       email: string (masked)
 *     }
 *   - verification_id: string
 * 
 * Error Codes:
 *   - INVALID_EMAIL: Email format is invalid
 *   - DISPOSABLE_EMAIL: Disposable/temporary email not allowed
 *   - EMAIL_BLOCKED: Email is blocked
 *   - OTP_EXPIRED: OTP has expired
 *   - OTP_INVALID: OTP code is incorrect
 *   - MAX_ATTEMPTS: Maximum attempts exceeded
 *   - COOLDOWN_ACTIVE: Must wait before requesting new OTP
 *   - EMAIL_SEND_FAILED: Failed to send email
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'send' | 'verify' | 'status';
type Purpose = 'eligibility' | 'account' | 'transaction';

interface EmailRequest {
  action: Action;
  email: string;
  otp?: string;
  session_id: string;
  purpose?: Purpose;
}

const ERRORS = {
  INVALID_ACTION: {
    code: 'INVALID_ACTION',
    message: 'Invalid action. Use: send, verify, or status',
    message_ar: 'إجراء غير صالح'
  },
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Invalid email address format',
    message_ar: 'صيغة البريد الإلكتروني غير صالحة'
  },
  DISPOSABLE_EMAIL: {
    code: 'DISPOSABLE_EMAIL',
    message: 'Disposable/temporary emails are not allowed',
    message_ar: 'البريد الإلكتروني المؤقت غير مسموح'
  },
  EMAIL_BLOCKED: {
    code: 'EMAIL_BLOCKED',
    message: 'This email is blocked',
    message_ar: 'هذا البريد الإلكتروني محظور'
  },
  OTP_EXPIRED: {
    code: 'OTP_EXPIRED',
    message: 'OTP has expired. Please request a new one',
    message_ar: 'انتهت صلاحية رمز التحقق'
  },
  OTP_INVALID: {
    code: 'OTP_INVALID',
    message: 'Invalid OTP code',
    message_ar: 'رمز التحقق غير صحيح'
  },
  OTP_REQUIRED: {
    code: 'OTP_REQUIRED',
    message: 'OTP code is required',
    message_ar: 'رمز التحقق مطلوب'
  },
  MAX_ATTEMPTS: {
    code: 'MAX_ATTEMPTS',
    message: 'Maximum verification attempts exceeded',
    message_ar: 'تم تجاوز الحد الأقصى للمحاولات'
  },
  COOLDOWN_ACTIVE: {
    code: 'COOLDOWN_ACTIVE',
    message: 'Please wait before requesting a new OTP',
    message_ar: 'يرجى الانتظار قبل طلب رمز جديد'
  },
  EMAIL_SEND_FAILED: {
    code: 'EMAIL_SEND_FAILED',
    message: 'Failed to send email. Please try again',
    message_ar: 'فشل إرسال البريد الإلكتروني'
  },
  NO_PENDING_VERIFICATION: {
    code: 'NO_PENDING_VERIFICATION',
    message: 'No pending verification found',
    message_ar: 'لا يوجد تحقق معلق'
  },
  MISSING_SESSION: {
    code: 'MISSING_SESSION',
    message: 'Session ID is required',
    message_ar: 'معرف الجلسة مطلوب'
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    message_ar: 'حدث خطأ داخلي'
  }
};

const OTP_CONFIG = {
  length: 6,
  expiry_seconds: 600, // 10 minutes
  max_attempts: 3,
  cooldown_seconds: 60
};

// Validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Mask email
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

// Generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash function
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + 'email_salt_secure');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if disposable email
async function isDisposableEmail(supabase: ReturnType<typeof createClient>, email: string): Promise<boolean> {
  const domain = email.split('@')[1].toLowerCase();
  
  const { count } = await supabase
    .from('disposable_email_domains')
    .select('*', { count: 'exact', head: true })
    .eq('domain', domain);
  
  return (count || 0) > 0;
}

// Send email using Resend
async function sendEmail(email: string, otp: string): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    console.error('Resend API key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MaxioCore <noreply@maxiocore.com>',
        to: email,
        subject: `رمز التحقق الخاص بك: ${otp}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">MaxioCore</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333;">رمز التحقق الخاص بك</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${otp}</span>
              </div>
              <p style="color: #666;">هذا الرمز صالح لمدة 10 دقائق.</p>
              <p style="color: #666;">إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد.</p>
            </div>
          </div>
        `,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST allowed', message_ar: 'POST فقط مسموح' } }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const body: EmailRequest = await req.json();

    // Validations
    if (!body.session_id) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_SESSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validActions: Action[] = ['send', 'verify', 'status'];
    if (!validActions.includes(body.action)) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.INVALID_ACTION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.email || !isValidEmail(body.email)) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.INVALID_EMAIL }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = body.email.toLowerCase().trim();
    const emailHash = await hashString(normalizedEmail);

    // Handle SEND action
    if (body.action === 'send') {
      // Check disposable email
      const isDisposable = await isDisposableEmail(supabase, normalizedEmail);
      if (isDisposable) {
        return new Response(
          JSON.stringify({ success: false, error: ERRORS.DISPOSABLE_EMAIL }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check cooldown
      const cooldownTime = new Date(Date.now() - OTP_CONFIG.cooldown_seconds * 1000).toISOString();
      const { data: recentAttempt } = await supabase
        .from('verification_audit_logs' as any)
        .select('created_at')
        .eq('verification_type', 'EMAIL_OTP')
        .eq('verification_target', emailHash)
        .eq('status', 'pending')
        .gte('created_at', cooldownTime)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentAttempt) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: { ...ERRORS.COOLDOWN_ACTIVE, details: { wait_seconds: OTP_CONFIG.cooldown_seconds } } 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate and send OTP
      const otp = generateOTP();
      const otpHash = await hashString(otp);
      const expiresAt = new Date(Date.now() + OTP_CONFIG.expiry_seconds * 1000).toISOString();

      const emailSent = await sendEmail(normalizedEmail, otp);
      if (!emailSent) {
        return new Response(
          JSON.stringify({ success: false, error: ERRORS.EMAIL_SEND_FAILED }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log verification attempt
      await supabase
        .from('verification_audit_logs' as any)
        .insert({
          user_id: userId,
          session_id: body.session_id,
          verification_type: 'EMAIL_OTP',
          verification_target: emailHash,
          attempt_number: 1,
          status: 'pending',
          input_hash: otpHash,
          ip_address: ipAddress,
          device_fingerprint: req.headers.get('x-device-fingerprint'),
          user_agent: req.headers.get('user-agent'),
          metadata: { 
            expires_at: expiresAt, 
            email_masked: maskEmail(normalizedEmail),
            purpose: body.purpose || 'eligibility'
          }
        } as any);

      console.log(`[VERIFY-EMAIL] OTP sent to ${maskEmail(normalizedEmail)}`);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: 'OTP sent successfully',
            message_ar: 'تم إرسال رمز التحقق بنجاح',
            expires_in: OTP_CONFIG.expiry_seconds,
            attempts_remaining: OTP_CONFIG.max_attempts
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle VERIFY action
    if (body.action === 'verify') {
      if (!body.otp || body.otp.length !== OTP_CONFIG.length) {
        return new Response(
          JSON.stringify({ success: false, error: ERRORS.OTP_REQUIRED }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: pending } = await supabase
        .from('verification_audit_logs' as any)
        .select('*')
        .eq('verification_type', 'EMAIL_OTP')
        .eq('verification_target', emailHash)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!pending) {
        return new Response(
          JSON.stringify({ success: false, error: ERRORS.NO_PENDING_VERIFICATION }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiry
      const expiresAt = pending.metadata?.expires_at;
      if (expiresAt && new Date(expiresAt) < new Date()) {
        await supabase
          .from('verification_audit_logs' as any)
          .update({ status: 'expired' } as any)
          .eq('id', pending.id);

        return new Response(
          JSON.stringify({ success: false, error: ERRORS.OTP_EXPIRED }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify OTP
      const inputHash = await hashString(body.otp);
      const isValid = inputHash === pending.input_hash;

      if (!isValid) {
        const attempts = (pending.attempt_number || 1) + 1;
        
        if (attempts >= OTP_CONFIG.max_attempts) {
          await supabase
            .from('verification_audit_logs' as any)
            .update({ status: 'blocked', attempt_number: attempts } as any)
            .eq('id', pending.id);

          return new Response(
            JSON.stringify({ success: false, error: ERRORS.MAX_ATTEMPTS }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('verification_audit_logs' as any)
          .update({ attempt_number: attempts } as any)
          .eq('id', pending.id);

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: { ...ERRORS.OTP_INVALID, details: { attempts_remaining: OTP_CONFIG.max_attempts - attempts } } 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Success
      const verificationId = crypto.randomUUID();
      await supabase
        .from('verification_audit_logs' as any)
        .update({ 
          status: 'success', 
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          result_code: 'VERIFIED',
          result_message: 'Email verified successfully'
        } as any)
        .eq('id', pending.id);

      console.log(`[VERIFY-EMAIL] Verified ${maskEmail(normalizedEmail)}, verification_id: ${verificationId}`);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            verified: true,
            email: maskEmail(normalizedEmail)
          },
          verification_id: verificationId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle STATUS action
    if (body.action === 'status') {
      const { data: latest } = await supabase
        .from('verification_audit_logs' as any)
        .select('status, created_at, metadata')
        .eq('verification_type', 'EMAIL_OTP')
        .eq('verification_target', emailHash)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            status: latest?.status || 'not_found',
            created_at: latest?.created_at,
            email: maskEmail(normalizedEmail)
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[VERIFY-EMAIL] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: { ...ERRORS.INTERNAL_ERROR, details: { message: error.message } } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
