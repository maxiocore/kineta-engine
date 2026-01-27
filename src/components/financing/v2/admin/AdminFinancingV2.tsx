/**
 * MaxioCore Financing Admin V2 - Main Admin Dashboard
 * لوحة تحكم الأدمن الرئيسية - الإصدار الثاني
 */

import { useState } from 'react';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark } from 'lucide-react';
import {
  AdminStatsCards,
  AdminFiltersBar,
  ApplicationsTable,
  ApplicationDetailsPanel,
  useAdminFinancing,
} from '@/components/financing/v2/admin';
import type { AdminApplicationView } from '@/components/financing/v2/admin';

export function AdminFinancingV2() {
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

  const handleSelectApp = (app: AdminApplicationView) => {
    setSelectedApp(app);
  };

  const handleCloseDetails = () => {
    setSelectedApp(null);
    refetch(); // Refresh after closing
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
        </div>

        {/* Stats */}
        <AdminStatsCards stats={stats} isLoading={isLoading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className={selectedApp ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="space-y-4">
              {/* Filters */}
              <AdminFiltersBar
                filters={filters}
                onFilterChange={setFilters}
                onReset={resetFilters}
                onRefresh={refetch}
                isLoading={isLoading}
              />

              {/* Table */}
              <ApplicationsTable
                applications={applications}
                isLoading={isLoading}
                onSelect={handleSelectApp}
                selectedId={selectedApp?.id}
              />
            </div>
          </div>

          {/* Details Panel */}
          <AnimatePresence>
            {selectedApp && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="lg:col-span-1"
              >
                <ApplicationDetailsPanel
                  application={selectedApp}
                  onClose={handleCloseDetails}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AdminDashboardLayout>
  );
}

export default AdminFinancingV2;
