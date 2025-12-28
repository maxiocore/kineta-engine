import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Info, 
  CheckCheck, 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink,
  ShoppingBag,
  Gift,
  CreditCard,
  X,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow, isToday, isYesterday, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_order_id: string | null;
  created_at: string;
}

type FilterType = "all" | "success" | "error" | "warning" | "info";
type FilterStatus = "all" | "read" | "unread";

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
    case "order": return ShoppingBag;
    case "reward": return Gift;
    case "payment": return CreditCard;
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

const getTypeLabel = (type: string) => {
  switch (type) {
    case "success": return "نجاح";
    case "error": return "خطأ";
    case "warning": return "تنبيه";
    case "order": return "طلب";
    case "reward": return "مكافأة";
    case "payment": return "دفع";
    default: return "معلومات";
  }
};

const getDateGroupLabel = (date: Date) => {
  if (isToday(date)) return "اليوم";
  if (isYesterday(date)) return "أمس";
  return format(date, "EEEE، d MMMM yyyy", { locale: ar });
};

const ClientNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();

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
            // Play notification sound
            try {
              const audio = new Audio("/notification.mp3");
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
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
      .limit(100);

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

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("تم حذف الإشعار");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeletingSelected(true);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", Array.from(selectedIds));

    if (!error) {
      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
      toast.success(`تم حذف ${selectedIds.size} إشعار`);
    }
    setDeletingSelected(false);
  };

  const deleteAllRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("is_read", true);

    if (!error) {
      setNotifications(prev => prev.filter(n => !n.is_read));
      toast.success("تم حذف جميع الإشعارات المقروءة");
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!n.title.toLowerCase().includes(query) && !n.message.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Type filter
      if (filterType !== "all" && n.type !== filterType) {
        return false;
      }

      // Status filter
      if (filterStatus === "read" && !n.is_read) return false;
      if (filterStatus === "unread" && n.is_read) return false;

      return true;
    });
  }, [notifications, searchQuery, filterType, filterStatus]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { date: Date; notifications: Notification[] }[] = [];
    
    filteredNotifications.forEach(notification => {
      const notificationDate = startOfDay(new Date(notification.created_at));
      const existingGroup = groups.find(g => g.date.getTime() === notificationDate.getTime());
      
      if (existingGroup) {
        existingGroup.notifications.push(notification);
      } else {
        groups.push({
          date: notificationDate,
          notifications: [notification]
        });
      }
    });

    return groups.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredNotifications]);

  // Statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const success = notifications.filter(n => n.type === "success").length;
    const errors = notifications.filter(n => n.type === "error").length;
    const warnings = notifications.filter(n => n.type === "warning").length;
    return { total, unread, success, errors, warnings };
  }, [notifications]);

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
      <div className="space-y-4 md:space-y-6 px-1" dir="rtl">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-3xl font-bold mb-1 md:mb-2 flex items-center gap-2 md:gap-3"
            >
              <Bell className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              الإشعارات
              {stats.unread > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs md:text-sm px-2 md:px-2.5 py-0.5 rounded-full">
                  {stats.unread}
                </span>
              )}
            </motion.h1>
            <p className="text-xs md:text-base text-muted-foreground">تابع جميع التحديثات على طلباتك</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {stats.unread > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                disabled={markingAll}
                className="gap-2 h-9 text-sm"
                size="sm"
              >
                {markingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                تعليم الكل كمقروء
              </Button>
            )}
            
            <Button
              variant={selectMode ? "default" : "outline"}
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedIds(new Set());
              }}
              className="gap-2 h-9 text-sm"
              size="sm"
            >
              {selectMode ? <X className="w-3.5 h-3.5" /> : <Checkbox className="w-3.5 h-3.5" />}
              {selectMode ? "إلغاء التحديد" : "تحديد"}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="card-elevated border-border/30">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">الكل</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated border-border/30">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-xs text-muted-foreground">غير مقروء</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated border-border/30">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.success}</p>
                <p className="text-xs text-muted-foreground">نجاح</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated border-border/30">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.warnings}</p>
                <p className="text-xs text-muted-foreground">تنبيهات</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated border-border/30 col-span-2 md:col-span-1">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.errors}</p>
                <p className="text-xs text-muted-foreground">أخطاء</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="card-elevated border-border/30">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الإشعارات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Type Filter */}
              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="success">نجاح</SelectItem>
                  <SelectItem value="error">خطأ</SelectItem>
                  <SelectItem value="warning">تنبيه</SelectItem>
                  <SelectItem value="info">معلومات</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="unread">غير مقروء</SelectItem>
                  <SelectItem value="read">مقروء</SelectItem>
                </SelectContent>
              </Select>

              {/* Delete Read Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف الإشعارات المقروءة</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف جميع الإشعارات المقروءة نهائياً. هل أنت متأكد؟
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAllRead} className="bg-destructive hover:bg-destructive/90">
                      حذف
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Selection Actions Bar */}
        {selectMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="card-elevated border-primary/30 bg-primary/5">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selectedIds.size} محدد
                  </span>
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    تحديد الكل
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    إلغاء التحديد
                  </Button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      disabled={selectedIds.size === 0 || deletingSelected}
                      className="gap-2"
                    >
                      {deletingSelected ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      حذف المحدد
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف الإشعارات المحددة</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيتم حذف {selectedIds.size} إشعار نهائياً. هل أنت متأكد؟
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteSelected} className="bg-destructive hover:bg-destructive/90">
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card className="card-elevated border-border/30">
            <CardContent className="py-16">
              <div className="text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterType !== "all" || filterStatus !== "all" 
                    ? "لا توجد نتائج مطابقة" 
                    : "لا توجد إشعارات"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery || filterType !== "all" || filterStatus !== "all" 
                    ? "جرب تغيير معايير البحث" 
                    : "ستظهر هنا جميع التحديثات على طلباتك"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {groupedNotifications.map((group) => (
                <motion.div
                  key={group.date.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {/* Date Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {getDateGroupLabel(group.date)}
                    </div>
                    <div className="flex-1 h-px bg-border/50" />
                    <Badge variant="secondary" className="text-xs">
                      {group.notifications.length}
                    </Badge>
                  </div>

                  {/* Notifications */}
                  {group.notifications.map((notification, index) => {
                    const Icon = getTypeIcon(notification.type);
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className={`card-elevated border transition-all hover:scale-[1.01] ${getTypeStyles(notification.type, notification.is_read)}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Selection Checkbox */}
                              {selectMode && (
                                <Checkbox
                                  checked={selectedIds.has(notification.id)}
                                  onCheckedChange={() => toggleSelect(notification.id)}
                                  className="mt-1"
                                />
                              )}

                              {/* Icon */}
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                notification.type === "success" ? "bg-success/20" : 
                                notification.type === "error" ? "bg-destructive/20" :
                                notification.type === "warning" ? "bg-warning/20" : "bg-primary/20"
                              }`}>
                                <Icon className={`w-5 h-5 ${getIconColor(notification.type)}`} />
                              </div>

                              {/* Content */}
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className={`font-medium ${notification.is_read ? "text-muted-foreground" : ""}`}>
                                        {notification.title}
                                      </h4>
                                      {!notification.is_read && (
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {getTypeLabel(notification.type)}
                                      </Badge>
                                    </div>
                                    <p className={`text-sm mt-1 ${notification.is_read ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                                      {notification.message}
                                    </p>
                                  </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-3">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
                                  </p>
                                  
                                  <div className="flex items-center gap-2">
                                    {/* Link to Order */}
                                    {notification.related_order_id && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 gap-1 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/dashboard/orders/${notification.related_order_id}`);
                                        }}
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        عرض الطلب
                                      </Button>
                                    )}

                                    {/* Delete Button */}
                                    {!selectMode && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteNotification(notification.id);
                                        }}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientNotifications;