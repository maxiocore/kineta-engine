import { motion } from "framer-motion";
import { Package, Eye, TrendingUp, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
        return "from-yellow-500 to-amber-600 shadow-yellow-500/30";
      case 1:
        return "from-slate-400 to-slate-500 shadow-slate-400/30";
      case 2:
        return "from-amber-600 to-orange-700 shadow-amber-600/30";
      default:
        return "from-primary/20 to-primary/5 border border-primary/20";
    }
  };

  return (
    <Card className="border-border/30 h-full" dir="rtl">
      <CardHeader className="flex flex-row-reverse items-center justify-between p-3 sm:p-4 pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base lg:text-lg flex flex-row-reverse items-center gap-2">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
          أفضل الخدمات
        </CardTitle>
        <Link to="/admin/services">
          <Button variant="ghost" size="sm" className="gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 flex flex-row-reverse">
            عرض الكل
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </Link>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 pt-0 space-y-2 sm:space-y-3">
        {services.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد خدمات بعد</p>
          </div>
        ) : (
          services.map((service, index) => {
            const percentage = (service.revenue / max) * 100;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group"
              >
                <div className="flex flex-row-reverse items-center gap-2 sm:gap-3 mb-1.5">
                  <motion.span 
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-md",
                      index < 3 
                        ? `bg-gradient-to-br ${getRankStyle(index)} text-primary-foreground`
                        : "bg-secondary text-muted-foreground"
                    )}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    {index + 1}
                  </motion.span>
                  
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex flex-row-reverse items-center justify-between gap-1">
                      <p className="font-medium text-[11px] sm:text-xs lg:text-sm truncate group-hover:text-primary transition-colors">
                        {service.name}
                      </p>
                      {service.trend && service.trend > 0 && (
                        <span className="flex flex-row-reverse items-center text-[9px] sm:text-[10px] text-success shrink-0">
                          <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5" />
                          {service.trend}%
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{service.orders} طلب</p>
                  </div>
                  
                  <div className="text-left shrink-0">
                    <span className="font-bold text-[10px] sm:text-xs lg:text-sm text-success">
                      {service.revenue.toLocaleString("ar-SA")}
                    </span>
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground mr-0.5">ر.س</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mr-9 sm:mr-10 lg:mr-11">
                  <motion.div
                    className="h-1 sm:h-1.5 rounded-full bg-secondary overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.15 }}
                  >
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        index === 0 ? "bg-gradient-to-l from-yellow-500 to-amber-500" :
                        index === 1 ? "bg-gradient-to-l from-slate-400 to-slate-500" :
                        index === 2 ? "bg-gradient-to-l from-amber-600 to-orange-600" :
                        "bg-primary"
                      )}
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
