import React from "react";
import { motion } from "framer-motion";
import { 
  Package, Clock, Loader2, CheckCircle, TrendingUp,
  DollarSign, Target, Wallet, Calendar, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernOrdersStatsProps {
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled?: number;
  };
  totalSpent: number;
  todaySpent?: number;
  previousMonthSpent?: number;
}

// Animated counter component
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

export const ModernOrdersStats = ({ stats, totalSpent, todaySpent = 0, previousMonthSpent = 0 }: ModernOrdersStatsProps) => {
  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  const spendingChange = previousMonthSpent > 0 
    ? Math.round(((totalSpent - previousMonthSpent) / previousMonthSpent) * 100)
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
      value: stats.cancelled || 0,
      icon: XCircle,
      gradient: "from-red-500/20 to-red-500/5",
      iconBg: "bg-gradient-to-br from-red-400 to-red-600",
      borderColor: "border-red-500/30"
    },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Stats Row - 5 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {mainStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.05,
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={cn(
              "relative overflow-hidden rounded-2xl bg-card border p-4 group hover:shadow-lg transition-all duration-300",
              `bg-gradient-to-br ${stat.gradient}`,
              stat.borderColor
            )}
          >
            {/* Background Glow */}
            <motion.div 
              className="absolute -top-8 -left-8 w-20 h-20 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity bg-gradient-to-br from-current"
            />
            
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[11px] text-muted-foreground font-medium mb-0.5 leading-tight">{stat.label}</p>
                <motion.p 
                  className="text-2xl font-bold tracking-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.08 + 0.2 }}
                >
                  <AnimatedNumber value={stat.value} delay={index * 80 + 100} />
                </motion.p>
              </div>
              
              <motion.div 
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                  stat.iconBg
                )}
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
              >
                <stat.icon className={cn(
                  "w-5 h-5 text-white",
                  stat.animate && stats.in_progress > 0 && "animate-spin"
                )} style={stat.animate ? { animationDuration: '2s' } : {}} />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Row - Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Spent Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring" }}
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/30 p-4 group hover:shadow-lg transition-all duration-300"
        >
          <motion.div 
            className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 blur-3xl"
          />
          
          <div className="relative flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg"
              whileHover={{ rotate: [0, -5, 5, 0] }}
            >
              <Wallet className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">إجمالي الإنفاق</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground">
                  <AnimatedNumber value={totalSpent} delay={350} decimals={2} />
                </span>
                <span className="text-xs text-muted-foreground">ر.س</span>
              </div>
            </div>
            {spendingChange !== 0 && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                spendingChange > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              )}>
                <TrendingUp className={cn("w-3 h-3", spendingChange < 0 && "rotate-180")} />
                {Math.abs(spendingChange)}%
              </div>
            )}
          </div>
        </motion.div>

        {/* Today Spent Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 p-4 group hover:shadow-lg transition-all duration-300"
        >
          <motion.div 
            className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl"
          />
          
          <div className="relative flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg"
              whileHover={{ rotate: [0, -5, 5, 0] }}
            >
              <Calendar className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">إنفاق اليوم</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground">
                  <AnimatedNumber value={todaySpent} delay={400} decimals={2} />
                </span>
                <span className="text-xs text-muted-foreground">ر.س</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Completion Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: "spring" }}
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/30 p-4 group hover:shadow-lg transition-all duration-300"
        >
          <motion.div 
            className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 blur-3xl"
          />
          
          <div className="relative flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg"
              whileHover={{ rotate: [0, -5, 5, 0] }}
            >
              <Target className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">معدل الإنجاز</p>
              <motion.p 
                className="text-xl font-bold text-emerald-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <AnimatedNumber value={completionRate} delay={450} />%
              </motion.p>
            </div>
            
            {/* Circular Progress */}
            <div className="relative w-10 h-10">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                  className="opacity-30"
                />
                <motion.circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="url(#emeraldGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${completionRate} 100`}
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{ strokeDasharray: `${completionRate} 100` }}
                  transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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

export default ModernOrdersStats;
