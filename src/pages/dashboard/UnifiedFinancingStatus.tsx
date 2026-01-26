/**
 * صفحة حالة التمويل الموحدة
 * Unified Financing Status Page Wrapper
 * 
 * يدعم Deep Link من الإيميل والواتساب
 */

import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { UnifiedStatusPage } from "@/components/financing/status/UnifiedStatusPage";

export default function UnifiedFinancingStatus() {
  return (
    <ClientDashboardLayout>
      <UnifiedStatusPage />
    </ClientDashboardLayout>
  );
}
