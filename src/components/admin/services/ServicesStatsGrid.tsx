import { motion } from "framer-motion";
import { Package, TrendingUp, ShoppingCart, DollarSign, BarChart3, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ServicesStatsGridProps {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  totalRevenue: number;
  totalOrders: number;
  avgPrice: number;
}

const ServicesStatsGrid = ({ 
  totalServices, 
  activeServices, 
  inactiveServices,
  totalRevenue, 
  totalOrders,
  avgPrice,
}: ServicesStatsGridProps) => {
  const stats = [
    {
      label: "إجمالي الخدمات",
      value: totalServices,
      icon: Package,
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-gradient-to-br from-primary to-blue-600",
    },
    {
      label: "الخدمات النشطة",
      value: activeServices,
      icon: TrendingUp,
      gradient: "from-success/20 to-success/5",
      iconBg: "bg-gradient-to-br from-success to-emerald-600",
    },
    {
      label: "غير النشطة",
      value: inactiveServices,
      icon: Zap,
      gradient: "from-warning/20 to-warning/5",
      iconBg: "bg-gradient-to-br from-warning to-orange-600",
    },
    {
      label: "إجمالي الطلبات",
      value: totalOrders,
      icon: ShoppingCart,
      gradient: "from-accent/20 to-accent/5",
      iconBg: "bg-gradient-to-br from-accent to-purple-600",
    },
    {
      label: "الإيرادات",
      value: `$${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      gradient: "from-success/20 to-success/5",
      iconBg: "bg-gradient-to-br from-success to-teal-600",
    },
    {
      label: "متوسط السعر",
      value: `$${avgPrice.toFixed(2)}`,
      icon: BarChart3,
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-gradient-to-br from-primary to-indigo-600",
    },
  ];

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 min-w-[480px] sm:min-w-0">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`relative overflow-hidden p-3 bg-gradient-to-br ${stat.gradient} border-border/50`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${stat.iconBg} flex items-center justify-center shadow-md shrink-0`}>
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-sm sm:text-base font-bold text-foreground truncate">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesStatsGrid;