import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShoppingCart, Loader2, CheckCircle, Sparkles, Link as LinkIcon, Hash } from "lucide-react";
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

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      link: "",
      quantity: 100,
      notes: "",
    },
  });

  const quantity = form.watch("quantity");
  const totalPrice = service ? (service.price * quantity).toFixed(2) : "0.00";

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
          total_price: service.price * data.quantity,
          notes: data.notes || null,
          link: data.link,
          quantity: data.quantity,
          order_number: "",
        } as any)
        .select("id, order_number")
        .single();

      if (error) throw error;

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
        // Don't fail the order, just log the warning
      }

      setOrderNumber(orderData.order_number);
      setOrderSuccess(true);
      form.reset();
      
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

                  {/* Total Price */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">الإجمالي:</span>
                      <span className="text-2xl font-bold text-primary">${totalPrice}</span>
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
