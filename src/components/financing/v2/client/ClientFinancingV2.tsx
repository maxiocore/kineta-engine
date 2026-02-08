/**
 * ASH HOLDING Financing System v2 - Main Client Dashboard Page
 * صفحة التمويل الرئيسية للعميل
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  History, 
  FileText, 
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancingData } from '../hooks/useFinancingData';
import { FinancingHeroCardV2 } from './FinancingHeroCardV2';
import { FinancingTimelineV2, CompactTimeline } from './FinancingTimelineV2';
import { ActionButtonsV2, QuickActionCards } from './ActionButtonsV2';
import { InstallmentsTableV2 } from './InstallmentsTableV2';
import { DocumentsViewer } from './DocumentsViewer';
import type { CustomerAction, FinancingStatus } from '../types';
import { toast } from 'sonner';

export default function ClientFinancingV2() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
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

  // Handle primary action from hero card
  const handlePrimaryAction = () => {
    const primaryAction = customerActions.find(a => a.isPrimary);
    if (primaryAction) {
      handleAction(primaryAction);
    }
  };

  return (
    <ClientDashboardLayout>
      <motion.div
        className="min-h-screen"
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Page Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                تمويل الخدمات
              </h1>
              <p className="text-muted-foreground mt-1">
                إدارة تمويلك ومتابعة حالة الطلبات
              </p>
            </div>

            {!application && (
              <Button
                size="lg"
                onClick={() => navigate('/dashboard/financing/apply')}
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                تقديم طلب جديد
              </Button>
            )}
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Hero Card */}
          <FinancingHeroCardV2
            application={application}
            serviceCredit={serviceCredit}
            nextInstallment={nextInstallment}
            remainingBalance={remainingBalance}
            onActionClick={handlePrimaryAction}
            isLoading={isLoading}
          />

          {/* Content Tabs */}
          {application && (
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-background"
                >
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline" 
                  className="data-[state=active]:bg-background"
                >
                  مراحل الطلب
                </TabsTrigger>
                <TabsTrigger 
                  value="installments" 
                  className="data-[state=active]:bg-background"
                >
                  الأقساط
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="data-[state=active]:bg-background"
                >
                  المستندات
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Actions Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    {customerActions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">الإجراءات المتاحة</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <QuickActionCards
                            actions={customerActions}
                            onAction={handleAction}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Compact Timeline */}
                    <Card>
                      <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="text-lg">تقدم الطلب</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('timeline')}
                          className="gap-1"
                        >
                          عرض التفاصيل
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <CompactTimeline steps={timelineSteps} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Next Installment */}
                    {nextInstallment && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">القسط القادم</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                              <span className="text-muted-foreground">المبلغ</span>
                              <span className="text-2xl font-bold text-foreground">
                                {Number(nextInstallment.amount).toLocaleString('ar-SA')} ر.س
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-muted-foreground">تاريخ الاستحقاق</span>
                              <span className="font-medium">
                                {new Date(nextInstallment.due_date).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quick Links */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">روابط سريعة</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <QuickLink
                          icon={History}
                          label="سجل العمليات"
                          onClick={() => navigate('/dashboard/financing/history')}
                        />
                        <QuickLink
                          icon={FileText}
                          label="المستندات"
                          onClick={() => setActiveTab('documents')}
                        />
                        <QuickLink
                          icon={HelpCircle}
                          label="الدعم والمساعدة"
                          onClick={() => navigate('/dashboard/support')}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>مراحل طلب التمويل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Desktop Timeline */}
                    <div className="hidden lg:block">
                      <FinancingTimelineV2
                        steps={timelineSteps}
                        currentStatus={application.status as FinancingStatus}
                        orientation="horizontal"
                      />
                    </div>
                    {/* Mobile Timeline */}
                    <div className="lg:hidden">
                      <FinancingTimelineV2
                        steps={timelineSteps}
                        currentStatus={application.status as FinancingStatus}
                        orientation="vertical"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Installments Tab */}
              <TabsContent value="installments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>جدول الأقساط</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InstallmentsTableV2 installments={installments} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>المستندات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentsViewer applicationId={application.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
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
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-right group"
    >
      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
