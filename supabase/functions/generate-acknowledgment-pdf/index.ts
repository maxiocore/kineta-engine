/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *             مولد PDF إقرار الشروط - Terms Acknowledgment PDF Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * وثيقة رسمية منفصلة عن العقد لإقرار العميل بقراءة وفهم الشروط
 * ✅ Arabic Shaping (ربط الحروف) - محسّن
 * ✅ Bidi RTL (اتجاه النص الصحيح)
 * ✅ Embedded Font (خط Amiri + Noto Naskh Arabic مضمن)
 * ✅ تصميم رسمي مصرفي
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AcknowledgmentData {
  acknowledgment_number: string;
  application_number: string;
  customer_name: string;
  customer_national_id: string;
  issue_date: string;
  financed_amount: number;
  installments_count: number;
}

interface SignatureRecord {
  signed_at: string;
  ip_address?: string;
  user_agent?: string;
  reading_time_seconds?: number;
}

const COMPANY_INFO = {
  name: "شركة علي صالح الشهري القابضة",
  nameEn: "Ali Saleh Al-Shehri Holding Company",
  commercialRegister: "4030554749",
  address: "المملكة العربية السعودية - جدة",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ر.س';
}

function generateAcknowledgmentHTML(data: AcknowledgmentData, signature?: SignatureRecord): string {
  const issueDateFormatted = formatDate(data.issue_date);
  const signatureDateFormatted = signature ? formatDate(signature.signed_at) : '';
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إقرار بقراءة الشروط - ${data.acknowledgment_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');
    
    :root {
      --primary-color: #1e3a5f;
      --secondary-color: #2563eb;
      --success-color: #166534;
      --danger-color: #dc2626;
      --text-primary: #1f2937;
      --text-muted: #6b7280;
      --border-color: #e5e7eb;
      --bg-light: #f8fafc;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Amiri', 'Noto Naskh Arabic', serif;
      font-size: 12pt;
      line-height: 1.9;
      color: var(--text-primary);
      background: white;
      direction: rtl;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
    }
    
    @media print { .page { margin: 0; padding: 15mm; } }
    
    .header {
      text-align: center;
      border-bottom: 4px double var(--primary-color);
      padding-bottom: 25px;
      margin-bottom: 30px;
    }
    
    .company-name {
      font-size: 20pt;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 5px;
    }
    
    .company-name-en {
      font-size: 11pt;
      color: var(--text-muted);
      margin-bottom: 15px;
    }
    
    .document-title {
      font-size: 22pt;
      font-weight: 700;
      color: var(--danger-color);
      margin: 25px 0;
      padding: 20px;
      background: linear-gradient(135deg, #fef2f2, #fff);
      border: 3px solid var(--danger-color);
      border-radius: 12px;
    }
    
    .document-number {
      font-size: 13pt;
      color: var(--text-primary);
      background: var(--bg-light);
      padding: 10px 25px;
      border-radius: 25px;
      display: inline-block;
      border: 1px solid var(--border-color);
    }
    
    .info-section {
      background: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .info-label {
      font-weight: 700;
      color: var(--text-muted);
      min-width: 100px;
    }
    
    .info-value {
      color: var(--text-primary);
      font-size: 12pt;
      font-weight: 600;
    }
    
    .statement-box {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 2px solid var(--secondary-color);
      border-radius: 15px;
      padding: 35px;
      margin: 35px 0;
    }
    
    .statement-title {
      font-size: 16pt;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 20px;
      text-align: center;
      padding-bottom: 15px;
      border-bottom: 2px dashed var(--secondary-color);
    }
    
    .statement-text {
      font-size: 13pt;
      line-height: 2.2;
      text-align: justify;
      color: var(--text-primary);
    }
    
    .highlight {
      background: #fef3c7;
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 700;
      border: 1px solid #fcd34d;
    }
    
    .points-section { margin: 35px 0; }
    
    .points-title {
      font-size: 15pt;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid var(--secondary-color);
    }
    
    .point-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 15px;
      padding: 15px 20px;
      background: white;
      border-radius: 10px;
      border-right: 5px solid var(--secondary-color);
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .point-check {
      color: var(--success-color);
      font-size: 20pt;
      flex-shrink: 0;
    }
    
    .point-text {
      font-size: 11pt;
      color: var(--text-primary);
      line-height: 1.8;
    }
    
    .signature-section {
      margin-top: 50px;
      border: 2px solid var(--primary-color);
      border-radius: 15px;
      padding: 30px;
      background: var(--bg-light);
    }
    
    .signature-title {
      font-size: 15pt;
      font-weight: 700;
      color: var(--primary-color);
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px dashed var(--border-color);
    }
    
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    
    .signature-field { text-align: center; }
    
    .signature-label {
      font-size: 10pt;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    
    .signature-line {
      border-bottom: 2px dashed var(--text-muted);
      height: 60px;
      margin-bottom: 10px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 8px;
    }
    
    .signature-value {
      font-size: 13pt;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .electronic-signature {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 20px;
      margin-top: 25px;
    }
    
    .electronic-signature h4 {
      color: var(--success-color);
      font-size: 13pt;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .signature-details {
      font-size: 10pt;
      color: var(--text-primary);
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .signature-details p { margin: 0; }
    
    .legal-note {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
      font-size: 11pt;
      color: #92400e;
      text-align: center;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 3px double var(--border-color);
      text-align: center;
    }
    
    .footer p {
      font-size: 9pt;
      color: var(--text-muted);
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="company-name">${COMPANY_INFO.name}</div>
      <div class="company-name-en">${COMPANY_INFO.nameEn}</div>
      <div class="document-title">إقرار بقراءة وفهم الشروط والأحكام</div>
      <div class="document-number">رقم الإقرار: ${data.acknowledgment_number}</div>
    </div>
    
    <div class="info-section">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">رقم الطلب:</span>
          <span class="info-value">${data.application_number}</span>
        </div>
        <div class="info-item">
          <span class="info-label">تاريخ الإصدار:</span>
          <span class="info-value">${issueDateFormatted}</span>
        </div>
        <div class="info-item">
          <span class="info-label">اسم المُقر:</span>
          <span class="info-value">${data.customer_name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">رقم الهوية:</span>
          <span class="info-value">${data.customer_national_id}</span>
        </div>
      </div>
    </div>
    
    <div class="statement-box">
      <div class="statement-title">نص الإقرار الرسمي</div>
      <div class="statement-text">
        أنا الموقع أدناه <span class="highlight">${data.customer_name}</span> الحامل لهوية رقم <span class="highlight">${data.customer_national_id}</span>،
        أُقرّ وأشهد بأنني قد اطلعت على كافة الشروط والأحكام المتعلقة بعقد تمويل الخدمات رقم <span class="highlight">${data.application_number}</span>،
        وأنني قرأتها بالكامل وفهمت جميع بنودها ومحتوياتها فهماً تاماً ودقيقاً.
      </div>
    </div>
    
    <div class="points-section">
      <div class="points-title">أُقرّ وأوافق على ما يلي:</div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">قرأت وفهمت جميع شروط وأحكام عقد تمويل الخدمات بالكامل.</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">أدرك أن هذا التمويل غير نقدي ويُضاف كرصيد خدمات داخل المنصة فقط.</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">أوافق على مبلغ التمويل البالغ <strong>${formatCurrency(data.financed_amount)}</strong> وتقسيمه إلى <strong>${data.installments_count}</strong> أقساط شهرية.</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">أتعهد بسداد الأقساط في مواعيدها المحددة وفقاً لجدول السداد.</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">أُقرّ بأنني أهل للتعاقد وأن جميع البيانات المقدمة صحيحة ودقيقة.</span>
      </div>
      
      <div class="point-item">
        <span class="point-check">✓</span>
        <span class="point-text">أوافق على خضوع هذا العقد للأنظمة المعمول بها في المملكة العربية السعودية.</span>
      </div>
    </div>
    
    <div class="legal-note">
      ⚠️ هذا الإقرار وثيقة رسمية وملزمة قانوناً، ويُعتبر توقيعك الإلكتروني موافقة صريحة وقاطعة على جميع ما ورد فيه.
    </div>
    
    <div class="signature-section">
      <div class="signature-title">التوقيع والإقرار</div>
      
      <div class="signature-grid">
        <div class="signature-field">
          <div class="signature-label">اسم المُقر</div>
          <div class="signature-line">
            <span class="signature-value">${data.customer_name}</span>
          </div>
        </div>
        
        <div class="signature-field">
          <div class="signature-label">تاريخ التوقيع</div>
          <div class="signature-line">
            <span class="signature-value">${signature ? signatureDateFormatted : '________________'}</span>
          </div>
        </div>
      </div>
      
      ${signature ? `
      <div class="electronic-signature">
        <h4>✓ تم التوقيع إلكترونياً</h4>
        <div class="signature-details">
          <p><strong>تاريخ ووقت التوقيع:</strong> ${new Date(signature.signed_at).toLocaleString('ar-SA')}</p>
          ${signature.ip_address ? `<p><strong>عنوان IP:</strong> ${signature.ip_address}</p>` : ''}
          ${signature.reading_time_seconds ? `<p><strong>مدة القراءة:</strong> ${Math.floor(signature.reading_time_seconds / 60)} دقيقة ${signature.reading_time_seconds % 60} ثانية</p>` : ''}
        </div>
      </div>
      ` : `
      <div style="text-align: center; padding: 25px; color: #9ca3af; font-style: italic;">
        في انتظار توقيع العميل...
      </div>
      `}
    </div>
    
    <div class="footer">
      <p>${COMPANY_INFO.name} - ${COMPANY_INFO.address}</p>
      <p>سجل تجاري: ${COMPANY_INFO.commercialRegister}</p>
      <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id, acknowledgment_id } = await req.json();

    if (!application_id && !acknowledgment_id) {
      return new Response(
        JSON.stringify({ error: "application_id or acknowledgment_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let acknowledgment: any;
    let application: any;

    if (acknowledgment_id) {
      const { data, error } = await supabase
        .from("financing_acknowledgments")
        .select(`*, application:financing_applications(*)`)
        .eq("id", acknowledgment_id)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Acknowledgment not found", details: error }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      acknowledgment = data;
      application = data.application;
    } else {
      const { data: appData, error: appError } = await supabase
        .from("financing_applications")
        .select(`*, plan:financing_plans(*), acknowledgment:financing_acknowledgments(*)`)
        .eq("id", application_id)
        .single();

      if (appError || !appData) {
        return new Response(
          JSON.stringify({ error: "Application not found", details: appError }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      application = appData;
      acknowledgment = appData.acknowledgment?.[0];
    }

    const ackData: AcknowledgmentData = {
      acknowledgment_number: acknowledgment?.acknowledgment_number || `ACK-${application.application_number}`,
      application_number: application.application_number,
      customer_name: application.contract_override_name || application.full_name,
      customer_national_id: application.national_id,
      issue_date: acknowledgment?.sent_at || new Date().toISOString(),
      financed_amount: application.approved_amount || application.requested_amount,
      installments_count: application.contract_override_installments || application.plan?.installments_count || 3,
    };

    let signatureRecord: SignatureRecord | undefined;
    if (acknowledgment?.signed_at) {
      signatureRecord = {
        signed_at: acknowledgment.signed_at,
        ip_address: acknowledgment.signature_ip,
        user_agent: acknowledgment.signature_user_agent,
        reading_time_seconds: acknowledgment.reading_time_seconds,
      };
    }

    const htmlContent = generateAcknowledgmentHTML(ackData, signatureRecord);

    return new Response(
      JSON.stringify({
        success: true,
        html: htmlContent,
        acknowledgment_data: ackData,
        signature_record: signatureRecord,
        acknowledgment_id: acknowledgment?.id,
        status: acknowledgment?.status || 'pending',
        metadata: {
          generated_at: new Date().toISOString(),
          application_number: application.application_number,
          customer_name: ackData.customer_name,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating acknowledgment PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to generate acknowledgment", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
