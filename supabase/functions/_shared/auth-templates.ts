/**
 * Auth Email & WhatsApp Templates
 * Arabic Banking-Grade Templates for Authentication Events
 * 
 * Security Rules:
 * - NEVER send OTP/passwords via WhatsApp
 * - WhatsApp for notifications only
 * - All sensitive links via Email only
 */

// ═══════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════

const EMAIL_BASE_STYLES = `
  font-family: 'Segoe UI', Tahoma, sans-serif;
  background-color: #0a0a0a;
  color: #ffffff;
  padding: 40px 20px;
  margin: 0;
`;

const CONTAINER_STYLES = `
  max-width: 500px;
  margin: 0 auto;
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  border-radius: 16px;
  padding: 40px;
  border: 1px solid #2a2a4a;
`;

const HEADER_STYLES = `text-align: center; margin-bottom: 30px;`;

const CONTENT_BOX_STYLES = `
  background: #0f172a;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  margin-bottom: 30px;
`;

const WARNING_BOX_STYLES = `
  background: #7f1d1d20;
  border: 1px solid #7f1d1d;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
`;

const INFO_BOX_STYLES = `
  background: #1e3a5f30;
  border: 1px solid #1e3a5f;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
`;

const BUTTON_PRIMARY = `
  display: inline-block;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
`;

const BUTTON_DANGER = `
  display: inline-block;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
`;

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

export interface LoginAlertData {
  name: string;
  loginTime: string;
  deviceType?: string;
  city?: string;
  country?: string;
  securityLink: string;
}

export interface AccountLockedData {
  name: string;
  unlockTime: string;
  reason: string;
}

export interface PasswordChangedData {
  name: string;
  changeTime: string;
}

export interface EmailVerificationData {
  name: string;
  verificationLink: string;
}

export interface PasswordResetData {
  name: string;
  resetLink: string;
}

// ─────────────────────────────────────────────────────────────
// LOGIN SUCCESS ALERT
// ─────────────────────────────────────────────────────────────

export function getLoginAlertEmailHtml(data: LoginAlertData): string {
  const locationInfo = data.city && data.country 
    ? `${data.city}، ${data.country}`
    : 'موقع غير محدد';
  
  const deviceInfo = data.deviceType || 'جهاز غير محدد';

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${EMAIL_BASE_STYLES}">
      <div style="${CONTAINER_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">MaxioCore</h1>
          <p style="color: #94a3b8; margin-top: 8px;">إشعار أمني</p>
        </div>
        
        <div style="${CONTENT_BOX_STYLES}">
          <p style="color: #22c55e; font-size: 20px; margin: 0 0 20px 0;">✅ تم تسجيل الدخول إلى حسابك</p>
          
          <table style="width: 100%; text-align: right; color: #94a3b8; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0;">⏰ الوقت:</td>
              <td style="color: #ffffff; padding: 8px 0;">${data.loginTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">📱 الجهاز:</td>
              <td style="color: #ffffff; padding: 8px 0;">${deviceInfo}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">📍 الموقع:</td>
              <td style="color: #ffffff; padding: 8px 0;">${locationInfo}</td>
            </tr>
          </table>
        </div>
        
        <div style="${WARNING_BOX_STYLES}">
          <p style="color: #fca5a5; margin: 0 0 15px 0; font-size: 14px;">
            ⚠️ إذا لم تكن أنت من سجّل الدخول، يُرجى تأمين حسابك فوراً:
          </p>
          <a href="${data.securityLink}" style="${BUTTON_DANGER}">
            تأمين حسابي الآن
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          ماكسيو كور - شريكك التقني
        </p>
      </div>
    </body>
    </html>
  `;
}

export function getLoginAlertEmailPlain(data: LoginAlertData): string {
  const locationInfo = data.city && data.country 
    ? `${data.city}، ${data.country}`
    : 'موقع غير محدد';
  
  return `
تم تسجيل الدخول إلى حسابك - MaxioCore

مرحباً ${data.name}،

تم تسجيل دخول جديد إلى حسابك:

⏰ الوقت: ${data.loginTime}
📱 الجهاز: ${data.deviceType || 'غير محدد'}
📍 الموقع: ${locationInfo}

إذا لم تكن أنت، أمّن حسابك الآن:
${data.securityLink}

ماكسيو كور - شريكك التقني
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// ACCOUNT LOCKED
// ─────────────────────────────────────────────────────────────

export function getAccountLockedEmailHtml(data: AccountLockedData): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${EMAIL_BASE_STYLES}">
      <div style="${CONTAINER_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">MaxioCore</h1>
          <p style="color: #94a3b8; margin-top: 8px;">تنبيه أمني</p>
        </div>
        
        <div style="background: #7f1d1d30; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px; border: 1px solid #7f1d1d;">
          <p style="color: #f87171; font-size: 24px; margin: 0 0 15px 0;">🔒 تم قفل حسابك مؤقتاً</p>
          <p style="color: #fca5a5; margin: 0 0 15px 0;">
            السبب: ${data.reason}
          </p>
          <div style="background: #0f172a; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="color: #94a3b8; margin: 0; font-size: 14px;">
              سيتم إلغاء القفل تلقائياً في:
            </p>
            <p style="color: #22c55e; font-size: 18px; font-weight: bold; margin: 10px 0 0 0;">
              ${data.unlockTime}
            </p>
          </div>
        </div>
        
        <div style="${INFO_BOX_STYLES}">
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
  `;
}

// ─────────────────────────────────────────────────────────────
// PASSWORD CHANGED
// ─────────────────────────────────────────────────────────────

export function getPasswordChangedEmailHtml(data: PasswordChangedData): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${EMAIL_BASE_STYLES}">
      <div style="${CONTAINER_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">MaxioCore</h1>
          <p style="color: #94a3b8; margin-top: 8px;">تأكيد أمني</p>
        </div>
        
        <div style="${CONTENT_BOX_STYLES}">
          <p style="color: #22c55e; font-size: 24px; margin: 0 0 15px 0;">✅ تم تغيير كلمة المرور</p>
          <p style="color: #94a3b8; margin: 0;">
            مرحباً ${data.name}، تم تغيير كلمة مرور حسابك بنجاح.
          </p>
          <p style="color: #64748b; margin-top: 10px; font-size: 13px;">
            ⏰ ${data.changeTime}
          </p>
        </div>
        
        <div style="${WARNING_BOX_STYLES}">
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
  `;
}

// ─────────────────────────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────────

export function getEmailVerificationHtml(data: EmailVerificationData): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${EMAIL_BASE_STYLES}">
      <div style="${CONTAINER_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">MaxioCore</h1>
          <p style="color: #94a3b8; margin-top: 8px;">نظام التمويل الآمن</p>
        </div>
        
        <div style="${CONTENT_BOX_STYLES}">
          <p style="color: #22c55e; font-size: 20px; margin: 0 0 20px 0;">✅ مرحباً ${data.name}</p>
          <p style="color: #94a3b8; margin: 0 0 20px 0;">
            تم إنشاء حسابك بنجاح. يُرجى تأكيد بريدك الإلكتروني لتفعيل الحساب.
          </p>
          <a href="${data.verificationLink}" style="${BUTTON_PRIMARY}">
            تأكيد البريد الإلكتروني
          </a>
        </div>
        
        <div style="${WARNING_BOX_STYLES}">
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
  `;
}

// ─────────────────────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────────────────────

export function getPasswordResetEmailHtml(data: PasswordResetData): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${EMAIL_BASE_STYLES}">
      <div style="${CONTAINER_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">MaxioCore</h1>
          <p style="color: #94a3b8; margin-top: 8px;">استعادة كلمة المرور</p>
        </div>
        
        <div style="${CONTENT_BOX_STYLES}">
          <p style="color: #f59e0b; font-size: 20px; margin: 0 0 20px 0;">🔑 طلب استعادة كلمة المرور</p>
          <p style="color: #94a3b8; margin: 0 0 20px 0;">
            مرحباً ${data.name}، تلقينا طلباً لإعادة تعيين كلمة مرور حسابك.
          </p>
          <a href="${data.resetLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            إعادة تعيين كلمة المرور
          </a>
        </div>
        
        <div style="${WARNING_BOX_STYLES}">
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
  `;
}

// ═══════════════════════════════════════════════════════════════
// WHATSAPP TEMPLATES (Notifications Only - NO SENSITIVE DATA)
// ═══════════════════════════════════════════════════════════════

export function getLoginAlertWhatsApp(name: string, loginTime: string, city?: string): string {
  const location = city || 'موقع غير محدد';
  
  return `🔐 تنبيه أمني - ماكسيو كور

مرحباً ${name}،

تم تسجيل دخول جديد إلى حسابك:
⏰ ${loginTime}
📍 ${location}

إذا لم تكن أنت، راجع بريدك الإلكتروني لتأمين حسابك.

ماكسيو كور`;
}

export function getAccountLockedWhatsApp(name: string, durationMinutes: number): string {
  return `⚠️ تنبيه أمني - ماكسيو كور

مرحباً ${name}،

تم قفل حسابك مؤقتاً لحمايتك.

⏰ سيتم إلغاء القفل تلقائياً خلال ${durationMinutes} دقيقة.

📧 لمزيد من التفاصيل، راجع بريدك الإلكتروني.

ماكسيو كور`;
}

export function getPasswordChangedWhatsApp(name: string): string {
  return `🔐 تأكيد أمني - ماكسيو كور

مرحباً ${name}،

تم تغيير كلمة مرور حسابك بنجاح.

⚠️ إذا لم تكن أنت، تواصل مع الدعم الفني فوراً.

ماكسيو كور`;
}

export function getAccountCreatedWhatsApp(name: string): string {
  return `مرحباً ${name} 👋

✅ تم إنشاء حسابك في ماكسيو كور بنجاح!

📧 يُرجى تفقد بريدك الإلكتروني لتأكيد الحساب وتفعيله.

ماكسيو كور - شريكك التقني`;
}

export function getEmailVerifiedWhatsApp(name: string): string {
  return `مرحباً ${name} 🎉

✅ تم تأكيد بريدك الإلكتروني بنجاح!

يمكنك الآن تسجيل الدخول والاستفادة من جميع خدماتنا.

ماكسيو كور - شريكك التقني`;
}
