import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Gift,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  Coins,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";

interface ReferralWithDetails {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  commission_rate: number;
  total_commission: number;
  status: string;
  created_at: string;
  converted_at: string | null;
  referrer_email?: string;
  referred_email?: string;
}

interface Commission {
  id: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  referral_code?: string;
}

interface Stats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  conversionRate: number;
  averageCommission: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))'];

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    conversionRate: 0,
    averageCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch referrals with profile info
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Fetch profiles for emails
      const referrerIds = [...new Set(referralsData?.map(r => r.referrer_id) || [])];
      const referredIds = [...new Set(referralsData?.map(r => r.referred_id) || [])];
      const allUserIds = [...new Set([...referrerIds, ...referredIds])];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', allUserIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.email]) || []);

      const enrichedReferrals = referralsData?.map(r => ({
        ...r,
        referrer_email: profilesMap.get(r.referrer_id) || 'غير معروف',
        referred_email: profilesMap.get(r.referred_id) || 'غير معروف',
      })) || [];

      setReferrals(enrichedReferrals);

      // Fetch commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('referral_commissions')
        .select(`
          id,
          order_amount,
          commission_rate,
          commission_amount,
          status,
          created_at,
          paid_at,
          referral:referrals(referral_code)
        `)
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;

      const enrichedCommissions = commissionsData?.map(c => ({
        ...c,
        referral_code: (c.referral as any)?.referral_code || '',
      })) || [];

      setCommissions(enrichedCommissions);

      // Calculate stats
      const totalReferrals = enrichedReferrals.length;
      const activeReferrals = enrichedReferrals.filter(r => r.status === 'converted').length;
      const pendingReferrals = enrichedReferrals.filter(r => r.status === 'pending').length;
      const totalCommissions = enrichedCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const paidCommissions = enrichedCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const pendingCommissions = enrichedCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;
      const averageCommission = enrichedCommissions.length > 0 ? totalCommissions / enrichedCommissions.length : 0;

      setStats({
        totalReferrals,
        activeReferrals,
        pendingReferrals,
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        conversionRate,
        averageCommission,
      });

      // Generate chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayReferrals = enrichedReferrals.filter(r => 
          format(new Date(r.created_at), 'yyyy-MM-dd') === dateStr
        ).length;
        const dayCommissions = enrichedCommissions
          .filter(c => format(new Date(c.created_at), 'yyyy-MM-dd') === dateStr)
          .reduce((sum, c) => sum + Number(c.commission_amount), 0);

        return {
          date: format(date, 'EEE', { locale: ar }),
          referrals: dayReferrals,
          commissions: dayCommissions,
        };
      });

      setChartData(last7Days);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const updateCommissionStatus = async (commissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('referral_commissions')
        .update({ 
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', commissionId);

      if (error) throw error;

      toast.success('تم تحديث حالة العمولة');
      fetchData();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('خطأ في تحديث العمولة');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد الانتظار', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock };
      case 'converted':
        return { label: 'مفعّل', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle };
      case 'paid':
        return { label: 'مدفوع', color: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle };
      case 'expired':
        return { label: 'منتهي', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle };
      default:
        return { label: status, color: 'bg-muted text-muted-foreground', icon: Clock };
    }
  };

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = 
      referral.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referrer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referred_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = commission.referral_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pieData = [
    { name: 'إحالات مفعّلة', value: stats.activeReferrals },
    { name: 'إحالات معلقة', value: stats.pendingReferrals },
  ];

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-2xl lg:text-3xl font-bold mb-2"
            >
              إدارة الإحالات
            </motion.h1>
            <p className="text-muted-foreground">متابعة وإدارة نظام الإحالات والعمولات</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            <Button className="gap-2 bg-gradient-to-l from-destructive to-orange-500">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الإحالات", value: stats.totalReferrals, icon: Users, gradient: "from-primary to-cyan-400", change: `${stats.conversionRate.toFixed(0)}% معدل التحويل` },
            { label: "إحالات مفعّلة", value: stats.activeReferrals, icon: UserPlus, gradient: "from-success to-emerald-400", change: `+${stats.activeReferrals} هذا الشهر` },
            { label: "عمولات معلقة", value: `$${stats.pendingCommissions.toFixed(2)}`, icon: Clock, gradient: "from-warning to-orange-400", change: `${commissions.filter(c => c.status === 'pending').length} عمولة` },
            { label: "إجمالي العمولات", value: `$${stats.totalCommissions.toFixed(2)}`, icon: DollarSign, gradient: "from-accent to-pink-400", change: `$${stats.averageCommission.toFixed(2)} متوسط` },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/30 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg shrink-0`}>
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                إحصائيات آخر 7 أيام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="referrals" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="الإحالات"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="commissions" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="العمولات ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                توزيع الإحالات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالكود أو البريد الإلكتروني..."
                  className="pr-10 bg-secondary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="converted">مفعّل</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="referrals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="referrals" className="gap-2">
              <Users className="w-4 h-4" />
              الإحالات ({filteredReferrals.length})
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <Coins className="w-4 h-4" />
              العمولات ({filteredCommissions.length})
            </TabsTrigger>
          </TabsList>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  قائمة الإحالات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredReferrals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد إحالات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الكود</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">المُحيل</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">المُحال</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">العمولة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">إجمالي العمولات</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">التاريخ</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReferrals.map((referral, index) => {
                          const statusConfig = getStatusConfig(referral.status);
                          return (
                            <motion.tr
                              key={referral.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-b border-border/50 hover:bg-secondary/30"
                            >
                              <td className="py-3 px-4">
                                <code className="px-2 py-1 bg-secondary rounded text-sm font-mono">
                                  {referral.referral_code}
                                </code>
                              </td>
                              <td className="py-3 px-4 text-sm">{referral.referrer_email}</td>
                              <td className="py-3 px-4 text-sm">{referral.referred_email}</td>
                              <td className="py-3 px-4 text-sm">{referral.commission_rate}%</td>
                              <td className="py-3 px-4 text-sm font-bold text-success">
                                ${referral.total_commission.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {format(new Date(referral.created_at), "d MMM yyyy", { locale: ar })}
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={`${statusConfig.color} border`}>
                                  <statusConfig.icon className="w-3 h-3 ml-1" />
                                  {statusConfig.label}
                                </Badge>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  سجل العمولات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredCommissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد عمولات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الكود</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">قيمة الطلب</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">النسبة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">العمولة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">التاريخ</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الحالة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCommissions.map((commission, index) => {
                          const statusConfig = getStatusConfig(commission.status);
                          return (
                            <motion.tr
                              key={commission.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-b border-border/50 hover:bg-secondary/30"
                            >
                              <td className="py-3 px-4">
                                <code className="px-2 py-1 bg-secondary rounded text-sm font-mono">
                                  {commission.referral_code || '-'}
                                </code>
                              </td>
                              <td className="py-3 px-4 text-sm font-medium">
                                ${commission.order_amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-sm">{commission.commission_rate}%</td>
                              <td className="py-3 px-4 text-sm font-bold text-success">
                                +${commission.commission_amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {format(new Date(commission.created_at), "d MMM yyyy", { locale: ar })}
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={`${statusConfig.color} border`}>
                                  {statusConfig.label}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                {commission.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateCommissionStatus(commission.id, 'paid')}
                                    className="gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    دفع
                                  </Button>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminReferrals;
