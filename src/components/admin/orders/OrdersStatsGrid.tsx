import { motion } from "framer-motion";
import { LucideIcon, Calendar, Clock, Activity, CheckCircle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrderStats {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

interface OrdersStatsGridProps {
  stats: OrderStats;
  onTabClick: (tab: string) => void;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  gradient: string;
  subtitle?: string;
  clickTab?: string | null;
  onTabClick: (tab: string) => void;
  index: number;
}

const StatCard = ({ label, value, icon: Icon, gradient, subtitle, clickTab, onTabClick, index }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => clickTab && onTabClick(clickTab)}
    className={cn(clickTab && "cursor-pointer")}
  >
    <Card className="border-border/40 overflow-hidden relative group hover:shadow-md transition-all h-full">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
      <CardContent className="p-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} p-2 shadow-md shrink-0`}>
            <Icon className="w-full h-full text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold truncate">{value}</p>
            <p className="text-[10px] text-muted-foreground truncate">{label}</p>
            {subtitle && (
              <p className="text-[9px] text-muted-foreground/70 truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const OrdersStatsGrid = ({ stats, onTabClick }: OrdersStatsGridProps) => {
  const statsData = [
    { 
      label: "طلبات اليوم", 
      value: stats.todayOrders, 
      icon: Calendar, 
      gradient: "from-blue-500 to-cyan-400",
      subtitle: `${stats.todayRevenue.toFixed(0)} ر.س`,
      clickTab: null
    },
    { 
      label: "قيد الانتظار", 
      value: stats.pending, 
      icon: Clock, 
      gradient: "from-amber-500 to-orange-400",
      clickTab: "pending"
    },
    { 
      label: "قيد التنفيذ", 
      value: stats.in_progress, 
      icon: Activity, 
      gradient: "from-violet-500 to-purple-400",
      clickTab: "in_progress"
    },
    { 
      label: "مكتمل", 
      value: stats.completed, 
      icon: CheckCircle, 
      gradient: "from-emerald-500 to-green-400",
      clickTab: "completed"
    },
    { 
      label: "الإيرادات", 
      value: `${stats.totalRevenue.toFixed(0)}`, 
      icon: DollarSign, 
      gradient: "from-pink-500 to-rose-400",
      subtitle: `${stats.total} طلب`
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {statsData.map((stat, index) => (
        <StatCard
          key={stat.label}
          {...stat}
          onTabClick={onTabClick}
          index={index}
        />
      ))}
    </div>
  );
};

export default OrdersStatsGrid;
