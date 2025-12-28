import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download,
  FileText,
  TrendingUp,
  Eye,
  Receipt,
  Hash,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { generateDepositReceipt } from '@/lib/pdfTemplates';

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

interface Profile {
  full_name: string | null;
  email: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bgGradient: string }> = {
  pending: { 
    label: 'قيد المراجعة', 
    color: 'bg-warning/10 text-warning border-warning/20', 
    icon: Clock,
    bgGradient: 'from-warning/20 to-warning/5'
  },
  completed: { 
    label: 'مكتمل', 
    color: 'bg-success/10 text-success border-success/20', 
    icon: CheckCircle,
    bgGradient: 'from-success/20 to-success/5'
  },
  rejected: { 
    label: 'مرفوض', 
    color: 'bg-destructive/10 text-destructive border-destructive/20', 
    icon: XCircle,
    bgGradient: 'from-destructive/20 to-destructive/5'
  },
  cancelled: { 
    label: 'ملغي', 
    color: 'bg-muted text-muted-foreground border-border', 
    icon: XCircle,
    bgGradient: 'from-muted/50 to-muted/20'
  },
};

const ClientDepositsContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalDeposited: 0,
    pendingCount: 0,
    completedCount: 0,
    thisMonthTotal: 0,
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  // Generate PDF Invoice - Arabic Bank Receipt Style
  const generatePDF = useCallback((deposit: Deposit) => {
    generateDepositReceipt({
      id: deposit.id,
      amount: deposit.amount,
      bonus_amount: deposit.bonus_amount || undefined,
      fee_amount: deposit.fee_amount || undefined,
      total_credited: deposit.total_credited,
      status: deposit.status,
      payment_method: deposit.payment_method?.name_ar || undefined,
      transaction_id: deposit.transaction_id || undefined,
      created_at: deposit.created_at,
      completed_at: deposit.completed_at || undefined,
      user_name: profile?.full_name || undefined,
      user_email: profile?.email || user?.email || undefined,
    });
    
    sonnerToast.success('تم تحميل الإيصال بنجاح');
  }, [profile, user]);

  // Verify payment function
  const verifyPayment = async (orderNumber: string, transactionNo: string | null) => {
    setVerifyingPayment(true);
    setLoading(false);
    
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
      } else {
        setPaymentResult('failed');
        toast({
          title: 'فشل التحقق من الدفع',
          description: data?.message || 'يرجى التواصل مع الدعم إذا تم خصم المبلغ',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setPaymentResult('failed');
      toast({
        title: 'خطأ في التحقق',
        description: error.message || 'حدث خطأ أثناء التحقق من الدفع',
        variant: 'destructive',
      });
    } finally {
      setVerifyingPayment(false);
      navigate('/dashboard/financial', { replace: true });
    }
  };

  // Handle payment callback
  useEffect(() => {
    const payment = searchParams.get('payment');
    const orderNumber = searchParams.get('orderNumber');
    const transactionNo = searchParams.get('transactionNo');

    if (payment === 'success' && orderNumber && !verifyingPayment && paymentResult === null) {
      verifyPayment(orderNumber, transactionNo);
    } else if (payment === 'cancelled') {
      setPaymentResult('failed');
      toast({
        title: 'تم إلغاء الدفع',
        description: 'تم إلغاء عملية الدفع',
        variant: 'destructive',
      });
      navigate('/dashboard/financial', { replace: true });
    }
  }, []);

  // Fetch deposits
  useEffect(() => {
    if (user && !verifyingPayment) {
      fetchDeposits();

      const channel = supabase
        .channel('client-deposits-content')
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
  }, [user, verifyingPayment]);

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
      
      const completed = data.filter(d => d.status === 'completed');
      const pending = data.filter(d => d.status === 'pending');
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthDeposits = completed.filter(d => new Date(d.created_at) >= thisMonth);
      
      setStats({
        totalDeposited: completed.reduce((sum, d) => sum + d.total_credited, 0),
        pendingCount: pending.length,
        completedCount: completed.length,
        thisMonthTotal: thisMonthDeposits.reduce((sum, d) => sum + d.total_credited, 0),
      });
    }

    setLoading(false);
  };

  const filteredDeposits = statusFilter === 'all' 
    ? deposits 
    : deposits.filter(d => d.status === statusFilter);

  if (verifyingPayment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
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
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6" dir="rtl">
      {/* Payment Result Banner */}
      <AnimatePresence>
        {paymentResult === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-l from-success/20 via-success/10 to-transparent border border-success/30"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-success/20 flex items-center justify-center">
                <PartyPopper className="w-6 h-6 md:w-8 md:h-8 text-success" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-success">تم الدفع بنجاح! 🎉</h2>
                <p className="text-xs md:text-base text-muted-foreground">تم إضافة الرصيد إلى حسابك</p>
              </div>
            </div>
          </motion.div>
        )}

        {paymentResult === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-l from-destructive/20 via-destructive/10 to-transparent border border-destructive/30"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-destructive">فشل الدفع</h2>
                <p className="text-xs md:text-base text-muted-foreground">يرجى المحاولة مرة أخرى</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground">سجل الإيداعات</h2>
          <p className="text-xs md:text-sm text-muted-foreground">عرض جميع طلبات الإيداع السابقة والفواتير</p>
        </div>
        <Link to="/dashboard/deposit">
          <Button className="gap-2 w-full md:w-auto h-9 md:h-10 text-sm">
            <Plus className="w-4 h-4" />
            إيداع جديد
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground">إجمالي المودع</p>
                <p className="text-base md:text-xl font-bold text-primary">{stats.totalDeposited.toFixed(2)} ر.س</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground">هذا الشهر</p>
                <p className="text-base md:text-xl font-bold">{stats.thisMonthTotal.toFixed(2)} ر.س</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-2">
              <div className="w-8 h-8 rounded-xl bg-warning/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground">قيد المراجعة</p>
                <p className="text-base md:text-xl font-bold">{stats.pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-2">
              <div className="w-8 h-8 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground">مكتملة</p>
                <p className="text-base md:text-xl font-bold">{stats.completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] md:w-[180px] h-9">
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
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredDeposits.length} نتيجة
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Deposits List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            سجل الإيداعات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
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
            <div className="space-y-3">
              {filteredDeposits.map((deposit, index) => {
                const status = statusConfig[deposit.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={deposit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-3 md:p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br",
                          status.bgGradient
                        )}>
                          <StatusIcon className={cn(
                            "w-5 h-5 md:w-6 md:h-6",
                            deposit.status === 'completed' ? "text-success" : 
                            deposit.status === 'pending' ? "text-warning" : "text-destructive"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-base md:text-lg">{deposit.amount.toFixed(2)} ر.س</span>
                            <Badge variant="outline" className={cn("text-[10px] md:text-xs", status.color)}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                            <CreditCard className="w-3 h-3" />
                            <span>{deposit.payment_method?.name_ar || 'غير محدد'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] md:text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(deposit.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                        <div className="text-left sm:text-right">
                          {deposit.fee_amount && deposit.fee_amount > 0 && (
                            <p className="text-[10px] md:text-xs text-destructive">
                              - {deposit.fee_amount.toFixed(2)} ر.س رسوم
                            </p>
                          )}
                          {deposit.bonus_amount && deposit.bonus_amount > 0 && (
                            <p className="text-[10px] md:text-xs text-success flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              + {deposit.bonus_amount.toFixed(2)} ر.س بونص
                            </p>
                          )}
                          <p className="font-bold text-primary text-sm md:text-base">
                            {deposit.total_credited.toFixed(2)} ر.س
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 opacity-60 hover:opacity-100"
                            onClick={() => {
                              setSelectedDeposit(deposit);
                              setShowInvoiceDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {deposit.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 opacity-60 hover:opacity-100 hover:text-primary"
                              onClick={() => generatePDF(deposit)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {(deposit.transaction_id || deposit.notes) && (
                      <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                        {deposit.transaction_id && (
                          <p className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            رقم المعاملة: {deposit.transaction_id}
                          </p>
                        )}
                        {deposit.notes && (
                          <p className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {deposit.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              تفاصيل الإيداع
            </DialogTitle>
          </DialogHeader>
          
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">KINETA</h3>
                    <p className="text-xs opacity-80">فاتورة إيداع</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs opacity-80">رقم الفاتورة</p>
                    <p className="font-mono text-sm">INV-{selectedDeposit.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">الحالة</span>
                <Badge className={statusConfig[selectedDeposit.status]?.color}>
                  {statusConfig[selectedDeposit.status]?.label}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    تاريخ الإيداع
                  </span>
                  <span className="text-sm font-medium">
                    {format(new Date(selectedDeposit.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    طريقة الدفع
                  </span>
                  <span className="text-sm font-medium">
                    {selectedDeposit.payment_method?.name_ar || 'غير محدد'}
                  </span>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>مبلغ الإيداع</span>
                    <span>{selectedDeposit.amount.toFixed(2)} ر.س</span>
                  </div>
                  {selectedDeposit.fee_amount && selectedDeposit.fee_amount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>الرسوم</span>
                      <span>-{selectedDeposit.fee_amount.toFixed(2)} ر.س</span>
                    </div>
                  )}
                  {selectedDeposit.bonus_amount && selectedDeposit.bonus_amount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>البونص</span>
                      <span>+{selectedDeposit.bonus_amount.toFixed(2)} ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-lg">
                    <span>الإجمالي المضاف</span>
                    <span className="text-primary">{selectedDeposit.total_credited.toFixed(2)} ر.س</span>
                  </div>
                </div>
              </div>

              {selectedDeposit.status === 'completed' && (
                <Button onClick={() => generatePDF(selectedDeposit)} className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  تحميل الفاتورة PDF
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDepositsContent;
