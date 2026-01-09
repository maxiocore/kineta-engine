import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { FinancingStatusTimeline } from './FinancingStatusTimeline';
import { FinancingStatusCard } from './FinancingStatusCard';
import { FinancingActivityLog, statusChangeToActivity } from './FinancingActivityLog';
import { FinancingStatusPageSkeleton } from './FinancingStatusSkeleton';
import { FinancingApplicationStatus } from '@/lib/financing/stateMachine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FinancingApplication {
  id: string;
  application_number: string;
  status: FinancingApplicationStatus;
  approved_amount: number | null;
  updated_at: string;
  created_at: string;
}

interface StatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  notes: string | null;
  created_at: string;
}

interface FinancingStatusViewProps {
  applicationId: string;
  className?: string;
}

export function FinancingStatusView({ applicationId, className }: FinancingStatusViewProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<FinancingApplication | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);

  useEffect(() => {
    fetchApplicationData();
    
    // الاستماع للتحديثات في الوقت الحقيقي
    const channel = supabase
      .channel(`financing-status-${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'financing_applications',
          filter: `id=eq.${applicationId}`
        },
        (payload) => {
          setApplication(prev => prev ? { ...prev, ...payload.new } as FinancingApplication : null);
          toast.success('تم تحديث حالة الطلب');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId]);

  async function fetchApplicationData() {
    try {
      setLoading(true);

      // جلب بيانات الطلب
      const { data: appData, error: appError } = await supabase
        .from('financing_applications')
        .select('id, application_number, status, approved_amount, updated_at, created_at')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;
      
      // تعيين الحالة الافتراضية إذا كانت فارغة
      const validStatus = (appData.status as FinancingApplicationStatus) || 'DRAFT';
      setApplication({ ...appData, status: validStatus } as FinancingApplication);

      // جلب سجل الحالات - نستخدم جدول مختلف أو نحاكي البيانات
      // في الإنتاج، ستكون هذه البيانات من جدول order_status_history أو مشابه
      const mockHistory: StatusHistory[] = [
        {
          id: '1',
          old_status: null,
          new_status: 'SUBMITTED',
          changed_by: 'customer',
          notes: 'تم تقديم الطلب',
          created_at: appData.created_at
        }
      ];
      
      if (appData.status !== 'DRAFT' && appData.status !== 'SUBMITTED') {
        mockHistory.push({
          id: '2',
          old_status: 'SUBMITTED',
          new_status: appData.status,
          changed_by: 'system',
          notes: null,
          created_at: appData.updated_at
        });
      }

      setStatusHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('حدث خطأ في تحميل بيانات الطلب');
    } finally {
      setLoading(false);
    }
  }

  function handleAction(action: string) {
    switch (action) {
      case 'continue':
        navigate(`/dashboard/financing/apply?resume=${applicationId}`);
        break;
      case 'upload_documents':
        navigate(`/dashboard/financing/documents/${applicationId}`);
        break;
      case 'view_contract':
        navigate(`/dashboard/financing/contract/${applicationId}`);
        break;
      case 'use_credit':
        navigate('/dashboard/services');
        break;
      case 'new_application':
        navigate('/dashboard/financing/apply');
        break;
      case 'cancel':
        handleCancelApplication();
        break;
    }
  }

  async function handleCancelApplication() {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء الطلب؟')) return;

    try {
      const { error } = await supabase
        .from('financing_applications')
        .update({ status: 'cancelled' })
        .eq('id', applicationId);

      if (error) throw error;
      
      toast.success('تم إلغاء الطلب بنجاح');
      setApplication(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast.error('حدث خطأ في إلغاء الطلب');
    }
  }

  if (loading) {
    return <FinancingStatusPageSkeleton />;
  }

  if (!application) {
    return (
      <div className="text-center py-12" dir="rtl">
        <p className="text-muted-foreground">لم يتم العثور على الطلب</p>
      </div>
    );
  }

  const activityEntries = statusHistory.map(entry => statusChangeToActivity({
    id: entry.id,
    fromStatus: entry.old_status,
    toStatus: entry.new_status,
    changedBy: entry.changed_by,
    notes: entry.notes || undefined,
    createdAt: entry.created_at
  }));

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={application.status}
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-6" dir="rtl">
          {/* Timeline */}
          <Card>
            <CardContent className="pt-6">
              <FinancingStatusTimeline currentStatus={application.status} />
            </CardContent>
          </Card>

          {/* المحتوى الرئيسي */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* بطاقة الحالة */}
            <div className="lg:col-span-2">
              <FinancingStatusCard
                applicationNumber={application.application_number}
                status={application.status}
                updatedAt={application.updated_at}
                approvedAmount={application.approved_amount || undefined}
                onAction={handleAction}
              />
            </div>

            {/* سجل التحديثات */}
            <div>
              <Card>
                <CardContent className="pt-6">
                  <FinancingActivityLog entries={activityEntries} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
