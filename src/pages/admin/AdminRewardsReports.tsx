import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  Coins,
  Gift,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import {
  LineChart,
  Line,
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
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];

const AdminRewardsReports = () => {
  const [dateRange, setDateRange] = useState("30");

  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ["rewards-reports-stats", dateRange],
    queryFn: async () => {
      const daysAgo = parseInt(dateRange);
      const startDate = subDays(new Date(), daysAgo).toISOString();

      // Get all user points
      const { data: userPoints } = await supabase
        .from("user_points")
        .select("*, tier:reward_tiers(name, name_ar, color)");

      // Get all transactions in range
      const { data: transactions } = await supabase
        .from("points_transactions")
        .select("*")
        .gte("created_at", startDate)
        .order("created_at", { ascending: false });

      // Get all tiers
      const { data: tiers } = await supabase
        .from("reward_tiers")
        .select("*")
        .order("min_points", { ascending: true });

      // Calculate stats
      const totalPoints = userPoints?.reduce((sum, u) => sum + u.total_points, 0) || 0;
      const availablePoints = userPoints?.reduce((sum, u) => sum + u.available_points, 0) || 0;
      const redeemedPoints = userPoints?.reduce((sum, u) => sum + u.redeemed_points, 0) || 0;
      const totalUsersWithPoints = userPoints?.filter(u => u.total_points > 0).length || 0;

      const earnedInRange = transactions
        ?.filter(t => t.type === "earned")
        .reduce((sum, t) => sum + t.points, 0) || 0;
      const redeemedInRange = transactions
        ?.filter(t => t.type === "redeemed")
        .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

      // Calculate tier distribution
      const tierDistribution = tiers?.map(tier => {
        const count = userPoints?.filter(u => u.tier_id === tier.id).length || 0;
        return {
          name: tier.name_ar,
          value: count,
          color: tier.color,
        };
      }) || [];

      // Calculate daily transactions for chart
      const dailyData: Record<string, { date: string; earned: number; redeemed: number }> = {};
      transactions?.forEach(t => {
        const date = format(new Date(t.created_at), "yyyy-MM-dd");
        if (!dailyData[date]) {
          dailyData[date] = { date, earned: 0, redeemed: 0 };
        }
        if (t.type === "earned") {
          dailyData[date].earned += t.points;
        } else {
          dailyData[date].redeemed += Math.abs(t.points);
        }
      });

      const chartData = Object.values(dailyData)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({
          ...d,
          date: format(new Date(d.date), "MM/dd"),
        }));

      // Top users by points
      const topUsers = userPoints
        ?.sort((a, b) => b.total_points - a.total_points)
        .slice(0, 10)
        .map(u => ({
          ...u,
          tierName: (u.tier as any)?.name_ar || "بدون مستوى",
          tierColor: (u.tier as any)?.color || "#6b7280",
        })) || [];

      return {
        totalPoints,
        availablePoints,
        redeemedPoints,
        totalUsersWithPoints,
        earnedInRange,
        redeemedInRange,
        tierDistribution: tierDistribution.filter(t => t.value > 0),
        chartData,
        topUsers,
        recentTransactions: transactions?.slice(0, 20) || [],
        tiers: tiers || [],
      };
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) as Record<string, any>;
    },
  });

  const getProfileName = (userId: string) => {
    return profiles?.[userId]?.full_name || profiles?.[userId]?.email || "مستخدم";
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color,
    suffix = ""
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    trend?: number;
    color: string;
    suffix?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`border-${color}/20 bg-gradient-to-br from-${color}/5 to-transparent`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">
                {value.toLocaleString()}{suffix}
              </p>
              {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <AdminDashboardLayout>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              تقارير المكافآت
            </h1>
            <p className="text-muted-foreground mt-1">
              تحليل تفصيلي لنظام النقاط والمكافآت
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="90">آخر 90 يوم</SelectItem>
                <SelectItem value="365">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي النقاط</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats?.totalPoints.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/20 bg-gradient-to-br from-success/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">نقاط مكتسبة</p>
                    <p className="text-2xl font-bold mt-1 text-success">
                      +{stats?.earnedInRange.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      خلال الفترة المحددة
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">نقاط مستبدلة</p>
                    <p className="text-2xl font-bold mt-1 text-amber-500">
                      -{stats?.redeemedInRange.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      = {((stats?.redeemedInRange || 0) / 100).toFixed(2)} ر.س
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مستخدمين نشطين</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats?.totalUsersWithPoints.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      لديهم نقاط
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                حركة النقاط
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="earned" name="مكتسبة" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="redeemed" name="مستبدلة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart - Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                توزيع المستويات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : stats?.tierDistribution && stats.tierDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={stats.tierDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
              {stats?.tierDistribution && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {stats.tierDistribution.map((tier, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      style={{ borderColor: tier.color, color: tier.color }}
                    >
                      {tier.name}: {tier.value}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                أعلى المستخدمين نقاطاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>المستوى</TableHead>
                      <TableHead className="text-left">النقاط</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.topUsers.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{getProfileName(user.user_id)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{ 
                              borderColor: user.tierColor, 
                              color: user.tierColor 
                            }}
                          >
                            {user.tierName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left font-bold">
                          {user.total_points.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                آخر المعاملات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead className="text-left">النقاط</TableHead>
                        <TableHead className="text-left">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.recentTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">
                            {getProfileName(tx.user_id)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={tx.type === "earned" ? "default" : "secondary"}
                              className={tx.type === "earned" ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-500"}
                            >
                              {tx.type === "earned" ? "اكتساب" : "استبدال"}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-left font-bold ${tx.points > 0 ? 'text-success' : 'text-amber-500'}`}>
                            {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-left text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), "MM/dd HH:mm", { locale: ar })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tiers Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              ملخص المستويات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats?.tiers.map((tier) => {
                  const usersCount = stats.tierDistribution.find(t => t.name === tier.name_ar)?.value || 0;
                  return (
                    <motion.div
                      key={tier.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-xl border-2 text-center"
                      style={{ borderColor: `${tier.color}40` }}
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                        style={{ backgroundColor: `${tier.color}20` }}
                      >
                        <Star className="w-5 h-5" style={{ color: tier.color }} />
                      </div>
                      <p className="font-bold" style={{ color: tier.color }}>
                        {tier.name_ar}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tier.min_points.toLocaleString()}+ نقطة
                      </p>
                      <p className="text-lg font-bold mt-2">{usersCount}</p>
                      <p className="text-xs text-muted-foreground">مستخدم</p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminRewardsReports;
