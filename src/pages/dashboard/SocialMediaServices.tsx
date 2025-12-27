import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Heart,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  Loader2,
  Ghost,
  Radio,
  Wallet,
  Star,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  Zap,
  CheckCircle2,
  ShoppingCart,
  ArrowLeft,
  Copy,
  Info,
  TrendingUp,
  Package,
  Crown,
  Filter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/adminNotifyService";
import { useIsMobile } from "@/hooks/use-mobile";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  category_id: string | null;
  price: number;
  status: string;
  features: any;
  external_service_id: string | null;
  refill_enabled: boolean | null;
  refill_days: number | null;
}

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  display_order: number | null;
}

const socialNetworks = [
  { id: 'all', name: 'الكل', keywords: [], icon: Sparkles, color: 'hsl(var(--primary))' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, color: '#E4405F' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, color: '#1877F2' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, color: '#FF0000' },
  { id: 'twitter', name: 'تويتر/X', keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: Twitter, color: '#1DA1F2' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], icon: Radio, color: '#1DB954' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], icon: Music2, color: '#000000' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان', 'لينكد ان', 'لينكدإن'], icon: Linkedin, color: '#0A66C2' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, color: '#0088CC' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, color: '#FFFC00' },
  { id: 'website', name: 'زيارات', keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع', 'ويب'], icon: Globe, color: '#10B981' },
];

const SocialMediaServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const { convertToSAR } = useExchangeRate();
  const isMobile = useIsMobile();
  
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // جلب الرصيد
  const { data: userBalance, refetch: refetchBalance } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("user_balances").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  // جلب إحصائيات المستخدم
  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_price, status")
        .eq("user_id", user.id);
      return { 
        totalOrders: orders?.length || 0, 
        totalSpent: orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0 
      };
    },
    enabled: !!user?.id,
  });

  // جلب الفئات
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-social"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  // جلب الخدمات
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services-social"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });

  // تصفية خدمات السوشيال ميديا
  const designDevKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 'برمجة', 'تطوير', 'dev', 'development', 'app'];
  
  const socialMediaServices = useMemo(() => {
    return services.filter(service => {
      const text = `${service.category} ${service.name}`.toLowerCase();
      return !designDevKeywords.some(k => text.includes(k));
    });
  }, [services]);

  // الحصول على خدمات الشبكة
  const getServicesByNetwork = useCallback((networkId: string) => {
    if (networkId === 'all') return socialMediaServices;
    const network = socialNetworks.find(n => n.id === networkId);
    if (!network || network.keywords.length === 0) return socialMediaServices;
    return socialMediaServices.filter(s => {
      const text = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => text.includes(k));
    });
  }, [socialMediaServices]);

  // الفئات مع الخدمات
  const categoriesWithServices = useMemo(() => {
    const networkServices = getServicesByNetwork(selectedNetwork);
    const categoryIds = new Set(networkServices.map(s => s.category_id).filter(Boolean));
    return categories.filter(c => categoryIds.has(c.id));
  }, [categories, selectedNetwork, getServicesByNetwork]);

  // تصفية الخدمات
  const filteredServices = useMemo(() => {
    let filtered = getServicesByNetwork(selectedNetwork);
    if (selectedCategory) {
      filtered = filtered.filter(s => s.category_id === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }
    return filtered;
  }, [selectedNetwork, selectedCategory, searchQuery, getServicesByNetwork]);

  // تحليل الخصائص
  const parseFeatures = (features: any) => {
    const defaults = { min: 10, max: 100000, rate: 0, refill: false, cancel: false };
    if (!features) return defaults;
    try {
      const f = typeof features === 'string' ? JSON.parse(features) : features;
      return {
        min: parseInt(f.min || f.minQuantity) || defaults.min,
        max: parseInt(f.max || f.maxQuantity) || defaults.max,
        rate: parseFloat(f.rate) || 0,
        refill: f.refill === true || f.refill === 'true',
        cancel: f.cancel === true || f.cancel === 'true' || f.canCancel === true,
      };
    } catch {
      return defaults;
    }
  };

  // حساب السعر
  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    const priceInUSD = (selectedService.price / 1000) * qty;
    return convertToSAR(priceInUSD);
  }, [selectedService, quantity, convertToSAR]);

  // اختيار خدمة
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    const features = parseFeatures(service.features);
    setQuantity(features.min.toString());
    setShowOrderSheet(true);
  };

  // إرسال الطلب
  const handleSubmit = async () => {
    if (!user) { toast.error("يجب تسجيل الدخول"); return; }
    if (!selectedService || !link || !quantity) { toast.error("يرجى ملء جميع الحقول"); return; }
    
    const features = parseFeatures(selectedService.features);
    const qty = parseInt(quantity);
    
    if (qty < features.min || qty > features.max) {
      toast.error(`الكمية يجب أن تكون بين ${features.min} و ${features.max}`);
      return;
    }
    if (!link.startsWith('http')) {
      toast.error("الرابط يجب أن يبدأ بـ http أو https");
      return;
    }
    if (!userBalance || userBalance.balance < totalPrice) { 
      toast.error("رصيدك غير كافي"); 
      return; 
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const { data: orderData, error: orderError } = await supabase.from("orders").insert({
        user_id: user.id, 
        service_id: selectedService.id, 
        order_number: orderNumber, 
        quantity: qty, 
        link, 
        total_price: totalPrice, 
        status: "pending",
      }).select().single();
      
      if (orderError) throw orderError;
      
      await supabase.from("user_balances").update({ 
        balance: userBalance.balance - totalPrice, 
        total_spent: userBalance.total_spent + totalPrice 
      }).eq("user_id", user.id);
      
      await supabase.from("balance_logs").insert({
        user_id: user.id,
        action_type: 'order',
        amount: -totalPrice,
        balance_before: userBalance.balance,
        balance_after: userBalance.balance - totalPrice,
        reference_type: 'order',
        reference_id: orderData.id,
        notes: `خصم للطلب رقم ${orderData.order_number}`
      });
      
      if (selectedService.external_service_id) {
        try {
          await supabase.functions.invoke('provider-order', {
            body: { orderId: orderData.id, serviceId: selectedService.id, link, quantity: qty }
          });
        } catch {}
      }
      
      toast.success("تم إرسال الطلب بنجاح!", {
        description: `رقم الطلب: ${orderNumber}`,
        action: { label: "عرض الطلبات", onClick: () => navigate('/dashboard/orders') }
      });
      
      notifyNewOrder({
        orderNumber: orderData.order_number,
        userName: user.user_metadata?.full_name,
        userEmail: user.email || '',
        serviceName: selectedService.name,
        quantity: qty,
        totalPrice,
      });
      
      setLink("");
      setQuantity("");
      setSelectedService(null);
      setShowOrderSheet(false);
      refetchBalance();
      
    } catch { 
      toast.error("حدث خطأ أثناء إرسال الطلب"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // الحصول على اسم الفئة
  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.name_ar || cat?.name || catId;
  };

  // نسخ الرابط
  const copyServiceId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("تم نسخ رقم الخدمة");
  };

  // حالة التحميل
  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="h-full flex flex-col">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
            <Skeleton className="h-12 rounded-2xl" />
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-24 rounded-xl shrink-0" />)}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Header Stats - Compact */}
        <div className="shrink-0 border-b border-border/50 bg-gradient-to-l from-primary/5 via-transparent to-transparent">
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-3 sm:p-4 text-primary-foreground cursor-pointer shadow-lg"
                onClick={() => navigate('/dashboard/deposit')}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
                <div className="relative flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs opacity-80">الرصيد</p>
                    <p className="text-lg sm:text-xl font-bold truncate">{(userBalance?.balance || 0).toFixed(2)} ر.س</p>
                  </div>
                </div>
              </motion.div>

              {/* Orders Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl bg-card border border-border/50 p-3 sm:p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">طلباتي</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{userStats?.totalOrders || 0}</p>
                  </div>
                </div>
              </motion.div>

              {/* Favorites Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-card border border-border/50 p-3 sm:p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">المفضلة</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{favorites.length}</p>
                  </div>
                </div>
              </motion.div>

              {/* Services Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl bg-card border border-border/50 p-3 sm:p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">الخدمات</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{filteredServices.length}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="shrink-0 p-3 sm:p-4 space-y-3 border-b border-border/30">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث برقم الخدمة أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-11 h-12 rounded-xl bg-muted/50 border-0 text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Platform Tabs */}
          <ScrollArea className="w-full -mx-1" dir="rtl">
            <div className="flex gap-2 px-1 pb-2">
              {socialNetworks.map((network) => {
                const Icon = network.icon;
                const count = getServicesByNetwork(network.id).length;
                const isActive = selectedNetwork === network.id;
                
                return (
                  <motion.button
                    key={network.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedNetwork(network.id);
                      setSelectedCategory("");
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl transition-all shrink-0",
                      "text-sm font-medium whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" style={{ color: isActive ? undefined : network.color }} />
                    <span>{network.name}</span>
                    <Badge variant="secondary" className={cn(
                      "h-5 px-1.5 text-[10px]",
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : ""
                    )}>
                      {count}
                    </Badge>
                  </motion.button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>

          {/* Category Filter */}
          {categoriesWithServices.length > 0 && (
            <ScrollArea className="w-full -mx-1" dir="rtl">
              <div className="flex gap-2 px-1 pb-1">
                <Button
                  variant={!selectedCategory ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 rounded-lg h-8"
                  onClick={() => setSelectedCategory("")}
                >
                  الكل
                </Button>
                {categoriesWithServices.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 rounded-lg h-8"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name_ar || cat.name}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          )}
        </div>

        {/* Services List */}
        <div className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4">
            {filteredServices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">لا توجد خدمات</h3>
                <p className="text-muted-foreground text-sm">جرب تغيير معايير البحث</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredServices.map((service, index) => {
                    const features = parseFeatures(service.features);
                    const isFav = favorites.includes(service.id);
                    const pricePerK = convertToSAR(service.price);
                    
                    return (
                      <motion.div
                        key={service.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.02 }}
                        className="group bg-card rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden"
                      >
                        <div className="p-3 sm:p-4">
                          <div className="flex gap-3">
                            {/* Service Info */}
                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyServiceId(service.external_service_id || service.id);
                                    }}
                                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 hover:bg-muted text-xs text-muted-foreground transition-colors"
                                  >
                                    <span className="font-mono">{service.external_service_id || service.id.slice(0, 8)}</span>
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  {features.refill && (
                                    <Badge variant="secondary" className="shrink-0 gap-1 text-xs bg-emerald-500/10 text-emerald-600 border-0">
                                      <RefreshCw className="w-3 h-3" />
                                      تعويض
                                    </Badge>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(service.id);
                                  }}
                                  className={cn(
                                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                    isFav 
                                      ? "bg-red-500/10 text-red-500" 
                                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
                                </button>
                              </div>

                              {/* Name */}
                              <h3 className="font-medium text-sm sm:text-base text-foreground line-clamp-2 leading-relaxed">
                                {service.name}
                              </h3>

                              {/* Meta */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  الحد الأدنى: {features.min.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  الحد الأقصى: {features.max.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Price & Order */}
                            <div className="shrink-0 flex flex-col items-end justify-between gap-2">
                              <div className="text-left">
                                <p className="text-[10px] text-muted-foreground">لكل 1000</p>
                                <p className="text-lg sm:text-xl font-bold text-primary">
                                  {pricePerK.toFixed(2)}
                                  <span className="text-xs font-normal mr-1">ر.س</span>
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleSelectService(service)}
                                className="gap-1.5 rounded-xl h-9 px-4 shadow-sm"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                <span className="hidden sm:inline">طلب</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Order Sheet */}
        <Sheet open={showOrderSheet} onOpenChange={setShowOrderSheet}>
          <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-3xl p-0">
            <div className="p-6 space-y-6">
              <SheetHeader className="text-right">
                <SheetTitle className="text-xl">طلب جديد</SheetTitle>
                <SheetDescription>
                  {selectedService?.name}
                </SheetDescription>
              </SheetHeader>

              {selectedService && (
                <div className="space-y-5">
                  {/* Service Summary */}
                  <div className="rounded-2xl bg-muted/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">رقم الخدمة</span>
                      <button
                        onClick={() => copyServiceId(selectedService.external_service_id || selectedService.id)}
                        className="flex items-center gap-1 text-sm font-mono text-foreground hover:text-primary transition-colors"
                      >
                        {selectedService.external_service_id || selectedService.id.slice(0, 8)}
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">السعر لكل 1000</span>
                      <span className="font-bold text-primary">{convertToSAR(selectedService.price).toFixed(2)} ر.س</span>
                    </div>
                    {parseFeatures(selectedService.features).refill && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">تعويض مجاني متاح</span>
                      </div>
                    )}
                  </div>

                  {/* Link Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">الرابط</Label>
                    <div className="relative">
                      <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="https://..."
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="pr-11 h-12 rounded-xl text-left dir-ltr"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">الكمية</Label>
                      <span className="text-xs text-muted-foreground">
                        {parseFeatures(selectedService.features).min.toLocaleString()} - {parseFeatures(selectedService.features).max.toLocaleString()}
                      </span>
                    </div>
                    <Input
                      type="number"
                      placeholder="أدخل الكمية"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="h-12 rounded-xl text-center text-lg font-bold"
                      min={parseFeatures(selectedService.features).min}
                      max={parseFeatures(selectedService.features).max}
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-muted-foreground">رصيدك الحالي</span>
                      <span className="font-bold">{(userBalance?.balance || 0).toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex items-center justify-between text-lg">
                      <span className="font-medium">إجمالي الطلب</span>
                      <span className={cn(
                        "text-2xl font-bold",
                        totalPrice > (userBalance?.balance || 0) ? "text-destructive" : "text-primary"
                      )}>
                        {totalPrice.toFixed(2)} ر.س
                      </span>
                    </div>
                    {totalPrice > (userBalance?.balance || 0) && (
                      <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        رصيدك غير كافي، يرجى شحن الرصيد
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !link || !quantity || totalPrice > (userBalance?.balance || 0)}
                    className="w-full h-14 rounded-xl text-lg font-bold gap-2 shadow-lg"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        تأكيد الطلب
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
