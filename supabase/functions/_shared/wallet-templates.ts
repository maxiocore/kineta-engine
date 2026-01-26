/**
 * Wallet Email & WhatsApp Templates
 * Arabic Banking-Grade Templates for Wallet Events
 */

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

export interface WalletCreditedData {
  name: string;
  amount: number;
  newBalance: number;
  source: string;
  referenceNumber?: string;
  timestamp: string;
  dashboardLink: string;
}

export interface WalletDebitedData {
  name: string;
  amount: number;
  newBalance: number;
  description: string;
  orderNumber?: string;
  timestamp: string;
  dashboardLink: string;
}

export interface WalletSuspendedData {
  name: string;
  reason: string;
  supportLink: string;
}

/**
 * Format amount in Arabic SAR
 */
function formatAmountAr(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ر.س';
}

// ─────────────────────────────────────────────────────────────
// WALLET CREDITED
// ─────────────────────────────────────────────────────────────

export function getWalletCreditedEmailHtml(data: WalletCreditedData): string {
  return `
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
          <p style="color: #94a3b8; margin-top: 8px;">إشعار المحفظة</p>
        </div>
        
        <div style="background: #14532d30; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px; border: 1px solid #22c55e40;">
          <p style="color: #22c55e; font-size: 24px; margin: 0 0 15px 0;">💰 تم إضافة رصيد إلى محفظتك</p>
          <p style="color: #22c55e; font-size: 32px; font-weight: bold; margin: 0 0 15px 0;">
            +${formatAmountAr(data.amount)}
          </p>
          <div style="background: #0f172a; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <table style="width: 100%; text-align: right; color: #94a3b8;">
              <tr>
                <td style="padding: 5px 0;">المصدر:</td>
                <td style="color: #ffffff; padding: 5px 0;">${data.source}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">الرصيد الجديد:</td>
                <td style="color: #22c55e; padding: 5px 0; font-weight: bold;">${formatAmountAr(data.newBalance)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">التاريخ:</td>
                <td style="color: #ffffff; padding: 5px 0;">${data.timestamp}</td>
              </tr>
              ${data.referenceNumber ? `
              <tr>
                <td style="padding: 5px 0;">رقم المرجع:</td>
                <td style="color: #ffffff; padding: 5px 0;">${data.referenceNumber}</td>
              </tr>
              ` : ''}
            </table>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${data.dashboardLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;">
            عرض المحفظة
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

// ─────────────────────────────────────────────────────────────
// WALLET DEBITED
// ─────────────────────────────────────────────────────────────

export function getWalletDebitedEmailHtml(data: WalletDebitedData): string {
  return `
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
          <p style="color: #94a3b8; margin-top: 8px;">إشعار المحفظة</p>
        </div>
        
        <div style="background: #0f172a; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
          <p style="color: #f59e0b; font-size: 20px; margin: 0 0 15px 0;">📤 تم خصم من محفظتك</p>
          <p style="color: #f59e0b; font-size: 28px; font-weight: bold; margin: 0 0 15px 0;">
            -${formatAmountAr(data.amount)}
          </p>
          <div style="background: #1e293b; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <table style="width: 100%; text-align: right; color: #94a3b8;">
              <tr>
                <td style="padding: 5px 0;">الوصف:</td>
                <td style="color: #ffffff; padding: 5px 0;">${data.description}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">الرصيد المتبقي:</td>
                <td style="color: #22c55e; padding: 5px 0; font-weight: bold;">${formatAmountAr(data.newBalance)}</td>
              </tr>
              ${data.orderNumber ? `
              <tr>
                <td style="padding: 5px 0;">رقم الطلب:</td>
                <td style="color: #ffffff; padding: 5px 0;">${data.orderNumber}</td>
              </tr>
              ` : ''}
            </table>
          </div>
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
// WALLET SUSPENDED
// ─────────────────────────────────────────────────────────────

export function getWalletSuspendedEmailHtml(data: WalletSuspendedData): string {
  return `
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
          <p style="color: #94a3b8; margin-top: 8px;">تنبيه هام</p>
        </div>
        
        <div style="background: #7f1d1d30; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px; border: 1px solid #7f1d1d;">
          <p style="color: #f87171; font-size: 24px; margin: 0 0 15px 0;">⚠️ تم تعليق محفظتك</p>
          <p style="color: #fca5a5; margin: 0;">
            السبب: ${data.reason}
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${data.supportLink}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;">
            التواصل مع الدعم
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

// ═══════════════════════════════════════════════════════════════
// WHATSAPP TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function getWalletCreditedWhatsApp(name: string, amount: number, source: string): string {
  return `💰 ماكسيو كور - إشعار المحفظة

مرحباً ${name}،

تم إضافة ${formatAmountAr(amount)} إلى محفظتك
📌 المصدر: ${source}

سجّل دخولك للاطلاع على رصيدك الحالي.

ماكسيو كور`;
}

export function getWalletDebitedWhatsApp(name: string, amount: number, description: string): string {
  return `📤 ماكسيو كور - إشعار المحفظة

مرحباً ${name}،

تم خصم ${formatAmountAr(amount)} من محفظتك
📌 الوصف: ${description}

سجّل دخولك لمتابعة معاملاتك.

ماكسيو كور`;
}

export function getWalletInsufficientWhatsApp(name: string): string {
  return `⚠️ ماكسيو كور - رصيد غير كافٍ

مرحباً ${name}،

لم تتم العملية لأن رصيد محفظتك غير كافٍ.

💳 قم بشحن محفظتك لإتمام العملية.

ماكسيو كور`;
}

export function getWalletSuspendedWhatsApp(name: string): string {
  return `⚠️ تنبيه هام - ماكسيو كور

مرحباً ${name}،

تم تعليق محفظتك مؤقتاً.

📧 يُرجى مراجعة بريدك الإلكتروني للتفاصيل والتواصل مع الدعم.

ماكسيو كور`;
}

// ─────────────────────────────────────────────────────────────
// WALLET INSUFFICIENT EMAIL
// ─────────────────────────────────────────────────────────────

export interface WalletInsufficientData {
  name: string;
  requiredAmount: number;
  currentBalance: number;
  dashboardLink: string;
}

export function getWalletInsufficientEmailHtml(data: WalletInsufficientData): string {
  return `
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
          <p style="color: #94a3b8; margin-top: 8px;">إشعار المحفظة</p>
        </div>
        
        <div style="background: #f59e0b20; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px; border: 1px solid #f59e0b40;">
          <p style="color: #f59e0b; font-size: 24px; margin: 0 0 15px 0;">⚠️ رصيد غير كافٍ</p>
          <p style="color: #fbbf24; margin: 10px 0;">
            مرحباً ${data.name}،
          </p>
          <p style="color: #94a3b8; margin: 10px 0;">
            لم تتم العملية لأن رصيد محفظتك غير كافٍ.
          </p>
          <div style="background: #0f172a; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <table style="width: 100%; text-align: right; color: #94a3b8;">
              <tr>
                <td style="padding: 5px 0;">المبلغ المطلوب:</td>
                <td style="color: #f59e0b; padding: 5px 0; font-weight: bold;">${formatAmountAr(data.requiredAmount)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">الرصيد الحالي:</td>
                <td style="color: #ef4444; padding: 5px 0; font-weight: bold;">${formatAmountAr(data.currentBalance)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">النقص:</td>
                <td style="color: #fbbf24; padding: 5px 0; font-weight: bold;">${formatAmountAr(data.requiredAmount - data.currentBalance)}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${data.dashboardLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;">
            شحن المحفظة
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
