import React from "react";
import { motion } from "framer-motion";
import { 
  Package, Clock, Loader2, CheckCircle, TrendingUp,
  DollarSign, Target, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernOrdersStatsProps {
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  totalSpent: number;
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

export const ModernOrdersStats = ({ stats, totalSpent }: ModernOrdersStatsProps) => {
  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  const statItems = [
    {
      label: "إجمالي الطلبات",
      value: stats.total,
      icon: Package,
      gradient: "from-cyan-400 to-blue-500",
      iconBg: "bg-gradient-to-br from-cyan-400 to-blue-500"
    },
    {
      label: "قيد الانتظار",
      value: stats.pending,
      icon: Clock,
      gradient: "from-pink-400 to-rose-500",
      iconBg: "bg-gradient-to-br from-pink-400 to-rose-500"
    },
    {
      label: "قيد التنفيذ",
      value: stats.in_progress,
      icon: Loader2,
      gradient: "from-violet-400 to-purple-500",
      iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
      animate: true
    },
    {
      label: "مكتملة",
      value: stats.completed,
      icon: CheckCircle,
      gradient: "from-emerald-400 to-green-500",
      iconBg: "bg-gradient-to-br from-emerald-400 to-green-500"
    },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.06,
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
            whileHover={{ y: -3, scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 p-4 group hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
          >
            {/* Background Glow */}
            <motion.div 
              className={cn(
                "absolute -top-10 -left-10 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity",
                `bg-gradient-to-br ${stat.gradient}`
              )}
            />
            
            <div className="relative flex items-center gap-3">
              <motion.div 
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                  stat.iconBg
                )}
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
              >
                <stat.icon className={cn(
                  "w-6 h-6 text-white",
                  stat.animate && stats.in_progress > 0 && "animate-spin"
                )} style={stat.animate ? { animationDuration: '2s' } : {}} />
              </motion.div>
              
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{stat.label}</p>
                <motion.p 
                  className="text-2xl font-bold tracking-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.08 + 0.2 }}
                >
                  <AnimatedNumber value={stat.value} delay={index * 80 + 150} />
                </motion.p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Row - Completion Rate & Total Spent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Completion Rate Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 p-5 group hover:border-emerald-500/20 transition-all duration-300 hover:shadow-lg"
        >
          {/* Background Gradient */}
          <motion.div 
            className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 blur-3xl"
          />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                >
                  <Target className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">معدل الإنجاز</p>
                  <motion.p 
                    className="text-3xl font-bold text-emerald-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <AnimatedNumber value={completionRate} delay={400} />%
                  </motion.p>
                </div>
              </div>
              
              {/* Circular Progress */}
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="4"
                    className="opacity-30"
                  />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="url(#emeraldGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${completionRate * 1.38} 138`}
                    initial={{ strokeDasharray: "0 138" }}
                    animate={{ strokeDasharray: `${completionRate * 1.38} 138` }}
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

            {/* Progress Bar */}
            <div className="relative h-2.5 rounded-full bg-muted/40 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-emerald-400 to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Total Spent Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, type: "spring" }}
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 p-5 group hover:border-violet-500/20 transition-all duration-300 hover:shadow-lg"
        >
          {/* Background Gradient */}
          <motion.div 
            className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 blur-3xl"
          />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg"
                whileHover={{ rotate: [0, -5, 5, 0] }}
              >
                <DollarSign className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">إجمالي الإنفاق</p>
                <motion.div 
                  className="flex items-baseline gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <span className="text-3xl font-bold text-violet-500">
                    <AnimatedNumber value={totalSpent} delay={450} decimals={2} />
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">ر.س</span>
                </motion.div>
              </div>
            </div>
            
            {/* Trend Indicator */}
            <motion.div 
              className="flex flex-col items-center gap-1"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-500" />
              </div>
              <div className="flex items-center gap-0.5 text-[10px] text-violet-500 font-semibold">
                <ArrowUpRight className="w-3 h-3" />
                <span>متزايد</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernOrdersStats;
