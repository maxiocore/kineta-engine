import { useState, useEffect, useMemo } from "react";
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
  TrendingUp,
  AlertCircle,
  ChevronDown,
  Gauge,
  Calendar,
  Package,
  RefreshCw
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
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  quantity: z.number().min(1, "الكمية يجب أن تكون 1 على الأقل").max(10000000, "الكمية كبيرة جداً"),
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

// Quantity presets
const quantityPresets = [100, 500, 1000, 5000, 10000, 50000];

const ServiceOrderDialog = ({ service, open, onOpenChange, userId }: ServiceOrderDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [relatedServices, setRelatedServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

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

  // Fetch related services in same category
  useEffect(() => {
    const fetchRelatedServices = async () => {
      if (!service?.category) return;
      
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("category", service.category)
        .eq("status", "active")
        .order("price", { ascending: true });
      
      if (data) {
        setRelatedServices(data);
      }
    };

    if (open && service) {
      fetchRelatedServices();
      setSelectedServiceId(service.id);
    }
  }, [open, service?.category, service?.id]);

  // Get current selected service
  const currentService = useMemo(() => {
    if (selectedServiceId && relatedServices.length > 0) {
      return relatedServices.find(s => s.id === selectedServiceId) || service;
    }
    return service;
  }, [selectedServiceId, relatedServices, service]);

  const basePrice = currentService ? currentService.price * quantity : 0;
  
  // Parse features from service
  const getServiceFeatures = () => {
    if (!currentService?.features) return {};
    try {
      if (typeof currentService.features === 'string') {
        return JSON.parse(currentService.features);
      }
      return currentService.features;
    } catch {
      return {};
    }
  };

  const features = getServiceFeatures();
  const minQuantity = features.min || 10;
  const maxQuantity = features.max || 1000000;
  const ratePerHour = features.rate || 10000; // Default rate per hour
  const averageTime = features.average_time || "1-24 ساعة";
  const speed = features.speed || "فوري";
  const guaranteed = features.refill !== false;
  const dripfeed = features.dripfeed || false;
  const cancel = features.cancel || false;

  // Calculate estimated delivery time based on quantity and rate
  const estimatedDeliveryTime = useMemo(() => {
    const rate = ratePerHour || 10000;
    const hours = Math.ceil(quantity / rate);
    
    if (hours < 1) return "أقل من ساعة";
    if (hours === 1) return "ساعة واحدة";
    if (hours < 24) return `${hours} ساعة`;
    
    const days = Math.ceil(hours / 24);
    if (days === 1) return "يوم واحد";
    if (days === 2) return "يومان";
    if (days <= 10) return `${days} أيام`;
    return `${days} يوم`;
  }, [quantity, ratePerHour]);

  // Calculate delivery progress percentage (visual only)
  const deliveryProgress = useMemo(() => {
    const rate = ratePerHour || 10000;
    const hours = quantity / rate;
    // Max out at 100 hours for visual purposes
    return Math.min((hours / 100) * 100, 100);
  }, [quantity, ratePerHour]);
  
  const calculateDiscount = () => {
    if (!appliedCoupon || !currentService) return 0;
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
      "snapchat": "https://snapchat.com/add/username",
      "telegram": "https://t.me/channel",
      "spotify": "https://open.spotify.com/track/xxxxx",
    };
    
    const category = currentService?.category.toLowerCase() || "";
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
    if (!currentService || !userId) return;

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
          service_id: currentService.id,
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

      // Send order to provider API
      const { error: apiError } = await supabase.functions.invoke('provider-order', {
        body: {
          orderId: orderData.id,
          serviceId: currentService.id,
          link: data.link,
          quantity: data.quantity,
        }
      });

      if (apiError) {
        console.warn('Provider API error:', apiError);
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
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-0">
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
                <DialogHeader className="mb-4">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                    طلب خدمة جديد
                  </DialogTitle>
                </DialogHeader>

                {/* Service Selection */}
                {relatedServices.length > 1 && (
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      اختر نوع الخدمة
                    </label>
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الخدمة" />
                      </SelectTrigger>
                      <SelectContent>
                        {relatedServices.map((s) => {
                          const sFeatures = typeof s.features === 'string' ? JSON.parse(s.features || '{}') : (s.features || {});
                          return (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center justify-between gap-4 w-full">
                                <span className="truncate">{s.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ${s.price.toFixed(4)}/1000
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Service Info Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{currentService?.category}</Badge>
                        {currentService?.external_service_id && (
                          <Badge variant="outline" className="text-xs">
                            ID: {currentService.external_service_id}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-lg leading-tight">{currentService?.name}</h4>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">سعر 1000</p>
                      <p className="text-2xl font-bold text-primary">${currentService?.price.toFixed(4)}</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <div className="text-center p-2 bg-background/50 rounded-lg">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-warning" />
                      <p className="text-[10px] text-muted-foreground">البدء</p>
                      <p className="text-xs font-bold">0-1h</p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded-lg">
                      <Gauge className="w-4 h-4 mx-auto mb-1 text-accent" />
                      <p className="text-[10px] text-muted-foreground">السرعة</p>
                      <p className="text-xs font-bold">{ratePerHour?.toLocaleString() || "10K"}/h</p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded-lg">
                      <Shield className={`w-4 h-4 mx-auto mb-1 ${guaranteed ? "text-success" : "text-muted"}`} />
                      <p className="text-[10px] text-muted-foreground">ضمان</p>
                      <p className={`text-xs font-bold ${guaranteed ? "text-success" : ""}`}>
                        {guaranteed ? "✓" : "✗"}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded-lg">
                      <RefreshCw className={`w-4 h-4 mx-auto mb-1 ${cancel ? "text-success" : "text-muted"}`} />
                      <p className="text-[10px] text-muted-foreground">إلغاء</p>
                      <p className={`text-xs font-bold ${cancel ? "text-success" : ""}`}>
                        {cancel ? "✓" : "✗"}
                      </p>
                    </div>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                className="pr-10 font-mono text-sm"
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quantity Section */}
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Hash className="w-4 h-4" />
                              الكمية
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {minQuantity.toLocaleString()} - {maxQuantity.toLocaleString()}
                            </span>
                          </FormLabel>
                          
                          {/* Quantity Input with Slider */}
                          <div className="space-y-3">
                            <FormControl>
                              <Input
                                type="number"
                                min={minQuantity}
                                max={maxQuantity}
                                className="text-center text-lg font-bold"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || minQuantity)}
                              />
                            </FormControl>

                            {/* Slider */}
                            <Slider
                              value={[field.value]}
                              min={minQuantity}
                              max={Math.min(maxQuantity, 100000)}
                              step={100}
                              onValueChange={(values) => field.onChange(values[0])}
                              className="py-2"
                            />

                            {/* Quantity Presets */}
                            <div className="flex flex-wrap gap-2">
                              {quantityPresets
                                .filter(q => q >= minQuantity && q <= maxQuantity)
                                .map((preset) => (
                                  <Button
                                    key={preset}
                                    type="button"
                                    variant={field.value === preset ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => field.onChange(preset)}
                                    className="text-xs h-7 px-3"
                                  >
                                    {preset >= 1000 ? `${preset / 1000}K` : preset}
                                  </Button>
                                ))}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Estimated Delivery Time */}
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-accent" />
                          وقت التسليم المتوقع
                        </span>
                        <span className="text-lg font-bold text-accent">{estimatedDeliveryTime}</span>
                      </div>
                      <Progress value={deliveryProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        بناءً على سرعة التسليم: {(ratePerHour || 10000).toLocaleString()}/ساعة
                      </p>
                    </div>

                    {/* Notes Field */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            ملاحظات (اختياري)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="أضف أي تفاصيل خاصة..."
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
                        <span>${basePrice.toFixed(4)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center text-sm text-success">
                          <span>الخصم:</span>
                          <span>-${discount.toFixed(4)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-medium">الإجمالي:</span>
                        <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(4)}</span>
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
              <div className="lg:w-80 bg-secondary/30 border-r border-border/50 p-5">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="details" className="text-xs">التفاصيل</TabsTrigger>
                    <TabsTrigger value="info" className="text-xs">معلومات</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-3 mt-0">
                    {/* Service Details Grid */}
                    <div className="space-y-2">
                      <DetailRow label="رقم الخدمة" value={`#${currentService?.external_service_id || 'N/A'}`} />
                      <DetailRow label="التصنيف" value={currentService?.category || '-'} />
                      <DetailRow label="السعر لكل 1000" value={`$${currentService?.price.toFixed(4)}`} highlight />
                      <DetailRow label="الحد الأدنى" value={minQuantity.toLocaleString()} />
                      <DetailRow label="الحد الأقصى" value={maxQuantity.toLocaleString()} />
                      <DetailRow label="وقت البدء" value="0-1 ساعة" />
                      <DetailRow label="السرعة" value={`${(ratePerHour || 10000).toLocaleString()}/ساعة`} />
                      <DetailRow label="متوسط الإنجاز" value={averageTime} />
                      <DetailRow 
                        label="ضمان التعويض" 
                        value={guaranteed ? "متوفر ✓" : "غير متوفر ✗"} 
                        valueColor={guaranteed ? "text-success" : "text-destructive"}
                      />
                      <DetailRow 
                        label="إمكانية الإلغاء" 
                        value={cancel ? "متوفر ✓" : "غير متوفر ✗"} 
                        valueColor={cancel ? "text-success" : "text-destructive"}
                      />
                      <DetailRow 
                        label="التنقيط (Dripfeed)" 
                        value={dripfeed ? "متوفر ✓" : "غير متوفر ✗"} 
                        valueColor={dripfeed ? "text-success" : "text-destructive"}
                      />
                    </div>

                    {/* Example Link */}
                    <div className="p-3 rounded-lg bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">مثال الرابط</span>
                      </div>
                      <p className="text-xs text-muted-foreground break-all font-mono" dir="ltr">
                        {currentService?.category.toLowerCase().includes("instagram") 
                          ? "https://instagram.com/p/xxxxx"
                          : currentService?.category.toLowerCase().includes("facebook")
                          ? "https://facebook.com/post/xxxxx"
                          : currentService?.category.toLowerCase().includes("youtube")
                          ? "https://youtube.com/watch?v=xxxxx"
                          : currentService?.category.toLowerCase().includes("tiktok")
                          ? "https://tiktok.com/@user/video/xxxxx"
                          : currentService?.category.toLowerCase().includes("twitter")
                          ? "https://twitter.com/user/status/xxxxx"
                          : "https://example.com/link"}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="info" className="space-y-3 mt-0">
                    {/* Description */}
                    <div className="p-3 rounded-lg bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">الوصف</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {currentService?.description || "خدمة احترافية بجودة عالية وتسليم سريع. نضمن لك أفضل النتائج مع دعم فني متواصل."}
                      </p>
                    </div>

                    {/* Important Notes */}
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        ملاحظات هامة
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• تأكد من صحة الرابط قبل الطلب</li>
                        <li>• الحساب يجب أن يكون عام (Public)</li>
                        <li>• لا تغير اسم المستخدم أثناء التنفيذ</li>
                        <li>• لا تطلب للنفس الرابط أكثر من مرة</li>
                        <li>• التسليم يبدأ خلال 0-1 ساعة</li>
                      </ul>
                    </div>

                    {/* Quality Badge */}
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center">
                      <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-bold">جودة عالية مضمونة</p>
                      <p className="text-xs text-muted-foreground">دعم فني 24/7</p>
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

// Helper component for detail rows
const DetailRow = ({ 
  label, 
  value, 
  highlight = false,
  valueColor = ""
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  valueColor?: string;
}) => (
  <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${highlight ? 'bg-primary/10' : 'bg-card/50'}`}>
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm font-medium ${valueColor || (highlight ? 'text-primary' : '')}`}>{value}</span>
  </div>
);

export default ServiceOrderDialog;
