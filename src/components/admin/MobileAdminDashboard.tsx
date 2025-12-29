import { motion } from "framer-motion";
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  Wallet,
  Bell,
  Settings,
  MessageSquare,
  BarChart3,
  Sparkles,
  ChevronLeft,
  RefreshCw,
  Star,
  Trophy,
  Medal,
  Award,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import AnimatedCounter from "./AnimatedCounter";
import AdvancedDashboardCharts from "./AdvancedDashboardCharts";
import MobileLiveOrdersChart from "./MobileLiveOrdersChart";

interface DashboardStats {
  totalUsers: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  usersTrend: number;
  ordersTrend: number;
  revenueTrend: number;
}

interface Activity {
  id: string;
  type: "order" | "user" | "ticket";
  message: string;
  time: string;
  isNew?: boolean;
}

interface TopService {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  trend?: number;
}

interface ChartData {
  orders: any[];
  deposits: any[];
  users: any[];
}

interface MobileAdminDashboardProps {
  stats: DashboardStats;
  activities: Activity[];
  topServices: TopService[];
  chartData: ChartData;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const quickActions = [
  { label: "الخدمات", href: "/admin/services", icon: Package, color: "from-primary to-cyan-600" },
  { label: "الطلبات", href: "/admin/orders", icon: ShoppingCart, color: "from-success to-emerald-600" },
  { label: "المستخدمين", href: "/admin/users", icon: Users, color: "from-accent to-purple-600" },
  { label: "المحافظ", href: "/admin/wallets", icon: Wallet, color: "from-warning to-orange-600" },
  { label: "الإشعارات", href: "/admin/notifications", icon: Bell, color: "from-rose-500 to-red-600" },
  { label: "التقارير", href: "/admin/reports", icon: TrendingUp, color: "from-teal-500 to-cyan-600" },
];

const MobileAdminDashboard = ({
  stats,
  activities,
  topServices,
  chartData,
  onRefresh,
  isRefreshing,
  activeTab,
  setActiveTab,
}: MobileAdminDashboardProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order": return ShoppingCart;
      case "user": return Users;
      case "ticket": return MessageSquare;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "order": return "text-primary bg-primary/10";
      case "user": return "text-success bg-success/10";
      case "ticket": return "text-warning bg-warning/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>;
  };

  // Stat Card Component for mobile-first design
  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    suffix = "", 
    trend, 
    gradient, 
    delay = 0 
  }: { 
    icon: any; 
    label: string; 
    value: number; 
    suffix?: string; 
    trend?: number; 
    gradient: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="w-full bg-card rounded-xl border border-border/40 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-xl sm:text-2xl font-bold">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
        </div>
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
          `bg-gradient-to-br ${gradient}`
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1",
            trend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}% من الشهر السابق
          </span>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden" dir="rtl">
      {/* Header */}
      <div className="bg-background border-b border-border/50 px-4 py-4 w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">لوحة التحكم</h1>
              <p className="text-xs text-muted-foreground">مرحباً بك</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center border border-border/50"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </motion.button>
        </div>

        {/* Tabs - Full width on mobile */}
        <div className="w-full flex gap-2">
          <button 
            onClick={() => setActiveTab("overview")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-medium py-3 transition-all",
              activeTab === "overview" 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span>نظرة عامة</span>
          </button>
          <button 
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-medium py-3 transition-all",
              activeTab === "analytics" 
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25" 
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات</span>
          </button>
        </div>
      </div>

      {/* Overview Content */}
      {activeTab === "overview" && (
        <div className="px-4 py-4 pb-24 w-full space-y-4">
          
          {/* Stats Grid - Mobile First: 1 column, sm: 2 columns, lg: 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            <StatCard 
              icon={Users}
              label="إجمالي المستخدمين"
              value={stats.totalUsers}
              trend={stats.usersTrend}
              gradient="from-primary to-cyan-600"
              delay={0}
            />
            <StatCard 
              icon={Clock}
              label="طلبات معلقة"
              value={stats.pendingOrders}
              trend={stats.ordersTrend}
              gradient="from-warning to-orange-600"
              delay={0.05}
            />
            <StatCard 
              icon={DollarSign}
              label="إيرادات الشهر"
              value={stats.monthlyRevenue}
              suffix=" ر.س"
              trend={stats.revenueTrend}
              gradient="from-success to-emerald-600"
              delay={0.1}
            />
            <StatCard 
              icon={CheckCircle}
              label="طلبات مكتملة"
              value={stats.completedOrders}
              gradient="from-accent to-purple-600"
              delay={0.15}
            />
          </div>

          {/* Live Orders Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <MobileLiveOrdersChart />
          </motion.div>

          {/* Quick Actions - Vertical list on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full bg-card rounded-xl border border-border/40 p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold">إجراءات سريعة</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
              {quickActions.map((action, i) => (
                <Link key={action.href} to={action.href} className="block">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                      `bg-gradient-to-br ${action.color}`
                    )}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-center">{action.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Top Services - Full width card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full bg-card rounded-xl border border-border/40 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-warning" />
                </div>
                <span className="text-sm font-semibold">أفضل الخدمات</span>
              </div>
              <Link to="/admin/services" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
                عرض الكل
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-border/30">
              {topServices.length === 0 ? (
                <div className="p-8 text-center">
                  <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">لا توجد خدمات بعد</p>
                </div>
              ) : (
                topServices.slice(0, 5).map((service, i) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-3 p-4"
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                      i === 0 ? "bg-yellow-500/10 border-yellow-500/30" :
                      i === 1 ? "bg-slate-400/10 border-slate-400/30" :
                      i === 2 ? "bg-amber-600/10 border-amber-600/30" :
                      "bg-muted border-border/50"
                    )}>
                      {getRankIcon(i)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.orders} طلب</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-bold text-success">{service.revenue.toLocaleString('ar-SA')} ر.س</p>
                      {service.trend && service.trend > 0 && (
                        <p className="text-[10px] text-success flex items-center gap-0.5 justify-end">
                          <TrendingUp className="w-3 h-3" />
                          {service.trend}%
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Activity Feed - Full width card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="w-full bg-card rounded-xl border border-border/40 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold">النشاط الأخير</span>
              </div>
              <Badge variant="secondary" className="text-xs">{activities.length} نشاط</Badge>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <Clock className="w-10 h-10 mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">لا يوجد نشاط</p>
                </div>
              ) : (
                activities.slice(0, 8).map((activity, i) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.03 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30"
                    >
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", getActivityColor(activity.type))}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      {activity.isNew && (
                        <Badge className="text-[10px] px-2 bg-primary/10 text-primary border-0 shrink-0">جديد</Badge>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Analytics Content */}
      {activeTab === "analytics" && (
        <div className="px-4 py-4 pb-24 w-full">
          <AdvancedDashboardCharts
            orders={chartData.orders}
            deposits={chartData.deposits}
            users={chartData.users}
          />
        </div>
      )}
    </div>
  );
};

export default MobileAdminDashboard;
