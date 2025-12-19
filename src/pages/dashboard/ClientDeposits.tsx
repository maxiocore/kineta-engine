import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  Plus,
  Filter,
  Calendar,
  CreditCard,
  Gift,
  AlertCircle,
  PartyPopper,
} from 'lucide-react';
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Deposit {
  id: string;
  amount: number;
  fee_amount: number | null;
  bonus_amount: number | null;
  total_credited: number;
  status: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  payment_method: {
    name_ar: string;
    type: string;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'قيد المراجعة', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  completed: { label: 'مكتمل', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  cancelled: { label: 'ملغي', color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

const ClientDeposits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalDeposited: 0,
    pendingCount: 0,
    completedCount: 0,
  });

  // Handle payment callback
  useEffect(() => {
    const payment = searchParams.get('payment');
    const orderNumber = searchParams.get('orderNumber');
    const transactionNo = searchParams.get('transactionNo');

    if (payment === 'success' && orderNumber) {
      verifyPayment(orderNumber, transactionNo);
    } else if (payment === 'cancelled') {
      setPaymentResult('failed');
      toast({
        title: 'تم إلغاء الدفع',
        description: 'تم إلغاء عملية الدفع',
        variant: 'destructive',
      });
      // Clear URL params
      navigate('/dashboard/deposits', { replace: true });
    }
  }, [searchParams]);

  const verifyPayment = async (orderNumber: string, transactionNo: string | null) => {
    setVerifyingPayment(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('paylink-payment', {
        body: {
          action: 'verify-payment',
          orderNumber,
          transactionNo,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setPaymentResult('success');
        toast({
          title: 'تم الدفع بنجاح! 🎉',
          description: `تم إضافة ${data.amount || ''} ر.س إلى رصيدك`,
        });
        // Refresh deposits
        fetchDeposits();
      } else {
        setPaymentResult('failed');
        toast({
          title: 'فشل التحقق من الدفع',
          description: data?.message || 'يرجى التواصل مع الدعم إذا تم خصم المبلغ',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setPaymentResult('failed');
      toast({
        title: 'خطأ في التحقق',
        description: 'حدث خطأ أثناء التحقق من الدفع',
        variant: 'destructive',
      });
    } finally {
      setVerifyingPayment(false);
      // Clear URL params
      navigate('/dashboard/deposits', { replace: true });
    }
  };

  useEffect(() => {
    if (user) {
      fetchDeposits();

      // Real-time subscription
      const channel = supabase
        .channel('client-deposits')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'deposits',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchDeposits();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchDeposits = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('deposits')
      .select(`
        *,
        payment_method:payment_methods(name_ar, type)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setDeposits(data as Deposit[]);
      
      // Calculate stats
      const completed = data.filter(d => d.status === 'completed');
      const pending = data.filter(d => d.status === 'pending');
      
      setStats({
        totalDeposited: completed.reduce((sum, d) => sum + d.total_credited, 0),
        pendingCount: pending.length,
        completedCount: completed.length,
      });
    }

    setLoading(false);
  };

  const filteredDeposits = statusFilter === 'all' 
    ? deposits 
    : deposits.filter(d => d.status === statusFilter);

  // Show verifying payment screen
  if (verifyingPayment) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">جاري التحقق من الدفع...</h2>
            <p className="text-muted-foreground">يرجى الانتظار لحظات</p>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Payment Result Banner */}
        {paymentResult === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-l from-success/20 via-success/10 to-transparent border border-success/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-success">تم الدفع بنجاح! 🎉</h2>
                <p className="text-muted-foreground">تم إضافة الرصيد إلى حسابك</p>
              </div>
            </div>
          </motion.div>
        )}

        {paymentResult === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-l from-destructive/20 via-destructive/10 to-transparent border border-destructive/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-destructive">فشل الدفع</h2>
                <p className="text-muted-foreground">يرجى المحاولة مرة أخرى أو التواصل مع الدعم</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">سجل الإيداعات</h1>
            <p className="text-muted-foreground">عرض جميع طلبات الإيداع السابقة</p>
          </div>
          <Link to="/dashboard/deposit">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              إيداع جديد
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المودع</p>
                    <p className="text-xl font-bold text-primary">${stats.totalDeposited.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-warning/20 bg-gradient-to-l from-warning/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                    <p className="text-xl font-bold">{stats.pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-success/20 bg-gradient-to-l from-success/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">مكتملة</p>
                    <p className="text-xl font-bold">{stats.completedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {filteredDeposits.length} نتيجة
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Deposits List */}
        <Card>
          <CardHeader>
            <CardTitle>الإيداعات</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDeposits.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-4">لا توجد إيداعات</p>
                <Link to="/dashboard/deposit">
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    إيداع الآن
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeposits.map((deposit, index) => {
                  const status = statusConfig[deposit.status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <motion.div
                      key={deposit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            deposit.status === 'completed' ? "bg-success/10" : 
                            deposit.status === 'pending' ? "bg-warning/10" : "bg-destructive/10"
                          )}>
                            <StatusIcon className={cn(
                              "w-6 h-6",
                              deposit.status === 'completed' ? "text-success" : 
                              deposit.status === 'pending' ? "text-warning" : "text-destructive"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-lg">${deposit.amount.toFixed(2)}</span>
                              <Badge variant="outline" className={status.color}>
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <CreditCard className="w-3 h-3" />
                              <span>{deposit.payment_method?.name_ar || 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{format(new Date(deposit.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}</span>
                            </div>
                            {deposit.transaction_id && (
                              <p className="text-xs text-muted-foreground mt-1">
                                رقم المعاملة: {deposit.transaction_id}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-left">
                            {deposit.fee_amount && deposit.fee_amount > 0 && (
                              <p className="text-xs text-destructive">
                                - ${deposit.fee_amount.toFixed(2)} رسوم
                              </p>
                            )}
                            {deposit.bonus_amount && deposit.bonus_amount > 0 && (
                              <p className="text-xs text-success flex items-center gap-1">
                                <Gift className="w-3 h-3" />
                                + ${deposit.bonus_amount.toFixed(2)} بونص
                              </p>
                            )}
                            <p className="font-bold text-primary mt-1">
                              ${deposit.total_credited.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">سيضاف</span>
                            </p>
                          </div>
                          {deposit.status === 'completed' && deposit.completed_at && (
                            <p className="text-xs text-success">
                              تم التأكيد: {format(new Date(deposit.completed_at), 'dd MMM', { locale: ar })}
                            </p>
                          )}
                        </div>
                      </div>

                      {deposit.notes && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">ملاحظات:</span> {deposit.notes}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDeposits;
