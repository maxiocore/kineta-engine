import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserBadges } from "@/hooks/useUserBadges";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  service: { name: string } | null;
}

interface DashboardStats {
  activeOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  pendingTickets: number;
}

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  refunded: "مسترد",
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-success/10 text-success border border-success/20";
    case "in_progress":
      return "bg-accent/10 text-accent border border-accent/20";
    case "pending":
      return "bg-warning/10 text-warning border border-warning/20";
    case "confirmed":
      return "bg-primary/10 text-primary border border-primary/20";
    case "cancelled":
    case "refunded":
      return "bg-destructive/10 text-destructive border border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const { badges, userBadges, loading: badgesLoading } = useUserBadges(user?.id);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    pendingTickets: 0,
  });

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const earnedBadges = badges.filter(b => earnedBadgeIds.has(b.id));

  useEffect(() => {
    if (user) {
      fetchDashboardData();

      // Real-time subscription
      const channel = supabase
        .channel("client-orders")
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "orders",
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchDashboardData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch orders
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, created_at,
        service:services(name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const ordersData = (orders as unknown as Order[]) || [];
    setRecentOrders(ordersData.slice(0, 5));

    // Calculate stats
    const activeOrders = ordersData.filter(o => 
      ["pending", "confirmed", "in_progress"].includes(o.status)
    ).length;
    const inProgressOrders = ordersData.filter(o => o.status === "in_progress").length;
    const completedOrders = ordersData.filter(o => o.status === "completed").length;

    // Fetch tickets
    const { count: pendingTickets } = await supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["open", "in_progress"]);

    setStats({
      activeOrders,
      inProgressOrders,
      completedOrders,
      pendingTickets: pendingTickets || 0,
    });

    setLoading(false);
  };

  const statsData = [
    {
      title: "الطلبات النشطة",
      value: stats.activeOrders.toString(),
      icon: ShoppingBag,
      color: "from-primary to-cyan-400",
    },
    {
      title: "قيد التنفيذ",
      value: stats.inProgressOrders.toString(),
      icon: Clock,
      color: "from-warning to-orange-400",
    },
    {
      title: "مكتملة",
      value: stats.completedOrders.toString(),
      icon: CheckCircle,
      color: "from-success to-emerald-400",
    },
    {
      title: "تذاكر الدعم",
      value: stats.pendingTickets.toString(),
      icon: Bell,
      color: "from-accent to-pink-400",
    },
  ];

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2"
          >
            مرحباً، {profile?.full_name || "عزيزي العميل"}! 👋
          </motion.h1>
          <p className="text-muted-foreground text-sm sm:text-base">إليك نظرة عامة على حسابك</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-elevated border-border/30 hover:border-primary/30 transition-colors">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} p-1.5 sm:p-2.5 lg:p-3 shadow-lg`}>
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </div>
                  </div>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* User Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-elevated border-border/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                شاراتي
              </CardTitle>
              <Link to="/dashboard/badges">
                <Button variant="ghost" size="sm" className="gap-2">
                  عرض الكل
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {badgesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : earnedBadges.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">لم تحصل على شارات بعد</p>
                  <p className="text-xs text-muted-foreground mt-1">أكمل طلباتك للحصول على شاراتك الأولى!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {earnedBadges.slice(0, 5).map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
                    >
                      <span className="text-lg">{badge.icon}</span>
                      <span className="font-medium text-sm">{badge.name_ar}</span>
                      <Badge variant="secondary" className="text-xs">
                        {badge.tier}
                      </Badge>
                    </motion.div>
                  ))}
                  {earnedBadges.length > 5 && (
                    <Link to="/dashboard/badges">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors cursor-pointer">
                        <span className="text-sm text-muted-foreground">+{earnedBadges.length - 5} المزيد</span>
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
          transition={{ delay: 0.5 }}
        >
          <Card className="card-elevated border-border/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                آخر الطلبات
              </CardTitle>
              <Link to="/dashboard/orders">
                <Button variant="ghost" size="sm" className="gap-2">
                  عرض الكل
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">لا توجد طلبات بعد</p>
                  <Link to="/services">
                    <Button variant="outline" className="mt-4">
                      تصفح الخدمات
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{order.service?.name || "خدمة"}</p>
                          <p className="text-sm text-muted-foreground">{order.order_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                        <span className="text-sm text-muted-foreground hidden sm:block">
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

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-elevated border-border/30 bg-gradient-to-l from-primary/5 to-accent/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">هل تحتاج مساعدة؟</h3>
                  <p className="text-muted-foreground">فريق الدعم متاح على مدار الساعة</p>
                </div>
                <Link to="/dashboard/support">
                  <Button className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg">
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
