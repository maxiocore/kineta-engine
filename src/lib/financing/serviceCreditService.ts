/**
 * خدمة رصيد الخدمات (غير نقدي)
 * Service Credits Service (Non-Cash)
 * 
 * هذا الرصيد:
 * - ليس نقدًا ولا يمكن سحبه أو تحويله
 * - يُستخدم فقط لشراء الخدمات داخل منصة MaxioCore
 * - أو خدمات شركة علي صالح الشهري القابضة والجهات التابعة لها
 */

import { supabase } from '@/integrations/supabase/client';

export interface ServiceCredit {
  id: string;
  user_id: string;
  total_credited: number;
  total_used: number;
  available_balance: number;
  source_type: 'financing' | 'promotion' | 'referral';
  source_reference_id: string | null;
  contract_id: string | null;
  application_id: string | null;
  is_active: boolean;
  is_frozen: boolean;
  freeze_reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceCreditTransaction {
  id: string;
  credit_id: string;
  user_id: string;
  transaction_type: 'credit' | 'debit' | 'reversal' | 'freeze' | 'unfreeze';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  description_ar: string | null;
  service_id: string | null;
  service_name: string | null;
  order_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  failure_reason: string | null;
  created_at: string;
}

export interface ServiceCreditSummary {
  totalCredited: number;
  totalUsed: number;
  availableBalance: number;
  source: string;
  sourceAr: string;
  isActive: boolean;
  isFrozen: boolean;
  expiresAt: string | null;
}

/**
 * جلب رصيد خدمات المستخدم
 */
export async function getUserServiceCredit(userId: string): Promise<ServiceCredit | null> {
  const { data, error } = await supabase
    .from('service_credits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // لا يوجد رصيد
      return null;
    }
    console.error('Error fetching service credit:', error);
    throw error;
  }

  return data as ServiceCredit;
}

/**
 * جلب ملخص رصيد الخدمات
 */
export async function getServiceCreditSummary(userId: string): Promise<ServiceCreditSummary | null> {
  const credit = await getUserServiceCredit(userId);
  
  if (!credit) {
    return null;
  }

  // تحديد مصدر الرصيد
  const sourceLabels: Record<string, { en: string; ar: string }> = {
    financing: { en: 'Approved Service Financing', ar: 'تمويل خدمات معتمد' },
    promotion: { en: 'Promotional Credit', ar: 'رصيد ترويجي' },
    referral: { en: 'Referral Bonus', ar: 'مكافأة إحالة' },
  };

  const source = sourceLabels[credit.source_type] || { en: 'Service Credit', ar: 'رصيد خدمات' };

  return {
    totalCredited: Number(credit.total_credited),
    totalUsed: Number(credit.total_used),
    availableBalance: Number(credit.available_balance),
    source: source.en,
    sourceAr: source.ar,
    isActive: credit.is_active,
    isFrozen: credit.is_frozen,
    expiresAt: credit.expires_at,
  };
}

/**
 * جلب سجل حركات الرصيد
 */
export async function getServiceCreditTransactions(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    transactionType?: string;
  }
): Promise<{ transactions: ServiceCreditTransaction[]; total: number }> {
  let query = supabase
    .from('service_credit_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.transactionType) {
    query = query.eq('transaction_type', options.transactionType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching service credit transactions:', error);
    throw error;
  }

  return {
    transactions: (data || []) as ServiceCreditTransaction[],
    total: count || 0,
  };
}

/**
 * خصم رصيد الخدمات عند شراء خدمة
 */
export async function deductServiceCredit(params: {
  userId: string;
  amount: number;
  serviceId: string;
  serviceName: string;
  orderId: string;
}): Promise<{
  success: boolean;
  error?: string;
  messageAr?: string;
  transactionId?: string;
  newBalance?: number;
}> {
  const { data, error } = await supabase.rpc('deduct_service_credit', {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_service_id: params.serviceId,
    p_service_name: params.serviceName,
    p_order_id: params.orderId,
  });

  if (error) {
    console.error('Error deducting service credit:', error);
    return {
      success: false,
      error: 'database_error',
      messageAr: 'حدث خطأ في قاعدة البيانات',
    };
  }

  const result = data as {
    success: boolean;
    error?: string;
    message_ar?: string;
    transaction_id?: string;
    new_balance?: number;
  };

  return {
    success: result.success,
    error: result.error,
    messageAr: result.message_ar,
    transactionId: result.transaction_id,
    newBalance: result.new_balance,
  };
}

/**
 * التحقق من كفاية رصيد الخدمات
 */
export async function hasEnoughServiceCredit(
  userId: string,
  amount: number
): Promise<{ hasEnough: boolean; availableBalance: number }> {
  const credit = await getUserServiceCredit(userId);

  if (!credit || credit.is_frozen) {
    return { hasEnough: false, availableBalance: 0 };
  }

  const availableBalance = Number(credit.available_balance);
  return {
    hasEnough: availableBalance >= amount,
    availableBalance,
  };
}

/**
 * تسجيل محاولة استخدام غير مصرح بها
 */
export async function reportUnauthorizedAttempt(params: {
  userId: string;
  attemptedAction: 'withdraw' | 'transfer' | 'manual_entry' | 'external_use';
  attemptedAmount?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // جلب رصيد المستخدم
  const credit = await getUserServiceCredit(params.userId);

  if (!credit) {
    return;
  }

  const descriptions: Record<string, string> = {
    withdraw: 'محاولة سحب رصيد الخدمات - غير مسموح',
    transfer: 'محاولة تحويل رصيد الخدمات - غير مسموح',
    manual_entry: 'محاولة إدخال يدوي للرصيد - غير مسموح',
    external_use: 'محاولة استخدام الرصيد خارج نطاق الخدمات المحددة',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('service_credit_reviews') as any).insert({
    credit_id: credit.id,
    user_id: params.userId,
    review_type: 'unauthorized_attempt',
    description: descriptions[params.attemptedAction] || 'محاولة غير مصرح بها',
    attempted_action: params.attemptedAction,
    attempted_amount: params.attemptedAmount,
    metadata: params.metadata,
    status: 'pending',
  });

  if (error) {
    console.error('Error reporting unauthorized attempt:', error);
  }
}

/**
 * جلب رصيد الخدمات مع تفاصيل العقد
 */
export async function getServiceCreditWithContractDetails(userId: string): Promise<{
  credit: ServiceCredit | null;
  contractNumber: string | null;
  applicationNumber: string | null;
}> {
  const { data, error } = await supabase
    .from('service_credits')
    .select(`
      *,
      financing_contracts!contract_id (
        contract_number
      ),
      financing_applications!application_id (
        application_number
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { credit: null, contractNumber: null, applicationNumber: null };
    }
    console.error('Error fetching service credit with details:', error);
    throw error;
  }

  const result = data as ServiceCredit & {
    financing_contracts?: { contract_number: string } | null;
    financing_applications?: { application_number: string } | null;
  };

  return {
    credit: result,
    contractNumber: result.financing_contracts?.contract_number || null,
    applicationNumber: result.financing_applications?.application_number || null,
  };
}
