// ============================================
// عقد تمويل الخدمات - Service Financing Contract
// شركة علي صالح الشهري القابضة
// ============================================

import { COMPANY_INFO } from "./serviceFinancingPolicy";

/**
 * معلومات العقد الأساسية
 */
export const CONTRACT_INFO = {
  version: "1.0.0",
  lastUpdated: "2025-01-01",
  jurisdiction: "المملكة العربية السعودية",
  governingLaw: "نظام المحاكم التجارية السعودي",
};

/**
 * بنود العقد الأساسية
 */
export const CONTRACT_CLAUSES = {
  preamble: {
    title: "تمهيد",
    content: `
حيث أن ${COMPANY_INFO.name} ("الطرف الأول" أو "الممول" أو "مزود الخدمة") تقدم خدمات تمويل شراء الخدمات الرقمية والتقنية،

وحيث أن الطرف الثاني ("العميل" أو "المستفيد") يرغب في الحصول على تمويل لشراء خدمات من الطرف الأول أو الجهات التابعة له،

فقد اتفق الطرفان على ما يلي:
    `.trim(),
  },

  article1: {
    title: "المادة الأولى: طبيعة التمويل",
    clauses: [
      "1.1 هذا العقد هو عقد تمويل خدمات وليس قرضاً نقدياً أو تمويلاً شخصياً.",
      "1.2 لا يحق للعميل المطالبة بصرف أي مبلغ نقدي أو تحويل أموال له بأي شكل من الأشكال.",
      "1.3 التمويل مخصص حصرياً لشراء الخدمات المقدمة من الطرف الأول أو الخدمات التابعة له داخل المنصة.",
      "1.4 يتم دفع قيمة التمويل مباشرة إلى مزود الخدمة (الطرف الأول أو التابعين) وليس للعميل.",
    ],
  },

  article2: {
    title: "المادة الثانية: الخدمات الممولة",
    clauses: [
      "2.1 يشمل التمويل الخدمات المختارة من قبل العميل والموضحة في ملخص الطلب المرفق بهذا العقد.",
      "2.2 لا يجوز تغيير الخدمات الممولة بعد توقيع العقد إلا بموافقة خطية من الطرفين.",
      "2.3 في حال إلغاء أي خدمة، يتم إعادة حساب قيمة التمويل والأقساط وفقاً لذلك.",
      "2.4 يلتزم الطرف الأول بتقديم الخدمات المتفق عليها وفق المواصفات والجداول الزمنية المحددة.",
    ],
  },

  article3: {
    title: "المادة الثالثة: قيمة التمويل والأقساط",
    clauses: [
      "3.1 قيمة التمويل تساوي القيمة الإجمالية للخدمات المختارة فقط، ولا يوجد مبلغ إضافي يُصرف للعميل.",
      "3.2 يلتزم العميل بسداد قيمة التمويل على أقساط شهرية متساوية حسب الجدول المرفق.",
      "3.3 تُحتسب الرسوم الإدارية وضريبة القيمة المضافة وفقاً للأنظمة المعمول بها.",
      "3.4 يستحق كل قسط في اليوم المحدد من كل شهر، وأي تأخير يُعرض العميل لغرامات التأخير المنصوص عليها.",
    ],
  },

  article4: {
    title: "المادة الرابعة: التزامات العميل",
    clauses: [
      "4.1 يلتزم العميل بسداد الأقساط في مواعيدها المحددة دون تأخير.",
      "4.2 يُقر العميل بأن المعلومات المقدمة في طلب التمويل صحيحة ودقيقة.",
      "4.3 يلتزم العميل بإبلاغ الطرف الأول فوراً بأي تغيير في بياناته أو وضعه المالي.",
      "4.4 يتحمل العميل كافة العواقب القانونية في حال تقديم معلومات غير صحيحة.",
    ],
  },

  article5: {
    title: "المادة الخامسة: التزامات مزود الخدمة",
    clauses: [
      "5.1 يلتزم الطرف الأول بتقديم الخدمات الممولة وفق المعايير والمواصفات المتفق عليها.",
      "5.2 يلتزم الطرف الأول بالحفاظ على سرية بيانات العميل وعدم مشاركتها مع أطراف خارجية.",
      "5.3 يوفر الطرف الأول قنوات دعم فني للرد على استفسارات العميل.",
      "5.4 يلتزم الطرف الأول بإشعار العميل بأي تغييرات جوهرية في الخدمات.",
    ],
  },

  article6: {
    title: "المادة السادسة: التأخر في السداد",
    clauses: [
      "6.1 في حال تأخر العميل عن سداد أي قسط، تُفرض غرامة تأخير بنسبة (2%) من قيمة القسط المتأخر عن كل شهر تأخير.",
      "6.2 يحق للطرف الأول إيقاف الخدمات مؤقتاً في حال تأخر العميل عن سداد قسطين متتاليين.",
      "6.3 يحق للطرف الأول المطالبة بكامل المبلغ المتبقي فوراً في حال التأخر عن ثلاثة أقساط.",
      "6.4 يتحمل العميل جميع تكاليف التحصيل والإجراءات القانونية في حال اللجوء إليها.",
    ],
  },

  article7: {
    title: "المادة السابعة: إنهاء العقد",
    clauses: [
      "7.1 ينتهي هذا العقد تلقائياً بسداد كامل الأقساط المستحقة.",
      "7.2 يحق للطرف الأول إنهاء العقد فوراً في حال إخلال العميل بأي من التزاماته.",
      "7.3 في حال الإنهاء المبكر، يلتزم العميل بسداد جميع المبالغ المستحقة حتى تاريخ الإنهاء.",
      "7.4 لا يُعفي إنهاء العقد العميل من سداد أي مبالغ مستحقة قبل تاريخ الإنهاء.",
    ],
  },

  article8: {
    title: "المادة الثامنة: تسوية النزاعات",
    clauses: [
      "8.1 يخضع هذا العقد لأنظمة المملكة العربية السعودية.",
      "8.2 في حال نشوء أي نزاع، يسعى الطرفان لحله ودياً خلال (30) يوماً.",
      "8.3 إذا تعذر الحل الودي، يُحال النزاع إلى المحاكم التجارية المختصة في المملكة العربية السعودية.",
      "8.4 تُعتبر مدينة الرياض هي المكان المختص لنظر أي نزاعات.",
    ],
  },

  article9: {
    title: "المادة التاسعة: أحكام عامة",
    clauses: [
      "9.1 يُعتبر هذا العقد نافذاً ومُلزماً من تاريخ الموافقة الإلكترونية من قبل العميل.",
      "9.2 الموافقة الإلكترونية لها نفس الحجية القانونية للتوقيع الخطي.",
      "9.3 لا يجوز تعديل هذا العقد إلا بموافقة خطية من الطرفين.",
      "9.4 في حال بطلان أي بند، تظل باقي البنود سارية المفعول.",
      "9.5 يُقر العميل بأنه قرأ جميع بنود هذا العقد وفهمها بالكامل قبل الموافقة.",
    ],
  },
};

/**
 * إقرارات العميل الأساسية
 */
export const CLIENT_ACKNOWLEDGMENTS = [
  "أقر بأنني قرأت جميع بنود العقد وفهمتها بالكامل.",
  "أقر بأن هذا تمويل لشراء خدمات وليس تمويلاً نقدياً.",
  "أقر بأنني لن أستلم أي مبالغ نقدية، وأن الدفع سيتم مباشرة لمزود الخدمة.",
  "أقر بأن المعلومات التي قدمتها صحيحة ودقيقة.",
  "أقر بالتزامي بسداد الأقساط في مواعيدها المحددة.",
  "أقر بموافقتي على الشروط والأحكام وسياسة الخصوصية.",
];

/**
 * Placeholders الديناميكية للعقد
 */
export interface ContractPlaceholders {
  // بيانات العميل
  customer_name: string;
  customer_national_id: string;
  customer_phone: string;
  customer_email: string;
  customer_address?: string;

  // بيانات الطلب
  order_id: string;
  application_number: string;
  application_date: string;

  // تفاصيل الخدمات
  services_table: ServiceItem[];
  total_services_value: number;

  // تفاصيل التمويل
  admin_fees: number;
  vat_amount: number;
  total_amount: number;
  down_payment?: number;
  financed_amount: number;

  // تفاصيل الأقساط
  installments_count: number;
  installment_amount: number;
  first_due_date: string;
  last_due_date: string;
  
  // جدول الأقساط
  installments_schedule: InstallmentItem[];

  // مزود الخدمة
  service_provider: string;
  service_provider_cr?: string; // السجل التجاري
}

export interface ServiceItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  total: number;
}

export interface InstallmentItem {
  number: number;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
}

/**
 * توليد نص ملخص الطلب داخل العقد
 */
export function generateOrderSummarySection(data: ContractPlaceholders): string {
  const servicesRows = data.services_table
    .map((s, i) => `${i + 1}. ${s.name} - ${s.quantity} × ${formatCurrency(s.price)} = ${formatCurrency(s.total)}`)
    .join("\n");

  const installmentsRows = data.installments_schedule
    .slice(0, 3)
    .map((inst) => `   القسط ${inst.number}: ${formatCurrency(inst.amount)} - ${inst.dueDate}`)
    .join("\n");

  return `
═══════════════════════════════════════════════════════════════
                        ملخص الطلب
═══════════════════════════════════════════════════════════════

📋 بيانات الطلب:
   رقم الطلب: ${data.application_number}
   تاريخ الطلب: ${data.application_date}
   
👤 بيانات العميل:
   الاسم: ${data.customer_name}
   رقم الهوية: ${data.customer_national_id}
   الجوال: ${data.customer_phone}
   البريد: ${data.customer_email}

🏢 مزود الخدمة:
   ${data.service_provider}

📦 الخدمات المختارة:
${servicesRows}

💰 التفاصيل المالية:
   قيمة الخدمات: ${formatCurrency(data.total_services_value)}
   الرسوم الإدارية: ${formatCurrency(data.admin_fees)}
   ضريبة القيمة المضافة (15%): ${formatCurrency(data.vat_amount)}
   ─────────────────────────────
   الإجمالي: ${formatCurrency(data.total_amount)}
   ${data.down_payment ? `الدفعة المقدمة: ${formatCurrency(data.down_payment)}` : ""}
   المبلغ الممول: ${formatCurrency(data.financed_amount)}

📅 جدول السداد:
   عدد الأقساط: ${data.installments_count} قسط
   قيمة القسط: ${formatCurrency(data.installment_amount)}
   تاريخ أول قسط: ${data.first_due_date}
   تاريخ آخر قسط: ${data.last_due_date}

   أول 3 أقساط:
${installmentsRows}
   ...

═══════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * توليد العقد الكامل
 */
export function generateFullContract(data: ContractPlaceholders): string {
  const header = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                   عقد تمويل خدمات                              ║
║              Service Financing Agreement                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

رقم العقد: ${data.application_number}
تاريخ التحرير: ${data.application_date}

الطرف الأول (الممول / مزود الخدمة):
${COMPANY_INFO.name}
${data.service_provider_cr ? `السجل التجاري: ${data.service_provider_cr}` : ""}

الطرف الثاني (العميل / المستفيد):
الاسم: ${data.customer_name}
رقم الهوية الوطنية: ${data.customer_national_id}
رقم الجوال: ${data.customer_phone}
البريد الإلكتروني: ${data.customer_email}
${data.customer_address ? `العنوان: ${data.customer_address}` : ""}

═══════════════════════════════════════════════════════════════
  `.trim();

  const clauses = Object.values(CONTRACT_CLAUSES)
    .map((article) => {
      if ("clauses" in article) {
        return `
${article.title}
${"─".repeat(50)}
${article.clauses.join("\n")}
        `.trim();
      }
      return `
${article.title}
${"─".repeat(50)}
${article.content}
      `.trim();
    })
    .join("\n\n");

  const orderSummary = generateOrderSummarySection(data);

  const acknowledgments = `
═══════════════════════════════════════════════════════════════
                      إقرارات العميل
═══════════════════════════════════════════════════════════════

${CLIENT_ACKNOWLEDGMENTS.map((ack, i) => `☐ ${i + 1}. ${ack}`).join("\n")}

═══════════════════════════════════════════════════════════════
  `.trim();

  const footer = `
═══════════════════════════════════════════════════════════════
                    توقيع واعتماد العقد
═══════════════════════════════════════════════════════════════

تم الاطلاع على جميع بنود هذا العقد والموافقة عليها إلكترونياً.

الطرف الأول: ${COMPANY_INFO.name}
التوقيع: [توقيع إلكتروني تلقائي]

الطرف الثاني: ${data.customer_name}
التوقيع: [ينتظر الموافقة الإلكترونية]

═══════════════════════════════════════════════════════════════

⚠️ تنبيه مهم:
هذا العقد لا يصبح نافذاً إلا بعد الموافقة الإلكترونية من قبل العميل
داخل النظام عبر:
1. وضع علامة ✓ على "أوافق على العقد والشروط"
2. الضغط على زر "اعتماد العقد"

═══════════════════════════════════════════════════════════════
  `.trim();

  return [header, clauses, orderSummary, acknowledgments, footer].join("\n\n");
}

/**
 * بيانات تسجيل الموافقة
 */
export interface ContractApprovalRecord {
  contract_id: string;
  application_id: string;
  user_id: string;
  approved_at: string; // ISO timestamp
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  checkbox_accepted: boolean;
  button_clicked: boolean;
  contract_version: string;
  contract_hash?: string;
}

/**
 * تحقق من اكتمال الموافقة على العقد
 */
export function validateContractApproval(record: Partial<ContractApprovalRecord>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!record.application_id) {
    errors.push("رقم الطلب مطلوب");
  }
  if (!record.user_id) {
    errors.push("معرف المستخدم مطلوب");
  }
  if (!record.checkbox_accepted) {
    errors.push("يجب وضع علامة الموافقة على العقد");
  }
  if (!record.button_clicked) {
    errors.push("يجب الضغط على زر اعتماد العقد");
  }
  if (!record.approved_at) {
    errors.push("تاريخ الموافقة مطلوب");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * تنسيق المبالغ بالريال السعودي
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Default mock data for preview
 */
export function getDefaultContractData(): ContractPlaceholders {
  return {
    customer_name: "{{اسم العميل}}",
    customer_national_id: "{{رقم الهوية}}",
    customer_phone: "{{رقم الجوال}}",
    customer_email: "{{البريد الإلكتروني}}",
    order_id: "{{معرف الطلب}}",
    application_number: "FIN-XXXXXX",
    application_date: new Date().toLocaleDateString("ar-SA"),
    services_table: [
      { name: "{{اسم الخدمة 1}}", price: 0, quantity: 1, total: 0 },
    ],
    total_services_value: 0,
    admin_fees: 0,
    vat_amount: 0,
    total_amount: 0,
    financed_amount: 0,
    installments_count: 0,
    installment_amount: 0,
    first_due_date: "{{تاريخ أول قسط}}",
    last_due_date: "{{تاريخ آخر قسط}}",
    installments_schedule: [],
    service_provider: COMPANY_INFO.name,
  };
}
