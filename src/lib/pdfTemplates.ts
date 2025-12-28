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

// Professional Arabic Bank Receipt Styles - 100% RTL
const bankStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', 'Arial', 'Tahoma', 'Helvetica Neue', sans-serif;
  }
  
  .receipt-page {
    width: 210mm;
    min-height: 297mm;
    background: #ffffff;
    direction: rtl;
    text-align: right;
  }
  
  /* === HEADER SECTION === */
  .header-section {
    background: linear-gradient(135deg, #006847 0%, #004d36 100%);
    padding: 30px 40px;
    position: relative;
    overflow: hidden;
  }
  .header-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .header-section.blue {
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  }
  .header-section.purple {
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  }
  .header-section.gold {
    background: linear-gradient(135deg, #b45309 0%, #92400e 100%);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  
  .brand-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .brand-logo {
    width: 60px;
    height: 60px;
    background: #ffffff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 800;
    color: #006847;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  .header-section.blue .brand-logo { color: #1e40af; }
  .header-section.purple .brand-logo { color: #7c3aed; }
  .header-section.gold .brand-logo { color: #b45309; }
  
  .brand-info {
    text-align: right;
  }
  .brand-name-ar {
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
    letter-spacing: 1px;
  }
  .brand-name-en {
    font-size: 12px;
    color: rgba(255,255,255,0.85);
    margin-top: 2px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  
  .receipt-title-box {
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    padding: 12px 28px;
    border-radius: 30px;
    border: 1px solid rgba(255,255,255,0.25);
  }
  .receipt-title {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }
  
  /* === INFO BAR === */
  .info-bar {
    background: #f8fafc;
    border-bottom: 3px solid #e2e8f0;
    padding: 16px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
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
  .info-value.accent { color: #006847; }
  .info-value.blue { color: #1e40af; }
  .info-value.purple { color: #7c3aed; }
  
  .status-tag {
    display: inline-block;
    padding: 8px 24px;
    border-radius: 25px;
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
  }
  .status-completed { background: linear-gradient(135deg, #22c55e, #16a34a); }
  .status-pending { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .status-failed { background: linear-gradient(135deg, #ef4444, #dc2626); }
  
  /* === SECTION HEADERS === */
  .section-header {
    background: linear-gradient(90deg, #006847 0%, #008c5f 100%);
    color: #ffffff;
    padding: 12px 40px;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-header::before {
    content: '◀';
    font-size: 10px;
  }
  .section-header.blue {
    background: linear-gradient(90deg, #1e40af 0%, #2563eb 100%);
  }
  .section-header.purple {
    background: linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%);
  }
  .section-header.gold {
    background: linear-gradient(90deg, #b45309 0%, #d97706 100%);
  }
  
  /* === DATA ROWS === */
  .data-section {
    padding: 0;
  }
  .data-row {
    display: flex;
    border-bottom: 1px solid #f1f5f9;
    padding: 14px 40px;
    align-items: center;
  }
  .data-row:nth-child(even) {
    background: #fafbfc;
  }
  .data-row.highlight {
    background: #f0fdf4;
  }
  .data-row.warning {
    background: #fef2f2;
  }
  
  .data-label {
    flex: 1;
    font-size: 13px;
    color: #64748b;
    font-weight: 600;
    text-align: right;
  }
  .data-value {
    flex: 1;
    font-size: 14px;
    color: #1e293b;
    font-weight: 700;
    text-align: left;
    direction: ltr;
  }
  .data-value.rtl {
    direction: rtl;
    text-align: right;
  }
  .data-value.success { color: #16a34a; }
  .data-value.danger { color: #dc2626; }
  .data-value.primary { color: #006847; }
  .data-value.blue { color: #1e40af; }
  
  /* === TOTAL BOX === */
  .total-box {
    margin: 24px 40px;
    background: linear-gradient(135deg, #006847 0%, #004d36 100%);
    border-radius: 16px;
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 25px rgba(0,104,71,0.3);
  }
  .total-box.blue {
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
    box-shadow: 0 8px 25px rgba(30,64,175,0.3);
  }
  .total-box.purple {
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
    box-shadow: 0 8px 25px rgba(124,58,237,0.3);
  }
  
  .total-text {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }
  .total-amount {
    display: flex;
    align-items: baseline;
    gap: 8px;
    direction: ltr;
  }
  .amount-number {
    font-size: 32px;
    font-weight: 800;
    color: #ffffff;
  }
  .amount-currency {
    font-size: 16px;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
  }
  
  /* === DIGITAL SIGNATURE === */
  .signature-section {
    margin: 28px 40px;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 2px solid #10b981;
    border-radius: 16px;
    padding: 24px 28px;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .signature-section.blue {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-color: #3b82f6;
  }
  .signature-section.purple {
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    border-color: #8b5cf6;
  }
  
  .sig-badge {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(16,185,129,0.4);
    flex-shrink: 0;
  }
  .sig-badge.blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    box-shadow: 0 4px 15px rgba(59,130,246,0.4);
  }
  .sig-badge.purple {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    box-shadow: 0 4px 15px rgba(139,92,246,0.4);
  }
  .sig-badge svg {
    width: 32px;
    height: 32px;
    color: #ffffff;
  }
  
  .sig-main {
    flex: 1;
    text-align: right;
  }
  .sig-title {
    font-size: 16px;
    font-weight: 700;
    color: #059669;
    margin-bottom: 4px;
  }
  .sig-title.blue { color: #2563eb; }
  .sig-title.purple { color: #7c3aed; }
  
  .sig-signer {
    font-size: 14px;
    color: #374151;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .sig-signer span {
    color: #006847;
    font-weight: 700;
  }
  .sig-signer.blue span { color: #1e40af; }
  .sig-signer.purple span { color: #5b21b6; }
  
  .sig-codes {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    direction: rtl;
  }
  .sig-code-item {
    font-size: 11px;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sig-code-value {
    background: #ffffff;
    padding: 4px 10px;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #374151;
    border: 1px solid #d1d5db;
    direction: ltr;
  }
  
  .sig-timestamp {
    text-align: left;
    min-width: 110px;
  }
  .sig-timestamp-label {
    font-size: 10px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .sig-timestamp-value {
    font-size: 12px;
    color: #1e293b;
    font-weight: 600;
    line-height: 1.5;
    direction: ltr;
  }
  
  /* === FOOTER === */
  .footer-section {
    margin-top: 30px;
    border-top: 3px solid #e5e7eb;
    padding: 24px 40px 20px;
    text-align: center;
  }
  
  .footer-brand {
    font-size: 20px;
    font-weight: 800;
    color: #006847;
    margin-bottom: 8px;
  }
  .footer-brand.blue { color: #1e40af; }
  .footer-brand.purple { color: #7c3aed; }
  
  .footer-note {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .footer-contact {
    font-size: 11px;
    color: #9ca3af;
    margin-bottom: 4px;
  }
  .footer-ref {
    font-size: 10px;
    color: #9ca3af;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed #e5e7eb;
  }
  
  .footer-bar {
    height: 10px;
    background: linear-gradient(90deg, #006847 0%, #10b981 50%, #006847 100%);
    margin-top: 16px;
    border-radius: 5px;
  }
  .footer-bar.blue {
    background: linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
  }
  .footer-bar.purple {
    background: linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #7c3aed 100%);
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
    <div class="receipt-page">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <div class="brand-section">
            <div class="brand-logo">M</div>
            <div class="brand-info">
              <div class="brand-name-ar">ماكسيو كور</div>
              <div class="brand-name-en">MAXIOCORE Digital Services</div>
            </div>
          </div>
          <div class="receipt-title-box">
            <h1 class="receipt-title">إيصال إيداع</h1>
          </div>
        </div>
      </div>
      
      <!-- Info Bar -->
      <div class="info-bar">
        <div class="info-item">
          <div class="info-label">رقم الإيصال</div>
          <div class="info-value accent">${receiptNumber}</div>
        </div>
        <div class="info-item">
          <span class="${statusInfo.class} status-tag">${statusInfo.text}</span>
        </div>
        <div class="info-item">
          <div class="info-label">تاريخ العملية</div>
          <div class="info-value">${formatDateArabic(data.created_at)}</div>
        </div>
      </div>
      
      <!-- Customer Data -->
      <div class="section-header">بيانات العميل</div>
      <div class="data-section">
        <div class="data-row">
          <div class="data-label">اسم العميل</div>
          <div class="data-value rtl">${data.user_name || 'عميل'}</div>
        </div>
        <div class="data-row">
          <div class="data-label">البريد الإلكتروني</div>
          <div class="data-value">${data.user_email || '-'}</div>
        </div>
      </div>
      
      <!-- Transaction Details -->
      <div class="section-header">تفاصيل المعاملة</div>
      <div class="data-section">
        ${data.payment_method ? `
        <div class="data-row">
          <div class="data-label">طريقة الدفع</div>
          <div class="data-value rtl">${data.payment_method}</div>
        </div>
        ` : ''}
        ${data.transaction_id ? `
        <div class="data-row">
          <div class="data-label">رقم المرجع</div>
          <div class="data-value">${data.transaction_id}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Amount Details -->
      <div class="section-header">تفاصيل المبالغ</div>
      <div class="data-section">
        <div class="data-row">
          <div class="data-label">مبلغ الإيداع</div>
          <div class="data-value">${formatAmountArabic(data.amount)} ر.س</div>
        </div>
        ${data.bonus_amount && data.bonus_amount > 0 ? `
        <div class="data-row highlight">
          <div class="data-label" style="color: #16a34a;">المكافأة المضافة</div>
          <div class="data-value success">+ ${formatAmountArabic(data.bonus_amount)} ر.س</div>
        </div>
        ` : ''}
        ${data.fee_amount && data.fee_amount > 0 ? `
        <div class="data-row warning">
          <div class="data-label" style="color: #dc2626;">رسوم المعاملة</div>
          <div class="data-value danger">- ${formatAmountArabic(data.fee_amount)} ر.س</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Total -->
      <div class="total-box">
        <div class="total-text">إجمالي المبلغ المضاف للرصيد</div>
        <div class="total-amount">
          <span class="amount-currency">ر.س</span>
          <span class="amount-number">${formatAmountArabic(data.total_credited)}</span>
        </div>
      </div>
      
      <!-- Digital Signature -->
      <div class="signature-section">
        <div class="sig-badge">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="sig-main">
          <div class="sig-title">تم التحقق والاعتماد رقمياً</div>
          <div class="sig-signer">التوقيع الرقمي: <span>ماكسيو كور - MAXIOCORE</span></div>
          <div class="sig-codes">
            <div class="sig-code-item">
              <span>كود التحقق:</span>
              <span class="sig-code-value">${signatureCode}</span>
            </div>
            <div class="sig-code-item">
              <span>كود التأكيد:</span>
              <span class="sig-code-value">${verifyCode}</span>
            </div>
          </div>
        </div>
        <div class="sig-timestamp">
          <div class="sig-timestamp-label">تاريخ الإصدار</div>
          <div class="sig-timestamp-value">
            ${format(new Date(), 'dd/MM/yyyy')}<br/>
            ${format(new Date(), 'HH:mm:ss')}
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer-section">
        <div class="footer-brand">ماكسيو كور</div>
        <div class="footer-note">هذا إيصال إلكتروني معتمد ولا يحتاج إلى توقيع أو ختم</div>
        <div class="footer-contact">للاستفسارات: support@maxiocore.com</div>
        <div class="footer-ref">
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
    <div class="receipt-page">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <div class="brand-section">
            <div class="brand-logo">M</div>
            <div class="brand-info">
              <div class="brand-name-ar">ماكسيو كور</div>
              <div class="brand-name-en">MAXIOCORE Digital Services</div>
            </div>
          </div>
          <div class="receipt-title-box">
            <h1 class="receipt-title">إيصال كاش باك</h1>
          </div>
        </div>
      </div>
      
      <!-- Info Bar -->
      <div class="info-bar">
        <div class="info-item">
          <div class="info-label">رقم الإيصال</div>
          <div class="info-value accent">${receiptNumber}</div>
        </div>
        <div class="info-item">
          <span class="${typeInfo.class} status-tag">${typeInfo.text}</span>
        </div>
        <div class="info-item">
          <div class="info-label">تاريخ العملية</div>
          <div class="info-value">${formatDateArabic(data.created_at)}</div>
        </div>
      </div>
      
      <!-- Customer Data -->
      <div class="section-header">بيانات العميل</div>
      <div class="data-section">
        ${data.user_name ? `
        <div class="data-row">
          <div class="data-label">اسم العميل</div>
          <div class="data-value rtl">${data.user_name}</div>
        </div>
        ` : ''}
        ${data.user_email ? `
        <div class="data-row">
          <div class="data-label">البريد الإلكتروني</div>
          <div class="data-value">${data.user_email}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Transaction Details -->
      <div class="section-header">تفاصيل العملية</div>
      <div class="data-section">
        <div class="data-row">
          <div class="data-label">نوع العملية</div>
          <div class="data-value rtl">${typeInfo.text}</div>
        </div>
        <div class="data-row">
          <div class="data-label">الوصف</div>
          <div class="data-value rtl">${data.description_ar || data.description || 'معاملة كاش باك'}</div>
        </div>
      </div>
      
      <!-- Total -->
      <div class="total-box" style="background: ${isPositive ? 'linear-gradient(135deg, #006847 0%, #004d36 100%)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'};">
        <div class="total-text">مبلغ الكاش باك</div>
        <div class="total-amount">
          <span class="amount-currency">ر.س</span>
          <span class="amount-number">${isPositive ? '+' : ''}${formatAmountArabic(data.amount)}</span>
        </div>
      </div>
      
      ${data.balance_after !== undefined ? `
      <div class="data-section">
        <div class="data-row highlight">
          <div class="data-label" style="color: #16a34a; font-weight: 700;">رصيد الكاش باك بعد العملية</div>
          <div class="data-value success" style="font-size: 18px;">${formatAmountArabic(data.balance_after)} ر.س</div>
        </div>
      </div>
      ` : ''}
      
      <!-- Digital Signature -->
      <div class="signature-section">
        <div class="sig-badge">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="sig-main">
          <div class="sig-title">تم التحقق والاعتماد رقمياً</div>
          <div class="sig-signer">التوقيع الرقمي: <span>ماكسيو كور - MAXIOCORE</span></div>
          <div class="sig-codes">
            <div class="sig-code-item">
              <span>كود التحقق:</span>
              <span class="sig-code-value">${signatureCode}</span>
            </div>
            <div class="sig-code-item">
              <span>كود التأكيد:</span>
              <span class="sig-code-value">${verifyCode}</span>
            </div>
          </div>
        </div>
        <div class="sig-timestamp">
          <div class="sig-timestamp-label">تاريخ الإصدار</div>
          <div class="sig-timestamp-value">
            ${format(new Date(), 'dd/MM/yyyy')}<br/>
            ${format(new Date(), 'HH:mm:ss')}
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer-section">
        <div class="footer-brand">ماكسيو كور</div>
        <div class="footer-note">هذا إيصال إلكتروني معتمد ولا يحتاج إلى توقيع أو ختم</div>
        <div class="footer-contact">للاستفسارات: support@maxiocore.com</div>
        <div class="footer-ref">
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
    <div class="receipt-page">
      <!-- Header -->
      <div class="header-section blue">
        <div class="header-content">
          <div class="brand-section">
            <div class="brand-logo">M</div>
            <div class="brand-info">
              <div class="brand-name-ar">ماكسيو كور</div>
              <div class="brand-name-en">MAXIOCORE Digital Services</div>
            </div>
          </div>
          <div class="receipt-title-box">
            <h1 class="receipt-title">إيصال طلب</h1>
          </div>
        </div>
      </div>
      
      <!-- Info Bar -->
      <div class="info-bar">
        <div class="info-item">
          <div class="info-label">رقم الطلب</div>
          <div class="info-value blue">${receiptNumber}</div>
        </div>
        <div class="info-item">
          <span class="${statusInfo.class} status-tag">${statusInfo.text}</span>
        </div>
        <div class="info-item">
          <div class="info-label">تاريخ الطلب</div>
          <div class="info-value">${formatDateArabic(data.created_at)}</div>
        </div>
      </div>
      
      <!-- Customer Data -->
      <div class="section-header blue">بيانات العميل</div>
      <div class="data-section">
        ${data.user_name ? `
        <div class="data-row">
          <div class="data-label">اسم العميل</div>
          <div class="data-value rtl">${data.user_name}</div>
        </div>
        ` : ''}
        ${data.user_email ? `
        <div class="data-row">
          <div class="data-label">البريد الإلكتروني</div>
          <div class="data-value">${data.user_email}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Service Details -->
      <div class="section-header blue">تفاصيل الخدمة</div>
      <div class="data-section">
        <div class="data-row">
          <div class="data-label">اسم الخدمة</div>
          <div class="data-value rtl">${data.service_name.length > 60 ? data.service_name.substring(0, 60) + '...' : data.service_name}</div>
        </div>
        <div class="data-row">
          <div class="data-label">الكمية المطلوبة</div>
          <div class="data-value">${data.quantity.toLocaleString('ar-SA')}</div>
        </div>
        ${data.link ? `
        <div class="data-row">
          <div class="data-label">الرابط</div>
          <div class="data-value blue" style="word-break: break-all; font-size: 11px;">${data.link.length > 60 ? data.link.substring(0, 60) + '...' : data.link}</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Payment Details -->
      <div class="section-header blue">تفاصيل الدفع</div>
      <div class="data-section">
        <div class="data-row">
          <div class="data-label">المبلغ الأساسي</div>
          <div class="data-value">${formatAmountArabic(subtotal)} ر.س</div>
        </div>
        ${data.discount_amount && data.discount_amount > 0 ? `
        <div class="data-row highlight">
          <div class="data-label" style="color: #16a34a;">الخصم</div>
          <div class="data-value success">- ${formatAmountArabic(data.discount_amount)} ر.س</div>
        </div>
        ` : ''}
      </div>
      
      <!-- Total -->
      <div class="total-box blue">
        <div class="total-text">إجمالي المبلغ المدفوع</div>
        <div class="total-amount">
          <span class="amount-currency">ر.س</span>
          <span class="amount-number">${formatAmountArabic(data.total_price)}</span>
        </div>
      </div>
      
      ${data.completed_at ? `
      <div class="data-section">
        <div class="data-row highlight">
          <div class="data-label" style="color: #16a34a;">تاريخ الإكمال</div>
          <div class="data-value success">${formatDateArabic(data.completed_at)}</div>
        </div>
      </div>
      ` : ''}
      
      <!-- Digital Signature -->
      <div class="signature-section blue">
        <div class="sig-badge blue">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="sig-main">
          <div class="sig-title blue">تم التحقق والاعتماد رقمياً</div>
          <div class="sig-signer blue">التوقيع الرقمي: <span>ماكسيو كور - MAXIOCORE</span></div>
          <div class="sig-codes">
            <div class="sig-code-item">
              <span>كود التحقق:</span>
              <span class="sig-code-value">${signatureCode}</span>
            </div>
            <div class="sig-code-item">
              <span>كود التأكيد:</span>
              <span class="sig-code-value">${verifyCode}</span>
            </div>
          </div>
        </div>
        <div class="sig-timestamp">
          <div class="sig-timestamp-label">تاريخ الإصدار</div>
          <div class="sig-timestamp-value">
            ${format(new Date(), 'dd/MM/yyyy')}<br/>
            ${format(new Date(), 'HH:mm:ss')}
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer-section">
        <div class="footer-brand blue">ماكسيو كور</div>
        <div class="footer-note">هذا إيصال إلكتروني معتمد ولا يحتاج إلى توقيع أو ختم</div>
        <div class="footer-contact">للاستفسارات: support@maxiocore.com</div>
        <div class="footer-ref">
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

  const html = `
    <style>${bankStyles}</style>
    <div class="receipt-page" style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); padding: 30px;">
      <div style="border: 4px solid #7c3aed; border-radius: 20px; background: rgba(255,255,255,0.9); padding: 40px; min-height: calc(297mm - 60px);">
        
        <!-- Certificate Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #fff; padding: 20px 50px; border-radius: 12px; display: inline-block;">
            <h1 style="font-size: 28px; font-weight: 800; margin: 0;">شهادة إنجاز تحدي</h1>
            <p style="font-size: 12px; opacity: 0.9; margin: 5px 0 0;">CHALLENGE COMPLETION CERTIFICATE</p>
          </div>
        </div>
        
        <!-- Presented To -->
        <div style="text-align: center; margin: 40px 0;">
          <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">تُمنح هذه الشهادة إلى</p>
          <h2 style="font-size: 36px; color: #7c3aed; font-weight: 800; margin: 0;">${data.user_name || 'المستخدم'}</h2>
        </div>
        
        <!-- Challenge Info -->
        <div style="background: #faf5ff; border: 2px solid #c4b5fd; border-radius: 12px; padding: 25px; max-width: 500px; margin: 30px auto; text-align: center;">
          <h3 style="font-size: 20px; color: #5b21b6; font-weight: 700; margin: 0 0 10px;">
            ${data.title_ar || data.title}
          </h3>
          <p style="color: #64748b; font-size: 13px; margin: 0;">
            ${data.description_ar || data.description}
          </p>
        </div>
        
        <!-- Stats -->
        <div style="display: flex; justify-content: center; gap: 30px; margin: 30px 0; direction: rtl;">
          <div style="background: #fff; border-radius: 12px; padding: 20px 35px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <div style="font-size: 28px; font-weight: 800; color: #7c3aed;">${data.current_value}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">الإنجاز</div>
          </div>
          <div style="background: #fef9c3; border: 2px solid #facc15; border-radius: 12px; padding: 20px 35px; text-align: center;">
            <div style="font-size: 28px; font-weight: 800; color: #ca8a04;">${data.reward_points}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">نقاط المكافأة</div>
          </div>
          <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px 35px; text-align: center;">
            <div style="font-size: 28px; font-weight: 800; color: #16a34a;">${data.target_value}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">الهدف</div>
          </div>
        </div>
        
        <!-- Completion Date -->
        <div style="text-align: center; color: #64748b; font-size: 13px; margin: 25px 0;">
          تاريخ الإنجاز: <strong style="color: #1e293b;">${formatDateArabic(data.completed_at)}</strong>
        </div>
        
        <!-- Digital Signature -->
        <div class="signature-section purple" style="margin: 30px auto; max-width: 600px;">
          <div class="sig-badge purple">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="sig-main">
            <div class="sig-title purple">تم التحقق والاعتماد رقمياً</div>
            <div class="sig-signer purple">التوقيع الرقمي: <span>ماكسيو كور - MAXIOCORE</span></div>
            <div class="sig-codes">
              <div class="sig-code-item">
                <span>رقم الشهادة:</span>
                <span class="sig-code-value">${certificateNumber}</span>
              </div>
              <div class="sig-code-item">
                <span>كود التحقق:</span>
                <span class="sig-code-value">${signatureCode}</span>
              </div>
            </div>
          </div>
          <div class="sig-timestamp">
            <div class="sig-timestamp-label">تاريخ الإصدار</div>
            <div class="sig-timestamp-value">
              ${format(new Date(), 'dd/MM/yyyy')}<br/>
              ${format(new Date(), 'HH:mm:ss')}
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #e5e7eb;">
          <div style="font-size: 18px; font-weight: 800; color: #7c3aed;">ماكسيو كور</div>
          <div style="font-size: 11px; color: #9ca3af; margin-top: 5px;">MAXIOCORE Digital Services</div>
        </div>
        
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `شهادة-تحدي-${certificateNumber}.pdf`);
};

// ==================== BADGE CERTIFICATE - Arabic ====================
interface BadgeCertificateData {
  id: string;
  badge_name: string;
  badge_name_ar: string;
  badge_description?: string;
  badge_description_ar?: string;
  badge_color: string;
  badge_icon: string;
  tier: number;
  awarded_at: string;
  user_name?: string;
}

export const generateBadgeCertificate = async (data: BadgeCertificateData) => {
  const certificateNumber = `BG-${data.id.slice(0, 8).toUpperCase()}`;
  const signatureCode = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;

  const html = `
    <style>${bankStyles}</style>
    <div class="receipt-page" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px;">
      <div style="border: 4px solid #d97706; border-radius: 20px; background: rgba(255,255,255,0.95); padding: 40px; min-height: calc(297mm - 60px);">
        
        <!-- Certificate Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #d97706, #92400e); color: #fff; padding: 20px 50px; border-radius: 12px; display: inline-block;">
            <h1 style="font-size: 28px; font-weight: 800; margin: 0;">شهادة حصول على شارة</h1>
            <p style="font-size: 12px; opacity: 0.9; margin: 5px 0 0;">BADGE AWARD CERTIFICATE</p>
          </div>
        </div>
        
        <!-- Badge Display -->
        <div style="text-align: center; margin: 40px 0;">
          <div style="width: 120px; height: 120px; background: ${data.badge_color}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(0,0,0,0.2);">
            <span style="font-size: 50px;">${data.badge_icon}</span>
          </div>
          <h2 style="font-size: 32px; color: #92400e; font-weight: 800; margin: 0;">${data.badge_name_ar}</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 5px;">المستوى ${data.tier}</p>
        </div>
        
        <!-- Presented To -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">تُمنح هذه الشارة إلى</p>
          <h3 style="font-size: 30px; color: #d97706; font-weight: 700; margin: 0;">${data.user_name || 'المستخدم'}</h3>
        </div>
        
        <!-- Description -->
        ${data.badge_description_ar || data.badge_description ? `
        <div style="background: #fef3c7; border-radius: 12px; padding: 20px; max-width: 500px; margin: 25px auto; text-align: center;">
          <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.7;">
            ${data.badge_description_ar || data.badge_description}
          </p>
        </div>
        ` : ''}
        
        <!-- Award Date -->
        <div style="text-align: center; color: #64748b; font-size: 13px; margin: 25px 0;">
          تاريخ الحصول على الشارة: <strong style="color: #1e293b;">${formatDateArabic(data.awarded_at)}</strong>
        </div>
        
        <!-- Digital Signature -->
        <div class="signature-section" style="margin: 30px auto; max-width: 600px; background: linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%); border-color: #f59e0b;">
          <div class="sig-badge" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="sig-main">
            <div class="sig-title" style="color: #b45309;">تم التحقق والاعتماد رقمياً</div>
            <div class="sig-signer" style="color: #374151;">التوقيع الرقمي: <span style="color: #92400e;">ماكسيو كور - MAXIOCORE</span></div>
            <div class="sig-codes">
              <div class="sig-code-item">
                <span>رقم الشهادة:</span>
                <span class="sig-code-value">${certificateNumber}</span>
              </div>
              <div class="sig-code-item">
                <span>كود التحقق:</span>
                <span class="sig-code-value">${signatureCode}</span>
              </div>
            </div>
          </div>
          <div class="sig-timestamp">
            <div class="sig-timestamp-label">تاريخ الإصدار</div>
            <div class="sig-timestamp-value">
              ${format(new Date(), 'dd/MM/yyyy')}<br/>
              ${format(new Date(), 'HH:mm:ss')}
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #e5e7eb;">
          <div style="font-size: 18px; font-weight: 800; color: #d97706;">ماكسيو كور</div>
          <div style="font-size: 11px; color: #9ca3af; margin-top: 5px;">MAXIOCORE Digital Services</div>
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
  total_points: number;
  available_points: number;
  redeemed_points: number;
  tier_name: string;
  tier_name_ar: string;
  tier_color: string;
  transactions: Array<{
    id: string;
    type: string;
    points: number;
    description: string;
    description_ar?: string;
    created_at: string;
  }>;
  period_start: string;
  period_end: string;
}

export const generateRewardsStatement = async (data: RewardsStatementData) => {
  const statementNumber = `RW-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;
  const signatureCode = `SIG-${Date.now().toString(36).toUpperCase().slice(0, 8)}`;

  const transactionsHTML = data.transactions.slice(0, 10).map(t => `
    <div class="data-row">
      <div class="data-label" style="flex: 0.5;">${formatDateArabic(t.created_at).split(' ')[0]}</div>
      <div class="data-value rtl" style="flex: 1.5; font-size: 12px;">${t.description_ar || t.description}</div>
      <div class="data-value ${t.points > 0 ? 'success' : 'danger'}" style="flex: 0.5; text-align: center; font-weight: 700;">
        ${t.points > 0 ? '+' : ''}${t.points}
      </div>
    </div>
  `).join('');

  const html = `
    <style>${bankStyles}</style>
    <div class="receipt-page">
      <!-- Header -->
      <div class="header-section purple">
        <div class="header-content">
          <div class="brand-section">
            <div class="brand-logo">M</div>
            <div class="brand-info">
              <div class="brand-name-ar">ماكسيو كور</div>
              <div class="brand-name-en">MAXIOCORE Digital Services</div>
            </div>
          </div>
          <div class="receipt-title-box">
            <h1 class="receipt-title">كشف حساب النقاط</h1>
          </div>
        </div>
      </div>
      
      <!-- Info Bar -->
      <div class="info-bar">
        <div class="info-item">
          <div class="info-label">رقم الكشف</div>
          <div class="info-value purple">${statementNumber}</div>
        </div>
        <div class="info-item">
          <div style="background: ${data.tier_color}; color: #fff; padding: 8px 20px; border-radius: 25px; font-weight: 700; font-size: 13px;">
            ${data.tier_name_ar}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">الفترة</div>
          <div class="info-value">${formatDateArabic(data.period_start).split(' ')[0]} - ${formatDateArabic(data.period_end).split(' ')[0]}</div>
        </div>
      </div>
      
      <!-- Customer Data -->
      <div class="section-header purple">بيانات العميل</div>
      <div class="data-section">
        <div class="data-row">
          <div class="data-label">اسم العميل</div>
          <div class="data-value rtl">${data.user_name || 'المستخدم'}</div>
        </div>
        <div class="data-row">
          <div class="data-label">البريد الإلكتروني</div>
          <div class="data-value">${data.user_email || '-'}</div>
        </div>
      </div>
      
      <!-- Points Summary -->
      <div class="section-header purple">ملخص النقاط</div>
      <div style="display: flex; gap: 20px; padding: 20px 40px; direction: rtl;">
        <div style="flex: 1; background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 28px; font-weight: 800; color: #7c3aed;">${data.total_points.toLocaleString('ar-SA')}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 5px;">إجمالي النقاط</div>
        </div>
        <div style="flex: 1; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 28px; font-weight: 800; color: #16a34a;">${data.available_points.toLocaleString('ar-SA')}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 5px;">النقاط المتاحة</div>
        </div>
        <div style="flex: 1; background: linear-gradient(135deg, #fef2f2, #fecaca); border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 28px; font-weight: 800; color: #dc2626;">${data.redeemed_points.toLocaleString('ar-SA')}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 5px;">النقاط المستبدلة</div>
        </div>
      </div>
      
      <!-- Transactions -->
      <div class="section-header purple">آخر المعاملات</div>
      <div class="data-section">
        <div class="data-row" style="background: #f8fafc; font-weight: 700;">
          <div class="data-label" style="flex: 0.5; color: #374151;">التاريخ</div>
          <div class="data-label" style="flex: 1.5; color: #374151;">الوصف</div>
          <div class="data-label" style="flex: 0.5; text-align: center; color: #374151;">النقاط</div>
        </div>
        ${transactionsHTML}
      </div>
      
      <!-- Digital Signature -->
      <div class="signature-section purple">
        <div class="sig-badge purple">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="sig-main">
          <div class="sig-title purple">تم التحقق والاعتماد رقمياً</div>
          <div class="sig-signer purple">التوقيع الرقمي: <span>ماكسيو كور - MAXIOCORE</span></div>
          <div class="sig-codes">
            <div class="sig-code-item">
              <span>رقم الكشف:</span>
              <span class="sig-code-value">${statementNumber}</span>
            </div>
            <div class="sig-code-item">
              <span>كود التحقق:</span>
              <span class="sig-code-value">${signatureCode}</span>
            </div>
          </div>
        </div>
        <div class="sig-timestamp">
          <div class="sig-timestamp-label">تاريخ الإصدار</div>
          <div class="sig-timestamp-value">
            ${format(new Date(), 'dd/MM/yyyy')}<br/>
            ${format(new Date(), 'HH:mm:ss')}
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer-section">
        <div class="footer-brand purple">ماكسيو كور</div>
        <div class="footer-note">هذا كشف حساب إلكتروني معتمد ولا يحتاج إلى توقيع أو ختم</div>
        <div class="footer-contact">للاستفسارات: support@maxiocore.com</div>
        <div class="footer-ref">
          رقم المرجع: ${statementNumber} | تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
        </div>
        <div class="footer-bar purple"></div>
      </div>
    </div>
  `;

  await createPDFFromHTML(html, `كشف-نقاط-${statementNumber}.pdf`);
};
