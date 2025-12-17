import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingBag, MessageSquare, Clock, CheckCircle, Loader2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "order" | "ticket" | "info";
  status?: string;
}

const getTypeStyles = (type: string) => {
  switch (type) {
    case "order": return "bg-primary/10 border-primary/20";
    case "ticket": return "bg-accent/10 border-accent/20";
    case "info": return "bg-success/10 border-success/20";
    default: return "bg-muted border-border";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "order": return ShoppingBag;
    case "ticket": return MessageSquare;
    default: return Bell;
  }
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "تم تأكيد الطلب",
  in_progress: "قيد التنفيذ",
  completed: "تم الاكتمال",
  cancelled: "ملغي",
  open: "تذكرة مفتوحة",
  resolved: "تم الحل",
};

const ClientNotifications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Real-time subscriptions
      const ordersChannel = supabase
        .channel("client-notifications-orders")
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "orders",
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      const ticketsChannel = supabase
        .channel("client-notifications-tickets")
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "support_tickets",
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(ticketsChannel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    const notificationsList: Notification[] = [];

    // Fetch recent orders
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, created_at, updated_at,
        service:services(name)
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    orders?.forEach(order => {
      const service = order.service as { name: string } | null;
      notificationsList.push({
        id: `order-${order.id}`,
        title: `طلب ${order.order_number}`,
        message: `${statusLabels[order.status] || order.status} - ${service?.name || "خدمة"}`,
        time: formatDistanceToNow(new Date(order.updated_at), { addSuffix: true, locale: ar }),
        type: "order",
        status: order.status,
      });
    });

    // Fetch recent tickets
    const { data: tickets } = await supabase
      .from("support_tickets")
      .select("id, subject, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    tickets?.forEach(ticket => {
      notificationsList.push({
        id: `ticket-${ticket.id}`,
        title: ticket.subject,
        message: statusLabels[ticket.status] || ticket.status,
        time: formatDistanceToNow(new Date(ticket.updated_at!), { addSuffix: true, locale: ar }),
        type: "ticket",
        status: ticket.status,
      });
    });

    // Sort by time
    notificationsList.sort((a, b) => {
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    setNotifications(notificationsList);
    setLoading(false);
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3"
          >
            <Bell className="w-8 h-8 text-primary" />
            الإشعارات
          </motion.h1>
          <p className="text-muted-foreground">تابع جميع التحديثات على طلباتك وتذاكرك</p>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="card-elevated border-border/30">
            <CardContent className="py-16">
              <div className="text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground text-lg">لا توجد إشعارات</p>
                <p className="text-sm text-muted-foreground mt-2">ستظهر هنا جميع التحديثات على طلباتك وتذاكرك</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const Icon = getTypeIcon(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`card-elevated border ${getTypeStyles(notification.type)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            notification.type === "order" ? "bg-primary/10" : 
                            notification.type === "ticket" ? "bg-accent/10" : "bg-success/10"
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              notification.type === "order" ? "text-primary" : 
                              notification.type === "ticket" ? "text-accent" : "text-success"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-medium">{notification.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              </div>
                              {notification.status && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                  notification.status === "completed" || notification.status === "resolved" 
                                    ? "bg-success/10 text-success" 
                                    : notification.status === "in_progress" || notification.status === "open"
                                    ? "bg-warning/10 text-warning"
                                    : notification.status === "cancelled"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-primary/10 text-primary"
                                }`}>
                                  {notification.status === "completed" && <CheckCircle className="w-3 h-3 inline ml-1" />}
                                  {notification.status === "in_progress" && <Clock className="w-3 h-3 inline ml-1" />}
                                  {statusLabels[notification.status] || notification.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientNotifications;
