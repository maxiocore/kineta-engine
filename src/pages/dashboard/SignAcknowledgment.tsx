/**
 * صفحة توقيع إقرار الشروط والأحكام
 * Sign Acknowledgment Page
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AcknowledgmentViewer } from '@/components/financing/acknowledgment/AcknowledgmentViewer';
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SignAcknowledgment() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!applicationId) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <p className="text-muted-foreground">لم يتم تحديد الطلب</p>
          <Button onClick={() => navigate('/dashboard/financing')} variant="outline" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للتمويل
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!user) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/financing')}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            العودة
          </Button>
        </div>

        <AcknowledgmentViewer
          applicationId={applicationId}
          onSigned={() => {
            toast.success('تم توقيع الإقرار بنجاح! سيتم تحديث حالة طلبك.');
            navigate('/dashboard/financing');
          }}
        />
      </div>
    </ClientDashboardLayout>
  );
}
