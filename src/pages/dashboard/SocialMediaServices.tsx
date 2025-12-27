import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useExchangeRate } from "@/hooks/useExchangeRate";
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
  Hash,
  Loader2,
  Ghost,
  Radio,
  Package,
  TrendingUp,
  Wallet,
  Star,
  Zap,
  ShoppingCart,
  Sparkles,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  ChevronRight,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/adminNotifyService";
import { useIsMobile } from "@/hooks/use-mobile";

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
  { id: 'all', name: 'الكل', keywords: [], icon: Sparkles, color: '#8B5CF6' },
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
  const queryClient = useQueryClient();
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

  // تجميع الخدمات حسب الفئة
  const groupedServices = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      const catId = service.category_id || 'other';
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push(service);
    });
    return grouped;
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

  // حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />)}
        </div>
        <Skeleton className="h-12 rounded-xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Stats */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent p-4 border-b">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard 
            icon={Wallet} 
            label="رصيدك" 
            value={`${(userBalance?.balance || 0).toFixed(2)} ر.س`}
            color="primary"
            onClick={() => navigate('/dashboard/deposit')}
          />
          <StatCard 
            icon={TrendingUp} 
            label="طلباتك" 
            value={userStats?.totalOrders || 0}
            color="blue"
          />
          <StatCard 
            icon={Star} 
            label="المفضلة" 
            value={favorites.length}
            color="yellow"
          />
          <StatCard 
            icon={Package} 
            label="الخدمات" 
            value={socialMediaServices.length}
            color="green"
          />
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="p-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {socialNetworks.map((network) => {
              const count = getServicesByNetwork(network.id).length;
              const isSelected = selectedNetwork === network.id;
              const IconComponent = network.icon;
              
              return (
                <button
                  key={network.id}
                  onClick={() => { setSelectedNetwork(network.id); setSelectedCategory(""); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap",
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "bg-card border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isSelected ? "bg-white/20" : ""
                    )}
                    style={{ backgroundColor: isSelected ? undefined : `${network.color}15` }}
                  >
                    <IconComponent 
                      className="w-4 h-4" 
                      style={{ color: isSelected ? 'currentColor' : network.color }} 
                    />
                  </div>
                  <span className="font-medium text-sm">{network.name}</span>
                  <Badge 
                    variant={isSelected ? "secondary" : "outline"} 
                    className="text-[10px] px-1.5 h-5"
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث برقم الخدمة أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-11 h-11 text-base bg-card"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        {categoriesWithServices.length > 0 && (
          <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedCategory("")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  !selectedCategory 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                الكل
              </button>
              {categoriesWithServices.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    selectedCategory === category.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {category.name_ar || category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Services List */}
      <div className="p-4">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">لا توجد خدمات</p>
            <p className="text-sm text-muted-foreground/70">جرب البحث بكلمات أخرى</p>
          </div>
        ) : (
          <Accordion 
            type="multiple" 
            defaultValue={Object.keys(groupedServices)} 
            className="space-y-3"
          >
            {Object.entries(groupedServices).map(([catId, catServices]) => (
              <AccordionItem
                key={catId}
                value={catId}
                className="border rounded-2xl overflow-hidden bg-card shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="font-bold text-base">{getCategoryName(catId)}</h3>
                      <p className="text-xs text-muted-foreground">{catServices.length} خدمة متاحة</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {catServices.map((service) => {
                      const features = parseFeatures(service.features);
                      const isFavorite = favorites.includes(service.id);
                      
                      return (
                        <div
                          key={service.id}
                          className="p-4 hover:bg-muted/30 transition-colors"
                        >
                          {/* Service Header */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                {service.external_service_id && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                                    #{service.external_service_id}
                                  </Badge>
                                )}
                                {service.refill_enabled && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-500/50 bg-green-50 dark:bg-green-950/30">
                                    <Zap className="w-3 h-3 ml-0.5" />
                                    تعويض {service.refill_days}ي
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-sm leading-snug line-clamp-2">
                                {service.name}
                              </h4>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(service.id); }}
                              className="p-2 hover:bg-muted rounded-xl transition-colors shrink-0"
                            >
                              <Heart
                                className={cn(
                                  "w-5 h-5 transition-colors",
                                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                                )}
                              />
                            </button>
                          </div>

                          {/* Description */}
                          {service.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {service.description}
                            </p>
                          )}

                          {/* Service Details */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Hash className="w-3.5 h-3.5" />
                              {features.min.toLocaleString()} - {features.max.toLocaleString()}
                            </span>
                            {service.refill_days && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {service.refill_days} يوم
                              </span>
                            )}
                          </div>

                          {/* Price & Order */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div>
                              <span className="text-xl font-bold text-primary">
                                ${service.price.toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground mr-1">/ 1000</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSelectService(service)}
                              className="gap-1.5 rounded-xl"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>اطلب الآن</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              طلب جديد
            </DialogTitle>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4">
              {/* Service Info */}
              <div className="bg-muted/50 rounded-xl p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  {selectedService.external_service_id && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      #{selectedService.external_service_id}
                    </Badge>
                  )}
                  {selectedService.refill_enabled && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      <Zap className="w-3 h-3 ml-1" />
                      تعويض
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-sm mb-2">{selectedService.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">
                    ${selectedService.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 1000</span>
                </div>
              </div>

              {/* Link Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  الرابط
                </Label>
                <Input
                  placeholder="https://instagram.com/username"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  dir="ltr"
                  className="h-11"
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  الكمية
                </Label>
                <Input
                  type="number"
                  placeholder={`من ${parseFeatures(selectedService.features).min} إلى ${parseFeatures(selectedService.features).max}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={parseFeatures(selectedService.features).min}
                  max={parseFeatures(selectedService.features).max}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  الحد الأدنى: {parseFeatures(selectedService.features).min.toLocaleString()} | 
                  الأقصى: {parseFeatures(selectedService.features).max.toLocaleString()}
                </p>
              </div>

              {/* Price Summary */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الكمية</span>
                  <span className="font-medium">{parseInt(quantity) || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">السعر لكل 1000</span>
                  <span className="font-medium">${selectedService.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">رصيدك الحالي</span>
                  <span className="font-medium">{(userBalance?.balance || 0).toFixed(2)} ر.س</span>
                </div>
                <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                  <span className="font-bold">الإجمالي</span>
                  <span className="text-xl font-bold text-primary">{totalPrice.toFixed(2)} ر.س</span>
                </div>
                {totalPrice > (userBalance?.balance || 0) && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>الرصيد غير كافي</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mr-auto text-xs h-7"
                      onClick={() => navigate('/dashboard/deposit')}
                    >
                      شحن الرصيد
                    </Button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                className="w-full h-12 text-base font-bold"
                onClick={handleSubmit}
                disabled={isSubmitting || totalPrice > (userBalance?.balance || 0) || !link.trim() || !quantity}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 ml-2" />
                    تأكيد الطلب
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  color: 'primary' | 'blue' | 'yellow' | 'green';
  onClick?: () => void;
}

const StatCard = ({ icon: Icon, label, value, color, onClick }: StatCardProps) => {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-500/10 text-blue-500',
    yellow: 'bg-yellow-500/10 text-yellow-600',
    green: 'bg-green-500/10 text-green-600',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl p-3 border text-right w-full transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold truncate">{value}</p>
    </button>
  );
};

export default SocialMediaServices;
