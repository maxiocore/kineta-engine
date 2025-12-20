import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, DollarSign, Users, ShoppingBag, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  service_id: string;
}

interface Deposit {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface User {
  id: string;
  created_at: string;
  is_verified: boolean;
}

interface AdvancedDashboardChartsProps {
  orders: Order[];
  deposits: Deposit[];
  users: User[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  pending: '#eab308',
  confirmed: '#3b82f6',
  in_progress: '#a855f7',
  cancelled: '#ef4444',
  refunded: '#f97316',
  processing: '#06b6d4',
  partial: '#8b5cf6'
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'مكتمل',
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  in_progress: 'قيد التنفيذ',
  cancelled: 'ملغي',
  refunded: 'مسترد',
  processing: 'قيد المعالجة',
  partial: 'جزئي'
};

export const AdvancedDashboardCharts = ({ orders, deposits, users }: AdvancedDashboardChartsProps) => {
  // Revenue & Orders trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 5),
      end: now
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: monthStart, end: monthEnd });
      });

      const monthDeposits = deposits.filter(deposit => {
        const depositDate = new Date(deposit.created_at);
        return isWithinInterval(depositDate, { start: monthStart, end: monthEnd }) && deposit.status === 'completed';
      });

      const monthUsers = users.filter(user => {
        const userDate = new Date(user.created_at);
        return isWithinInterval(userDate, { start: monthStart, end: monthEnd });
      });

      const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
      const depositsTotal = monthDeposits.reduce((sum, d) => sum + Number(d.amount), 0);

      return {
        month: format(month, 'MMM', { locale: ar }),
        fullMonth: format(month, 'MMMM yyyy', { locale: ar }),
        revenue,
        orders: monthOrders.length,
        deposits: depositsTotal,
        users: monthUsers.length
      };
    });
  }, [orders, deposits, users]);

  // Daily trend (last 14 days)
  const dailyTrend = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({
      start: subDays(now, 13),
      end: now
    });

    return days.map(day => {
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total_price), 0);

      return {
        day: format(day, 'dd', { locale: ar }),
        fullDay: format(day, 'EEEE d MMM', { locale: ar }),
        revenue,
        orders: dayOrders.length
      };
    });
  }, [orders]);

  // Order status distribution
  const statusData = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    orders.forEach(order => {
      const count = statusMap.get(order.status) || 0;
      statusMap.set(order.status, count + 1);
    });

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#888',
      percentage: orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : '0'
    }));
  }, [orders]);

  // Revenue breakdown by status
  const revenueByStatus = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    orders.forEach(order => {
      const current = statusMap.get(order.status) || 0;
      statusMap.set(order.status, current + Number(order.total_price));
    });

    return Array.from(statusMap.entries())
      .map(([status, revenue]) => ({
        name: STATUS_LABELS[status] || status,
        revenue,
        color: STATUS_COLORS[status] || '#888'
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  // User growth analytics
  const userGrowth = useMemo(() => {
    const verifiedCount = users.filter(u => u.is_verified).length;
    const unverifiedCount = users.length - verifiedCount;
    
    return [
      { name: 'موثق', value: verifiedCount, color: '#22c55e' },
      { name: 'غير موثق', value: unverifiedCount, color: '#eab308' }
    ];
  }, [users]);

  // Calculate key metrics
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const totalDeposits = deposits.filter(d => d.status === 'completed').reduce((sum, d) => sum + Number(d.amount), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const completionRate = orders.length > 0 
    ? (orders.filter(o => o.status === 'completed').length / orders.length * 100) 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3">
          <p className="font-semibold text-sm mb-2">{payload[0]?.payload?.fullMonth || payload[0]?.payload?.fullDay || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">
                {entry.name.includes('إيراد') || entry.name.includes('إيداع') 
                  ? `${entry.value.toLocaleString()} ر.س` 
                  : entry.value.toLocaleString()}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics Cards - Optimized for mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 sm:p-4 relative">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-primary/20">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">إجمالي الإيرادات</p>
                  <p className="text-base sm:text-xl font-bold truncate">{totalRevenue.toLocaleString()} <span className="text-xs font-normal">ر.س</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-green-500/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 sm:p-4 relative">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-green-500/20">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">إجمالي الإيداعات</p>
                  <p className="text-base sm:text-xl font-bold truncate">{totalDeposits.toLocaleString()} <span className="text-xs font-normal">ر.س</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 sm:p-4 relative">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-500/20">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">متوسط قيمة الطلب</p>
                  <p className="text-base sm:text-xl font-bold truncate">{avgOrderValue.toFixed(2)} <span className="text-xs font-normal">ر.س</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-500/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 sm:p-4 relative">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-purple-500/20">
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">نسبة الإكمال</p>
                  <p className="text-base sm:text-xl font-bold">{completionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue & Orders Trend Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="p-4 sm:pb-2">
            <div className="flex flex-col gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  تحليل الإيرادات والطلبات
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">آخر 6 أشهر</CardDescription>
              </div>
              <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">الإيرادات</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">الطلبات</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0">
            <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
              <ComposedChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="month" className="text-[10px] sm:text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis yAxisId="left" className="text-[10px] sm:text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={40} />
                <YAxis yAxisId="right" orientation="right" className="text-[10px] sm:text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="الإيرادات"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="الطلبات"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="p-4 sm:pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              نشاط آخر 14 يوم
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">الطلبات والإيرادات اليومية</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0">
            <ResponsiveContainer width="100%" height={180} className="sm:!h-[250px]">
              <BarChart data={dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="day" className="text-[10px] sm:text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis className="text-[10px] sm:text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" name="الطلبات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Order Status Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChartIcon className="h-5 w-5 text-primary" />
                توزيع حالات الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center">
                  {statusData.map((status, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="flex items-center gap-2"
                      style={{ borderColor: status.color }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      {status.name}: {status.value} ({status.percentage}%)
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Growth */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                نمو المستخدمين
              </CardTitle>
              <CardDescription>إجمالي {users.length} مستخدم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={userGrowth}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {userGrowth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 w-full md:w-auto">
                  {userGrowth.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{item.value}</span>
                        <span className="text-xs text-muted-foreground mr-1">
                          ({users.length > 0 ? ((item.value / users.length) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue by Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-primary" />
              الإيرادات حسب حالة الطلب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={80} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'الإيرادات']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {revenueByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdvancedDashboardCharts;
