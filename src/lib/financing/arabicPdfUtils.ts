/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *                    أدوات PDF العربية - Arabic PDF Utilities
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * معالجة النص العربي لتوليد PDF صحيح:
 * - Arabic Shaping: ربط الحروف العربية
 * - Bidi Algorithm: تصحيح اتجاه النص RTL
 * - Embedded Fonts: تضمين الخطوط داخل PDF
 */

import ArabicReshaper from 'arabic-reshaper';

// ============================================
// Arabic Text Processing
// ============================================

/**
 * تحويل النص العربي للعرض الصحيح في PDF
 * يطبق Arabic Shaping + Bidi RTL
 */
export function processArabicText(text: string): string {
  if (!text) return '';
  
  try {
    // Arabic Reshaper يربط الحروف العربية
    const reshaped = ArabicReshaper.reshape(text);
    
    // عكس النص للعرض RTL في PDF (jsPDF يعرض LTR)
    return reverseArabicText(reshaped);
  } catch (error) {
    console.error('Error processing Arabic text:', error);
    // Fallback: إرجاع النص الأصلي معكوساً
    return reverseArabicText(text);
  }
}

/**
 * عكس النص العربي مع الحفاظ على الأرقام والعلامات الإنجليزية
 */
function reverseArabicText(text: string): string {
  // فصل الأجزاء العربية عن غيرها
  const segments: { text: string; isArabic: boolean }[] = [];
  let currentSegment = '';
  let isCurrentArabic = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isArabic = isArabicChar(char);
    
    if (i === 0) {
      isCurrentArabic = isArabic;
    }
    
    if (isArabic === isCurrentArabic) {
      currentSegment += char;
    } else {
      if (currentSegment) {
        segments.push({ text: currentSegment, isArabic: isCurrentArabic });
      }
      currentSegment = char;
      isCurrentArabic = isArabic;
    }
  }
  
  if (currentSegment) {
    segments.push({ text: currentSegment, isArabic: isCurrentArabic });
  }
  
  // عكس ترتيب الأجزاء وعكس النص العربي داخلياً
  const reversed = segments
    .reverse()
    .map(seg => seg.isArabic ? seg.text.split('').reverse().join('') : seg.text)
    .join('');
  
  return reversed;
}

/**
 * التحقق من كون الحرف عربياً
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
 * معالجة نص متعدد الأسطر
 */
export function processArabicLines(text: string): string[] {
  return text.split('\n').map(line => processArabicText(line.trim())).filter(Boolean);
}

/**
 * تنسيق المبالغ بالريال السعودي (للعرض في PDF)
 */
export function formatCurrencyForPdf(amount: number): string {
  const formatted = new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${formatted} ر.س`;
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDateForPdf(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * تحويل الأرقام الإنجليزية إلى عربية
 */
export function toArabicNumerals(num: number | string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)]);
}

// ============================================
// PDF Table Helpers
// ============================================

/**
 * معالجة بيانات الجدول للعرض RTL
 */
export function processTableData(headers: string[], rows: string[][]): {
  headers: string[];
  body: string[][];
} {
  return {
    headers: headers.map(processArabicText).reverse(),
    body: rows.map(row => row.map(processArabicText).reverse()),
  };
}

// ============================================
// Constants
// ============================================

export const PDF_COLORS = {
  primary: [59, 130, 246] as [number, number, number],     // Blue
  secondary: [107, 114, 128] as [number, number, number], // Gray
  success: [16, 185, 129] as [number, number, number],    // Green
  warning: [234, 179, 8] as [number, number, number],     // Yellow
  danger: [239, 68, 68] as [number, number, number],      // Red
  dark: [31, 41, 55] as [number, number, number],         // Dark Gray
  light: [249, 250, 251] as [number, number, number],     // Light Gray
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
};

export const PDF_FONTS = {
  regular: 'Amiri',
  bold: 'Amiri',
};
