import { motion } from 'framer-motion';
import { Inbox, MessageCircle, Clock, CheckCircle, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TicketStats } from '@/hooks/useSupportSystem';
import { cn } from '@/lib/utils';

interface SupportStatsProps { stats: TicketStats; isAdmin?: boolean; }

export const SupportStats = ({ stats, isAdmin }: SupportStatsProps) => {
  const statsData = isAdmin ? [
    { label: 'إجمالي التذاكر', value: stats.total, icon: Inbox, gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/10', change: `+${stats.todayNew} اليوم` },
    { label: 'تذاكر جديدة', value: stats.open, icon: MessageCircle, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', highlight: stats.open > 0 },
    { label: 'قيد المعالجة', value: stats.inProgress, icon: Clock, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
    { label: 'تم الحل', value: stats.resolved + stats.closed, icon: CheckCircle, gradient: 'from-sky-500 to-blue-500', bg: 'bg-sky-500/10' },
  ] : [
    { label: 'مفتوحة', value: stats.open, icon: MessageCircle, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10' },
    { label: 'قيد المعالجة', value: stats.inProgress, icon: Clock, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
    { label: 'تم الحل', value: stats.resolved + stats.closed, icon: CheckCircle, gradient: 'from-sky-500 to-blue-500', bg: 'bg-sky-500/10' },
  ];

  return (
    <div className={cn("grid gap-3", isAdmin ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3")}>
      {statsData.map((stat, index) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
          <Card className={cn("relative overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg", stat.bg, stat.highlight && "ring-2 ring-emerald-500/30")}>
            {stat.highlight && <motion.div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-l from-emerald-500 to-teal-500" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />}
            <CardContent className={cn("p-4", !isAdmin && "p-3 text-center")}>
              <div className={cn("flex items-center", isAdmin ? "justify-between" : "flex-col gap-2")}>
                <div className={cn(!isAdmin && "order-2")}>
                  <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                  <p className={cn("font-bold", isAdmin ? "text-2xl" : "text-xl")}>{stat.value}</p>
                  {stat.change && <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" />{stat.change}</p>}
                </div>
                <motion.div className={cn("rounded-xl flex items-center justify-center text-white shadow-lg", `bg-gradient-to-br ${stat.gradient}`, isAdmin ? "w-12 h-12" : "w-10 h-10")} whileHover={{ scale: 1.1 }}>
                  <stat.icon className={cn(isAdmin ? "w-6 h-6" : "w-5 h-5")} />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      {isAdmin && stats.urgent > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <Zap className="w-5 h-5" />
                </motion.div>
                <div><p className="font-semibold text-red-500">تذاكر عاجلة</p><p className="text-xs text-muted-foreground">تحتاج انتباه فوري</p></div>
              </div>
              <span className="text-2xl font-bold text-red-500">{stats.urgent}</span>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
