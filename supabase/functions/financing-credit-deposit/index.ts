/**
 * Financing Credit Deposit Edge Function V2
 * 
 * محرك إيداع رصيد الخدمات المُحسَّن
 * - يستخدم دالة atomic_credit_deposit الذرية
 * - Idempotency صارم عبر deposit_key
 * - مصدر حقيقة واحد: Ledger
 * - Rollback تلقائي عند الفشل
 * 
 * ASH HOLDING - Ali Saleh Al-Shehri Holding Company
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositRequest {
  applicationId: string;
  actorId?: string;
  forceDeposit?: boolean;
}

interface DepositResult {
  success: boolean;
  action: 'deposited' | 'already_deposited' | 'ineligible' | 'failed' | 'processing';
  message: string;
  messageAr: string;
  depositLedgerId?: string;
  creditId?: string;
  transactionId?: string;
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  processingMs?: number;
  notificationsSent?: {
    email: boolean;
    whatsapp: boolean;
  };
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

    const body: DepositRequest = await req.json();
    const { applicationId, actorId } = body;

    console.log(`[Credit-Deposit-V2] Processing application: ${applicationId}`);

    if (!applicationId) {
      return new Response(JSON.stringify({
        success: false,
        action: 'failed',
        message: 'Application ID is required',
        messageAr: 'معرف الطلب مطلوب'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // استدعاء الدالة الذرية في قاعدة البيانات
    // ═══════════════════════════════════════════════════════════════
    const { data: atomicResult, error: atomicError } = await supabase
      .rpc('atomic_credit_deposit', {
        p_application_id: applicationId,
        p_actor_id: actorId || null,
        p_actor_role: actorId ? 'admin' : 'system'
      });

    if (atomicError) {
      console.error('[Credit-Deposit-V2] Atomic function error:', atomicError);
      return new Response(JSON.stringify({
        success: false,
        action: 'failed',
        message: atomicError.message,
        messageAr: 'حدث خطأ أثناء معالجة الإيداع'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Credit-Deposit-V2] Atomic result:', JSON.stringify(atomicResult));

    // ═══════════════════════════════════════════════════════════════
    // معالجة النتيجة
    // ═══════════════════════════════════════════════════════════════
    if (!atomicResult.success) {
      // الإيداع فشل أو غير مؤهل
      return new Response(JSON.stringify({
        success: atomicResult.success,
        action: atomicResult.action,
        message: atomicResult.error || 'Deposit failed',
        messageAr: atomicResult.message_ar
      }), {
        status: atomicResult.action === 'ineligible' ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // إذا كان مودع مسبقًا
    if (atomicResult.action === 'already_deposited') {
      return new Response(JSON.stringify({
        success: true,
        action: 'already_deposited',
        message: 'Service credit already deposited',
        messageAr: atomicResult.message_ar,
        depositLedgerId: atomicResult.deposit_ledger_id,
        creditId: atomicResult.credit_id,
        transactionId: atomicResult.transaction_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // الإيداع تم بنجاح - إرسال الإشعارات
    // ═══════════════════════════════════════════════════════════════
    let emailSent = false;
    let whatsappSent = false;

    // جلب بيانات الطلب للإشعارات
    const { data: application } = await supabase
      .from('financing_applications')
      .select('application_number, email, phone, full_name, approved_amount')
      .eq('id', applicationId)
      .single();

    if (application) {
      // إرسال Email
      try {
        const baseUrl = 'https://ashholding.com';
        
        const { error: emailError } = await supabase.functions.invoke('financing-status-email', {
          body: {
            applicationId: applicationId,
            status: 'CREDIT_DEPOSITED',
            recipientEmail: application.email,
            recipientName: application.full_name,
            applicationNumber: application.application_number,
            approvedAmount: atomicResult.amount,
            baseUrl: baseUrl
          }
        });

        if (!emailError) {
          emailSent = true;
          console.log('[Credit-Deposit-V2] Email notification sent');
        }
      } catch (emailErr) {
        console.error('[Credit-Deposit-V2] Email notification error:', emailErr);
      }

      // إرسال WhatsApp
      try {
        if (application.phone) {
          const { error: whatsappError } = await supabase.functions.invoke('whatsapp-send', {
            body: {
              action: 'send_status',
              phone: application.phone,
              status: 'CREDIT_DEPOSITED',
              applicationNumber: application.application_number,
              customerName: application.full_name,
              amount: atomicResult.amount,
              deepLinkPath: '/dashboard/services'
            }
          });

          if (!whatsappError) {
            whatsappSent = true;
            console.log('[Credit-Deposit-V2] WhatsApp notification sent');
          }
        }
      } catch (waErr) {
        console.error('[Credit-Deposit-V2] WhatsApp notification error:', waErr);
      }

      // إنشاء إشعار داخل المنصة
      await supabase
        .from('notifications')
        .insert({
          user_id: (await supabase
            .from('financing_applications')
            .select('user_id')
            .eq('id', applicationId)
            .single()).data?.user_id,
          title: '🎉 تم إيداع رصيد الخدمات',
          message: `تهانينا! تم إضافة ${formatAmount(atomicResult.amount)} ر.س كرصيد خدمات إلى حسابك. يمكنك استخدامه الآن لطلب خدماتنا.`,
          type: 'success',
          action_url: '/dashboard/services'
        });

      // إرسال إشعار الاكتمال مع روابط المستندات
      try {
        await supabase.functions.invoke('financing-completion-notify', {
          body: {
            applicationId: applicationId,
            eventType: 'FINANCING_FULLY_COMPLETED',
            actorId: actorId
          }
        });
        console.log('[Credit-Deposit-V2] Completion notification triggered');
      } catch (completionErr) {
        console.error('[Credit-Deposit-V2] Completion notification error:', completionErr);
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    console.log(`[Credit-Deposit-V2] Complete. DB: ${atomicResult.processing_ms}ms, Total: ${totalProcessingTime}ms`);

    const result: DepositResult = {
      success: true,
      action: 'deposited',
      message: 'Service credit deposited successfully',
      messageAr: atomicResult.message_ar,
      depositLedgerId: atomicResult.deposit_ledger_id,
      creditId: atomicResult.credit_id,
      transactionId: atomicResult.transaction_id,
      amount: atomicResult.amount,
      balanceBefore: atomicResult.balance_before,
      balanceAfter: atomicResult.balance_after,
      processingMs: atomicResult.processing_ms,
      notificationsSent: {
        email: emailSent,
        whatsapp: whatsappSent
      }
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Credit-Deposit-V2] Fatal error:', errorMessage);

    return new Response(JSON.stringify({
      success: false,
      action: 'failed',
      message: errorMessage,
      messageAr: 'حدث خطأ أثناء معالجة الإيداع'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Format amount in Arabic style
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
