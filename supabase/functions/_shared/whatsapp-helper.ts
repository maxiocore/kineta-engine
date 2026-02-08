/**
 * WhatsApp Notification Helper using SmartWats API v1.3
 * 
 * This module provides backward-compatible functions while using
 * the new WhatsApp Provider with retry and error handling.
 */

import { 
  WhatsAppProvider, 
  formatPhoneNumber, 
  isValidSaudiNumber,
  WhatsAppSendResult,
  WhatsAppErrorType 
} from './whatsapp-provider.ts';

// Re-export for backward compatibility
export { formatPhoneNumber, isValidSaudiNumber };

// Legacy interface for backward compatibility
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

/**
 * Send WhatsApp message - backward compatible wrapper
 * Now uses WhatsAppProvider with retry and error classification
 */
export async function sendWhatsAppMessage(notification: WhatsAppNotification): Promise<WhatsAppResult> {
  const result: WhatsAppSendResult = await WhatsAppProvider.sendText(
    notification.phone,
    notification.message,
    { type: notification.type || 'general' }
  );

  // Convert to legacy format
  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error?.message
  };
}

/**
 * Send WhatsApp message with full result (new API)
 */
export async function sendWhatsAppMessageV2(notification: WhatsAppNotification): Promise<WhatsAppSendResult> {
  return WhatsAppProvider.sendText(
    notification.phone,
    notification.message,
    { type: notification.type || 'general' }
  );
}

/**
 * Send template-based status message with deep link
 */
export async function sendStatusNotification(
  phone: string,
  status: string,
  params: {
    applicationNumber?: string;
    orderNumber?: string;
    amount?: number;
    customerName?: string;
    deepLinkPath?: string;
  }
): Promise<WhatsAppSendResult> {
  return WhatsAppProvider.sendTemplateStatus(
    phone,
    {
      status,
      applicationNumber: params.applicationNumber,
      orderNumber: params.orderNumber,
      amount: params.amount,
      customerName: params.customerName
    },
    params.deepLinkPath
  );
}

/**
 * Check if WhatsApp is configured
 */
export function isWhatsAppConfigured(): boolean {
  return WhatsAppProvider.isConfigured();
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

🔗 تتبع طلبك: ashholding.com/dashboard/orders

_ASH HOLDING_`;
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
      greeting: 'شكرًا لثقتكم بـ ASH HOLDING',
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
  message += `🔗 *متابعة الطلب:*\nashholding.com/dashboard/financing\n\n`;
  message += `📞 للاستفسار: الدعم الفني متاح على مدار الساعة\n\n`;
  message += `_شركة علي صالح الشهري القابضة - ASH HOLDING_`;
  
  return message;
}

// Installment payment message templates - Professional & Official Messages
export interface InstallmentPaymentDetails {
  applicationNumber: string;
  customerName: string;
  installmentNumber: number;
  totalInstallments: number;
  paidAmount: number;
  remainingAmount: number;
  remainingInstallments: number;
  nextDueDate?: string;
  isLastInstallment: boolean;
}

export function getInstallmentPaymentMessage(details: InstallmentPaymentDetails): string {
  const {
    applicationNumber,
    customerName,
    installmentNumber,
    totalInstallments,
    paidAmount,
    remainingAmount,
    remainingInstallments,
    nextDueDate,
    isLastInstallment
  } = details;

  if (isLastInstallment) {
    // Final installment - Full settlement message
    return `🏆 *إشعار سداد التمويل*
━━━━━━━━━━━━━━━━━━━━━

👤 العميل الكريم: *${customerName}*

🎊🎉 *تهانينا! تم سداد جميع الأقساط بنجاح*

📋 *رقم الطلب:* ${applicationNumber}
💰 *القسط الأخير:* ${paidAmount.toLocaleString('ar-SA')} ريال
📊 *الحالة:* سداد كامل ✅

📝 يسرنا إبلاغكم بأنه تم سداد جميع أقساط التمويل بالكامل. شكرًا لالتزامكم!

🏅 *شهادة المخالصة:*
ستصلكم شهادة المخالصة خلال 24 ساعة

✨ *يمكنكم الآن:*
• التقدم بطلب تمويل جديد
• الاستمتاع بعروضنا الحصرية

━━━━━━━━━━━━━━━━━━━━━
🔗 *متابعة حسابكم:*
ashholding.com/dashboard/financing

📞 للاستفسار: الدعم الفني متاح على مدار الساعة

_شركة علي صالح الشهري القابضة - ASH HOLDING_`;
  }

  // Regular installment payment
  return `✅ *إشعار سداد قسط*
━━━━━━━━━━━━━━━━━━━━━

👤 العميل الكريم: *${customerName}*

📋 *رقم الطلب:* ${applicationNumber}
🔢 *القسط:* ${installmentNumber} من ${totalInstallments}
💰 *المبلغ المدفوع:* ${paidAmount.toLocaleString('ar-SA')} ريال

📊 *ملخص السداد:*
├ ✅ الأقساط المسددة: ${installmentNumber}
├ ⏳ الأقساط المتبقية: ${remainingInstallments}
└ 💵 المبلغ المتبقي: ${remainingAmount.toLocaleString('ar-SA')} ريال

${nextDueDate ? `📅 *موعد القسط القادم:* ${nextDueDate}\n` : ''}
✨ شكرًا لالتزامكم بالسداد في الموعد!

━━━━━━━━━━━━━━━━━━━━━
🔗 *متابعة الأقساط:*
ashholding.com/dashboard/financing

📞 للاستفسار: الدعم الفني متاح على مدار الساعة

_شركة علي صالح الشهري القابضة - ASH HOLDING_`;
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

🔗 عرض الرصيد: ashholding.com/dashboard

_ASH HOLDING_`;
  }

  return `${statusInfo.emoji} *تحديث الإيداع*

💰 المبلغ: ${amount.toLocaleString('ar-SA')} ر.س
📊 الحالة: *${statusInfo.ar}*

🔗 عرض التفاصيل: ashholding.com/dashboard

_ASH HOLDING_`;
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

🔗 عرض التذكرة: ashholding.com/dashboard/support

_ASH HOLDING_`;
  }

  return `${statusInfo.emoji} *تحديث التذكرة*

🎫 رقم التذكرة: ${ticketNumber}
${subject ? `📋 الموضوع: ${subject}\n` : ''}
📊 الحالة: *${statusInfo.ar}*

🔗 عرض التذكرة: ashholding.com/dashboard/support

_ASH HOLDING_`;
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

🔗 عرض الرصيد: ashholding.com/dashboard

_ASH HOLDING_`;
}

// Welcome message for new users
export function getWelcomeMessage(name?: string): string {
  return `🎉 *مرحباً بك في ASH HOLDING*

${name ? `أهلاً ${name}!\n` : ''}
نحن سعداء بانضمامك إلينا.

🚀 ابدأ الآن واستفد من خدماتنا المتميزة:
• خدمات سوشيال ميديا
• تمويل الخدمات
• دعم فني على مدار الساعة

🔗 ashholding.com

_ASH HOLDING_`;
}
