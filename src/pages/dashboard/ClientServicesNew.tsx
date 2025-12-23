import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Flame,
  Crown,
  Gift,
  Rocket,
  Timer,
  TrendingDown,
  Percent,
  BadgeCheck,
  ThumbsUp,
  RotateCcw,
  History,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Countdown Timer Hook
const useCountdown = (targetDate: Date) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = targetDate.getTime() - new Date().getTime();
    if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    return {
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false,
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return timeLeft;
};

// Get offer end time (end of current day)
const getOfferEndTime = () => {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

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
}

// Social network data with icons
const socialNetworks = [
  { id: 'all', name: 'الكل', icon: MoreHorizontal, gradient: 'from-slate-500 to-slate-600' },
  { id: 'instagram', name: 'انستقرام', icon: Instagram, gradient: 'from-pink-500 via-purple-500 to-orange-500' },
  { id: 'facebook', name: 'فيسبوك', icon: Facebook, gradient: 'from-blue-500 to-blue-600' },
  { id: 'tiktok', name: 'تيك توك', icon: Music2, gradient: 'from-zinc-800 to-zinc-900' },
  { id: 'youtube', name: 'يوتيوب', icon: Youtube, gradient: 'from-red-500 to-red-600' },
  { id: 'twitter', name: 'تويتر', icon: Twitter, gradient: 'from-sky-400 to-sky-500' },
  { id: 'telegram', name: 'تيليجرام', icon: Send, gradient: 'from-sky-500 to-sky-600' },
  { id: 'snapchat', name: 'سناب شات', icon: Ghost, gradient: 'from-yellow-400 to-yellow-500' },
  { id: 'linkedin', name: 'لينكدان', icon: Linkedin, gradient: 'from-blue-600 to-blue-700' },
  { id: 'spotify', name: 'سبوتيفاي', icon: Radio, gradient: 'from-green-500 to-green-600' },
  { id: 'twitch', name: 'تويتش', icon: Tv, gradient: 'from-purple-500 to-purple-600' },
  { id: 'discord', name: 'ديسكورد', icon: MessageCircle, gradient: 'from-indigo-500 to-indigo-600' },
  { id: 'google', name: 'جوجل', icon: Globe2, gradient: 'from-red-500 via-yellow-500 to-blue-500' },
  { id: 'website', name: 'زيارات', icon: Globe, gradient: 'from-emerald-500 to-teal-600' },
];

const ClientServicesNew = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();
  const { convertToSAR, rate, loading: exchangeRateLoading } = useExchangeRate();
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Fetch user points
  const { data: userPoints } = useQuery({
    queryKey: ["user-points", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("user_points").select("*, reward_tiers(*)").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch services
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ["services-client"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("status", "active").order("category", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });

  // Fetch recent orders for quick reorder
  const { data: recentOrders = [] } = useQuery({
    queryKey: ["recent-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, services(id, name, price, category, status)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch popular services (most ordered)
  const { data: popularServiceIds = [] } = useQuery({
    queryKey: ["popular-services"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("service_id")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (!data) return [];
      
      const counts: Record<string, number> = {};
      data.forEach((order) => {
        counts[order.service_id] = (counts[order.service_id] || 0) + 1;
      });
      
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id]) => id);
    },
  });

  // Countdown timer
  const countdown = useCountdown(getOfferEndTime());

  // Check if service is popular
  const isPopularService = useCallback((serviceId: string) => {
    return popularServiceIds.includes(serviceId);
  }, [popularServiceIds]);

  // Get random discount for demo (in real app, this would come from database)
  const getServiceDiscount = useCallback((serviceId: string) => {
    const hash = serviceId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    const discounts = [0, 0, 0, 5, 10, 15, 20, 0, 0, 0];
    return discounts[Math.abs(hash) % discounts.length];
  }, []);

  // Keywords to exclude design and development categories
  const designDevKeywords = useMemo(() => ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 
    'برمجة', 'تطوير', 'موقع', 'تطبيق', 'dev', 'development', 'website', 'app'], []);

  const isDesignOrDevCategory = (category: string) => {
    const lowerCat = category.toLowerCase();
    return designDevKeywords.some(k => lowerCat.includes(k));
  };

  // Get social network icon and gradient
  const getSocialNetworkInfo = useMemo(() => (text: string) => {
    const lowerText = text.toLowerCase();
    const networkPatterns = [
      { keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, gradient: 'from-blue-500 to-blue-600' },
      { keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, gradient: 'from-pink-500 via-purple-500 to-orange-500' },
      { keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], icon: Music2, gradient: 'from-zinc-800 to-zinc-900' },
      { keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, gradient: 'from-red-500 to-red-600' },
      { keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: Twitter, gradient: 'from-sky-400 to-sky-500' },
      { keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, gradient: 'from-sky-500 to-sky-600' },
      { keywords: ['discord', 'ديسكورد', 'دسكورد'], icon: MessageCircle, gradient: 'from-indigo-500 to-indigo-600' },
      { keywords: ['twitch', 'تويتش'], icon: Tv, gradient: 'from-purple-500 to-purple-600' },
      { keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], icon: Radio, gradient: 'from-green-500 to-green-600' },
      { keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, gradient: 'from-yellow-400 to-yellow-500' },
      { keywords: ['google', 'جوجل', 'قوقل'], icon: Globe2, gradient: 'from-red-500 via-yellow-500 to-blue-500' },
      { keywords: ['linkedin', 'لينكدان', 'لينكد ان'], icon: Linkedin, gradient: 'from-blue-600 to-blue-700' },
      { keywords: ['review', 'تقييم', 'rating'], icon: StarIcon, gradient: 'from-amber-400 to-orange-500' },
      { keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع'], icon: Globe, gradient: 'from-emerald-500 to-teal-600' },
    ];

    for (const pattern of networkPatterns) {
      if (pattern.keywords.some(k => lowerText.includes(k))) {
        return { icon: pattern.icon, gradient: pattern.gradient };
      }
    }
    return { icon: Package, gradient: 'from-slate-500 to-slate-600' };
  }, []);

  // Get unique categories
  const serviceCategories = useMemo(() => 
    [...new Set(services.map(s => s.category))]
      .filter(cat => !isDesignOrDevCategory(cat))
      .sort()
  , [services, designDevKeywords]);

  // Count services per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services
      .filter(service => !isDesignOrDevCategory(service.category))
      .forEach(service => { counts[service.category] = (counts[service.category] || 0) + 1; });
    return counts;
  }, [services, designDevKeywords]);

  // Filter categories by network
  const filteredByNetwork = useMemo(() => {
    if (selectedNetwork === 'all') return serviceCategories;
    return serviceCategories.filter(cat => cat.toLowerCase().includes(selectedNetwork.toLowerCase()));
  }, [serviceCategories, selectedNetwork]);

  // Filter services
  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter(service => {
      const matchesSearch = !searchQuery || 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  // Calculate total price (convert from USD to SAR)
  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    const priceInUSD = (selectedService.price / 1000) * qty;
    return convertToSAR(priceInUSD);
  }, [selectedService, quantity, convertToSAR]);

  // Handle URL params
  useEffect(() => {
    if (!services.length) return;
    const categoryParam = searchParams.get("category");
    const serviceParam = searchParams.get("service");
    if (categoryParam) setSelectedCategory(categoryParam);
    if (serviceParam) {
      const service = services.find(s => s.id === serviceParam);
      if (service) {
        setSelectedCategory(service.category);
        setSelectedService(service);
      }
    }
    if (categoryParam || serviceParam) setSearchParams({});
  }, [services, searchParams]);

  // Update current step
  useEffect(() => {
    if (!selectedCategory) setCurrentStep(1);
    else if (!selectedService) setCurrentStep(2);
    else if (!link) setCurrentStep(3);
    else setCurrentStep(4);
  }, [selectedCategory, selectedService, link]);

  const handleCopyLink = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("يجب تسجيل الدخول للطلب"); return; }
    if (!selectedService || !link || !quantity) { toast.error("يرجى ملء جميع الحقول المطلوبة"); return; }
    if (!userBalance || userBalance.balance < totalPrice) { toast.error("رصيدك غير كافي"); return; }

    setIsSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const { data: orderData, error: orderError } = await supabase.from("orders").insert({
        user_id: user.id, service_id: selectedService.id, order_number: orderNumber, quantity: parseInt(quantity), link, total_price: totalPrice, status: "pending",
      }).select().single();
      if (orderError) throw orderError;
      
      await supabase.from("user_balances").update({ balance: userBalance.balance - totalPrice, total_spent: userBalance.total_spent + totalPrice }).eq("user_id", user.id);
      
      toast.loading("جاري إرسال الطلب للمزود...", { id: 'provider-order' });
      
      try {
        const { data: providerResult, error: providerError } = await supabase.functions.invoke('provider-order', {
          body: { orderId: orderData.id, serviceId: selectedService.id, link: link, quantity: parseInt(quantity) }
        });
        
        if (providerError) {
          toast.error("فشل إرسال الطلب للمزود", { id: 'provider-order' });
        } else if (providerResult?.success) {
          toast.success(`تم إرسال الطلب للمزود! رقم: ${providerResult.external_order_id || '---'}`, { id: 'provider-order' });
        } else if (providerResult?.error) {
          toast.error(`خطأ من المزود: ${providerResult.error}`, { id: 'provider-order' });
        } else if (providerResult?.message?.includes('Local order')) {
          toast.info("تم إنشاء الطلب - خدمة محلية", { id: 'provider-order' });
        } else {
          toast.dismiss('provider-order');
        }
      } catch {
        toast.error("خطأ في الاتصال بالمزود", { id: 'provider-order' });
      }
      
      toast.success("تم إرسال الطلب بنجاح!");
      setLink(""); setQuantity(""); setSelectedService(null);
      refetch();
      refetchBalance();
    } catch { toast.error("حدث خطأ أثناء إرسال الطلب"); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <p className="text-sm text-muted-foreground animate-pulse">جاري تحميل الخدمات...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="min-h-screen" dir="rtl">
        {/* Hero Section with Stats */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-4 sm:p-6 lg:p-8 mb-6">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute top-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-accent/30 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-foreground mb-2">
                  طلب خدمة جديدة
                </h1>
                <p className="text-primary-foreground/80 text-sm sm:text-base">
                  اختر من بين أكثر من {services.length} خدمة متاحة
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-primary-foreground/80" />
                    <span className="text-xs text-primary-foreground/70">الرصيد</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-primary-foreground">{(userBalance?.balance || 0).toFixed(2)} <span className="text-xs">ر.س</span></p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary-foreground/80" />
                    <span className="text-xs text-primary-foreground/70">النقاط</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-primary-foreground">{userPoints?.available_points || 0}</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-primary-foreground/80" />
                    <span className="text-xs text-primary-foreground/70">المستوى</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-primary-foreground truncate">{(userPoints?.reward_tiers as any)?.name_ar || "مبتدئ"}</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-primary-foreground/80" />
                    <span className="text-xs text-primary-foreground/70">المفضلة</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-primary-foreground">{favorites.length}</p>
                </motion.div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              {[
                { step: 1, label: "اختر المنصة", icon: Layers },
                { step: 2, label: "اختر الخدمة", icon: Package },
                { step: 3, label: "أدخل الرابط", icon: Link2 },
                { step: 4, label: "حدد الكمية", icon: Hash },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center flex-1 last:flex-none">
                  <div className={cn(
                    "flex flex-col sm:flex-row items-center gap-1 sm:gap-2",
                    currentStep >= item.step ? "opacity-100" : "opacity-50"
                  )}>
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all",
                      currentStep > item.step 
                        ? "bg-white text-primary" 
                        : currentStep === item.step 
                          ? "bg-white/30 text-white ring-2 ring-white" 
                          : "bg-white/10 text-white/60"
                    )}>
                      {currentStep > item.step ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs text-primary-foreground font-medium hidden sm:block">{item.label}</span>
                  </div>
                  {index < 3 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 sm:mx-3 rounded-full",
                      currentStep > item.step ? "bg-white" : "bg-white/20"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Limited Time Offers Banner */}
        {!countdown.isExpired && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Timer className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Flame className="w-5 h-5" />
                        عروض اليوم المحدودة
                      </h3>
                      <p className="text-white/80 text-xs sm:text-sm">خصومات حصرية تنتهي قريباً!</p>
                    </div>
                  </div>
                  
                  {/* Countdown Timer */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[50px] sm:min-w-[60px]">
                      <p className="text-xl sm:text-2xl font-bold text-white">{String(countdown.hours).padStart(2, '0')}</p>
                      <p className="text-[9px] sm:text-[10px] text-white/70">ساعة</p>
                    </div>
                    <span className="text-white text-xl font-bold">:</span>
                    <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[50px] sm:min-w-[60px]">
                      <p className="text-xl sm:text-2xl font-bold text-white">{String(countdown.minutes).padStart(2, '0')}</p>
                      <p className="text-[9px] sm:text-[10px] text-white/70">دقيقة</p>
                    </div>
                    <span className="text-white text-xl font-bold">:</span>
                    <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[50px] sm:min-w-[60px]">
                      <motion.p 
                        key={countdown.seconds}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-xl sm:text-2xl font-bold text-white"
                      >
                        {String(countdown.seconds).padStart(2, '0')}
                      </motion.p>
                      <p className="text-[9px] sm:text-[10px] text-white/70">ثانية</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Reorder Section - Modern Design */}
        {recentOrders.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 dark:bg-primary/20 flex items-center justify-center">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">إعادة طلب سريع</h2>
                  <p className="text-xs text-muted-foreground">أكمل طلبك بنقرة واحدة</p>
                </div>
              </div>
              <Badge className="bg-primary/15 dark:bg-primary/25 text-primary border-0 text-[10px] px-3">
                <Sparkles className="w-3 h-3 ml-1" />
                {recentOrders.length} طلبات سابقة
              </Badge>
            </div>

            {/* Reorder Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {recentOrders.slice(0, 5).map((order: any, index: number) => {
                const service = order.services;
                if (!service || service.status !== 'active') return null;
                const networkInfo = getSocialNetworkInfo(service.name);
                const Icon = networkInfo.icon;
                const priceInSAR = convertToSAR(service.price);
                const totalPrice = priceInSAR * (order.quantity || 1) / 1000;
                const orderDate = new Date(order.created_at);
                const timeAgo = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCategory(service.category);
                      setSelectedService(service);
                      setLink(order.link || '');
                      setQuantity(order.quantity?.toString() || '');
                      toast.success('تم تحميل بيانات الطلب السابق، يمكنك الآن إرسال الطلب!', {
                        description: `الخدمة: ${service.name.substring(0, 50)}...`,
                        duration: 4000,
                      });
                      setTimeout(() => {
                        document.getElementById('order-form-section')?.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start' 
                        });
                      }, 100);
                    }}
                    className="group relative bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Decorative Background */}
                    <div className={cn(
                      "absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity",
                      networkInfo.gradient.includes('pink') ? 'bg-pink-500' :
                      networkInfo.gradient.includes('blue') ? 'bg-blue-500' :
                      networkInfo.gradient.includes('red') ? 'bg-red-500' :
                      networkInfo.gradient.includes('green') ? 'bg-green-500' :
                      networkInfo.gradient.includes('purple') ? 'bg-purple-500' :
                      networkInfo.gradient.includes('cyan') ? 'bg-cyan-500' :
                      networkInfo.gradient.includes('orange') ? 'bg-orange-500' :
                      'bg-primary'
                    )} />

                    {/* Header with Icon & Badge */}
                    <div className="relative flex items-start justify-between mb-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
                        networkInfo.gradient
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-[9px] bg-background border-border text-foreground">
                          {timeAgo === 0 ? 'اليوم' : timeAgo === 1 ? 'أمس' : `منذ ${timeAgo} أيام`}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">#{order.order_number?.slice(-6)}</span>
                      </div>
                    </div>

                    {/* Service Name */}
                    <p className="relative text-sm font-medium text-foreground line-clamp-2 mb-3 leading-relaxed">
                      {service.name}
                    </p>

                    {/* Order Details */}
                    <div className="relative flex items-center gap-2 mb-4 p-2 rounded-lg bg-muted/50 dark:bg-muted/30">
                      <div className="flex-1 text-center border-l border-border">
                        <p className="text-[10px] text-muted-foreground">الكمية</p>
                        <p className="text-sm font-bold text-foreground">{order.quantity?.toLocaleString()}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-[10px] text-muted-foreground">السعر</p>
                        <p className="text-sm font-bold text-primary">{totalPrice.toFixed(2)}ر.س</p>
                      </div>
                    </div>

                    {/* Reorder Button */}
                    <Button
                      size="sm"
                      className="relative w-full h-10 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <RotateCcw className="w-4 h-4 ml-2 group-hover:rotate-180 transition-transform duration-500" />
                      إعادة الطلب الآن
                      <ArrowLeft className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Social Networks Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">اختر المنصة</h2>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-14 gap-2 sm:gap-3">
            {socialNetworks.map((network) => {
              const Icon = network.icon;
              const isSelected = selectedNetwork === network.id;
              return (
                <motion.button
                  key={network.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { 
                    setSelectedNetwork(network.id); 
                    setSelectedCategory(null); 
                    setSelectedService(null); 
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl transition-all",
                    isSelected 
                      ? "bg-primary/10 ring-2 ring-primary shadow-lg" 
                      : "bg-card hover:bg-muted border border-border/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md",
                    network.gradient
                  )}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center">{network.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Categories & Services List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Categories */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-muted/30 p-3 sm:p-4 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-sm sm:text-base">الأقسام</h3>
                        <Badge variant="secondary" className="text-xs">{filteredByNetwork.length}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[200px] sm:h-[250px]">
                    <div className="p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredByNetwork.map((category) => {
                        const networkInfo = getSocialNetworkInfo(category);
                        const NetworkIcon = networkInfo.icon;
                        const isSelected = selectedCategory === category;
                        
                        return (
                          <motion.button
                            key={category}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => { 
                              setSelectedCategory(category); 
                              setSelectedService(null); 
                              setSearchQuery("");
                            }}
                            className={cn(
                              "flex flex-row-reverse items-center gap-3 p-3 rounded-xl transition-all text-right w-full",
                              isSelected 
                                ? "bg-primary text-primary-foreground shadow-md" 
                                : "bg-muted/50 hover:bg-muted"
                            )}
                          >
                            {/* Icon on the right */}
                            <div className={cn(
                              "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                              networkInfo.gradient
                            )}>
                              <NetworkIcon className="w-4 h-4" />
                            </div>
                            {/* Category name in the middle */}
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-xs sm:text-sm font-medium truncate">{category}</p>
                            </div>
                            {/* Count on the left */}
                            <Badge variant={isSelected ? "secondary" : "outline"} className="text-[10px] shrink-0">
                              {categoryCounts[category]}
                            </Badge>
                          </motion.button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Services */}
            <AnimatePresence mode="wait">
              {selectedCategory && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="border-border/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-muted/30 p-3 sm:p-4 border-b border-border/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-semibold text-sm sm:text-base">الخدمات</h3>
                            <Badge variant="secondary" className="text-xs">{filteredServices.length}</Badge>
                          </div>
                          
                          <div className="relative w-full sm:w-64">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              placeholder="ابحث عن خدمة..." 
                              className="pr-9 h-9 text-sm bg-background" 
                              value={searchQuery} 
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <ScrollArea className="h-[300px] sm:h-[400px]">
                        {filteredServices.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Search className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">لا توجد خدمات متاحة</p>
                          </div>
                        ) : (
                          <div className="p-2 sm:p-3 space-y-2">
                            {filteredServices.map((service, index) => {
                              const networkInfo = getSocialNetworkInfo(service.name || service.category);
                              const NetworkIcon = networkInfo.icon;
                              const isFavorite = favorites.includes(service.id);
                              const isSelected = selectedService?.id === service.id;
                              const isPopular = isPopularService(service.id);
                              const discount = getServiceDiscount(service.id);
                              const discountedPrice = discount > 0 ? service.price * (1 - discount / 100) : service.price;
                              
                              return (
                                <motion.div
                                  key={service.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.02 }}
                                  whileHover={{ scale: 1.005 }}
                                  onClick={() => {
                                    setSelectedService(service);
                                    if (service.features?.min) setQuantity(service.features.min.toString());
                                  }}
                                  className={cn(
                                    "relative flex flex-row-reverse items-center gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-all border",
                                    isSelected 
                                      ? "bg-primary/5 border-primary shadow-sm" 
                                      : "bg-card border-border/50 hover:bg-muted/50",
                                    discount > 0 && "ring-1 ring-orange-400/50"
                                  )}
                                >
                                  {/* Badges Container */}
                                  <div className="absolute -top-1.5 right-2 flex items-center gap-1.5 z-10">
                                    {isPopular && (
                                      <Badge className="text-[9px] h-5 px-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
                                        <Flame className="w-2.5 h-2.5 ml-0.5" />
                                        الأكثر طلباً
                                      </Badge>
                                    )}
                                    {discount > 0 && (
                                      <Badge className="text-[9px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-sm animate-pulse">
                                        <Percent className="w-2.5 h-2.5 ml-0.5" />
                                        خصم {discount}%
                                      </Badge>
                                    )}
                                    {service.refill_enabled && !isPopular && !discount && (
                                      <Badge className="text-[9px] h-5 px-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm">
                                        <BadgeCheck className="w-2.5 h-2.5 ml-0.5" />
                                        مضمون
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Icon on the right */}
                                  <div className={cn(
                                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                                    networkInfo.gradient
                                  )}>
                                    <NetworkIcon className="w-5 h-5" />
                                  </div>
                                  
                                  {/* Service details in the middle */}
                                  <div className="flex-1 min-w-0 mt-1 text-right">
                                    <p className="text-xs sm:text-sm font-medium mb-1 line-clamp-2">{service.name}</p>
                                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                                      <Badge variant="outline" className="text-[10px] h-5">
                                        {service.features?.min || 10} - {service.features?.max || "∞"}
                                      </Badge>
                                      {service.refill_enabled && (isPopular || discount > 0) && (
                                        <Badge className="text-[10px] h-5 bg-success/10 text-success border-success/20">
                                          <Shield className="w-3 h-3 ml-1" />
                                          مضمون
                                        </Badge>
                                      )}
                                      {isPopular && (
                                        <Badge className="text-[10px] h-5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                                          <ThumbsUp className="w-3 h-3 ml-1" />
                                          موثوق
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Price on the left - converted from USD to SAR */}
                                  <div className="flex flex-col items-start gap-2 shrink-0">
                                    {discount > 0 ? (
                                      <div className="text-left">
                                        <p className="text-[10px] text-muted-foreground line-through whitespace-nowrap">{convertToSAR(service.price).toFixed(2)}ر.س</p>
                                        <p className="text-sm sm:text-base font-bold text-red-500 whitespace-nowrap">{convertToSAR(discountedPrice).toFixed(2)}ر.س</p>
                                      </div>
                                    ) : (
                                      <p className="text-sm sm:text-base font-bold text-primary whitespace-nowrap">{convertToSAR(service.price).toFixed(2)}ر.س</p>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-7 h-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(service.id);
                                      }}
                                    >
                                      <Heart className={cn("w-4 h-4", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                                    </Button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Form Sidebar */}
          <div id="order-form-section" className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-4"
            >
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 sm:p-5 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">تفاصيل الطلب</h3>
                        <p className="text-xs text-muted-foreground">املأ البيانات لإتمام الطلب</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Selected Service Info */}
                    {selectedService && (
                      <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                            getSocialNetworkInfo(selectedService.name).gradient
                          )}>
                            {(() => { const Icon = getSocialNetworkInfo(selectedService.name).icon; return <Icon className="w-4 h-4" />; })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-2">{selectedService.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              السعر: {convertToSAR(selectedService.price).toFixed(2)} ر.س / 1000
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Link Input */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-primary" />
                        الرابط <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input 
                          type="url"
                          placeholder="https://..." 
                          className={cn(
                            "h-11 text-sm bg-background pl-10",
                            !selectedService && "opacity-50"
                          )}
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          disabled={!selectedService}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8"
                          onClick={handleCopyLink}
                          disabled={!link}
                        >
                          {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
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
                        placeholder={selectedService ? `الحد الأدنى: ${selectedService.features?.min || 10}` : "اختر خدمة أولاً"} 
                        className={cn(
                          "h-11 text-sm bg-background",
                          !selectedService && "opacity-50"
                        )}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        disabled={!selectedService}
                        min={selectedService?.features?.min || 10}
                        max={selectedService?.features?.max}
                      />
                      {selectedService && (
                        <div className="flex flex-wrap gap-1.5">
                          {[100, 500, 1000, 5000, 10000].map((q) => (
                            <Button
                              key={q}
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] px-2"
                              onClick={() => setQuantity(q.toString())}
                            >
                              +{q.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price Summary */}
                    <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">السعر التقديري</span>
                        <span className="font-semibold">{totalPrice.toFixed(4)} ر.س</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
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
                      className="w-full h-12 text-sm font-medium bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
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
                          <Rocket className="w-4 h-4 ml-2" />
                          إرسال الطلب
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Features Cards */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-card border border-border/50 rounded-xl p-3 text-center"
                >
                  <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-[10px] sm:text-xs font-medium">تنفيذ فوري</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-card border border-border/50 rounded-xl p-3 text-center"
                >
                  <Shield className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-[10px] sm:text-xs font-medium">ضمان الخدمة</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-card border border-border/50 rounded-xl p-3 text-center"
                >
                  <Gift className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                  <p className="text-[10px] sm:text-xs font-medium">نقاط مكافآت</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-card border border-border/50 rounded-xl p-3 text-center"
                >
                  <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-[10px] sm:text-xs font-medium">دعم 24/7</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <ChevronUp className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesNew;
