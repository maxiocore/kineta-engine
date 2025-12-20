import { motion } from "framer-motion";
import { Star, TrendingUp, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface TopService {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  trend?: number;
}

interface MobileTopServicesProps {
  services: TopService[];
}

const MobileTopServices = ({ services }: MobileTopServicesProps) => {
  const max = Math.max(...services.map(s => s.revenue), 1);
  
  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "from-yellow-500 to-amber-600";
      case 1: return "from-slate-400 to-slate-500";
      case 2: return "from-amber-600 to-orange-700";
      default: return "from-muted to-muted-foreground/30";
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" />
          <span className="text-sm font-semibold">أفضل الخدمات</span>
        </div>
        <Link 
          to="/admin/services"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          عرض الكل
          <ChevronLeft className="w-3 h-3" />
        </Link>
      </div>
      
      {/* Services List */}
      <div className="divide-y divide-border/30">
        {services.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">لا توجد خدمات بعد</p>
          </div>
        ) : (
          services.slice(0, 4).map((service, index) => {
            const percentage = (service.revenue / max) * 100;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {/* Rank Badge */}
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white",
                    `bg-gradient-to-br ${getRankColor(index)}`
                  )}>
                    {index + 1}
                  </div>
                  
                  {/* Service Info */}
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-xs font-medium truncate">{service.name}</p>
                    <p className="text-[10px] text-muted-foreground">{service.orders} طلب</p>
                  </div>
                  
                  {/* Revenue & Trend */}
                  <div className="text-left shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-success">
                        {service.revenue.toLocaleString("ar-SA")}
                      </span>
                      <span className="text-[9px] text-muted-foreground">ر.س</span>
                    </div>
                    {service.trend && service.trend > 0 && (
                      <div className="flex items-center gap-0.5 text-[9px] text-success justify-end">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {service.trend}%
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1 rounded-full bg-secondary overflow-hidden mr-8">
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
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MobileTopServices;
