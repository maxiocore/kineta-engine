/**
 * WhatsApp Templates for Financing Status Updates
 * Arabic Banking-Grade Messages - MaxioCore Platform
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

ماكسيو كور - شريكك التقني`,
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

ماكسيو كور`,
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

ماكسيو كور`,
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

⚠️ ملاحظة: هذا رصيد خدمات يُستخدم حصرياً داخل منصة ماكسيو كور ولا يُصرف نقداً.

📋 عرض التفاصيل:
{{deep_link}}

ماكسيو كور`,
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

ماكسيو كور`,
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

ماكسيو كور`,
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

ماكسيو كور - شريكك التقني`,
  variables: ['customer_name', 'approved_amount', 'deep_link']
};

// ═══════════════════════════════════════════════════════════════
// 8️⃣ PROCESS COMPLETED - اكتملت العملية
// ═══════════════════════════════════════════════════════════════
export const TEMPLATE_COMPLETED: WhatsAppTemplate = {
  id: 'financing_completed',
  name: 'Process Completed',
  name_ar: 'اكتملت العملية',
  status: 'COMPLETED',
  message: `مرحباً {{customer_name}} 🌟

🎊 تهانينا! تم سداد جميع الأقساط بنجاح

رقم الطلب: {{application_number}}

نشكرك على التزامك وثقتك بمنصة ماكسيو كور.

يسعدنا خدمتك مجدداً في أي وقت! 💙

📋 عرض السجل الكامل:
{{deep_link}}

ماكسيو كور`,
  variables: ['customer_name', 'application_number', 'deep_link']
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

ماكسيو كور`,
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

ماكسيو كور`,
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

ماكسيو كور`,
  variables: ['customer_name', 'application_number', 'deep_link']
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
  'CREDIT_DEPOSITED': TEMPLATE_CREDIT_DEPOSITED,
  'ACTIVE': TEMPLATE_CREDIT_DEPOSITED,
  'COMPLETED': TEMPLATE_COMPLETED,
  'PAYMENT_DUE': TEMPLATE_PAYMENT_REMINDER,
  'PAYMENT_OVERDUE': TEMPLATE_PAYMENT_OVERDUE,
  'PROMISSORY_SIGNED': TEMPLATE_PROMISSORY_SIGNED,
  'CONTRACT_SIGNED': TEMPLATE_CONTRACT_READY,
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
