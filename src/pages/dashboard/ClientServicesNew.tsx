import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { 
  Search, 
  Package, 
  Star, 
  Heart,
  Zap,
  Shield,
  TrendingUp,
  ChevronDown,
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
  X,
  Info,
  Link2,
  Hash,
  Wallet,
  Award,
  CheckCircle2,
  XCircle,
  History,
  Trash2,
  MessageCircle,
  Ghost,
  Radio,
  Star as StarIcon,
  Globe2,
  Tv,
  RefreshCw,
  ChevronUp,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  RotateCcw,
  Repeat
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RecentOrder {
  id: string;
  order_number: string;
  link: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  service: Service;
}

type SortField = "price" | "name" | "refill" | "min" | "max";
type SortDirection = "asc" | "desc";

interface RecentLink {
  id: string;
  link: string;
  service_category: string | null;
  label: string | null;
  use_count: number;
  last_used_at: string;
}

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

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

// Social network data
const socialNetworks = [
  { id: 'all', name: 'الكل', icon: MoreHorizontal, color: 'from-slate-500 to-slate-600' },
  { id: 'facebook', name: 'فيسبوك', icon: Facebook, color: 'from-blue-500 to-blue-600' },
  { id: 'instagram', name: 'انستقرام', icon: Instagram, color: 'from-pink-500 via-purple-500 to-orange-500' },
  { id: 'tiktok', name: 'تيك توك', icon: Music2, color: 'from-zinc-800 to-zinc-900' },
  { id: 'youtube', name: 'يوتيوب', icon: Youtube, color: 'from-red-500 to-red-600' },
  { id: 'twitter', name: 'تويتر', icon: Twitter, color: 'from-sky-400 to-sky-500' },
  { id: 'telegram', name: 'تيليجرام', icon: Send, color: 'from-sky-500 to-sky-600' },
  { id: 'discord', name: 'ديسكورد', icon: MessageCircle, color: 'from-indigo-500 to-indigo-600' },
  { id: 'twitch', name: 'تويتش', icon: Tv, color: 'from-purple-500 to-purple-600' },
  { id: 'spotify', name: 'سبوتيفاي', icon: Radio, color: 'from-green-500 to-green-600' },
  { id: 'snapchat', name: 'سناب شات', icon: Ghost, color: 'from-yellow-400 to-yellow-500' },
  { id: 'google', name: 'جوجل', icon: Globe2, color: 'from-red-500 via-yellow-500 to-blue-500' },
  { id: 'reviews', name: 'تقييمات', icon: StarIcon, color: 'from-amber-400 to-orange-500' },
  { id: 'website', name: 'زيارات', icon: Globe, color: 'from-emerald-500 to-teal-600' },
  { id: 'linkedin', name: 'لينكدان', icon: Linkedin, color: 'from-blue-600 to-blue-700' },
];

const ClientServicesNew = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "creating" | "sending" | "done">("idle");
  const [showRecentLinks, setShowRecentLinks] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Features state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [filterGuaranteed, setFilterGuaranteed] = useState<boolean | null>(null);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user balance
  const { data: userBalance } = useQuery({
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

  // Fetch recent links
  const { data: recentLinks = [], refetch: refetchLinks } = useQuery({
    queryKey: ["recent-links", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("user_recent_links").select("*").eq("user_id", user.id).order("last_used_at", { ascending: false }).limit(10);
      return data as RecentLink[] || [];
    },
    enabled: !!user?.id,
  });

  // Fetch recent orders for quick reorder
  const { data: recentOrders = [] } = useQuery({
    queryKey: ["recent-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("orders")
        .select("*, services(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data || []).map((order: any) => ({
        ...order,
        service: order.services
      })) as RecentOrder[];
    },
    enabled: !!user?.id,
  });

  // Get max price for filter
  const maxServicePrice = useMemo(() => {
    return Math.max(...services.map(s => s.price), 100);
  }, [services]);

  // Update price range when services load
  useEffect(() => {
    if (maxServicePrice > priceRange[1]) {
      setPriceRange([0, maxServicePrice]);
    }
  }, [maxServicePrice]);

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

  // Keywords to exclude design and development categories
  const designDevKeywords = useMemo(() => ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 
    'برمجة', 'تطوير', 'موقع', 'تطبيق', 'dev', 'development', 'website', 'app'], []);

  const isDesignOrDevCategory = (category: string) => {
    const lowerCat = category.toLowerCase();
    return designDevKeywords.some(k => lowerCat.includes(k));
  };

  // Get social network icon and color based on category/service name
  const getSocialNetworkInfo = useMemo(() => (text: string) => {
    const lowerText = text.toLowerCase();
    
    const networkPatterns = [
      { keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500' },
      { keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, color: 'from-pink-500 via-purple-500 to-orange-500', bg: 'bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500' },
      { keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], icon: Music2, color: 'from-zinc-800 to-zinc-900', bg: 'bg-zinc-800' },
      { keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, color: 'from-red-500 to-red-600', bg: 'bg-red-500' },
      { keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: Twitter, color: 'from-sky-400 to-sky-500', bg: 'bg-sky-500' },
      { keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, color: 'from-sky-500 to-sky-600', bg: 'bg-sky-600' },
      { keywords: ['discord', 'ديسكورد', 'دسكورد'], icon: MessageCircle, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-500' },
      { keywords: ['twitch', 'تويتش'], icon: Tv, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500' },
      { keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], icon: Radio, color: 'from-green-500 to-green-600', bg: 'bg-green-500' },
      { keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, color: 'from-yellow-400 to-yellow-500', bg: 'bg-yellow-400' },
      { keywords: ['google', 'جوجل', 'قوقل'], icon: Globe2, color: 'from-red-500 via-yellow-500 to-blue-500', bg: 'bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500' },
      { keywords: ['linkedin', 'لينكدان', 'لينكد ان'], icon: Linkedin, color: 'from-blue-600 to-blue-700', bg: 'bg-blue-600' },
      { keywords: ['review', 'تقييم', 'rating'], icon: StarIcon, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500' },
      { keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع'], icon: Globe, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500' },
      { keywords: ['thread', 'ثريد'], icon: MessageCircle, color: 'from-zinc-700 to-zinc-900', bg: 'bg-zinc-800' },
      { keywords: ['kick'], icon: Tv, color: 'from-green-400 to-green-600', bg: 'bg-green-500' },
      { keywords: ['soundcloud', 'ساوند'], icon: Radio, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500' },
    ];

    for (const pattern of networkPatterns) {
      if (pattern.keywords.some(k => lowerText.includes(k))) {
        return { icon: pattern.icon, color: pattern.color, bg: pattern.bg };
      }
    }
    
    return { icon: Package, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-500' };
  }, []);

  // Get unique categories (excluding design and development)
  const serviceCategories = useMemo(() => 
    [...new Set(services.map(s => s.category))]
      .filter(cat => !isDesignOrDevCategory(cat))
      .sort()
  , [services, designDevKeywords]);

  // Count services per category (only social media)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services
      .filter(service => !isDesignOrDevCategory(service.category))
      .forEach(service => { counts[service.category] = (counts[service.category] || 0) + 1; });
    return counts;
  }, [services, designDevKeywords]);

  // Filter services by network
  const filteredByNetwork = useMemo(() => {
    if (selectedNetwork === 'all') return serviceCategories;
    return serviceCategories.filter(cat => cat.toLowerCase().includes(selectedNetwork.toLowerCase()));
  }, [serviceCategories, selectedNetwork]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    
    let result = services.filter(service => {
      const matchesSearch = !searchQuery || 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (service.external_service_id?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = service.category === selectedCategory;
      const matchesPrice = priceRange[1] >= maxServicePrice || (service.price >= priceRange[0] && service.price <= priceRange[1]);
      const matchesGuarantee = filterGuaranteed === null || service.refill_enabled === filterGuaranteed;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesGuarantee;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "price": comparison = a.price - b.price; break;
        case "name": comparison = a.name.localeCompare(b.name, 'ar'); break;
        case "refill": comparison = (a.refill_enabled ? 1 : 0) - (b.refill_enabled ? 1 : 0); break;
        case "min": comparison = (a.features?.min || 10) - (b.features?.min || 10); break;
        case "max": comparison = (a.features?.max || 1000000) - (b.features?.max || 1000000); break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [services, searchQuery, selectedCategory, priceRange, filterGuaranteed, sortField, sortDirection]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    return (selectedService.price / 1000) * qty;
  }, [selectedService, quantity]);

  // Save recent link
  const saveRecentLink = async (linkUrl: string) => {
    if (!user?.id || !linkUrl.trim()) return;
    try {
      const existingLink = recentLinks.find(l => l.link === linkUrl);
      if (existingLink) {
        await supabase.from("user_recent_links").update({ use_count: existingLink.use_count + 1, last_used_at: new Date().toISOString(), service_category: selectedCategory }).eq("id", existingLink.id);
      } else {
        await supabase.from("user_recent_links").insert({ user_id: user.id, link: linkUrl, service_category: selectedCategory, label: null });
      }
      refetchLinks();
    } catch (error) { console.error("Error saving recent link:", error); }
  };

  const deleteRecentLink = async (linkId: string) => {
    if (!user?.id) return;
    try {
      await supabase.from("user_recent_links").delete().eq("id", linkId);
      refetchLinks();
      toast.success("تم حذف الرابط");
    } catch { toast.error("حدث خطأ أثناء الحذف"); }
  };

  const useRecentLink = (recentLink: RecentLink) => {
    setLink(recentLink.link);
    setShowRecentLinks(false);
    toast.success("تم تحديد الرابط");
  };

  const handleQuickReorder = (order: RecentOrder) => {
    if (order.service) {
      setSelectedCategory(order.service.category);
      setSelectedService(order.service);
      setLink(order.link || "");
      setQuantity(order.quantity?.toString() || "");
      toast.success("تم تحميل بيانات الطلب السابق");
    }
  };

  const resetFilters = () => {
    setPriceRange([0, maxServicePrice]);
    setFilterGuaranteed(null);
    setSortField("name");
    setSortDirection("asc");
    setSearchQuery("");
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("يجب تسجيل الدخول للطلب"); return; }
    if (!selectedService || !link || !quantity) { toast.error("يرجى ملء جميع الحقول المطلوبة"); return; }
    if (!userBalance || userBalance.balance < totalPrice) { toast.error("رصيدك غير كافي"); return; }

    setIsSubmitting(true);
    setSubmitStatus("creating");
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const { data: orderData, error: orderError } = await supabase.from("orders").insert({
        user_id: user.id, service_id: selectedService.id, order_number: orderNumber, quantity: parseInt(quantity), link, total_price: totalPrice, status: "pending",
      }).select().single();
      if (orderError) throw orderError;
      
      await saveRecentLink(link);
      await supabase.from("user_balances").update({ balance: userBalance.balance - totalPrice, total_spent: userBalance.total_spent + totalPrice }).eq("user_id", user.id);
      
      setSubmitStatus("sending");
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
      } catch (providerErr) {
        toast.error("خطأ في الاتصال بالمزود", { id: 'provider-order' });
      }
      
      setSubmitStatus("done");
      toast.success("تم إرسال الطلب بنجاح!");
      setLink(""); setQuantity(""); setSelectedService(null);
      refetch();
    } catch { toast.error("حدث خطأ أثناء إرسال الطلب"); }
    finally { 
      setIsSubmitting(false); 
      setSubmitStatus("idle");
    }
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <p className="text-xs text-muted-foreground animate-pulse">جاري تحميل الخدمات...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
        {/* Compact Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[9px] sm:text-[10px] opacity-80">الرصيد</span>
              </div>
              <p className="text-sm sm:text-base font-bold">{(userBalance?.balance || 0).toFixed(2)}</p>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="bg-card border border-border/50 rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">النقاط</span>
              </div>
              <p className="text-sm sm:text-base font-bold">{userPoints?.available_points || 0}</p>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-card border border-border/50 rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">المستوى</span>
              </div>
              <p className="text-[10px] sm:text-xs font-bold truncate">{(userPoints?.reward_tiers as any)?.name_ar || "مبتدئ"}</p>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="bg-card border border-border/50 rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">الخدمات</span>
              </div>
              <p className="text-sm sm:text-base font-bold">{services.length}</p>
            </div>
          </motion.div>
        </div>

        {/* Networks Scrollable */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-card border border-border/50 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] sm:text-xs font-medium">اختر المنصة</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {socialNetworks.map((network) => {
                const Icon = network.icon;
                const isSelected = selectedNetwork === network.id;
                return (
                  <button
                    key={network.id}
                    onClick={() => { setSelectedNetwork(network.id); setSelectedCategory(null); setSelectedService(null); }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-all shrink-0 min-w-[48px] sm:min-w-[56px]",
                      isSelected ? "bg-primary/10 ring-1 ring-primary" : "bg-muted/40 hover:bg-muted/60"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                      network.color
                    )}>
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-medium truncate w-full text-center">{network.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Main Form Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Tabs defaultValue="new-order" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-8 sm:h-9 p-0.5 bg-muted/50 rounded-lg">
              <TabsTrigger value="new-order" className="text-[9px] sm:text-[10px] h-full gap-1 data-[state=active]:bg-background">
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">طلب</span> جديد
              </TabsTrigger>
              <TabsTrigger value="quick-reorder" className="text-[9px] sm:text-[10px] h-full gap-1 data-[state=active]:bg-background">
                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">إعادة</span> طلب
              </TabsTrigger>
              <TabsTrigger value="favorites" className="text-[9px] sm:text-[10px] h-full gap-1 data-[state=active]:bg-background">
                <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                المفضلة
                {favorites.length > 0 && <Badge variant="secondary" className="text-[8px] h-4 px-1">{favorites.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="text-[9px] sm:text-[10px] h-full gap-1 data-[state=active]:bg-background">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                اشتراكات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-order" className="mt-3">
              <div className="bg-card border border-border/50 rounded-lg p-3 sm:p-4 space-y-3">
                {/* Progress Steps */}
                <div className="flex items-center justify-between gap-1 py-1">
                  {[
                    { step: 1, label: "القسم", done: !!selectedCategory },
                    { step: 2, label: "الخدمة", done: !!selectedService },
                    { step: 3, label: "الرابط", done: !!link },
                    { step: 4, label: "الكمية", done: !!quantity },
                  ].map((item, index) => (
                    <div key={item.step} className="flex items-center flex-1 last:flex-none">
                      <div className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold transition-all shrink-0",
                        item.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {item.done ? <CheckCircle2 className="w-3 h-3" /> : item.step}
                      </div>
                      <span className={cn(
                        "text-[8px] sm:text-[9px] mr-0.5 hidden sm:block",
                        item.done ? "text-primary font-medium" : "text-muted-foreground"
                      )}>{item.label}</span>
                      {index < 3 && <div className={cn("flex-1 h-0.5 mx-1", item.done ? "bg-primary" : "bg-muted")} />}
                    </div>
                  ))}
                </div>

                {/* Category Select */}
                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
                    <Layers className="w-3 h-3 text-primary" />
                    القسم <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedCategory || ""} onValueChange={(v) => { setSelectedCategory(v || null); setSelectedService(null); setQuantity(""); setSearchQuery(""); }} dir="rtl">
                    <SelectTrigger className="h-9 sm:h-10 text-[11px] sm:text-xs bg-muted/30 border-border/50 rounded-lg">
                      <SelectValue placeholder="اختر القسم...">
                        {selectedCategory && (
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="truncate text-[11px] sm:text-xs">{selectedCategory}</span>
                            <Badge variant="secondary" className="text-[8px] h-4 px-1">{categoryCounts[selectedCategory]}</Badge>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh] w-[calc(100vw-1.5rem)] sm:w-[var(--radix-select-trigger-width)] bg-popover border-border z-[100]" position="popper" sideOffset={4}>
                      <ScrollArea className="max-h-[calc(50vh-8px)]">
                        <div className="p-1">
                          {filteredByNetwork.map((category) => {
                            const networkInfo = getSocialNetworkInfo(category);
                            const NetworkIcon = networkInfo.icon;
                            return (
                              <SelectItem key={category} value={category} className="py-2 px-2 rounded-md cursor-pointer text-[11px] sm:text-xs" dir="rtl">
                                <div className="flex items-center justify-between gap-2 w-full flex-row-reverse">
                                  <div className="flex items-center gap-1.5 flex-row-reverse min-w-0">
                                    <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white shrink-0", networkInfo.bg)}>
                                      <NetworkIcon className="w-2.5 h-2.5" />
                                    </div>
                                    <span className="truncate text-[10px] sm:text-[11px]">{category}</span>
                                  </div>
                                  <Badge className="bg-primary/15 text-primary border-0 text-[8px] h-4 px-1 shrink-0">{categoryCounts[category]}</Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Select */}
                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    الخدمة <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={selectedService?.id || ""} 
                    onValueChange={(v) => {
                      const service = filteredServices.find(s => s.id === v);
                      setSelectedService(service || null);
                      if (service?.features?.min) setQuantity(service.features.min.toString());
                    }} 
                    disabled={!selectedCategory} 
                    dir="rtl"
                  >
                    <SelectTrigger className={cn(
                      "h-9 sm:h-10 text-[11px] sm:text-xs bg-muted/30 border-border/50 rounded-lg",
                      !selectedCategory && "opacity-50"
                    )}>
                      <SelectValue placeholder={selectedCategory ? "اختر الخدمة..." : "اختر القسم أولاً"}>
                        {selectedService && (
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="truncate text-[10px] sm:text-[11px]">{selectedService.name}</span>
                            <span className="text-primary font-bold text-[10px] shrink-0 mr-auto">{selectedService.price.toFixed(2)} ر.س</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh] w-[calc(100vw-1.5rem)] sm:w-[var(--radix-select-trigger-width)] bg-popover border-border z-[100]" position="popper" sideOffset={4}>
                      <div className="p-1.5 sticky top-0 bg-popover z-20 border-b border-border/50">
                        <div className="relative">
                          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input 
                            placeholder="بحث..." 
                            className="pr-7 h-7 text-[10px] bg-muted/30 border-border/40 rounded" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                          />
                        </div>
                      </div>
                      <ScrollArea className="max-h-[calc(50vh-48px)]">
                        {filteredServices.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-[10px]">
                            <Search className="w-6 h-6 mx-auto mb-1 opacity-30" />
                            <p>لا توجد خدمات</p>
                          </div>
                        ) : (
                          <div className="p-1" dir="rtl">
                            {filteredServices.map((service) => {
                              const networkInfo = getSocialNetworkInfo(service.name || service.category);
                              const NetworkIcon = networkInfo.icon;
                              return (
                                <SelectItem key={service.id} value={service.id} className="py-1.5 px-2 rounded-md cursor-pointer" dir="rtl">
                                  <div className="flex items-center gap-1.5 w-full">
                                    <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white shrink-0", networkInfo.bg)}>
                                      <NetworkIcon className="w-2.5 h-2.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[9px] sm:text-[10px] font-medium truncate">{service.name}</p>
                                      <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                                        <span>{service.features?.min || 10} - {service.features?.max || "∞"}</span>
                                        {service.refill_enabled && <Badge className="h-3 px-0.5 text-[7px] bg-success/10 text-success border-0">مضمون</Badge>}
                                      </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-primary shrink-0">{service.price.toFixed(2)}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </div>
                        )}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                {/* Link Input */}
                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-blue-500" />
                    الرابط <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      type="url"
                      placeholder="https://..." 
                      className={cn(
                        "h-9 sm:h-10 text-[11px] sm:text-xs bg-muted/30 border-border/50 rounded-lg pr-8",
                        !selectedService && "opacity-50",
                        link && !link.startsWith("http") && "border-destructive/50"
                      )}
                      value={link} 
                      onChange={(e) => setLink(e.target.value)} 
                      disabled={!selectedService}
                      dir="ltr"
                    />
                    {recentLinks.length > 0 && (
                      <Popover open={showRecentLinks} onOpenChange={setShowRecentLinks}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7" disabled={!selectedService}>
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2" align="end">
                          <p className="text-[10px] font-medium mb-2">الروابط المستخدمة مؤخراً</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {recentLinks.map((recentLink) => (
                              <div key={recentLink.id} className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50 hover:bg-muted transition-colors">
                                <button onClick={() => useRecentLink(recentLink)} className="flex-1 text-[9px] text-right truncate">{recentLink.link}</button>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteRecentLink(recentLink.id)}>
                                  <Trash2 className="w-2.5 h-2.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  {link && !link.startsWith("http") && (
                    <p className="text-[9px] text-destructive flex items-center gap-0.5">
                      <Info className="w-2.5 h-2.5" />
                      يجب أن يبدأ الرابط بـ http
                    </p>
                  )}
                </div>

                {/* Quantity Input */}
                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-xs font-medium flex items-center gap-1">
                    <Hash className="w-3 h-3 text-purple-500" />
                    الكمية <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number"
                      inputMode="numeric"
                      placeholder={selectedService ? `${selectedService.features?.min || 10} - ${selectedService.features?.max || "∞"}` : "اختر الخدمة أولاً"} 
                      className={cn(
                        "h-9 sm:h-10 text-[11px] sm:text-xs bg-muted/30 border-border/50 rounded-lg",
                        !selectedService && "opacity-50",
                        quantity && selectedService && (
                          parseInt(quantity) < (selectedService.features?.min || 10) ||
                          (selectedService.features?.max && parseInt(quantity) > selectedService.features.max)
                        ) && "border-destructive/50"
                      )}
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)} 
                      min={selectedService?.features?.min || 10} 
                      max={selectedService?.features?.max || 1000000}
                      disabled={!selectedService}
                    />
                    {selectedService && quantity && parseInt(quantity) > 0 && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground bg-background/80 px-0.5 rounded">
                        ≈ {((selectedService.price / 1000) * parseInt(quantity || "0")).toFixed(2)} ر.س
                      </div>
                    )}
                  </div>
                  {selectedService && quantity && (
                    <>
                      {parseInt(quantity) < (selectedService.features?.min || 10) && (
                        <p className="text-[9px] text-destructive flex items-center gap-0.5">
                          <Info className="w-2.5 h-2.5" />
                          الحد الأدنى {selectedService.features?.min || 10}
                        </p>
                      )}
                      {selectedService.features?.max && parseInt(quantity) > selectedService.features.max && (
                        <p className="text-[9px] text-destructive flex items-center gap-0.5">
                          <Info className="w-2.5 h-2.5" />
                          الحد الأقصى {selectedService.features.max}
                        </p>
                      )}
                    </>
                  )}
                  {/* Quick quantity buttons */}
                  {selectedService && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[
                        selectedService.features?.min || 100,
                        500, 1000, 5000, 10000
                      ].filter(q => !selectedService.features?.max || q <= selectedService.features.max)
                       .filter(q => q >= (selectedService.features?.min || 10))
                       .slice(0, 5)
                       .map((q) => (
                        <Button
                          key={q}
                          type="button"
                          variant={parseInt(quantity) === q ? "default" : "outline"}
                          size="sm"
                          className="h-5 text-[8px] px-1.5"
                          onClick={() => setQuantity(q.toString())}
                        >
                          {q.toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">المبلغ الإجمالي</span>
                    <p className="text-base sm:text-lg font-bold text-primary">{totalPrice.toFixed(4)} ر.س</p>
                  </div>
                  
                  {userBalance && totalPrice > 0 && (
                    <div className={cn(
                      "flex items-center gap-1 p-1.5 rounded text-[9px] sm:text-[10px]",
                      userBalance.balance >= totalPrice ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                      {userBalance.balance >= totalPrice ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>رصيدك كافي ({userBalance.balance.toFixed(2)} ر.س)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 shrink-0" />
                          <span>تحتاج {(totalPrice - userBalance.balance).toFixed(2)} ر.س إضافية</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  className="w-full h-10 sm:h-11 text-xs sm:text-sm font-bold rounded-lg gap-2" 
                  onClick={handleSubmit} 
                  disabled={
                    isSubmitting || !selectedService || !link || !link.startsWith("http") || !quantity ||
                    (selectedService && parseInt(quantity) < (selectedService.features?.min || 10)) ||
                    (selectedService?.features?.max && parseInt(quantity) > selectedService.features.max) ||
                    (userBalance && userBalance.balance < totalPrice)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        {submitStatus === "creating" && "جاري الإنشاء..."}
                        {submitStatus === "sending" && "جاري الإرسال..."}
                        {submitStatus === "done" && "تم!"}
                        {submitStatus === "idle" && "جاري المعالجة..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>إرسال الطلب - {totalPrice.toFixed(2)} ر.س</span>
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Quick Reorder Tab */}
            <TabsContent value="quick-reorder" className="mt-3">
              <div className="bg-card border border-border/50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Repeat className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] sm:text-xs font-medium">إعادة الطلب السريع</span>
                </div>
                {recentOrders.length === 0 ? (
                  <div className="py-8 text-center">
                    <History className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-[10px] text-muted-foreground">لا توجد طلبات سابقة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map((order, i) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-[11px] font-medium truncate">{order.service?.name || "خدمة محذوفة"}</p>
                          <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-muted-foreground">
                            <span>{order.quantity} وحدة</span>
                            <span>•</span>
                            <span>{order.total_price.toFixed(2)} ر.س</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-6 text-[9px] gap-1 px-2"
                          onClick={() => handleQuickReorder(order)}
                          disabled={!order.service}
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          إعادة
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="mt-3">
              <div className="bg-card border border-border/50 rounded-lg p-3 sm:p-4">
                <div className="py-8 text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-[10px] text-muted-foreground">لا توجد اشتراكات حالياً</p>
                </div>
              </div>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="mt-3">
              <div className="bg-card border border-border/50 rounded-lg p-3 sm:p-4">
                {favorites.length === 0 ? (
                  <div className="py-8 text-center">
                    <Heart className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-[10px] text-muted-foreground">لا توجد خدمات مفضلة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {services.filter(s => favorites.includes(s.id)).map((service, i) => (
                      <motion.div 
                        key={service.id} 
                        initial={{ opacity: 0, x: 10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: i * 0.05 }} 
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => { setSelectedCategory(service.category); setSelectedService(service); }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Star className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-[11px] font-medium truncate">{service.name}</p>
                          <p className="text-[8px] sm:text-[9px] text-muted-foreground truncate">{service.category}</p>
                        </div>
                        <span className="text-[10px] font-bold text-primary shrink-0">{service.price.toFixed(2)} ر.س</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive" onClick={(e) => { e.stopPropagation(); toggleFavorite(service.id); }}>
                          <Heart className="w-3 h-3 fill-current" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Scroll to Top */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="fixed bottom-4 left-4 z-50 w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            >
              <ChevronUp className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesNew;
