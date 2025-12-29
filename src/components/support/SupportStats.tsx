import { motion } from 'framer-motion';
import { 
  Inbox, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Star,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TicketStats } from '@/hooks/useSupportSystem';
import { cn } from '@/lib/utils';

interface SupportStatsProps {
  stats: TicketStats;
  compact?: boolean;
}

export const SupportStats = ({ stats, compact = false }: SupportStatsProps) => {
  const statCards = [
    { 
      label: 'إجمالي التذاكر', 
      value: stats.total, 
      icon: Inbox, 
      gradient: 'from-primary to-cyan-500',
      bg: 'bg-primary/10'
    },
    { 
      label: 'مفتوحة', 
      value: stats.open, 
      icon: MessageCircle, 
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-500/10'
    },
    { 
      label: 'قيد المعالجة', 
      value: stats.inProgress, 
      icon: Clock, 
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10'
    },
    { 
      label: 'تم الحل', 
      value: stats.resolved + stats.closed, 
      icon: CheckCircle, 
      gradient: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-500/10'
    },
  ];

  const advancedStats = [
    { 
      label: 'عاجلة', 
      value: stats.urgent, 
      icon: AlertTriangle, 
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    },
    { 
      label: 'تجاوز SLA', 
      value: stats.breachedSLA || 0, 
      icon: Zap, 
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    { 
      label: 'متوسط الرد', 
      value: `${stats.avgResponseTime || 0}س`, 
      icon: TrendingUp, 
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      label: 'رضا العملاء', 
      value: `${stats.satisfactionRate || 0}%`, 
      icon: Star, 
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl",
                    stat.bg
                  )}>
                    <stat.icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Advanced stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {advancedStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <Card className="border-border/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
