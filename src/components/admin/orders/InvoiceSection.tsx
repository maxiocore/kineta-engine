import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Send, Loader2, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface InvoiceSectionProps {
  orderId: string;
  orderNo: string;
  userEmail: string;
  userName?: string;
  userId: string;
  onInvoiceSent?: () => void;
}

export default function InvoiceSection({
  orderId,
  orderNo,
  userEmail,
  userName,
  userId,
  onInvoiceSent,
}: InvoiceSectionProps) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchInvoices();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`invoice-${orderId}`)
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

  const generateInvoiceNumber = () => {
    const date = new Date();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${random}`;
  };

  const sendInvoice = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "يرجى إدخال مبلغ صحيح", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const invoiceAmount = parseFloat(amount);

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('dev_order_invoices')
        .insert({
          order_id: orderId,
          invoice_number: invoiceNumber,
          amount: invoiceAmount,
          description: description || null,
          status: 'pending',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Update order status to invoice_sent
      await supabase
        .from('dev_orders')
        .update({ status: 'invoice_sent', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      // Add event to timeline
      await supabase.from('dev_order_events').insert({
        order_id: orderId,
        event_type: 'invoice_sent',
        actor_role: 'admin',
        message_text: `تم إرسال فاتورة بمبلغ ${invoiceAmount.toFixed(2)} ر.س - رقم الفاتورة: ${invoiceNumber}`,
        payload: { invoice_id: invoice.id, amount: invoiceAmount, invoice_number: invoiceNumber },
      });

      // Send email notification
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'invoice_sent',
          to: userEmail,
          data: {
            order_number: orderNo,
            invoice_number: invoiceNumber,
            amount: invoiceAmount,
            description: description,
            user_name: userName || 'العميل الكريم',
          },
        },
      });

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '📄 فاتورة جديدة',
        message: `تم إرسال فاتورة بمبلغ ${invoiceAmount.toFixed(2)} ر.س للطلب رقم ${orderNo}`,
        type: 'info',
      });

      setAmount("");
      setDescription("");
      toast({ title: "تم إرسال الفاتورة بنجاح" });
      onInvoiceSent?.();
    } catch (err: any) {
      console.error('Error sending invoice:', err);
      toast({ title: "خطأ في إرسال الفاتورة", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 border-0">مدفوعة</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-0">بانتظار الدفع</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-0">ملغاة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          إرسال فاتورة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Invoices */}
        {invoices.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">الفواتير السابقة</h4>
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {invoice.status === 'paid' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(invoice.created_at), "dd MMM yyyy", { locale: ar })}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-semibold">{invoice.amount.toFixed(2)} ر.س</p>
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Invoice Form */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">المبلغ (ر.س)</label>
            <Input
              type="number"
              placeholder="أدخل المبلغ"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">وصف الفاتورة (اختياري)</label>
            <Textarea
              placeholder="وصف تفصيلي للخدمة المقدمة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            onClick={sendInvoice}
            disabled={sending || !amount}
            className="w-full gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            إرسال الفاتورة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}