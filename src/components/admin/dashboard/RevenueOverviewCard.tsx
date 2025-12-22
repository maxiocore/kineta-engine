import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const stats = [
    {
      label: "هذا الشهر",
      value: monthlyRevenue,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "هذا الأسبوع",
      value: weeklyRevenue,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-primary/5 via-card to-card">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />

        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            نظرة على الإيرادات
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10">
          {/* Main Revenue */}
          <div className="mb-4">
            <div className="flex items-end gap-2">
              <span className="text-3xl sm:text-4xl font-bold">
                <AnimatedCounter value={totalRevenue} duration={1.5} />
              </span>
              <span className="text-lg text-muted-foreground mb-1">ر.س</span>
              {revenueTrend !== 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-1",
                    revenueTrend > 0
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {revenueTrend > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(revenueTrend)}%
                </motion.div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">إجمالي الإيرادات</p>
          </div>

          {/* Sub Stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="p-3 rounded-xl bg-secondary/30 border border-border/30"
              >
                <div className={cn("p-1.5 rounded-lg w-fit mb-2", stat.bg)}>
                  <BarChart3 className={cn("w-3.5 h-3.5", stat.color)} />
                </div>
                <p className="text-lg sm:text-xl font-bold">
                  {stat.value.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ر.س</span>
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RevenueOverviewCard;
