import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Clock, Loader2, CheckCircle, TrendingUp,
  DollarSign, Zap, Target, Sparkles, ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
const AnimatedNumber = ({ value, delay = 0 }: { value: number; delay?: number }) => {
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
        const current = Math.floor(easeOutQuart * end);
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
  
  return <span>{displayValue}</span>;
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
      gradient: "from-primary via-primary to-accent",
      bg: "bg-primary/10",
      glowColor: "shadow-primary/30",
      textColor: "text-primary"
    },
    {
      label: "قيد الانتظار",
      value: stats.pending,
      icon: Clock,
      gradient: "from-amber-500 via-orange-500 to-yellow-500",
      bg: "bg-amber-500/10",
      glowColor: "shadow-amber-500/30",
      textColor: "text-amber-500"
    },
    {
      label: "قيد التنفيذ",
      value: stats.in_progress,
      icon: Loader2,
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      bg: "bg-blue-500/10",
      glowColor: "shadow-blue-500/30",
      textColor: "text-blue-500",
      animate: true
    },
    {
      label: "مكتملة",
      value: stats.completed,
      icon: CheckCircle,
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      bg: "bg-emerald-500/10",
      glowColor: "shadow-emerald-500/30",
      textColor: "text-emerald-500"
    },
  ];

  return (
    <div className="space-y-5" dir="rtl">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.08,
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className={cn(
              "relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-5 group",
              "hover:border-transparent transition-all duration-500 cursor-pointer",
              `hover:shadow-xl hover:${stat.glowColor}`
            )}>
              {/* Animated Background Gradient */}
              <motion.div 
                className={cn(
                  "absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-500",
                  stat.bg
                )}
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-l from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
              
              <div className="relative flex items-center gap-4">
                <motion.div 
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                    stat.gradient,
                    stat.glowColor
                  )}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon className={cn(
                    "w-7 h-7 text-white",
                    stat.animate && stats.in_progress > 0 && "animate-spin"
                  )} />
                  
                  {/* Pulse Ring */}
                  {stat.animate && stats.in_progress > 0 && (
                    <motion.div
                      className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br", stat.gradient)}
                      animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                
                <div className="min-w-0 flex-1">
                  <motion.p 
                    className="text-3xl font-bold tracking-tight"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <AnimatedNumber value={stat.value} delay={index * 100 + 200} />
                  </motion.p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </div>

              {/* Decorative Sparkle */}
              {stat.value > 0 && (
                <motion.div
                  className="absolute top-3 left-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                >
                  <Sparkles className={cn("w-4 h-4 opacity-50", stat.textColor)} />
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Spent Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, type: "spring" }}
          whileHover={{ y: -4 }}
        >
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 p-6 group hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-500">
            {/* Animated Glow */}
            <motion.div 
              className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-violet-500/30 blur-3xl"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/30"
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                >
                  <DollarSign className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">إجمالي الإنفاق</p>
                  <motion.p 
                    className="text-3xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {totalSpent.toFixed(2)}
                    <span className="text-sm text-muted-foreground mr-2 font-medium">ر.س</span>
                  </motion.p>
                </div>
              </div>
              
              <motion.div 
                className="flex flex-col items-center gap-2"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-violet-500" />
                </div>
                <div className="flex items-center gap-1 text-xs text-violet-500 font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>متزايد</span>
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Completion Rate Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: "spring" }}
          whileHover={{ y: -4 }}
        >
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 p-6 group hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-500">
            {/* Animated Glow */}
            <motion.div 
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-500/30 blur-3xl"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                >
                  <Target className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">معدل الإنجاز</p>
                  <motion.p 
                    className="text-3xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <AnimatedNumber value={completionRate} delay={500} />%
                  </motion.p>
                </div>
              </div>
              
              {/* Animated Progress Ring */}
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="5"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="url(#emeraldGradient)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${completionRate * 1.63} 163`}
                    initial={{ strokeDasharray: "0 163" }}
                    animate={{ strokeDasharray: `${completionRate * 1.63} 163` }}
                    transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(142 76% 36%)" />
                      <stop offset="100%" stopColor="hsl(172 66% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-5 h-5 text-emerald-500" />
                </motion.div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 relative h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-emerald-500 via-green-500 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-y-0 w-1/4 bg-gradient-to-l from-transparent via-white/40 to-transparent"
                animate={{ x: ["-100%", "400%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1.5 }}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernOrdersStats;
