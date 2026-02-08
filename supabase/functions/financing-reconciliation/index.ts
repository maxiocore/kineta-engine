/**
 * Financing Credit Reconciliation Job
 * 
 * مهمة تدقيق ومصالحة إيداعات رصيد الخدمات
 * - تكشف التناقضات بين المتوقع والفعلي
 * - تعيد المحاولة للإيداعات الفاشلة
 * - تنتج تقرير تدقيق مفصل
 * 
 * الاستخدام: يُستدعى عبر Cron Job أو يدويًا من الأدمن
 * 
 * ASH HOLDING - Ali Saleh Al-Shehri Holding Company
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconciliationRequest {
  mode: 'report' | 'fix' | 'retry';
  dryRun?: boolean;
  maxRetries?: number;
}

interface DiscrepancyRecord {
  applicationId: string;
  applicationNumber: string;
  expectedAmount: number;
  ledgerBalance: number;
  depositStatus: string;
  discrepancyType: string;
  recommendedAction: string;
  actionTaken?: string;
  result?: unknown;
}

interface ReconciliationReport {
  timestamp: string;
  mode: string;
  dryRun: boolean;
  summary: {
    totalChecked: number;
    discrepanciesFound: number;
    missingDeposits: number;
    amountMismatches: number;
    statusMismatches: number;
    retriesAttempted: number;
    retriesSucceeded: number;
    retriesFailed: number;
  };
  discrepancies: DiscrepancyRecord[];
  retryResults: Array<{
    applicationId: string;
    success: boolean;
    message: string;
  }>;
  executionTimeMs: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // التحقق من صلاحيات الأدمن
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (!roles) {
          return new Response(JSON.stringify({
            error: 'Unauthorized - Admin access required'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    const body: ReconciliationRequest = await req.json().catch(() => ({ 
      mode: 'report', 
      dryRun: true 
    }));

    const { mode = 'report', dryRun = true, maxRetries = 10 } = body;

    console.log(`[Reconciliation] Starting in ${mode} mode, dryRun: ${dryRun}`);

    const report: ReconciliationReport = {
      timestamp: new Date().toISOString(),
      mode,
      dryRun,
      summary: {
        totalChecked: 0,
        discrepanciesFound: 0,
        missingDeposits: 0,
        amountMismatches: 0,
        statusMismatches: 0,
        retriesAttempted: 0,
        retriesSucceeded: 0,
        retriesFailed: 0
      },
      discrepancies: [],
      retryResults: [],
      executionTimeMs: 0
    };

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: استدعاء دالة المصالحة في قاعدة البيانات
    // ═══════════════════════════════════════════════════════════════
    const { data: discrepancies, error: reconcileError } = await supabase
      .rpc('reconcile_credit_deposits');

    if (reconcileError) {
      console.error('[Reconciliation] Error:', reconcileError);
      throw new Error(`Reconciliation query failed: ${reconcileError.message}`);
    }

    // معالجة التناقضات
    if (discrepancies && discrepancies.length > 0) {
      report.summary.discrepanciesFound = discrepancies.length;

      for (const disc of discrepancies) {
        const record: DiscrepancyRecord = {
          applicationId: disc.application_id,
          applicationNumber: disc.application_number,
          expectedAmount: disc.expected_amount,
          ledgerBalance: disc.ledger_balance,
          depositStatus: disc.deposit_status,
          discrepancyType: disc.discrepancy_type,
          recommendedAction: disc.recommended_action
        };

        // تصنيف التناقضات
        switch (disc.discrepancy_type) {
          case 'MISSING_DEPOSIT':
            report.summary.missingDeposits++;
            break;
          case 'AMOUNT_MISMATCH':
            report.summary.amountMismatches++;
            break;
          case 'STATUS_MISMATCH':
            report.summary.statusMismatches++;
            break;
        }

        report.discrepancies.push(record);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: إعادة المحاولة للإيداعات الفاشلة (إذا كان الوضع fix أو retry)
    // ═══════════════════════════════════════════════════════════════
    if ((mode === 'fix' || mode === 'retry') && !dryRun) {
      console.log('[Reconciliation] Attempting retries...');

      const { data: retryResults, error: retryError } = await supabase
        .rpc('retry_failed_deposits');

      if (retryError) {
        console.error('[Reconciliation] Retry error:', retryError);
      } else if (retryResults) {
        report.summary.retriesAttempted = retryResults.length;

        for (const result of retryResults) {
          const retryRecord = {
            applicationId: result.application_id,
            success: result.result?.success || false,
            message: result.result?.message_ar || 'Unknown'
          };

          if (result.result?.success) {
            report.summary.retriesSucceeded++;
          } else {
            report.summary.retriesFailed++;
          }

          report.retryResults.push(retryRecord);
        }
      }

      // محاولة إصلاح MISSING_DEPOSIT
      if (mode === 'fix') {
        const missingDeposits = report.discrepancies.filter(
          d => d.discrepancyType === 'MISSING_DEPOSIT' && d.recommendedAction === 'RETRY_DEPOSIT'
        );

        for (const missing of missingDeposits.slice(0, maxRetries)) {
          console.log(`[Reconciliation] Fixing missing deposit: ${missing.applicationId}`);

          const { data: fixResult, error: fixError } = await supabase
            .rpc('atomic_credit_deposit', {
              p_application_id: missing.applicationId,
              p_actor_id: null,
              p_actor_role: 'system'
            });

          const retryRecord = {
            applicationId: missing.applicationId,
            success: fixResult?.success || false,
            message: fixError?.message || fixResult?.message_ar || 'Unknown'
          };

          if (fixResult?.success) {
            report.summary.retriesSucceeded++;
            missing.actionTaken = 'FIXED';
            missing.result = fixResult;
          } else {
            report.summary.retriesFailed++;
            missing.actionTaken = 'FAILED';
            missing.result = fixError || fixResult;
          }

          report.retryResults.push(retryRecord);
          report.summary.retriesAttempted++;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: حساب إحصائيات إضافية
    // ═══════════════════════════════════════════════════════════════
    
    // عدد الطلبات الكلي التي يجب أن يكون لها إيداع
    const { count: totalEligible } = await supabase
      .from('financing_applications')
      .select('id', { count: 'exact', head: true })
      .in('status', [
        'FIN_CREDIT_DEPOSITED', 'CREDIT_DEPOSITED', 'FIN_CONTRACT_FINALIZED',
        'CONTRACT_FINALIZED', 'APPROVED', 'APPROVED_WITH_LIMITS'
      ])
      .gt('approved_amount', 0);

    report.summary.totalChecked = totalEligible || 0;

    // حفظ التقرير في Audit Log
    await supabase
      .from('audit_logs')
      .insert({
        action: 'RECONCILIATION_RUN',
        table_name: 'financing_deposit_ledger',
        new_value: {
          mode,
          dryRun,
          summary: report.summary,
          discrepancyCount: report.discrepancies.length
        },
        metadata: {
          timestamp: report.timestamp,
          executionTimeMs: Date.now() - startTime
        }
      });

    report.executionTimeMs = Date.now() - startTime;

    console.log(`[Reconciliation] Complete in ${report.executionTimeMs}ms`);
    console.log(`[Reconciliation] Summary:`, JSON.stringify(report.summary));

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Reconciliation] Fatal error:', errorMessage);

    return new Response(JSON.stringify({
      error: errorMessage,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
