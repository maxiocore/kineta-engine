import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { payServiceOrder, payDesignOrder, payDevInvoice, newIdempotencyKey, walletErrorMessage } from "@/lib/walletPayments";
import { startPayment, paymentErrorText } from "@/lib/payments";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  CreditCard,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  Wallet,
  Zap,
  ArrowLeft,
  Sparkles,
  BanknoteIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  is_active: boolean;
  provider: string | null;
}

interface InvoicePaymentCardProps {
  orderId: string;
  orderNo: string;
  onPaymentComplete?: () => void;
}

export default function InvoicePaymentCard({
  orderId,
  orderNo,
  onPaymentComplete,
}: InvoicePaymentCardProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const payKeyRef = useRef(newIdempotencyKey());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [paymentStep, setPaymentStep] = useState<'methods' | 'confirm'>('methods');

  useEffect(() => {
    fetchInvoices();
    fetchUserBalance();
    fetchPaymentMethods();

    const channel = supabase
      .channel(`client-invoice-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dev_order_invoices',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('dev_order_invoices')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      setUserBalance(data?.balance || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    }
  };

  const handlePayWithBalance = async () => {
    if (!selectedInvoice || !user) return;

    if (userBalance < selectedInvoice.amount) {
      toast({
        title: "رصيد غير كافي",
        description: "يرجى شحن رصيدك أولاً",
        variant: "destructive",
      });
      return;
    }

    if (paying) return;
    setPaying(true);
    try {
      // Server-side payment: invoice amount, ownership and status are verified and charged atomically
      await payDevInvoice(selectedInvoice.id, payKeyRef.current);
      payKeyRef.current = newIdempotencyKey();

      setShowPayDialog(false);
      setSelectedInvoice(null);
      setPaymentStep('methods');
      toast({ title: "تم دفع الفاتورة بنجاح", description: "شكراً لك! سيتم البدء في تنفيذ طلبك" });
      fetchInvoices();
      fetchUserBalance();
      onPaymentComplete?.();
    } catch (err: any) {
      console.error('Error paying invoice:', err);
      toast({
        title: "خطأ في الدفع",
        description: walletErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setPaying(false);
    }
  };

  const openPayDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentStep('methods');
    setShowPayDialog(true);
  };

  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending');
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">جاري تحميل الفواتير...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return null;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {pendingInvoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-amber-500/50 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 shadow-lg shadow-amber-500/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Receipt className="h-5 w-5" />
                    </div>
                    فاتورة جديدة بانتظار الدفع
                  </CardTitle>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Badge className="bg-amber-500 text-white border-0 shadow-md">
                      <Zap className="h-3 w-3 ml-1" />
                      {pendingInvoices.length} فاتورة
                    </Badge>
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingInvoices.map((invoice) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-xl bg-white dark:bg-card border-2 border-amber-200 dark:border-amber-800 shadow-md"
                  >
                    <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-transparent rounded-br-full" />
                    
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                            <Receipt className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(invoice.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">المبلغ المطلوب</p>
                          <p className="font-bold text-2xl text-amber-600 dark:text-amber-400">
                            {invoice.amount.toLocaleString('ar-SA')} <span className="text-base">ر.س</span>
                          </p>
                        </div>
                      </div>

                      {invoice.description && (
                        <div className="mb-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                          {invoice.description}
                        </div>
                      )}

                      <Button
                        size="lg"
                        onClick={() => openPayDialog(invoice)}
                        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 text-lg h-14"
                      >
                        <Sparkles className="h-5 w-5" />
                        ادفع الآن
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {paidInvoices.length > 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400 text-base">
              <CheckCircle className="h-4 w-4" />
              الفواتير المدفوعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {paidInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 rounded-lg bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      تم الدفع في {format(new Date(invoice.paid_at!), "dd MMM yyyy", { locale: ar })}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-green-700">{invoice.amount.toLocaleString('ar-SA')} ر.س</p>
                  <Badge className="bg-green-100 text-green-700 border-0">مدفوعة</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={showPayDialog} onOpenChange={(open) => {
        setShowPayDialog(open);
        if (!open) setPaymentStep('methods');
      }}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              {paymentStep === 'methods' ? 'اختر طريقة الدفع' : 'تأكيد الدفع'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm">رقم الفاتورة</span>
                  <span className="font-mono font-medium">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">المبلغ المطلوب</span>
                  <span className="font-bold text-2xl text-primary">{selectedInvoice.amount.toLocaleString('ar-SA')} ر.س</span>
                </div>
              </div>

              {paymentStep === 'methods' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentStep('confirm')}
                    className="w-full p-4 rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 hover:border-primary/60 transition-all flex items-center gap-4 text-right"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">الدفع من رصيدي</p>
                      <p className="text-sm text-muted-foreground">
                        رصيدك الحالي: <span className={userBalance >= selectedInvoice.amount ? 'text-green-600 font-bold' : 'text-destructive font-bold'}>
                          {userBalance.toLocaleString('ar-SA')} ر.س
                        </span>
                      </p>
                    </div>
                    {userBalance >= selectedInvoice.amount ? (
                      <Badge className="bg-green-100 text-green-700 border-0">متاح</Badge>
                    ) : (
                      <Badge variant="destructive">غير كافي</Badge>
                    )}
                  </motion.button>

                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">أو طرق دفع أخرى</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={paying}
                    onClick={async () => {
                      if (paying) return;
                      setPaying(true);
                      try {
                        const pid = await startPayment('dev_invoice', { reference_id: selectedInvoice.id });
                        navigate(`/payment/${pid}`);
                      } catch (e: any) {
                        toast({ title: "خطأ في الدفع", description: paymentErrorText(e?.message), variant: "destructive" });
                      } finally { setPaying(false); }
                    }}
                    className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/40 bg-card hover:bg-muted/50 transition-all flex items-center gap-4 text-right"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">الدفع الإلكتروني</p>
                      <p className="text-xs text-muted-foreground">مدى · Visa · Mastercard</p>
                    </div>
                    {paying && <Loader2 className="h-4 w-4 animate-spin" />}
                  </motion.button>

                  {userBalance < selectedInvoice.amount && (
                    <Button
                      variant="outline"
                      onClick={() => navigate('/dashboard/deposit')}
                      className="w-full gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      شحن الرصيد الآن
                    </Button>
                  )}
                </motion.div>
              )}

              {paymentStep === 'confirm' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">طريقة الدفع</span>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="font-medium">رصيد الحساب</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">رصيدك الحالي</span>
                      <span className="font-bold text-green-600">{userBalance.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">المبلغ المطلوب</span>
                      <span className="font-bold text-destructive">-{selectedInvoice.amount.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-medium">الرصيد بعد الدفع</span>
                      <span className="font-bold text-primary">{(userBalance - selectedInvoice.amount).toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  </div>

                  {userBalance < selectedInvoice.amount && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">رصيدك غير كافي. يرجى شحن رصيدك أولاً</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPaymentStep('methods')}
                      className="flex-1"
                    >
                      رجوع
                    </Button>
                    <Button
                      onClick={handlePayWithBalance}
                      disabled={paying || userBalance < selectedInvoice.amount}
                      className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80"
                    >
                      {paying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      تأكيد الدفع
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}