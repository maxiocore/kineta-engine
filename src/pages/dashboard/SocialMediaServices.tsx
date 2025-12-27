import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Tv,
  MessageCircle,
  ShoppingCart,
  Sparkles,
  Package,
  TrendingUp,
  Wallet,
  Star,
  Clock,
  RefreshCw,
  Zap,
  Info,
  ChevronRight,
  Check,
  X,
  Eye,
  Timer,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

// Social networks
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
  
  // State
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrderSheet, setShowOrderSheet] = useState(false);

  // Fetch user balance
  const { data: userBalance, refetch: refetchBalance } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("user_balances").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_price, status")
        .eq("user_id", user.id);
      
      const totalOrders = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
      
      return { totalOrders, totalSpent };
    },
    enabled: !!user?.id,
  });

  // Fetch categories
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

  // Fetch services
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

  // Filter design/dev services
  const designDevKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 'برمجة', 'تطوير', 'dev', 'development', 'app'];
  
  const socialMediaServices = useMemo(() => {
    return services.filter(service => {
      const text = `${service.category} ${service.name}`.toLowerCase();
      return !designDevKeywords.some(k => text.includes(k));
    });
  }, [services]);

  // Get network from text
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

  // Filter services by network
  const getServicesByNetwork = useCallback((networkId: string) => {
    if (networkId === 'all') return socialMediaServices;
    
    const network = socialNetworks.find(n => n.id === networkId);
    if (!network || network.keywords.length === 0) return socialMediaServices;
    
    return socialMediaServices.filter(s => {
      const text = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => text.includes(k));
    });
  }, [socialMediaServices]);

  // Categories with services
  const categoriesWithServices = useMemo(() => {
    const networkServices = getServicesByNetwork(selectedNetwork);
    const categoryIds = new Set(networkServices.map(s => s.category_id).filter(Boolean));
    return categories.filter(c => categoryIds.has(c.id));
  }, [categories, selectedNetwork, getServicesByNetwork]);

  // Filtered services
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

  // Parse features
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

  // Calculate price
  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    const priceInUSD = (selectedService.price / 1000) * qty;
    return convertToSAR(priceInUSD);
  }, [selectedService, quantity, convertToSAR]);

  // Handle service selection
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    const features = parseFeatures(service.features);
    setQuantity(features.min.toString());
    if (isMobile) {
      setShowOrderSheet(true);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!user) { 
      toast.error("يجب تسجيل الدخول للطلب"); 
      return; 
    }
    if (!selectedService || !link || !quantity) { 
      toast.error("يرجى ملء جميع الحقول المطلوبة"); 
      return; 
    }
    
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
        action: {
          label: "عرض الطلبات",
          onClick: () => navigate('/dashboard/orders')
        }
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
      
    } catch (error) { 
      toast.error("حدث خطأ أثناء إرسال الطلب"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // Order Form Component
  const OrderForm = () => (
    <div className="space-y-4">
      {!selectedService ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-sm">اختر خدمة من القائمة</p>
        </div>
      ) : (
        <>
          {/* Service Info */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-3">
            <div className="flex items-start gap-3">
              {(() => {
                const network = getNetworkFromText(selectedService.name);
                const IconComponent = network?.icon || Package;
                return (
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${network?.color || '#8B5CF6'}15` }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: network?.color || '#8B5CF6' }} />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className="text-[10px] mb-1">
                  #{selectedService.external_service_id || selectedService.id.slice(0,6)}
                </Badge>
                <p className="font-semibold text-sm leading-tight">{selectedService.name}</p>
              </div>
            </div>
            
            {/* Service Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Timer className="w-3.5 h-3.5" />
                <span>الحد: {parseFeatures(selectedService.features).min} - {parseFeatures(selectedService.features).max}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="w-3.5 h-3.5" />
                <span>السعر: {selectedService.price.toFixed(2)} / 1000</span>
              </div>
              {selectedService.refill_enabled && (
                <div className="flex items-center gap-1.5 text-green-500">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة تعبئة: {selectedService.refill_days} يوم</span>
                </div>
              )}
              {parseFeatures(selectedService.features).cancel && (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Shield className="w-3.5 h-3.5" />
                  <span>قابل للإلغاء</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Link Input */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-primary" />
              الرابط <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="https://instagram.com/username"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="text-left bg-secondary/30 h-11"
              dir="ltr"
            />
          </div>
          
          {/* Quantity Input */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-primary" />
              الكمية <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={parseFeatures(selectedService.features).min}
              max={parseFeatures(selectedService.features).max}
              className="bg-secondary/30 h-11"
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
            className="w-full h-12 text-base gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
            onClick={handleSubmit}
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
        </>
      )}
    </div>
  );

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
      <div className="h-full flex flex-col gap-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-card to-card/50 rounded-xl p-3 border border-border/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">إجمالي الطلبات</p>
                <p className="text-lg font-bold">{userStats?.totalOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-card to-card/50 rounded-xl p-3 border border-border/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">إجمالي المصروفات</p>
                <p className="text-lg font-bold">{userStats?.totalSpent?.toFixed(0) || 0} <span className="text-xs">ر.س</span></p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-card to-card/50 rounded-xl p-3 border border-border/50 relative overflow-hidden cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/dashboard/deposit')}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">رصيدك الحالي</p>
                <p className="text-lg font-bold text-primary">{userBalance?.balance?.toFixed(2) || '0.00'} <span className="text-xs">ر.س</span></p>
              </div>
            </div>
            <p className="text-[10px] text-primary mt-1">إيداع المزيد ←</p>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="bg-card/50 rounded-xl border border-border/50 p-2">
          <ScrollArea className="w-full" dir="rtl">
            <div className="flex gap-1.5 pb-1">
              {socialNetworks.map((network) => {
                const count = getServicesByNetwork(network.id).length;
                const isSelected = selectedNetwork === network.id;
                const IconComponent = network.icon;
                
                return (
                  <button
                    key={network.id}
                    onClick={() => {
                      setSelectedNetwork(network.id);
                      setSelectedCategory("");
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap shrink-0",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary/30 hover:bg-secondary/60 text-foreground"
                    )}
                  >
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${network.color}15` }}
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
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* Categories - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="bg-card/50 rounded-xl border border-border/50 h-full flex flex-col">
              <div className="p-3 border-b border-border/50 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">الأقسام</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm",
                      !selectedCategory 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <Badge variant={!selectedCategory ? "secondary" : "outline"} className="text-[10px]">
                      {getServicesByNetwork(selectedNetwork).length}
                    </Badge>
                    <span className="font-medium">جميع الأقسام</span>
                  </button>

                  {categoriesWithServices.map((category) => {
                    const categoryServices = getServicesByNetwork(selectedNetwork).filter(s => s.category_id === category.id);
                    const network = getNetworkFromText(category.name_ar);
                    const IconComponent = network?.icon || Package;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 p-2.5 rounded-lg transition-all text-sm",
                          selectedCategory === category.id 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-secondary/50"
                        )}
                      >
                        <Badge variant={selectedCategory === category.id ? "secondary" : "outline"} className="text-[10px]">
                          {categoryServices.length}
                        </Badge>
                        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                          <span className="truncate text-right">{category.name_ar}</span>
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${network?.color || '#8B5CF6'}15` }}
                          >
                            <IconComponent className="w-3 h-3" style={{ color: network?.color || '#8B5CF6' }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Services List */}
          <div className="lg:col-span-5">
            <div className="bg-card/50 rounded-xl border border-border/50 h-full flex flex-col">
              <div className="p-3 border-b border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">الخدمات</span>
                    <Badge variant="outline" className="text-[10px]">{filteredServices.length}</Badge>
                  </div>
                  <div className="relative flex-1 max-w-[200px]">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-8 h-9 text-sm bg-secondary/30"
                    />
                  </div>
                </div>
                
                {/* Mobile Category Filter */}
                <div className="lg:hidden mt-3">
                  <ScrollArea className="w-full" dir="rtl">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSelectedCategory("")}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                          !selectedCategory 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary/50 hover:bg-secondary"
                        )}
                      >
                        الكل ({getServicesByNetwork(selectedNetwork).length})
                      </button>
                      {categoriesWithServices.slice(0, 8).map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                            selectedCategory === category.id 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          {category.name_ar}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {filteredServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Package className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-sm">لا توجد خدمات</p>
                    </div>
                  ) : (
                    filteredServices.map((service) => {
                      const features = parseFeatures(service.features);
                      const network = getNetworkFromText(service.name);
                      const IconComponent = network?.icon || Package;
                      const isFavorite = favorites.includes(service.id);
                      const isSelected = selectedService?.id === service.id;
                      
                      return (
                        <motion.div
                          key={service.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectService(service)}
                          className={cn(
                            "p-3 rounded-xl cursor-pointer transition-all border group",
                            isSelected 
                              ? "bg-primary/10 border-primary" 
                              : "bg-secondary/20 border-transparent hover:bg-secondary/40"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${network?.color || '#8B5CF6'}15` }}
                            >
                              <IconComponent className="w-5 h-5" style={{ color: network?.color || '#8B5CF6' }} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <Badge variant="secondary" className="text-[9px] shrink-0">
                                  #{service.external_service_id || service.id.slice(0,4)}
                                </Badge>
                                <p className="font-medium text-sm line-clamp-2 text-right flex-1 leading-tight">{service.name}</p>
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-3">
                                  <span className="text-primary font-bold text-sm">{service.price.toFixed(2)} ر.س</span>
                                  {service.refill_enabled && (
                                    <span className="flex items-center gap-0.5 text-green-500">
                                      <RefreshCw className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                                <span>{features.min} - {features.max}</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(service.id);
                              }}
                              className={cn(
                                "p-1.5 rounded-lg transition-all",
                                isFavorite ? "text-red-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                              )}
                            >
                              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Order Form - Desktop */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="bg-card/50 rounded-xl border border-border/50 h-full flex flex-col">
              <div className="p-3 border-b border-border/50 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">تفاصيل الطلب</span>
              </div>
              <div className="p-4 flex-1 overflow-auto">
                <OrderForm />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Order Sheet */}
        <Sheet open={showOrderSheet} onOpenChange={setShowOrderSheet}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
            <SheetHeader className="text-right">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                تفاصيل الطلب
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-auto h-[calc(100%-60px)]">
              <OrderForm />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile FAB */}
        {isMobile && selectedService && !showOrderSheet && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowOrderSheet(true)}
            className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30 flex items-center justify-center z-50"
          >
            <ShoppingCart className="w-6 h-6" />
          </motion.button>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
