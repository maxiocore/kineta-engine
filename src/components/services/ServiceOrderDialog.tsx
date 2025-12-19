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
                <div className="p-6 space-y-5">
                  {/* القسم - Category Selection */}
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm font-semibold">القسم</span>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger className="w-full h-12 rounded-xl border-2 text-right" dir="rtl">
                        <SelectValue placeholder="اختر القسم...">
                          {selectedCategoryId ? (
                            <div className="flex items-center gap-2 justify-end w-full">
                              <span className="font-medium">
                                {categories.find(c => c.id === selectedCategoryId)?.name_ar || 'الكل'}
                              </span>
                              <span className="text-lg">
                                {getCategoryEmoji(categories.find(c => c.id === selectedCategoryId)?.slug || '')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">اختر القسم...</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="all" className="py-3">
                          <div className="flex items-center gap-3 justify-end w-full">
                            <span className="font-medium">جميع الأقسام</span>
                            <Layers className="w-5 h-5 text-primary" />
                          </div>
                        </SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="py-3">
                            <div className="flex items-center gap-3 justify-end w-full">
                              <Badge variant="secondary" className="text-xs">{getServiceCount(cat.id)}</Badge>
                              <span className="font-medium">{cat.name_ar}</span>
                              <span className="text-lg">{getCategoryEmoji(cat.slug)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* الخدمة - Service Selection */}
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm font-semibold">الخدمة</span>
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>
                    
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      <SelectTrigger className="w-full h-auto min-h-[50px] py-3 rounded-xl border-2 text-right" dir="rtl">
                        <SelectValue placeholder={selectedCategoryId ? "اختر الخدمة..." : "اختر القسم أولاً"}>
                          {currentService && (
                            <div className="flex items-center gap-3 justify-end w-full">
                              <div className="flex-1 text-right">
                                <p className="font-bold text-sm line-clamp-1">{currentService.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${currentService.price.toFixed(4)}/1000 • #{currentService.external_service_id || 'N/A'}
                                </p>
                              </div>
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 shrink-0" />
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]" dir="rtl">
                        {/* Search inside dropdown */}
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="ابحث عن الخدمة..."
                              value={serviceSearch}
                              onChange={(e) => setServiceSearch(e.target.value)}
                              className="h-10 pr-10 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        {filteredServices.length === 0 ? (
                          <div className="py-6 text-center text-muted-foreground">
                            <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">لا توجد خدمات متاحة</p>
                          </div>
                        ) : (
                          filteredServices.map((s) => {
                            const sFeatures = typeof s.features === 'string' ? JSON.parse(s.features || '{}') : (s.features || {});
                            const hasRefill = sFeatures.refill !== false;
                            return (
                              <SelectItem key={s.id} value={s.id} className="py-3 cursor-pointer">
                                <div className="flex items-center gap-3 w-full">
                                  <Badge variant="outline" className="text-xs shrink-0">{s.external_service_id}</Badge>
                                  <div className="flex-1 text-right">
                                    <span className="font-medium text-sm block line-clamp-1">{s.name}</span>
                                    <span className="text-xs text-primary font-bold">${s.price.toFixed(4)}/1000</span>
                                  </div>
                                  <Star className={cn(
                                    "w-4 h-4 shrink-0",
                                    hasRefill ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                                  )} />
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>

                    {/* Service Info Badge */}
                    {currentService && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-wrap gap-2 justify-end"
                      >
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Zap className="w-3 h-3" />
                          {minQuantity.toLocaleString()} - {maxQuantity.toLocaleString()}
                        </Badge>
                        <Badge variant={guaranteed ? "default" : "secondary"} className="gap-1 text-xs">
                          <Shield className="w-3 h-3" />
                          {guaranteed ? "مضمون" : "غير مضمون"}
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs text-primary">
                          <DollarSign className="w-3 h-3" />
                          ${currentService.price.toFixed(4)}/1000
                        </Badge>
                      </motion.div>
                    )}
                  </motion.div>

                  <Separator />

                  {/* Step 3: Order Details Form */}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      {/* الرابط - Link Field */}
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold">الرابط</span>
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <LinkIcon className="w-4 h-4 text-blue-500" />
                          </div>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="link"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="https://..."
                                  dir="ltr"
                                  className="h-12 rounded-xl border-2 font-mono text-sm text-left"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      {/* الكمية - Quantity Field */}
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold">الكمية</span>
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Hash className="w-4 h-4 text-purple-500" />
                          </div>
                        </div>
                        
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
                                  placeholder="أدخل الكمية..."
                                  className="h-12 rounded-xl border-2 text-left text-lg font-medium"
                                  dir="ltr"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || minQuantity)}
                                />
                              </FormControl>
                              <FormMessage />
                              
                              {/* Quantity Range Info */}
                              {currentService && (
                                <p className="text-xs text-muted-foreground text-right mt-1">
                                  الحد الأدنى: {minQuantity.toLocaleString()} • الحد الأقصى: {maxQuantity.toLocaleString()}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      {/* المبلغ الإجمالي - Total Price */}
                      <motion.div 
                        className="p-5 rounded-2xl bg-gradient-to-l from-primary/15 to-primary/5 border-2 border-primary/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        layout
                      >
                        <div className="flex items-center justify-between">
                          <AnimatedPrice value={totalPrice} className="text-3xl font-bold text-primary" />
                          <span className="text-sm font-semibold text-muted-foreground">المبلغ الإجمالي</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">≈ {(totalPrice * 3.75).toFixed(2)} ر.س</span>
                          {discount > 0 && (
                            <span className="text-sm text-success font-medium">خصم: -${discount.toFixed(4)}</span>
                          )}
                        </div>
                      </motion.div>

                      {/* Submit Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          type="submit" 
                          disabled={isSubmitting || !currentService} 
                          className="w-full h-14 text-lg font-bold bg-gradient-to-l from-primary to-accent hover:opacity-90 rounded-xl shadow-xl shadow-primary/30"
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
