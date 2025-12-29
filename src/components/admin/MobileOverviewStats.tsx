import { motion } from 'framer-motion';
import { Users, Clock, CheckCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import AnimatedCounter from './AnimatedCounter';

interface MobileOverviewStatsProps {
  totalUsers: number;
  usersTrend: number;
  pendingOrders: number;
  ordersTrend: number;
  completedOrders: number;
  monthlyRevenue: number;
  revenueTrend: number;
  onNavigate: (path: string) => void;
}

export const MobileOverviewStats = ({
  totalUsers,
  usersTrend,
  pendingOrders,
  ordersTrend,
  completedOrders,
  monthlyRevenue,
  revenueTrend,
  onNavigate
}: MobileOverviewStatsProps) => {
  const stats = [
    {
      label: 'المستخدمين',
      value: totalUsers,
      trend: usersTrend,
      icon: Users,
      color: 'primary',
      bgGradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
      path: '/admin/users'
    },
    {
      label: 'المعلقة',
      value: pendingOrders,
      trend: ordersTrend,
      icon: Clock,
      color: 'amber',
      bgGradient: 'from-amber-500/10 to-amber-500/5',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-500',
      path: '/admin/orders'
    },
    {
      label: 'المكتملة',
      value: completedOrders,
      icon: CheckCircle,
      color: 'green',
      bgGradient: 'from-green-500/10 to-green-500/5',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
      path: '/admin/orders'
    },
    {
      label: 'الإيرادات',
      value: monthlyRevenue,
      trend: revenueTrend,
      icon: DollarSign,
      suffix: ' ر.س',
      color: 'purple',
      bgGradient: 'from-purple-500/10 to-purple-500/5',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-500',
      path: '/admin/reports'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(stat.path)}
          >
            <Card className={cn(
              "border-border/40 overflow-hidden cursor-pointer transition-all",
              "bg-gradient-to-br",
              stat.bgGradient
            )}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-1.5 rounded-lg", stat.iconBg)}>
                    <Icon className={cn("w-3.5 h-3.5", stat.iconColor)} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {stat.label}
                  </span>
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="text-lg font-bold leading-none">
                    <AnimatedCounter 
                      value={stat.value} 
                      suffix={stat.suffix} 
                      duration={0.8} 
                    />
                  </div>
                  
                  {stat.trend !== undefined && stat.trend !== 0 && (
                    <div className={cn(
                      "flex items-center gap-0.5 text-[9px] font-semibold",
                      stat.trend > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {stat.trend > 0 ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      <span>{Math.abs(stat.trend)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
