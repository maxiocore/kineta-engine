/**
 * ASH HOLDING Financing System v3 - Main Client Dashboard
 * لوحة تمويل العميل - FinTech iOS-First RTL (Redesigned)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  ChevronLeft,
  FileText,
  HelpCircle,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react';
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancingData } from '../v2/hooks/useFinancingData';
import {
  FinancingHeroCard,
  FinancingStatsCards,
  FinancingTimeline,
  CompactTimeline,
  QuickActions,
  ActivityLog,
  WalletCard,
  InstallmentsProgress,
  RTLSegmentedControl,
  NextActionCard,
  FinancingPageSkeleton,
  type SegmentItem,
} from './components';
import { EligibilitySection } from './components/EligibilitySection';
import { 
  rtlPageVariants,
  StaggerContainer,
  StaggerItem,
} from './components/PageTransition';
import { InstallmentsTableV2 } from '../v2/client/InstallmentsTableV2';
import { DocumentsViewer } from '../v2/client/DocumentsViewer';
import type { CustomerAction, FinancingStatus, FinancingStats } from './types';
import { toast } from 'sonner';
import { useEligibilityMachine } from '@/hooks/useEligibilityMachine';

type TabValue = 'overview' | 'status' | 'wallet' | 'documents';

const TABS: SegmentItem[] = [
  { id: 'overview', label: 'نظرة عامة', icon: undefined },
  { id: 'status', label: 'حالة الطلب', icon: undefined },
  { id: 'wallet', label: 'رصيد الخدمات', icon: undefined },
  { id: 'documents', label: 'المستندات', icon: undefined },
];

export default function ClientFinancingV3() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingActionId, setProcessingActionId] = useState<string>();

  const {
    application,
    serviceCredit,
    installments,
    timelineSteps,
    customerActions,
    nextInstallment,
    remainingBalance,
    isLoading,
    error,
    refetch,
  } = useFinancingData();

  const { canApply } = useEligibilityMachine();

  // Stats calculation
  const stats: FinancingStats = {
    totalApproved: application?.approved_amount ?? application?.requested_amount ?? 0,
    totalUsed: serviceCredit?.total_used ?? 0,
    availableBalance: serviceCredit?.available_balance ?? 0,
    nextInstallmentAmount: nextInstallment ? Number(nextInstallment.amount) : 0,
    nextInstallmentDate: nextInstallment?.due_date ?? null,
    totalInstallments: installments.length,
    paidInstallments: installments.filter(i => i.status === 'paid').length,
    overdueInstallments: installments.filter(i => i.status === 'overdue').length,
  };

  // Action handler
  const handleAction = async (action: CustomerAction) => {
    setIsProcessing(true);
    setProcessingActionId(action.id);
    try {
      switch (action.type) {
        case 'sign_acknowledgment':
          navigate(`/dashboard/financing/sign-acknowledgment/${application?.id}`);
          break;
        case 'sign_contract':
          navigate(`/dashboard/financing/sign-contract/${application?.id}`);
          break;
        case 'confirm_bond':
          navigate(`/dashboard/financing/confirm-bond/${application?.id}`);
          break;
        case 'transfer_credit':
          navigate('/dashboard/financing/transfer');
          break;
        case 'use_credit':
          navigate('/dashboard/services');
          break;
        default:
          toast.info('هذا الإجراء قيد التطوير');
      }
    } catch {
      toast.error('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsProcessing(false);
      setProcessingActionId(undefined);
    }
  };

  const handlePrimaryAction = () => {
    const primaryAction = customerActions.find(a => a.isPrimary);
    if (primaryAction) handleAction(primaryAction);
  };

  const currentStatus = (application?.status as FinancingStatus) || 'DRAFT';
  const isActiveCredit = currentStatus === 'CREDIT_ACTIVE' || currentStatus === 'COMPLETED';
  const canTransfer = isActiveCredit && (serviceCredit?.available_balance ?? 0) > 0;
  const primaryAction = customerActions.find(a => a.isPrimary);
  const isTerminalNegative = ['DECLINED', 'CANCELLED'].includes(currentStatus);

  // Loading
  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="pb-8" dir="rtl">
          <FinancingPageSkeleton />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <motion.div
        className="min-h-screen pb-8"
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h1 className="text-2xl lg:text-[28px] font-extrabold text-foreground tracking-tight">
                تمويل الخدمات
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                إدارة تمويلك ومتابعة حالة الطلبات
              </p>
            </div>

            {/* New Application Button - shown when has terminated/declined app or eligible */}
            {application && isTerminalNegative && canApply() && (
              <Button
                size="lg"
                onClick={() => navigate('/dashboard/financing/apply')}
                className="gap-2 shadow-lg shadow-primary/15 rounded-xl h-11"
              >
                <Plus className="w-4 h-4" />
                طلب تمويل جديد
              </Button>
            )}

            {/* Refresh */}
            {application && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="shrink-0 sm:hidden"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* No Application - Show Eligibility */}
          {!application && (
            <motion.div key="eligibility" variants={rtlPageVariants} initial="initial" animate="enter" exit="exit">
              <EligibilitySection
                onEligible={() => navigate('/dashboard/financing/apply')}
              />
            </motion.div>
          )}

          {/* Active Application */}
          {application && (
            <motion.div
              key="content"
              className="space-y-5"
              variants={rtlPageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              {/* Next Action */}
              {primaryAction && (
                <NextActionCard
                  action={primaryAction}
                  onAction={handleAction}
                  isProcessing={isProcessing}
                />
              )}

              {/* Hero */}
              <FinancingHeroCard
                application={application}
                serviceCredit={serviceCredit}
                isLoading={isLoading}
                onViewDetails={() => setActiveTab('status')}
                onUseCredit={() => navigate('/dashboard/services')}
                onPrimaryAction={handlePrimaryAction}
              />

              {/* Stats */}
              <FinancingStatsCards stats={stats} status={currentStatus} />

              {/* Tab Navigation */}
              <div className="flex justify-center">
                <RTLSegmentedControl
                  items={TABS}
                  value={activeTab}
                  onChange={(v) => setActiveTab(v as TabValue)}
                  className="w-full lg:w-auto"
                />
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <OverviewTab
                    customerActions={customerActions}
                    handleAction={handleAction}
                    isProcessing={isProcessing}
                    processingActionId={processingActionId}
                    currentStatus={currentStatus}
                    stats={stats}
                    installments={installments}
                    nextInstallment={nextInstallment}
                    navigate={navigate}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'status' && (
                  <StatusTab currentStatus={currentStatus} timelineSteps={timelineSteps} />
                )}

                {activeTab === 'wallet' && (
                  <WalletTab
                    serviceCredit={serviceCredit}
                    canTransfer={canTransfer}
                    installments={installments}
                    navigate={navigate}
                  />
                )}

                {activeTab === 'documents' && application && (
                  <DocumentsTab applicationId={application.id} />
                )}
              </AnimatePresence>

              {/* New Application CTA for terminated apps */}
              {isTerminalNegative && canApply() && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <Card className="border-dashed border-2 border-primary/20 bg-primary/[0.02] rounded-2xl">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex-1 text-center sm:text-right">
                        <h3 className="font-bold text-foreground mb-0.5">هل تريد تقديم طلب جديد؟</h3>
                        <p className="text-sm text-muted-foreground">
                          يمكنك تقديم طلب تمويل خدمات جديد بناءً على أهليتك الحالية
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={() => navigate('/dashboard/financing/apply')}
                        className="gap-2 rounded-xl h-12 px-6 shadow-lg shadow-primary/15 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        طلب تمويل جديد
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </ClientDashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab Components
// ═══════════════════════════════════════════════════════════════════

function OverviewTab({
  customerActions,
  handleAction,
  isProcessing,
  processingActionId,
  currentStatus,
  stats,
  installments,
  nextInstallment,
  navigate,
  setActiveTab,
}: {
  customerActions: CustomerAction[];
  handleAction: (action: CustomerAction) => void;
  isProcessing: boolean;
  processingActionId?: string;
  currentStatus: FinancingStatus;
  stats: FinancingStats;
  installments: any[];
  nextInstallment: any;
  navigate: (path: string) => void;
  setActiveTab: (tab: TabValue) => void;
}) {
  return (
    <motion.div
      key="overview"
      variants={rtlPageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <StaggerContainer className="grid gap-5 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick Actions */}
          {customerActions.length > 0 && (
            <StaggerItem>
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="pb-3 px-0">
                  <CardTitle className="text-base font-bold">الإجراءات المطلوبة</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <QuickActions
                    actions={customerActions}
                    onAction={handleAction}
                    isProcessing={isProcessing}
                    processingActionId={processingActionId}
                  />
                </CardContent>
              </Card>
            </StaggerItem>
          )}

          {/* Compact Timeline */}
          <StaggerItem>
            <Card className="border shadow-sm rounded-2xl">
              <CardHeader className="flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold">تقدم الطلب</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('status')}
                  className="gap-1 text-xs text-muted-foreground h-8"
                >
                  التفاصيل
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <CompactTimeline currentStatus={currentStatus} />
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Installments Progress */}
          {installments.length > 0 && (
            <StaggerItem>
              <InstallmentsProgress
                total={stats.totalInstallments}
                paid={stats.paidInstallments}
                overdue={stats.overdueInstallments}
              />
            </StaggerItem>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Next Installment */}
          {nextInstallment && (
            <StaggerItem>
              <Card className="border shadow-sm rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">القسط القادم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground text-xs">المبلغ</span>
                      <span className="text-2xl font-extrabold text-foreground tabular-nums">
                        {Number(nextInstallment.amount).toLocaleString('ar-SA')}
                        <span className="text-xs text-muted-foreground mr-1">ر.س</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground text-xs">تاريخ الاستحقاق</span>
                      <span className="font-medium text-xs">
                        {new Date(nextInstallment.due_date).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          )}

          {/* Quick Links */}
          <StaggerItem>
            <Card className="border shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">روابط سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0.5">
                <QuickLinkItem icon={ShoppingCart} label="استخدم رصيد الخدمات" onClick={() => navigate('/dashboard/services')} />
                <QuickLinkItem icon={FileText} label="المستندات والعقود" onClick={() => setActiveTab('documents')} />
                <QuickLinkItem icon={HelpCircle} label="الدعم والمساعدة" onClick={() => navigate('/dashboard/support')} />
              </CardContent>
            </Card>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </motion.div>
  );
}

function StatusTab({ currentStatus, timelineSteps }: { currentStatus: FinancingStatus; timelineSteps: any[] }) {
  return (
    <motion.div
      key="status"
      variants={rtlPageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="space-y-5"
    >
      <Card className="border shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">مراحل طلب التمويل</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancingTimeline currentStatus={currentStatus} steps={timelineSteps} />
        </CardContent>
      </Card>
      <ActivityLog steps={timelineSteps} />
    </motion.div>
  );
}

function WalletTab({ serviceCredit, canTransfer, installments, navigate }: {
  serviceCredit: any;
  canTransfer: boolean;
  installments: any[];
  navigate: (path: string) => void;
}) {
  return (
    <motion.div
      key="wallet"
      variants={rtlPageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <WalletCard
          serviceCredit={serviceCredit}
          onTransfer={() => navigate('/dashboard/financing/transfer')}
          onUseCredit={() => navigate('/dashboard/services')}
          canTransfer={canTransfer}
        />
        {installments.length > 0 && (
          <Card className="border shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">جدول الأقساط</CardTitle>
            </CardHeader>
            <CardContent>
              <InstallmentsTableV2 installments={installments} />
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}

function DocumentsTab({ applicationId }: { applicationId: string }) {
  return (
    <motion.div
      key="documents"
      variants={rtlPageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <Card className="border shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">المستندات والعقود</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentsViewer applicationId={applicationId} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Quick Link Item
// ═══════════════════════════════════════════════════════════════════

function QuickLinkItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/80 transition-colors text-right group"
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
        <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="flex-1 text-xs font-medium">{label}</span>
      <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}