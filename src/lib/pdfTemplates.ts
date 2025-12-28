import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Format amount in Arabic style with SAR
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
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
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

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
};

// Bank-style template styles - Fully RTL
const bankStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
  }
  .receipt {
    width: 210mm;
    min-height: 297mm;
    background: #fff;
    direction: rtl;
    text-align: right;
  }
  
  /* Header Section */
  .bank-header {
    background: linear-gradient(to left, #00805A, #004d36);
    padding: 25px 30px;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: center;
  }
  .bank-header.blue {
    background: linear-gradient(to left, #1e40af, #1e3a8a);
  }
  .bank-header.purple {
    background: linear-gradient(to left, #7c3aed, #5b21b6);
  }
  .bank-header.gold {
    background: linear-gradient(to left, #d97706, #92400e);
  }
  .bank-logo {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 15px;
  }
  .logo-icon {
    width: 55px;
    height: 55px;
    background: #fff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: bold;
    color: #00805A;
  }
  .logo-icon.blue { color: #1e40af; }
  .logo-icon.purple { color: #7c3aed; }
  .logo-icon.gold { color: #d97706; }
  .bank-name {
    color: #fff;
  }
  .bank-name h1 {
    font-size: 22px;
    font-weight: bold;
    margin: 0;
  }
  .bank-name span {
    font-size: 11px;
    opacity: 0.85;
  }
  .receipt-type {
    color: #fff;
    text-align: left;
  }
  .receipt-type h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    background: rgba(255,255,255,0.15);
    padding: 8px 20px;
    border-radius: 25px;
  }
  
  /* Meta Info Bar */
  .meta-bar {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    padding: 12px 30px;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: center;
  }
  .meta-item {
    text-align: center;
  }
  .meta-label {
    font-size: 10px;
    color: #64748b;
    margin-bottom: 3px;
  }
  .meta-value {
    font-size: 12px;
    font-weight: 600;
    color: #1e293b;
  }
  .meta-value.primary { color: #00805A; }
  .meta-value.blue { color: #1e40af; }
  .meta-value.purple { color: #7c3aed; }
  
  /* Status Badge */
  .status-badge {
    display: inline-block;
    padding: 6px 20px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
  }
  .status-completed { background: #22c55e; }
  .status-pending { background: #eab308; }
  .status-failed { background: #ef4444; }
  
  /* Section Headers */
  .section-title {
    background: #00805A;
    color: #fff;
    padding: 10px 30px;
    font-size: 13px;
    font-weight: 600;
    margin: 0;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 10px;
  }
  .section-title.blue { background: #1e40af; }
  .section-title.purple { background: #7c3aed; }
  .section-title.gold { background: #d97706; }
  .section-title::before {
    content: '◄';
    font-size: 10px;
  }
  
  /* Data Table */
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  .data-row {
    display: flex;
    flex-direction: row-reverse;
    border-bottom: 1px solid #f1f5f9;
  }
  .data-row:nth-child(even) {
    background: #f8fafc;
  }
  .data-cell {
    padding: 12px 30px;
    font-size: 12px;
    flex: 1;
  }
  .data-cell.label {
    color: #64748b;
    font-weight: 500;
  }
  .data-cell.value {
    color: #1e293b;
    font-weight: 600;
    text-align: left;
  }
  .data-cell.highlight {
    color: #00805A;
  }
  .data-cell.blue { color: #1e40af; }
  .data-cell.green { color: #16a34a; }
  .data-cell.red { color: #ef4444; }
  
  /* Total Box */
  .total-section {
    margin: 20px 30px;
    background: linear-gradient(to left, #00805A, #004d36);
    border-radius: 12px;
    padding: 20px 25px;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: center;
  }
  .total-section.blue {
    background: linear-gradient(to left, #1e40af, #1e3a8a);
  }
  .total-section.purple {
    background: linear-gradient(to left, #7c3aed, #5b21b6);
  }
  .total-label {
    color: #fff;
    font-size: 14px;
    font-weight: 500;
  }
  .total-amount {
    color: #fff;
    font-size: 26px;
    font-weight: bold;
    direction: ltr;
  }
  .total-currency {
    font-size: 14px;
    margin-right: 5px;
    opacity: 0.9;
  }
  
  /* Digital Signature Section */
  .signature-box {
    margin: 25px 30px;
    background: linear-gradient(to left, #f0fdf4, #dcfce7);
    border: 2px solid #22c55e;
    border-radius: 12px;
    padding: 18px 25px;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 20px;
  }
  .signature-box.blue {
    background: linear-gradient(to left, #eff6ff, #dbeafe);
    border-color: #3b82f6;
  }
  .signature-box.purple {
    background: linear-gradient(to left, #f5f3ff, #ede9fe);
    border-color: #8b5cf6;
  }
  .sig-icon {
    width: 50px;
    height: 50px;
    background: #22c55e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
    flex-shrink: 0;
  }
  .sig-icon.blue { background: #3b82f6; }
  .sig-icon.purple { background: #8b5cf6; }
  .sig-content {
    flex: 1;
    text-align: right;
  }
  .sig-title {
    color: #16a34a;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .sig-title.blue { color: #2563eb; }
  .sig-title.purple { color: #7c3aed; }
  .sig-code {
    color: #64748b;
    font-size: 11px;
  }
  .sig-code span {
    background: #fff;
    padding: 3px 10px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 10px;
    margin-right: 5px;
    direction: ltr;
    display: inline-block;
  }
  .sig-date {
    text-align: left;
    color: #64748b;
    font-size: 10px;
    line-height: 1.5;
  }
  
  /* Footer */
  .bank-footer {
    border-top: 2px solid #e2e8f0;
    margin-top: 30px;
    padding: 20px 30px;
    text-align: center;
  }
  .footer-logo {
    font-size: 16px;
    font-weight: bold;
    color: #00805A;
    margin-bottom: 8px;
  }
  .footer-logo.blue { color: #1e40af; }
  .footer-logo.purple { color: #7c3aed; }
  .footer-text {
    color: #94a3b8;
    font-size: 10px;
    margin-bottom: 4px;
  }
  .footer-bar {
    height: 8px;
    background: linear-gradient(to left, #00805A, #22c55e);
    margin-top: 15px;
    border-radius: 4px;
  }
  .footer-bar.blue {
    background: linear-gradient(to left, #1e40af, #3b82f6);
  }
  .footer-bar.purple {
    background: linear-gradient(to left, #7c3aed, #a855f7);
  }
  
  /* QR Code placeholder */
  .qr-section {
    display: flex;
    flex-direction: row-reverse;
    justify-content: center;
    gap: 30px;
    padding: 15px 30px;
    background: #f8fafc;
    margin: 15px 30px;
    border-radius: 8px;
  }
  .qr-box {
    width: 60px;
    height: 60px;
    background: #fff;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: #94a3b8;
  }
  .qr-info {
    text-align: right;
  }
  .qr-info h4 {
    font-size: 12px;
    color: #1e293b;
    margin: 0 0 5px 0;
  }
  .qr-info p {
    font-size: 10px;
    color: #64748b;
    margin: 0;
  }
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
  const verifyCode = `VRF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  const statusLabels: Record<string, { text: string; class: string }> = {
    pending: { text: 'قيد الانتظار', class: 'status-pending' },
    completed: { text: 'مكتمل', class: 'status-completed' },
    failed: { text: 'فشل', class: 'status-failed' },
    cancelled: { text: 'ملغي', class: 'status-failed' },
  };
  const statusInfo = statusLabels[data.status] || { text: data.status, class: 'status-pending' };

  const html = `
    <style>${bankStyles}</style>
    <div class="receipt">
      <!-- Header -->
      <div class="bank-header">
        <div class="bank-logo">
          <div class="logo-icon">M</div>
          <div class="bank-name">
            <h1>ماكسيو كور</h1>
            <span>MAXIOCORE Digital Services</span>
          </div>
        </div>
        <div class="receipt-type">
          <h2>إيصال إيداع</h2>
        </div>
      </div>
      
      <!-- Meta Bar -->
      <div class="meta-bar">
        <div class="meta-item">
          <div class="meta-label">رقم الإيصال</div>
          <div class="meta-value primary">${receiptNumber}</div>
        </div>
        <div class="meta-item">
          <span class="${statusInfo.class} status-badge">${statusInfo.text}</span>
        </div>
        <div class="meta-item">
          <div class="meta-label">تاريخ العملية</div>
          <div class="meta-value">${formatDateArabic(data.created_at)}</div>
        </div>
      </div>
      
      <!-- Customer Info -->
      <div class="section-title">بيانات العميل</div>
      <div class="data-table">
        <div class="data-row">
          <div class="data-cell label">اسم العميل</div>
          <div class="data-cell value">${data.user_name || 'عميل'}</div>
        </div>
        <div class="data-row">
          <div class="data-cell label">البريد الإلكتروني</div>
          <div class="data-cell value">${data.user_email || '-'}</div>
        </div>
      </div>
      
      <!-- Transaction Details -->
      <div class="section-title">تفاصيل المعاملة</div>
      <div class="data-table">
        ${data.payment_method ? `
        <div class="data-row">
          <div class="data-cell label">طريقة الدفع</div>
          <div class="data-cell value">${data.payment_method}</div>
        </div>
        ` : ''}
        ${data.transaction_id ? `
        <div class="data-row">
          <div class="data-cell label">رقم المرجع</div>
          <div class="data-cell value" style="font-family: monospace; direction: ltr;">${data.transaction_id}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Amount Details -->
      <div class="section-title">تفاصيل المبالغ</div>
      <div class="data-table">
        <div class="data-row">
          <div class="data-cell label">مبلغ الإيداع</div>
          <div class="data-cell value">${formatAmountArabic(data.amount)} ر.س</div>
        </div>
        ${data.bonus_amount && data.bonus_amount > 0 ? `
        <div class="data-row" style="background: #f0fdf4;">
          <div class="data-cell label green">المكافأة المضافة</div>
          <div class="data-cell value green">+ ${formatAmountArabic(data.bonus_amount)} ر.س</div>
        </div>
        ` : ''}
        ${data.fee_amount && data.fee_amount > 0 ? `
        <div class="data-row" style="background: #fef2f2;">
          <div class="data-cell label red">رسوم المعاملة</div>
          <div class="data-cell value red">- ${formatAmountArabic(data.fee_amount)} ر.س</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Total -->
      <div class="total-section">
        <div class="total-label">إجمالي المبلغ المضاف للرصيد</div>
        <div class="total-amount"><span class="total-currency">ر.س</span>${formatAmountArabic(data.total_credited)}</div>
      </div>
      
      <!-- Digital Signature -->
      <div class="signature-box">
        <div class="sig-icon">✓</div>
        <div class="sig-content">
          <div class="sig-title">تم التحقق والاعتماد رقمياً</div>
          <div class="sig-code">
            كود التحقق: <span>${signatureCode}</span>
            كود التأكيد: <span>${verifyCode}</span>
          </div>
        </div>
        <div class="sig-date">
          تاريخ الإصدار<br/>
          ${format(new Date(), 'dd/MM/yyyy')}<br/>
          ${format(new Date(), 'HH:mm:ss')}
        </div>
      </div>
      
      <!-- Footer -->
      <div class="bank-footer">
        <div class="footer-logo">ماكسيو كور</div>
        <div class="footer-text">هذا إيصال إلكتروني معتمد ولا يحتاج إلى توقيع أو ختم</div>
        <div class="footer-text">للاستفسارات: support@maxiocore.com</div>
        <div class="footer-text" style="margin-top: 8px; font-size: 9px;">
          رقم المرجع: ${receiptNumber} | تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
        </div>
        <div class="footer-bar"></div>
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `إيصال-إيداع-${receiptNumber}.pdf`);
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
  const verifyCode = `VRF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  const typeLabels: Record<string, { text: string; class: string }> = {
    earned: { text: 'كاش باك مكتسب', class: 'status-completed' },
    withdrawn: { text: 'تم السحب', class: 'status-pending' },
    expired: { text: 'منتهي الصلاحية', class: 'status-failed' },
  };
  const typeInfo = typeLabels[data.type] || { text: data.type, class: 'status-pending' };
  const isPositive = data.amount > 0;

  const html = `
    <style>${bankStyles}</style>
    <div class="receipt">
      <!-- Header -->
      <div class="bank-header">
        <div class="bank-logo">
          <div class="logo-icon">M</div>
          <div class="bank-name">
            <h1>ماكسيو كور</h1>
            <span>MAXIOCORE Digital Services</span>
          </div>
        </div>
        <div class="receipt-type">
          <h2>إيصال كاش باك</h2>
        </div>
      </div>
      
      <!-- Meta Bar -->
      <div class="meta-bar">
        <div class="meta-item">
          <div class="meta-label">رقم الإيصال</div>
          <div class="meta-value primary">${receiptNumber}</div>
        </div>
        <div class="meta-item">
          <span class="${typeInfo.class} status-badge">${typeInfo.text}</span>
        </div>
        <div class="meta-item">
          <div class="meta-label">تاريخ العملية</div>
          <div class="meta-value">${formatDateArabic(data.created_at)}</div>
        </div>
      </div>
      
      <!-- Customer Info -->
      <div class="section-title">بيانات العميل</div>
      <div class="data-table">
        ${data.user_name ? `
        <div class="data-row">
          <div class="data-cell label">اسم العميل</div>
          <div class="data-cell value">${data.user_name}</div>
        </div>
        ` : ''}
        ${data.user_email ? `
        <div class="data-row">
          <div class="data-cell label">البريد الإلكتروني</div>
          <div class="data-cell value">${data.user_email}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Transaction Details -->
      <div class="section-title">تفاصيل العملية</div>
      <div class="data-table">
        <div class="data-row">
          <div class="data-cell label">نوع العملية</div>
          <div class="data-cell value">${typeInfo.text}</div>
        </div>
        <div class="data-row">
          <div class="data-cell label">الوصف</div>
          <div class="data-cell value">${data.description_ar || data.description || 'معاملة كاش باك'}</div>
        </div>
      </div>
      
      <!-- Total -->
      <div class="total-section" style="background: ${isPositive ? 'linear-gradient(to left, #00805A, #004d36)' : 'linear-gradient(to left, #ef4444, #dc2626)'};">
        <div class="total-label">مبلغ الكاش باك</div>
        <div class="total-amount"><span class="total-currency">ر.س</span>${isPositive ? '+' : ''}${formatAmountArabic(data.amount)}</div>
      </div>
      
      ${data.balance_after !== undefined ? `
      <div class="data-table">
        <div class="data-row" style="background: #f0fdf4;">
          <div class="data-cell label green" style="font-weight: 600;">رصيد الكاش باك بعد العملية</div>
          <div class="data-cell value green" style="font-size: 16px; font-weight: bold;">${formatAmountArabic(data.balance_after)} ر.س</div>
        </div>
      </div>
      ` : ''}
      
      <!-- Digital Signature -->
      <div class="signature-box">
        <div class="sig-icon">✓</div>
        <div class="sig-content">
          <div class="sig-title">تم التحقق والاعتماد رقمياً</div>
          <div class="sig-code">
            كود التحقق: <span>${signatureCode}</span>
            كود التأكيد: <span>${verifyCode}</span>
          </div>
        </div>
        <div class="sig-date">
          تاريخ الإصدار<br/>
          ${format(new Date(), 'dd/MM/yyyy')}<br/>
          ${format(new Date(), 'HH:mm:ss')}
        </div>
      </div>
      
      <!-- Footer -->
      <div class="bank-footer">
        <div class="footer-logo">ماكسيو كور</div>
        <div class="footer-text">هذا إيصال إلكتروني معتمد ولا يحتاج إلى توقيع أو ختم</div>
        <div class="footer-text">للاستفسارات: support@maxiocore.com</div>
        <div class="footer-text" style="margin-top: 8px; font-size: 9px;">
          رقم المرجع: ${receiptNumber} | تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
        </div>
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
  const verifyCode = `VRF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  const statusLabels: Record<string, { text: string; class: string }> = {
    pending: { text: 'قيد الانتظار', class: 'status-pending' },
    processing: { text: 'جاري المعالجة', class: 'status-pending' },
    in_progress: { text: 'قيد التنفيذ', class: 'status-pending' },
    completed: { text: 'مكتمل', class: 'status-completed' },
    partial: { text: 'مكتمل جزئياً', class: 'status-pending' },
    cancelled: { text: 'ملغي', class: 'status-failed' },
    refunded: { text: 'تم الاسترداد', class: 'status-failed' },
    confirmed: { text: 'مؤكد', class: 'status-completed' },
  };
  const statusInfo = statusLabels[data.status] || { text: data.status, class: 'status-pending' };
  const subtotal = data.total_price + (data.discount_amount || 0);

  const html = `
    <style>${bankStyles}</style>
    <div class="receipt">
      <!-- Header -->
      <div class="bank-header blue">
        <div class="bank-logo">
          <div class="logo-icon blue">M</div>
          <div class="bank-name">
            <h1>ماكسيو كور</h1>
            <span>MAXIOCORE Digital Services</span>
          </div>
        </div>
        <div class="receipt-type">
          <h2>إيصال طلب</h2>
        </div>
      </div>
      
      <!-- Meta Bar -->
      <div class="meta-bar">
        <div class="meta-item">
          <div class="meta-label">رقم الطلب</div>
          <div class="meta-value blue">${receiptNumber}</div>
        </div>
        <div class="meta-item">
          <span class="${statusInfo.class} status-badge">${statusInfo.text}</span>
        </div>
        <div class="meta-item">
          <div class="meta-label">تاريخ الطلب</div>
          <div class="meta-value">${formatDateArabic(data.created_at)}</div>
        </div>
      </div>
      
      <!-- Customer Info -->
      <div class="section-title blue">بيانات العميل</div>
      <div class="data-table">
        ${data.user_name ? `
        <div class="data-row">
          <div class="data-cell label">اسم العميل</div>
          <div class="data-cell value">${data.user_name}</div>
        </div>
        ` : ''}
        ${data.user_email ? `
        <div class="data-row">
          <div class="data-cell label">البريد الإلكتروني</div>
          <div class="data-cell value">${data.user_email}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Service Details -->
      <div class="section-title blue">تفاصيل الخدمة</div>
      <div class="data-table">
        <div class="data-row">
          <div class="data-cell label">اسم الخدمة</div>
          <div class="data-cell value">${data.service_name.length > 60 ? data.service_name.substring(0, 60) + '...' : data.service_name}</div>
        </div>
        <div class="data-row">
          <div class="data-cell label">الكمية المطلوبة</div>
          <div class="data-cell value">${data.quantity.toLocaleString('ar-SA')}</div>
        </div>
        ${data.link ? `
        <div class="data-row">
          <div class="data-cell label">الرابط</div>
          <div class="data-cell value" style="word-break: break-all; font-size: 10px; color: #1e40af; direction: ltr; text-align: left;">${data.link.length > 60 ? data.link.substring(0, 60) + '...' : data.link}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Payment Details -->
      <div class="section-title blue">تفاصيل الدفع</div>
      <div class="data-table">
        <div class="data-row">
          <div class="data-cell label">المبلغ الأساسي</div>
          <div class="data-cell value">${formatAmountArabic(subtotal)} ر.س</div>
        </div>
        ${data.discount_amount && data.discount_amount > 0 ? `
        <div class="data-row" style="background: #f0fdf4;">
          <div class="data-cell label green">الخصم</div>
          <div class="data-cell value green">- ${formatAmountArabic(data.discount_amount)} ر.س</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Total -->
      <div class="total-section blue">
        <div class="total-label">إجمالي المبلغ المدفوع</div>
        <div class="total-amount"><span class="total-currency">ر.س</span>${formatAmountArabic(data.total_price)}</div>
      </div>
      
      ${data.completed_at ? `
      <div class="data-table">
        <div class="data-row" style="background: #f0fdf4;">
          <div class="data-cell label green">تاريخ الإكمال</div>
          <div class="data-cell value green">${formatDateArabic(data.completed_at)}</div>
        </div>
      </div>
      ` : ''}
      
      <!-- Digital Signature -->
      <div class="signature-box blue">
        <div class="sig-icon blue">✓</div>
        <div class="sig-content">
          <div class="sig-title blue">تم التحقق والاعتماد رقمياً</div>
          <div class="sig-code">
            كود التحقق: <span>${signatureCode}</span>
            كود التأكيد: <span>${verifyCode}</span>
          </div>
        </div>
        <div class="sig-date">
          تاريخ الإصدار<br/>
          ${format(new Date(), 'dd/MM/yyyy')}<br/>
          ${format(new Date(), 'HH:mm:ss')}
        </div>
      </div>
      
      <!-- Footer -->
      <div class="bank-footer">
        <div class="footer-logo blue">ماكسيو كور</div>
        <div class="footer-text">هذا إيصال إلكتروني معتمد ولا يحتاج إلى توقيع أو ختم</div>
        <div class="footer-text">للاستفسارات: support@maxiocore.com</div>
        <div class="footer-text" style="margin-top: 8px; font-size: 9px;">
          رقم المرجع: ${receiptNumber} | تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
        </div>
        <div class="footer-bar blue"></div>
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

  const certStyles = `
    ${bankStyles}
    .cert-container {
      width: 297mm;
      min-height: 210mm;
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      padding: 25px;
      direction: rtl;
      text-align: center;
    }
    .cert-frame {
      border: 5px solid #7c3aed;
      border-radius: 15px;
      padding: 35px;
      min-height: 170mm;
      background: rgba(255,255,255,0.8);
    }
    .cert-header-box {
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: #fff;
      padding: 20px 50px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .cert-main-title {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .cert-sub {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 5px;
    }
    .presented-to {
      color: #64748b;
      font-size: 14px;
      margin: 25px 0 10px;
    }
    .winner-name {
      font-size: 38px;
      color: #7c3aed;
      font-weight: bold;
      margin: 10px 0 30px;
    }
    .challenge-card {
      background: #faf5ff;
      border: 2px solid #c4b5fd;
      border-radius: 12px;
      padding: 25px;
      max-width: 450px;
      margin: 20px auto;
    }
    .challenge-title {
      font-size: 20px;
      color: #5b21b6;
      font-weight: bold;
    }
    .stats-flex {
      display: flex;
      flex-direction: row-reverse;
      justify-content: center;
      gap: 25px;
      margin: 30px 0;
    }
    .stat-item {
      background: #fff;
      border-radius: 12px;
      padding: 18px 30px;
      min-width: 130px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .stat-item.gold {
      background: #fef9c3;
      border: 2px solid #facc15;
    }
    .stat-item.green {
      background: #f0fdf4;
      border: 2px solid #22c55e;
    }
    .stat-num {
      font-size: 28px;
      font-weight: bold;
      color: #7c3aed;
    }
    .stat-item.gold .stat-num { color: #ca8a04; }
    .stat-item.green .stat-num { color: #16a34a; }
    .stat-txt {
      font-size: 11px;
      color: #64748b;
      margin-top: 5px;
    }
    .cert-date {
      color: #64748b;
      font-size: 13px;
      margin-top: 25px;
    }
    .cert-footer-row {
      display: flex;
      flex-direction: row-reverse;
      justify-content: space-between;
      align-items: center;
      margin-top: 40px;
      padding: 0 30px;
    }
    .cert-code {
      color: #a1a1aa;
      font-size: 10px;
    }
    .cert-seal {
      text-align: center;
    }
    .seal-circle {
      width: 55px;
      height: 55px;
      background: #7c3aed;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 24px;
      margin: 0 auto;
    }
    .seal-text {
      font-size: 10px;
      color: #7c3aed;
      margin-top: 6px;
    }
  `;

  const html = `
    <style>${certStyles}</style>
    <div class="cert-container">
      <div class="cert-frame">
        <div class="cert-header-box">
          <h1 class="cert-main-title">شهادة إنجاز التحدي</h1>
          <p class="cert-sub">Certificate of Achievement</p>
        </div>
        
        <p class="presented-to">تُمنح هذه الشهادة بكل فخر واعتزاز إلى</p>
        
        <h2 class="winner-name">${data.user_name || 'عميل مميز'}</h2>
        
        <p style="color: #64748b; font-size: 14px;">لإتمام التحدي التالي بنجاح</p>
        
        <div class="challenge-card">
          <div class="challenge-title">${data.title_ar || data.title}</div>
        </div>
        
        <div class="stats-flex">
          <div class="stat-item green">
            <div class="stat-num">${data.current_value}/${data.target_value}</div>
            <div class="stat-txt">الهدف المحقق</div>
          </div>
          <div class="stat-item gold">
            <div class="stat-num">+${data.reward_points}</div>
            <div class="stat-txt">النقاط المكتسبة</div>
          </div>
        </div>
        
        <p class="cert-date">
          تاريخ الإنجاز: ${format(new Date(data.completed_at), 'dd MMMM yyyy', { locale: ar })}
        </p>
        
        <div class="cert-footer-row">
          <div class="cert-code">رقم الشهادة: ${certificateNumber}</div>
          <div class="cert-seal">
            <div class="seal-circle">✓</div>
            <div class="seal-text">توقيع رقمي معتمد</div>
          </div>
          <div class="cert-code">كود التحقق: ${signatureCode}</div>
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

  const badgeStyles = `
    ${bankStyles}
    .badge-cert {
      width: 297mm;
      min-height: 210mm;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      padding: 25px;
      direction: rtl;
      text-align: center;
    }
    .badge-frame {
      border: 5px solid #d97706;
      border-radius: 15px;
      padding: 35px;
      min-height: 170mm;
      background: rgba(255,255,255,0.85);
    }
    .badge-header {
      background: linear-gradient(135deg, #d97706, #92400e);
      color: #fff;
      padding: 20px 50px;
      border-radius: 10px;
      margin-bottom: 25px;
    }
    .badge-icon-lg {
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #fcd34d, #f59e0b);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      margin: 20px auto;
      border: 5px solid #fff;
      box-shadow: 0 6px 20px rgba(217, 119, 6, 0.35);
    }
    .tier-txt {
      color: #d97706;
      font-size: 15px;
      margin-bottom: 20px;
    }
    .badge-winner {
      font-size: 36px;
      color: #92400e;
      font-weight: bold;
      margin: 15px 0 30px;
    }
    .badge-box {
      background: #fef9c3;
      border: 2px solid #fbbf24;
      border-radius: 12px;
      padding: 20px;
      max-width: 380px;
      margin: 0 auto;
    }
    .badge-name-ar {
      font-size: 22px;
      color: #92400e;
      font-weight: bold;
    }
    .badge-name-en {
      font-size: 12px;
      color: #b45309;
      margin-top: 6px;
    }
  `;

  const html = `
    <style>${badgeStyles}</style>
    <div class="badge-cert">
      <div class="badge-frame">
        <div class="badge-header">
          <h1 style="font-size: 30px; font-weight: bold; margin: 0;">شهادة الشارة</h1>
          <p style="font-size: 14px; opacity: 0.9; margin-top: 5px;">Certificate of Recognition</p>
        </div>
        
        <div class="badge-icon-lg">${data.icon || data.tier}</div>
        
        <p class="tier-txt">المستوى ${data.tier}: ${tierLabels[data.tier] || 'النخبة'}</p>
        
        <p style="color: #64748b; font-size: 14px;">تُمنح هذه الشارة بكل تقدير واحترام إلى</p>
        
        <h2 class="badge-winner">${data.user_name || 'عميل مميز'}</h2>
        
        <div class="badge-box">
          <div class="badge-name-ar">${data.name_ar || data.name}</div>
          <div class="badge-name-en">${data.name}</div>
        </div>
        
        <p style="color: #64748b; font-size: 13px; margin-top: 30px;">
          تاريخ المنح: ${format(new Date(data.awarded_at), 'dd MMMM yyyy', { locale: ar })}
        </p>
        
        <div class="cert-footer-row" style="display: flex; flex-direction: row-reverse; justify-content: space-between; align-items: center; margin-top: 40px; padding: 0 30px;">
          <div style="color: #a1a1aa; font-size: 10px;">رقم الشهادة: ${certificateNumber}</div>
          <div style="text-align: center;">
            <div style="width: 55px; height: 55px; background: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; margin: 0 auto;">✓</div>
            <div style="font-size: 10px; color: #d97706; margin-top: 6px;">توقيع رقمي معتمد</div>
          </div>
          <div style="color: #a1a1aa; font-size: 10px;">كود التحقق: ${signatureCode}</div>
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
  const verifyCode = `VRF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  const typeLabelsAr: Record<string, string> = {
    earned: 'مكتسب',
    redeemed: 'مستبدل',
    bonus: 'مكافأة',
    expired: 'منتهي',
  };

  const transactionsHTML = data.transactions.slice(0, 10).map((tx, i) => {
    const isPositive = tx.points > 0;
    return `
      <div class="data-row" style="background: ${i % 2 === 0 ? '#fff' : '#f8fafc'};">
        <div class="data-cell" style="flex: 1; color: ${isPositive ? '#16a34a' : '#ef4444'}; font-weight: bold; text-align: center;">${isPositive ? '+' : ''}${tx.points}</div>
        <div class="data-cell" style="flex: 1; text-align: center;">${typeLabelsAr[tx.type] || tx.type}</div>
        <div class="data-cell" style="flex: 2;">${(tx.description_ar || tx.description || '-').substring(0, 35)}</div>
        <div class="data-cell" style="flex: 1; text-align: left; color: #64748b;">${format(new Date(tx.created_at), 'dd/MM/yy')}</div>
      </div>
    `;
  }).join('');

  const html = `
    <style>${bankStyles}</style>
    <div class="receipt">
      <!-- Header -->
      <div class="bank-header purple">
        <div class="bank-logo">
          <div class="logo-icon purple">M</div>
          <div class="bank-name">
            <h1>ماكسيو كور</h1>
            <span>MAXIOCORE Digital Services</span>
          </div>
        </div>
        <div class="receipt-type">
          <h2>كشف حساب المكافآت</h2>
        </div>
      </div>
      
      <!-- Meta Bar -->
      <div class="meta-bar">
        <div class="meta-item">
          <div class="meta-label">رقم الكشف</div>
          <div class="meta-value purple">${statementNumber}</div>
        </div>
        ${data.tier_name_ar || data.tier_name ? `
        <div class="meta-item">
          <span class="status-badge" style="background: #7c3aed;">${data.tier_name_ar || data.tier_name}</span>
        </div>
        ` : ''}
        <div class="meta-item">
          <div class="meta-label">تاريخ الإصدار</div>
          <div class="meta-value">${format(new Date(), 'dd/MM/yyyy')}</div>
        </div>
      </div>
      
      <!-- Account Holder -->
      ${data.user_name || data.user_email ? `
      <div class="section-title purple">صاحب الحساب</div>
      <div class="data-table">
        ${data.user_name ? `
        <div class="data-row">
          <div class="data-cell label">الاسم</div>
          <div class="data-cell value">${data.user_name}</div>
        </div>
        ` : ''}
        ${data.user_email ? `
        <div class="data-row">
          <div class="data-cell label">البريد الإلكتروني</div>
          <div class="data-cell value">${data.user_email}</div>
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <!-- Points Summary -->
      <div class="section-title purple">ملخص النقاط</div>
      <div style="display: flex; flex-direction: row-reverse; gap: 15px; padding: 15px 30px;">
        <div style="flex: 1; background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 18px; text-align: center;">
          <div style="font-size: 26px; font-weight: bold; color: #16a34a;">${data.available_points.toLocaleString('ar-SA')}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 5px;">النقاط المتاحة</div>
        </div>
        <div style="flex: 1; background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 18px; text-align: center;">
          <div style="font-size: 26px; font-weight: bold; color: #2563eb;">${data.total_points.toLocaleString('ar-SA')}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 5px;">إجمالي المكتسب</div>
        </div>
        <div style="flex: 1; background: #fef2f2; border: 2px solid #ef4444; border-radius: 10px; padding: 18px; text-align: center;">
          <div style="font-size: 26px; font-weight: bold; color: #dc2626;">${data.redeemed_points.toLocaleString('ar-SA')}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 5px;">النقاط المستبدلة</div>
        </div>
      </div>
      
      <!-- Transactions -->
      ${data.transactions.length > 0 ? `
      <div class="section-title purple">سجل المعاملات</div>
      <div class="data-table">
        <div class="data-row" style="background: #f1f5f9; font-weight: 600;">
          <div class="data-cell" style="flex: 1; text-align: center;">النقاط</div>
          <div class="data-cell" style="flex: 1; text-align: center;">النوع</div>
          <div class="data-cell" style="flex: 2;">الوصف</div>
          <div class="data-cell" style="flex: 1; text-align: left;">التاريخ</div>
        </div>
        ${transactionsHTML}
      </div>
      ` : ''}
      
      <!-- Digital Signature -->
      <div class="signature-box purple">
        <div class="sig-icon purple">✓</div>
        <div class="sig-content">
          <div class="sig-title purple">تم التحقق والاعتماد رقمياً</div>
          <div class="sig-code">
            كود التحقق: <span>${signatureCode}</span>
            كود التأكيد: <span>${verifyCode}</span>
          </div>
        </div>
        <div class="sig-date">
          تاريخ الإصدار<br/>
          ${format(new Date(), 'dd/MM/yyyy')}<br/>
          ${format(new Date(), 'HH:mm:ss')}
        </div>
      </div>
      
      <!-- Footer -->
      <div class="bank-footer">
        <div class="footer-logo purple">ماكسيو كور</div>
        <div class="footer-text">هذا كشف إلكتروني معتمد ولا يحتاج إلى توقيع أو ختم</div>
        <div class="footer-text">للاستفسارات: support@maxiocore.com</div>
        <div class="footer-text" style="margin-top: 8px; font-size: 9px;">
          رقم المرجع: ${statementNumber} | تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
        </div>
        <div class="footer-bar purple"></div>
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `كشف-مكافآت-${statementNumber}.pdf`);
};
