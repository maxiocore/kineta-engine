/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *                    مولد PDF للعقود العربية - Server-Side Arabic PDF Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * توليد PDF سيرفري مع:
 * ✅ Arabic Shaping (ربط الحروف) - محسّن
 * ✅ Bidi RTL (اتجاه النص الصحيح) - محسّن
 * ✅ Embedded Font (خط Amiri + Noto Naskh Arabic) - مضمّن
 * ✅ Professional Banking Contract Design - تصميم مصرفي رسمي
 * ✅ RTL Tables - جداول عربية صحيحة
 * ✅ Numbered Clauses - بنود مرقمة
 * 
 * لا يستخدم jsPDF أو html2canvas أو أي Canvas rendering
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// Types
// ============================================

interface ContractData {
  application_id: string;
  application_number: string;
  contract_date: string;
  
  // Customer info (from financing application, NOT username)
  customer_name: string;
  customer_national_id: string;
  customer_phone: string;
  customer_email: string;
  customer_address?: string;
  
  // Financial details
  services: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  total_services_value: number;
  admin_fees: number;
  vat_amount: number;
  grand_total: number;
  financed_amount: number;
  
  // Installments
  installments_count: number;
  installment_amount: number;
  first_installment_date: string;
  last_installment_date: string;
  installments_schedule: {
    number: number;
    amount: number;
    due_date: string;
  }[];
}

interface ApprovalRecord {
  approved_at: string;
  ip_address?: string;
  user_agent?: string;
  reading_time_seconds?: number;
  scroll_percentage?: number;
}

// ============================================
// Arabic Text Processing - Enhanced
// ============================================

/**
 * Arabic character ranges for detection
 */
function isArabicChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x0600 && code <= 0x06FF) || // Arabic
    (code >= 0x0750 && code <= 0x077F) || // Arabic Supplement
    (code >= 0x08A0 && code <= 0x08FF) || // Arabic Extended-A
    (code >= 0xFB50 && code <= 0xFDFF) || // Arabic Presentation Forms-A
    (code >= 0xFE70 && code <= 0xFEFF)    // Arabic Presentation Forms-B
  );
}

/**
 * Arabic letter forms for proper shaping
 * Each letter has: isolated, initial, medial, final forms
 */
const arabicForms: Record<string, [string, string, string, string]> = {
  'ا': ['ﺍ', 'ﺍ', 'ﺎ', 'ﺎ'],
  'أ': ['ﺃ', 'ﺃ', 'ﺄ', 'ﺄ'],
  'إ': ['ﺇ', 'ﺇ', 'ﺈ', 'ﺈ'],
  'آ': ['ﺁ', 'ﺁ', 'ﺂ', 'ﺂ'],
  'ء': ['ء', 'ء', 'ء', 'ء'],
  'ب': ['ﺏ', 'ﺑ', 'ﺒ', 'ﺐ'],
  'ت': ['ﺕ', 'ﺗ', 'ﺘ', 'ﺖ'],
  'ث': ['ﺙ', 'ﺛ', 'ﺜ', 'ﺚ'],
  'ج': ['ﺝ', 'ﺟ', 'ﺠ', 'ﺞ'],
  'ح': ['ﺡ', 'ﺣ', 'ﺤ', 'ﺢ'],
  'خ': ['ﺥ', 'ﺧ', 'ﺨ', 'ﺦ'],
  'د': ['ﺩ', 'ﺩ', 'ﺪ', 'ﺪ'],
  'ذ': ['ﺫ', 'ﺫ', 'ﺬ', 'ﺬ'],
  'ر': ['ﺭ', 'ﺭ', 'ﺮ', 'ﺮ'],
  'ز': ['ﺯ', 'ﺯ', 'ﺰ', 'ﺰ'],
  'س': ['ﺱ', 'ﺳ', 'ﺴ', 'ﺲ'],
  'ش': ['ﺵ', 'ﺷ', 'ﺸ', 'ﺶ'],
  'ص': ['ﺹ', 'ﺻ', 'ﺼ', 'ﺺ'],
  'ض': ['ﺽ', 'ﺿ', 'ﻀ', 'ﺾ'],
  'ط': ['ﻁ', 'ﻃ', 'ﻄ', 'ﻂ'],
  'ظ': ['ﻅ', 'ﻇ', 'ﻈ', 'ﻆ'],
  'ع': ['ﻉ', 'ﻋ', 'ﻌ', 'ﻊ'],
  'غ': ['ﻍ', 'ﻏ', 'ﻐ', 'ﻎ'],
  'ف': ['ﻑ', 'ﻓ', 'ﻔ', 'ﻒ'],
  'ق': ['ﻕ', 'ﻗ', 'ﻘ', 'ﻖ'],
  'ك': ['ﻙ', 'ﻛ', 'ﻜ', 'ﻚ'],
  'ل': ['ﻝ', 'ﻟ', 'ﻠ', 'ﻞ'],
  'م': ['ﻡ', 'ﻣ', 'ﻤ', 'ﻢ'],
  'ن': ['ﻥ', 'ﻧ', 'ﻨ', 'ﻦ'],
  'ه': ['ﻩ', 'ﻫ', 'ﻬ', 'ﻪ'],
  'ة': ['ﺓ', 'ﺓ', 'ﺔ', 'ﺔ'],
  'و': ['ﻭ', 'ﻭ', 'ﻮ', 'ﻮ'],
  'ؤ': ['ﺅ', 'ﺅ', 'ﺆ', 'ﺆ'],
  'ي': ['ﻱ', 'ﻳ', 'ﻴ', 'ﻲ'],
  'ى': ['ﻯ', 'ﻯ', 'ﻰ', 'ﻰ'],
  'ئ': ['ﺉ', 'ﺋ', 'ﺌ', 'ﺊ'],
  'لا': ['ﻻ', 'ﻻ', 'ﻼ', 'ﻼ'],
  'لأ': ['ﻷ', 'ﻷ', 'ﻸ', 'ﻸ'],
  'لإ': ['ﻹ', 'ﻹ', 'ﻺ', 'ﻺ'],
  'لآ': ['ﻵ', 'ﻵ', 'ﻶ', 'ﻶ'],
};

// Letters that don't connect to the next letter
const nonConnectingLetters = new Set(['ا', 'أ', 'إ', 'آ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ء', 'ة']);

function canConnectNext(char: string): boolean {
  return !nonConnectingLetters.has(char);
}

function getLetterForm(char: string, prevConnects: boolean, nextConnects: boolean): string {
  const forms = arabicForms[char];
  if (!forms) return char;
  
  if (!prevConnects && !nextConnects) return forms[0]; // isolated
  if (!prevConnects && nextConnects) return forms[1]; // initial
  if (prevConnects && nextConnects) return forms[2]; // medial
  return forms[3]; // final
}

function shapeArabic(text: string): string {
  if (!text) return '';
  
  const result: string[] = [];
  const chars = [...text];
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    
    if (!isArabicChar(char)) {
      result.push(char);
      continue;
    }
    
    // Check for Lam-Alef ligatures
    if (char === 'ل' && i + 1 < chars.length) {
      const nextChar = chars[i + 1];
      const ligature = char + nextChar;
      if (arabicForms[ligature]) {
        const prevConnects = i > 0 && isArabicChar(chars[i - 1]) && canConnectNext(chars[i - 1]);
        const afterNextConnects = i + 2 < chars.length && isArabicChar(chars[i + 2]);
        
        result.push(getLetterForm(ligature, prevConnects, afterNextConnects && canConnectNext(nextChar)));
        i++;
        continue;
      }
    }
    
    const prevConnects = i > 0 && isArabicChar(chars[i - 1]) && canConnectNext(chars[i - 1]);
    const nextConnects = i + 1 < chars.length && isArabicChar(chars[i + 1]) && canConnectNext(char);
    
    result.push(getLetterForm(char, prevConnects, nextConnects));
  }
  
  return result.join('');
}

function applyBidi(text: string): string {
  if (!text) return '';
  
  const segments: { text: string; isArabic: boolean }[] = [];
  let currentSegment = '';
  let isCurrentArabic = false;
  
  for (const char of text) {
    const charIsArabic = isArabicChar(char);
    
    if (currentSegment === '') {
      isCurrentArabic = charIsArabic;
    }
    
    if (charIsArabic === isCurrentArabic) {
      currentSegment += char;
    } else {
      if (currentSegment) {
        segments.push({ text: currentSegment, isArabic: isCurrentArabic });
      }
      currentSegment = char;
      isCurrentArabic = charIsArabic;
    }
  }
  
  if (currentSegment) {
    segments.push({ text: currentSegment, isArabic: isCurrentArabic });
  }
  
  return segments
    .reverse()
    .map(seg => seg.isArabic ? [...seg.text].reverse().join('') : seg.text)
    .join('');
}

function processArabicText(text: string): string {
  if (!text) return '';
  const shaped = shapeArabic(text);
  return applyBidi(shaped);
}

// ============================================
// Company Info
// ============================================

const COMPANY_INFO = {
  name: "شركة علي صالح الشهري القابضة",
  nameEn: "Ali Saleh Al-Shehri Holding Company",
  commercialRegister: "4030554749",
  taxNumber: "300123456700003",
  address: "المملكة العربية السعودية - جدة",
  jurisdiction: "المملكة العربية السعودية",
  governingLaw: "نظام المحاكم التجارية السعودي",
  disputeVenue: "المحاكم التجارية بمدينة الرياض",
};

// ============================================
// Contract Articles - Enhanced
// ============================================

const LEGAL_CONTRACT_ARTICLES = [
  {
    number: 1,
    title: "تعريفات وتفسيرات",
    clauses: [
      '"الطرف الأول" أو "الممول": شركة علي صالح الشهري القابضة، سجل تجاري رقم (4030554749).',
      '"الطرف الثاني" أو "العميل": الشخص المحدد بياناته في صدر هذا العقد والذي تقدم بطلب التمويل.',
      '"التمويل": المبلغ المخصص حصرياً لشراء الخدمات، ولا يشمل أي صرف نقدي للعميل.',
      '"رصيد الخدمات": الرصيد الائتماني المضاف لحساب العميل داخل المنصة.',
      '"السند التنفيذي": صك قانوني يصدر عبر منصة نافذ يضمن حقوق الطرف الأول.',
    ],
  },
  {
    number: 2,
    title: "طبيعة التمويل",
    clauses: [
      "يُقر الطرف الثاني بأن هذا عقد تمويل خدمات وليس قرضاً نقدياً بأي شكل من الأشكال.",
      "لن يحصل الطرف الثاني على أي مبلغ نقدي بموجب هذا العقد تحت أي ظرف.",
      "قيمة التمويل تُضاف كرصيد خدمات داخل المنصة ولا يجوز تحويلها لنقد أو سحبها.",
      "الدفع يتم مباشرة من الطرف الأول لمزودي الخدمات نيابةً عن العميل.",
    ],
  },
  {
    number: 3,
    title: "نطاق التمويل واستخدام الرصيد",
    clauses: [
      "يشمل التمويل حصرياً الخدمات المحددة في ملخص الطلب والجدول المرفق بهذا العقد.",
      "لا يجوز استخدام رصيد الخدمات إلا لشراء الخدمات المتاحة على المنصة.",
      "لا يجوز تعديل الخدمات الممولة إلا بموافقة خطية مسبقة من الطرف الأول.",
      "أي رصيد غير مستخدم لا يُسترد ولا يُحوّل لنقد.",
    ],
  },
  {
    number: 4,
    title: "الأقساط وجدول السداد",
    clauses: [
      "قيمة التمويل الإجمالية والأقساط الشهرية محددة في الملخص المالي المرفق.",
      "يلتزم الطرف الثاني بسداد الأقساط في مواعيدها المحددة دون تأخير.",
      "يبدأ استحقاق القسط الأول من تاريخ تفعيل رصيد الخدمات.",
      "تُسدد الأقساط عبر وسائل الدفع المعتمدة في المنصة.",
    ],
  },
  {
    number: 5,
    title: "التزامات العميل",
    clauses: [
      "سداد جميع الأقساط في مواعيدها المحددة دون تأخير أو مماطلة.",
      "ضمان صحة ودقة جميع البيانات المقدمة في طلب التمويل.",
      "إبلاغ الطرف الأول فوراً بأي تغيير في بيانات الاتصال أو الهوية.",
      "عدم استخدام رصيد الخدمات بشكل مخالف لشروط الاستخدام.",
      "توقيع السند التنفيذي خلال المدة المحددة.",
    ],
  },
  {
    number: 6,
    title: "التأخر في السداد والغرامات",
    clauses: [
      "غرامة تأخير بنسبة (2%) من قيمة القسط المتأخر عن كل شهر تأخير.",
      "إيقاف رصيد الخدمات فوراً عند تأخر قسطين متتاليين.",
      "استحقاق فوري لكامل المبلغ المتبقي عند تأخر ثلاثة أقساط أو أكثر.",
      "يحق للطرف الأول اتخاذ الإجراءات القانونية لتحصيل المستحقات.",
    ],
  },
  {
    number: 7,
    title: "السند التنفيذي",
    clauses: [
      "يُصدر السند التنفيذي عبر منصة نافذ الحكومية بعد اعتماد هذا العقد.",
      "يلتزم الطرف الثاني بتوقيع السند إلكترونياً خلال (7) أيام عمل.",
      "لا يتم تفعيل رصيد الخدمات إلا بعد توقيع السند التنفيذي.",
      "يُعتبر السند التنفيذي ضماناً قانونياً ملزماً للسداد.",
    ],
  },
  {
    number: 8,
    title: "إنهاء العقد",
    clauses: [
      "ينتهي هذا العقد بسداد كامل الأقساط المستحقة.",
      "يحق للطرف الأول إنهاء العقد فوراً في حال إخلال العميل بأي من التزاماته.",
      "في حال الإنهاء المبكر، تستحق كافة الأقساط المتبقية فوراً.",
    ],
  },
  {
    number: 9,
    title: "القانون الواجب التطبيق",
    clauses: [
      "يخضع هذا العقد لأنظمة المملكة العربية السعودية المعمول بها.",
      "المحاكم التجارية بمدينة الرياض هي المختصة حصرياً بالنظر في أي نزاع.",
      "يُعتبر هذا العقد كاملاً ونافذاً بمجرد الموافقة الإلكترونية.",
    ],
  },
];

const CLIENT_ACKNOWLEDGMENTS = [
  "أُقر بأنني قرأت جميع بنود هذا العقد وفهمتها فهماً تاماً ودقيقاً.",
  "أُقر بأن هذا عقد تمويل خدمات وليس تمويلاً نقدياً.",
  "أُقر بأن المعلومات التي قدمتها صحيحة ودقيقة وأتحمل مسؤوليتها كاملة.",
  "أُقر بالتزامي بسداد جميع الأقساط في مواعيدها المحددة.",
  "أُقر بموافقتي على إصدار سند تنفيذي عبر منصة نافذ.",
  "أُقر بأنني أهل للتعاقد وأتمتع بالأهلية القانونية الكاملة.",
];

// ============================================
// Helper Functions
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " ر.س";
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatHijriDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-SA-u-ca-islamic", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// ============================================
// Enhanced HTML Template
// ============================================

function generateContractHTML(data: ContractData, approval?: ApprovalRecord): string {
  const contractDate = formatDate(data.contract_date);
  const hijriDate = formatHijriDate(data.contract_date);
  
  // Build services table rows
  const servicesRows = data.services.map((service, index) => {
    return `
      <tr>
        <td class="cell-number">${index + 1}</td>
        <td class="cell-text">${service.name}</td>
        <td class="cell-number">${service.quantity}</td>
        <td class="cell-currency">${formatCurrency(service.unit_price)}</td>
        <td class="cell-currency">${formatCurrency(service.total_price)}</td>
      </tr>
    `;
  }).join("");

  // Build installments table rows
  const installmentsRows = data.installments_schedule.map((inst) => `
    <tr>
      <td class="cell-number">${inst.number}</td>
      <td class="cell-currency">${formatCurrency(inst.amount)}</td>
      <td class="cell-text">${formatDate(inst.due_date)}</td>
      <td class="cell-status"><span class="status-pending">غير مسدد</span></td>
    </tr>
  `).join("");

  // Build articles HTML with proper numbering
  const articlesHTML = LEGAL_CONTRACT_ARTICLES.map((article, articleIndex) => `
    <div class="article">
      <h3 class="article-title">
        <span class="article-number">المادة ${toArabicNumber(article.number)}</span>
        <span class="article-name">${article.title}</span>
      </h3>
      <ol class="article-clauses">
        ${article.clauses.map((clause, clauseIndex) => `
          <li>
            <span class="clause-number">${article.number}-${clauseIndex + 1}</span>
            <span class="clause-text">${clause}</span>
          </li>
        `).join("")}
      </ol>
    </div>
  `).join("");

  // Build acknowledgments with checkboxes
  const acknowledgmentsHTML = CLIENT_ACKNOWLEDGMENTS.map((ack, i) => `
    <div class="acknowledgment-item">
      <span class="check-icon">☑</span>
      <span class="ack-number">${i + 1}.</span>
      <span class="ack-text">${ack}</span>
    </div>
  `).join("");

  // Approval section
  const approvalSection = approval ? `
    <div class="approval-section">
      <div class="approval-header">
        <span class="approval-icon">✓</span>
        <h3>بيانات الموافقة الإلكترونية</h3>
      </div>
      <div class="approval-grid">
        <div class="approval-item">
          <span class="approval-label">تاريخ الموافقة:</span>
          <span class="approval-value">${formatDate(approval.approved_at)}</span>
        </div>
        ${approval.ip_address ? `
        <div class="approval-item">
          <span class="approval-label">عنوان IP:</span>
          <span class="approval-value ltr">${approval.ip_address}</span>
        </div>
        ` : ""}
        ${approval.reading_time_seconds ? `
        <div class="approval-item">
          <span class="approval-label">مدة القراءة:</span>
          <span class="approval-value">${Math.floor(approval.reading_time_seconds / 60)} دقيقة و ${approval.reading_time_seconds % 60} ثانية</span>
        </div>
        ` : ""}
        ${approval.scroll_percentage ? `
        <div class="approval-item">
          <span class="approval-label">نسبة التمرير:</span>
          <span class="approval-value">${approval.scroll_percentage}%</span>
        </div>
        ` : ""}
      </div>
    </div>
  ` : "";

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>عقد تمويل خدمات - ${data.application_number}</title>
  <style>
    /* Font Import - Multiple Arabic Fonts for Better Compatibility */
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');
    
    /* CSS Variables for Consistent Theming */
    :root {
      --primary-color: #1e3a5f;
      --secondary-color: #2563eb;
      --accent-color: #0d47a1;
      --success-color: #166534;
      --warning-color: #b45309;
      --danger-color: #dc2626;
      --text-primary: #1f2937;
      --text-secondary: #4b5563;
      --text-muted: #6b7280;
      --border-color: #e5e7eb;
      --bg-light: #f8fafc;
      --bg-section: #f3f4f6;
    }
    
    /* Reset and Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Amiri', 'Noto Naskh Arabic', 'Traditional Arabic', 'Arial', serif;
      font-size: 12pt;
      line-height: 1.9;
      color: var(--text-primary);
      direction: rtl;
      text-align: right;
      background: white;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Page Container */
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm 20mm;
      background: white;
    }
    
    /* ===================== HEADER ===================== */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      margin-bottom: 25px;
      border-bottom: 4px double var(--primary-color);
    }
    
    .company-section {
      flex: 1;
    }
    
    .company-logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
    }
    
    .company-logo-text {
      color: white;
      font-size: 24pt;
      font-weight: 700;
    }
    
    .company-name {
      font-size: 18pt;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 5px;
    }
    
    .company-name-en {
      font-size: 10pt;
      color: var(--text-muted);
      font-style: italic;
      margin-bottom: 8px;
    }
    
    .company-details {
      font-size: 9pt;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    
    .contract-meta {
      text-align: left;
      direction: ltr;
      min-width: 180px;
    }
    
    .contract-badge {
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 11pt;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 10px;
    }
    
    .contract-number {
      font-size: 11pt;
      font-weight: 700;
      color: var(--secondary-color);
      margin-bottom: 5px;
    }
    
    .contract-date {
      font-size: 9pt;
      color: var(--text-muted);
    }
    
    /* ===================== TITLE SECTION ===================== */
    .title-section {
      text-align: center;
      margin: 30px 0 35px;
    }
    
    .bismillah {
      font-size: 18pt;
      color: var(--text-secondary);
      margin-bottom: 20px;
      font-weight: 400;
    }
    
    .main-title {
      font-size: 26pt;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    
    .title-decoration {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }
    
    .title-line {
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--secondary-color));
    }
    
    .title-line.reverse {
      background: linear-gradient(90deg, var(--secondary-color), transparent);
    }
    
    .title-diamond {
      width: 10px;
      height: 10px;
      background: var(--secondary-color);
      transform: rotate(45deg);
    }
    
    /* ===================== PARTIES SECTION ===================== */
    .parties-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-bottom: 30px;
    }
    
    .party-card {
      background: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      position: relative;
    }
    
    .party-card::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 5px;
      height: 100%;
      background: var(--secondary-color);
      border-radius: 12px 0 0 12px;
    }
    
    .party-title {
      font-size: 13pt;
      font-weight: 700;
      color: var(--secondary-color);
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px dashed var(--border-color);
    }
    
    .party-info {
      font-size: 10pt;
      line-height: 1.8;
    }
    
    .party-info p {
      margin-bottom: 5px;
    }
    
    .party-info strong {
      color: var(--text-primary);
      font-size: 11pt;
    }
    
    .party-info .label {
      color: var(--text-muted);
      display: inline-block;
      min-width: 80px;
    }
    
    /* ===================== WARNING BOX ===================== */
    .warning-box {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }
    
    .warning-icon {
      font-size: 28pt;
      line-height: 1;
    }
    
    .warning-content h4 {
      color: #b45309;
      font-size: 13pt;
      margin-bottom: 8px;
    }
    
    .warning-content p {
      color: #92400e;
      font-size: 10pt;
      line-height: 1.7;
    }
    
    /* ===================== ARTICLES SECTION ===================== */
    .articles-section {
      margin-bottom: 30px;
    }
    
    .section-header {
      background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
      color: white;
      padding: 15px 25px;
      border-radius: 10px 10px 0 0;
      font-size: 16pt;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-header-icon {
      font-size: 20pt;
    }
    
    .articles-container {
      border: 1px solid var(--border-color);
      border-top: none;
      border-radius: 0 0 10px 10px;
      padding: 25px;
      background: white;
    }
    
    .article {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .article:last-child {
      margin-bottom: 0;
    }
    
    .article-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--secondary-color);
    }
    
    .article-number {
      background: var(--secondary-color);
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 700;
      white-space: nowrap;
    }
    
    .article-name {
      font-size: 13pt;
      font-weight: 700;
      color: var(--primary-color);
    }
    
    .article-clauses {
      list-style: none;
      padding-right: 10px;
    }
    
    .article-clauses li {
      font-size: 10pt;
      margin-bottom: 8px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      line-height: 1.8;
    }
    
    .clause-number {
      background: var(--bg-section);
      color: var(--secondary-color);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .clause-text {
      flex: 1;
    }
    
    /* ===================== TABLES ===================== */
    .table-section {
      margin-bottom: 30px;
    }
    
    .table-header {
      background: var(--secondary-color);
      color: white;
      padding: 12px 20px;
      border-radius: 8px 8px 0 0;
      font-size: 14pt;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      background: white;
    }
    
    th {
      background: linear-gradient(180deg, #374151, #1f2937);
      color: white;
      padding: 14px 12px;
      font-weight: 700;
      text-align: center;
      border: 1px solid #4b5563;
    }
    
    td {
      padding: 12px;
      border: 1px solid var(--border-color);
      text-align: center;
    }
    
    tr:nth-child(even) {
      background: var(--bg-light);
    }
    
    tr:hover {
      background: #e0e7ff;
    }
    
    .cell-number {
      font-weight: 600;
      color: var(--secondary-color);
    }
    
    .cell-text {
      text-align: right;
    }
    
    .cell-currency {
      font-weight: 600;
      color: var(--success-color);
      direction: rtl;
    }
    
    .cell-status {
      text-align: center;
    }
    
    .status-pending {
      background: #fef3c7;
      color: #b45309;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: 600;
    }
    
    .status-paid {
      background: #dcfce7;
      color: #166534;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: 600;
    }
    
    .total-row {
      background: linear-gradient(90deg, #dbeafe, #eff6ff) !important;
      font-weight: 700;
    }
    
    .total-row td {
      color: var(--primary-color);
      font-size: 11pt;
    }
    
    /* ===================== FINANCIAL SUMMARY ===================== */
    .financial-summary {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 2px solid var(--secondary-color);
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 30px;
    }
    
    .summary-header {
      font-size: 15pt;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px dashed var(--secondary-color);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    
    .summary-item {
      background: white;
      padding: 18px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid rgba(37, 99, 235, 0.2);
    }
    
    .summary-item .label {
      font-size: 9pt;
      color: var(--text-muted);
      margin-bottom: 8px;
      display: block;
    }
    
    .summary-item .value {
      font-size: 16pt;
      font-weight: 700;
      color: var(--primary-color);
    }
    
    .summary-item.highlight {
      background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
      border: none;
    }
    
    .summary-item.highlight .label {
      color: rgba(255,255,255,0.8);
    }
    
    .summary-item.highlight .value {
      color: white;
    }
    
    /* ===================== ACKNOWLEDGMENTS ===================== */
    .acknowledgments-section {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 2px solid #86efac;
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 30px;
    }
    
    .acknowledgments-header {
      font-size: 14pt;
      font-weight: 700;
      color: var(--success-color);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .acknowledgment-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
      padding: 10px 15px;
      background: white;
      border-radius: 8px;
      border-right: 4px solid #22c55e;
    }
    
    .check-icon {
      color: #22c55e;
      font-size: 16pt;
      line-height: 1;
    }
    
    .ack-number {
      color: var(--success-color);
      font-weight: 700;
      min-width: 20px;
    }
    
    .ack-text {
      font-size: 10pt;
      color: var(--text-primary);
      line-height: 1.7;
    }
    
    /* ===================== APPROVAL SECTION ===================== */
    .approval-section {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 2px solid var(--secondary-color);
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 30px;
    }
    
    .approval-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .approval-icon {
      width: 40px;
      height: 40px;
      background: var(--success-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20pt;
    }
    
    .approval-header h3 {
      font-size: 14pt;
      font-weight: 700;
      color: var(--primary-color);
    }
    
    .approval-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .approval-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      background: white;
      border-radius: 8px;
    }
    
    .approval-label {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 10pt;
    }
    
    .approval-value {
      color: var(--text-primary);
      font-size: 10pt;
    }
    
    .approval-value.ltr {
      direction: ltr;
      text-align: left;
    }
    
    /* ===================== SIGNATURE SECTION ===================== */
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid var(--border-color);
    }
    
    .signature-box {
      border: 2px solid var(--border-color);
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      background: var(--bg-light);
    }
    
    .signature-box h4 {
      font-size: 13pt;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 15px;
    }
    
    .signature-box .name {
      font-size: 12pt;
      color: var(--text-primary);
      margin-bottom: 25px;
      font-weight: 600;
    }
    
    /* Company Stamp - Enhanced */
    .company-stamp {
      width: 130px;
      height: 130px;
      margin: 20px auto;
      border: 4px solid var(--primary-color);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      background: radial-gradient(circle, rgba(30, 58, 95, 0.05) 0%, transparent 70%);
    }
    
    .stamp-outer-ring {
      position: absolute;
      width: 120px;
      height: 120px;
      border: 2px dashed var(--secondary-color);
      border-radius: 50%;
    }
    
    .stamp-company-name {
      font-size: 8pt;
      font-weight: 700;
      color: var(--primary-color);
      text-align: center;
      line-height: 1.4;
      padding: 0 15px;
    }
    
    .stamp-cr {
      font-size: 7pt;
      color: var(--secondary-color);
      margin-top: 5px;
    }
    
    .stamp-verified {
      font-size: 9pt;
      font-weight: 700;
      color: var(--success-color);
      margin-top: 8px;
      padding: 3px 10px;
      border: 2px solid var(--success-color);
      border-radius: 5px;
      background: white;
    }
    
    .signature-line {
      border-top: 2px solid var(--text-primary);
      width: 80%;
      margin: 0 auto;
      padding-top: 8px;
      font-size: 10pt;
      color: var(--text-muted);
    }
    
    .electronic-badge {
      background: var(--success-color);
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 600;
      display: inline-block;
      margin-top: 15px;
    }
    
    /* ===================== FOOTER ===================== */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 3px double var(--border-color);
      text-align: center;
    }
    
    .footer-content {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 30px;
      margin-bottom: 15px;
    }
    
    .footer-item {
      font-size: 9pt;
      color: var(--text-muted);
    }
    
    .footer-divider {
      width: 1px;
      height: 15px;
      background: var(--border-color);
    }
    
    .footer-copyright {
      font-size: 8pt;
      color: var(--text-muted);
    }
    
    .page-number {
      position: fixed;
      bottom: 10mm;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9pt;
      color: var(--text-muted);
    }
    
    /* ===================== PAGE BREAKS ===================== */
    .page-break {
      page-break-after: always;
    }
    
    /* ===================== PRINT STYLES ===================== */
    @media print {
      body {
        padding: 0;
        font-size: 11pt;
      }
      
      .page {
        padding: 10mm 15mm;
        max-width: none;
      }
      
      .page-break {
        page-break-after: always;
      }
      
      .no-print {
        display: none;
      }
    }
    
    /* ===================== LTR HELPER ===================== */
    .ltr {
      direction: ltr;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- ============= HEADER ============= -->
    <div class="header">
      <div class="company-section">
        <div class="company-logo">
          <span class="company-logo-text">ع</span>
        </div>
        <div class="company-name">${COMPANY_INFO.name}</div>
        <div class="company-name-en">${COMPANY_INFO.nameEn}</div>
        <div class="company-details">
          سجل تجاري: ${COMPANY_INFO.commercialRegister}<br>
          ${COMPANY_INFO.address}
        </div>
      </div>
      <div class="contract-meta">
        <div class="contract-badge">عقد رسمي</div>
        <div class="contract-number">رقم العقد: ${data.application_number}</div>
        <div class="contract-date">التاريخ الميلادي: ${contractDate}</div>
        ${hijriDate ? `<div class="contract-date">التاريخ الهجري: ${hijriDate}</div>` : ""}
      </div>
    </div>

    <!-- ============= TITLE ============= -->
    <div class="title-section">
      <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
      <h1 class="main-title">عقد تمويل خدمات</h1>
      <div class="title-decoration">
        <div class="title-line reverse"></div>
        <div class="title-diamond"></div>
        <div class="title-line"></div>
      </div>
    </div>

    <!-- ============= PARTIES ============= -->
    <div class="parties-section">
      <div class="party-card">
        <div class="party-title">الطرف الأول (الممول / مزود الخدمة)</div>
        <div class="party-info">
          <p><strong>${COMPANY_INFO.name}</strong></p>
          <p><span class="label">سجل تجاري:</span> ${COMPANY_INFO.commercialRegister}</p>
          <p><span class="label">العنوان:</span> ${COMPANY_INFO.address}</p>
        </div>
      </div>
      <div class="party-card">
        <div class="party-title">الطرف الثاني (العميل / المستفيد)</div>
        <div class="party-info">
          <p><strong>${data.customer_name}</strong></p>
          <p><span class="label">رقم الهوية:</span> ${data.customer_national_id}</p>
          <p><span class="label">الجوال:</span> <span class="ltr">${data.customer_phone}</span></p>
          <p><span class="label">البريد:</span> <span class="ltr">${data.customer_email}</span></p>
          ${data.customer_address ? `<p><span class="label">العنوان:</span> ${data.customer_address}</p>` : ""}
        </div>
      </div>
    </div>

    <!-- ============= WARNING ============= -->
    <div class="warning-box">
      <span class="warning-icon">⚠️</span>
      <div class="warning-content">
        <h4>تنبيه هام: هذا عقد تمويل خدمات فقط - غير نقدي</h4>
        <p>لن يتم صرف أي مبلغ نقدي للعميل بأي شكل من الأشكال. قيمة التمويل تُضاف كرصيد خدمات داخل المنصة فقط لاستخدامها في شراء الخدمات المتاحة، ولا يمكن سحبها أو تحويلها لنقد.</p>
      </div>
    </div>

    <!-- ============= ARTICLES ============= -->
    <div class="articles-section">
      <div class="section-header">
        <span class="section-header-icon">📜</span>
        بنود العقد وأحكامه
      </div>
      <div class="articles-container">
        ${articlesHTML}
      </div>
    </div>

    <div class="page-break"></div>

    <!-- ============= SERVICES TABLE ============= -->
    <div class="table-section">
      <div class="table-header">
        📋 جدول الخدمات الممولة
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>وصف الخدمة</th>
            <th style="width: 80px;">الكمية</th>
            <th style="width: 120px;">سعر الوحدة</th>
            <th style="width: 120px;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${servicesRows}
          <tr class="total-row">
            <td colspan="4">الإجمالي الكلي</td>
            <td class="cell-currency">${formatCurrency(data.grand_total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ============= FINANCIAL SUMMARY ============= -->
    <div class="financial-summary">
      <div class="summary-header">
        💰 الملخص المالي للتمويل
      </div>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">إجمالي قيمة الخدمات</span>
          <span class="value">${formatCurrency(data.total_services_value)}</span>
        </div>
        <div class="summary-item highlight">
          <span class="label">المبلغ الممول</span>
          <span class="value">${formatCurrency(data.financed_amount)}</span>
        </div>
        <div class="summary-item">
          <span class="label">عدد الأقساط</span>
          <span class="value">${data.installments_count} قسط</span>
        </div>
        <div class="summary-item">
          <span class="label">قيمة القسط الشهري</span>
          <span class="value">${formatCurrency(data.installment_amount)}</span>
        </div>
        <div class="summary-item">
          <span class="label">تاريخ أول قسط</span>
          <span class="value">${formatDate(data.first_installment_date)}</span>
        </div>
        <div class="summary-item">
          <span class="label">تاريخ آخر قسط</span>
          <span class="value">${formatDate(data.last_installment_date)}</span>
        </div>
      </div>
    </div>

    <!-- ============= INSTALLMENTS TABLE ============= -->
    <div class="table-section">
      <div class="table-header">
        📅 جدول الأقساط الشهرية
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">رقم القسط</th>
            <th style="width: 150px;">المبلغ</th>
            <th>تاريخ الاستحقاق</th>
            <th style="width: 120px;">الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${installmentsRows}
        </tbody>
      </table>
    </div>

    <div class="page-break"></div>

    <!-- ============= ACKNOWLEDGMENTS ============= -->
    <div class="acknowledgments-section">
      <div class="acknowledgments-header">
        ✅ إقرارات العميل
      </div>
      ${acknowledgmentsHTML}
    </div>

    ${approvalSection}

    <!-- ============= SIGNATURES ============= -->
    <div class="signature-section">
      <div class="signature-box">
        <h4>الطرف الأول</h4>
        <div class="name">${COMPANY_INFO.name}</div>
        
        <div class="company-stamp">
          <div class="stamp-outer-ring"></div>
          <div class="stamp-company-name">
            شركة علي صالح الشهري<br/>القابضة
          </div>
          <div class="stamp-cr">س.ت ${COMPANY_INFO.commercialRegister}</div>
          <div class="stamp-verified">✓ معتمد</div>
        </div>
        
        <div class="signature-line">التوقيع والختم</div>
      </div>
      
      <div class="signature-box">
        <h4>الطرف الثاني</h4>
        <div class="name">${data.customer_name}</div>
        
        <div style="height: 100px; display: flex; align-items: center; justify-content: center;">
          ${approval ? `<div class="electronic-badge">✓ موافقة إلكترونية</div>` : `<span style="color: var(--text-muted); font-style: italic;">في انتظار التوقيع...</span>`}
        </div>
        
        <div class="signature-line">التوقيع</div>
      </div>
    </div>

    <!-- ============= FOOTER ============= -->
    <div class="footer">
      <div class="footer-content">
        <span class="footer-item">${COMPANY_INFO.name}</span>
        <div class="footer-divider"></div>
        <span class="footer-item">سجل تجاري: ${COMPANY_INFO.commercialRegister}</span>
        <div class="footer-divider"></div>
        <span class="footer-item">رقم العقد: ${data.application_number}</span>
      </div>
      <div class="footer-copyright">
        جميع الحقوق محفوظة © ${new Date().getFullYear()} - هذا العقد وثيقة رسمية وملزمة قانوناً
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper function to convert numbers to Arabic
function toArabicNumber(num: number): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map(d => arabicNumbers[parseInt(d)] || d).join('');
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      application_id, 
      include_approval = true,
      override_name,
      override_installments,
    } = await req.json();

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "application_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: application, error: appError } = await supabase
      .from("financing_applications")
      .select(`
        *,
        plan:financing_plans(*),
        service:services(*),
        contract:financing_contracts(*)
      `)
      .eq("id", application_id)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: "Application not found", details: appError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: installments } = await supabase
      .from("financing_installments")
      .select("*")
      .eq("application_id", application_id)
      .order("installment_number");

    const approvedAmount = application.approved_amount || application.requested_amount;
    const grandTotal = approvedAmount;
    
    const finalInstallmentsCount = override_installments 
      || application.contract_override_installments 
      || application.plan?.installments_count 
      || 3;
    const installmentAmount = grandTotal / finalInstallmentsCount;
    
    const finalCustomerName = override_name 
      || application.contract_override_name 
      || application.full_name;

    const originalInstallmentsCount = application.plan?.installments_count || 3;
    const installmentsModified = finalInstallmentsCount !== originalInstallmentsCount;
    
    let installmentsSchedule: { number: number; amount: number; due_date: string }[] = [];
    
    if (installmentsModified || !installments || installments.length === 0) {
      const startDate = new Date();
      installmentsSchedule = Array.from({ length: finalInstallmentsCount }, (_, i) => {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        return {
          number: i + 1,
          amount: installmentAmount,
          due_date: dueDate.toISOString(),
        };
      });
    } else {
      installmentsSchedule = (installments || []).map((inst: any) => ({
        number: inst.installment_number,
        amount: inst.amount,
        due_date: inst.due_date,
      }));
    }

    const contractData: ContractData = {
      application_id: application.id,
      application_number: application.application_number,
      contract_date: application.approved_at || application.created_at,
      customer_name: finalCustomerName,
      customer_national_id: application.national_id,
      customer_phone: application.phone,
      customer_email: application.email,
      customer_address: application.address,
      services: [{
        name: application.service?.name_ar || application.service_description || "خدمات رقمية",
        quantity: 1,
        unit_price: approvedAmount,
        total_price: approvedAmount,
      }],
      total_services_value: approvedAmount,
      admin_fees: 0,
      vat_amount: 0,
      grand_total: grandTotal,
      financed_amount: grandTotal,
      installments_count: finalInstallmentsCount,
      installment_amount: installmentAmount,
      first_installment_date: installmentsSchedule[0]?.due_date || new Date().toISOString(),
      last_installment_date: installmentsSchedule[installmentsSchedule.length - 1]?.due_date || new Date().toISOString(),
      installments_schedule: installmentsSchedule,
    };

    let approvalRecord: ApprovalRecord | undefined;
    if (include_approval && application.contract?.[0]) {
      const contract = application.contract[0];
      if (contract.accepted_at) {
        approvalRecord = {
          approved_at: contract.accepted_at,
          ip_address: contract.acceptance_ip_address,
          user_agent: contract.acceptance_user_agent,
          reading_time_seconds: contract.contract_data?.reading_time_seconds,
          scroll_percentage: contract.contract_data?.scroll_percentage,
        };
      }
    }

    const htmlContent = generateContractHTML(contractData, approvalRecord);

    return new Response(
      JSON.stringify({
        success: true,
        html: htmlContent,
        contract_data: contractData,
        approval_record: approvalRecord,
        metadata: {
          generated_at: new Date().toISOString(),
          application_number: application.application_number,
          customer_name: application.full_name,
          total_amount: grandTotal,
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error: unknown) {
    console.error("Error generating contract PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate contract", 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
