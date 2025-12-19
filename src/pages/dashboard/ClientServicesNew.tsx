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
  Table2
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
  const serviceCategories = useMemo(() => [...new Set(services.map(s => s.category))].sort(), [services]);

  // Count services per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => { counts[service.category] = (counts[service.category] || 0) + 1; });
    return counts;
  }, [services]);

  // Filter services by network
  const filteredByNetwork = useMemo(() => {
    if (selectedNetwork === 'all') return serviceCategories;
    return serviceCategories.filter(cat => cat.toLowerCase().includes(selectedNetwork.toLowerCase()));
  }, [serviceCategories, selectedNetwork]);

  // Filter services
  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || (service.external_service_id?.includes(searchQuery));
      return matchesSearch && service.category === selectedCategory;
    }).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [services, searchQuery, selectedCategory]);

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

  const handleSubmit = async () => {
    if (!user) { toast.error("يجب تسجيل الدخول للطلب"); return; }
    if (!selectedService || !link || !quantity) { toast.error("يرجى ملء جميع الحقول المطلوبة"); return; }
    if (!userBalance || userBalance.balance < totalPrice) { toast.error("رصيدك غير كافي"); return; }

    setIsSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const { error: orderError } = await supabase.from("orders").insert({
        user_id: user.id, service_id: selectedService.id, order_number: orderNumber, quantity: parseInt(quantity), link, total_price: totalPrice, status: "pending",
      });
      if (orderError) throw orderError;
      await saveRecentLink(link);
      await supabase.from("user_balances").update({ balance: userBalance.balance - totalPrice, total_spent: userBalance.total_spent + totalPrice }).eq("user_id", user.id);
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
        {/* Hero Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Balance */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground">
            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z' fill='rgba(255,255,255,0.07)'%3E%3C/path%3E%3C/svg%3E\")" }} />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-sm opacity-80">الرصيد</span>
              </div>
              <p className="text-3xl font-black">${(userBalance?.balance || 0).toFixed(2)}</p>
            </CardContent>
          </Card>

          {/* Points */}
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-sm text-muted-foreground">النقاط</span>
              </div>
              <p className="text-2xl font-bold">{userPoints?.available_points || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">≈ ${((userPoints?.available_points || 0) * 0.01).toFixed(2)}</p>
            </CardContent>
          </Card>

          {/* Tier */}
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-sm text-muted-foreground">المستوى</span>
              </div>
              <p className="text-lg font-bold">{(userPoints?.reward_tiers as any)?.name_ar || "مبتدئ"}</p>
              <Badge variant="secondary" className="mt-1 text-xs">{((userPoints?.reward_tiers as any)?.benefits?.discount || 2)}% خصم</Badge>
            </CardContent>
          </Card>

          {/* Services Count */}
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-sm text-muted-foreground">الخدمات</span>
              </div>
              <p className="text-2xl font-bold">{services.length}</p>
              <p className="text-xs text-muted-foreground mt-1">خدمة متاحة</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Networks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                اختر المنصة
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-15 gap-2">
                {socialNetworks.map((network, index) => {
                  const Icon = network.icon;
                  const isSelected = selectedNetwork === network.id;
                  return (
                    <motion.button
                      key={network.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelectedNetwork(network.id); setSelectedCategory(null); setSelectedService(null); }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200",
                        isSelected ? "bg-primary/10 ring-2 ring-primary shadow-lg" : "bg-muted/40 hover:bg-muted/60"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", network.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium truncate w-full text-center">{network.name}</span>
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
              <TabsList className="w-full grid grid-cols-3 h-12 bg-muted/30 rounded-xl p-1">
                <TabsTrigger value="new-order" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <ShoppingCart className="w-4 h-4" />
                  طلب جديد
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

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 mt-4">
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

              <TabsContent value="new-order" className="mt-4">
                <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 space-y-5">
                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />القسم</Label>
                      <Select value={selectedCategory || ""} onValueChange={(v) => { setSelectedCategory(v || null); setSelectedService(null); }} dir="rtl">
                        <SelectTrigger className="h-12 bg-muted/30 border-border/40 rounded-xl"><SelectValue placeholder="اختر القسم..." /></SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {filteredByNetwork.map((category) => (
                            <SelectItem key={category} value={category}>
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span className="truncate">{category}</span>
                                <Badge variant="secondary" className="text-[10px] shrink-0">{categoryCounts[category]}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Service */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" />الخدمة</Label>
                      <Select value={selectedService?.id || ""} onValueChange={(v) => setSelectedService(filteredServices.find(s => s.id === v) || null)} disabled={!selectedCategory} dir="rtl">
                        <SelectTrigger className="h-12 bg-muted/30 border-border/40 rounded-xl"><SelectValue placeholder={selectedCategory ? "اختر الخدمة..." : "اختر القسم أولاً"} /></SelectTrigger>
                        <SelectContent className="max-h-[300px] bg-popover border-border">
                          <div className="p-2 sticky top-0 bg-popover z-10 border-b border-border">
                            <div className="relative">
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input placeholder="بحث..." className="pr-9 h-9 bg-muted/30 border-0" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                          </div>
                          {filteredServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center gap-2 w-full">
                                <Badge variant="outline" className="text-[9px] font-mono shrink-0">#{service.external_service_id}</Badge>
                                <span className="truncate flex-1 text-sm">{service.name}</span>
                                <span className="text-primary font-bold shrink-0 text-sm">${service.price.toFixed(2)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Link */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2"><Link2 className="w-4 h-4 text-blue-500" />الرابط</Label>
                        {recentLinks.length > 0 && (
                          <Popover open={showRecentLinks} onOpenChange={setShowRecentLinks}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground">
                                <History className="w-3.5 h-3.5" />آخر الروابط
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                              <div className="p-3 border-b"><h4 className="font-medium text-sm flex items-center gap-2"><History className="w-4 h-4 text-primary" />آخر الروابط</h4></div>
                              <ScrollArea className="max-h-[200px]">
                                <div className="p-2 space-y-1">
                                  {recentLinks.map((r) => (
                                    <div key={r.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => useRecentLink(r)}>
                                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Link2 className="w-4 h-4 text-primary" /></div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-mono truncate" dir="ltr">{r.link}</p>
                                        <p className="text-[10px] text-muted-foreground">استخدم {r.use_count} مرة</p>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); deleteRecentLink(r.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      <div className="relative">
                        <Input placeholder="https://..." className="h-12 bg-muted/30 border-border/40 rounded-xl" value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" />
                        {link && <Button variant="ghost" size="icon" className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => setLink("")}><X className="w-4 h-4" /></Button>}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2"><Hash className="w-4 h-4 text-purple-500" />الكمية</Label>
                      <Input type="number" placeholder="أدخل الكمية..." className="h-12 bg-muted/30 border-border/40 rounded-xl" value={quantity} onChange={(e) => setQuantity(e.target.value)} min={selectedService?.features?.min || 10} max={selectedService?.features?.max || 1000000} />
                      {selectedService?.features && <p className="text-xs text-muted-foreground">الحد الأدنى: {selectedService.features.min || 10} - الأقصى: {selectedService.features.max || 1000000}</p>}
                    </div>

                    {/* Total */}
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">المبلغ الإجمالي</span>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-primary">${totalPrice.toFixed(4)}</p>
                          <p className="text-xs text-muted-foreground">≈ {(totalPrice * 3.75).toFixed(2)} ر.س</p>
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <Button className="w-full h-14 text-lg font-bold rounded-xl gap-3" onClick={handleSubmit} disabled={isSubmitting || !selectedService || !link || !quantity}>
                      {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الإرسال...</> : <><ShoppingCart className="w-5 h-5" />إرسال الطلب</>}
                    </Button>
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
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Star className="w-5 h-5 text-primary" /></div>
                            <div className="flex-1 min-w-0"><p className="font-medium truncate">{service.name}</p><p className="text-xs text-muted-foreground">{service.category}</p></div>
                            <p className="font-bold text-primary">${service.price.toFixed(2)}</p>
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
                              <TableHead className="text-right w-[80px]">رقم</TableHead>
                              <TableHead className="text-right">الخدمة</TableHead>
                              <TableHead className="text-center w-[100px]">السعر/1000</TableHead>
                              <TableHead className="text-center w-[80px]">الحد الأدنى</TableHead>
                              <TableHead className="text-center w-[80px]">الحد الأقصى</TableHead>
                              <TableHead className="text-center w-[100px]">الضمان</TableHead>
                              <TableHead className="text-center w-[100px]">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredServices.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                  لا توجد خدمات مطابقة للبحث
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredServices.map((service, i) => (
                                <motion.tr
                                  key={service.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.02 }}
                                  className={cn(
                                    "border-border/40 hover:bg-muted/30 cursor-pointer transition-colors",
                                    selectedService?.id === service.id && "bg-primary/5 hover:bg-primary/10"
                                  )}
                                  onClick={() => setSelectedService(service)}
                                >
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    #{service.external_service_id}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm line-clamp-2">{service.name}</span>
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
                              ))
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
