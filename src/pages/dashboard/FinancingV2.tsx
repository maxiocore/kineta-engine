/**
 * MaxioCore Financing System v2 - Client Dashboard Page
 * صفحة التمويل للعميل - النسخة الجديدة
 */

import { lazy } from 'react';

// Lazy load the main component
const ClientFinancingV2 = lazy(() => 
  import('@/components/financing/v2/client/ClientFinancingV2')
);

export default function FinancingV2Page() {
  return <ClientFinancingV2 />;
}
