import { motion } from "framer-motion";
import { 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsData {
  totalServices: number;
  activeServices: number;
  totalRevenue: number;
  totalOrders: number;
}

interface DigitalMarketingStatsProps {
  stats: StatsData;
  variant?: "admin" | "client";
}

export const DigitalMarketingStats = ({ stats, variant = "admin" }: DigitalMarketingStatsProps) => {
  const statsConfig = [
    {
      title: "إجمالي الخدمات",
      value: stats.totalServices,
      suffix: "خدمة",
      icon: Package,
      gradient: "from-blue-500 to-indigo-500",
      bgGradient: "from-blue-500/10 to-indigo-500/10",
      trend: null
    },
    {
      title: "الخدمات النشطة",
      value: stats.activeServices,
      suffix: "خدمة",
      icon: Activity,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      trend: stats.activeServices > 0 ? { value: "+12%", positive: true } : null
    },
    ...(variant === "admin" ? [
      {
        title: "إجمالي الإيرادات",
        value: stats.totalRevenue,
        suffix: "ر.س",
        icon: DollarSign,
        gradient: "from-amber-500 to-orange-500",
        bgGradient: "from-amber-500/10 to-orange-500/10",
        trend: { value: "+18%", positive: true }
      },
      {
        title: "إجمالي الطلبات",
        value: stats.totalOrders,
        suffix: "طلب",
        icon: ShoppingCart,
        gradient: "from-violet-500 to-purple-500",
        bgGradient: "from-violet-500/10 to-purple-500/10",
        trend: { value: "+8%", positive: true }
      }
    ] : [])
  ];

  return (
    <div className={`grid grid-cols-2 ${variant === "admin" ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-4`}>
      {statsConfig.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 group">
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
            
            <CardContent className="relative p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                
                {stat.trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend.positive 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : "bg-red-500/10 text-red-500"
                  }`}>
                    {stat.trend.positive 
                      ? <TrendingUp className="w-3 h-3" /> 
                      : <TrendingDown className="w-3 h-3" />
                    }
                    {stat.trend.value}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value.toLocaleString('ar-SA')}
                  </span>
                  <span className="text-xs text-muted-foreground">{stat.suffix}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// Header stats for client page
interface ClientStatsProps {
  servicesCount: number;
  delay?: number;
}

export const ClientDigitalStats = ({ servicesCount, delay = 0 }: ClientStatsProps) => (
  <div className="flex flex-wrap items-center justify-center gap-3">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10"
    >
      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
        <Package className="w-4 h-4 text-white" />
      </div>
      <div className="text-right">
        <p className="text-white font-bold text-sm">{servicesCount}+</p>
        <p className="text-white/60 text-[10px]">خدمة متاحة</p>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.1 }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10"
    >
      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
        <TrendingUp className="w-4 h-4 text-white" />
      </div>
      <div className="text-right">
        <p className="text-white font-bold text-sm">98%</p>
        <p className="text-white/60 text-[10px]">نسبة النجاح</p>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.2 }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10"
    >
      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
        <BarChart3 className="w-4 h-4 text-white" />
      </div>
      <div className="text-right">
        <p className="text-white font-bold text-sm">24/7</p>
        <p className="text-white/60 text-[10px]">دعم فني</p>
      </div>
    </motion.div>
  </div>
);
