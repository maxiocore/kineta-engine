import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  ArrowUpLeft,
  ArrowDownRight,
  Activity,
  Eye,
  Zap,
  Clock,
  Loader2,
  Package,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface RecentActivity {
  id: string;
  type: "order" | "user" | "ticket";
  message: string;
  time: string;
  icon: typeof Users;
  color: string;
}

interface TopService {
  id: string;
  name: string;
  orders: number;
  revenue: number;
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
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);

  useEffect(() => {
    fetchDashboardData();

    // Real-time subscriptions
    const ordersChannel = supabase
      .channel("dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel("dashboard-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel("dashboard-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
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
    setLoading(true);

    // Fetch users stats
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, is_verified, created_at");

    const totalUsers = profiles?.length || 0;
    const verifiedUsers = profiles?.filter(p => p.is_verified)?.length || 0;

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

    setStats({
      totalUsers,
      verifiedUsers,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      monthlyRevenue,
    });

    // Fetch recent activities
    const activities: RecentActivity[] = [];

    // Recent orders
    const { data: recentOrders } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, created_at,
        service:services(name),
        profile:profiles(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(3);

    recentOrders?.forEach(order => {
      activities.push({
        id: `order-${order.id}`,
        type: "order",
        message: `طلب جديد ${order.order_number} - ${(order.service as any)?.name || "خدمة"}`,
        time: format(new Date(order.created_at), "منذ d دقيقة", { locale: ar }),
        icon: ShoppingBag,
        color: "text-success",
      });
    });

    // Recent users
    const { data: recentUsers } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(2);

    recentUsers?.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: "user",
        message: `مستخدم جديد: ${user.full_name || user.email || "مستخدم"}`,
        time: format(new Date(user.created_at!), "منذ d دقيقة", { locale: ar }),
        icon: Users,
        color: "text-primary",
      });
    });

    // Recent tickets
    const { data: recentTickets } = await supabase
      .from("support_tickets")
      .select("id, subject, created_at")
      .order("created_at", { ascending: false })
      .limit(2);

    recentTickets?.forEach(ticket => {
      activities.push({
        id: `ticket-${ticket.id}`,
        type: "ticket",
        message: `تذكرة دعم: ${ticket.subject}`,
        time: format(new Date(ticket.created_at!), "منذ d دقيقة", { locale: ar }),
        icon: AlertCircle,
        color: "text-warning",
      });
    });

    // Sort by time
    activities.sort((a, b) => b.time.localeCompare(a.time));
    setRecentActivities(activities.slice(0, 5));

    // Fetch top services
    const { data: services } = await supabase
      .from("services")
      .select("id, name")
      .eq("status", "active");

    const serviceStats: TopService[] = [];
    for (const service of services || []) {
      const serviceOrders = orders?.filter(o => o.service_id === service.id) || [];
      serviceStats.push({
        id: service.id,
        name: service.name,
        orders: serviceOrders.length,
        revenue: serviceOrders.reduce((sum, o) => sum + Number(o.total_price), 0),
      });
    }

    serviceStats.sort((a, b) => b.revenue - a.revenue);
    setTopServices(serviceStats.slice(0, 4));

    setLoading(false);
  };

  const statsData = [
    { 
      title: "إجمالي المستخدمين", 
      value: stats.totalUsers.toLocaleString("ar-SA"), 
      icon: Users, 
      gradient: "from-primary via-cyan-400 to-primary",
      shadowColor: "shadow-primary/20"
    },
    { 
      title: "الطلبات الجديدة", 
      value: stats.pendingOrders.toLocaleString("ar-SA"), 
      icon: ShoppingBag, 
      gradient: "from-warning via-orange-400 to-warning",
      shadowColor: "shadow-warning/20"
    },
    { 
      title: "الطلبات المكتملة", 
      value: stats.completedOrders.toLocaleString("ar-SA"), 
      icon: CheckCircle, 
      gradient: "from-success via-emerald-400 to-success",
      shadowColor: "shadow-success/20"
    },
    { 
      title: "الإيرادات الشهرية", 
      value: `${stats.monthlyRevenue.toLocaleString("ar-SA")} ر.س`, 
      icon: DollarSign, 
      gradient: "from-accent via-pink-400 to-accent",
      shadowColor: "shadow-accent/20"
    },
  ];

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🎯
            </motion.span>
            لوحة التحكم
          </h1>
          <p className="text-muted-foreground">نظرة شاملة على أداء المنصة</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className={`card-elevated border-border/30 hover:border-primary/30 transition-all duration-300 ${stat.shadowColor} shadow-lg`}>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} p-3 shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </motion.div>
                  </div>
                  <motion.p 
                    className="text-2xl sm:text-3xl font-bold mb-1"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <Card className="card-elevated border-border/30 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Activity className="w-5 h-5 text-primary" />
                  </motion.div>
                  النشاط الأخير
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا يوجد نشاط حديث</p>
                  </div>
                ) : (
                  recentActivities.map((activity, index) => (
                    <motion.div 
                      key={activity.id} 
                      className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 4 }}
                    >
                      <motion.div 
                        className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${activity.color}`}
                        whileHover={{ rotate: 10 }}
                      >
                        <activity.icon className="w-5 h-5" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.message}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Services */}
          <motion.div variants={itemVariants}>
            <Card className="card-elevated border-border/30 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">أفضل الخدمات</CardTitle>
                <Link to="/admin/services">
                  <Button variant="ghost" size="sm" className="gap-2 text-xs">
                    عرض الكل
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {topServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد خدمات بعد</p>
                  </div>
                ) : (
                  topServices.map((service, index) => (
                    <motion.div 
                      key={service.id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: -4 }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.span 
                          className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary border border-primary/20"
                          whileHover={{ scale: 1.1 }}
                        >
                          {index + 1}
                        </motion.span>
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{service.orders} طلب</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-sm text-success block">
                          {service.revenue.toLocaleString("ar-SA")} ر.س
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border/30 bg-gradient-to-l from-destructive/5 via-orange-500/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    إجراءات سريعة
                  </h3>
                  <p className="text-muted-foreground text-sm">إدارة المنصة بسرعة وكفاءة</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Link to="/admin/users">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="gap-2">
                        <Users className="w-4 h-4" />
                        المستخدمين
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/admin/orders">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        الطلبات
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/admin/reports">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground gap-2 shadow-lg shadow-destructive/20">
                        <TrendingUp className="w-4 h-4" />
                        التقارير
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
