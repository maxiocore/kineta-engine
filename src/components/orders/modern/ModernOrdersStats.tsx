import React from "react";
import { motion } from "framer-motion";
import { 
  Package, Clock, Loader2, CheckCircle, TrendingUp,
  DollarSign, Zap, Target
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

export const ModernOrdersStats = ({ stats, totalSpent }: ModernOrdersStatsProps) => {
  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  const statItems = [
    {
      label: "إجمالي الطلبات",
      value: stats.total,
      icon: Package,
      gradient: "from-primary to-cyan-400",
      bg: "bg-primary/10",
      textColor: "text-primary"
    },
    {
      label: "قيد الانتظار",
      value: stats.pending,
      icon: Clock,
      gradient: "from-amber-500 to-orange-400",
      bg: "bg-amber-500/10",
      textColor: "text-amber-500"
    },
    {
      label: "قيد التنفيذ",
      value: stats.in_progress,
      icon: Loader2,
      gradient: "from-blue-500 to-indigo-400",
      bg: "bg-blue-500/10",
      textColor: "text-blue-500",
      spin: true
    },
    {
      label: "مكتملة",
      value: stats.completed,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-400",
      bg: "bg-emerald-500/10",
      textColor: "text-emerald-500"
    },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-4 group hover:shadow-lg transition-all duration-300">
              {/* Background gradient */}
              <div className={cn(
                "absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity",
                stat.bg
              )} />
              
              <div className="relative flex items-center gap-3">
                <motion.div 
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                    stat.gradient
                  )}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                >
                  <stat.icon className={cn(
                    "w-5 h-5 text-white",
                    stat.spin && stats.in_progress > 0 && "animate-spin"
                  )} />
                </motion.div>
                
                <div className="min-w-0 flex-1">
                  <motion.p 
                    className="text-2xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Total Spent Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4 group hover:shadow-lg transition-all">
            <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-violet-500/20 blur-2xl" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي الإنفاق</p>
                  <p className="text-2xl font-bold">
                    {totalSpent.toFixed(2)}
                    <span className="text-sm text-muted-foreground mr-1">ر.س</span>
                  </p>
                </div>
              </div>
              
              <motion.div 
                className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="w-5 h-5 text-violet-500" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Completion Rate Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 group hover:shadow-lg transition-all">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/20 blur-2xl" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">معدل الإنجاز</p>
                  <p className="text-2xl font-bold">
                    {completionRate}%
                  </p>
                </div>
              </div>
              
              {/* Mini progress ring */}
              <div className="relative w-12 h-12">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="hsl(142 76% 36%)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${completionRate * 1.26} 126`}
                    initial={{ strokeDasharray: "0 126" }}
                    animate={{ strokeDasharray: `${completionRate * 1.26} 126` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </svg>
                <Zap className="w-4 h-4 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernOrdersStats;
