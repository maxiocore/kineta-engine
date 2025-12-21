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
      title: "الخدمات",
      value: totalServices,
      icon: Package,
      gradient: "from-primary to-cyan-400",
    },
    {
      title: "النشطة",
      value: activeServices,
      icon: TrendingUp,
      gradient: "from-success to-emerald-400",
    },
    {
      title: "الإيرادات",
      value: `${totalRevenue.toFixed(2)}`,
      suffix: "ر.س",
      icon: DollarSign,
      gradient: "from-warning to-orange-400",
    },
    {
      title: "الطلبات",
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="glass border-border/50 h-full">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div className="text-right flex-1">
                  <p className="text-[10px] text-muted-foreground">{stat.title}</p>
                  <p className="text-base font-bold leading-tight">
                    {stat.value}
                    {stat.suffix && <span className="text-[10px] text-muted-foreground mr-0.5">{stat.suffix}</span>}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} p-1.5 shrink-0`}>
                  <stat.icon className="w-full h-full text-primary-foreground" />
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
