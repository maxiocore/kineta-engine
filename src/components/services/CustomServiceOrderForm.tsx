import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, FileText, DollarSign, Send, CreditCard, Calendar, Loader2, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

const customOrderSchema = z.object({
  customerName: z.string().trim().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل').max(100, 'الاسم طويل جداً'),
  whatsappNumber: z.string().trim().regex(/^(\+?966|0)?5\d{8}$/, 'رقم واتساب غير صحيح'),
  orderDetails: z.string().trim().min(20, 'التفاصيل يجب أن تكون 20 حرفاً على الأقل').max(2000, 'التفاصيل طويلة جداً'),
  amount: z.number().min(50, 'الحد الأدنى للمبلغ 50 ر.س').max(100000, 'الحد الأقصى 100,000 ر.س'),
});

interface CustomServiceOrderFormProps {
  serviceId: string;
  serviceName: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const CustomServiceOrderForm = ({ serviceId, serviceName, onSuccess, onClose }: CustomServiceOrderFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'paylink' | 'tamara'>('balance');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    customerName: '',
    whatsappNumber: '',
    orderDetails: '',
    amount: '',
  });

  const validateForm = () => {
    try {
      customOrderSchema.parse({
        ...formData,
        amount: parseFloat(formData.amount) || 0,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const amount = parseFloat(formData.amount);

    try {
      if (paymentMethod === 'balance') {
        // Check user balance
        const { data: balanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (balanceError || !balanceData || balanceData.balance < amount) {
          toast({
            title: 'رصيد غير كافٍ',
            description: `رصيدك الحالي ${balanceData?.balance || 0} ر.س وتحتاج ${amount} ر.س`,
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }

        // Deduct balance
        await supabase
          .from('user_balances')
          .update({ 
            balance: balanceData.balance - amount,
            total_spent: (balanceData as any).total_spent + amount 
          })
          .eq('user_id', user.id);

        // Create order
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            service_id: serviceId,
            total_price: amount,
            status: 'pending',
            notes: `اسم العميل: ${formData.customerName}\nواتساب: ${formData.whatsappNumber}\n\nتفاصيل الطلب:\n${formData.orderDetails}`,
            order_number: `ORD-${Date.now()}`,
          });

        if (orderError) throw orderError;

        // Log balance change
        await supabase.from('balance_logs').insert({
          user_id: user.id,
          action_type: 'order',
          amount: -amount,
          balance_before: balanceData.balance,
          balance_after: balanceData.balance - amount,
          notes: `طلب خدمة مخصصة: ${formData.customerName}`,
        });

        toast({
          title: 'تم إنشاء الطلب بنجاح',
          description: 'سيتم التواصل معك قريباً عبر الواتساب',
        });

        onSuccess?.();
        onClose?.();

      } else if (paymentMethod === 'paylink') {
        // Paylink payment
        const { data, error } = await supabase.functions.invoke('paylink-payment', {
          body: {
            amount,
            clientName: formData.customerName,
            clientMobile: formData.whatsappNumber,
            orderNumber: `CUSTOM-${Date.now()}`,
            callBackUrl: `${window.location.origin}/dashboard/orders`,
            products: [{
              title: serviceName,
              price: amount,
              qty: 1,
            }],
          },
        });

        if (error || !data?.url) {
          throw new Error('فشل في إنشاء رابط الدفع');
        }

        // Create pending order
        await supabase.from('orders').insert({
          user_id: user.id,
          service_id: serviceId,
          total_price: amount,
          status: 'pending',
          notes: `اسم العميل: ${formData.customerName}\nواتساب: ${formData.whatsappNumber}\n\nتفاصيل الطلب:\n${formData.orderDetails}\n\nطريقة الدفع: Paylink`,
          order_number: `ORD-${Date.now()}`,
        });

        window.location.href = data.url;

      } else if (paymentMethod === 'tamara') {
        // Tamara installment payment
        const { data, error } = await supabase.functions.invoke('tamara-payment', {
          body: {
            amount,
            currency: 'SAR',
            description: `طلب خدمة مخصصة: ${serviceName}`,
            customerName: formData.customerName,
            customerPhone: formData.whatsappNumber,
            items: [{
              name: serviceName,
              quantity: 1,
              unit_price: { amount, currency: 'SAR' },
              total_amount: { amount, currency: 'SAR' },
            }],
          },
        });

        if (error || !data?.checkout_url) {
          throw new Error('فشل في إنشاء طلب التقسيط');
        }

        // Create pending order
        await supabase.from('orders').insert({
          user_id: user.id,
          service_id: serviceId,
          total_price: amount,
          status: 'pending',
          notes: `اسم العميل: ${formData.customerName}\nواتساب: ${formData.whatsappNumber}\n\nتفاصيل الطلب:\n${formData.orderDetails}\n\nطريقة الدفع: تمارا (تقسيط)`,
          order_number: `ORD-${Date.now()}`,
        });

        window.location.href = data.checkout_url;
      }

    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إنشاء الطلب',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="glass border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{serviceName}</CardTitle>
          <CardDescription>
            أدخل تفاصيل طلبك وسيتم التواصل معك لتأكيد التفاصيل والسعر
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                اسم العميل
              </Label>
              <Input
                id="customerName"
                placeholder="أدخل اسمك الكامل"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="bg-secondary/50 border-border/50"
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName}</p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-success" />
                رقم الواتساب
              </Label>
              <Input
                id="whatsappNumber"
                placeholder="05XXXXXXXX"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="bg-secondary/50 border-border/50"
                dir="ltr"
              />
              {errors.whatsappNumber && (
                <p className="text-sm text-destructive">{errors.whatsappNumber}</p>
              )}
            </div>

            {/* Order Details */}
            <div className="space-y-2">
              <Label htmlFor="orderDetails" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                تفاصيل الطلب
              </Label>
              <Textarea
                id="orderDetails"
                placeholder="اشرح متطلباتك بالتفصيل: نوع المشروع، الميزات المطلوبة، الموعد النهائي..."
                value={formData.orderDetails}
                onChange={(e) => setFormData({ ...formData, orderDetails: e.target.value })}
                className="bg-secondary/50 border-border/50 min-h-[120px]"
                rows={5}
              />
              {errors.orderDetails && (
                <p className="text-sm text-destructive">{errors.orderDetails}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-warning" />
                المبلغ المتفق عليه (ر.س)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="أدخل المبلغ المتفق عليه"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-secondary/50 border-border/50"
                dir="ltr"
                min="50"
                step="0.01"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
              <p className="text-xs text-muted-foreground">
                * يجب تحديد المبلغ بناءً على الاتفاق المسبق مع فريقنا
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                طريقة الدفع
              </Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                <Label
                  htmlFor="balance"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'balance'
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="balance" id="balance" />
                  <div>
                    <p className="font-medium">الرصيد</p>
                    <p className="text-xs text-muted-foreground">الدفع من رصيدك</p>
                  </div>
                </Label>

                <Label
                  htmlFor="paylink"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'paylink'
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="paylink" id="paylink" />
                  <div>
                    <p className="font-medium">Paylink</p>
                    <p className="text-xs text-muted-foreground">بطاقة / Apple Pay</p>
                  </div>
                </Label>

                <Label
                  htmlFor="tamara"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'tamara'
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="tamara" id="tamara" />
                  <div>
                    <p className="font-medium">تمارا</p>
                    <p className="text-xs text-muted-foreground">تقسيط بدون فوائد</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {/* Tamara Info */}
            {paymentMethod === 'tamara' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-xl bg-accent/10 border border-accent/30"
              >
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-medium text-accent">التقسيط عبر تمارا</p>
                    <p className="text-sm text-muted-foreground">
                      قسّم مبلغ {formData.amount || '---'} ر.س على 4 دفعات بدون فوائد
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              {onClose && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    إرسال الطلب
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CustomServiceOrderForm;
