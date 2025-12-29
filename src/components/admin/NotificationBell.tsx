import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_order_id: string | null;
  related_user_id: string | null;
  related_ticket_id: string | null;
  metadata: any;
  created_at: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel("admin-notifications-realtime")
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "admin_notifications" 
      }, (payload) => {
        const newNotification = payload.new as AdminNotification;
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
        
        // Play notification sound
        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      })
      .on("postgres_changes", { 
        event: "UPDATE", 
        schema: "public", 
        table: "admin_notifications" 
      }, (payload) => {
        setNotifications(prev => 
          prev.map(n => n.id === (payload.new as AdminNotification).id ? payload.new as AdminNotification : n)
        );
      })
      .on("postgres_changes", { 
        event: "DELETE", 
        schema: "public", 
        table: "admin_notifications" 
      }, (payload) => {
        setNotifications(prev => prev.filter(n => n.id !== (payload.old as AdminNotification).id));
      })
      .subscribe();

    // Subscribe to orders for immediate notifications
    const ordersChannel = supabase
      .channel("admin-new-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, async (payload) => {
        const order = payload.new as any;
        // Get user info
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", order.user_id)
          .maybeSingle();
        
        // Insert admin notification
        await supabase.from("admin_notifications").insert({
          type: "order",
          title: "طلب جديد",
          message: `تم استلام طلب جديد رقم ${order.order_number} من ${profile?.full_name || profile?.email || "عميل"}`,
          related_order_id: order.id,
          related_user_id: order.user_id,
          metadata: { order_number: order.order_number, total_price: order.total_price }
        });
      })
      .subscribe();

    // Subscribe to new users
    const usersChannel = supabase
      .channel("admin-new-users")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, async (payload) => {
        const profile = payload.new as any;
        await supabase.from("admin_notifications").insert({
          type: "user",
          title: "مستخدم جديد",
          message: `انضم مستخدم جديد: ${profile.full_name || profile.email || "مستخدم"}`,
          related_user_id: profile.id,
          metadata: { email: profile.email, full_name: profile.full_name }
        });
      })
      .subscribe();

    // Subscribe to tickets
    const ticketsChannel = supabase
      .channel("admin-new-tickets")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_tickets" }, async (payload) => {
        const ticket = payload.new as any;
        await supabase.from("admin_notifications").insert({
          type: "ticket",
          title: "تذكرة دعم جديدة",
          message: `تذكرة جديدة: ${ticket.subject}`,
          related_ticket_id: ticket.id,
          related_user_id: ticket.user_id,
          metadata: { subject: ticket.subject, priority: ticket.priority }
        });
      })
      .subscribe();

    // Subscribe to deposits
    const depositsChannel = supabase
      .channel("admin-new-deposits")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "deposits" }, async (payload) => {
        const deposit = payload.new as any;
        const oldDeposit = payload.old as any;
        
        if (deposit.status === "completed" && oldDeposit.status !== "completed") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", deposit.user_id)
            .maybeSingle();
          
          await supabase.from("admin_notifications").insert({
            type: "deposit",
            title: "إيداع جديد",
            message: `تم إيداع ${deposit.amount} ر.س بنجاح من ${profile?.full_name || profile?.email || "عميل"}`,
            related_user_id: deposit.user_id,
            metadata: { amount: deposit.amount, payment_method_id: deposit.payment_method_id }
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(depositsChannel);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    const { error } = await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
    setMarkingAll(false);
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("admin_notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const clearAll = async () => {
    const { error } = await supabase
      .from("admin_notifications")
      .delete()
      .eq("is_read", true);

    if (!error) {
      setNotifications(prev => prev.filter(n => !n.is_read));
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    markAsRead(notification.id);
    
    if (notification.related_order_id) {
      navigate("/admin/orders");
    } else if (notification.related_ticket_id) {
      navigate("/admin/support");
    } else if (notification.related_user_id && notification.type === "user") {
      navigate("/admin/users");
    } else if (notification.type === "deposit") {
      navigate("/admin/financial");
    }
    
    setOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "order": return "bg-success/10 text-success";
      case "user": return "bg-primary/10 text-primary";
      case "ticket": return "bg-warning/10 text-warning";
      case "deposit": return "bg-emerald-500/10 text-emerald-500";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "order": return "📦";
      case "user": return "👤";
      case "ticket": return "🎫";
      case "deposit": return "💰";
      default: return "🔔";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
          >
            <Bell className="w-5 h-5" />
          </motion.div>
          
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -left-1"
              >
                <Badge 
                  className="h-5 min-w-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-bold"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        sideOffset={8}
        dir="rtl"
      >
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between flex-row-reverse">
            <h4 className="font-semibold">الإشعارات</h4>
            <div className="flex gap-1 flex-row-reverse">
              {notifications.length > 0 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs gap-1 flex-row-reverse"
                    onClick={markAllAsRead}
                    disabled={markingAll || unreadCount === 0}
                  >
                    {markingAll ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3 h-3" />
                    )}
                    قراءة الكل
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs text-destructive hover:text-destructive gap-1 flex-row-reverse"
                    onClick={clearAll}
                  >
                    <Trash2 className="w-3 h-3" />
                    مسح المقروء
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "p-3 hover:bg-secondary/50 cursor-pointer transition-colors group",
                      !notification.is_read && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                        getTypeColor(notification.type)
                      )}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { locale: ar, addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t border-border/50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs gap-2"
              onClick={() => {
                navigate("/admin/notifications");
                setOpen(false);
              }}
            >
              <ExternalLink className="w-3 h-3" />
              عرض كل الإشعارات
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;