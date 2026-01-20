// WhatsApp notification helper using SmartWats API

const SMARTWATS_INSTANCE_ID = Deno.env.get('SMARTWATS_INSTANCE_ID');
const SMARTWATS_ACCESS_TOKEN = Deno.env.get('SMARTWATS_ACCESS_TOKEN');

export interface WhatsAppNotification {
  phone: string;
  message: string;
  type?: 'order' | 'financing' | 'deposit' | 'ticket' | 'balance' | 'general';
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Saudi numbers
  if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  } else if (!cleaned.startsWith('966') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }
  
  return cleaned;
}

export async function sendWhatsAppMessage(notification: WhatsAppNotification): Promise<WhatsAppResult> {
  if (!SMARTWATS_INSTANCE_ID || !SMARTWATS_ACCESS_TOKEN) {
    console.error('SmartWats credentials not configured');
    return { success: false, error: 'WhatsApp not configured' };
  }

  const formattedPhone = formatPhoneNumber(notification.phone);

  try {
    const response = await fetch('https://app.smartwats.com/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: formattedPhone,
        type: 'text',
        message: notification.message,
        instance_id: SMARTWATS_INSTANCE_ID,
        access_token: SMARTWATS_ACCESS_TOKEN,
      }),
    });

    const result = await response.json();
    console.log('WhatsApp SmartWats response:', result);
    
    if (result.status === 'success' || result.status === true) {
      return { success: true, messageId: result.id || result.message_id };
    }
    
    return { success: false, error: result.message || 'Failed to send' };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

// Order status message templates
export function getOrderStatusMessage(
  orderNumber: string,
  status: string,
  serviceName?: string
): string {
  const statusMessages: Record<string, { emoji: string; ar: string; extra?: string }> = {
    pending: { emoji: '⏳', ar: 'قيد الانتظار', extra: 'سيتم مراجعة طلبك قريباً' },
    confirmed: { emoji: '✅', ar: 'تم التأكيد', extra: 'تم تأكيد طلبك وسيبدأ التنفيذ' },
    processing: { emoji: '⚙️', ar: 'قيد المعالجة', extra: 'جاري معالجة طلبك الآن' },
    in_progress: { emoji: '🔄', ar: 'قيد التنفيذ', extra: 'نعمل على طلبك حالياً' },
    completed: { emoji: '🎉', ar: 'مكتمل', extra: 'تم إكمال طلبك بنجاح!' },
    partial: { emoji: '📊', ar: 'مكتمل جزئياً', extra: 'تم تنفيذ طلبك جزئياً' },
    cancelled: { emoji: '❌', ar: 'ملغي', extra: 'تم إلغاء طلبك واسترداد المبلغ' },
    refunded: { emoji: '💰', ar: 'مسترد', extra: 'تم استرداد مبلغ الطلب' },
  };

  const statusInfo = statusMessages[status] || { emoji: '📦', ar: status, extra: '' };

  return `${statusInfo.emoji} *تحديث حالة الطلب*

📋 رقم الطلب: ${orderNumber}
${serviceName ? `🎯 الخدمة: ${serviceName}\n` : ''}
📊 الحالة: *${statusInfo.ar}*
${statusInfo.extra ? `\n💡 ${statusInfo.extra}` : ''}

🔗 تتبع طلبك: maxiocore.com/dashboard/orders

_MaxioCore_`;
}

// Financing status message templates
export function getFinancingStatusMessage(
  applicationNumber: string,
  status: string,
  amount?: number,
  customerName?: string
): string {
  const statusMessages: Record<string, { emoji: string; ar: string; extra?: string }> = {
    SUBMITTED: { emoji: '📋', ar: 'تم الاستلام', extra: 'تم استلام طلبك وسيتم مراجعته' },
    UNDER_REVIEW: { emoji: '🔍', ar: 'قيد المراجعة', extra: 'فريقنا يراجع طلبك الآن' },
    ADDITIONAL_INFO_REQUIRED: { emoji: '⚠️', ar: 'مطلوب معلومات إضافية', extra: 'يرجى تقديم المستندات المطلوبة' },
    APPROVED: { emoji: '✅', ar: 'تمت الموافقة', extra: 'تهانينا! تمت الموافقة على طلبك' },
    APPROVED_WITH_LIMITS: { emoji: '✅', ar: 'موافقة بقيمة معدلة', extra: 'تمت الموافقة بقيمة معدلة' },
    CONTRACT_PRESENTED: { emoji: '📄', ar: 'العقد جاهز', extra: 'العقد جاهز للمراجعة والتوقيع' },
    CONTRACT_ACCEPTED: { emoji: '🎉', ar: 'تم قبول العقد', extra: 'تم توقيع العقد بنجاح' },
    ACTIVE: { emoji: '🟢', ar: 'نشط', extra: 'تمويلك نشط الآن' },
    COMPLETED: { emoji: '🏆', ar: 'مكتمل', extra: 'تم سداد التمويل بالكامل' },
    REJECTED: { emoji: '❌', ar: 'مرفوض', extra: 'نعتذر، لم تتم الموافقة على طلبك' },
    CANCELLED: { emoji: '🚫', ar: 'ملغي', extra: 'تم إلغاء طلب التمويل' },
    EXPIRED: { emoji: '⏰', ar: 'منتهي الصلاحية', extra: 'انتهت صلاحية الطلب' },
  };

  const statusInfo = statusMessages[status] || { emoji: '📋', ar: status, extra: '' };

  return `${statusInfo.emoji} *تحديث طلب التمويل*

${customerName ? `مرحباً ${customerName}\n` : ''}
📋 رقم الطلب: ${applicationNumber}
📊 الحالة: *${statusInfo.ar}*
${amount ? `💰 المبلغ: ${amount.toLocaleString('ar-SA')} ر.س\n` : ''}
${statusInfo.extra ? `\n💡 ${statusInfo.extra}` : ''}

🔗 متابعة الطلب: maxiocore.com/dashboard/financing

_MaxioCore_`;
}

// Deposit status message templates
export function getDepositStatusMessage(
  amount: number,
  status: string,
  transactionId?: string
): string {
  const statusMessages: Record<string, { emoji: string; ar: string }> = {
    pending: { emoji: '⏳', ar: 'قيد الانتظار' },
    completed: { emoji: '✅', ar: 'تم بنجاح' },
    failed: { emoji: '❌', ar: 'فشل' },
    refunded: { emoji: '💰', ar: 'مسترد' },
  };

  const statusInfo = statusMessages[status] || { emoji: '💳', ar: status };

  if (status === 'completed') {
    return `${statusInfo.emoji} *تم إيداع الرصيد*

💰 المبلغ: ${amount.toLocaleString('ar-SA')} ر.س
${transactionId ? `🔢 رقم العملية: ${transactionId}\n` : ''}

✨ تم إضافة الرصيد لحسابك بنجاح!

🔗 عرض الرصيد: maxiocore.com/dashboard

_MaxioCore_`;
  }

  return `${statusInfo.emoji} *تحديث الإيداع*

💰 المبلغ: ${amount.toLocaleString('ar-SA')} ر.س
📊 الحالة: *${statusInfo.ar}*

🔗 عرض التفاصيل: maxiocore.com/dashboard

_MaxioCore_`;
}

// Support ticket message templates
export function getTicketStatusMessage(
  ticketNumber: string,
  status: string,
  subject?: string,
  hasNewMessage?: boolean
): string {
  const statusMessages: Record<string, { emoji: string; ar: string }> = {
    open: { emoji: '🟢', ar: 'مفتوحة' },
    pending: { emoji: '🟡', ar: 'قيد الانتظار' },
    in_progress: { emoji: '🔵', ar: 'قيد المعالجة' },
    resolved: { emoji: '✅', ar: 'تم الحل' },
    closed: { emoji: '🔒', ar: 'مغلقة' },
  };

  const statusInfo = statusMessages[status] || { emoji: '📋', ar: status };

  if (hasNewMessage) {
    return `💬 *رد جديد على تذكرتك*

🎫 رقم التذكرة: ${ticketNumber}
${subject ? `📋 الموضوع: ${subject}\n` : ''}

📩 تم الرد على تذكرتك، يرجى المراجعة.

🔗 عرض التذكرة: maxiocore.com/dashboard/support

_MaxioCore_`;
  }

  return `${statusInfo.emoji} *تحديث التذكرة*

🎫 رقم التذكرة: ${ticketNumber}
${subject ? `📋 الموضوع: ${subject}\n` : ''}
📊 الحالة: *${statusInfo.ar}*

🔗 عرض التذكرة: maxiocore.com/dashboard/support

_MaxioCore_`;
}

// Balance change message templates
export function getBalanceChangeMessage(
  amount: number,
  type: 'credit' | 'debit',
  reason?: string,
  newBalance?: number
): string {
  const isCredit = type === 'credit';
  const emoji = isCredit ? '➕' : '➖';
  const action = isCredit ? 'إضافة' : 'خصم';

  return `${emoji} *${action} رصيد*

💰 المبلغ: ${Math.abs(amount).toLocaleString('ar-SA')} ر.س
${reason ? `📋 السبب: ${reason}\n` : ''}
${newBalance !== undefined ? `💳 الرصيد الحالي: ${newBalance.toLocaleString('ar-SA')} ر.س\n` : ''}

🔗 عرض الرصيد: maxiocore.com/dashboard

_MaxioCore_`;
}

// Welcome message for new users
export function getWelcomeMessage(name?: string): string {
  return `🎉 *مرحباً بك في MaxioCore*

${name ? `أهلاً ${name}!\n` : ''}
نحن سعداء بانضمامك إلينا.

🚀 ابدأ الآن واستفد من خدماتنا المتميزة:
• خدمات سوشيال ميديا
• تمويل الخدمات
• دعم فني على مدار الساعة

🔗 maxiocore.com

_MaxioCore_`;
}
