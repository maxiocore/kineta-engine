/**
 * Eligibility Evaluation API
 * 
 * Endpoint: /eligibility/evaluate
 * Method: POST
 * 
 * Purpose: Evaluates user eligibility for financing based on all verification data
 * 
 * Input:
 *   - session_id: string
 *   - user_id: string
 *   - verifications: {
 *       document_verification_id: string
 *       liveness_verification_id: string
 *       facematch_verification_id: string
 *       phone_verification_id: string
 *       email_verification_id: string
 *     }
 *   - applicant_data: {
 *       employment_type: 'government' | 'private' | 'self_employed' | 'retired'
 *       monthly_income: number
 *       requested_amount: number
 *       has_existing_obligations: boolean
 *       existing_obligations_amount?: number
 *     }
 * 
 * Output (Success):
 *   - success: true
 *   - data: {
 *       decision: 'APPROVED' | 'DECLINED' | 'MANUAL_REVIEW'
 *       financing_limit: number
 *       interest_rate: number
 *       max_tenure_months: number
 *       monthly_payment: number
 *       score: number (0-100)
 *       tier: 'platinum' | 'gold' | 'silver' | 'bronze'
 *       reasons: string[]
 *       conditions?: string[]
 *       valid_until: string (ISO date)
 *     }
 *   - application_id: string
 * 
 * Output (Decline):
 *   - success: false
 *   - decision: 'DECLINED'
 *   - reasons: string[]
 *   - can_reapply_after: string (ISO date)
 * 
 * Error Codes:
 *   - MISSING_VERIFICATIONS: Required verifications incomplete
 *   - VERIFICATION_EXPIRED: One or more verifications expired
 *   - FRAUD_DETECTED: Fraud signals detected
 *   - INCOME_TOO_LOW: Income below minimum threshold
 *   - HIGH_DEBT_RATIO: Debt-to-income ratio too high
 *   - RATE_LIMITED: Too many requests
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EmploymentType = 'government' | 'private' | 'self_employed' | 'retired';
type Decision = 'APPROVED' | 'DECLINED' | 'MANUAL_REVIEW';
type Tier = 'platinum' | 'gold' | 'silver' | 'bronze';

interface Verifications {
  document_verification_id: string;
  liveness_verification_id: string;
  facematch_verification_id: string;
  phone_verification_id: string;
  email_verification_id: string;
}

interface ApplicantData {
  employment_type: EmploymentType;
  monthly_income: number;
  requested_amount: number;
  has_existing_obligations: boolean;
  existing_obligations_amount?: number;
}

interface EvaluationRequest {
  session_id: string;
  user_id: string;
  verifications: Verifications;
  applicant_data: ApplicantData;
}

interface EligibilityResult {
  decision: Decision;
  financing_limit: number;
  interest_rate: number;
  max_tenure_months: number;
  monthly_payment: number;
  score: number;
  tier: Tier;
  reasons: string[];
  reasons_ar: string[];
  conditions?: string[];
  conditions_ar?: string[];
  valid_until: string;
}

const ERRORS = {
  MISSING_VERIFICATIONS: {
    code: 'MISSING_VERIFICATIONS',
    message: 'Required verifications are incomplete',
    message_ar: 'التحققات المطلوبة غير مكتملة'
  },
  VERIFICATION_EXPIRED: {
    code: 'VERIFICATION_EXPIRED',
    message: 'One or more verifications have expired',
    message_ar: 'انتهت صلاحية واحد أو أكثر من التحققات'
  },
  FRAUD_DETECTED: {
    code: 'FRAUD_DETECTED',
    message: 'Application flagged for review due to security concerns',
    message_ar: 'تم وضع علامة على الطلب للمراجعة بسبب مخاوف أمنية'
  },
  INCOME_TOO_LOW: {
    code: 'INCOME_TOO_LOW',
    message: 'Monthly income below minimum threshold',
    message_ar: 'الدخل الشهري أقل من الحد الأدنى'
  },
  HIGH_DEBT_RATIO: {
    code: 'HIGH_DEBT_RATIO',
    message: 'Debt-to-income ratio exceeds allowed limit',
    message_ar: 'نسبة الدين إلى الدخل تتجاوز الحد المسموح'
  },
  MISSING_SESSION: {
    code: 'MISSING_SESSION',
    message: 'Session ID is required',
    message_ar: 'معرف الجلسة مطلوب'
  },
  MISSING_USER: {
    code: 'MISSING_USER',
    message: 'User ID is required',
    message_ar: 'معرف المستخدم مطلوب'
  },
  INVALID_DATA: {
    code: 'INVALID_DATA',
    message: 'Invalid applicant data provided',
    message_ar: 'بيانات المتقدم غير صالحة'
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    message_ar: 'حدث خطأ داخلي'
  }
};

// Configuration
const CONFIG = {
  min_income: 4000, // SAR
  max_debt_ratio: 0.5, // 50%
  verification_expiry_hours: 24,
  base_rates: {
    government: 0.12,
    private: 0.14,
    self_employed: 0.16,
    retired: 0.13
  },
  max_amounts: {
    government: 150000,
    private: 100000,
    self_employed: 80000,
    retired: 60000
  },
  score_weights: {
    employment: 25,
    income: 20,
    verifications: 20,
    debt_ratio: 15,
    fraud_signals: 20
  }
};

// Calculate eligibility score
function calculateScore(
  employmentType: EmploymentType,
  monthlyIncome: number,
  debtRatio: number,
  verificationScore: number,
  fraudScore: number
): number {
  let score = 0;
  
  // Employment score (25 points)
  const employmentScores: Record<EmploymentType, number> = {
    government: 25,
    private: 20,
    retired: 18,
    self_employed: 15
  };
  score += employmentScores[employmentType];
  
  // Income score (20 points)
  if (monthlyIncome >= 20000) score += 20;
  else if (monthlyIncome >= 15000) score += 17;
  else if (monthlyIncome >= 10000) score += 14;
  else if (monthlyIncome >= 7000) score += 10;
  else if (monthlyIncome >= 4000) score += 6;
  
  // Debt ratio score (15 points)
  if (debtRatio <= 0.1) score += 15;
  else if (debtRatio <= 0.2) score += 12;
  else if (debtRatio <= 0.3) score += 9;
  else if (debtRatio <= 0.4) score += 6;
  else if (debtRatio <= 0.5) score += 3;
  
  // Verification score (20 points)
  score += verificationScore;
  
  // Fraud score (20 points - higher is better)
  score += fraudScore;
  
  return Math.min(100, Math.max(0, score));
}

// Determine tier based on score
function determineTier(score: number): Tier {
  if (score >= 85) return 'platinum';
  if (score >= 70) return 'gold';
  if (score >= 55) return 'silver';
  return 'bronze';
}

// Calculate financing limit
function calculateLimit(
  tier: Tier,
  employmentType: EmploymentType,
  monthlyIncome: number,
  requestedAmount: number
): number {
  const maxForEmployment = CONFIG.max_amounts[employmentType];
  const incomeMultiplier = tier === 'platinum' ? 24 : tier === 'gold' ? 18 : tier === 'silver' ? 12 : 8;
  const incomeBasedLimit = monthlyIncome * incomeMultiplier;
  
  return Math.min(requestedAmount, maxForEmployment, incomeBasedLimit);
}

// Validate verifications
async function validateVerifications(
  supabase: any,
  verifications: Verifications,
  userId: string
): Promise<{ valid: boolean; score: number; expired: string[] }> {
  const expired: string[] = [];
  let validCount = 0;
  
  const verificationTypes = [
    { id: verifications.document_verification_id, type: 'document' },
    { id: verifications.liveness_verification_id, type: 'liveness' },
    { id: verifications.facematch_verification_id, type: 'facematch' },
    { id: verifications.phone_verification_id, type: 'phone' },
    { id: verifications.email_verification_id, type: 'email' }
  ];
  
  for (const v of verificationTypes) {
    if (v.id && v.id.length > 0) {
      validCount++;
    } else {
      expired.push(v.type);
    }
  }
  
  const score = (validCount / 5) * 20;
  
  return { valid: validCount === 5, score, expired };
}

// Check fraud signals
async function checkFraudSignals(
  supabase: any,
  userId: string,
  sessionId: string
): Promise<{ hasFraud: boolean; score: number; signals: string[] }> {
  const { data: signals } = await supabase
    .from('fraud_signals')
    .select('signal_type, severity')
    .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
    .eq('is_confirmed', true);
  
  if (!signals || signals.length === 0) {
    return { hasFraud: false, score: 20, signals: [] };
  }
  
  const severityScores: Record<string, number> = {
    critical: 0,
    high: 5,
    medium: 10,
    low: 15
  };
  
  let minScore = 20;
  const detectedSignals: string[] = [];
  
  for (const signal of signals as any[]) {
    const signalScore = severityScores[signal.severity] ?? 10;
    minScore = Math.min(minScore, signalScore);
    detectedSignals.push(signal.signal_type);
    
    if (signal.severity === 'critical' || signal.severity === 'high') {
      return { hasFraud: true, score: minScore, signals: detectedSignals };
    }
  }
  
  return { hasFraud: false, score: minScore, signals: detectedSignals };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST allowed', message_ar: 'POST فقط مسموح' } }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const body: EvaluationRequest = await req.json();

    // Validations
    if (!body.session_id) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_SESSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.user_id) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.MISSING_USER }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.applicant_data || !body.applicant_data.monthly_income || !body.applicant_data.employment_type) {
      return new Response(
        JSON.stringify({ success: false, error: ERRORS.INVALID_DATA }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate verifications
    const verificationResult = await validateVerifications(supabase, body.verifications, body.user_id);
    if (!verificationResult.valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { 
            ...ERRORS.MISSING_VERIFICATIONS, 
            details: { missing: verificationResult.expired } 
          } 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check fraud signals
    const fraudResult = await checkFraudSignals(supabase, body.user_id, body.session_id);
    if (fraudResult.hasFraud) {
      // Log to audit
      await supabase
        .from('eligibility_audit_logs' as any)
        .insert({
          user_id: body.user_id,
          session_id: body.session_id,
          step_name: 'eligibility_evaluation',
          step_order: 10,
          status: 'failed',
          error_message: 'Fraud detected',
          ip_address: ipAddress,
          risk_signals: { fraud_signals: fraudResult.signals }
        } as any);

      return new Response(
        JSON.stringify({ 
          success: false, 
          decision: 'DECLINED',
          error: ERRORS.FRAUD_DETECTED,
          can_reapply_after: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check minimum income
    if (body.applicant_data.monthly_income < CONFIG.min_income) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          decision: 'DECLINED',
          error: { 
            ...ERRORS.INCOME_TOO_LOW, 
            details: { 
              minimum: CONFIG.min_income, 
              provided: body.applicant_data.monthly_income 
            } 
          },
          reasons: ['Monthly income below minimum threshold of SAR 4,000'],
          reasons_ar: ['الدخل الشهري أقل من الحد الأدنى البالغ 4,000 ريال'],
          can_reapply_after: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate debt ratio
    const existingObligations = body.applicant_data.existing_obligations_amount || 0;
    const debtRatio = existingObligations / body.applicant_data.monthly_income;

    if (debtRatio > CONFIG.max_debt_ratio) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          decision: 'DECLINED',
          error: { 
            ...ERRORS.HIGH_DEBT_RATIO, 
            details: { 
              ratio: Math.round(debtRatio * 100), 
              max_allowed: Math.round(CONFIG.max_debt_ratio * 100) 
            } 
          },
          reasons: ['Debt-to-income ratio exceeds 50%'],
          reasons_ar: ['نسبة الدين إلى الدخل تتجاوز 50%'],
          can_reapply_after: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate score
    const score = calculateScore(
      body.applicant_data.employment_type,
      body.applicant_data.monthly_income,
      debtRatio,
      verificationResult.score,
      fraudResult.score
    );

    // Determine tier and decision
    const tier = determineTier(score);
    let decision: Decision = 'APPROVED';
    
    if (score < 40) {
      decision = 'DECLINED';
    } else if (score < 55 || fraudResult.signals.length > 0) {
      decision = 'MANUAL_REVIEW';
    }

    // Calculate financing details
    const financingLimit = calculateLimit(
      tier,
      body.applicant_data.employment_type,
      body.applicant_data.monthly_income,
      body.applicant_data.requested_amount
    );

    const interestRate = CONFIG.base_rates[body.applicant_data.employment_type];
    const maxTenure = tier === 'platinum' ? 60 : tier === 'gold' ? 48 : tier === 'silver' ? 36 : 24;
    const monthlyPayment = (financingLimit * (1 + interestRate)) / maxTenure;

    // Generate application ID
    const applicationId = crypto.randomUUID();
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Build reasons
    const reasons: string[] = [];
    const reasons_ar: string[] = [];

    if (decision === 'APPROVED') {
      reasons.push(`Approved for ${tier} tier financing`);
      reasons_ar.push(`تمت الموافقة على تمويل فئة ${tier === 'platinum' ? 'البلاتينية' : tier === 'gold' ? 'الذهبية' : tier === 'silver' ? 'الفضية' : 'البرونزية'}`);
    } else if (decision === 'MANUAL_REVIEW') {
      reasons.push('Application requires manual review');
      reasons_ar.push('يتطلب الطلب مراجعة يدوية');
    }

    // Log evaluation
    await supabase
      .from('eligibility_audit_logs' as any)
      .insert({
        application_id: decision !== 'DECLINED' ? applicationId : null,
        user_id: body.user_id,
        session_id: body.session_id,
        step_name: 'eligibility_evaluation',
        step_order: 10,
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        input_data: {
          employment_type: body.applicant_data.employment_type,
          monthly_income: body.applicant_data.monthly_income,
          requested_amount: body.applicant_data.requested_amount,
          debt_ratio: debtRatio
        },
        output_data: {
          decision,
          score,
          tier,
          financing_limit: financingLimit
        },
        ip_address: ipAddress,
        device_fingerprint: req.headers.get('x-device-fingerprint'),
        risk_signals: fraudResult.signals.length > 0 ? { signals: fraudResult.signals } : null
      } as any);

    // Return result
    if (decision === 'DECLINED') {
      // Send SMS for eligibility failure
      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('phone, full_name')
          .eq('id', body.user_id)
          .maybeSingle();

        if (userProfile?.phone) {
          await supabase.functions.invoke('financing-sms-notify', {
            body: {
              event: 'eligibility_failed',
              phone: userProfile.phone,
              customerName: userProfile.full_name || 'عميلنا الكريم',
              applicationId: body.session_id,
              userId: body.user_id,
            }
          });
          console.log('[ELIGIBILITY-EVALUATE] SMS sent for eligibility_failed');
        }
      } catch (smsErr) {
        console.error('[ELIGIBILITY-EVALUATE] SMS error:', smsErr);
      }

      return new Response(
        JSON.stringify({
          success: false,
          decision: 'DECLINED',
          reasons: ['Score below minimum threshold'],
          reasons_ar: ['الدرجة أقل من الحد الأدنى المطلوب'],
          can_reapply_after: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ELIGIBILITY-EVALUATE] ${decision} for user ${body.user_id}, score: ${score}, tier: ${tier}`);

    const result: EligibilityResult = {
      decision,
      financing_limit: Math.round(financingLimit),
      interest_rate: interestRate,
      max_tenure_months: maxTenure,
      monthly_payment: Math.round(monthlyPayment * 100) / 100,
      score: Math.round(score),
      tier,
      reasons,
      reasons_ar,
      valid_until: validUntil
    };

    if (decision === 'MANUAL_REVIEW') {
      result.conditions = ['Subject to document verification', 'Final approval within 2 business days'];
      result.conditions_ar = ['خاضع للتحقق من المستندات', 'الموافقة النهائية خلال يومي عمل'];
    }

    // Send SMS for eligibility passed
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('id', body.user_id)
        .maybeSingle();

      if (userProfile?.phone) {
        await supabase.functions.invoke('financing-sms-notify', {
          body: {
            event: 'eligibility_passed',
            phone: userProfile.phone,
            customerName: userProfile.full_name || 'عميلنا الكريم',
            applicationId: applicationId || body.session_id,
            approvedAmount: result.financing_limit,
            userId: body.user_id,
          }
        });
        console.log('[ELIGIBILITY-EVALUATE] SMS sent for eligibility_passed');
      }
    } catch (smsErr) {
      console.error('[ELIGIBILITY-EVALUATE] SMS error:', smsErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        application_id: applicationId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[ELIGIBILITY-EVALUATE] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: { ...ERRORS.INTERNAL_ERROR, details: { message: String(err) } } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
