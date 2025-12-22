import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  ShoppingCart, 
  Clock, 
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp
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

  const completionRate = todayStats.total > 0 
    ? Math.round((todayStats.completed / todayStats.total) * 100) 
    : 0;

  return (
    <div className="bg-card rounded-xl border border-border/40 p-3 overflow-hidden relative">
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold">الطلبات المباشرة</span>
              <p className="text-[9px] text-muted-foreground">
                {format(lastUpdate, "HH:mm", { locale: ar })}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ scale: isLive ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 2, repeat: isLive ? Infinity : 0 }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/10 border border-success/20"
          >
            <Zap className="w-2.5 h-2.5 text-success" />
            <span className="text-[9px] text-success font-medium">مباشر</span>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <div className="p-1.5 rounded-lg bg-secondary/40 text-center">
            <p className="text-base font-bold">{todayStats.total}</p>
            <p className="text-[9px] text-muted-foreground">إجمالي</p>
          </div>
          <div className="p-1.5 rounded-lg bg-warning/10 text-center">
            <p className="text-base font-bold text-warning">{todayStats.pending}</p>
            <p className="text-[9px] text-muted-foreground">معلق</p>
          </div>
          <div className="p-1.5 rounded-lg bg-success/10 text-center">
            <p className="text-base font-bold text-success">{todayStats.completed}</p>
            <p className="text-[9px] text-muted-foreground">مكتمل</p>
          </div>
          <div className="p-1.5 rounded-lg bg-primary/10 text-center">
            <p className="text-xs font-bold text-primary">{todayStats.revenue.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">ر.س</p>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="mb-3 p-2 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              معدل الإكمال
            </span>
            <span className="text-xs font-semibold">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-1.5" />
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium flex items-center gap-1">
              <ShoppingCart className="w-3 h-3" />
              آخر الطلبات
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
                  className="flex items-center justify-between p-1.5 rounded-md bg-secondary/20 border border-border/10"
                >
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(order.status)}
                    <span className="text-[10px] font-medium">{order.order_number}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {Number(order.total_price).toLocaleString()} ر.س
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {recentOrders.length === 0 && (
              <div className="text-center py-3 text-muted-foreground">
                <ShoppingCart className="w-5 h-5 mx-auto mb-1 opacity-30" />
                <p className="text-[10px]">لا توجد طلبات</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLiveOrdersChart;
