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
    <Card className="card-elevated border-border/30 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-warning" />
          أفضل الخدمات
        </CardTitle>
        <Link to="/admin/services">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            عرض الكل
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد خدمات بعد</p>
          </div>
        ) : (
          services.map((service, index) => {
            const percentage = (service.revenue / max) * 100;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <motion.span 
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg",
                      index < 3 
                        ? `bg-gradient-to-br ${getRankStyle(index)} text-primary-foreground`
                        : "bg-secondary text-muted-foreground"
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {index + 1}
                  </motion.span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {service.name}
                      </p>
                      <div className="flex items-center gap-2 shrink-0 mr-2">
                        {service.trend && service.trend > 0 && (
                          <span className="flex items-center text-xs text-success">
                            <TrendingUp className="w-3 h-3 ml-0.5" />
                            {service.trend}%
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{service.orders} طلب</p>
                  </div>
                  
                  <div className="text-left shrink-0">
                    <span className="font-bold text-sm text-success">
                      {service.revenue.toLocaleString("ar-SA")}
                    </span>
                    <span className="text-xs text-muted-foreground mr-1">ر.س</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mr-[52px]">
                  <motion.div
                    className="h-1.5 rounded-full bg-secondary overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        index === 0 ? "bg-gradient-to-r from-yellow-500 to-amber-500" :
                        index === 1 ? "bg-gradient-to-r from-slate-400 to-slate-500" :
                        index === 2 ? "bg-gradient-to-r from-amber-600 to-orange-600" :
                        "bg-primary"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
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
