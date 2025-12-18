import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingBag, MessageSquare, Clock, CheckCircle, Loader2, AlertCircle, Info, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_order_id: string | null;
  created_at: string;
}

const getTypeStyles = (type: string, isRead: boolean) => {
  const opacity = isRead ? "opacity-60" : "";
  switch (type) {
    case "success": return `bg-success/10 border-success/20 ${opacity}`;
    case "error": return `bg-destructive/10 border-destructive/20 ${opacity}`;
    case "warning": return `bg-warning/10 border-warning/20 ${opacity}`;
    default: return `bg-primary/10 border-primary/20 ${opacity}`;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "success": return CheckCircle;
    case "error": return AlertCircle;
    case "warning": return AlertCircle;
    default: return Info;
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case "success": return "text-success";
    case "error": return "text-destructive";
    case "warning": return "text-warning";
    default: return "text-primary";
  }
};

const ClientNotifications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Real-time subscription for notifications
      const channel = supabase
        .channel("client-notifications")
        .on("postgres_changes", { 
          event: "*", 
          schema: "public", 
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            toast.info("إشعار جديد", {
              description: (payload.new as Notification).message,
            });
          } else if (payload.eventType === "UPDATE") {
            setNotifications(prev => 
              prev.map(n => n.id === (payload.new as Notification).id ? payload.new as Notification : n)
            );
          } else if (payload.eventType === "DELETE") {
            setNotifications(prev => prev.filter(n => n.id !== (payload.old as Notification).id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setMarkingAll(true);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("تم تعليم جميع الإشعارات كمقروءة");
    }
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3"
            >
              <Bell className="w-8 h-8 text-primary" />
              الإشعارات
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-sm px-2.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </motion.h1>
            <p className="text-muted-foreground">تابع جميع التحديثات على طلباتك</p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="gap-2"
            >
              {markingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="card-elevated border-border/30">
            <CardContent className="py-16">
              <div className="text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground text-lg">لا توجد إشعارات</p>
                <p className="text-sm text-muted-foreground mt-2">ستظهر هنا جميع التحديثات على طلباتك</p>
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
                    transition={{ delay: index * 0.03 }}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                    className="cursor-pointer"
                  >
                    <Card className={`card-elevated border transition-all hover:scale-[1.01] ${getTypeStyles(notification.type, notification.is_read)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            notification.type === "success" ? "bg-success/20" : 
                            notification.type === "error" ? "bg-destructive/20" :
                            notification.type === "warning" ? "bg-warning/20" : "bg-primary/20"
                          }`}>
                            <Icon className={`w-5 h-5 ${getIconColor(notification.type)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-medium ${notification.is_read ? "text-muted-foreground" : ""}`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                  )}
                                </div>
                                <p className={`text-sm mt-1 ${notification.is_read ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
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
