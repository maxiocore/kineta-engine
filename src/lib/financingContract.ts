import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  const contractHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', 'Arial', 'Tahoma', sans-serif;
        }
        
        .contract-page {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          direction: rtl;
          text-align: right;
          padding: 0;
        }
        
        /* Header */
        .header {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          padding: 30px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 4px solid #f59e0b;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .logo-box {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #f59e0b, #eab308);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          color: #1e293b;
        }
        
        .company-info {
          color: #ffffff;
        }
        
        .company-name {
          font-size: 22px;
          font-weight: 800;
          color: #f59e0b;
        }
        
        .company-sub {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }
        
        .contract-title-box {
          background: rgba(245, 158, 11, 0.15);
          padding: 12px 30px;
          border-radius: 30px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .contract-title {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }
        
        /* Info Bar */
        .info-bar {
          background: #f8fafc;
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .info-item {
          text-align: center;
        }
        
        .info-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .info-value.gold {
          color: #f59e0b;
        }
        
        /* Content */
        .content {
          padding: 30px 40px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section-icon {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #f59e0b, #eab308);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e293b;
          font-size: 12px;
        }
        
        /* Parties */
        .parties-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .party-box {
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
        }
        
        .party-box.first {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(234, 179, 8, 0.05));
          border-color: rgba(245, 158, 11, 0.3);
        }
        
        .party-box.second {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(20, 184, 166, 0.05));
          border-color: rgba(16, 185, 129, 0.3);
        }
        
        .party-title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        
        .party-title.first {
          color: #f59e0b;
        }
        
        .party-title.second {
          color: #10b981;
        }
        
        .party-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 12px;
          border-bottom: 1px dashed #e2e8f0;
        }
        
        .party-label {
          color: #64748b;
        }
        
        .party-value {
          font-weight: 600;
          color: #1e293b;
        }
        
        /* Terms */
        .term-box {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 8px;
          border-right: 4px solid #f59e0b;
        }
        
        .term-number {
          display: inline-block;
          background: #f59e0b;
          color: #ffffff;
          padding: 2px 10px;
          border-radius: 15px;
          font-size: 11px;
          font-weight: 700;
          margin-left: 8px;
        }
        
        .term-text {
          font-size: 12px;
          line-height: 1.8;
          color: #334155;
        }
        
        .term-highlight {
          color: #10b981;
          font-weight: 700;
        }
        
        /* Installments Table */
        .table-wrapper {
          overflow: hidden;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          background: #1e293b;
          color: #ffffff;
          padding: 12px;
          font-size: 12px;
          font-weight: 600;
          text-align: right;
        }
        
        td {
          padding: 10px 12px;
          font-size: 12px;
          border-bottom: 1px solid #e2e8f0;
          text-align: right;
        }
        
        tr:nth-child(even) {
          background: #f8fafc;
        }
        
        tfoot td {
          background: #f59e0b;
          color: #1e293b;
          font-weight: 700;
        }
        
        /* Signature Section */
        .signature-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
        }
        
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 20px;
        }
        
        .signature-box {
          text-align: center;
          padding: 20px;
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          min-height: 120px;
        }
        
        .signature-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 10px;
        }
        
        .signature-img {
          max-height: 60px;
          margin: 10px auto;
        }
        
        .signature-date {
          font-size: 11px;
          color: #64748b;
          margin-top: 10px;
        }
        
        /* Footer */
        .footer {
          background: #1e293b;
          padding: 15px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
        }
        
        .footer-text {
          font-size: 10px;
          color: #94a3b8;
        }
        
        .footer-logo {
          color: #f59e0b;
          font-weight: 700;
          font-size: 14px;
        }
        
        /* Stamp */
        .stamp {
          width: 80px;
          height: 80px;
          border: 3px solid #10b981;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #10b981;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
          margin: 0 auto;
          transform: rotate(-15deg);
        }
      </style>
    </head>
    <body>
      <div class="contract-page">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="logo-box">M</div>
            <div class="company-info">
              <div class="company-name">MaxioCore</div>
              <div class="company-sub">شركة علي صالح الشهري القابضة</div>
            </div>
          </div>
          <div class="contract-title-box">
            <div class="contract-title">عقد التمويل</div>
          </div>
        </div>
        
        <!-- Info Bar -->
        <div class="info-bar">
          <div class="info-item">
            <div class="info-label">رقم العقد</div>
            <div class="info-value gold">${data.contractNumber}</div>
          </div>
          <div class="info-item">
            <div class="info-label">رقم الطلب</div>
            <div class="info-value">${data.applicationNumber}</div>
          </div>
          <div class="info-item">
            <div class="info-label">تاريخ العقد</div>
            <div class="info-value">${formatDateArabic(data.contractDate)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">مبلغ التمويل</div>
            <div class="info-value gold">${formatAmountArabic(data.amount)} ر.س</div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Parties Section -->
          <div class="section">
            <div class="section-title">
              <div class="section-icon">👥</div>
              أطراف العقد
            </div>
            <div class="parties-grid">
              <!-- First Party -->
              <div class="party-box first">
                <div class="party-title first">الطرف الأول (الممول)</div>
                <div class="party-row">
                  <span class="party-label">اسم الشركة:</span>
                  <span class="party-value">شركة علي صالح الشهري القابضة</span>
                </div>
                <div class="party-row">
                  <span class="party-label">السجل التجاري:</span>
                  <span class="party-value">4030554749</span>
                </div>
                <div class="party-row">
                  <span class="party-label">العنوان:</span>
                  <span class="party-value">المملكة العربية السعودية</span>
                </div>
              </div>
              
              <!-- Second Party -->
              <div class="party-box second">
                <div class="party-title second">الطرف الثاني (المستفيد)</div>
                <div class="party-row">
                  <span class="party-label">الاسم الكامل:</span>
                  <span class="party-value">${data.clientName}</span>
                </div>
                <div class="party-row">
                  <span class="party-label">رقم الهوية:</span>
                  <span class="party-value">${data.nationalId}</span>
                </div>
                <div class="party-row">
                  <span class="party-label">رقم الجوال:</span>
                  <span class="party-value">${data.phone}</span>
                </div>
                <div class="party-row">
                  <span class="party-label">البريد الإلكتروني:</span>
                  <span class="party-value">${data.email}</span>
                </div>
                <div class="party-row">
                  <span class="party-label">العنوان:</span>
                  <span class="party-value">${data.address}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Terms Section -->
          <div class="section">
            <div class="section-title">
              <div class="section-icon">📋</div>
              بنود وشروط العقد
            </div>
            
            <div class="term-box">
              <span class="term-number">البند الأول</span>
              <span class="term-text">
                يوافق الطرف الأول على تمويل الطرف الثاني بمبلغ 
                <span class="term-highlight">${formatAmountArabic(data.amount)} ر.س</span>
                (فقط ${numberToArabicWords(Math.floor(data.amount))} ريال سعودي لا غير).
              </span>
            </div>
            
            <div class="term-box">
              <span class="term-number">البند الثاني</span>
              <span class="term-text">
                يقر الطرف الثاني بأن التمويل سيُستخدم حصرياً لشراء خدمات من منصة ماكسيوكور، ولا يمكن سحبه نقداً أو تحويله لأي جهة أخرى.
              </span>
            </div>
            
            <div class="term-box">
              <span class="term-number">البند الثالث</span>
              <span class="term-text">
                يلتزم الطرف الثاني بسداد مبلغ التمويل على 
                <span class="term-highlight">${data.installmentsCount} أقساط شهرية</span>
                متساوية، تُستحق في يوم 30 من كل شهر ميلادي.
              </span>
            </div>
            
            <div class="term-box">
              <span class="term-number">البند الرابع</span>
              <span class="term-text">
                هذا التمويل بدون فوائد أو رسوم إضافية، بشرط الالتزام بمواعيد السداد المحددة في هذا العقد.
              </span>
            </div>
            
            <div class="term-box">
              <span class="term-number">البند الخامس</span>
              <span class="term-text">
                في حال تأخر السداد لمدة تتجاوز 30 يوماً، يحق للطرف الأول اتخاذ الإجراءات القانونية اللازمة لتحصيل المستحقات.
              </span>
            </div>
            
            <div class="term-box">
              <span class="term-number">البند السادس</span>
              <span class="term-text">
                يقر الطرف الثاني بصحة جميع البيانات المقدمة ويتحمل المسؤولية الكاملة في حال تقديم بيانات غير صحيحة.
              </span>
            </div>
            
            <div class="term-box">
              <span class="term-number">البند السابع</span>
              <span class="term-text">
                يخضع هذا العقد للأنظمة والقوانين المعمول بها في المملكة العربية السعودية، وأي نزاع ينشأ عنه يختص به القضاء السعودي.
              </span>
            </div>
          </div>
          
          <!-- Installments Table -->
          <div class="section">
            <div class="section-title">
              <div class="section-icon">📅</div>
              جدول الأقساط
            </div>
            <div class="table-wrapper">
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
                  ${data.installments.map(inst => `
                    <tr>
                      <td><strong>${inst.number}</strong></td>
                      <td>${formatAmountArabic(inst.amount)} ر.س</td>
                      <td>${formatDateArabic(inst.dueDate)}</td>
                      <td>قيد الانتظار</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>الإجمالي</strong></td>
                    <td><strong>${formatAmountArabic(data.amount)} ر.س</strong></td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Signature Section -->
          <div class="section signature-section">
            <div class="section-title">
              <div class="section-icon">✍️</div>
              التوقيعات
            </div>
            <div class="signature-grid">
              <!-- First Party Signature -->
              <div class="signature-box">
                <div class="signature-title">توقيع الطرف الأول</div>
                <div class="stamp">
                  <div>شركة علي صالح</div>
                  <div>الشهري القابضة</div>
                  <div style="font-size: 8px;">4030554749</div>
                </div>
                <div class="signature-date">التاريخ: ${formatDateArabic(data.contractDate)}</div>
              </div>
              
              <!-- Second Party Signature -->
              <div class="signature-box">
                <div class="signature-title">توقيع الطرف الثاني</div>
                ${data.signatureData ? `<img src="${data.signatureData}" class="signature-img" alt="توقيع" />` : '<div style="height: 60px;"></div>'}
                <div class="signature-date">${data.clientName}</div>
                <div class="signature-date">التاريخ: ${formatDateArabic(new Date())}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-text">
            هذا العقد ملزم قانونياً للطرفين | السجل التجاري: 4030554749
          </div>
          <div class="footer-logo">MaxioCore</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const container = document.createElement('div');
  container.innerHTML = contractHtml;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.background = 'white';
  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`عقد_التمويل_${data.contractNumber}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
