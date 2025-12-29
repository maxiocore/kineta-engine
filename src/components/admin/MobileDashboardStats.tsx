import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedCounter from "./AnimatedCounter";

interface MobileStatCardProps {
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

const MobileStatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  suffix = "",
  gradient,
  iconBg,
  delay = 0,
  onClick,
}: MobileStatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      dir="rtl"
      className={cn(
        "relative overflow-hidden rounded-xl p-3 cursor-pointer group",
        "bg-card border border-border/50 hover:border-primary/30",
        "active:bg-secondary/50 transition-all duration-200"
      )}
    >
      {/* Hover gradient */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity",
        `bg-gradient-to-bl ${gradient}`
      )} />
      
      <div className="relative z-10 flex items-center gap-2.5 flex-row-reverse">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm", iconBg)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <div className="flex items-center gap-1.5 justify-end flex-row-reverse">
            <span className="text-base font-bold">
              <AnimatedCounter value={value} suffix={suffix} duration={1} />
            </span>
            {trend !== undefined && trend !== 0 && (
              <span className={cn(
                "flex items-center gap-0.5 text-[10px] font-medium flex-row-reverse",
                trend > 0 ? "text-success" : "text-destructive"
              )}>
                {trend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-active:opacity-100 transition-opacity shrink-0 rotate-180" />
      </div>
    </motion.div>
  );
};

interface MobileDashboardStatsProps {
  stats: Array<{
    title: string;
    value: number;
    icon: LucideIcon;
    gradient: string;
    iconBg: string;
    trend?: number;
    suffix?: string;
    onClick?: () => void;
  }>;
}

const MobileDashboardStats = ({ stats }: MobileDashboardStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-2" dir="rtl">
      {stats.map((stat, index) => (
        <MobileStatCard
          key={stat.title}
          {...stat}
          delay={index * 0.05}
        />
      ))}
    </div>
  );
};

export default MobileDashboardStats;
