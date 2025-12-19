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
  Ticket, 
  X, 
  Check,
  Clock,
  FileText,
  ChevronDown,
  Layers,
  Search,
  TrendingUp,
  DollarSign,
  Minus,
  Plus,
  Shield,
  Zap,
  RefreshCw,
  Info,
  Hash,
  Star,
  ArrowLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
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

// Animated Number Component
const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  
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

// Step indicator component
const StepIndicator = ({ step, title, active, completed }: { step: number; title: string; active: boolean; completed: boolean }) => (
  <motion.div 
    className={cn(
      "flex items-center gap-3 p-3 rounded-2xl transition-all duration-300",
      active && "bg-primary/10 border border-primary/30",
      completed && !active && "opacity-60"
    )}
    initial={false}
    animate={{ scale: active ? 1 : 0.98 }}
  >
    <motion.div 
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300",
        active && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
        completed && !active && "bg-success/20 text-success",
        !active && !completed && "bg-secondary text-muted-foreground"
      )}
      animate={{ 
        scale: active ? [1, 1.1, 1] : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {completed && !active ? <Check className="w-5 h-5" /> : step}
    </motion.div>
    <span className={cn(
      "text-sm font-medium transition-colors",
      active && "text-foreground",
      !active && "text-muted-foreground"
    )}>
      {title}
    </span>
  </motion.div>
);

// Feature badge component
const FeatureBadge = ({ icon: Icon, label, value, variant = "default" }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  variant?: "default" | "success" | "warning" | "info";
}) => (
  <motion.div 
    className={cn(
      "flex items-center gap-2 p-3 rounded-xl border transition-all",
      variant === "success" && "bg-success/10 border-success/30 text-success",
      variant === "warning" && "bg-warning/10 border-warning/30 text-warning",
      variant === "info" && "bg-primary/10 border-primary/30 text-primary",
      variant === "default" && "bg-secondary/50 border-border/50"
    )}
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
  >
    <Icon className="w-4 h-4 shrink-0" />
    <div className="flex flex-col text-right">
      <span className="text-[10px] opacity-70">{label}</span>
      <span className="text-xs font-bold">{value}</span>
    </div>
  </motion.div>
);

const ServiceOrderDialog = ({ service, open, onOpenChange, userId }: ServiceOrderDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
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
  const link = form.watch("link");

  // Update current step based on selections
  useEffect(() => {
    if (selectedServiceId) {
      if (link) {
        setCurrentStep(4);
      } else {
        setCurrentStep(3);
      }
    } else if (selectedCategoryId) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, [selectedCategoryId, selectedServiceId, link]);

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
    setCurrentStep(1);
    form.reset();
    onOpenChange(false);
  };

  const getServiceCount = (categoryId: string) => {
    return allServices.filter(s => s.category_id === categoryId).length;
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[95vh] overflow-hidden p-0 gap-0 rounded-3xl border-2 border-primary/20"
        dir="rtl"
      >
        <AnimatePresence mode="wait">
          {orderSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-16 px-8 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-28 h-28 rounded-3xl bg-gradient-to-br from-success/30 to-success/10 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-success/20"
              >
                <CheckCircle className="w-14 h-14 text-success" />
              </motion.div>
              
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-3"
              >
                تم إنشاء الطلب بنجاح! 🎉
              </motion.h3>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/30 mb-6"
              >
                <Hash className="w-5 h-5 text-primary" />
                <span className="text-xl font-mono font-bold text-primary">{orderNumber}</span>
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground mb-8"
              >
                يمكنك متابعة حالة طلبك من لوحة التحكم
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 justify-center"
              >
                <Button onClick={handleClose} variant="outline" size="lg" className="rounded-xl px-8">
                  إغلاق
                </Button>
                <Button onClick={handleClose} size="lg" className="rounded-xl px-8 gap-2 bg-gradient-to-l from-primary to-accent">
                  <Sparkles className="w-5 h-5" />
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
              className="flex flex-col h-full"
            >
              {/* Modern Header */}
              <div className="relative px-6 py-5 border-b border-border/50 bg-gradient-to-l from-primary/5 via-transparent to-accent/5">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10"
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <ShoppingCart className="w-7 h-7 text-primary-foreground" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold">طلب جديد</h2>
                      <p className="text-sm text-muted-foreground">اختر الخدمة وأكمل الطلب</p>
                    </div>
                  </div>
                  
                  {/* Steps progress */}
                  <div className="hidden sm:flex items-center gap-2">
                    {[1, 2, 3, 4].map((step) => (
                      <motion.div
                        key={step}
                        className={cn(
                          "w-3 h-3 rounded-full transition-all",
                          currentStep >= step 
                            ? "bg-primary shadow-lg shadow-primary/30" 
                            : "bg-secondary"
                        )}
                        animate={{ scale: currentStep === step ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 max-h-[calc(95vh-180px)]">
                <div className="p-6 space-y-6">
                  {/* Step 1: Category Selection */}
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <StepIndicator step={1} title="اختر القسم" active={currentStep === 1} completed={currentStep > 1} />
                    
                    <div className="flex flex-wrap gap-3 justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategoryId("")}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all relative overflow-hidden group",
                          !selectedCategoryId
                            ? "border-primary bg-gradient-to-l from-primary/20 to-primary/5 shadow-lg shadow-primary/20"
                            : "border-border/50 hover:border-primary/50 hover:bg-secondary/50"
                        )}
                      >
                        <Badge variant="secondary" className="text-xs">{allServices.length}</Badge>
                        <span className="text-sm font-bold">الكل</span>
                        <Layers className="w-5 h-5 text-primary" />
                      </motion.button>
                      
                      {categories.slice(0, 9).map((cat, index) => (
                        <motion.button
                          key={cat.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * index }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all relative overflow-hidden group",
                            selectedCategoryId === cat.id
                              ? "border-primary bg-gradient-to-l from-primary/20 to-primary/5 shadow-lg shadow-primary/20"
                              : "border-border/50 hover:border-primary/50 hover:bg-secondary/50"
                          )}
                        >
                          <Badge variant="secondary" className="text-xs">{getServiceCount(cat.id)}</Badge>
                          <span className="text-sm font-bold truncate max-w-[100px]">{cat.name_ar}</span>
                          <span className="text-lg">{getCategoryEmoji(cat.slug)}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Step 2: Service Selection */}
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <StepIndicator step={2} title="اختر الخدمة" active={currentStep === 2} completed={currentStep > 2} />
                    
                    {/* Service Search */}
                    <div className="relative">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="ابحث عن الخدمة بالاسم أو الرقم..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="h-12 pr-12 rounded-xl border-2 text-base"
                      />
                    </div>

                    {/* Service Select */}
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      <SelectTrigger className="w-full h-auto min-h-[60px] py-3 rounded-xl border-2">
                        <SelectValue placeholder="اختر الخدمة المطلوبة...">
                          {currentService && (
                            <div className="text-right flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Hash className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 text-right">
                                <p className="font-bold text-sm line-clamp-1">{currentService.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="text-primary font-bold">${currentService.price.toFixed(4)}/1000</span>
                                  <span>•</span>
                                  <span>#{currentService.external_service_id || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredServices.length === 0 ? (
                          <div className="py-8 text-center text-muted-foreground">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">لا توجد خدمات متاحة</p>
                          </div>
                        ) : (
                          filteredServices.map((s) => {
                            const sFeatures = typeof s.features === 'string' ? JSON.parse(s.features || '{}') : (s.features || {});
                            const hasRefill = sFeatures.refill !== false;
                            return (
                              <SelectItem key={s.id} value={s.id} className="py-3" dir="rtl">
                                <div className="flex items-center gap-3 w-full">
                                  <Star className={cn("w-4 h-4 shrink-0", hasRefill ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
                                  <div className="flex-1 text-right">
                                    <span className="font-bold text-sm block">{s.name}</span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                                      {s.external_service_id && (
                                        <>
                                          <span>#{s.external_service_id}</span>
                                          <span>•</span>
                                        </>
                                      )}
                                      <span>{sFeatures.min || 10} - {(sFeatures.max || 1000000).toLocaleString()}</span>
                                      <span>•</span>
                                      <span className="text-primary font-bold">${s.price.toFixed(4)}/1000</span>
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>

                    {/* Selected Service Features */}
                    {currentService && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                      >
                        <FeatureBadge 
                          icon={DollarSign} 
                          label="السعر/1000" 
                          value={`$${currentService.price.toFixed(4)}`} 
                          variant="info"
                        />
                        <FeatureBadge 
                          icon={Zap} 
                          label="الحد الأدنى" 
                          value={minQuantity.toLocaleString()} 
                          variant="default"
                        />
                        <FeatureBadge 
                          icon={TrendingUp} 
                          label="الحد الأقصى" 
                          value={maxQuantity.toLocaleString()} 
                          variant="default"
                        />
                        <FeatureBadge 
                          icon={Shield} 
                          label="ضمان التعويض" 
                          value={guaranteed ? "✓ مضمون" : "✗ غير مضمون"} 
                          variant={guaranteed ? "success" : "warning"}
                        />
                      </motion.div>
                    )}
                  </motion.div>

                  <Separator className="my-2" />

                  {/* Step 3: Order Details Form */}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      {/* Link Field */}
                      <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <StepIndicator step={3} title="أدخل الرابط" active={currentStep === 3} completed={currentStep > 3} />
                        
                        <FormField
                          control={form.control}
                          name="link"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <LinkIcon className="w-5 h-5 text-primary" />
                                  </div>
                                  <Input
                                    placeholder="https://example.com/..."
                                    dir="ltr"
                                    className="h-14 pr-16 pl-4 rounded-xl border-2 font-mono text-base text-left"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <Info className="w-4 h-4 text-blue-500 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            تأكد من أن الرابط صحيح وأن الحساب/المنشور عام وغير محمي
                          </p>
                        </div>
                      </motion.div>

                      {/* Quantity Field */}
                      <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <StepIndicator step={4} title="حدد الكمية" active={currentStep === 4} completed={false} />
                        
                        {/* Live Price Preview Card */}
                        <motion.div 
                          className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border-2 border-primary/30 relative overflow-hidden"
                          layout
                        >
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{ x: ['-200%', '200%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          />
                          <div className="relative flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <motion.div 
                                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <DollarSign className="w-7 h-7 text-primary-foreground" />
                              </motion.div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">السعر المباشر</p>
                                <AnimatedPrice value={basePrice} className="text-3xl font-bold text-primary" />
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-xs text-muted-foreground mb-1">الكمية</p>
                              <AnimatedNumber value={quantity} className="text-2xl font-bold" />
                            </div>
                          </div>
                        </motion.div>

                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem className="space-y-4">
                              {/* Quantity Input with +/- Buttons */}
                              <div className="flex items-center gap-3">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-14 w-14 shrink-0 rounded-xl border-2"
                                    onClick={() => field.onChange(Math.max(minQuantity, field.value - 100))}
                                    disabled={field.value <= minQuantity}
                                  >
                                    <Minus className="w-5 h-5" />
                                  </Button>
                                </motion.div>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={minQuantity}
                                    max={maxQuantity}
                                    className="text-center text-2xl font-bold h-14 rounded-xl border-2"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || minQuantity)}
                                  />
                                </FormControl>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-14 w-14 shrink-0 rounded-xl border-2"
                                    onClick={() => field.onChange(Math.min(maxQuantity, field.value + 100))}
                                    disabled={field.value >= maxQuantity}
                                  >
                                    <Plus className="w-5 h-5" />
                                  </Button>
                                </motion.div>
                              </div>

                              {/* Slider */}
                              <div className="px-2">
                                <Slider
                                  value={[field.value]}
                                  min={minQuantity}
                                  max={Math.min(maxQuantity, 100000)}
                                  step={100}
                                  onValueChange={(values) => field.onChange(values[0])}
                                  className="py-4"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                  <span>{minQuantity.toLocaleString()}</span>
                                  <span>{Math.min(maxQuantity, 100000).toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Quantity Presets */}
                              <div className="flex flex-wrap gap-2 justify-center">
                                {quantityPresets
                                  .filter(q => q >= minQuantity && q <= maxQuantity)
                                  .map((preset) => (
                                    <motion.div 
                                      key={preset} 
                                      whileHover={{ scale: 1.08, y: -2 }} 
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Button
                                        type="button"
                                        variant={field.value === preset ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => field.onChange(preset)}
                                        className={cn(
                                          "text-sm h-10 px-5 rounded-xl transition-all font-bold",
                                          field.value === preset && "shadow-lg shadow-primary/30"
                                        )}
                                      >
                                        {preset >= 1000 ? `${preset / 1000}K` : preset}
                                      </Button>
                                    </motion.div>
                                  ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      {/* Estimated Delivery */}
                      <motion.div 
                        className="flex items-center justify-between p-4 rounded-2xl bg-accent/10 border-2 border-accent/30"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <span className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-accent" />
                          </div>
                          <span className="font-medium">وقت التسليم المتوقع</span>
                        </span>
                        <span className="text-lg font-bold text-accent">{estimatedDeliveryTime}</span>
                      </motion.div>

                      {/* Advanced Options */}
                      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="ghost" className="w-full justify-between text-base h-12 rounded-xl">
                            <span className="flex items-center gap-3">
                              <TrendingUp className="w-5 h-5" />
                              خيارات متقدمة
                            </span>
                            <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }}>
                              <ChevronDown className="w-5 h-5" />
                            </motion.div>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-4">
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
                                    className="resize-none rounded-xl border-2"
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Coupon Section */}
                          <div className="space-y-3">
                            <label className="text-sm font-medium flex items-center gap-2">
                              <Ticket className="w-4 h-4" />
                              كود الخصم
                            </label>
                            {appliedCoupon ? (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border-2 border-success/30"
                              >
                                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                                  <Check className="w-5 h-5 text-success" />
                                </div>
                                <span className="text-sm flex-1">
                                  <code className="font-mono font-bold text-lg">{appliedCoupon.code}</code>
                                  <span className="text-success font-bold mr-2">
                                    (-{appliedCoupon.discount_type === "percentage" 
                                      ? `${appliedCoupon.discount_value}%` 
                                      : `$${appliedCoupon.discount_value}`})
                                  </span>
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-lg"
                                  onClick={removeCoupon}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ) : (
                              <div className="flex gap-3">
                                <Input
                                  placeholder="أدخل كود الخصم"
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                  dir="ltr"
                                  className="flex-1 h-12 rounded-xl border-2 text-center font-mono text-lg"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={validateCoupon}
                                  disabled={validatingCoupon}
                                  className="h-12 px-6 rounded-xl"
                                >
                                  {validatingCoupon ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    "تطبيق"
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Total Price Summary */}
                      <motion.div 
                        className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/30 space-y-3"
                        layout
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">الكمية × السعر:</span>
                          <span className="flex items-center gap-1 font-medium">
                            <AnimatedNumber value={quantity} className="" />
                            <span> × ${currentService?.price.toFixed(4) || '0'}</span>
                          </span>
                        </div>
                        
                        <AnimatePresence>
                          {discount > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex justify-between items-center text-sm text-success overflow-hidden"
                            >
                              <span>الخصم:</span>
                              <span className="font-bold">-${discount.toFixed(4)}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-lg font-bold">الإجمالي:</span>
                          <div className="flex items-center gap-3">
                            <AnimatedPrice value={totalPrice} className="text-3xl font-bold text-primary" />
                            <motion.div
                              key={totalPrice}
                              initial={{ scale: 1.2, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium"
                            >
                              ≈ {(totalPrice * 3.75).toFixed(2)} ر.س
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Submit Button */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          type="submit" 
                          disabled={isSubmitting || !currentService} 
                          className="w-full h-14 text-lg font-bold bg-gradient-to-l from-primary to-accent hover:opacity-90 rounded-2xl shadow-xl shadow-primary/30"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin ml-3" />
                              جاري إرسال الطلب...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-6 h-6 ml-3" />
                              إرسال الطلب
                              <ArrowLeft className="w-5 h-5 mr-3" />
                            </>
                          )}
                        </Button>
                      </motion.div>
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
