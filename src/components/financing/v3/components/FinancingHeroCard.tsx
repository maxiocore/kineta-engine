/**
 * ASH HOLDING Financing System v3 - Hero Card Component
 * البطاقة الرئيسية بأسلوب FinTech/Neobank
 */

import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowLeft, 
  Clock, 
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { FinancingApplication, ServiceCredit, FinancingStatus } from '../types';
import { getStatusConfig, STATUS_COLORS } from '../config';

interface FinancingHeroCardProps {
  application: FinancingApplication | null;
  serviceCredit: ServiceCredit | null;
  isLoading?: boolean;
  onViewDetails?: () => void;
  onUseCredit?: () => void;
  onPrimaryAction?: () => void;
}

export function FinancingHeroCard({
  application,
  serviceCredit,
  isLoading = false,
  onViewDetails,
  onUseCredit,
  onPrimaryAction,
}: FinancingHeroCardProps) {
  if (isLoading) {
    return <HeroCardSkeleton />;
  }

  if (!application) {
    return null;
  }

  const status = application.status as FinancingStatus;
  const statusConfig = getStatusConfig(status);
  const colors = STATUS_COLORS[statusConfig.color];
  
  // For declined/cancelled/expired statuses, don't show balance or amounts
  const isNegativeTerminal = ['DECLINED', 'CANCELLED', 'EXPIRED', 'REJECTED'].includes(status.toUpperCase());
  const availableBalance = isNegativeTerminal ? 0 : (serviceCredit?.available_balance ?? 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isActiveCredit = !isNegativeTerminal && (status === 'CREDIT_ACTIVE' || status === 'COMPLETED');
  const hasAvailableBalance = availableBalance > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden"
    >
      {/* Main Card */}
      <div className={cn(
        "relative rounded-3xl p-6 lg:p-8 text-primary-foreground shadow-2xl",
        isNegativeTerminal 
          ? "bg-gradient-to-br from-destructive/90 via-destructive/80 to-destructive/60 shadow-destructive/20"
          : "bg-gradient-to-br from-primary via-primary/95 to-primary/80 shadow-primary/20"
      )}>
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full blur-3xl transform translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Card Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <Wallet className="w-6 h-6" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg">تمويل الخدمات</h3>
                <p className="text-sm opacity-80">{application.application_number}</p>
              </div>
            </div>

            {/* Status Badge */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                'bg-white/20 backdrop-blur-sm'
              )}
            >
              {statusConfig.isTerminal ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5 animate-pulse" />
              )}
              {statusConfig.nameAr}
            </motion.div>
          </div>

          {/* Balance Display */}
          <div className="mb-6">
            <p className="text-sm opacity-80 mb-1">
              {isNegativeTerminal ? 'حالة الطلب' : 'رصيد الخدمات المتاح'}
            </p>
            {isNegativeTerminal ? (
              <div className="flex items-baseline gap-2">
                <motion.span
                  className="text-2xl lg:text-3xl font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {statusConfig.nameAr}
                </motion.span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <motion.span
                  className="text-4xl lg:text-5xl font-bold tracking-tight tabular-nums"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {formatCurrency(availableBalance)}
                </motion.span>
                <span className="text-xl opacity-80">ر.س</span>
              </div>
            )}
          </div>

          {/* Sparkle Effect for Active Credit */}
          {hasAvailableBalance && (
            <motion.div
              className="absolute top-4 left-4"
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 opacity-60" />
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {statusConfig.requiredActionActor === 'customer' && onPrimaryAction && (
              <Button
                onClick={onPrimaryAction}
                variant="secondary"
                size="lg"
                className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold gap-2"
              >
                {statusConfig.requiredAction}
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            
            {isActiveCredit && hasAvailableBalance && onUseCredit && (
              <Button
                onClick={onUseCredit}
                variant="secondary"
                size="lg"
                className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold gap-2"
              >
                استخدم الرصيد
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}

            {onViewDetails && (
              <Button
                onClick={onViewDetails}
                variant="ghost"
                size="lg"
                className="text-primary-foreground hover:bg-white/20 gap-2"
              >
                عرض التفاصيل
                <TrendingUp className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Customer Message */}
          {!statusConfig.isTerminal && (
            <motion.p
              className="mt-4 text-sm opacity-80 bg-white/10 rounded-xl px-4 py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {statusConfig.customerMessageAr}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Skeleton
// ═══════════════════════════════════════════════════════════════════

function HeroCardSkeleton() {
  return (
    <div className="rounded-3xl bg-muted p-6 lg:p-8 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div>
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-12 w-48 mb-6" />
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 flex-1" />
      </div>
    </div>
  );
}
