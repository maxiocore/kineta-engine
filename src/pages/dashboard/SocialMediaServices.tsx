import { useState, useMemo, useCallback, useRef } from "react";
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
  Layers,
  Link2,
  Hash,
  Loader2,
  Ghost,
  Radio,
  Globe2,
  Tv,
  MessageCircle,
  ShoppingCart,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/adminNotifyService";

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

// Social networks with brand colors
const socialNetworks = [
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, color: '#E4405F', bg: 'bg-gradient-to-br from-[#833AB4] via-[#E4405F] to-[#FCAF45]' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, color: '#1877F2', bg: 'bg-[#1877F2]' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], icon: Music2, color: '#000000', bg: 'bg-gradient-to-br from-[#00f2ea] to-[#ff0050]' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, color: '#FF0000', bg: 'bg-[#FF0000]' },
  { id: 'twitter', name: 'X / تويتر', keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: Twitter, color: '#1DA1F2', bg: 'bg-[#1DA1F2]' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, color: '#0088CC', bg: 'bg-[#0088CC]' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, color: '#FFFC00', bg: 'bg-[#FFFC00]' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان', 'لينكد ان', 'لينكدإن'], icon: Linkedin, color: '#0A66C2', bg: 'bg-[#0A66C2]' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], icon: Radio, color: '#1DB954', bg: 'bg-[#1DB954]' },
  { id: 'twitch', name: 'تويتش', keywords: ['twitch', 'تويتش'], icon: Tv, color: '#9146FF', bg: 'bg-[#9146FF]' },
  { id: 'discord', name: 'ديسكورد', keywords: ['discord', 'ديسكورد', 'دسكورد'], icon: MessageCircle, color: '#5865F2', bg: 'bg-[#5865F2]' },
  { id: 'google', name: 'جوجل', keywords: ['google', 'جوجل', 'قوقل', 'review', 'تقييم'], icon: Globe2, color: '#4285F4', bg: 'bg-[#4285F4]' },
  { id: 'website', name: 'زيارات', keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع', 'ويب'], icon: Globe, color: '#10B981', bg: 'bg-[#10B981]' },
];

const SocialMediaServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const { convertToSAR } = useExchangeRate();
  
  // State
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileOrder, setShowMobileOrder] = useState(false);
  
  const orderFormRef = useRef<HTMLDivElement>(null);

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
        .order("category", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });

  // Get network info from text
  const getNetworkFromText = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    for (const network of socialNetworks) {
      if (network.keywords.some(k => lowerText.includes(k))) {
        return network;
      }
    }
    return null;
  }, []);

  // Filter out design/dev services
  const designDevKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 
    'برمجة', 'تطوير', 'dev', 'development', 'app'];
  
  const isDesignOrDev = (text: string) => {
    const lowerText = text.toLowerCase();
    return designDevKeywords.some(k => lowerText.includes(k));
  };

  // Social media services only
  const socialMediaServices = useMemo(() => {
    return services.filter(service => !isDesignOrDev(service.category) && !isDesignOrDev(service.name));
  }, [services]);

  // Get categories that have social services
  const categoriesWithServices = useMemo(() => {
    const categoryIds = new Set(socialMediaServices.map(s => s.category_id).filter(Boolean));
    return categories.filter(c => categoryIds.has(c.id));
  }, [categories, socialMediaServices]);

  // Filter categories by selected network
  const filteredCategories = useMemo(() => {
    if (!selectedNetwork) return categoriesWithServices;
    
    const network = socialNetworks.find(n => n.id === selectedNetwork);
    if (!network) return categoriesWithServices;

    return categoriesWithServices.filter(cat => {
      const catText = `${cat.name} ${cat.name_ar}`.toLowerCase();
      return network.keywords.some(k => catText.includes(k));
    });
  }, [categoriesWithServices, selectedNetwork]);

  // Get services count per network
  const getNetworkServiceCount = useCallback((networkId: string) => {
    const network = socialNetworks.find(n => n.id === networkId);
    if (!network) return 0;
    
    return socialMediaServices.filter(s => {
      const serviceText = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => serviceText.includes(k));
    }).length;
  }, [socialMediaServices]);

  // Get services count per category
  const getCategoryServiceCount = useCallback((categoryId: string) => {
    return socialMediaServices.filter(s => s.category_id === categoryId).length;
  }, [socialMediaServices]);

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = socialMediaServices;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(s => s.category_id === selectedCategory);
    }

    // Filter by network
    if (selectedNetwork && !selectedCategory) {
      const network = socialNetworks.find(n => n.id === selectedNetwork);
      if (network) {
        filtered = filtered.filter(s => {
          const serviceText = `${s.name} ${s.category}`.toLowerCase();
          return network.keywords.some(k => serviceText.includes(k));
        });
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }

    return filtered;
  }, [socialMediaServices, selectedCategory, selectedNetwork, searchQuery]);

  // Parse features
  const parseFeatures = (features: any) => {
    const defaults = { min: 10, max: 100000 };
    if (!features) return defaults;
    
    try {
      const f = typeof features === 'string' ? JSON.parse(features) : features;
      return {
        min: parseInt(f.min || f.minQuantity) || defaults.min,
        max: parseInt(f.max || f.maxQuantity) || defaults.max,
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
    setShowMobileOrder(true);
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
    
    if (qty < features.min) {
      toast.error(`الكمية يجب أن تكون ${features.min} على الأقل`);
      return;
    }
    if (qty > features.max) {
      toast.error(`الكمية يجب أن تكون ${features.max} أو أقل`);
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
      setShowMobileOrder(false);
      refetchBalance();
      
    } catch (error) { 
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
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <p className="text-muted-foreground">جاري تحميل الخدمات...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            خدمات التواصل الاجتماعي
          </h1>
          <p className="text-muted-foreground">
            اختر من بين أكثر من {socialMediaServices.length} خدمة متاحة
          </p>
        </div>

        {/* Platform Selector */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center">
            <Layers className="w-5 h-5 text-primary" />
            <span className="font-medium">اختر المنصة</span>
          </div>
          
          <ScrollArea className="w-full" dir="rtl">
            <div className="flex gap-3 pb-2 px-1 justify-center flex-wrap">
              {socialNetworks.map((network) => {
                const count = getNetworkServiceCount(network.id);
                const isSelected = selectedNetwork === network.id;
                const IconComponent = network.icon;
                
                return (
                  <TooltipProvider key={network.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedNetwork(isSelected ? null : network.id);
                            setSelectedCategory(null);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[70px]",
                            isSelected 
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                              : "hover:bg-secondary/50"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg",
                            network.bg
                          )}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-medium text-foreground">{network.name}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {count}
                          </Badge>
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{count} خدمة متاحة</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Categories Section */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 sticky top-4">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="font-semibold">القسم</span>
                  <Badge variant="outline" className="mr-auto">{filteredCategories.length}</Badge>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] lg:h-[500px]">
                <div className="p-2 space-y-1">
                  {/* All Categories */}
                  <motion.button
                    whileHover={{ x: -4 }}
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg transition-all text-right",
                      !selectedCategory 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <Badge variant={!selectedCategory ? "secondary" : "outline"}>
                      {socialMediaServices.length}
                    </Badge>
                    <span className="font-medium">جميع الأقسام</span>
                  </motion.button>

                  {filteredCategories.map((category) => {
                    const count = getCategoryServiceCount(category.id);
                    const network = getNetworkFromText(category.name_ar);
                    const IconComponent = network?.icon || Package;
                    
                    return (
                      <motion.button
                        key={category.id}
                        whileHover={{ x: -4 }}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg transition-all text-right gap-2",
                          selectedCategory === category.id 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-secondary/50"
                        )}
                      >
                        <Badge variant={selectedCategory === category.id ? "secondary" : "outline"}>
                          {count}
                        </Badge>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-medium text-sm line-clamp-1">{category.name_ar}</span>
                          <div 
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              network?.bg || "bg-primary/20"
                            )}
                            style={{ backgroundColor: network ? undefined : category.color || undefined }}
                          >
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Services List */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold">الخدمة</span>
                    <Badge variant="outline">{filteredServices.length}</Badge>
                  </div>
                  
                  <div className="relative flex-1 max-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9 h-9 text-sm bg-secondary/50"
                    />
                  </div>
                </div>
              </div>
              
              <ScrollArea className="h-[500px] lg:h-[600px]">
                <div className="p-2 space-y-2">
                  {filteredServices.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد خدمات</p>
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => handleSelectService(service)}
                          className={cn(
                            "p-3 rounded-xl cursor-pointer transition-all border",
                            isSelected 
                              ? "bg-primary/10 border-primary" 
                              : "bg-secondary/30 border-transparent hover:bg-secondary/50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div 
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                network?.bg || "bg-primary/20"
                              )}
                            >
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-2 text-right">{service.name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {features.min} - {features.max}
                                  </p>
                                </div>
                                
                                <div className="text-left shrink-0">
                                  <Badge variant="secondary" className="text-[10px]">
                                    #{service.external_service_id || service.id.slice(0,4)}
                                  </Badge>
                                  <p className="text-primary font-bold text-sm mt-1">
                                    {service.price.toFixed(2)} <span className="text-[10px]">ر.س</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Favorite */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(service.id);
                              }}
                              className="p-1 hover:bg-secondary rounded-full shrink-0"
                            >
                              <Heart 
                                className={cn(
                                  "w-4 h-4 transition-colors",
                                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                                )} 
                              />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Order Form - Desktop */}
          <div className="lg:col-span-4 order-3 hidden lg:block">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 sticky top-4">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span className="font-semibold">تفاصيل الطلب</span>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {!selectedService ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>اختر خدمة من القائمة</p>
                  </div>
                ) : (
                  <>
                    {/* Selected Service */}
                    <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                      <p className="font-medium line-clamp-2">{selectedService.name}</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        السعر: {selectedService.price.toFixed(2)} ر.س / 1000
                      </p>
                    </div>
                    
                    {/* Link Input */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Link2 className="w-4 h-4" />
                        الرابط
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="https://..."
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="text-left"
                        dir="ltr"
                      />
                    </div>
                    
                    {/* Quantity Input */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        الكمية
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="اختر خدمة أولاً"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min={parseFeatures(selectedService.features).min}
                        max={parseFeatures(selectedService.features).max}
                      />
                      <p className="text-xs text-muted-foreground">
                        الحد: {parseFeatures(selectedService.features).min} - {parseFeatures(selectedService.features).max}
                      </p>
                    </div>
                    
                    {/* Price Summary */}
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">ثمن الطلب</span>
                        <span className="text-xl font-bold text-primary">
                          {totalPrice.toFixed(2)} ر.س
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-muted-foreground">رصيدك الحالي</span>
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
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          أرسل الطلب
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Mobile Order Form - Floating */}
        <AnimatePresence>
          {showMobileOrder && selectedService && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
            >
              <div className="bg-card border-t border-border shadow-2xl rounded-t-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setShowMobileOrder(false)}>
                    <ChevronDown className="w-6 h-6" />
                  </button>
                  <span className="font-semibold">تفاصيل الطلب</span>
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                
                <p className="text-sm font-medium line-clamp-1">{selectedService.name}</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">الرابط</Label>
                    <Input
                      placeholder="https://..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="text-left text-sm h-9"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الكمية</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">الإجمالي:</span>
                    <span className="text-lg font-bold text-primary mr-2">
                      {totalPrice.toFixed(2)} ر.س
                    </span>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !link || !quantity}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    إرسال
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
