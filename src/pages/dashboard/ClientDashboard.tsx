import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Bell,
  Clock,
  Eye,
  Loader2,
  CheckCircle,
  Package,
  Award,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  Gift,
  RefreshCw,
  Zap,
  Users,
  CreditCard,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import SpendingChart from "@/components/dashboard/SpendingChart";
import BalanceSummary from "@/components/dashboard/BalanceSummary";
import LatestOrderTracker from "@/components/dashboard/LatestOrderTracker";
import FavoriteServices from "@/components/dashboard/FavoriteServices";
import SmartNotifications from "@/components/dashboard/SmartNotifications";
import ReferralCard from "@/components/dashboard/ReferralCard";
import OrderCalendar from "@/components/dashboard/OrderCalendar";
import PersonalizedTips from "@/components/dashboard/PersonalizedTips";
import RewardPointsCard from "@/components/dashboard/RewardPointsCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserBadges } from "@/hooks/useUserBadges";
import { format, subMonths, startOfMonth, isSameDay, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_price: number;
  service: { name: string; category: string } | null;
}

interface DashboardStats {
  activeOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  pendingTickets: number;
  totalOrders: number;
}

interface BalanceData {
  balance: number;
  totalDeposited: number;
  totalSpent: number;
}

interface CashbackData {
  balance: number;
  totalEarned: number;
}

interface PointsData {
  available: number;
  total: number;
}

interface SpendingData {
  month: string;
  amount: number;
}

interface FavoriteService {
  id: string;
  name: string;
  category: string;
  orderCount: number;
  price: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info";
  time: string;
  isRead: boolean;
}

interface ReferralData {
  code: string;
  totalReferrals: number;
  totalEarnings: number;
}

interface OrderDate {
  date: Date;
  count: number;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  type: "tip" | "promo" | "achievement";
}

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  refunded: "مسترد",
  partial: "جزئي",
  processing: "قيد المعالجة",
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-success/10 text-success border border-success/20";
    case "in_progress":
    case "processing":
      return "bg-accent/10 text-accent border border-accent/20";
    case "pending":
      return "bg-warning/10 text-warning border border-warning/20";
    case "confirmed":
      return "bg-primary/10 text-primary border border-primary/20";
    case "cancelled":
    case "refunded":
      return "bg-destructive/10 text-destructive border border-destructive/20";
    case "partial":
      return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const { badges, userBadges, loading: badgesLoading } = useUserBadges(user?.id);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    pendingTickets: 0,
    totalOrders: 0,
  });
  const [balanceData, setBalanceData] = useState<BalanceData>({
    balance: 0,
    totalDeposited: 0,
    totalSpent: 0,
  });
  const [cashbackData, setCashbackData] = useState<CashbackData>({
    balance: 0,
    totalEarned: 0,
  });
  const [pointsData, setPointsData] = useState<PointsData>({
    available: 0,
    total: 0,
  });
  const [spendingData, setSpendingData] = useState<SpendingData[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<FavoriteService[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [referralData, setReferralData] = useState<ReferralData>({
    code: "",
    totalReferrals: 0,
    totalEarnings: 0,
  });
  const [orderDates, setOrderDates] = useState<OrderDate[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const earnedBadges = badges.filter(b => earnedBadgeIds.has(b.id));

  useEffect(() => {
    if (user) {
      fetchDashboardData();

      // Realtime subscriptions
      const channel = supabase
        .channel("client-dashboard-realtime")
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "orders",
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchDashboardData(false);
        })
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "user_balances",
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchDashboardData(false);
        })
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "user_cashback",
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchDashboardData(false);
        })
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "user_points",
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchDashboardData(false);
        })
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "deposits",
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchDashboardData(false);
        })
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchDashboardData(false);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchDashboardData = async (showLoading = true) => {
    if (!user) return;

    if (showLoading) setLoading(true);
    setRefreshing(true);

    try {
      // Fetch all data in parallel
      const [
        ordersResult,
        ticketsResult,
        balanceResult,
        cashbackResult,
        pointsResult,
        notificationsResult,
        referralResult,
      ] = await Promise.all([
        supabase
          .from("orders")
          .select(`id, order_number, status, created_at, total_price, service:services(name, category)`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("status", ["open", "in_progress"]),
        supabase
          .from("user_balances")
          .select("balance, total_deposited, total_spent")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("user_cashback")
          .select("cashback_balance, total_earned")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_points")
          .select("available_points, total_points")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("referral_codes")
          .select("code, total_referrals, total_earnings")
          .eq("user_id", user.id)
          .single(),
      ]);

      const ordersData = (ordersResult.data as unknown as Order[]) || [];
      setRecentOrders(ordersData.slice(0, 5));

      // Calculate stats
      const activeOrders = ordersData.filter(o => 
        ["pending", "confirmed", "in_progress", "processing"].includes(o.status)
      ).length;
      const inProgressOrders = ordersData.filter(o => 
        ["in_progress", "processing"].includes(o.status)
      ).length;
      const completedOrders = ordersData.filter(o => o.status === "completed").length;

      setStats({
        activeOrders,
        inProgressOrders,
        completedOrders,
        pendingTickets: ticketsResult.count || 0,
        totalOrders: ordersData.length,
      });

      // Balance data
      if (balanceResult.data) {
        setBalanceData({
          balance: balanceResult.data.balance || 0,
          totalDeposited: balanceResult.data.total_deposited || 0,
          totalSpent: balanceResult.data.total_spent || 0,
        });
      }

      // Cashback data
      if (cashbackResult.data) {
        setCashbackData({
          balance: cashbackResult.data.cashback_balance || 0,
          totalEarned: cashbackResult.data.total_earned || 0,
        });
      }

      // Points data
      if (pointsResult.data) {
        setPointsData({
          available: pointsResult.data.available_points || 0,
          total: pointsResult.data.total_points || 0,
        });
      }

      // Calculate spending data for last 6 months
      const spendingByMonth: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, "yyyy-MM");
        spendingByMonth[monthKey] = 0;
      }

      ordersData.forEach(order => {
        if (order.status === "completed") {
          const monthKey = format(new Date(order.created_at), "yyyy-MM");
          if (spendingByMonth.hasOwnProperty(monthKey)) {
            spendingByMonth[monthKey] += order.total_price;
          }
        }
      });

      const spendingArr: SpendingData[] = Object.entries(spendingByMonth).map(([month, amount]) => ({
        month: format(new Date(month + "-01"), "MMM", { locale: ar }),
        amount,
      }));
      setSpendingData(spendingArr);

      // Fetch favorite services (most ordered)
      const serviceOrderCount: Record<string, { service: any; count: number }> = {};
      ordersData.forEach(order => {
        if (order.service) {
          const key = order.service.name;
          if (!serviceOrderCount[key]) {
            serviceOrderCount[key] = { service: order.service, count: 0 };
          }
          serviceOrderCount[key].count++;
        }
      });

      const favServices: FavoriteService[] = Object.values(serviceOrderCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .map((item, index) => ({
          id: `fav-${index}`,
          name: item.service.name,
          category: item.service.category,
          orderCount: item.count,
          price: 0,
        }));
      setFavoriteServices(favServices);

      // Notifications
      const notifs: Notification[] = (notificationsResult.data || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type === "success" ? "success" : n.type === "warning" ? "warning" : "info",
        time: format(new Date(n.created_at), "d MMM HH:mm", { locale: ar }),
        isRead: n.is_read,
      }));
      setNotifications(notifs);

      // Referral data
      if (referralResult.data) {
        setReferralData({
          code: referralResult.data.code,
          totalReferrals: referralResult.data.total_referrals || 0,
          totalEarnings: referralResult.data.total_earnings || 0,
        });
      }

      // Calculate order dates for calendar
      const orderDateMap: Record<string, number> = {};
      ordersData.forEach(order => {
        const dateKey = format(new Date(order.created_at), "yyyy-MM-dd");
        orderDateMap[dateKey] = (orderDateMap[dateKey] || 0) + 1;
      });

      const orderDatesArr: OrderDate[] = Object.entries(orderDateMap).map(([dateStr, count]) => ({
        date: new Date(dateStr),
        count,
      }));
      setOrderDates(orderDatesArr);

      // Generate personalized tips
      const generatedTips: Tip[] = [];
      
      if (completedOrders === 0) {
        generatedTips.push({
          id: "tip-first-order",
          title: "ابدأ رحلتك معنا! 🚀",
          description: "اكتشف خدماتنا المميزة واحصل على أفضل النتائج لحساباتك على السوشيال ميديا.",
          type: "tip",
        });
      }
      
      if (balanceData.balance < 50 && balanceData.balance > 0) {
        generatedTips.push({
          id: "tip-low-balance",
          title: "رصيدك منخفض 💳",
          description: "اشحن رصيدك الآن واستمتع بخدماتنا دون انقطاع.",
          type: "tip",
        });
      }

      if (!referralResult.data?.code) {
        generatedTips.push({
          id: "tip-referral",
          title: "اربح مع الإحالة! 🎁",
          description: "ادعُ أصدقاءك واحصل على عمولة من كل طلب يقومون به.",
          type: "promo",
        });
      }

      if (earnedBadges.length > 0) {
        generatedTips.push({
          id: "tip-badge",
          title: `مبروك! حصلت على ${earnedBadges.length} شارة 🏆`,
          description: "استمر في الطلب للحصول على المزيد من الشارات والمكافآت.",
          type: "achievement",
        });
      }

      setTips(generatedTips);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const statsData = [
    {
      title: "الطلبات النشطة",
      value: stats.activeOrders,
      icon: ShoppingBag,
      color: "from-primary to-cyan-400",
      bgColor: "bg-primary/10",
      link: "/dashboard/orders",
    },
    {
      title: "قيد التنفيذ",
      value: stats.inProgressOrders,
      icon: Clock,
      color: "from-warning to-orange-400",
      bgColor: "bg-warning/10",
      link: "/dashboard/orders",
    },
    {
      title: "مكتملة",
      value: stats.completedOrders,
      icon: CheckCircle,
      color: "from-success to-emerald-400",
      bgColor: "bg-success/10",
      link: "/dashboard/orders",
    },
    {
      title: "تذاكر الدعم",
      value: stats.pendingTickets,
      icon: Bell,
      color: "from-accent to-pink-400",
      bgColor: "bg-accent/10",
      link: "/dashboard/support",
    },
  ];

  // Quick stats for top section
  const quickStats = [
    {
      label: "الرصيد",
      value: `${balanceData.balance.toFixed(2)} ر.س`,
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "الكاش باك",
      value: `${cashbackData.balance.toFixed(2)} ر.س`,
      icon: Gift,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "النقاط",
      value: pointsData.available.toLocaleString(),
      icon: Zap,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "الإحالات",
      value: referralData.totalReferrals,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  // Get latest active order for tracker
  const latestActiveOrder = recentOrders.find(o => 
    ["pending", "confirmed", "in_progress", "processing"].includes(o.status)
  );

  const latestOrderForTracker = latestActiveOrder ? {
    id: latestActiveOrder.id,
    orderNumber: latestActiveOrder.order_number,
    serviceName: latestActiveOrder.service?.name || "خدمة",
    status: latestActiveOrder.status,
    createdAt: format(new Date(latestActiveOrder.created_at), "d MMM", { locale: ar }),
  } : null;

  // Calculate spending percentage change
  const thisMonthSpent = spendingData[spendingData.length - 1]?.amount || 0;
  const lastMonthSpent = spendingData[spendingData.length - 2]?.amount || 1;
  const percentageChange = Math.round(((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100);

  const markNotificationAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const dismissTip = (id: string) => {
    setTips(prev => prev.filter(t => t.id !== id));
  };

  // Loading skeleton
  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1"
            >
              مرحباً، {profile?.full_name || "عزيزي العميل"}! 👋
            </motion.h1>
            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
              <span>نظرة عامة على حسابك</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {formatDistanceToNow(lastUpdated, { locale: ar, addSuffix: true })}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" />
                لحظي
              </Badge>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing}
            className="gap-2 self-end sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
        </div>

        {/* Quick Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
        >
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl ${stat.bgColor} border border-border/30`}
            >
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className={`text-sm sm:text-base font-bold ${stat.color} truncate`}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Personalized Tips */}
        <AnimatePresence>
          {tips.length > 0 && (
            <PersonalizedTips tips={tips} onDismiss={dismissTip} />
          )}
        </AnimatePresence>

        {/* Balance Summary - Enhanced */}
        <BalanceSummary 
          balance={balanceData.balance}
          totalDeposited={balanceData.totalDeposited}
          totalSpent={balanceData.totalSpent}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link to={stat.link}>
                <Card className="card-elevated border-border/30 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group h-full">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} p-1.5 sm:p-2 shadow-lg group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-full h-full text-primary-foreground" />
                      </div>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <motion.p 
                      className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5"
                      key={stat.value}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.title}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout: Spending Chart & Order Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <SpendingChart 
            data={spendingData}
            totalSpent={thisMonthSpent}
            percentageChange={percentageChange}
          />
          <LatestOrderTracker order={latestOrderForTracker} />
        </div>

        {/* Three Column Layout: Favorites, Notifications, Rewards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <FavoriteServices services={favoriteServices} />
          <SmartNotifications 
            notifications={notifications} 
            onMarkAsRead={markNotificationAsRead}
          />
          <RewardPointsCard />
        </div>

        {/* Two Column Layout: Referral & Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <ReferralCard 
            code={referralData.code || "INVITE123"}
            totalReferrals={referralData.totalReferrals}
            totalEarnings={referralData.totalEarnings}
          />
          <OrderCalendar orderDates={orderDates} />
        </div>

        {/* User Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-elevated border-border/30">
            <CardHeader className="flex flex-row items-center justify-between py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                شاراتي
              </CardTitle>
              <Link to="/dashboard/badges">
                <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm h-8">
                  عرض الكل
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {badgesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : earnedBadges.length === 0 ? (
                <div className="text-center py-6">
                  <Award className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">لم تحصل على شارات بعد</p>
                  <p className="text-xs text-muted-foreground mt-1">أكمل طلباتك للحصول على شاراتك الأولى!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {earnedBadges.slice(0, 5).map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
                    >
                      <span className="text-base sm:text-lg">{badge.icon}</span>
                      <span className="font-medium text-xs sm:text-sm">{badge.name_ar}</span>
                      <Badge variant="secondary" className="text-[10px] px-1">
                        {badge.tier}
                      </Badge>
                    </motion.div>
                  ))}
                  {earnedBadges.length > 5 && (
                    <Link to="/dashboard/badges">
                      <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors cursor-pointer">
                        <span className="text-xs text-muted-foreground">+{earnedBadges.length - 5} المزيد</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="card-elevated border-border/30">
            <CardHeader className="flex flex-row items-center justify-between py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                آخر الطلبات
              </CardTitle>
              <Link to="/dashboard/orders">
                <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm h-8">
                  عرض الكل
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">لا توجد طلبات بعد</p>
                  <Link to="/dashboard/services">
                    <Button variant="outline" size="sm" className="mt-3">
                      تصفح الخدمات
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{order.service?.name || "خدمة"}</p>
                          <p className="text-xs text-muted-foreground">{order.order_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(order.status)}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                          {format(new Date(order.created_at), "d MMM", { locale: ar })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions / Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-elevated border-border/30 bg-gradient-to-l from-primary/5 to-accent/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-right">
                  <h3 className="text-lg sm:text-xl font-bold mb-1">هل تحتاج مساعدة؟</h3>
                  <p className="text-muted-foreground text-sm">فريق الدعم متاح على مدار الساعة</p>
                </div>
                <Link to="/dashboard/support">
                  <Button className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg w-full sm:w-auto">
                    تواصل مع الدعم
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDashboard;
