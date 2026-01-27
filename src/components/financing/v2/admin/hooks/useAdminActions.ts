/**
 * MaxioCore Financing Admin V2 - Actions Hook
 * هوك إجراءات الأدمن
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { AdminActionType } from '../types';
import type { FinancingStatus } from '../../types';
import { ADMIN_ACTIONS, type AdminActionConfig } from '../config/actionsConfig';
import type { Json } from '@/integrations/supabase/types';

interface ExecuteActionParams {
  applicationId: string;
  actionType: AdminActionType;
  reason?: string;
  metadata?: Record<string, unknown>;
}

interface UseAdminActionsReturn {
  executeAction: (params: ExecuteActionParams) => Promise<{ action: AdminActionConfig; newStatus: unknown }>;
  isExecuting: boolean;
}

export function useAdminActions(): UseAdminActionsReturn {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ applicationId, actionType, reason, metadata }: ExecuteActionParams) => {
      const action = ADMIN_ACTIONS[actionType];
      if (!action) throw new Error('Unknown action type');

      // Get current application
      const { data: app, error: fetchError } = await supabase
        .from('financing_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;
      if (!app) throw new Error('Application not found');

      // Validate action is applicable
      const currentStatus = app.status as FinancingStatus;
      if (!action.applicableStatuses.includes(currentStatus)) {
        throw new Error(`الإجراء غير متاح للحالة الحالية`);
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Set target status if applicable
      if (action.targetStatus) {
        updateData.status = action.targetStatus;
        updateData.phase_updated_at = new Date().toISOString();
      }

      // Handle specific actions
      switch (actionType) {
        case 'review_application':
          updateData.reviewed_at = new Date().toISOString();
          updateData.reviewed_by = user?.id;
          break;
          
        case 'decline_application':
        case 'cancel_application':
          updateData.cancelled_at = new Date().toISOString();
          updateData.cancelled_by = user?.id;
          updateData.cancellation_reason = reason;
          break;
          
        case 'update_amount':
          if (metadata?.amount) {
            updateData.approved_amount = metadata.amount;
            // Increment contract version for material changes
            updateData.contract_version = (app.contract_version || 1) + 1;
          }
          break;
          
        case 'update_installments':
          if (metadata?.installments) {
            updateData.contract_override_installments = metadata.installments;
            updateData.contract_version = (app.contract_version || 1) + 1;
          }
          break;
      }

      // Update application
      const { error: updateError } = await supabase
        .from('financing_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Log to audit
      if (action.requiresReason || ['update_amount', 'update_installments', 'cancel_application', 'decline_application'].includes(actionType)) {
        await supabase.from('financing_admin_audit').insert([{
          application_id: applicationId,
          admin_id: user?.id || '',
          action_type: actionType.toUpperCase(),
          old_value: { status: currentStatus } as unknown as Json,
          new_value: JSON.parse(JSON.stringify(updateData)) as Json,
          reason: reason || action.nameAr,
          contract_version: (updateData.contract_version as number) || app.contract_version,
        }]);
      }

      // Log activity
      await supabase.from('financing_activity_log').insert([{
        application_id: applicationId,
        event_type: `admin_${actionType}`,
        from_status: currentStatus,
        to_status: (updateData.status as string) || currentStatus,
        triggered_by: 'admin',
        actor_id: user?.id,
        reason,
        is_visible_to_customer: !['update_amount', 'update_installments'].includes(actionType),
      }]);

      return { action, newStatus: updateData.status };
    },
    onSuccess: ({ action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-financing-v2'] });
      queryClient.invalidateQueries({ queryKey: ['admin-financing-stats-v2'] });
      toast.success(`تم: ${action.nameAr}`);
    },
    onError: (error: Error) => {
      console.error('Admin action error:', error);
      toast.error(error.message || 'حدث خطأ أثناء تنفيذ الإجراء');
    },
  });

  return {
    executeAction: mutation.mutateAsync,
    isExecuting: mutation.isPending,
  };
}
