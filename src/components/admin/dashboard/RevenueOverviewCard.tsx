import { motion } from "framer-motion";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Banknote,
  ArrowUpLeft,
  Sparkles,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import AnimatedCounter from "../AnimatedCounter";

interface RevenueOverviewCardProps {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  revenueTrend: number;
}

const RevenueOverviewCard = ({
  totalRevenue,
  monthlyRevenue,
  weeklyRevenue,
  revenueTrend,
}: RevenueOverviewCardProps) => {
  // Calculate monthly target progress (example: 50000 SAR target)
  const monthlyTarget = 50000;
  const targetProgress = Math.min((monthlyRevenue / monthlyTarget) * 100, 100);

  const stats = [
    {
      label: "إيرادات هذا الشهر",
      value: monthlyRevenue,
      color: "text-primary",
      bg: "bg-primary/10",
      borderColor: "border-primary/20",
      icon: BarChart3,
    },
    {
      label: "إيرادات هذا الأسبوع",
      value: weeklyRevenue,
      color: "text-success",
      bg: "bg-success/10",
      borderColor: "border-success/20",
      icon: TrendingUp,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      dir="rtl"
    >
      <Card className="border-border/50 overflow-hidden bg-gradient-to-bl from-primary/5 via-card to-card h-full relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/2 w-32 h-32 bg-success/5 rounded-full blur-xl" />

        {/* Sparkle decorations */}
        <motion.div
          className="absolute top-6 left-6 w-1.5 h-1.5 bg-primary/60 rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-8 left-1/3 w-1 h-1 bg-accent/50 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        />

        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <motion.div 
              className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </motion.div>
            <span>نظرة على الإيرادات</span>
            <Sparkles className="w-4 h-4 text-warning mr-auto" />
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4">
          {/* Main Revenue */}
          <div className="p-4 rounded-xl bg-gradient-to-l from-primary/10 to-transparent border border-primary/10">
            <div className="flex items-end gap-3 flex-wrap justify-end">
              <div className="text-left">
                {revenueTrend !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mb-2",
                      revenueTrend > 0
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    )}
                  >
                    {revenueTrend > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(revenueTrend)}% من الشهر الماضي
                  </motion.div>
                )}
              </div>
              <div className="flex-1 text-right">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text">
                  <AnimatedCounter value={totalRevenue} duration={1.5} />
                </span>
                <span className="text-lg sm:text-xl text-muted-foreground mr-2">ر.س</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-right">إجمالي الإيرادات</p>
          </div>

          {/* Monthly Target Progress */}
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                الهدف الشهري
              </span>
              <span className="text-xs font-medium">{targetProgress.toFixed(0)}%</span>
            </div>
            <Progress value={targetProgress} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1.5 text-left">
              {monthlyRevenue.toLocaleString('ar-SA')} / {monthlyTarget.toLocaleString('ar-SA')} ر.س
            </p>
          </div>

          {/* Sub Stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={cn(
                  "p-3 rounded-xl bg-secondary/30 border transition-all cursor-pointer group",
                  stat.borderColor,
                  "hover:shadow-md"
                )}
              >
                <div className={cn("p-2 rounded-lg w-fit mb-2", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
                <p className="text-lg sm:text-xl font-bold text-right">
                  {stat.value.toLocaleString('ar-SA')}
                  <span className="text-xs font-normal text-muted-foreground mr-1">ر.س</span>
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground text-right">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RevenueOverviewCard;
