/**
 * ASH HOLDING Financing Admin V2 - Main Admin Dashboard
 * لوحة تحكم الأدمن الرئيسية - الإصدار المحسّن
 */

import { useState, useEffect } from 'react';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  AdminStatsCards,
  AdminFiltersBar,
  ApplicationsTable,
  ApplicationDetailsPanel,
  useAdminFinancing,
} from '@/components/financing/v2/admin';
import type { AdminApplicationView } from '@/components/financing/v2/admin';

export function AdminFinancingV2() {
  const queryClient = useQueryClient();
  const {
    applications,
    stats,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    refetch,
  } = useAdminFinancing();

  const [selectedApp, setSelectedApp] = useState<AdminApplicationView | null>(null);

  // Real-time subscription for instant sync with client dashboard
  useEffect(() => {
    const channel = supabase
      .channel('admin-financing-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financing_applications',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-financing-v2'] });
          queryClient.invalidateQueries({ queryKey: ['admin-financing-stats-v2'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'financing_activity_log',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Keep selectedApp in sync with refreshed data
  useEffect(() => {
    if (selectedApp && applications.length > 0) {
      const updated = applications.find(a => a.id === selectedApp.id);
      if (updated && updated.status !== selectedApp.status) {
        setSelectedApp(updated);
      }
    }
  }, [applications, selectedApp]);

  const handleSelectApp = (app: AdminApplicationView) => {
    setSelectedApp(app);
  };

  const handleCloseDetails = () => {
    setSelectedApp(null);
    refetch();
  };

  return (
    <AdminDashboardLayout>
      <motion.div
        className="p-6 space-y-6"
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">إدارة التمويل</h1>
              <p className="text-muted-foreground text-sm">
                مراجعة وإدارة طلبات تمويل الخدمات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.pendingReview > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {stats.pendingReview} بانتظار المراجعة
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <AdminStatsCards stats={stats} isLoading={isLoading} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Applications List */}
          <div className={selectedApp ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <div className="space-y-4">
              <AdminFiltersBar
                filters={filters}
                onFilterChange={setFilters}
                onReset={resetFilters}
                onRefresh={refetch}
                isLoading={isLoading}
              />
              <ApplicationsTable
                applications={applications}
                isLoading={isLoading}
                onSelect={handleSelectApp}
                selectedId={selectedApp?.id}
              />
            </div>
          </div>

          {/* Details Panel - wider for better UX */}
          <AnimatePresence>
            {selectedApp && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="lg:col-span-5"
              >
                <div className="sticky top-6">
                  <ApplicationDetailsPanel
                    application={selectedApp}
                    onClose={handleCloseDetails}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AdminDashboardLayout>
  );
}

export default AdminFinancingV2;
