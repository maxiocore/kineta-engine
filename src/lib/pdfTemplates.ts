import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Arabic numerals converter
const toArabicNumerals = (num: number | string): string => {
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/[0-9]/g, (d) => arabicNums[parseInt(d)]);
};

// Format amount in Arabic style
const formatAmountArabic = (amount: number): string => {
  const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toArabicNumerals(formatted);
};

// Format date in Arabic
const formatDateArabic = (date: string | Date): string => {
  try {
    const d = new Date(date);
    return format(d, 'dd/MM/yyyy HH:mm', { locale: ar });
  } catch {
    return toArabicNumerals(new Date().toLocaleDateString('ar-SA'));
  }
};

// Reverse text for RTL rendering in jsPDF (since jsPDF doesn't support RTL natively)
const reverseArabicText = (text: string): string => {
  return text.split('').reverse().join('');
};

// Arabic text wrapper - simulates RTL by positioning from right
const drawArabicText = (doc: jsPDF, text: string, x: number, y: number, options?: { align?: 'right' | 'left' | 'center', fontSize?: number }) => {
  if (options?.fontSize) {
    doc.setFontSize(options.fontSize);
  }
  doc.text(text, x, y, { align: options?.align || 'right' });
};

// Common Arabic header for all receipts
const drawArabicHeader = (
  doc: jsPDF, 
  title: string, 
  subtitle: string, 
  color: [number, number, number] = [0, 128, 85]
) => {
  const pageWidth = 210;
  
  // Header gradient
  doc.setFillColor(...color);
  doc.rect(0, 0, pageWidth, 55, 'F');
  
  // Darker accent
  doc.setFillColor(color[0] * 0.7, color[1] * 0.7, color[2] * 0.7);
  doc.rect(0, 47, pageWidth, 8, 'F');
  
  // Logo circle
  doc.setFillColor(255, 255, 255);
  doc.circle(105, 18, 12, 'F');
  doc.setFillColor(...color);
  doc.circle(105, 18, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('M', 105, 22, { align: 'center' });
  
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('ماكسيو كور', 105, 37, { align: 'center' });
  
  // Title
  doc.setFontSize(12);
  doc.text(title, 105, 45, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(9);
  doc.text(subtitle, 105, 52, { align: 'center' });
};

// Digital signature section
const drawDigitalSignature = (doc: jsPDF, y: number, color: [number, number, number] = [0, 128, 85]) => {
  const pageWidth = 210;
  const leftMargin = 20;
  const rightMargin = 190;
  
  // Signature container
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, y, rightMargin - leftMargin, 35, 3, 3, 'F');
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.roundedRect(leftMargin, y, rightMargin - leftMargin, 35, 3, 3, 'S');
  
  // Digital signature icon
  doc.setFillColor(...color);
  doc.circle(rightMargin - 25, y + 17, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('✓', rightMargin - 25, y + 20, { align: 'center' });
  
  // Signature text
  doc.setTextColor(...color);
  doc.setFontSize(10);
  doc.text('توقيع رقمي معتمد', rightMargin - 45, y + 12, { align: 'right' });
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('هذا الإيصال موقع إلكترونياً ومعتمد', rightMargin - 45, y + 20, { align: 'right' });
  doc.text('Digital Signature Verified', rightMargin - 45, y + 27, { align: 'right' });
  
  // Verification hash
  const hash = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`كود التحقق: ${hash}`, leftMargin + 10, y + 17, { align: 'left' });
  doc.text(`Verification: ${hash}`, leftMargin + 10, y + 24, { align: 'left' });
};

// Common Arabic footer
const drawArabicFooter = (doc: jsPDF, receiptNumber: string, color: [number, number, number] = [0, 128, 85]) => {
  const pageWidth = 210;
  const leftMargin = 20;
  const rightMargin = 190;
  
  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, 252, rightMargin, 252);
  
  // QR placeholder
  doc.setFillColor(248, 250, 252);
  doc.rect(rightMargin - 22, 255, 22, 22, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(rightMargin - 22, 255, 22, 22, 'S');
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(6);
  doc.text('QR', rightMargin - 11, 268, { align: 'center' });
  
  // Footer text - Arabic
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('إيصال إلكتروني - لا يحتاج إلى توقيع يدوي', 105, 258, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text('ماكسيو كور - منصة الخدمات الرقمية', 105, 265, { align: 'center' });
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text('support@maxiocore.com | www.maxiocore.com', 105, 272, { align: 'center' });
  
  // Reference and timestamp
  doc.setFontSize(6);
  doc.text(`رقم المرجع: ${receiptNumber}`, leftMargin + 5, 280, { align: 'left' });
  doc.text(`تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, leftMargin + 5, 285, { align: 'left' });
  
  // Bottom bar
  doc.setFillColor(...color);
  doc.rect(0, 290, pageWidth, 7, 'F');
  
  // Saudi VAT note
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text('المملكة العربية السعودية - الرقم الضريبي: XXXXXXXXXX', 105, 294, { align: 'center' });
};

// ==================== CASHBACK RECEIPT - Arabic ====================
interface CashbackReceiptData {
  id: string;
  amount: number;
  type: string;
  description: string;
  description_ar?: string;
  created_at: string;
  balance_after?: number;
  user_name?: string;
  user_email?: string;
}

export const generateCashbackReceipt = (data: CashbackReceiptData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const receiptNumber = `CB-${data.id.slice(0, 8).toUpperCase()}`;
  const leftMargin = 20;
  const rightMargin = 190;
  const rowHeight = 14;
  const color: [number, number, number] = [0, 150, 100];
  
  // Header
  drawArabicHeader(doc, 'إيصال الكاش باك', 'معاملة استرداد نقدي', color);
  
  let yPos = 65;
  
  // Receipt info boxes
  // Receipt number box - right side
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightMargin - 60, yPos, 60, 22, 3, 3, 'F');
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.roundedRect(rightMargin - 60, yPos, 60, 22, 3, 3, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('رقم الإيصال', rightMargin - 5, yPos + 8, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(...color);
  doc.text(receiptNumber, rightMargin - 5, yPos + 17, { align: 'right' });
  
  // Date box - left side
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, yPos, 60, 22, 3, 3, 'F');
  doc.setDrawColor(...color);
  doc.roundedRect(leftMargin, yPos, 60, 22, 3, 3, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('التاريخ', leftMargin + 55, yPos + 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(formatDateArabic(data.created_at), leftMargin + 55, yPos + 17, { align: 'right' });
  
  // Type badge
  const typeLabels: Record<string, { text: string; textAr: string; color: [number, number, number] }> = {
    earned: { text: 'مكتسب', textAr: 'مكتسب', color: [0, 150, 100] },
    withdrawn: { text: 'مسحوب', textAr: 'مسحوب', color: [59, 130, 246] },
    expired: { text: 'منتهي', textAr: 'منتهي', color: [239, 68, 68] },
  };
  const typeInfo = typeLabels[data.type] || { text: data.type, textAr: data.type, color: [100, 100, 100] };
  
  doc.setFillColor(...typeInfo.color);
  doc.roundedRect(95, yPos + 4, 35, 14, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(typeInfo.textAr, 112.5, yPos + 13, { align: 'center' });
  
  yPos = 98;
  
  // Transaction details section
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('تفاصيل المعاملة', 105, yPos + 7, { align: 'center' });
  yPos += 18;
  
  // Customer info
  if (data.user_name) {
    doc.setFillColor(252, 252, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text('اسم العميل', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    doc.text(data.user_name, leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  if (data.user_email) {
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text('البريد الإلكتروني', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    doc.text(data.user_email, leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  // Description
  doc.setFillColor(252, 252, 252);
  doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
  doc.setTextColor(80, 80, 80);
  doc.text('الوصف', rightMargin - 5, yPos + 3, { align: 'right' });
  doc.setTextColor(50, 50, 50);
  const desc = data.description_ar || data.description || 'معاملة كاش باك';
  doc.text(desc.length > 40 ? desc.substring(0, 40) + '...' : desc, leftMargin + 5, yPos + 3, { align: 'left' });
  yPos += rowHeight + 10;
  
  // Amount section
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('تفاصيل المبلغ', 105, yPos + 7, { align: 'center' });
  yPos += 20;
  
  // Amount box
  const isPositive = data.amount > 0;
  doc.setFillColor(isPositive ? 240 : 254, isPositive ? 253 : 242, isPositive ? 244 : 242);
  doc.roundedRect(leftMargin, yPos - 5, rightMargin - leftMargin, 30, 4, 4, 'F');
  doc.setDrawColor(isPositive ? 0 : 239, isPositive ? 150 : 68, isPositive ? 100 : 68);
  doc.setLineWidth(1.5);
  doc.roundedRect(leftMargin, yPos - 5, rightMargin - leftMargin, 30, 4, 4, 'S');
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.text('مبلغ الكاش باك', rightMargin - 10, yPos + 5, { align: 'right' });
  
  doc.setTextColor(isPositive ? 0 : 239, isPositive ? 150 : 68, isPositive ? 100 : 68);
  doc.setFontSize(20);
  const amountText = (isPositive ? '+' : '') + formatAmountArabic(data.amount) + ' ر.س';
  doc.text(amountText, leftMargin + 10, yPos + 15, { align: 'left' });
  
  yPos += 40;
  
  // Balance after
  if (data.balance_after !== undefined) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(leftMargin, yPos - 5, rightMargin - leftMargin, 20, 3, 3, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text('الرصيد بعد المعاملة', rightMargin - 10, yPos + 5, { align: 'right' });
    doc.setTextColor(...color);
    doc.setFontSize(14);
    doc.text(formatAmountArabic(data.balance_after) + ' ر.س', leftMargin + 10, yPos + 8, { align: 'left' });
    yPos += 25;
  }
  
  // Digital signature
  drawDigitalSignature(doc, yPos, color);
  
  drawArabicFooter(doc, receiptNumber, color);
  doc.save(`كاش-باك-${receiptNumber}.pdf`);
};

// ==================== CHALLENGE CERTIFICATE - Arabic ====================
interface ChallengeCertificateData {
  id: string;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  target_value: number;
  current_value: number;
  reward_points: number;
  completed_at: string;
  user_name?: string;
}

export const generateChallengeCertificate = (data: ChallengeCertificateData) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const certificateNumber = `CH-${data.id.slice(0, 8).toUpperCase()}`;
  const pageWidth = 297;
  const pageHeight = 210;
  const color: [number, number, number] = [99, 102, 241];
  
  // Background
  doc.setFillColor(250, 250, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative border
  doc.setDrawColor(...color);
  doc.setLineWidth(4);
  doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 6, 6, 'S');
  
  doc.setDrawColor(199, 210, 254);
  doc.setLineWidth(1.5);
  doc.roundedRect(14, 14, pageWidth - 28, pageHeight - 28, 5, 5, 'S');
  
  // Corner decorations
  const corners = [[22, 22], [pageWidth - 22, 22], [22, pageHeight - 22], [pageWidth - 22, pageHeight - 22]];
  corners.forEach(([x, y]) => {
    doc.setFillColor(...color);
    doc.circle(x, y, 5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y, 3, 'F');
  });
  
  // Header
  doc.setFillColor(...color);
  doc.roundedRect(pageWidth / 2 - 70, 22, 140, 35, 6, 6, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('شهادة إنجاز التحدي', pageWidth / 2, 40, { align: 'center' });
  doc.setFontSize(11);
  doc.text('Certificate of Achievement', pageWidth / 2, 50, { align: 'center' });
  
  // Main content
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(13);
  doc.text('تُمنح هذه الشهادة بكل فخر إلى', pageWidth / 2, 75, { align: 'center' });
  
  // User name
  doc.setTextColor(...color);
  doc.setFontSize(28);
  doc.text(data.user_name || 'عميل مميز', pageWidth / 2, 95, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(...color);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 70, 102, pageWidth / 2 + 70, 102);
  
  // Challenge details
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(12);
  doc.text('لإكمال التحدي بنجاح', pageWidth / 2, 115, { align: 'center' });
  
  // Challenge title box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth / 2 - 90, 122, 180, 28, 4, 4, 'F');
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth / 2 - 90, 122, 180, 28, 4, 4, 'S');
  
  doc.setTextColor(...color);
  doc.setFontSize(16);
  doc.text(data.title_ar || data.title, pageWidth / 2, 140, { align: 'center' });
  
  // Stats row
  const statsY = 158;
  const statBoxWidth = 65;
  const statSpacing = 75;
  const startX = pageWidth / 2 - statSpacing;
  
  // Target achieved
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(startX - statBoxWidth / 2, statsY, statBoxWidth, 28, 4, 4, 'F');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(18);
  doc.text(`${toArabicNumerals(data.current_value)}/${toArabicNumerals(data.target_value)}`, startX, statsY + 14, { align: 'center' });
  doc.setFontSize(9);
  doc.text('الهدف المحقق', startX, statsY + 23, { align: 'center' });
  
  // Points earned
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(startX + statSpacing - statBoxWidth / 2, statsY, statBoxWidth, 28, 4, 4, 'F');
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(18);
  doc.text(`+${toArabicNumerals(data.reward_points)}`, startX + statSpacing, statsY + 14, { align: 'center' });
  doc.setFontSize(9);
  doc.text('النقاط المكتسبة', startX + statSpacing, statsY + 23, { align: 'center' });
  
  // Date and certificate number
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(10);
  doc.text(`تاريخ الإنجاز: ${format(new Date(data.completed_at), 'dd MMMM yyyy', { locale: ar })}`, pageWidth / 2, 195, { align: 'center' });
  
  // Digital signature area
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 85, 175, 60, 25, 3, 3, 'F');
  doc.setFillColor(...color);
  doc.circle(pageWidth - 55, 182, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('✓', pageWidth - 55, 184, { align: 'center' });
  doc.setTextColor(...color);
  doc.setFontSize(8);
  doc.text('توقيع رقمي معتمد', pageWidth - 55, 193, { align: 'center' });
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(`رقم الشهادة: ${certificateNumber}`, 40, 195, { align: 'left' });
  
  doc.save(`شهادة-تحدي-${certificateNumber}.pdf`);
};

// ==================== ORDER RECEIPT - Arabic ====================
interface OrderReceiptData {
  id: string;
  order_number: string;
  service_name: string;
  quantity: number;
  total_price: number;
  status: string;
  link?: string;
  created_at: string;
  completed_at?: string;
  user_name?: string;
  user_email?: string;
  discount_amount?: number;
}

export const generateOrderReceipt = (data: OrderReceiptData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const receiptNumber = data.order_number;
  const leftMargin = 20;
  const rightMargin = 190;
  const rowHeight = 13;
  const color: [number, number, number] = [37, 99, 235];
  
  // Header
  drawArabicHeader(doc, 'إيصال الطلب', 'فاتورة خدمة', color);
  
  let yPos = 65;
  
  // Order number box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightMargin - 60, yPos, 60, 22, 3, 3, 'F');
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.roundedRect(rightMargin - 60, yPos, 60, 22, 3, 3, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('رقم الطلب', rightMargin - 5, yPos + 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(receiptNumber, rightMargin - 5, yPos + 17, { align: 'right' });
  
  // Date box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, yPos, 60, 22, 3, 3, 'F');
  doc.setDrawColor(...color);
  doc.roundedRect(leftMargin, yPos, 60, 22, 3, 3, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('التاريخ', leftMargin + 55, yPos + 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(formatDateArabic(data.created_at), leftMargin + 55, yPos + 17, { align: 'right' });
  
  // Status badge
  const statusConfig: Record<string, { textAr: string; color: [number, number, number] }> = {
    pending: { textAr: 'قيد الانتظار', color: [234, 179, 8] },
    processing: { textAr: 'جاري المعالجة', color: [59, 130, 246] },
    in_progress: { textAr: 'قيد التنفيذ', color: [139, 92, 246] },
    completed: { textAr: 'مكتمل', color: [34, 197, 94] },
    partial: { textAr: 'جزئي', color: [249, 115, 22] },
    cancelled: { textAr: 'ملغي', color: [239, 68, 68] },
    refunded: { textAr: 'مسترد', color: [107, 114, 128] },
    confirmed: { textAr: 'مؤكد', color: [34, 197, 94] },
  };
  const statusInfo = statusConfig[data.status] || { textAr: data.status, color: [100, 100, 100] };
  
  doc.setFillColor(...statusInfo.color);
  doc.roundedRect(90, yPos + 4, 40, 14, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(statusInfo.textAr, 110, yPos + 13, { align: 'center' });
  
  yPos = 98;
  
  // Customer section
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('معلومات العميل', 105, yPos + 7, { align: 'center' });
  yPos += 17;
  
  if (data.user_name) {
    doc.setFillColor(252, 252, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text('الاسم', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    doc.text(data.user_name, leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  if (data.user_email) {
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text('البريد الإلكتروني', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    doc.text(data.user_email, leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  yPos += 5;
  
  // Service section
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('تفاصيل الخدمة', 105, yPos + 7, { align: 'center' });
  yPos += 17;
  
  // Service name
  doc.setFillColor(252, 252, 252);
  doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.text('الخدمة', rightMargin - 5, yPos + 3, { align: 'right' });
  doc.setTextColor(50, 50, 50);
  const serviceName = data.service_name.length > 35 ? data.service_name.substring(0, 35) + '...' : data.service_name;
  doc.text(serviceName, leftMargin + 5, yPos + 3, { align: 'left' });
  yPos += rowHeight;
  
  // Quantity
  doc.setFillColor(248, 250, 252);
  doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
  doc.setTextColor(80, 80, 80);
  doc.text('الكمية', rightMargin - 5, yPos + 3, { align: 'right' });
  doc.setTextColor(50, 50, 50);
  doc.text(toArabicNumerals(data.quantity.toLocaleString()), leftMargin + 5, yPos + 3, { align: 'left' });
  yPos += rowHeight;
  
  // Link
  if (data.link) {
    doc.setFillColor(252, 252, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text('الرابط', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.setTextColor(...color);
    const linkText = data.link.length > 40 ? data.link.substring(0, 40) + '...' : data.link;
    doc.text(linkText, leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  yPos += 5;
  
  // Payment section
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('تفاصيل الدفع', 105, yPos + 7, { align: 'center' });
  yPos += 17;
  
  // Subtotal
  const subtotal = data.total_price + (data.discount_amount || 0);
  doc.setFillColor(252, 252, 252);
  doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.text('المبلغ الأساسي', rightMargin - 5, yPos + 3, { align: 'right' });
  doc.setTextColor(50, 50, 50);
  doc.text(formatAmountArabic(subtotal) + ' ر.س', leftMargin + 5, yPos + 3, { align: 'left' });
  yPos += rowHeight;
  
  // Discount
  if (data.discount_amount && data.discount_amount > 0) {
    doc.setFillColor(240, 253, 244);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(22, 163, 74);
    doc.text('الخصم', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.text('-' + formatAmountArabic(data.discount_amount) + ' ر.س', leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  // Total
  yPos += 3;
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos - 2, rightMargin - leftMargin, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('الإجمالي', rightMargin - 10, yPos + 10, { align: 'right' });
  doc.setFontSize(18);
  doc.text(formatAmountArabic(data.total_price) + ' ر.س', leftMargin + 10, yPos + 12, { align: 'left' });
  
  yPos += 30;
  
  // Completion date
  if (data.completed_at) {
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(10);
    doc.text(`تاريخ الإكمال: ${formatDateArabic(data.completed_at)}`, 105, yPos, { align: 'center' });
    yPos += 10;
  }
  
  // Digital signature
  drawDigitalSignature(doc, yPos, color);
  
  drawArabicFooter(doc, receiptNumber, color);
  doc.save(`طلب-${receiptNumber}.pdf`);
};

// ==================== BADGE CERTIFICATE - Arabic ====================
interface BadgeCertificateData {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar?: string;
  icon: string;
  color: string;
  tier: number;
  awarded_at: string;
  user_name?: string;
}

export const generateBadgeCertificate = (data: BadgeCertificateData) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const certificateNumber = `BDG-${data.id.slice(0, 8).toUpperCase()}`;
  const pageWidth = 297;
  const pageHeight = 210;
  const color: [number, number, number] = [217, 119, 6];
  
  // Golden background
  doc.setFillColor(255, 251, 235);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative border
  doc.setDrawColor(...color);
  doc.setLineWidth(4);
  doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 6, 6, 'S');
  
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(1.5);
  doc.roundedRect(14, 14, pageWidth - 28, pageHeight - 28, 5, 5, 'S');
  
  // Corner decorations
  const corners = [[24, 24], [pageWidth - 24, 24], [24, pageHeight - 24], [pageWidth - 24, pageHeight - 24]];
  corners.forEach(([x, y]) => {
    doc.setFillColor(...color);
    doc.circle(x, y, 6, 'F');
    doc.setFillColor(255, 251, 235);
    doc.circle(x, y, 4, 'F');
    doc.setFillColor(251, 191, 36);
    doc.circle(x, y, 2.5, 'F');
  });
  
  // Header
  doc.setFillColor(...color);
  doc.roundedRect(pageWidth / 2 - 75, 22, 150, 35, 6, 6, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('شهادة الشارة', pageWidth / 2, 40, { align: 'center' });
  doc.setFontSize(11);
  doc.text('Certificate of Recognition', pageWidth / 2, 50, { align: 'center' });
  
  // Badge icon circle
  doc.setFillColor(251, 191, 36);
  doc.circle(pageWidth / 2, 82, 22, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth / 2, 82, 19, 'F');
  
  // Tier
  doc.setFillColor(...color);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.text(data.icon || toArabicNumerals(data.tier), pageWidth / 2, 88, { align: 'center' });
  
  // Tier label
  const tierLabelsAr = ['', 'برونزي', 'فضي', 'ذهبي', 'بلاتيني', 'ماسي'];
  doc.setTextColor(...color);
  doc.setFontSize(11);
  doc.text(`المستوى ${toArabicNumerals(data.tier)}: ${tierLabelsAr[data.tier] || 'النخبة'}`, pageWidth / 2, 112, { align: 'center' });
  
  // Presented to
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(12);
  doc.text('تُمنح هذه الشارة بكل تقدير إلى', pageWidth / 2, 125, { align: 'center' });
  
  // User name
  doc.setTextColor(...color);
  doc.setFontSize(26);
  doc.text(data.user_name || 'عميل مميز', pageWidth / 2, 142, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 55, 148, pageWidth / 2 + 55, 148);
  
  // Badge name box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(pageWidth / 2 - 75, 155, 150, 30, 4, 4, 'F');
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth / 2 - 75, 155, 150, 30, 4, 4, 'S');
  
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(18);
  doc.text(data.name_ar || data.name, pageWidth / 2, 168, { align: 'center' });
  doc.setFontSize(10);
  doc.text(data.name, pageWidth / 2, 180, { align: 'center' });
  
  // Digital signature
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 90, 175, 65, 25, 3, 3, 'F');
  doc.setFillColor(...color);
  doc.circle(pageWidth - 57, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('✓', pageWidth - 57, 185, { align: 'center' });
  doc.setTextColor(...color);
  doc.setFontSize(9);
  doc.text('توقيع رقمي معتمد', pageWidth - 57, 195, { align: 'center' });
  
  // Date and certificate
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text(`تاريخ المنح: ${format(new Date(data.awarded_at), 'dd MMMM yyyy', { locale: ar })}`, 45, 193, { align: 'left' });
  doc.text(`رقم الشهادة: ${certificateNumber}`, 45, 200, { align: 'left' });
  
  doc.save(`شهادة-شارة-${certificateNumber}.pdf`);
};

// ==================== REWARDS STATEMENT - Arabic ====================
interface RewardsStatementData {
  user_name?: string;
  user_email?: string;
  available_points: number;
  total_points: number;
  redeemed_points: number;
  tier_name?: string;
  tier_name_ar?: string;
  transactions: Array<{
    id: string;
    type: string;
    points: number;
    description: string;
    description_ar?: string;
    created_at: string;
  }>;
  generated_at?: string;
}

export const generateRewardsStatement = (data: RewardsStatementData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const statementNumber = `RWD-${Date.now().toString(36).toUpperCase()}`;
  const leftMargin = 20;
  const rightMargin = 190;
  const rowHeight = 11;
  const color: [number, number, number] = [139, 92, 246];
  
  // Header
  drawArabicHeader(doc, 'كشف حساب المكافآت', 'ملخص النقاط', color);
  
  let yPos = 65;
  
  // Statement info
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightMargin - 55, yPos, 55, 20, 3, 3, 'F');
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.roundedRect(rightMargin - 55, yPos, 55, 20, 3, 3, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('رقم الكشف', rightMargin - 5, yPos + 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(statementNumber, rightMargin - 5, yPos + 16, { align: 'right' });
  
  // Date
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, yPos, 55, 20, 3, 3, 'F');
  doc.setDrawColor(...color);
  doc.roundedRect(leftMargin, yPos, 55, 20, 3, 3, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('تاريخ الإصدار', leftMargin + 50, yPos + 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(format(new Date(), 'dd/MM/yyyy'), leftMargin + 50, yPos + 16, { align: 'right' });
  
  // Tier badge
  if (data.tier_name_ar || data.tier_name) {
    doc.setFillColor(...color);
    doc.roundedRect(95, yPos + 3, 35, 14, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(data.tier_name_ar || data.tier_name || '', 112.5, yPos + 12, { align: 'center' });
  }
  
  yPos = 95;
  
  // Customer info
  if (data.user_name || data.user_email) {
    doc.setFillColor(...color);
    doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('صاحب الحساب', 105, yPos + 7, { align: 'center' });
    yPos += 15;
    
    if (data.user_name) {
      doc.setFillColor(252, 252, 252);
      doc.rect(leftMargin, yPos - 4, rightMargin - leftMargin, rowHeight, 'F');
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.text('الاسم', rightMargin - 5, yPos + 3, { align: 'right' });
      doc.setTextColor(50, 50, 50);
      doc.text(data.user_name, leftMargin + 5, yPos + 3, { align: 'left' });
      yPos += rowHeight;
    }
    
    if (data.user_email) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, yPos - 4, rightMargin - leftMargin, rowHeight, 'F');
      doc.setTextColor(80, 80, 80);
      doc.text('البريد الإلكتروني', rightMargin - 5, yPos + 3, { align: 'right' });
      doc.setTextColor(50, 50, 50);
      doc.text(data.user_email, leftMargin + 5, yPos + 3, { align: 'left' });
      yPos += rowHeight;
    }
    yPos += 5;
  }
  
  // Points summary section
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('ملخص النقاط', 105, yPos + 7, { align: 'center' });
  yPos += 18;
  
  // Points boxes
  const boxWidth = 52;
  const boxSpacing = 57;
  const startX = leftMargin;
  
  // Available points
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(startX, yPos, boxWidth, 32, 4, 4, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.8);
  doc.roundedRect(startX, yPos, boxWidth, 32, 4, 4, 'S');
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(18);
  doc.text(toArabicNumerals(data.available_points.toLocaleString()), startX + boxWidth / 2, yPos + 16, { align: 'center' });
  doc.setFontSize(9);
  doc.text('المتاحة', startX + boxWidth / 2, yPos + 26, { align: 'center' });
  
  // Total earned
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(startX + boxSpacing, yPos, boxWidth, 32, 4, 4, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.roundedRect(startX + boxSpacing, yPos, boxWidth, 32, 4, 4, 'S');
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(18);
  doc.text(toArabicNumerals(data.total_points.toLocaleString()), startX + boxSpacing + boxWidth / 2, yPos + 16, { align: 'center' });
  doc.setFontSize(9);
  doc.text('إجمالي المكتسبة', startX + boxSpacing + boxWidth / 2, yPos + 26, { align: 'center' });
  
  // Redeemed
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(startX + boxSpacing * 2, yPos, boxWidth, 32, 4, 4, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(startX + boxSpacing * 2, yPos, boxWidth, 32, 4, 4, 'S');
  doc.setTextColor(239, 68, 68);
  doc.setFontSize(18);
  doc.text(toArabicNumerals(data.redeemed_points.toLocaleString()), startX + boxSpacing * 2 + boxWidth / 2, yPos + 16, { align: 'center' });
  doc.setFontSize(9);
  doc.text('المستبدلة', startX + boxSpacing * 2 + boxWidth / 2, yPos + 26, { align: 'center' });
  
  yPos += 45;
  
  // Recent transactions
  if (data.transactions && data.transactions.length > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('آخر المعاملات', 105, yPos + 7, { align: 'center' });
    yPos += 17;
    
    // Table header
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos - 4, rightMargin - leftMargin, 11, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text('النقاط', leftMargin + 8, yPos + 3, { align: 'left' });
    doc.text('النوع', leftMargin + 35, yPos + 3, { align: 'left' });
    doc.text('الوصف', rightMargin - 50, yPos + 3, { align: 'right' });
    doc.text('التاريخ', rightMargin - 5, yPos + 3, { align: 'right' });
    yPos += 11;
    
    // Transaction type labels
    const typeLabelsAr: Record<string, string> = {
      earned: 'مكتسب',
      redeemed: 'مستبدل',
      bonus: 'مكافأة',
      expired: 'منتهي',
    };
    
    // Transactions (max 6)
    const maxTransactions = Math.min(data.transactions.length, 6);
    for (let i = 0; i < maxTransactions; i++) {
      const tx = data.transactions[i];
      const bgColor = i % 2 === 0 ? [252, 252, 252] : [248, 250, 252];
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(leftMargin, yPos - 4, rightMargin - leftMargin, 10, 'F');
      
      const isPositive = tx.points > 0;
      doc.setTextColor(isPositive ? 34 : 239, isPositive ? 197 : 68, isPositive ? 94 : 68);
      doc.setFontSize(8);
      doc.text((isPositive ? '+' : '') + toArabicNumerals(tx.points.toString()), leftMargin + 8, yPos + 2, { align: 'left' });
      
      doc.setTextColor(100, 100, 100);
      doc.text(typeLabelsAr[tx.type] || tx.type, leftMargin + 35, yPos + 2, { align: 'left' });
      
      doc.setTextColor(60, 60, 60);
      const desc = tx.description_ar || tx.description || '-';
      doc.text(desc.length > 25 ? desc.substring(0, 25) + '...' : desc, rightMargin - 50, yPos + 2, { align: 'right' });
      
      doc.text(format(new Date(tx.created_at), 'dd/MM/yy'), rightMargin - 5, yPos + 2, { align: 'right' });
      
      yPos += 10;
    }
  }
  
  yPos += 5;
  
  // Digital signature
  drawDigitalSignature(doc, yPos > 210 ? 210 : yPos, color);
  
  drawArabicFooter(doc, statementNumber, color);
  doc.save(`كشف-مكافآت-${statementNumber}.pdf`);
};

// ==================== DEPOSIT RECEIPT - Arabic ====================
interface DepositReceiptData {
  id: string;
  amount: number;
  bonus_amount?: number;
  fee_amount?: number;
  total_credited: number;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  completed_at?: string;
  user_name?: string;
  user_email?: string;
}

export const generateDepositReceipt = (data: DepositReceiptData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const receiptNumber = `DEP-${data.id.slice(0, 8).toUpperCase()}`;
  const leftMargin = 20;
  const rightMargin = 190;
  const rowHeight = 13;
  const color: [number, number, number] = [0, 128, 85];
  
  // Header
  drawArabicHeader(doc, 'إيصال إيداع', 'معاملة مالية', color);
  
  let yPos = 65;
  
  // Receipt number box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightMargin - 60, yPos, 60, 22, 3, 3, 'F');
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.roundedRect(rightMargin - 60, yPos, 60, 22, 3, 3, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('رقم الإيصال', rightMargin - 5, yPos + 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(receiptNumber, rightMargin - 5, yPos + 17, { align: 'right' });
  
  // Date box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, yPos, 60, 22, 3, 3, 'F');
  doc.setDrawColor(...color);
  doc.roundedRect(leftMargin, yPos, 60, 22, 3, 3, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('التاريخ', leftMargin + 55, yPos + 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(formatDateArabic(data.created_at), leftMargin + 55, yPos + 17, { align: 'right' });
  
  // Status badge
  const statusConfig: Record<string, { textAr: string; color: [number, number, number] }> = {
    pending: { textAr: 'قيد الانتظار', color: [234, 179, 8] },
    completed: { textAr: 'مكتمل', color: [34, 197, 94] },
    failed: { textAr: 'فشل', color: [239, 68, 68] },
    cancelled: { textAr: 'ملغي', color: [107, 114, 128] },
  };
  const statusInfo = statusConfig[data.status] || { textAr: data.status, color: [100, 100, 100] };
  
  doc.setFillColor(...statusInfo.color);
  doc.roundedRect(95, yPos + 4, 35, 14, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(statusInfo.textAr, 112.5, yPos + 13, { align: 'center' });
  
  yPos = 98;
  
  // Customer section
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('معلومات العميل', 105, yPos + 7, { align: 'center' });
  yPos += 17;
  
  if (data.user_name) {
    doc.setFillColor(252, 252, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text('اسم العميل', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    doc.text(data.user_name, leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  if (data.user_email) {
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text('البريد الإلكتروني', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    doc.text(data.user_email, leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  yPos += 5;
  
  // Transaction details
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('تفاصيل المعاملة', 105, yPos + 7, { align: 'center' });
  yPos += 17;
  
  // Payment method
  if (data.payment_method) {
    doc.setFillColor(252, 252, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text('طريقة الدفع', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    doc.text(data.payment_method, leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  // Transaction ID
  if (data.transaction_id) {
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text('رقم العملية', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    doc.text(data.transaction_id, leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  yPos += 5;
  
  // Amount details
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('تفاصيل المبلغ', 105, yPos + 7, { align: 'center' });
  yPos += 17;
  
  // Deposit amount
  doc.setFillColor(252, 252, 252);
  doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.text('مبلغ الإيداع', rightMargin - 5, yPos + 3, { align: 'right' });
  doc.setTextColor(50, 50, 50);
  doc.text(formatAmountArabic(data.amount) + ' ر.س', leftMargin + 5, yPos + 3, { align: 'left' });
  yPos += rowHeight;
  
  // Bonus
  if (data.bonus_amount && data.bonus_amount > 0) {
    doc.setFillColor(240, 253, 244);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(22, 163, 74);
    doc.text('المكافأة', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.text('+' + formatAmountArabic(data.bonus_amount) + ' ر.س', leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  // Fee
  if (data.fee_amount && data.fee_amount > 0) {
    doc.setFillColor(254, 242, 242);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(239, 68, 68);
    doc.text('الرسوم', rightMargin - 5, yPos + 3, { align: 'right' });
    doc.text('-' + formatAmountArabic(data.fee_amount) + ' ر.س', leftMargin + 5, yPos + 3, { align: 'left' });
    yPos += rowHeight;
  }
  
  // Total credited
  yPos += 3;
  doc.setFillColor(...color);
  doc.roundedRect(leftMargin, yPos - 2, rightMargin - leftMargin, 25, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('إجمالي المضاف للرصيد', rightMargin - 10, yPos + 10, { align: 'right' });
  doc.setFontSize(20);
  doc.text(formatAmountArabic(data.total_credited) + ' ر.س', leftMargin + 10, yPos + 13, { align: 'left' });
  
  yPos += 35;
  
  // Digital signature
  drawDigitalSignature(doc, yPos, color);
  
  drawArabicFooter(doc, receiptNumber, color);
  doc.save(`إيداع-${receiptNumber}.pdf`);
};
