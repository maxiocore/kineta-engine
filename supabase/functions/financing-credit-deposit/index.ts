/**
 * Financing Credit Deposit Edge Function
 * Links financing approval to wallet with proper event ordering
 * 
 * Flow:
 * 1. Validate application is in FIN_CONTRACT_FINALIZED + APPROVED/APPROVED_WITH_LIMITS
 * 2. Check idempotency to prevent duplicate deposits
 * 3. Create service credit ledger entry (WALLET_CREDITED)
 * 4. Update financing status to FIN_CREDIT_DEPOSITED
 * 5. Send Email notification
 * 6. Send WhatsApp notification
 * 7. Log all operations in audit_logs
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid statuses that allow credit deposit
const ELIGIBLE_STATUSES = [
  'FIN_CONTRACT_FINALIZED',
  'APPROVED',
  'APPROVED_WITH_LIMITS',
  'CONTRACT_FINALIZED',
  'awaiting_signature',      // Legacy status - contract signed awaiting deposit
  'contract_signed',         // Alternative legacy status
  'CONTRACT_ACCEPTED'        // New state machine status
];

interface DepositRequest {
  applicationId: string;
  actorId?: string;
  forceDeposit?: boolean; // For manual admin override
}

interface DepositResult {
  success: boolean;
  action: 'deposited' | 'already_deposited' | 'ineligible' | 'failed';
  message: string;
  messageAr: string;
  creditId?: string;
  transactionId?: string;
  ledgerEntryId?: string;
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
    const { applicationId, actorId, forceDeposit } = body;

    console.log(`[Credit-Deposit] Processing application: ${applicationId}`);

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
    // STEP 1: Fetch and validate application
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
        plan_id,
        contract_signed_at
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('[Credit-Deposit] Application not found:', appError);
      return new Response(JSON.stringify({
        success: false,
        action: 'failed',
        message: 'Application not found',
        messageAr: 'الطلب غير موجود'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if already deposited
    if (application.status === 'FIN_CREDIT_DEPOSITED' || application.status === 'CREDIT_DEPOSITED') {
      console.log('[Credit-Deposit] Already deposited:', application.application_number);
      return new Response(JSON.stringify({
        success: true,
        action: 'already_deposited',
        message: 'Service credit already deposited',
        messageAr: 'رصيد الخدمات مودع مسبقاً'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate eligible status
    const isEligible = ELIGIBLE_STATUSES.includes(application.status) || forceDeposit;
    if (!isEligible) {
      console.log('[Credit-Deposit] Ineligible status:', application.status);
      return new Response(JSON.stringify({
        success: false,
        action: 'ineligible',
        message: `Application status '${application.status}' is not eligible for credit deposit`,
        messageAr: `حالة الطلب '${application.status}' غير مؤهلة لإيداع الرصيد`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate approved amount
    const approvedAmount = Number(application.approved_amount);
    if (!approvedAmount || approvedAmount <= 0) {
      console.error('[Credit-Deposit] Invalid approved amount:', application.approved_amount);
      return new Response(JSON.stringify({
        success: false,
        action: 'failed',
        message: 'Invalid approved amount',
        messageAr: 'المبلغ المعتمد غير صالح'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Idempotency Check - Prevent duplicate deposits
    // ═══════════════════════════════════════════════════════════════
    const idempotencyKey = `credit_deposit:${applicationId}`;
    
    const { data: existingDeposit } = await supabase
      .from('service_credit_transactions')
      .select('id, created_at')
      .eq('reference_type', 'financing')
      .eq('reference_id', applicationId)
      .eq('transaction_type', 'credit')
      .single();

    if (existingDeposit) {
      console.log('[Credit-Deposit] Duplicate deposit prevented:', existingDeposit.id);
      return new Response(JSON.stringify({
        success: true,
        action: 'already_deposited',
        message: 'Credit deposit already processed',
        messageAr: 'تم معالجة إيداع الرصيد مسبقاً',
        transactionId: existingDeposit.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Create/Update Service Credit Record (WALLET_CREDITED)
    // ═══════════════════════════════════════════════════════════════
    console.log('[Credit-Deposit] Creating service credit entry...');

    // Check for existing service credit
    const { data: existingCredit } = await supabase
      .from('service_credits')
      .select('*')
      .eq('user_id', application.user_id)
      .eq('is_active', true)
      .single();

    let creditId: string;
    let balanceBefore: number;
    let balanceAfter: number;

    if (existingCredit) {
      // Update existing credit - available_balance is computed (total_credited - total_used)
      balanceBefore = Number(existingCredit.total_credited) - Number(existingCredit.total_used);
      const newTotalCredited = Number(existingCredit.total_credited) + approvedAmount;
      balanceAfter = newTotalCredited - Number(existingCredit.total_used);
      
      const { error: updateError } = await supabase
        .from('service_credits')
        .update({
          total_credited: newTotalCredited,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCredit.id);

      if (updateError) {
        throw new Error(`Failed to update service credit: ${updateError.message}`);
      }

      creditId = existingCredit.id;
      console.log('[Credit-Deposit] Updated existing credit:', creditId);
    } else {
      // Create new credit record
      balanceBefore = 0;
      balanceAfter = approvedAmount;

      const { data: newCredit, error: createError } = await supabase
        .from('service_credits')
        .insert({
          user_id: application.user_id,
          total_credited: approvedAmount,
          total_used: 0,
          application_id: applicationId,
          source_type: 'financing',
          source_reference_id: applicationId,
          is_active: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 12 months
        })
        .select('id')
        .single();

      if (createError || !newCredit) {
        throw new Error(`Failed to create service credit: ${createError?.message}`);
      }

      creditId = newCredit.id;
      console.log('[Credit-Deposit] Created new credit:', creditId);
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Create Ledger Transaction Entry
    // ═══════════════════════════════════════════════════════════════
    const { data: transaction, error: txError } = await supabase
      .from('service_credit_transactions')
      .insert({
        credit_id: creditId,
        user_id: application.user_id,
        transaction_type: 'credit',
        amount: approvedAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_type: 'financing',
        reference_id: applicationId,
        description: `Service financing credit - Application #${application.application_number}`,
        description_ar: `رصيد تمويل خدمات - طلب رقم ${application.application_number}`,
        status: 'completed',
        metadata: {
          event: 'WALLET_CREDITED',
          financing_plan_id: application.plan_id,
          idempotency_key: idempotencyKey,
          deposited_at: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (txError || !transaction) {
      throw new Error(`Failed to create ledger entry: ${txError?.message}`);
    }

    console.log('[Credit-Deposit] Ledger entry created:', transaction.id);

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Update Financing Application Status
    // ═══════════════════════════════════════════════════════════════
    const previousStatus = application.status;
    
    const { error: statusError } = await supabase
      .from('financing_applications')
      .update({
        status: 'FIN_CREDIT_DEPOSITED',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (statusError) {
      console.error('[Credit-Deposit] Status update failed:', statusError);
      // Don't throw - credit is already deposited
    }

    // Log status transition in activity log
    await supabase
      .from('financing_activity_log')
      .insert({
        application_id: applicationId,
        event_type: 'status_change',
        from_status: previousStatus,
        to_status: 'FIN_CREDIT_DEPOSITED',
        triggered_by: actorId ? 'admin' : 'system',
        actor_id: actorId || null,
        is_visible_to_customer: true,
        reason: 'تم إيداع رصيد الخدمات بنجاح',
        metadata: {
          credit_id: creditId,
          transaction_id: transaction.id,
          amount: approvedAmount,
          balance_after: balanceAfter
        }
      });

    console.log('[Credit-Deposit] Status updated to FIN_CREDIT_DEPOSITED');

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Send Email Notification
    // ═══════════════════════════════════════════════════════════════
    let emailSent = false;
    try {
      const baseUrl = Deno.env.get('SITE_URL') || 'https://kineta-engine.lovable.app';
      
      const { error: emailError } = await supabase.functions.invoke('financing-status-email', {
        body: {
          applicationId: applicationId,
          status: 'CREDIT_DEPOSITED',
          recipientEmail: application.email,
          recipientName: application.full_name,
          applicationNumber: application.application_number,
          approvedAmount: approvedAmount,
          baseUrl: baseUrl
        }
      });

      if (emailError) {
        console.error('[Credit-Deposit] Email notification failed:', emailError);
      } else {
        emailSent = true;
        console.log('[Credit-Deposit] Email notification sent');
      }
    } catch (emailErr) {
      console.error('[Credit-Deposit] Email notification error:', emailErr);
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 7: Send WhatsApp Notification
    // ═══════════════════════════════════════════════════════════════
    let whatsappSent = false;
    try {
      if (application.phone) {
        const { error: whatsappError } = await supabase.functions.invoke('whatsapp-send', {
          body: {
            action: 'send_status',
            phone: application.phone,
            status: 'CREDIT_DEPOSITED',
            applicationNumber: application.application_number,
            customerName: application.full_name,
            amount: approvedAmount,
            deepLinkPath: '/dashboard/services'
          }
        });

        if (whatsappError) {
          console.error('[Credit-Deposit] WhatsApp notification failed:', whatsappError);
        } else {
          whatsappSent = true;
          console.log('[Credit-Deposit] WhatsApp notification sent');
        }
      }
    } catch (waErr) {
      console.error('[Credit-Deposit] WhatsApp notification error:', waErr);
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 8: Log to Audit Trail
    // ═══════════════════════════════════════════════════════════════
    const processingTime = Date.now() - startTime;
    
    await supabase
      .from('audit_logs')
      .insert({
        action: 'FINANCING_CREDIT_DEPOSITED',
        table_name: 'service_credits',
        record_id: creditId,
        user_id: application.user_id,
        processing_time_ms: processingTime,
        new_value: {
          event: 'WALLET_CREDITED',
          application_id: applicationId,
          application_number: application.application_number,
          credit_id: creditId,
          transaction_id: transaction.id,
          amount: approvedAmount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          notifications: {
            email: emailSent,
            whatsapp: whatsappSent
          },
          note: 'رصيد خدمات غير قابل للسحب أو التحويل - للاستخدام داخل المنصة فقط'
        },
        metadata: {
          triggered_by: actorId ? 'admin' : 'system',
          actor_id: actorId,
          idempotency_key: idempotencyKey,
          processing_time_ms: processingTime
        }
      });

    // ═══════════════════════════════════════════════════════════════
    // STEP 9: Create User Notification
    // ═══════════════════════════════════════════════════════════════
    await supabase
      .from('notifications')
      .insert({
        user_id: application.user_id,
        title: '🎉 تم إيداع رصيد الخدمات',
        message: `تهانينا! تم إضافة ${formatAmount(approvedAmount)} ر.س كرصيد خدمات إلى حسابك. يمكنك استخدامه الآن لطلب خدماتنا.`,
        type: 'success',
        action_url: '/dashboard/services'
      });

    // ═══════════════════════════════════════════════════════════════
    // STEP 10: Send Completion Notification with Document Links
    // ═══════════════════════════════════════════════════════════════
    try {
      console.log('[Credit-Deposit] Triggering completion notification...');
      
      const { error: completionError } = await supabase.functions.invoke('financing-completion-notify', {
        body: {
          applicationId: applicationId,
          eventType: 'FINANCING_FULLY_COMPLETED',
          actorId: actorId
        }
      });

      if (completionError) {
        console.error('[Credit-Deposit] Completion notification failed:', completionError);
      } else {
        console.log('[Credit-Deposit] Completion notification sent successfully');
      }
    } catch (completionErr) {
      console.error('[Credit-Deposit] Completion notification error:', completionErr);
      // Don't throw - main operation is complete
    }

    console.log(`[Credit-Deposit] Complete. Time: ${processingTime}ms`);

    const result: DepositResult = {
      success: true,
      action: 'deposited',
      message: 'Service credit deposited successfully',
      messageAr: 'تم إيداع رصيد الخدمات بنجاح',
      creditId,
      transactionId: transaction.id,
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
    console.error('[Credit-Deposit] Fatal error:', errorMessage);

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
