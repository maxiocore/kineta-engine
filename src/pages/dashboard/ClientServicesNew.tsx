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
  Trash2
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

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  Layers,
  MoreHorizontal,
};

// Color mapping for social networks
const socialColors: Record<string, { bg: string; icon: string; border: string }> = {
  instagram: { bg: "bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400", icon: "text-white", border: "border-pink-500/30" },
  facebook: { bg: "bg-[#1877F2]", icon: "text-white", border: "border-blue-500/30" },
  youtube: { bg: "bg-[#FF0000]", icon: "text-white", border: "border-red-500/30" },
  twitter: { bg: "bg-black", icon: "text-white", border: "border-gray-500/30" },
  tiktok: { bg: "bg-black", icon: "text-white", border: "border-gray-500/30" },
  telegram: { bg: "bg-[#0088CC]", icon: "text-white", border: "border-blue-400/30" },
  linkedin: { bg: "bg-[#0A66C2]", icon: "text-white", border: "border-blue-600/30" },
  spotify: { bg: "bg-[#1DB954]", icon: "text-white", border: "border-green-500/30" },
  snapchat: { bg: "bg-[#FFFC00]", icon: "text-black", border: "border-yellow-400/30" },
  discord: { bg: "bg-[#5865F2]", icon: "text-white", border: "border-indigo-500/30" },
  twitch: { bg: "bg-[#9146FF]", icon: "text-white", border: "border-purple-500/30" },
  google: { bg: "bg-white", icon: "text-gray-800", border: "border-gray-300" },
  default: { bg: "bg-primary", icon: "text-white", border: "border-primary/30" },
};

const ClientServicesNew = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
      // Check if link already exists
      const existingLink = recentLinks.find(l => l.link === linkUrl);
      
      if (existingLink) {
        // Update use count and last_used_at
        await supabase
          .from("user_recent_links")
          .update({
            use_count: existingLink.use_count + 1,
            last_used_at: new Date().toISOString(),
            service_category: selectedCategory,
          })
          .eq("id", existingLink.id);
      } else {
        // Insert new link
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

      // Save the link to recent links
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

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('instagram')) return Instagram;
    if (name.includes('facebook')) return Facebook;
    if (name.includes('youtube')) return Youtube;
    if (name.includes('twitter') || name.includes('x')) return Twitter;
    if (name.includes('linkedin')) return Linkedin;
    if (name.includes('tiktok') || name.includes('spotify') || name.includes('music')) return Music2;
    if (name.includes('telegram')) return Send;
    if (name.includes('snapchat')) return Sparkles;
    if (name.includes('discord')) return MoreHorizontal;
    if (name.includes('twitch')) return Layers;
    if (name.includes('google')) return Globe;
    return Globe;
  };

  const getCategoryColors = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('instagram')) return socialColors.instagram;
    if (name.includes('facebook')) return socialColors.facebook;
    if (name.includes('youtube')) return socialColors.youtube;
    if (name.includes('twitter') || name.includes('x')) return socialColors.twitter;
    if (name.includes('tiktok')) return socialColors.tiktok;
    if (name.includes('telegram')) return socialColors.telegram;
    if (name.includes('linkedin')) return socialColors.linkedin;
    if (name.includes('spotify')) return socialColors.spotify;
    if (name.includes('snapchat')) return socialColors.snapchat;
    if (name.includes('discord')) return socialColors.discord;
    if (name.includes('twitch')) return socialColors.twitch;
    if (name.includes('google')) return socialColors.google;
    return socialColors.default;
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 rounded-xl bg-primary animate-pulse flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Welcome Card */}
          <Card className="lg:col-span-2 overflow-hidden border-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 text-black">
            <CardContent className="p-6 relative">
              <div className="absolute bottom-0 left-0 w-48 h-48 opacity-20">
                <div className="w-full h-full bg-contain bg-no-repeat bg-bottom" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"%3E%3Ccircle cx=\"50\" cy=\"80\" r=\"30\" fill=\"%23000\" opacity=\"0.1\"/%3E%3C/svg%3E')"}} />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">مرحباً بك! 👋</h2>
                <p className="text-black/70 text-sm max-w-md leading-relaxed">
                  هناك العديد من خدمات التسويق عبر وسائل التواصل الاجتماعي المتاحة. نقدم حلولاً موثوقة وسريعة تناسب جميع المنصات.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 bg-white/20 border-black/20 hover:bg-white/30 text-black gap-2"
                  onClick={() => setShowNetworks(true)}
                >
                  <Heart className="w-4 h-4" />
                  استكشف الخدمات
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Balance Card */}
          <Card className="border-0 bg-gradient-to-br from-yellow-400 to-amber-500 text-black">
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium mb-2">الرصيد الحالي</p>
              <p className="text-3xl font-black">
                ${(userBalance?.balance || 0).toFixed(2)}
              </p>
              <div className="mt-3 text-xs text-black/60">
                ≈ {((userBalance?.balance || 0) * 3.75).toFixed(2)} ر.س
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">حالة الحساب</p>
                <p className="font-bold">{userPoints?.reward_tiers?.name_ar || "مبتدئ"}</p>
                {userPoints?.reward_tiers && (
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    {((userPoints.reward_tiers as any).benefits?.discount || 0)}% خصم
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">النقاط</p>
                <p className="font-bold">{userPoints?.available_points || 0}</p>
                <p className="text-[10px] text-muted-foreground">
                  ≈ ${((userPoints?.available_points || 0) / 100).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الخدمات</p>
                <p className="font-bold">{services.length}</p>
                <p className="text-[10px] text-muted-foreground">خدمة متاحة</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المفضلة</p>
                <p className="font-bold">{favorites.length}</p>
                <p className="text-[10px] text-muted-foreground">خدمة محفوظة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Selection */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                اختر شبكة اجتماعية
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => setShowNetworks(!showNetworks)}
              >
                {showNetworks ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {/* All Services Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedService(null);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                        !selectedCategory 
                          ? "border-primary bg-primary/10" 
                          : "border-border/50 bg-card hover:bg-muted/50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <MoreHorizontal className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium">الكل</span>
                    </motion.button>

                    {serviceCategories.map((category) => {
                      const IconComponent = getCategoryIcon(category);
                      const colors = getCategoryColors(category);
                      const isSelected = selectedCategory === category;
                      
                      return (
                        <motion.button
                          key={category}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCategory(isSelected ? null : category);
                            setSelectedService(null);
                            setSearchQuery("");
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            isSelected 
                              ? `${colors.border} bg-muted/50` 
                              : "border-border/50 bg-card hover:bg-muted/50"
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colors.bg)}>
                            <IconComponent className={cn("w-5 h-5", colors.icon)} />
                          </div>
                          <span className="text-xs font-medium truncate max-w-full">{category}</span>
                          {isSelected && (
                            <Badge variant="secondary" className="text-[9px] h-4">
                              {categoryCounts[category]} خدمة
                            </Badge>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="new-order" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-12 bg-muted/50">
                <TabsTrigger value="new-order" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ShoppingCart className="w-4 h-4" />
                  طلب جديد
                </TabsTrigger>
                <TabsTrigger value="favorites" className="gap-2">
                  <Heart className="w-4 h-4" />
                  قائمة المفضلة
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new-order" className="mt-4">
                <Card className="border-border/50">
                  <CardContent className="p-6 space-y-5">
                    {/* Category Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        القسم
                      </Label>
                      <Select 
                        value={selectedCategory || ""} 
                        onValueChange={(v) => {
                          setSelectedCategory(v || null);
                          setSelectedService(null);
                        }}
                      >
                        <SelectTrigger className="h-12 bg-muted/30">
                          <SelectValue placeholder="اختر القسم..." />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCategories.map((category) => {
                            const IconComponent = getCategoryIcon(category);
                            return (
                              <SelectItem key={category} value={category}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="w-4 h-4" />
                                  <span>{category}</span>
                                  <Badge variant="secondary" className="mr-auto text-[10px]">
                                    {categoryCounts[category]}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Service Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Star className="w-4 h-4 text-muted-foreground" />
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
                        <SelectTrigger className="h-12 bg-muted/30">
                          <SelectValue placeholder={selectedCategory ? "اختر الخدمة..." : "اختر القسم أولاً"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {/* Search */}
                          <div className="p-2 sticky top-0 bg-popover">
                            <div className="relative">
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="بحث..."
                                className="pr-9 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>
                          </div>
                          {filteredServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
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
                    </div>

                    {/* Link Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-muted-foreground" />
                          الرابط
                        </Label>
                        {recentLinks.length > 0 && (
                          <Popover open={showRecentLinks} onOpenChange={setShowRecentLinks}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary">
                                <History className="w-3.5 h-3.5" />
                                آخر الروابط ({recentLinks.length})
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                              <div className="p-3 border-b border-border">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <History className="w-4 h-4 text-primary" />
                                  آخر الروابط المستخدمة
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  اختر رابط من القائمة لاستخدامه
                                </p>
                              </div>
                              <ScrollArea className="max-h-[250px]">
                                <div className="p-2 space-y-1">
                                  {recentLinks.map((recentLink) => (
                                    <div
                                      key={recentLink.id}
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
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteRecentLink(recentLink.id);
                                        }}
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
                          placeholder="https://..."
                          className="h-12 bg-muted/30 pl-10"
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          dir="ltr"
                        />
                        {link && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setLink("")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        الكمية
                      </Label>
                      <Input
                        type="number"
                        placeholder="أدخل الكمية..."
                        className="h-12 bg-muted/30"
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
                    </div>

                    {/* Average Time */}
                    {selectedService && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Timer className="w-4 h-4 text-muted-foreground" />
                          وقت التنفيذ المتوقع
                        </Label>
                        <div className="h-12 px-4 rounded-lg bg-muted/30 flex items-center text-muted-foreground">
                          {selectedService.features?.average_time || "1-24 ساعة"}
                        </div>
                      </div>
                    )}

                    {/* Charge Display */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">المبلغ الإجمالي</span>
                        <div className="text-left">
                          <p className="text-2xl font-black text-primary">${totalPrice.toFixed(4)}</p>
                          <p className="text-xs text-muted-foreground">
                            ≈ {(totalPrice * 3.75).toFixed(2)} ر.س
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      className="w-full h-14 text-lg gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold shadow-xl"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !selectedService || !link || !quantity}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          إرسال الطلب
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="favorites" className="mt-4">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    {favorites.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">لا توجد خدمات مفضلة</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {services
                          .filter(s => favorites.includes(s.id))
                          .map(service => (
                            <div
                              key={service.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedCategory(service.category);
                                setSelectedService(service);
                              }}
                            >
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
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
                                className="shrink-0 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(service.id);
                                }}
                              >
                                <Heart className="w-4 h-4 fill-current" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Service Details Sidebar */}
          <div className="space-y-4">
            <Card className="border-border/50 sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  تفاصيل الخدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedService ? (
                  <>
                    {/* Service Name */}
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">اسم الخدمة</p>
                      <p className="font-medium text-sm">{selectedService.name}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">وقت البدء</p>
                        <p className="text-xs font-medium">فوري</p>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                          <Gauge className="w-4 h-4 text-success" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">السرعة</p>
                        <p className="text-xs font-medium">سريع</p>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2",
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
                      </div>

                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
                          <Timer className="w-4 h-4 text-accent" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">الوقت المتوسط</p>
                        <p className="text-xs font-medium">
                          {selectedService.features?.average_time || "1-24 ساعة"}
                        </p>
                      </div>
                    </div>

                    {/* Example Link */}
                    {selectedService.features?.example_link && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-2">رابط مثال</p>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={selectedService.features.example_link} 
                            readOnly 
                            className="text-xs h-8"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedService.features.example_link);
                              toast.success("تم نسخ الرابط");
                            }}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {selectedService.description && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                        <p className="text-xs leading-relaxed">{selectedService.description}</p>
                      </div>
                    )}

                    {/* Price */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border border-yellow-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">السعر لكل 1000</span>
                        <span className="text-xl font-black text-yellow-600 dark:text-yellow-400">
                          ${selectedService.price.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    {/* Favorite Button */}
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => toggleFavorite(selectedService.id)}
                    >
                      <Heart className={cn(
                        "w-4 h-4",
                        favorites.includes(selectedService.id) && "fill-destructive text-destructive"
                      )} />
                      {favorites.includes(selectedService.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">اختر خدمة لعرض التفاصيل</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesNew;
