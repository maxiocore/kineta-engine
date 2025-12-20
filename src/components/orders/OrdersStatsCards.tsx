import { motion } from "framer-motion";
import { Package, Clock, Loader2, CheckCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrdersStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  totalSpent: number;
  previousMonthSpent?: number;
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

export const OrdersStatsCards = ({ stats, totalSpent, previousMonthSpent = 0 }: OrdersStatsCardsProps) => {
  const spendingChange = previousMonthSpent > 0 
    ? ((totalSpent - previousMonthSpent) / previousMonthSpent) * 100 
    : 0;

  const statCards = [
    { 
      label: "إجمالي الطلبات", 
      value: stats.total, 
      icon: Package, 
      gradient: "from-primary via-primary to-cyan-400", 
      bg: "bg-primary/10",
      glow: "shadow-primary/20"
    },
    { 
      label: "قيد الانتظار", 
      value: stats.pending, 
      icon: Clock, 
      gradient: "from-warning via-amber-500 to-orange-400", 
      bg: "bg-warning/10",
      glow: "shadow-warning/20"
    },
    { 
      label: "قيد التنفيذ", 
      value: stats.in_progress, 
      icon: Loader2, 
      gradient: "from-accent via-purple-500 to-pink-400", 
      bg: "bg-accent/10", 
      spin: true,
      glow: "shadow-accent/20"
    },
    { 
      label: "مكتملة", 
      value: stats.completed, 
      icon: CheckCircle, 
      gradient: "from-success via-emerald-500 to-teal-400", 
      bg: "bg-success/10",
      glow: "shadow-success/20"
    },
    { 
      label: "إجمالي الإنفاق", 
      value: `${totalSpent.toFixed(2)} ر.س`, 
      icon: TrendingUp, 
      gradient: "from-violet-500 via-purple-500 to-fuchsia-400", 
      bg: "bg-violet-500/10", 
      isPrice: true,
      change: spendingChange,
      glow: "shadow-violet-500/20"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" dir="rtl">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -6, scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: index * 0.06, type: "spring", stiffness: 280, damping: 20 }}
          className={cn(
            "lg:col-span-1",
            index === 4 && "col-span-2 lg:col-span-1"
          )}
        >
          <Card className={cn(
            "border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-500",
            stat.glow && `hover:${stat.glow}`
          )}>
            <CardContent className="p-4 relative">
              {/* Animated background gradient - RTL position */}
              <motion.div 
                className={cn(
                  "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-all duration-500 opacity-50",
                  stat.bg
                )}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.7, 0.5]
                }}
                transition={{ duration: 4, repeat: Infinity, delay: index * 0.3 }}
              />
              
              {/* Shimmer effect on hover - RTL direction */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent"
                  initial={{ x: "100%" }}
                  whileHover={{ x: "-100%" }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              
              <div className="relative flex items-center gap-3 flex-row-reverse">
                <motion.div 
                  className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br p-2.5 shadow-lg shrink-0 relative overflow-hidden",
                    stat.gradient
                  )}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                >
                  <stat.icon className={cn(
                    "w-full h-full text-white relative z-10",
                    stat.spin && "animate-spin"
                  )} />
                  {/* Icon glow effect */}
                  <div className="absolute inset-0 bg-white/20 blur-md" />
                </motion.div>
                
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center gap-2 justify-end flex-row-reverse">
                    <motion.p 
                      className={cn("font-bold", stat.isPrice ? "text-lg" : "text-2xl")}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      {stat.value}
                    </motion.p>
                    
                    {/* Change indicator for spending */}
                    {stat.change !== undefined && stat.change !== 0 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full flex-row-reverse",
                          stat.change > 0 
                            ? "bg-success/20 text-success" 
                            : "bg-destructive/20 text-destructive"
                        )}
                      >
                        {Math.abs(stat.change).toFixed(0)}%
                        {stat.change > 0 ? (
                          <ArrowUpRight className="w-3 h-3 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 mr-0.5" />
                        )}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default OrdersStatsCards;
