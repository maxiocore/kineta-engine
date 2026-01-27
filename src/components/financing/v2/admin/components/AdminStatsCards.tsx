/**
 * MaxioCore Financing Admin V2 - Stats Cards
 * بطاقات الإحصائيات للوحة الأدمن
 */

import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  Wallet,
  CalendarDays,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { AdminStats } from '../types';
import { cn } from '@/lib/utils';

interface AdminStatsCardsProps {
  stats: AdminStats;
  isLoading?: boolean;
}

interface StatCard {
  key: keyof AdminStats;
  label: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
  format: (v: number) => string;
  highlight?: boolean;
}

const STAT_CARDS: StatCard[] = [
  {
    key: 'totalApplications',
    label: 'إجمالي الطلبات',
    icon: FileText,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    format: (v: number) => v.toLocaleString('ar-SA'),
  },
  {
    key: 'pendingReview',
    label: 'بانتظار المراجعة',
    icon: Clock,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    format: (v: number) => v.toLocaleString('ar-SA'),
    highlight: true,
  },
  {
    key: 'activeFinancing',
    label: 'تمويلات نشطة',
    icon: TrendingUp,
    color: 'text-success',
    bgColor: 'bg-success/10',
    format: (v: number) => v.toLocaleString('ar-SA'),
  },
  {
    key: 'totalFinanced',
    label: 'إجمالي التمويل',
    icon: Wallet,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    format: (v: number) => `${v.toLocaleString('ar-SA')} ر.س`,
  },
  {
    key: 'thisMonthApplications',
    label: 'طلبات هذا الشهر',
    icon: CalendarDays,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    format: (v: number) => v.toLocaleString('ar-SA'),
  },
  {
    key: 'approvalRate',
    label: 'نسبة القبول',
    icon: BarChart3,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    format: (v: number) => `${v}%`,
  },
];

export function AdminStatsCards({ stats, isLoading }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" dir="rtl">
      {STAT_CARDS.map((card, index) => {
        const Icon = card.icon;
        const value = stats[card.key as keyof AdminStats];
        
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn(
              "relative overflow-hidden transition-all hover:shadow-md",
              card.highlight && value > 0 && "ring-2 ring-warning/50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-2 rounded-lg",
                    card.bgColor
                  )}>
                    <Icon className={cn("h-5 w-5", card.color)} />
                  </div>
                  {card.highlight && value > 0 && (
                    <span className="absolute top-2 left-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-warning" />
                    </span>
                  )}
                </div>
                
                <div className="mt-3">
                  {isLoading ? (
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className={cn(
                      "text-2xl font-bold tracking-tight",
                      card.color
                    )}>
                      {card.format(value as number)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
