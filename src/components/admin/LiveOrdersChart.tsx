import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  CheckCircle,
  XCircle,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OrderPoint {
  time: string;
  orders: number;
  timestamp: Date;
}

interface LiveOrder {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  created_at: string;
}

const LiveOrdersChart = () => {
  const [chartData, setChartData] = useState<OrderPoint[]>([]);
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
      .order("created_at", { ascending: true });

    if (orders) {
      // Calculate stats
      const total = orders.length;
      const pending = orders.filter(o => o.status === "pending").length;
      const completed = orders.filter(o => o.status === "completed").length;
      const revenue = orders.reduce((sum, o) => sum + Number(o.total_price), 0);

      setTodayStats({ total, pending, completed, revenue });

      // Build hourly chart data
      const hourlyData: { [key: string]: number } = {};
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, "0");
        hourlyData[hour] = 0;
      }

      orders.forEach(order => {
        const hour = new Date(order.created_at).getHours().toString().padStart(2, "0");
        hourlyData[hour]++;
      });

      const chartPoints: OrderPoint[] = Object.entries(hourlyData).map(([hour, count]) => ({
        time: `${hour}:00`,
        orders: count,
        timestamp: new Date(),
      }));

      setChartData(chartPoints);
      setRecentOrders(orders.slice(-5).reverse());
      setLastUpdate(new Date());
    }
  }, []);

  useEffect(() => {
    fetchTodayOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel("live-orders-chart")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Real-time order update:", payload);
          fetchTodayOrders();
          setIsLive(true);
        }
      )
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTodayOrders();
    }, 30000);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success border-success/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{payload[0].value} طلب</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            الطلبات المباشرة
          </CardTitle>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: isLive ? [1, 0.5, 1] : 1 }}
              transition={{ duration: 1.5, repeat: isLive ? Infinity : 0 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/20"
            >
              <Zap className="w-3 h-3 text-success" />
              <span className="text-[10px] text-success font-medium">مباشر</span>
            </motion.div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          آخر تحديث: {format(lastUpdate, "HH:mm:ss", { locale: ar })}
        </p>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 rounded-lg bg-secondary/40 text-center"
          >
            <p className="text-lg sm:text-xl font-bold">{todayStats.total}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-2 rounded-lg bg-warning/10 text-center"
          >
            <p className="text-lg sm:text-xl font-bold text-warning">{todayStats.pending}</p>
            <p className="text-[10px] text-muted-foreground">معلق</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-2 rounded-lg bg-success/10 text-center"
          >
            <p className="text-lg sm:text-xl font-bold text-success">{todayStats.completed}</p>
            <p className="text-[10px] text-muted-foreground">مكتمل</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-2 rounded-lg bg-primary/10 text-center"
          >
            <p className="text-sm sm:text-base font-bold text-primary">
              {todayStats.revenue.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">ر.س</p>
          </motion.div>
        </div>

        {/* Chart */}
        <div className="h-[160px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorOrders)"
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" />
              آخر الطلبات
            </span>
            <Badge variant="outline" className="text-[10px] h-5">
              {recentOrders.length}
            </Badge>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/20"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="text-xs font-medium">{order.order_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {Number(order.total_price).toLocaleString()} ر.س
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-[9px] h-4 px-1.5", getStatusColor(order.status))}
                    >
                      {order.status === "pending" ? "معلق" : 
                       order.status === "completed" ? "مكتمل" : 
                       order.status === "cancelled" ? "ملغي" : order.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {recentOrders.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <ShoppingCart className="w-6 h-6 mx-auto mb-1 opacity-30" />
                <p className="text-xs">لا توجد طلبات اليوم</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveOrdersChart;
