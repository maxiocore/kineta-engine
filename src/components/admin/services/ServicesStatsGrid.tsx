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
      title: "الخدمات النشطة",
      value: activeServices,
      icon: TrendingUp,
      gradient: "from-success to-emerald-400",
      bgGlow: "group-hover:shadow-success/20",
      trend: activeServices > 0 ? `${Math.round((activeServices / totalServices) * 100)}%` : "0%",
    },
    {
      title: "غير النشطة",
      value: inactiveServices,
      icon: Zap,
      gradient: "from-warning to-orange-400",
      bgGlow: "group-hover:shadow-warning/20",
    },
    {
      title: "إجمالي الطلبات",
      value: totalOrders,
      icon: ShoppingCart,
      gradient: "from-accent to-purple-400",
      bgGlow: "group-hover:shadow-accent/20",
    },
    {
      title: "إجمالي الإيرادات",
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
        >
          <Card className={`group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl ${stat.bgGlow}`}>
            {/* Gradient line at top */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-l ${stat.gradient}`} />
            
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} p-2 shadow-lg`}>
                  <stat.icon className="w-full h-full text-white" />
                </div>
                {stat.trend && (
                  <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ServicesStatsGrid;
