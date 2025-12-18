import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  CreditCard, 
  ArrowLeft, 
  Check, 
  Info,
  Loader2,
  Gift,
  Percent,
} from 'lucide-react';
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  instructions: string | null;
  instructions_ar: string | null;
  min_amount: number | null;
  max_amount: number | null;
  extra_fee_type: string | null;
  extra_fee_value: number | null;
  is_active: boolean;
}

interface PaymentBonus {
  id: string;
  payment_method_id: string | null;
  min_amount: number;
  max_amount: number | null;
  bonus_type: string;
  bonus_value: number;
  is_active: boolean;
}

const presetAmounts = [10, 25, 50, 100, 250, 500];

const ClientDeposit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bonuses, setBonuses] = useState<PaymentBonus[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [methodsRes, bonusesRes, balanceRes] = await Promise.all([
      supabase.from('payment_methods').select('*').eq('is_active', true).order('display_order'),
      supabase.from('payment_bonuses').select('*').eq('is_active', true),
      supabase.from('user_balances').select('balance').eq('user_id', user.id).single(),
    ]);

    if (methodsRes.data) setPaymentMethods(methodsRes.data);
    if (bonusesRes.data) setBonuses(bonusesRes.data);
    if (balanceRes.data) setCurrentBalance(balanceRes.data.balance);

    setLoading(false);
  };

  const calculateFee = (baseAmount: number): number => {
    if (!selectedMethod || !selectedMethod.extra_fee_value) return 0;
    
    if (selectedMethod.extra_fee_type === 'percentage') {
      return (baseAmount * selectedMethod.extra_fee_value) / 100;
    }
    return selectedMethod.extra_fee_value;
  };

  const calculateBonus = (baseAmount: number): number => {
    const applicableBonuses = bonuses.filter(b => {
      const matchesMethod = !b.payment_method_id || b.payment_method_id === selectedMethod?.id;
      const meetsMin = baseAmount >= b.min_amount;
      const meetsMax = !b.max_amount || baseAmount <= b.max_amount;
      return matchesMethod && meetsMin && meetsMax;
    });

    if (applicableBonuses.length === 0) return 0;

    // Get the best bonus
    const bestBonus = applicableBonuses.reduce((best, current) => {
      const currentValue = current.bonus_type === 'percentage' 
        ? (baseAmount * current.bonus_value) / 100 
        : current.bonus_value;
      const bestValue = best.bonus_type === 'percentage' 
        ? (baseAmount * best.bonus_value) / 100 
        : best.bonus_value;
      return currentValue > bestValue ? current : best;
    });

    return bestBonus.bonus_type === 'percentage' 
      ? (baseAmount * bestBonus.bonus_value) / 100 
      : bestBonus.bonus_value;
  };

  const numericAmount = parseFloat(amount) || 0;
  const fee = calculateFee(numericAmount);
  const bonus = calculateBonus(numericAmount);
  const totalCredited = numericAmount - fee + bonus;

  const handleSubmit = async () => {
    if (!user || !selectedMethod || numericAmount <= 0) return;

    if (selectedMethod.min_amount && numericAmount < selectedMethod.min_amount) {
      toast({
        title: 'خطأ',
        description: `الحد الأدنى للإيداع هو $${selectedMethod.min_amount}`,
        variant: 'destructive',
      });
      return;
    }

    if (selectedMethod.max_amount && numericAmount > selectedMethod.max_amount) {
      toast({
        title: 'خطأ',
        description: `الحد الأقصى للإيداع هو $${selectedMethod.max_amount}`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('deposits').insert({
      user_id: user.id,
      payment_method_id: selectedMethod.id,
      amount: numericAmount,
      fee_amount: fee,
      bonus_amount: bonus,
      total_credited: totalCredited,
      transaction_id: transactionId || null,
      notes: notes || null,
      status: 'pending',
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء طلب الإيداع',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'تم إرسال طلب الإيداع',
      description: 'سيتم مراجعة طلبك وإضافة الرصيد بعد التأكيد',
    });

    // Reset form
    setAmount('');
    setTransactionId('');
    setNotes('');
    setSelectedMethod(null);
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">إيداع رصيد</h1>
            <p className="text-muted-foreground">أضف رصيد إلى حسابك</p>
          </div>
          <Card className="px-4 py-2 bg-gradient-to-l from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">رصيدك الحالي</p>
                <p className="text-lg font-bold text-primary">${currentBalance.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  اختر طريقة الدفع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <motion.div
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMethod(method)}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedMethod?.id === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          selectedMethod?.id === method.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                        )}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{method.name_ar}</p>
                          <p className="text-xs text-muted-foreground">{method.type}</p>
                        </div>
                        {selectedMethod?.id === method.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      {method.extra_fee_value && method.extra_fee_value > 0 && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          رسوم: {method.extra_fee_type === 'percentage' ? `${method.extra_fee_value}%` : `$${method.extra_fee_value}`}
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Enter Amount */}
            {selectedMethod && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      أدخل المبلغ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preset amounts */}
                    <div className="flex flex-wrap gap-2">
                      {presetAmounts.map((preset) => (
                        <Button
                          key={preset}
                          variant={amount === preset.toString() ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAmount(preset.toString())}
                        >
                          ${preset}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label>المبلغ ($)</Label>
                      <Input
                        type="number"
                        placeholder="أدخل المبلغ"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={selectedMethod.min_amount || 1}
                        max={selectedMethod.max_amount || undefined}
                      />
                      {(selectedMethod.min_amount || selectedMethod.max_amount) && (
                        <p className="text-xs text-muted-foreground">
                          {selectedMethod.min_amount && `الحد الأدنى: $${selectedMethod.min_amount}`}
                          {selectedMethod.min_amount && selectedMethod.max_amount && ' - '}
                          {selectedMethod.max_amount && `الحد الأقصى: $${selectedMethod.max_amount}`}
                        </p>
                      )}
                    </div>

                    {/* Bonuses info */}
                    {bonuses.length > 0 && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <div className="flex items-center gap-2 text-success mb-2">
                          <Gift className="w-4 h-4" />
                          <span className="font-medium text-sm">بونص الإيداع</span>
                        </div>
                        <div className="space-y-1">
                          {bonuses.filter(b => !b.payment_method_id || b.payment_method_id === selectedMethod.id).map((b) => (
                            <p key={b.id} className="text-xs text-muted-foreground">
                              أودع ${b.min_amount}+ واحصل على {b.bonus_type === 'percentage' ? `${b.bonus_value}%` : `$${b.bonus_value}`} بونص
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Payment Details */}
            {selectedMethod && numericAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      تفاصيل الدفع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Instructions */}
                    {selectedMethod.instructions_ar && (
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <div className="flex items-start gap-2">
                          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm mb-2">تعليمات الدفع:</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {selectedMethod.instructions_ar}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>رقم المعاملة / Transaction ID (اختياري)</Label>
                      <Input
                        placeholder="أدخل رقم المعاملة"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>ملاحظات (اختياري)</Label>
                      <Textarea
                        placeholder="أي ملاحظات إضافية..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>ملخص الإيداع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المبلغ</span>
                    <span className="font-medium">${numericAmount.toFixed(2)}</span>
                  </div>
                  
                  {fee > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>رسوم الدفع</span>
                      <span>-${fee.toFixed(2)}</span>
                    </div>
                  )}

                  {bonus > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        بونص
                      </span>
                      <span>+${bonus.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">سيضاف لرصيدك</span>
                      <span className="text-xl font-bold text-primary">${totalCredited.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  disabled={!selectedMethod || numericAmount <= 0 || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowLeft className="w-4 h-4" />
                  )}
                  إرسال طلب الإيداع
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  سيتم مراجعة طلبك وإضافة الرصيد خلال 24 ساعة
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDeposit;
