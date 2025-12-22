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
      bgGlow: "group-hover:shadow-primary/20",
    },
    {
      title: "النشطة",
      value: activeServices,
      icon: TrendingUp,
      gradient: "from-success to-emerald-400",
      bgGlow: "group-hover:shadow-success/20",
      trend: activeServices > 0 && totalServices > 0 ? `${Math.round((activeServices / totalServices) * 100)}%` : undefined,
    },
    {
      title: "غير النشطة",
      value: inactiveServices,
      icon: Zap,
      gradient: "from-warning to-orange-400",
      bgGlow: "group-hover:shadow-warning/20",
    },
    {
      title: "الطلبات",
      value: totalOrders,
      icon: ShoppingCart,
      gradient: "from-accent to-purple-400",
      bgGlow: "group-hover:shadow-accent/20",
    },
    {
      title: "الإيرادات",
      value: `$${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      gradient: "from-success to-teal-400",
      bgGlow: "group-hover:shadow-success/20",
    },
    {
      title: "متوسط السعر",
      value: `$${avgPrice.toFixed(2)}`,
      icon: BarChart3,
      gradient: "from-pink-500 to-rose-400",
      bgGlow: "group-hover:shadow-pink-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
        >
          <Card className={`group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${stat.bgGlow} h-full`}>
            {/* Gradient line at top */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-l ${stat.gradient}`} />
            
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} p-2 sm:p-2.5 shadow-lg`}>
                  <stat.icon className="w-full h-full text-white" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">{stat.title}</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
                    {stat.trend && (
                      <span className="text-[10px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded-full">
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
