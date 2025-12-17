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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : ""}
    >
      <Card className={cn(
        "card-elevated border-border/30 hover:border-primary/30 transition-all duration-500 group overflow-hidden",
        shadowColor,
        "shadow-lg hover:shadow-xl"
      )}>
        <CardContent className="p-5 sm:p-6 relative">
          {/* Background Glow */}
          <div className={cn(
            "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500",
            `bg-gradient-to-br ${gradient}`
          )} />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <motion.div 
                className={cn(
                  "w-14 h-14 rounded-2xl p-3.5 shadow-lg relative overflow-hidden",
                  `bg-gradient-to-br ${gradient}`
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Icon className="w-full h-full text-primary-foreground relative z-10" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                  initial={{ y: "100%" }}
                  whileHover={{ y: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>

              {trend !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.3 }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
                    getTrendColor()
                  )}
                >
                  {getTrendIcon()}
                  <span>{Math.abs(trend || 0)}%</span>
                </motion.div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight">
                <AnimatedCounter 
                  value={value} 
                  prefix={prefix}
                  suffix={suffix}
                  duration={1.5}
                />
              </div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
            </div>

            {/* Hover Line */}
            <motion.div
              className={cn("absolute bottom-0 left-0 h-1 bg-gradient-to-r", gradient)}
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
