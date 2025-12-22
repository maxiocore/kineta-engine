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
  Eye,
  EyeOff,
  Link2,
  Hash,
  Wallet,
  Award,
  Timer,
  Gauge,
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
  LayoutGrid,
  Table2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  GitCompare,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  const [showRecentLinks, setShowRecentLinks] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  
  // New features state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [filterGuaranteed, setFilterGuaranteed] = useState<boolean | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [compareServices, setCompareServices] = useState<Service[]>([]);
  const [showCompareSheet, setShowCompareSheet] = useState(false);

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
      // Only apply price filter if user has changed the default range
      const matchesPrice = priceRange[1] >= maxServicePrice || (service.price >= priceRange[0] && service.price <= priceRange[1]);
      const matchesGuarantee = filterGuaranteed === null || service.refill_enabled === filterGuaranteed;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesGuarantee;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "price":
          comparison = a.price - b.price;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name, 'ar');
          break;
        case "refill":
          comparison = (a.refill_enabled ? 1 : 0) - (b.refill_enabled ? 1 : 0);
          break;
        case "min":
          comparison = (a.features?.min || 10) - (b.features?.min || 10);
          break;
        case "max":
          comparison = (a.features?.max || 1000000) - (b.features?.max || 1000000);
          break;
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

  // Quick reorder function
  const handleQuickReorder = (order: RecentOrder) => {
    if (order.service) {
      setSelectedCategory(order.service.category);
      setSelectedService(order.service);
      setLink(order.link || "");
      setQuantity(order.quantity?.toString() || "");
      toast.success("تم تحميل بيانات الطلب السابق");
    }
  };

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Reset filters
  const resetFilters = () => {
    setPriceRange([0, maxServicePrice]);
    setFilterGuaranteed(null);
    setSortField("name");
    setSortDirection("asc");
    setSearchQuery("");
  };

  // Toggle compare
  const toggleCompare = (service: Service) => {
    setCompareServices(prev => {
      if (prev.find(s => s.id === service.id)) {
        return prev.filter(s => s.id !== service.id);
      }
      if (prev.length >= 4) {
        toast.error("يمكنك مقارنة 4 خدمات كحد أقصى");
        return prev;
      }
      return [...prev, service];
    });
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
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
      
      await saveRecentLink(link);
      await supabase.from("user_balances").update({ balance: userBalance.balance - totalPrice, total_spent: userBalance.total_spent + totalPrice }).eq("user_id", user.id);
      
      // Send order to provider automatically
      if (selectedService.external_service_id) {
        try {
          const { data: providerResult, error: providerError } = await supabase.functions.invoke('provider-order', {
            body: {
              orderId: orderData.id,
              serviceId: selectedService.id,
              link: link,
              quantity: parseInt(quantity)
            }
          });
          
          if (providerError) {
            console.error('Provider order error:', providerError);
            toast.warning("تم إنشاء الطلب لكن حدث خطأ في إرساله للمزود");
          } else if (providerResult?.error) {
            console.error('Provider API error:', providerResult.error);
            toast.warning(`تم إنشاء الطلب - خطأ من المزود: ${providerResult.error}`);
          } else {
            console.log('Provider order success:', providerResult);
          }
        } catch (providerErr) {
          console.error('Error calling provider-order:', providerErr);
        }
      }
      
      toast.success("تم إرسال الطلب بنجاح!");
      setLink(""); setQuantity(""); setSelectedService(null);
      refetch();
    } catch { toast.error("حدث خطأ أثناء إرسال الطلب"); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <p className="text-muted-foreground animate-pulse">جاري تحميل الخدمات...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Hero Stats with Animations */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Balance */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0, type: "spring", stiffness: 100 }}
            whileHover={{ 
              scale: 1.03, 
              y: -5,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground cursor-pointer group h-full">
              <motion.div 
                className="absolute inset-0 bg-white/10"
                initial={{ x: "-100%", opacity: 0 }}
                whileHover={{ x: "100%", opacity: 1 }}
                transition={{ duration: 0.6 }}
              />
              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z' fill='rgba(255,255,255,0.07)'%3E%3C/path%3E%3C/svg%3E\")" }} />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div 
                    className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Wallet className="w-5 h-5" />
                  </motion.div>
                  <span className="text-sm opacity-80">الرصيد</span>
                </div>
                <motion.p 
                  className="text-3xl font-black"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {(userBalance?.balance || 0).toFixed(2)} ر.س
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Points */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ 
              scale: 1.03, 
              y: -5,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm cursor-pointer group h-full overflow-hidden relative">
              <motion.div 
                className="absolute inset-0 bg-amber-500/5"
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div 
                    className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                  </motion.div>
                  <span className="text-sm text-muted-foreground">النقاط</span>
                </div>
                <motion.p 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {userPoints?.available_points || 0}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-1">≈ {((userPoints?.available_points || 0) * 0.01).toFixed(2)} ر.س</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tier */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
            whileHover={{ 
              scale: 1.03, 
              y: -5,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm cursor-pointer group h-full overflow-hidden relative">
              <motion.div 
                className="absolute inset-0 bg-purple-500/5"
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div 
                    className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Award className="w-5 h-5 text-purple-500" />
                  </motion.div>
                  <span className="text-sm text-muted-foreground">المستوى</span>
                </div>
                <motion.p 
                  className="text-lg font-bold"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {(userPoints?.reward_tiers as any)?.name_ar || "مبتدئ"}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Badge variant="secondary" className="mt-1 text-xs">{((userPoints?.reward_tiers as any)?.benefits?.discount || 2)}% خصم</Badge>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Services Count */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
            whileHover={{ 
              scale: 1.03, 
              y: -5,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm cursor-pointer group h-full overflow-hidden relative">
              <motion.div 
                className="absolute inset-0 bg-emerald-500/5"
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div 
                    className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Package className="w-5 h-5 text-emerald-500" />
                  </motion.div>
                  <span className="text-sm text-muted-foreground">الخدمات</span>
                </div>
                <motion.p 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  {services.length}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-1">خدمة متاحة</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Networks with Enhanced Animations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardTitle className="text-base flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Layers className="w-5 h-5 text-primary" />
                  </motion.div>
                  اختر المنصة
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-15 gap-2">
                {socialNetworks.map((network, index) => {
                  const Icon = network.icon;
                  const isSelected = selectedNetwork === network.id;
                  return (
                    <motion.button
                      key={network.id}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.5 + index * 0.03,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{ 
                        scale: 1.1, 
                        y: -8,
                        transition: { type: "spring", stiffness: 400, damping: 10 }
                      }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setSelectedNetwork(network.id); setSelectedCategory(null); setSelectedService(null); }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200 relative group",
                        isSelected ? "bg-primary/10 ring-2 ring-primary shadow-lg" : "bg-muted/40 hover:bg-muted/60"
                      )}
                    >
                      {/* Glow effect on hover */}
                      <motion.div
                        className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 blur-xl -z-10", network.color)}
                        whileHover={{ opacity: 0.3 }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      {/* Ripple effect on selected */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-primary/20"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                      )}
                      
                      {/* Icon container with animations */}
                      <motion.div 
                        className={cn(
                          "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white relative overflow-hidden",
                          network.color
                        )}
                        whileHover={{ 
                          rotate: [0, -5, 5, 0],
                          transition: { duration: 0.4 }
                        }}
                      >
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.5 }}
                        />
                        <Icon className="w-5 h-5 relative z-10" />
                      </motion.div>
                      
                      {/* Label with slide-up effect */}
                      <motion.span 
                        className="text-[10px] font-medium truncate w-full text-center"
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1 }}
                      >
                        {network.name}
                      </motion.span>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          className="absolute -bottom-1 left-1/2 w-2 h-2 rounded-full bg-primary"
                          initial={{ scale: 0, x: "-50%" }}
                          animate={{ scale: 1, x: "-50%" }}
                          transition={{ type: "spring", stiffness: 500 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="new-order" className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-12 bg-muted/30 rounded-xl p-1">
                <TabsTrigger value="new-order" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <ShoppingCart className="w-4 h-4" />
                  مواقع التواصل الاجتماعي
                </TabsTrigger>
                <TabsTrigger value="quick-reorder" className="gap-2 rounded-lg">
                  <Repeat className="w-4 h-4" />
                  إعادة طلب
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="gap-2 rounded-lg">
                  <Zap className="w-4 h-4" />
                  الاشتراكات
                </TabsTrigger>
                <TabsTrigger value="favorites" className="gap-2 rounded-lg">
                  <Heart className="w-4 h-4" />
                  المفضلة
                </TabsTrigger>
              </TabsList>

              {/* View Mode & Advanced Filters Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setViewMode("cards")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    كروت
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setViewMode("table")}
                  >
                    <Table2 className="w-4 h-4" />
                    جدول
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Compare button */}
                  {compareServices.length > 0 && (
                    <Sheet open={showCompareSheet} onOpenChange={setShowCompareSheet}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <GitCompare className="w-4 h-4" />
                          مقارنة ({compareServices.length})
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[80vh]">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <GitCompare className="w-5 h-5 text-primary" />
                            مقارنة الخدمات
                          </SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right min-w-[150px]">الخاصية</TableHead>
                                {compareServices.map(service => (
                                  <TableHead key={service.id} className="text-center min-w-[200px]">
                                    <div className="flex flex-col items-center gap-2">
                                      <span className="line-clamp-2">{service.name}</span>
                                      <Button variant="ghost" size="sm" className="h-6 text-destructive" onClick={() => toggleCompare(service)}>
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">السعر لكل 1000</TableCell>
                                {compareServices.map(s => (
                                  <TableCell key={s.id} className="text-center font-bold text-primary">{s.price.toFixed(4)} ر.س</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">الحد الأدنى</TableCell>
                                {compareServices.map(s => (
                                  <TableCell key={s.id} className="text-center">{s.features?.min || 10}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">الحد الأقصى</TableCell>
                                {compareServices.map(s => (
                                  <TableCell key={s.id} className="text-center">{s.features?.max || "∞"}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">الضمان</TableCell>
                                {compareServices.map(s => (
                                  <TableCell key={s.id} className="text-center">
                                    {s.refill_enabled ? (
                                      <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="w-3 h-3 ml-1" />مضمون</Badge>
                                    ) : (
                                      <Badge variant="secondary"><XCircle className="w-3 h-3 ml-1" />غير مضمون</Badge>
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">القسم</TableCell>
                                {compareServices.map(s => (
                                  <TableCell key={s.id} className="text-center text-muted-foreground text-sm">{s.category}</TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">الوصف</TableCell>
                                {compareServices.map(s => (
                                  <TableCell key={s.id} className="text-center text-muted-foreground text-sm">
                                    {s.description ? (
                                      <span className="line-clamp-3">{s.description}</span>
                                    ) : (
                                      <span className="text-muted-foreground/50">لا يوجد وصف</span>
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">طلب</TableCell>
                                {compareServices.map(s => (
                                  <TableCell key={s.id} className="text-center">
                                    <Button size="sm" className="gap-2" onClick={() => { setSelectedCategory(s.category); setSelectedService(s); setShowCompareSheet(false); }}>
                                      <ShoppingCart className="w-4 h-4" />
                                      اطلب الآن
                                    </Button>
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}
                  
                  {/* Advanced filters button */}
                  <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        فلترة متقدمة
                        {(filterGuaranteed !== null || priceRange[0] > 0 || priceRange[1] < maxServicePrice) && (
                          <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">!</Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center gap-2">
                            <Filter className="w-4 h-4 text-primary" />
                            الفلاتر المتقدمة
                          </h4>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={resetFilters}>
                            <RotateCcw className="w-3 h-3" />
                            إعادة تعيين
                          </Button>
                        </div>
                        
                        {/* Price Range */}
                        <div className="space-y-2">
                          <Label className="text-sm">نطاق السعر</Label>
                          <div className="pt-2">
                            <Slider
                              value={priceRange}
                              onValueChange={(value) => setPriceRange(value as [number, number])}
                              max={maxServicePrice}
                              min={0}
                              step={0.1}
                              className="w-full"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{priceRange[0].toFixed(2)} ر.س</span>
                            <span>{priceRange[1].toFixed(2)} ر.س</span>
                          </div>
                        </div>
                        
                        {/* Guarantee filter */}
                        <div className="space-y-2">
                          <Label className="text-sm">الضمان</Label>
                          <div className="flex gap-2">
                            <Button
                              variant={filterGuaranteed === null ? "default" : "outline"}
                              size="sm"
                              onClick={() => setFilterGuaranteed(null)}
                            >
                              الكل
                            </Button>
                            <Button
                              variant={filterGuaranteed === true ? "default" : "outline"}
                              size="sm"
                              className="gap-1"
                              onClick={() => setFilterGuaranteed(true)}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              مضمون
                            </Button>
                            <Button
                              variant={filterGuaranteed === false ? "default" : "outline"}
                              size="sm"
                              className="gap-1"
                              onClick={() => setFilterGuaranteed(false)}
                            >
                              <XCircle className="w-3 h-3" />
                              غير مضمون
                            </Button>
                          </div>
                        </div>
                        
                        {/* Sort */}
                        <div className="space-y-2">
                          <Label className="text-sm">الترتيب حسب</Label>
                          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">الاسم</SelectItem>
                              <SelectItem value="price">السعر</SelectItem>
                              <SelectItem value="refill">الضمان</SelectItem>
                              <SelectItem value="min">الحد الأدنى</SelectItem>
                              <SelectItem value="max">الحد الأقصى</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button
                              variant={sortDirection === "asc" ? "default" : "outline"}
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => setSortDirection("asc")}
                            >
                              <ArrowUp className="w-3 h-3" />
                              تصاعدي
                            </Button>
                            <Button
                              variant={sortDirection === "desc" ? "default" : "outline"}
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => setSortDirection("desc")}
                            >
                              <ArrowDown className="w-3 h-3" />
                              تنازلي
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <TabsContent value="new-order" className="mt-4">
                <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6 space-y-5">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center sm:justify-between gap-1 sm:gap-0 mb-4 overflow-x-auto py-2">
                      {[
                        { step: 1, label: "القسم", done: !!selectedCategory },
                        { step: 2, label: "الخدمة", done: !!selectedService },
                        { step: 3, label: "الرابط", done: !!link },
                        { step: 4, label: "الكمية", done: !!quantity },
                      ].map((item, index) => (
                        <div key={item.step} className="flex items-center shrink-0">
                          <div className={cn(
                            "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all",
                            item.done 
                              ? "bg-primary text-primary-foreground shadow-md" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {item.done ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : item.step}
                          </div>
                          <span className={cn(
                            "text-[10px] sm:text-xs mr-1 sm:mr-1.5 hidden xs:block transition-colors whitespace-nowrap",
                            item.done ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {item.label}
                          </span>
                          {index < 3 && (
                            <div className={cn(
                              "w-4 sm:w-8 md:w-10 h-0.5 mx-0.5 sm:mx-2 transition-colors shrink-0",
                              item.done ? "bg-primary" : "bg-muted"
                            )} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        القسم
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select value={selectedCategory || ""} onValueChange={(v) => { setSelectedCategory(v || null); setSelectedService(null); setQuantity(""); setSearchQuery(""); }} dir="rtl">
                        <SelectTrigger className={cn(
                          "h-12 bg-muted/30 border-border/40 rounded-xl transition-all w-full",
                          !selectedCategory && "border-muted-foreground/20"
                        )}>
                          <SelectValue placeholder="اختر القسم...">
                            {selectedCategory && (
                              <div className="flex items-center justify-between gap-2 w-full min-w-0">
                                <span className="truncate">{selectedCategory}</span>
                                <Badge variant="secondary" className="text-[10px] shrink-0">{categoryCounts[selectedCategory]} خدمة</Badge>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent 
                          className="max-h-[60vh] sm:max-h-[300px] w-[calc(100vw-2rem)] sm:w-[var(--radix-select-trigger-width)] bg-popover border-border shadow-xl z-[100]"
                          position="popper"
                          sideOffset={5}
                          align="start"
                        >
                          <ScrollArea className="max-h-[calc(60vh-10px)] sm:max-h-[290px]">
                            <div className="p-1">
                              {filteredByNetwork.map((category) => (
                                <SelectItem 
                                  key={category} 
                                  value={category}
                                  className="py-3 px-3 rounded-lg cursor-pointer focus:bg-accent/50 data-[highlighted]:bg-accent/50 mb-1"
                                >
                                  <div className="flex items-center justify-between gap-3 w-full min-w-0">
                                    <span className="truncate text-sm font-medium">{category}</span>
                                    <Badge variant="secondary" className="text-[10px] shrink-0">{categoryCounts[category]} خدمة</Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Service */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        الخدمة
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={selectedService?.id || ""} 
                        onValueChange={(v) => {
                          const service = filteredServices.find(s => s.id === v);
                          setSelectedService(service || null);
                          if (service?.features?.min) {
                            setQuantity(service.features.min.toString());
                          }
                        }} 
                        disabled={!selectedCategory} 
                        dir="rtl"
                      >
                        <SelectTrigger className={cn(
                          "h-12 bg-muted/30 border-border/40 rounded-xl transition-all w-full",
                          !selectedCategory && "opacity-50 cursor-not-allowed"
                        )}>
                          <SelectValue placeholder={selectedCategory ? "اختر الخدمة..." : "اختر القسم أولاً"}>
                            {selectedService && (
                              <div className="flex items-center gap-2 min-w-0 w-full">
                                <Badge variant="outline" className="text-[9px] font-mono shrink-0 hidden sm:inline-flex">
                                  #{selectedService.external_service_id}
                                </Badge>
                                <span className="truncate text-sm">{selectedService.name}</span>
                                <span className="text-primary font-bold text-xs shrink-0 mr-auto">{selectedService.price.toFixed(2)} ر.س</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent 
                          className="max-h-[60vh] sm:max-h-[350px] w-[calc(100vw-2rem)] sm:w-[var(--radix-select-trigger-width)] bg-popover border-border shadow-xl z-[100]"
                          position="popper"
                          sideOffset={5}
                          align="end"
                        >
                          <div className="p-2 sticky top-0 bg-popover z-20 border-b border-border" dir="rtl">
                            <div className="relative">
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                              <Input 
                                placeholder="بحث بالاسم أو الرقم أو الوصف..." 
                                className="pr-9 h-10 bg-muted/30 border-border/40 rounded-lg text-sm w-full text-right" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                onClick={(e) => e.stopPropagation()}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                dir="rtl"
                              />
                            </div>
                          </div>
                          <ScrollArea className="max-h-[calc(60vh-60px)] sm:max-h-[280px]">
                            {filteredServices.length === 0 ? (
                              <div className="p-6 text-center text-muted-foreground text-sm">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p>لا توجد خدمات مطابقة للبحث</p>
                              </div>
                            ) : (
                              <div className="p-1" dir="rtl">
                                {filteredServices.map((service) => (
                                  <SelectItem 
                                    key={service.id} 
                                    value={service.id} 
                                    className="py-3 px-3 rounded-lg cursor-pointer focus:bg-accent/50 data-[highlighted]:bg-accent/50 mb-1 text-right"
                                    dir="rtl"
                                  >
                                    <div className="flex flex-col gap-1.5 w-full min-w-0 text-right" dir="rtl">
                                      {/* Service ID and Name */}
                                      <div className="flex items-start gap-2 min-w-0 flex-row-reverse justify-end">
                                        <span className="text-sm font-medium leading-tight break-words flex-1 min-w-0 text-right">
                                          {service.name}
                                        </span>
                                        <Badge variant="outline" className="text-[9px] font-mono shrink-0 mt-0.5">
                                          #{service.external_service_id}
                                        </Badge>
                                      </div>
                                      {/* Price and Details Row */}
                                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs flex-row-reverse">
                                        <span className="text-primary font-bold">{service.price.toFixed(4)} ر.س</span>
                                        <span className="text-muted-foreground">
                                          الحد: {service.features?.min || 10} - {service.features?.max || "∞"}
                                        </span>
                                        {service.refill_enabled && (
                                          <Badge className="bg-success/10 text-success border-0 text-[10px] h-5 px-1.5">
                                            <Shield className="w-3 h-3 ml-0.5" />
                                            مضمون
                                          </Badge>
                                        )}
                                      </div>
                                      {/* Description */}
                                      {service.description && (
                                        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed text-right">
                                          {service.description}
                                        </p>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                          {filteredServices.length > 0 && (
                            <div className="p-2 border-t border-border bg-muted/30 text-center">
                              <span className="text-[10px] text-muted-foreground">
                                {filteredServices.length} خدمة متاحة
                              </span>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      
                      {/* Selected Service Info Card */}
                      {selectedService && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                              <div className="flex-1 min-w-0 order-2 sm:order-1">
                                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                    #{selectedService.external_service_id}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => toggleFavorite(selectedService.id)}
                                  >
                                    <Heart className={cn("w-4 h-4", favorites.includes(selectedService.id) && "fill-red-500 text-red-500")} />
                                  </Button>
                                </div>
                                <h4 className="font-semibold text-sm leading-tight break-words">{selectedService.name}</h4>
                                {selectedService.description && (
                                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3 sm:line-clamp-none">
                                    {selectedService.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right sm:text-left shrink-0 order-1 sm:order-2 flex items-center sm:flex-col gap-2 sm:gap-0 justify-between sm:justify-start border-b sm:border-0 pb-2 sm:pb-0 mb-0">
                                <span className="text-xs text-muted-foreground sm:hidden">السعر:</span>
                                <div>
                                  <p className="text-lg sm:text-xl font-bold text-primary">{selectedService.price.toFixed(4)} ر.س</p>
                                  <p className="text-[10px] text-muted-foreground text-left hidden sm:block">لكل 1000</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-background/60 text-[11px] sm:text-xs">
                                <Gauge className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 shrink-0" />
                                <span className="whitespace-nowrap">الأدنى: <strong>{selectedService.features?.min || 10}</strong></span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-background/60 text-[11px] sm:text-xs">
                                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500 shrink-0" />
                                <span className="whitespace-nowrap">الأقصى: <strong>{selectedService.features?.max || "∞"}</strong></span>
                              </div>
                              {selectedService.refill_enabled ? (
                                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-success/10 text-[11px] sm:text-xs text-success">
                                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">مضمون</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-muted text-[11px] sm:text-xs text-muted-foreground">
                                  <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">بدون ضمان</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Link */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-blue-500" />
                          الرابط
                          <span className="text-destructive">*</span>
                        </Label>
                        {recentLinks.length > 0 && (
                          <Popover open={showRecentLinks} onOpenChange={setShowRecentLinks}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary">
                                <History className="w-3.5 h-3.5" />
                                آخر الروابط ({recentLinks.length})
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 bg-popover" align="end">
                              <div className="p-3 border-b border-border">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <History className="w-4 h-4 text-primary" />
                                  آخر الروابط المستخدمة
                                </h4>
                              </div>
                              <ScrollArea className="max-h-[250px]">
                                <div className="p-2 space-y-1">
                                  {recentLinks.map((r) => (
                                    <div 
                                      key={r.id} 
                                      className="group flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" 
                                      onClick={() => useRecentLink(r)}
                                    >
                                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Link2 className="w-4 h-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-mono truncate" dir="ltr">{r.link}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <p className="text-[10px] text-muted-foreground">استخدم {r.use_count} مرة</p>
                                          {r.service_category && (
                                            <Badge variant="outline" className="text-[9px] h-4">{r.service_category}</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0" 
                                        onClick={(e) => { e.stopPropagation(); deleteRecentLink(r.id); }}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      <div className="relative">
                        <Input 
                          placeholder="https://instagram.com/username" 
                          className={cn(
                            "h-12 bg-muted/30 border-border/40 rounded-xl pr-4 pl-10 transition-all text-sm",
                            link && !link.startsWith("http") && "border-destructive/50 focus:border-destructive"
                          )}
                          value={link} 
                          onChange={(e) => setLink(e.target.value)} 
                          dir="ltr"
                          autoComplete="url"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                        />
                        {link ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-destructive" 
                            onClick={() => setLink("")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        )}
                      </div>
                      {link && !link.startsWith("http") && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          الرابط يجب أن يبدأ بـ http:// أو https://
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Hash className="w-4 h-4 text-purple-500" />
                        الكمية
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder={selectedService ? `${selectedService.features?.min || 10} - ${selectedService.features?.max || "∞"}` : "اختر الخدمة أولاً"} 
                          className={cn(
                            "h-12 bg-muted/30 border-border/40 rounded-xl transition-all text-base",
                            !selectedService && "opacity-50 cursor-not-allowed",
                            quantity && selectedService && (
                              parseInt(quantity) < (selectedService.features?.min || 10) ||
                              (selectedService.features?.max && parseInt(quantity) > selectedService.features.max)
                            ) && "border-destructive/50 focus:border-destructive"
                          )}
                          value={quantity} 
                          onChange={(e) => setQuantity(e.target.value)} 
                          min={selectedService?.features?.min || 10} 
                          max={selectedService?.features?.max || 1000000}
                          disabled={!selectedService}
                          autoComplete="off"
                        />
                        {selectedService && quantity && parseInt(quantity) > 0 && (
                          <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-muted-foreground bg-background/80 px-1 rounded">
                            ≈ {((selectedService.price / 1000) * parseInt(quantity || "0")).toFixed(2)} ر.س
                          </div>
                        )}
                      </div>
                      {selectedService && quantity && (
                        <>
                          {parseInt(quantity) < (selectedService.features?.min || 10) && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              الحد الأدنى للكمية هو {selectedService.features?.min || 10}
                            </p>
                          )}
                          {selectedService.features?.max && parseInt(quantity) > selectedService.features.max && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              الحد الأقصى للكمية هو {selectedService.features.max}
                            </p>
                          )}
                        </>
                      )}
                      {/* Quick quantity buttons */}
                      {selectedService && (
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {[
                            selectedService.features?.min || 100,
                            500,
                            1000,
                            5000,
                            10000
                          ].filter(q => !selectedService.features?.max || q <= selectedService.features.max)
                           .filter(q => q >= (selectedService.features?.min || 10))
                           .slice(0, 5)
                           .map((q) => (
                            <Button
                              key={q}
                              type="button"
                              variant={parseInt(quantity) === q ? "default" : "outline"}
                              size="sm"
                              className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
                              onClick={() => setQuantity(q.toString())}
                            >
                              {q.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Total Summary */}
                    <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">المبلغ الإجمالي</span>
                        <div className="text-left">
                          <p className="text-xl sm:text-2xl font-bold text-primary">{totalPrice.toFixed(4)} ر.س</p>
                        </div>
                      </div>
                      
                      {/* Balance check */}
                      {userBalance && totalPrice > 0 && (
                        <div className={cn(
                          "flex items-center gap-1.5 sm:gap-2 p-2 rounded-lg text-[11px] sm:text-xs",
                          userBalance.balance >= totalPrice 
                            ? "bg-success/10 text-success" 
                            : "bg-destructive/10 text-destructive"
                        )}>
                          {userBalance.balance >= totalPrice ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                              <span>رصيدك كافي ({userBalance.balance.toFixed(2)} ر.س)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                              <span className="break-words">رصيدك غير كافي - تحتاج {(totalPrice - userBalance.balance).toFixed(2)} ر.س إضافية</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <Button 
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl gap-2 sm:gap-3 transition-all" 
                      onClick={handleSubmit} 
                      disabled={
                        isSubmitting || 
                        !selectedService || 
                        !link || 
                        !link.startsWith("http") ||
                        !quantity ||
                        (selectedService && parseInt(quantity) < (selectedService.features?.min || 10)) ||
                        (selectedService?.features?.max && parseInt(quantity) > selectedService.features.max) ||
                        (userBalance && userBalance.balance < totalPrice)
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          <span className="text-sm sm:text-lg">جاري إرسال الطلب...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-sm sm:text-lg">إرسال الطلب - {totalPrice.toFixed(2)} ر.س</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quick Reorder Tab */}
              <TabsContent value="quick-reorder" className="mt-4">
                <Card className="border-border/40 bg-card/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Repeat className="w-5 h-5 text-primary" />
                      إعادة الطلب السريع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {recentOrders.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <History className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-muted-foreground">لا توجد طلبات سابقة</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentOrders.map((order, i) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Package className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{order.service?.name || "خدمة محذوفة"}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{order.order_number}</span>
                                <span>•</span>
                                <span>{order.quantity} وحدة</span>
                                <span>•</span>
                                <span>{order.total_price.toFixed(2)} ر.س</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 truncate" dir="ltr">{order.link}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <Badge variant={
                                order.status === "completed" ? "default" :
                                order.status === "cancelled" ? "destructive" :
                                "secondary"
                              } className="text-[10px]">
                                {order.status === "completed" ? "مكتمل" :
                                 order.status === "pending" ? "قيد الانتظار" :
                                 order.status === "in_progress" ? "قيد التنفيذ" :
                                 order.status === "cancelled" ? "ملغي" : order.status}
                              </Badge>
                              <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={() => handleQuickReorder(order)}
                                disabled={!order.service}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                إعادة الطلب
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscriptions" className="mt-4">
                <Card className="border-border/40 bg-card/80"><CardContent className="py-16 text-center"><div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4"><Zap className="w-8 h-8 text-muted-foreground/40" /></div><p className="text-muted-foreground">لا توجد اشتراكات حالياً</p></CardContent></Card>
              </TabsContent>

              <TabsContent value="favorites" className="mt-4">
                <Card className="border-border/40 bg-card/80">
                  <CardContent className="p-6">
                    {favorites.length === 0 ? (
                      <div className="py-12 text-center"><div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4"><Heart className="w-8 h-8 text-muted-foreground/40" /></div><p className="text-muted-foreground">لا توجد خدمات مفضلة</p></div>
                    ) : viewMode === "cards" ? (
                      <div className="space-y-2">
                        {services.filter(s => favorites.includes(s.id)).map((service, i) => (
                          <motion.div key={service.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedCategory(service.category); setSelectedService(service); }}>
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Star className="w-5 h-5 text-primary" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{service.name}</p>
                              {service.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground/70">{service.category}</p>
                            </div>
                            <p className="font-bold text-primary shrink-0">${service.price.toFixed(2)}</p>
                            <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={(e) => { e.stopPropagation(); toggleFavorite(service.id); }}><Heart className="w-4 h-4 fill-current" /></Button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border/40 hover:bg-transparent">
                              <TableHead className="text-right">الخدمة</TableHead>
                              <TableHead className="text-right">القسم</TableHead>
                              <TableHead className="text-center">السعر/1000</TableHead>
                              <TableHead className="text-center">الضمان</TableHead>
                              <TableHead className="text-center">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {services.filter(s => favorites.includes(s.id)).map((service, i) => (
                              <motion.tr
                                key={service.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="border-border/40 hover:bg-muted/30 cursor-pointer"
                                onClick={() => { setSelectedCategory(service.category); setSelectedService(service); }}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">#{service.external_service_id}</Badge>
                                    <span className="truncate max-w-[200px]">{service.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{service.category}</TableCell>
                                <TableCell className="text-center font-bold text-primary">${service.price.toFixed(4)}</TableCell>
                                <TableCell className="text-center">
                                  {service.refill_enabled ? (
                                    <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="w-3 h-3 ml-1" />مضمون</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground"><XCircle className="w-3 h-3 ml-1" />غير مضمون</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); toggleFavorite(service.id); }}><Heart className="w-4 h-4 fill-current" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedCategory(service.category); setSelectedService(service); }}><ShoppingCart className="w-4 h-4" /></Button>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Table View */}
              {selectedCategory && viewMode === "table" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Table2 className="w-5 h-5 text-primary" />
                          جدول الخدمات - {selectedCategory}
                        </CardTitle>
                        <Badge variant="secondary">{filteredServices.length} خدمة</Badge>
                      </div>
                      <div className="mt-3 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث في الخدمات..."
                          className="pr-9 h-10 bg-muted/30 border-0"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-[500px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-card z-10">
                            <TableRow className="border-border/40 hover:bg-transparent">
                              <TableHead className="text-center w-[50px]">
                                <Checkbox
                                  checked={filteredServices.length > 0 && compareServices.length === filteredServices.length}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setCompareServices(filteredServices.slice(0, 4));
                                    } else {
                                      setCompareServices([]);
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead className="text-right w-[80px]">رقم</TableHead>
                              <TableHead className="text-right">
                                <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => toggleSort("name")}>
                                  الخدمة {getSortIcon("name")}
                                </button>
                              </TableHead>
                              <TableHead className="text-center w-[100px]">
                                <button className="flex items-center gap-1 justify-center hover:text-primary transition-colors" onClick={() => toggleSort("price")}>
                                  السعر/1000 {getSortIcon("price")}
                                </button>
                              </TableHead>
                              <TableHead className="text-center w-[80px]">
                                <button className="flex items-center gap-1 justify-center hover:text-primary transition-colors" onClick={() => toggleSort("min")}>
                                  الحد الأدنى {getSortIcon("min")}
                                </button>
                              </TableHead>
                              <TableHead className="text-center w-[80px]">
                                <button className="flex items-center gap-1 justify-center hover:text-primary transition-colors" onClick={() => toggleSort("max")}>
                                  الحد الأقصى {getSortIcon("max")}
                                </button>
                              </TableHead>
                              <TableHead className="text-center w-[100px]">
                                <button className="flex items-center gap-1 justify-center hover:text-primary transition-colors" onClick={() => toggleSort("refill")}>
                                  الضمان {getSortIcon("refill")}
                                </button>
                              </TableHead>
                              <TableHead className="text-center w-[100px]">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredServices.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                  لا توجد خدمات مطابقة للبحث
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredServices.map((service, i) => {
                                const isInCompare = compareServices.some(s => s.id === service.id);
                                return (
                                <motion.tr
                                  key={service.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.02 }}
                                  className={cn(
                                    "border-border/40 hover:bg-muted/30 cursor-pointer transition-colors",
                                    selectedService?.id === service.id && "bg-primary/5 hover:bg-primary/10",
                                    isInCompare && "bg-amber-500/5"
                                  )}
                                  onClick={() => setSelectedService(service)}
                                >
                                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={isInCompare}
                                      onCheckedChange={() => toggleCompare(service)}
                                    />
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    #{service.external_service_id}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-medium text-sm line-clamp-1">{service.name}</span>
                                      {service.description && (
                                        <span className="text-xs text-muted-foreground line-clamp-2">{service.description}</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="font-bold text-primary">${service.price.toFixed(4)}</span>
                                  </TableCell>
                                  <TableCell className="text-center text-sm text-muted-foreground">
                                    {service.features?.min || 10}
                                  </TableCell>
                                  <TableCell className="text-center text-sm text-muted-foreground">
                                    {service.features?.max || "∞"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {service.refill_enabled ? (
                                      <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
                                        <CheckCircle2 className="w-3 h-3 ml-1" />مضمون
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">
                                        <XCircle className="w-3 h-3 ml-1" />لا
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(service.id); }}
                                      >
                                        <Heart className={cn("w-4 h-4", favorites.includes(service.id) && "fill-destructive text-destructive")} />
                                      </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="h-8 gap-1.5"
                                        onClick={(e) => { e.stopPropagation(); setSelectedService(service); }}
                                      >
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                        طلب
                                      </Button>
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              )})
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </Tabs>
          </div>

          {/* Service Details */}
          <div>
            <Card className="border-border/40 bg-card/80 sticky top-4">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4 text-primary" />تفاصيل الخدمة</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence mode="wait">
                  {selectedService ? (
                    <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="p-3 rounded-xl bg-muted/30"><p className="text-xs text-muted-foreground mb-1">اسم الخدمة</p><p className="font-medium text-sm">{selectedService.name}</p></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-muted/30 text-center"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2"><Clock className="w-4 h-4 text-primary" /></div><p className="text-[10px] text-muted-foreground">وقت البدء</p><p className="text-xs font-medium">فوري</p></div>
                        <div className="p-3 rounded-xl bg-muted/30 text-center"><div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2"><Gauge className="w-4 h-4 text-success" /></div><p className="text-[10px] text-muted-foreground">السرعة</p><p className="text-xs font-medium">سريع</p></div>
                        <div className="p-3 rounded-xl bg-muted/30 text-center"><div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2", selectedService.refill_enabled ? "bg-success/10" : "bg-destructive/10")}>{selectedService.refill_enabled ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />}</div><p className="text-[10px] text-muted-foreground">الضمان</p><p className="text-xs font-medium">{selectedService.refill_enabled ? "مضمون" : "غير مضمون"}</p></div>
                        <div className="p-3 rounded-xl bg-muted/30 text-center"><div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2"><Timer className="w-4 h-4 text-accent" /></div><p className="text-[10px] text-muted-foreground">الوقت المتوسط</p><p className="text-xs font-medium">{selectedService.features?.average_time || "1-24 ساعة"}</p></div>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20"><div className="flex items-center justify-between"><span className="text-sm">السعر لكل 1000</span><span className="text-xl font-bold text-primary">${selectedService.price.toFixed(4)}</span></div></div>
                      <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={() => toggleFavorite(selectedService.id)}><Heart className={cn("w-4 h-4", favorites.includes(selectedService.id) && "fill-destructive text-destructive")} />{favorites.includes(selectedService.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}</Button>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                      <motion.div animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4"><Package className="w-8 h-8 text-muted-foreground/40" /></motion.div>
                      <p className="text-sm text-muted-foreground">اختر خدمة لعرض التفاصيل</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Scroll Top */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }} className="fixed bottom-6 left-6 z-50">
              <Button size="icon" className="h-12 w-12 rounded-2xl shadow-lg" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ChevronUp className="w-5 h-5" /></Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesNew;
