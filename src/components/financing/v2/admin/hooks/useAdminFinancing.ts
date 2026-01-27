/**
 * MaxioCore Financing Admin V2 - Main Data Hook
 * هوك البيانات الرئيسي للأدمن
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AdminFilters, AdminStats, AdminApplicationView, DEFAULT_FILTERS } from '../types';
import type { FinancingStatus } from '../../types';

interface UseAdminFinancingReturn {
  applications: AdminApplicationView[];
  stats: AdminStats;
  filters: AdminFilters;
  setFilters: (filters: Partial<AdminFilters>) => void;
  resetFilters: () => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const DEFAULT_ADMIN_FILTERS: AdminFilters = {
  status: 'all',
  search: '',
  sortBy: 'submitted_at',
  sortOrder: 'desc',
};

export function useAdminFinancing(): UseAdminFinancingReturn {
  const [filters, setFiltersState] = useState<AdminFilters>(DEFAULT_ADMIN_FILTERS);

  // Fetch applications
  const { 
    data: applications = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin-financing-v2', filters],
    queryFn: async () => {
      let query = supabase
        .from('financing_applications')
        .select(`
          *,
          financing_plans (name_ar, installments_count, duration_months)
        `)
        .order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      // Status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Search filter
      if (filters.search) {
        query = query.or(`
          full_name.ilike.%${filters.search}%,
          application_number.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%,
          phone.ilike.%${filters.search}%,
          national_id.ilike.%${filters.search}%
        `);
      }

      // Date filters
      if (filters.dateFrom) {
        query = query.gte('submitted_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('submitted_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform to AdminApplicationView
      return (data || []).map((app: any) => ({
        ...app,
        status: app.status as FinancingStatus,
        contract_version: app.contract_version || 1,
        plan_name_ar: app.financing_plans?.name_ar,
        plan_installments_count: app.financing_plans?.installments_count,
        plan_duration_months: app.financing_plans?.duration_months,
      })) as AdminApplicationView[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch stats
  const { data: stats = getDefaultStats() } = useQuery({
    queryKey: ['admin-financing-stats-v2'],
    queryFn: async () => {
      const { data } = await supabase
        .from('financing_applications')
        .select('status, requested_amount, approved_amount, submitted_at');

      if (!data) return getDefaultStats();

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const pending = data.filter(a => 
        ['SUBMITTED', 'UNDER_REVIEW', 'OFFER_READY'].includes(a.status)
      ).length;

      const active = data.filter(a => 
        ['CREDIT_ACTIVE'].includes(a.status)
      ).length;

      const completed = data.filter(a => a.status === 'COMPLETED').length;
      const declined = data.filter(a => a.status === 'DECLINED').length;

      const totalFinanced = data
        .filter(a => ['CREDIT_ACTIVE', 'COMPLETED'].includes(a.status))
        .reduce((sum, a) => sum + (a.approved_amount || 0), 0);

      const thisMonthApps = data.filter(a => 
        new Date(a.submitted_at) >= thisMonth
      ).length;

      const totalDecisions = completed + declined;
      const approvalRate = totalDecisions > 0 
        ? Math.round((completed / totalDecisions) * 100) 
        : 0;

      return {
        totalApplications: data.length,
        pendingReview: pending,
        activeFinancing: active,
        totalFinanced,
        thisMonthApplications: thisMonthApps,
        approvalRate,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const setFilters = useCallback((newFilters: Partial<AdminFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_ADMIN_FILTERS);
  }, []);

  return {
    applications,
    stats: stats || getDefaultStats(),
    filters,
    setFilters,
    resetFilters,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

function getDefaultStats(): AdminStats {
  return {
    totalApplications: 0,
    pendingReview: 0,
    activeFinancing: 0,
    totalFinanced: 0,
    thisMonthApplications: 0,
    approvalRate: 0,
  };
}
