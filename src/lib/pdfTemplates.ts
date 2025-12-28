import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Format amount in Arabic style
const formatAmountArabic = (amount: number): string => {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format date in Arabic
const formatDateArabic = (date: string | Date): string => {
  try {
    const d = new Date(date);
    return format(d, 'dd/MM/yyyy HH:mm', { locale: ar });
  } catch {
    return new Date().toLocaleDateString('ar-SA');
  }
};

// Create HTML template and convert to PDF
const createPDFFromHTML = async (htmlContent: string, fileName: string) => {
  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.background = 'white';
  document.body.appendChild(container);

  try {
    // Wait for fonts to load
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

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
};

// Common styles
const commonStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    direction: rtl;
    text-align: right;
  }
  .receipt-container {
    width: 210mm;
    min-height: 297mm;
    background: white;
    padding: 0;
    font-size: 12px;
    color: #333;
  }
  .header {
    background: linear-gradient(135deg, #00805A 0%, #006644 100%);
    padding: 20px;
    text-align: center;
    color: white;
  }
  .header-blue {
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  }
  .header-purple {
    background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
  }
  .header-gold {
    background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
  }
  .logo-circle {
    width: 60px;
    height: 60px;
    background: white;
    border-radius: 50%;
    margin: 0 auto 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    color: #00805A;
  }
  .header-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .header-subtitle {
    font-size: 14px;
    opacity: 0.9;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 15px 25px;
    gap: 20px;
  }
  .info-box {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 12px 15px;
    min-width: 140px;
  }
  .info-label {
    font-size: 10px;
    color: #64748B;
    margin-bottom: 5px;
  }
  .info-value {
    font-size: 13px;
    font-weight: 600;
    color: #1E293B;
  }
  .info-value.primary {
    color: #00805A;
  }
  .status-badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: white;
  }
  .status-completed { background: #22C55E; }
  .status-pending { background: #EAB308; }
  .status-failed { background: #EF4444; }
  .section-header {
    background: #00805A;
    color: white;
    padding: 10px 25px;
    font-size: 14px;
    font-weight: 600;
    margin: 10px 25px;
    border-radius: 6px;
    text-align: center;
  }
  .section-header-blue { background: #2563EB; }
  .section-header-purple { background: #7C3AED; }
  .section-header-gold { background: #D97706; }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 25px;
    border-bottom: 1px solid #F1F5F9;
  }
  .detail-row:nth-child(even) {
    background: #F8FAFC;
  }
  .detail-label {
    color: #64748B;
    font-size: 12px;
  }
  .detail-value {
    color: #1E293B;
    font-weight: 500;
    font-size: 12px;
  }
  .total-box {
    background: #00805A;
    color: white;
    margin: 15px 25px;
    padding: 15px 25px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .total-box-blue { background: #2563EB; }
  .total-label {
    font-size: 14px;
    font-weight: 600;
  }
  .total-value {
    font-size: 22px;
    font-weight: bold;
  }
  .signature-section {
    background: #F8FAFC;
    margin: 20px 25px;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #E2E8F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .signature-icon {
    width: 40px;
    height: 40px;
    background: #00805A;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
  }
  .signature-text {
    flex: 1;
    margin-right: 15px;
  }
  .signature-title {
    color: #00805A;
    font-weight: 600;
    font-size: 12px;
  }
  .signature-subtitle {
    color: #64748B;
    font-size: 10px;
  }
  .footer {
    text-align: center;
    padding: 20px 25px;
    border-top: 1px solid #E2E8F0;
    margin-top: 20px;
  }
  .footer-text {
    color: #64748B;
    font-size: 11px;
    margin-bottom: 5px;
  }
  .footer-bar {
    background: #00805A;
    height: 6px;
    margin-top: 15px;
  }
  .footer-bar-blue { background: #2563EB; }
`;

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

export const generateDepositReceipt = async (data: DepositReceiptData) => {
  const receiptNumber = `DEP-${data.id.slice(0, 8).toUpperCase()}`;
  const signatureCode = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;
  
  const statusLabels: Record<string, { text: string; class: string }> = {
    pending: { text: 'قيد الانتظار', class: 'status-pending' },
    completed: { text: 'مكتمل', class: 'status-completed' },
    failed: { text: 'فشل', class: 'status-failed' },
    cancelled: { text: 'ملغي', class: 'status-failed' },
  };
  const statusInfo = statusLabels[data.status] || { text: data.status, class: 'status-pending' };

  const html = `
    <style>${commonStyles}</style>
    <div class="receipt-container">
      <div class="header">
        <div class="logo-circle">M</div>
        <div class="header-title">ماكسيو كور</div>
        <div class="header-subtitle">إيصال إيداع</div>
      </div>
      
      <div class="info-row">
        <div class="info-box">
          <div class="info-label">التاريخ</div>
          <div class="info-value">${formatDateArabic(data.created_at)}</div>
        </div>
        <div style="text-align: center; padding: 10px;">
          <span class="${statusInfo.class} status-badge">${statusInfo.text}</span>
        </div>
        <div class="info-box">
          <div class="info-label">رقم الإيصال</div>
          <div class="info-value primary">${receiptNumber}</div>
        </div>
      </div>
      
      <div class="section-header">معلومات العميل</div>
      <div class="detail-row">
        <div class="detail-value">${data.user_name || '-'}</div>
        <div class="detail-label">اسم العميل</div>
      </div>
      <div class="detail-row">
        <div class="detail-value">${data.user_email || '-'}</div>
        <div class="detail-label">البريد الإلكتروني</div>
      </div>
      
      <div class="section-header">تفاصيل المعاملة</div>
      ${data.payment_method ? `
      <div class="detail-row">
        <div class="detail-value">${data.payment_method}</div>
        <div class="detail-label">طريقة الدفع</div>
      </div>
      ` : ''}
      ${data.transaction_id ? `
      <div class="detail-row">
        <div class="detail-value">${data.transaction_id}</div>
        <div class="detail-label">رقم العملية</div>
      </div>
      ` : ''}
      
      <div class="section-header">تفاصيل المبلغ</div>
      <div class="detail-row">
        <div class="detail-value">${formatAmountArabic(data.amount)} ر.س</div>
        <div class="detail-label">مبلغ الإيداع</div>
      </div>
      ${data.bonus_amount && data.bonus_amount > 0 ? `
      <div class="detail-row" style="background: #F0FDF4;">
        <div class="detail-value" style="color: #16A34A;">+${formatAmountArabic(data.bonus_amount)} ر.س</div>
        <div class="detail-label" style="color: #16A34A;">المكافأة</div>
      </div>
      ` : ''}
      ${data.fee_amount && data.fee_amount > 0 ? `
      <div class="detail-row" style="background: #FEF2F2;">
        <div class="detail-value" style="color: #DC2626;">-${formatAmountArabic(data.fee_amount)} ر.س</div>
        <div class="detail-label" style="color: #DC2626;">الرسوم</div>
      </div>
      ` : ''}
      
      <div class="total-box">
        <div class="total-value">${formatAmountArabic(data.total_credited)} ر.س</div>
        <div class="total-label">إجمالي المضاف للرصيد</div>
      </div>
      
      <div class="signature-section">
        <div class="signature-icon">✓</div>
        <div class="signature-text">
          <div class="signature-title">توقيع رقمي معتمد</div>
          <div class="signature-subtitle">كود التحقق: ${signatureCode}</div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-text">إيصال إلكتروني - لا يحتاج إلى توقيع يدوي</div>
        <div class="footer-text">ماكسيو كور - منصة الخدمات الرقمية</div>
        <div class="footer-text">support@maxiocore.com</div>
        <div class="footer-text" style="font-size: 9px; margin-top: 10px;">رقم المرجع: ${receiptNumber} | تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</div>
        <div class="footer-bar"></div>
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `إيداع-${receiptNumber}.pdf`);
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

export const generateCashbackReceipt = async (data: CashbackReceiptData) => {
  const receiptNumber = `CB-${data.id.slice(0, 8).toUpperCase()}`;
  const signatureCode = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;
  
  const typeLabels: Record<string, { text: string; class: string }> = {
    earned: { text: 'مكتسب', class: 'status-completed' },
    withdrawn: { text: 'مسحوب', class: 'status-pending' },
    expired: { text: 'منتهي', class: 'status-failed' },
  };
  const typeInfo = typeLabels[data.type] || { text: data.type, class: 'status-pending' };
  const isPositive = data.amount > 0;

  const html = `
    <style>${commonStyles}</style>
    <div class="receipt-container">
      <div class="header">
        <div class="logo-circle">M</div>
        <div class="header-title">ماكسيو كور</div>
        <div class="header-subtitle">إيصال الكاش باك</div>
      </div>
      
      <div class="info-row">
        <div class="info-box">
          <div class="info-label">التاريخ</div>
          <div class="info-value">${formatDateArabic(data.created_at)}</div>
        </div>
        <div style="text-align: center; padding: 10px;">
          <span class="${typeInfo.class} status-badge">${typeInfo.text}</span>
        </div>
        <div class="info-box">
          <div class="info-label">رقم الإيصال</div>
          <div class="info-value primary">${receiptNumber}</div>
        </div>
      </div>
      
      <div class="section-header">تفاصيل المعاملة</div>
      ${data.user_name ? `
      <div class="detail-row">
        <div class="detail-value">${data.user_name}</div>
        <div class="detail-label">اسم العميل</div>
      </div>
      ` : ''}
      ${data.user_email ? `
      <div class="detail-row">
        <div class="detail-value">${data.user_email}</div>
        <div class="detail-label">البريد الإلكتروني</div>
      </div>
      ` : ''}
      <div class="detail-row">
        <div class="detail-value">${data.description_ar || data.description || 'معاملة كاش باك'}</div>
        <div class="detail-label">الوصف</div>
      </div>
      
      <div class="section-header">تفاصيل المبلغ</div>
      <div class="total-box" style="background: ${isPositive ? '#00805A' : '#EF4444'};">
        <div class="total-value">${isPositive ? '+' : ''}${formatAmountArabic(data.amount)} ر.س</div>
        <div class="total-label">مبلغ الكاش باك</div>
      </div>
      
      ${data.balance_after !== undefined ? `
      <div class="detail-row" style="background: #F0FDF4;">
        <div class="detail-value" style="color: #00805A; font-size: 14px; font-weight: bold;">${formatAmountArabic(data.balance_after)} ر.س</div>
        <div class="detail-label">الرصيد بعد المعاملة</div>
      </div>
      ` : ''}
      
      <div class="signature-section">
        <div class="signature-icon">✓</div>
        <div class="signature-text">
          <div class="signature-title">توقيع رقمي معتمد</div>
          <div class="signature-subtitle">كود التحقق: ${signatureCode}</div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-text">إيصال إلكتروني - لا يحتاج إلى توقيع يدوي</div>
        <div class="footer-text">ماكسيو كور - منصة الخدمات الرقمية</div>
        <div class="footer-text">support@maxiocore.com</div>
        <div class="footer-text" style="font-size: 9px; margin-top: 10px;">رقم المرجع: ${receiptNumber} | تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</div>
        <div class="footer-bar"></div>
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `كاش-باك-${receiptNumber}.pdf`);
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

export const generateOrderReceipt = async (data: OrderReceiptData) => {
  const receiptNumber = data.order_number;
  const signatureCode = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;
  
  const statusLabels: Record<string, { text: string; class: string }> = {
    pending: { text: 'قيد الانتظار', class: 'status-pending' },
    processing: { text: 'جاري المعالجة', class: 'status-pending' },
    in_progress: { text: 'قيد التنفيذ', class: 'status-pending' },
    completed: { text: 'مكتمل', class: 'status-completed' },
    partial: { text: 'جزئي', class: 'status-pending' },
    cancelled: { text: 'ملغي', class: 'status-failed' },
    refunded: { text: 'مسترد', class: 'status-failed' },
    confirmed: { text: 'مؤكد', class: 'status-completed' },
  };
  const statusInfo = statusLabels[data.status] || { text: data.status, class: 'status-pending' };
  const subtotal = data.total_price + (data.discount_amount || 0);

  const html = `
    <style>${commonStyles}</style>
    <div class="receipt-container">
      <div class="header header-blue">
        <div class="logo-circle" style="color: #2563EB;">M</div>
        <div class="header-title">ماكسيو كور</div>
        <div class="header-subtitle">إيصال الطلب</div>
      </div>
      
      <div class="info-row">
        <div class="info-box">
          <div class="info-label">التاريخ</div>
          <div class="info-value">${formatDateArabic(data.created_at)}</div>
        </div>
        <div style="text-align: center; padding: 10px;">
          <span class="${statusInfo.class} status-badge">${statusInfo.text}</span>
        </div>
        <div class="info-box">
          <div class="info-label">رقم الطلب</div>
          <div class="info-value" style="color: #2563EB;">${receiptNumber}</div>
        </div>
      </div>
      
      <div class="section-header section-header-blue">معلومات العميل</div>
      ${data.user_name ? `
      <div class="detail-row">
        <div class="detail-value">${data.user_name}</div>
        <div class="detail-label">الاسم</div>
      </div>
      ` : ''}
      ${data.user_email ? `
      <div class="detail-row">
        <div class="detail-value">${data.user_email}</div>
        <div class="detail-label">البريد الإلكتروني</div>
      </div>
      ` : ''}
      
      <div class="section-header section-header-blue">تفاصيل الخدمة</div>
      <div class="detail-row">
        <div class="detail-value">${data.service_name.length > 50 ? data.service_name.substring(0, 50) + '...' : data.service_name}</div>
        <div class="detail-label">الخدمة</div>
      </div>
      <div class="detail-row">
        <div class="detail-value">${data.quantity.toLocaleString('ar-SA')}</div>
        <div class="detail-label">الكمية</div>
      </div>
      ${data.link ? `
      <div class="detail-row">
        <div class="detail-value" style="word-break: break-all; font-size: 10px; color: #2563EB;">${data.link.length > 50 ? data.link.substring(0, 50) + '...' : data.link}</div>
        <div class="detail-label">الرابط</div>
      </div>
      ` : ''}
      
      <div class="section-header section-header-blue">تفاصيل الدفع</div>
      <div class="detail-row">
        <div class="detail-value">${formatAmountArabic(subtotal)} ر.س</div>
        <div class="detail-label">المبلغ الأساسي</div>
      </div>
      ${data.discount_amount && data.discount_amount > 0 ? `
      <div class="detail-row" style="background: #F0FDF4;">
        <div class="detail-value" style="color: #16A34A;">-${formatAmountArabic(data.discount_amount)} ر.س</div>
        <div class="detail-label" style="color: #16A34A;">الخصم</div>
      </div>
      ` : ''}
      
      <div class="total-box total-box-blue">
        <div class="total-value">${formatAmountArabic(data.total_price)} ر.س</div>
        <div class="total-label">الإجمالي</div>
      </div>
      
      ${data.completed_at ? `
      <div style="text-align: center; padding: 10px; color: #16A34A; font-size: 12px;">
        تاريخ الإكمال: ${formatDateArabic(data.completed_at)}
      </div>
      ` : ''}
      
      <div class="signature-section">
        <div class="signature-icon" style="background: #2563EB;">✓</div>
        <div class="signature-text">
          <div class="signature-title" style="color: #2563EB;">توقيع رقمي معتمد</div>
          <div class="signature-subtitle">كود التحقق: ${signatureCode}</div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-text">إيصال إلكتروني - لا يحتاج إلى توقيع يدوي</div>
        <div class="footer-text">ماكسيو كور - منصة الخدمات الرقمية</div>
        <div class="footer-text">support@maxiocore.com</div>
        <div class="footer-text" style="font-size: 9px; margin-top: 10px;">رقم المرجع: ${receiptNumber} | تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</div>
        <div class="footer-bar footer-bar-blue"></div>
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `طلب-${receiptNumber}.pdf`);
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

export const generateChallengeCertificate = async (data: ChallengeCertificateData) => {
  const certificateNumber = `CH-${data.id.slice(0, 8).toUpperCase()}`;
  const signatureCode = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;

  const html = `
    <style>
      ${commonStyles}
      .certificate-container {
        width: 297mm;
        min-height: 210mm;
        background: linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%);
        padding: 20px;
        text-align: center;
        direction: rtl;
      }
      .certificate-border {
        border: 4px solid #6366F1;
        border-radius: 12px;
        padding: 30px;
        min-height: 180mm;
      }
      .cert-header {
        background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
        color: white;
        padding: 20px 40px;
        border-radius: 8px;
        margin-bottom: 30px;
      }
      .cert-title {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .cert-subtitle {
        font-size: 14px;
        opacity: 0.9;
      }
      .user-name {
        font-size: 32px;
        color: #6366F1;
        font-weight: bold;
        margin: 20px 0;
      }
      .challenge-box {
        background: #F8FAFC;
        border: 2px solid #6366F1;
        border-radius: 8px;
        padding: 20px;
        margin: 20px auto;
        max-width: 500px;
      }
      .challenge-title {
        font-size: 18px;
        color: #6366F1;
        font-weight: bold;
      }
      .stats-row {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin: 25px 0;
      }
      .stat-box {
        background: #F0FDF4;
        border-radius: 8px;
        padding: 15px 25px;
        min-width: 120px;
      }
      .stat-box.gold {
        background: #FEF9C3;
      }
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #16A34A;
      }
      .stat-box.gold .stat-value {
        color: #CA8A04;
      }
      .stat-label {
        font-size: 11px;
        color: #64748B;
      }
    </style>
    <div class="certificate-container">
      <div class="certificate-border">
        <div class="cert-header">
          <div class="cert-title">شهادة إنجاز التحدي</div>
          <div class="cert-subtitle">Certificate of Achievement</div>
        </div>
        
        <div style="color: #64748B; font-size: 14px; margin: 20px 0;">تُمنح هذه الشهادة بكل فخر إلى</div>
        
        <div class="user-name">${data.user_name || 'عميل مميز'}</div>
        
        <div style="color: #64748B; font-size: 13px;">لإكمال التحدي بنجاح</div>
        
        <div class="challenge-box">
          <div class="challenge-title">${data.title_ar || data.title}</div>
        </div>
        
        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-value">${data.current_value}/${data.target_value}</div>
            <div class="stat-label">الهدف المحقق</div>
          </div>
          <div class="stat-box gold">
            <div class="stat-value">+${data.reward_points}</div>
            <div class="stat-label">النقاط المكتسبة</div>
          </div>
        </div>
        
        <div style="color: #64748B; font-size: 12px; margin-top: 30px;">
          تاريخ الإنجاز: ${format(new Date(data.completed_at), 'dd MMMM yyyy', { locale: ar })}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 30px; padding: 0 40px;">
          <div style="color: #94A3B8; font-size: 10px;">رقم الشهادة: ${certificateNumber}</div>
          <div style="text-align: center;">
            <div style="width: 50px; height: 50px; background: #6366F1; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">✓</div>
            <div style="color: #6366F1; font-size: 10px; margin-top: 5px;">توقيع رقمي معتمد</div>
          </div>
          <div style="color: #94A3B8; font-size: 10px;">كود التحقق: ${signatureCode}</div>
        </div>
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `شهادة-تحدي-${certificateNumber}.pdf`);
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

export const generateBadgeCertificate = async (data: BadgeCertificateData) => {
  const certificateNumber = `BDG-${data.id.slice(0, 8).toUpperCase()}`;
  const signatureCode = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;
  const tierLabels = ['', 'برونزي', 'فضي', 'ذهبي', 'بلاتيني', 'ماسي'];

  const html = `
    <style>
      ${commonStyles}
      .certificate-container {
        width: 297mm;
        min-height: 210mm;
        background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
        padding: 20px;
        text-align: center;
        direction: rtl;
      }
      .certificate-border {
        border: 4px solid #D97706;
        border-radius: 12px;
        padding: 30px;
        min-height: 180mm;
      }
      .cert-header {
        background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
        color: white;
        padding: 20px 40px;
        border-radius: 8px;
        margin-bottom: 30px;
      }
      .badge-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%);
        border-radius: 50%;
        margin: 20px auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        border: 4px solid white;
        box-shadow: 0 4px 15px rgba(217, 119, 6, 0.3);
      }
      .tier-label {
        color: #D97706;
        font-size: 14px;
        margin-bottom: 20px;
      }
      .user-name {
        font-size: 32px;
        color: #D97706;
        font-weight: bold;
        margin: 20px 0;
      }
      .badge-box {
        background: #FEF3C7;
        border: 2px solid #D97706;
        border-radius: 8px;
        padding: 20px;
        margin: 20px auto;
        max-width: 400px;
      }
      .badge-name {
        font-size: 20px;
        color: #92400E;
        font-weight: bold;
      }
      .badge-name-en {
        font-size: 12px;
        color: #B45309;
        margin-top: 5px;
      }
    </style>
    <div class="certificate-container">
      <div class="certificate-border">
        <div class="cert-header">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 5px;">شهادة الشارة</div>
          <div style="font-size: 14px; opacity: 0.9;">Certificate of Recognition</div>
        </div>
        
        <div class="badge-icon">${data.icon || data.tier}</div>
        
        <div class="tier-label">المستوى ${data.tier}: ${tierLabels[data.tier] || 'النخبة'}</div>
        
        <div style="color: #64748B; font-size: 14px;">تُمنح هذه الشارة بكل تقدير إلى</div>
        
        <div class="user-name">${data.user_name || 'عميل مميز'}</div>
        
        <div class="badge-box">
          <div class="badge-name">${data.name_ar || data.name}</div>
          <div class="badge-name-en">${data.name}</div>
        </div>
        
        <div style="color: #64748B; font-size: 12px; margin-top: 30px;">
          تاريخ المنح: ${format(new Date(data.awarded_at), 'dd MMMM yyyy', { locale: ar })}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 30px; padding: 0 40px;">
          <div style="color: #94A3B8; font-size: 10px;">رقم الشهادة: ${certificateNumber}</div>
          <div style="text-align: center;">
            <div style="width: 50px; height: 50px; background: #D97706; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">✓</div>
            <div style="color: #D97706; font-size: 10px; margin-top: 5px;">توقيع رقمي معتمد</div>
          </div>
          <div style="color: #94A3B8; font-size: 10px;">كود التحقق: ${signatureCode}</div>
        </div>
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `شهادة-شارة-${certificateNumber}.pdf`);
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

export const generateRewardsStatement = async (data: RewardsStatementData) => {
  const statementNumber = `RWD-${Date.now().toString(36).toUpperCase()}`;
  const signatureCode = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;
  
  const typeLabelsAr: Record<string, string> = {
    earned: 'مكتسب',
    redeemed: 'مستبدل',
    bonus: 'مكافأة',
    expired: 'منتهي',
  };

  const transactionsHTML = data.transactions.slice(0, 8).map((tx, i) => {
    const isPositive = tx.points > 0;
    return `
      <div class="detail-row" style="background: ${i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <div class="detail-value" style="color: ${isPositive ? '#16A34A' : '#EF4444'}; font-weight: bold;">${isPositive ? '+' : ''}${tx.points}</div>
        <div class="detail-value" style="flex: 1; text-align: center;">${typeLabelsAr[tx.type] || tx.type}</div>
        <div class="detail-value" style="flex: 2;">${(tx.description_ar || tx.description || '-').substring(0, 30)}</div>
        <div class="detail-label">${format(new Date(tx.created_at), 'dd/MM/yy')}</div>
      </div>
    `;
  }).join('');

  const html = `
    <style>${commonStyles}
      .stats-grid {
        display: flex;
        gap: 15px;
        padding: 15px 25px;
        justify-content: center;
      }
      .stat-card {
        background: #F0FDF4;
        border: 1px solid #22C55E;
        border-radius: 8px;
        padding: 15px;
        min-width: 100px;
        text-align: center;
      }
      .stat-card.blue {
        background: #EFF6FF;
        border-color: #3B82F6;
      }
      .stat-card.red {
        background: #FEF2F2;
        border-color: #EF4444;
      }
      .stat-number {
        font-size: 22px;
        font-weight: bold;
        color: #22C55E;
      }
      .stat-card.blue .stat-number { color: #3B82F6; }
      .stat-card.red .stat-number { color: #EF4444; }
      .stat-text {
        font-size: 10px;
        color: #64748B;
        margin-top: 5px;
      }
    </style>
    <div class="receipt-container">
      <div class="header header-purple">
        <div class="logo-circle" style="color: #7C3AED;">M</div>
        <div class="header-title">ماكسيو كور</div>
        <div class="header-subtitle">كشف حساب المكافآت</div>
      </div>
      
      <div class="info-row">
        <div class="info-box">
          <div class="info-label">تاريخ الإصدار</div>
          <div class="info-value">${format(new Date(), 'dd/MM/yyyy')}</div>
        </div>
        ${data.tier_name_ar || data.tier_name ? `
        <div style="text-align: center; padding: 10px;">
          <span class="status-badge" style="background: #7C3AED;">${data.tier_name_ar || data.tier_name}</span>
        </div>
        ` : ''}
        <div class="info-box">
          <div class="info-label">رقم الكشف</div>
          <div class="info-value" style="color: #7C3AED;">${statementNumber}</div>
        </div>
      </div>
      
      ${data.user_name || data.user_email ? `
      <div class="section-header section-header-purple">صاحب الحساب</div>
      ${data.user_name ? `
      <div class="detail-row">
        <div class="detail-value">${data.user_name}</div>
        <div class="detail-label">الاسم</div>
      </div>
      ` : ''}
      ${data.user_email ? `
      <div class="detail-row">
        <div class="detail-value">${data.user_email}</div>
        <div class="detail-label">البريد الإلكتروني</div>
      </div>
      ` : ''}
      ` : ''}
      
      <div class="section-header section-header-purple">ملخص النقاط</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${data.available_points.toLocaleString('ar-SA')}</div>
          <div class="stat-text">المتاحة</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-number">${data.total_points.toLocaleString('ar-SA')}</div>
          <div class="stat-text">إجمالي المكتسبة</div>
        </div>
        <div class="stat-card red">
          <div class="stat-number">${data.redeemed_points.toLocaleString('ar-SA')}</div>
          <div class="stat-text">المستبدلة</div>
        </div>
      </div>
      
      ${data.transactions && data.transactions.length > 0 ? `
      <div class="section-header section-header-purple">آخر المعاملات</div>
      <div class="detail-row" style="background: #F1F5F9; font-weight: bold;">
        <div class="detail-label">النقاط</div>
        <div class="detail-label" style="flex: 1; text-align: center;">النوع</div>
        <div class="detail-label" style="flex: 2;">الوصف</div>
        <div class="detail-label">التاريخ</div>
      </div>
      ${transactionsHTML}
      ` : ''}
      
      <div class="signature-section">
        <div class="signature-icon" style="background: #7C3AED;">✓</div>
        <div class="signature-text">
          <div class="signature-title" style="color: #7C3AED;">توقيع رقمي معتمد</div>
          <div class="signature-subtitle">كود التحقق: ${signatureCode}</div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-text">إيصال إلكتروني - لا يحتاج إلى توقيع يدوي</div>
        <div class="footer-text">ماكسيو كور - منصة الخدمات الرقمية</div>
        <div class="footer-text">support@maxiocore.com</div>
        <div class="footer-text" style="font-size: 9px; margin-top: 10px;">رقم المرجع: ${statementNumber} | تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</div>
        <div class="footer-bar" style="background: #7C3AED;"></div>
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `كشف-مكافآت-${statementNumber}.pdf`);
};
