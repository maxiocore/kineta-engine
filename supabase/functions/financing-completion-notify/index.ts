/**
 * Financing Completion Notification Edge Function
 * 
 * Triggered when financing process is fully completed:
 * - Contract signed
 * - Acknowledgment signed
 * - Executive bond verified (if applicable)
 * - Credit deposited
 * 
 * Sends WhatsApp message with:
 * - Completion notification
 * - Signed URL for Contract PDF
 * - Signed URL for Acknowledgment PDF
 * 
 * Security:
 * - Uses signed URLs with 24-hour expiry
 * - Idempotency to prevent duplicate notifications
 * - Audit logging for all actions
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SmartWats configuration
const SMARTWATS_BASE_URL = 'https://app.smartwats.com/api';
const SMARTWATS_INSTANCE_ID = Deno.env.get('SMARTWATS_INSTANCE_ID');
const SMARTWATS_ACCESS_TOKEN = Deno.env.get('SMARTWATS_ACCESS_TOKEN');

// Signed URL expiry (24 hours in seconds)
const SIGNED_URL_EXPIRY = 24 * 60 * 60;

interface CompletionNotifyRequest {
  applicationId: string;
  eventType?: 'FINANCING_FULLY_COMPLETED' | 'DOCUMENTS_READY';
  actorId?: string;
  skipIdempotency?: boolean;
}

interface CompletionNotifyResult {
  success: boolean;
  action: 'sent' | 'already_sent' | 'skipped' | 'failed';
  message: string;
  messageAr: string;
  notifications?: {
    whatsapp: boolean;
    email: boolean;
  };
  documentUrls?: {
    contractUrl?: string;
    acknowledgmentUrl?: string;
    contractExpiry?: string;
    acknowledgmentExpiry?: string;
  };
  idempotencyKey?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: CompletionNotifyRequest = await req.json();
    const { applicationId, eventType = 'FINANCING_FULLY_COMPLETED', actorId, skipIdempotency } = body;

    console.log(`[Completion-Notify] Processing: ${applicationId}, Event: ${eventType}`);

    if (!applicationId) {
      return errorResponse(400, 'Application ID is required', 'معرف الطلب مطلوب');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Fetch application with related documents
    // ═══════════════════════════════════════════════════════════════
    const { data: application, error: appError } = await supabase
      .from('financing_applications')
      .select(`
        id,
        user_id,
        application_number,
        status,
        approved_amount,
        full_name,
        email,
        phone,
        contract_signed_at,
        contract_document_url,
        plan_id
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('[Completion-Notify] Application not found:', appError);
      return errorResponse(404, 'Application not found', 'الطلب غير موجود');
    }

    // Fetch contract document
    const { data: contract } = await supabase
      .from('financing_contract_documents')
      .select('id, contract_number, pdf_url, signed_at, status')
      .eq('application_id', applicationId)
      .single();

    // Fetch acknowledgment
    const { data: acknowledgment } = await supabase
      .from('financing_acknowledgments')
      .select('id, acknowledgment_number, pdf_url, signed_at, status')
      .eq('application_id', applicationId)
      .single();

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Idempotency Check
    // ═══════════════════════════════════════════════════════════════
    const idempotencyKey = `completion_notify:${applicationId}:${eventType}`;
    
    if (!skipIdempotency) {
      const { data: existingNotification } = await supabase
        .from('audit_logs')
        .select('id, created_at')
        .eq('action', 'FINANCING_COMPLETION_NOTIFIED')
        .eq('record_id', applicationId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (existingNotification) {
        console.log('[Completion-Notify] Already sent within 24h:', existingNotification.id);
        return jsonResponse<CompletionNotifyResult>({
          success: true,
          action: 'already_sent',
          message: 'Completion notification already sent within 24 hours',
          messageAr: 'تم إرسال إشعار الإكتمال مسبقاً خلال 24 ساعة',
          idempotencyKey
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Generate Signed URLs for PDFs
    // ═══════════════════════════════════════════════════════════════
    let contractSignedUrl: string | undefined;
    let acknowledgmentSignedUrl: string | undefined;
    const expiryDate = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000);

    // Generate contract PDF signed URL
    if (contract?.pdf_url) {
      try {
        const contractPath = extractStoragePath(contract.pdf_url);
        if (contractPath) {
          const { data: signedData, error: signError } = await supabase.storage
            .from('financing-documents')
            .createSignedUrl(contractPath, SIGNED_URL_EXPIRY);
          
          if (!signError && signedData?.signedUrl) {
            contractSignedUrl = signedData.signedUrl;
            console.log('[Completion-Notify] Contract signed URL generated');
          }
        }
      } catch (err) {
        console.error('[Completion-Notify] Contract signed URL error:', err);
      }
    }

    // Generate acknowledgment PDF signed URL
    if (acknowledgment?.pdf_url) {
      try {
        const ackPath = extractStoragePath(acknowledgment.pdf_url);
        if (ackPath) {
          const { data: signedData, error: signError } = await supabase.storage
            .from('financing-documents')
            .createSignedUrl(ackPath, SIGNED_URL_EXPIRY);
          
          if (!signError && signedData?.signedUrl) {
            acknowledgmentSignedUrl = signedData.signedUrl;
            console.log('[Completion-Notify] Acknowledgment signed URL generated');
          }
        }
      } catch (err) {
        console.error('[Completion-Notify] Acknowledgment signed URL error:', err);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Build WhatsApp Message
    // ═══════════════════════════════════════════════════════════════
    const baseUrl = 'https://maxiocore.com';
    
    const whatsappMessage = buildCompletionMessage({
      customerName: application.full_name,
      applicationNumber: application.application_number,
      approvedAmount: application.approved_amount,
      contractUrl: contractSignedUrl,
      acknowledgmentUrl: acknowledgmentSignedUrl,
      dashboardUrl: `${baseUrl}/dashboard/financing?id=${applicationId}`,
      urlExpiryHours: 24
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Send WhatsApp Notification
    // ═══════════════════════════════════════════════════════════════
    let whatsappSent = false;
    let whatsappMessageId: string | undefined;

    if (application.phone && SMARTWATS_INSTANCE_ID && SMARTWATS_ACCESS_TOKEN) {
      try {
        const result = await sendWhatsAppMessage(
          application.phone,
          whatsappMessage
        );
        
        whatsappSent = result.success;
        whatsappMessageId = result.messageId;
        
        console.log(`[Completion-Notify] WhatsApp result: ${whatsappSent ? '✅' : '❌'}`, result);
      } catch (waError) {
        console.error('[Completion-Notify] WhatsApp error:', waError);
      }
    } else {
      console.warn('[Completion-Notify] WhatsApp not configured or no phone number');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Send Email Notification (Secondary Channel)
    // ═══════════════════════════════════════════════════════════════
    let emailSent = false;

    if (application.email) {
      try {
        const emailResult = await supabase.functions.invoke('send-email', {
          body: {
            to: application.email,
            subject: `✅ اكتمال التمويل - طلب رقم ${application.application_number}`,
            html: buildCompletionEmailHtml({
              customerName: application.full_name,
              applicationNumber: application.application_number,
              approvedAmount: application.approved_amount,
              contractUrl: contractSignedUrl,
              acknowledgmentUrl: acknowledgmentSignedUrl,
              dashboardUrl: `${baseUrl}/dashboard/financing?id=${applicationId}`,
              urlExpiryHours: 24
            })
          }
        });

        emailSent = !emailResult.error;
        console.log(`[Completion-Notify] Email result: ${emailSent ? '✅' : '❌'}`);
      } catch (emailError) {
        console.error('[Completion-Notify] Email error:', emailError);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 7: Log Event & Create Activity
    // ═══════════════════════════════════════════════════════════════
    const processingTime = Date.now() - startTime;

    // Create financing activity log
    await supabase.from('financing_activity_log').insert({
      application_id: applicationId,
      event_type: 'FINANCING_FULLY_COMPLETED',
      from_status: application.status,
      to_status: application.status,
      triggered_by: actorId ? 'admin' : 'system',
      actor_id: actorId || null,
      is_visible_to_customer: true,
      reason: 'تم إرسال إشعار اكتمال التمويل مع روابط المستندات',
      metadata: {
        whatsapp_sent: whatsappSent,
        whatsapp_message_id: whatsappMessageId,
        email_sent: emailSent,
        contract_url_generated: !!contractSignedUrl,
        acknowledgment_url_generated: !!acknowledgmentSignedUrl,
        url_expiry: expiryDate.toISOString()
      }
    });

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'FINANCING_COMPLETION_NOTIFIED',
      table_name: 'financing_applications',
      record_id: applicationId,
      user_id: application.user_id,
      processing_time_ms: processingTime,
      new_value: {
        event_type: eventType,
        notifications: {
          whatsapp: whatsappSent,
          email: emailSent
        },
        documents: {
          contract_url: !!contractSignedUrl,
          acknowledgment_url: !!acknowledgmentSignedUrl
        },
        idempotency_key: idempotencyKey
      },
      metadata: {
        triggered_by: actorId ? 'admin' : 'system',
        actor_id: actorId,
        processing_time_ms: processingTime
      }
    });

    // Create user notification
    await supabase.from('notifications').insert({
      user_id: application.user_id,
      title: '🎊 اكتمل التمويل بنجاح!',
      message: `تهانينا! اكتملت عملية التمويل لطلبك رقم ${application.application_number}. يمكنك الآن تحميل نسخة العقد والإقرار من حسابك.`,
      type: 'success',
      action_url: `/dashboard/financing?id=${applicationId}`
    });

    console.log(`[Completion-Notify] Complete. Time: ${processingTime}ms`);

    return jsonResponse<CompletionNotifyResult>({
      success: true,
      action: 'sent',
      message: 'Completion notification sent successfully',
      messageAr: 'تم إرسال إشعار اكتمال التمويل بنجاح',
      notifications: {
        whatsapp: whatsappSent,
        email: emailSent
      },
      documentUrls: {
        contractUrl: contractSignedUrl,
        acknowledgmentUrl: acknowledgmentSignedUrl,
        contractExpiry: expiryDate.toISOString(),
        acknowledgmentExpiry: expiryDate.toISOString()
      },
      idempotencyKey
    });

  } catch (error: any) {
    console.error('[Completion-Notify] Error:', error);
    return errorResponse(500, error?.message || 'Internal server error', 'حدث خطأ غير متوقع');
  }
});

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function extractStoragePath(url: string): string | null {
  try {
    // Handle various URL formats
    // Example: https://xxx.supabase.co/storage/v1/object/public/financing-documents/contracts/xxx.pdf
    const patterns = [
      /\/storage\/v1\/object\/(?:public|sign)\/financing-documents\/(.+)/,
      /financing-documents\/(.+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('00966')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('+966')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  } else if (!cleaned.startsWith('966') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }
  
  return cleaned;
}

interface MessageParams {
  customerName: string;
  applicationNumber: string;
  approvedAmount: number;
  contractUrl?: string;
  acknowledgmentUrl?: string;
  dashboardUrl: string;
  urlExpiryHours: number;
}

function buildCompletionMessage(params: MessageParams): string {
  const {
    customerName,
    applicationNumber,
    approvedAmount,
    contractUrl,
    acknowledgmentUrl,
    dashboardUrl,
    urlExpiryHours
  } = params;

  let message = `🎊 *اكتمال التمويل بنجاح*
━━━━━━━━━━━━━━━━━━━━━

مرحباً ${customerName} 👋

✅ تهانينا! اكتملت عملية التمويل لطلبك بنجاح.

📋 *تفاصيل الطلب:*
• رقم الطلب: ${applicationNumber}
• رصيد الخدمات: ${formatAmount(approvedAmount)} ر.س

⚠️ *ملاحظة مهمة:*
هذا رصيد خدمات داخل منصة ماكسيو كور ولا يُصرف نقداً.

━━━━━━━━━━━━━━━━━━━━━

📄 *تحميل المستندات:*
_(صالحة لمدة ${urlExpiryHours} ساعة)_

`;

  if (contractUrl) {
    message += `📑 *العقد النهائي:*
${contractUrl}

`;
  }

  if (acknowledgmentUrl) {
    message += `📝 *الإقرار الموقع:*
${acknowledgmentUrl}

`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━

🔗 *عرض حسابك:*
${dashboardUrl}

━━━━━━━━━━━━━━━━━━━━━
_ماكسيو كور - شريكك التقني_`;

  return message;
}

function buildCompletionEmailHtml(params: MessageParams): string {
  const {
    customerName,
    applicationNumber,
    approvedAmount,
    contractUrl,
    acknowledgmentUrl,
    dashboardUrl,
    urlExpiryHours
  } = params;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>اكتمال التمويل</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f4f4f4; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎊 اكتمال التمويل بنجاح</h1>
      </td>
    </tr>
    
    <!-- Body -->
    <tr>
      <td style="padding: 30px;">
        <p style="font-size: 18px; color: #333; margin-bottom: 20px;">مرحباً <strong>${customerName}</strong> 👋</p>
        
        <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #2e7d32; font-size: 16px; margin: 0;">
            ✅ تهانينا! اكتملت عملية التمويل لطلبك بنجاح.
          </p>
        </div>
        
        <!-- Details Card -->
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #1e3a5f; margin-top: 0;">📋 تفاصيل الطلب</h3>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #666;">رقم الطلب:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold;">${applicationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">رصيد الخدمات:</td>
              <td style="padding: 8px 0; color: #2e7d32; font-weight: bold;">${formatAmount(approvedAmount)} ر.س</td>
            </tr>
          </table>
        </div>
        
        <!-- Warning -->
        <div style="background-color: #fff3e0; border-radius: 8px; padding: 15px; margin-bottom: 20px; border-right: 4px solid #ff9800;">
          <p style="color: #e65100; margin: 0; font-size: 14px;">
            ⚠️ <strong>ملاحظة مهمة:</strong> هذا رصيد خدمات داخل منصة ماكسيو كور ولا يُصرف نقداً.
          </p>
        </div>
        
        <!-- Documents Section -->
        <h3 style="color: #1e3a5f;">📄 تحميل المستندات</h3>
        <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
          صالحة لمدة ${urlExpiryHours} ساعة
        </p>
        
        ${contractUrl ? `
        <a href="${contractUrl}" style="display: block; background-color: #1e3a5f; color: #ffffff; text-decoration: none; padding: 15px 20px; border-radius: 8px; text-align: center; margin-bottom: 10px; font-weight: bold;">
          📑 تحميل العقد النهائي
        </a>
        ` : ''}
        
        ${acknowledgmentUrl ? `
        <a href="${acknowledgmentUrl}" style="display: block; background-color: #2d5a87; color: #ffffff; text-decoration: none; padding: 15px 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; font-weight: bold;">
          📝 تحميل الإقرار الموقع
        </a>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <a href="${dashboardUrl}" style="display: block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 15px 20px; border-radius: 8px; text-align: center; font-weight: bold;">
          🔗 عرض حسابك
        </a>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f5f5f5; padding: 20px; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          ماكسيو كور - شريكك التقني
        </p>
        <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
          هذا البريد مُرسل تلقائياً، يرجى عدم الرد عليه.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    const response = await fetch(`${SMARTWATS_BASE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: formattedPhone,
        type: 'text',
        message: message,
        instance_id: SMARTWATS_INSTANCE_ID,
        access_token: SMARTWATS_ACCESS_TOKEN,
      }),
    });

    const result = await response.json();
    
    if (result.status === 'success' || result.status === true || response.ok) {
      return {
        success: true,
        messageId: result.id || result.message_id || result.msg_id
      };
    }
    
    return {
      success: false,
      error: result.message || 'Unknown error'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error'
    };
  }
}

function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function errorResponse(status: number, message: string, messageAr: string): Response {
  return jsonResponse<CompletionNotifyResult>({
    success: false,
    action: 'failed',
    message,
    messageAr
  }, status);
}
