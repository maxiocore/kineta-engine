import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  ExternalLink,
  Filter,
  Download,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TamaraPayment {
  id: string;
  user_id: string;
  amount: number;
  total_credited: number;
  status: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  totalAmount: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Clock },
  completed: { label: 'مكتمل', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  failed: { label: 'فشل', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle },
  cancelled: { label: 'ملغي', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: AlertCircle },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminTamaraPayments = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<TamaraPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<TamaraPayment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('deposits')
        .select('*')
        .ilike('notes', '%tamara%')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: depositsData, error } = await query;

      if (error) throw error;

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set((depositsData || []).map(d => d.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

      const paymentsWithProfiles: TamaraPayment[] = (depositsData || []).map(d => ({
        ...d,
        profile: profilesMap.get(d.user_id) || undefined
      }));

      setPayments(paymentsWithProfiles);

      // Calculate stats
      setStats({
        total: paymentsWithProfiles.length,
        completed: paymentsWithProfiles.filter(p => p.status === 'completed').length,
        pending: paymentsWithProfiles.filter(p => p.status === 'pending').length,
        failed: paymentsWithProfiles.filter(p => p.status === 'failed' || p.status === 'cancelled').length,
        totalAmount: paymentsWithProfiles
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
      });
    } catch (error: any) {
      console.error('Error fetching Tamara payments:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب بيانات المدفوعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
    toast({
      title: 'تم التحديث',
      description: 'تم تحديث بيانات المدفوعات بنجاح',
    });
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الدفع بنجاح',
      });

      fetchPayments();
      setDetailsOpen(false);
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الحالة',
        variant: 'destructive',
      });
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.transaction_id?.toLowerCase().includes(query) ||
      payment.profile?.full_name?.toLowerCase().includes(query) ||
      payment.profile?.email?.toLowerCase().includes(query) ||
      payment.amount.toString().includes(query)
    );
  });

  const openDetails = (payment: TamaraPayment) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);
  };

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
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              مدفوعات تمارا
            </h1>
            <p className="text-muted-foreground mt-1">إدارة ومتابعة عمليات الدفع عبر تمارا</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              تحديث
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-border/50 bg-gradient-to-br from-pink-500/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي العمليات</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-pink-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-yellow-500/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-red-500/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">فشلت</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-emerald-500/10 to-transparent col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي المبالغ</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.totalAmount.toFixed(2)} ر.س</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث برقم العملية، اسم العميل، أو البريد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 ml-2" />
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="failed">فشل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payments List */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-pink-500" />
                سجل العمليات
                <Badge variant="secondary" className="mr-2">
                  {filteredPayments.length} عملية
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mb-4 opacity-50" />
                  <p>لا توجد عمليات دفع عبر تمارا</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  <AnimatePresence>
                    {filteredPayments.map((payment, index) => {
                      const status = statusConfig[payment.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      
                      return (
                        <motion.div
                          key={payment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                          onClick={() => openDetails(payment)}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shrink-0">
                                <CreditCard className="w-6 h-6 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold truncate">
                                    {payment.profile?.full_name || 'مستخدم'}
                                  </p>
                                  <Badge variant="outline" className={cn("text-xs", status.color)}>
                                    <StatusIcon className="w-3 h-3 ml-1" />
                                    {status.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {payment.profile?.email || '-'}
                                  </span>
                                  {payment.transaction_id && (
                                    <span className="flex items-center gap-1">
                                      <Hash className="w-3 h-3" />
                                      {payment.transaction_id.slice(0, 12)}...
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-left shrink-0">
                              <p className="text-lg font-bold text-pink-600">
                                {payment.amount.toFixed(2)} ر.س
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: ar })}
                              </p>
                            </div>
                            
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                تفاصيل عملية الدفع
              </DialogTitle>
            </DialogHeader>
            
            {selectedPayment && (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex justify-center">
                  {(() => {
                    const status = statusConfig[selectedPayment.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    return (
                      <Badge className={cn("text-sm py-1 px-3", status.color)}>
                        <StatusIcon className="w-4 h-4 ml-1" />
                        {status.label}
                      </Badge>
                    );
                  })()}
                </div>

                {/* Amount */}
                <div className="text-center py-4 bg-gradient-to-br from-pink-500/10 to-transparent rounded-xl">
                  <p className="text-sm text-muted-foreground">المبلغ</p>
                  <p className="text-3xl font-bold text-pink-600">
                    {selectedPayment.amount.toFixed(2)} ر.س
                  </p>
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      العميل
                    </span>
                    <span className="font-medium">
                      {selectedPayment.profile?.full_name || '-'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      البريد
                    </span>
                    <span className="font-medium text-sm">
                      {selectedPayment.profile?.email || '-'}
                    </span>
                  </div>
                  
                  {selectedPayment.transaction_id && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        رقم العملية
                      </span>
                      <span className="font-mono text-xs">
                        {selectedPayment.transaction_id}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      تاريخ الإنشاء
                    </span>
                    <span className="text-sm">
                      {format(new Date(selectedPayment.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                    </span>
                  </div>
                  
                  {selectedPayment.completed_at && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        تاريخ الإكمال
                      </span>
                      <span className="text-sm">
                        {format(new Date(selectedPayment.completed_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      المضاف للرصيد
                    </span>
                    <span className="font-bold text-green-600">
                      {selectedPayment.total_credited.toFixed(2)} ر.س
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {selectedPayment.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatus(selectedPayment.id, 'completed')}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      تأكيد الدفع
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => handleUpdateStatus(selectedPayment.id, 'failed')}
                    >
                      <XCircle className="w-4 h-4" />
                      رفض
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminTamaraPayments;
