/**
 * مولد PDF لعقد تمويل الخدمات
 * Service Financing Contract PDF Generator
 * 
 * يولد ملف PDF بدعم كامل للغة العربية RTL
 * مع تضمين خط عربي (Amiri) داخل الملف
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY_INFO } from "./serviceFinancingPolicy";
import { 
  CONTRACT_CLAUSES, 
  CLIENT_ACKNOWLEDGMENTS,
  CONTRACT_INFO,
  type ContractPlaceholders,
  type ServiceItem,
  type InstallmentItem,
} from "./serviceFinancingContract";

// Font loading status
let fontsLoaded = false;
let amiriRegularBase64: string | null = null;
let amiriBoldBase64: string | null = null;

/**
 * تحميل الخطوط العربية
 */
async function loadArabicFonts(): Promise<void> {
  if (fontsLoaded) return;

  try {
    // Load Amiri Regular
    const regularResponse = await fetch("/fonts/Amiri-Regular.ttf");
    const regularBuffer = await regularResponse.arrayBuffer();
    amiriRegularBase64 = arrayBufferToBase64(regularBuffer);

    // Load Amiri Bold
    const boldResponse = await fetch("/fonts/Amiri-Bold.ttf");
    const boldBuffer = await boldResponse.arrayBuffer();
    amiriBoldBase64 = arrayBufferToBase64(boldBuffer);

    fontsLoaded = true;
    console.log("✅ Arabic fonts loaded successfully");
  } catch (error) {
    console.error("❌ Error loading Arabic fonts:", error);
    throw new Error("فشل تحميل الخطوط العربية");
  }
}

/**
 * تحويل ArrayBuffer إلى Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * تنسيق المبالغ بالريال السعودي
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * حساب hash للعقد
 */
async function calculateContractHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * معلومات الصفحة
 */
interface PageInfo {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  currentY: number;
}

/**
 * مولد PDF العقد
 */
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
  // تحميل الخطوط أولاً
  await loadArabicFonts();

  if (!amiriRegularBase64 || !amiriBoldBase64) {
    throw new Error("الخطوط العربية غير متوفرة");
  }

  // إنشاء مستند PDF جديد
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
  });

  // تسجيل الخط العربي
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

  // حساب عدد الصفحات المتوقع
  let totalPages = 1;
  
  // إضافة الترويسة
  addHeader(doc, pageInfo, contractData);
  pageInfo.currentY = 50;

  // إضافة البسملة والعنوان
  addTitleSection(doc, pageInfo, contractData);
  pageInfo.currentY += 5;

  // إضافة معلومات الأطراف
  addPartiesSection(doc, pageInfo, contractData);
  pageInfo.currentY += 5;

  // إضافة تنبيه التمويل غير النقدي
  addNonCashNotice(doc, pageInfo);
  pageInfo.currentY += 5;

  // إضافة بنود العقد
  addContractClauses(doc, pageInfo);

  // إضافة جدول الخدمات
  pageInfo.currentY = checkNewPage(doc, pageInfo, 80);
  addServicesTable(doc, pageInfo, contractData);

  // إضافة التفاصيل المالية
  pageInfo.currentY = checkNewPage(doc, pageInfo, 40);
  addFinancialSummary(doc, pageInfo, contractData);

  // إضافة جدول الأقساط
  pageInfo.currentY = checkNewPage(doc, pageInfo, 80);
  addInstallmentsTable(doc, pageInfo, contractData);

  // إضافة إقرارات العميل
  pageInfo.currentY = checkNewPage(doc, pageInfo, 60);
  addClientAcknowledgments(doc, pageInfo);

  // إضافة قسم التوقيع
  pageInfo.currentY = checkNewPage(doc, pageInfo, 50);
  addSignatureSection(doc, pageInfo, contractData, options?.approvalRecord);

  // تحديث عدد الصفحات وإضافة التذييل
  totalPages = doc.internal.pages.length - 1;
  addFooterToAllPages(doc, pageInfo, totalPages);

  // حساب hash العقد
  const contractContent = JSON.stringify(contractData) + new Date().toISOString();
  const hash = await calculateContractHash(contractContent);

  // إضافة hash في آخر صفحة إذا مطلوب
  if (options?.includeHash) {
    const lastPage = doc.internal.pages.length - 1;
    doc.setPage(lastPage);
    doc.setFontSize(8);
    doc.setFont("Amiri", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(`بصمة العقد: ${hash.substring(0, 32)}...`, pageInfo.pageWidth / 2, pageInfo.pageHeight - 8, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  // إنشاء Blob
  const blob = doc.output("blob");

  return { pdf: doc, hash, blob };
}

/**
 * التحقق من الحاجة لصفحة جديدة
 */
function checkNewPage(doc: jsPDF, pageInfo: PageInfo, requiredSpace: number): number {
  if (pageInfo.currentY + requiredSpace > pageInfo.pageHeight - 25) {
    doc.addPage();
    addHeader(doc, pageInfo, null);
    return 50;
  }
  return pageInfo.currentY;
}

/**
 * إضافة الترويسة
 */
function addHeader(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders | null): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;

  // خلفية الترويسة
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, pageInfo.pageWidth, 40, "F");
  
  // خط تحت الترويسة
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(pageInfo.margin, 40, pageInfo.pageWidth - pageInfo.margin, 40);

  // اسم الشركة
  doc.setFont("Amiri", "bold");
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text(COMPANY_INFO.name, rightX, 15, { align: "right" });

  // معلومات إضافية
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("المملكة العربية السعودية", rightX, 22, { align: "right" });
  
  if (contractData) {
    doc.text(`رقم العقد: ${contractData.application_number}`, pageInfo.margin, 15, { align: "left" });
    doc.text(`التاريخ: ${contractData.application_date}`, pageInfo.margin, 22, { align: "left" });
  }

  // شعار "عقد تمويل خدمات"
  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.text("عقد تمويل خدمات", rightX, 32, { align: "right" });

  doc.setTextColor(0, 0, 0);
}

/**
 * إضافة عنوان العقد والبسملة
 */
function addTitleSection(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders): void {
  const centerX = pageInfo.pageWidth / 2;
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // البسملة
  doc.setFont("Amiri", "bold");
  doc.setFontSize(14);
  doc.setTextColor(107, 114, 128);
  doc.text("بسم الله الرحمن الرحيم", centerX, y, { align: "center" });
  y += 10;

  // العنوان الرئيسي
  doc.setFont("Amiri", "bold");
  doc.setFontSize(18);
  doc.setTextColor(31, 41, 55);
  doc.text("عقد تمويل خدمات", centerX, y, { align: "center" });
  y += 8;

  // معلومات العقد
  doc.setFont("Amiri", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`رقم العقد: ${contractData.application_number}  •  تاريخ التحرير: ${contractData.application_date}`, centerX, y, { align: "center" });
  y += 5;
  doc.text(`إصدار العقد: ${CONTRACT_INFO.version}`, centerX, y, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  pageInfo.currentY = y + 8;
}

/**
 * إضافة معلومات الأطراف
 */
function addPartiesSection(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // خلفية
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 35, 2, 2, "F");
  y += 6;

  // الطرف الأول
  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.text("الطرف الأول (الممول / مزود الخدمة)", rightX - 5, y, { align: "right" });
  y += 5;
  
  doc.setFont("Amiri", "normal");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text(COMPANY_INFO.name, rightX - 5, y, { align: "right" });
  y += 5;
  
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("المملكة العربية السعودية", rightX - 5, y, { align: "right" });

  // الطرف الثاني (على اليسار)
  y = pageInfo.currentY + 6;
  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.text("الطرف الثاني (العميل / المستفيد)", pageInfo.margin + 5, y, { align: "left" });
  y += 5;
  
  doc.setFont("Amiri", "normal");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text(contractData.customer_name, pageInfo.margin + 5, y, { align: "left" });
  y += 5;
  
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`الهوية: ${contractData.customer_national_id}  •  الجوال: ${contractData.customer_phone}`, pageInfo.margin + 5, y, { align: "left" });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY += 40;
}

/**
 * إضافة تنبيه التمويل غير النقدي
 */
function addNonCashNotice(doc: jsPDF, pageInfo: PageInfo): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // خلفية صفراء
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 18, 2, 2, "F");
  
  // حدود
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 18, 2, 2, "S");
  
  y += 7;
  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  doc.setTextColor(180, 83, 9);
  doc.text("⚠️ تنبيه مهم: تمويل خدمات فقط - غير نقدي", rightX - 5, y, { align: "right" });
  y += 5;
  
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.text("لن يتم صرف أي مبلغ للعميل. الدفع مباشرة لمزود الخدمة.", rightX - 5, y, { align: "right" });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY += 23;
}

/**
 * إضافة بنود العقد
 */
function addContractClauses(doc: jsPDF, pageInfo: PageInfo): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // عنوان البنود
  doc.setFont("Amiri", "bold");
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text("بنود العقد", rightX, y, { align: "right" });
  y += 2;
  
  // خط فاصل
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.3);
  doc.line(rightX - 30, y, rightX, y);
  y += 6;

  // التمهيد
  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.text(CONTRACT_CLAUSES.preamble.title, rightX, y, { align: "right" });
  y += 5;
  
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  
  const preambleLines = doc.splitTextToSize(CONTRACT_CLAUSES.preamble.content, pageInfo.contentWidth - 10);
  preambleLines.forEach((line: string) => {
    if (line.trim()) {
      doc.text(line.trim(), rightX, y, { align: "right" });
      y += 4;
    }
  });
  y += 3;

  // باقي المواد
  Object.entries(CONTRACT_CLAUSES).slice(1).forEach(([key, article]) => {
    // التحقق من الصفحة
    if (y > pageInfo.pageHeight - 40) {
      doc.addPage();
      addHeader(doc, pageInfo, null);
      y = 50;
    }

    // عنوان المادة
    doc.setFont("Amiri", "bold");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text(article.title, rightX, y, { align: "right" });
    y += 5;

    // البنود
    if ("clauses" in article) {
      doc.setFont("Amiri", "normal");
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      
      article.clauses.forEach((clause) => {
        if (y > pageInfo.pageHeight - 25) {
          doc.addPage();
          addHeader(doc, pageInfo, null);
          y = 50;
        }
        
        const clauseLines = doc.splitTextToSize(clause, pageInfo.contentWidth - 15);
        clauseLines.forEach((line: string) => {
          doc.text(line, rightX - 5, y, { align: "right" });
          y += 4;
        });
        y += 1;
      });
    }
    y += 4;
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
  doc.setTextColor(31, 41, 55);
  doc.text("📦 جدول الخدمات الممولة", rightX, y, { align: "right" });
  y += 8;

  // بيانات الجدول
  const tableData = contractData.services_table.map((service, index) => {
    const vat = service.total * 0.15;
    const totalWithVat = service.total + vat;
    return [
      `${formatCurrency(totalWithVat)} ر.س`,
      `${formatCurrency(vat)} ر.س`,
      `${formatCurrency(service.price)} ر.س`,
      service.quantity.toString(),
      service.name,
      (index + 1).toString(),
    ];
  });

  // إضافة صف الإجمالي
  const totalVat = contractData.vat_amount;
  const grandTotal = contractData.total_services_value + totalVat;
  tableData.push([
    `${formatCurrency(grandTotal)} ر.س`,
    `${formatCurrency(totalVat)} ر.س`,
    `${formatCurrency(contractData.total_services_value)} ر.س`,
    "",
    "الإجمالي",
    "",
  ]);

  autoTable(doc, {
    head: [["الإجمالي شامل الضريبة", "الضريبة (15%)", "السعر", "الكمية", "اسم الخدمة", "#"]],
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
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: [31, 41, 55],
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
      5: { halign: "center", cellWidth: 10 },
    },
    margin: { left: pageInfo.margin, right: pageInfo.margin },
    tableWidth: pageInfo.contentWidth,
    didParseCell: (data) => {
      // تنسيق صف الإجمالي
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fillColor = [219, 234, 254];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  pageInfo.currentY = (doc as any).lastAutoTable.finalY + 8;
}

/**
 * إضافة ملخص مالي
 */
function addFinancialSummary(doc: jsPDF, pageInfo: PageInfo, contractData: ContractPlaceholders): void {
  const rightX = pageInfo.pageWidth - pageInfo.margin;
  let y = pageInfo.currentY;

  // عنوان
  doc.setFont("Amiri", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text("💰 الملخص المالي", rightX, y, { align: "right" });
  y += 6;

  // خلفية
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 30, 2, 2, "F");
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, 30, 2, 2, "S");

  y += 8;
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);

  // الأعمدة
  const col1X = rightX - 5;
  const col2X = rightX - 60;
  const col3X = rightX - 120;

  doc.text(`قيمة الخدمات: ${formatCurrency(contractData.total_services_value)} ر.س`, col1X, y, { align: "right" });
  doc.text(`الرسوم الإدارية: ${formatCurrency(contractData.admin_fees)} ر.س`, col2X, y, { align: "right" });
  doc.text(`ضريبة القيمة المضافة: ${formatCurrency(contractData.vat_amount)} ر.س`, col3X, y, { align: "right" });
  
  y += 7;
  if (contractData.down_payment && contractData.down_payment > 0) {
    doc.text(`الدفعة المقدمة: ${formatCurrency(contractData.down_payment)} ر.س`, col1X, y, { align: "right" });
  }
  doc.text(`المبلغ الممول: ${formatCurrency(contractData.financed_amount)} ر.س`, col2X, y, { align: "right" });

  y += 7;
  doc.setFont("Amiri", "bold");
  doc.setFontSize(11);
  doc.setTextColor(59, 130, 246);
  doc.text(`إجمالي المبلغ المستحق: ${formatCurrency(contractData.total_amount)} ر.س`, pageInfo.pageWidth / 2, y, { align: "center" });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY = y + 12;
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
  doc.setTextColor(31, 41, 55);
  doc.text("📅 جدول الأقساط", rightX, y, { align: "right" });
  y += 3;

  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`عدد الأقساط: ${contractData.installments_count}  •  قيمة القسط: ${formatCurrency(contractData.installment_amount)} ر.س`, rightX, y, { align: "right" });
  y += 5;

  // بيانات الجدول
  const installmentData = contractData.installments_schedule.map((inst) => {
    const statusText = inst.status === "paid" ? "✅ مدفوع" : inst.status === "overdue" ? "❌ متأخر" : "⏳ متوقع";
    return [
      statusText,
      `${formatCurrency(inst.amount)} ر.س`,
      inst.dueDate,
      inst.number.toString(),
    ];
  });

  autoTable(doc, {
    head: [["الحالة", "قيمة القسط", "تاريخ الاستحقاق", "رقم القسط"]],
    body: installmentData,
    startY: y,
    theme: "striped",
    styles: {
      font: "Amiri",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [31, 41, 55],
    },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "left", fontStyle: "bold" },
      2: { halign: "center" },
      3: { halign: "center", cellWidth: 20 },
    },
    margin: { left: pageInfo.margin, right: pageInfo.margin },
    tableWidth: pageInfo.contentWidth,
  });

  pageInfo.currentY = (doc as any).lastAutoTable.finalY + 8;
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
  doc.setTextColor(31, 41, 55);
  doc.text("✅ إقرارات العميل", rightX, y, { align: "right" });
  y += 6;

  // خلفية
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(pageInfo.margin, y, pageInfo.contentWidth, CLIENT_ACKNOWLEDGMENTS.length * 6 + 4, 2, 2, "F");
  y += 5;

  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);

  CLIENT_ACKNOWLEDGMENTS.forEach((ack, index) => {
    doc.text(`☑ ${index + 1}. ${ack}`, rightX - 5, y, { align: "right" });
    y += 5;
  });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY = y + 5;
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
  y += 8;

  // عنوان
  doc.setFont("Amiri", "bold");
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text("التوقيع والاعتماد", centerX, y, { align: "center" });
  y += 10;

  // صندوق الطرف الأول
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(centerX + 5, y, (pageInfo.contentWidth / 2) - 10, 25, 2, 2, "F");
  
  doc.setFont("Amiri", "bold");
  doc.setFontSize(9);
  doc.text("الطرف الأول", rightX - 10, y + 6, { align: "right" });
  doc.setFont("Amiri", "normal");
  doc.setFontSize(8);
  doc.text(COMPANY_INFO.name, rightX - 10, y + 12, { align: "right" });
  doc.setTextColor(16, 185, 129);
  doc.text("✓ توقيع إلكتروني معتمد", rightX - 10, y + 18, { align: "right" });

  // صندوق الطرف الثاني
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageInfo.margin, y, (pageInfo.contentWidth / 2) - 10, 25, 2, 2, "F");
  
  doc.setTextColor(31, 41, 55);
  doc.setFont("Amiri", "bold");
  doc.setFontSize(9);
  doc.text("الطرف الثاني", pageInfo.margin + 5, y + 6, { align: "left" });
  doc.setFont("Amiri", "normal");
  doc.setFontSize(8);
  doc.text(contractData.customer_name, pageInfo.margin + 5, y + 12, { align: "left" });
  
  if (approvalRecord) {
    doc.setTextColor(16, 185, 129);
    doc.text(`✓ تمت الموافقة: ${new Date(approvalRecord.approved_at).toLocaleString("ar-SA")}`, pageInfo.margin + 5, y + 18, { align: "left" });
  } else {
    doc.setTextColor(234, 179, 8);
    doc.text("⏳ بانتظار الموافقة الإلكترونية", pageInfo.margin + 5, y + 18, { align: "left" });
  }

  y += 30;

  // ملاحظة قانونية
  doc.setTextColor(107, 114, 128);
  doc.setFont("Amiri", "normal");
  doc.setFontSize(8);
  doc.text("الموافقة الإلكترونية لها نفس الحجية القانونية للتوقيع الخطي وفقاً لنظام التعاملات الإلكترونية السعودي", centerX, y, { align: "center" });

  doc.setTextColor(0, 0, 0);
  pageInfo.currentY = y + 10;
}

/**
 * إضافة التذييل لجميع الصفحات
 */
function addFooterToAllPages(doc: jsPDF, pageInfo: PageInfo, totalPages: number): void {
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // خط فوق التذييل
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(pageInfo.margin, pageInfo.pageHeight - 15, pageInfo.pageWidth - pageInfo.margin, pageInfo.pageHeight - 15);
    
    // رقم الصفحة
    doc.setFont("Amiri", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`صفحة ${i} من ${totalPages}`, pageInfo.pageWidth / 2, pageInfo.pageHeight - 10, { align: "center" });
    
    // اسم الشركة
    doc.setFontSize(7);
    doc.text(COMPANY_INFO.name, pageInfo.pageWidth - pageInfo.margin, pageInfo.pageHeight - 10, { align: "right" });
    doc.text("عقد تمويل خدمات", pageInfo.margin, pageInfo.pageHeight - 10, { align: "left" });
  }
}

/**
 * تحميل ملف PDF
 */
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

/**
 * عرض PDF في نافذة جديدة
 */
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
