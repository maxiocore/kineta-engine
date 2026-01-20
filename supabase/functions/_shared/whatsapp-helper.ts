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

// Financing status message templates - Professional & Official Messages
export function getFinancingStatusMessage(
  applicationNumber: string,
  status: string,
  amount?: number,
  customerName?: string
): string {
  // Professional messages for each financing status
  const statusMessages: Record<string, { 
    emoji: string; 
    ar: string; 
    greeting?: string;
    mainMessage: string;
    nextStep?: string;
    urgency?: string;
  }> = {
    SUBMITTED: { 
      emoji: '📋', 
      ar: 'تم استلام الطلب',
      greeting: 'شكرًا لثقتكم بـ MaxioCore',
      mainMessage: 'تم استلام طلب تمويل الخدمات الخاص بكم بنجاح. سيقوم فريقنا المختص بمراجعة الطلب والتواصل معكم خلال 1-3 أيام عمل.',
      nextStep: 'يرجى انتظار إشعار تحديث حالة الطلب'
    },
    UNDER_REVIEW: { 
      emoji: '🔍', 
      ar: 'قيد المراجعة',
      mainMessage: 'فريقنا المختص يقوم حاليًا بدراسة طلبكم والتحقق من البيانات المقدمة.',
      nextStep: 'سنوافيكم بنتيجة المراجعة في أقرب وقت'
    },
    ADDITIONAL_INFO_REQUIRED: { 
      emoji: '⚠️', 
      ar: 'مطلوب مستندات إضافية',
      mainMessage: 'لاستكمال دراسة طلبكم، نحتاج إلى بعض المستندات أو المعلومات الإضافية.',
      nextStep: 'يرجى رفع المستندات المطلوبة عبر المنصة',
      urgency: '⏰ المهلة: 14 يومًا'
    },
    APPROVED: { 
      emoji: '✅', 
      ar: 'تمت الموافقة',
      greeting: '🎉 تهانينا!',
      mainMessage: 'يسرنا إبلاغكم بالموافقة على طلب تمويل الخدمات الخاص بكم.',
      nextStep: 'الخطوة التالية: مراجعة العقد والتوقيع عليه إلكترونيًا'
    },
    APPROVED_WITH_LIMITS: { 
      emoji: '✅', 
      ar: 'موافقة بقيمة معدّلة',
      greeting: 'تهانينا!',
      mainMessage: 'تمت الموافقة على طلبكم بقيمة تمويل معدّلة بناءً على التقييم الائتماني.',
      nextStep: 'يمكنكم مراجعة التفاصيل والتوقيع على العقد'
    },
    CONTRACT_PRESENTED: { 
      emoji: '📄', 
      ar: 'العقد جاهز للتوقيع',
      mainMessage: 'تم إعداد عقد تمويل الخدمات الخاص بكم. يُرجى مراجعة بنود العقد بعناية.',
      nextStep: 'قم بالتوقيع الإلكتروني لإتمام العملية',
      urgency: '⏰ المهلة: 7 أيام'
    },
    CONTRACT_ACCEPTED: { 
      emoji: '✍️', 
      ar: 'تم توقيع العقد',
      greeting: '✨ ممتاز!',
      mainMessage: 'تم توقيعكم على عقد التمويل بنجاح. العقد الآن بانتظار الاعتماد النهائي.',
      nextStep: 'الخطوة التالية: توقيع السند لأمر'
    },
    PROMISSORY_SIGNED: { 
      emoji: '📝', 
      ar: 'تم توقيع السند لأمر',
      greeting: '🎊 ممتاز!',
      mainMessage: 'تم توقيعكم على السند لأمر (الكمبيالة) بنجاح. جميع المستندات مكتملة الآن.',
      nextStep: 'جارٍ اعتماد العقد وإضافة رصيد الخدمات'
    },
    CONTRACT_FINALIZED: { 
      emoji: '🏛️', 
      ar: 'تم اعتماد العقد رسميًا',
      greeting: '🎉 مبارك!',
      mainMessage: 'تم اعتماد عقد تمويل الخدمات بشكل رسمي ونهائي من الإدارة المختصة.',
      nextStep: 'جارٍ إضافة رصيد الخدمات إلى حسابكم'
    },
    CREDIT_DEPOSITED: { 
      emoji: '💎', 
      ar: 'تم إيداع رصيد الخدمات',
      greeting: '🎊🎉 تهانينا الحارة!',
      mainMessage: 'تم إضافة رصيد خدمات التمويل إلى حسابكم بنجاح. يمكنكم الآن الاستفادة من الخدمات المتاحة.',
      nextStep: 'استكشفوا خدماتنا وابدأوا الاستخدام الآن!'
    },
    ACTIVE: { 
      emoji: '🟢', 
      ar: 'التمويل نشط',
      mainMessage: 'تمويلكم نشط الآن ويمكنكم استخدام رصيد الخدمات.',
      nextStep: 'تذكّروا مواعيد الأقساط الشهرية'
    },
    COMPLETED: { 
      emoji: '🏆', 
      ar: 'تم السداد الكامل',
      greeting: '🎊 تهانينا!',
      mainMessage: 'تم سداد جميع أقساط التمويل بنجاح. شكرًا لالتزامكم!',
      nextStep: 'يمكنكم التقدم بطلب تمويل جديد'
    },
    DECLINED: { 
      emoji: '❌', 
      ar: 'لم تتم الموافقة',
      mainMessage: 'نأسف لإبلاغكم بأنه لم يتم الموافقة على الطلب في الوقت الحالي لعدم استيفاء بعض المتطلبات.',
      nextStep: 'يمكنكم المحاولة مجددًا بعد معالجة الملاحظات'
    },
    CANCELLED: { 
      emoji: '🚫', 
      ar: 'تم إلغاء الطلب',
      mainMessage: 'تم إلغاء طلب التمويل بناءً على طلبكم.',
      nextStep: 'يمكنكم التقدم بطلب جديد في أي وقت'
    },
    EXPIRED: { 
      emoji: '⏰', 
      ar: 'انتهت صلاحية الطلب',
      mainMessage: 'انتهت صلاحية الطلب لعدم استكمال الإجراءات خلال المهلة المحددة.',
      nextStep: 'يمكنكم تقديم طلب جديد'
    },
  };

  const statusInfo = statusMessages[status] || { 
    emoji: '📋', 
    ar: status, 
    mainMessage: 'تم تحديث حالة طلبكم.',
    nextStep: 'يرجى مراجعة التفاصيل عبر المنصة'
  };

  // Build professional message
  let message = `${statusInfo.emoji} *إشعار تمويل الخدمات*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (customerName) {
    message += `👤 العميل الكريم: *${customerName}*\n\n`;
  }
  
  if (statusInfo.greeting) {
    message += `${statusInfo.greeting}\n\n`;
  }
  
  message += `📋 *رقم الطلب:* ${applicationNumber}\n`;
  message += `📊 *الحالة:* ${statusInfo.ar}\n`;
  
  if (amount) {
    message += `💰 *المبلغ:* ${amount.toLocaleString('ar-SA')} ريال سعودي\n`;
  }
  
  message += `\n📝 ${statusInfo.mainMessage}\n`;
  
  if (statusInfo.nextStep) {
    message += `\n✨ *الخطوة التالية:*\n${statusInfo.nextStep}\n`;
  }
  
  if (statusInfo.urgency) {
    message += `\n${statusInfo.urgency}\n`;
  }
  
  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔗 *متابعة الطلب:*\nmaxiocore.com/dashboard/financing\n\n`;
  message += `📞 للاستفسار: الدعم الفني متاح على مدار الساعة\n\n`;
  message += `_شركة علي صالح الشهري القابضة - MaxioCore_`;
  
  return message;
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
