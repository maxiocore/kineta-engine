/**
 * MaxioCore Financing System v2 - Client Dashboard Page
 * صفحة التمويل للعميل - النسخة الجديدة
 */

import { lazy, Suspense } from 'react';
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout';
import { Loader2 } from 'lucide-react';

// Lazy load the main component
const ClientFinancingV2 = lazy(() => 
  import('@/components/financing/v2/client/ClientFinancingV2')
);

// Loading skeleton
function FinancingLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري تحميل بيانات التمويل...</p>
      </div>
    </div>
  );
}

export default function FinancingV2Page() {
  return (
    <Suspense fallback={<FinancingLoadingSkeleton />}>
      <ClientFinancingV2 />
    </Suspense>
  );
}
