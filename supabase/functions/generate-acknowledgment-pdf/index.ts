/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *             مولد PDF إقرار الشروط - Terms Acknowledgment PDF Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * وثيقة رسمية منفصلة عن العقد لإقرار العميل بقراءة وفهم الشروط
 * ✅ Arabic Shaping (ربط الحروف)
 * ✅ Bidi RTL (اتجاه النص الصحيح)
 * ✅ Embedded Font (خط Amiri مضمن)
 * ✅ تصميم رسمي مصرفي
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

interface AcknowledgmentData {
  acknowledgment_number: string;
  application_number: string;
  customer_name: string;
  customer_national_id: string;
  issue_date: string;
  financed_amount: number;
  installments_count: number;
}

interface SignatureRecord {
  signed_at: string;
  ip_address?: string;
  user_agent?: string;
  reading_time_seconds?: number;
}

// ============================================
// Arabic Text Processing (Same as contract PDF)
// ============================================

function isArabicChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x0600 && code <= 0x06FF) ||
    (code >= 0x0750 && code <= 0x077F) ||
    (code >= 0x08A0 && code <= 0x08FF) ||
    (code >= 0xFB50 && code <= 0xFDFF) ||
    (code >= 0xFE70 && code <= 0xFEFF)
  );
}

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

const nonConnectingLetters = new Set(['ا', 'أ', 'إ', 'آ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ء', 'ة']);

function canConnectNext(char: string): boolean {
  return !nonConnectingLetters.has(char);
}

function getLetterForm(char: string, prevConnects: boolean, nextConnects: boolean): string {
  const forms = arabicForms[char];
  if (!forms) return char;
  
  if (!prevConnects && !nextConnects) return forms[0];
  if (!prevConnects && nextConnects) return forms[1];
  if (prevConnects && nextConnects) return forms[2];
  return forms[3];
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
  address: "المملكة العربية السعودية - جدة",
};

// ============================================
// Format Helpers
// ============================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ر.س';
}

// ============================================
// HTML Template Generator
// ============================================

function generateAcknowledgmentHTML(
  data: AcknowledgmentData,
  signature?: SignatureRecord
): string {
  const issueDateFormatted = formatDate(data.issue_date);
  const signatureDateFormatted = signature ? formatDate(signature.signed_at) : '';
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إقرار بقراءة الشروط - ${data.acknowledgment_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Amiri', serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #1f2937;
      background: white;
      direction: rtl;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
    }
    
    @media print {
      .page {
        margin: 0;
        padding: 15mm;
      }
    }
    
    /* Header */
    .header {
      text-align: center;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .company-name {
      font-size: 22pt;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .company-name-en {
      font-size: 12pt;
      color: #6b7280;
      margin-bottom: 10px;
    }
    
    .document-title {
      font-size: 20pt;
      font-weight: 700;
      color: #dc2626;
      margin: 20px 0;
      padding: 15px;
      background: linear-gradient(135deg, #fef2f2, #fff);
      border: 2px solid #dc2626;
      border-radius: 8px;
    }
    
    .document-number {
      font-size: 14pt;
      color: #374151;
      background: #f3f4f6;
      padding: 8px 20px;
      border-radius: 20px;
      display: inline-block;
    }
    
    /* Info Section */
    .info-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 25px;
      margin: 25px 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .info-label {
      font-weight: 700;
      color: #374151;
      min-width: 120px;
    }
    
    .info-value {
      color: #1f2937;
      font-size: 13pt;
    }
    
    /* Statement Box */
    .statement-box {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
    }
    
    .statement-title {
      font-size: 16pt;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .statement-text {
      font-size: 14pt;
      line-height: 2.2;
      text-align: justify;
      color: #1f2937;
    }
    
    .highlight {
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
    }
    
    /* Acknowledgment Points */
    .points-section {
      margin: 30px 0;
    }
    
    .points-title {
      font-size: 14pt;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #3b82f6;
    }
    
    .point-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border-right: 4px solid #3b82f6;
    }
    
    .point-check {
      color: #16a34a;
      font-size: 18pt;
      flex-shrink: 0;
    }
    
    .point-text {
      font-size: 12pt;
      color: #374151;
    }
    
    /* Signature Section */
    .signature-section {
      margin-top: 50px;
      border: 2px solid #1e40af;
      border-radius: 12px;
      padding: 30px;
      background: #fafbfc;
    }
    
    .signature-title {
      font-size: 14pt;
      font-weight: 700;
      color: #1e40af;
      text-align: center;
      margin-bottom: 25px;
    }
    
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    
    .signature-field {
      text-align: center;
    }
    
    .signature-label {
      font-size: 11pt;
      color: #6b7280;
      margin-bottom: 10px;
    }
    
    .signature-line {
      border-bottom: 2px dashed #9ca3af;
      height: 60px;
      margin-bottom: 10px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 5px;
    }
    
    .signature-value {
      font-size: 13pt;
      font-weight: 700;
      color: #1f2937;
    }
    
    .electronic-signature {
      background: #dcfce7;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
    
    .electronic-signature h4 {
      color: #166534;
      font-size: 12pt;
      margin-bottom: 10px;
    }
    
    .signature-details {
      font-size: 10pt;
      color: #374151;
    }
    
    .signature-details p {
      margin: 5px 0;
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
    }
    
    .footer p {
      font-size: 10pt;
      color: #6b7280;
      margin: 5px 0;
    }
    
    .legal-note {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      font-size: 11pt;
      color: #92400e;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="company-name">${processArabicText(COMPANY_INFO.name)}</div>
      <div class="company-name-en">${COMPANY_INFO.nameEn}</div>
      <div class="document-title">${processArabicText('إقرار بقراءة وفهم الشروط والأحكام')}</div>
      <div class="document-number">${processArabicText('رقم الإقرار')}: ${data.acknowledgment_number}</div>
    </div>
    
    <!-- Info Section -->
    <div class="info-section">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">${processArabicText('رقم الطلب')}:</span>
          <span class="info-value">${data.application_number}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${processArabicText('تاريخ الإصدار')}:</span>
          <span class="info-value">${processArabicText(issueDateFormatted)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${processArabicText('اسم المقر')}:</span>
          <span class="info-value">${processArabicText(data.customer_name)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${processArabicText('رقم الهوية')}:</span>
          <span class="info-value">${data.customer_national_id}</span>
        </div>
      </div>
    </div>
    
    <!-- Main Statement -->
    <div class="statement-box">
      <div class="statement-title">${processArabicText('نص الإقرار')}</div>
      <div class="statement-text">
        ${processArabicText('أنا الموقع أدناه')} <span class="highlight">${processArabicText(data.customer_name)}</span> ${processArabicText('الحامل لهوية رقم')} <span class="highlight">${data.customer_national_id}</span>،
        ${processArabicText('أُقرّ وأشهد بأنني قد اطلعت على كافة الشروط والأحكام المتعلقة بعقد تمويل الخدمات رقم')} <span class="highlight">${data.application_number}</span>،
        ${processArabicText('وأنني قرأتها بالكامل وفهمت جميع بنودها ومحتوياتها فهماً تاماً ودقيقاً')}.
      </div>
    </div>
    
    <!-- Acknowledgment Points -->
    <div class="points-section">
      <div class="points-title">${processArabicText('أُقرّ بما يلي')}</div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">${processArabicText('قرأت وفهمت جميع شروط وأحكام عقد تمويل الخدمات بالكامل.')}</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">${processArabicText('أدرك أن هذا التمويل غير نقدي ويُضاف كرصيد خدمات داخل المنصة فقط.')}</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">${processArabicText('أوافق على مبلغ التمويل البالغ')} <strong>${formatCurrency(data.financed_amount)}</strong> ${processArabicText('وعلى تقسيمه إلى')} <strong>${data.installments_count}</strong> ${processArabicText('أقساط شهرية.')}</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">${processArabicText('أتعهد بسداد الأقساط في مواعيدها المحددة وفقاً لجدول السداد.')}</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">${processArabicText('أُقرّ بأنني أهل للتعاقد وأن جميع البيانات المقدمة صحيحة ودقيقة.')}</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">${processArabicText('أوافق على خضوع هذا العقد للأنظمة المعمول بها في المملكة العربية السعودية.')}</span>
      </div>
    </div>
    
    <!-- Legal Note -->
    <div class="legal-note">
      ${processArabicText('⚠️ هذا الإقرار وثيقة رسمية وملزمة قانوناً، ويُعتبر توقيعك الإلكتروني موافقة صريحة وقاطعة على جميع ما ورد فيه.')}
    </div>
    
    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-title">${processArabicText('التوقيع والإقرار')}</div>
      
      <div class="signature-grid">
        <div class="signature-field">
          <div class="signature-label">${processArabicText('اسم المقر')}</div>
          <div class="signature-line">
            <span class="signature-value">${processArabicText(data.customer_name)}</span>
          </div>
        </div>
        
        <div class="signature-field">
          <div class="signature-label">${processArabicText('تاريخ التوقيع')}</div>
          <div class="signature-line">
            <span class="signature-value">${signature ? processArabicText(signatureDateFormatted) : '________________'}</span>
          </div>
        </div>
      </div>
      
      ${signature ? `
      <div class="electronic-signature">
        <h4>${processArabicText('✓ تم التوقيع إلكترونياً')}</h4>
        <div class="signature-details">
          <p><strong>${processArabicText('تاريخ ووقت التوقيع')}:</strong> ${new Date(signature.signed_at).toLocaleString('ar-SA')}</p>
          ${signature.ip_address ? `<p><strong>${processArabicText('عنوان IP')}:</strong> ${signature.ip_address}</p>` : ''}
          ${signature.reading_time_seconds ? `<p><strong>${processArabicText('مدة القراءة')}:</strong> ${Math.floor(signature.reading_time_seconds / 60)} ${processArabicText('دقيقة')} ${signature.reading_time_seconds % 60} ${processArabicText('ثانية')}</p>` : ''}
        </div>
      </div>
      ` : `
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-style: italic;">
        ${processArabicText('في انتظار توقيع العميل...')}
      </div>
      `}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>${processArabicText(COMPANY_INFO.name)} - ${processArabicText(COMPANY_INFO.address)}</p>
      <p>${processArabicText('سجل تجاري')}: ${COMPANY_INFO.commercialRegister}</p>
      <p>${processArabicText('جميع الحقوق محفوظة')} © ${new Date().getFullYear()}</p>
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id, acknowledgment_id } = await req.json();

    if (!application_id && !acknowledgment_id) {
      return new Response(
        JSON.stringify({ error: "application_id or acknowledgment_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let acknowledgment: any;
    let application: any;

    if (acknowledgment_id) {
      // Fetch specific acknowledgment
      const { data, error } = await supabase
        .from("financing_acknowledgments")
        .select(`
          *,
          application:financing_applications(*)
        `)
        .eq("id", acknowledgment_id)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Acknowledgment not found", details: error }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      acknowledgment = data;
      application = data.application;
    } else {
      // Fetch application and its acknowledgment
      const { data: appData, error: appError } = await supabase
        .from("financing_applications")
        .select(`
          *,
          plan:financing_plans(*),
          acknowledgment:financing_acknowledgments(*)
        `)
        .eq("id", application_id)
        .single();

      if (appError || !appData) {
        return new Response(
          JSON.stringify({ error: "Application not found", details: appError }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      application = appData;
      acknowledgment = appData.acknowledgment?.[0];
    }

    // Prepare data
    const ackData: AcknowledgmentData = {
      acknowledgment_number: acknowledgment?.acknowledgment_number || `ACK-${application.application_number}`,
      application_number: application.application_number,
      customer_name: application.contract_override_name || application.full_name,
      customer_national_id: application.national_id,
      issue_date: acknowledgment?.sent_at || new Date().toISOString(),
      financed_amount: application.approved_amount || application.requested_amount,
      installments_count: application.contract_override_installments || application.plan?.installments_count || 3,
    };

    // Get signature record if signed
    let signatureRecord: SignatureRecord | undefined;
    if (acknowledgment?.signed_at) {
      signatureRecord = {
        signed_at: acknowledgment.signed_at,
        ip_address: acknowledgment.signature_ip,
        user_agent: acknowledgment.signature_user_agent,
        reading_time_seconds: acknowledgment.reading_time_seconds,
      };
    }

    // Generate HTML
    const htmlContent = generateAcknowledgmentHTML(ackData, signatureRecord);

    return new Response(
      JSON.stringify({
        success: true,
        html: htmlContent,
        acknowledgment_data: ackData,
        signature_record: signatureRecord,
        acknowledgment_id: acknowledgment?.id,
        status: acknowledgment?.status || 'pending',
        metadata: {
          generated_at: new Date().toISOString(),
          application_number: application.application_number,
          customer_name: ackData.customer_name,
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
    console.error("Error generating acknowledgment PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate acknowledgment", 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
