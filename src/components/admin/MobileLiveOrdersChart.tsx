import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  ShoppingCart, 
  Clock, 
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

interface LiveOrder {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  created_at: string;
}

const MobileLiveOrdersChart = () => {
  const [recentOrders, setRecentOrders] = useState<LiveOrder[]>([]);
  const [todayStats, setTodayStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    revenue: 0,
  });
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchTodayOrders = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, status, total_price, created_at")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (orders) {
      const total = orders.length;
      const pending = orders.filter(o => o.status === "pending").length;
      const completed = orders.filter(o => o.status === "completed").length;
      const revenue = orders.reduce((sum, o) => sum + Number(o.total_price), 0);

      setTodayStats({ total, pending, completed, revenue });
      setRecentOrders(orders.slice(0, 4));
      setLastUpdate(new Date());
    }
  }, []);

  useEffect(() => {
    fetchTodayOrders();

    const channel = supabase
      .channel("mobile-live-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchTodayOrders();
          setIsLive(true);
        }
      )
      .subscribe();

    const interval = setInterval(fetchTodayOrders, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchTodayOrders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3 text-success" />;
      case "pending":
        return <Clock className="w-3 h-3 text-warning" />;
      case "cancelled":
        return <XCircle className="w-3 h-3 text-destructive" />;
      default:
        return <Activity className="w-3 h-3 text-primary" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "مكتمل";
      case "pending": return "قيد الانتظار";
      case "in_progress": return "قيد التنفيذ";
      case "cancelled": return "ملغي";
      default: return status;
    }
  };

  const completionRate = todayStats.total > 0 
    ? Math.round((todayStats.completed / todayStats.total) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg sm:rounded-xl border border-border/40 p-2 sm:p-3 overflow-hidden relative"
      dir="rtl"
    >
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 flex-row-reverse">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-row-reverse">
            <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-semibold">الطلبات المباشرة</span>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground">
                آخر تحديث: {format(lastUpdate, "HH:mm", { locale: ar })}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ scale: isLive ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 2, repeat: isLive ? Infinity : 0 }}
            className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded-full bg-success/10 border border-success/20 flex-row-reverse"
          >
            <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-success" />
            <span className="text-[8px] sm:text-[9px] text-success font-medium">مباشر</span>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mb-2 sm:mb-3">
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="p-1 sm:p-1.5 rounded-lg bg-secondary/40 text-center border border-border/20"
          >
            <p className="text-sm sm:text-base font-bold">{todayStats.total.toLocaleString('ar-SA')}</p>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground">إجمالي</p>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="p-1 sm:p-1.5 rounded-lg bg-warning/10 text-center border border-warning/20"
          >
            <p className="text-sm sm:text-base font-bold text-warning">{todayStats.pending.toLocaleString('ar-SA')}</p>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground">معلق</p>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="p-1 sm:p-1.5 rounded-lg bg-success/10 text-center border border-success/20"
          >
            <p className="text-sm sm:text-base font-bold text-success">{todayStats.completed.toLocaleString('ar-SA')}</p>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground">مكتمل</p>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="p-1 sm:p-1.5 rounded-lg bg-primary/10 text-center border border-primary/20"
          >
            <p className="text-[10px] sm:text-xs font-bold text-primary">{todayStats.revenue.toLocaleString('ar-SA')}</p>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground">ر.س</p>
          </motion.div>
        </div>

        {/* Completion Progress */}
        <div className="mb-3 p-2 rounded-lg bg-secondary/30 border border-border/20">
          <div className="flex items-center justify-between mb-1.5 flex-row-reverse">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 flex-row-reverse">
              <TrendingUp className="w-3 h-3" />
              معدل الإكمال اليوم
            </span>
            <span className="text-xs font-semibold">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-1.5" />
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-row-reverse">
            <span className="text-[10px] font-medium flex items-center gap-1 flex-row-reverse">
              <Package className="w-3 h-3" />
              آخر الطلبات اليوم
            </span>
            <Badge variant="secondary" className="text-[9px] h-4 px-1">
              {recentOrders.length}
            </Badge>
          </div>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ delay: index * 0.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/10 cursor-pointer hover:bg-secondary/40 transition-colors flex-row-reverse"
                >
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    {getStatusIcon(order.status)}
                    <span className="text-[10px] font-medium">{order.order_number}</span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1">
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {Number(order.total_price).toLocaleString('ar-SA')} ر.س
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {recentOrders.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <ShoppingCart className="w-6 h-6 mx-auto mb-1 opacity-30" />
                <p className="text-[10px]">لا توجد طلبات اليوم</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileLiveOrdersChart;
