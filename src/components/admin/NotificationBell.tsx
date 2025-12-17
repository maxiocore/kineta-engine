import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, CheckCheck } from "lucide-react";
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
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Notification {
  id: string;
  type: "order" | "user" | "ticket" | "system";
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Subscribe to real-time notifications
    const ordersChannel = supabase
      .channel("notifications-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        addNotification({
          type: "order",
          title: "طلب جديد",
          message: `تم استلام طلب جديد رقم ${(payload.new as any).order_number}`,
        });
      })
      .subscribe();

    const usersChannel = supabase
      .channel("notifications-users")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
        addNotification({
          type: "user",
          title: "مستخدم جديد",
          message: `انضم مستخدم جديد: ${(payload.new as any).full_name || (payload.new as any).email || "مستخدم"}`,
        });
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel("notifications-tickets")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_tickets" }, (payload) => {
        addNotification({
          type: "ticket",
          title: "تذكرة دعم جديدة",
          message: `تذكرة جديدة: ${(payload.new as any).subject}`,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(ticketsChannel);
    };
  }, []);

  const addNotification = (data: Omit<Notification, "id" | "time" | "read">) => {
    const newNotification: Notification = {
      ...data,
      id: crypto.randomUUID(),
      time: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
    
    // Play notification sound (optional)
    // const audio = new Audio('/notification.mp3');
    // audio.volume = 0.3;
    // audio.play().catch(() => {});
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "order": return "bg-success/10 text-success";
      case "user": return "bg-primary/10 text-primary";
      case "ticket": return "bg-warning/10 text-warning";
      default: return "bg-secondary text-muted-foreground";
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
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">الإشعارات</h4>
            <div className="flex gap-1">
              {notifications.length > 0 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="w-3 h-3 ml-1" />
                    قراءة الكل
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={clearAll}
                  >
                    <X className="w-3 h-3 ml-1" />
                    مسح
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
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
                      "p-3 hover:bg-secondary/50 cursor-pointer transition-colors",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                        getTypeColor(notification.type)
                      )}>
                        {notification.type === "order" ? "📦" : 
                         notification.type === "user" ? "👤" : 
                         notification.type === "ticket" ? "🎫" : "🔔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(notification.time, "HH:mm", { locale: ar })}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
