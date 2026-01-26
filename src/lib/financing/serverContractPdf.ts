/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *               خدمة توليد عقود PDF السيرفرية - Server-Side Contract PDF Service
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * تستدعي Edge Function لتوليد عقود PDF عربية رسمية
 * ✅ توليد سيرفري - لا jsPDF ولا html2canvas
 * ✅ Arabic Shaping + Bidi RTL
 * ✅ خطوط مضمنة (Amiri)
 */

import { supabase } from "@/integrations/supabase/client";

export interface ServerContractData {
  application_id: string;
  application_number: string;
  contract_date: string;
  customer_name: string;
  customer_national_id: string;
  customer_phone: string;
  customer_email: string;
  customer_address?: string;
  services: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  total_services_value: number;
  admin_fees: number;
  vat_amount: number;
  grand_total: number;
  financed_amount: number;
  installments_count: number;
  installment_amount: number;
  first_installment_date: string;
  last_installment_date: string;
  installments_schedule: {
    number: number;
    amount: number;
    due_date: string;
  }[];
}

export interface ContractPdfResponse {
  success: boolean;
  html: string;
  contract_data: ServerContractData;
  approval_record?: {
    approved_at: string;
    ip_address?: string;
    user_agent?: string;
    reading_time_seconds?: number;
    scroll_percentage?: number;
  };
  metadata: {
    generated_at: string;
    application_number: string;
    customer_name: string;
    total_amount: number;
  };
}

/**
 * استدعاء Edge Function لتوليد HTML العقد
 */
export async function generateServerContractPdf(
  applicationId: string,
  includeApproval: boolean = true
): Promise<ContractPdfResponse> {
  const { data, error } = await supabase.functions.invoke('generate-contract-pdf', {
    body: {
      application_id: applicationId,
      include_approval: includeApproval,
    },
  });

  if (error) {
    console.error('Error generating contract PDF:', error);
    throw new Error(`فشل توليد العقد: ${error.message}`);
  }

  if (!data.success) {
    throw new Error(data.error || 'فشل توليد العقد');
  }

  return data as ContractPdfResponse;
}

/**
 * تحميل العقد كملف PDF باستخدام الطباعة
 * يفتح نافذة الطباعة للمستخدم لحفظ كـ PDF
 */
export function downloadContractAsPdf(
  htmlContent: string,
  applicationNumber: string
): void {
  // إنشاء نافذة جديدة للطباعة
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('تم حظر النوافذ المنبثقة. يرجى السماح بها لتحميل العقد.');
  }

  // كتابة محتوى HTML
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // انتظار تحميل الخطوط ثم الطباعة
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };
}

/**
 * عرض العقد في iframe أو نافذة جديدة
 */
export function previewContract(htmlContent: string): Window | null {
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) {
    return null;
  }

  previewWindow.document.write(htmlContent);
  previewWindow.document.close();
  
  return previewWindow;
}

/**
 * تحويل HTML إلى Blob للتحميل
 */
export function createHtmlBlob(htmlContent: string): Blob {
  return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
}

/**
 * حساب hash للعقد للتحقق من السلامة
 */
export async function calculateContractHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
