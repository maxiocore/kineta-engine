import { motion } from "framer-motion";
import { Package, TrendingUp, DollarSign, BarChart3, Eye, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceStatsProps {
  totalServices: number;
  activeServices: number;
  totalRevenue: number;
  totalOrders: number;
}

const ServiceStats = ({ totalServices, activeServices, totalRevenue, totalOrders }: ServiceStatsProps) => {
  const stats = [
    {
      title: "إجمالي الخدمات",
      value: totalServices,
      icon: Package,
      gradient: "from-primary to-cyan-400",
      glow: "stat-glow-primary",
    },
    {
      title: "الخدمات النشطة",
      value: activeServices,
      icon: TrendingUp,
      gradient: "from-success to-emerald-400",
      glow: "stat-glow-success",
    },
    {
      title: "إجمالي الإيرادات",
      value: `${totalRevenue.toLocaleString()} ر.س`,
      icon: DollarSign,
      gradient: "from-warning to-orange-400",
      glow: "stat-glow-warning",
    },
    {
      title: "إجمالي الطلبات",
      value: totalOrders,
      icon: ShoppingCart,
      gradient: "from-accent to-purple-400",
      glow: "stat-glow-accent",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`glass border-border/50 ${stat.glow} hover:scale-[1.02] transition-transform`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} p-2.5`}>
                  <stat.icon className="w-full h-full text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ServiceStats;
