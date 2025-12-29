import { motion } from "framer-motion";
import { Banknote, TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedCounter from "./AnimatedCounter";

interface MobileRevenueCardProps {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  revenueTrend: number;
}

const MobileRevenueCard = ({
  totalRevenue,
  monthlyRevenue,
  weeklyRevenue,
  revenueTrend,
}: MobileRevenueCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg sm:rounded-xl border border-border/40 p-2 sm:p-3 overflow-hidden relative"
      dir="rtl"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-primary/5 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5 flex-row-reverse justify-end">
          <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10">
            <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <span className="text-xs sm:text-sm font-semibold">الإيرادات</span>
          {revenueTrend !== 0 && (
            <span className={cn(
              "mr-auto flex items-center gap-0.5 text-[8px] sm:text-[10px] font-medium px-1 sm:px-1.5 py-0.5 rounded-full flex-row-reverse",
              revenueTrend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {revenueTrend > 0 ? <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> : <TrendingDown className="w-2 h-2 sm:w-2.5 sm:h-2.5" />}
              {Math.abs(revenueTrend)}%
            </span>
          )}
        </div>

        <div className="mb-2 sm:mb-3 text-right">
          <div className="flex items-baseline gap-1 justify-end flex-row-reverse">
            <span className="text-xl sm:text-2xl font-bold">
              <AnimatedCounter value={totalRevenue} duration={1} />
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground">ر.س</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground">إجمالي الإيرادات</p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="p-1.5 sm:p-2 rounded-lg bg-secondary/40 border border-border/30 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1 flex-row-reverse justify-end">
              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              <span className="text-[8px] sm:text-[10px] text-muted-foreground">هذا الشهر</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-right">
              {monthlyRevenue.toLocaleString('ar-SA')} 
              <span className="text-[8px] sm:text-[10px] font-normal text-muted-foreground mr-0.5 sm:mr-1">ر.س</span>
            </p>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="p-1.5 sm:p-2 rounded-lg bg-secondary/40 border border-border/30 hover:border-success/20 transition-colors"
          >
            <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1 flex-row-reverse justify-end">
              <BarChart3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-success" />
              <span className="text-[8px] sm:text-[10px] text-muted-foreground">هذا الأسبوع</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-right">
              {weeklyRevenue.toLocaleString('ar-SA')} 
              <span className="text-[8px] sm:text-[10px] font-normal text-muted-foreground mr-0.5 sm:mr-1">ر.س</span>
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileRevenueCard;
