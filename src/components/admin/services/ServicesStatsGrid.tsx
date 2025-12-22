import { motion } from "framer-motion";
import { Package, TrendingUp, DollarSign, ShoppingCart, Zap, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
  avgPrice
}: ServicesStatsGridProps) => {
  const stats = [
    {
      title: "إجمالي الخدمات",
      value: totalServices,
      icon: Package,
      gradient: "from-primary to-cyan-400",
    },
    {
      title: "النشطة",
      value: activeServices,
      icon: TrendingUp,
      gradient: "from-success to-emerald-400",
      trend: activeServices > 0 && totalServices > 0 ? `${Math.round((activeServices / totalServices) * 100)}%` : undefined,
    },
    {
      title: "غير النشطة",
      value: inactiveServices,
      icon: Zap,
      gradient: "from-warning to-orange-400",
    },
    {
      title: "الطلبات",
      value: totalOrders,
      icon: ShoppingCart,
      gradient: "from-accent to-purple-400",
    },
    {
      title: "الإيرادات",
      value: `$${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      gradient: "from-success to-teal-400",
    },
    {
      title: "متوسط السعر",
      value: `$${avgPrice.toFixed(2)}`,
      icon: BarChart3,
      gradient: "from-pink-500 to-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm h-full">
            {/* Gradient line at top */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-l ${stat.gradient}`} />
            
            <CardContent className="p-2 md:p-3">
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${stat.gradient} p-1.5 md:p-2 shadow-md`}>
                  <stat.icon className="w-full h-full text-white" />
                </div>
                <div>
                  <p className="text-[9px] md:text-[11px] text-muted-foreground leading-tight">{stat.title}</p>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-sm md:text-lg font-bold">{stat.value}</p>
                    {stat.trend && (
                      <span className="text-[8px] font-medium text-success bg-success/10 px-1 py-0.5 rounded-full hidden md:inline">
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ServicesStatsGrid;
