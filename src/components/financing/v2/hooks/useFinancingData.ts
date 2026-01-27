/**
 * MaxioCore Financing System v2 - Financing Data Hook
 * Hook لجلب بيانات التمويل للعميل
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { 
  FinancingApplication, 
  ServiceCredit, 
  FinancingInstallment,
  TimelineStep,
  CustomerAction,
  FinancingStatus,
} from '../types';
import { getStatusConfig, getStatusIndex, TIMELINE_ORDER } from '../config/statusConfig';

interface UseFinancingDataReturn {
  application: FinancingApplication | null;
  serviceCredit: ServiceCredit | null;
  installments: FinancingInstallment[];
  timelineSteps: TimelineStep[];
  customerActions: CustomerAction[];
  nextInstallment: FinancingInstallment | null;
  remainingBalance: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFinancingData(): UseFinancingDataReturn {
  const { user } = useAuth();

  // Fetch latest financing application
  const { 
    data: application, 
    isLoading: isLoadingApp, 
    error: appError,
    refetch: refetchApp,
  } = useQuery({
    queryKey: ['financing-application-v2', user?.id],
    queryFn: async (): Promise<FinancingApplication | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('financing_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as FinancingApplication | null;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch service credit balance
  const { 
    data: serviceCredit, 
    isLoading: isLoadingCredit,
    refetch: refetchCredit,
  } = useQuery({
    queryKey: ['service-credit-v2', user?.id],
    queryFn: async (): Promise<ServiceCredit | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('service_credits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ServiceCredit | null;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Fetch installments
  const { 
    data: installments = [], 
    isLoading: isLoadingInstallments,
    refetch: refetchInstallments,
  } = useQuery({
    queryKey: ['financing-installments-v2', application?.id],
    queryFn: async (): Promise<FinancingInstallment[]> => {
      if (!application?.id) return [];

      const { data, error } = await supabase
        .from('financing_installments')
        .select('*')
        .eq('application_id', application.id)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      return (data || []) as FinancingInstallment[];
    },
    enabled: !!application?.id,
    staleTime: 60 * 1000,
  });

  // Build timeline steps based on current status
  const timelineSteps: TimelineStep[] = buildTimelineSteps(
    (application?.status as FinancingStatus) || 'DRAFT'
  );

  // Get customer actions based on current status
  const customerActions: CustomerAction[] = getCustomerActions(
    (application?.status as FinancingStatus) || 'DRAFT'
  );

  // Get next pending installment
  const nextInstallment = installments.find(i => i.status === 'pending') || null;

  // Calculate remaining balance
  const remainingBalance = installments
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // Combined refetch function
  const refetch = async () => {
    await Promise.all([
      refetchApp(),
      refetchCredit(),
      refetchInstallments(),
    ]);
  };

  return {
    application,
    serviceCredit,
    installments,
    timelineSteps,
    customerActions,
    nextInstallment,
    remainingBalance,
    isLoading: isLoadingApp || isLoadingCredit || isLoadingInstallments,
    error: appError as Error | null,
    refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

function buildTimelineSteps(currentStatus: FinancingStatus): TimelineStep[] {
  const currentIndex = getStatusIndex(currentStatus);
  const isTerminal = ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(currentStatus);

  // For terminal negative states, show abbreviated timeline
  if (isTerminal && currentStatus !== 'COMPLETED') {
    const config = getStatusConfig(currentStatus);
    return [{
      id: currentStatus,
      status: currentStatus,
      label: config.nameAr,
      description: config.descriptionAr,
      phase: config.phase,
      isCompleted: false,
      isCurrent: true,
      isUpcoming: false,
      icon: config.icon,
    }];
  }

  // Show 5 steps around current status
  const startIndex = Math.max(0, currentIndex - 2);
  const endIndex = Math.min(TIMELINE_ORDER.length, startIndex + 5);
  const visibleStatuses = TIMELINE_ORDER.slice(startIndex, endIndex);

  return visibleStatuses.map((status): TimelineStep => {
    const config = getStatusConfig(status);
    const statusIndex = getStatusIndex(status);
    
    return {
      id: status,
      status,
      label: config.nameAr,
      description: config.descriptionAr,
      phase: config.phase,
      isCompleted: statusIndex < currentIndex,
      isCurrent: status === currentStatus,
      isUpcoming: statusIndex > currentIndex,
      icon: config.icon,
    };
  });
}

function getCustomerActions(status: FinancingStatus): CustomerAction[] {
  const actions: CustomerAction[] = [];

  switch (status) {
    case 'ACK_PENDING':
      actions.push({
        id: 'sign-ack',
        type: 'sign_acknowledgment',
        label: 'وقّع الإقرار',
        description: 'قراءة وتوقيع إقرار الشروط والأحكام',
        isPrimary: true,
        isEnabled: true,
        icon: 'FileCheck',
      });
      break;
    
    case 'CONTRACT_PENDING':
      actions.push({
        id: 'sign-contract',
        type: 'sign_contract',
        label: 'وقّع العقد',
        description: 'قراءة وتوقيع عقد التمويل',
        isPrimary: true,
        isEnabled: true,
        icon: 'FileText',
      });
      break;
    
    case 'BOND_PENDING':
      actions.push({
        id: 'confirm-bond',
        type: 'confirm_bond',
        label: 'تأكيد توقيع السند',
        description: 'تأكيد توقيع سند الأمر في نافذ',
        isPrimary: true,
        isEnabled: true,
        icon: 'Stamp',
      });
      break;
    
    case 'CREDIT_ACTIVE':
      actions.push({
        id: 'transfer-credit',
        type: 'transfer_credit',
        label: 'تحويل إلى رصيد الخدمات',
        description: 'تحويل الرصيد لاستخدامه في شراء الخدمات',
        isPrimary: true,
        isEnabled: true,
        icon: 'ArrowLeftRight',
      });
      actions.push({
        id: 'use-credit',
        type: 'use_credit',
        label: 'استخدم الرصيد',
        description: 'تصفح الخدمات واستخدم رصيدك',
        isPrimary: false,
        isEnabled: true,
        icon: 'ShoppingCart',
      });
      break;
  }

  return actions;
}
