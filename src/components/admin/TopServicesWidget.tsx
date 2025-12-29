import { motion } from "framer-motion";
import { Package, Eye, TrendingUp, Star, ChevronLeft } from "lucide-react";
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

// Helper function to format mixed text with proper BIDI handling
const formatServiceName = (name: string) => {
  // Pattern to match English text, numbers with ranges, or special keywords
  const mixedPattern = /(NO REFILL|REFILL|[\d,]+[-–][\d,]+|[\d,]+K?[-–][\d,]+K?|\d+K?)/gi;
  
  const parts = name.split(mixedPattern);
  const matches = name.match(mixedPattern) || [];
  
  let result: React.ReactNode[] = [];
  let matchIndex = 0;
  
  parts.forEach((part, index) => {
    if (part) {
      result.push(<span key={`text-${index}`}>{part}</span>);
    }
    if (matchIndex < matches.length && index < parts.length - 1) {
      result.push(
        <span key={`match-${matchIndex}`} dir="ltr" className="bidi-plaintext inline-block">
          {matches[matchIndex]}
        </span>
      );
      matchIndex++;
    }
  });
  
  return result.length > 0 ? result : name;
};

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
      <CardHeader className="flex flex-row-reverse items-center justify-between p-2 sm:p-3 pb-1 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm lg:text-base flex flex-row-reverse items-center gap-1.5">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning" />
          أفضل الخدمات
        </CardTitle>
        <Link to="/admin/services">
          <Button variant="ghost" size="sm" className="gap-1 text-[9px] sm:text-[10px] h-6 sm:h-7 flex flex-row-reverse">
            <span>عرض الكل</span>
            <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 scale-x-[-1]" />
          </Button>
        </Link>
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
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group"
              >
                <div className="flex flex-row-reverse items-center justify-between gap-2 sm:gap-3 min-w-0 mb-1">
                  {/* Rank Badge */}
                  <motion.span 
                    className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-sm shrink-0",
                      index < 3 
                        ? `bg-gradient-to-br ${getRankStyle(index)} text-primary-foreground`
                        : "bg-secondary text-muted-foreground"
                    )}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    {index + 1}
                  </motion.span>
                  
                  {/* Service Name & Orders */}
                  <div className="flex-1 min-w-0 text-right" dir="rtl">
                    <div className="flex flex-row-reverse items-center justify-between gap-1 min-w-0">
                      <p className="font-medium text-[9px] sm:text-[10px] lg:text-xs truncate group-hover:text-primary transition-colors bidi-plaintext" dir="rtl">
                        {formatServiceName(service.name)}
                      </p>
                      {service.trend && service.trend > 0 && (
                        <span className="flex flex-row-reverse items-center text-[8px] sm:text-[9px] text-success shrink-0">
                          <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5 me-0.5" />
                          <span dir="ltr" className="bidi-plaintext">{service.trend}٪</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] sm:text-[9px] text-muted-foreground">
                      <span dir="ltr" className="bidi-plaintext">{service.orders.toLocaleString("ar-SA")}</span> طلب
                    </p>
                  </div>
                  
                  {/* Revenue */}
                  <div className="shrink-0 text-end">
                    <span className="font-bold text-[9px] sm:text-[10px] lg:text-xs text-success" dir="ltr">
                      {service.revenue.toLocaleString("ar-SA")}
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-muted-foreground me-0.5"> ر.س</span>
                  </div>
                </div>
                
                {/* Progress Bar - RTL (starts from right) */}
                <div className="me-6 sm:me-7 lg:me-8">
                  <motion.div
                    className="h-0.5 sm:h-1 rounded-full bg-secondary overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.15 }}
                    style={{ direction: 'rtl' }}
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
                      transition={{ delay: index * 0.08 + 0.2, duration: 0.6, ease: "easeOut" }}
                      style={{ marginRight: 0, marginLeft: 'auto' }}
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
