/**
 * ASH HOLDING Financing System v3 - Hero Card
 * بطاقة البطل - تصميم بنكي فاخر iOS-first
 */

import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Ban,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState } from 'react';
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
  const [balanceHidden, setBalanceHidden] = useState(false);

  if (isLoading) {
    return <HeroSkeleton />;
  }

  if (!application) return null;

  const status = application.status as FinancingStatus;
  const statusConfig = getStatusConfig(status);
  const isNegativeTerminal = ['DECLINED', 'CANCELLED'].includes(status);
  const isActiveCredit = status === 'CREDIT_ACTIVE' || status === 'COMPLETED';
  const availableBalance = isNegativeTerminal ? 0 : (serviceCredit?.available_balance ?? 0);
  const hasBalance = availableBalance > 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className={cn(
        'relative overflow-hidden rounded-[28px] shadow-2xl',
        isNegativeTerminal 
          ? 'bg-gradient-to-bl from-destructive via-destructive/90 to-destructive/70 shadow-destructive/25'
          : 'bg-gradient-to-bl from-primary via-primary/95 to-primary/80 shadow-primary/25'
      )}>
        {/* Decorative Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/[0.07] rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-black/[0.08] rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-white/[0.04] rounded-full blur-2xl" />
        </div>

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 p-6 lg:p-8 text-primary-foreground">
          {/* Top Row: Logo + Status */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/10"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                {isNegativeTerminal ? (
                  status === 'CANCELLED' ? <Ban className="w-6 h-6" /> : <XCircle className="w-6 h-6" />
                ) : (
                  <Wallet className="w-6 h-6" />
                )}
              </motion.div>
              <div>
                <p className="text-sm font-medium opacity-80">تمويل الخدمات</p>
                <p className="text-xs opacity-60 font-mono tracking-wide">{application.application_number}</p>
              </div>
            </div>

            {/* Status Pill */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide',
                'bg-white/15 backdrop-blur-md border border-white/10'
              )}
            >
              {isNegativeTerminal ? (
                <XCircle className="w-3 h-3" />
              ) : statusConfig.isTerminal ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <motion.div
                  className="w-2 h-2 rounded-full bg-white"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              {statusConfig.nameAr}
            </motion.div>
          </div>

          {/* Balance Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm opacity-70">
                {isNegativeTerminal ? 'حالة الطلب' : 'الرصيد المتاح'}
              </p>
              {!isNegativeTerminal && (
                <button
                  onClick={() => setBalanceHidden(!balanceHidden)}
                  className="opacity-50 hover:opacity-80 transition-opacity"
                >
                  {balanceHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {isNegativeTerminal ? (
              <motion.p
                className="text-2xl font-bold"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {statusConfig.nameAr}
              </motion.p>
            ) : (
              <div className="flex items-baseline gap-3">
                <motion.span
                  className="text-[42px] lg:text-5xl font-extrabold tracking-tight tabular-nums leading-none"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {balanceHidden ? '••••••' : formatCurrency(availableBalance)}
                </motion.span>
                <span className="text-xl opacity-60 font-medium">ر.س</span>
              </div>
            )}
          </div>

          {/* Sparkle */}
          {hasBalance && !balanceHidden && (
            <motion.div
              className="absolute top-6 left-6"
              animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 opacity-40" />
            </motion.div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {statusConfig.requiredActionActor === 'customer' && onPrimaryAction && (
              <Button
                onClick={(e) => { e.stopPropagation(); onPrimaryAction(); }}
                size="lg"
                className="relative z-20 flex-1 bg-white text-primary hover:bg-white/90 font-bold gap-2 rounded-xl h-12 shadow-lg shadow-black/10"
              >
                {statusConfig.requiredAction}
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}

            {isActiveCredit && hasBalance && onUseCredit && (
              <Button
                onClick={(e) => { e.stopPropagation(); onUseCredit(); }}
                size="lg"
                className="relative z-20 flex-1 bg-white text-primary hover:bg-white/90 font-bold gap-2 rounded-xl h-12 shadow-lg shadow-black/10"
              >
                استخدم الرصيد
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}

            {onViewDetails && (
              <Button
                onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                variant="ghost"
                size="lg"
                className="relative z-20 text-primary-foreground hover:bg-white/15 gap-2 rounded-xl h-12 border border-white/10"
              >
                التفاصيل
              </Button>
            )}
          </div>

          {/* Customer Message */}
          {!statusConfig.isTerminal && (
            <motion.div
              className="mt-5 flex items-center gap-2.5 text-[13px] opacity-70 bg-white/8 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
              {statusConfig.customerMessageAr}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HeroSkeleton() {
  return (
    <div className="rounded-[28px] bg-muted p-6 lg:p-8 animate-pulse">
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-12 w-48 mb-8" />
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}