import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email template types
type EmailType = 
  | 'order_created'
  | 'order_status_changed'
  | 'deposit_completed'
  | 'deposit_pending'
  | 'points_earned'
  | 'points_redeemed'
  | 'cashback_earned'
  | 'cashback_withdrawn'
  | 'welcome'
  | 'bank_withdrawal_pending'
  | 'bank_withdrawal_completed'
  | 'bank_withdrawal_rejected'
  | 'offer_notification'
  | 'tier_upgrade'
  | 'challenge_completed'
  | 'refund_processed'
  | 'custom';

interface EmailRequest {
  to: string;
  type: EmailType;
  data: Record<string, any>;
  customSubject?: string;
  customContent?: string;
}

// Base email wrapper with RTL Arabic styling
function getEmailWrapper(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      background-color: #f4f7fa;
      direction: rtl;
      text-align: right;
      line-height: 1.8;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .email-header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    
    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
    }
    
    .email-body {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 20px;
    }
    
    .message {
      font-size: 16px;
      color: #475569;
      margin-bottom: 30px;
    }
    
    .info-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 25px;
      border-right: 4px solid #6366f1;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 14px;
      color: #64748b;
      font-weight: 600;
    }
    
    .info-value {
      font-size: 16px;
      color: #1e293b;
      font-weight: 700;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 12px;
      padding: 25px;
      text-align: center;
      margin-bottom: 25px;
    }
    
    .highlight-value {
      font-size: 36px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 5px;
    }
    
    .highlight-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-completed {
      background: #dcfce7;
      color: #166534;
    }
    
    .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .status-processing {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff;
      padding: 15px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin-top: 20px;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }
    
    .email-footer {
      background: #1e293b;
      padding: 30px;
      text-align: center;
    }
    
    .footer-logo {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 15px;
    }
    
    .footer-links {
      margin-bottom: 20px;
    }
    
    .footer-links a {
      color: #94a3b8;
      text-decoration: none;
      margin: 0 15px;
      font-size: 14px;
    }
    
    .footer-contact {
      color: #64748b;
      font-size: 13px;
      margin-bottom: 15px;
    }
    
    .footer-contact a {
      color: #6366f1;
      text-decoration: none;
    }
    
    .copyright {
      color: #64748b;
      font-size: 12px;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(to left, transparent, #e2e8f0, transparent);
      margin: 30px 0;
    }
    
    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 40px;
    }
    
    .warning-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 40px;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      
      .email-header {
        padding: 30px 20px;
      }
      
      .email-body {
        padding: 30px 20px;
      }
      
      .greeting {
        font-size: 20px;
      }
      
      .highlight-value {
        font-size: 28px;
      }
      
      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="email-container">
      <div class="email-header">
        <div class="logo">MaxioCore</div>
        <div class="header-subtitle">منصة الخدمات الرقمية المتكاملة</div>
      </div>
      
      <div class="email-body">
        ${content}
      </div>
      
      <div class="email-footer">
        <div class="footer-logo">MaxioCore</div>
        <div class="footer-links">
          <a href="#">الرئيسية</a>
          <a href="#">خدماتنا</a>
          <a href="#">الدعم الفني</a>
          <a href="#">اتصل بنا</a>
        </div>
        <div class="footer-contact">
          📧 <a href="mailto:info@maxiocore.com">info@maxiocore.com</a>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Status text mapping
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكد',
    'processing': 'قيد المعالجة',
    'in_progress': 'قيد التنفيذ',
    'completed': 'مكتمل',
    'cancelled': 'ملغي',
    'refunded': 'مسترد',
    'partial': 'مكتمل جزئياً'
  };
  return statusMap[status] || status;
}

function getStatusClass(status: string): string {
  if (['completed'].includes(status)) return 'status-completed';
  if (['cancelled', 'refunded'].includes(status)) return 'status-cancelled';
  if (['processing', 'in_progress', 'confirmed'].includes(status)) return 'status-processing';
  return 'status-pending';
}

// Email templates
function getEmailContent(type: EmailType, data: Record<string, any>): { subject: string; content: string } {
  switch (type) {
    case 'welcome':
      return {
        subject: `مرحباً بك في MaxioCore - ${data.name}`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">👋</div>
          </div>
          <div class="greeting">مرحباً ${data.name}! 🎉</div>
          <div class="message">
            نحن سعداء جداً بانضمامك إلى عائلة MaxioCore! منصتنا توفر لك أفضل خدمات التسويق الرقمي والبرمجة والتصميم بأعلى جودة وأفضل الأسعار.
          </div>
          
          <div class="info-card">
            <h3 style="color: #1e293b; margin-bottom: 15px;">🚀 ابدأ رحلتك معنا</h3>
            <p style="color: #64748b; margin-bottom: 10px;">✅ تصفح خدماتنا المتنوعة</p>
            <p style="color: #64748b; margin-bottom: 10px;">✅ اشحن رصيدك واحصل على مكافآت</p>
            <p style="color: #64748b; margin-bottom: 10px;">✅ استمتع بنظام النقاط والكاش باك</p>
            <p style="color: #64748b;">✅ ادعُ أصدقاءك واكسب عمولات</p>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">استكشف خدماتنا الآن</a>
          </div>
        `
      };

    case 'order_created':
      return {
        subject: `تم استلام طلبك #${data.orderNumber} - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">📦</div>
          </div>
          <div class="greeting">شكراً لطلبك! 🎉</div>
          <div class="message">
            تم استلام طلبك بنجاح وسيتم البدء في معالجته قريباً.
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رقم الطلب</span>
              <span class="info-value">${data.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">اسم الخدمة</span>
              <span class="info-value">${data.serviceName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الكمية</span>
              <span class="info-value">${data.quantity || 1}</span>
            </div>
            <div class="info-row">
              <span class="info-label">المبلغ الإجمالي</span>
              <span class="info-value">$${data.totalPrice}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-pending">قيد الانتظار</span>
            </div>
          </div>
          
          ${data.link ? `
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">الرابط</span>
              <span class="info-value" style="word-break: break-all; font-size: 12px;">${data.link}</span>
            </div>
          </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">تتبع طلبك</a>
          </div>
        `
      };

    case 'order_status_changed':
      return {
        subject: `تحديث حالة طلبك #${data.orderNumber} - ${getStatusText(data.newStatus)}`,
        content: `
          <div style="text-align: center;">
            <div class="${data.newStatus === 'completed' ? 'success-icon' : 'warning-icon'}">
              ${data.newStatus === 'completed' ? '✅' : data.newStatus === 'cancelled' ? '❌' : '🔄'}
            </div>
          </div>
          <div class="greeting">تحديث حالة الطلب</div>
          <div class="message">
            تم تحديث حالة طلبك رقم <strong>${data.orderNumber}</strong>
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">${getStatusText(data.newStatus)}</div>
            <div class="highlight-label">الحالة الجديدة</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رقم الطلب</span>
              <span class="info-value">${data.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">اسم الخدمة</span>
              <span class="info-value">${data.serviceName || 'غير محدد'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة السابقة</span>
              <span class="info-value">${getStatusText(data.oldStatus)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة الجديدة</span>
              <span class="status-badge ${getStatusClass(data.newStatus)}">${getStatusText(data.newStatus)}</span>
            </div>
          </div>
          
          ${data.newStatus === 'completed' ? `
          <div style="background: #dcfce7; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
            <p style="color: #166534; font-size: 16px; margin: 0;">
              🎉 تهانينا! تم إكمال طلبك بنجاح
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">عرض تفاصيل الطلب</a>
          </div>
        `
      };

    case 'deposit_completed':
      return {
        subject: `تم إيداع $${data.amount} في رصيدك - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">💰</div>
          </div>
          <div class="greeting">تم شحن رصيدك بنجاح! 🎉</div>
          <div class="message">
            تم إضافة المبلغ إلى رصيدك وأصبح متاحاً للاستخدام الآن.
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">$${data.amount}</div>
            <div class="highlight-label">المبلغ المُضاف</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">المبلغ الأصلي</span>
              <span class="info-value">$${data.originalAmount}</span>
            </div>
            ${data.bonusAmount ? `
            <div class="info-row">
              <span class="info-label">البونص 🎁</span>
              <span class="info-value" style="color: #10b981;">+$${data.bonusAmount}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">طريقة الدفع</span>
              <span class="info-value">${data.paymentMethod || 'غير محدد'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">رقم العملية</span>
              <span class="info-value">${data.transactionId || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الرصيد الجديد</span>
              <span class="info-value" style="color: #6366f1;">$${data.newBalance}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">استخدم رصيدك الآن</a>
          </div>
        `
      };

    case 'deposit_pending':
      return {
        subject: `طلب إيداع قيد المراجعة - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="warning-icon">⏳</div>
          </div>
          <div class="greeting">تم استلام طلب الإيداع</div>
          <div class="message">
            طلب الإيداع الخاص بك قيد المراجعة وسيتم معالجته في أقرب وقت ممكن.
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">$${data.amount}</div>
            <div class="highlight-label">المبلغ المطلوب إيداعه</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">طريقة الدفع</span>
              <span class="info-value">${data.paymentMethod || 'غير محدد'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-pending">قيد المراجعة</span>
            </div>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            ⏰ سيتم إشعارك فور اكتمال عملية الإيداع.
          </p>
        `
      };

    case 'points_earned':
      return {
        subject: `🎯 حصلت على ${data.points} نقطة! - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">⭐</div>
          </div>
          <div class="greeting">تهانينا! لقد كسبت نقاطاً 🎯</div>
          <div class="message">
            ${data.description || 'تم إضافة نقاط جديدة إلى رصيدك'}
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">+${data.points}</div>
            <div class="highlight-label">نقطة مكتسبة</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رصيد النقاط الحالي</span>
              <span class="info-value">${data.totalPoints} نقطة</span>
            </div>
            <div class="info-row">
              <span class="info-label">المستوى الحالي</span>
              <span class="info-value">${data.tierName || 'برونزي'}</span>
            </div>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              💡 تذكر: كل 100 نقطة = 1 ريال خصم على طلباتك!
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">استبدل نقاطك</a>
          </div>
        `
      };

    case 'points_redeemed':
      return {
        subject: `تم استخدام ${data.points} نقطة - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">🎁</div>
          </div>
          <div class="greeting">تم استخدام نقاطك!</div>
          <div class="message">
            تم استخدام نقاطك للحصول على خصم على طلبك.
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">-${data.points}</div>
            <div class="highlight-label">نقطة مستخدمة</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">قيمة الخصم</span>
              <span class="info-value" style="color: #10b981;">$${data.discountValue}</span>
            </div>
            <div class="info-row">
              <span class="info-label">رصيد النقاط المتبقي</span>
              <span class="info-value">${data.remainingPoints} نقطة</span>
            </div>
          </div>
        `
      };

    case 'cashback_earned':
      return {
        subject: `🎉 حصلت على كاش باك $${data.amount}! - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">💵</div>
          </div>
          <div class="greeting">مبروك! كسبت كاش باك 🎉</div>
          <div class="message">
            تم إضافة مكافأة الكاش باك إلى محفظتك من عملية الإيداع الأخيرة.
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">+$${data.amount}</div>
            <div class="highlight-label">كاش باك مكتسب</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">قيمة الإيداع</span>
              <span class="info-value">$${data.depositAmount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">نسبة الكاش باك</span>
              <span class="info-value">${data.percentage}%</span>
            </div>
            <div class="info-row">
              <span class="info-label">رصيد الكاش باك الحالي</span>
              <span class="info-value" style="color: #10b981;">$${data.totalCashback}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">سحب الكاش باك</a>
          </div>
        `
      };

    case 'cashback_withdrawn':
      return {
        subject: `تم سحب الكاش باك $${data.amount} - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">✅</div>
          </div>
          <div class="greeting">تم سحب الكاش باك بنجاح!</div>
          <div class="message">
            تم تحويل الكاش باك إلى رصيدك الرئيسي وأصبح متاحاً للاستخدام.
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">$${data.amount}</div>
            <div class="highlight-label">تم تحويله للرصيد الرئيسي</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رصيد الكاش باك المتبقي</span>
              <span class="info-value">$${data.remainingCashback}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الرصيد الرئيسي الجديد</span>
              <span class="info-value" style="color: #6366f1;">$${data.newBalance}</span>
            </div>
          </div>
        `
      };

    case 'bank_withdrawal_pending':
      return {
        subject: `طلب سحب بنكي قيد المراجعة - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="warning-icon">🏦</div>
          </div>
          <div class="greeting">تم استلام طلب السحب البنكي</div>
          <div class="message">
            طلب السحب البنكي الخاص بك قيد المراجعة وسيتم معالجته خلال 1-3 أيام عمل.
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">$${data.amount}</div>
            <div class="highlight-label">المبلغ المطلوب سحبه</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">اسم البنك</span>
              <span class="info-value">${data.bankName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">اسم صاحب الحساب</span>
              <span class="info-value">${data.accountHolderName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">رقم الآيبان</span>
              <span class="info-value">${data.iban}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-pending">قيد المراجعة</span>
            </div>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            ⏰ سيتم إشعارك فور اكتمال عملية التحويل.
          </p>
        `
      };

    case 'bank_withdrawal_completed':
      return {
        subject: `✅ تم تحويل $${data.amount} إلى حسابك البنكي - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">🎉</div>
          </div>
          <div class="greeting">تم التحويل بنجاح!</div>
          <div class="message">
            تم تحويل المبلغ إلى حسابك البنكي بنجاح.
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">$${data.amount}</div>
            <div class="highlight-label">تم تحويله</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">اسم البنك</span>
              <span class="info-value">${data.bankName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">رقم الآيبان</span>
              <span class="info-value">${data.iban}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-completed">مكتمل</span>
            </div>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            💡 قد يستغرق ظهور المبلغ في حسابك 1-2 يوم عمل حسب البنك.
          </p>
        `
      };

    case 'bank_withdrawal_rejected':
      return {
        subject: `❌ تم رفض طلب السحب البنكي - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 40px;">❌</div>
          </div>
          <div class="greeting">تم رفض طلب السحب</div>
          <div class="message">
            نأسف لإبلاغك بأنه تم رفض طلب السحب البنكي الخاص بك.
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">المبلغ</span>
              <span class="info-value">$${data.amount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">اسم البنك</span>
              <span class="info-value">${data.bankName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-cancelled">مرفوض</span>
            </div>
            ${data.reason ? `
            <div class="info-row">
              <span class="info-label">سبب الرفض</span>
              <span class="info-value">${data.reason}</span>
            </div>
            ` : ''}
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            📞 إذا كان لديك أي استفسار، يرجى التواصل مع الدعم الفني.
          </p>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">تواصل معنا</a>
          </div>
        `
      };

    case 'tier_upgrade':
      return {
        subject: `🎉 مبروك! لقد ترقيت إلى ${data.tierName} - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">🏆</div>
          </div>
          <div class="greeting">مبروك الترقية! 🎉</div>
          <div class="message">
            لقد وصلت إلى مستوى جديد! استمتع بالمزايا الحصرية الجديدة.
          </div>
          
          <div class="highlight-box" style="background: linear-gradient(135deg, ${data.tierColor || '#6366f1'} 0%, ${data.tierColor || '#8b5cf6'} 100%);">
            <div class="highlight-value">${data.tierName}</div>
            <div class="highlight-label">مستواك الجديد</div>
          </div>
          
          <div class="info-card">
            <h3 style="color: #1e293b; margin-bottom: 15px;">✨ مميزاتك الجديدة</h3>
            <p style="color: #64748b; margin-bottom: 10px;">⭐ مضاعف النقاط: ${data.multiplier}x</p>
            ${data.benefits?.map((b: string) => `<p style="color: #64748b; margin-bottom: 10px;">✅ ${b}</p>`).join('') || ''}
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">استمتع بمميزاتك</a>
          </div>
        `
      };

    case 'challenge_completed':
      return {
        subject: `🏆 أكملت تحدي "${data.challengeTitle}"! - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">🎯</div>
          </div>
          <div class="greeting">تحدي مكتمل! 🏆</div>
          <div class="message">
            أحسنت! لقد أكملت التحدي وحصلت على المكافأة.
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">+${data.rewardPoints}</div>
            <div class="highlight-label">نقطة مكافأة</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">اسم التحدي</span>
              <span class="info-value">${data.challengeTitle}</span>
            </div>
            <div class="info-row">
              <span class="info-label">النوع</span>
              <span class="info-value">${data.challengeType === 'daily' ? 'يومي' : 'أسبوعي'}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">شاهد التحديات الجديدة</a>
          </div>
        `
      };

    case 'refund_processed':
      return {
        subject: `تم استرداد $${data.amount} إلى رصيدك - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">↩️</div>
          </div>
          <div class="greeting">تم استرداد الرصيد</div>
          <div class="message">
            تم استرداد مبلغ الطلب إلى رصيدك بنجاح.
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">+$${data.amount}</div>
            <div class="highlight-label">تم استرداده</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رقم الطلب</span>
              <span class="info-value">${data.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">سبب الاسترداد</span>
              <span class="info-value">${data.reason || 'إلغاء الطلب'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الرصيد الجديد</span>
              <span class="info-value" style="color: #6366f1;">$${data.newBalance}</span>
            </div>
          </div>
        `
      };

    case 'offer_notification':
      return {
        subject: `🔥 عرض خاص: ${data.offerTitle} - MaxioCore`,
        content: `
          <div style="text-align: center;">
            <div class="success-icon">🎁</div>
          </div>
          <div class="greeting">عرض حصري لك! 🔥</div>
          <div class="message">
            ${data.offerDescription || 'لا تفوت هذا العرض المميز!'}
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">${data.discountPercentage}%</div>
            <div class="highlight-label">خصم</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">اسم العرض</span>
              <span class="info-value">${data.offerTitle}</span>
            </div>
            ${data.originalPrice ? `
            <div class="info-row">
              <span class="info-label">السعر الأصلي</span>
              <span class="info-value" style="text-decoration: line-through; color: #94a3b8;">$${data.originalPrice}</span>
            </div>
            ` : ''}
            ${data.offerPrice ? `
            <div class="info-row">
              <span class="info-label">سعر العرض</span>
              <span class="info-value" style="color: #10b981;">$${data.offerPrice}</span>
            </div>
            ` : ''}
            ${data.endDate ? `
            <div class="info-row">
              <span class="info-label">ينتهي في</span>
              <span class="info-value">${data.endDate}</span>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">استفد من العرض الآن</a>
          </div>
        `
      };

    case 'custom':
      return {
        subject: data.subject || 'رسالة من MaxioCore',
        content: `
          <div class="greeting">${data.title || 'مرحباً'}</div>
          <div class="message">${data.message || ''}</div>
          ${data.customHtml || ''}
        `
      };

    default:
      return {
        subject: 'إشعار من MaxioCore',
        content: `
          <div class="greeting">مرحباً</div>
          <div class="message">لديك إشعار جديد من MaxioCore.</div>
        `
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data, customSubject, customContent }: EmailRequest = await req.json();
    
    console.log(`Sending ${type} email to ${to}`);
    console.log("Email data:", JSON.stringify(data));

    const { subject, content } = getEmailContent(type, data);
    const finalSubject = customSubject || subject;
    const finalContent = customContent || content;
    
    const html = getEmailWrapper(finalContent, finalSubject);

    const emailResponse = await resend.emails.send({
      from: "MaxioCore <info@maxiocore.com>",
      to: [to],
      subject: finalSubject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log email in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('emails').insert({
      recipient_email: to,
      recipient_name: data.name || null,
      subject: finalSubject,
      content: html,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
