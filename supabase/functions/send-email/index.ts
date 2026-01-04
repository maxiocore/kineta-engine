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
  | 'financing_approved'
  | 'financing_rejected'
  | 'financing_new_application'
  | 'financing_documents_required'
  | 'financing_under_review'
  | 'financing_application_received'
  | 'financing_promissory_note'
  | 'financing_contract'
  | 'financing_payment_client'
  | 'financing_payment_admin'
  | 'financing_payment_reminder'
  | 'financing_payment_overdue'
  | 'financing_clearance'
  | 'new_ticket'
  | 'ticket_reply'
  | 'ticket_status_changed'
  | 'ticket_rating'
  | 'dev_order_created'
  | 'dev_order_created_admin'
  | 'dev_order_status_changed'
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

    case 'financing_approved':
      return {
        subject: `🎉 تمت الموافقة على طلب التمويل #${data.applicationNumber}`,
        content: `
          ${createIconCircle('🎉', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          ${createGreeting(`مبروك ${data.name}! 🎊`)}
          ${createMessage('تمت الموافقة على طلب التمويل الخاص بك بنجاح. تم إضافة الرصيد إلى حسابك ويمكنك استخدامه فوراً لشراء خدماتنا.')}
          
          ${createHighlightBox(`${formatAmountArabic(data.amount)} ر.س`, 'مبلغ التمويل المعتمد', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.applicationNumber },
            { label: 'مبلغ التمويل', value: `${formatAmountArabic(data.amount)} ر.س`, valueColor: '#22c55e' },
            { label: 'عدد الأقساط', value: `${data.installmentsCount} قسط` },
            { label: 'القسط الشهري', value: `${formatAmountArabic(data.monthlyInstallment)} ر.س`, valueColor: '#6366f1' }
          ])}
          
          ${createNoticeBox('⚠️ تنبيه مهم: الرصيد المضاف لحسابك صالح للاستخدام داخل المنصة فقط لشراء خدمات البرمجة والتصميم ومواقع التواصل. لا يمكن سحب هذا الرصيد نقداً أو تحويله.', '#fef3c7', '#92400e', '#f59e0b')}
          
          ${createCTAButton('استخدم رصيدك الآن')}
        `
      };

    case 'financing_rejected':
      return {
        subject: `نتيجة مراجعة طلب التمويل #${data.applicationNumber}`,
        content: `
          ${createIconCircle('📋', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          ${createGreeting(`مرحباً ${data.name}`)}
          ${createMessage('نأسف لإبلاغك بأنه لم تتم الموافقة على طلب التمويل الخاص بك في الوقت الحالي.')}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.applicationNumber },
            { label: 'الحالة', value: 'لم يتم القبول', isStatus: true, statusColor: '#fee2e2', valueColor: '#991b1b' },
            ...(data.rejectionReason ? [{ label: 'السبب', value: data.rejectionReason }] : [])
          ])}
          
          ${createMessage('يمكنك التقديم مرة أخرى بعد استيفاء الشروط المطلوبة. لأي استفسار، لا تتردد في التواصل معنا.')}
          
          ${createCTAButton('تواصل معنا')}
        `
      };

    case 'financing_new_application':
      return {
        subject: `📋 طلب تمويل جديد #${data.applicationNumber} - يتطلب المراجعة`,
        content: `
          ${createIconCircle('🏦', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          ${createGreeting('طلب تمويل جديد! 📋')}
          ${createMessage('تم استلام طلب تمويل جديد يتطلب مراجعتك.')}
          
          ${createHighlightBox(`${formatAmountArabic(data.requestedAmount)} ر.س`, 'المبلغ المطلوب', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.applicationNumber },
            { label: 'اسم المتقدم', value: data.applicantName },
            { label: 'البريد الإلكتروني', value: data.applicantEmail },
            { label: 'رقم الجوال', value: data.applicantPhone },
            ...(data.serviceDescription ? [{ label: 'وصف الخدمة', value: data.serviceDescription }] : [])
          ])}
          
          ${createNoticeBox('⏰ يرجى مراجعة الطلب واتخاذ القرار في أقرب وقت ممكن.', '#f0f9ff', '#0369a1', '#0ea5e9')}
          
          ${createCTAButton('مراجعة الطلب')}
        `
      };

    case 'financing_application_received':
      return {
        subject: `✅ تم استلام طلب التمويل #${data.applicationNumber} - MaxioCore`,
        content: `
          ${createIconCircle('✅', 'linear-gradient(135deg, #10b981 0%, #059669 100%)')}
          ${createGreeting(`مرحباً ${data.name}! 🎉`)}
          ${createMessage('تم استلام طلب التمويل الخاص بك بنجاح وهو الآن قيد المراجعة. سيتم إشعارك بالنتيجة عبر البريد الإلكتروني.')}
          
          ${createHighlightBox(`${formatAmountArabic(data.requestedAmount)} ر.س`, 'المبلغ المطلوب', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.applicationNumber },
            { label: 'المبلغ المطلوب', value: `${formatAmountArabic(data.requestedAmount)} ر.س` },
            { label: 'عدد الأقساط', value: `${data.installmentsCount} قسط` },
            { label: 'القسط الشهري المتوقع', value: `${formatAmountArabic(data.monthlyInstallment)} ر.س`, valueColor: '#6366f1' },
            { label: 'الحالة', value: 'قيد المراجعة', isStatus: true, statusColor: '#fef3c7', valueColor: '#92400e' }
          ])}
          
          ${createNoticeBox('⏳ عادةً ما يتم مراجعة الطلبات خلال 24-48 ساعة عمل. سنتواصل معك في حال احتجنا لأي معلومات إضافية.', '#f0f9ff', '#0369a1', '#0ea5e9')}
          
          ${createMessage('شكراً لثقتك بـ MaxioCore. نتطلع لخدمتك!')}
          
          ${createCTAButton('متابعة طلبك')}
        `
      };

    case 'financing_documents_required':
      return {
        subject: `📋 مطلوب مستندات إضافية لطلب التمويل #${data.applicationNumber}`,
        content: `
          ${createIconCircle('📄', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          ${createGreeting(`مرحباً ${data.name}`)}
          ${createMessage('نحتاج إلى بعض المستندات الإضافية لإكمال مراجعة طلب التمويل الخاص بك.')}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.applicationNumber },
            { label: 'الحالة', value: 'مطلوب مستندات', isStatus: true, statusColor: '#fef3c7', valueColor: '#92400e' }
          ])}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 14px; border-right: 4px solid #f59e0b; margin-bottom: 25px;">
            <tr>
              <td style="padding: 20px 25px;">
                <h3 style="margin: 0 0 15px; color: #92400e; font-size: 16px; text-align: right;">📋 المستندات المطلوبة</h3>
                <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.8; text-align: right; white-space: pre-wrap;">${data.requiredDocuments}</p>
              </td>
            </tr>
          </table>
          
          ${data.adminNotes ? createNoticeBox(`💬 ملاحظات إضافية: ${data.adminNotes}`, '#f0f9ff', '#0369a1', '#0ea5e9') : ''}
          
          ${createMessage('يرجى تجهيز المستندات المطلوبة والتواصل معنا لاستكمال طلبك. نحن هنا لمساعدتك!')}
          
          ${createCTAButton('تواصل معنا')}
        `
      };

    case 'financing_under_review':
      return {
        subject: `🔍 طلب التمويل #${data.applicationNumber} قيد المراجعة`,
        content: `
          ${createIconCircle('🔍', 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)')}
          ${createGreeting(`مرحباً ${data.name}`)}
          ${createMessage('طلب التمويل الخاص بك قيد المراجعة الآن. سنقوم بإشعارك بالنتيجة في أقرب وقت ممكن.')}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.applicationNumber },
            { label: 'الحالة', value: 'قيد المراجعة', isStatus: true, statusColor: '#dbeafe', valueColor: '#1d4ed8' }
          ])}
          
          ${createNoticeBox('⏳ عادةً ما يتم مراجعة الطلبات خلال 24-48 ساعة عمل.', '#f0f9ff', '#0369a1', '#0ea5e9')}
          
          ${createCTAButton('متابعة طلبك')}
        `
      };

    case 'financing_promissory_note':
      const installmentDates = [];
      const startDateObj = new Date(data.startDate);
      for (let i = 1; i <= data.installmentsCount; i++) {
        const dueDate = new Date(startDateObj);
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setDate(27);
        installmentDates.push({
          num: i,
          date: dueDate.toLocaleDateString('ar-SA'),
          amount: formatAmountArabic(data.monthlyInstallment)
        });
      }
      
      return {
        subject: `📋 السند التنفيذي - طلب التمويل #${data.applicationNumber}`,
        content: `
          ${createIconCircle('📋', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          ${createGreeting(`مرحباً ${data.name}`)}
          ${createMessage('تمت الموافقة المبدئية على طلب التمويل الخاص بك! يرجى مراجعة السند التنفيذي أدناه والتوقيع عليه وإرساله لنا لإتمام العملية.')}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 14px; border: 2px solid #f59e0b; margin-bottom: 25px;">
            <tr>
              <td style="padding: 25px;">
                <h2 style="margin: 0 0 20px; text-align: center; color: #f59e0b; font-size: 24px; border-bottom: 2px solid #f59e0b; padding-bottom: 15px;">📜 سند لأمر</h2>
                
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; width: 40%;">رقم العقد:</td>
                    <td style="padding: 8px 0; color: #fff; font-weight: bold;">${data.contractNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">رقم الطلب:</td>
                    <td style="padding: 8px 0; color: #fff; font-weight: bold;">${data.applicationNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">التاريخ:</td>
                    <td style="padding: 8px 0; color: #fff;">${new Date().toLocaleDateString('ar-SA')}</td>
                  </tr>
                </table>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                  <p style="margin: 0 0 15px; color: #e2e8f0; font-size: 15px; line-height: 1.8; text-align: right;">
                    أتعهد أنا الموقع أدناه:
                  </p>
                  <p style="margin: 0 0 10px; color: #fff;"><strong>الاسم:</strong> ${data.name}</p>
                  <p style="margin: 0 0 10px; color: #fff;"><strong>رقم الهوية:</strong> ${data.nationalId}</p>
                  <p style="margin: 0 0 15px; color: #e2e8f0; font-size: 15px; line-height: 1.8; text-align: right;">
                    بأن أدفع لأمر شركة ماكسيو كور للخدمات الرقمية مبلغاً وقدره:
                  </p>
                  <p style="margin: 0; text-align: center; font-size: 28px; font-weight: bold; color: #f59e0b;">${formatAmountArabic(data.amount)} ريال سعودي</p>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px; color: #f59e0b; font-size: 16px;">جدول السداد (${data.installmentsCount} قسط):</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr style="background: rgba(255,255,255,0.1);">
                      <th style="padding: 10px; color: #94a3b8; text-align: right; border-bottom: 1px solid #334155;">القسط</th>
                      <th style="padding: 10px; color: #94a3b8; text-align: right; border-bottom: 1px solid #334155;">تاريخ الاستحقاق</th>
                      <th style="padding: 10px; color: #94a3b8; text-align: right; border-bottom: 1px solid #334155;">المبلغ</th>
                    </tr>
                    ${installmentDates.map(inst => `
                      <tr>
                        <td style="padding: 10px; color: #fff; border-bottom: 1px solid #334155;">القسط ${inst.num}</td>
                        <td style="padding: 10px; color: #fff; border-bottom: 1px solid #334155;">${inst.date}</td>
                        <td style="padding: 10px; color: #22c55e; font-weight: bold; border-bottom: 1px solid #334155;">${inst.amount} ر.س</td>
                      </tr>
                    `).join('')}
                  </table>
                </div>
                
                <div style="border: 2px dashed #475569; border-radius: 10px; padding: 20px; margin-top: 20px;">
                  <p style="margin: 0 0 15px; color: #94a3b8; text-align: center;">مكان التوقيع</p>
                  <div style="height: 60px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;"></div>
                  <p style="margin: 0; color: #64748b; text-align: center; font-size: 12px;">التاريخ: .....................</p>
                </div>
              </td>
            </tr>
          </table>
          
          ${createNoticeBox('⚠️ تنبيه مهم: يرجى طباعة هذا السند والتوقيع عليه وإرساله عبر البريد الإلكتروني أو الواتساب لإتمام عملية التمويل. لن يتم إضافة الرصيد لحسابك إلا بعد استلام السند الموقع.', '#fef3c7', '#92400e', '#f59e0b')}
          
          ${createMessage('للتواصل والإرسال: info@maxiocore.com')}
        `
      };

    case 'financing_contract':
      const contractInstallmentDates = [];
      const contractStartDate = new Date();
      for (let i = 1; i <= data.installmentsCount; i++) {
        const dueDate = new Date(contractStartDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setDate(27);
        contractInstallmentDates.push({
          num: i,
          date: dueDate.toLocaleDateString('ar-SA'),
          amount: formatAmountArabic(data.monthlyInstallment)
        });
      }
      
      return {
        subject: `📋 عقد التمويل - طلب #${data.applicationNumber}`,
        content: `
          ${createIconCircle('📋', 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)')}
          ${createGreeting(`مرحباً ${data.name}`)}
          ${createMessage('تهانينا! تمت الموافقة المبدئية على طلب التمويل الخاص بك. يرجى مراجعة عقد التمويل أدناه والتوقيع عليه وإرساله لنا.')}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 14px; border: 2px solid #3b82f6; margin-bottom: 25px;">
            <tr>
              <td style="padding: 25px;">
                <h2 style="margin: 0 0 20px; text-align: center; color: #3b82f6; font-size: 24px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px;">📄 عقد التمويل</h2>
                
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; width: 40%;">رقم العقد:</td>
                    <td style="padding: 8px 0; color: #fff; font-weight: bold;">${data.contractNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">رقم الطلب:</td>
                    <td style="padding: 8px 0; color: #fff; font-weight: bold;">${data.applicationNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">التاريخ:</td>
                    <td style="padding: 8px 0; color: #fff;">${new Date().toLocaleDateString('ar-SA')}</td>
                  </tr>
                </table>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px; color: #3b82f6; font-size: 16px;">تفاصيل التمويل:</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">مبلغ التمويل:</td>
                      <td style="padding: 8px 0; color: #22c55e; font-weight: bold; font-size: 18px;">${formatAmountArabic(data.amount)} ر.س</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">عدد الأقساط:</td>
                      <td style="padding: 8px 0; color: #fff;">${data.installmentsCount} قسط</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">مدة التمويل:</td>
                      <td style="padding: 8px 0; color: #fff;">${data.durationMonths} شهر</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">القسط الشهري:</td>
                      <td style="padding: 8px 0; color: #f59e0b; font-weight: bold;">${formatAmountArabic(data.monthlyInstallment)} ر.س</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px; color: #3b82f6; font-size: 16px;">جدول السداد التقريبي:</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr style="background: rgba(255,255,255,0.1);">
                      <th style="padding: 10px; color: #94a3b8; text-align: right; border-bottom: 1px solid #334155;">القسط</th>
                      <th style="padding: 10px; color: #94a3b8; text-align: right; border-bottom: 1px solid #334155;">تاريخ الاستحقاق</th>
                      <th style="padding: 10px; color: #94a3b8; text-align: right; border-bottom: 1px solid #334155;">المبلغ</th>
                    </tr>
                    ${contractInstallmentDates.slice(0, 3).map(inst => `
                      <tr>
                        <td style="padding: 10px; color: #fff; border-bottom: 1px solid #334155;">القسط ${inst.num}</td>
                        <td style="padding: 10px; color: #fff; border-bottom: 1px solid #334155;">${inst.date}</td>
                        <td style="padding: 10px; color: #22c55e; font-weight: bold; border-bottom: 1px solid #334155;">${inst.amount} ر.س</td>
                      </tr>
                    `).join('')}
                    ${data.installmentsCount > 3 ? `
                      <tr>
                        <td colspan="3" style="padding: 10px; color: #94a3b8; text-align: center; border-bottom: 1px solid #334155;">... و ${data.installmentsCount - 3} أقساط أخرى</td>
                      </tr>
                    ` : ''}
                  </table>
                </div>
                
                <div style="background: rgba(59, 130, 246, 0.1); border-radius: 10px; padding: 20px; margin-bottom: 20px; border: 1px solid #3b82f6;">
                  <h3 style="margin: 0 0 15px; color: #3b82f6; font-size: 16px;">الشروط والأحكام:</h3>
                  <ul style="margin: 0; padding: 0 20px; color: #e2e8f0; font-size: 14px; line-height: 1.8;">
                    <li>يلتزم العميل بسداد الأقساط في مواعيدها المحددة.</li>
                    <li>في حالة التأخر عن السداد، قد يتم تطبيق رسوم تأخير.</li>
                    <li>يمكن للعميل السداد المبكر دون أي رسوم إضافية.</li>
                    <li>يتم إضافة مبلغ التمويل لرصيد العميل بعد توقيع العقد والسند التنفيذي.</li>
                  </ul>
                </div>
                
                <div style="border: 2px dashed #475569; border-radius: 10px; padding: 20px; margin-top: 20px;">
                  <p style="margin: 0 0 15px; color: #94a3b8; text-align: center;">مكان التوقيع</p>
                  <div style="height: 60px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;"></div>
                  <p style="margin: 0; color: #64748b; text-align: center; font-size: 12px;">التاريخ: .....................</p>
                </div>
              </td>
            </tr>
          </table>
          
          ${createNoticeBox('📝 الخطوة التالية: يرجى طباعة هذا العقد والتوقيع عليه وإرساله عبر البريد الإلكتروني أو الواتساب. بعد استلام العقد الموقع، سنرسل لك السند التنفيذي للتوقيع عليه.', '#dbeafe', '#1d4ed8', '#3b82f6')}
          
          ${createMessage('للتواصل والإرسال: info@maxiocore.com')}
        `
      };

    case 'financing_payment_client':
      return {
        subject: `✅ تأكيد سداد القسط رقم ${data.installmentNumber} - طلب التمويل #${data.applicationNumber}`,
        content: `
          ${createIconCircle('✅', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          ${createGreeting(`مرحباً ${data.name}`)}
          ${createMessage('تم تسجيل سداد القسط بنجاح. شكراً لالتزامك بالسداد في الموعد المحدد.')}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 14px; border: 2px solid #22c55e; margin-bottom: 25px;">
            <tr>
              <td style="padding: 25px;">
                <h2 style="margin: 0 0 20px; text-align: center; color: #22c55e; font-size: 24px; border-bottom: 2px solid #22c55e; padding-bottom: 15px;">🏦 إيصال السداد</h2>
                
                <div style="background: rgba(34, 197, 94, 0.1); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                  <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">المبلغ المسدد</p>
                  <p style="margin: 0; color: #22c55e; font-size: 36px; font-weight: 800;">${formatAmountArabic(data.amount)} ر.س</p>
                </div>
                
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155; width: 45%;">رقم الإيصال:</td>
                    <td style="padding: 12px 0; color: #fff; font-weight: bold; border-bottom: 1px solid #334155;">${data.receiptNumber || 'PAY-' + Date.now()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">رقم العقد:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.contractNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">رقم الطلب:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.applicationNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">رقم القسط:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.installmentNumber} من ${data.totalInstallments}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">تاريخ السداد:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.paymentDate || new Date().toLocaleDateString('ar-SA')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">طريقة الدفع:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.paymentMethod || 'الرصيد'}</td>
                  </tr>
                </table>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">إجمالي المدفوع:</td>
                      <td style="padding: 8px 0; color: #22c55e; font-weight: bold; text-align: left;">${formatAmountArabic(data.totalPaid)} ر.س</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">المتبقي:</td>
                      <td style="padding: 8px 0; color: #f59e0b; font-weight: bold; text-align: left;">${formatAmountArabic(data.remainingAmount)} ر.س</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">الأقساط المتبقية:</td>
                      <td style="padding: 8px 0; color: #fff; text-align: left;">${data.remainingInstallments} قسط</td>
                    </tr>
                    ${data.nextDueDate ? `
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">موعد القسط القادم:</td>
                      <td style="padding: 8px 0; color: #3b82f6; font-weight: bold; text-align: left;">${data.nextDueDate}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
              </td>
            </tr>
          </table>
          
          ${data.remainingInstallments === 0 
            ? createNoticeBox('🎉 تهانينا! لقد أتممت سداد جميع الأقساط بنجاح. شكراً لثقتك بنا!', '#dcfce7', '#166534', '#22c55e')
            : createNoticeBox('💡 نصيحة: يمكنك دفع الأقساط المتبقية مبكراً من خلال صفحة التمويل في حسابك.', '#dbeafe', '#1d4ed8', '#3b82f6')
          }
          
          ${createCTAButton('عرض تفاصيل التمويل')}
        `
      };

    case 'financing_payment_admin':
      return {
        subject: `🔔 إشعار سداد قسط - العميل ${data.clientName} - طلب #${data.applicationNumber}`,
        content: `
          ${createIconCircle('🏦', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          ${createGreeting('إشعار سداد قسط تمويل')}
          ${createMessage('تم تسجيل سداد قسط تمويل من أحد العملاء. فيما يلي تفاصيل العملية:')}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 14px; border: 2px solid #6366f1; margin-bottom: 25px;">
            <tr>
              <td style="padding: 25px;">
                <h2 style="margin: 0 0 20px; text-align: center; color: #6366f1; font-size: 24px; border-bottom: 2px solid #6366f1; padding-bottom: 15px;">📊 تفاصيل عملية السداد</h2>
                
                <div style="background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                  <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">المبلغ المسدد</p>
                  <p style="margin: 0; color: #22c55e; font-size: 36px; font-weight: 800;">${formatAmountArabic(data.amount)} ر.س</p>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px; color: #a5b4fc; font-size: 16px;">👤 بيانات العميل:</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8; width: 40%;">الاسم:</td>
                      <td style="padding: 8px 0; color: #fff; font-weight: bold;">${data.clientName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">البريد الإلكتروني:</td>
                      <td style="padding: 8px 0; color: #fff;">${data.clientEmail}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">رقم الهاتف:</td>
                      <td style="padding: 8px 0; color: #fff;">${data.clientPhone || 'غير متوفر'}</td>
                    </tr>
                  </table>
                </div>
                
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155; width: 45%;">رقم العقد:</td>
                    <td style="padding: 12px 0; color: #fff; font-weight: bold; border-bottom: 1px solid #334155;">${data.contractNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">رقم الطلب:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.applicationNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">رقم القسط:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.installmentNumber} من ${data.totalInstallments}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">تاريخ السداد:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.paymentDate || new Date().toLocaleDateString('ar-SA')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">طريقة الدفع:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.paymentMethod || 'الرصيد'}</td>
                  </tr>
                </table>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-top: 20px;">
                  <h3 style="margin: 0 0 15px; color: #a5b4fc; font-size: 16px;">📈 ملخص التمويل:</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">مبلغ التمويل الأصلي:</td>
                      <td style="padding: 8px 0; color: #fff; text-align: left;">${formatAmountArabic(data.originalAmount)} ر.س</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">إجمالي المدفوع:</td>
                      <td style="padding: 8px 0; color: #22c55e; font-weight: bold; text-align: left;">${formatAmountArabic(data.totalPaid)} ر.س</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">المتبقي:</td>
                      <td style="padding: 8px 0; color: #f59e0b; font-weight: bold; text-align: left;">${formatAmountArabic(data.remainingAmount)} ر.س</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">نسبة الإنجاز:</td>
                      <td style="padding: 8px 0; color: #3b82f6; font-weight: bold; text-align: left;">${data.completionPercentage || Math.round((data.totalPaid / data.originalAmount) * 100)}%</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>
          
          ${createCTAButton('عرض تفاصيل الطلب في لوحة التحكم')}
        `
      };

    case 'financing_payment_reminder':
      return {
        subject: `⏰ تذكير بموعد سداد القسط - طلب التمويل #${data.applicationNumber}`,
        content: `
          ${createIconCircle('⏰', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          ${createGreeting(`مرحباً ${data.name}`)}
          ${createMessage('نود تذكيرك بموعد سداد القسط القادم. يرجى التأكد من توفر الرصيد الكافي لإتمام عملية السداد.')}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 14px; border: 2px solid #f59e0b; margin-bottom: 25px;">
            <tr>
              <td style="padding: 25px;">
                <h2 style="margin: 0 0 20px; text-align: center; color: #f59e0b; font-size: 24px; border-bottom: 2px solid #f59e0b; padding-bottom: 15px;">📅 تذكير بموعد السداد</h2>
                
                <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                  <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">المبلغ المستحق</p>
                  <p style="margin: 0; color: #f59e0b; font-size: 36px; font-weight: 800;">${formatAmountArabic(data.amount)} ر.س</p>
                </div>
                
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155; width: 45%;">رقم القسط:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.installmentNumber} من ${data.totalInstallments}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">تاريخ الاستحقاق:</td>
                    <td style="padding: 12px 0; color: #f59e0b; font-weight: bold; border-bottom: 1px solid #334155;">${data.dueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">الأيام المتبقية:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.daysRemaining} يوم</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          ${createNoticeBox('💡 نصيحة: ادفع الآن وتجنب رسوم التأخير. يمكنك الدفع من خلال صفحة التمويل في حسابك.', '#fef3c7', '#92400e', '#f59e0b')}
          
          ${createCTAButton('ادفع الآن')}
        `
      };

    case 'financing_payment_overdue':
      return {
        subject: `🚨 قسط متأخر - طلب التمويل #${data.applicationNumber}`,
        content: `
          ${createIconCircle('🚨', 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)')}
          ${createGreeting(`مرحباً ${data.name}`)}
          ${createMessage('نود إعلامك بأن لديك قسط متأخر السداد. يرجى السداد في أقرب وقت ممكن لتجنب أي رسوم إضافية.')}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 14px; border: 2px solid #ef4444; margin-bottom: 25px;">
            <tr>
              <td style="padding: 25px;">
                <h2 style="margin: 0 0 20px; text-align: center; color: #ef4444; font-size: 24px; border-bottom: 2px solid #ef4444; padding-bottom: 15px;">⚠️ قسط متأخر</h2>
                
                <div style="background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                  <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">المبلغ المستحق</p>
                  <p style="margin: 0; color: #ef4444; font-size: 36px; font-weight: 800;">${formatAmountArabic(data.amount)} ر.س</p>
                  ${data.lateFee ? `<p style="margin: 10px 0 0; color: #f87171; font-size: 14px;">+ رسوم تأخير: ${formatAmountArabic(data.lateFee)} ر.س</p>` : ''}
                </div>
                
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155; width: 45%;">رقم القسط:</td>
                    <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.installmentNumber} من ${data.totalInstallments}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">تاريخ الاستحقاق:</td>
                    <td style="padding: 12px 0; color: #ef4444; font-weight: bold; border-bottom: 1px solid #334155;">${data.dueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">أيام التأخير:</td>
                    <td style="padding: 12px 0; color: #ef4444; font-weight: bold; border-bottom: 1px solid #334155;">${data.daysOverdue} يوم</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          ${createNoticeBox('⚠️ تنبيه مهم: التأخر في السداد قد يؤثر على تقييمك الائتماني. يرجى السداد فوراً لتجنب أي عواقب إضافية.', '#fee2e2', '#991b1b', '#ef4444')}
          
          ${createCTAButton('ادفع الآن')}
          
          ${createMessage('في حال واجهت أي صعوبات في السداد، يرجى التواصل معنا على info@maxiocore.com')}
        `
      };

    case 'financing_clearance':
      const clearanceDate = new Date();
      const cancellationDate = new Date();
      cancellationDate.setDate(cancellationDate.getDate() + 5);
      // Skip weekends for business days calculation
      let businessDays = 0;
      let checkDate = new Date(clearanceDate);
      while (businessDays < 5) {
        checkDate.setDate(checkDate.getDate() + 1);
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Skip Friday and Saturday (weekend in Saudi)
          businessDays++;
        }
      }
      
      return {
        subject: `🎊 مخالصة نهائية - تهانينا! تم سداد كامل التمويل #${data.applicationNumber}`,
        content: `
          ${createIconCircle('🎊', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}
          ${createGreeting(`تهانينا ${data.name}! 🎉`)}
          ${createMessage('يسعدنا إبلاغك بأنه تم سداد كامل مبلغ التمويل بنجاح. نشكرك على التزامك وثقتك بنا.')}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 14px; border: 3px solid #22c55e; margin-bottom: 25px;">
            <tr>
              <td style="padding: 30px;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; width: 100px; height: 100px; line-height: 100px; margin-bottom: 15px;">
                    <span style="font-size: 50px;">✅</span>
                  </div>
                  <h2 style="margin: 0; color: #22c55e; font-size: 28px; font-weight: 800;">شهادة مخالصة نهائية</h2>
                  <p style="margin: 10px 0 0; color: #94a3b8; font-size: 14px;">Clearance Certificate</p>
                </div>
                
                <div style="background: rgba(34, 197, 94, 0.1); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px; border: 1px solid rgba(34, 197, 94, 0.3);">
                  <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">إجمالي المبلغ المسدد</p>
                  <p style="margin: 0; color: #22c55e; font-size: 42px; font-weight: 800;">${formatAmountArabic(data.totalAmount)} ر.س</p>
                  <p style="margin: 10px 0 0; color: #64748b; font-size: 13px;">مسدد بالكامل ✓</p>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px; color: #22c55e; font-size: 18px; text-align: center;">📋 بيانات المخالصة</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155; width: 45%;">رقم المخالصة:</td>
                      <td style="padding: 12px 0; color: #22c55e; font-weight: bold; border-bottom: 1px solid #334155;">CLR-${Date.now()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">اسم العميل:</td>
                      <td style="padding: 12px 0; color: #fff; font-weight: bold; border-bottom: 1px solid #334155;">${data.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">رقم الهوية:</td>
                      <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.nationalId || '---'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">رقم العقد:</td>
                      <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.contractNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">رقم الطلب:</td>
                      <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.applicationNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">مبلغ التمويل:</td>
                      <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${formatAmountArabic(data.totalAmount)} ر.س</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">عدد الأقساط:</td>
                      <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.totalInstallments} قسط</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #334155;">تاريخ آخر سداد:</td>
                      <td style="padding: 12px 0; color: #fff; border-bottom: 1px solid #334155;">${data.lastPaymentDate || clearanceDate.toLocaleDateString('ar-SA')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8;">تاريخ المخالصة:</td>
                      <td style="padding: 12px 0; color: #22c55e; font-weight: bold;">${clearanceDate.toLocaleDateString('ar-SA')}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(99, 102, 241, 0.3);">
                  <h3 style="margin: 0 0 15px; color: #a5b4fc; font-size: 16px; text-align: center;">📜 إلغاء السند التنفيذي (الكمبيالة)</h3>
                  <p style="margin: 0; color: #e2e8f0; font-size: 15px; line-height: 1.8; text-align: center;">
                    بموجب هذه المخالصة، نقر بأنه سيتم إلغاء السند التنفيذي (الكمبيالة) المسجل باسمكم خلال:
                  </p>
                  <p style="margin: 15px 0; text-align: center;">
                    <span style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff; padding: 12px 30px; border-radius: 50px; font-size: 20px; font-weight: 700;">
                      ٥ أيام عمل
                    </span>
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
                    (التاريخ المتوقع للإلغاء: ${checkDate.toLocaleDateString('ar-SA')})
                  </p>
                </div>
                
                <div style="border: 2px solid #22c55e; border-radius: 12px; padding: 20px; background: rgba(34, 197, 94, 0.05);">
                  <p style="margin: 0 0 10px; color: #22c55e; font-size: 16px; font-weight: bold; text-align: center;">✨ إقرار رسمي</p>
                  <p style="margin: 0; color: #e2e8f0; font-size: 14px; line-height: 1.8; text-align: center;">
                    تقر شركة ماكسيو كور للخدمات الرقمية بأن العميل المذكور أعلاه قد أوفى بكامل التزاماته المالية المترتبة عليه بموجب عقد التمويل، وأنه لا يوجد أي مستحقات مالية متبقية عليه.
                  </p>
                </div>
              </td>
            </tr>
          </table>
          
          ${createNoticeBox('🎉 شكراً لثقتك بنا! نتطلع للتعامل معك مرة أخرى. يمكنك الآن التقدم بطلب تمويل جديد إذا رغبت في ذلك.', '#dcfce7', '#166534', '#22c55e')}
          
          ${createNoticeBox('📋 ملاحظة: سيتم إرسال نسخة من إلغاء السند التنفيذي إلى بريدك الإلكتروني خلال 5 أيام عمل. يرجى الاحتفاظ بهذه المخالصة كمرجع.', '#dbeafe', '#1d4ed8', '#3b82f6')}
          
          ${createCTAButton('تقدم بطلب تمويل جديد')}
          
          ${createMessage('للاستفسارات: info@maxiocore.com | واتساب: +966XXXXXXXXX')}
        `
      };

    case 'new_ticket': {
      const priorityTexts: Record<string, string> = {
        'low': 'منخفضة',
        'medium': 'متوسطة',
        'high': 'عالية',
        'urgent': 'عاجلة'
      };
      const priorityColors: Record<string, string> = {
        'low': '#22c55e',
        'medium': '#f59e0b',
        'high': '#ef4444',
        'urgent': '#dc2626'
      };
      const priorityBgColors: Record<string, string> = {
        'low': '#dcfce7',
        'medium': '#fef3c7',
        'high': '#fee2e2',
        'urgent': '#fecaca'
      };
      const priorityEmojis: Record<string, string> = {
        'low': '🟢',
        'medium': '🟡',
        'high': '🟠',
        'urgent': '🔴'
      };
      
      const categoryLabels: Record<string, string> = {
        'general': 'استفسار عام',
        'الطلبات': 'الطلبات',
        'الرصيد': 'الرصيد والإيداع',
        'التقنية': 'مشكلة تقنية',
        'الخدمات': 'الخدمات',
        'الحساب': 'إدارة الحساب',
        'أخرى': 'أخرى'
      };
      
      const categoryIcons: Record<string, string> = {
        'general': '💬',
        'الطلبات': '📦',
        'الرصيد': '💰',
        'التقنية': '🔧',
        'الخدمات': '⚡',
        'الحساب': '👤',
        'أخرى': '📋'
      };
      
      const ticketPriorityText = priorityTexts[data.priority] || data.priority || 'متوسطة';
      const ticketPriorityColor = priorityColors[data.priority] || '#f59e0b';
      const ticketPriorityBg = priorityBgColors[data.priority] || '#fef3c7';
      const ticketPriorityEmoji = priorityEmojis[data.priority] || '🟡';
      const ticketCategory = categoryLabels[data.category] || data.category || 'استفسار عام';
      const ticketCategoryIcon = categoryIcons[data.category] || '💬';
      
      return {
        subject: `🎫 تذكرة دعم جديدة #${data.ticketNumber || 'جديدة'} - ${data.subject || 'بدون عنوان'}`,
        content: `
          <!-- Hero Section with Animated Icon -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td align="center">
                <div style="position: relative; width: 100px; height: 100px;">
                  <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); border-radius: 50%; display: inline-block; text-align: center; line-height: 100px; box-shadow: 0 15px 45px rgba(99, 102, 241, 0.45);">
                    <span style="font-size: 50px;">🎫</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>
          
          <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: 800; color: #1e293b; text-align: center; direction: rtl;">تذكرة دعم جديدة</h1>
          <p style="margin: 0 0 35px; font-size: 17px; color: #64748b; text-align: center; direction: rtl; line-height: 1.7;">تم استلام طلب الدعم الخاص بك وسنقوم بالرد عليك في أقرب وقت ممكن</p>
          
          <!-- Ticket Number Badge - Premium Design -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td align="center">
                <div style="display: inline-block; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 20px 45px; border-radius: 16px; box-shadow: 0 10px 35px rgba(15, 23, 42, 0.35); border: 1px solid #334155;">
                  <span style="color: #94a3b8; font-size: 13px; display: block; margin-bottom: 6px; letter-spacing: 1px;">رقم التذكرة</span>
                  <span style="color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 3px; font-family: monospace;">#${data.ticketNumber || '---'}</span>
                </div>
              </td>
            </tr>
          </table>
          
          <!-- Priority & Category Badges Row -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td style="width: 50%; padding-left: 8px;">
                <div style="background: ${ticketPriorityBg}; padding: 16px 20px; border-radius: 14px; border: 2px solid ${ticketPriorityColor}; text-align: center;">
                  <span style="color: ${ticketPriorityColor}; font-size: 11px; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">الأولوية</span>
                  <span style="color: ${ticketPriorityColor}; font-size: 16px; font-weight: 700;">${ticketPriorityEmoji} ${ticketPriorityText}</span>
                </div>
              </td>
              <td style="width: 50%; padding-right: 8px;">
                <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 16px 20px; border-radius: 14px; border: 2px solid #6366f1; text-align: center;">
                  <span style="color: #6366f1; font-size: 11px; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">التصنيف</span>
                  <span style="color: #4f46e5; font-size: 16px; font-weight: 700;">${ticketCategoryIcon} ${ticketCategory}</span>
                </div>
              </td>
            </tr>
          </table>
          
          <!-- Ticket Details Card - Premium Design -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1); margin-bottom: 30px; overflow: hidden;">
            <tr>
              <td style="padding: 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 18px 28px;">
                      <p style="margin: 0; color: #ffffff; font-size: 17px; font-weight: 700; text-align: right;">📝 تفاصيل التذكرة</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 28px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                          <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
                            <span style="color: #94a3b8; font-size: 13px; display: block; margin-bottom: 6px;">📌 الموضوع</span>
                            <span style="color: #1e293b; font-size: 18px; font-weight: 700;">${data.subject || 'غير محدد'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
                            <span style="color: #94a3b8; font-size: 13px; display: block; margin-bottom: 6px;">👤 اسم العميل</span>
                            <span style="color: #1e293b; font-size: 17px; font-weight: 600;">${data.userName || 'مستخدم'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
                            <span style="color: #94a3b8; font-size: 13px; display: block; margin-bottom: 6px;">📧 البريد الإلكتروني</span>
                            <span style="color: #6366f1; font-size: 17px; font-weight: 600;">${data.userEmail || 'غير محدد'}</span>
                          </td>
                        </tr>
                        ${data.relatedOrderNumber ? `
                        <tr>
                          <td style="padding: 16px 0;">
                            <span style="color: #94a3b8; font-size: 13px; display: block; margin-bottom: 6px;">📦 الطلب المرتبط</span>
                            <span style="display: inline-block; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #1d4ed8; font-size: 15px; font-weight: 700; padding: 8px 18px; border-radius: 10px; border: 1px solid #3b82f6;">#${data.relatedOrderNumber}</span>
                          </td>
                        </tr>
                        ` : ''}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Ticket Description if Available -->
          ${data.description ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); margin-bottom: 30px; overflow: hidden;">
            <tr>
              <td style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 15px 25px; border-bottom: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #475569; font-size: 15px; font-weight: 600; text-align: right;">💬 وصف المشكلة</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 25px;">
                <div style="background: #fafafa; padding: 20px; border-radius: 12px; border-right: 4px solid #6366f1;">
                  <p style="margin: 0; color: #334155; font-size: 15px; line-height: 2; text-align: right; direction: rtl;">${data.description}</p>
                </div>
              </td>
            </tr>
          </table>
          ` : ''}
          
          <!-- Response Time Notice - Premium Design -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 16px; border-right: 5px solid #3b82f6; margin-bottom: 30px;">
            <tr>
              <td style="padding: 24px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="width: 55px; vertical-align: top;">
                      <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 14px; text-align: center; line-height: 50px; box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);">
                        <span style="font-size: 24px;">⏱️</span>
                      </div>
                    </td>
                    <td style="padding-right: 18px; vertical-align: middle;">
                      <p style="margin: 0 0 6px; color: #1e40af; font-size: 16px; font-weight: 700;">وقت الاستجابة المتوقع</p>
                      <p style="margin: 0; color: #3b82f6; font-size: 15px; line-height: 1.7;">سيتم الرد على تذكرتك خلال <strong style="color: #1d4ed8;">24 ساعة</strong> كحد أقصى. للحالات العاجلة تواصل عبر الواتساب.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Next Steps Section -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 25px;">
                <h3 style="margin: 0 0 18px; color: #1e293b; font-size: 17px; font-weight: 700; text-align: right;">📋 الخطوات القادمة</h3>
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 10px 0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                          <td style="width: 35px; vertical-align: top;">
                            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; text-align: center; line-height: 28px;">
                              <span style="color: #fff; font-size: 14px; font-weight: 700;">1</span>
                            </div>
                          </td>
                          <td style="padding-right: 12px; vertical-align: middle;">
                            <span style="color: #475569; font-size: 15px;">سيقوم فريق الدعم بمراجعة تذكرتك</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                          <td style="width: 35px; vertical-align: top;">
                            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 50%; text-align: center; line-height: 28px;">
                              <span style="color: #fff; font-size: 14px; font-weight: 700;">2</span>
                            </div>
                          </td>
                          <td style="padding-right: 12px; vertical-align: middle;">
                            <span style="color: #475569; font-size: 15px;">ستتلقى إشعاراً عند الرد على تذكرتك</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                          <td style="width: 35px; vertical-align: top;">
                            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 50%; text-align: center; line-height: 28px;">
                              <span style="color: #fff; font-size: 14px; font-weight: 700;">3</span>
                            </div>
                          </td>
                          <td style="padding-right: 12px; vertical-align: middle;">
                            <span style="color: #475569; font-size: 15px;">يمكنك متابعة حالة تذكرتك من لوحة التحكم</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          ${createCTAButton('متابعة التذكرة')}
          
          <!-- Contact Info Footer -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 25px;">
            <tr>
              <td align="center">
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">للتواصل السريع: <a href="mailto:info@maxiocore.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">info@maxiocore.com</a></p>
              </td>
            </tr>
          </table>
        `
      };
    }

    case 'ticket_reply': {
      const senderType = data.isAdmin ? 'فريق الدعم الفني' : 'العميل';
      const senderColor = data.isAdmin ? '#22c55e' : '#6366f1';
      const senderBg = data.isAdmin ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
      const senderIcon = data.isAdmin ? '👨‍💼' : '👤';
      const senderBgLight = data.isAdmin ? '#dcfce7' : '#e0e7ff';
      
      return {
        subject: `💬 رد جديد على تذكرتك #${data.ticketNumber || '---'} - ${data.subject || 'تذكرة دعم'}`,
        content: `
          <!-- Hero Section - Premium Design -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td align="center">
                <div style="width: 100px; height: 100px; background: ${senderBg}; border-radius: 50%; display: inline-block; text-align: center; line-height: 100px; box-shadow: 0 15px 45px ${data.isAdmin ? 'rgba(34, 197, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)'};">
                  <span style="font-size: 50px;">💬</span>
                </div>
              </td>
            </tr>
          </table>
          
          <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: 800; color: #1e293b; text-align: center; direction: rtl;">رد جديد على تذكرتك</h1>
          <p style="margin: 0 0 35px; font-size: 17px; color: #64748b; text-align: center; direction: rtl; line-height: 1.7;">تم إضافة رد جديد على تذكرة الدعم الخاصة بك</p>
          
          <!-- Ticket Number Badge -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td align="center">
                <div style="display: inline-block; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 18px 40px; border-radius: 16px; box-shadow: 0 10px 35px rgba(15, 23, 42, 0.35); border: 1px solid #334155;">
                  <span style="color: #94a3b8; font-size: 12px; display: block; margin-bottom: 6px; letter-spacing: 1px;">رقم التذكرة</span>
                  <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 3px; font-family: monospace;">#${data.ticketNumber || '---'}</span>
                </div>
              </td>
            </tr>
          </table>
          
          <!-- Sender Badge - Premium Design -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td align="center">
                <div style="display: inline-block; background: ${senderBgLight}; padding: 14px 30px; border-radius: 50px; border: 2px solid ${senderColor}; box-shadow: 0 4px 15px ${data.isAdmin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)'};">
                  <span style="font-size: 22px; vertical-align: middle;">${senderIcon}</span>
                  <span style="color: ${senderColor}; font-size: 16px; font-weight: 700; margin-right: 10px; vertical-align: middle;">الرد من: ${senderType}</span>
                </div>
              </td>
            </tr>
          </table>
          
          <!-- Message Content Card - Premium Design -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1); margin-bottom: 30px; overflow: hidden;">
            <tr>
              <td style="padding: 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="background: ${senderBg}; padding: 18px 28px;">
                      <p style="margin: 0; color: #ffffff; font-size: 17px; font-weight: 700; text-align: right;">💬 نص الرسالة</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);">
                      <div style="background: #ffffff; padding: 25px; border-radius: 14px; border-right: 5px solid ${senderColor}; box-shadow: 0 4px 15px rgba(0,0,0,0.06);">
                        <p style="margin: 0; color: #1e293b; font-size: 17px; line-height: 2.2; text-align: right; direction: rtl; white-space: pre-wrap;">${data.message || 'لا توجد رسالة'}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Ticket Subject Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 20px 25px;">
                <span style="color: #94a3b8; font-size: 13px; display: block; margin-bottom: 8px;">📌 موضوع التذكرة</span>
                <span style="color: #1e293b; font-size: 17px; font-weight: 700;">${data.subject || 'غير محدد'}</span>
              </td>
            </tr>
          </table>
          
          <!-- Attachments Section if available -->
          ${data.attachments && data.attachments.length > 0 ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 30px; overflow: hidden;">
            <tr>
              <td style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 15px 25px; border-bottom: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #475569; font-size: 15px; font-weight: 600; text-align: right;">📎 المرفقات (${data.attachments.length})</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 25px;">
                ${data.attachments.map((att: any) => `
                  <div style="display: inline-block; background: #f1f5f9; padding: 10px 18px; border-radius: 10px; margin: 5px; border: 1px solid #e2e8f0;">
                    <span style="color: #475569; font-size: 14px;">📄 ${att.name || 'ملف'}</span>
                  </div>
                `).join('')}
              </td>
            </tr>
          </table>
          ` : ''}
          
          <!-- Action Required Notice for Admin Reply -->
          ${data.isAdmin ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 16px; border-right: 5px solid #22c55e; margin-bottom: 30px;">
            <tr>
              <td style="padding: 24px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="width: 55px; vertical-align: top;">
                      <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 14px; text-align: center; line-height: 50px; box-shadow: 0 6px 20px rgba(34, 197, 94, 0.35);">
                        <span style="font-size: 24px;">✨</span>
                      </div>
                    </td>
                    <td style="padding-right: 18px; vertical-align: middle;">
                      <p style="margin: 0 0 6px; color: #166534; font-size: 16px; font-weight: 700;">تم الرد من فريق الدعم</p>
                      <p style="margin: 0; color: #15803d; font-size: 15px; line-height: 1.7;">يمكنك الرد على هذه الرسالة أو إغلاق التذكرة إذا تم حل مشكلتك.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          ` : ''}
          
          ${createCTAButton('الرد على التذكرة')}
          
          <!-- Contact Info Footer -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 25px;">
            <tr>
              <td align="center">
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">للتواصل السريع: <a href="mailto:info@maxiocore.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">info@maxiocore.com</a></p>
              </td>
            </tr>
          </table>
        `
      };
    }

    case 'ticket_status_changed': {
      const ticketStatusLabels: Record<string, string> = {
        'open': 'مفتوحة',
        'in_progress': 'قيد المعالجة',
        'resolved': 'تم الحل',
        'closed': 'مغلقة'
      };
      
      const ticketStatusColors: Record<string, string> = {
        'open': '#3b82f6',
        'in_progress': '#f59e0b',
        'resolved': '#22c55e',
        'closed': '#64748b'
      };
      
      const ticketStatusBgColors: Record<string, string> = {
        'open': '#dbeafe',
        'in_progress': '#fef3c7',
        'resolved': '#dcfce7',
        'closed': '#f1f5f9'
      };
      
      const ticketStatusEmojis: Record<string, string> = {
        'open': '📂',
        'in_progress': '⚙️',
        'resolved': '✅',
        'closed': '🔒'
      };
      
      const ticketStatusDescriptions: Record<string, string> = {
        'open': 'تم فتح تذكرتك وسيتم مراجعتها قريباً من قبل فريق الدعم.',
        'in_progress': 'فريق الدعم يعمل حالياً على حل مشكلتك. سنوافيك بالتحديثات.',
        'resolved': 'تم حل مشكلتك بنجاح! إذا كانت لديك أي استفسارات أخرى، لا تتردد في التواصل معنا.',
        'closed': 'تم إغلاق التذكرة. يمكنك فتح تذكرة جديدة في أي وقت.'
      };
      
      const ticketStatusLabel = ticketStatusLabels[data.newStatus] || data.newStatus || 'غير محدد';
      const ticketStatusColor = ticketStatusColors[data.newStatus] || '#6366f1';
      const ticketStatusBg = ticketStatusBgColors[data.newStatus] || '#f1f5f9';
      const ticketStatusEmoji = ticketStatusEmojis[data.newStatus] || '📋';
      const oldStatusLabel = ticketStatusLabels[data.oldStatus] || data.oldStatus || 'غير محدد';
      const ticketStatusDescription = ticketStatusDescriptions[data.newStatus] || '';
      
      return {
        subject: `📋 تحديث حالة تذكرتك #${data.ticketNumber || '---'} - ${ticketStatusLabel}`,
        content: `
          <!-- Hero Section - Premium Design -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td align="center">
                <div style="width: 100px; height: 100px; background: linear-gradient(135deg, ${ticketStatusColor} 0%, ${ticketStatusColor}cc 100%); border-radius: 50%; display: inline-block; text-align: center; line-height: 100px; box-shadow: 0 15px 45px ${ticketStatusColor}50;">
                  <span style="font-size: 50px;">${ticketStatusEmoji}</span>
                </div>
              </td>
            </tr>
          </table>
          
          <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: 800; color: #1e293b; text-align: center; direction: rtl;">تحديث حالة التذكرة</h1>
          <p style="margin: 0 0 35px; font-size: 17px; color: #64748b; text-align: center; direction: rtl; line-height: 1.7;">تم تحديث حالة تذكرة الدعم الخاصة بك</p>
          
          <!-- Ticket Number Badge -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td align="center">
                <div style="display: inline-block; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 18px 40px; border-radius: 16px; box-shadow: 0 10px 35px rgba(15, 23, 42, 0.35); border: 1px solid #334155;">
                  <span style="color: #94a3b8; font-size: 12px; display: block; margin-bottom: 6px; letter-spacing: 1px;">رقم التذكرة</span>
                  <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 3px; font-family: monospace;">#${data.ticketNumber || '---'}</span>
                </div>
              </td>
            </tr>
          </table>
          
          <!-- Status Change Visual - Premium Design -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1); margin-bottom: 30px; overflow: hidden;">
            <tr>
              <td style="background: linear-gradient(135deg, ${ticketStatusColor} 0%, ${ticketStatusColor}cc 100%); padding: 18px 28px;">
                <p style="margin: 0; color: #ffffff; font-size: 17px; font-weight: 700; text-align: center;">🔄 تغيير الحالة</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 35px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="width: 42%; text-align: center; vertical-align: middle;">
                      <div style="background: #f1f5f9; padding: 25px 15px; border-radius: 16px; border: 2px dashed #cbd5e1;">
                        <span style="color: #94a3b8; font-size: 12px; display: block; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">الحالة السابقة</span>
                        <span style="color: #64748b; font-size: 20px; font-weight: 700;">${oldStatusLabel}</span>
                      </div>
                    </td>
                    <td style="width: 16%; text-align: center; vertical-align: middle;">
                      <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 50%; margin: 0 auto; line-height: 50px; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);">
                        <span style="font-size: 24px; color: #fff;">➜</span>
                      </div>
                    </td>
                    <td style="width: 42%; text-align: center; vertical-align: middle;">
                      <div style="background: ${ticketStatusBg}; padding: 25px 15px; border-radius: 16px; border: 3px solid ${ticketStatusColor}; box-shadow: 0 6px 20px ${ticketStatusColor}30;">
                        <span style="color: ${ticketStatusColor}; font-size: 12px; display: block; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">الحالة الجديدة</span>
                        <span style="color: ${ticketStatusColor}; font-size: 22px; font-weight: 800;">${ticketStatusEmoji} ${ticketStatusLabel}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Status Description -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, ${ticketStatusBg} 0%, ${ticketStatusBg}cc 100%); border-radius: 16px; border-right: 5px solid ${ticketStatusColor}; margin-bottom: 30px;">
            <tr>
              <td style="padding: 24px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="width: 55px; vertical-align: top;">
                      <div style="width: 50px; height: 50px; background: linear-gradient(135deg, ${ticketStatusColor} 0%, ${ticketStatusColor}cc 100%); border-radius: 14px; text-align: center; line-height: 50px; box-shadow: 0 6px 20px ${ticketStatusColor}35;">
                        <span style="font-size: 24px;">${ticketStatusEmoji}</span>
                      </div>
                    </td>
                    <td style="padding-right: 18px; vertical-align: middle;">
                      <p style="margin: 0 0 6px; color: ${ticketStatusColor}; font-size: 16px; font-weight: 700;">ماذا يعني هذا؟</p>
                      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.8;">${ticketStatusDescription}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Ticket Subject Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 20px 25px;">
                <span style="color: #94a3b8; font-size: 13px; display: block; margin-bottom: 8px;">📌 موضوع التذكرة</span>
                <span style="color: #1e293b; font-size: 17px; font-weight: 700;">${data.subject || 'غير محدد'}</span>
              </td>
            </tr>
          </table>
          
          ${data.newStatus === 'resolved' ? `
            <!-- Success Message for Resolved -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 16px; border-right: 5px solid #22c55e; margin-bottom: 30px;">
              <tr>
                <td style="padding: 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td style="width: 60px; vertical-align: top;">
                        <div style="width: 55px; height: 55px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px; text-align: center; line-height: 55px; box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);">
                          <span style="font-size: 28px;">🎉</span>
                        </div>
                      </td>
                      <td style="padding-right: 20px; vertical-align: middle;">
                        <p style="margin: 0 0 8px; color: #166534; font-size: 18px; font-weight: 700;">تهانينا! تم حل مشكلتك بنجاح</p>
                        <p style="margin: 0; color: #15803d; font-size: 15px; line-height: 1.7;">نشكرك على صبرك وتواصلك معنا. إذا كان لديك أي استفسارات أخرى، فريق الدعم جاهز لخدمتك!</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Rating Request -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 16px; border: 2px solid #f59e0b; margin-bottom: 30px;">
              <tr>
                <td style="padding: 25px; text-align: center;">
                  <p style="margin: 0 0 12px; font-size: 32px;">⭐⭐⭐⭐⭐</p>
                  <p style="margin: 0 0 8px; color: #92400e; font-size: 17px; font-weight: 700;">كيف كانت تجربتك؟</p>
                  <p style="margin: 0; color: #a16207; font-size: 14px;">رأيك يهمنا لتحسين خدماتنا</p>
                </td>
              </tr>
            </table>
          ` : ''}
          
          ${data.newStatus === 'in_progress' ? `
            <!-- In Progress Notice -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 16px; border-right: 5px solid #3b82f6; margin-bottom: 30px;">
              <tr>
                <td style="padding: 24px 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                      <td style="width: 55px; vertical-align: top;">
                        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 14px; text-align: center; line-height: 50px; box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);">
                          <span style="font-size: 24px;">⏳</span>
                        </div>
                      </td>
                      <td style="padding-right: 18px; vertical-align: middle;">
                        <p style="margin: 0 0 6px; color: #1e40af; font-size: 16px; font-weight: 700;">قيد المعالجة</p>
                        <p style="margin: 0; color: #3b82f6; font-size: 15px; line-height: 1.7;">ستتلقى إشعاراً فور تحديث حالة تذكرتك أو عند إضافة رد جديد.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          ` : ''}
          
          ${createCTAButton('عرض التذكرة')}
          
          <!-- Contact Info Footer -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 25px;">
            <tr>
              <td align="center">
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">للتواصل السريع: <a href="mailto:info@maxiocore.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">info@maxiocore.com</a></p>
              </td>
            </tr>
          </table>
        `
      };
    }

    case 'ticket_rating': {
      const ratingValue = data.rating || 5;
      const ratingStars = '⭐'.repeat(ratingValue);
      const ratingEmptyStars = '☆'.repeat(5 - ratingValue);
      
      return {
        subject: `⭐ تقييم جديد للتذكرة #${data.ticketNumber || '---'}`,
        content: `
          <!-- Hero Section -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 25px;">
            <tr>
              <td align="center">
                <div style="width: 90px; height: 90px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; display: inline-block; text-align: center; line-height: 90px; box-shadow: 0 12px 35px rgba(245, 158, 11, 0.4);">
                  <span style="font-size: 45px;">⭐</span>
                </div>
              </td>
            </tr>
          </table>
          
          <h2 style="margin: 0 0 10px; font-size: 26px; font-weight: 800; color: #1e293b; text-align: center; direction: rtl;">تقييم جديد</h2>
          <p style="margin: 0 0 30px; font-size: 16px; color: #64748b; text-align: center; direction: rtl;">تم استلام تقييم العميل على خدمة الدعم</p>
          
          <!-- Rating Display -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 16px; border: 2px solid #f59e0b; margin-bottom: 25px; overflow: hidden;">
            <tr>
              <td style="padding: 30px; text-align: center;">
                <p style="margin: 0 0 15px; font-size: 40px; letter-spacing: 5px;">${ratingStars}${ratingEmptyStars}</p>
                <p style="margin: 0; color: #92400e; font-size: 24px; font-weight: 800;">${ratingValue} من 5</p>
              </td>
            </tr>
          </table>
          
          <!-- Ticket Info -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 12px; margin-bottom: 25px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 13px;">رقم التذكرة:</span>
                      <span style="color: #1e293b; font-size: 15px; font-weight: 600; float: left;">#${data.ticketNumber || '---'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 13px;">الموضوع:</span>
                      <span style="color: #1e293b; font-size: 15px; font-weight: 600; float: left;">${data.subject || 'غير محدد'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #64748b; font-size: 13px;">العميل:</span>
                      <span style="color: #1e293b; font-size: 15px; font-weight: 600; float: left;">${data.userName || 'مستخدم'}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          ${data.feedback ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #ffffff; border-radius: 14px; border: 2px solid #e2e8f0; margin-bottom: 25px; overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 12px 20px;">
                  <span style="color: #ffffff; font-size: 14px; font-weight: 700;">💭 ملاحظات العميل</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px;">
                  <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.8; text-align: right; direction: rtl;">${data.feedback}</p>
                </td>
              </tr>
            </table>
          ` : ''}
        `
      };
    }

    case 'dev_order_created':
      return {
        subject: `تم استلام طلب خدمة برمجية #${data.orderNumber} - MaxioCore`,
        content: `
          ${createIconCircle('💻', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          ${createGreeting(`مرحباً ${data.name || 'عزيزي العميل'}! 🎉`)}
          ${createMessage('شكراً لتواصلك معنا! تم استلام طلبك لخدمة برمجية وسيقوم فريقنا بمراجعته والتواصل معك قريباً.')}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.orderNumber || '-' },
            { label: 'اسم المشروع', value: data.projectTitle || 'غير محدد' },
            { label: 'الخدمة المطلوبة', value: data.serviceName || 'خدمة برمجية' },
            { label: 'نوع العميل', value: data.clientType === 'individual' ? 'فرد' : data.clientType === 'company' ? 'شركة' : 'مؤسسة' },
            { label: 'الميزانية المتوقعة', value: data.budgetRange || 'غير محدد' },
            { label: 'المدة المتوقعة', value: data.timelineExpectation || 'غير محدد' },
            { label: 'الحالة', value: 'قيد المراجعة', isStatus: true, statusColor: '#dbeafe', valueColor: '#1d4ed8' }
          ])}
          
          ${data.projectGoal ? createNoticeBox(`🎯 هدف المشروع: ${data.projectGoal}`, '#f0f9ff', '#0369a1', '#0ea5e9') : ''}
          
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 14px; border-right: 4px solid #22c55e; margin: 20px 0;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 10px; font-size: 16px; font-weight: 700; color: #166534;">📋 الخطوات القادمة:</p>
                <p style="margin: 0; font-size: 14px; color: #15803d; line-height: 1.8;">
                  1. سيقوم فريقنا بمراجعة طلبك خلال 24-48 ساعة<br/>
                  2. سنتواصل معك لتوضيح أي تفاصيل إضافية<br/>
                  3. ستحصل على عرض سعر مفصل<br/>
                  4. بعد الموافقة، سنبدأ العمل على مشروعك
                </p>
              </td>
            </tr>
          </table>
          
          ${createCTAButton('متابعة طلبك')}
        `
      };

    case 'dev_order_created_admin':
      return {
        subject: `🔔 طلب برمجي جديد #${data.orderNumber} - يتطلب مراجعة`,
        content: `
          ${createIconCircle('🚀', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}
          ${createGreeting('طلب برمجي جديد! 📬')}
          ${createMessage('تم استلام طلب خدمة برمجية جديد يتطلب مراجعتك.')}
          
          ${createHighlightBox(data.orderNumber || '-', 'رقم الطلب', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)')}
          
          ${createInfoCard([
            { label: 'اسم العميل', value: data.clientName || 'غير محدد' },
            { label: 'البريد الإلكتروني', value: data.clientEmail || '-' },
            { label: 'نوع العميل', value: data.clientType === 'individual' ? 'فرد' : data.clientType === 'company' ? 'شركة' : 'مؤسسة' },
            { label: 'اسم المشروع', value: data.projectTitle || 'غير محدد' },
            { label: 'الخدمة', value: data.serviceName || 'خدمة برمجية' },
            { label: 'الميزانية', value: data.budgetRange || 'غير محدد' },
            { label: 'المدة المتوقعة', value: data.timelineExpectation || 'غير محدد' }
          ])}
          
          ${data.projectGoal ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 12px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 20px;">
                  <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">🎯 هدف المشروع:</p>
                  <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.7;">${data.projectGoal}</p>
                </td>
              </tr>
            </table>
          ` : ''}
          
          ${data.projectSummary ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 12px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 20px;">
                  <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">📝 ملخص المشروع:</p>
                  <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.7;">${data.projectSummary}</p>
                </td>
              </tr>
            </table>
          ` : ''}
          
          ${createNoticeBox('⚡ يرجى مراجعة الطلب والتواصل مع العميل في أقرب وقت', '#fef3c7', '#92400e', '#f59e0b')}
          
          ${createCTAButton('عرض تفاصيل الطلب')}
        `
      };

    case 'dev_order_status_changed': {
      const statusMap: Record<string, string> = {
        'draft': 'مسودة',
        'pending_email_verification': 'بانتظار تأكيد البريد',
        'under_review': 'قيد المراجعة',
        'need_info': 'يحتاج معلومات إضافية',
        'quoted': 'تم تقديم عرض السعر',
        'approved': 'معتمد',
        'in_progress': 'قيد التنفيذ',
        'testing': 'قيد الاختبار',
        'completed': 'مكتمل',
        'rejected': 'مرفوض',
        'cancelled': 'ملغي'
      };
      const devStatusText = statusMap[data.newStatus] || data.newStatus;
      
      const devStatusColor = ['completed'].includes(data.newStatus) ? '#22c55e' : 
                              ['cancelled', 'rejected'].includes(data.newStatus) ? '#ef4444' :
                              ['in_progress', 'testing', 'approved'].includes(data.newStatus) ? '#3b82f6' : '#f59e0b';
      
      return {
        subject: `تحديث حالة طلبك البرمجي #${data.orderNumber} - ${devStatusText}`,
        content: `
          ${createIconCircle(
            data.newStatus === 'completed' ? '✅' : 
            data.newStatus === 'rejected' || data.newStatus === 'cancelled' ? '❌' : 
            data.newStatus === 'in_progress' ? '⚙️' : '🔄',
            data.newStatus === 'completed' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
            data.newStatus === 'rejected' || data.newStatus === 'cancelled' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
            'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
          )}
          ${createGreeting('تحديث حالة طلبك البرمجي')}
          ${createMessage(`تم تحديث حالة طلبك رقم <strong>${data.orderNumber}</strong>`)}
          
          ${createHighlightBox(devStatusText, 'الحالة الجديدة', 
            data.newStatus === 'completed' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
            data.newStatus === 'rejected' || data.newStatus === 'cancelled' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
            'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
          )}
          
          ${createInfoCard([
            { label: 'رقم الطلب', value: data.orderNumber || '-' },
            { label: 'اسم المشروع', value: data.projectTitle || 'غير محدد' },
            { label: 'الخدمة', value: data.serviceName || 'خدمة برمجية' }
          ])}
          
          ${data.adminNotes ? createNoticeBox(`💬 ملاحظات الفريق: ${data.adminNotes}`, '#f0f9ff', '#0369a1', '#0ea5e9') : ''}
          
          ${data.newStatus === 'completed' ? createNoticeBox('🎉 تهانينا! تم إكمال مشروعك بنجاح. نتمنى أن تكون راضياً عن العمل!', '#dcfce7', '#166534', '#22c55e') : ''}
          ${data.newStatus === 'need_info' ? createNoticeBox('📝 يرجى الدخول لحسابك وإضافة المعلومات المطلوبة لاستكمال طلبك', '#fef3c7', '#92400e', '#f59e0b') : ''}
          
          ${createCTAButton('عرض تفاصيل الطلب')}
        `
      };
    }

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

interface BulkEmailRequest {
  type: 'single' | 'group' | 'all' | 'newsletter';
  recipients?: string[];
  emailType: EmailType;
  data: Record<string, any>;
  customSubject?: string;
  customContent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    
    // Check if it's a bulk request or single request
    if (body.type && ['single', 'group', 'all', 'newsletter'].includes(body.type)) {
      // Bulk email handling
      const { type: sendType, recipients, emailType, data, customSubject, customContent } = body as BulkEmailRequest;
      
      let emailList: string[] = [];
      
      if (sendType === 'single' && body.to) {
        emailList = [body.to];
      } else if (sendType === 'group' && recipients && recipients.length > 0) {
        emailList = recipients;
      } else if (sendType === 'all' || sendType === 'newsletter') {
        // Get all users' emails
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('email')
          .not('email', 'is', null);
        
        if (error) {
          console.error("Error fetching users:", error);
          throw new Error("Failed to fetch users");
        }
        
        emailList = profiles?.map(p => p.email).filter(Boolean) as string[] || [];
      }
      
      console.log(`Sending ${emailType} email to ${emailList.length} recipients`);
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      // Process emails in batches
      for (const email of emailList) {
        try {
          const { subject, content } = getEmailContent(emailType || 'custom', { ...data, email });
          const finalSubject = customSubject || subject;
          const finalContent = customContent || content;
          const html = getEmailWrapper(finalContent, finalSubject);
          
          const emailResponse = await resend.emails.send({
            from: "MaxioCore <info@maxiocore.com>",
            to: [email],
            subject: finalSubject,
            html: html,
          });
          
          // Log to database
          await supabase.from('emails').insert({
            recipient_email: email,
            recipient_name: data.name || null,
            subject: finalSubject,
            content: html,
            status: 'delivered',
            sent_at: new Date().toISOString(),
          });
          
          results.success++;
          console.log(`Email sent to ${email}`);
          
        } catch (emailError: any) {
          results.failed++;
          results.errors.push(`${email}: ${emailError.message}`);
          console.error(`Failed to send to ${email}:`, emailError);
          
          // Log failed email
          await supabase.from('emails').insert({
            recipient_email: email,
            subject: customSubject || 'إشعار من MaxioCore',
            content: customContent || '',
            status: 'failed',
            error_message: emailError.message,
          });
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          results,
          message: `تم إرسال ${results.success} رسالة بنجاح، فشل ${results.failed}`
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
      
    } else {
      // Legacy single email request
      const { to, type, data, customSubject, customContent } = body as EmailRequest;
      
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

      await supabase.from('emails').insert({
        recipient_email: to,
        recipient_name: data.name || null,
        subject: finalSubject,
        content: html,
        status: 'delivered',
        sent_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ success: true, data: emailResponse }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
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
