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
  Award,
  Clock,
  RefreshCw,
  Zap,
  Plus,
  ChevronDown,
  Copy,
  Check,
  Info,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  { id: 'all', name: 'الكل', keywords: [], icon: Sparkles, color: '#8B5CF6' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, color: '#E4405F' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, color: '#1877F2' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, color: '#FF0000' },
  { id: 'twitter', name: 'تويتر', keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: Twitter, color: '#1DA1F2' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], icon: Radio, color: '#1DB954' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], icon: Music2, color: '#000000' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان', 'لينكد ان', 'لينكدإن'], icon: Linkedin, color: '#0A66C2' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, color: '#0088CC' },
  { id: 'website', name: 'زيارات', keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع', 'ويب'], icon: Globe, color: '#10B981' },
  { id: 'other', name: 'أخرى', keywords: [], icon: Package, color: '#6B7280' },
];

const SocialMediaServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const { convertToSAR } = useExchangeRate();
  
  // State
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("new-order");

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
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      
      return { totalOrders, totalSpent, completedOrders };
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

  // Get network from text
  const getNetworkFromText = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id === 'all' || network.id === 'other') continue;
      if (network.keywords.some(k => lowerText.includes(k))) {
        return network;
      }
    }
    return socialNetworks.find(n => n.id === 'other')!;
  }, []);

  // Filter services by network
  const getServicesByNetwork = useCallback((networkId: string) => {
    if (networkId === 'all') return socialMediaServices;
    if (networkId === 'other') {
      return socialMediaServices.filter(s => {
        const text = `${s.name} ${s.category}`.toLowerCase();
        const matchedNetworks = socialNetworks.filter(n => 
          n.id !== 'all' && n.id !== 'other' && n.keywords.some(k => text.includes(k))
        );
        return matchedNetworks.length === 0;
      });
    }
    
    const network = socialNetworks.find(n => n.id === networkId);
    if (!network) return [];
    
    return socialMediaServices.filter(s => {
      const text = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => text.includes(k));
    });
  }, [socialMediaServices]);

  // Filter categories by network
  const filteredCategories = useMemo(() => {
    const networkServices = getServicesByNetwork(selectedNetwork);
    const categoryIds = new Set(networkServices.map(s => s.category_id).filter(Boolean));
    return categoriesWithServices.filter(c => categoryIds.has(c.id));
  }, [categoriesWithServices, selectedNetwork, getServicesByNetwork]);

  // Filter services
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
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                    <p className="text-xl font-bold text-foreground">{userStats?.totalOrders || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Spent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
                    <p className="text-xl font-bold text-foreground">{userStats?.totalSpent?.toFixed(2) || '0.00'} ر.س</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">رصيدك الحالي</p>
                    <p className="text-xl font-bold text-primary">{userBalance?.balance?.toFixed(2) || '0.00'} ر.س</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                      onClick={() => navigate('/dashboard/deposit')}
                    >
                      إيداع المزيد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">حالة الحساب</p>
                    <Badge className="mt-1 bg-purple-500/20 text-purple-400 border-purple-500/30">
                      {(userStats?.totalOrders || 0) >= 50 ? 'VIP' : (userStats?.totalOrders || 0) >= 10 ? 'نشط' : 'جديد'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Platform Tabs */}
        <Card className="bg-card/50 border-border/50 p-4">
          <ScrollArea className="w-full" dir="rtl">
            <div className="flex gap-2 pb-2">
              {socialNetworks.map((network) => {
                const count = getServicesByNetwork(network.id).length;
                const isSelected = selectedNetwork === network.id;
                const IconComponent = network.icon;
                
                return (
                  <motion.button
                    key={network.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedNetwork(network.id);
                      setSelectedCategory("");
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap",
                      isSelected 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                        : "bg-secondary/50 hover:bg-secondary text-foreground"
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
                    <span className="font-medium text-sm">{network.name}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                        {count}
                      </Badge>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card/50 border border-border/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="new-order" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">طلب جديد</span>
              <span className="sm:hidden">جديد</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">المفضلة</span>
              <span className="sm:hidden">المفضلة</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">الطلبات السابقة</span>
              <span className="sm:hidden">السابقة</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-order" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Category Filter */}
              <div className="lg:col-span-3">
                <Card className="bg-card/50 border-border/50">
                  <div className="p-3 border-b border-border/50">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      الأقسام
                    </h3>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => setSelectedCategory("")}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-right text-sm",
                          !selectedCategory 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-secondary/50"
                        )}
                      >
                        <Badge variant={!selectedCategory ? "secondary" : "outline"} className="text-[10px]">
                          {getServicesByNetwork(selectedNetwork).length}
                        </Badge>
                        <span>جميع الأقسام</span>
                      </button>

                      {filteredCategories.map((category) => {
                        const categoryServices = getServicesByNetwork(selectedNetwork).filter(s => s.category_id === category.id);
                        const network = getNetworkFromText(category.name_ar);
                        const IconComponent = network?.icon || Package;
                        
                        return (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                              "w-full flex items-center justify-between gap-2 p-2.5 rounded-lg transition-all text-right text-sm",
                              selectedCategory === category.id 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-secondary/50"
                            )}
                          >
                            <Badge variant={selectedCategory === category.id ? "secondary" : "outline"} className="text-[10px]">
                              {categoryServices.length}
                            </Badge>
                            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                              <span className="truncate">{category.name_ar}</span>
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${network?.color || '#8B5CF6'}20` }}
                              >
                                <IconComponent className="w-3 h-3" style={{ color: network?.color || '#8B5CF6' }} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              {/* Services List */}
              <div className="lg:col-span-5">
                <Card className="bg-card/50 border-border/50">
                  <div className="p-3 border-b border-border/50">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        الخدمات
                        <Badge variant="outline" className="text-[10px]">{filteredServices.length}</Badge>
                      </h3>
                      <div className="relative flex-1 max-w-[180px]">
                        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-8 h-8 text-sm bg-secondary/30"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[400px]">
                    <div className="p-2 space-y-2">
                      {filteredServices.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
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
                              whileHover={{ scale: 1.01 }}
                              onClick={() => handleSelectService(service)}
                              className={cn(
                                "p-3 rounded-xl cursor-pointer transition-all border group",
                                isSelected 
                                  ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" 
                                  : "bg-secondary/20 border-transparent hover:bg-secondary/40 hover:border-border/50"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div 
                                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${network?.color || '#8B5CF6'}20` }}
                                >
                                  <IconComponent className="w-4 h-4" style={{ color: network?.color || '#8B5CF6' }} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-sm line-clamp-2 text-right flex-1">{service.name}</p>
                                    <Badge variant="secondary" className="text-[9px] shrink-0">
                                      #{service.external_service_id || service.id.slice(0,4)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-primary font-bold text-sm">
                                      {service.price.toFixed(2)} ر.س
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {features.min} - {features.max}
                                    </p>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(service.id);
                                  }}
                                  className="p-1.5 hover:bg-secondary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Heart 
                                    className={cn(
                                      "w-4 h-4",
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

              {/* Order Form */}
              <div className="lg:col-span-4">
                <Card className="bg-card/50 border-border/50 sticky top-4">
                  <div className="p-3 border-b border-border/50">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      تفاصيل الطلب
                    </h3>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {!selectedService ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">اختر خدمة من القائمة</p>
                      </div>
                    ) : (
                      <>
                        {/* Selected Service Preview */}
                        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                          <div className="flex items-center gap-2 mb-2">
                            {(() => {
                              const network = getNetworkFromText(selectedService.name);
                              const IconComponent = network?.icon || Package;
                              return (
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${network?.color || '#8B5CF6'}20` }}
                                >
                                  <IconComponent className="w-4 h-4" style={{ color: network?.color || '#8B5CF6' }} />
                                </div>
                              );
                            })()}
                            <Badge variant="outline" className="text-[10px]">
                              #{selectedService.external_service_id || selectedService.id.slice(0,4)}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm line-clamp-2">{selectedService.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            السعر: {selectedService.price.toFixed(2)} ر.س / 1000
                          </p>
                        </div>
                        
                        {/* Link Input */}
                        <div className="space-y-2">
                          <Label className="text-sm flex items-center gap-1.5">
                            <Link2 className="w-4 h-4" />
                            الرابط
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            placeholder="https://..."
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="text-left bg-secondary/30"
                            dir="ltr"
                          />
                        </div>
                        
                        {/* Quantity Input */}
                        <div className="space-y-2">
                          <Label className="text-sm flex items-center gap-1.5">
                            <Hash className="w-4 h-4" />
                            الكمية
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min={parseFeatures(selectedService.features).min}
                            max={parseFeatures(selectedService.features).max}
                            className="bg-secondary/30"
                          />
                          <p className="text-xs text-muted-foreground">
                            الحد: {parseFeatures(selectedService.features).min} - {parseFeatures(selectedService.features).max}
                          </p>
                        </div>
                        
                        {/* Price Summary */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">ثمن الطلب</span>
                            <span className="text-2xl font-bold text-primary">
                              {totalPrice.toFixed(2)} ر.س
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/30">
                            <span className="text-xs text-muted-foreground">رصيدك الحالي</span>
                            <span className={cn(
                              "text-sm font-semibold",
                              userBalance && userBalance.balance >= totalPrice ? "text-green-500" : "text-red-500"
                            )}>
                              {userBalance?.balance.toFixed(2) || '0.00'} ر.س
                            </span>
                          </div>
                        </div>
                        
                        {/* Submit Button */}
                        <Button
                          className="w-full gap-2 h-12 text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
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
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <Card className="bg-card/50 border-border/50 p-6 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-semibold text-lg mb-2">خدماتك المفضلة</h3>
              <p className="text-muted-foreground text-sm mb-4">
                أضف خدمات للمفضلة للوصول السريع إليها
              </p>
              <Button variant="outline" onClick={() => setActiveTab("new-order")}>
                تصفح الخدمات
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="bg-card/50 border-border/50 p-6 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-semibold text-lg mb-2">طلباتك السابقة</h3>
              <p className="text-muted-foreground text-sm mb-4">
                اعرض سجل طلباتك وأعد الطلب بنقرة واحدة
              </p>
              <Button variant="outline" onClick={() => navigate('/dashboard/orders')}>
                عرض جميع الطلبات
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
