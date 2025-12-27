import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { motion, AnimatePresence } from "framer-motion";
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
  Wallet,
  Star,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  Zap,
  CheckCircle2,
  ShoppingCart,
  Copy,
  TrendingUp,
  Package,
  Crown,
  Play,
  Users,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  Flame,
  Target,
  Gift,
  Shield,
  Clock,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  Layers,
  Filter,
  Grid3X3,
  List,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { id: 'all', name: 'جميع المنصات', keywords: [], icon: Sparkles, color: 'from-violet-500 to-purple-600', bgColor: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, color: 'from-pink-500 to-rose-500', bgColor: 'bg-gradient-to-br from-pink-500/20 to-rose-500/20' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, color: 'from-blue-500 to-blue-600', bgColor: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, color: 'from-red-500 to-red-600', bgColor: 'bg-gradient-to-br from-red-500/20 to-red-600/20' },
  { id: 'twitter', name: 'تويتر / X', keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: Twitter, color: 'from-sky-400 to-blue-500', bgColor: 'bg-gradient-to-br from-sky-400/20 to-blue-500/20' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], icon: Music2, color: 'from-gray-800 to-black', bgColor: 'bg-gradient-to-br from-gray-800/20 to-black/20' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], icon: Radio, color: 'from-green-500 to-emerald-600', bgColor: 'bg-gradient-to-br from-green-500/20 to-emerald-600/20' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, color: 'from-sky-400 to-cyan-500', bgColor: 'bg-gradient-to-br from-sky-400/20 to-cyan-500/20' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, color: 'from-yellow-400 to-amber-500', bgColor: 'bg-gradient-to-br from-yellow-400/20 to-amber-500/20' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان', 'لينكد ان', 'لينكدإن'], icon: Linkedin, color: 'from-blue-600 to-blue-700', bgColor: 'bg-gradient-to-br from-blue-600/20 to-blue-700/20' },
  { id: 'website', name: 'زيارات المواقع', keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع', 'ويب'], icon: Globe, color: 'from-emerald-500 to-teal-600', bgColor: 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
  }
} as const;

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
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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

  // إحصاء خدمات كل منصة
  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    socialNetworks.forEach(network => {
      counts[network.id] = getServicesByNetwork(network.id).length;
    });
    return counts;
  }, [getServicesByNetwork]);

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
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      const catId = service.category_id || 'other';
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(service);
    });
    return groups;
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

  // نسخ رقم الخدمة
  const copyServiceId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("تم نسخ رقم الخدمة");
  };

  // حالة التحميل
  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="min-h-screen bg-background p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
            <Skeleton className="h-14 rounded-2xl" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-20 w-28 rounded-2xl shrink-0" />)}
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  const currentNetwork = socialNetworks.find(n => n.id === selectedNetwork);

  return (
    <ClientDashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative px-4 md:px-6 pt-6 pb-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
              >
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                    خدمات التواصل الاجتماعي
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">
                    اختر من بين <span className="text-primary font-semibold">{socialMediaServices.length}+</span> خدمة لتعزيز تواجدك الرقمي
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-3">
                <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard/orders')}
                      className="gap-2 rounded-xl border-border/60 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <Package className="w-4 h-4" />
                      <span className="hidden sm:inline">طلباتي</span>
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard/favorites')}
                      className="gap-2 rounded-xl border-border/60 hover:border-amber-500/50 hover:bg-amber-500/5"
                    >
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="hidden sm:inline">المفضلة</span>
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
              >
                {/* Balance Card */}
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/dashboard/deposit')}
                  className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/90 p-4 md:p-5 text-primary-foreground shadow-lg shadow-primary/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                  
                  <div className="relative flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <span className="text-xs md:text-sm font-medium opacity-90">رصيدك</span>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold tracking-tight">
                        {(userBalance?.balance || 0).toFixed(2)}
                      </p>
                      <p className="text-xs opacity-75 mt-1">ريال سعودي</p>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <ArrowUpRight className="w-5 h-5 opacity-75" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Orders Card */}
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-card border border-border/50 p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl" />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-blue-500/10">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">طلباتي</span>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-foreground">
                        {userStats?.totalOrders || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">طلب مكتمل</p>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 border-0">
                      <Zap className="w-3 h-3 ml-1" />
                      نشط
                    </Badge>
                  </div>
                </motion.div>

                {/* Favorites Card */}
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-card border border-border/50 p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl" />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-amber-500/10">
                          <Star className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">المفضلة</span>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-foreground">
                        {favorites.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">خدمة محفوظة</p>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Services Card */}
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-card border border-border/50 p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl" />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                          <Layers className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">الخدمات</span>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-foreground">
                        {filteredServices.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">خدمة متاحة</p>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 border-0">
                      <CheckCircle2 className="w-3 h-3 ml-1" />
                      متاح
                    </Badge>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 md:px-6 pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-2 shadow-sm focus-within:border-primary/50 focus-within:shadow-md transition-all">
                  <div className="pr-3 border-l border-border/50">
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    placeholder="ابحث عن خدمة بالاسم أو رقم الخدمة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground/70"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchQuery("")}
                      className="h-8 w-8 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <div className="hidden md:flex items-center gap-2 pl-3 border-r border-border/50">
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 rounded-lg"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 rounded-lg"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Platform Tabs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-4">
                  {socialNetworks.map((network, index) => {
                    const Icon = network.icon;
                    const isSelected = selectedNetwork === network.id;
                    const count = networkCounts[network.id] || 0;
                    
                    return (
                      <motion.button
                        key={network.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + index * 0.03 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedNetwork(network.id);
                          setSelectedCategory("");
                        }}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl min-w-[90px] md:min-w-[110px] transition-all shrink-0",
                          isSelected
                            ? `bg-gradient-to-br ${network.color} text-white shadow-lg`
                            : "bg-card border border-border/50 hover:border-border hover:shadow-md"
                        )}
                      >
                        <div className={cn(
                          "p-2 md:p-2.5 rounded-xl transition-colors",
                          isSelected ? "bg-white/20" : network.bgColor
                        )}>
                          <Icon className={cn(
                            "w-5 h-5 md:w-6 md:h-6",
                            !isSelected && "text-foreground"
                          )} />
                        </div>
                        <span className={cn(
                          "text-xs font-medium text-center whitespace-nowrap",
                          !isSelected && "text-foreground"
                        )}>
                          {network.name}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            isSelected 
                              ? "bg-white/20 text-white border-0" 
                              : "bg-muted text-muted-foreground border-0"
                          )}
                        >
                          {count}
                        </Badge>
                      </motion.button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </motion.div>

            {/* Category Filters */}
            {categoriesWithServices.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    <Button
                      variant={selectedCategory === "" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("")}
                      className="rounded-xl shrink-0"
                    >
                      <Sparkles className="w-4 h-4 ml-1.5" />
                      الكل
                    </Button>
                    {categoriesWithServices.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.id)}
                        className="rounded-xl shrink-0"
                      >
                        {cat.name_ar || cat.name}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
              </motion.div>
            )}

            {/* Services List */}
            <AnimatePresence mode="wait">
              {filteredServices.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد خدمات</h3>
                  <p className="text-muted-foreground max-w-sm">
                    جرب البحث بكلمات مختلفة أو تصفية الفئات
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-xl"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("");
                      setSelectedNetwork("all");
                    }}
                  >
                    إعادة ضبط الفلاتر
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="services"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {Object.entries(groupedServices).map(([catId, catServices]) => (
                    <motion.div key={catId} variants={itemVariants} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          {getCategoryName(catId)}
                          <Badge variant="secondary" className="text-xs">
                            {catServices.length}
                          </Badge>
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                      </div>

                      <div className={cn(
                        viewMode === 'grid' 
                          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                          : "space-y-3"
                      )}>
                        {catServices.map((service, index) => {
                          const features = parseFeatures(service.features);
                          const isFav = favorites.includes(service.id);
                          const pricePerK = convertToSAR(service.price);
                          
                          return (
                            <motion.div
                              key={service.id}
                              variants={itemVariants}
                              whileHover={{ scale: 1.01, y: -2 }}
                              className={cn(
                                "group relative bg-card border border-border/50 rounded-2xl overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                                viewMode === 'grid' ? "p-4" : "p-4"
                              )}
                            >
                              {/* Hover Gradient */}
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              
                              <div className={cn(
                                "relative",
                                viewMode === 'list' && "flex items-center gap-4"
                              )}>
                                {/* Service Info */}
                                <div className={cn("flex-1 min-w-0", viewMode === 'grid' && "mb-4")}>
                                  <div className="flex items-start gap-3 mb-2">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold text-foreground text-sm md:text-base line-clamp-2">
                                          {service.name}
                                        </h4>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {service.external_service_id && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              copyServiceId(service.external_service_id!);
                                            }}
                                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                          >
                                            <Copy className="w-3 h-3" />
                                            #{service.external_service_id}
                                          </button>
                                        )}
                                        {(service.refill_enabled || features.refill) && (
                                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-0">
                                            <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
                                            تعويض
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Features */}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Target className="w-3 h-3" />
                                      {features.min.toLocaleString()} - {features.max.toLocaleString()}
                                    </span>
                                    {service.refill_days && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {service.refill_days} يوم
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Price & Actions */}
                                <div className={cn(
                                  "flex items-center gap-3",
                                  viewMode === 'grid' ? "justify-between" : "shrink-0"
                                )}>
                                  <div className="text-left">
                                    <p className="text-lg md:text-xl font-bold text-primary">
                                      {pricePerK.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">ر.س / 1000</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(service.id);
                                      }}
                                      className={cn(
                                        "p-2 rounded-xl transition-colors",
                                        isFav 
                                          ? "bg-rose-500/10 text-rose-500" 
                                          : "bg-muted/50 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                                      )}
                                    >
                                      <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
                                    </motion.button>
                                    
                                    <Button
                                      size="sm"
                                      onClick={() => handleSelectService(service)}
                                      className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md shadow-primary/25"
                                    >
                                      <ShoppingCart className="w-4 h-4" />
                                      <span className="hidden sm:inline">اطلب</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-lg mx-4 rounded-3xl border-border/50 p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  طلب جديد
                </DialogTitle>
              </DialogHeader>
              
              {selectedService && (
                <div className="mt-4 p-4 bg-card rounded-2xl border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                    {selectedService.name}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {selectedService.external_service_id && (
                      <span>#{selectedService.external_service_id}</span>
                    )}
                    {(selectedService.refill_enabled || parseFeatures(selectedService.features).refill) && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-0">
                        <RefreshCw className="w-3 h-3 ml-1" />
                        ضمان تعويض
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-5">
              {/* Link Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  رابط الحساب أو المنشور
                </Label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="rounded-xl border-border/50 focus:border-primary/50"
                  dir="ltr"
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  الكمية
                </Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="أدخل الكمية"
                  className="rounded-xl border-border/50 focus:border-primary/50"
                  dir="ltr"
                />
                {selectedService && (
                  <p className="text-xs text-muted-foreground">
                    الحد الأدنى: {parseFeatures(selectedService.features).min.toLocaleString()} | 
                    الحد الأقصى: {parseFeatures(selectedService.features).max.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Price Summary */}
              <div className="p-4 bg-muted/30 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">السعر لكل 1000:</span>
                  <span className="font-medium">
                    {selectedService ? convertToSAR(selectedService.price).toFixed(2) : 0} ر.س
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">الكمية:</span>
                  <span className="font-medium">{parseInt(quantity) || 0}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">الإجمالي:</span>
                  <span className="text-xl font-bold text-primary">{totalPrice.toFixed(2)} ر.س</span>
                </div>
                
                {userBalance && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">رصيدك:</span>
                    <span className={cn(
                      "font-medium",
                      userBalance.balance >= totalPrice ? "text-green-600" : "text-red-500"
                    )}>
                      {userBalance.balance.toFixed(2)} ر.س
                    </span>
                  </div>
                )}
                
                {userBalance && userBalance.balance < totalPrice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/deposit')}
                    className="w-full mt-2 rounded-xl gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                  >
                    <Wallet className="w-4 h-4" />
                    شحن الرصيد
                  </Button>
                )}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
                className="w-full h-12 rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 text-base font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    تأكيد الطلب
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
