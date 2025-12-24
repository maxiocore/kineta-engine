import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Download, Calendar, Clock, CheckCircle, XCircle, Loader2, Gift, Wallet, ArrowDownCircle, ArrowUpCircle, Users, Ban, RefreshCcw, FileText } from "lucide-react";
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

interface CashbackStats {
  totalEarned: number;
  totalWithdrawn: number;
  currentBalance: number;
  usersWithCashback: number;
  transactionCount: number;
  monthlyData: { month: string; earned: number; withdrawn: number }[];
}

interface CancelledOrder {
  id: string;
  order_number: string;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  service_name: string;
  user_email: string;
}

interface DailyCancelledStats {
  date: string;
  cancelled_count: number;
  refunded_count: number;
  total_refunded_amount: number;
  orders: CancelledOrder[];
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
  const [cashbackStats, setCashbackStats] = useState<CashbackStats>({
    totalEarned: 0,
    totalWithdrawn: 0,
    currentBalance: 0,
    usersWithCashback: 0,
    transactionCount: 0,
    monthlyData: []
  });
  const [cancelledStats, setCancelledStats] = useState<{
    totalCancelled: number;
    totalRefunded: number;
    totalRefundedAmount: number;
    dailyData: DailyCancelledStats[];
  }>({
    totalCancelled: 0,
    totalRefunded: 0,
    totalRefundedAmount: 0,
    dailyData: []
  });

  useEffect(() => {
    fetchAnalytics();
    fetchCashbackAnalytics();
    fetchCancelledOrdersReport();
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

  const fetchCashbackAnalytics = async () => {
    const months = parseInt(dateRange);
    const startDate = startOfMonth(subMonths(new Date(), months - 1));

    // Fetch user cashback balances
    const { data: cashbackBalances } = await supabase
      .from('user_cashback')
      .select('*');

    // Fetch cashback transactions
    const { data: transactions } = await supabase
      .from('cashback_transactions')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (cashbackBalances && transactions) {
      const totalEarned = cashbackBalances.reduce((sum, cb) => sum + Number(cb.total_earned), 0);
      const totalWithdrawn = cashbackBalances.reduce((sum, cb) => sum + Number(cb.total_withdrawn), 0);
      const currentBalance = cashbackBalances.reduce((sum, cb) => sum + Number(cb.cashback_balance), 0);
      const usersWithCashback = cashbackBalances.filter(cb => Number(cb.cashback_balance) > 0).length;

      // Calculate monthly cashback data
      const monthlyMap = new Map<string, { earned: number; withdrawn: number }>();
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(new Date(), months - 1 - i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyMap.set(monthKey, { earned: 0, withdrawn: 0 });
      }

      transactions.forEach(tx => {
        const monthKey = format(new Date(tx.created_at), 'yyyy-MM');
        if (monthlyMap.has(monthKey)) {
          const current = monthlyMap.get(monthKey)!;
          if (tx.type === 'earned') {
            current.earned += Number(tx.amount);
          } else if (tx.type === 'withdrawn') {
            current.withdrawn += Math.abs(Number(tx.amount));
          }
        }
      });

      const monthlyDataArr: { month: string; earned: number; withdrawn: number }[] = [];
      monthlyMap.forEach((value, key) => {
        const monthDate = new Date(key + '-01');
        monthlyDataArr.push({
          month: format(monthDate, 'MMMM', { locale: ar }),
          earned: value.earned,
          withdrawn: value.withdrawn
        });
      });

      setCashbackStats({
        totalEarned,
        totalWithdrawn,
        currentBalance,
        usersWithCashback,
        transactionCount: transactions.length,
        monthlyData: monthlyDataArr
      });
    }
  };

  const fetchCancelledOrdersReport = async () => {
    const months = parseInt(dateRange);
    const startDate = startOfMonth(subMonths(new Date(), months - 1));

    // Fetch cancelled and refunded orders with service and user info
    const { data: cancelledOrders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_price,
        status,
        created_at,
        updated_at,
        service:services(name),
        user_id
      `)
      .in('status', ['cancelled', 'refunded'])
      .gte('updated_at', startDate.toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching cancelled orders:', error);
      return;
    }

    // Get user profiles for emails
    const userIds = [...new Set(cancelledOrders?.map(o => o.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

    // Process orders
    const processedOrders: CancelledOrder[] = (cancelledOrders || []).map(order => ({
      id: order.id,
      order_number: order.order_number,
      total_price: Number(order.total_price),
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      service_name: order.service?.name || 'غير معروف',
      user_email: profileMap.get(order.user_id) || 'غير معروف'
    }));

    // Group by day
    const dailyMap = new Map<string, DailyCancelledStats>();
    
    processedOrders.forEach(order => {
      const dateKey = format(new Date(order.updated_at), 'yyyy-MM-dd');
      const dateDisplay = format(new Date(order.updated_at), 'dd MMMM yyyy', { locale: ar });
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateDisplay,
          cancelled_count: 0,
          refunded_count: 0,
          total_refunded_amount: 0,
          orders: []
        });
      }
      
      const daily = dailyMap.get(dateKey)!;
      daily.orders.push(order);
      daily.total_refunded_amount += order.total_price;
      
      if (order.status === 'cancelled') {
        daily.cancelled_count += 1;
      } else if (order.status === 'refunded') {
        daily.refunded_count += 1;
      }
    });

    // Convert to array and sort by date descending
    const dailyData = Array.from(dailyMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([_, value]) => value);

    // Calculate totals
    const totalCancelled = processedOrders.filter(o => o.status === 'cancelled').length;
    const totalRefunded = processedOrders.filter(o => o.status === 'refunded').length;
    const totalRefundedAmount = processedOrders.reduce((sum, o) => sum + o.total_price, 0);

    setCancelledStats({
      totalCancelled,
      totalRefunded,
      totalRefundedAmount,
      dailyData
    });
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
      <div className="space-y-4 md:space-y-6 lg:space-y-8" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-xl sm:text-2xl lg:text-3xl font-bold mb-1"
            >
              التقارير والإحصائيات
            </motion.h1>
            <p className="text-xs sm:text-sm text-muted-foreground">تحليل شامل لأداء المنصة</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-28 sm:w-40 text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 ml-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">آخر 3 أشهر</SelectItem>
                <SelectItem value="6">آخر 6 أشهر</SelectItem>
                <SelectItem value="12">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground gap-1.5 text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تصدير</span>
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

            {/* Cashback Report Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                <Gift className="w-6 h-6 text-accent" />
                تقرير الكاش باك
              </h2>

              {/* Cashback Summary Stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { 
                    title: "إجمالي الكاش باك المكتسب", 
                    value: `${cashbackStats.totalEarned.toLocaleString('ar-SA')} ر.س`, 
                    icon: ArrowDownCircle, 
                    color: "from-success to-emerald-400" 
                  },
                  { 
                    title: "إجمالي المسحوب", 
                    value: `${cashbackStats.totalWithdrawn.toLocaleString('ar-SA')} ر.س`, 
                    icon: ArrowUpCircle, 
                    color: "from-destructive to-orange-400" 
                  },
                  { 
                    title: "الرصيد الحالي", 
                    value: `${cashbackStats.currentBalance.toLocaleString('ar-SA')} ر.س`, 
                    icon: Wallet, 
                    color: "from-primary to-cyan-400" 
                  },
                  { 
                    title: "مستخدمين لديهم رصيد", 
                    value: cashbackStats.usersWithCashback.toString(), 
                    icon: Users, 
                    color: "from-accent to-pink-400" 
                  },
                  { 
                    title: "عدد المعاملات", 
                    value: cashbackStats.transactionCount.toString(), 
                    icon: Gift, 
                    color: "from-warning to-orange-400" 
                  },
                ].map((stat, index) => (
                  <Card key={stat.title} className="glass border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} p-2.5`}>
                          <stat.icon className="w-full h-full text-primary-foreground" />
                        </div>
                        <p className="text-lg font-bold font-display">{stat.value}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Monthly Cashback Chart */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2 text-lg">
                      <ArrowDownCircle className="w-5 h-5 text-success" />
                      الكاش باك المكتسب شهرياً
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cashbackStats.monthlyData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد بيانات للفترة المحددة</p>
                    ) : (
                      <div className="space-y-3">
                        {cashbackStats.monthlyData.map((data, index) => {
                          const maxEarned = Math.max(...cashbackStats.monthlyData.map(d => d.earned), 1);
                          return (
                            <div key={data.month} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{data.month}</span>
                                <span className="text-success font-medium">{data.earned.toLocaleString('ar-SA')} ر.س</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(data.earned / maxEarned) * 100}%` }}
                                  transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                                  className="h-full bg-gradient-to-l from-success to-emerald-400 rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2 text-lg">
                      <ArrowUpCircle className="w-5 h-5 text-destructive" />
                      السحوبات شهرياً
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cashbackStats.monthlyData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد بيانات للفترة المحددة</p>
                    ) : (
                      <div className="space-y-3">
                        {cashbackStats.monthlyData.map((data, index) => {
                          const maxWithdrawn = Math.max(...cashbackStats.monthlyData.map(d => d.withdrawn), 1);
                          return (
                            <div key={data.month} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{data.month}</span>
                                <span className="text-destructive font-medium">{data.withdrawn.toLocaleString('ar-SA')} ر.س</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(data.withdrawn / maxWithdrawn) * 100}%` }}
                                  transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                                  className="h-full bg-gradient-to-l from-destructive to-orange-400 rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cashback Summary Card */}
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="font-display">ملخص الكاش باك</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border bg-success/10 text-success border-success/20 text-center">
                      <p className="text-2xl font-bold font-display mb-1">
                        {cashbackStats.totalEarned.toLocaleString('ar-SA')}
                      </p>
                      <p className="text-xs">ر.س مكتسب</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-destructive/10 text-destructive border-destructive/20 text-center">
                      <p className="text-2xl font-bold font-display mb-1">
                        {cashbackStats.totalWithdrawn.toLocaleString('ar-SA')}
                      </p>
                      <p className="text-xs">ر.س مسحوب</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-primary/10 text-primary border-primary/20 text-center">
                      <p className="text-2xl font-bold font-display mb-1">
                        {cashbackStats.currentBalance.toLocaleString('ar-SA')}
                      </p>
                      <p className="text-xs">ر.س رصيد حالي</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-accent/10 text-accent border-accent/20 text-center">
                      <p className="text-2xl font-bold font-display mb-1">
                        {cashbackStats.totalEarned > 0 
                          ? Math.round((cashbackStats.totalWithdrawn / cashbackStats.totalEarned) * 100) 
                          : 0}%
                      </p>
                      <p className="text-xs">نسبة السحب</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cancelled Orders Report Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                <Ban className="w-6 h-6 text-destructive" />
                تقرير الطلبات الملغية والمستردة
              </h2>

              {/* Cancelled Orders Summary Stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    title: "إجمالي الطلبات الملغية", 
                    value: cancelledStats.totalCancelled.toString(), 
                    icon: XCircle, 
                    color: "from-destructive to-red-400" 
                  },
                  { 
                    title: "إجمالي الطلبات المستردة", 
                    value: cancelledStats.totalRefunded.toString(), 
                    icon: RefreshCcw, 
                    color: "from-warning to-orange-400" 
                  },
                  { 
                    title: "إجمالي المبالغ المستردة", 
                    value: `${cancelledStats.totalRefundedAmount.toLocaleString('ar-SA')} ر.س`, 
                    icon: DollarSign, 
                    color: "from-accent to-pink-400" 
                  },
                  { 
                    title: "إجمالي العمليات", 
                    value: (cancelledStats.totalCancelled + cancelledStats.totalRefunded).toString(), 
                    icon: FileText, 
                    color: "from-muted-foreground to-gray-400" 
                  },
                ].map((stat) => (
                  <Card key={stat.title} className="glass border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} p-2.5`}>
                          <stat.icon className="w-full h-full text-primary-foreground" />
                        </div>
                        <p className="text-lg font-bold font-display">{stat.value}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Daily Cancelled Orders Report */}
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-destructive" />
                    التقرير اليومي للطلبات الملغية والمستردة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cancelledStats.dailyData.length === 0 ? (
                    <div className="text-center py-12">
                      <Ban className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">لا توجد طلبات ملغية أو مستردة في الفترة المحددة</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cancelledStats.dailyData.map((dayData, dayIndex) => (
                        <motion.div
                          key={dayData.date}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: dayIndex * 0.05 }}
                          className="border border-border/50 rounded-xl overflow-hidden"
                        >
                          {/* Day Header */}
                          <div className="bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-destructive" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{dayData.date}</p>
                                <p className="text-xs text-muted-foreground">
                                  {dayData.cancelled_count + dayData.refunded_count} عملية
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1.5">
                                <XCircle className="w-4 h-4 text-destructive" />
                                <span className="text-destructive font-medium">{dayData.cancelled_count} ملغي</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <RefreshCcw className="w-4 h-4 text-warning" />
                                <span className="text-warning font-medium">{dayData.refunded_count} مسترد</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-destructive/10 px-3 py-1 rounded-full">
                                <DollarSign className="w-4 h-4 text-destructive" />
                                <span className="text-destructive font-bold">
                                  {dayData.total_refunded_amount.toLocaleString('ar-SA')} ر.س
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Day Orders */}
                          <div className="divide-y divide-border/30">
                            {dayData.orders.map((order) => (
                              <div key={order.id} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${order.status === 'cancelled' ? 'bg-destructive' : 'bg-warning'}`} />
                                  <div>
                                    <p className="font-medium text-sm">{order.order_number}</p>
                                    <p className="text-xs text-muted-foreground">{order.service_name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="text-muted-foreground">{order.user_email}</span>
                                  <span className={`px-2 py-0.5 rounded-full ${order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                                    {order.status === 'cancelled' ? 'ملغي' : 'مسترد'}
                                  </span>
                                  <span className="font-bold text-destructive">
                                    {order.total_price.toLocaleString('ar-SA')} ر.س
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary by Status */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="glass border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-destructive" />
                      الطلبات الملغية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-4xl font-bold font-display text-destructive mb-2">
                        {cancelledStats.totalCancelled}
                      </p>
                      <p className="text-sm text-muted-foreground">طلب ملغي</p>
                      <p className="text-lg font-bold text-destructive mt-2">
                        {cancelledStats.dailyData
                          .flatMap(d => d.orders)
                          .filter(o => o.status === 'cancelled')
                          .reduce((sum, o) => sum + o.total_price, 0)
                          .toLocaleString('ar-SA')} ر.س
                      </p>
                      <p className="text-xs text-muted-foreground">مبالغ مستردة من الإلغاء</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <RefreshCcw className="w-5 h-5 text-warning" />
                      الطلبات المستردة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-4xl font-bold font-display text-warning mb-2">
                        {cancelledStats.totalRefunded}
                      </p>
                      <p className="text-sm text-muted-foreground">طلب مسترد</p>
                      <p className="text-lg font-bold text-warning mt-2">
                        {cancelledStats.dailyData
                          .flatMap(d => d.orders)
                          .filter(o => o.status === 'refunded')
                          .reduce((sum, o) => sum + o.total_price, 0)
                          .toLocaleString('ar-SA')} ر.س
                      </p>
                      <p className="text-xs text-muted-foreground">مبالغ مستردة</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminReports;
