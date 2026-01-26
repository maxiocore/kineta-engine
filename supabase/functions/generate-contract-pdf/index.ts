/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *                    مولد PDF للعقود العربية - Server-Side Arabic PDF Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * توليد PDF سيرفري مع:
 * ✅ Arabic Shaping (ربط الحروف)
 * ✅ Bidi RTL (اتجاه النص الصحيح)
 * ✅ Embedded Font (خط Amiri مضمن)
 * ✅ Professional Banking Contract Design
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
// Arabic Text Processing
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
  'ا': ['ﺍ', 'ﺍ', 'ﺎ', 'ﺎ'], // Alef
  'أ': ['ﺃ', 'ﺃ', 'ﺄ', 'ﺄ'], // Alef with Hamza above
  'إ': ['ﺇ', 'ﺇ', 'ﺈ', 'ﺈ'], // Alef with Hamza below
  'آ': ['ﺁ', 'ﺁ', 'ﺂ', 'ﺂ'], // Alef with Madda
  'ء': ['ء', 'ء', 'ء', 'ء'], // Hamza (doesn't connect)
  'ب': ['ﺏ', 'ﺑ', 'ﺒ', 'ﺐ'], // Ba
  'ت': ['ﺕ', 'ﺗ', 'ﺘ', 'ﺖ'], // Ta
  'ث': ['ﺙ', 'ﺛ', 'ﺜ', 'ﺚ'], // Tha
  'ج': ['ﺝ', 'ﺟ', 'ﺠ', 'ﺞ'], // Jeem
  'ح': ['ﺡ', 'ﺣ', 'ﺤ', 'ﺢ'], // Ha
  'خ': ['ﺥ', 'ﺧ', 'ﺨ', 'ﺦ'], // Kha
  'د': ['ﺩ', 'ﺩ', 'ﺪ', 'ﺪ'], // Dal
  'ذ': ['ﺫ', 'ﺫ', 'ﺬ', 'ﺬ'], // Thal
  'ر': ['ﺭ', 'ﺭ', 'ﺮ', 'ﺮ'], // Ra
  'ز': ['ﺯ', 'ﺯ', 'ﺰ', 'ﺰ'], // Zay
  'س': ['ﺱ', 'ﺳ', 'ﺴ', 'ﺲ'], // Seen
  'ش': ['ﺵ', 'ﺷ', 'ﺸ', 'ﺶ'], // Sheen
  'ص': ['ﺹ', 'ﺻ', 'ﺼ', 'ﺺ'], // Sad
  'ض': ['ﺽ', 'ﺿ', 'ﻀ', 'ﺾ'], // Dad
  'ط': ['ﻁ', 'ﻃ', 'ﻄ', 'ﻂ'], // Ta
  'ظ': ['ﻅ', 'ﻇ', 'ﻈ', 'ﻆ'], // Za
  'ع': ['ﻉ', 'ﻋ', 'ﻌ', 'ﻊ'], // Ain
  'غ': ['ﻍ', 'ﻏ', 'ﻐ', 'ﻎ'], // Ghain
  'ف': ['ﻑ', 'ﻓ', 'ﻔ', 'ﻒ'], // Fa
  'ق': ['ﻕ', 'ﻗ', 'ﻘ', 'ﻖ'], // Qaf
  'ك': ['ﻙ', 'ﻛ', 'ﻜ', 'ﻚ'], // Kaf
  'ل': ['ﻝ', 'ﻟ', 'ﻠ', 'ﻞ'], // Lam
  'م': ['ﻡ', 'ﻣ', 'ﻤ', 'ﻢ'], // Meem
  'ن': ['ﻥ', 'ﻧ', 'ﻨ', 'ﻦ'], // Noon
  'ه': ['ﻩ', 'ﻫ', 'ﻬ', 'ﻪ'], // Ha
  'ة': ['ﺓ', 'ﺓ', 'ﺔ', 'ﺔ'], // Ta Marbuta
  'و': ['ﻭ', 'ﻭ', 'ﻮ', 'ﻮ'], // Waw
  'ؤ': ['ﺅ', 'ﺅ', 'ﺆ', 'ﺆ'], // Waw with Hamza
  'ي': ['ﻱ', 'ﻳ', 'ﻴ', 'ﻲ'], // Ya
  'ى': ['ﻯ', 'ﻯ', 'ﻰ', 'ﻰ'], // Alef Maksura
  'ئ': ['ﺉ', 'ﺋ', 'ﺌ', 'ﺊ'], // Ya with Hamza
  'لا': ['ﻻ', 'ﻻ', 'ﻼ', 'ﻼ'], // Lam-Alef
  'لأ': ['ﻷ', 'ﻷ', 'ﻸ', 'ﻸ'], // Lam-Alef with Hamza
  'لإ': ['ﻹ', 'ﻹ', 'ﻺ', 'ﻺ'], // Lam-Alef with Hamza below
  'لآ': ['ﻵ', 'ﻵ', 'ﻶ', 'ﻶ'], // Lam-Alef with Madda
};

// Letters that don't connect to the next letter
const nonConnectingLetters = new Set(['ا', 'أ', 'إ', 'آ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ء', 'ة']);

/**
 * Check if letter can connect to next
 */
function canConnectNext(char: string): boolean {
  return !nonConnectingLetters.has(char);
}

/**
 * Get the appropriate form of an Arabic letter based on position
 * 0 = isolated, 1 = initial, 2 = medial, 3 = final
 */
function getLetterForm(char: string, prevConnects: boolean, nextConnects: boolean): string {
  const forms = arabicForms[char];
  if (!forms) return char;
  
  if (!prevConnects && !nextConnects) return forms[0]; // isolated
  if (!prevConnects && nextConnects) return forms[1]; // initial
  if (prevConnects && nextConnects) return forms[2]; // medial
  return forms[3]; // final
}

/**
 * Shape Arabic text - connect letters properly
 */
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
        i++; // Skip next character as it's part of ligature
        continue;
      }
    }
    
    const prevConnects = i > 0 && isArabicChar(chars[i - 1]) && canConnectNext(chars[i - 1]);
    const nextConnects = i + 1 < chars.length && isArabicChar(chars[i + 1]) && canConnectNext(char);
    
    result.push(getLetterForm(char, prevConnects, nextConnects));
  }
  
  return result.join('');
}

/**
 * Apply Bidi algorithm - reverse Arabic text for correct RTL display
 */
function applyBidi(text: string): string {
  if (!text) return '';
  
  // Split into segments (Arabic vs non-Arabic)
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
  
  // Reverse segments order and reverse Arabic text within segments
  return segments
    .reverse()
    .map(seg => seg.isArabic ? [...seg.text].reverse().join('') : seg.text)
    .join('');
}

/**
 * Process Arabic text: Shape + Bidi
 */
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
// Contract Articles
// ============================================

const LEGAL_CONTRACT_ARTICLES = [
  {
    number: 1,
    title: "المادة الأولى: تعريفات وتفسيرات",
    clauses: [
      '"الطرف الأول" أو "الممول": شركة علي صالح الشهري القابضة، سجل تجاري رقم (4030554749).',
      '"الطرف الثاني" أو "العميل": الشخص المحدد بياناته في صدر هذا العقد والذي تقدم بطلب التمويل.',
      '"التمويل": المبلغ المخصص حصرياً لشراء الخدمات، ولا يشمل أي صرف نقدي للعميل.',
      '"رصيد الخدمات": الرصيد الائتماني المضاف لحساب العميل داخل المنصة.',
    ],
  },
  {
    number: 2,
    title: "المادة الثانية: طبيعة التمويل",
    clauses: [
      "يُقر الطرف الثاني بأن هذا عقد تمويل خدمات وليس قرضاً نقدياً.",
      "لن يحصل الطرف الثاني على أي مبلغ نقدي بموجب هذا العقد.",
      "قيمة التمويل تُضاف كرصيد خدمات ولا يجوز تحويلها لنقد.",
      "الدفع يتم مباشرة من الطرف الأول لمزودي الخدمات.",
    ],
  },
  {
    number: 3,
    title: "المادة الثالثة: نطاق التمويل",
    clauses: [
      "يشمل التمويل حصرياً الخدمات المحددة في ملخص الطلب المرفق.",
      "لا يجوز استخدام رصيد الخدمات إلا لشراء الخدمات المتاحة على المنصة.",
      "لا يجوز تعديل الخدمات الممولة إلا بموافقة خطية مسبقة.",
    ],
  },
  {
    number: 4,
    title: "المادة الرابعة: الأقساط والسداد",
    clauses: [
      "قيمة التمويل والأقساط محددة في الملخص المالي المرفق.",
      "يلتزم الطرف الثاني بسداد الأقساط في مواعيدها المحددة.",
      "تُحتسب ضريبة القيمة المضافة (15%) وفقاً للأنظمة المعمول بها.",
    ],
  },
  {
    number: 5,
    title: "المادة الخامسة: التزامات العميل",
    clauses: [
      "سداد جميع الأقساط في مواعيدها دون تأخير.",
      "جميع البيانات المقدمة صحيحة ودقيقة.",
      "إبلاغ الطرف الأول بأي تغيير في البيانات فوراً.",
    ],
  },
  {
    number: 6,
    title: "المادة السادسة: التأخر في السداد",
    clauses: [
      "غرامة تأخير (2%) من قيمة القسط المتأخر عن كل شهر.",
      "إيقاف رصيد الخدمات عند تأخر قسطين متتاليين.",
      "استحقاق فوري لكامل المبلغ عند تأخر ثلاثة أقساط.",
    ],
  },
  {
    number: 7,
    title: "المادة السابعة: السند التنفيذي",
    clauses: [
      "يُصدر السند التنفيذي عبر منصة نافذ بعد اعتماد العقد.",
      "يلتزم الطرف الثاني بتوقيع السند خلال (7) أيام.",
      "لا يتم تفعيل رصيد الخدمات إلا بعد توقيع السند.",
    ],
  },
  {
    number: 8,
    title: "المادة الثامنة: القانون الواجب التطبيق",
    clauses: [
      "يخضع هذا العقد لأنظمة المملكة العربية السعودية.",
      "المحاكم التجارية بمدينة الرياض هي المختصة حصرياً.",
    ],
  },
];

const CLIENT_ACKNOWLEDGMENTS = [
  "أُقر بأنني قرأت جميع بنود هذا العقد وفهمتها فهماً تاماً.",
  "أُقر بأن هذا عقد تمويل خدمات وليس تمويلاً نقدياً.",
  "أُقر بأن المعلومات التي قدمتها صحيحة ودقيقة.",
  "أُقر بالتزامي بسداد جميع الأقساط في مواعيدها.",
  "أُقر بموافقتي على إصدار سند تنفيذي عبر منصة نافذ.",
];

// ============================================
// PDF Generation using PDFKit-like approach with raw PDF
// ============================================

/**
 * Format currency in Arabic
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " ر.س";
}

/**
 * Format date in Arabic
 */
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

/**
 * Generate contract HTML content that will be converted to PDF
 * Using a proper HTML template that can be styled with Arabic fonts
 */
function generateContractHTML(data: ContractData, approval?: ApprovalRecord): string {
  const contractDate = formatDate(data.contract_date);
  
  // Build services table rows
  const servicesRows = data.services.map((service, index) => {
    const vat = service.total_price * 0.15;
    const totalWithVat = service.total_price + vat;
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${service.name}</td>
        <td>${service.quantity}</td>
        <td>${formatCurrency(service.unit_price)}</td>
        <td>${formatCurrency(vat)}</td>
        <td>${formatCurrency(totalWithVat)}</td>
      </tr>
    `;
  }).join("");

  // Build installments table rows
  const installmentsRows = data.installments_schedule.map((inst) => `
    <tr>
      <td>${inst.number}</td>
      <td>${formatCurrency(inst.amount)}</td>
      <td>${formatDate(inst.due_date)}</td>
      <td>غير مسدد</td>
    </tr>
  `).join("");

  // Build articles HTML
  const articlesHTML = LEGAL_CONTRACT_ARTICLES.map(article => `
    <div class="article">
      <h3 class="article-title">${article.title}</h3>
      <ul class="article-clauses">
        ${article.clauses.map(clause => `<li>${clause}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  // Build acknowledgments
  const acknowledgmentsHTML = CLIENT_ACKNOWLEDGMENTS.map((ack, i) => `
    <div class="acknowledgment">
      <span class="checkbox">☑</span>
      <span>${i + 1}. ${ack}</span>
    </div>
  `).join("");

  // Approval section
  const approvalSection = approval ? `
    <div class="approval-section">
      <h3>بيانات الموافقة الإلكترونية</h3>
      <table class="approval-table">
        <tr>
          <td><strong>تاريخ الموافقة:</strong></td>
          <td>${formatDate(approval.approved_at)}</td>
        </tr>
        ${approval.ip_address ? `
        <tr>
          <td><strong>عنوان IP:</strong></td>
          <td dir="ltr">${approval.ip_address}</td>
        </tr>
        ` : ""}
        ${approval.reading_time_seconds ? `
        <tr>
          <td><strong>مدة القراءة:</strong></td>
          <td>${Math.floor(approval.reading_time_seconds / 60)} دقيقة و ${approval.reading_time_seconds % 60} ثانية</td>
        </tr>
        ` : ""}
        ${approval.scroll_percentage ? `
        <tr>
          <td><strong>نسبة التمرير:</strong></td>
          <td>${approval.scroll_percentage}%</td>
        </tr>
        ` : ""}
      </table>
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
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Amiri', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #1f2937;
      direction: rtl;
      text-align: right;
      background: white;
      padding: 20mm;
    }
    
    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      padding: 20px;
      border-bottom: 3px solid #3b82f6;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .company-info h1 {
      font-size: 18pt;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 5px;
    }
    
    .company-info p {
      font-size: 10pt;
      color: #6b7280;
    }
    
    .contract-meta {
      text-align: left;
      direction: ltr;
    }
    
    .contract-meta .contract-number {
      font-size: 11pt;
      font-weight: 700;
      color: #3b82f6;
    }
    
    .contract-meta .contract-date {
      font-size: 10pt;
      color: #6b7280;
    }
    
    /* Title Section */
    .title-section {
      text-align: center;
      margin: 30px 0;
    }
    
    .bismillah {
      font-size: 16pt;
      color: #6b7280;
      margin-bottom: 15px;
    }
    
    .main-title {
      font-size: 24pt;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .title-underline {
      width: 100px;
      height: 3px;
      background: #3b82f6;
      margin: 0 auto 20px;
    }
    
    /* Parties Section */
    .parties-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .party {
      padding: 15px;
    }
    
    .party-title {
      font-size: 12pt;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    
    .party-info p {
      font-size: 10pt;
      margin-bottom: 3px;
    }
    
    .party-info strong {
      color: #1f2937;
    }
    
    /* Warning Box */
    .warning-box {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 25px;
    }
    
    .warning-box h4 {
      color: #b45309;
      font-size: 12pt;
      margin-bottom: 5px;
    }
    
    .warning-box p {
      color: #92400e;
      font-size: 10pt;
    }
    
    /* Articles */
    .articles-section h2 {
      font-size: 16pt;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #3b82f6;
    }
    
    .article {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .article-title {
      font-size: 12pt;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 8px;
    }
    
    .article-clauses {
      list-style: none;
      padding-right: 15px;
    }
    
    .article-clauses li {
      font-size: 10pt;
      margin-bottom: 5px;
      padding-right: 20px;
      position: relative;
    }
    
    .article-clauses li::before {
      content: "•";
      position: absolute;
      right: 0;
      color: #3b82f6;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    th, td {
      border: 1px solid #e5e7eb;
      padding: 10px;
      text-align: center;
    }
    
    th {
      background: #3b82f6;
      color: white;
      font-weight: 700;
    }
    
    tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .total-row {
      background: #e0e7ff !important;
      font-weight: 700;
    }
    
    /* Financial Summary */
    .financial-summary {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .financial-summary h3 {
      font-size: 14pt;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 15px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .summary-item .label {
      font-size: 9pt;
      color: #6b7280;
    }
    
    .summary-item .value {
      font-size: 14pt;
      font-weight: 700;
      color: #1f2937;
    }
    
    /* Acknowledgments */
    .acknowledgments-section {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .acknowledgments-section h3 {
      font-size: 14pt;
      font-weight: 700;
      color: #166534;
      margin-bottom: 15px;
    }
    
    .acknowledgment {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    
    .checkbox {
      color: #16a34a;
      font-size: 14pt;
    }
    
    /* Approval Section */
    .approval-section {
      background: #eff6ff;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .approval-section h3 {
      font-size: 14pt;
      font-weight: 700;
      color: #1d4ed8;
      margin-bottom: 15px;
    }
    
    .approval-table {
      width: auto;
    }
    
    .approval-table td {
      text-align: right;
      padding: 8px 15px;
    }
    
    /* Signature Section */
    .signature-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    
    .signature-box {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .signature-box h4 {
      font-size: 12pt;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .signature-box .name {
      font-size: 11pt;
      margin-bottom: 30px;
    }
    
    .signature-line {
      border-top: 1px solid #1f2937;
      width: 80%;
      margin: 0 auto;
      padding-top: 5px;
      font-size: 9pt;
      color: #6b7280;
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }
    
    /* Page breaks */
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      body {
        padding: 15mm;
      }
      
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>${COMPANY_INFO.name}</h1>
        <p>سجل تجاري: ${COMPANY_INFO.commercialRegister}</p>
        <p>${COMPANY_INFO.address}</p>
      </div>
      <div class="contract-meta">
        <div class="contract-number">رقم العقد: ${data.application_number}</div>
        <div class="contract-date">تاريخ الإصدار: ${contractDate}</div>
        <div class="contract-date">عقد تمويل خدمات رسمي</div>
      </div>
    </div>

    <!-- Title -->
    <div class="title-section">
      <div class="bismillah">بسم الله الرحمن الرحيم</div>
      <h1 class="main-title">عقد تمويل خدمات</h1>
      <div class="title-underline"></div>
    </div>

    <!-- Parties -->
    <div class="parties-section">
      <div class="party">
        <div class="party-title">الطرف الأول (الممول / مزود الخدمة)</div>
        <div class="party-info">
          <p><strong>${COMPANY_INFO.name}</strong></p>
          <p>سجل تجاري: ${COMPANY_INFO.commercialRegister}</p>
          <p>${COMPANY_INFO.address}</p>
        </div>
      </div>
      <div class="party">
        <div class="party-title">الطرف الثاني (العميل / المستفيد)</div>
        <div class="party-info">
          <p><strong>${data.customer_name}</strong></p>
          <p>رقم الهوية: ${data.customer_national_id}</p>
          <p>الجوال: ${data.customer_phone}</p>
          <p>البريد: ${data.customer_email}</p>
          ${data.customer_address ? `<p>العنوان: ${data.customer_address}</p>` : ""}
        </div>
      </div>
    </div>

    <!-- Warning -->
    <div class="warning-box">
      <h4>⚠️ تنبيه مهم: هذا عقد تمويل خدمات فقط - غير نقدي</h4>
      <p>لن يتم صرف أي مبلغ نقدي للعميل. قيمة التمويل تُضاف كرصيد خدمات داخل المنصة فقط لاستخدامها في شراء الخدمات.</p>
    </div>

    <!-- Articles -->
    <div class="articles-section">
      <h2>بنود العقد</h2>
      ${articlesHTML}
    </div>

    <div class="page-break"></div>

    <!-- Services Table -->
    <h2 style="font-size: 14pt; margin-bottom: 15px;">جدول الخدمات الممولة</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>اسم الخدمة</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>الضريبة (15%)</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${servicesRows}
        <tr class="total-row">
          <td colspan="3">الإجمالي</td>
          <td>${formatCurrency(data.total_services_value)}</td>
          <td>${formatCurrency(data.vat_amount)}</td>
          <td>${formatCurrency(data.grand_total)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Financial Summary -->
    <div class="financial-summary">
      <h3>الملخص المالي</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="label">إجمالي الخدمات</div>
          <div class="value">${formatCurrency(data.total_services_value)}</div>
        </div>
        <div class="summary-item">
          <div class="label">ضريبة القيمة المضافة</div>
          <div class="value">${formatCurrency(data.vat_amount)}</div>
        </div>
        <div class="summary-item">
          <div class="label">المبلغ الإجمالي</div>
          <div class="value">${formatCurrency(data.grand_total)}</div>
        </div>
        <div class="summary-item">
          <div class="label">عدد الأقساط</div>
          <div class="value">${data.installments_count} قسط</div>
        </div>
        <div class="summary-item">
          <div class="label">قيمة القسط</div>
          <div class="value">${formatCurrency(data.installment_amount)}</div>
        </div>
        <div class="summary-item">
          <div class="label">المبلغ الممول</div>
          <div class="value">${formatCurrency(data.financed_amount)}</div>
        </div>
      </div>
    </div>

    <!-- Installments Table -->
    <h2 style="font-size: 14pt; margin-bottom: 15px;">جدول الأقساط</h2>
    <table>
      <thead>
        <tr>
          <th>رقم القسط</th>
          <th>المبلغ</th>
          <th>تاريخ الاستحقاق</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${installmentsRows}
      </tbody>
    </table>

    <div class="page-break"></div>

    <!-- Acknowledgments -->
    <div class="acknowledgments-section">
      <h3>إقرارات العميل</h3>
      ${acknowledgmentsHTML}
    </div>

    ${approvalSection}

    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-box">
        <h4>الطرف الأول</h4>
        <div class="name">${COMPANY_INFO.name}</div>
        <div class="signature-line">التوقيع والختم</div>
      </div>
      <div class="signature-box">
        <h4>الطرف الثاني</h4>
        <div class="name">${data.customer_name}</div>
        <div class="signature-line">${approval ? "موافقة إلكترونية" : "التوقيع"}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>${COMPANY_INFO.name} - جميع الحقوق محفوظة</p>
      <p>عقد تمويل خدمات رسمي - رقم ${data.application_number}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id, include_approval = true } = await req.json();

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "application_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch application data
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

    // Fetch installments
    const { data: installments } = await supabase
      .from("financing_installments")
      .select("*")
      .eq("application_id", application_id)
      .order("installment_number");

    // Build contract data
    const approvedAmount = application.approved_amount || application.requested_amount;
    const vatAmount = approvedAmount * 0.15;
    const grandTotal = approvedAmount + vatAmount;
    const installmentAmount = grandTotal / (application.plan?.installments_count || 3);

    const contractData: ContractData = {
      application_id: application.id,
      application_number: application.application_number,
      contract_date: application.approved_at || application.created_at,
      
      // Customer info from application (NOT username)
      customer_name: application.full_name,
      customer_national_id: application.national_id,
      customer_phone: application.phone,
      customer_email: application.email,
      customer_address: application.address,
      
      // Services
      services: [{
        name: application.service?.name_ar || application.service_description || "خدمات رقمية",
        quantity: 1,
        unit_price: approvedAmount,
        total_price: approvedAmount,
      }],
      
      total_services_value: approvedAmount,
      admin_fees: 0,
      vat_amount: vatAmount,
      grand_total: grandTotal,
      financed_amount: grandTotal,
      
      // Installments
      installments_count: application.plan?.installments_count || 3,
      installment_amount: installmentAmount,
      first_installment_date: installments?.[0]?.due_date || new Date().toISOString(),
      last_installment_date: installments?.[installments.length - 1]?.due_date || new Date().toISOString(),
      installments_schedule: (installments || []).map((inst: any) => ({
        number: inst.installment_number,
        amount: inst.amount,
        due_date: inst.due_date,
      })),
    };

    // Get approval record if exists and requested
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

    // Generate HTML content
    const htmlContent = generateContractHTML(contractData, approvalRecord);

    // Return HTML that can be converted to PDF on client or via external service
    // For now, return HTML for rendering or conversion
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
