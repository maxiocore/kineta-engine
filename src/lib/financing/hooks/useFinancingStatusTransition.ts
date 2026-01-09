/**
 * Hook لاستخدام نظام أحداث تغيير الحالة
 * useFinancingStatusTransition Hook
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FinancingApplicationStatus, TransitionTrigger } from '../stateMachine/types';
import { validateTransition } from '../stateMachine/validator';
import { handleStatusTransition } from '../events/eventEmitter';
import { EventProcessingResult } from '../events/types';
import { toast } from 'sonner';

interface TransitionOptions {
  reason?: string;
  metadata?: Record<string, unknown>;
  showToast?: boolean;
}

interface UseFinancingStatusTransitionResult {
  isTransitioning: boolean;
  lastResult: EventProcessingResult | null;
  transition: (
    applicationId: string,
    fromStatus: FinancingApplicationStatus,
    toStatus: FinancingApplicationStatus,
    triggeredBy: TransitionTrigger,
    options?: TransitionOptions
  ) => Promise<EventProcessingResult>;
  updateStatusOnly: (
    applicationId: string,
    newStatus: FinancingApplicationStatus
  ) => Promise<boolean>;
}

/**
 * Hook لإدارة انتقالات الحالة مع الأحداث
 */
export function useFinancingStatusTransition(): UseFinancingStatusTransitionResult {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastResult, setLastResult] = useState<EventProcessingResult | null>(null);

  /**
   * تنفيذ انتقال الحالة مع الأحداث
   */
  const transition = useCallback(async (
    applicationId: string,
    fromStatus: FinancingApplicationStatus,
    toStatus: FinancingApplicationStatus,
    triggeredBy: TransitionTrigger,
    options?: TransitionOptions
  ): Promise<EventProcessingResult> => {
    setIsTransitioning(true);

    try {
      // 1. التحقق من صحة الانتقال
      const validation = validateTransition(fromStatus, toStatus, triggeredBy);
      if (!validation.valid) {
        const result: EventProcessingResult = {
          success: false,
          errors: [validation.errorAr || validation.error || 'Invalid transition']
        };
        setLastResult(result);
        
        if (options?.showToast !== false) {
          toast.error(validation.errorAr || 'فشل تغيير الحالة');
        }
        
        return result;
      }

      // 2. الحصول على معرف المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      const actorId = user?.id;

      // 3. تحديث الحالة في قاعدة البيانات
      const { error: updateError } = await supabase
        .from('financing_applications')
        .update({
          status: toStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) {
        const result: EventProcessingResult = {
          success: false,
          errors: [`Database update failed: ${updateError.message}`]
        };
        setLastResult(result);
        
        if (options?.showToast !== false) {
          toast.error('فشل تحديث الحالة في قاعدة البيانات');
        }
        
        return result;
      }

      // 4. إرسال الحدث (Activity Log + Email)
      const eventResult = await handleStatusTransition(
        applicationId,
        fromStatus,
        toStatus,
        triggeredBy,
        {
          actorId,
          reason: options?.reason,
          metadata: options?.metadata
        }
      );

      setLastResult(eventResult);

      // 5. إظهار Toast
      if (options?.showToast !== false) {
        if (eventResult.success) {
          toast.success('تم تغيير الحالة بنجاح');
        } else {
          toast.warning('تم تغيير الحالة لكن بعض الإشعارات قد لم ترسل');
        }
      }

      return eventResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: EventProcessingResult = {
        success: false,
        errors: [errorMessage]
      };
      setLastResult(result);

      if (options?.showToast !== false) {
        toast.error('حدث خطأ أثناء تغيير الحالة');
      }

      return result;
    } finally {
      setIsTransitioning(false);
    }
  }, []);

  /**
   * تحديث الحالة فقط بدون أحداث (للاستخدام الداخلي)
   */
  const updateStatusOnly = useCallback(async (
    applicationId: string,
    newStatus: FinancingApplicationStatus
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('financing_applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      return !error;
    } catch {
      return false;
    }
  }, []);

  return {
    isTransitioning,
    lastResult,
    transition,
    updateStatusOnly
  };
}
