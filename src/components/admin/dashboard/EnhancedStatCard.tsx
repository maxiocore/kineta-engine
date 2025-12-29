import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
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
  subtitle?: string;
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
  subtitle,
}: EnhancedStatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 100 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      dir="rtl"
      className={cn(
        "relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 cursor-pointer group w-full",
        "bg-card border border-border/50 hover:border-primary/30",
        "transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        `bg-gradient-to-bl ${gradient}`
      )} />
      
      {/* Multiple Glow Effects */}
      <div className={cn(
        "absolute -top-10 -left-10 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-50 transition-opacity",
        iconBg
      )} />
      <div className={cn(
        "absolute -bottom-8 -right-8 w-20 h-20 rounded-full blur-xl opacity-10 group-hover:opacity-30 transition-opacity",
        iconBg
      )} />

      {/* Sparkle Effect */}
      <motion.div
        className="absolute top-3 left-3 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-80"
        animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />

      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <motion.div
            className={cn(
              "w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg",
              iconBg
            )}
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </motion.div>

          {trend !== undefined && trend !== 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2 }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                trend > 0
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{Math.abs(trend)}%</span>
            </motion.div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1 sm:space-y-1.5 text-right">
          <div className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            <AnimatedCounter value={value} suffix={suffix} duration={1.5} />
          </div>
          <p className="text-xs sm:text-base text-foreground font-semibold">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">{subtitle}</p>
          )}
          <div className="flex items-center justify-end gap-1 text-[10px] sm:text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span>عرض التفاصيل</span>
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
      </div>

      {/* Bottom Gradient Line */}
      <motion.div
        className={cn("absolute bottom-0 right-0 h-1 bg-gradient-to-l rounded-bl-2xl", gradient.replace('/20', '').replace('/5', ''))}
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.3 }}
      />

      {/* Corner Accent */}
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/5 to-transparent rounded-bl-2xl" />
    </motion.div>
  );
};

export default EnhancedStatCard;
