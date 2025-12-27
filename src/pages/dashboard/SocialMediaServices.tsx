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
  Loader2,
  Ghost,
  Radio,
  Package,
  TrendingUp,
  Wallet,
  Star,
  ShoppingCart,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Hash,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const { convertToSAR } = useExchangeRate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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

  // Toggle category
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // حالة التحميل
  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="min-h-screen">
        {/* Page Header */}
        <div className="bg-gradient-to-l from-primary/10 via-accent/5 to-transparent border-b border-border/50 px-4 py-6 sm:px-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">خدمات التواصل الاجتماعي</h1>
            <p className="text-muted-foreground text-sm sm:text-base">اختر المنصة والخدمة المناسبة لزيادة تفاعلك</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
              onClick={() => navigate('/dashboard/deposit')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">رصيدك</p>
                    <p className="text-lg sm:text-xl font-bold text-primary">{(userBalance?.balance || 0).toFixed(2)} ر.س</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">طلباتك</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-500">{userStats?.totalOrders || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">المفضلة</p>
                    <p className="text-lg sm:text-xl font-bold text-amber-500">{favorites.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">الخدمات</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-500">{socialMediaServices.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Tabs */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <ScrollArea className="w-full" dir="rtl">
                <div className="flex gap-2 pb-2">
                  {socialNetworks.map((network) => {
                    const count = getServicesByNetwork(network.id).length;
                    const isSelected = selectedNetwork === network.id;
                    const IconComponent = network.icon;
                    
                    return (
                      <button
                        key={network.id}
                        onClick={() => { setSelectedNetwork(network.id); setSelectedCategory(""); }}
                        className={cn(
                          "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all whitespace-nowrap shrink-0",
                          isSelected 
                            ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                            : "bg-muted/50 hover:bg-muted border border-transparent hover:border-border"
                        )}
                      >
                        <div 
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-white/20" : ""
                          )}
                          style={{ backgroundColor: isSelected ? undefined : `${network.color}20` }}
                        >
                          <IconComponent 
                            className="w-4 h-4" 
                            style={{ color: isSelected ? 'currentColor' : network.color }} 
                          />
                        </div>
                        <span className="text-sm font-medium">{network.name}</span>
                        <Badge 
                          variant={isSelected ? "secondary" : "outline"} 
                          className={cn(
                            "text-[10px] h-5 min-w-[24px] justify-center",
                            isSelected && "bg-white/20 text-white border-white/30"
                          )}
                        >
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن خدمة... (اسم، رقم)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-12 text-base"
              />
            </div>
            <ScrollArea className="w-full sm:w-auto sm:max-w-md" dir="rtl">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={!selectedCategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("")}
                  className="shrink-0 h-10"
                >
                  الكل
                </Button>
                {categoriesWithServices.map(cat => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="shrink-0 whitespace-nowrap h-10"
                  >
                    {cat.name_ar}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Services List */}
          <div className="space-y-4">
            {Object.entries(groupedServices).length === 0 ? (
              <Card className="py-16">
                <CardContent className="text-center">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد خدمات</h3>
                  <p className="text-muted-foreground">جرب تغيير البحث أو اختر منصة أخرى</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedServices).map(([catId, catServices]) => {
                const isExpanded = expandedCategories.includes(catId);
                const displayServices = isExpanded ? catServices : catServices.slice(0, 5);
                
                return (
                  <Card key={catId} className="overflow-hidden">
                    <CardHeader className="py-4 px-4 sm:px-6 bg-muted/30 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <Hash className="w-5 h-5 text-primary" />
                          {getCategoryName(catId)}
                          <Badge variant="secondary" className="mr-2">
                            {catServices.length} خدمة
                          </Badge>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Table Header - Desktop */}
                      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/20 text-xs font-medium text-muted-foreground border-b">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-5">الخدمة</div>
                        <div className="col-span-2 text-center">الكمية</div>
                        <div className="col-span-2 text-center">السعر / 1000</div>
                        <div className="col-span-2 text-center">إجراء</div>
                      </div>
                      
                      {/* Services */}
                      <div className="divide-y divide-border">
                        {displayServices.map((service) => {
                          const features = parseFeatures(service.features);
                          const isFavorite = favorites.includes(service.id);
                          const pricePerK = convertToSAR(service.price);
                          
                          return (
                            <div 
                              key={service.id} 
                              className="group hover:bg-muted/30 transition-colors"
                            >
                              {/* Desktop View */}
                              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                                <div className="col-span-1">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {service.external_service_id || '-'}
                                  </Badge>
                                </div>
                                <div className="col-span-5">
                                  <div className="flex items-start gap-3">
                                    <button
                                      onClick={() => toggleFavorite(service.id)}
                                      className="mt-1 shrink-0"
                                    >
                                      <Heart 
                                        className={cn(
                                          "w-4 h-4 transition-colors",
                                          isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
                                        )} 
                                      />
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-sm leading-relaxed line-clamp-2">{service.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {(service.refill_enabled || features.refill) && (
                                          <Badge variant="outline" className="text-[10px] h-5 gap-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                                            <RefreshCw className="w-3 h-3" />
                                            إعادة تعبئة
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-span-2 text-center">
                                  <span className="text-sm text-muted-foreground">
                                    {features.min.toLocaleString()} - {features.max.toLocaleString()}
                                  </span>
                                </div>
                                <div className="col-span-2 text-center">
                                  <span className="font-bold text-primary text-base">
                                    {pricePerK.toFixed(2)} ر.س
                                  </span>
                                </div>
                                <div className="col-span-2 text-center">
                                  <Button 
                                    size="sm"
                                    onClick={() => handleSelectService(service)}
                                    className="gap-1"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    طلب
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Mobile View */}
                              <div className="md:hidden p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                                        {service.external_service_id || '-'}
                                      </Badge>
                                      {(service.refill_enabled || features.refill) && (
                                        <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                                          <RefreshCw className="w-2.5 h-2.5" />
                                          تعبئة
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">{service.name}</p>
                                  </div>
                                  <button
                                    onClick={() => toggleFavorite(service.id)}
                                    className="shrink-0 p-2 -m-2"
                                  >
                                    <Heart 
                                      className={cn(
                                        "w-5 h-5 transition-colors",
                                        isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                                      )} 
                                    />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>الكمية: {features.min.toLocaleString()} - {features.max.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-primary">
                                      {pricePerK.toFixed(2)} ر.س
                                    </span>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleSelectService(service)}
                                      className="h-8 px-3"
                                    >
                                      طلب
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Show More */}
                      {catServices.length > 5 && (
                        <button
                          onClick={() => toggleCategory(catId)}
                          className="w-full py-3 text-sm font-medium text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 border-t"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              عرض أقل
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              عرض المزيد ({catServices.length - 5} خدمة)
                            </>
                          )}
                        </button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-lg mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="w-5 h-5 text-primary" />
              طلب جديد
            </DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الطلب لإكمال العملية
            </DialogDescription>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-5">
              {/* Service Info */}
              <div className="p-4 rounded-xl bg-muted/50 border">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="font-mono shrink-0">
                    {selectedService.external_service_id || '-'}
                  </Badge>
                  <p className="text-sm font-medium leading-relaxed flex-1">{selectedService.name}</p>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>الكمية: {parseFeatures(selectedService.features).min.toLocaleString()} - {parseFeatures(selectedService.features).max.toLocaleString()}</span>
                  {(selectedService.refill_enabled || parseFeatures(selectedService.features).refill) && (
                    <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                      <RefreshCw className="w-3 h-3" />
                      إعادة تعبئة
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Link Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  الرابط
                </Label>
                <Input
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  dir="ltr"
                  className="h-11"
                />
              </div>
              
              {/* Quantity Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  الكمية
                </Label>
                <Input
                  type="number"
                  placeholder="الكمية"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={parseFeatures(selectedService.features).min}
                  max={parseFeatures(selectedService.features).max}
                  className="h-11"
                />
              </div>
              
              {/* Price Summary */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground">رصيدك الحالي</span>
                  <span className="font-medium">{(userBalance?.balance || 0).toFixed(2)} ر.س</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>إجمالي الطلب</span>
                  <span className="text-primary">{totalPrice.toFixed(2)} ر.س</span>
                </div>
                {userBalance && userBalance.balance < totalPrice && (
                  <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    رصيدك غير كافي
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
              className="gap-2"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
