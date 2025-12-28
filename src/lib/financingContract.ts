import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface FinancingContractData {
  contractNumber: string;
  applicationNumber: string;
  clientName: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  amount: number;
  installmentsCount: number;
  planName: string;
  installments: Array<{
    number: number;
    amount: number;
    dueDate: string;
  }>;
  signatureData: string;
  contractDate: string;
}

// Format amount in Arabic style
const formatAmountArabic = (amount: number): string => {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format date in Arabic
const formatDateArabic = (date: string | Date): string => {
  try {
    const d = new Date(date);
    return format(d, 'dd MMMM yyyy', { locale: ar });
  } catch {
    return new Date().toLocaleDateString('ar-SA');
  }
};

// Convert number to Arabic words
const numberToArabicWords = (num: number): string => {
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مئة", "مئتان", "ثلاثمئة", "أربعمئة", "خمسمئة", "ستمئة", "سبعمئة", "ثمانمئة", "تسعمئة"];
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    if (thousands === 1) return "ألف" + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
    if (thousands === 2) return "ألفان" + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
    if (thousands <= 10) return ones[thousands] + " آلاف" + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
    return thousands + " ألف" + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
  }
  
  if (num >= 100) {
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    return hundreds[h] + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
  }
  
  if (num >= 10) {
    const t = Math.floor(num / 10);
    const o = num % 10;
    if (o === 0) return tens[t];
    return ones[o] + " و" + tens[t];
  }
  
  return ones[num];
};

export async function generateFinancingContract(data: FinancingContractData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 0;

  // Colors
  const primaryColor: [number, number, number] = [245, 158, 11]; // Amber
  const darkColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const grayColor: [number, number, number] = [100, 116, 139]; // Slate 500
  const lightGray: [number, number, number] = [248, 250, 252]; // Slate 50
  const greenColor: [number, number, number] = [16, 185, 129]; // Emerald

  // Helper function to add new page if needed
  const checkNewPage = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to draw rounded rectangle
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fill: [number, number, number], stroke?: [number, number, number]) => {
    pdf.setFillColor(...fill);
    if (stroke) {
      pdf.setDrawColor(...stroke);
      pdf.setLineWidth(0.3);
    }
    pdf.roundedRect(x, y, w, h, r, r, stroke ? 'FD' : 'F');
  };

  // ============= HEADER =============
  // Dark header background
  pdf.setFillColor(...darkColor);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  // Amber accent line
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 35, pageWidth, 2, 'F');

  // Logo box
  pdf.setFillColor(...primaryColor);
  pdf.roundedRect(margin, 8, 18, 18, 3, 3, 'F');
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('M', margin + 9, 20, { align: 'center' });

  // Company name
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(16);
  pdf.text('MaxioCore', margin + 22, 15);
  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(9);
  pdf.text('شركة علي صالح الشهري القابضة', margin + 22, 23);

  // Contract title on the left (RTL)
  pdf.setFillColor(245, 158, 11, 0.15);
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  drawRoundedRect(pageWidth - margin - 45, 10, 40, 14, 7, [50, 55, 65], primaryColor);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text('عقد التمويل', pageWidth - margin - 25, 19, { align: 'center' });

  yPos = 42;

  // ============= INFO BAR =============
  pdf.setFillColor(...lightGray);
  pdf.rect(0, 37, pageWidth, 22, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(0, 59, pageWidth, 59);

  const infoItems = [
    { label: 'رقم العقد', value: data.contractNumber, gold: true },
    { label: 'رقم الطلب', value: data.applicationNumber, gold: false },
    { label: 'تاريخ العقد', value: formatDateArabic(data.contractDate), gold: false },
    { label: 'مبلغ التمويل', value: `${formatAmountArabic(data.amount)} ر.س`, gold: true },
  ];

  const infoWidth = contentWidth / 4;
  infoItems.forEach((item, index) => {
    const x = pageWidth - margin - (index + 1) * infoWidth + infoWidth / 2;
    pdf.setFontSize(8);
    pdf.setTextColor(...grayColor);
    pdf.text(item.label, x, 44, { align: 'center' });
    pdf.setFontSize(10);
    if (item.gold) {
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    } else {
      pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    }
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.value, x, 52, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
  });

  yPos = 65;

  // ============= PARTIES SECTION =============
  // Section title
  pdf.setFillColor(...primaryColor);
  pdf.roundedRect(pageWidth - margin - 8, yPos, 6, 6, 1, 1, 'F');
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('أطراف العقد', pageWidth - margin - 12, yPos + 5, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  
  // Underline
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos + 10, pageWidth - margin, yPos + 10);
  
  yPos += 18;

  // Party boxes
  const partyBoxWidth = (contentWidth - 8) / 2;
  const partyBoxHeight = 38;

  // First Party (Right side)
  drawRoundedRect(pageWidth - margin - partyBoxWidth, yPos, partyBoxWidth, partyBoxHeight, 3, [255, 251, 235], primaryColor);
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('الطرف الأول (الممول)', pageWidth - margin - 5, yPos + 7, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(8);
  const party1Data = [
    ['اسم الشركة:', 'شركة علي صالح الشهري القابضة'],
    ['السجل التجاري:', '4030554749'],
    ['العنوان:', 'المملكة العربية السعودية'],
  ];
  party1Data.forEach((row, i) => {
    pdf.setTextColor(...grayColor);
    pdf.text(row[0], pageWidth - margin - 5, yPos + 14 + (i * 7), { align: 'right' });
    pdf.setTextColor(...darkColor);
    pdf.text(row[1], pageWidth - margin - 35, yPos + 14 + (i * 7), { align: 'right' });
  });

  // Second Party (Left side)
  drawRoundedRect(margin, yPos, partyBoxWidth, partyBoxHeight, 3, [236, 253, 245], greenColor);
  pdf.setTextColor(...greenColor);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('الطرف الثاني (المستفيد)', margin + partyBoxWidth - 5, yPos + 7, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  
  pdf.setFontSize(8);
  const party2Data = [
    ['الاسم:', data.clientName],
    ['رقم الهوية:', data.nationalId],
    ['الجوال:', data.phone],
  ];
  party2Data.forEach((row, i) => {
    pdf.setTextColor(...grayColor);
    pdf.text(row[0], margin + partyBoxWidth - 5, yPos + 14 + (i * 7), { align: 'right' });
    pdf.setTextColor(...darkColor);
    pdf.text(row[1], margin + partyBoxWidth - 25, yPos + 14 + (i * 7), { align: 'right' });
  });

  yPos += partyBoxHeight + 12;

  // ============= TERMS SECTION =============
  checkNewPage(80);
  
  pdf.setFillColor(...primaryColor);
  pdf.roundedRect(pageWidth - margin - 8, yPos, 6, 6, 1, 1, 'F');
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('بنود وشروط العقد', pageWidth - margin - 12, yPos + 5, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, yPos + 10, pageWidth - margin, yPos + 10);
  
  yPos += 16;

  const terms = [
    `يوافق الطرف الأول على تمويل الطرف الثاني بمبلغ ${formatAmountArabic(data.amount)} ر.س (فقط ${numberToArabicWords(Math.floor(data.amount))} ريال سعودي).`,
    'يقر الطرف الثاني بأن التمويل سيُستخدم حصرياً لشراء خدمات من منصة ماكسيوكور.',
    `يلتزم الطرف الثاني بسداد مبلغ التمويل على ${data.installmentsCount} أقساط شهرية متساوية.`,
    'هذا التمويل بدون فوائد أو رسوم إضافية، بشرط الالتزام بمواعيد السداد.',
    'في حال تأخر السداد لمدة تتجاوز 30 يوماً، يحق للطرف الأول اتخاذ الإجراءات القانونية.',
    'يقر الطرف الثاني بصحة جميع البيانات المقدمة ويتحمل المسؤولية الكاملة.',
    'يخضع هذا العقد للأنظمة والقوانين المعمول بها في المملكة العربية السعودية.',
  ];

  terms.forEach((term, index) => {
    checkNewPage(14);
    
    // Term box background
    pdf.setFillColor(...lightGray);
    pdf.roundedRect(margin, yPos, contentWidth, 11, 2, 2, 'F');
    
    // Amber right border
    pdf.setFillColor(...primaryColor);
    pdf.rect(pageWidth - margin - 2, yPos + 1, 2, 9, 'F');
    
    // Badge
    pdf.setFillColor(...primaryColor);
    pdf.roundedRect(pageWidth - margin - 28, yPos + 2, 22, 7, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.text(`البند ${index + 1}`, pageWidth - margin - 17, yPos + 7, { align: 'center' });
    
    // Term text
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(term, contentWidth - 40);
    pdf.text(lines, pageWidth - margin - 32, yPos + 7, { align: 'right' });
    
    yPos += 13;
  });

  yPos += 8;

  // ============= INSTALLMENTS TABLE =============
  checkNewPage(60);
  
  pdf.setFillColor(...primaryColor);
  pdf.roundedRect(pageWidth - margin - 8, yPos, 6, 6, 1, 1, 'F');
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('جدول الأقساط', pageWidth - margin - 12, yPos + 5, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, yPos + 10, pageWidth - margin, yPos + 10);
  
  yPos += 16;

  // Table header
  pdf.setFillColor(...darkColor);
  pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
  
  const colWidths = [contentWidth * 0.15, contentWidth * 0.25, contentWidth * 0.35, contentWidth * 0.25];
  const headers = ['رقم القسط', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة'];
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  let xPos = pageWidth - margin;
  headers.forEach((header, i) => {
    xPos -= colWidths[i];
    pdf.text(header, xPos + colWidths[i] / 2, yPos + 7, { align: 'center' });
  });

  yPos += 12;

  // Table rows
  data.installments.forEach((inst, index) => {
    checkNewPage(10);
    
    if (index % 2 === 0) {
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, yPos - 2, contentWidth, 9, 'F');
    }
    
    pdf.setTextColor(...darkColor);
    pdf.setFontSize(8);
    
    xPos = pageWidth - margin;
    const rowData = [
      inst.number.toString(),
      `${formatAmountArabic(inst.amount)} ر.س`,
      formatDateArabic(inst.dueDate),
      'قيد الانتظار'
    ];
    
    rowData.forEach((cell, i) => {
      xPos -= colWidths[i];
      pdf.text(cell, xPos + colWidths[i] / 2, yPos + 4, { align: 'center' });
    });
    
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, yPos + 7, pageWidth - margin, yPos + 7);
    
    yPos += 9;
  });

  // Total row
  pdf.setFillColor(...primaryColor);
  pdf.rect(margin, yPos - 2, contentWidth, 10, 'F');
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('الإجمالي', pageWidth - margin - colWidths[0] / 2, yPos + 5, { align: 'center' });
  pdf.text(`${formatAmountArabic(data.amount)} ر.س`, pageWidth - margin - colWidths[0] - colWidths[1] / 2, yPos + 5, { align: 'center' });
  pdf.setFont('helvetica', 'normal');

  yPos += 18;

  // ============= SIGNATURES SECTION =============
  checkNewPage(70);
  
  pdf.setFillColor(...primaryColor);
  pdf.roundedRect(pageWidth - margin - 8, yPos, 6, 6, 1, 1, 'F');
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('التوقيعات', pageWidth - margin - 12, yPos + 5, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, yPos + 10, pageWidth - margin, yPos + 10);
  
  yPos += 18;

  const sigBoxWidth = (contentWidth - 15) / 2;
  const sigBoxHeight = 50;

  // First Party Signature (Right)
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.roundedRect(pageWidth - margin - sigBoxWidth, yPos, sigBoxWidth, sigBoxHeight, 3, 3, 'S');
  pdf.setLineDashPattern([], 0);
  
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('توقيع الطرف الأول', pageWidth - margin - sigBoxWidth / 2, yPos + 10, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  
  // Company stamp
  pdf.setDrawColor(...greenColor);
  pdf.setLineWidth(1);
  pdf.circle(pageWidth - margin - sigBoxWidth / 2, yPos + 28, 12, 'S');
  pdf.setTextColor(...greenColor);
  pdf.setFontSize(6);
  pdf.text('شركة علي صالح', pageWidth - margin - sigBoxWidth / 2, yPos + 25, { align: 'center' });
  pdf.text('الشهري القابضة', pageWidth - margin - sigBoxWidth / 2, yPos + 29, { align: 'center' });
  pdf.setFontSize(5);
  pdf.text('4030554749', pageWidth - margin - sigBoxWidth / 2, yPos + 33, { align: 'center' });
  
  pdf.setTextColor(...grayColor);
  pdf.setFontSize(7);
  pdf.text(`التاريخ: ${formatDateArabic(data.contractDate)}`, pageWidth - margin - sigBoxWidth / 2, yPos + 46, { align: 'center' });

  // Second Party Signature (Left)
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.roundedRect(margin, yPos, sigBoxWidth, sigBoxHeight, 3, 3, 'S');
  pdf.setLineDashPattern([], 0);
  
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('توقيع الطرف الثاني', margin + sigBoxWidth / 2, yPos + 10, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  
  // Client signature
  if (data.signatureData) {
    try {
      pdf.addImage(data.signatureData, 'PNG', margin + sigBoxWidth / 2 - 20, yPos + 14, 40, 18);
    } catch (e) {
      console.error('Error adding signature image:', e);
    }
  }
  
  pdf.setTextColor(...darkColor);
  pdf.setFontSize(8);
  pdf.text(data.clientName, margin + sigBoxWidth / 2, yPos + 38, { align: 'center' });
  pdf.setTextColor(...grayColor);
  pdf.setFontSize(7);
  pdf.text(`التاريخ: ${formatDateArabic(new Date())}`, margin + sigBoxWidth / 2, yPos + 46, { align: 'center' });

  yPos += sigBoxHeight + 15;

  // ============= FOOTER =============
  const footerY = pageHeight - 12;
  pdf.setFillColor(...darkColor);
  pdf.rect(0, footerY - 8, pageWidth, 20, 'F');
  
  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(7);
  pdf.text('هذا العقد ملزم قانونياً للطرفين | السجل التجاري: 4030554749', margin, footerY, { align: 'left' });
  
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MaxioCore', pageWidth - margin, footerY, { align: 'right' });

  // Save PDF
  pdf.save(`عقد_التمويل_${data.contractNumber}.pdf`);
}
