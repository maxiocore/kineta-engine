import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MINUTES = 30;
const RESEND_COOLDOWN_SECONDS = 60;

// Simple hash function for OTP (in production, use proper hashing)
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate secure OTP
function generateOTP(): string {
  const digits = "0123456789";
  let otp = "";
  const randomValues = new Uint32Array(OTP_LENGTH);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[randomValues[i] % 10];
  }
  return otp;
}

// Check if email is disposable
async function isDisposableEmail(supabase: any, email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;

  const { data } = await supabase
    .from("disposable_email_domains")
    .select("domain")
    .eq("domain", domain)
    .single();

  return !!data;
}

// Check if email is already verified by another user
async function isEmailUsedByOther(
  supabase: any,
  email: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("email_verifications")
    .select("user_id")
    .eq("email", email.toLowerCase())
    .eq("status", "passed")
    .neq("user_id", userId)
    .limit(1);

  return data && data.length > 0;
}

// Send OTP email
async function sendOTPEmail(email: string, otp: string, userName?: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: "MaxioCore <noreply@maxiocore.com>",
      to: [email],
      subject: "رمز التحقق - MaxioCore",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px 20px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(145deg, #1a1a2e, #16213e); border-radius: 16px; padding: 40px; border: 1px solid #2a2a4a;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">MaxioCore</h1>
              <p style="color: #94a3b8; margin-top: 8px;">نظام التمويل الآمن</p>
            </div>
            
            <div style="background: #0f172a; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <p style="color: #94a3b8; margin: 0 0 15px 0;">رمز التحقق الخاص بك:</p>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #22c55e; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #f59e0b; margin: 20px 0 0 0; font-size: 14px;">
                ⏱️ صالح لمدة ${OTP_EXPIRY_MINUTES} دقائق فقط
              </p>
            </div>
            
            <div style="background: #7f1d1d20; border: 1px solid #7f1d1d; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #fca5a5; margin: 0; font-size: 13px;">
                ⚠️ لا تشارك هذا الرمز مع أي شخص. فريق MaxioCore لن يطلب منك هذا الرمز أبداً.
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
              إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return !error;
  } catch (e) {
    console.error("Email send error:", e);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "غير مصرح", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "جلسة غير صالحة", code: "INVALID_SESSION" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, email, otp, purpose = "financing_eligibility" } = await req.json();
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // ACTION: SEND OTP
    if (action === "send") {
      if (!email) {
        return new Response(
          JSON.stringify({ error: "البريد الإلكتروني مطلوب", code: "EMAIL_REQUIRED" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const emailLower = email.toLowerCase().trim();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailLower)) {
        return new Response(
          JSON.stringify({ error: "صيغة البريد غير صحيحة", code: "INVALID_EMAIL_FORMAT" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check disposable email
      if (await isDisposableEmail(supabase, emailLower)) {
        return new Response(
          JSON.stringify({ 
            error: "البريد المؤقت غير مسموح. يرجى استخدام بريد رسمي.", 
            code: "DISPOSABLE_EMAIL" 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if email used by another user
      if (await isEmailUsedByOther(supabase, emailLower, user.id)) {
        return new Response(
          JSON.stringify({ 
            error: "هذا البريد مرتبط بحساب آخر", 
            code: "EMAIL_IN_USE" 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for existing locked verification
      const { data: existingLocked } = await supabase
        .from("email_verifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("purpose", purpose)
        .eq("status", "locked")
        .gt("locked_until", new Date().toISOString())
        .single();

      if (existingLocked) {
        const lockedUntil = new Date(existingLocked.locked_until);
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        return new Response(
          JSON.stringify({ 
            error: `الحساب مقفل. حاول مرة أخرى بعد ${remainingMinutes} دقيقة.`, 
            code: "ACCOUNT_LOCKED",
            locked_until: existingLocked.locked_until,
            remaining_minutes: remainingMinutes
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check resend cooldown
      const { data: recentVerification } = await supabase
        .from("email_verifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("purpose", purpose)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recentVerification) {
        const createdAt = new Date(recentVerification.created_at);
        const secondsSinceCreation = (Date.now() - createdAt.getTime()) / 1000;
        
        if (secondsSinceCreation < RESEND_COOLDOWN_SECONDS) {
          const remainingSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceCreation);
          return new Response(
            JSON.stringify({ 
              error: `انتظر ${remainingSeconds} ثانية قبل إعادة الإرسال`, 
              code: "RESEND_COOLDOWN",
              remaining_seconds: remainingSeconds
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Expire old pending verification
        await supabase
          .from("email_verifications")
          .update({ status: "expired" })
          .eq("id", recentVerification.id);
      }

      // Generate OTP
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Create verification record
      const { data: verification, error: insertError } = await supabase
        .from("email_verifications")
        .insert({
          user_id: user.id,
          email: emailLower,
          otp_hash: otpHash,
          purpose,
          status: "pending",
          expires_at: expiresAt.toISOString(),
          ip_address: clientIP,
          user_agent: userAgent,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "حدث خطأ. حاول مرة أخرى.", code: "INTERNAL_ERROR" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send email
      const emailSent = await sendOTPEmail(emailLower, otp, user.user_metadata?.full_name);
      
      if (!emailSent) {
        // Mark as failed
        await supabase
          .from("email_verifications")
          .update({ status: "failed" })
          .eq("id", verification.id);

        return new Response(
          JSON.stringify({ error: "فشل إرسال البريد. حاول مرة أخرى.", code: "EMAIL_SEND_FAILED" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "تم إرسال رمز التحقق",
          verification_id: verification.id,
          expires_at: expiresAt.toISOString(),
          expires_in_seconds: OTP_EXPIRY_MINUTES * 60,
          masked_email: emailLower.replace(/(.{2})(.*)(@.*)/, "$1***$3")
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: VERIFY OTP
    if (action === "verify") {
      if (!otp) {
        return new Response(
          JSON.stringify({ error: "رمز التحقق مطلوب", code: "OTP_REQUIRED" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get pending verification
      const { data: verification, error: fetchError } = await supabase
        .from("email_verifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("purpose", purpose)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !verification) {
        return new Response(
          JSON.stringify({ 
            error: "لا يوجد رمز تحقق نشط. اطلب رمزاً جديداً.", 
            code: "NO_ACTIVE_VERIFICATION" 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiry
      if (new Date(verification.expires_at) < new Date()) {
        await supabase
          .from("email_verifications")
          .update({ status: "expired" })
          .eq("id", verification.id);

        return new Response(
          JSON.stringify({ 
            error: "انتهت صلاحية الرمز. اطلب رمزاً جديداً.", 
            code: "OTP_EXPIRED" 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify OTP
      const inputHash = await hashOTP(otp);
      const isValid = inputHash === verification.otp_hash;
      const newAttempts = verification.attempts_count + 1;

      // Log attempt
      await supabase.from("email_verification_attempts").insert({
        verification_id: verification.id,
        attempt_number: newAttempts,
        input_otp_hash: inputHash,
        is_success: isValid,
        failure_reason: isValid ? null : "INVALID_OTP",
        ip_address: clientIP,
        user_agent: userAgent,
      });

      if (isValid) {
        // Success!
        await supabase
          .from("email_verifications")
          .update({ 
            status: "passed", 
            verified_at: new Date().toISOString(),
            attempts_count: newAttempts
          })
          .eq("id", verification.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: "PASSED",
            message: "تم التحقق بنجاح",
            verified_email: verification.email
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Failed attempt
      const remainingAttempts = MAX_ATTEMPTS - newAttempts;

      if (remainingAttempts <= 0) {
        // Lock account
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        
        await supabase
          .from("email_verifications")
          .update({ 
            status: "locked", 
            locked_until: lockedUntil.toISOString(),
            attempts_count: newAttempts
          })
          .eq("id", verification.id);

        return new Response(
          JSON.stringify({ 
            error: `تم قفل الحساب لمدة ${LOCK_DURATION_MINUTES} دقيقة بسبب المحاولات الفاشلة.`, 
            code: "ACCOUNT_LOCKED",
            status: "LOCKED",
            locked_until: lockedUntil.toISOString()
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update attempts count
      await supabase
        .from("email_verifications")
        .update({ attempts_count: newAttempts })
        .eq("id", verification.id);

      return new Response(
        JSON.stringify({ 
          error: `رمز خاطئ. ${remainingAttempts} محاولات متبقية.`, 
          code: "INVALID_OTP",
          status: "FAILED",
          remaining_attempts: remainingAttempts
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: STATUS
    if (action === "status") {
      const { data: verification } = await supabase
        .from("email_verifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("purpose", purpose)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!verification) {
        return new Response(
          JSON.stringify({ status: "NOT_STARTED" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let status = verification.status.toUpperCase();
      
      // Check if expired
      if (status === "PENDING" && new Date(verification.expires_at) < new Date()) {
        status = "EXPIRED";
      }

      // Check if lock expired
      if (status === "LOCKED" && verification.locked_until) {
        if (new Date(verification.locked_until) < new Date()) {
          status = "LOCK_EXPIRED";
        }
      }

      return new Response(
        JSON.stringify({ 
          status,
          email: verification.email,
          attempts_count: verification.attempts_count,
          max_attempts: verification.max_attempts,
          expires_at: verification.expires_at,
          locked_until: verification.locked_until,
          verified_at: verification.verified_at
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "إجراء غير معروف", code: "UNKNOWN_ACTION" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
