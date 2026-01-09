/**
 * هوك رصيد الخدمات
 * Service Credit Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import {
  getUserServiceCredit,
  getServiceCreditSummary,
  getServiceCreditTransactions,
  deductServiceCredit,
  hasEnoughServiceCredit,
  reportUnauthorizedAttempt,
  getServiceCreditWithContractDetails,
  type ServiceCredit,
  type ServiceCreditSummary,
  type ServiceCreditTransaction,
} from '@/lib/financing/serviceCreditService';

export function useServiceCredit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // جلب ملخص الرصيد
  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['service-credit-summary', userId],
    queryFn: () => getServiceCreditSummary(userId!),
    enabled: !!userId,
    staleTime: 30000, // 30 ثانية
  });

  // جلب الرصيد الكامل مع التفاصيل
  const {
    data: creditDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ['service-credit-details', userId],
    queryFn: () => getServiceCreditWithContractDetails(userId!),
    enabled: !!userId,
    staleTime: 30000,
  });

  // جلب سجل الحركات
  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['service-credit-transactions', userId],
    queryFn: () => getServiceCreditTransactions(userId!, { limit: 50 }),
    enabled: !!userId,
    staleTime: 30000,
  });

  // خصم الرصيد
  const deductMutation = useMutation({
    mutationFn: (params: {
      amount: number;
      serviceId: string;
      serviceName: string;
      orderId: string;
    }) =>
      deductServiceCredit({
        userId: userId!,
        ...params,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-credit-summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['service-credit-details', userId] });
      queryClient.invalidateQueries({ queryKey: ['service-credit-transactions', userId] });
    },
  });

  // التحقق من كفاية الرصيد
  const checkBalance = async (amount: number) => {
    if (!userId) return { hasEnough: false, availableBalance: 0 };
    return hasEnoughServiceCredit(userId, amount);
  };

  // تسجيل محاولة غير مصرح بها
  const reportUnauthorized = async (
    attemptedAction: 'withdraw' | 'transfer' | 'manual_entry' | 'external_use',
    attemptedAmount?: number,
    metadata?: Record<string, unknown>
  ) => {
    if (!userId) return;
    await reportUnauthorizedAttempt({
      userId,
      attemptedAction,
      attemptedAmount,
      metadata,
    });
  };

  // الاشتراك في التحديثات الفورية
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`service-credits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_credits',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refetchSummary();
          queryClient.invalidateQueries({ queryKey: ['service-credit-details', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_credit_transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refetchSummary();
          refetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, refetchSummary, refetchTransactions]);

  return {
    // البيانات
    summary,
    credit: creditDetails?.credit,
    contractNumber: creditDetails?.contractNumber,
    applicationNumber: creditDetails?.applicationNumber,
    transactions: transactionsData?.transactions || [],
    totalTransactions: transactionsData?.total || 0,

    // حالة التحميل
    isLoading: isSummaryLoading || isDetailsLoading,
    isTransactionsLoading,

    // الأخطاء
    error: summaryError || detailsError,
    transactionsError,

    // العمليات
    deductCredit: deductMutation.mutateAsync,
    isDeducting: deductMutation.isPending,
    checkBalance,
    reportUnauthorized,

    // إعادة الجلب
    refetch: () => {
      refetchSummary();
      refetchTransactions();
    },

    // هل يوجد رصيد؟
    hasCredit: !!summary && summary.availableBalance > 0,
    availableBalance: summary?.availableBalance || 0,
    isFrozen: summary?.isFrozen || false,
  };
}

export type { ServiceCredit, ServiceCreditSummary, ServiceCreditTransaction };
