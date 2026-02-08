/**
 * ASH HOLDING Financing System v3 - Wallet Card
 * بطاقة رصيد الخدمات - Neobank iOS Style
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
  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const balance = serviceCredit?.available_balance ?? 0;
  const totalCredited = serviceCredit?.total_credited ?? 0;
  const totalUsed = serviceCredit?.total_used ?? 0;
  const isFrozen = serviceCredit?.is_frozen ?? false;
  const hasBalance = balance > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl bg-card border border-border overflow-hidden', className)}
    >
      {/* Header Section */}
      <div className="relative p-5 pb-6">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/[0.04] to-transparent pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-[15px]">رصيد الخدمات</h3>
                <p className="text-[11px] text-muted-foreground">متاح للاستخدام</p>
              </div>
            </div>

            {isFrozen ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-medium">
                <Lock className="w-3 h-3" />
                مجمّد
              </div>
            ) : hasBalance ? (
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <Sparkles className="w-4 h-4 text-primary opacity-60" />
              </motion.div>
            ) : null}
          </div>

          {/* Balance */}
          <div className="mb-5">
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-[36px] font-extrabold text-foreground tabular-nums leading-none tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {fmt(balance)}
              </motion.span>
              <span className="text-base text-muted-foreground font-medium">ر.س</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            {canTransfer && onTransfer && (
              <Button
                onClick={onTransfer}
                disabled={!hasBalance || isFrozen}
                className="flex-1 gap-2 h-11 rounded-xl"
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
                className="flex-1 gap-2 h-11 rounded-xl"
              >
                استخدم الرصيد
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-5 py-4 border-t border-border bg-muted/30">
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={TrendingUp}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
            label="إجمالي الإيداعات"
            value={fmt(totalCredited)}
          />
          <StatItem
            icon={TrendingDown}
            iconColor="text-muted-foreground"
            iconBg="bg-muted"
            label="إجمالي الاستخدام"
            value={fmt(totalUsed)}
          />
        </div>
      </div>

      {/* Frozen Warning */}
      {isFrozen && (
        <div className="px-5 py-3 bg-destructive/5 border-t border-destructive/15">
          <div className="flex items-center gap-2 text-destructive text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            الرصيد مجمّد مؤقتاً. يرجى التواصل مع الدعم.
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatItem({ icon: Icon, iconColor, iconBg, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
        <Icon className={cn('w-4 h-4', iconColor)} />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">
          {value} <span className="text-[10px] text-muted-foreground">ر.س</span>
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Mini Wallet Card (sidebar)
// ═══════════════════════════════════════════════════════════════════

interface MiniWalletCardProps {
  balance: number;
  onClick?: () => void;
  className?: string;
}

export function MiniWalletCard({ balance, onClick, className }: MiniWalletCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl bg-primary/5 border border-primary/15 text-right',
        'hover:bg-primary/10 hover:border-primary/25 transition-all',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <ArrowLeft className="w-4 h-4 text-primary" />
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="text-[11px] text-muted-foreground">رصيد الخدمات</span>
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-1 justify-end">
        <span className="text-2xl font-extrabold text-foreground tabular-nums">
          {new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(balance)}
        </span>
        <span className="text-xs text-muted-foreground">ر.س</span>
      </div>
    </motion.button>
  );
}