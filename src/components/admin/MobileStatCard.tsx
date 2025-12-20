import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import { cn } from "@/lib/utils";

interface MobileStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  suffix?: string;
  gradient: string;
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
  delay = 0,
  onClick
}: MobileStatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-xl bg-card border border-border/40 overflow-hidden",
        onClick && "cursor-pointer active:scale-95 transition-transform"
      )}
    >
      {/* Background Gradient */}
      <div className={cn(
        "absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20",
        `bg-gradient-to-br ${gradient}`
      )} />
      
      <div className="relative z-10 flex flex-col gap-2">
        {/* Icon & Trend Row */}
        <div className="flex items-center justify-between">
          <motion.div 
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              `bg-gradient-to-br ${gradient}`
            )}
            whileTap={{ scale: 0.9 }}
          >
            <Icon className="w-4 h-4 text-white" />
          </motion.div>
          
          {trend !== undefined && trend !== 0 && (
            <div className={cn(
              "flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
              trend > 0 
                ? "text-success bg-success/10" 
                : "text-destructive bg-destructive/10"
            )}>
              {trend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        {/* Value */}
        <div className="text-right">
          <div className="text-lg font-bold leading-none">
            <AnimatedCounter value={value} suffix={suffix} duration={1} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 leading-none">{title}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileStatCard;
