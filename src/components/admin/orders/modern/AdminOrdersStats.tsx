import React from "react";
import { motion } from "framer-motion";
import { 
  Package, Clock, Loader2, CheckCircle, TrendingUp,
  DollarSign, Target, Wallet, Calendar, XCircle, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminOrdersStatsProps {
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
  };
}

const AnimatedNumber = ({ value, delay = 0, decimals = 0 }: { value: number; delay?: number; decimals?: number }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = value;
      const duration = 1000;
      const startTime = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = easeOutQuart * end;
        setDisplayValue(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(end);
        }
      };
      
      requestAnimationFrame(animate);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return <span>{decimals > 0 ? displayValue.toFixed(decimals) : Math.floor(displayValue)}</span>;
};

export const AdminOrdersStats = ({ stats }: AdminOrdersStatsProps) => {
  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  const mainStats = [
    {
      label: "إجمالي الطلبات",
      value: stats.total,
      icon: Package,
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-gradient-to-br from-primary to-blue-600",
      borderColor: "border-primary/30"
    },
    {
      label: "قيد الانتظار",
      value: stats.pending,
      icon: Clock,
      gradient: "from-amber-500/20 to-amber-500/5",
      iconBg: "bg-gradient-to-br from-amber-400 to-amber-600",
      borderColor: "border-amber-500/30"
    },
    {
      label: "قيد التنفيذ",
      value: stats.in_progress,
      icon: Loader2,
      gradient: "from-blue-500/20 to-blue-500/5",
      iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
      borderColor: "border-blue-500/30",
      animate: true
    },
    {
      label: "مكتملة",
      value: stats.completed,
      icon: CheckCircle,
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      borderColor: "border-emerald-500/30"
    },
    {
      label: "ملغية / مسترجعة",
      value: stats.cancelled,
      icon: XCircle,
      gradient: "from-red-500/20 to-red-500/5",
      iconBg: "bg-gradient-to-br from-red-400 to-red-600",
      borderColor: "border-red-500/30"
    },
  ];

  return (
    <div className="space-y-3 md:space-y-4" dir="rtl">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
        {mainStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.04,
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
            whileHover={{ y: -2 }}
            className={cn(
              "relative overflow-hidden rounded-lg md:rounded-xl bg-card border p-3 md:p-4 group hover:shadow-md transition-all duration-300",
              `bg-gradient-to-br ${stat.gradient}`,
              stat.borderColor
            )}
          >
            <motion.div 
              className="absolute -top-8 -left-8 w-16 h-16 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-br from-current"
            />
            
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-0.5 leading-tight truncate">{stat.label}</p>
                <motion.p 
                  className="text-lg md:text-2xl font-bold tracking-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.06 + 0.15 }}
                >
                  <AnimatedNumber value={stat.value} delay={index * 60 + 80} />
                </motion.p>
              </div>
              
              <motion.div 
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-md flex-shrink-0",
                  stat.iconBg
                )}
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
              >
                <stat.icon className={cn(
                  "w-4 h-4 md:w-5 md:h-5 text-white",
                  stat.animate && stats.in_progress > 0 && "animate-spin"
                )} style={stat.animate ? { animationDuration: '2s' } : {}} />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Row - Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 md:gap-3">
        {/* Total Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/30 p-3 md:p-4 group hover:shadow-md transition-all duration-300"
        >
          <motion.div 
            className="absolute -top-10 -left-10 w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/15 to-purple-500/15 blur-2xl"
          />
          
          <div className="relative flex items-center gap-2 md:gap-3">
            <motion.div 
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md"
              whileHover={{ rotate: [0, -5, 5, 0] }}
            >
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">إجمالي الإيرادات</p>
              <div className="flex items-baseline gap-1">
                <span className="text-base md:text-xl font-bold text-foreground">
                  <AnimatedNumber value={stats.totalRevenue} delay={300} decimals={2} />
                </span>
                <span className="text-[10px] md:text-xs text-muted-foreground">$</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Today Orders Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring" }}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 p-3 md:p-4 group hover:shadow-md transition-all duration-300"
        >
          <motion.div 
            className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-500/15 blur-2xl"
          />
          
          <div className="relative flex items-center gap-2 md:gap-3">
            <motion.div 
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md"
              whileHover={{ rotate: [0, -5, 5, 0] }}
            >
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">طلبات اليوم</p>
              <div className="flex items-baseline gap-1">
                <span className="text-base md:text-xl font-bold text-foreground">
                  <AnimatedNumber value={stats.todayOrders} delay={350} />
                </span>
                <span className="text-[10px] md:text-xs text-muted-foreground">طلب</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Today Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 p-3 md:p-4 group hover:shadow-md transition-all duration-300"
        >
          <motion.div 
            className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br from-green-500/15 to-emerald-500/15 blur-2xl"
          />
          
          <div className="relative flex items-center gap-2 md:gap-3">
            <motion.div 
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md"
              whileHover={{ rotate: [0, -5, 5, 0] }}
            >
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">إيرادات اليوم</p>
              <div className="flex items-baseline gap-1">
                <span className="text-base md:text-xl font-bold text-foreground">
                  <AnimatedNumber value={stats.todayRevenue} delay={400} decimals={2} />
                </span>
                <span className="text-[10px] md:text-xs text-muted-foreground">$</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Completion Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: "spring" }}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/30 p-3 md:p-4 group hover:shadow-md transition-all duration-300"
        >
          <motion.div 
            className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/15 to-green-500/15 blur-2xl"
          />
          
          <div className="relative flex items-center gap-2 md:gap-3">
            <motion.div 
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md"
              whileHover={{ rotate: [0, -5, 5, 0] }}
            >
              <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">معدل الإنجاز</p>
              <motion.p 
                className="text-base md:text-xl font-bold text-emerald-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <AnimatedNumber value={completionRate} delay={450} />%
              </motion.p>
            </div>
            
            {/* Circular Progress */}
            <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                  className="opacity-30"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  fill="none"
                  stroke="url(#emeraldGradientAdmin)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${completionRate} 100`}
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{ strokeDasharray: `${completionRate} 100` }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="emeraldGradientAdmin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOrdersStats;
