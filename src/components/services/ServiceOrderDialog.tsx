import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ShoppingCart, 
  Loader2, 
  CheckCircle, 
  Sparkles, 
  Link as LinkIcon, 
  Hash, 
  Ticket, 
  X, 
  Check,
  Clock,
  Zap,
  Shield,
  Timer,
  Info,
  Copy,
  FileText,
  TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  features: any;
  external_service_id: string | null;
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
  const [copiedLink, setCopiedLink] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      link: "",
      quantity: 100,
      notes: "",
    },
  });

  const quantity = form.watch("quantity");
  const link = form.watch("link");
  const basePrice = service ? service.price * quantity : 0;
  
  // Parse features from service
  const getServiceFeatures = () => {
    if (!service?.features) return {};
    try {
      if (typeof service.features === 'string') {
        return JSON.parse(service.features);
      }
      return service.features;
    } catch {
      return {};
    }
  };

  const features = getServiceFeatures();
  const minQuantity = features.min || 10;
  const maxQuantity = features.max || 1000000;
  const averageTime = features.average_time || "1-24 ساعة";
  const speed = features.speed || "فوري";
  const guaranteed = features.refill !== false;
  
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

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("كود الكوبون منتهي الصلاحية");
        return;
      }

      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error("تم استنفاد عدد استخدامات الكوبون");
        return;
      }

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

  const copyExampleLink = () => {
    const exampleLinks: Record<string, string> = {
      "instagram": "https://instagram.com/username",
      "facebook": "https://facebook.com/page",
      "twitter": "https://twitter.com/username",
      "youtube": "https://youtube.com/watch?v=xxxxx",
      "tiktok": "https://tiktok.com/@username",
    };
    
    const category = service?.category.toLowerCase() || "";
    let example = "https://example.com/link";
    
    for (const [key, value] of Object.entries(exampleLinks)) {
      if (category.includes(key)) {
        example = value;
        break;
      }
    }
    
    navigator.clipboard.writeText(example);
    setCopiedLink(true);
    toast.success("تم نسخ مثال الرابط");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const onSubmit = async (data: OrderFormData) => {
    if (!service || !userId) return;

    // Validate quantity range
    if (data.quantity < minQuantity || data.quantity > maxQuantity) {
      toast.error(`الكمية يجب أن تكون بين ${minQuantity} و ${maxQuantity}`);
      return;
    }

    setIsSubmitting(true);
    try {
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <AnimatePresence mode="wait">
          {orderSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-success" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">تم إنشاء الطلب بنجاح!</h3>
              <p className="text-muted-foreground mb-2">
                رقم الطلب: <span className="font-mono font-bold text-primary text-lg">{orderNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                يمكنك متابعة حالة طلبك من لوحة التحكم
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleClose} variant="outline">
                  إغلاق
                </Button>
                <Button onClick={handleClose} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  متابعة الطلب
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row"
            >
              {/* Left Side - Order Form */}
              <div className="flex-1 p-6">
                <DialogHeader className="mb-6">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                    طلب خدمة جديد
                  </DialogTitle>
                </DialogHeader>

                {/* Service Info */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge className="mb-2">{service.category}</Badge>
                      <h4 className="font-bold text-lg mb-1">{service.name}</h4>
                      {service.external_service_id && (
                        <code className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          #{service.external_service_id}
                        </code>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">سعر 1000</p>
                      <p className="text-2xl font-bold text-primary">${service.price.toFixed(4)}</p>
                    </div>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {/* Link Field */}
                    <FormField
                      control={form.control}
                      name="link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            الرابط
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                placeholder="أدخل الرابط هنا..."
                                dir="ltr"
                                className="pr-10"
                                {...field}
                              />
                            </FormControl>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                    onClick={copyExampleLink}
                                  >
                                    {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>نسخ مثال الرابط</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormDescription className="text-xs">
                            أدخل رابط الحساب أو المنشور المراد الخدمة عليه
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quantity Field */}
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
                              min={minQuantity}
                              max={maxQuantity}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            الحد الأدنى: {minQuantity.toLocaleString()} - الحد الأقصى: {maxQuantity.toLocaleString()}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Notes Field */}
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
                            <code className="font-mono font-bold">{appliedCoupon.code}</code>
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
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2">
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
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-medium">الإجمالي:</span>
                        <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Submit Buttons */}
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
                            <CheckCircle className="w-4 h-4" />
                            تأكيد الطلب
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>

              {/* Right Side - Service Details Panel */}
              <div className="lg:w-80 bg-secondary/30 border-r border-border/50 p-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="details" className="text-xs">التفاصيل</TabsTrigger>
                    <TabsTrigger value="info" className="text-xs">معلومات</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-0">
                    {/* Example Link */}
                    <div className="p-3 rounded-lg bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">مثال الرابط</span>
                      </div>
                      <p className="text-xs text-muted-foreground break-all" dir="ltr">
                        {service.category.toLowerCase().includes("instagram") 
                          ? "https://instagram.com/p/xxxxx"
                          : service.category.toLowerCase().includes("facebook")
                          ? "https://facebook.com/post/xxxxx"
                          : service.category.toLowerCase().includes("youtube")
                          ? "https://youtube.com/watch?v=xxxxx"
                          : "https://example.com/link"}
                      </p>
                    </div>

                    {/* Service Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-warning" />
                        <p className="text-xs text-muted-foreground">وقت البدء</p>
                        <p className="font-bold text-sm">0-1 ساعة</p>
                      </div>

                      <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
                        <Zap className="w-5 h-5 mx-auto mb-1 text-accent" />
                        <p className="text-xs text-muted-foreground">السرعة</p>
                        <p className="font-bold text-sm">{speed}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
                        <Shield className={`w-5 h-5 mx-auto mb-1 ${guaranteed ? "text-success" : "text-destructive"}`} />
                        <p className="text-xs text-muted-foreground">ضمان التعويض</p>
                        <p className={`font-bold text-sm ${guaranteed ? "text-success" : "text-destructive"}`}>
                          {guaranteed ? "نعم ✓" : "لا ✗"}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
                        <Timer className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">متوسط الوقت</p>
                        <p className="font-bold text-sm">{averageTime}</p>
                      </div>
                    </div>

                    {/* Quantity Range */}
                    <div className="p-3 rounded-lg bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">نطاق الكمية</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الحد الأدنى:</span>
                        <span className="font-bold">{minQuantity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الحد الأقصى:</span>
                        <span className="font-bold">{maxQuantity.toLocaleString()}</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="info" className="space-y-4 mt-0">
                    {/* Description */}
                    <div className="p-3 rounded-lg bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">الوصف</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {service.description || "خدمة احترافية بجودة عالية وتسليم سريع. نضمن لك أفضل النتائج مع دعم فني متواصل."}
                      </p>
                    </div>

                    {/* Features */}
                    {Array.isArray(service.features) && service.features.length > 0 && (
                      <div className="p-3 rounded-lg bg-card border border-border/50">
                        <p className="text-sm font-medium mb-2">المميزات:</p>
                        <ul className="space-y-1">
                          {service.features.map((feature: string, index: number) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-3 h-3 text-success" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Important Notes */}
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-warning" />
                        ملاحظات هامة
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• تأكد من صحة الرابط قبل الطلب</li>
                        <li>• الحساب يجب أن يكون عام</li>
                        <li>• لا تغير اسم المستخدم أثناء التنفيذ</li>
                        <li>• التسليم يبدأ خلال 0-1 ساعة</li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceOrderDialog;
