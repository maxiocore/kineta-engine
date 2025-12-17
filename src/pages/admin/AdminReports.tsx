import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Download, Calendar, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  refunded: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface ServiceStats {
  id: string;
  name: string;
  orders: number;
  revenue: number;
}

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("6");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    refunded: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topServices, setTopServices] = useState<ServiceStats[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<{status: string; count: number; percentage: number}[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const months = parseInt(dateRange);
    const startDate = startOfMonth(subMonths(new Date(), months - 1));

    // Fetch orders with services
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        service:services(id, name)
      `)
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
      return;
    }

    // Calculate order stats
    const stats: OrderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      in_progress: orders.filter(o => o.status === 'in_progress').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      refunded: orders.filter(o => o.status === 'refunded').length
    };
    setOrderStats(stats);

    // Calculate total revenue (completed orders only)
    const revenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.total_price), 0);
    setTotalRevenue(revenue);

    // Calculate monthly data
    const monthlyMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(new Date(), months - 1 - i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthName = format(monthDate, 'MMMM', { locale: ar });
      monthlyMap.set(monthKey, { revenue: 0, orders: 0 });
    }

    orders.forEach(order => {
      const monthKey = format(new Date(order.created_at), 'yyyy-MM');
      if (monthlyMap.has(monthKey)) {
        const current = monthlyMap.get(monthKey)!;
        current.orders += 1;
        if (order.status === 'completed') {
          current.revenue += Number(order.total_price);
        }
      }
    });

    const monthlyDataArr: MonthlyData[] = [];
    monthlyMap.forEach((value, key) => {
      const monthDate = new Date(key + '-01');
      monthlyDataArr.push({
        month: format(monthDate, 'MMMM', { locale: ar }),
        revenue: value.revenue,
        orders: value.orders
      });
    });
    setMonthlyData(monthlyDataArr);

    // Calculate top services
    const serviceMap = new Map<string, ServiceStats>();
    orders.forEach(order => {
      if (order.service) {
        const serviceId = order.service.id;
        if (!serviceMap.has(serviceId)) {
          serviceMap.set(serviceId, {
            id: serviceId,
            name: order.service.name,
            orders: 0,
            revenue: 0
          });
        }
        const current = serviceMap.get(serviceId)!;
        current.orders += 1;
        if (order.status === 'completed') {
          current.revenue += Number(order.total_price);
        }
      }
    });

    const servicesArr = Array.from(serviceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    setTopServices(servicesArr);

    // Calculate status distribution
    const statusMap: Record<string, { label: string; count: number }> = {
      pending: { label: 'قيد الانتظار', count: stats.pending },
      confirmed: { label: 'مؤكد', count: stats.confirmed },
      in_progress: { label: 'قيد التنفيذ', count: stats.in_progress },
      completed: { label: 'مكتمل', count: stats.completed },
      cancelled: { label: 'ملغي', count: stats.cancelled },
      refunded: { label: 'مسترد', count: stats.refunded }
    };

    const distribution = Object.entries(statusMap)
      .filter(([_, value]) => value.count > 0)
      .map(([status, value]) => ({
        status: value.label,
        count: value.count,
        percentage: stats.total > 0 ? Math.round((value.count / stats.total) * 100) : 0
      }));
    setStatusDistribution(distribution);

    setLoading(false);
  };

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);
  const maxOrders = Math.max(...topServices.map(s => s.orders), 1);

  const statusColors: Record<string, string> = {
    'قيد الانتظار': 'bg-warning',
    'مؤكد': 'bg-primary',
    'قيد التنفيذ': 'bg-accent',
    'مكتمل': 'bg-success',
    'ملغي': 'bg-destructive',
    'مسترد': 'bg-muted-foreground'
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold mb-2"
            >
              التقارير والإحصائيات
            </motion.h1>
            <p className="text-muted-foreground">تحليل شامل لأداء المنصة</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">آخر 3 أشهر</SelectItem>
                <SelectItem value="6">آخر 6 أشهر</SelectItem>
                <SelectItem value="12">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground gap-2">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: "إجمالي الإيرادات", 
                  value: `${totalRevenue.toLocaleString('ar-SA')} ر.س`, 
                  icon: DollarSign, 
                  color: "from-success to-emerald-400" 
                },
                { 
                  title: "إجمالي الطلبات", 
                  value: orderStats.total.toString(), 
                  icon: ShoppingBag, 
                  color: "from-primary to-cyan-400" 
                },
                { 
                  title: "الطلبات المكتملة", 
                  value: orderStats.completed.toString(), 
                  icon: CheckCircle, 
                  color: "from-accent to-pink-400" 
                },
                { 
                  title: "قيد التنفيذ", 
                  value: (orderStats.pending + orderStats.confirmed + orderStats.in_progress).toString(), 
                  icon: Clock, 
                  color: "from-warning to-orange-400" 
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} p-3`}>
                          <stat.icon className="w-full h-full text-primary-foreground" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold font-display mb-1">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    الإيرادات الشهرية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">لا توجد بيانات للفترة المحددة</p>
                  ) : (
                    <div className="space-y-4">
                      {monthlyData.map((data, index) => (
                        <div key={data.month} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{data.month}</span>
                            <div className="flex gap-4">
                              <span className="text-muted-foreground">{data.orders} طلب</span>
                              <span className="text-success font-medium">{data.revenue.toLocaleString('ar-SA')} ر.س</span>
                            </div>
                          </div>
                          <div className="h-3 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                              className="h-full bg-gradient-to-l from-destructive to-orange-500 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Additional Stats */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Services */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="glass border-border/50 h-full">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      أفضل الخدمات أداءً
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topServices.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد خدمات بعد</p>
                    ) : (
                      <div className="space-y-4">
                        {topServices.map((service, index) => (
                          <div key={service.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{service.name}</span>
                              <div className="flex gap-4">
                                <span className="text-muted-foreground">{service.orders} طلب</span>
                                <span className="text-success font-medium">{service.revenue.toLocaleString('ar-SA')} ر.س</span>
                              </div>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(service.orders / maxOrders) * 100}%` }}
                                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                                className="h-full bg-gradient-primary rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Status Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="glass border-border/50 h-full">
                  <CardHeader>
                    <CardTitle className="font-display">توزيع حالات الطلبات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statusDistribution.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد طلبات بعد</p>
                    ) : (
                      <div className="space-y-4">
                        {statusDistribution.map((item, index) => (
                          <div key={item.status} className="flex items-center gap-4">
                            <div className={`w-4 h-4 rounded-full ${statusColors[item.status] || 'bg-muted'}`} />
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">{item.status}</span>
                                <span className="text-sm font-medium">{item.count} ({item.percentage}%)</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.percentage}%` }}
                                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                                  className={`h-full rounded-full ${statusColors[item.status] || 'bg-muted'}`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Orders Summary Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="font-display">ملخص الطلبات حسب الحالة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { label: 'قيد الانتظار', count: orderStats.pending, color: 'bg-warning/10 text-warning border-warning/20' },
                      { label: 'مؤكد', count: orderStats.confirmed, color: 'bg-primary/10 text-primary border-primary/20' },
                      { label: 'قيد التنفيذ', count: orderStats.in_progress, color: 'bg-accent/10 text-accent border-accent/20' },
                      { label: 'مكتمل', count: orderStats.completed, color: 'bg-success/10 text-success border-success/20' },
                      { label: 'ملغي', count: orderStats.cancelled, color: 'bg-destructive/10 text-destructive border-destructive/20' },
                      { label: 'مسترد', count: orderStats.refunded, color: 'bg-muted text-muted-foreground border-border' },
                    ].map((item) => (
                      <div key={item.label} className={`p-4 rounded-xl border ${item.color} text-center`}>
                        <p className="text-2xl font-bold font-display mb-1">{item.count}</p>
                        <p className="text-xs">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminReports;
