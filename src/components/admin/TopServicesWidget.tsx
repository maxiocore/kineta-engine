import { motion } from "framer-motion";
import { Package, ChevronLeft, TrendingUp, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface TopService {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  trend?: number;
}

interface TopServicesWidgetProps {
  services: TopService[];
  maxRevenue?: number;
}

const TopServicesWidget = ({ services, maxRevenue }: TopServicesWidgetProps) => {
  const max = maxRevenue || Math.max(...services.map(s => s.revenue), 1);
  
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "from-yellow-500 to-amber-600";
      case 1:
        return "from-slate-400 to-slate-500";
      case 2:
        return "from-amber-600 to-orange-700";
      default:
        return "from-primary/50 to-primary/30";
    }
  };

  const getProgressColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-l from-yellow-500 to-amber-500";
      case 1:
        return "bg-gradient-to-l from-slate-400 to-slate-500";
      case 2:
        return "bg-gradient-to-l from-amber-600 to-orange-600";
      default:
        return "bg-primary";
    }
  };

  return (
    <Card className="border-border/30 h-full" dir="rtl">
      <CardHeader className="p-2 sm:p-3 pb-1 sm:pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs sm:text-sm lg:text-base flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning" />
            أفضل الخدمات
          </CardTitle>
          <Link to="/admin/services">
            <Button variant="ghost" size="sm" className="gap-1 text-[9px] sm:text-[10px] h-6 sm:h-7">
              عرض الكل
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 sm:p-3 pt-0 space-y-1.5 sm:space-y-2">
        {services.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
            <p className="text-xs">لا توجد خدمات بعد</p>
          </div>
        ) : (
          services.map((service, index) => {
            const percentage = (service.revenue / max) * 100;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group"
              >
                {/* Service Row */}
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  {/* Rank Badge */}
                  <motion.span 
                    className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-sm shrink-0",
                      index < 3 
                        ? `bg-gradient-to-br ${getRankStyle(index)} text-white`
                        : "bg-secondary text-muted-foreground"
                    )}
                    whileHover={{ scale: 1.05 }}
                  >
                    {index + 1}
                  </motion.span>
                  
                  {/* Service Name & Orders */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[9px] sm:text-[10px] lg:text-xs truncate group-hover:text-primary transition-colors">
                      {service.name}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-muted-foreground">
                      {service.orders.toLocaleString("ar-SA")} طلب
                    </p>
                  </div>
                  
                  {/* Trend */}
                  {service.trend && service.trend > 0 && (
                    <span className="flex items-center text-[8px] sm:text-[9px] text-success shrink-0">
                      <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5 ml-0.5" />
                      {service.trend}٪
                    </span>
                  )}
                  
                  {/* Revenue */}
                  <div className="shrink-0 text-left">
                    <span className="font-bold text-[9px] sm:text-[10px] lg:text-xs text-success">
                      {service.revenue.toLocaleString("ar-SA")}
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-muted-foreground mr-0.5"> ر.س</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mr-6 sm:mr-7 lg:mr-8">
                  <motion.div
                    className="h-0.5 sm:h-1 rounded-full bg-secondary overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className={cn("h-full rounded-full", getProgressColor(index))}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.08 + 0.2, duration: 0.6, ease: "easeOut" }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default TopServicesWidget;
