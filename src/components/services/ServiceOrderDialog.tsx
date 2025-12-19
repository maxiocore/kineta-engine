import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ShoppingCart, 
  Loader2, 
  CheckCircle, 
  Sparkles, 
  Link as LinkIcon, 
  X, 
  Check,
  ChevronDown,
  Layers,
  Search,
  DollarSign,
  Minus,
  Plus,
  Shield,
  Zap,
  RefreshCw,
  Hash,
  Star,
  ArrowLeft,
  Package,
  Timer,
  Wallet,
  Copy,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  category_id?: string | null;
  price: number;
  features: any;
  external_service_id: string | null;
}

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string | null;
  color: string | null;
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

// Animated Price Component
const AnimatedPrice = ({ value, className }: { value: number; className?: string }) => {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => `$${current.toFixed(4)}`);
  
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
};

// Category emoji helper
const getCategoryEmoji = (slug: string) => {
  const emojiMap: Record<string, string> = {
    'instagram': '📷',
    'facebook': '👤',
    'youtube': '▶️',
    'twitter': '🐦',
    'tiktok': '🎵',
    'telegram': '✈️',
    'linkedin': '💼',
    'spotify': '🎧',
    'soundcloud': '☁️',
    'website-traffic': '🌐',
    'other': '⚡'
  };
  return emojiMap[slug] || '📦';
};

const ServiceOrderDialog = ({ service, open, onOpenChange, userId }: ServiceOrderDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  // Category & Service selection states
  const [categories, setCategories] = useState<Category[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [serviceSearch, setServiceSearch] = useState("");

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      link: "",
      quantity: 100,
      notes: "",
    },
  });

  const quantity = form.watch("quantity");

  // Fetch categories and all services
  useEffect(() => {
    const fetchData = async () => {
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (categoriesData) {
        setCategories(categoriesData);
      }

      const { data: servicesData } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("name", { ascending: true });
      
      if (servicesData) {
        setAllServices(servicesData);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Set initial selection when service prop changes
  useEffect(() => {
    if (service && open) {
      setSelectedServiceId(service.id);
      if (service.category_id) {
        setSelectedCategoryId(service.category_id);
      }
    }
  }, [service, open]);

  // Get services for selected category
  const filteredServices = useMemo(() => {
    let services = allServices;
    
    if (selectedCategoryId && selectedCategoryId !== "all") {
      services = services.filter(s => s.category_id === selectedCategoryId);
    }
    
    if (serviceSearch) {
      const search = serviceSearch.toLowerCase();
      services = services.filter(s => 
        s.name.toLowerCase().includes(search) ||
        s.category.toLowerCase().includes(search) ||
        s.external_service_id?.includes(search)
      );
    }
    
    return services;
  }, [allServices, selectedCategoryId, serviceSearch]);

  // Get current selected service
  const currentService = useMemo(() => {
    if (selectedServiceId) {
      return allServices.find(s => s.id === selectedServiceId) || service;
    }
    return service;
  }, [selectedServiceId, allServices, service]);

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
  const ratePerHour = features.rate || 10000;
  const guaranteed = features.refill !== false;

  // Calculate estimated delivery time
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

      if (data.min_order_amount && data.min_order_amount > basePrice) {
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
    if (!currentService || !userId) return;

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
    setServiceSearch("");
    form.reset();
    onOpenChange(false);
  };

  const getServiceCount = (categoryId: string) => {
    return allServices.filter(s => s.category_id === categoryId).length;
  };

  const handleQuantityChange = (delta: number) => {
    const current = form.getValues("quantity");
    const newValue = Math.max(minQuantity, Math.min(maxQuantity, current + delta));
    form.setValue("quantity", newValue);
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[520px] max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl"
        dir="rtl"
      >
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
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-success" />
              </motion.div>
              
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold mb-2"
              >
                تم إنشاء الطلب بنجاح
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground mb-6"
              >
                سيتم معالجة طلبك في أقرب وقت
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-muted/50 rounded-xl p-4 mb-6 flex items-center justify-between"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    navigator.clipboard.writeText(orderNumber || "");
                    toast.success("تم نسخ رقم الطلب");
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-bold">{orderNumber}</span>
                  <Hash className="w-5 h-5 text-primary" />
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3"
              >
                <Button onClick={handleClose} variant="outline" className="flex-1 h-12 rounded-xl">
                  إغلاق
                </Button>
                <Button onClick={handleClose} className="flex-1 h-12 rounded-xl gap-2">
                  <ExternalLink className="w-4 h-4" />
                  متابعة الطلب
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold">طلب جديد</h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 max-h-[calc(90vh-80px)]">
                <div className="p-5 space-y-4">
                  
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 justify-end">
                      <span>القسم</span>
                      <Layers className="w-4 h-4 text-muted-foreground" />
                    </label>
                    <Select dir="rtl" value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger className="w-full h-12 rounded-xl bg-muted/50 border-0 text-right flex-row-reverse">
                        <SelectValue placeholder="اختر القسم">
                          {selectedCategoryId && selectedCategoryId !== "all" ? (
                            <div className="flex items-center gap-2 flex-row-reverse">
                              <span>{getCategoryEmoji(categories.find(c => c.id === selectedCategoryId)?.slug || '')}</span>
                              <span>{categories.find(c => c.id === selectedCategoryId)?.name_ar}</span>
                            </div>
                          ) : selectedCategoryId === "all" ? (
                            <span>جميع الأقسام</span>
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="bg-popover border-border">
                        <SelectItem value="all" className="py-3">
                          <div className="flex items-center gap-2 justify-end w-full flex-row-reverse">
                            <Layers className="w-4 h-4" />
                            <span>جميع الأقسام</span>
                          </div>
                        </SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="py-3">
                            <div className="flex items-center gap-2 justify-between w-full" dir="rtl">
                              <div className="flex items-center gap-2">
                                <span>{getCategoryEmoji(cat.slug)}</span>
                                <span>{cat.name_ar}</span>
                              </div>
                              <Badge variant="secondary" className="text-[10px] px-1.5">
                                {getServiceCount(cat.id)}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 justify-end">
                      <span>الخدمة</span>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </label>
                    <Select dir="rtl" value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      <SelectTrigger className="w-full min-h-[52px] py-2 rounded-xl bg-muted/50 border-0 text-right flex-row-reverse">
                        <SelectValue placeholder="اختر الخدمة">
                          {currentService && (
                            <div className="flex items-center gap-2 flex-row-reverse text-right">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                              <span className="font-medium line-clamp-1 text-sm">{currentService.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px] bg-popover border-border" dir="rtl">
                        <div className="p-2 border-b border-border sticky top-0 bg-popover z-10">
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="ابحث..."
                              value={serviceSearch}
                              onChange={(e) => setServiceSearch(e.target.value)}
                              className="h-9 pr-9 text-sm bg-muted/50 border-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        {filteredServices.length === 0 ? (
                          <div className="py-8 text-center text-muted-foreground">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">لا توجد نتائج</p>
                          </div>
                        ) : (
                          filteredServices.map((s) => {
                            const sFeatures = typeof s.features === 'string' ? JSON.parse(s.features || '{}') : (s.features || {});
                            const hasRefill = sFeatures.refill !== false;
                            return (
                              <SelectItem 
                                key={s.id} 
                                value={s.id} 
                                className="py-3 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between w-full gap-2" dir="rtl">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Star className={cn(
                                      "w-3.5 h-3.5 shrink-0",
                                      hasRefill ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                                    )} />
                                    <div className="min-w-0 text-right">
                                      <p className="text-sm font-medium line-clamp-1">{s.name}</p>
                                      <p className="text-xs text-muted-foreground">${s.price.toFixed(4)}/1000</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] shrink-0 tabular-nums">
                                    #{s.external_service_id}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Info Cards */}
                  {currentService && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <DollarSign className="w-4 h-4 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">السعر</p>
                        <p className="text-sm font-bold">${currentService.price.toFixed(4)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                        <p className="text-xs text-muted-foreground">الحد الأدنى</p>
                        <p className="text-sm font-bold">{minQuantity.toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <Shield className={cn("w-4 h-4 mx-auto mb-1", guaranteed ? "text-success" : "text-muted-foreground")} />
                        <p className="text-xs text-muted-foreground">الضمان</p>
                        <p className="text-sm font-bold">{guaranteed ? "مضمون" : "لا"}</p>
                      </div>
                    </motion.div>
                  )}

                  <Separator className="my-4" />

                  {/* Form */}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      
                      {/* Link Field */}
                      <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                          <FormItem>
                            <label className="text-sm font-medium flex items-center gap-2 justify-end mb-2">
                              <span>الرابط</span>
                              <LinkIcon className="w-4 h-4 text-blue-500" />
                            </label>
                            <FormControl>
                              <Input
                                placeholder="https://instagram.com/..."
                                dir="ltr"
                                className="h-12 rounded-xl bg-muted/50 border-0 font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
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
                            <label className="text-sm font-medium flex items-center gap-2 justify-end mb-2">
                              <span>الكمية</span>
                              <Hash className="w-4 h-4 text-purple-500" />
                            </label>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-12 w-12 rounded-xl shrink-0"
                                  onClick={() => handleQuantityChange(-100)}
                                  disabled={quantity <= minQuantity}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min={minQuantity}
                                  max={maxQuantity}
                                  placeholder="الكمية"
                                  className="h-12 rounded-xl bg-muted/50 border-0 text-center text-lg font-bold flex-1"
                                  dir="ltr"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || minQuantity)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-12 w-12 rounded-xl shrink-0"
                                  onClick={() => handleQuantityChange(100)}
                                  disabled={quantity >= maxQuantity}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                            
                            {/* Quick Quantity Buttons */}
                            <div className="flex flex-wrap gap-2 mt-2 justify-end">
                              {quantityPresets.filter(q => q >= minQuantity && q <= maxQuantity).slice(0, 4).map((preset) => (
                                <Button
                                  key={preset}
                                  type="button"
                                  variant={quantity === preset ? "default" : "ghost"}
                                  size="sm"
                                  className="h-8 px-3 text-xs rounded-lg"
                                  onClick={() => form.setValue("quantity", preset)}
                                >
                                  {preset.toLocaleString()}
                                </Button>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Delivery Time */}
                      {currentService && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-muted/30 rounded-xl p-3 flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">{estimatedDeliveryTime}</span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-sm">وقت التسليم المتوقع</span>
                            <Timer className="w-4 h-4" />
                          </div>
                        </motion.div>
                      )}

                      {/* Coupon Section */}
                      <div className="space-y-2">
                        {appliedCoupon ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-center justify-between"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                              onClick={removeCoupon}
                            >
                              إزالة
                            </Button>
                            <div className="flex items-center gap-2 text-success">
                              <span className="font-bold">{appliedCoupon.code}</span>
                              <Check className="w-4 h-4" />
                            </div>
                          </motion.div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 rounded-xl shrink-0"
                              onClick={validateCoupon}
                              disabled={validatingCoupon || !couponCode.trim()}
                            >
                              {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                            </Button>
                            <Input
                              placeholder="كود الخصم"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              className="h-10 rounded-xl bg-muted/50 border-0 text-center flex-1"
                              dir="ltr"
                            />
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Price Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>${basePrice.toFixed(4)}</span>
                          <span className="text-muted-foreground">المبلغ الأساسي</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex items-center justify-between text-sm text-success">
                            <span>-${discount.toFixed(4)}</span>
                            <span>الخصم</span>
                          </div>
                        )}
                        <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-between">
                          <div className="text-right">
                            <AnimatedPrice value={totalPrice} className="text-2xl font-bold text-primary" />
                            <p className="text-xs text-muted-foreground">≈ {(totalPrice * 3.75).toFixed(2)} ر.س</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">الإجمالي</span>
                            <Wallet className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || !currentService} 
                        className="w-full h-14 text-lg font-bold rounded-xl"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            جاري الإرسال...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5 ml-2" />
                            إرسال الطلب
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceOrderDialog;
