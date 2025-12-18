import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  ArrowLeft,
  ShoppingCart,
  Plus,
  Crown,
  Flame,
  Check,
  Clock,
  X,
  Info,
  Eye,
  EyeOff,
  Link2,
  Hash,
  Wallet,
  Gift,
  Award,
  Timer,
  Gauge,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  History,
  Trash2,
  MessageCircle,
  Ghost,
  Gamepad2,
  Camera,
  Radio,
  ListOrdered,
  Star as StarIcon,
  Globe2,
  Tv,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

// Social network data with icons and colors
const socialNetworks = [
  { id: 'all', name: 'الكل', icon: MoreHorizontal, bg: 'bg-gradient-to-br from-muted to-muted/80', iconColor: 'text-foreground' },
  { id: 'facebook', name: 'فيسبوك', icon: Facebook, bg: 'bg-[#1877F2]', iconColor: 'text-white' },
  { id: 'instagram', name: 'انستقرام', icon: Instagram, bg: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]', iconColor: 'text-white' },
  { id: 'tiktok', name: 'تيك توك', icon: Music2, bg: 'bg-black dark:bg-zinc-900', iconColor: 'text-white' },
  { id: 'youtube', name: 'يوتيوب', icon: Youtube, bg: 'bg-[#FF0000]', iconColor: 'text-white' },
  { id: 'twitter', name: 'تويتر', icon: Twitter, bg: 'bg-black dark:bg-zinc-900', iconColor: 'text-white' },
  { id: 'telegram', name: 'تيليجرام', icon: Send, bg: 'bg-[#0088CC]', iconColor: 'text-white' },
  { id: 'discord', name: 'ديسكورد', icon: MessageCircle, bg: 'bg-[#5865F2]', iconColor: 'text-white' },
  { id: 'twitch', name: 'تويتش', icon: Tv, bg: 'bg-[#9146FF]', iconColor: 'text-white' },
  { id: 'spotify', name: 'سبوتيفاي', icon: Radio, bg: 'bg-[#1DB954]', iconColor: 'text-white' },
  { id: 'snapchat', name: 'سناب شات', icon: Ghost, bg: 'bg-[#FFFC00]', iconColor: 'text-black' },
  { id: 'google', name: 'جوجل', icon: Globe2, bg: 'bg-white dark:bg-zinc-100', iconColor: 'text-[#4285F4]', border: 'border border-border' },
  { id: 'reviews', name: 'تقييمات', icon: StarIcon, bg: 'bg-gradient-to-br from-amber-400 to-orange-500', iconColor: 'text-white' },
  { id: 'website', name: 'زيارات', icon: Globe, bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', iconColor: 'text-white' },
  { id: 'linkedin', name: 'لينكدان', icon: Linkedin, bg: 'bg-[#0A66C2]', iconColor: 'text-white' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

const ClientServicesNew = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showNetworks, setShowNetworks] = useState(true);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecentLinks, setShowRecentLinks] = useState(false);

  // Fetch user balance
  const { data: userBalance } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_balances")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user points
  const { data: userPoints } = useQuery({
    queryKey: ["user-points", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_points")
        .select("*, reward_tiers(*)")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-client"],
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
    queryKey: ["services-client"],
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

  // Fetch recent links
  const { data: recentLinks = [], refetch: refetchLinks } = useQuery({
    queryKey: ["recent-links", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_recent_links")
        .select("*")
        .eq("user_id", user.id)
        .order("last_used_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return data as RecentLink[];
    },
    enabled: !!user?.id,
  });

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

  // Get unique categories
  const serviceCategories = useMemo(() => {
    return [...new Set(services.map(s => s.category))].sort();
  }, [services]);

  // Count services per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      counts[service.category] = (counts[service.category] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Filter services by network
  const filteredByNetwork = useMemo(() => {
    if (selectedNetwork === 'all') return serviceCategories;
    return serviceCategories.filter(cat => 
      cat.toLowerCase().includes(selectedNetwork.toLowerCase())
    );
  }, [serviceCategories, selectedNetwork]);

  // Filter services
  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.external_service_id?.includes(searchQuery));
      return matchesSearch && service.category === selectedCategory;
    }).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [services, searchQuery, selectedCategory]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    return (selectedService.price / 1000) * qty;
  }, [selectedService, quantity]);

  // Save link to recent links
  const saveRecentLink = async (linkUrl: string) => {
    if (!user?.id || !linkUrl.trim()) return;
    
    try {
      const existingLink = recentLinks.find(l => l.link === linkUrl);
      
      if (existingLink) {
        await supabase
          .from("user_recent_links")
          .update({
            use_count: existingLink.use_count + 1,
            last_used_at: new Date().toISOString(),
            service_category: selectedCategory,
          })
          .eq("id", existingLink.id);
      } else {
        await supabase.from("user_recent_links").insert({
          user_id: user.id,
          link: linkUrl,
          service_category: selectedCategory,
          label: null,
        });
      }
      
      refetchLinks();
    } catch (error) {
      console.error("Error saving recent link:", error);
    }
  };

  // Delete recent link
  const deleteRecentLink = async (linkId: string) => {
    if (!user?.id) return;
    
    try {
      await supabase
        .from("user_recent_links")
        .delete()
        .eq("id", linkId);
      
      refetchLinks();
      toast.success("تم حذف الرابط");
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  // Use recent link
  const useRecentLink = (recentLink: RecentLink) => {
    setLink(recentLink.link);
    setShowRecentLinks(false);
    toast.success("تم تحديد الرابط");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول للطلب");
      return;
    }
    if (!selectedService || !link || !quantity) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (!userBalance || userBalance.balance < totalPrice) {
      toast.error("رصيدك غير كافي");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { error: orderError } = await supabase.from("orders").insert({
        user_id: user.id,
        service_id: selectedService.id,
        order_number: orderNumber,
        quantity: parseInt(quantity),
        link: link,
        total_price: totalPrice,
        status: "pending",
      });

      if (orderError) throw orderError;

      await saveRecentLink(link);

      await supabase
        .from("user_balances")
        .update({
          balance: userBalance.balance - totalPrice,
          total_spent: userBalance.total_spent + totalPrice,
        })
        .eq("user_id", user.id);

      toast.success("تم إرسال الطلب بنجاح!");
      setLink("");
      setQuantity("");
      setSelectedService(null);
      refetch();
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-xl"
          >
            <Sparkles className="w-8 h-8 text-black" />
          </motion.div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Points Card */}
          <motion.div variants={cardVariants}>
            <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">النقاط</p>
                    <p className="text-2xl font-bold">{userPoints?.available_points || 0}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ${((userPoints?.available_points || 0) * 0.01).toFixed(2)}/100
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ≈ ${((userPoints?.available_points || 0) * 0.0044).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Card */}
          <motion.div variants={cardVariants}>
            <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">حالة الحساب</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {((userPoints?.reward_tiers as any)?.benefits?.discount || 2)}% خصم
                    </Badge>
                    <p className="text-lg font-bold mt-1">
                      {(userPoints?.reward_tiers as any)?.name_ar || "مبتدئ"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Welcome Card */}
          <motion.div variants={cardVariants} className="lg:col-span-1">
            <Card className="h-full overflow-hidden border-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 text-black relative group">
              <CardContent className="p-5 relative z-10">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-lg font-bold mb-1">مرحباً بك! 👋</h2>
                  <p className="text-black/70 text-xs leading-relaxed">
                    نقدم حلولاً موثوقة وسريعة لجميع منصات التواصل الاجتماعي
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-3 bg-black/10 border-black/20 hover:bg-black/20 text-black gap-2 text-xs"
                    onClick={() => setShowNetworks(true)}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    استكشف الخدمات
                  </Button>
                </motion.div>
              </CardContent>
              <div className="absolute bottom-0 start-0 w-32 h-32 bg-black/5 rounded-full blur-xl" />
            </Card>
          </motion.div>

          {/* Balance Card */}
          <motion.div variants={cardVariants}>
            <Card className="h-full border-0 bg-gradient-to-br from-yellow-400 to-amber-500 text-black overflow-hidden relative">
              <CardContent className="p-5 text-center relative z-10">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center mx-auto mb-2">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium mb-1">الرصيد الحالي</p>
                  <p className="text-3xl font-black">
                    ${(userBalance?.balance || 0).toFixed(7)}
                  </p>
                </motion.div>
              </CardContent>
              <div className="absolute -bottom-10 -start-10 w-32 h-32 bg-black/5 rounded-full" />
            </Card>
          </motion.div>
        </motion.div>

        {/* Social Networks Selection */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  اختر شبكة اجتماعية
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs h-8 rounded-full"
                  onClick={() => setShowNetworks(!showNetworks)}
                >
                  {showNetworks ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showNetworks ? "إخفاء" : "إظهار"}
                </Button>
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {showNetworks && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <CardContent className="pt-0 pb-5">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                      {socialNetworks.map((network, index) => {
                        const Icon = network.icon;
                        const isSelected = selectedNetwork === network.id;
                        
                        return (
                          <motion.button
                            key={network.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedNetwork(network.id);
                              setSelectedCategory(null);
                              setSelectedService(null);
                            }}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300",
                              isSelected 
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" 
                                : "border-transparent bg-muted/30 hover:bg-muted/50 hover:border-border/50",
                              network.border
                            )}
                          >
                            <motion.div 
                              className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center transition-transform",
                                network.bg,
                                isSelected && "shadow-lg"
                              )}
                              whileHover={{ rotate: [0, -5, 5, 0] }}
                              transition={{ duration: 0.3 }}
                            >
                              <Icon className={cn("w-5 h-5", network.iconColor)} />
                            </motion.div>
                            <span className="text-[11px] font-medium truncate w-full text-center">
                              {network.name}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Action Tabs */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button 
              variant="outline" 
              className="w-full h-14 text-base gap-3 bg-card/60 hover:bg-muted/80 border-border/50 rounded-2xl"
            >
              <ListOrdered className="w-5 h-5" />
              طلب جماعي
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button 
              className="w-full h-14 text-base gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold rounded-2xl shadow-lg shadow-yellow-500/20"
            >
              <ShoppingCart className="w-5 h-5" />
              طلب جديد
            </Button>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="new-order" className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-12 bg-muted/30 rounded-2xl p-1">
                <TabsTrigger value="new-order" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                  <ShoppingCart className="w-4 h-4" />
                  طلب جديد
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="gap-2 rounded-xl transition-all">
                  <Zap className="w-4 h-4" />
                  الاشتراكات
                </TabsTrigger>
                <TabsTrigger value="favorites" className="gap-2 rounded-xl transition-all">
                  <Heart className="w-4 h-4" />
                  المفضلة
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new-order" className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-6 space-y-5">
                      {/* Category Selection */}
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary" />
                          القسم
                        </Label>
                        <Select 
                          value={selectedCategory || ""} 
                          onValueChange={(v) => {
                            setSelectedCategory(v || null);
                            setSelectedService(null);
                          }}
                        >
                          <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl hover:bg-muted/50 transition-colors">
                            <SelectValue placeholder="اختر القسم..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {filteredByNetwork.map((category) => (
                              <SelectItem key={category} value={category} className="rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span>{category}</span>
                                  <Badge variant="secondary" className="mr-auto text-[10px]">
                                    {categoryCounts[category]}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      {/* Service Selection */}
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Star className="w-4 h-4 text-primary" />
                          الخدمة
                        </Label>
                        <Select 
                          value={selectedService?.id || ""} 
                          onValueChange={(v) => {
                            const service = filteredServices.find(s => s.id === v);
                            setSelectedService(service || null);
                          }}
                          disabled={!selectedCategory}
                        >
                          <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl hover:bg-muted/50 transition-colors">
                            <SelectValue placeholder={selectedCategory ? "اختر الخدمة..." : "اختر القسم أولاً"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] rounded-xl">
                            <div className="p-2 sticky top-0 bg-popover">
                              <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  placeholder="بحث..."
                                  className="pr-9 h-9 rounded-lg"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                              </div>
                            </div>
                            {filteredServices.map((service) => (
                              <SelectItem key={service.id} value={service.id} className="rounded-lg">
                                <div className="flex items-center gap-2 w-full">
                                  {service.external_service_id && (
                                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                                      {service.external_service_id}
                                    </Badge>
                                  )}
                                  <span className="truncate flex-1">{service.name}</span>
                                  <span className="text-primary font-bold shrink-0">
                                    ${service.price.toFixed(4)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      {/* Link Input */}
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-primary" />
                            الرابط
                          </Label>
                          {recentLinks.length > 0 && (
                            <Popover open={showRecentLinks} onOpenChange={setShowRecentLinks}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-lg">
                                  <History className="w-3.5 h-3.5" />
                                  آخر الروابط ({recentLinks.length})
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0 rounded-xl" align="end">
                                <div className="p-3 border-b border-border">
                                  <h4 className="font-medium text-sm flex items-center gap-2">
                                    <History className="w-4 h-4 text-primary" />
                                    آخر الروابط المستخدمة
                                  </h4>
                                </div>
                                <ScrollArea className="max-h-[250px]">
                                  <div className="p-2 space-y-1">
                                    {recentLinks.map((recentLink) => (
                                      <motion.div
                                        key={recentLink.id}
                                        whileHover={{ x: 4 }}
                                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => useRecentLink(recentLink)}
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                          <Link2 className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-mono truncate" dir="ltr">
                                            {recentLink.link}
                                          </p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            {recentLink.service_category && (
                                              <Badge variant="secondary" className="text-[9px] h-4">
                                                {recentLink.service_category}
                                              </Badge>
                                            )}
                                            <span className="text-[10px] text-muted-foreground">
                                              استخدم {recentLink.use_count} مرة
                                            </span>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteRecentLink(recentLink.id);
                                          }}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </motion.div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <div className="relative">
                          <Input
                            placeholder="https://..."
                            className="h-12 bg-muted/30 border-border/50 ps-10 rounded-xl text-start"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            dir="ltr"
                          />
                          {link && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute start-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                              onClick={() => setLink("")}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>

                      {/* Quantity Input */}
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                      >
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Hash className="w-4 h-4 text-primary" />
                          الكمية
                        </Label>
                        <Input
                          type="number"
                          placeholder="أدخل الكمية..."
                          className="h-12 bg-muted/30 border-border/50 rounded-xl"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          min={selectedService?.features?.min || 10}
                          max={selectedService?.features?.max || 1000000}
                        />
                        {selectedService?.features && (
                          <p className="text-xs text-muted-foreground">
                            الحد الأدنى: {selectedService.features.min || 10} - الأقصى: {selectedService.features.max || 1000000}
                          </p>
                        )}
                      </motion.div>

                      {/* Total Price */}
                      <motion.div 
                        className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">المبلغ الإجمالي</span>
                          <div className="text-left">
                            <motion.p 
                              className="text-2xl font-black text-primary"
                              key={totalPrice}
                              initial={{ scale: 1.1 }}
                              animate={{ scale: 1 }}
                            >
                              ${totalPrice.toFixed(4)}
                            </motion.p>
                            <p className="text-xs text-muted-foreground">
                              ≈ {(totalPrice * 3.75).toFixed(2)} ر.س
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Submit Button */}
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Button
                          className="w-full h-14 text-lg gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold shadow-xl shadow-yellow-500/20 rounded-2xl"
                          onClick={handleSubmit}
                          disabled={isSubmitting || !selectedService || !link || !quantity}
                        >
                          {isSubmitting ? (
                            <>
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                              />
                              جاري الإرسال...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5" />
                              إرسال الطلب
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="subscriptions" className="mt-4">
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring" }}
                      >
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Zap className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-muted-foreground">لا توجد اشتراكات حالياً</p>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="favorites" className="mt-4">
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6">
                    {favorites.length === 0 ? (
                      <div className="text-center py-12">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring" }}
                        >
                          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-8 h-8 text-muted-foreground/40" />
                          </div>
                          <p className="text-muted-foreground">لا توجد خدمات مفضلة</p>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {services
                          .filter(s => favorites.includes(s.id))
                          .map((service, index) => (
                            <motion.div
                              key={service.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ x: 4 }}
                              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedCategory(service.category);
                                setSelectedService(service);
                              }}
                            >
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Star className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{service.name}</p>
                                <p className="text-xs text-muted-foreground">{service.category}</p>
                              </div>
                              <p className="font-bold text-primary">${service.price.toFixed(4)}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(service.id);
                                }}
                              >
                                <Heart className="w-4 h-4 fill-current" />
                              </Button>
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Service Details Sidebar */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm sticky top-4 rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  تفاصيل الخدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence mode="wait">
                  {selectedService ? (
                    <motion.div
                      key="service-details"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Service Name */}
                      <div className="p-3 rounded-xl bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">اسم الخدمة</p>
                        <p className="font-medium text-sm">{selectedService.name}</p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <motion.div 
                          className="p-3 rounded-xl bg-muted/30 text-center"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-[10px] text-muted-foreground">وقت البدء</p>
                          <p className="text-xs font-medium">فوري</p>
                        </motion.div>

                        <motion.div 
                          className="p-3 rounded-xl bg-muted/30 text-center"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
                            <Gauge className="w-4 h-4 text-success" />
                          </div>
                          <p className="text-[10px] text-muted-foreground">السرعة</p>
                          <p className="text-xs font-medium">سريع</p>
                        </motion.div>

                        <motion.div 
                          className="p-3 rounded-xl bg-muted/30 text-center"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2",
                            selectedService.refill_enabled ? "bg-success/10" : "bg-destructive/10"
                          )}>
                            {selectedService.refill_enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">الضمان</p>
                          <p className="text-xs font-medium">
                            {selectedService.refill_enabled ? "مضمون" : "غير مضمون"}
                          </p>
                        </motion.div>

                        <motion.div 
                          className="p-3 rounded-xl bg-muted/30 text-center"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
                            <Timer className="w-4 h-4 text-accent" />
                          </div>
                          <p className="text-[10px] text-muted-foreground">الوقت المتوسط</p>
                          <p className="text-xs font-medium">
                            {selectedService.features?.average_time || "1-24 ساعة"}
                          </p>
                        </motion.div>
                      </div>

                      {/* Price */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border border-yellow-500/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">السعر لكل 1000</span>
                          <motion.span 
                            className="text-xl font-black text-yellow-600 dark:text-yellow-400"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                          >
                            ${selectedService.price.toFixed(4)}
                          </motion.span>
                        </div>
                      </div>

                      {/* Favorite Button */}
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          className="w-full gap-2 rounded-xl"
                          onClick={() => toggleFavorite(selectedService.id)}
                        >
                          <Heart className={cn(
                            "w-4 h-4",
                            favorites.includes(selectedService.id) && "fill-destructive text-destructive"
                          )} />
                          {favorites.includes(selectedService.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="no-service"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        animate={{ 
                          y: [0, -5, 0],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "easeInOut"
                        }}
                        className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4"
                      >
                        <Package className="w-8 h-8 text-muted-foreground/40" />
                      </motion.div>
                      <p className="text-sm text-muted-foreground">اختر خدمة لعرض التفاصيل</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesNew;
