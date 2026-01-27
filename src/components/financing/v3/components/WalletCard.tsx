/**
 * MaxioCore Financing System v3 - Wallet Card Component
 * بطاقة رصيد الخدمات بأسلوب Neobank
 */

import { motion } from 'framer-motion';
import { 
  Wallet,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ServiceCredit } from '../types';

interface WalletCardProps {
  serviceCredit: ServiceCredit | null;
  onTransfer?: () => void;
  onUseCredit?: () => void;
  canTransfer?: boolean;
  className?: string;
}

export function WalletCard({
  serviceCredit,
  onTransfer,
  onUseCredit,
  canTransfer = false,
  className,
}: WalletCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const availableBalance = serviceCredit?.available_balance ?? 0;
  const totalCredited = serviceCredit?.total_credited ?? 0;
  const totalUsed = serviceCredit?.total_used ?? 0;
  const isFrozen = serviceCredit?.is_frozen ?? false;
  const hasBalance = availableBalance > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-3xl bg-card border border-border overflow-hidden', className)}
    >
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">رصيد الخدمات</h3>
                <p className="text-xs text-muted-foreground">متاح للاستخدام</p>
              </div>
            </div>

            {isFrozen && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs">
                <Lock className="w-3 h-3" />
                <span>مجمّد</span>
              </div>
            )}

            {hasBalance && !isFrozen && (
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
            )}
          </div>

          {/* Balance Display */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-4xl font-bold text-foreground tabular-nums"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {formatCurrency(availableBalance)}
              </motion.span>
              <span className="text-lg text-muted-foreground">ر.س</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {canTransfer && onTransfer && (
              <Button
                onClick={onTransfer}
                disabled={!hasBalance || isFrozen}
                className="flex-1 gap-2"
              >
                تحويل الرصيد
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            
            {onUseCredit && (
              <Button
                onClick={onUseCredit}
                variant={canTransfer ? 'outline' : 'default'}
                disabled={!hasBalance || isFrozen}
                className="flex-1 gap-2"
              >
                استخدم الرصيد
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الإيداعات</p>
              <p className="font-semibold tabular-nums">
                {formatCurrency(totalCredited)} <span className="text-xs text-muted-foreground">ر.س</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الاستخدام</p>
              <p className="font-semibold tabular-nums">
                {formatCurrency(totalUsed)} <span className="text-xs text-muted-foreground">ر.س</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning if frozen */}
      {isFrozen && (
        <div className="px-5 py-3 bg-destructive/5 border-t border-destructive/20">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>الرصيد مجمّد مؤقتاً. يرجى التواصل مع الدعم.</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Mini Wallet Card (for sidebar)
// ═══════════════════════════════════════════════════════════════════

interface MiniWalletCardProps {
  balance: number;
  onClick?: () => void;
  className?: string;
}

export function MiniWalletCard({ balance, onClick, className }: MiniWalletCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl bg-primary/5 border border-primary/20 text-right',
        'hover:bg-primary/10 hover:border-primary/30 transition-all',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <ArrowLeft className="w-4 h-4 text-primary" />
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">رصيد الخدمات</span>
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-1 justify-end">
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {formatCurrency(balance)}
        </span>
        <span className="text-xs text-muted-foreground">ر.س</span>
      </div>
    </motion.button>
  );
}
