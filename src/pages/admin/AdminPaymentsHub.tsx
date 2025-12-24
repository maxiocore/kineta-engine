import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Wallet,
  Coins,
  Building2,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Eye,
  Settings,
  Gift,
  Plus,
  Users,
  Activity,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RecentActivity {
  id: string;
  type: 'deposit' | 'withdrawal' | 'tamara' | 'cashback';
  user_name: string;
  user_email: string;
  amount: number;
  status: string;
  created_at: string;
}

interface PaymentStats {
  totalDeposits: number;
  pendingDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalCashback: number;
  activeMethods: number;
  todayDeposits: number;
  todayAmount: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Clock },
  completed: { label: 'مكتمل', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  approved: { label: 'موافق عليه', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  failed: { label: 'فشل', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle },
  rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle },
  cancelled: { label: 'ملغي', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: AlertCircle },
};

const AdminPaymentsHub = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Fetch payment stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['payment-hub-stats'],
    queryFn: async (): Promise<PaymentStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        depositsRes,
        pendingDepositsRes,
        withdrawalsRes,
        pendingWithdrawalsRes,
        cashbackRes,
        methodsRes,
        todayDepositsRes,
      ] = await Promise.all([
        supabase.from('deposits').select('*', { count: 'exact', head: true }),
        supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bank_withdrawal_requests').select('*', { count: 'exact', head: true }),
        supabase.from('bank_withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_cashback').select('cashback_balance'),
        supabase.from('payment_methods').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('deposits').select('amount').gte('created_at', today.toISOString()),
      ]);

      const totalCashback = (cashbackRes.data || []).reduce((sum, c) => sum + (c.cashback_balance || 0), 0);
      const todayAmount = (todayDepositsRes.data || []).reduce((sum, d) => sum + (d.amount || 0), 0);

      return {
        totalDeposits: depositsRes.count || 0,
        pendingDeposits: pendingDepositsRes.count || 0,
        totalWithdrawals: withdrawalsRes.count || 0,
        pendingWithdrawals: pendingWithdrawalsRes.count || 0,
        totalCashback,
        activeMethods: methodsRes.count || 0,
        todayDeposits: todayDepositsRes.data?.length || 0,
        todayAmount,
      };
    },
  });

  // Fetch recent activities
  const fetchRecentActivities = useCallback(async () => {
    const activities: RecentActivity[] = [];

    // Get recent deposits
    const { data: deposits } = await supabase
      .from('deposits')
      .select('id, user_id, amount, status, created_at, notes')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent withdrawals
    const { data: withdrawals } = await supabase
      .from('bank_withdrawal_requests')
      .select('id, user_id, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get user profiles
    const allUserIds = [
      ...(deposits || []).map(d => d.user_id),
      ...(withdrawals || []).map(w => w.user_id),
    ];
    const uniqueUserIds = [...new Set(allUserIds)];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', uniqueUserIds);

    const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

    // Combine activities
    (deposits || []).forEach(d => {
      const profile = profilesMap.get(d.user_id);
      const isTamara = d.notes?.toLowerCase().includes('tamara');
      activities.push({
        id: d.id,
        type: isTamara ? 'tamara' : 'deposit',
        user_name: profile?.full_name || 'مستخدم',
        user_email: profile?.email || '',
        amount: d.amount,
        status: d.status,
        created_at: d.created_at,
      });
    });

    (withdrawals || []).forEach(w => {
      const profile = profilesMap.get(w.user_id);
      activities.push({
        id: w.id,
        type: 'withdrawal',
        user_name: profile?.full_name || 'مستخدم',
        user_email: profile?.email || '',
        amount: w.amount,
        status: w.status,
        created_at: w.created_at,
      });
    });

    // Sort by date
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentActivities(activities.slice(0, 15));
  }, []);

  useEffect(() => {
    fetchRecentActivities();
  }, [fetchRecentActivities]);

  // Realtime subscriptions
  useEffect(() => {
    if (!isLive) return;

    const channel: RealtimeChannel = supabase
      .channel('payments-hub-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, (payload) => {
        refetchStats();
        fetchRecentActivities();
        if (payload.eventType === 'INSERT') {
          toast.info('إيداع جديد!', { description: 'تم استلام طلب إيداع جديد' });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_withdrawal_requests' }, (payload) => {
        refetchStats();
        fetchRecentActivities();
        if (payload.eventType === 'INSERT') {
          toast.info('طلب سحب جديد!', { description: 'تم استلام طلب سحب جديد' });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_cashback' }, () => {
        refetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, () => {
        refetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive, refetchStats, fetchRecentActivities]);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'deposit':
        return { icon: DollarSign, color: 'text-green-500 bg-green-500/10', label: 'إيداع' };
      case 'tamara':
        return { icon: CreditCard, color: 'text-pink-500 bg-pink-500/10', label: 'تمارا' };
      case 'withdrawal':
        return { icon: Building2, color: 'text-blue-500 bg-blue-500/10', label: 'سحب' };
      case 'cashback':
        return { icon: Coins, color: 'text-amber-500 bg-amber-500/10', label: 'كاش باك' };
      default:
        return { icon: DollarSign, color: 'text-gray-500 bg-gray-500/10', label: 'عملية' };
    }
  };

  const quickLinks = [
    { href: '/admin/wallets', icon: Wallet, label: 'المحافظ', description: 'إدارة أرصدة المستخدمين', color: 'from-blue-500 to-blue-600' },
    { href: '/admin/tamara-payments', icon: CreditCard, label: 'تمارا', description: 'مدفوعات التقسيط', color: 'from-pink-500 to-pink-600' },
    { href: '/admin/bank-withdrawals', icon: Building2, label: 'السحب البنكي', description: 'طلبات السحب', color: 'from-emerald-500 to-emerald-600' },
    { href: '/admin/cashback', icon: Coins, label: 'كاش باك', description: 'إعدادات الكاش باك', color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <AdminDashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 p-4 lg:p-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
              <CreditCard className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">مركز المدفوعات</h1>
              <p className="text-muted-foreground text-sm">إدارة شاملة لجميع عمليات الدفع</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={cn("gap-2", isLive && "bg-green-600 hover:bg-green-700")}
            >
              <Activity className={cn("w-4 h-4", isLive && "animate-pulse")} />
              {isLive ? 'مباشر' : 'متوقف'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { refetchStats(); fetchRecentActivities(); }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-transparent overflow-hidden relative">
            <div className="absolute top-0 left-0 w-20 h-20 bg-green-500/10 rounded-full -translate-x-10 -translate-y-10" />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">الإيداعات اليوم</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.todayDeposits || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(stats?.todayAmount || 0).toFixed(2)} ر.س
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-yellow-500/10 to-transparent overflow-hidden relative">
            <div className="absolute top-0 left-0 w-20 h-20 bg-yellow-500/10 rounded-full -translate-x-10 -translate-y-10" />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">بانتظار الموافقة</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {(stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.pendingDeposits || 0} إيداع • {stats?.pendingWithdrawals || 0} سحب
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-amber-500/10 to-transparent overflow-hidden relative">
            <div className="absolute top-0 left-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-x-10 -translate-y-10" />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">كاش باك نشط</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {(stats?.totalCashback || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">ر.س</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden relative">
            <div className="absolute top-0 left-0 w-20 h-20 bg-primary/10 rounded-full -translate-x-10 -translate-y-10" />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">طرق الدفع</p>
                  <p className="text-2xl font-bold">{stats?.activeMethods || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">طريقة مفعّلة</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            الأقسام
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Link key={link.href} to={link.href}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="h-full"
                >
                  <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer h-full group overflow-hidden relative">
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity", link.color)} />
                    <CardContent className="p-4 relative">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg", link.color)}>
                          <link.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{link.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-border/50 h-full">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    النشاط الأخير
                    {isLive && (
                      <span className="flex items-center gap-1 text-xs font-normal text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        مباشر
                      </span>
                    )}
                  </CardTitle>
                  <Badge variant="secondary">{recentActivities.length} عملية</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <AnimatePresence mode="popLayout">
                    {recentActivities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Activity className="w-12 h-12 mb-4 opacity-50" />
                        <p>لا توجد عمليات حديثة</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {recentActivities.map((activity, index) => {
                          const typeConfig = getTypeConfig(activity.type);
                          const statusConf = statusConfig[activity.status] || statusConfig.pending;
                          const StatusIcon = statusConf.icon;
                          const TypeIcon = typeConfig.icon;

                          return (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.03 }}
                              className="p-4 hover:bg-secondary/30 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeConfig.color)}>
                                  <TypeIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">{activity.user_name}</p>
                                    <Badge variant="outline" className="text-[10px] py-0 h-5">
                                      {typeConfig.label}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {activity.user_email}
                                  </p>
                                </div>
                                <div className="text-left shrink-0">
                                  <p className={cn(
                                    "font-bold",
                                    activity.type === 'withdrawal' ? 'text-red-500' : 'text-green-600'
                                  )}>
                                    {activity.type === 'withdrawal' ? '-' : '+'}{activity.amount.toFixed(2)} ر.س
                                  </p>
                                  <div className="flex items-center gap-1 justify-end mt-1">
                                    <Badge variant="outline" className={cn("text-[10px] py-0 h-5", statusConf.color)}>
                                      <StatusIcon className="w-3 h-3 ml-1" />
                                      {statusConf.label}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-2 text-left">
                                {format(new Date(activity.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Pending Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-yellow-500" />
                  تتطلب إجراء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(stats?.pendingDeposits || 0) > 0 && (
                  <Link to="/admin/wallets">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm">إيداعات معلقة</span>
                      </div>
                      <Badge className="bg-yellow-500 text-white">{stats?.pendingDeposits}</Badge>
                    </div>
                  </Link>
                )}

                {(stats?.pendingWithdrawals || 0) > 0 && (
                  <Link to="/admin/bank-withdrawals">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">طلبات سحب معلقة</span>
                      </div>
                      <Badge className="bg-blue-500 text-white">{stats?.pendingWithdrawals}</Badge>
                    </div>
                  </Link>
                )}

                {(stats?.pendingDeposits || 0) === 0 && (stats?.pendingWithdrawals || 0) === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">لا توجد عمليات معلقة</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  إحصائيات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">إجمالي الإيداعات</span>
                  <span className="font-bold">{stats?.totalDeposits || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">إجمالي السحوبات</span>
                  <span className="font-bold">{stats?.totalWithdrawals || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">طرق الدفع المفعّلة</span>
                  <span className="font-bold">{stats?.activeMethods || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Buttons */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  إجراءات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/admin/payments" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة طريقة دفع
                  </Button>
                </Link>
                <Link to="/admin/cashback" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Gift className="w-4 h-4" />
                    إعدادات الكاش باك
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminPaymentsHub;
