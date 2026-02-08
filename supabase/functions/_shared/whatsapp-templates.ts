/**
 * WhatsApp Templates for Financing Status Updates
 * Arabic Banking-Grade Messages - ASH HOLDING Platform
 * 
 * All templates follow:
 * - Formal Arabic banking language
 * - Non-cash financing terminology (رصيد خدمات)
 * - Clear CTAs with deep links
 * - PDPL/SAMA compliance
 */

export interface TemplateVariables {
  customer_name: string;
  application_id: string;
  application_number?: string;
  amount?: number;
  approved_amount?: number;
  rejection_reason?: string;
  required_documents?: string[];
  contract_expiry?: string;
  installment_amount?: number;
  installments_count?: number;
  next_payment_date?: string;
  deep_link: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  name_ar: string;
  status: string;
  message: string;
  variables: string[];
}

// ═══════════════════════════════════════════════════════════════
// 1️⃣ APPLICATION SUBMITTED - تم تقديم الطلب
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_APPLICATION_SUBMITTED: WhatsAppTemplate = {
  id: 'financing_submitted',
  name: 'Application Submitted',
  name_ar: 'تم تقديم الطلب',
  status: 'SUBMITTED',
  message: `مرحباً {{customer_name}} 👋

✅ تم استلام طلبك بنجاح

رقم الطلب: {{application_number}}

جاري مراجعة طلبك من قبل فريقنا المختص، وسيتم إشعارك بأي تحديثات خلال ٢٤ ساعة عمل.

📋 عرض حالة الطلب:
{{deep_link}}

ASH HOLDING - شريكك التقني`,
  variables: ['customer_name', 'application_number', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 2️⃣ DOCUMENTS REQUIRED - مطلوب مستندات إضافية
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_DOCUMENTS_REQUIRED: WhatsAppTemplate = {
  id: 'financing_documents_required',
  name: 'Documents Required',
  name_ar: 'مطلوب مستندات',
  status: 'DOCUMENTS_REQUIRED',
  message: `مرحباً {{customer_name}}

📄 يتطلب طلبك رقم {{application_number}} مستندات إضافية لاستكمال المراجعة:

{{required_documents_list}}

⏰ يُرجى رفع المستندات خلال ٧ أيام لتجنب إلغاء الطلب.

📎 رفع المستندات:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'required_documents_list', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 3️⃣ CONTRACT READY - العقد جاهز للتوقيع
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_CONTRACT_READY: WhatsAppTemplate = {
  id: 'financing_contract_ready',
  name: 'Contract Ready',
  name_ar: 'العقد جاهز',
  status: 'CONTRACT_READY',
  message: `مرحباً {{customer_name}} 🎉

تمت الموافقة المبدئية على طلبك رقم {{application_number}}

📝 العقد جاهز للمراجعة والتوقيع الإلكتروني

💰 المبلغ المعتمد: {{approved_amount}} ر.س
   (رصيد خدمات داخل المنصة)

⚠️ صلاحية العقد: {{contract_expiry}}

✍️ توقيع العقد الآن:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'approved_amount', 'contract_expiry', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 4️⃣ APPROVED - تمت الموافقة
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_APPROVED: WhatsAppTemplate = {
  id: 'financing_approved',
  name: 'Application Approved',
  name_ar: 'تمت الموافقة',
  status: 'APPROVED',
  message: `مرحباً {{customer_name}} 🎊

✅ تمت الموافقة على طلبك رقم {{application_number}}

💰 رصيد الخدمات المعتمد: {{approved_amount}} ر.س

📅 خطة السداد:
• عدد الأقساط: {{installments_count}} قسط
• قيمة القسط: {{installment_amount}} ر.س
• موعد القسط الأول: {{next_payment_date}}

⚠️ ملاحظة: هذا رصيد خدمات يُستخدم حصرياً داخل منصة ASH HOLDING ولا يُصرف نقداً.

📋 عرض التفاصيل:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'approved_amount', 'installments_count', 'installment_amount', 'next_payment_date', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 5️⃣ APPROVED WITH CONDITIONS - موافقة مشروطة
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_APPROVED_CONDITIONAL: WhatsAppTemplate = {
  id: 'financing_approved_conditional',
  name: 'Approved with Conditions',
  name_ar: 'موافقة مشروطة',
  status: 'APPROVED_CONDITIONAL',
  message: `مرحباً {{customer_name}}

✅ تمت الموافقة على طلبك رقم {{application_number}} بشروط

💰 المبلغ المعتمد: {{approved_amount}} ر.س
   (رصيد خدمات داخل المنصة فقط)

📋 الشروط المطلوبة:
{{conditions_list}}

يُرجى استيفاء الشروط لتفعيل رصيد الخدمات.

📎 استكمال الشروط:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'approved_amount', 'conditions_list', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 6️⃣ REJECTED - تم رفض الطلب
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_REJECTED: WhatsAppTemplate = {
  id: 'financing_rejected',
  name: 'Application Rejected',
  name_ar: 'تم الرفض',
  status: 'REJECTED',
  message: `مرحباً {{customer_name}}

نأسف لإبلاغك بأنه لم تتم الموافقة على طلبك رقم {{application_number}}

📋 السبب: {{rejection_reason}}

يمكنك التقدم بطلب جديد بعد ٣٠ يوماً أو التواصل مع فريق الدعم للاستفسار.

📞 التواصل مع الدعم:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'rejection_reason', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 7️⃣ CREDIT DEPOSITED - تم إضافة رصيد الخدمات
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_CREDIT_DEPOSITED: WhatsAppTemplate = {
  id: 'financing_credit_deposited',
  name: 'Service Credit Deposited',
  name_ar: 'تم إضافة الرصيد',
  status: 'CREDIT_DEPOSITED',
  message: `مرحباً {{customer_name}} 🎉

✅ تم إضافة رصيد الخدمات إلى حسابك بنجاح!

💰 الرصيد المضاف: {{approved_amount}} ر.س

يمكنك الآن استخدام رصيدك للحصول على خدماتنا التقنية والتسويقية.

⚠️ تذكير: رصيد الخدمات متاح للاستخدام داخل المنصة فقط ولا يُصرف نقداً.

🛒 تصفح الخدمات:
{{deep_link}}

ASH HOLDING - شريكك التقني`,
  variables: ['customer_name', 'approved_amount', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 8️⃣ PROCESS COMPLETED - اكتملت العملية (كل الأقساط)
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_COMPLETED: WhatsAppTemplate = {
  id: 'financing_completed',
  name: 'Process Completed',
  name_ar: 'اكتملت العملية',
  status: 'COMPLETED',
  message: `مرحباً {{customer_name}} 🌟

🎊 تهانينا! تم سداد جميع الأقساط بنجاح

رقم الطلب: {{application_number}}

نشكرك على التزامك وثقتك بمنصة ASH HOLDING.

يسعدنا خدمتك مجدداً في أي وقت! 💙

📋 عرض السجل الكامل:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 8️⃣.1️⃣ FINANCING FULLY COMPLETED - اكتمال التمويل (موافقة + توقيع + إيداع)
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_FINANCING_FULLY_COMPLETED: WhatsAppTemplate = {
  id: 'financing_fully_completed',
  name: 'Financing Fully Completed',
  name_ar: 'اكتمال التمويل',
  status: 'FINANCING_FULLY_COMPLETED',
  message: `🎊 *اكتمال التمويل بنجاح*
━━━━━━━━━━━━━━━━━━━━━

مرحباً {{customer_name}} 👋

✅ تهانينا! اكتملت عملية التمويل لطلبك بنجاح.

📋 *تفاصيل الطلب:*
• رقم الطلب: {{application_number}}
• رصيد الخدمات: {{approved_amount}} ر.س

⚠️ *ملاحظة مهمة:*
هذا رصيد خدمات داخل منصة ASH HOLDING ولا يُصرف نقداً.

━━━━━━━━━━━━━━━━━━━━━

📄 *تحميل المستندات:*
_(صالحة لمدة 24 ساعة)_

📑 العقد النهائي:
{{contract_url}}

📝 الإقرار الموقع:
{{acknowledgment_url}}

━━━━━━━━━━━━━━━━━━━━━

🔗 *عرض حسابك:*
{{deep_link}}

━━━━━━━━━━━━━━━━━━━━━
_ASH HOLDING - شريكك التقني_`,
  variables: ['customer_name', 'application_number', 'approved_amount', 'contract_url', 'acknowledgment_url', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 9️⃣ PAYMENT REMINDER - تذكير بموعد السداد
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_PAYMENT_REMINDER: WhatsAppTemplate = {
  id: 'financing_payment_reminder',
  name: 'Payment Reminder',
  name_ar: 'تذكير بالسداد',
  status: 'PAYMENT_DUE',
  message: `مرحباً {{customer_name}}

⏰ تذكير: موعد سداد القسط القادم

💰 المبلغ المستحق: {{installment_amount}} ر.س
📅 تاريخ الاستحقاق: {{next_payment_date}}

يُرجى السداد في الموعد لتجنب رسوم التأخير.

💳 سداد الآن:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'installment_amount', 'next_payment_date', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 🔟 PAYMENT OVERDUE - تأخر في السداد
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_PAYMENT_OVERDUE: WhatsAppTemplate = {
  id: 'financing_payment_overdue',
  name: 'Payment Overdue',
  name_ar: 'تأخر السداد',
  status: 'PAYMENT_OVERDUE',
  message: `مرحباً {{customer_name}}

⚠️ تنبيه: تأخر سداد القسط

💰 المبلغ المستحق: {{installment_amount}} ر.س
📅 كان مستحقاً في: {{next_payment_date}}

يُرجى السداد فوراً لتجنب المزيد من الرسوم وتأثر سجلك الائتماني.

💳 سداد الآن:
{{deep_link}}

للاستفسار أو طلب جدولة: تواصل مع فريق الدعم

ASH HOLDING`,
  variables: ['customer_name', 'installment_amount', 'next_payment_date', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 1️⃣1️⃣ PROMISSORY NOTE SIGNED - تم توقيع السند
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_PROMISSORY_SIGNED: WhatsAppTemplate = {
  id: 'financing_promissory_signed',
  name: 'Promissory Note Signed',
  name_ar: 'تم توقيع السند',
  status: 'PROMISSORY_SIGNED',
  message: `مرحباً {{customer_name}}

✅ تم توقيع السند لأمر بنجاح

رقم الطلب: {{application_number}}

جاري معالجة طلبك وسيتم إضافة رصيد الخدمات خلال ٢٤ ساعة عمل.

📋 متابعة الحالة:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 1️⃣2️⃣ ACKNOWLEDGMENT SENT - إرسال الإقرار للتوقيع
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_ACKNOWLEDGMENT_SENT: WhatsAppTemplate = {
  id: 'financing_acknowledgment_sent',
  name: 'Acknowledgment Sent',
  name_ar: 'إرسال الإقرار',
  status: 'ACK_SENT',
  message: `مرحباً {{customer_name}} 📄

تم إرسال إقرار قراءة الشروط لطلب التمويل رقم {{application_number}}.

يرجى الدخول للمنصة وقراءته وتوقيعه لاستكمال إجراءات التمويل.

📋 قراءة وتوقيع الإقرار:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 1️⃣3️⃣ ACKNOWLEDGMENT SIGNED - تم توقيع الإقرار
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_ACKNOWLEDGMENT_SIGNED: WhatsAppTemplate = {
  id: 'financing_acknowledgment_signed',
  name: 'Acknowledgment Signed',
  name_ar: 'تم توقيع الإقرار',
  status: 'ACK_SIGNED',
  message: `مرحباً {{customer_name}} ✅

تم استلام توقيعك على إقرار الشروط لطلب التمويل رقم {{application_number}}.

سيتم إرسال عقد التمويل الرسمي قريباً للمراجعة والتوقيع.

📋 متابعة حالة الطلب:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 1️⃣4️⃣ CONTRACT SENT - إرسال العقد للتوقيع
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_CONTRACT_SENT: WhatsAppTemplate = {
  id: 'financing_contract_sent',
  name: 'Contract Sent',
  name_ar: 'إرسال العقد',
  status: 'CONTRACT_SENT',
  message: `مرحباً {{customer_name}} 📝

تم إرسال عقد التمويل الرسمي لطلب رقم {{application_number}}.

💰 المبلغ المعتمد: {{approved_amount}} ر.س
   (رصيد خدمات داخل المنصة فقط)

يرجى مراجعته وتوقيعه داخل المنصة لإتمام عملية التمويل.

✍️ مراجعة وتوقيع العقد:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'approved_amount', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 1️⃣5️⃣ CONTRACT SIGNED - تم توقيع العقد
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_CONTRACT_SIGNED: WhatsAppTemplate = {
  id: 'financing_contract_signed',
  name: 'Contract Signed',
  name_ar: 'تم توقيع العقد',
  status: 'CONTRACT_SIGNED',
  message: `مرحباً {{customer_name}} ✅

تم اعتماد توقيع عقد التمويل بنجاح لطلب رقم {{application_number}}.

جاري استكمال الإجراءات وسيتم إشعارك بالخطوات القادمة.

📋 متابعة حالة الطلب:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 1️⃣6️⃣ BOND ISSUING - جاري إصدار سند الأمر
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_BOND_ISSUING: WhatsAppTemplate = {
  id: 'financing_bond_issuing',
  name: 'Bond Issuing',
  name_ar: 'جاري إصدار السند',
  status: 'BOND_ISSUING',
  message: `مرحباً {{customer_name}} ⏳

جاري إصدار سند الأمر لطلب التمويل رقم {{application_number}}.

سيتم إشعارك فور اكتمال الإصدار لتأكيد التوقيع.

📋 متابعة الحالة:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 1️⃣7️⃣ BOND SENT TO CLIENT - إرسال السند للعميل
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_BOND_SENT: WhatsAppTemplate = {
  id: 'financing_bond_sent',
  name: 'Bond Sent to Client',
  name_ar: 'إرسال السند للعميل',
  status: 'BOND_SENT',
  message: `مرحباً {{customer_name}} 📄

تم إرسال سند الأمر لطلب التمويل رقم {{application_number}}.

يرجى مراجعته عبر منصة نافذ وتأكيد التوقيع في المنصة.

✅ تأكيد التوقيع:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'application_number', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 1️⃣8️⃣ INTERNAL TRANSFER - تحويل الرصيد الداخلي
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_INTERNAL_TRANSFER: WhatsAppTemplate = {
  id: 'financing_internal_transfer',
  name: 'Internal Transfer',
  name_ar: 'تحويل داخلي',
  status: 'INTERNAL_TRANSFER',
  message: `مرحباً {{customer_name}} 💰

تم تحويل رصيد التمويل إلى رصيد الخدمات داخل حسابك بقيمة {{amount}} ر.س.

يمكنك استخدامه فورًا لشراء الخدمات داخل المنصة.

⚠️ تنويه: الرصيد مخصص للاستخدام داخل المنصة فقط ولا يمكن سحبه أو تحويله خارجها.

🛒 تصفح الخدمات:
{{deep_link}}

ASH HOLDING`,
  variables: ['customer_name', 'amount', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE REGISTRY - سجل القوالب
// ═══════════════════════════════════════════════════════════════
export const TEMPLATES_REGISTRY: Record<string, WhatsAppTemplate> = {
  'SUBMITTED': TEMPLATE_APPLICATION_SUBMITTED,
  'PENDING': TEMPLATE_APPLICATION_SUBMITTED,
  'DOCUMENTS_REQUIRED': TEMPLATE_DOCUMENTS_REQUIRED,
  'UNDER_REVIEW': TEMPLATE_APPLICATION_SUBMITTED,
  'CONTRACT_READY': TEMPLATE_CONTRACT_READY,
  'APPROVED': TEMPLATE_APPROVED,
  'APPROVED_CONDITIONAL': TEMPLATE_APPROVED_CONDITIONAL,
  'REJECTED': TEMPLATE_REJECTED,
  'DECLINED': TEMPLATE_REJECTED,
  'CREDIT_DEPOSITED': TEMPLATE_CREDIT_DEPOSITED,
  'ACTIVE': TEMPLATE_CREDIT_DEPOSITED,
  'COMPLETED': TEMPLATE_COMPLETED,
  'FINANCING_FULLY_COMPLETED': TEMPLATE_FINANCING_FULLY_COMPLETED,
  'PAYMENT_DUE': TEMPLATE_PAYMENT_REMINDER,
  'PAYMENT_OVERDUE': TEMPLATE_PAYMENT_OVERDUE,
  'PROMISSORY_SIGNED': TEMPLATE_PROMISSORY_SIGNED,
  // New templates
  'ACK_SENT': TEMPLATE_ACKNOWLEDGMENT_SENT,
  'ACKNOWLEDGMENT_SENT': TEMPLATE_ACKNOWLEDGMENT_SENT,
  'ACK_SIGNED': TEMPLATE_ACKNOWLEDGMENT_SIGNED,
  'ACKNOWLEDGMENT_SIGNED': TEMPLATE_ACKNOWLEDGMENT_SIGNED,
  'CONTRACT_SENT': TEMPLATE_CONTRACT_SENT,
  'AWAITING_CONTRACT': TEMPLATE_CONTRACT_SENT,
  'CONTRACT_SIGNED': TEMPLATE_CONTRACT_SIGNED,
  'BOND_ISSUING': TEMPLATE_BOND_ISSUING,
  'AWAITING_BOND': TEMPLATE_BOND_ISSUING,
  'BOND_SENT': TEMPLATE_BOND_SENT,
  'SENT_TO_CLIENT': TEMPLATE_BOND_SENT,
  'INTERNAL_TRANSFER': TEMPLATE_INTERNAL_TRANSFER,
  // Cancellation status - uses same as rejected but with different message
  'CANCELLED': {
    id: 'financing_cancelled',
    name: 'Application Cancelled',
    name_ar: 'تم إلغاء الطلب',
    status: 'CANCELLED',
    message: `مرحباً {{customer_name}}

📋 تم إلغاء طلب التمويل رقم {{application_number}}

يمكنك التقدم بطلب جديد في أي وقت.

📱 تقديم طلب جديد:
{{deep_link}}

ASH HOLDING`,
    variables: ['customer_name', 'application_number', 'deep_link']
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get template by status
 */
export function getTemplateByStatus(status: string): WhatsAppTemplate | null {
  return TEMPLATES_REGISTRY[status.toUpperCase()] || null;
}

/**
 * Build message with variables
 */
export function buildMessage(template: WhatsAppTemplate, variables: Partial<TemplateVariables>): string {
  let message = template.message;
  
  // Replace all placeholders
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const placeholder = `{{${key}}}`;
      
      // Format amount with commas for Arabic
      if (key.includes('amount') && typeof value === 'number') {
        message = message.replace(new RegExp(placeholder, 'g'), formatAmount(value));
      } else if (Array.isArray(value)) {
        // Format lists with bullets
        const listFormatted = value.map(item => `• ${item}`).join('\n');
        message = message.replace(new RegExp(placeholder.replace('_list', ''), 'g'), listFormatted);
      } else {
        message = message.replace(new RegExp(placeholder, 'g'), String(value));
      }
    }
  });
  
  return message;
}

/**
 * Format amount in Arabic style
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate deep link for financing status
 */
export function generateDeepLink(baseUrl: string, applicationId: string, action?: string): string {
  const path = action 
    ? `/dashboard/financing/${action}?id=${applicationId}`
    : `/dashboard/financing?id=${applicationId}`;
  return `${baseUrl}${path}`;
}

/**
 * Format date in Arabic
 */
export function formatDateArabic(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
