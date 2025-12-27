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
  Copy,
  TrendingUp,
  Package,
  Target,
  Clock,
  ChevronDown,
  Layers,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  { id: 'all', name: 'الكل', keywords: [], icon: Sparkles, color: 'bg-primary' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, color: 'bg-gradient-to-br from-purple-600 to-pink-500' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, color: 'bg-blue-600' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, color: 'bg-red-600' },
  { id: 'twitter', name: 'X', keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: Twitter, color: 'bg-sky-500' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], icon: Music2, color: 'bg-gray-900' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], icon: Radio, color: 'bg-green-600' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, color: 'bg-sky-500' },
  { id: 'snapchat', name: 'سناب', keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, color: 'bg-yellow-400' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان', 'لينكد ان', 'لينكدإن'], icon: Linkedin, color: 'bg-blue-700' },
  { id: 'website', name: 'المواقع', keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع', 'ويب'], icon: Globe, color: 'bg-emerald-600' },
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
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

  // إحصاء خدمات كل منصة
  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    socialNetworks.forEach(network => {
      counts[network.id] = getServicesByNetwork(network.id).length;
    });
    return counts;
  }, [getServicesByNetwork]);

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

  // تجميع الخدمات حسب الفئة
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      const catId = service.category_id || 'other';
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(service);
    });
    return groups;
  }, [filteredServices]);

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
    setShowOrderDialog(true);
  };

  // Toggle category expansion
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(catId)) {
        newSet.delete(catId);
      } else {
        newSet.add(catId);
      }
      return newSet;
    });
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
      setShowOrderDialog(false);
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

  // نسخ رقم الخدمة
  const copyServiceId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("تم نسخ رقم الخدمة");
  };

  // حالة التحميل
  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="w-full h-full overflow-hidden">
          <div className="p-4 space-y-4 max-w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <Skeleton className="h-12 rounded-xl w-full" />
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-16 rounded-xl shrink-0" />)}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl w-full" />)}
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="w-full h-full overflow-x-hidden overflow-y-auto bg-background">
        <div className="w-full max-w-full p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {/* Balance */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/dashboard/deposit')}
              className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-3 md:p-4 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs opacity-80">رصيدك</span>
              </div>
              <p className="text-lg md:text-xl font-bold">{(userBalance?.balance || 0).toFixed(2)}</p>
              <p className="text-[10px] opacity-70">ريال سعودي</p>
            </motion.div>

            {/* Orders */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-3 md:p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                <span className="text-xs text-muted-foreground">طلباتي</span>
              </div>
              <p className="text-lg md:text-xl font-bold">{userStats?.totalOrders || 0}</p>
              <p className="text-[10px] text-muted-foreground">طلب مكتمل</p>
            </motion.div>

            {/* Favorites */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-3 md:p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
                <span className="text-xs text-muted-foreground">المفضلة</span>
              </div>
              <p className="text-lg md:text-xl font-bold">{favorites.length}</p>
              <p className="text-[10px] text-muted-foreground">خدمة محفوظة</p>
            </motion.div>

            {/* Services */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-xl p-3 md:p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                <span className="text-xs text-muted-foreground">الخدمات</span>
              </div>
              <p className="text-lg md:text-xl font-bold">{filteredServices.length}</p>
              <p className="text-[10px] text-muted-foreground">خدمة متاحة</p>
            </motion.div>
          </div>

          {/* Search */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative w-full"
          >
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن خدمة بالاسم أو رقم الخدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-10 h-11 rounded-xl border-border bg-card"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </motion.div>

          {/* Platform Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full overflow-hidden"
          >
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2 px-0.5">
                {socialNetworks.map((network) => {
                  const Icon = network.icon;
                  const isSelected = selectedNetwork === network.id;
                  const count = networkCounts[network.id] || 0;
                  
                  return (
                    <button
                      key={network.id}
                      onClick={() => {
                        setSelectedNetwork(network.id);
                        setSelectedCategory("");
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-xl min-w-[60px] md:min-w-[72px] transition-all shrink-0 border",
                        isSelected
                          ? `${network.color} text-white border-transparent shadow-md`
                          : "bg-card border-border hover:border-primary/30"
                      )}
                    >
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-[10px] md:text-xs font-medium whitespace-nowrap">
                        {network.name}
                      </span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full",
                        isSelected ? "bg-white/20" : "bg-muted"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="h-0" />
            </ScrollArea>
          </motion.div>

          {/* Services List */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 w-full"
          >
            {filteredServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <h3 className="font-semibold text-foreground mb-1">لا توجد خدمات</h3>
                <p className="text-sm text-muted-foreground">جرب البحث بكلمات مختلفة</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-lg"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setSelectedNetwork("all");
                  }}
                >
                  إعادة ضبط
                </Button>
              </div>
            ) : (
              Object.entries(groupedServices).map(([catId, catServices]) => (
                <Collapsible 
                  key={catId}
                  open={expandedCategories.has(catId) || expandedCategories.size === 0}
                  onOpenChange={() => toggleCategory(catId)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{getCategoryName(catId)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {catServices.length}
                        </Badge>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        (expandedCategories.has(catId) || expandedCategories.size === 0) && "rotate-180"
                      )} />
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-2 space-y-2">
                      {catServices.map((service) => {
                        const features = parseFeatures(service.features);
                        const isFav = favorites.includes(service.id);
                        const pricePerK = convertToSAR(service.price);
                        
                        return (
                          <div
                            key={service.id}
                            className="w-full bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                              {/* Service Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-1.5">
                                  <h4 className="font-medium text-sm text-foreground leading-snug line-clamp-2 flex-1">
                                    {service.name}
                                  </h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(service.id);
                                    }}
                                    className={cn(
                                      "shrink-0 p-1.5 rounded-lg transition-colors",
                                      isFav 
                                        ? "bg-rose-500/10 text-rose-500" 
                                        : "bg-muted text-muted-foreground hover:text-rose-500"
                                    )}
                                  >
                                    <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
                                  </button>
                                </div>
                                
                                {/* Meta Info */}
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {service.external_service_id && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyServiceId(service.external_service_id!);
                                      }}
                                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                                    >
                                      <Copy className="w-3 h-3" />
                                      #{service.external_service_id}
                                    </button>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {features.min.toLocaleString()} - {features.max.toLocaleString()}
                                  </span>
                                  {service.refill_days && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {service.refill_days} يوم
                                    </span>
                                  )}
                                  {(service.refill_enabled || features.refill) && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-0">
                                      <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
                                      تعويض
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Price & Order */}
                              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-0 border-border">
                                <div className="text-left md:text-right">
                                  <p className="text-base md:text-lg font-bold text-primary">
                                    {pricePerK.toFixed(2)} ر.س
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">لكل 1000</p>
                                </div>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleSelectService(service)}
                                  className="rounded-lg gap-1.5 shrink-0"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                  اطلب
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </motion.div>
        </div>

        {/* Order Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-md mx-4 rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-primary/5 p-4 border-b border-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  طلب جديد
                </DialogTitle>
              </DialogHeader>
              
              {selectedService && (
                <div className="mt-3 p-3 bg-card rounded-xl border border-border">
                  <h4 className="font-medium text-sm text-foreground line-clamp-2">
                    {selectedService.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {selectedService.external_service_id && (
                      <span>#{selectedService.external_service_id}</span>
                    )}
                    {(selectedService.refill_enabled || parseFeatures(selectedService.features).refill) && (
                      <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 border-0">
                        <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
                        ضمان تعويض
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 space-y-4">
              {/* Link Input */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  رابط الحساب أو المنشور
                </Label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="rounded-lg"
                  dir="ltr"
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary" />
                  الكمية
                </Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="أدخل الكمية"
                  className="rounded-lg"
                  dir="ltr"
                />
                {selectedService && (
                  <p className="text-xs text-muted-foreground">
                    الحد: {parseFeatures(selectedService.features).min.toLocaleString()} - {parseFeatures(selectedService.features).max.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Price Summary */}
              <div className="p-3 bg-muted/50 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">السعر / 1000:</span>
                  <span>{selectedService ? convertToSAR(selectedService.price).toFixed(2) : 0} ر.س</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">الكمية:</span>
                  <span>{parseInt(quantity) || 0}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">الإجمالي:</span>
                  <span className="text-lg font-bold text-primary">{totalPrice.toFixed(2)} ر.س</span>
                </div>
                
                {userBalance && (
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-muted-foreground">رصيدك:</span>
                    <span className={cn(
                      "font-medium",
                      userBalance.balance >= totalPrice ? "text-green-600" : "text-red-500"
                    )}>
                      {userBalance.balance.toFixed(2)} ر.س
                    </span>
                  </div>
                )}
                
                {userBalance && userBalance.balance < totalPrice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/deposit')}
                    className="w-full mt-2 rounded-lg gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                  >
                    <Wallet className="w-4 h-4" />
                    شحن الرصيد
                  </Button>
                )}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
                className="w-full h-11 rounded-xl gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    تأكيد الطلب
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
