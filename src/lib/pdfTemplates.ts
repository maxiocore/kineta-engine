import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Helper function for RTL text positioning
const rtlText = (doc: jsPDF, text: string, x: number, y: number) => {
  doc.text(text, x, y, { align: 'right' });
};

// Format numbers with Arabic style
const formatAmount = (amount: number) => {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Common header for all receipts
const drawHeader = (doc: jsPDF, title: string, subtitle: string, color: [number, number, number] = [0, 128, 85]) => {
  const pageWidth = 210;
  
  // Header gradient
  doc.setFillColor(...color);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Darker accent
  doc.setFillColor(color[0] * 0.8, color[1] * 0.8, color[2] * 0.8);
  doc.rect(0, 42, pageWidth, 8, 'F');
  
  // Logo circle
  doc.setFillColor(255, 255, 255);
  doc.circle(105, 20, 10, 'F');
  doc.setFillColor(...color);
  doc.circle(105, 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('M', 105, 23, { align: 'center' });
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('MaxioCore', 105, 36, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(title, 105, 47, { align: 'center' });
};

// Common footer
const drawFooter = (doc: jsPDF, receiptNumber: string) => {
  const pageWidth = 210;
  const leftMargin = 20;
  const rightMargin = 190;
  
  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, 260, rightMargin, 260);
  
  // QR placeholder
  doc.setFillColor(248, 250, 252);
  doc.rect(leftMargin, 265, 20, 20, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(leftMargin, 265, 20, 20, 'S');
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(6);
  doc.text('QR', leftMargin + 10, 277, { align: 'center' });
  
  // Footer text
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text('This is an electronically generated receipt', 105, 268, { align: 'center' });
  doc.text('No signature required', 105, 273, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('MaxioCore - Digital Services Platform', 105, 280, { align: 'center' });
  doc.text('support@maxiocore.com', 105, 285, { align: 'center' });
  
  // Generated timestamp
  doc.setFontSize(6);
  doc.text('Generated: ' + format(new Date(), 'dd/MM/yyyy HH:mm:ss'), rightMargin, 290, { align: 'right' });
  doc.text('Ref: ' + receiptNumber, leftMargin, 290);
  
  // Bottom bar
  doc.setFillColor(0, 128, 85);
  doc.rect(0, 293, pageWidth, 4, 'F');
};

// ==================== CASHBACK RECEIPT ====================
interface CashbackReceiptData {
  id: string;
  amount: number;
  type: string;
  description: string;
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
  const rowHeight = 12;
  
  // Header - Green theme for cashback
  drawHeader(doc, 'CASHBACK RECEIPT', 'Cashback Transaction', [0, 150, 100]);
  
  // Receipt info boxes
  let yPos = 58;
  
  // Receipt number
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightMargin - 55, yPos, 55, 20, 2, 2, 'F');
  doc.setDrawColor(0, 150, 100);
  doc.setLineWidth(0.5);
  doc.roundedRect(rightMargin - 55, yPos, 55, 20, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  rtlText(doc, 'Receipt Number', rightMargin - 5, yPos + 7);
  doc.setFontSize(10);
  doc.setTextColor(0, 150, 100);
  rtlText(doc, receiptNumber, rightMargin - 5, yPos + 15);
  
  // Date
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, yPos, 55, 20, 2, 2, 'F');
  doc.setDrawColor(0, 150, 100);
  doc.roundedRect(leftMargin, yPos, 55, 20, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Date', leftMargin + 5, yPos + 7);
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(format(new Date(data.created_at), 'dd/MM/yyyy HH:mm'), leftMargin + 5, yPos + 15);
  
  // Type badge
  const typeLabels: Record<string, { text: string; color: [number, number, number] }> = {
    earned: { text: 'EARNED', color: [0, 150, 100] },
    withdrawn: { text: 'WITHDRAWN', color: [59, 130, 246] },
    expired: { text: 'EXPIRED', color: [239, 68, 68] },
  };
  const typeInfo = typeLabels[data.type] || { text: data.type.toUpperCase(), color: [100, 100, 100] };
  
  doc.setFillColor(...typeInfo.color);
  doc.roundedRect(90, yPos + 3, 30, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(typeInfo.text, 105, yPos + 12, { align: 'center' });
  
  yPos = 90;
  
  // Section header
  doc.setFillColor(0, 150, 100);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TRANSACTION DETAILS', 105, yPos + 6, { align: 'center' });
  yPos += 15;
  
  // Customer info
  if (data.user_name) {
    doc.setFillColor(252, 252, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text('Customer', leftMargin + 5, yPos + 2);
    doc.setTextColor(50, 50, 50);
    rtlText(doc, data.user_name, rightMargin - 5, yPos + 2);
    yPos += rowHeight;
  }
  
  if (data.user_email) {
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text('Email', leftMargin + 5, yPos + 2);
    doc.setTextColor(50, 50, 50);
    rtlText(doc, data.user_email, rightMargin - 5, yPos + 2);
    yPos += rowHeight;
  }
  
  // Description
  doc.setFillColor(252, 252, 252);
  doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
  doc.setTextColor(80, 80, 80);
  doc.text('Description', leftMargin + 5, yPos + 2);
  doc.setTextColor(50, 50, 50);
  rtlText(doc, data.description || 'Cashback Transaction', rightMargin - 5, yPos + 2);
  yPos += rowHeight + 10;
  
  // Amount section
  doc.setFillColor(0, 150, 100);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('AMOUNT DETAILS', 105, yPos + 6, { align: 'center' });
  yPos += 18;
  
  // Amount box
  const isPositive = data.amount > 0;
  doc.setFillColor(isPositive ? 240 : 254, isPositive ? 253 : 242, isPositive ? 244 : 242);
  doc.roundedRect(leftMargin, yPos - 5, rightMargin - leftMargin, 25, 3, 3, 'F');
  doc.setDrawColor(isPositive ? 0 : 239, isPositive ? 150 : 68, isPositive ? 100 : 68);
  doc.setLineWidth(1);
  doc.roundedRect(leftMargin, yPos - 5, rightMargin - leftMargin, 25, 3, 3, 'S');
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.text('Cashback Amount', leftMargin + 10, yPos + 5);
  
  doc.setTextColor(isPositive ? 0 : 239, isPositive ? 150 : 68, isPositive ? 100 : 68);
  doc.setFontSize(16);
  rtlText(doc, (isPositive ? '+' : '') + formatAmount(data.amount) + ' SAR', rightMargin - 10, yPos + 10);
  
  yPos += 35;
  
  // Balance after (if available)
  if (data.balance_after !== undefined) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(leftMargin, yPos - 5, rightMargin - leftMargin, 18, 2, 2, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text('Balance After Transaction', leftMargin + 10, yPos + 5);
    doc.setTextColor(0, 150, 100);
    doc.setFontSize(12);
    rtlText(doc, formatAmount(data.balance_after) + ' SAR', rightMargin - 10, yPos + 7);
  }
  
  drawFooter(doc, receiptNumber);
  doc.save(`Cashback-${receiptNumber}.pdf`);
};

// ==================== CHALLENGE CERTIFICATE ====================
interface ChallengeCertificateData {
  id: string;
  title: string;
  description: string;
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
  
  // Background gradient effect
  doc.setFillColor(250, 250, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative border
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(3);
  doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 5, 5, 'S');
  
  doc.setDrawColor(199, 210, 254);
  doc.setLineWidth(1);
  doc.roundedRect(15, 15, pageWidth - 30, pageHeight - 30, 4, 4, 'S');
  
  // Corner decorations
  const corners = [[20, 20], [pageWidth - 20, 20], [20, pageHeight - 20], [pageWidth - 20, pageHeight - 20]];
  corners.forEach(([x, y]) => {
    doc.setFillColor(99, 102, 241);
    doc.circle(x, y, 4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y, 2, 'F');
  });
  
  // Header
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(pageWidth / 2 - 60, 25, 120, 30, 5, 5, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('CHALLENGE COMPLETED', pageWidth / 2, 40, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Certificate of Achievement', pageWidth / 2, 50, { align: 'center' });
  
  // Main content
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(12);
  doc.text('This certificate is proudly presented to', pageWidth / 2, 75, { align: 'center' });
  
  // User name
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(24);
  doc.text(data.user_name || 'Valued Customer', pageWidth / 2, 95, { align: 'center' });
  
  // Decorative line under name
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 60, 100, pageWidth / 2 + 60, 100);
  
  // Challenge details
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.text('For successfully completing the challenge:', pageWidth / 2, 115, { align: 'center' });
  
  // Challenge title box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth / 2 - 80, 120, 160, 25, 3, 3, 'F');
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth / 2 - 80, 120, 160, 25, 3, 3, 'S');
  
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(14);
  doc.text(data.title, pageWidth / 2, 135, { align: 'center' });
  
  // Stats row
  const statsY = 155;
  const statBoxWidth = 60;
  const statSpacing = 70;
  const startX = pageWidth / 2 - statSpacing;
  
  // Target achieved
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(startX - statBoxWidth / 2, statsY, statBoxWidth, 25, 3, 3, 'F');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(16);
  doc.text(`${data.current_value}/${data.target_value}`, startX, statsY + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Target Achieved', startX, statsY + 20, { align: 'center' });
  
  // Points earned
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(startX + statSpacing - statBoxWidth / 2, statsY, statBoxWidth, 25, 3, 3, 'F');
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(16);
  doc.text(`+${data.reward_points}`, startX + statSpacing, statsY + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Points Earned', startX + statSpacing, statsY + 20, { align: 'center' });
  
  // Date and certificate number
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text(`Completed on: ${format(new Date(data.completed_at), 'dd MMMM yyyy')}`, pageWidth / 2, 190, { align: 'center' });
  doc.text(`Certificate: ${certificateNumber}`, pageWidth / 2, 196, { align: 'center' });
  
  // Signature area
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 80, 185, pageWidth - 30, 185);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('MaxioCore', pageWidth - 55, 192, { align: 'center' });
  
  doc.save(`Challenge-Certificate-${certificateNumber}.pdf`);
};

// ==================== ORDER RECEIPT ====================
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
  const rowHeight = 12;
  
  // Header - Blue theme for orders
  drawHeader(doc, 'ORDER RECEIPT', 'Service Order', [37, 99, 235]);
  
  let yPos = 58;
  
  // Order number box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightMargin - 55, yPos, 55, 20, 2, 2, 'F');
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(rightMargin - 55, yPos, 55, 20, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  rtlText(doc, 'Order Number', rightMargin - 5, yPos + 7);
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  rtlText(doc, receiptNumber, rightMargin - 5, yPos + 15);
  
  // Date box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, yPos, 55, 20, 2, 2, 'F');
  doc.setDrawColor(37, 99, 235);
  doc.roundedRect(leftMargin, yPos, 55, 20, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Date', leftMargin + 5, yPos + 7);
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(format(new Date(data.created_at), 'dd/MM/yyyy HH:mm'), leftMargin + 5, yPos + 15);
  
  // Status badge
  const statusConfig: Record<string, { text: string; color: [number, number, number] }> = {
    pending: { text: 'PENDING', color: [234, 179, 8] },
    processing: { text: 'PROCESSING', color: [59, 130, 246] },
    in_progress: { text: 'IN PROGRESS', color: [139, 92, 246] },
    completed: { text: 'COMPLETED', color: [34, 197, 94] },
    partial: { text: 'PARTIAL', color: [249, 115, 22] },
    cancelled: { text: 'CANCELLED', color: [239, 68, 68] },
    refunded: { text: 'REFUNDED', color: [107, 114, 128] },
  };
  const statusInfo = statusConfig[data.status] || { text: data.status.toUpperCase(), color: [100, 100, 100] };
  
  doc.setFillColor(...statusInfo.color);
  doc.roundedRect(88, yPos + 3, 34, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(statusInfo.text, 105, yPos + 12, { align: 'center' });
  
  yPos = 88;
  
  // Customer section
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('CUSTOMER INFORMATION', 105, yPos + 6, { align: 'center' });
  yPos += 15;
  
  if (data.user_name) {
    doc.setFillColor(252, 252, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text('Name', leftMargin + 5, yPos + 2);
    doc.setTextColor(50, 50, 50);
    rtlText(doc, data.user_name, rightMargin - 5, yPos + 2);
    yPos += rowHeight;
  }
  
  if (data.user_email) {
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text('Email', leftMargin + 5, yPos + 2);
    doc.setTextColor(50, 50, 50);
    rtlText(doc, data.user_email, rightMargin - 5, yPos + 2);
    yPos += rowHeight;
  }
  
  yPos += 5;
  
  // Service section
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('SERVICE DETAILS', 105, yPos + 6, { align: 'center' });
  yPos += 15;
  
  // Service name
  doc.setFillColor(252, 252, 252);
  doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text('Service', leftMargin + 5, yPos + 2);
  doc.setTextColor(50, 50, 50);
  const serviceName = data.service_name.length > 40 ? data.service_name.substring(0, 40) + '...' : data.service_name;
  rtlText(doc, serviceName, rightMargin - 5, yPos + 2);
  yPos += rowHeight;
  
  // Quantity
  doc.setFillColor(248, 250, 252);
  doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
  doc.setTextColor(80, 80, 80);
  doc.text('Quantity', leftMargin + 5, yPos + 2);
  doc.setTextColor(50, 50, 50);
  rtlText(doc, data.quantity.toLocaleString(), rightMargin - 5, yPos + 2);
  yPos += rowHeight;
  
  // Link (if provided)
  if (data.link) {
    doc.setFillColor(252, 252, 252);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text('Link', leftMargin + 5, yPos + 2);
    doc.setTextColor(37, 99, 235);
    const linkText = data.link.length > 45 ? data.link.substring(0, 45) + '...' : data.link;
    rtlText(doc, linkText, rightMargin - 5, yPos + 2);
    yPos += rowHeight;
  }
  
  yPos += 5;
  
  // Payment section
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('PAYMENT DETAILS', 105, yPos + 6, { align: 'center' });
  yPos += 15;
  
  // Subtotal
  const subtotal = data.total_price + (data.discount_amount || 0);
  doc.setFillColor(252, 252, 252);
  doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text('Subtotal', leftMargin + 5, yPos + 2);
  doc.setTextColor(50, 50, 50);
  rtlText(doc, formatAmount(subtotal) + ' SAR', rightMargin - 5, yPos + 2);
  yPos += rowHeight;
  
  // Discount (if any)
  if (data.discount_amount && data.discount_amount > 0) {
    doc.setFillColor(240, 253, 244);
    doc.rect(leftMargin, yPos - 5, rightMargin - leftMargin, rowHeight, 'F');
    doc.setTextColor(22, 163, 74);
    doc.text('Discount', leftMargin + 5, yPos + 2);
    rtlText(doc, '-' + formatAmount(data.discount_amount) + ' SAR', rightMargin - 5, yPos + 2);
    yPos += rowHeight;
  }
  
  // Total
  yPos += 3;
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(leftMargin, yPos - 2, rightMargin - leftMargin, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('TOTAL', leftMargin + 10, yPos + 10);
  doc.setFontSize(14);
  rtlText(doc, formatAmount(data.total_price) + ' SAR', rightMargin - 10, yPos + 10);
  
  // Completion date
  if (data.completed_at) {
    yPos += 28;
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(9);
    doc.text('Completed: ' + format(new Date(data.completed_at), 'dd/MM/yyyy HH:mm'), 105, yPos, { align: 'center' });
  }
  
  drawFooter(doc, receiptNumber);
  doc.save(`Order-${receiptNumber}.pdf`);
};

// ==================== BADGE CERTIFICATE ====================
interface BadgeCertificateData {
  id: string;
  name: string;
  name_ar: string;
  description: string;
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
  
  // Golden background for badges
  doc.setFillColor(255, 251, 235);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative border - gold theme
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(3);
  doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 5, 5, 'S');
  
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(1);
  doc.roundedRect(15, 15, pageWidth - 30, pageHeight - 30, 4, 4, 'S');
  
  // Corner stars
  const corners = [[25, 25], [pageWidth - 25, 25], [25, pageHeight - 25], [pageWidth - 25, pageHeight - 25]];
  corners.forEach(([x, y]) => {
    doc.setFillColor(217, 119, 6);
    // Simple star shape using circles
    doc.circle(x, y, 5, 'F');
    doc.setFillColor(255, 251, 235);
    doc.circle(x, y, 2.5, 'F');
    doc.setFillColor(251, 191, 36);
    doc.circle(x, y, 1.5, 'F');
  });
  
  // Header
  doc.setFillColor(217, 119, 6);
  doc.roundedRect(pageWidth / 2 - 70, 25, 140, 30, 5, 5, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('BADGE ACHIEVED', pageWidth / 2, 42, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Certificate of Recognition', pageWidth / 2, 50, { align: 'center' });
  
  // Badge icon circle
  doc.setFillColor(251, 191, 36);
  doc.circle(pageWidth / 2, 80, 20, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth / 2, 80, 17, 'F');
  
  // Tier indicator
  doc.setFillColor(217, 119, 6);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text(data.icon || data.tier.toString(), pageWidth / 2, 86, { align: 'center' });
  
  // Tier label
  const tierLabels = ['', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(10);
  doc.text(`Tier ${data.tier}: ${tierLabels[data.tier] || 'Elite'}`, pageWidth / 2, 108, { align: 'center' });
  
  // Presented to
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.text('This badge is proudly awarded to', pageWidth / 2, 120, { align: 'center' });
  
  // User name
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(22);
  doc.text(data.user_name || 'Valued Customer', pageWidth / 2, 135, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 50, 140, pageWidth / 2 + 50, 140);
  
  // Badge name box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(pageWidth / 2 - 70, 148, 140, 30, 3, 3, 'F');
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth / 2 - 70, 148, 140, 30, 3, 3, 'S');
  
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(16);
  doc.text(data.name, pageWidth / 2, 160, { align: 'center' });
  doc.setFontSize(10);
  doc.text(data.name_ar, pageWidth / 2, 172, { align: 'center' });
  
  // Description
  if (data.description) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    const desc = data.description.length > 80 ? data.description.substring(0, 80) + '...' : data.description;
    doc.text(desc, pageWidth / 2, 188, { align: 'center' });
  }
  
  // Date and certificate number
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(`Awarded on: ${format(new Date(data.awarded_at), 'dd MMMM yyyy')}`, 40, 195);
  doc.text(`Certificate: ${certificateNumber}`, pageWidth - 40, 195, { align: 'right' });
  
  doc.save(`Badge-Certificate-${certificateNumber}.pdf`);
};

// ==================== REWARDS STATEMENT ====================
interface RewardsStatementData {
  user_name?: string;
  user_email?: string;
  available_points: number;
  total_points: number;
  redeemed_points: number;
  tier_name?: string;
  transactions: Array<{
    id: string;
    type: string;
    points: number;
    description: string;
    created_at: string;
  }>;
  generated_at?: string;
}

export const generateRewardsStatement = (data: RewardsStatementData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const statementNumber = `RWD-${Date.now().toString(36).toUpperCase()}`;
  const leftMargin = 20;
  const rightMargin = 190;
  const rowHeight = 10;
  
  // Header - Purple/Gold theme for rewards
  drawHeader(doc, 'REWARDS STATEMENT', 'Points Summary', [139, 92, 246]);
  
  let yPos = 58;
  
  // Statement info
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightMargin - 55, yPos, 55, 18, 2, 2, 'F');
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.roundedRect(rightMargin - 55, yPos, 55, 18, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  rtlText(doc, 'Statement', rightMargin - 5, yPos + 6);
  doc.setFontSize(9);
  doc.setTextColor(139, 92, 246);
  rtlText(doc, statementNumber, rightMargin - 5, yPos + 13);
  
  // Date
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftMargin, yPos, 55, 18, 2, 2, 'F');
  doc.setDrawColor(139, 92, 246);
  doc.roundedRect(leftMargin, yPos, 55, 18, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Generated', leftMargin + 5, yPos + 6);
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(format(new Date(), 'dd/MM/yyyy'), leftMargin + 5, yPos + 13);
  
  // Tier badge (if available)
  if (data.tier_name) {
    doc.setFillColor(139, 92, 246);
    doc.roundedRect(90, yPos + 2, 30, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(data.tier_name.toUpperCase(), 105, yPos + 11, { align: 'center' });
  }
  
  yPos = 85;
  
  // Customer info
  if (data.user_name || data.user_email) {
    doc.setFillColor(139, 92, 246);
    doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('ACCOUNT HOLDER', 105, yPos + 6, { align: 'center' });
    yPos += 13;
    
    if (data.user_name) {
      doc.setFillColor(252, 252, 252);
      doc.rect(leftMargin, yPos - 4, rightMargin - leftMargin, rowHeight, 'F');
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.text('Name', leftMargin + 5, yPos + 2);
      doc.setTextColor(50, 50, 50);
      rtlText(doc, data.user_name, rightMargin - 5, yPos + 2);
      yPos += rowHeight;
    }
    
    if (data.user_email) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, yPos - 4, rightMargin - leftMargin, rowHeight, 'F');
      doc.setTextColor(80, 80, 80);
      doc.text('Email', leftMargin + 5, yPos + 2);
      doc.setTextColor(50, 50, 50);
      rtlText(doc, data.user_email, rightMargin - 5, yPos + 2);
      yPos += rowHeight;
    }
    yPos += 5;
  }
  
  // Points summary section
  doc.setFillColor(139, 92, 246);
  doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('POINTS SUMMARY', 105, yPos + 6, { align: 'center' });
  yPos += 15;
  
  // Points boxes
  const boxWidth = 50;
  const boxSpacing = 56;
  const startX = leftMargin;
  
  // Available points
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(startX, yPos, boxWidth, 28, 3, 3, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.roundedRect(startX, yPos, boxWidth, 28, 3, 3, 'S');
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(16);
  doc.text(data.available_points.toLocaleString(), startX + boxWidth / 2, yPos + 14, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Available', startX + boxWidth / 2, yPos + 23, { align: 'center' });
  
  // Total earned
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(startX + boxSpacing, yPos, boxWidth, 28, 3, 3, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.roundedRect(startX + boxSpacing, yPos, boxWidth, 28, 3, 3, 'S');
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(16);
  doc.text(data.total_points.toLocaleString(), startX + boxSpacing + boxWidth / 2, yPos + 14, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Total Earned', startX + boxSpacing + boxWidth / 2, yPos + 23, { align: 'center' });
  
  // Redeemed
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(startX + boxSpacing * 2, yPos, boxWidth, 28, 3, 3, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(startX + boxSpacing * 2, yPos, boxWidth, 28, 3, 3, 'S');
  doc.setTextColor(239, 68, 68);
  doc.setFontSize(16);
  doc.text(data.redeemed_points.toLocaleString(), startX + boxSpacing * 2 + boxWidth / 2, yPos + 14, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Redeemed', startX + boxSpacing * 2 + boxWidth / 2, yPos + 23, { align: 'center' });
  
  yPos += 40;
  
  // Recent transactions
  if (data.transactions && data.transactions.length > 0) {
    doc.setFillColor(139, 92, 246);
    doc.roundedRect(leftMargin, yPos, rightMargin - leftMargin, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('RECENT TRANSACTIONS', 105, yPos + 6, { align: 'center' });
    yPos += 15;
    
    // Table header
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos - 4, rightMargin - leftMargin, 10, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.text('Date', leftMargin + 5, yPos + 2);
    doc.text('Description', leftMargin + 35, yPos + 2);
    doc.text('Type', rightMargin - 40, yPos + 2);
    rtlText(doc, 'Points', rightMargin - 5, yPos + 2);
    yPos += 10;
    
    // Transactions (max 8)
    const maxTransactions = Math.min(data.transactions.length, 8);
    for (let i = 0; i < maxTransactions; i++) {
      const tx = data.transactions[i];
      const bgColor = i % 2 === 0 ? [252, 252, 252] : [248, 250, 252];
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(leftMargin, yPos - 4, rightMargin - leftMargin, 9, 'F');
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text(format(new Date(tx.created_at), 'dd/MM/yy'), leftMargin + 5, yPos + 2);
      
      doc.setTextColor(60, 60, 60);
      const desc = tx.description?.length > 35 ? tx.description.substring(0, 35) + '...' : (tx.description || '-');
      doc.text(desc, leftMargin + 35, yPos + 2);
      
      doc.text(tx.type, rightMargin - 40, yPos + 2);
      
      const isPositive = tx.points > 0;
      doc.setTextColor(isPositive ? 34 : 239, isPositive ? 197 : 68, isPositive ? 94 : 68);
      rtlText(doc, (isPositive ? '+' : '') + tx.points.toString(), rightMargin - 5, yPos + 2);
      
      yPos += 9;
    }
  }
  
  drawFooter(doc, statementNumber);
  doc.save(`Rewards-Statement-${statementNumber}.pdf`);
};
