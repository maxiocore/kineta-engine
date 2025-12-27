import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  CheckCircle,
  XCircle,
  Zap,
  ArrowLeft,
  Package,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const fetchTodayOrders = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, status, total_price, created_at")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: true });

    if (orders) {
      const total = orders.length;
      const pending = orders.filter(o => o.status === "pending").length;
      const completed = orders.filter(o => o.status === "completed").length;
      const revenue = orders.reduce((sum, o) => sum + Number(o.total_price), 0);

      setTodayStats({ total, pending, completed, revenue });

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

    const channel = supabase
      .channel("live-orders-chart")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchTodayOrders();
          setIsLive(true);
        }
      )
      .subscribe();

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
        return <CheckCircle className="w-3.5 h-3.5 text-success" />;
      case "pending":
        return <Clock className="w-3.5 h-3.5 text-warning" />;
      case "cancelled":
        return <XCircle className="w-3.5 h-3.5 text-destructive" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-primary" />;
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "معلق";
      case "completed": return "مكتمل";
      case "cancelled": return "ملغي";
      case "in_progress": return "قيد التنفيذ";
      case "processing": return "قيد المعالجة";
      default: return status;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-semibold">{payload[0].value} طلب</p>
        </div>
      );
    }
    return null;
  };

  const statsCards = [
    { label: "إجمالي", value: todayStats.total, color: "bg-secondary/50", textColor: "" },
    { label: "معلق", value: todayStats.pending, color: "bg-warning/10", textColor: "text-warning" },
    { label: "مكتمل", value: todayStats.completed, color: "bg-success/10", textColor: "text-success" },
    { label: "الإيرادات", value: `${todayStats.revenue.toLocaleString()} ر.س`, color: "bg-primary/10", textColor: "text-primary", isRevenue: true },
  ];

  return (
    <Card className="border-border/50 overflow-hidden bg-gradient-to-bl from-card to-card/80 relative" dir="rtl">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-2xl" />

      <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <motion.div 
              className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </motion.div>
            <span>الطلبات المباشرة اليوم</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: isLive ? [1, 0.5, 1] : 1 }}
              transition={{ duration: 1.5, repeat: isLive ? Infinity : 0 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20"
            >
              <Zap className="w-3 h-3 text-success" />
              <span className="text-[10px] text-success font-medium">مباشر</span>
            </motion.div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={() => navigate("/admin/orders")}
            >
              <span className="hidden sm:inline">عرض الكل</span>
              <ArrowLeft className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          آخر تحديث: {format(lastUpdate, "hh:mm:ss a", { locale: ar })}
        </p>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={cn(
                "p-3 rounded-xl text-center transition-all cursor-pointer",
                stat.color
              )}
            >
              <p className={cn(
                "text-lg sm:text-xl lg:text-2xl font-bold",
                stat.textColor
              )}>
                {stat.isRevenue ? (
                  <span className="text-sm sm:text-base">{stat.value}</span>
                ) : stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[180px] sm:h-[220px] lg:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOrdersLive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
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
                strokeWidth={2.5}
                fill="url(#colorOrdersLive)"
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              آخر الطلبات
            </span>
            <Badge variant="outline" className="text-[10px] h-5">
              {recentOrders.length}
            </Badge>
          </div>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: -4 }}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-secondary/30 border border-border/20 hover:border-border/40 transition-all cursor-pointer group"
                  onClick={() => navigate("/admin/orders")}
                >
                  <div className="flex items-center gap-2.5">
                    {getStatusIcon(order.status)}
                    <span className="text-xs sm:text-sm font-medium">{order.order_number}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {Number(order.total_price).toLocaleString()} ر.س
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-[9px] h-5 px-2", getStatusColor(order.status))}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {recentOrders.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">لا توجد طلبات اليوم</p>
                <p className="text-[10px] mt-0.5">ستظهر الطلبات الجديدة هنا</p>
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveOrdersChart;
