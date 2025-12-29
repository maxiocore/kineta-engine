import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardSkeleton from "@/components/admin/DashboardSkeleton";
import AdvancedDashboardCharts from "@/components/admin/AdvancedDashboardCharts";
import DashboardHeader from "@/components/admin/dashboard/DashboardHeader";
import EnhancedStatCard from "@/components/admin/dashboard/EnhancedStatCard";
import QuickStatsRow from "@/components/admin/dashboard/QuickStatsRow";
import TopServicesCard from "@/components/admin/dashboard/TopServicesCard";
import ActivityFeedCard from "@/components/admin/dashboard/ActivityFeedCard";
import RevenueOverviewCard from "@/components/admin/dashboard/RevenueOverviewCard";
import MobileDashboardHeader from "@/components/admin/MobileDashboardHeader";
import MobileDashboardStats from "@/components/admin/MobileDashboardStats";
import MobileRevenueCard from "@/components/admin/MobileRevenueCard";
import MobileActivityFeed from "@/components/admin/MobileActivityFeed";
import MobileQuickActions from "@/components/admin/MobileQuickActions";
import MobileTopServices from "@/components/admin/MobileTopServices";
import LiveOrdersChart from "@/components/admin/LiveOrdersChart";
import MobileLiveOrdersChart from "@/components/admin/MobileLiveOrdersChart";

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  usersTrend: number;
  ordersTrend: number;
  revenueTrend: number;
  totalBalance: number;
  totalDeposits: number;
  openTickets: number;
  pendingMessages: number;
}

interface Activity {
  id: string;
  type: "order" | "user" | "ticket";
  message: string;
  details?: string;
  time: string;
  timestamp: Date;
  isNew?: boolean;
}

interface TopService {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  trend: number;
}

interface ChartData {
  orders: any[];
  deposits: any[];
  users: any[];
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    usersTrend: 0,
    ordersTrend: 0,
    revenueTrend: 0,
    totalBalance: 0,
    totalDeposits: 0,
    openTickets: 0,
    pendingMessages: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    orders: [],
    deposits: [],
    users: [],
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchDashboardData();

    const ordersChannel = supabase
      .channel("dashboard-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          toast({
            title: "🎉 طلب جديد!",
            description: `تم استلام طلب جديد رقم ${(payload.new as any).order_number}`,
          });
        }
        fetchDashboardData();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel("dashboard-profiles-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
        if (payload.eventType === "INSERT") {
          toast({
            title: "👤 مستخدم جديد!",
            description: `انضم مستخدم جديد للمنصة`,
          });
        }
        fetchDashboardData();
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel("dashboard-tickets-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, (payload) => {
        if (payload.eventType === "INSERT") {
          toast({
            title: "🎫 تذكرة دعم جديدة",
            description: (payload.new as any).subject,
          });
        }
        fetchDashboardData();
      })
      .subscribe();

    const depositsChannel = supabase
      .channel("dashboard-deposits-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, (payload) => {
        if (payload.eventType === "INSERT" || (payload.eventType === "UPDATE" && (payload.new as any).status === "completed")) {
          toast({
            title: "💰 إيداع جديد!",
            description: `تم ${(payload.new as any).status === "completed" ? "اكتمال" : "استلام"} إيداع بقيمة ${(payload.new as any).amount} ر.س`,
          });
        }
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(depositsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, is_verified, created_at");

      const totalUsers = profiles?.length || 0;
      const verifiedUsers = profiles?.filter(p => p.is_verified)?.length || 0;

      const weekAgo = subDays(new Date(), 7);
      const newUsersThisWeek = profiles?.filter(p => new Date(p.created_at!) > weekAgo).length || 0;
      const usersTrend = totalUsers > 0 ? Math.round((newUsersThisWeek / totalUsers) * 100) : 0;

      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, total_price, created_at, service_id");

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === "pending")?.length || 0;
      const completedOrders = orders?.filter(o => o.status === "completed")?.length || 0;
      // Only count completed orders for revenue (exclude cancelled, refunded orders)
      const completedOrdersForRevenue = orders?.filter(o => 
        o.status === 'completed' || o.status === 'in_progress' || o.status === 'processing'
      ) || [];
      const totalRevenue = completedOrdersForRevenue.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = completedOrdersForRevenue.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }).reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

      const weeklyRevenue = completedOrdersForRevenue.filter(o => new Date(o.created_at) > weekAgo)
        .reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

      const newOrdersThisWeek = orders?.filter(o => new Date(o.created_at) > weekAgo).length || 0;
      const ordersTrend = totalOrders > 0 ? Math.round((newOrdersThisWeek / totalOrders) * 100) : 0;

      const lastMonthRevenue = completedOrdersForRevenue.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === (currentMonth - 1) && orderDate.getFullYear() === currentYear;
      }).reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
      const revenueTrend = lastMonthRevenue > 0 
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
        : monthlyRevenue > 0 ? 100 : 0;

      // Fetch additional stats
      const { data: balances } = await supabase.from("user_balances").select("balance");
      const totalBalance = balances?.reduce((sum, b) => sum + Number(b.balance), 0) || 0;

      const { data: deposits } = await supabase
        .from("deposits")
        .select("id, amount, status, created_at")
        .eq("status", "completed");
      const totalDeposits = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("id, status")
        .in("status", ["open", "in_progress"]);
      const openTickets = tickets?.length || 0;

      const { data: messages } = await supabase
        .from("ticket_messages")
        .select("id")
        .eq("is_admin", false);
      const pendingMessages = messages?.length || 0;

      setStats({
        totalUsers,
        verifiedUsers,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        usersTrend,
        ordersTrend,
        revenueTrend,
        totalBalance,
        totalDeposits,
        openTickets,
        pendingMessages,
      });

      const activitiesList: Activity[] = [];

      const { data: recentOrders } = await supabase
        .from("orders")
        .select(`
          id, order_number, status, created_at,
          service:services(name),
          profile:profiles(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      recentOrders?.forEach(order => {
        activitiesList.push({
          id: `order-${order.id}`,
          type: "order",
          message: `طلب جديد ${order.order_number}`,
          details: (order.service as any)?.name || "خدمة",
          time: format(new Date(order.created_at), "منذ d دقيقة", { locale: ar }),
          timestamp: new Date(order.created_at),
          isNew: new Date(order.created_at) > subDays(new Date(), 1),
        });
      });

      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      recentUsers?.forEach(user => {
        activitiesList.push({
          id: `user-${user.id}`,
          type: "user",
          message: `مستخدم جديد: ${user.full_name || "مستخدم"}`,
          details: user.email || undefined,
          time: format(new Date(user.created_at!), "منذ d دقيقة", { locale: ar }),
          timestamp: new Date(user.created_at!),
          isNew: new Date(user.created_at!) > subDays(new Date(), 1),
        });
      });

      const { data: recentTickets } = await supabase
        .from("support_tickets")
        .select("id, subject, created_at, priority")
        .order("created_at", { ascending: false })
        .limit(3);

      recentTickets?.forEach(ticket => {
        activitiesList.push({
          id: `ticket-${ticket.id}`,
          type: "ticket",
          message: ticket.subject,
          details: `أولوية: ${ticket.priority}`,
          time: format(new Date(ticket.created_at!), "منذ d دقيقة", { locale: ar }),
          timestamp: new Date(ticket.created_at!),
          isNew: new Date(ticket.created_at!) > subDays(new Date(), 1),
        });
      });

      activitiesList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(activitiesList.slice(0, 10));

      const { data: services } = await supabase
        .from("services")
        .select("id, name")
        .eq("status", "active");

      const serviceStats: TopService[] = [];
      for (const service of services || []) {
        const serviceOrders = orders?.filter(o => o.service_id === service.id) || [];
        // Only count completed orders for service revenue
        const completedServiceOrders = serviceOrders.filter(o => 
          o.status === 'completed' || o.status === 'in_progress' || o.status === 'processing'
        );
        const revenue = completedServiceOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
        
        const recentServiceOrders = serviceOrders.filter(o => new Date(o.created_at) > weekAgo);
        const trend = serviceOrders.length > 0 
          ? Math.round((recentServiceOrders.length / serviceOrders.length) * 100) 
          : 0;

        serviceStats.push({
          id: service.id,
          name: service.name,
          orders: serviceOrders.length,
          revenue,
          trend,
        });
      }

      serviceStats.sort((a, b) => b.revenue - a.revenue);
      setTopServices(serviceStats.slice(0, 5));

      const { data: depositsData } = await supabase
        .from("deposits")
        .select("id, amount, status, created_at");

      setChartData({
        orders: orders || [],
        deposits: depositsData || [],
        users: profiles?.map(p => ({ id: p.id, created_at: p.created_at || '', is_verified: p.is_verified || false })) || [],
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  }, []);

  const statsData = [
    {
      title: "إجمالي المستخدمين",
      value: stats.totalUsers,
      icon: Users,
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-gradient-to-br from-primary to-blue-600",
      trend: stats.usersTrend,
      onClick: () => navigate("/admin/users"),
      subtitle: `${stats.verifiedUsers} مستخدم موثق`,
    },
    {
      title: "الطلبات المعلقة",
      value: stats.pendingOrders,
      icon: Clock,
      gradient: "from-warning/20 to-warning/5",
      iconBg: "bg-gradient-to-br from-warning to-orange-600",
      trend: stats.ordersTrend,
      onClick: () => navigate("/admin/orders"),
      subtitle: `من إجمالي ${stats.totalOrders} طلب`,
    },
    {
      title: "الطلبات المكتملة",
      value: stats.completedOrders,
      icon: CheckCircle,
      gradient: "from-success/20 to-success/5",
      iconBg: "bg-gradient-to-br from-success to-emerald-600",
      onClick: () => navigate("/admin/orders"),
      subtitle: "طلبات تم تنفيذها بنجاح",
    },
    {
      title: "الإيرادات الشهرية",
      value: stats.monthlyRevenue,
      icon: DollarSign,
      gradient: "from-accent/20 to-accent/5",
      iconBg: "bg-gradient-to-br from-accent to-purple-600",
      suffix: " ر.س",
      trend: stats.revenueTrend,
      onClick: () => navigate("/admin/reports"),
      subtitle: "إيرادات الشهر الحالي",
    },
  ];

  if (loading) {
    return (
      <AdminDashboardLayout>
        <DashboardSkeleton />
      </AdminDashboardLayout>
    );
  }

  // Mobile-optimized dashboard content
  const mobileDashboardContent = (
    <div className="space-y-3" dir="rtl">
      <MobileDashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-9 p-0.5 bg-secondary/50">
          <TabsTrigger value="overview" className="text-xs gap-1 data-[state=active]:bg-background">
            <Sparkles className="w-3 h-3" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs gap-1 data-[state=active]:bg-background">
            <BarChart3 className="w-3 h-3" />
            الإحصائيات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 mt-3">
          <MobileDashboardStats stats={statsData} />
          <MobileLiveOrdersChart />
          <MobileRevenueCard
            totalRevenue={stats.totalRevenue}
            monthlyRevenue={stats.monthlyRevenue}
            weeklyRevenue={stats.weeklyRevenue}
            revenueTrend={stats.revenueTrend}
          />
          <MobileQuickActions />
          <MobileTopServices services={topServices} />
          <MobileActivityFeed activities={activities} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-3">
          <AdvancedDashboardCharts
            orders={chartData.orders}
            deposits={chartData.deposits}
            users={chartData.users}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  // Desktop dashboard content
  const dashboardContent = (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      {/* Enhanced Header */}
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-11 p-1 bg-secondary/50">
          <TabsTrigger value="overview" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            الإحصائيات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statsData.map((stat, index) => (
              <EnhancedStatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                gradient={stat.gradient}
                iconBg={stat.iconBg}
                trend={stat.trend}
                suffix={stat.suffix}
                delay={index * 0.1}
                onClick={stat.onClick}
              />
            ))}
          </div>

          {/* Quick Stats Row */}
          <QuickStatsRow
            totalBalance={stats.totalBalance}
            totalDeposits={stats.totalDeposits}
            openTickets={stats.openTickets}
            pendingMessages={stats.pendingMessages}
          />

          {/* Live Orders Chart - Full Width */}
          <LiveOrdersChart />

          {/* Three Column Layout */}
          <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
            {/* Revenue Overview */}
            <div className="lg:col-span-1">
              <RevenueOverviewCard
                totalRevenue={stats.totalRevenue}
                monthlyRevenue={stats.monthlyRevenue}
                weeklyRevenue={stats.weeklyRevenue}
                revenueTrend={stats.revenueTrend}
              />
            </div>

            {/* Top Services */}
            <div className="lg:col-span-1">
              <TopServicesCard services={topServices} />
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeedCard activities={activities} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AdvancedDashboardCharts
            orders={chartData.orders}
            deposits={chartData.deposits}
            users={chartData.users}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <AdminDashboardLayout>
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh} className="h-full">
          {mobileDashboardContent}
        </PullToRefresh>
      ) : (
        dashboardContent
      )}
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
