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
import { ScrollArea } from "@/components/ui/scroll-area";
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
    if (index === 0) return <Trophy className="w-3 h-3 text-yellow-500" />;
    if (index === 1) return <Medal className="w-3 h-3 text-gray-400" />;
    if (index === 2) return <Award className="w-3 h-3 text-amber-600" />;
    return <span className="text-[10px] font-bold">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header with Tabs */}
      <div className="bg-background border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold">لوحة التحكم</h1>
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

        {/* Custom Tabs - Fixed Layout */}
        <div className="w-full h-12 p-1.5 bg-secondary/50 rounded-xl flex gap-2">
          <button 
            onClick={() => setActiveTab("overview")}
            className={cn(
              "flex-1 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === "overview" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Sparkles className="w-4 h-4" />
            نظرة عامة
          </button>
          <button 
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "flex-1 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === "analytics" 
                ? "bg-accent text-accent-foreground shadow-md" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            الإحصائيات
          </button>
        </div>
      </div>

      {/* Overview Content */}
      {activeTab === "overview" && (
        <div className="px-4 space-y-4 pt-4 pb-20">
          {/* Stats Grid - 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {/* Users */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border/40 p-3 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-primary/10 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  {stats.usersTrend !== 0 && (
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                      stats.usersTrend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                      {stats.usersTrend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {Math.abs(stats.usersTrend)}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mb-0.5">المستخدمين</p>
                <p className="text-lg font-bold">
                  <AnimatedCounter value={stats.totalUsers} />
                </p>
              </div>
            </motion.div>

            {/* Pending Orders */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card rounded-xl border border-border/40 p-3 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-warning/10 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning to-orange-600 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  {stats.ordersTrend !== 0 && (
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                      stats.ordersTrend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                      {stats.ordersTrend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {Math.abs(stats.ordersTrend)}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mb-0.5">طلبات معلقة</p>
                <p className="text-lg font-bold">
                  <AnimatedCounter value={stats.pendingOrders} />
                </p>
              </div>
            </motion.div>

            {/* Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border/40 p-3 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-success/10 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  {stats.revenueTrend !== 0 && (
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                      stats.revenueTrend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                      {stats.revenueTrend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {Math.abs(stats.revenueTrend)}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mb-0.5">الإيرادات</p>
                <p className="text-lg font-bold">
                  <AnimatedCounter value={stats.monthlyRevenue} suffix=" ر.س" />
                </p>
              </div>
            </motion.div>

            {/* Completed Orders */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-xl border border-border/40 p-3 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-accent/10 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mb-0.5">مكتملة</p>
                <p className="text-lg font-bold">
                  <AnimatedCounter value={stats.completedOrders} />
                </p>
              </div>
            </motion.div>
          </div>

          {/* Live Orders Chart */}
          <MobileLiveOrdersChart />

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border/40 p-3"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold">إجراءات سريعة</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((action, i) => (
                <Link key={action.href} to={action.href}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.03 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors"
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shadow-sm",
                      `bg-gradient-to-br ${action.color}`
                    )}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-medium">{action.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Top Services */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border/40 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-warning" />
                </div>
                <span className="text-xs font-semibold">أفضل الخدمات</span>
              </div>
              <Link to="/admin/services" className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                عرض الكل
                <ChevronLeft className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border/30">
              {topServices.length === 0 ? (
                <div className="p-6 text-center">
                  <Star className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">لا توجد خدمات بعد</p>
                </div>
              ) : (
                topServices.slice(0, 4).map((service, i) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    className="flex items-center gap-2.5 p-3"
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center border",
                      i === 0 ? "bg-yellow-500/10 border-yellow-500/30" :
                      i === 1 ? "bg-slate-400/10 border-slate-400/30" :
                      i === 2 ? "bg-amber-600/10 border-amber-600/30" :
                      "bg-muted border-border/50"
                    )}>
                      {getRankIcon(i)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{service.name}</p>
                      <p className="text-[10px] text-muted-foreground">{service.orders} طلب</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-success">{service.revenue.toLocaleString('ar-SA')} ر.س</p>
                      {service.trend && service.trend > 0 && (
                        <p className="text-[9px] text-success flex items-center gap-0.5 justify-end">
                          <TrendingUp className="w-2.5 h-2.5" />
                          {service.trend}%
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border/40 p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold">النشاط الأخير</span>
              </div>
              <Badge variant="secondary" className="text-[9px] h-5">{activities.length} نشاط</Badge>
            </div>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center py-6">
                    <Clock className="w-8 h-8 mb-2 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">لا يوجد نشاط</p>
                  </div>
                ) : (
                  activities.slice(0, 6).map((activity, i) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.03 }}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/30 border border-border/30"
                      >
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", getActivityColor(activity.type))}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate">{activity.message}</p>
                          <p className="text-[9px] text-muted-foreground">{activity.time}</p>
                        </div>
                        {activity.isNew && (
                          <Badge className="h-4 text-[8px] px-1.5 bg-primary/10 text-primary border-0">جديد</Badge>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </div>
      )}

      {/* Analytics Content */}
      {activeTab === "analytics" && (
        <div className="px-4 pt-4 pb-20">
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
