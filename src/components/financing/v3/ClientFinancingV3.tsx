/**
 * MaxioCore Financing System v3 - Main Client Dashboard
 * لوحة تمويل العميل الجديدة - FinTech Style مع RTL كامل
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  ChevronLeft,
  History,
  FileText,
  HelpCircle,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancingData } from '../v2/hooks/useFinancingData';
import {
  FinancingHeroCard,
  FinancingEmptyState,
  FinancingStatsCards,
  FinancingTimeline,
  CompactTimeline,
  QuickActions,
  ActivityLog,
  WalletCard,
  InstallmentsProgress,
  RTLSegmentedControl,
  NextActionCard,
  OnboardingCard,
  FinancingPageSkeleton,
  type SegmentItem,
} from './components';
import { 
  rtlPageVariants,
  StaggerContainer,
  StaggerItem,
} from './components/PageTransition';
import { InstallmentsTableV2 } from '../v2/client/InstallmentsTableV2';
import { DocumentsViewer } from '../v2/client/DocumentsViewer';
import type { CustomerAction, FinancingStatus, FinancingStats } from './types';
import { toast } from 'sonner';

type TabValue = 'overview' | 'status' | 'wallet' | 'documents';

// ═══════════════════════════════════════════════════════════════════
// Tab Configuration - RTL order (right to left)
// ═══════════════════════════════════════════════════════════════════

const TABS: SegmentItem[] = [
  { id: 'overview', label: 'نظرة عامة', icon: History },
  { id: 'status', label: 'حالة الطلب', icon: FileText },
  { id: 'wallet', label: 'رصيد الخدمات', icon: Wallet },
  { id: 'documents', label: 'المستندات', icon: FileText },
];

export default function ClientFinancingV3() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingActionId, setProcessingActionId] = useState<string>();
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  // Check for first visit (onboarding)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('financing_onboarding_seen');
    if (!hasSeenOnboarding && !application && !isLoading) {
      setShowOnboarding(true);
    }
  }, [application, isLoading]);

  // Calculate stats
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

  // Handle customer action
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
    } catch (err) {
      console.error('Action error:', err);
      toast.error('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsProcessing(false);
      setProcessingActionId(undefined);
    }
  };

  // Handle primary action
  const handlePrimaryAction = () => {
    const primaryAction = customerActions.find(a => a.isPrimary);
    if (primaryAction) {
      handleAction(primaryAction);
    }
  };

  // Handle onboarding completion
  const handleOnboardingStart = () => {
    localStorage.setItem('financing_onboarding_seen', 'true');
    setShowOnboarding(false);
    navigate('/dashboard/financing/apply');
  };

  const currentStatus = (application?.status as FinancingStatus) || 'DRAFT';
  const isActiveCredit = currentStatus === 'CREDIT_ACTIVE' || currentStatus === 'COMPLETED';
  const canTransfer = isActiveCredit && (serviceCredit?.available_balance ?? 0) > 0;
  const primaryAction = customerActions.find(a => a.isPrimary);

  // Loading state
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
        {/* Page Header */}
        <div className="mb-6 lg:mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                تمويل الخدمات
              </h1>
              <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                إدارة تمويلك ومتابعة حالة الطلبات
              </p>
            </div>

            {!application && !showOnboarding && (
              <Button
                size="lg"
                onClick={() => navigate('/dashboard/financing/apply')}
                className="gap-2 shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
                طلب تمويل خدمات
              </Button>
            )}
          </motion.div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* Onboarding State */}
          {showOnboarding && !application && (
            <motion.div
              key="onboarding"
              variants={rtlPageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <OnboardingCard onStart={handleOnboardingStart} />
            </motion.div>
          )}

          {/* Empty State */}
          {!showOnboarding && !application && (
            <motion.div
              key="empty"
              variants={rtlPageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <FinancingEmptyState 
                onApply={() => navigate('/dashboard/financing/apply')} 
              />
            </motion.div>
          )}

          {/* Active Application */}
          {application && (
            <motion.div
              key="content"
              className="space-y-6"
              variants={rtlPageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              {/* Next Action Card - Always visible if there's an action */}
              {primaryAction && (
                <NextActionCard
                  action={primaryAction}
                  onAction={handleAction}
                  isProcessing={isProcessing}
                />
              )}

              {/* Hero Card */}
              <FinancingHeroCard
                application={application}
                serviceCredit={serviceCredit}
                isLoading={isLoading}
                onViewDetails={() => setActiveTab('status')}
                onUseCredit={() => navigate('/dashboard/services')}
                onPrimaryAction={handlePrimaryAction}
              />

              {/* Stats Cards */}
              <FinancingStatsCards stats={stats} />

              {/* RTL Segmented Control Navigation */}
              <div className="flex justify-center">
                <RTLSegmentedControl
                  items={TABS}
                  value={activeTab}
                  onChange={(v) => setActiveTab(v as TabValue)}
                  className="w-full lg:w-auto"
                />
              </div>

              {/* Tab Content with RTL Transitions */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    variants={rtlPageVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                  >
                    <StaggerContainer className="grid gap-6 lg:grid-cols-3">
                      {/* Main Column */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Quick Actions */}
                        {customerActions.length > 0 && (
                          <StaggerItem>
                            <Card className="border-none shadow-sm">
                              <CardHeader className="pb-4">
                                <CardTitle className="text-lg">الإجراءات المطلوبة</CardTitle>
                              </CardHeader>
                              <CardContent>
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
                          <Card className="border-none shadow-sm">
                            <CardHeader className="flex-row items-center justify-between pb-4">
                              <CardTitle className="text-lg">تقدم الطلب</CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveTab('status')}
                                className="gap-1 text-xs"
                              >
                                عرض التفاصيل
                                <ChevronLeft className="w-4 h-4" />
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
                      <div className="space-y-6">
                        {/* Next Installment */}
                        {nextInstallment && (
                          <StaggerItem>
                            <Card className="border-none shadow-sm">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">القسط القادم</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-muted-foreground text-sm">المبلغ</span>
                                    <span className="text-2xl font-bold text-foreground tabular-nums">
                                      {Number(nextInstallment.amount).toLocaleString('ar-SA')} <span className="text-sm text-muted-foreground">ر.س</span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-muted-foreground text-sm">تاريخ الاستحقاق</span>
                                    <span className="font-medium text-sm">
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
                          <Card className="border-none shadow-sm">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">روابط سريعة</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                              <QuickLink
                                icon={ShoppingCart}
                                label="استخدم رصيد الخدمات"
                                onClick={() => navigate('/dashboard/services')}
                              />
                              <QuickLink
                                icon={FileText}
                                label="المستندات والعقود"
                                onClick={() => setActiveTab('documents')}
                              />
                              <QuickLink
                                icon={HelpCircle}
                                label="الدعم والمساعدة"
                                onClick={() => navigate('/dashboard/support')}
                              />
                            </CardContent>
                          </Card>
                        </StaggerItem>
                      </div>
                    </StaggerContainer>
                  </motion.div>
                )}

                {activeTab === 'status' && (
                  <motion.div
                    key="status"
                    variants={rtlPageVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    className="space-y-6"
                  >
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle>مراحل طلب التمويل</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FinancingTimeline
                          currentStatus={currentStatus}
                          steps={timelineSteps}
                        />
                      </CardContent>
                    </Card>

                    <ActivityLog steps={timelineSteps} />
                  </motion.div>
                )}

                {activeTab === 'wallet' && (
                  <motion.div
                    key="wallet"
                    variants={rtlPageVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                  >
                    <div className="grid gap-6 lg:grid-cols-2">
                      <WalletCard
                        serviceCredit={serviceCredit}
                        onTransfer={() => navigate('/dashboard/financing/transfer')}
                        onUseCredit={() => navigate('/dashboard/services')}
                        canTransfer={canTransfer}
                      />

                      {installments.length > 0 && (
                        <Card className="border-none shadow-sm">
                          <CardHeader>
                            <CardTitle>جدول الأقساط</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <InstallmentsTableV2 installments={installments} />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'documents' && (
                  <motion.div
                    key="documents"
                    variants={rtlPageVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                  >
                    <Card className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle>المستندات والعقود</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DocumentsViewer applicationId={application.id} />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </ClientDashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Quick Link Component
// ═══════════════════════════════════════════════════════════════════

interface QuickLinkProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

function QuickLink({ icon: Icon, label, onClick }: QuickLinkProps) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-right group"
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-9 h-9 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}
