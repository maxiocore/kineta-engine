import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import AnimatedCounter from "./AnimatedCounter";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  prefix?: string;
  suffix?: string;
  gradient: string;
  shadowColor: string;
  delay?: number;
  onClick?: () => void;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  prefix = "",
  suffix = "",
  gradient,
  shadowColor,
  delay = 0,
  onClick
}: StatCardProps) => {
  const getTrendIcon = () => {
    if (!trend || trend === 0) return <Minus className="w-3 h-3" />;
    return trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend || trend === 0) return "text-muted-foreground bg-muted/50";
    return trend > 0 
      ? "text-success bg-success/10 border-success/20" 
      : "text-destructive bg-destructive/10 border-destructive/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 120 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : ""}
      dir="rtl"
    >
      <Card className={cn(
        "border-border/30 hover:border-primary/30 transition-all duration-300 group overflow-hidden w-full min-w-0",
        shadowColor,
        "shadow-md hover:shadow-lg"
      )}>
        <CardContent className="p-1.5 sm:p-3 lg:p-4 relative">
          {/* Background Glow */}
          <div className={cn(
            "absolute -top-12 -left-12 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500",
            `bg-gradient-to-br ${gradient}`
          )} />
          
          <div className="relative z-10">
            <div className="flex flex-row-reverse items-start justify-between mb-1 sm:mb-2">
              <motion.div 
                className={cn(
                  "w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-md sm:rounded-lg p-1 sm:p-2 shadow-sm relative overflow-hidden flex-shrink-0",
                  `bg-gradient-to-br ${gradient}`
                )}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Icon className="w-full h-full text-primary-foreground relative z-10" />
              </motion.div>

              {trend !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.2 }}
                  className={cn(
                    "flex flex-row-reverse items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-medium border",
                    getTrendColor()
                  )}
                >
                  {getTrendIcon()}
                  <span>{Math.abs(trend || 0)}%</span>
                </motion.div>
              )}
            </div>

            <div className="space-y-0 text-right min-w-0">
              <div className="text-xs sm:text-base lg:text-xl xl:text-2xl font-bold tracking-tight truncate">
                <AnimatedCounter 
                  value={value} 
                  prefix={prefix}
                  suffix={suffix}
                  duration={1.2}
                />
              </div>
              <p className="text-[7px] sm:text-[9px] lg:text-[10px] text-muted-foreground font-medium truncate">{title}</p>
            </div>

            {/* Hover Line */}
            <motion.div
              className={cn("absolute bottom-0 right-0 h-0.5 bg-gradient-to-l", gradient)}
              initial={{ width: 0 }}
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
