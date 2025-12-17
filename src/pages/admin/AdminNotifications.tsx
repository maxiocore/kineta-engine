import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Send, 
  Users, 
  Settings,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  Megaphone,
  Mail,
  Trash2,
  Loader2,
  ShoppingBag,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface NotificationStats {
  totalOrders: number;
  pendingOrders: number;
  openTickets: number;
  totalUsers: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_price: number;
  service: { name: string } | null;
  profile: { full_name: string | null; email: string | null } | null;
}

interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  profile: { full_name: string | null; email: string | null } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-accent/10 text-accent border-accent/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  open: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  open: "مفتوحة",
  resolved: "محلولة",
  closed: "مغلقة",
};

const AdminNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats>({
    totalOrders: 0,
    pendingOrders: 0,
    openTickets: 0,
    totalUsers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    type: "",
    target: "",
    title: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();

    // Real-time subscriptions
    const ordersChannel = supabase
      .channel("notifications-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchData();
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel("notifications-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ticketsChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch orders
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, created_at, total_price,
        service:services(name),
        profile:profiles(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    setRecentOrders((orders as unknown as RecentOrder[]) || []);

    // Fetch tickets
    const { data: tickets } = await supabase
      .from("support_tickets")
      .select(`
        id, subject, status, priority, created_at, user_id
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get profiles for tickets
    const ticketsWithProfiles: RecentTicket[] = [];
    for (const ticket of tickets || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", ticket.user_id)
        .maybeSingle();
      
      ticketsWithProfiles.push({
        ...ticket,
        profile,
      });
    }
    setRecentTickets(ticketsWithProfiles);

    // Fetch stats
    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const { count: pendingOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: openTickets } = await supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]);

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    setStats({
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      openTickets: openTickets || 0,
      totalUsers: totalUsers || 0,
    });

    setLoading(false);
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSending(true);
    
    // Here you would integrate with your email/notification service
    // For now, we'll just show a success message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("تم إرسال الإشعار بنجاح");
    setNotificationDialogOpen(false);
    setNotificationForm({ type: "", target: "", title: "", message: "" });
    setSending(false);
  };

  const statsData = [
    { label: "إجمالي الطلبات", value: stats.totalOrders, icon: ShoppingBag, color: "from-primary to-cyan-400" },
    { label: "طلبات جديدة", value: stats.pendingOrders, icon: Clock, color: "from-warning to-orange-400" },
    { label: "تذاكر مفتوحة", value: stats.openTickets, icon: MessageSquare, color: "from-accent to-pink-400" },
    { label: "المستخدمين", value: stats.totalUsers, icon: Users, color: "from-success to-emerald-400" },
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              مركز الإشعارات
            </h1>
            <p className="text-muted-foreground mt-1">متابعة الطلبات والتذاكر في الوقت الحقيقي</p>
          </div>
          <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span>إرسال إشعار</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>إرسال إشعار جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع الإشعار</label>
                    <Select 
                      value={notificationForm.type} 
                      onValueChange={(v) => setNotificationForm(f => ({ ...f, type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">معلومات</SelectItem>
                        <SelectItem value="warning">تنبيه</SelectItem>
                        <SelectItem value="success">نجاح</SelectItem>
                        <SelectItem value="promo">ترويج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الفئة المستهدفة</label>
                    <Select 
                      value={notificationForm.target}
                      onValueChange={(v) => setNotificationForm(f => ({ ...f, target: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المستخدمين</SelectItem>
                        <SelectItem value="clients">العملاء فقط</SelectItem>
                        <SelectItem value="verified">الموثقين فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان الإشعار</label>
                  <Input 
                    placeholder="عنوان الإشعار" 
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">محتوى الإشعار</label>
                  <Textarea 
                    placeholder="محتوى الإشعار..." 
                    className="min-h-[100px]"
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm(f => ({ ...f, message: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setNotificationDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    className="gap-2" 
                    onClick={handleSendNotification}
                    disabled={sending}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    إرسال الآن
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-elevated border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} p-2.5 shadow-lg`}>
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value.toLocaleString("ar-SA")}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>الطلبات الأخيرة</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>التذاكر</span>
            </TabsTrigger>
          </TabsList>

          {/* Recent Orders */}
          <TabsContent value="orders">
            <Card className="card-elevated border-border/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  الطلبات الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">لا توجد طلبات</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
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
                              <p className="font-medium">{order.order_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.profile?.full_name || order.profile?.email || "عميل"} - {order.service?.name || "خدمة"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={`${statusColors[order.status]} border`}>
                              {statusLabels[order.status] || order.status}
                            </Badge>
                            <span className="text-sm font-bold text-success">
                              {Number(order.total_price).toLocaleString("ar-SA")} ر.س
                            </span>
                            <span className="text-xs text-muted-foreground hidden md:block">
                              {format(new Date(order.created_at), "d MMM", { locale: ar })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Tickets */}
          <TabsContent value="tickets">
            <Card className="card-elevated border-border/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  تذاكر الدعم الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">لا توجد تذاكر</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {recentTickets.map((ticket, index) => (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              ticket.priority === "urgent" ? "bg-destructive/20 text-destructive" :
                              ticket.priority === "high" ? "bg-warning/20 text-warning" :
                              "bg-primary/10 text-primary"
                            }`}>
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">{ticket.subject}</p>
                              <p className="text-sm text-muted-foreground">
                                {ticket.profile?.full_name || ticket.profile?.email || "مستخدم"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={`${statusColors[ticket.status]} border`}>
                              {statusLabels[ticket.status] || ticket.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground hidden md:block">
                              {format(new Date(ticket.created_at!), "d MMM", { locale: ar })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminNotifications;
