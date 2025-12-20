import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

import StatCard from "@/components/admin/StatCard";
import MobileStatCard from "@/components/admin/MobileStatCard";
import ActivityTimeline, { Activity } from "@/components/admin/ActivityTimeline";
import MobileActivityList from "@/components/admin/MobileActivityList";
import TopServicesWidget, { TopService } from "@/components/admin/TopServicesWidget";
import MobileTopServices from "@/components/admin/MobileTopServices";
import QuickActions from "@/components/admin/QuickActions";
import MobileQuickActions from "@/components/admin/MobileQuickActions";
import DashboardSkeleton from "@/components/admin/DashboardSkeleton";
import AdvancedDashboardCharts from "@/components/admin/AdvancedDashboardCharts";

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  usersTrend: number;
  ordersTrend: number;
  revenueTrend: number;
}

interface ChartData {
  orders: any[];
  deposits: any[];
  users: any[];
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    usersTrend: 0,
    ordersTrend: 0,
    revenueTrend: 0,
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

    const servicesChannel = supabase
      .channel("dashboard-services-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const balancesChannel = supabase
      .channel("dashboard-balances-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_balances" }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(depositsChannel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(balancesChannel);
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
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = orders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }).reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

      const newOrdersThisWeek = orders?.filter(o => new Date(o.created_at) > weekAgo).length || 0;
      const ordersTrend = totalOrders > 0 ? Math.round((newOrdersThisWeek / totalOrders) * 100) : 0;

      const lastMonthRevenue = orders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === (currentMonth - 1) && orderDate.getFullYear() === currentYear;
      }).reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
      const revenueTrend = lastMonthRevenue > 0 
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
        : monthlyRevenue > 0 ? 100 : 0;

      setStats({
        totalUsers,
        verifiedUsers,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        monthlyRevenue,
        usersTrend,
        ordersTrend,
        revenueTrend,
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
      setActivities(activitiesList.slice(0, 8));

      const { data: services } = await supabase
        .from("services")
        .select("id, name")
        .eq("status", "active");

      const serviceStats: TopService[] = [];
      for (const service of services || []) {
        const serviceOrders = orders?.filter(o => o.service_id === service.id) || [];
        const revenue = serviceOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
        
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

  const statsData = [
    { 
      title: "إجمالي المستخدمين", 
      value: stats.totalUsers, 
      icon: Users, 
      gradient: "from-primary via-cyan-400 to-primary",
      shadowColor: "shadow-primary/20",
      trend: stats.usersTrend,
      onClick: () => navigate("/admin/users"),
    },
    { 
      title: "الطلبات المعلقة", 
      value: stats.pendingOrders, 
      icon: Clock, 
      gradient: "from-warning via-orange-400 to-warning",
      shadowColor: "shadow-warning/20",
      trend: stats.ordersTrend,
      onClick: () => navigate("/admin/orders"),
    },
    { 
      title: "الطلبات المكتملة", 
      value: stats.completedOrders, 
      icon: CheckCircle, 
      gradient: "from-success via-emerald-400 to-success",
      shadowColor: "shadow-success/20",
      onClick: () => navigate("/admin/orders"),
    },
    { 
      title: "الإيرادات الشهرية", 
      value: stats.monthlyRevenue, 
      icon: DollarSign, 
      gradient: "from-accent via-pink-400 to-accent",
      shadowColor: "shadow-accent/20",
      suffix: " ر.س",
      trend: stats.revenueTrend,
      onClick: () => navigate("/admin/reports"),
    },
  ];

  if (loading) {
    return (
      <AdminDashboardLayout>
        <DashboardSkeleton />
      </AdminDashboardLayout>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <AdminDashboardLayout>
        <div className="space-y-4 w-full" dir="rtl">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <motion.div
                  className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
                لوحة التحكم
              </h1>
              <p className="text-xs text-muted-foreground">نظرة شاملة على أداء المنصة</p>
            </div>
            
            <motion.div 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 border border-success/20"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-success font-medium">مباشر</span>
            </motion.div>
          </div>

          {/* Mobile Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="overview" className="text-xs gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                الإحصائيات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Mobile Stats Grid - 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                {statsData.map((stat, index) => (
                  <MobileStatCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    gradient={stat.gradient}
                    trend={stat.trend}
                    suffix={stat.suffix}
                    delay={index * 0.1}
                    onClick={stat.onClick}
                  />
                ))}
              </div>

              {/* Mobile Quick Actions */}
              <MobileQuickActions />

              {/* Mobile Activity List */}
              <MobileActivityList 
                activities={activities}
                onViewAll={() => navigate("/admin/logs")}
              />

              {/* Mobile Top Services */}
              <MobileTopServices services={topServices} />
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
      </AdminDashboardLayout>
    );
  }

  // Desktop Layout
  return (
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-6 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
              <motion.div
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </motion.div>
              لوحة التحكم
            </h1>
            <p className="text-muted-foreground text-sm">نظرة شاملة على أداء المنصة</p>
          </div>
          
          <motion.div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success font-medium">مباشر</span>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-xs grid-cols-2 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              الإحصائيات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsData.map((stat, index) => (
                <StatCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  gradient={stat.gradient}
                  shadowColor={stat.shadowColor}
                  trend={stat.trend}
                  suffix={stat.suffix}
                  delay={index * 0.08}
                  onClick={stat.onClick}
                />
              ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ActivityTimeline 
                activities={activities}
                maxItems={5}
                onViewAll={() => navigate("/admin/logs")}
              />
              <TopServicesWidget services={topServices} />
            </div>

            {/* Quick Actions */}
            <QuickActions />
          </TabsContent>

          <TabsContent value="analytics">
            <AdvancedDashboardCharts 
              orders={chartData.orders}
              deposits={chartData.deposits}
              users={chartData.users}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
