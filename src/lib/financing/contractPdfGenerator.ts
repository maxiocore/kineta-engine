/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *                    مولد PDF لعقد تمويل الخدمات - Contract PDF Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ✅ دعم كامل للغة العربية:
 *    - Arabic Shaping: الحروف متصلة بشكل صحيح
 *    - RTL Direction: اتجاه النص من اليمين لليسار
 *    - Embedded Fonts: خط Amiri مضمن داخل PDF
 * 
 * ✅ تصميم رسمي بنكي:
 *    - ترويسة ثابتة في كل صفحة
 *    - تذييل مع ترقيم الصفحات
 *    - جداول منسقة RTL
 *    - بنود مرقمة بصياغة قانونية
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY_INFO } from "./serviceFinancingPolicy";
import { 
  CONTRACT_INFO,
  type ContractPlaceholders,
} from "./serviceFinancingContract";
import {
  LEGAL_CONTRACT_ARTICLES,
  CLIENT_LEGAL_ACKNOWLEDGMENTS,
  LEGAL_COMPANY_INFO,
  CONTRACT_VERSION_INFO,
} from "./legalContractContent";
import {
  processArabicText,
  formatCurrencyForPdf,
  PDF_COLORS,
} from "./arabicPdfUtils";

// ============================================
// Font Loading
// ============================================

let fontsLoaded = false;
let amiriRegularBase64: string | null = null;
let amiriBoldBase64: string | null = null;

async function loadArabicFonts(): Promise<void> {
  if (fontsLoaded) return;

  try {
    const regularResponse = await fetch("/fonts/Amiri-Regular.ttf");
    const regularBuffer = await regularResponse.arrayBuffer();
    amiriRegularBase64 = arrayBufferToBase64(regularBuffer);

    const boldResponse = await fetch("/fonts/Amiri-Bold.ttf");
    const boldBuffer = await boldResponse.arrayBuffer();
    amiriBoldBase64 = arrayBufferToBase64(boldBuffer);

    fontsLoaded = true;
    console.log("✅ Arabic fonts loaded successfully for PDF");
  } catch (error) {
    console.error("❌ Error loading Arabic fonts:", error);
    throw new Error("فشل تحميل الخطوط العربية");
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ============================================
// Utilities
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

async function calculateContractHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ============================================
// Types
// ============================================

interface PageInfo {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  currentY: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * كتابة نص عربي في PDF
 * يطبق Arabic Shaping تلقائياً
 */
function writeArabicText(
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  options?: { align?: "left" | "center" | "right"; maxWidth?: number }
): void {
  const processedText = processArabicText(text);
  const align = options?.align || "right";
  
  if (options?.maxWidth) {
    const lines = doc.splitTextToSize(processedText, options.maxWidth);
    lines.forEach((line: string, index: number) => {
      doc.text(line, x, y + (index * 5), { align });
    });
  } else {
    doc.text(processedText, x, y, { align });
  }
}

/**
 * كتابة فقرة عربية متعددة الأسطر
 */
function writeArabicParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = 5
): number {
  const processedText = processArabicText(text);
  const lines = doc.splitTextToSize(processedText, maxWidth);
  let currentY = y;
  
  lines.forEach((line: string) => {
    if (line.trim()) {
      doc.text(line, x, currentY, { align: "right" });
      currentY += lineHeight;
    }
  });
  
  return currentY;
}

// ============================================
// PDF Sections
// ============================================

/**
 * إضافة الترويسة
 */
function addHeader(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders | null): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;

  // خلفية الترويسة
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, pageInfo.pageWidth, 42, "F");
  
  // خط ملون تحت الترويسة
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 42, pageInfo.pageWidth, 1.5, "F");

  // اسم الشركة
  doc.setFont("Amiri", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, LEGAL_COMPANY_INFO.name, rightX, 15);

  // معلومات الشركة
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.secondary);
  writeArabicText(doc, `سجل تجاري: ${LEGAL_COMPANY_INFO.commercialRegister}`, rightX, 22);
  writeArabicText(doc, LEGAL_COMPANY_INFO.address, rightX, 28);
  
  if (contractData) {
    // رقم العقد والتاريخ على اليسار
    doc.setTextColor(...PDF_COLORS.primary);
    doc.setFont("Amiri", "bold");
    writeArabicText(doc, `رقم العقد: ${contractData.application_number}`, pageInfo.margin, 15, { align: "left" });
    doc.setFont("Amiri", "normal");
    doc.setTextColor(...PDF_COLORS.secondary);
    writeArabicText(doc, `تاريخ الإصدار: ${contractData.application_date}`, pageInfo.margin, 22, { align: "left" });
    writeArabicText(doc, `إصدار: ${CONTRACT_VERSION_INFO.version}`, pageInfo.margin, 28, { align: "left" });
  }

  // شعار "عقد تمويل خدمات"
  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.primary);
  writeArabicText(doc, "عقد تمويل خدمات رسمي", rightX, 36);

  doc.setTextColor(0, 0, 0);
}

/**
 * إضافة التذييل لجميع الصفحات
 */
function addFooterToAllPages(doc: jsPDF, pageInfo: PageInfo, totalPages: number): void {
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    const footerY = pageInfo.pageHeight - 12;
    
    // خط فوق التذييل
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(pageInfo.margin, footerY - 3, pageInfo.pageWidth - pageInfo.margin, footerY - 3);
    
    // رقم الصفحة في المنتصف
    doc.setFont("Amiri", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.secondary);
    writeArabicText(doc, `صفحة ${i} من ${totalPages}`, pageInfo.pageWidth / 2, footerY, { align: "center" });
    
    // اسم الشركة على اليمين
    doc.setFontSize(7);
    writeArabicText(doc, LEGAL_COMPANY_INFO.name, pageInfo.pageWidth - pageInfo.margin, footerY);
    
    // نوع المستند على اليسار  
    writeArabicText(doc, "عقد تمويل خدمات", pageInfo.margin, footerY, { align: "left" });
  }
}

/**
 * التحقق من الحاجة لصفحة جديدة
 */
function checkNewPage(doc: jsPDF, pageInfo: PageInfo, requiredSpace: number): number {
  if (pageInfo.currentY + requiredSpace > pageInfo.pageHeight - 25) {
    doc.addPage();
    addHeader(doc, pageInfo, null);
    return 52;
  }
  return pageInfo.currentY;
}

/**
 * إضافة عنوان العقد والبسملة
 */
function addTitleSection(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders): void {
  const centerX = pageInfo.pageWidth / 2;
  let y = pageInfo.currentY;

  // البسملة
  doc.setFont("Amiri", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PDF_COLORS.secondary);
  writeArabicText(doc, "بسم الله الرحمن الرحيم", centerX, y, { align: "center" });
  y += 12;

  // العنوان الرئيسي
  doc.setFont("Amiri", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, "عقد تمويل خدمات", centerX, y, { align: "center" });
  y += 8;

  // خط تحت العنوان
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(1);
  doc.line(centerX - 40, y, centerX + 40, y);
  y += 6;

  // معلومات العقد
  doc.setFont("Amiri", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.secondary);
  writeArabicText(doc, `رقم العقد: ${contractData.application_number}`, centerX, y, { align: "center" });
  y += 5;
  writeArabicText(doc, `تاريخ التحرير: ${contractData.application_date}`, centerX, y, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  pageInfo.currentY = y + 10;
}

/**
 * إضافة معلومات الأطراف
 */
function addPartiesSection(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  const leftX = pageInfo.margin;
  let y = pageInfo.currentY;

  // خلفية رمادية
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 42, 3, 3, "F");
  
  // حدود
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 42, 3, 3, "S");
  
  y += 8;

  // ═══ الطرف الأول (يمين) ═══
  doc.setFont("Amiri", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.primary);
  writeArabicText(doc, "الطرف الأول (الممول / مزود الخدمة)", rightX - 5, y);
  y += 6;
  
  doc.setFont("Amiri", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, LEGAL_COMPANY_INFO.name, rightX - 5, y);
  y += 5;
  
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.secondary);
  writeArabicText(doc, `سجل تجاري: ${LEGAL_COMPANY_INFO.commercialRegister}`, rightX - 5, y);
  y += 5;
  writeArabicText(doc, LEGAL_COMPANY_INFO.address, rightX - 5, y);

  // ═══ الطرف الثاني (يسار) ═══
  y = pageInfo.currentY + 8;
  doc.setFont("Amiri", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.primary);
  writeArabicText(doc, "الطرف الثاني (العميل / المستفيد)", leftX + 5, y, { align: "left" });
  y += 6;
  
  doc.setFont("Amiri", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, contractData.customer_name, leftX + 5, y, { align: "left" });
  y += 5;
  
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.secondary);
  writeArabicText(doc, `رقم الهوية: ${contractData.customer_national_id}`, leftX + 5, y, { align: "left" });
  y += 5;
  writeArabicText(doc, `الجوال: ${contractData.customer_phone} | البريد: ${contractData.customer_email}`, leftX + 5, y, { align: "left" });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY += 50;
}

/**
 * إضافة تنبيه التمويل غير النقدي
 */
function addNonCashNotice(doc: jsPDF, pageInfo: PageInfo): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // خلفية صفراء
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 22, 3, 3, "F");
  
  // حدود برتقالية
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 22, 3, 3, "S");
  
  y += 8;
  doc.setFont("Amiri", "bold");
  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9);
  writeArabicText(doc, "⚠️ تنبيه مهم: هذا عقد تمويل خدمات فقط - غير نقدي", rightX - 5, y);
  y += 6;
  
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  writeArabicText(doc, "لن يتم صرف أي مبلغ نقدي للعميل. قيمة التمويل تُضاف كرصيد خدمات داخل المنصة فقط.", rightX - 5, y);

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY += 28;
}

/**
 * إضافة بنود العقد الرسمية
 */
function addContractArticles(doc: jsPDF, pageInfo: PageInfo): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // عنوان البنود
  doc.setFont("Amiri", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, "بنود العقد", rightX, y);
  y += 3;
  
  // خط تحت العنوان
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(rightX - 30, y, rightX, y);
  y += 8;

  // المواد القانونية
  LEGAL_CONTRACT_ARTICLES.forEach((article) => {
    // التحقق من الصفحة
    if (y > pageInfo.pageHeight - 50) {
      doc.addPage();
      addHeader(doc, pageInfo, null);
      y = 52;
    }

    // عنوان المادة
    doc.setFont("Amiri", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.primary);
    writeArabicText(doc, article.title, rightX, y);
    y += 6;

    // البنود
    doc.setFont("Amiri", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.dark);
    
    article.clauses.forEach((clause) => {
      if (y > pageInfo.pageHeight - 25) {
        doc.addPage();
        addHeader(doc, pageInfo, null);
        y = 52;
      }
      
      y = writeArabicParagraph(doc, clause, rightX - 5, y, pageInfo.contentWidth - 10, 4);
      y += 2;
    });
    
    y += 5;
  });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY = y;
}

/**
 * إضافة جدول الخدمات
 */
function addServicesTable(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // عنوان القسم
  doc.setFont("Amiri", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, "جدول الخدمات الممولة", rightX, y);
  y += 8;

  // بيانات الجدول (معكوسة للعرض RTL)
  const tableData = contractData.services_table.map((service, index) => {
    const vat = service.total * 0.15;
    const totalWithVat = service.total + vat;
    return [
      processArabicText(`${formatCurrency(totalWithVat)} ر.س`),
      processArabicText(`${formatCurrency(vat)} ر.س`),
      processArabicText(`${formatCurrency(service.price)} ر.س`),
      processArabicText(service.quantity.toString()),
      processArabicText(service.name),
      processArabicText((index + 1).toString()),
    ];
  });

  // صف الإجمالي
  const totalVat = contractData.vat_amount;
  const grandTotal = contractData.total_services_value + totalVat;
  tableData.push([
    processArabicText(`${formatCurrency(grandTotal)} ر.س`),
    processArabicText(`${formatCurrency(totalVat)} ر.س`),
    processArabicText(`${formatCurrency(contractData.total_services_value)} ر.س`),
    "",
    processArabicText("الإجمالي"),
    "",
  ]);

  autoTable(doc, {
    head: [[
      processArabicText("الإجمالي شامل الضريبة"),
      processArabicText("الضريبة (15%)"),
      processArabicText("السعر"),
      processArabicText("الكمية"),
      processArabicText("اسم الخدمة"),
      "#",
    ]],
    body: tableData,
    startY: y,
    theme: "grid",
    styles: {
      font: "Amiri",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      cellPadding: 3,
    },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: PDF_COLORS.dark,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" },
      1: { halign: "left" },
      2: { halign: "left" },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "center", cellWidth: 12 },
    },
    margin: { left: pageInfo.margin, right: pageInfo.margin },
    tableWidth: pageInfo.contentWidth,
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fillColor = [219, 234, 254];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  pageInfo.currentY = (doc as any).lastAutoTable.finalY + 10;
}

/**
 * إضافة ملخص مالي
 */
function addFinancialSummary(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // عنوان
  doc.setFont("Amiri", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, "الملخص المالي", rightX, y);
  y += 8;

  // خلفية
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 35, 3, 3, "F");
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 35, 3, 3, "S");

  y += 10;
  doc.setFont("Amiri", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.dark);

  const colWidth = pageInfo.contentWidth / 3;
  
  // الصف الأول
  writeArabicText(doc, `قيمة الخدمات: ${formatCurrency(contractData.total_services_value)} ر.س`, rightX - 5, y);
  writeArabicText(doc, `الرسوم الإدارية: ${formatCurrency(contractData.admin_fees)} ر.س`, rightX - colWidth - 5, y);
  writeArabicText(doc, `ضريبة القيمة المضافة: ${formatCurrency(contractData.vat_amount)} ر.س`, rightX - (colWidth * 2) - 5, y);
  
  y += 8;
  
  // الصف الثاني
  if (contractData.down_payment && contractData.down_payment > 0) {
    writeArabicText(doc, `الدفعة المقدمة: ${formatCurrency(contractData.down_payment)} ر.س`, rightX - 5, y);
  }
  writeArabicText(doc, `المبلغ الممول: ${formatCurrency(contractData.financed_amount)} ر.س`, rightX - colWidth - 5, y);

  y += 10;
  
  // الإجمالي
  doc.setFont("Amiri", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.primary);
  writeArabicText(doc, `إجمالي المبلغ المستحق: ${formatCurrency(contractData.total_amount)} ر.س`, pageInfo.pageWidth / 2, y, { align: "center" });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY = y + 15;
}

/**
 * إضافة جدول الأقساط
 */
function addInstallmentsTable(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // عنوان
  doc.setFont("Amiri", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, "جدول الأقساط", rightX, y);
  y += 4;

  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.secondary);
  writeArabicText(doc, `عدد الأقساط: ${contractData.installments_count} قسط | قيمة القسط: ${formatCurrency(contractData.installment_amount)} ر.س`, rightX, y);
  y += 6;

  // بيانات الجدول
  const installmentData = contractData.installments_schedule.map((inst) => {
    const statusText = inst.status === "paid" ? "✅ مدفوع" : inst.status === "overdue" ? "❌ متأخر" : "⏳ مستحق";
    return [
      processArabicText(statusText),
      processArabicText(`${formatCurrency(inst.amount)} ر.س`),
      processArabicText(inst.dueDate),
      processArabicText(inst.number.toString()),
    ];
  });

  autoTable(doc, {
    head: [[
      processArabicText("الحالة"),
      processArabicText("قيمة القسط"),
      processArabicText("تاريخ الاستحقاق"),
      processArabicText("رقم القسط"),
    ]],
    body: installmentData,
    startY: y,
    theme: "striped",
    styles: {
      font: "Amiri",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      cellPadding: 3,
    },
    headStyles: {
      fillColor: PDF_COLORS.success,
      textColor: PDF_COLORS.white,
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: PDF_COLORS.dark,
    },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "left", fontStyle: "bold" },
      2: { halign: "center" },
      3: { halign: "center", cellWidth: 25 },
    },
    margin: { left: pageInfo.margin, right: pageInfo.margin },
    tableWidth: pageInfo.contentWidth,
  });

  pageInfo.currentY = (doc as any).lastAutoTable.finalY + 10;
}

/**
 * إضافة إقرارات العميل
 */
function addClientAcknowledgments(doc: jsPDF, pageInfo: PageInfo): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // عنوان
  doc.setFont("Amiri", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, "إقرارات العميل", rightX, y);
  y += 8;

  // خلفية خضراء فاتحة
  const boxHeight = CLIENT_LEGAL_ACKNOWLEDGMENTS.length * 7 + 8;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, boxHeight, 3, 3, "F");
  doc.setDrawColor(...PDF_COLORS.success);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, boxHeight, 3, 3, "S");
  
  y += 6;

  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);

  CLIENT_LEGAL_ACKNOWLEDGMENTS.forEach((ack, index) => {
    writeArabicText(doc, `☑ ${index + 1}. ${ack}`, rightX - 5, y);
    y += 6;
  });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY = y + 8;
}

/**
 * إضافة قسم التوقيع
 */
function addSignatureSection(
  doc: jsPDF, 
  pageInfo: PageInfo, 
  contractData: ContractPlaceholders,
  approvalRecord?: { approved_at: string; user_id: string }
): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  const centerX = pageInfo.pageWidth / 2;
  let y = pageInfo.currentY;

  // خط فاصل
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);
  doc.line(pageInfo.margin, y, pageInfo.pageWidth - pageInfo.margin, y);
  y += 10;

  // عنوان
  doc.setFont("Amiri", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, "التوقيع والاعتماد", centerX, y, { align: "center" });
  y += 12;

  const boxWidth = (pageInfo.contentWidth / 2) - 8;
  const boxHeight = 30;

  // ═══ صندوق الطرف الأول (يمين) ═══
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(centerX + 4, y, boxWidth, boxHeight, 3, 3, "F");
  
  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.dark);
  writeArabicText(doc, "الطرف الأول", rightX - 8, y + 8);
  
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  writeArabicText(doc, LEGAL_COMPANY_INFO.name, rightX - 8, y + 15);
  
  doc.setTextColor(...PDF_COLORS.success);
  writeArabicText(doc, "✓ توقيع إلكتروني معتمد", rightX - 8, y + 22);

  // ═══ صندوق الطرف الثاني (يسار) ═══
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageInfo.margin, y, boxWidth, boxHeight, 3, 3, "F");
  
  doc.setTextColor(...PDF_COLORS.dark);
  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  writeArabicText(doc, "الطرف الثاني", pageInfo.margin + 8, y + 8, { align: "left" });
  
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  writeArabicText(doc, contractData.customer_name, pageInfo.margin + 8, y + 15, { align: "left" });
  
  if (approvalRecord) {
    doc.setTextColor(...PDF_COLORS.success);
    const approvalDate = new Date(approvalRecord.approved_at).toLocaleString("ar-SA");
    writeArabicText(doc, `✓ تمت الموافقة: ${approvalDate}`, pageInfo.margin + 8, y + 22, { align: "left" });
  } else {
    doc.setTextColor(...PDF_COLORS.warning);
    writeArabicText(doc, "⏳ بانتظار الموافقة الإلكترونية", pageInfo.margin + 8, y + 22, { align: "left" });
  }

  y += boxHeight + 10;

  // ملاحظة قانونية
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.setFont("Amiri", "normal");
  doc.setFontSize(8);
  writeArabicText(doc, "الموافقة الإلكترونية لها نفس الحجية القانونية للتوقيع الخطي وفقاً لنظام التعاملات الإلكترونية السعودي", centerX, y, { align: "center" });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY = y + 10;
}

// ============================================
// Main Generator Function
// ============================================

export async function generateContractPdf(
  contractData: ContractPlaceholders,
  options?: {
    includeHash?: boolean;
    approvalRecord?: {
      approved_at: string;
      user_id: string;
    };
  }
): Promise<{ pdf: jsPDF; hash: string; blob: Blob }> {
  // تحميل الخطوط
  await loadArabicFonts();

  if (!amiriRegularBase64 || !amiriBoldBase64) {
    throw new Error("الخطوط العربية غير متوفرة");
  }

  // إنشاء مستند PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
  });

  // تسجيل الخطوط
  doc.addFileToVFS("Amiri-Regular.ttf", amiriRegularBase64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  
  doc.addFileToVFS("Amiri-Bold.ttf", amiriBoldBase64);
  doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
  
  doc.setFont("Amiri", "normal");

  const pageInfo: PageInfo = {
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight(),
    margin: 15,
    contentWidth: doc.internal.pageSize.getWidth() - 30,
    currentY: 20,
  };

  // ═══════════════════════════════════════
  // بناء محتوى العقد
  // ═══════════════════════════════════════

  // 1. الترويسة
  addHeader(doc, pageInfo, contractData);
  pageInfo.currentY = 52;

  // 2. العنوان والبسملة
  addTitleSection(doc, pageInfo, contractData);

  // 3. معلومات الأطراف
  addPartiesSection(doc, pageInfo, contractData);

  // 4. تنبيه التمويل غير النقدي
  addNonCashNotice(doc, pageInfo);

  // 5. بنود العقد القانونية
  addContractArticles(doc, pageInfo);

  // 6. جدول الخدمات
  pageInfo.currentY = checkNewPage(doc, pageInfo, 80);
  addServicesTable(doc, pageInfo, contractData);

  // 7. الملخص المالي
  pageInfo.currentY = checkNewPage(doc, pageInfo, 50);
  addFinancialSummary(doc, pageInfo, contractData);

  // 8. جدول الأقساط
  pageInfo.currentY = checkNewPage(doc, pageInfo, 80);
  addInstallmentsTable(doc, pageInfo, contractData);

  // 9. إقرارات العميل
  pageInfo.currentY = checkNewPage(doc, pageInfo, 70);
  addClientAcknowledgments(doc, pageInfo);

  // 10. قسم التوقيع
  pageInfo.currentY = checkNewPage(doc, pageInfo, 60);
  addSignatureSection(doc, pageInfo, contractData, options?.approvalRecord);

  // ═══════════════════════════════════════
  // إضافة التذييل لجميع الصفحات
  // ═══════════════════════════════════════
  const totalPages = doc.internal.pages.length - 1;
  addFooterToAllPages(doc, pageInfo, totalPages);

  // ═══════════════════════════════════════
  // حساب hash العقد
  // ═══════════════════════════════════════
  const contractContent = JSON.stringify(contractData) + new Date().toISOString();
  const hash = await calculateContractHash(contractContent);

  if (options?.includeHash) {
    const lastPage = doc.internal.pages.length - 1;
    doc.setPage(lastPage);
    doc.setFontSize(7);
    doc.setFont("Amiri", "normal");
    doc.setTextColor(128, 128, 128);
    writeArabicText(doc, `بصمة العقد: ${hash.substring(0, 40)}...`, pageInfo.pageWidth / 2, pageInfo.pageHeight - 5, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  const blob = doc.output("blob");

  return { pdf: doc, hash, blob };
}

// ============================================
// Export Functions
// ============================================

export async function downloadContractPdf(
  contractData: ContractPlaceholders,
  filename?: string,
  options?: {
    includeHash?: boolean;
    approvalRecord?: { approved_at: string; user_id: string };
  }
): Promise<{ success: boolean; hash: string; error?: string }> {
  try {
    const { pdf, hash } = await generateContractPdf(contractData, options);
    const finalFilename = filename || `عقد-تمويل-خدمات-${contractData.application_number}.pdf`;
    pdf.save(finalFilename);
    return { success: true, hash };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { 
      success: false, 
      hash: "", 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء توليد الملف" 
    };
  }
}

export async function previewContractPdf(
  contractData: ContractPlaceholders,
  options?: {
    includeHash?: boolean;
    approvalRecord?: { approved_at: string; user_id: string };
  }
): Promise<{ success: boolean; hash: string; error?: string }> {
  try {
    const { pdf, hash } = await generateContractPdf(contractData, options);
    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
    return { success: true, hash };
  } catch (error) {
    console.error("Error previewing PDF:", error);
    return { 
      success: false, 
      hash: "", 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء عرض الملف" 
    };
  }
}

export async function getContractPdfBlob(
  contractData: ContractPlaceholders,
  options?: {
    includeHash?: boolean;
    approvalRecord?: { approved_at: string; user_id: string };
  }
): Promise<{ blob: Blob; hash: string }> {
  const { blob, hash } = await generateContractPdf(contractData, options);
  return { blob, hash };
}
