import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface BillOfExchangeData {
  contractNumber: string;
  applicationNumber: string;
  clientName: string;
  clientNationalId: string;
  clientPhone: string;
  clientAddress: string;
  amount: number;
  installmentsCount: number;
  installmentAmount: number;
  signatureUrl?: string;
  signedDate: string;
}

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

const formatAmount = (amount: number): string => {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const generateBillOfExchangeHtml = (data: BillOfExchangeData): string => {
  return `
    <div id="billPage" style="
      width: 794px;
      height: 1123px;
      background: #ffffff;
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      text-align: right;
      color: #1e293b;
      line-height: 1.6;
      position: relative;
      padding: 0;
      margin: 0;
    ">
      <!-- Header -->
      <div style="
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 25px 35px;
        border-bottom: 4px solid #d4af37;
        text-align: center;
      ">
        <h1 style="
          font-size: 32px;
          color: #d4af37;
          margin: 0 0 8px 0;
          font-weight: bold;
        ">كمبيالة تجارية</h1>
        <p style="
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        ">BILL OF EXCHANGE - وفق نظام الأوراق التجارية السعودي</p>
      </div>

      <!-- Info Row -->
      <div style="
        display: flex;
        justify-content: space-between;
        padding: 20px 35px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      ">
        <div style="text-align: right;">
          <p style="font-size: 11px; color: #64748b; margin: 0;">رقم الكمبيالة</p>
          <p style="font-size: 15px; color: #0066cc; font-weight: bold; margin: 4px 0 0 0;">${data.contractNumber || data.applicationNumber}</p>
        </div>
        <div style="text-align: center;">
          <p style="font-size: 11px; color: #64748b; margin: 0;">مكان الإنشاء</p>
          <p style="font-size: 14px; font-weight: bold; margin: 4px 0 0 0;">المملكة العربية السعودية</p>
        </div>
        <div style="text-align: left;">
          <p style="font-size: 11px; color: #64748b; margin: 0;">التاريخ</p>
          <p style="font-size: 14px; font-weight: bold; margin: 4px 0 0 0;">${data.signedDate}</p>
        </div>
      </div>

      <!-- Amount Box -->
      <div style="
        margin: 25px 35px;
        padding: 25px;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 12px;
        text-align: center;
      ">
        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px 0;">المبلغ الإجمالي</p>
        <p style="font-size: 28px; color: #d4af37; font-weight: bold; margin: 0 0 8px 0;">
          ${formatAmount(data.amount)} ريال سعودي
        </p>
        <p style="font-size: 13px; color: #94a3b8; margin: 0;">
          فقط ${numberToArabicWords(Math.round(data.amount))} ريال سعودي لا غير
        </p>
      </div>

      <!-- Drawer Info -->
      <div style="
        margin: 0 35px 20px;
        padding: 20px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
      ">
        <p style="font-size: 14px; color: #d4af37; font-weight: bold; margin: 0 0 12px 0;">الساحب (المسحوب عليه):</p>
        <p style="font-size: 14px; margin: 8px 0;">أنا الموقع أدناه <span style="color: #0066cc; font-weight: bold;">${data.clientName}</span></p>
        <p style="font-size: 14px; margin: 8px 0;">حامل هوية وطنية رقم: <span style="font-weight: bold; font-family: monospace;">${data.clientNationalId}</span></p>
        <p style="font-size: 14px; margin: 8px 0;">جوال: <span style="font-weight: bold; font-family: monospace;">${data.clientPhone}</span></p>
        ${data.clientAddress ? `<p style="font-size: 14px; margin: 8px 0;">العنوان: <span style="font-weight: bold;">${data.clientAddress}</span></p>` : ''}
      </div>

      <!-- Beneficiary Info -->
      <div style="
        margin: 0 35px 20px;
        padding: 20px;
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        border: 1px solid #10b981;
        border-radius: 10px;
      ">
        <p style="font-size: 14px; color: #059669; font-weight: bold; margin: 0 0 10px 0;">المستفيد (لأمر):</p>
        <p style="font-size: 18px; color: #047857; font-weight: bold; margin: 0 0 5px 0;">شركة علي صالح الشهري القابضة</p>
        <p style="font-size: 12px; color: #059669; margin: 0;">سجل تجاري رقم: 4030554749</p>
      </div>

      <!-- Commitment -->
      <div style="
        margin: 0 35px 20px;
        padding: 20px;
        text-align: center;
        border: 2px dashed #d4af37;
        border-radius: 10px;
      ">
        <p style="font-size: 14px; margin: 0 0 10px 0;">أتعهد بأن أدفع مبلغ وقدره:</p>
        <p style="font-size: 24px; color: #d4af37; font-weight: bold; margin: 0;">
          ${formatAmount(data.amount)} ريال سعودي
        </p>
      </div>

      <!-- Payment Terms -->
      <div style="
        margin: 0 35px 20px;
        padding: 20px;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border: 1px solid #f59e0b;
        border-radius: 10px;
      ">
        <p style="font-size: 14px; color: #d97706; font-weight: bold; margin: 0 0 15px 0;">شروط السداد:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px dashed #d4af37; font-size: 14px;">عدد الأقساط:</td>
            <td style="padding: 8px 0; border-bottom: 1px dashed #d4af37; font-size: 14px; font-weight: bold; text-align: left;">${data.installmentsCount} قسط شهري متساوي</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px dashed #d4af37; font-size: 14px;">قيمة القسط الواحد:</td>
            <td style="padding: 8px 0; border-bottom: 1px dashed #d4af37; font-size: 14px; font-weight: bold; text-align: left;">${formatAmount(data.installmentAmount)} ريال</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px;">تاريخ استحقاق الأقساط:</td>
            <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: left;">يوم 30 من كل شهر ميلادي</td>
          </tr>
        </table>
      </div>

      <!-- Legal Notice -->
      <div style="
        margin: 0 35px 25px;
        padding: 12px;
        background: #fef2f2;
        border: 1px solid #ef4444;
        border-radius: 8px;
        text-align: center;
      ">
        <p style="font-size: 12px; color: #dc2626; margin: 0;">
          ⚠️ هذه الكمبيالة ورقة تجارية قابلة للتظهير والتنفيذ وفقاً لنظام الأوراق التجارية السعودي
        </p>
      </div>

      <!-- Signatures Section -->
      <div style="
        margin: 0 35px;
        display: flex;
        justify-content: space-between;
        gap: 20px;
      ">
        <!-- Client Signature -->
        <div style="
          flex: 1;
          padding: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          text-align: center;
        ">
          <p style="font-size: 12px; color: #64748b; margin: 0 0 15px 0;">توقيع الساحب (المسحوب عليه)</p>
          ${data.signatureUrl ? `
            <img src="${data.signatureUrl}" alt="توقيع العميل" style="
              max-width: 150px;
              max-height: 60px;
              margin: 0 auto 10px;
              display: block;
              background: white;
              padding: 8px;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
            "/>
          ` : `
            <div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #94a3b8; border: 1px dashed #cbd5e1; border-radius: 4px; margin-bottom: 10px;">
              [التوقيع]
            </div>
          `}
          <p style="font-size: 13px; font-weight: bold; margin: 0;">${data.clientName}</p>
          <p style="font-size: 11px; color: #64748b; margin: 5px 0 0 0;">هوية رقم: ${data.clientNationalId}</p>
        </div>

        <!-- Company Stamp -->
        <div style="
          flex: 1;
          padding: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          text-align: center;
        ">
          <p style="font-size: 12px; color: #64748b; margin: 0 0 15px 0;">ختم المستفيد</p>
          <div style="
            width: 100px;
            height: 100px;
            margin: 0 auto 10px;
            border: 3px solid #1e293b;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
          ">
            <p style="font-size: 9px; margin: 0; color: #1e293b;">شركة</p>
            <p style="font-size: 10px; margin: 2px 0; color: #1e293b; font-weight: bold;">علي صالح الشهري</p>
            <p style="font-size: 9px; margin: 0; color: #1e293b;">القابضة</p>
            <p style="font-size: 7px; margin: 3px 0 0 0; color: #64748b;">سجل: 4030554749</p>
          </div>
          <p style="font-size: 11px; color: #64748b; margin: 0;">تاريخ التوقيع: ${data.signedDate}</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        position: absolute;
        bottom: 20px;
        left: 35px;
        right: 35px;
        padding-top: 15px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
      ">
        <p style="font-size: 10px; color: #94a3b8; margin: 0;">
          هذه الوثيقة صادرة إلكترونياً من نظام ASH HOLDING للتمويل المرن
        </p>
        <p style="font-size: 9px; color: #cbd5e1; margin: 5px 0 0 0;">
          طلب رقم: ${data.applicationNumber} | تاريخ الإصدار: ${data.signedDate}
        </p>
      </div>
    </div>
  `;
};

export async function generateBillOfExchangePdf(data: BillOfExchangeData): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Create temporary container
  const container = document.createElement("div");
  container.innerHTML = generateBillOfExchangeHtml(data);
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "white";
  document.body.appendChild(container);

  try {
    // Load Cairo font explicitly
    const cairoFont = new FontFace(
      'Cairo',
      'url(/fonts/cairo-arabic.woff) format("woff")'
    );
    
    try {
      const loadedFont = await cairoFont.load();
      document.fonts.add(loadedFont);
    } catch (fontError) {
      console.warn('Could not load Cairo font, using fallback:', fontError);
    }

    // Wait for fonts to be ready
    await document.fonts.ready;
    
    // Give extra time for rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    const pageElement = container.querySelector("#billPage") as HTMLElement;
    
    const canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 794,
      height: 1123,
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

    pdf.save(`كمبيالة_${data.contractNumber || data.applicationNumber}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
