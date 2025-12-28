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
  | 'package_inquiry'
  | 'custom';

interface EmailRequest {
  to: string;
  type: EmailType;
  data: Record<string, any>;
  customSubject?: string;
  customContent?: string;
}

// Format amount in Arabic style
function formatAmountArabic(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Enhanced RTL Email wrapper with IBM Plex Sans Arabic font
function getEmailWrapper(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f0f4f8; direction: rtl; text-align: right; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          
          <!-- Header Section -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 35px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 18px; margin: 0 auto 15px; line-height: 70px;">
                      <span style="font-size: 36px; font-weight: 800; color: #ffffff;">M</span>
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">MaxioCore</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">منصة الخدمات الرقمية المتكاملة</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 30px; direction: rtl; text-align: right;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer Section -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 15px; font-size: 20px; font-weight: 700; color: #ffffff;">MaxioCore</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 0 12px;">
                          <a href="#" style="color: #94a3b8; text-decoration: none; font-size: 13px;">الرئيسية</a>
                        </td>
                        <td style="padding: 0 12px; border-right: 1px solid #475569; border-left: 1px solid #475569;">
                          <a href="#" style="color: #94a3b8; text-decoration: none; font-size: 13px;">خدماتنا</a>
                        </td>
                        <td style="padding: 0 12px;">
                          <a href="#" style="color: #94a3b8; text-decoration: none; font-size: 13px;">الدعم الفني</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
                      📧 <a href="mailto:info@maxiocore.com" style="color: #8b5cf6; text-decoration: none;">info@maxiocore.com</a>
                    </p>
                    <div style="border-top: 1px solid #334155; margin-top: 20px; padding-top: 20px;">
                      <p style="margin: 0; font-size: 12px; color: #475569;">
                        © ${new Date().getFullYear()} MaxioCore. جميع الحقوق محفوظة.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
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

function getStatusColor(status: string): string {
  if (['completed'].includes(status)) return '#22c55e';
  if (['cancelled', 'refunded'].includes(status)) return '#ef4444';
  if (['processing', 'in_progress', 'confirmed'].includes(status)) return '#3b82f6';
  return '#f59e0b';
}

// Reusable RTL Components
function createInfoCard(rows: Array<{ label: string; value: string; valueColor?: string; isStatus?: boolean; statusColor?: string }>): string {
  const rowsHtml = rows.map((row, index) => `
    <tr>
      <td style="padding: 14px 0; ${index < rows.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''} text-align: right; color: #64748b; font-size: 14px; font-weight: 500;">
        ${row.label}
      </td>
      <td style="padding: 14px 0; ${index < rows.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''} text-align: left; font-size: 15px; font-weight: 600; ${row.valueColor ? `color: ${row.valueColor};` : 'color: #1e293b;'}">
        ${row.isStatus ? `<span style="display: inline-block; padding: 6px 16px; background-color: ${row.statusColor || '#f1f5f9'}; color: ${row.valueColor || '#1e293b'}; border-radius: 50px; font-size: 13px; font-weight: 600;">${row.value}</span>` : row.value}
      </td>
    </tr>
  `).join('');

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; border-right: 4px solid #6366f1; margin-bottom: 25px; direction: rtl;">
      <tr>
        <td style="padding: 20px 25px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
            ${rowsHtml}
          </table>
        </td>
      </tr>
    </table>
  `;
}

function createHighlightBox(value: string, label: string, gradient?: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: ${gradient || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'}; border-radius: 14px; margin-bottom: 25px;">
      <tr>
        <td style="padding: 28px; text-align: center;">
          <p style="margin: 0; font-size: 40px; font-weight: 800; color: #ffffff; letter-spacing: -1px;">${value}</p>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">${label}</p>
        </td>
      </tr>
    </table>
  `;
}

function createIconCircle(emoji: string, bgGradient?: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px;">
      <tr>
        <td align="center">
          <div style="width: 80px; height: 80px; background: ${bgGradient || 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}; border-radius: 50%; line-height: 80px; text-align: center; box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);">
            <span style="font-size: 40px;">${emoji}</span>
          </div>
        </td>
      </tr>
    </table>
  `;
}

function createCTAButton(text: string, href: string = "#"): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 25px;">
      <tr>
        <td align="center">
          <a href="${href}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 16px 45px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function createGreeting(text: string): string {
  return `<h2 style="margin: 0 0 15px; font-size: 24px; font-weight: 700; color: #1e293b; text-align: right; direction: rtl;">${text}</h2>`;
}

function createMessage(text: string): string {
  return `<p style="margin: 0 0 25px; font-size: 16px; color: #475569; line-height: 1.8; text-align: right; direction: rtl;">${text}</p>`;
}

function createNoticeBox(text: string, bgColor: string = '#fef3c7', textColor: string = '#92400e', borderColor: string = '#f59e0b'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: ${bgColor}; border-radius: 12px; border-right: 4px solid ${borderColor}; margin: 20px 0;">
      <tr>
        <td style="padding: 18px 22px; text-align: right; direction: rtl;">
          <p style="margin: 0; font-size: 14px; color: ${textColor}; line-height: 1.7;">${text}</p>
        </td>
      </tr>
    </table>
  `;
}

// Email templates - All amounts in SAR (ر.س)
function getEmailContent(type: EmailType, data: Record<string, any>): { subject: string; content: string } {
  switch (type) {
    case 'welcome':
      return {
        subject: `مرحباً بك في MaxioCore - ${data.name}`,
        content: `
          ${createIconCircle('👋', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          ${createGreeting(`مرحباً ${data.name}! 🎉`)}
          ${createMessage('نحن سعداء جداً بانضمامك إلى عائلة MaxioCore! منصتنا توفر لك أفضل خدمات التسويق الرقمي والبرمجة والتصميم بأعلى جودة وأفضل الأسعار.')}
          
          ${createInfoCard([
            { label: '🚀 ابدأ رحلتك معنا', value: '', valueColor: '#6366f1' }
          ])}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 25px;">
            <tr><td style="padding: 10px 0; color: #475569; font-size: 15px; text-align: right;">✅ تصفح خدماتنا المتنوعة</td></tr>
            <tr><td style="padding: 10px 0; color: #475569; font-size: 15px; text-align: right;">✅ اشحن رصيدك واحصل على مكافآت</td></tr>
            <tr><td style="padding: 10px 0; color: #475569; font-size: 15px; text-align: right;">✅ استمتع بنظام النقاط والكاش باك</td></tr>
            <tr><td style="padding: 10px 0; color: #475569; font-size: 15px; text-align: right;">✅ ادعُ أصدقاءك واكسب عمولات</td></tr>
          </table>
          
          ${createCTAButton('استكشف خدماتنا الآن')}
        `
      };

    case 'order_created':
      return {
        subject: `تم استلام طلبك #${data.orderNumber} - MaxioCore`,
        content: `
          ${createIconCircle('📦', 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)')}
          ${createGreeting('شكراً لطلبك! 🎉')}
          ${createMessage('تم استلام طلبك بنجاح وسيتم البدء في معالجته قريباً.')}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.orderNumber },
            { label: 'اسم الخدمة', value: data.serviceName },
            { label: 'الكمية', value: String(data.quantity || 1) },
            { label: 'المبلغ الإجمالي', value: `${formatAmountArabic(data.totalPrice)} ر.س`, valueColor: '#22c55e' },
            { label: 'الحالة', value: 'قيد الانتظار', isStatus: true, statusColor: '#fef3c7', valueColor: '#92400e' }
          ])}
          
          ${data.link ? createNoticeBox(`🔗 الرابط: ${data.link}`, '#f0f9ff', '#0369a1', '#0ea5e9') : ''}
          
          ${createCTAButton('تتبع طلبك')}
        `
      };

    case 'order_status_changed':
      const statusColor = getStatusColor(data.newStatus);
      const statusBgColor = data.newStatus === 'completed' ? '#dcfce7' : 
                            data.newStatus === 'cancelled' || data.newStatus === 'refunded' ? '#fee2e2' :
                            data.newStatus === 'processing' || data.newStatus === 'in_progress' ? '#dbeafe' : '#fef3c7';
      
      return {
        subject: `تحديث حالة طلبك #${data.orderNumber} - ${getStatusText(data.newStatus)}`,
        content: `
          ${createIconCircle(
            data.newStatus === 'completed' ? '✅' : data.newStatus === 'cancelled' ? '❌' : '🔄',
            data.newStatus === 'completed' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
            data.newStatus === 'cancelled' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
            'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
          )}
          ${createGreeting('تحديث حالة الطلب')}
          ${createMessage(`تم تحديث حالة طلبك رقم <strong>${data.orderNumber}</strong>`)}
          
          ${createHighlightBox(getStatusText(data.newStatus), 'الحالة الجديدة', 
            data.newStatus === 'completed' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
            data.newStatus === 'cancelled' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
            'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
          )}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.orderNumber },
            { label: 'اسم الخدمة', value: data.serviceName || 'غير محدد' },
            { label: 'الحالة السابقة', value: getStatusText(data.oldStatus) },
            { label: 'الحالة الجديدة', value: getStatusText(data.newStatus), isStatus: true, statusColor: statusBgColor, valueColor: statusColor }
          ])}
          
          ${data.newStatus === 'completed' ? createNoticeBox('🎉 تهانينا! تم إكمال طلبك بنجاح', '#dcfce7', '#166534', '#22c55e') : ''}
          
          ${createCTAButton('عرض تفاصيل الطلب')}
        `
      };

    case 'deposit_completed':
      return {
        subject: `تم إيداع ${formatAmountArabic(data.amount)} ر.س في رصيدك - MaxioCore`,
        content: `
          ${createIconCircle('💰', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          ${createGreeting('تم شحن رصيدك بنجاح! 🎉')}
          ${createMessage('تم إضافة المبلغ إلى رصيدك وأصبح متاحاً للاستخدام الآن.')}
          
          ${createHighlightBox(`${formatAmountArabic(data.amount)} ر.س`, 'المبلغ المُضاف', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          
          ${createInfoCard([
            { label: 'المبلغ الأصلي', value: `${formatAmountArabic(data.originalAmount)} ر.س` },
            ...(data.bonusAmount ? [{ label: 'البونص 🎁', value: `+${formatAmountArabic(data.bonusAmount)} ر.س`, valueColor: '#22c55e' }] : []),
            { label: 'طريقة الدفع', value: data.paymentMethod || 'غير محدد' },
            { label: 'رقم العملية', value: data.transactionId || '-' },
            { label: 'الرصيد الجديد', value: `${formatAmountArabic(data.newBalance)} ر.س`, valueColor: '#6366f1' }
          ])}
          
          ${createCTAButton('استخدم رصيدك الآن')}
        `
      };

    case 'deposit_pending':
      return {
        subject: `طلب إيداع قيد المراجعة - MaxioCore`,
        content: `
          ${createIconCircle('⏳', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          ${createGreeting('تم استلام طلب الإيداع')}
          ${createMessage('طلب الإيداع الخاص بك قيد المراجعة وسيتم معالجته في أقرب وقت ممكن.')}
          
          ${createHighlightBox(`${formatAmountArabic(data.amount)} ر.س`, 'المبلغ المطلوب إيداعه', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          
          ${createInfoCard([
            { label: 'طريقة الدفع', value: data.paymentMethod || 'غير محدد' },
            { label: 'الحالة', value: 'قيد المراجعة', isStatus: true, statusColor: '#fef3c7', valueColor: '#92400e' }
          ])}
          
          ${createNoticeBox('⏰ سيتم إشعارك فور اكتمال عملية الإيداع.', '#f0f9ff', '#0369a1', '#0ea5e9')}
        `
      };

    case 'points_earned':
      return {
        subject: `🎯 حصلت على ${data.points} نقطة! - MaxioCore`,
        content: `
          ${createIconCircle('⭐', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          ${createGreeting('تهانينا! لقد كسبت نقاطاً 🎯')}
          ${createMessage(data.description || 'تم إضافة نقاط جديدة إلى رصيدك')}
          
          ${createHighlightBox(`+${data.points}`, 'نقطة مكتسبة', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          
          ${createInfoCard([
            { label: 'رصيد النقاط الحالي', value: `${data.totalPoints} نقطة` },
            { label: 'المستوى الحالي', value: data.tierName || 'برونزي' }
          ])}
          
          ${createNoticeBox('💡 تذكر: كل 100 نقطة = 1 ريال خصم على طلباتك!', '#fef3c7', '#92400e', '#f59e0b')}
          
          ${createCTAButton('استبدل نقاطك')}
        `
      };

    case 'points_redeemed':
      return {
        subject: `تم استخدام ${data.points} نقطة - MaxioCore`,
        content: `
          ${createIconCircle('🎁', 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)')}
          ${createGreeting('تم استخدام نقاطك!')}
          ${createMessage('تم استخدام نقاطك للحصول على خصم على طلبك.')}
          
          ${createHighlightBox(`-${data.points}`, 'نقطة مستخدمة', 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)')}
          
          ${createInfoCard([
            { label: 'قيمة الخصم', value: `${formatAmountArabic(data.discountValue)} ر.س`, valueColor: '#22c55e' },
            { label: 'رصيد النقاط المتبقي', value: `${data.remainingPoints} نقطة` }
          ])}
        `
      };

    case 'cashback_earned':
      return {
        subject: `🎉 حصلت على كاش باك ${formatAmountArabic(data.amount)} ر.س! - MaxioCore`,
        content: `
          ${createIconCircle('💵', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          ${createGreeting('مبروك! كسبت كاش باك 🎉')}
          ${createMessage('تم إضافة مكافأة الكاش باك إلى محفظتك من عملية الإيداع الأخيرة.')}
          
          ${createHighlightBox(`+${formatAmountArabic(data.amount)} ر.س`, 'كاش باك مكتسب', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          
          ${createInfoCard([
            { label: 'قيمة الإيداع', value: `${formatAmountArabic(data.depositAmount)} ر.س` },
            { label: 'نسبة الكاش باك', value: `${data.percentage}%` },
            { label: 'رصيد الكاش باك الحالي', value: `${formatAmountArabic(data.totalCashback)} ر.س`, valueColor: '#22c55e' }
          ])}
          
          ${createCTAButton('سحب الكاش باك')}
        `
      };

    case 'cashback_withdrawn':
      return {
        subject: `تم سحب الكاش باك ${formatAmountArabic(data.amount)} ر.س - MaxioCore`,
        content: `
          ${createIconCircle('✅', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          ${createGreeting('تم سحب الكاش باك بنجاح!')}
          ${createMessage('تم تحويل الكاش باك إلى رصيدك الرئيسي وأصبح متاحاً للاستخدام.')}
          
          ${createHighlightBox(`${formatAmountArabic(data.amount)} ر.س`, 'تم تحويله للرصيد الرئيسي', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          
          ${createInfoCard([
            { label: 'رصيد الكاش باك المتبقي', value: `${formatAmountArabic(data.remainingCashback)} ر.س` },
            { label: 'الرصيد الرئيسي الجديد', value: `${formatAmountArabic(data.newBalance)} ر.س`, valueColor: '#6366f1' }
          ])}
        `
      };

    case 'bank_withdrawal_pending':
      return {
        subject: `طلب سحب بنكي قيد المراجعة - MaxioCore`,
        content: `
          ${createIconCircle('🏦', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          ${createGreeting('تم استلام طلب السحب البنكي')}
          ${createMessage('طلب السحب البنكي الخاص بك قيد المراجعة وسيتم معالجته خلال 1-3 أيام عمل.')}
          
          ${createHighlightBox(`${formatAmountArabic(data.amount)} ر.س`, 'المبلغ المطلوب سحبه', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          
          ${createInfoCard([
            { label: 'اسم البنك', value: data.bankName },
            { label: 'اسم صاحب الحساب', value: data.accountHolderName },
            { label: 'رقم الآيبان', value: data.iban },
            { label: 'الحالة', value: 'قيد المراجعة', isStatus: true, statusColor: '#fef3c7', valueColor: '#92400e' }
          ])}
          
          ${createNoticeBox('⏰ سيتم إشعارك فور اكتمال عملية التحويل.', '#f0f9ff', '#0369a1', '#0ea5e9')}
        `
      };

    case 'bank_withdrawal_completed':
      return {
        subject: `✅ تم تحويل ${formatAmountArabic(data.amount)} ر.س إلى حسابك البنكي - MaxioCore`,
        content: `
          ${createIconCircle('🎉', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          ${createGreeting('تم التحويل بنجاح!')}
          ${createMessage('تم تحويل المبلغ إلى حسابك البنكي بنجاح.')}
          
          ${createHighlightBox(`${formatAmountArabic(data.amount)} ر.س`, 'تم تحويله', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          
          ${createInfoCard([
            { label: 'اسم البنك', value: data.bankName },
            { label: 'رقم الآيبان', value: data.iban },
            { label: 'الحالة', value: 'مكتمل', isStatus: true, statusColor: '#dcfce7', valueColor: '#166534' }
          ])}
          
          ${createNoticeBox('💡 قد يستغرق ظهور المبلغ في حسابك 1-2 يوم عمل حسب البنك.', '#f0f9ff', '#0369a1', '#0ea5e9')}
        `
      };

    case 'bank_withdrawal_rejected':
      return {
        subject: `❌ تم رفض طلب السحب البنكي - MaxioCore`,
        content: `
          ${createIconCircle('❌', 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)')}
          ${createGreeting('تم رفض طلب السحب')}
          ${createMessage('نأسف لإبلاغك بأنه تم رفض طلب السحب البنكي الخاص بك.')}
          
          ${createInfoCard([
            { label: 'المبلغ', value: `${formatAmountArabic(data.amount)} ر.س` },
            { label: 'اسم البنك', value: data.bankName },
            { label: 'الحالة', value: 'مرفوض', isStatus: true, statusColor: '#fee2e2', valueColor: '#991b1b' },
            ...(data.reason ? [{ label: 'سبب الرفض', value: data.reason }] : [])
          ])}
          
          ${createNoticeBox('📞 إذا كان لديك أي استفسار، يرجى التواصل مع الدعم الفني.', '#fef3c7', '#92400e', '#f59e0b')}
          
          ${createCTAButton('تواصل معنا')}
        `
      };

    case 'tier_upgrade':
      return {
        subject: `🎉 مبروك! لقد ترقيت إلى ${data.tierName} - MaxioCore`,
        content: `
          ${createIconCircle('🏆', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          ${createGreeting('مبروك الترقية! 🎉')}
          ${createMessage('لقد وصلت إلى مستوى جديد! استمتع بالمزايا الحصرية الجديدة.')}
          
          ${createHighlightBox(data.tierName, 'مستواك الجديد', `linear-gradient(135deg, ${data.tierColor || '#6366f1'} 0%, ${data.tierColor || '#8b5cf6'} 100%)`)}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; border-right: 4px solid #6366f1; margin-bottom: 25px;">
            <tr>
              <td style="padding: 25px;">
                <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 16px; text-align: right;">✨ مميزاتك الجديدة</h3>
                <p style="margin: 0 0 10px; color: #475569; font-size: 14px; text-align: right;">⭐ مضاعف النقاط: ${data.multiplier}x</p>
                ${data.benefits?.map((b: string) => `<p style="margin: 0 0 10px; color: #475569; font-size: 14px; text-align: right;">✅ ${b}</p>`).join('') || ''}
              </td>
            </tr>
          </table>
          
          ${createCTAButton('استمتع بمميزاتك')}
        `
      };

    case 'challenge_completed':
      return {
        subject: `🏆 أكملت تحدي "${data.challengeTitle}"! - MaxioCore`,
        content: `
          ${createIconCircle('🎯', 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)')}
          ${createGreeting('تحدي مكتمل! 🏆')}
          ${createMessage('أحسنت! لقد أكملت التحدي وحصلت على المكافأة.')}
          
          ${createHighlightBox(`+${data.rewardPoints}`, 'نقطة مكافأة', 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)')}
          
          ${createInfoCard([
            { label: 'اسم التحدي', value: data.challengeTitle },
            { label: 'النوع', value: data.challengeType === 'daily' ? 'يومي' : 'أسبوعي' }
          ])}
          
          ${createCTAButton('شاهد التحديات الجديدة')}
        `
      };

    case 'refund_processed':
      return {
        subject: `تم استرداد ${formatAmountArabic(data.amount)} ر.س إلى رصيدك - MaxioCore`,
        content: `
          ${createIconCircle('↩️', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          ${createGreeting('تم استرداد الرصيد')}
          ${createMessage('تم استرداد مبلغ الطلب إلى رصيدك بنجاح.')}
          
          ${createHighlightBox(`+${formatAmountArabic(data.amount)} ر.س`, 'تم استرداده', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.orderNumber },
            { label: 'سبب الاسترداد', value: data.reason || 'إلغاء الطلب' },
            { label: 'الرصيد الجديد', value: `${formatAmountArabic(data.newBalance)} ر.س`, valueColor: '#6366f1' }
          ])}
        `
      };

    case 'offer_notification':
      return {
        subject: `🔥 عرض خاص: ${data.offerTitle} - MaxioCore`,
        content: `
          ${createIconCircle('🎁', 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)')}
          ${createGreeting('عرض حصري لك! 🔥')}
          ${createMessage(data.offerDescription || 'لا تفوت هذا العرض المميز!')}
          
          ${createHighlightBox(`${data.discountPercentage}%`, 'خصم', 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)')}
          
          ${createInfoCard([
            { label: 'اسم العرض', value: data.offerTitle },
            ...(data.originalPrice ? [{ label: 'السعر الأصلي', value: `${formatAmountArabic(data.originalPrice)} ر.س`, valueColor: '#94a3b8' }] : []),
            ...(data.offerPrice ? [{ label: 'سعر العرض', value: `${formatAmountArabic(data.offerPrice)} ر.س`, valueColor: '#22c55e' }] : []),
            ...(data.endDate ? [{ label: 'ينتهي في', value: data.endDate }] : [])
          ])}
          
          ${createCTAButton('استفد من العرض الآن')}
        `
      };

    case 'package_inquiry':
      return {
        subject: `🎯 طلب باقة جديد: ${data.packageName} - ${data.categoryName}`,
        content: `
          ${createIconCircle('📋', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          ${createGreeting('طلب باقة جديد! 🎯')}
          ${createMessage('تم استلام طلب باقة جديد من العميل. يرجى المتابعة في أقرب وقت.')}
          
          ${createHighlightBox(data.packageName, data.categoryName)}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; border-right: 4px solid #6366f1; margin-bottom: 25px;">
            <tr>
              <td style="padding: 25px;">
                <h3 style="margin: 0 0 20px; color: #1e293b; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; text-align: right;">📧 معلومات العميل</h3>
                ${createInfoCard([
                  { label: 'الاسم الكامل', value: data.clientName },
                  { label: 'البريد الإلكتروني', value: data.clientEmail },
                  { label: 'رقم الجوال', value: data.clientPhone },
                  ...(data.companyName ? [{ label: 'اسم الشركة', value: data.companyName }] : [])
                ])}
              </td>
            </tr>
          </table>
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; border-right: 4px solid #8b5cf6; margin-bottom: 25px;">
            <tr>
              <td style="padding: 25px;">
                <h3 style="margin: 0 0 20px; color: #1e293b; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; text-align: right;">📦 تفاصيل الباقة</h3>
                ${createInfoCard([
                  { label: 'القسم', value: data.categoryName },
                  { label: 'اسم الباقة', value: data.packageName },
                  { label: 'السعر', value: `${data.packagePrice} ر.س / ${data.packagePeriod}`, valueColor: '#6366f1' }
                ])}
              </td>
            </tr>
          </table>
          
          ${data.message ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
              <tr>
                <td style="padding: 25px;">
                  <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 16px; text-align: right;">💬 رسالة العميل</h3>
                  <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.8; text-align: right;">${data.message}</p>
                </td>
              </tr>
            </table>
          ` : ''}
          
          ${createNoticeBox('⏰ يرجى التواصل مع العميل في أقرب وقت ممكن', '#fef3c7', '#92400e', '#f59e0b')}
        `
      };

    case 'custom':
      return {
        subject: data.subject || 'رسالة من MaxioCore',
        content: `
          ${createGreeting(data.title || 'مرحباً')}
          ${createMessage(data.message || '')}
          ${data.customHtml || ''}
        `
      };

    default:
      return {
        subject: 'إشعار من MaxioCore',
        content: `
          ${createGreeting('مرحباً')}
          ${createMessage('لديك إشعار جديد من MaxioCore.')}
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
