import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { 
  Search, 
  Package, 
  Star, 
  Heart,
  Zap,
  Shield,
  TrendingUp,
  Layers,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  MoreHorizontal,
  Sparkles,
  ShoppingCart,
  Clock,
  Link2,
  Hash,
  Wallet,
  CheckCircle2,
  MessageCircle,
  Ghost,
  Radio,
  Star as StarIcon,
  Globe2,
  Tv,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Flame,
  Crown,
  Gift,
  Rocket,
  Timer,
  Percent,
  BadgeCheck,
  ThumbsUp,
  RotateCcw,
  History,
  ArrowLeft,
  Info,
  X,
  RefreshCw,
  Filter,
  ListFilter,
  LayoutGrid,
  List,
  Eye,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

// Social network data with icons
const socialNetworks = [
  { id: 'all', name: 'الكل', keywords: ['all'], icon: MoreHorizontal, gradient: 'from-slate-600 to-slate-700', color: '#64748b' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, gradient: 'from-pink-500 via-purple-500 to-orange-500', color: '#E4405F' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, gradient: 'from-blue-500 to-blue-600', color: '#1877F2' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], icon: Music2, gradient: 'from-zinc-800 to-zinc-900', color: '#000000' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, gradient: 'from-red-500 to-red-600', color: '#FF0000' },
  { id: 'twitter', name: 'تويتر / X', keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: Twitter, gradient: 'from-sky-400 to-sky-500', color: '#1DA1F2' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, gradient: 'from-sky-500 to-sky-600', color: '#0088CC' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, gradient: 'from-yellow-400 to-yellow-500', color: '#FFFC00' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان', 'لينكد ان', 'لينكدإن'], icon: Linkedin, gradient: 'from-blue-600 to-blue-700', color: '#0A66C2' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], icon: Radio, gradient: 'from-green-500 to-green-600', color: '#1DB954' },
  { id: 'twitch', name: 'تويتش', keywords: ['twitch', 'تويتش'], icon: Tv, gradient: 'from-purple-500 to-purple-600', color: '#9146FF' },
  { id: 'discord', name: 'ديسكورد', keywords: ['discord', 'ديسكورد', 'دسكورد'], icon: MessageCircle, gradient: 'from-indigo-500 to-indigo-600', color: '#5865F2' },
  { id: 'google', name: 'جوجل', keywords: ['google', 'جوجل', 'قوقل', 'review', 'تقييم'], icon: Globe2, gradient: 'from-red-500 via-yellow-500 to-blue-500', color: '#4285F4' },
  { id: 'website', name: 'زيارات', keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع', 'ويب'], icon: Globe, gradient: 'from-emerald-500 to-teal-600', color: '#10B981' },
];

const SocialMediaServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { convertToSAR, rate } = useExchangeRate();
  
  // State
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
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
  const { data: services = [], isLoading, refetch } = useQuery({
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

  // Helper to get network info from text
  const getNetworkInfo = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id === 'all') continue;
      if (network.keywords.some(k => lowerText.includes(k))) {
        return network;
      }
    }
    return socialNetworks[0]; // Return 'all' as default
  }, []);

  // Filter out design/dev services
  const designDevKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 
    'برمجة', 'تطوير', 'موقع', 'تطبيق', 'dev', 'development', 'website', 'app'];
  
  const isDesignOrDev = (text: string) => {
    const lowerText = text.toLowerCase();
    return designDevKeywords.some(k => lowerText.includes(k));
  };

  // Social media services only
  const socialMediaServices = useMemo(() => {
    return services.filter(service => !isDesignOrDev(service.category) && !isDesignOrDev(service.name));
  }, [services]);

  // Get categories for social services grouped by parent
  const categoriesWithServices = useMemo(() => {
    const categoryIds = new Set(socialMediaServices.map(s => s.category_id).filter(Boolean));
    return categories.filter(c => categoryIds.has(c.id));
  }, [categories, socialMediaServices]);

  // Build hierarchy: parent categories with their subcategories
  const categoryHierarchy = useMemo(() => {
    const parents = categoriesWithServices.filter(c => !c.parent_id);
    const subs = categoriesWithServices.filter(c => c.parent_id);
    
    return parents.map(parent => ({
      ...parent,
      subcategories: subs.filter(s => s.parent_id === parent.id)
    }));
  }, [categoriesWithServices]);

  // Filter categories by selected network
  const filteredCategories = useMemo(() => {
    if (selectedNetwork === 'all') return categoriesWithServices;
    
    const network = socialNetworks.find(n => n.id === selectedNetwork);
    if (!network) return categoriesWithServices;

    return categoriesWithServices.filter(cat => {
      const catText = `${cat.name} ${cat.name_ar}`.toLowerCase();
      return network.keywords.some(k => catText.includes(k));
    });
  }, [categoriesWithServices, selectedNetwork]);

  // Get services count for a category
  const getServiceCount = useCallback((categoryId: string) => {
    return socialMediaServices.filter(s => s.category_id === categoryId).length;
  }, [socialMediaServices]);

  // Filter services based on selection
  const filteredServices = useMemo(() => {
    let filtered = socialMediaServices;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(s => s.category_id === selectedCategory.id);
    }

    // Filter by network
    if (selectedNetwork !== 'all' && !selectedCategory) {
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

  // Parse service features
  const parseFeatures = (features: any) => {
    const defaults = { min: 10, max: 100000, rate: 0, guaranteed: false, canCancel: false, serviceType: 'Default' };
    if (!features) return defaults;
    
    try {
      const f = typeof features === 'string' ? JSON.parse(features) : features;
      return {
        min: parseInt(f.min || f.minQuantity) || defaults.min,
        max: parseInt(f.max || f.maxQuantity) || defaults.max,
        rate: parseFloat(f.rate || f.ratePerHour) || defaults.rate,
        guaranteed: f.guaranteed === true || f.guaranteed === 'true',
        canCancel: f.canCancel === true || f.canCancel === 'true' || f.cancel === true,
        serviceType: f.serviceType || f.type || defaults.serviceType
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
    
    // Scroll to order form on mobile
    setTimeout(() => {
      orderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
      
      // Update balance
      await supabase.from("user_balances").update({ 
        balance: userBalance.balance - totalPrice, 
        total_spent: userBalance.total_spent + totalPrice 
      }).eq("user_id", user.id);
      
      // Create balance log
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
      
      // Send to provider if external service
      if (selectedService.external_service_id) {
        toast.loading("جاري إرسال الطلب للمزود...", { id: 'provider-order' });
        
        try {
          const { data: providerResult, error: providerError } = await supabase.functions.invoke('provider-order', {
            body: { orderId: orderData.id, serviceId: selectedService.id, link, quantity: qty }
          });
          
          if (providerError) {
            toast.error("فشل إرسال الطلب للمزود", { id: 'provider-order' });
          } else if (providerResult?.success) {
            toast.success(`تم إرسال الطلب للمزود! رقم: ${providerResult.external_order_id || '---'}`, { id: 'provider-order' });
          } else {
            toast.dismiss('provider-order');
          }
        } catch {
          toast.error("خطأ في الاتصال بالمزود", { id: 'provider-order' });
        }
      }
      
      toast.success("تم إرسال الطلب بنجاح!", {
        description: `رقم الطلب: ${orderNumber}`,
        action: {
          label: "عرض الطلبات",
          onClick: () => navigate('/dashboard/orders')
        }
      });
      
      // Notify admins
      notifyNewOrder({
        orderNumber: orderData.order_number,
        userName: user.user_metadata?.full_name,
        userEmail: user.email || '',
        serviceName: selectedService.name,
        quantity: qty,
        totalPrice,
      });
      
      // Reset form
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

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Auto-expand categories with services
  useEffect(() => {
    if (filteredCategories.length > 0 && expandedCategories.size === 0) {
      const firstFew = filteredCategories.slice(0, 3).map(c => c.id);
      setExpandedCategories(new Set(firstFew));
    }
  }, [filteredCategories]);

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
          <p className="text-sm text-muted-foreground animate-pulse">جاري تحميل الخدمات...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  const features = selectedService ? parseFeatures(selectedService.features) : null;

  return (
    <ClientDashboardLayout>
      <TooltipProvider>
        <div className="min-h-screen pb-20" dir="rtl">
          {/* Header with Balance */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                  خدمات التواصل الاجتماعي
                </h1>
                <p className="text-sm text-muted-foreground">
                  اختر من بين أكثر من {socialMediaServices.length} خدمة متاحة
                </p>
              </div>
              
              {/* Balance Card */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-4 text-primary-foreground shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs opacity-80">الرصيد الحالي</p>
                    <p className="text-xl font-bold">{(userBalance?.balance || 0).toFixed(2)} <span className="text-sm">ر.س</span></p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Networks Selector */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-semibold">اختر المنصة</h2>
              </div>
              {selectedNetwork !== 'all' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setSelectedNetwork('all'); setSelectedCategory(null); }}
                  className="text-xs h-8"
                >
                  <X className="w-3 h-3 ml-1" />
                  إظهار الكل
                </Button>
              )}
            </div>
            
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {socialNetworks.map((network) => {
                  const Icon = network.icon;
                  const isSelected = selectedNetwork === network.id;
                  const count = network.id === 'all' 
                    ? socialMediaServices.length 
                    : socialMediaServices.filter(s => network.keywords.some(k => `${s.name} ${s.category}`.toLowerCase().includes(k))).length;
                  
                  return (
                    <motion.button
                      key={network.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { 
                        setSelectedNetwork(network.id); 
                        setSelectedCategory(null); 
                        setSelectedService(null);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all min-w-[80px] border",
                        isSelected 
                          ? "bg-primary/10 border-primary shadow-md" 
                          : "bg-card border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-sm",
                        network.gradient
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium truncate w-full text-center">{network.name}</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{count}</Badge>
                    </motion.button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Categories Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <Card className="border-border overflow-hidden sticky top-4">
                <CardHeader className="p-3 sm:p-4 bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ListFilter className="w-4 h-4 text-primary" />
                      القسم
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {filteredCategories.length}
                    </Badge>
                  </div>
                </CardHeader>
                <ScrollArea className="h-[400px] lg:h-[calc(100vh-300px)]">
                  <div className="p-2">
                    {/* All button */}
                    <button
                      onClick={() => { setSelectedCategory(null); setSelectedService(null); }}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 p-3 rounded-xl mb-2 transition-all text-right",
                        !selectedCategory 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <span className="text-sm font-medium">جميع الأقسام</span>
                      <Badge variant={!selectedCategory ? "secondary" : "outline"} className="text-[10px]">
                        {socialMediaServices.length}
                      </Badge>
                    </button>

                    <Separator className="my-2" />

                    {/* Categories List */}
                    {filteredCategories.map((category) => {
                      const networkInfo = getNetworkInfo(category.name_ar || category.name);
                      const Icon = networkInfo.icon;
                      const count = getServiceCount(category.id);
                      const isSelected = selectedCategory?.id === category.id;
                      
                      return (
                        <motion.button
                          key={category.id}
                          whileHover={{ x: 4 }}
                          onClick={() => { 
                            setSelectedCategory(isSelected ? null : category); 
                            setSelectedService(null);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl mb-1 transition-all text-right",
                            isSelected 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-muted/70"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                            networkInfo.gradient
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-xs font-medium truncate">{category.name_ar}</p>
                          </div>
                          <Badge variant={isSelected ? "secondary" : "outline"} className="text-[9px] shrink-0">
                            {count}
                          </Badge>
                        </motion.button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>
            </motion.div>

            {/* Services List */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-5"
            >
              <Card className="border-border overflow-hidden">
                <CardHeader className="p-3 sm:p-4 bg-muted/30 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      الخدمة
                      <Badge variant="secondary" className="text-[10px]">{filteredServices.length}</Badge>
                    </CardTitle>
                    
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="بحث..." 
                        className="pr-9 h-9 text-sm bg-background" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <ScrollArea className="h-[500px] lg:h-[calc(100vh-300px)]">
                  {filteredServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Search className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">لا توجد خدمات متاحة</p>
                      <p className="text-xs mt-1">جرب تغيير الفلتر أو البحث</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredServices.map((service, index) => {
                        const networkInfo = getNetworkInfo(service.name);
                        const Icon = networkInfo.icon;
                        const isFavorite = favorites.includes(service.id);
                        const isSelected = selectedService?.id === service.id;
                        const serviceFeatures = parseFeatures(service.features);
                        
                        return (
                          <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.015 }}
                            whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                            onClick={() => handleSelectService(service)}
                            className={cn(
                              "relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                              isSelected 
                                ? "bg-primary/5 border-primary ring-1 ring-primary" 
                                : "border-transparent hover:border-border"
                            )}
                          >
                            {/* Service ID Badge */}
                            {service.external_service_id && (
                              <Badge 
                                variant="outline" 
                                className="absolute -top-1 right-2 text-[8px] h-4 px-1 bg-background"
                              >
                                #{service.external_service_id}
                              </Badge>
                            )}

                            {/* Icon */}
                            <div className={cn(
                              "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                              networkInfo.gradient
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            
                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium line-clamp-2 mb-1">{service.name}</p>
                              <div className="flex flex-wrap items-center gap-1">
                                <Badge variant="outline" className="text-[9px] h-4 px-1">
                                  {serviceFeatures.min.toLocaleString()} - {serviceFeatures.max.toLocaleString()}
                                </Badge>
                                {service.refill_enabled && (
                                  <Badge className="text-[9px] h-4 px-1 bg-success/10 text-success border-0">
                                    <Shield className="w-2.5 h-2.5 ml-0.5" />
                                    ضمان
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Price & Actions */}
                            <div className="flex flex-col items-start gap-1.5 shrink-0">
                              <p className="text-sm font-bold text-primary">
                                {convertToSAR(service.price).toFixed(2)}
                                <span className="text-[10px] font-normal text-muted-foreground mr-0.5">ر.س</span>
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(service.id);
                                }}
                                className="p-1 rounded-md hover:bg-muted transition-colors"
                              >
                                <Heart className={cn("w-4 h-4", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </motion.div>

            {/* Order Form */}
            <motion.div 
              ref={orderFormRef}
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-4"
            >
              <Card className="border-border overflow-hidden sticky top-4">
                <CardHeader className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    تفاصيل الطلب
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-4 space-y-4">
                  {/* Selected Service Display */}
                  {selectedService ? (
                    <div className="bg-muted/50 rounded-xl p-3 border">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                          getNetworkInfo(selectedService.name).gradient
                        )}>
                          {(() => { const I = getNetworkInfo(selectedService.name).icon; return <I className="w-5 h-5" />; })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-2">{selectedService.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            السعر: {convertToSAR(selectedService.price).toFixed(2)} ر.س لكل 1000
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 shrink-0"
                          onClick={() => { setSelectedService(null); setLink(''); setQuantity(''); }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Service Features */}
                      {features && (
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
                          <div className="text-center p-2 rounded-lg bg-background">
                            <p className="text-[10px] text-muted-foreground">الحد الأدنى</p>
                            <p className="text-xs font-bold">{features.min.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-background">
                            <p className="text-[10px] text-muted-foreground">الحد الأقصى</p>
                            <p className="text-xs font-bold">{features.max.toLocaleString()}</p>
                          </div>
                          {selectedService.refill_enabled && (
                            <div className="col-span-2 text-center p-2 rounded-lg bg-success/10 text-success">
                              <p className="text-[10px] flex items-center justify-center gap-1">
                                <Shield className="w-3 h-3" />
                                خدمة مضمونة مع تعويض
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Service Description */}
                      {selectedService.description && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <button
                            onClick={() => setShowServiceDetails(true)}
                            className="text-[10px] text-primary hover:underline flex items-center gap-1"
                          >
                            <Info className="w-3 h-3" />
                            عرض وصف الخدمة
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-xl p-6 text-center border border-dashed">
                      <Package className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">اختر خدمة من القائمة</p>
                    </div>
                  )}

                  {/* Link Input */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-primary" />
                      الرابط <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      type="url"
                      placeholder="https://..." 
                      className={cn("h-11 text-sm", !selectedService && "opacity-50")}
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      disabled={!selectedService}
                    />
                    {link && !link.startsWith('http') && (
                      <p className="text-[10px] text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        الرابط يجب أن يبدأ بـ http
                      </p>
                    )}
                  </div>

                  {/* Quantity Input */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-primary" />
                      الكمية <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      type="number"
                      placeholder={features ? `${features.min} - ${features.max}` : "اختر خدمة أولاً"} 
                      className={cn("h-11 text-sm", !selectedService && "opacity-50")}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={!selectedService}
                      min={features?.min}
                      max={features?.max}
                    />
                    {selectedService && features && (
                      <div className="flex flex-wrap gap-1.5">
                        {[features.min, 100, 500, 1000, 5000, 10000].filter((v, i, a) => a.indexOf(v) === i && v >= features.min && v <= features.max).slice(0, 5).map((q) => (
                          <Button
                            key={q}
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] px-2"
                            onClick={() => setQuantity(q.toString())}
                          >
                            {q.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="bg-muted/50 rounded-xl p-4 space-y-2 border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">ثمن الطلب</span>
                      <span className="font-bold text-lg">{totalPrice.toFixed(4)} ر.س</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">رصيدك الحالي</span>
                      <span className={cn(
                        "font-semibold",
                        userBalance && userBalance.balance >= totalPrice ? "text-success" : "text-destructive"
                      )}>
                        {(userBalance?.balance || 0).toFixed(2)} ر.س
                      </span>
                    </div>
                    {userBalance && userBalance.balance < totalPrice && totalPrice > 0 && (
                      <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>رصيدك غير كافي. تحتاج {(totalPrice - userBalance.balance).toFixed(2)} ر.س إضافية</span>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    className="w-full h-12 text-sm font-medium bg-gradient-to-r from-primary to-primary/80"
                    disabled={!selectedService || !link || !quantity || isSubmitting || (userBalance && userBalance.balance < totalPrice)}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        تأكيد الطلب
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Service Details Sheet */}
          <Sheet open={showServiceDetails} onOpenChange={setShowServiceDetails}>
            <SheetContent side="bottom" className="h-[60vh]">
              <SheetHeader>
                <SheetTitle>وصف الخدمة</SheetTitle>
                <SheetDescription>
                  {selectedService?.name}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-full mt-4">
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none text-right"
                  dangerouslySetInnerHTML={{ __html: selectedService?.description || '' }}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Scroll to Top */}
          <AnimatePresence>
            {typeof window !== 'undefined' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-20 left-4 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <ChevronUp className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
