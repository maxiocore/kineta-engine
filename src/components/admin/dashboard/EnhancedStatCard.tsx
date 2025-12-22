import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedCounter from "../AnimatedCounter";

interface EnhancedStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  suffix?: string;
  gradient: string;
  iconBg: string;
  delay?: number;
  onClick?: () => void;
}

const EnhancedStatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  suffix = "",
  gradient,
  iconBg,
  delay = 0,
  onClick,
}: EnhancedStatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 100 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 sm:p-5 cursor-pointer group",
        "bg-card border border-border/50 hover:border-primary/30",
        "transition-all duration-300 hover:shadow-lg"
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        `bg-gradient-to-br ${gradient}`
      )} />
      
      {/* Glow Effect */}
      <div className={cn(
        "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity",
        iconBg
      )} />

      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <motion.div
            className={cn(
              "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-md",
              iconBg
            )}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.div>

          {trend !== undefined && trend !== 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2 }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                trend > 0
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(trend)}%</span>
            </motion.div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight">
            <AnimatedCounter value={value} suffix={suffix} duration={1.5} />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center justify-between">
            <span>{title}</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>
      </div>

      {/* Bottom Gradient Line */}
      <motion.div
        className={cn("absolute bottom-0 left-0 h-1 bg-gradient-to-r", gradient)}
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default EnhancedStatCard;
