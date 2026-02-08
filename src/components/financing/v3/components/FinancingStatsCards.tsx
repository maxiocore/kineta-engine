/**
 * ASH HOLDING Financing System v3 - Stats Cards
 * بطاقات الإحصائيات - iOS Banking Widgets
 */

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FinancingStats } from '../types';

interface FinancingStatsCardsProps {
  stats: FinancingStats;
  status?: string;
  className?: string;
}

export function FinancingStatsCards({ stats, status, className }: FinancingStatsCardsProps) {
  const isNeg = status ? ['DECLINED', 'CANCELLED', 'EXPIRED', 'REJECTED'].includes(status.toUpperCase()) : false;

  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(n);

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  const cards = [
    {
      id: 'approved',
      label: 'المبلغ المعتمد',
      value: isNeg ? '—' : fmt(stats.totalApproved),
      suffix: isNeg ? '' : 'ر.س',
      icon: TrendingUp,
      accent: isNeg ? 'text-muted-foreground bg-muted' : 'text-emerald-500 bg-emerald-500/10',
    },
    {
      id: 'used',
      label: 'المستخدم',
      value: isNeg ? '—' : fmt(stats.totalUsed),
      suffix: isNeg ? '' : 'ر.س',
      icon: TrendingDown,
      accent: 'text-muted-foreground bg-muted',
    },
    {
      id: 'available',
      label: 'المتاح',
      value: isNeg ? '—' : fmt(stats.availableBalance),
      suffix: isNeg ? '' : 'ر.س',
      icon: Wallet,
      accent: isNeg ? 'text-muted-foreground bg-muted' : 'text-primary bg-primary/10',
      highlight: !isNeg && stats.availableBalance > 0,
    },
    {
      id: 'next',
      label: 'القسط القادم',
      value: isNeg ? '—' : (stats.nextInstallmentAmount > 0 ? fmt(stats.nextInstallmentAmount) : '—'),
      suffix: (!isNeg && stats.nextInstallmentAmount > 0) ? 'ر.س' : '',
      subtext: isNeg ? undefined : fmtDate(stats.nextInstallmentDate),
      icon: Calendar,
      accent: isNeg ? 'text-muted-foreground bg-muted' : 'text-amber-500 bg-amber-500/10',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-2.5', className)}>
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={cn(
            'relative p-4 rounded-2xl bg-card border transition-all duration-200',
            card.highlight
              ? 'border-primary/25 shadow-sm shadow-primary/5'
              : 'border-border'
          )}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2.5', card.accent)}>
            <card.icon className="w-4.5 h-4.5" />
          </div>
          <p className="text-[11px] text-muted-foreground mb-1">{card.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold tabular-nums">{card.value}</span>
            {card.suffix && <span className="text-[10px] text-muted-foreground">{card.suffix}</span>}
          </div>
          {card.subtext && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{card.subtext}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Installments Progress
// ═══════════════════════════════════════════════════════════════════

interface InstallmentsProgressProps {
  total: number;
  paid: number;
  overdue: number;
  className?: string;
}

export function InstallmentsProgress({ total, paid, overdue, className }: InstallmentsProgressProps) {
  const remaining = total - paid - overdue;
  const paidPct = (paid / total) * 100;
  const overduePct = (overdue / total) * 100;

  return (
    <div className={cn('p-4 rounded-2xl bg-card border border-border', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold">تقدم الأقساط</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{paid} من {total}</span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        <motion.div
          className="h-full bg-emerald-500 rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${paidPct}%` }}
          transition={{ duration: 0.5 }}
        />
        {overdue > 0 && (
          <motion.div
            className="h-full bg-destructive"
            initial={{ width: 0 }}
            animate={{ width: `${overduePct}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        )}
      </div>

      <div className="flex items-center gap-4 mt-2.5 text-[11px]">
        <LegendDot color="bg-emerald-500" label={`مدفوع (${paid})`} />
        {overdue > 0 && <LegendDot color="bg-destructive" label={`متأخر (${overdue})`} />}
        <LegendDot color="bg-muted-foreground/30" label={`متبقي (${remaining})`} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={cn('w-1.5 h-1.5 rounded-full', color)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}