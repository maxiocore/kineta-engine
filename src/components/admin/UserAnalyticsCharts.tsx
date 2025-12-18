import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, getDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar, Clock, Users, Award, Target, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  quantity: number;
  created_at: string;
  service: {
    name: string;
    category: string;
  };
}

interface PlatformStats {
  totalUsers: number;
  avgOrdersPerUser: number;
  avgSpentPerUser: number;
  avgOrderValue: number;
  userRankByOrders: number;
  userRankBySpending: number;
  percentileOrders: number;
  percentileSpending: number;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  completedOrders: number;
  pendingOrders: number;
  totalTickets: number;
  openTickets: number;
}

interface UserAnalyticsChartsProps {
  orders: Order[];
  userCreatedAt: string;
  platformStats: PlatformStats;
  userStats: UserStats;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  pending: '#eab308',
  confirmed: '#3b82f6',
  in_progress: '#a855f7',
  cancelled: '#ef4444',
  refunded: '#f97316'
};

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const UserAnalyticsCharts = ({ orders, userCreatedAt, platformStats, userStats }: UserAnalyticsChartsProps) => {
  // Monthly spending data (last 6 months)
  const monthlyData = useMemo(() => {
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

      const totalSpent = monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
      const orderCount = monthOrders.length;

      return {
        month: format(month, 'MMM', { locale: ar }),
        fullMonth: format(month, 'MMMM yyyy', { locale: ar }),
        spending: totalSpent,
        orders: orderCount
      };
    });
  }, [orders]);

  // Category distribution
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { count: number; spent: number }>();
    
    orders.forEach(order => {
      const category = order.service?.category || 'غير مصنف';
      const existing = categoryMap.get(category) || { count: 0, spent: 0 };
      categoryMap.set(category, {
        count: existing.count + 1,
        spent: existing.spent + Number(order.total_price)
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.count,
        spent: data.spent
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [orders]);

  // Order status distribution
  const statusData = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    orders.forEach(order => {
      const count = statusMap.get(order.status) || 0;
      statusMap.set(order.status, count + 1);
    });

    const statusLabels: Record<string, string> = {
      completed: 'مكتمل',
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      in_progress: 'قيد التنفيذ',
      cancelled: 'ملغي',
      refunded: 'مسترد'
    };

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#888'
    }));
  }, [orders]);

  // Purchase patterns by day of week
  const dayOfWeekData = useMemo(() => {
    const dayMap = new Map<number, { count: number; spent: number }>();
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      dayMap.set(i, { count: 0, spent: 0 });
    }

    orders.forEach(order => {
      const day = getDay(new Date(order.created_at));
      const existing = dayMap.get(day) || { count: 0, spent: 0 };
      dayMap.set(day, {
        count: existing.count + 1,
        spent: existing.spent + Number(order.total_price)
      });
    });

    return Array.from(dayMap.entries()).map(([day, data]) => ({
      day: DAY_NAMES[day],
      orders: data.count,
      spent: data.spent
    }));
  }, [orders]);

  // Top services
  const topServices = useMemo(() => {
    const serviceMap = new Map<string, { count: number; spent: number }>();
    
    orders.forEach(order => {
      const serviceName = order.service?.name || 'خدمة محذوفة';
      const existing = serviceMap.get(serviceName) || { count: 0, spent: 0 };
      serviceMap.set(serviceName, {
        count: existing.count + 1,
        spent: existing.spent + Number(order.total_price)
      });
    });

    return Array.from(serviceMap.entries())
      .map(([name, data]) => ({
        name: name.length > 25 ? name.slice(0, 25) + '...' : name,
        fullName: name,
        orders: data.count,
        spent: data.spent
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
  }, [orders]);

  // Average order value
  const avgOrderValue = orders.length > 0 
    ? orders.reduce((sum, o) => sum + Number(o.total_price), 0) / orders.length 
    : 0;

  // Peak purchasing day
  const peakDay = dayOfWeekData.reduce((max, current) => 
    current.orders > max.orders ? current : max, 
    dayOfWeekData[0]
  );

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>لا توجد بيانات كافية لعرض التحليلات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold">${avgOrderValue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">متوسط قيمة الطلب</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Calendar className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{peakDay?.day}</p>
                  <p className="text-xs text-muted-foreground">أكثر يوم شراء</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <PieChartIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{categoryData.length}</p>
                  <p className="text-xs text-muted-foreground">فئات مختلفة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {Math.round((new Date().getTime() - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-xs text-muted-foreground">يوم منذ التسجيل</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Platform Comparison Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              مقارنة مع متوسط المستخدمين
            </CardTitle>
            <CardDescription>
              مقارنة أداء هذا المستخدم مع {platformStats.totalUsers.toLocaleString()} مستخدم آخر على المنصة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Orders Comparison */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">عدد الطلبات</span>
                  {userStats.totalOrders > platformStats.avgOrdersPerUser ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <ArrowUp className="h-3 w-3 ml-1" />
                      أعلى من المتوسط
                    </Badge>
                  ) : userStats.totalOrders < platformStats.avgOrdersPerUser ? (
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                      <ArrowDown className="h-3 w-3 ml-1" />
                      أقل من المتوسط
                    </Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground">
                      <Minus className="h-3 w-3 ml-1" />
                      يساوي المتوسط
                    </Badge>
                  )}
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold">{userStats.totalOrders}</span>
                  <span className="text-sm text-muted-foreground mb-0.5">
                    vs {platformStats.avgOrdersPerUser.toFixed(1)}
                  </span>
                </div>
                <Progress 
                  value={Math.min((userStats.totalOrders / (platformStats.avgOrdersPerUser * 2)) * 100, 100)} 
                  className="h-2"
                />
              </div>

              {/* Spending Comparison */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">إجمالي الإنفاق</span>
                  {userStats.totalSpent > platformStats.avgSpentPerUser ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <ArrowUp className="h-3 w-3 ml-1" />
                      أعلى من المتوسط
                    </Badge>
                  ) : userStats.totalSpent < platformStats.avgSpentPerUser ? (
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                      <ArrowDown className="h-3 w-3 ml-1" />
                      أقل من المتوسط
                    </Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground">
                      <Minus className="h-3 w-3 ml-1" />
                      يساوي المتوسط
                    </Badge>
                  )}
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold">${userStats.totalSpent.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground mb-0.5">
                    vs ${platformStats.avgSpentPerUser.toFixed(2)}
                  </span>
                </div>
                <Progress 
                  value={Math.min((userStats.totalSpent / (platformStats.avgSpentPerUser * 2)) * 100, 100)} 
                  className="h-2"
                />
              </div>

              {/* Rank by Orders */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">ترتيب بالطلبات</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Award className="h-3 w-3 ml-1" />
                    Top {platformStats.percentileOrders}%
                  </Badge>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold">#{platformStats.userRankByOrders}</span>
                  <span className="text-sm text-muted-foreground mb-0.5">
                    من {platformStats.totalUsers}
                  </span>
                </div>
                <Progress 
                  value={platformStats.percentileOrders} 
                  className="h-2"
                />
              </div>

              {/* Rank by Spending */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">ترتيب بالإنفاق</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Target className="h-3 w-3 ml-1" />
                    Top {platformStats.percentileSpending}%
                  </Badge>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold">#{platformStats.userRankBySpending}</span>
                  <span className="text-sm text-muted-foreground mb-0.5">
                    من {platformStats.totalUsers}
                  </span>
                </div>
                <Progress 
                  value={platformStats.percentileSpending} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Radar Chart Comparison */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-4 text-muted-foreground">مقارنة شاملة مع المتوسط</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  {
                    metric: 'عدد الطلبات',
                    user: Math.min((userStats.totalOrders / Math.max(platformStats.avgOrdersPerUser, 1)) * 100, 200),
                    average: 100
                  },
                  {
                    metric: 'الإنفاق',
                    user: Math.min((userStats.totalSpent / Math.max(platformStats.avgSpentPerUser, 1)) * 100, 200),
                    average: 100
                  },
                  {
                    metric: 'متوسط الطلب',
                    user: Math.min((avgOrderValue / Math.max(platformStats.avgOrderValue, 1)) * 100, 200),
                    average: 100
                  },
                  {
                    metric: 'نسبة الإكتمال',
                    user: userStats.totalOrders > 0 ? (userStats.completedOrders / userStats.totalOrders) * 100 : 0,
                    average: 70
                  },
                  {
                    metric: 'التفاعل',
                    user: Math.min((userStats.totalTickets / Math.max(platformStats.totalUsers > 0 ? 2 : 1, 1)) * 100, 150),
                    average: 100
                  }
                ]}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 200]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name="المستخدم"
                    dataKey="user"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="المتوسط"
                    dataKey="average"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Legend 
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(0)}%`, '']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" />
                اتجاه الإنفاق الشهري
              </CardTitle>
              <CardDescription>إجمالي الإنفاق خلال آخر 6 أشهر</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'الإنفاق']}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="spending" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorSpending)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChartIcon className="h-5 w-5 text-primary" />
                توزيع حالات الطلبات
              </CardTitle>
              <CardDescription>نسبة كل حالة من إجمالي الطلبات</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value, 'عدد الطلبات']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Pattern by Day */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-primary" />
                نمط الشراء حسب اليوم
              </CardTitle>
              <CardDescription>عدد الطلبات والإنفاق لكل يوم من أيام الأسبوع</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'orders' ? value : `$${value.toFixed(2)}`,
                      name === 'orders' ? 'عدد الطلبات' : 'الإنفاق'
                    ]}
                  />
                  <Legend 
                    formatter={(value) => value === 'orders' ? 'عدد الطلبات' : 'الإنفاق'}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                توزيع الفئات
              </CardTitle>
              <CardDescription>أكثر الفئات التي يشتري منها المستخدم</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'value' ? value : `$${value.toFixed(2)}`,
                      name === 'value' ? 'عدد الطلبات' : 'الإنفاق'
                    ]}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Services */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              الخدمات الأكثر طلباً
            </CardTitle>
            <CardDescription>أكثر 5 خدمات يطلبها هذا المستخدم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={service.fullName}>
                      {service.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{service.orders} طلب</span>
                      <span>•</span>
                      <span className="text-green-500">${service.spent.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(service.orders / topServices[0].orders) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserAnalyticsCharts;
