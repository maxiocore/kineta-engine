/**
 * Auth Notification Edge Function
 * إشعارات المصادقة - إيميل أساسي + واتساب كقناة إضافية
 * 
 * Features:
 * - Email verification notifications
 * - Account lockout alerts (WhatsApp notification only - no sensitive info)
 * - Password change confirmations
 * - Welcome messages
 * 
 * Security Rules:
 * - NEVER send OTP or passwords via WhatsApp
 * - WhatsApp is for NOTIFICATIONS only (no sensitive data)
 * - All sensitive actions go through email
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  WhatsAppProvider,
  formatPhoneNumber,
} from '../_shared/whatsapp-provider.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Email Templates
const EMAIL_TEMPLATES = {
  // تم إنشاء الحساب - تأكيد البريد
  ACCOUNT_CREATED: (name: string, verificationLink: string) => `
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
          <p style="color: #22c55e; font-size: 20px; margin: 0 0 20px 0;">✅ مرحباً ${name}</p>
          <p style="color: #94a3b8; margin: 0 0 20px 0;">
            تم إنشاء حسابك بنجاح. يُرجى تأكيد بريدك الإلكتروني لتفعيل الحساب.
          </p>
          <a href="${verificationLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            تأكيد البريد الإلكتروني
          </a>
        </div>
        
        <div style="background: #7f1d1d20; border: 1px solid #7f1d1d; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #fca5a5; margin: 0; font-size: 13px;">
            ⚠️ هذا الرابط صالح لمدة 24 ساعة فقط. إذا لم تطلب إنشاء حساب، تجاهل هذه الرسالة.
          </p>
        </div>
        
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          ماكسيو كور - شريكك التقني
        </p>
      </div>
    </body>
    </html>
  `,

  // تم قفل الحساب
  ACCOUNT_LOCKED: (name: string, unlockTime: string, reason: string) => `
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
          <p style="color: #94a3b8; margin-top: 8px;">تنبيه أمني</p>
        </div>
        
        <div style="background: #7f1d1d30; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px; border: 1px solid #7f1d1d;">
          <p style="color: #f87171; font-size: 24px; margin: 0 0 15px 0;">🔒 تم قفل حسابك مؤقتاً</p>
          <p style="color: #fca5a5; margin: 0 0 15px 0;">
            السبب: ${reason}
          </p>
          <div style="background: #0f172a; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="color: #94a3b8; margin: 0; font-size: 14px;">
              سيتم إلغاء القفل تلقائياً في:
            </p>
            <p style="color: #22c55e; font-size: 18px; font-weight: bold; margin: 10px 0 0 0;">
              ${unlockTime}
            </p>
          </div>
        </div>
        
        <div style="background: #1e3a5f30; border: 1px solid #1e3a5f; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #93c5fd; margin: 0; font-size: 13px;">
            💡 إذا لم تكن أنت من حاول تسجيل الدخول، ننصحك بتغيير كلمة المرور فور إلغاء القفل.
          </p>
        </div>
        
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          ماكسيو كور - شريكك التقني
        </p>
      </div>
    </body>
    </html>
  `,

  // تم تغيير كلمة المرور
  PASSWORD_CHANGED: (name: string) => `
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
          <p style="color: #94a3b8; margin-top: 8px;">تأكيد أمني</p>
        </div>
        
        <div style="background: #0f172a; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
          <p style="color: #22c55e; font-size: 24px; margin: 0 0 15px 0;">✅ تم تغيير كلمة المرور</p>
          <p style="color: #94a3b8; margin: 0;">
            مرحباً ${name}، تم تغيير كلمة مرور حسابك بنجاح.
          </p>
        </div>
        
        <div style="background: #7f1d1d20; border: 1px solid #7f1d1d; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #fca5a5; margin: 0; font-size: 13px;">
            ⚠️ إذا لم تكن أنت من قام بهذا التغيير، يُرجى التواصل مع الدعم الفني فوراً.
          </p>
        </div>
        
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          ماكسيو كور - شريكك التقني
        </p>
      </div>
    </body>
    </html>
  `,

  // رابط استعادة كلمة المرور
  PASSWORD_RESET: (name: string, resetLink: string) => `
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
          <p style="color: #94a3b8; margin-top: 8px;">استعادة كلمة المرور</p>
        </div>
        
        <div style="background: #0f172a; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
          <p style="color: #f59e0b; font-size: 20px; margin: 0 0 20px 0;">🔑 طلب استعادة كلمة المرور</p>
          <p style="color: #94a3b8; margin: 0 0 20px 0;">
            مرحباً ${name}، تلقينا طلباً لإعادة تعيين كلمة مرور حسابك.
          </p>
          <a href="${resetLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            إعادة تعيين كلمة المرور
          </a>
        </div>
        
        <div style="background: #7f1d1d20; border: 1px solid #7f1d1d; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #fca5a5; margin: 0; font-size: 13px;">
            ⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب استعادة كلمة المرور، تجاهل هذه الرسالة.
          </p>
        </div>
        
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          ماكسيو كور - شريكك التقني
        </p>
      </div>
    </body>
    </html>
  `,
};

// WhatsApp Templates (Notifications only - NO SENSITIVE DATA)
const WHATSAPP_TEMPLATES = {
  // إشعار تأكيد إنشاء الحساب (بدون رابط أو بيانات حساسة)
  ACCOUNT_CREATED: (name: string) => `مرحباً ${name} 👋

✅ تم إنشاء حسابك في ماكسيو كور بنجاح!

📧 يُرجى تفقد بريدك الإلكتروني لتأكيد الحساب وتفعيله.

ماكسيو كور - شريكك التقني`,

  // إشعار قفل الحساب (بدون تفاصيل أمنية حساسة)
  ACCOUNT_LOCKED: (name: string, durationMinutes: number) => `⚠️ تنبيه أمني - ماكسيو كور

مرحباً ${name}،

تم قفل حسابك مؤقتاً لحمايتك.

⏰ سيتم إلغاء القفل تلقائياً خلال ${durationMinutes} دقيقة.

📧 لمزيد من التفاصيل، راجع بريدك الإلكتروني.

ماكسيو كور`,

  // إشعار تغيير كلمة المرور
  PASSWORD_CHANGED: (name: string) => `🔐 تأكيد أمني - ماكسيو كور

مرحباً ${name}،

تم تغيير كلمة مرور حسابك بنجاح.

⚠️ إذا لم تكن أنت، تواصل مع الدعم الفني فوراً.

ماكسيو كور`,
};

interface AuthNotifyRequest {
  action: 'account_created' | 'account_locked' | 'password_changed' | 'password_reset' | 'email_verified';
  userId?: string;
  email: string;
  phone?: string;
  name: string;
  data?: {
    verificationLink?: string;
    resetLink?: string;
    unlockTime?: string;
    lockDurationMinutes?: number;
    reason?: string;
  };
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

    const body: AuthNotifyRequest = await req.json();
    const { action, email, phone, name, data } = body;

    console.log(`[Auth-Notify] Action: ${action}, Email: ${email}`);

    let emailSent = false;
    let whatsappSent = false;
    const results: any = { action, email };

    switch (action) {
      case 'account_created': {
        // Send verification email (PRIMARY - required)
        const verificationLink = data?.verificationLink || `https://maxiocore.com/auth/verify`;
        
        const { error: emailError } = await resend.emails.send({
          from: "MaxioCore <noreply@maxiocore.com>",
          to: [email],
          subject: "تأكيد حسابك - MaxioCore",
          html: EMAIL_TEMPLATES.ACCOUNT_CREATED(name, verificationLink),
        });

        emailSent = !emailError;
        if (emailError) {
          console.error('[Auth-Notify] Email error:', emailError);
        }

        // Send WhatsApp notification (SECONDARY - optional)
        if (phone) {
          const whatsappResult = await WhatsAppProvider.sendText(
            phone,
            WHATSAPP_TEMPLATES.ACCOUNT_CREATED(name),
            { type: 'auth' }
          );
          whatsappSent = whatsappResult.success;
        }
        break;
      }

      case 'account_locked': {
        // Send lockout email (PRIMARY)
        const unlockTime = data?.unlockTime || 'خلال 30 دقيقة';
        const reason = data?.reason || 'تجاوز عدد محاولات تسجيل الدخول المسموحة';
        
        const { error: emailError } = await resend.emails.send({
          from: "MaxioCore Security <security@maxiocore.com>",
          to: [email],
          subject: "⚠️ تنبيه أمني: تم قفل حسابك مؤقتاً - MaxioCore",
          html: EMAIL_TEMPLATES.ACCOUNT_LOCKED(name, unlockTime, reason),
        });

        emailSent = !emailError;

        // Send WhatsApp alert (SECONDARY - no sensitive details)
        if (phone) {
          const lockMinutes = data?.lockDurationMinutes || 30;
          const whatsappResult = await WhatsAppProvider.sendText(
            phone,
            WHATSAPP_TEMPLATES.ACCOUNT_LOCKED(name, lockMinutes),
            { type: 'auth' }
          );
          whatsappSent = whatsappResult.success;
        }
        break;
      }

      case 'password_changed': {
        // Send confirmation email (PRIMARY)
        const { error: emailError } = await resend.emails.send({
          from: "MaxioCore Security <security@maxiocore.com>",
          to: [email],
          subject: "✅ تم تغيير كلمة المرور - MaxioCore",
          html: EMAIL_TEMPLATES.PASSWORD_CHANGED(name),
        });

        emailSent = !emailError;

        // Send WhatsApp confirmation (SECONDARY)
        if (phone) {
          const whatsappResult = await WhatsAppProvider.sendText(
            phone,
            WHATSAPP_TEMPLATES.PASSWORD_CHANGED(name),
            { type: 'auth' }
          );
          whatsappSent = whatsappResult.success;
        }
        break;
      }

      case 'password_reset': {
        // Send reset email ONLY (no WhatsApp for password reset links)
        const resetLink = data?.resetLink;
        if (!resetLink) {
          return new Response(
            JSON.stringify({ error: "Reset link is required", code: "MISSING_RESET_LINK" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: emailError } = await resend.emails.send({
          from: "MaxioCore <noreply@maxiocore.com>",
          to: [email],
          subject: "🔑 استعادة كلمة المرور - MaxioCore",
          html: EMAIL_TEMPLATES.PASSWORD_RESET(name, resetLink),
        });

        emailSent = !emailError;
        // NO WhatsApp for password reset - security requirement
        break;
      }

      case 'email_verified': {
        // Log successful verification
        console.log(`[Auth-Notify] Email verified for: ${email}`);
        
        // Update profile if needed
        if (body.userId) {
          await supabase
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', body.userId);
        }

        results.verified = true;
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action", code: "UNKNOWN_ACTION" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        email_sent: emailSent,
        whatsapp_sent: whatsappSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Auth-Notify] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
