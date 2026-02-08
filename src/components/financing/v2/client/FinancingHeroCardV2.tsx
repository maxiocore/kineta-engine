/**
 * ASH HOLDING Financing System v2 - Hero Card Component
 * البطاقة الرئيسية لعرض حالة التمويل
 */

import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { FinancingApplication, ServiceCredit, FinancingInstallment } from '../types';
import { getStatusConfig, STATUS_COLORS } from '../config/statusConfig';
import type { FinancingStatus } from '../types';

interface FinancingHeroCardV2Props {
  application: FinancingApplication | null;
  serviceCredit: ServiceCredit | null;
  nextInstallment: FinancingInstallment | null;
  remainingBalance: number;
  onActionClick?: () => void;
  isLoading?: boolean;
}

export function FinancingHeroCardV2({
  application,
  serviceCredit,
  nextInstallment,
  remainingBalance,
  onActionClick,
  isLoading = false,
}: FinancingHeroCardV2Props) {
  if (isLoading) {
    return <HeroCardSkeleton />;
  }

  if (!application) {
    return <EmptyHeroCard />;
  }

  const status = application.status as FinancingStatus;
  const statusConfig = getStatusConfig(status);
  const colors = STATUS_COLORS[statusConfig.color];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const availableBalance = serviceCredit?.available_balance ?? 0;
  const approvedAmount = application.approved_amount ?? application.requested_amount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-primary/10 shadow-xl"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/50 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', colors.badge)}>
              {statusConfig.isTerminal ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4 animate-pulse" />
              )}
              {statusConfig.nameAr}
            </div>
            <h2 className="mt-4 text-2xl lg:text-3xl font-bold text-foreground">
              تمويل الخدمات
            </h2>
            <p className="mt-1 text-muted-foreground">
              رقم الطلب: {application.application_number}
            </p>
          </div>

          {/* Primary Action Button */}
          {statusConfig.requiredActionActor === 'customer' && onActionClick && (
            <Button
              size="lg"
              onClick={onActionClick}
              className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              {statusConfig.requiredAction}
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Available Balance */}
          <StatCard
            icon={Wallet}
            label="رصيد الخدمات المتاح"
            value={formatCurrency(availableBalance)}
            suffix="ر.س"
            color="primary"
            isHighlighted={status === 'CREDIT_ACTIVE'}
          />

          {/* Approved Amount */}
          <StatCard
            icon={TrendingUp}
            label="المبلغ المعتمد"
            value={formatCurrency(approvedAmount)}
            suffix="ر.س"
            color="success"
          />

          {/* Next Installment */}
          <StatCard
            icon={Calendar}
            label="القسط القادم"
            value={nextInstallment ? formatCurrency(Number(nextInstallment.amount)) : '—'}
            suffix={nextInstallment ? 'ر.س' : ''}
            subtext={nextInstallment ? formatDate(nextInstallment.due_date) : 'لا توجد أقساط'}
            color="warning"
          />

          {/* Remaining Balance */}
          <StatCard
            icon={TrendingUp}
            label="المتبقي للسداد"
            value={formatCurrency(remainingBalance)}
            suffix="ر.س"
            color="muted"
          />
        </div>

        {/* Mobile Action Button */}
        {statusConfig.requiredActionActor === 'customer' && onActionClick && (
          <Button
            size="lg"
            onClick={onActionClick}
            className="w-full mt-6 sm:hidden flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            {statusConfig.requiredAction}
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Customer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl bg-muted/50 border border-border"
        >
          <p className="text-sm text-muted-foreground">
            {statusConfig.customerMessageAr}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  suffix?: string;
  subtext?: string;
  color: 'primary' | 'success' | 'warning' | 'muted';
  isHighlighted?: boolean;
}

function StatCard({ icon: Icon, label, value, suffix, subtext, color, isHighlighted }: StatCardProps) {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    muted: 'text-muted-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative p-4 rounded-2xl bg-card/50 border transition-all duration-300',
        isHighlighted 
          ? 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/10' 
          : 'border-border hover:border-primary/20'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1.5 rounded-lg bg-muted', colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-2xl lg:text-3xl font-bold tabular-nums', colorClasses[color])}>
          {value}
        </span>
        {suffix && (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
      )}
    </motion.div>
  );
}

function HeroCardSkeleton() {
  return (
    <div className="rounded-3xl bg-card border border-border p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-9 w-48 mt-4" />
          <Skeleton className="h-5 w-36 mt-2" />
        </div>
        <Skeleton className="h-11 w-32 hidden sm:block" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-muted/50 border border-border">
            <Skeleton className="h-6 w-6 mb-2" />
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyHeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-br from-muted/50 to-muted border border-dashed border-muted-foreground/20 p-8 lg:p-12 text-center"
    >
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Wallet className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        لا يوجد طلب تمويل نشط
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        ابدأ الآن واحصل على تمويل الخدمات لتنمية أعمالك
      </p>
      <Button size="lg" className="gap-2">
        تقديم طلب جديد
        <ArrowLeft className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}
