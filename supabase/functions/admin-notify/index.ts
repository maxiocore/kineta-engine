import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AdminNotificationType = 
  | 'new_user'
  | 'new_deposit'
  | 'deposit_pending'
  | 'new_order'
  | 'new_ticket'
  | 'ticket_reply'
  | 'new_withdrawal'
  | 'new_contact'
  | 'low_provider_balance'
  | 'order_cancelled'
  | 'refund_requested';

interface AdminNotifyRequest {
  type: AdminNotificationType;
  data: Record<string, any>;
}

// Get admin email wrapper
function getAdminEmailWrapper(content: string, title: string): string {
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
      background-color: #0f172a;
      direction: rtl;
      text-align: right;
      line-height: 1.8;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      border: 1px solid #334155;
    }
    
    .email-header {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
      padding: 30px;
      text-align: center;
    }
    
    .header-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 5px 15px;
      border-radius: 50px;
      font-size: 12px;
      color: #ffffff;
      margin-bottom: 10px;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 2px;
    }
    
    .header-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      margin-top: 5px;
    }
    
    .email-body {
      padding: 30px;
    }
    
    .alert-title {
      font-size: 22px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .alert-icon {
      font-size: 28px;
    }
    
    .message {
      font-size: 15px;
      color: #94a3b8;
      margin-bottom: 25px;
    }
    
    .info-card {
      background: #0f172a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid #334155;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #334155;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 13px;
      color: #64748b;
    }
    
    .info-value {
      font-size: 14px;
      color: #f1f5f9;
      font-weight: 600;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .highlight-value {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
    }
    
    .highlight-label {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status-new {
      background: #3b82f6;
      color: #ffffff;
    }
    
    .status-pending {
      background: #f59e0b;
      color: #ffffff;
    }
    
    .status-urgent {
      background: #ef4444;
      color: #ffffff;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff;
      padding: 12px 30px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin-top: 15px;
    }
    
    .email-footer {
      background: #0f172a;
      padding: 25px;
      text-align: center;
      border-top: 1px solid #334155;
    }
    
    .footer-text {
      color: #64748b;
      font-size: 12px;
    }
    
    .footer-text a {
      color: #6366f1;
      text-decoration: none;
    }
    
    .timestamp {
      background: #334155;
      padding: 8px 15px;
      border-radius: 8px;
      font-size: 12px;
      color: #94a3b8;
      display: inline-block;
      margin-top: 15px;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      
      .email-header, .email-body {
        padding: 20px;
      }
      
      .alert-title {
        font-size: 18px;
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
        <div class="header-badge">🔔 إشعار إداري</div>
        <div class="logo">ASH HOLDING</div>
        <div class="header-subtitle">لوحة تحكم المشرفين</div>
      </div>
      
      <div class="email-body">
        ${content}
        <div class="timestamp">
          ⏰ ${new Date().toLocaleString('ar-SA', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
      
      <div class="email-footer">
        <div class="footer-text">
          📧 <a href="mailto:info@ashholding.com">info@ashholding.com</a>
          <br><br>
          هذا بريد إداري تلقائي من نظام ASH HOLDING
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Get admin notification content
function getAdminNotificationContent(type: AdminNotificationType, data: Record<string, any>): { subject: string; content: string } {
  switch (type) {
    case 'new_user':
      return {
        subject: `👤 عضو جديد: ${data.name || data.email}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">👤</span>
            <span>تسجيل عضو جديد</span>
          </div>
          <div class="message">
            انضم عضو جديد إلى منصة ASH HOLDING
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">الاسم</span>
              <span class="info-value">${data.name || 'غير محدد'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">البريد الإلكتروني</span>
              <span class="info-value">${data.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">رقم الهاتف</span>
              <span class="info-value">${data.phone || 'غير محدد'}</span>
            </div>
            ${data.referralCode ? `
            <div class="info-row">
              <span class="info-label">كود الإحالة</span>
              <span class="info-value">${data.referralCode}</span>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">عرض ملف المستخدم</a>
          </div>
        `
      };

    case 'new_deposit':
      return {
        subject: `💰 إيداع جديد: $${data.amount} من ${data.userName || data.userEmail}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">💰</span>
            <span>إيداع جديد مكتمل</span>
          </div>
          <div class="message">
            تم إكمال عملية إيداع جديدة بنجاح
          </div>
          
          <div class="highlight-box">
            <div class="highlight-value">$${data.amount}</div>
            <div class="highlight-label">المبلغ المودع</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">العميل</span>
              <span class="info-value">${data.userName || data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">طريقة الدفع</span>
              <span class="info-value">${data.paymentMethod || 'غير محدد'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">رقم العملية</span>
              <span class="info-value">${data.transactionId || '-'}</span>
            </div>
            ${data.bonusAmount ? `
            <div class="info-row">
              <span class="info-label">البونص</span>
              <span class="info-value" style="color: #10b981;">+$${data.bonusAmount}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-new">مكتمل</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">عرض تفاصيل الإيداع</a>
          </div>
        `
      };

    case 'deposit_pending':
      return {
        subject: `⏳ إيداع معلق: $${data.amount} يتطلب مراجعة`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">⏳</span>
            <span>إيداع يتطلب مراجعة</span>
          </div>
          <div class="message">
            هناك عملية إيداع جديدة تحتاج إلى مراجعتك
          </div>
          
          <div class="highlight-box" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <div class="highlight-value">$${data.amount}</div>
            <div class="highlight-label">قيد المراجعة</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">العميل</span>
              <span class="info-value">${data.userName || data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">طريقة الدفع</span>
              <span class="info-value">${data.paymentMethod || 'غير محدد'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-pending">قيد المراجعة</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">مراجعة الإيداع الآن</a>
          </div>
        `
      };

    case 'new_order':
      return {
        subject: `📦 طلب جديد: #${data.orderNumber} بقيمة $${data.totalPrice}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">📦</span>
            <span>طلب جديد</span>
          </div>
          <div class="message">
            تم إنشاء طلب جديد على المنصة
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رقم الطلب</span>
              <span class="info-value">${data.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">العميل</span>
              <span class="info-value">${data.userName || data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الخدمة</span>
              <span class="info-value">${data.serviceName || 'غير محدد'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الكمية</span>
              <span class="info-value">${data.quantity || 1}</span>
            </div>
            <div class="info-row">
              <span class="info-label">المبلغ</span>
              <span class="info-value" style="color: #10b981;">$${data.totalPrice}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-new">جديد</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">عرض تفاصيل الطلب</a>
          </div>
        `
      };

    case 'new_ticket':
      return {
        subject: `🎫 تذكرة دعم جديدة: ${data.subject}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">🎫</span>
            <span>تذكرة دعم جديدة</span>
          </div>
          <div class="message">
            تم فتح تذكرة دعم جديدة تحتاج إلى ردك
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رقم التذكرة</span>
              <span class="info-value">${data.ticketNumber || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">العميل</span>
              <span class="info-value">${data.userName || data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الموضوع</span>
              <span class="info-value">${data.subject}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الأولوية</span>
              <span class="status-badge ${data.priority === 'urgent' ? 'status-urgent' : data.priority === 'high' ? 'status-pending' : 'status-new'}">
                ${data.priority === 'urgent' ? 'عاجل' : data.priority === 'high' ? 'مرتفع' : data.priority === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
            </div>
          </div>
          
          ${data.description ? `
          <div class="info-card">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 10px;">محتوى الرسالة:</div>
            <div style="color: #f1f5f9; font-size: 14px;">${data.description.substring(0, 300)}${data.description.length > 300 ? '...' : ''}</div>
          </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">الرد على التذكرة</a>
          </div>
        `
      };

    case 'ticket_reply':
      return {
        subject: `💬 رد جديد على التذكرة: ${data.ticketNumber}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">💬</span>
            <span>رد جديد على تذكرة</span>
          </div>
          <div class="message">
            أضاف العميل رداً جديداً على التذكرة
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رقم التذكرة</span>
              <span class="info-value">${data.ticketNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">العميل</span>
              <span class="info-value">${data.userName || data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الموضوع</span>
              <span class="info-value">${data.subject}</span>
            </div>
          </div>
          
          ${data.message ? `
          <div class="info-card">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 10px;">الرسالة الجديدة:</div>
            <div style="color: #f1f5f9; font-size: 14px;">${data.message.substring(0, 300)}${data.message.length > 300 ? '...' : ''}</div>
          </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">عرض التذكرة والرد</a>
          </div>
        `
      };

    case 'new_withdrawal':
      return {
        subject: `🏦 طلب سحب بنكي: $${data.amount} من ${data.userName || data.userEmail}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">🏦</span>
            <span>طلب سحب بنكي جديد</span>
          </div>
          <div class="message">
            تم استلام طلب سحب بنكي يتطلب مراجعتك
          </div>
          
          <div class="highlight-box" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <div class="highlight-value">$${data.amount}</div>
            <div class="highlight-label">طلب سحب</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">العميل</span>
              <span class="info-value">${data.userName || data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">اسم البنك</span>
              <span class="info-value">${data.bankName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">صاحب الحساب</span>
              <span class="info-value">${data.accountHolderName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الآيبان</span>
              <span class="info-value">${data.iban}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-pending">قيد المراجعة</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">مراجعة الطلب</a>
          </div>
        `
      };

    case 'new_contact':
      return {
        subject: `📩 رسالة تواصل جديدة من ${data.name}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">📩</span>
            <span>رسالة تواصل جديدة</span>
          </div>
          <div class="message">
            استلمت رسالة جديدة من نموذج التواصل
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">الاسم</span>
              <span class="info-value">${data.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">البريد الإلكتروني</span>
              <span class="info-value">${data.email}</span>
            </div>
            ${data.phone ? `
            <div class="info-row">
              <span class="info-label">رقم الهاتف</span>
              <span class="info-value">${data.phone}</span>
            </div>
            ` : ''}
            ${data.subject ? `
            <div class="info-row">
              <span class="info-label">الموضوع</span>
              <span class="info-value">${data.subject}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="info-card">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 10px;">محتوى الرسالة:</div>
            <div style="color: #f1f5f9; font-size: 14px;">${data.message}</div>
          </div>
          
          <div style="text-align: center;">
            <a href="mailto:${data.email}" class="cta-button">الرد على الرسالة</a>
          </div>
        `
      };

    case 'low_provider_balance':
      return {
        subject: `⚠️ تنبيه: رصيد منخفض للمزود ${data.providerName}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">⚠️</span>
            <span>تنبيه رصيد منخفض</span>
          </div>
          <div class="message">
            رصيد أحد مزودي الخدمات وصل إلى مستوى منخفض
          </div>
          
          <div class="highlight-box" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            <div class="highlight-value">$${data.balance}</div>
            <div class="highlight-label">الرصيد الحالي</div>
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">اسم المزود</span>
              <span class="info-value">${data.providerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحد الأدنى</span>
              <span class="info-value">$${data.minBalance || 100}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-urgent">يتطلب شحن</span>
            </div>
          </div>
          
          <div style="background: #7f1d1d; padding: 15px; border-radius: 12px; margin-top: 15px;">
            <p style="color: #fecaca; font-size: 14px; margin: 0;">
              ⚠️ يرجى شحن رصيد المزود لتجنب توقف الخدمات
            </p>
          </div>
        `
      };

    case 'order_cancelled':
      return {
        subject: `❌ طلب ملغي: #${data.orderNumber}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">❌</span>
            <span>إلغاء طلب</span>
          </div>
          <div class="message">
            تم إلغاء طلب واسترداد الرصيد للعميل
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رقم الطلب</span>
              <span class="info-value">${data.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">العميل</span>
              <span class="info-value">${data.userName || data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">المبلغ المسترد</span>
              <span class="info-value" style="color: #f87171;">$${data.refundAmount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">سبب الإلغاء</span>
              <span class="info-value">${data.reason || 'غير محدد'}</span>
            </div>
          </div>
        `
      };

    case 'refund_requested':
      return {
        subject: `↩️ طلب استرداد: #${data.orderNumber}`,
        content: `
          <div class="alert-title">
            <span class="alert-icon">↩️</span>
            <span>طلب استرداد</span>
          </div>
          <div class="message">
            طلب عميل استرداد مبلغ لطلب سابق
          </div>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">رقم الطلب</span>
              <span class="info-value">${data.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">العميل</span>
              <span class="info-value">${data.userName || data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">المبلغ</span>
              <span class="info-value">$${data.amount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">السبب</span>
              <span class="info-value">${data.reason || 'غير محدد'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة</span>
              <span class="status-badge status-pending">قيد المراجعة</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">مراجعة الطلب</a>
          </div>
        `
      };

    default:
      return {
        subject: 'إشعار إداري - ASH HOLDING',
        content: `
          <div class="alert-title">
            <span class="alert-icon">🔔</span>
            <span>إشعار جديد</span>
          </div>
          <div class="message">لديك إشعار جديد يتطلب انتباهك</div>
        `
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Admin notify function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data }: AdminNotifyRequest = await req.json();
    
    console.log(`Sending admin notification: ${type}`);
    console.log("Data:", JSON.stringify(data));

    // Get admin emails from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all admin user IDs
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError) {
      console.error('Error fetching admin roles:', rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log('No admins found');
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to notify' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin emails from profiles
    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email')
      .in('id', adminUserIds);

    if (profilesError) {
      console.error('Error fetching admin profiles:', profilesError);
      throw profilesError;
    }

    const adminEmails = adminProfiles
      ?.filter(p => p.email)
      .map(p => p.email as string) || [];

    if (adminEmails.length === 0) {
      console.log('No admin emails found');
      return new Response(
        JSON.stringify({ success: true, message: 'No admin emails found' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending to ${adminEmails.length} admins:`, adminEmails);

    const { subject, content } = getAdminNotificationContent(type, data);
    const html = getAdminEmailWrapper(content, subject);

    // Send to all admins
    const emailResponse = await resend.emails.send({
      from: "ASH HOLDING Admin <info@ashholding.com>",
      to: adminEmails,
      subject: subject,
      html: html,
    });

    console.log("Admin notification sent:", emailResponse);

    // Log in database
    for (const email of adminEmails) {
      await supabase.from('emails').insert({
        recipient_email: email,
        subject: subject,
        content: html,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in admin-notify function:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
