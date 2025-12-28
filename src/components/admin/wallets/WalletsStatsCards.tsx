import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from "lucide-react";

interface WalletsStats {
  totalBalance: number;
  totalDeposited: number;
  totalSpent: number;
  pendingDeposits: number;
  totalUsers: number;
  todayDeposits: number;
  todayWithdrawals: number;
  averageBalance: number;
}

interface WalletsStatsCardsProps {
  stats: WalletsStats;
  isLoading?: boolean;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  iconColor,
  trend,
  trendValue,
  suffix = "ر.س",
  delay = 0,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  trend?: "up" | "down";
  trendValue?: string;
  suffix?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className="h-full"
  >
    <Card className={`relative overflow-hidden bg-gradient-to-br ${gradient} border-0 shadow-lg group h-full`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <motion.div 
        className="absolute -top-8 -left-8 w-16 sm:w-24 h-16 sm:h-24 rounded-full blur-2xl opacity-30"
        style={{ backgroundColor: iconColor }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <CardContent className="p-3 sm:p-4 relative h-full flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-white/70 font-medium mb-0.5 sm:mb-1 truncate">{title}</p>
            <motion.p 
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.2, type: "spring" }}
            >
              {typeof value === 'number' ? value.toLocaleString('ar-SA', { maximumFractionDigits: 0 }) : value}
              <span className="text-[10px] sm:text-xs md:text-sm font-normal mr-1 opacity-80">{suffix}</span>
            </motion.p>
          </div>
          <motion.div 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0"
            whileHover={{ rotate: 10 }}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </motion.div>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 mt-1 sm:mt-2 text-[10px] sm:text-xs ${trend === 'up' ? 'text-emerald-300' : 'text-red-300'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span className="truncate">{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export const WalletsStatsCards = ({ stats, isLoading }: WalletsStatsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 sm:h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
      <StatCard
        title="إجمالي الأرصدة"
        value={stats.totalBalance}
        icon={Wallet}
        gradient="from-violet-600 to-purple-700"
        iconColor="#8b5cf6"
        delay={0}
      />
      <StatCard
        title="إجمالي الإيداعات"
        value={stats.totalDeposited}
        icon={TrendingUp}
        gradient="from-emerald-600 to-green-700"
        iconColor="#10b981"
        trend="up"
        trendValue="+12% هذا الشهر"
        delay={0.05}
      />
      <StatCard
        title="إجمالي المصروفات"
        value={stats.totalSpent}
        icon={TrendingDown}
        gradient="from-orange-500 to-amber-600"
        iconColor="#f97316"
        delay={0.1}
      />
      <StatCard
        title="إيداعات معلقة"
        value={stats.pendingDeposits}
        icon={Clock}
        gradient="from-yellow-500 to-orange-500"
        iconColor="#eab308"
        suffix=""
        delay={0.15}
      />
      <StatCard
        title="عدد المستخدمين"
        value={stats.totalUsers}
        icon={Users}
        gradient="from-blue-500 to-cyan-600"
        iconColor="#3b82f6"
        suffix="مستخدم"
        delay={0.2}
      />
      <StatCard
        title="إيداعات اليوم"
        value={stats.todayDeposits}
        icon={DollarSign}
        gradient="from-teal-500 to-emerald-600"
        iconColor="#14b8a6"
        delay={0.25}
      />
      <StatCard
        title="مصروفات اليوم"
        value={stats.todayWithdrawals}
        icon={CreditCard}
        gradient="from-rose-500 to-pink-600"
        iconColor="#f43f5e"
        delay={0.3}
      />
      <StatCard
        title="متوسط الرصيد"
        value={stats.averageBalance}
        icon={Sparkles}
        gradient="from-indigo-500 to-purple-600"
        iconColor="#6366f1"
        delay={0.35}
      />
    </div>
  );
};

export default WalletsStatsCards;
