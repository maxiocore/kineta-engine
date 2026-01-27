/**
 * MaxioCore Financing System v2 - User Role Hook
 * Hook للتحقق من صلاحيات المستخدم
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'admin' | 'client' | null;

interface UseUserRoleReturn {
  role: UserRole;
  isAdmin: boolean;
  isClient: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useUserRole(): UseUserRoleReturn {
  const { user } = useAuth();

  const { data: role, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserRole> => {
      if (!user?.id) return null;

      // Call the security definer function to get role
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      if (error) {
        console.error('Error fetching user role:', error);
        // Default to client if role not found
        return 'client';
      }

      return (data as UserRole) || 'client';
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    role: role ?? null,
    isAdmin: role === 'admin',
    isClient: role === 'client' || role === null,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Hook للتحقق من إمكانية تنفيذ إجراء معين
 */
export function useCanPerformAction(action: string): boolean {
  const { isAdmin } = useUserRole();
  
  // All admin actions require admin role
  const adminActions = [
    'update_amount',
    'update_duration',
    'update_name',
    'resend_contract',
    'resend_acknowledgment',
    'cancel_financing',
    'approve_offer',
    'issue_bond',
    'activate_credit',
    'version_contract',
  ];

  if (adminActions.includes(action)) {
    return isAdmin;
  }

  // Customer actions
  const customerActions = [
    'sign_acknowledgment',
    'sign_contract',
    'confirm_bond',
    'transfer_credit',
  ];

  if (customerActions.includes(action)) {
    return true; // Customers can always perform their own actions
  }

  return false;
}
