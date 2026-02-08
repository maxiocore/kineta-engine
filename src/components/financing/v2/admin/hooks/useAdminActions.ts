/**
 * MaxioCore Financing Admin V2 - Actions Hook
 * هوك إجراءات الأدمن مع دعم الإشعارات
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { AdminActionType } from '../types';
import type { FinancingStatus } from '../../types';
import { ADMIN_ACTIONS, type AdminActionConfig } from '../config/actionsConfig';
import { normalizeStatus } from '../../utils/statusNormalizer';
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

// Notification types for each action
const ACTION_NOTIFICATIONS: Record<string, { status: string; type: string }> = {
  send_acknowledgment: { status: 'ACK_SENT', type: 'acknowledgment_sent' },
  send_contract: { status: 'CONTRACT_SENT', type: 'contract_sent' },
  issue_bond: { status: 'BOND_ISSUING', type: 'bond_issuing' },
  activate_credit: { status: 'CREDIT_DEPOSITED', type: 'credit_activated' },
  decline_application: { status: 'REJECTED', type: 'application_rejected' },
  cancel_application: { status: 'CANCELLED', type: 'application_cancelled' },
};

export function useAdminActions(): UseAdminActionsReturn {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ applicationId, actionType, reason, metadata }: ExecuteActionParams) => {
      const action = ADMIN_ACTIONS[actionType];
      if (!action) throw new Error('Unknown action type');

      // Get current application with profile
      const { data: app, error: fetchError } = await supabase
        .from('financing_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;
      if (!app) throw new Error('Application not found');

      // Validate action is applicable - normalize the status first!
      const currentStatus = normalizeStatus(app.status);
      if (!action.applicableStatuses.includes(currentStatus)) {
        throw new Error(`الإجراء غير متاح للحالة الحالية: ${currentStatus}`);
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

        case 'activate_credit':
          // Call the credit deposit edge function
          try {
            const { data: depositResult, error: depositError } = await supabase.functions.invoke(
              'financing-credit-deposit',
              {
                body: {
                  application_id: applicationId,
                  actor_id: user?.id,
                }
              }
            );
            
            if (depositError) {
              console.error('Credit deposit error:', depositError);
              throw new Error('فشل تفعيل الرصيد');
            }
            
            console.log('Credit deposit result:', depositResult);
          } catch (err) {
            console.error('Credit activation failed:', err);
            // Continue with status update even if deposit fails
          }
          break;
      }

      // Update application
      const { error: updateError } = await supabase
        .from('financing_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Log to audit for important actions
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

      // Send notifications for applicable actions
      const notificationConfig = ACTION_NOTIFICATIONS[actionType];
      if (notificationConfig && app.phone) {
        try {
          // Send WhatsApp notification
          await supabase.functions.invoke('whatsapp-send', {
            body: {
              action: 'send_status',
              phone: app.phone,
              status: notificationConfig.status,
              applicationNumber: app.application_number,
              customerName: app.full_name,
              approvedAmount: app.approved_amount || app.requested_amount,
              rejectionReason: reason,
            }
          });
          console.log(`[V2] WhatsApp notification sent for ${actionType}`);
        } catch (notifyErr) {
          console.error('Notification error:', notifyErr);
          // Don't fail the action if notification fails
        }

        try {
          // Send Email notification
          await supabase.functions.invoke('financing-status-email', {
            body: {
              applicationId,
              applicationNumber: app.application_number, // مطلوب!
              status: notificationConfig.status,
              recipientEmail: app.email,
              recipientName: app.full_name,
              approvedAmount: app.approved_amount || app.requested_amount,
              rejectionReason: reason,
              baseUrl: 'https://ashholding.com',
            }
          });
          console.log(`[V2] Email notification sent for ${actionType}`);
        } catch (emailErr) {
          console.error('Email notification error:', emailErr);
        }
      }

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
