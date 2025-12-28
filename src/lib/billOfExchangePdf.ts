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
function numberToArabicWords(num: number): string {
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  const thousands = ["", "ألف", "ألفان", "ثلاثة آلاف", "أربعة آلاف", "خمسة آلاف", "ستة آلاف", "سبعة آلاف", "ثمانية آلاف", "تسعة آلاف"];
  
  if (num === 0) return "صفر";
  if (num >= 10000) {
    const tenThousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return `${tenThousands} ألف` + (remainder > 0 ? ` و${numberToArabicWords(remainder)}` : "");
  }
  
  let result = "";
  
  if (num >= 1000) {
    result += thousands[Math.floor(num / 1000)];
    num %= 1000;
    if (num > 0) result += " و";
  }
  
  if (num >= 100) {
    result += hundreds[Math.floor(num / 100)];
    num %= 100;
    if (num > 0) result += " و";
  }
  
  if (num >= 20) {
    const remainder = num % 10;
    if (remainder > 0) {
      result += ones[remainder] + " و" + tens[Math.floor(num / 10)];
    } else {
      result += tens[Math.floor(num / 10)];
    }
  } else if (num >= 11) {
    result += ones[num - 10] + " " + tens[1];
  } else if (num === 10) {
    result += tens[1];
  } else if (num > 0) {
    result += ones[num];
  }
  
  return result;
}

function generateBillOfExchangeHtml(data: BillOfExchangeData): string {
  return `
    <div style="
      width: 800px;
      min-height: 1100px;
      padding: 40px;
      background: white;
      font-family: 'Cairo', 'Arial', sans-serif;
      direction: rtl;
      text-align: right;
      color: #1a1a2e;
    ">
      <!-- Header -->
      <div style="
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px double #d4af37;
      ">
        <h1 style="
          font-size: 36px;
          color: #d4af37;
          margin: 0 0 10px 0;
          font-weight: bold;
        ">كمبيالة تجارية</h1>
        <p style="
          font-size: 14px;
          color: #666;
          margin: 0;
        ">BILL OF EXCHANGE - وفق نظام الأوراق التجارية السعودي</p>
      </div>

      <!-- Info Row -->
      <div style="
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
      ">
        <div style="text-align: right;">
          <span style="font-size: 12px; color: #666;">رقم الكمبيالة</span>
          <br/>
          <strong style="font-size: 16px; color: #0066cc;">${data.contractNumber}</strong>
        </div>
        <div style="text-align: center;">
          <span style="font-size: 12px; color: #666;">مكان الإنشاء</span>
          <br/>
          <strong style="font-size: 14px;">المملكة العربية السعودية</strong>
        </div>
        <div style="text-align: left;">
          <span style="font-size: 12px; color: #666;">التاريخ</span>
          <br/>
          <strong style="font-size: 14px;">${data.signedDate}</strong>
        </div>
      </div>

      <!-- Amount Box -->
      <div style="
        text-align: center;
        margin-bottom: 30px;
        padding: 25px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 12px;
        color: white;
      ">
        <p style="font-size: 14px; margin: 0 0 10px 0; opacity: 0.8;">المبلغ الإجمالي</p>
        <p style="font-size: 32px; margin: 0; font-weight: bold; color: #d4af37;">
          ${data.amount.toLocaleString('ar-SA')} ريال سعودي
        </p>
        <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.9;">
          فقط ${numberToArabicWords(data.amount)} ريال سعودي لا غير
        </p>
      </div>

      <!-- Main Content -->
      <div style="
        padding: 25px;
        background: #fafafa;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        margin-bottom: 30px;
        line-height: 2;
      ">
        <p style="font-size: 16px; margin-bottom: 20px;">
          <strong>الساحب (المسحوب عليه):</strong>
        </p>
        <p style="font-size: 15px; margin-bottom: 15px; padding-right: 20px;">
          أنا الموقع أدناه <strong style="color: #0066cc;">${data.clientName}</strong>
        </p>
        <p style="font-size: 15px; margin-bottom: 15px; padding-right: 20px;">
          حامل هوية وطنية رقم: <strong style="font-family: monospace;">${data.clientNationalId}</strong>
        </p>
        <p style="font-size: 15px; margin-bottom: 15px; padding-right: 20px;">
          جوال: <strong style="font-family: monospace;">${data.clientPhone}</strong>
        </p>
        ${data.clientAddress ? `
          <p style="font-size: 15px; margin-bottom: 15px; padding-right: 20px;">
            العنوان: <strong>${data.clientAddress}</strong>
          </p>
        ` : ''}
        
        <div style="
          margin: 25px 0;
          padding: 20px;
          background: #e8f5e9;
          border-radius: 8px;
          border-right: 4px solid #4caf50;
        ">
          <p style="font-size: 16px; margin: 0;">
            <strong>المستفيد (لأمر):</strong>
          </p>
          <p style="font-size: 18px; margin: 10px 0 5px 0; color: #2e7d32; font-weight: bold;">
            شركة علي صالح الشهري القابضة
          </p>
          <p style="font-size: 13px; margin: 0; color: #666;">
            سجل تجاري رقم: 4030554749
          </p>
        </div>

        <p style="font-size: 15px; margin: 20px 0; text-align: center; font-weight: bold;">
          أتعهد بأن أدفع مبلغ وقدره:
        </p>
        <p style="font-size: 24px; text-align: center; color: #d4af37; font-weight: bold; margin: 15px 0;">
          ${data.amount.toLocaleString('ar-SA')} ريال سعودي
        </p>
      </div>

      <!-- Payment Terms -->
      <div style="
        padding: 20px;
        background: #fff3e0;
        border-radius: 8px;
        border: 1px solid #ffcc80;
        margin-bottom: 30px;
      ">
        <h3 style="margin: 0 0 15px 0; color: #e65100; font-size: 16px;">شروط السداد:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px dashed #ccc;">عدد الأقساط:</td>
            <td style="padding: 8px 0; border-bottom: 1px dashed #ccc; font-weight: bold;">${data.installmentsCount} قسط شهري متساوي</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px dashed #ccc;">قيمة القسط الواحد:</td>
            <td style="padding: 8px 0; border-bottom: 1px dashed #ccc; font-weight: bold;">${data.installmentAmount.toLocaleString('ar-SA')} ريال</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">تاريخ استحقاق الأقساط:</td>
            <td style="padding: 8px 0; font-weight: bold;">يوم 30 من كل شهر ميلادي</td>
          </tr>
        </table>
      </div>

      <!-- Legal Notice -->
      <div style="
        padding: 15px;
        background: #ffebee;
        border-radius: 8px;
        border: 1px solid #ef9a9a;
        margin-bottom: 30px;
        text-align: center;
      ">
        <p style="font-size: 13px; color: #c62828; margin: 0;">
          ⚠️ هذه الكمبيالة ورقة تجارية قابلة للتظهير والتنفيذ وفقاً لنظام الأوراق التجارية السعودي
        </p>
      </div>

      <!-- Signatures Section -->
      <div style="
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
        padding-top: 30px;
        border-top: 2px solid #e0e0e0;
      ">
        <!-- Client Signature -->
        <div style="
          width: 45%;
          text-align: center;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        ">
          <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">توقيع الساحب (المسحوب عليه)</p>
          ${data.signatureUrl ? `
            <img src="${data.signatureUrl}" alt="توقيع العميل" style="
              max-width: 180px;
              max-height: 80px;
              margin: 10px auto;
              display: block;
              background: white;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #ddd;
            "/>
          ` : `
            <div style="height: 80px; display: flex; align-items: center; justify-content: center; color: #999;">
              [التوقيع]
            </div>
          `}
          <p style="font-size: 12px; margin: 10px 0 0 0; font-weight: bold;">${data.clientName}</p>
          <p style="font-size: 11px; margin: 5px 0 0 0; color: #666;">هوية رقم: ${data.clientNationalId}</p>
        </div>

        <!-- Company Stamp -->
        <div style="
          width: 45%;
          text-align: center;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        ">
          <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">ختم المستفيد</p>
          <div style="
            width: 120px;
            height: 120px;
            margin: 0 auto;
            border: 3px solid #1a1a2e;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
          ">
            <p style="font-size: 10px; margin: 0; color: #1a1a2e;">شركة</p>
            <p style="font-size: 11px; margin: 2px 0; color: #1a1a2e; font-weight: bold;">علي صالح الشهري</p>
            <p style="font-size: 10px; margin: 0; color: #1a1a2e;">القابضة</p>
            <p style="font-size: 8px; margin: 4px 0 0 0; color: #666;">سجل: 4030554749</p>
          </div>
          <p style="font-size: 11px; margin: 15px 0 0 0; color: #666;">
            تاريخ التوقيع: ${data.signedDate}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        text-align: center;
      ">
        <p style="font-size: 11px; color: #999; margin: 0;">
          هذه الوثيقة صادرة إلكترونياً من نظام MaxioCore للتمويل المرن
        </p>
        <p style="font-size: 10px; color: #ccc; margin: 5px 0 0 0;">
          طلب رقم: ${data.applicationNumber} | تاريخ الإصدار: ${data.signedDate}
        </p>
      </div>
    </div>
  `;
}

export async function generateBillOfExchangePdf(data: BillOfExchangeData): Promise<void> {
  // Create temporary container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.innerHTML = generateBillOfExchangeHtml(data);
  document.body.appendChild(container);

  try {
    // Wait for fonts to load
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 500));

    const element = container.firstElementChild as HTMLElement;
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));

    pdf.save(`كمبيالة-${data.contractNumber || data.applicationNumber}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
