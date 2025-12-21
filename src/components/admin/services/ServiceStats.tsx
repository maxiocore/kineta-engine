import { motion } from "framer-motion";
import { Package, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
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
    },
    {
      title: "الخدمات النشطة",
      value: activeServices,
      icon: TrendingUp,
      gradient: "from-success to-emerald-400",
    },
    {
      title: "إجمالي الإيرادات",
      value: `${totalRevenue.toLocaleString()} ر.س`,
      icon: DollarSign,
      gradient: "from-warning to-orange-400",
    },
    {
      title: "إجمالي الطلبات",
      value: totalOrders,
      icon: ShoppingCart,
      gradient: "from-accent to-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
        >
          <Card className="glass border-border/50 hover:border-primary/20 transition-colors h-full">
            <CardContent className="p-2.5">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} p-1.5 shrink-0`}>
                  <stat.icon className="w-full h-full text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">{stat.title}</p>
                  <p className="text-sm font-bold truncate leading-tight">{stat.value}</p>
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
