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
  Info,
  FileText,
  ChevronDown,
  Gauge,
  Calendar,
  Package,
  RefreshCw,
  Layers,
  Search,
  Star,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch all active services
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
    
    if (selectedCategoryId) {
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
  const cancel = features.cancel || false;

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
    setServiceSearch("");
    form.reset();
    onOpenChange(false);
  };

  // Get service count per category
  const getServiceCount = (categoryId: string) => {
    return allServices.filter(s => s.category_id === categoryId).length;
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
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
              className="flex flex-col h-full"
            >
              {/* Header */}
              <DialogHeader className="px-6 py-4 border-b border-border/50">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  طلب جديد
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="flex-1 max-h-[calc(90vh-140px)]">
                <div className="p-6 space-y-5">
                  {/* Step 1: Category Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                      اختر القسم
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategoryId("")}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all",
                          !selectedCategoryId
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 hover:border-primary/50 hover:bg-secondary/50"
                        )}
                      >
                        <Layers className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xs font-medium">الكل</p>
                        <p className="text-[10px] text-muted-foreground">{allServices.length}</p>
                      </motion.button>
                      
                      {categories.slice(0, 9).map((cat) => (
                        <motion.button
                          key={cat.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={cn(
                            "p-3 rounded-xl border text-center transition-all",
                            selectedCategoryId === cat.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/50 hover:border-primary/50 hover:bg-secondary/50"
                          )}
                        >
                          <div className="text-lg mb-1">
                            {cat.slug === 'instagram' && '📷'}
                            {cat.slug === 'facebook' && '👤'}
                            {cat.slug === 'youtube' && '▶️'}
                            {cat.slug === 'twitter' && '🐦'}
                            {cat.slug === 'tiktok' && '🎵'}
                            {cat.slug === 'telegram' && '✈️'}
                            {cat.slug === 'linkedin' && '💼'}
                            {cat.slug === 'spotify' && '🎧'}
                            {cat.slug === 'soundcloud' && '☁️'}
                            {cat.slug === 'website-traffic' && '🌐'}
                            {cat.slug === 'other' && '⚡'}
                            {!['instagram', 'facebook', 'youtube', 'twitter', 'tiktok', 'telegram', 'linkedin', 'spotify', 'soundcloud', 'website-traffic', 'other'].includes(cat.slug) && '📦'}
                          </div>
                          <p className="text-xs font-medium truncate">{cat.name_ar}</p>
                          <p className="text-[10px] text-muted-foreground">{getServiceCount(cat.id)}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Service Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                      اختر الخدمة
                    </label>
                    
                    {/* Service Search */}
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="ابحث عن الخدمة..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="pr-10"
                      />
                    </div>

                    {/* Service Select */}
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      <SelectTrigger className="w-full h-auto min-h-[48px] py-2">
                        <SelectValue placeholder="اختر الخدمة...">
                          {currentService && (
                            <div className="text-right">
                              <p className="font-medium text-sm truncate">{currentService.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ${currentService.price.toFixed(4)}/1000 • ID: {currentService.external_service_id || 'N/A'}
                              </p>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredServices.length === 0 ? (
                          <div className="py-4 text-center text-muted-foreground text-sm">
                            لا توجد خدمات متاحة
                          </div>
                        ) : (
                          filteredServices.map((s) => {
                            const sFeatures = typeof s.features === 'string' ? JSON.parse(s.features || '{}') : (s.features || {});
                            return (
                              <SelectItem key={s.id} value={s.id} className="py-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium text-sm">{s.name}</span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>${s.price.toFixed(4)}/1000</span>
                                    <span>•</span>
                                    <span>{sFeatures.min || 10} - {sFeatures.max || '1M'}</span>
                                    {s.external_service_id && (
                                      <>
                                        <span>•</span>
                                        <span>#{s.external_service_id}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>

                    {/* Selected Service Quick Info */}
                    {currentService && (
                      <div className="grid grid-cols-4 gap-2">
                        <div className="p-2 rounded-lg bg-secondary/50 text-center">
                          <p className="text-[10px] text-muted-foreground">السعر/1000</p>
                          <p className="text-xs font-bold text-primary">${currentService.price.toFixed(4)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary/50 text-center">
                          <p className="text-[10px] text-muted-foreground">الأدنى</p>
                          <p className="text-xs font-bold">{minQuantity.toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary/50 text-center">
                          <p className="text-[10px] text-muted-foreground">الأقصى</p>
                          <p className="text-xs font-bold">{maxQuantity.toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary/50 text-center">
                          <p className="text-[10px] text-muted-foreground">ضمان</p>
                          <p className={cn("text-xs font-bold", guaranteed ? "text-success" : "text-muted-foreground")}>
                            {guaranteed ? "✓ نعم" : "✗ لا"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Step 3: Order Details Form */}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Link Field */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                          أدخل الرابط
                        </label>
                        <FormField
                          control={form.control}
                          name="link"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    placeholder="https://..."
                                    dir="ltr"
                                    className="pr-10 font-mono text-sm"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Quantity Field */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-2 text-foreground">
                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                            الكمية
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {minQuantity.toLocaleString()} - {maxQuantity.toLocaleString()}
                          </span>
                        </label>
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Estimated Delivery */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/20">
                        <span className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-accent" />
                          وقت التسليم المتوقع
                        </span>
                        <span className="font-bold text-accent">{estimatedDeliveryTime}</span>
                      </div>

                      {/* Advanced Options */}
                      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="ghost" className="w-full justify-between text-sm h-9">
                            <span className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              خيارات متقدمة
                            </span>
                            <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-3">
                          {/* Notes Field */}
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  ملاحظات (اختياري)
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="أضف أي ملاحظات أو متطلبات خاصة..."
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
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Total Price */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">الكمية × السعر:</span>
                          <span>{quantity.toLocaleString()} × ${currentService?.price.toFixed(4) || '0'}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between items-center text-sm text-success">
                            <span>الخصم:</span>
                            <span>-${discount.toFixed(4)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">الإجمالي:</span>
                          <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(4)}</span>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || !currentService} 
                        className="w-full h-12 text-base font-semibold bg-gradient-to-l from-primary to-accent hover:opacity-90"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            جاري إرسال الطلب...
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
