/**
 * ASH HOLDING Financing System v3 - Client Dashboard Page
 * صفحة التمويل للعميل - النسخة الجديدة (FinTech Style)
 */

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the V3 component
const ClientFinancingV3 = lazy(() => 
  import('@/components/financing/v3/ClientFinancingV3')
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
      <ClientFinancingV3 />
    </Suspense>
  );
}
