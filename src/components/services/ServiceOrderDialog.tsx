import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShoppingCart, Loader2, CheckCircle, Sparkles, Link as LinkIcon, Hash, Ticket, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const orderSchema = z.object({
  link: z.string().url("يرجى إدخال رابط صحيح").min(1, "الرابط مطلوب"),
  quantity: z.number().min(1, "الكمية يجب أن تكون 1 على الأقل").max(1000000, "الكمية كبيرة جداً"),
  notes: z.string().max(500, "الملاحظات يجب أن تكون أقل من 500 حرف").optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  features: string[];
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

interface ServiceOrderDialogProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

const ServiceOrderDialog = ({ service, open, onOpenChange, userId }: ServiceOrderDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      link: "",
      quantity: 100,
      notes: "",
    },
  });

  const quantity = form.watch("quantity");
  const basePrice = service ? service.price * quantity : 0;
  
  const calculateDiscount = () => {
    if (!appliedCoupon || !service) return 0;
    if (appliedCoupon.discount_type === "percentage") {
      return (basePrice * appliedCoupon.discount_value) / 100;
    }
    return Math.min(appliedCoupon.discount_value, basePrice);
  };

  const discount = calculateDiscount();
  const totalPrice = Math.max(0, basePrice - discount);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("يرجى إدخال كود الكوبون");
      return;
    }

    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("كود الكوبون غير صالح");
        return;
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("كود الكوبون منتهي الصلاحية");
        return;
      }

      // Check max uses
      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error("تم استنفاد عدد استخدامات الكوبون");
        return;
      }

      // Check minimum order amount
      if (data.min_order_amount > basePrice) {
        toast.error(`الحد الأدنى للطلب هو $${data.min_order_amount}`);
        return;
      }

      setAppliedCoupon(data as Coupon);
      toast.success("تم تطبيق الكوبون بنجاح!");
    } catch (error: any) {
      console.error("Error validating coupon:", error);
      toast.error("حدث خطأ أثناء التحقق من الكوبون");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success("تم إزالة الكوبون");
  };

  const onSubmit = async (data: OrderFormData) => {
    if (!service || !userId) return;

    setIsSubmitting(true);
    try {
      // Create order in database
      const { data: orderData, error } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          service_id: service.id,
          total_price: totalPrice,
          notes: data.notes || null,
          link: data.link,
          quantity: data.quantity,
          order_number: "",
          coupon_id: appliedCoupon?.id || null,
          discount_amount: discount,
        } as any)
        .select("id, order_number")
        .single();

      if (error) throw error;

      // Record coupon usage if applied
      if (appliedCoupon) {
        await supabase.from("coupon_usages").insert({
          coupon_id: appliedCoupon.id,
          user_id: userId,
          order_id: orderData.id,
          discount_applied: discount,
        });
      }

      // Send order to BulkFollows API
      const { error: apiError } = await supabase.functions.invoke('bulkfollows-order', {
        body: {
          orderId: orderData.id,
          serviceId: service.id,
          link: data.link,
          quantity: data.quantity,
        }
      });

      if (apiError) {
        console.warn('BulkFollows API error:', apiError);
      }

      setOrderNumber(orderData.order_number);
      setOrderSuccess(true);
      form.reset();
      setAppliedCoupon(null);
      setCouponCode("");
      
      toast.success("تم إنشاء الطلب بنجاح!");
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error("حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOrderSuccess(false);
    setOrderNumber(null);
    setAppliedCoupon(null);
    setCouponCode("");
    form.reset();
    onOpenChange(false);
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {orderSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-success" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">تم إنشاء الطلب بنجاح!</h3>
              <p className="text-muted-foreground mb-4">
                رقم الطلب: <span className="font-mono font-bold text-primary">{orderNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                سيتم معالجة طلبك تلقائياً
              </p>
              <Button onClick={handleClose} className="gap-2">
                <Sparkles className="w-4 h-4" />
                حسناً
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  طلب خدمة
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
                <h4 className="font-bold mb-1">{service.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{service.category}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground">السعر لكل 1000:</span>
                  <span className="text-lg font-bold text-primary">
                    ${service.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          الرابط
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://instagram.com/username"
                            dir="ltr"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          أدخل رابط الحساب أو المنشور
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          الكمية
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={1000000}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أضف أي تفاصيل أو متطلبات خاصة..."
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Coupon Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      كود الخصم
                    </label>
                    {appliedCoupon ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-sm flex-1">
                          تم تطبيق الكوبون: <code className="font-mono font-bold">{appliedCoupon.code}</code>
                          <span className="text-success mr-2">
                            (-{appliedCoupon.discount_type === "percentage" 
                              ? `${appliedCoupon.discount_value}%` 
                              : `$${appliedCoupon.discount_value}`})
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={removeCoupon}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="أدخل كود الخصم"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          dir="ltr"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={validateCoupon}
                          disabled={validatingCoupon}
                        >
                          {validatingCoupon ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "تطبيق"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Total Price */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">السعر الأساسي:</span>
                      <span>${basePrice.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-sm text-success">
                        <span>الخصم:</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-border/50">
                      <span className="text-sm text-muted-foreground">الإجمالي:</span>
                      <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري الطلب...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          تأكيد الطلب
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceOrderDialog;
