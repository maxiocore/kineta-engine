import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Sparkles,
  BarChart3,
  Star,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardSkeleton from "@/components/admin/DashboardSkeleton";
import AdvancedDashboardCharts from "@/components/admin/AdvancedDashboardCharts";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState("overview");
  const [activityFilter, setActivityFilter] = useState("all");
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
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      trend: stats.usersTrend,
      onClick: () => navigate("/admin/users"),
    },
    { 
      title: "الطلبات المعلقة", 
      value: stats.pendingOrders, 
      icon: Clock,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      trend: stats.ordersTrend,
      onClick: () => navigate("/admin/orders"),
    },
    { 
      title: "الطلبات المكتملة", 
      value: stats.completedOrders, 
      icon: CheckCircle,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      onClick: () => navigate("/admin/orders"),
    },
    { 
      title: "الإيرادات الشهرية", 
      value: stats.monthlyRevenue, 
      icon: DollarSign,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      suffix: " ر.س",
      trend: stats.revenueTrend,
      onClick: () => navigate("/admin/reports"),
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Clock className="w-4 h-4 text-warning" />;
      case "user":
        return <Users className="w-4 h-4 text-primary" />;
      case "ticket":
        return <CheckCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredActivities = activityFilter === "all" 
    ? activities 
    : activities.filter(a => {
        if (activityFilter === "orders") return a.type === "order";
        if (activityFilter === "users") return a.type === "user";
        if (activityFilter === "support") return a.type === "ticket";
        return true;
      });

  if (loading) {
    return (
      <AdminDashboardLayout>
        <DashboardSkeleton />
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-4 sm:space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">لوحة التحكم</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">نظرة شاملة على أداء المنصة</p>
            </div>
          </div>
          
          <motion.div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 w-fit"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success font-medium">مباشر</span>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-10 p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm gap-1.5">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              الإحصائيات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {statsData.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 bg-card"
                    onClick={stat.onClick}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center", stat.iconBg)}>
                          <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.iconColor)} />
                        </div>
                        {stat.trend !== undefined && stat.trend > 0 && (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-success/10 text-success text-[10px] sm:text-xs font-medium">
                            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {stat.trend}%
                          </div>
                        )}
                      </div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold">
                        {stat.value.toLocaleString()}{stat.suffix || ""}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{stat.title}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Top Services */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Star className="w-4 h-4 text-warning" />
                      أفضل الخدمات
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-8"
                      onClick={() => navigate("/admin/services")}
                    >
                      <Eye className="w-3 h-3 ml-1" />
                      عرض الكل
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
                  {topServices.length > 0 ? (
                    topServices.map((service, index) => (
                      <div 
                        key={service.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold",
                          index === 0 ? "bg-warning/20 text-warning" : 
                          index === 1 ? "bg-muted-foreground/20 text-muted-foreground" :
                          index === 2 ? "bg-orange-500/20 text-orange-500" :
                          "bg-secondary text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{service.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{service.orders} طلب</p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs sm:text-sm font-semibold">{service.revenue.toLocaleString()} ر.س</p>
                          {service.trend > 0 && (
                            <span className="text-[10px] text-success flex items-center justify-end gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" />
                              {service.trend}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                      لا توجد خدمات بعد
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <Card className="border-border/50">
                <CardHeader className="pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      النشاط الأخير
                    </CardTitle>
                  </div>
                  {/* Activity Filters */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {[
                      { id: "all", label: "الكل" },
                      { id: "orders", label: "الطلبات" },
                      { id: "users", label: "المستخدمين" },
                      { id: "support", label: "الدعم" },
                    ].map((filter) => (
                      <Button
                        key={filter.id}
                        variant={activityFilter === filter.id ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[10px] sm:text-xs px-2 sm:px-3"
                        onClick={() => setActivityFilter(filter.id)}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3 max-h-[350px] overflow-y-auto">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity) => (
                      <div 
                        key={activity.id}
                        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{activity.message}</p>
                          {activity.details && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{activity.details}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
                        </div>
                        {activity.isNew && (
                          <span className="px-1.5 py-0.5 text-[8px] sm:text-[10px] bg-primary/10 text-primary rounded-full font-medium">
                            جديد
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                      لا يوجد نشاط حتى الآن
                    </div>
                  )}
                </CardContent>
              </Card>
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
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
