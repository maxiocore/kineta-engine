import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  Settings2,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import SpendingChart from "@/components/dashboard/SpendingChart";
import EnhancedBalanceSummary from "@/components/dashboard/EnhancedBalanceSummary";
import LatestOrderTracker from "@/components/dashboard/LatestOrderTracker";
import FavoriteServices from "@/components/dashboard/FavoriteServices";
import SmartNotifications from "@/components/dashboard/SmartNotifications";
import ReferralCard from "@/components/dashboard/ReferralCard";
import OrderCalendar from "@/components/dashboard/OrderCalendar";
import PersonalizedTips from "@/components/dashboard/PersonalizedTips";
import RewardPointsCard from "@/components/dashboard/RewardPointsCard";
import MonthlyGoalCelebration from "@/components/dashboard/MonthlyGoalCelebration";
import MonthlyGoalCard from "@/components/dashboard/MonthlyGoalCard";
import AchievementsHistory from "@/components/dashboard/AchievementsHistory";
import { supabase } from "@/integrations/supabase/client";
import OrderStatusChart from "@/components/dashboard/OrderStatusChart";
import FinancingBanner from "@/components/FinancingBanner";
import { useAuth } from "@/hooks/useAuth";
import { useUserBadges } from "@/hooks/useUserBadges";
import { useMonthlyAchievements } from "@/hooks/useMonthlyAchievements";
import { format, subMonths, startOfMonth, isSameDay, formatDistanceToNow, endOfMonth, isWithinInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";


interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_price: number;
  service: { name: string; category: string } | null;
}

interface OrderStatusData {
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  refunded: number;
  partial: number;
}

interface DashboardStats {
  activeOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  completedThisMonth: number;
  monthlyGoal: number;
  pendingTickets: number;
  totalOrders: number;
  statusData: OrderStatusData;
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
  // Mobile responsive and RTL optimized
  const { user, profile } = useAuth();
  const { badges, userBadges, loading: badgesLoading } = useUserBadges(user?.id);
  const { 
    achievements, 
    loading: achievementsLoading, 
    updateAchievement,
    updateMonthlyGoal,
    markGoalAchieved,
    currentAchievement 
  } = useMonthlyAchievements(user?.id);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState<number>(10);
  const [savingGoal, setSavingGoal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    completedThisMonth: 0,
    monthlyGoal: 10,
    pendingTickets: 0,
    totalOrders: 0,
    statusData: {
      pending: 0,
      confirmed: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
      partial: 0,
    },
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
  const [showCelebration, setShowCelebration] = useState(false);
  const lowBalanceNotifiedRef = useRef(false);
  const goalCelebratedRef = useRef(false);
  const LOW_BALANCE_THRESHOLD = 50; // الحد الأدنى للرصيد

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const earnedBadges = badges.filter(b => earnedBadgeIds.has(b.id));

  // إشعار انخفاض الرصيد
  useEffect(() => {
    if (!loading && balanceData.balance > 0 && balanceData.balance < LOW_BALANCE_THRESHOLD && !lowBalanceNotifiedRef.current) {
      lowBalanceNotifiedRef.current = true;
      toast.warning("رصيدك منخفض! 💳", {
        description: `رصيدك الحالي ${balanceData.balance.toFixed(2)} ر.س. اشحن رصيدك الآن للاستمرار في استخدام خدماتنا.`,
        duration: 8000,
        action: {
          label: "شحن الرصيد",
          onClick: () => window.location.href = "/dashboard/deposit",
        },
      });
    }
  }, [loading, balanceData.balance]);

  // إشعار احتفالي عند تحقيق الهدف الشهري
  useEffect(() => {
    if (
      !loading &&
      stats.completedThisMonth >= stats.monthlyGoal &&
      stats.monthlyGoal > 0 &&
      !goalCelebratedRef.current &&
      (!currentAchievement || !currentAchievement.goal_achieved)
    ) {
      goalCelebratedRef.current = true;
      
      // Calculate bonus points
      const exceededBy = stats.completedThisMonth - stats.monthlyGoal;
      const bonusPoints = 50 + (exceededBy >= 5 ? 25 : 0);
      
      // Save achievement to database
      markGoalAchieved(bonusPoints, exceededBy);
      
      // Show celebration after a short delay for better UX
      const timer = setTimeout(() => {
        setShowCelebration(true);
        toast.success("🎉 تهانينا! حققت هدفك الشهري", {
          description: `أكملت ${stats.completedThisMonth} طلب هذا الشهر!`,
          duration: 5000,
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, stats.completedThisMonth, stats.monthlyGoal, currentAchievement, markGoalAchieved]);

  // Update achievement data when stats change
  useEffect(() => {
    if (!loading && user && stats.totalOrders > 0) {
      updateAchievement(stats.completedThisMonth, stats.monthlyGoal);
    }
  }, [loading, user, stats.completedThisMonth, stats.monthlyGoal, stats.totalOrders, updateAchievement]);

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

      // Calculate completed orders this month
      const currentDate = new Date();
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const completedThisMonth = ordersData.filter(o => 
        o.status === "completed" && 
        isWithinInterval(new Date(o.created_at), { start: monthStart, end: monthEnd })
      ).length;

      // Dynamic monthly goal based on previous month performance or user setting
      const lastMonthStart = startOfMonth(subMonths(currentDate, 1));
      const lastMonthEnd = endOfMonth(subMonths(currentDate, 1));
      const completedLastMonth = ordersData.filter(o => 
        o.status === "completed" && 
        isWithinInterval(new Date(o.created_at), { start: lastMonthStart, end: lastMonthEnd })
      ).length;
      // Use saved goal from database if available, otherwise calculate
      const defaultGoal = Math.max(10, Math.ceil(completedLastMonth * 1.2)); // Goal is 20% more than last month, minimum 10
      const monthlyGoal = currentAchievement?.monthly_goal || defaultGoal;

      // Calculate status distribution
      const statusData: OrderStatusData = {
        pending: ordersData.filter(o => o.status === "pending").length,
        confirmed: ordersData.filter(o => o.status === "confirmed").length,
        inProgress: ordersData.filter(o => ["in_progress", "processing"].includes(o.status)).length,
        completed: completedOrders,
        cancelled: ordersData.filter(o => o.status === "cancelled").length,
        refunded: ordersData.filter(o => o.status === "refunded").length,
        partial: ordersData.filter(o => o.status === "partial").length,
      };

      setStats({
        activeOrders,
        inProgressOrders,
        completedOrders,
        completedThisMonth,
        monthlyGoal,
        pendingTickets: ticketsResult.count || 0,
        totalOrders: ordersData.length,
        statusData,
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

  const handleSaveGoal = async () => {
    if (newGoal < 1 || newGoal > 1000) {
      toast.error("الرجاء إدخال هدف بين 1 و 1000");
      return;
    }
    
    setSavingGoal(true);
    try {
      await updateMonthlyGoal(newGoal);
      setStats(prev => ({ ...prev, monthlyGoal: newGoal }));
      setShowGoalDialog(false);
      toast.success("تم تحديث الهدف الشهري بنجاح! 🎯");
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الهدف");
    } finally {
      setSavingGoal(false);
    }
  };

  const openGoalDialog = () => {
    setNewGoal(currentAchievement?.monthly_goal || stats.monthlyGoal);
    setShowGoalDialog(true);
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
      {/* Monthly Goal Celebration Modal */}
      <MonthlyGoalCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        completedOrders={stats.completedThisMonth}
        monthlyGoal={stats.monthlyGoal}
      />

      {/* Goal Setting Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <Target className="w-5 h-5 text-primary" />
              تحديد الهدف الشهري
            </DialogTitle>
            <DialogDescription className="text-right">
              حدد عدد الطلبات التي تريد إكمالها هذا الشهر
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-right block">
                الهدف الشهري (عدد الطلبات)
              </Label>
              <Input
                id="goal"
                type="number"
                min={1}
                max={1000}
                value={newGoal}
                onChange={(e) => setNewGoal(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center text-lg font-bold"
                placeholder="10"
              />
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[5, 10, 20, 30, 50].map((preset) => (
                <Button
                  key={preset}
                  variant={newGoal === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewGoal(preset)}
                  className="min-w-12"
                >
                  {preset}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              الهدف الحالي: {currentAchievement?.monthly_goal || stats.monthlyGoal} طلب
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowGoalDialog(false)}
              disabled={savingGoal}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveGoal}
              disabled={savingGoal}
              className="gap-2"
            >
              {savingGoal ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  حفظ الهدف
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <motion.div 
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 sm:space-y-5 md:space-y-6 px-1 sm:px-0"
      >
        {/* Header Section - Compact & Modern */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-l from-primary/5 via-transparent to-accent/5 rounded-2xl p-3 sm:p-4 md:p-5 border border-border/30"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-0.5 truncate">
                مرحباً، {profile?.full_name || "عزيزي العميل"}! 👋
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-muted-foreground text-[10px] sm:text-xs">
                <span>نظرة عامة على حسابك</span>
                <span className="hidden sm:flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {formatDistanceToNow(lastUpdated, { locale: ar, addSuffix: true })}
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-success/10 border-success/30 text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse ml-1" />
                  مباشر
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => fetchDashboardData(false)}
              disabled={refreshing}
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>

        {/* ============ قسم 1: الأرصدة والمحفظة ============ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground">المحفظة والأرصدة</h2>
          </div>
          
          {/* Quick Stats - Compact Row */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex flex-col items-center p-2 sm:p-3 rounded-xl ${stat.bgColor} border border-border/30 hover:border-primary/30 transition-all`}
              >
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} mb-1`} />
                <p className={`text-xs sm:text-sm font-bold ${stat.color} truncate w-full text-center`}>{stat.value}</p>
                <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate w-full text-center">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Balance Summary */}
          <EnhancedBalanceSummary 
            balanceData={balanceData}
            cashbackData={cashbackData}
            pointsData={pointsData}
            isLoading={false}
            onRefresh={() => fetchDashboardData(false)}
          />
        </section>

        {/* ============ قسم 2: الهدف الشهري والنصائح ============ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 rounded-full bg-warning" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground">الأهداف والإنجازات</h2>
          </div>
          
          <MonthlyGoalCard
            completedThisMonth={stats.completedThisMonth}
            monthlyGoal={stats.monthlyGoal}
            onEditGoal={openGoalDialog}
            currentStreak={currentAchievement?.goal_achieved ? 1 : 0}
            bonusPoints={currentAchievement?.bonus_points_awarded || 0}
            isGoalAchieved={stats.completedThisMonth >= stats.monthlyGoal && stats.monthlyGoal > 0}
          />

          <AnimatePresence>
            {tips.length > 0 && (
              <PersonalizedTips tips={tips} onDismiss={dismissTip} />
            )}
          </AnimatePresence>
        </section>

        {/* ============ قسم 3: إحصائيات الطلبات ============ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 rounded-full bg-success" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground">إحصائيات الطلبات</h2>
          </div>
          
          {/* Stats Cards - Compact Grid */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link to={stat.link}>
                  <Card className="border-border/30 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group h-full overflow-hidden">
                    <CardContent className="p-2 sm:p-3 relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${stat.color} p-1 sm:p-1.5 shadow-sm mb-1.5 group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-full h-full text-primary-foreground" />
                      </div>
                      <motion.p 
                        className="text-lg sm:text-xl md:text-2xl font-bold"
                        key={stat.value}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground leading-tight">{stat.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SpendingChart 
              data={spendingData}
              totalSpent={thisMonthSpent}
              percentageChange={percentageChange}
            />
            <OrderStatusChart statusData={stats.statusData} />
          </div>
        </section>

        {/* ============ قسم 4: تتبع الطلب الحالي ============ */}
        {latestOrderForTracker && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-5 rounded-full bg-accent" />
              <h2 className="text-sm sm:text-base font-semibold text-foreground">تتبع الطلب النشط</h2>
            </div>
            <LatestOrderTracker order={latestOrderForTracker} />
          </section>
        )}

        {/* ============ قسم 5: الخدمات والإشعارات والمكافآت ============ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 rounded-full bg-purple-500" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground">المفضلات والإشعارات</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <FavoriteServices services={favoriteServices} />
            <SmartNotifications 
              notifications={notifications} 
              onMarkAsRead={markNotificationAsRead}
            />
            <div className="md:col-span-2 lg:col-span-1">
              <RewardPointsCard />
            </div>
          </div>
        </section>

        {/* ============ قسم 6: الإحالة والتقويم ============ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 rounded-full bg-cyan-500" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground">الإحالات والنشاط</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ReferralCard 
              code={referralData.code || "INVITE123"}
              totalReferrals={referralData.totalReferrals}
              totalEarnings={referralData.totalEarnings}
            />
            <OrderCalendar orderDates={orderDates} />
          </div>
        </section>

        {/* ============ قسم 7: الإنجازات والشارات ============ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 rounded-full bg-yellow-500" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground">الإنجازات والشارات</h2>
          </div>
          
          <AchievementsHistory 
            achievements={achievements} 
            loading={achievementsLoading} 
          />

          {/* User Badges - Compact */}
          <Card className="border-border/30">
            <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3 sm:px-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Award className="w-4 h-4 text-primary" />
                شاراتي
              </CardTitle>
              <Link to="/dashboard/badges">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
                  عرض الكل
                  <ChevronLeft className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-4 pb-3">
              {badgesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              ) : earnedBadges.length === 0 ? (
                <div className="text-center py-4">
                  <Award className="w-8 h-8 mx-auto mb-1.5 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-xs">لم تحصل على شارات بعد</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">أكمل طلباتك للحصول على شاراتك الأولى!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {earnedBadges.slice(0, 5).map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
                    >
                      <span className="text-sm">{badge.icon}</span>
                      <span className="font-medium text-[10px] sm:text-xs">{badge.name_ar}</span>
                      <Badge variant="secondary" className="text-[8px] px-1 h-4">
                        {badge.tier}
                      </Badge>
                    </motion.div>
                  ))}
                  {earnedBadges.length > 5 && (
                    <Link to="/dashboard/badges">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors cursor-pointer">
                        <span className="text-[10px] text-muted-foreground">+{earnedBadges.length - 5} المزيد</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ============ قسم 8: آخر الطلبات ============ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-5 rounded-full bg-orange-500" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground">آخر الطلبات</h2>
          </div>
          
          <Card className="border-border/30">
            <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3 sm:px-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Package className="w-4 h-4 text-primary" />
                الطلبات الأخيرة
              </CardTitle>
              <Link to="/dashboard/orders">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
                  عرض الكل
                  <Eye className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-4 pb-3">
              {recentOrders.length === 0 ? (
                <div className="text-center py-6">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-xs">لا توجد طلبات بعد</p>
                  <Link to="/dashboard/services">
                    <Button variant="outline" size="sm" className="mt-2 h-8 text-xs">
                      تصفح الخدمات
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[11px] sm:text-xs truncate">{order.service?.name || "خدمة"}</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{order.order_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                        <span className="text-[9px] text-muted-foreground hidden sm:block whitespace-nowrap">
                          {format(new Date(order.created_at), "d MMM", { locale: ar })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ============ بانر التمويل ============ */}
        <FinancingBanner variant="dashboard" />

        {/* ============ قسم 9: الدعم الفني ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/30 bg-gradient-to-l from-primary/5 via-transparent to-accent/5 overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-right flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Settings2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold">هل تحتاج مساعدة؟</h3>
                    <p className="text-muted-foreground text-[10px] sm:text-xs">فريق الدعم متاح على مدار الساعة</p>
                  </div>
                </div>
                <Link to="/dashboard/support" className="w-full sm:w-auto">
                  <Button className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg w-full sm:w-auto h-9 text-xs">
                    تواصل مع الدعم
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientDashboard;
