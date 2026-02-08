/**
 * صفحة تأكيد توقيع سند الأمر
 * Bond Signing Confirmation Page
 * v2 - rebuild trigger
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExecutiveBondTracker } from '@/components/financing/bond/ExecutiveBondTracker';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { ExecutiveBondStatus } from '@/lib/financing/stateMachine/v2/bondStates';

export default function ConfirmBond() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bondStatus, setBondStatus] = useState<ExecutiveBondStatus>('NOT_ISSUED');
  const [bondId, setBondId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplication() {
      if (!applicationId) {
        setError('معرّف الطلب غير صحيح');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('financing_applications')
          .select('id, executive_bond_state, executive_bond_id, status')
          .eq('id', applicationId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('لم يتم العثور على طلب التمويل');
          setLoading(false);
          return;
        }

        setBondStatus((data.executive_bond_state as ExecutiveBondStatus) || 'NOT_ISSUED');
        setBondId(data.executive_bond_id || undefined);
      } catch (err: any) {
        console.error('Error loading application for bond:', err);
        setError(err.message || 'حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, [applicationId]);

  const handleStatusChange = (newStatus: ExecutiveBondStatus) => {
    setBondStatus(newStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل بيانات السند...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" onClick={() => navigate('/dashboard/financing')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للوحة التمويل
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/financing')}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">تأكيد توقيع سند الأمر</h1>
            <p className="text-sm text-muted-foreground">
              قم بتوقيع السند عبر منصة نافذ ثم أكد التوقيع هنا
            </p>
          </div>
        </div>

        {/* Bond Tracker */}
        {applicationId && (
          <ExecutiveBondTracker
            applicationId={applicationId}
            bondId={bondId}
            currentStatus={bondStatus}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
}
