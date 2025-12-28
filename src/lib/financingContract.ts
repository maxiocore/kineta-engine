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

const formatAmountArabic = (amount: number): string => {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatDateArabic = (date: string | Date): string => {
  try {
    const d = new Date(date);
    return format(d, 'dd MMMM yyyy', { locale: ar });
  } catch {
    return new Date().toLocaleDateString('ar-SA');
  }
};

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
  // Generate installments rows HTML
  const installmentsRows = data.installments.map(inst => `
    <tr>
      <td style="padding: 10px 15px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${inst.number}</td>
      <td style="padding: 10px 15px; text-align: center; border-bottom: 1px solid #e2e8f0;">${formatAmountArabic(inst.amount)} ر.س</td>
      <td style="padding: 10px 15px; text-align: center; border-bottom: 1px solid #e2e8f0;">${formatDateArabic(inst.dueDate)}</td>
      <td style="padding: 10px 15px; text-align: center; border-bottom: 1px solid #e2e8f0;">
        <span style="background: #fef3c7; color: #92400e; padding: 3px 12px; border-radius: 12px; font-size: 11px;">قيد الانتظار</span>
      </td>
    </tr>
  `).join('');

  const contractHtml = `
    <div id="contract-content" style="
      width: 794px;
      background: #ffffff;
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      text-align: right;
      color: #1e293b;
      line-height: 1.6;
    ">
      <!-- صفحة 1: المعلومات والبنود -->
      <div style="min-height: 1123px; position: relative; page-break-after: always;">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          padding: 25px 35px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 4px solid #f59e0b;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 50px;
              height: 50px;
              background: linear-gradient(135deg, #f59e0b, #eab308);
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: 900;
              color: #1e293b;
            ">M</div>
            <div>
              <div style="font-size: 20px; font-weight: 800; color: #f59e0b;">MaxioCore</div>
              <div style="font-size: 11px; color: #94a3b8;">شركة علي صالح الشهري القابضة</div>
            </div>
          </div>
          <div style="
            background: rgba(245, 158, 11, 0.15);
            padding: 10px 25px;
            border-radius: 25px;
            border: 1px solid rgba(245, 158, 11, 0.3);
          ">
            <span style="font-size: 18px; font-weight: 700; color: #ffffff;">عقد التمويل</span>
          </div>
        </div>

        <!-- Info Bar -->
        <div style="
          background: #f8fafc;
          padding: 18px 35px;
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #e2e8f0;
        ">
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-bottom: 3px;">رقم العقد</div>
            <div style="font-size: 13px; font-weight: 700; color: #f59e0b;">${data.contractNumber}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-bottom: 3px;">رقم الطلب</div>
            <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${data.applicationNumber}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-bottom: 3px;">تاريخ العقد</div>
            <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${formatDateArabic(data.contractDate)}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-bottom: 3px;">مبلغ التمويل</div>
            <div style="font-size: 13px; font-weight: 700; color: #f59e0b;">${formatAmountArabic(data.amount)} ر.س</div>
          </div>
        </div>

        <!-- Content -->
        <div style="padding: 25px 35px;">
          <!-- أطراف العقد -->
          <div style="margin-bottom: 25px;">
            <div style="
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span style="
                width: 22px;
                height: 22px;
                background: linear-gradient(135deg, #f59e0b, #eab308);
                border-radius: 5px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
              ">👥</span>
              أطراف العقد
            </div>
            
            <div style="display: flex; gap: 15px;">
              <!-- الطرف الأول -->
              <div style="
                flex: 1;
                padding: 18px;
                border-radius: 10px;
                border: 2px solid rgba(245, 158, 11, 0.3);
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(234, 179, 8, 0.05));
              ">
                <div style="font-size: 13px; font-weight: 700; color: #f59e0b; margin-bottom: 12px;">الطرف الأول (الممول)</div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px dashed #e2e8f0;">
                  <span style="color: #64748b;">اسم الشركة:</span>
                  <span style="font-weight: 600; color: #1e293b;">شركة علي صالح الشهري القابضة</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px dashed #e2e8f0;">
                  <span style="color: #64748b;">السجل التجاري:</span>
                  <span style="font-weight: 600; color: #1e293b;">4030554749</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px;">
                  <span style="color: #64748b;">العنوان:</span>
                  <span style="font-weight: 600; color: #1e293b;">المملكة العربية السعودية</span>
                </div>
              </div>
              
              <!-- الطرف الثاني -->
              <div style="
                flex: 1;
                padding: 18px;
                border-radius: 10px;
                border: 2px solid rgba(16, 185, 129, 0.3);
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(20, 184, 166, 0.05));
              ">
                <div style="font-size: 13px; font-weight: 700; color: #10b981; margin-bottom: 12px;">الطرف الثاني (المستفيد)</div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px dashed #e2e8f0;">
                  <span style="color: #64748b;">الاسم الكامل:</span>
                  <span style="font-weight: 600; color: #1e293b;">${data.clientName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px dashed #e2e8f0;">
                  <span style="color: #64748b;">رقم الهوية:</span>
                  <span style="font-weight: 600; color: #1e293b;">${data.nationalId}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px dashed #e2e8f0;">
                  <span style="color: #64748b;">رقم الجوال:</span>
                  <span style="font-weight: 600; color: #1e293b;">${data.phone}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px;">
                  <span style="color: #64748b;">البريد الإلكتروني:</span>
                  <span style="font-weight: 600; color: #1e293b;">${data.email}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- بنود العقد -->
          <div style="margin-bottom: 25px;">
            <div style="
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span style="
                width: 22px;
                height: 22px;
                background: linear-gradient(135deg, #f59e0b, #eab308);
                border-radius: 5px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
              ">📋</span>
              بنود وشروط العقد
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-right: 4px solid #f59e0b;">
              <span style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-left: 8px;">البند الأول</span>
              <span style="font-size: 11px; line-height: 1.7; color: #334155;">
                يوافق الطرف الأول على تمويل الطرف الثاني بمبلغ 
                <span style="color: #10b981; font-weight: 700;">${formatAmountArabic(data.amount)} ر.س</span>
                (فقط ${numberToArabicWords(Math.floor(data.amount))} ريال سعودي لا غير).
              </span>
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-right: 4px solid #f59e0b;">
              <span style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-left: 8px;">البند الثاني</span>
              <span style="font-size: 11px; line-height: 1.7; color: #334155;">
                يقر الطرف الثاني بأن التمويل سيُستخدم حصرياً لشراء خدمات من منصة ماكسيوكور، ولا يمكن سحبه نقداً أو تحويله لأي جهة أخرى.
              </span>
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-right: 4px solid #f59e0b;">
              <span style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-left: 8px;">البند الثالث</span>
              <span style="font-size: 11px; line-height: 1.7; color: #334155;">
                يلتزم الطرف الثاني بسداد مبلغ التمويل على 
                <span style="color: #10b981; font-weight: 700;">${data.installmentsCount} أقساط شهرية</span>
                متساوية، تُستحق في يوم 30 من كل شهر ميلادي.
              </span>
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-right: 4px solid #f59e0b;">
              <span style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-left: 8px;">البند الرابع</span>
              <span style="font-size: 11px; line-height: 1.7; color: #334155;">
                هذا التمويل بدون فوائد أو رسوم إضافية، بشرط الالتزام بمواعيد السداد المحددة في هذا العقد.
              </span>
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-right: 4px solid #f59e0b;">
              <span style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-left: 8px;">البند الخامس</span>
              <span style="font-size: 11px; line-height: 1.7; color: #334155;">
                في حال تأخر السداد لمدة تتجاوز 30 يوماً، يحق للطرف الأول اتخاذ الإجراءات القانونية اللازمة لتحصيل المستحقات.
              </span>
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-right: 4px solid #f59e0b;">
              <span style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-left: 8px;">البند السادس</span>
              <span style="font-size: 11px; line-height: 1.7; color: #334155;">
                يقر الطرف الثاني بصحة جميع البيانات المقدمة ويتحمل المسؤولية الكاملة في حال تقديم بيانات غير صحيحة.
              </span>
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-right: 4px solid #f59e0b;">
              <span style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-left: 8px;">البند السابع</span>
              <span style="font-size: 11px; line-height: 1.7; color: #334155;">
                يخضع هذا العقد للأنظمة والقوانين المعمول بها في المملكة العربية السعودية، وأي نزاع ينشأ عنه يختص به القضاء السعودي.
              </span>
            </div>
          </div>

          <!-- جدول الأقساط -->
          <div style="margin-bottom: 25px;">
            <div style="
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span style="
                width: 22px;
                height: 22px;
                background: linear-gradient(135deg, #f59e0b, #eab308);
                border-radius: 5px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
              ">📅</span>
              جدول الأقساط
            </div>

            <div style="overflow: hidden; border-radius: 10px; border: 2px solid #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #1e293b;">
                    <th style="padding: 12px 15px; font-size: 12px; font-weight: 600; color: #ffffff; text-align: center;">رقم القسط</th>
                    <th style="padding: 12px 15px; font-size: 12px; font-weight: 600; color: #ffffff; text-align: center;">المبلغ</th>
                    <th style="padding: 12px 15px; font-size: 12px; font-weight: 600; color: #ffffff; text-align: center;">تاريخ الاستحقاق</th>
                    <th style="padding: 12px 15px; font-size: 12px; font-weight: 600; color: #ffffff; text-align: center;">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${installmentsRows}
                </tbody>
                <tfoot>
                  <tr style="background: #f59e0b;">
                    <td style="padding: 12px 15px; font-size: 12px; font-weight: 700; color: #1e293b; text-align: center;">الإجمالي</td>
                    <td style="padding: 12px 15px; font-size: 12px; font-weight: 700; color: #1e293b; text-align: center;">${formatAmountArabic(data.amount)} ر.س</td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- التوقيعات -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
            <div style="
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
              padding-bottom: 10px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span style="
                width: 22px;
                height: 22px;
                background: linear-gradient(135deg, #f59e0b, #eab308);
                border-radius: 5px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
              ">✍️</span>
              التوقيعات
            </div>

            <div style="display: flex; gap: 30px;">
              <!-- توقيع الطرف الأول -->
              <div style="
                flex: 1;
                text-align: center;
                padding: 20px;
                border: 2px dashed #e2e8f0;
                border-radius: 10px;
                min-height: 140px;
              ">
                <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">توقيع الطرف الأول</div>
                <div style="
                  width: 80px;
                  height: 80px;
                  border: 3px solid #10b981;
                  border-radius: 50%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  color: #10b981;
                  font-size: 9px;
                  font-weight: 700;
                  text-align: center;
                  margin: 0 auto;
                  transform: rotate(-10deg);
                ">
                  <div>شركة علي صالح</div>
                  <div>الشهري القابضة</div>
                  <div style="font-size: 7px; margin-top: 2px;">4030554749</div>
                </div>
                <div style="font-size: 10px; color: #64748b; margin-top: 10px;">التاريخ: ${formatDateArabic(data.contractDate)}</div>
              </div>

              <!-- توقيع الطرف الثاني -->
              <div style="
                flex: 1;
                text-align: center;
                padding: 20px;
                border: 2px dashed #e2e8f0;
                border-radius: 10px;
                min-height: 140px;
              ">
                <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">توقيع الطرف الثاني</div>
                ${data.signatureData ? `<img src="${data.signatureData}" style="max-height: 60px; margin: 10px auto; display: block;" />` : '<div style="height: 60px;"></div>'}
                <div style="font-size: 11px; color: #1e293b; margin-top: 8px;">${data.clientName}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 5px;">التاريخ: ${formatDateArabic(new Date())}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          background: #1e293b;
          padding: 12px 35px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
        ">
          <div style="font-size: 9px; color: #94a3b8;">
            هذا العقد ملزم قانونياً للطرفين | السجل التجاري: 4030554749
          </div>
          <div style="color: #f59e0b; font-weight: 700; font-size: 12px;">MaxioCore</div>
        </div>
      </div>
    </div>
  `;

  // Create container
  const container = document.createElement('div');
  container.innerHTML = contractHtml;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = 'white';
  container.style.fontFamily = 'Cairo, Segoe UI, Tahoma, sans-serif';
  document.body.appendChild(container);

  try {
    // Wait for fonts to load
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(container.querySelector('#contract-content') as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
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

    while (heightLeft > 0) {
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
