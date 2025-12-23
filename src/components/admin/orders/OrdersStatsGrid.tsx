import { motion } from "framer-motion";
import { LucideIcon, Calendar, Clock, Activity, CheckCircle, XCircle, TrendingUp, Sparkles } from "lucide-react";
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
  bgGradient: string;
  iconBg: string;
  subtitle?: string;
  clickTab?: string | null;
  onTabClick: (tab: string) => void;
  index: number;
  trend?: number;
}

const StatCard = ({ label, value, icon: Icon, bgGradient, iconBg, subtitle, clickTab, onTabClick, index, trend }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => clickTab && onTabClick(clickTab)}
    className={cn("relative group", clickTab && "cursor-pointer")}
  >
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-4 h-full",
      "bg-gradient-to-br border border-white/10",
      "backdrop-blur-sm shadow-lg",
      "transition-all duration-300",
      bgGradient
    )}>
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)"
        }}
      />
      
      {/* Sparkle effect on hover */}
      <motion.div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="w-4 h-4 text-white/30" />
      </motion.div>

      <div className="relative z-10 flex items-center gap-3">
        {/* Icon container with glow */}
        <div className={cn(
          "relative w-12 h-12 rounded-xl flex items-center justify-center",
          "shadow-lg",
          iconBg
        )}>
          <motion.div
            className="absolute inset-0 rounded-xl opacity-50"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ background: "inherit", filter: "blur(8px)" }}
          />
          <Icon className="w-6 h-6 text-white relative z-10" />
        </div>

        <div className="flex-1 min-w-0">
          <motion.p 
            className="text-2xl font-bold text-white truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.2 }}
          >
            {value}
          </motion.p>
          <p className="text-xs text-white/70 truncate">{label}</p>
          {subtitle && (
            <div className="flex items-center gap-1 mt-0.5">
              {trend !== undefined && (
                <TrendingUp className={cn(
                  "w-3 h-3",
                  trend >= 0 ? "text-emerald-300" : "text-red-300 rotate-180"
                )} />
              )}
              <p className="text-[10px] text-white/50 truncate">{subtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/20 via-white/40 to-white/20"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: index * 0.08 + 0.3, duration: 0.5 }}
      />
    </div>
  </motion.div>
);

const OrdersStatsGrid = ({ stats, onTabClick }: OrdersStatsGridProps) => {
  const statsData = [
    { 
      label: "طلبات اليوم", 
      value: stats.todayOrders, 
      icon: Calendar, 
      bgGradient: "from-blue-600/90 to-cyan-500/90",
      iconBg: "bg-blue-500/80",
      subtitle: `${stats.todayRevenue.toFixed(0)} ر.س`,
      clickTab: null,
      trend: 12
    },
    { 
      label: "قيد الانتظار", 
      value: stats.pending, 
      icon: Clock, 
      bgGradient: "from-amber-500/90 to-orange-400/90",
      iconBg: "bg-amber-400/80",
      clickTab: "pending"
    },
    { 
      label: "قيد التنفيذ", 
      value: stats.in_progress, 
      icon: Activity, 
      bgGradient: "from-violet-600/90 to-purple-500/90",
      iconBg: "bg-violet-500/80",
      clickTab: "in_progress"
    },
    { 
      label: "مكتمل", 
      value: stats.completed, 
      icon: CheckCircle, 
      bgGradient: "from-emerald-600/90 to-green-500/90",
      iconBg: "bg-emerald-500/80",
      clickTab: "completed"
    },
    { 
      label: "ملغي", 
      value: stats.cancelled, 
      icon: XCircle, 
      bgGradient: "from-rose-600/90 to-red-500/90",
      iconBg: "bg-rose-500/80",
      clickTab: "cancelled"
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
