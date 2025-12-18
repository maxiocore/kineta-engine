import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ShoppingBag,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

import StatCard from "@/components/admin/StatCard";
import ActivityTimeline, { Activity } from "@/components/admin/ActivityTimeline";
import TopServicesWidget, { TopService } from "@/components/admin/TopServicesWidget";
import QuickActions from "@/components/admin/QuickActions";
import DashboardSkeleton from "@/components/admin/DashboardSkeleton";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();

    // Real-time subscriptions with notifications
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

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(ticketsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users stats
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, is_verified, created_at");

      const totalUsers = profiles?.length || 0;
      const verifiedUsers = profiles?.filter(p => p.is_verified)?.length || 0;

      // Calculate users trend (last 7 days)
      const weekAgo = subDays(new Date(), 7);
      const newUsersThisWeek = profiles?.filter(p => new Date(p.created_at!) > weekAgo).length || 0;
      const usersTrend = totalUsers > 0 ? Math.round((newUsersThisWeek / totalUsers) * 100) : 0;

      // Fetch orders stats
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, total_price, created_at, service_id");

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === "pending")?.length || 0;
      const completedOrders = orders?.filter(o => o.status === "completed")?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

      // Monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = orders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }).reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

      // Calculate orders trend
      const newOrdersThisWeek = orders?.filter(o => new Date(o.created_at) > weekAgo).length || 0;
      const ordersTrend = totalOrders > 0 ? Math.round((newOrdersThisWeek / totalOrders) * 100) : 0;

      // Calculate revenue trend
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

      // Fetch recent activities
      const activitiesList: Activity[] = [];

      // Recent orders
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

      // Recent users
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

      // Recent tickets
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

      // Sort by timestamp
      activitiesList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(activitiesList.slice(0, 8));

      // Fetch top services
      const { data: services } = await supabase
        .from("services")
        .select("id, name")
        .eq("status", "active");

      const serviceStats: TopService[] = [];
      for (const service of services || []) {
        const serviceOrders = orders?.filter(o => o.service_id === service.id) || [];
        const revenue = serviceOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
        
        // Calculate trend for this service
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

  return (
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-4 sm:space-y-6 lg:space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <motion.div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </motion.div>
              لوحة التحكم
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">نظرة شاملة على أداء المنصة في الوقت الفعلي</p>
          </div>
          
          <motion.div 
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-success/10 border border-success/20 self-start sm:self-auto"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs sm:text-sm text-success font-medium">مباشر</span>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
              delay={index * 0.1}
              onClick={stat.onClick}
            />
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <motion.div variants={itemVariants}>
            <ActivityTimeline 
              activities={activities}
              maxItems={6}
              onViewAll={() => navigate("/admin/logs")}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <TopServicesWidget services={topServices} />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <QuickActions />
        </motion.div>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
