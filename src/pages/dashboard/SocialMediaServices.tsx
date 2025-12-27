import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
  Link2,
  Hash,
  Loader2,
  Ghost,
  Radio,
  Package,
  TrendingUp,
  Wallet,
  Star,
  RefreshCw,
  Zap,
  Timer,
  Shield,
  ShoppingCart,
  Sparkles,
  ChevronDown,
  X,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
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
  { id: 'twitter', name: 'تويتر', keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: Twitter, color: '#1DA1F2' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], icon: Radio, color: '#1DB954' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], icon: Music2, color: '#000000' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان', 'لينكد ان', 'لينكدإن'], icon: Linkedin, color: '#0A66C2' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, color: '#0088CC' },
  { id: 'snapchat', name: 'سناب', keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, color: '#FFFC00' },
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

  const { data: userBalance, refetch: refetchBalance } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("user_balances").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

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

  const designDevKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 'برمجة', 'تطوير', 'dev', 'development', 'app'];
  
  const socialMediaServices = useMemo(() => {
    return services.filter(service => {
      const text = `${service.category} ${service.name}`.toLowerCase();
      return !designDevKeywords.some(k => text.includes(k));
    });
  }, [services]);

  const getNetworkFromText = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id === 'all') continue;
      if (network.keywords.some(k => lowerText.includes(k))) {
        return network;
      }
    }
    return null;
  }, []);

  const getServicesByNetwork = useCallback((networkId: string) => {
    if (networkId === 'all') return socialMediaServices;
    const network = socialNetworks.find(n => n.id === networkId);
    if (!network || network.keywords.length === 0) return socialMediaServices;
    return socialMediaServices.filter(s => {
      const text = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => text.includes(k));
    });
  }, [socialMediaServices]);

  const categoriesWithServices = useMemo(() => {
    const networkServices = getServicesByNetwork(selectedNetwork);
    const categoryIds = new Set(networkServices.map(s => s.category_id).filter(Boolean));
    return categories.filter(c => categoryIds.has(c.id));
  }, [categories, selectedNetwork, getServicesByNetwork]);

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

  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    const priceInUSD = (selectedService.price / 1000) * qty;
    return convertToSAR(priceInUSD);
  }, [selectedService, quantity, convertToSAR]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    const features = parseFeatures(service.features);
    setQuantity(features.min.toString());
    if (isMobile) setShowOrderSheet(true);
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("يجب تسجيل الدخول للطلب"); return; }
    if (!selectedService || !link || !quantity) { toast.error("يرجى ملء جميع الحقول المطلوبة"); return; }
    
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

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }} 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-muted-foreground">جاري تحميل الخدمات...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 pb-24 lg:pb-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <StatCard 
            icon={TrendingUp} 
            iconColor="#8B5CF6" 
            label="إجمالي الطلبات" 
            value={userStats?.totalOrders || 0} 
          />
          <StatCard 
            icon={Wallet} 
            iconColor="#3B82F6" 
            label="إجمالي المصروفات" 
            value={`${userStats?.totalSpent?.toFixed(0) || 0} ر.س`} 
          />
          <StatCard 
            icon={Star} 
            iconColor="#F59E0B" 
            label="رصيدك الحالي" 
            value={`${userBalance?.balance?.toFixed(2) || '0.00'} ر.س`}
            onClick={() => navigate('/dashboard/deposit')}
            highlight
          />
        </div>

        {/* Platform Tabs - Horizontal scroll */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
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
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-card border border-border hover:border-primary/50"
                  )}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${network.color}15` }}
                  >
                    <IconComponent className="w-4 h-4" style={{ color: isSelected ? 'currentColor' : network.color }} />
                  </div>
                  <span className="font-medium text-sm">{network.name}</span>
                  <Badge variant={isSelected ? "secondary" : "outline"} className="text-[10px] px-1.5">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن خدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-11 bg-card border-border"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Category Filter */}
        {(showFilters || !isMobile) && categoriesWithServices.length > 0 && (
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedCategory("")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  !selectedCategory 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                الكل ({getServicesByNetwork(selectedNetwork).length})
              </button>
              {categoriesWithServices.map((category) => {
                const count = getServicesByNetwork(selectedNetwork).filter(s => s.category_id === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                      selectedCategory === category.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {category.name_ar} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Services List */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">الخدمات</h2>
                <Badge variant="secondary">{filteredServices.length}</Badge>
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">لا توجد خدمات متاحة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedService?.id === service.id}
                    isFavorite={favorites.includes(service.id)}
                    onSelect={() => handleSelectService(service)}
                    onToggleFavorite={() => toggleFavorite(service.id)}
                    parseFeatures={parseFeatures}
                    getNetworkFromText={getNetworkFromText}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Order Form - Desktop */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="bg-card rounded-2xl border border-border p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h3 className="font-bold">تفاصيل الطلب</h3>
              </div>
              <OrderForm 
                selectedService={selectedService}
                link={link}
                setLink={setLink}
                quantity={quantity}
                setQuantity={setQuantity}
                totalPrice={totalPrice}
                userBalance={userBalance}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                parseFeatures={parseFeatures}
                getNetworkFromText={getNetworkFromText}
              />
            </div>
          </div>
        </div>

        {/* Mobile Order Sheet */}
        <Sheet open={showOrderSheet} onOpenChange={setShowOrderSheet}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
            <div className="p-4 border-b border-border">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-right">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  تفاصيل الطلب
                </SheetTitle>
              </SheetHeader>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
              <OrderForm 
                selectedService={selectedService}
                link={link}
                setLink={setLink}
                quantity={quantity}
                setQuantity={setQuantity}
                totalPrice={totalPrice}
                userBalance={userBalance}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                parseFeatures={parseFeatures}
                getNetworkFromText={getNetworkFromText}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile FAB */}
        {isMobile && selectedService && !showOrderSheet && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-20 left-4 right-4 z-50"
          >
            <Button
              onClick={() => setShowOrderSheet(true)}
              className="w-full h-14 rounded-2xl text-base gap-3 bg-gradient-to-r from-primary to-purple-600 shadow-xl"
            >
              <ShoppingCart className="w-5 h-5" />
              اطلب الآن - {totalPrice.toFixed(2)} ر.س
            </Button>
          </motion.div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

// Stat Card Component
const StatCard = ({ 
  icon: Icon, 
  iconColor, 
  label, 
  value, 
  onClick, 
  highlight 
}: { 
  icon: any; 
  iconColor: string; 
  label: string; 
  value: string | number; 
  onClick?: () => void;
  highlight?: boolean;
}) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-card rounded-xl p-3 border border-border relative overflow-hidden",
      onClick && "cursor-pointer hover:border-primary/50 transition-colors"
    )}
  >
    <div 
      className="absolute top-0 left-0 right-0 h-1"
      style={{ background: `linear-gradient(90deg, ${iconColor}, ${iconColor}80)` }}
    />
    <div className="flex items-center gap-2 sm:gap-3">
      <div 
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</p>
        <p className={cn(
          "text-sm sm:text-lg font-bold truncate",
          highlight && "text-primary"
        )}>{value}</p>
      </div>
    </div>
  </div>
);

// Service Card Component
const ServiceCard = ({ 
  service, 
  isSelected, 
  isFavorite, 
  onSelect, 
  onToggleFavorite,
  parseFeatures,
  getNetworkFromText 
}: {
  service: Service;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  parseFeatures: (features: any) => any;
  getNetworkFromText: (text: string) => any;
}) => {
  const features = parseFeatures(service.features);
  const network = getNetworkFromText(service.name);
  const IconComponent = network?.icon || Package;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "bg-card rounded-xl p-4 cursor-pointer transition-all border group",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${network?.color || '#8B5CF6'}15` }}
        >
          <IconComponent className="w-5 h-5" style={{ color: network?.color || '#8B5CF6' }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="secondary" className="text-[9px] shrink-0">
              #{service.external_service_id || service.id.slice(0,4)}
            </Badge>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              className="p-1 -m-1"
            >
              <Heart className={cn(
                "w-4 h-4 transition-colors",
                isFavorite ? "text-red-500 fill-current" : "text-muted-foreground"
              )} />
            </button>
          </div>
          
          <p className="font-medium text-sm leading-tight line-clamp-2 mb-2">{service.name}</p>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-primary font-bold">{service.price.toFixed(2)} ر.س</span>
            <span className="text-muted-foreground">{features.min} - {features.max}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {service.refill_enabled && (
              <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                <RefreshCw className="w-3 h-3" />
                إعادة تعبئة
              </span>
            )}
            {features.cancel && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" />
                قابل للإلغاء
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Order Form Component
const OrderForm = ({
  selectedService,
  link,
  setLink,
  quantity,
  setQuantity,
  totalPrice,
  userBalance,
  isSubmitting,
  onSubmit,
  parseFeatures,
  getNetworkFromText
}: {
  selectedService: Service | null;
  link: string;
  setLink: (v: string) => void;
  quantity: string;
  setQuantity: (v: string) => void;
  totalPrice: number;
  userBalance: any;
  isSubmitting: boolean;
  onSubmit: () => void;
  parseFeatures: (features: any) => any;
  getNetworkFromText: (text: string) => any;
}) => {
  if (!selectedService) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="w-20 h-20 mb-4 opacity-20" />
        <p className="text-sm">اختر خدمة من القائمة للبدء</p>
      </div>
    );
  }

  const features = parseFeatures(selectedService.features);
  const network = getNetworkFromText(selectedService.name);
  const IconComponent = network?.icon || Package;

  return (
    <div className="space-y-4">
      {/* Selected Service Info */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
        <div className="flex items-start gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${network?.color || '#8B5CF6'}15` }}
          >
            <IconComponent className="w-6 h-6" style={{ color: network?.color || '#8B5CF6' }} />
          </div>
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="text-[10px] mb-1">
              #{selectedService.external_service_id || selectedService.id.slice(0,6)}
            </Badge>
            <p className="font-semibold text-sm leading-tight">{selectedService.name}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>الحد: {features.min} - {features.max}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>السعر: {selectedService.price.toFixed(2)} / 1000</span>
          </div>
          {selectedService.refill_enabled && (
            <div className="flex items-center gap-2 text-green-500">
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تعبئة: {selectedService.refill_days} يوم</span>
            </div>
          )}
          {features.cancel && (
            <div className="flex items-center gap-2 text-amber-500">
              <Shield className="w-4 h-4" />
              <span>قابل للإلغاء</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Link Input */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          الرابط <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="https://instagram.com/username"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="text-left bg-background h-12"
          dir="ltr"
        />
      </div>
      
      {/* Quantity Input */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" />
          الكمية <span className="text-destructive">*</span>
        </Label>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min={features.min}
          max={features.max}
          className="bg-background h-12"
          placeholder={`من ${features.min} إلى ${features.max}`}
        />
      </div>
      
      {/* Price Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted-foreground">إجمالي الطلب</span>
          <span className="text-2xl font-bold text-primary">{totalPrice.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">رصيدك</span>
          <span className={cn(
            "font-medium",
            userBalance && userBalance.balance >= totalPrice ? "text-green-500" : "text-red-500"
          )}>
            {userBalance?.balance.toFixed(2) || '0.00'} ر.س
          </span>
        </div>
      </div>
      
      {/* Submit Button */}
      <Button
        className="w-full h-14 text-base gap-3 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
        onClick={onSubmit}
        disabled={isSubmitting || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري الإرسال...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            إرسال الطلب
          </>
        )}
      </Button>
    </div>
  );
};

export default SocialMediaServices;
