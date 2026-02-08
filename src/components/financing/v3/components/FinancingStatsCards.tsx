/**
 * ASH HOLDING Financing System v3 - Stats Cards Component
 * بطاقات الإحصائيات السريعة
 */

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FinancingStats } from '../types';

interface FinancingStatsCardsProps {
  stats: FinancingStats;
  className?: string;
}

export function FinancingStatsCards({ stats, className }: FinancingStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
    });
  };

  const cards = [
    {
      id: 'approved',
      label: 'المبلغ المعتمد',
      value: formatCurrency(stats.totalApproved),
      suffix: 'ر.س',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      id: 'used',
      label: 'المستخدم',
      value: formatCurrency(stats.totalUsed),
      suffix: 'ر.س',
      icon: TrendingDown,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
    {
      id: 'available',
      label: 'المتاح',
      value: formatCurrency(stats.availableBalance),
      suffix: 'ر.س',
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      highlight: stats.availableBalance > 0,
    },
    {
      id: 'next',
      label: 'القسط القادم',
      value: stats.nextInstallmentAmount > 0 ? formatCurrency(stats.nextInstallmentAmount) : '—',
      suffix: stats.nextInstallmentAmount > 0 ? 'ر.س' : '',
      subtext: formatDate(stats.nextInstallmentDate),
      icon: Calendar,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4', className)}>
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            'relative p-4 lg:p-5 rounded-2xl bg-card border transition-all duration-300',
            card.highlight 
              ? 'border-primary/30 shadow-lg shadow-primary/10' 
              : 'border-border hover:border-primary/20'
          )}
        >
          {/* Icon */}
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
            card.bgColor
          )}>
            <card.icon className={cn('w-5 h-5', card.color)} />
          </div>

          {/* Label */}
          <p className="text-xs text-muted-foreground mb-1">{card.label}</p>

          {/* Value */}
          <div className="flex items-baseline gap-1">
            <span className={cn('text-xl lg:text-2xl font-bold tabular-nums', card.color)}>
              {card.value}
            </span>
            {card.suffix && (
              <span className="text-xs text-muted-foreground">{card.suffix}</span>
            )}
          </div>

          {/* Subtext */}
          {card.subtext && (
            <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>
          )}

          {/* Highlight Indicator */}
          {card.highlight && (
            <motion.div
              className="absolute top-3 left-3"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowUpRight className="w-4 h-4 text-primary" />
            </motion.div>
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
  const paidPercent = (paid / total) * 100;
  const overduePercent = (overdue / total) * 100;

  return (
    <div className={cn('p-4 rounded-2xl bg-card border border-border', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">تقدم الأقساط</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {paid} من {total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        <motion.div
          className="h-full bg-success"
          initial={{ width: 0 }}
          animate={{ width: `${paidPercent}%` }}
          transition={{ duration: 0.5 }}
        />
        {overdue > 0 && (
          <motion.div
            className="h-full bg-destructive"
            initial={{ width: 0 }}
            animate={{ width: `${overduePercent}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-muted-foreground">مدفوع ({paid})</span>
        </div>
        {overdue > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">متأخر ({overdue})</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <span className="text-muted-foreground">متبقي ({remaining})</span>
        </div>
      </div>
    </div>
  );
}
