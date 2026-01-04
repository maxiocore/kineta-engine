import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  CreditCard,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    fetchInvoices();
    fetchUserBalance();

    // Subscribe to realtime updates
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
        .single();

      setUserBalance(data?.balance || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const handlePayInvoice = async () => {
    if (!selectedInvoice || !user) return;

    if (userBalance < selectedInvoice.amount) {
      toast({
        title: "رصيد غير كافي",
        description: "يرجى شحن رصيدك أولاً",
        variant: "destructive",
      });
      return;
    }

    setPaying(true);
    try {
      // Get current balance
      const { data: currentBalance, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance, total_spent')
        .eq('user_id', user.id)
        .single();

      if (balanceError || !currentBalance) {
        throw new Error('خطأ في جلب الرصيد');
      }

      if (currentBalance.balance < selectedInvoice.amount) {
        throw new Error('رصيد غير كافي');
      }

      // Deduct from user balance
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({
          balance: currentBalance.balance - selectedInvoice.amount,
          total_spent: currentBalance.total_spent + selectedInvoice.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update invoice status
      const { error: invoiceError } = await supabase
        .from('dev_order_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: 'balance',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedInvoice.id);

      if (invoiceError) throw invoiceError;

      // Update order status to in_progress
      await supabase
        .from('dev_orders')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      // Add event to timeline
      await supabase.from('dev_order_events').insert({
        order_id: orderId,
        event_type: 'payment_received',
        actor_role: 'user',
        actor_id: user.id,
        message_text: `تم دفع الفاتورة رقم ${selectedInvoice.invoice_number} بمبلغ ${selectedInvoice.amount.toFixed(2)} ر.س`,
        payload: { invoice_id: selectedInvoice.id, amount: selectedInvoice.amount },
      });

      // Log balance change
      await supabase.from('balance_logs').insert({
        user_id: user.id,
        action_type: 'order',
        amount: -selectedInvoice.amount,
        balance_before: userBalance,
        balance_after: userBalance - selectedInvoice.amount,
        reference_type: 'invoice',
        reference_id: selectedInvoice.id,
        notes: `دفع فاتورة رقم ${selectedInvoice.invoice_number} للطلب ${orderNo}`,
      });

      // Create admin notification
      await supabase.from('admin_notifications').insert({
        title: '💰 تم دفع فاتورة',
        message: `قام ${profile?.full_name || 'العميل'} بدفع فاتورة بمبلغ ${selectedInvoice.amount.toFixed(2)} ر.س للطلب ${orderNo}`,
        type: 'success',
        related_order_id: null, // Can't use dev_order_id here due to FK constraint
        metadata: { order_id: orderId, invoice_id: selectedInvoice.id },
      });

      setShowPayDialog(false);
      setSelectedInvoice(null);
      toast({ title: "تم دفع الفاتورة بنجاح" });
      fetchInvoices();
      fetchUserBalance();
      onPaymentComplete?.();
    } catch (err: any) {
      console.error('Error paying invoice:', err);
      toast({
        title: "خطأ في الدفع",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPaying(false);
    }
  };

  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending');
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
      <Card className={pendingInvoices.length > 0 ? "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            الفواتير
            {pendingInvoices.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 mr-2">
                {pendingInvoices.length} بانتظار الدفع
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Pending Invoices */}
          {pendingInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">{invoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(invoice.created_at), "dd MMM yyyy", { locale: ar })}
                  </p>
                  {invoice.description && (
                    <p className="text-xs text-muted-foreground mt-1">{invoice.description}</p>
                  )}
                </div>
              </div>
              <div className="text-left flex flex-col items-end gap-2">
                <p className="font-bold text-lg">{invoice.amount.toFixed(2)} ر.س</p>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setShowPayDialog(true);
                  }}
                  className="gap-1"
                >
                  <CreditCard className="h-4 w-4" />
                  ادفع الآن
                </Button>
              </div>
            </div>
          ))}

          {/* Paid Invoices */}
          {paidInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
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
                <p className="font-semibold text-green-700">{invoice.amount.toFixed(2)} ر.س</p>
                <Badge className="bg-green-100 text-green-700 border-0">مدفوعة</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              تأكيد الدفع
            </DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم الفاتورة:</span>
                  <span className="font-mono">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ:</span>
                  <span className="font-bold text-lg">{selectedInvoice.amount.toFixed(2)} ر.س</span>
                </div>
                {selectedInvoice.description && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-sm">{selectedInvoice.description}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <span>رصيدك الحالي:</span>
                <span className={`font-bold ${userBalance < selectedInvoice.amount ? 'text-destructive' : 'text-green-600'}`}>
                  {userBalance.toFixed(2)} ر.س
                </span>
              </div>

              {userBalance < selectedInvoice.amount && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">رصيدك غير كافي. يرجى شحن رصيدك أولاً</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handlePayInvoice}
              disabled={paying || (selectedInvoice && userBalance < selectedInvoice.amount)}
            >
              {paying ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CreditCard className="h-4 w-4 ml-2" />
              )}
              تأكيد الدفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}