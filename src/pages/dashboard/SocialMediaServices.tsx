import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Heart,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Send,
  Globe,
  Loader2,
  Ghost,
  Wallet,
  Star,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  Zap,
  CheckCircle2,
  ShoppingCart,
  TrendingUp,
  Clock,
  Timer,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Minus,
  ArrowLeft,
  X,
  Package,
  FileText,
  Grid3X3,
  LayoutList,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/adminNotifyService";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import ServicesPageSkeleton from "@/components/dashboard/ServicesPageSkeleton";

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

// Platform Icons
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

const socialNetworks = [
  { id: 'all', name: 'جميع المنصات', keywords: [], icon: Sparkles, gradient: 'from-primary to-primary/80', bgColor: 'bg-primary' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]', bgColor: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك'], customIcon: TikTokIcon, gradient: 'from-black to-gray-800', bgColor: 'bg-black' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب'], icon: Youtube, gradient: 'from-[#FF0000] to-[#CC0000]', bgColor: 'bg-[#FF0000]' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك'], icon: Facebook, gradient: 'from-[#1877F2] to-[#0D65D9]', bgColor: 'bg-[#1877F2]' },
  { id: 'twitter', name: 'تويتر / X', keywords: ['twitter', 'تويتر', 'x ', 'اكس'], icon: X, gradient: 'from-black to-gray-800', bgColor: 'bg-black' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي'], customIcon: SpotifyIcon, gradient: 'from-[#1DB954] to-[#19A349]', bgColor: 'bg-[#1DB954]' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب'], icon: Ghost, gradient: 'from-[#FFFC00] to-[#FFE100]', bgColor: 'bg-[#FFFC00]', textColor: 'text-black' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام'], icon: Send, gradient: 'from-[#0088CC] to-[#0077B5]', bgColor: 'bg-[#0088CC]' },
  { id: 'discord', name: 'ديسكورد', keywords: ['discord', 'ديسكورد'], customIcon: DiscordIcon, gradient: 'from-[#5865F2] to-[#4752C4]', bgColor: 'bg-[#5865F2]' },
  { id: 'twitch', name: 'تويتش', keywords: ['twitch', 'تويتش'], customIcon: TwitchIcon, gradient: 'from-[#9146FF] to-[#7C2FE6]', bgColor: 'bg-[#9146FF]' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان'], icon: Linkedin, gradient: 'from-[#0A66C2] to-[#0855A5]', bgColor: 'bg-[#0A66C2]' },
  { id: 'website', name: 'زيارات', keywords: ['website', 'زيار', 'visit', 'traffic'], icon: Globe, gradient: 'from-[#10B981] to-[#059669]', bgColor: 'bg-[#10B981]' },
  { id: 'reviews', name: 'تقييمات', keywords: ['review', 'تقييم', 'rating'], icon: Star, gradient: 'from-[#F59E0B] to-[#D97706]', bgColor: 'bg-[#F59E0B]' },
];

// Service Card for Browse Tab
const BrowseServiceCard = ({ 
  service, 
  onOrder, 
  isFavorite,
  onToggleFavorite,
  parseFeatures,
  convertToSAR,
}: { 
  service: Service; 
  onOrder: (service: Service) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  parseFeatures: (features: any) => { min: number; max: number; refill: boolean };
  convertToSAR: (price: number) => number;
}) => {
  const features = parseFeatures(service.features);
  const pricePerK = convertToSAR(service.price);

  const getPlatform = () => {
    const text = `${service.name} ${service.category}`.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id !== 'all' && network.keywords.some(k => text.includes(k))) {
        return network;
      }
    }
    return socialNetworks[1];
  };
  
  const platform = getPlatform();
  const Icon = platform.icon;
  const CustomIcon = (platform as any).customIcon;

  return (
    <Card className="border border-border/50 bg-card hover:border-primary/30 transition-all rounded-lg overflow-hidden group">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${platform.bgColor} flex items-center justify-center shrink-0`}>
            {CustomIcon ? <CustomIcon /> : Icon && <Icon className={cn("w-5 h-5", platform.textColor || "text-white")} />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{service.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {service.external_service_id && (
                <span className="text-muted-foreground">#{service.external_service_id}</span>
              )}
              <span>{features.min.toLocaleString()}-{features.max.toLocaleString()}</span>
              {(service.refill_enabled || features.refill) && (
                <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px] px-1.5 py-0">ضمان</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-left">
              <span className="text-sm font-bold text-primary">{pricePerK.toFixed(2)}</span>
              <span className="text-[10px] text-muted-foreground mr-0.5">ر.س</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(service.id); }}
              className={cn("h-8 w-8 rounded-md", isFavorite ? "text-rose-500" : "hover:text-rose-500")}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
            <Button
              size="sm"
              onClick={() => onOrder(service)}
              className={`bg-gradient-to-r ${platform.gradient} text-white rounded-md h-8 px-3 text-xs`}
            >
              اطلب
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SocialMediaServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const { convertToSAR } = useExchangeRate();
  
  const [activeTab, setActiveTab] = useState("new-order");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [browseSearchQuery, setBrowseSearchQuery] = useState("");
  const [balance, setBalance] = useState(0);
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");

  // Fetch balance
  const { data: userBalance, refetch: refetchBalance } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("user_balances").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (userBalance) setBalance(userBalance.balance);
  }, [userBalance]);

  // Fetch services
  const { data: services = [], isLoading, refetch } = useQuery({
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

  const handleRefresh = async () => {
    await refetch();
    toast.success("تم تحديث الخدمات");
  };

  // Filter social media services (exclude design/dev)
  const designDevKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 'برمجة', 'تطوير', 'dev', 'development', 'app'];
  
  const socialMediaServices = useMemo(() => {
    return services.filter(service => {
      const text = `${service.category} ${service.name}`.toLowerCase();
      return !designDevKeywords.some(k => text.includes(k));
    });
  }, [services]);

  // Get services by category/platform
  const getServicesByCategory = useCallback((categoryId: string) => {
    if (categoryId === 'all') return socialMediaServices;
    const network = socialNetworks.find(n => n.id === categoryId);
    if (!network || network.keywords.length === 0) return socialMediaServices;
    return socialMediaServices.filter(s => {
      const text = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => text.includes(k));
    });
  }, [socialMediaServices]);

  // Filtered services for selected category
  const categoryServices = useMemo(() => {
    let filtered = getServicesByCategory(selectedCategory);
    if (serviceSearchQuery) {
      const query = serviceSearchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }
    return filtered;
  }, [selectedCategory, serviceSearchQuery, getServicesByCategory]);

  // Filtered services for browse tab
  const browseServices = useMemo(() => {
    let filtered = socialMediaServices;
    if (browseSearchQuery) {
      const query = browseSearchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }
    return filtered;
  }, [browseSearchQuery, socialMediaServices]);

  // Parse features
  const parseFeatures = (features: any) => {
    const defaults = { min: 10, max: 100000, refill: false };
    if (!features) return defaults;
    try {
      const f = typeof features === 'string' ? JSON.parse(features) : features;
      return {
        min: parseInt(f.min || f.minQuantity) || defaults.min,
        max: parseInt(f.max || f.maxQuantity) || defaults.max,
        refill: f.refill === true || f.refill === 'true',
      };
    } catch {
      return defaults;
    }
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity) || 0;
    const priceInUSD = (selectedService.price / 1000) * qty;
    return convertToSAR(priceInUSD);
  }, [selectedService, quantity, convertToSAR]);

  // Get link placeholder based on service
  const getLinkPlaceholder = () => {
    if (!selectedService) return "https://...";
    const name = selectedService.name.toLowerCase();
    if (name.includes('instagram') || name.includes('انستقرام')) return "https://instagram.com/username أو رابط المنشور";
    if (name.includes('tiktok') || name.includes('تيك توك')) return "https://tiktok.com/@username أو رابط الفيديو";
    if (name.includes('youtube') || name.includes('يوتيوب')) return "https://youtube.com/watch?v=... أو رابط القناة";
    if (name.includes('twitter') || name.includes('تويتر')) return "https://twitter.com/username أو رابط التغريدة";
    if (name.includes('facebook') || name.includes('فيسبوك')) return "https://facebook.com/... رابط الصفحة أو المنشور";
    return "https://...";
  };

  // Handle service selection from dropdown
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    const features = parseFeatures(service.features);
    setQuantity(features.min.toString());
    setServiceSearchOpen(false);
    setServiceSearchQuery("");
  };

  // Quantity controls
  const incrementQuantity = () => {
    if (!selectedService) return;
    const features = parseFeatures(selectedService.features);
    const current = parseInt(quantity) || features.min;
    const step = Math.max(100, Math.floor(features.min));
    const newQty = Math.min(current + step, features.max);
    setQuantity(newQty.toString());
  };

  const decrementQuantity = () => {
    if (!selectedService) return;
    const features = parseFeatures(selectedService.features);
    const current = parseInt(quantity) || features.min;
    const step = Math.max(100, Math.floor(features.min));
    const newQty = Math.max(current - step, features.min);
    setQuantity(newQty.toString());
  };

  // Submit order
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
      refetchBalance();
      
    } catch { 
      toast.error("حدث خطأ أثناء إرسال الطلب"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // Get platform for service
  const getServicePlatform = (service: Service) => {
    const text = `${service.name} ${service.category}`.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id !== 'all' && network.keywords.some(k => text.includes(k))) {
        return network;
      }
    }
    return socialNetworks[1];
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesPageSkeleton title="خدمات السوشيال ميديا" color="blue" />
      </ClientDashboardLayout>
    );
  }

  const currentFeatures = selectedService ? parseFeatures(selectedService.features) : null;

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full w-full overflow-x-hidden overflow-y-auto">
        <div className="w-full min-w-0 max-w-full pb-8 px-2 sm:px-4" dir="rtl">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pt-2">
            <div className="flex items-center gap-3">
              <Link to="/dashboard/our-services">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">خدمات التواصل الاجتماعي</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">زد متابعيك وتفاعلك على جميع المنصات</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">{balance.toFixed(2)} ر.س</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-11 mb-4 bg-muted/50">
              <TabsTrigger value="new-order" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 text-sm">
                <ShoppingCart className="w-4 h-4" />
                طلب جديد
              </TabsTrigger>
              <TabsTrigger value="browse" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 text-sm">
                <Grid3X3 className="w-4 h-4" />
                تصفح الخدمات
              </TabsTrigger>
            </TabsList>

            {/* New Order Tab */}
            <TabsContent value="new-order" className="mt-0">
              <div className="grid lg:grid-cols-[1fr_340px] gap-4">
                {/* Order Form - Left Column (70%) */}
                <Card className="border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      نموذج الطلب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Category Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">المنصة / التصنيف</Label>
                      <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setSelectedService(null); }}>
                        <SelectTrigger className="h-11 rounded-lg bg-background">
                          <SelectValue placeholder="اختر المنصة" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {socialNetworks.map((network) => {
                            const Icon = network.icon;
                            const CustomIcon = (network as any).customIcon;
                            const count = getServicesByCategory(network.id).length;
                            return (
                              <SelectItem key={network.id} value={network.id}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-md ${network.bgColor} flex items-center justify-center`}>
                                    {CustomIcon ? (
                                      <div className={network.textColor || "text-white"}>
                                        <CustomIcon />
                                      </div>
                                    ) : Icon && (
                                      <Icon className={cn("w-3.5 h-3.5", network.textColor || "text-white")} />
                                    )}
                                  </div>
                                  <span>{network.name}</span>
                                  <Badge variant="secondary" className="mr-auto text-[10px] h-5">{count}</Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Service Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">الخدمة</Label>
                      <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={serviceSearchOpen}
                            className="w-full h-11 justify-between rounded-lg bg-background text-right"
                          >
                            {selectedService ? (
                              <div className="flex items-center gap-2 text-right flex-1 min-w-0">
                                <span className="truncate">{selectedService.name}</span>
                                <Badge className="bg-primary/10 text-primary border-0 text-[10px] shrink-0">
                                  {convertToSAR(selectedService.price).toFixed(2)} ر.س
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">ابحث واختر الخدمة...</span>
                            )}
                            <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border z-50" align="start">
                          <Command className="bg-transparent">
                            <CommandInput 
                              placeholder="ابحث عن خدمة..." 
                              value={serviceSearchQuery}
                              onValueChange={setServiceSearchQuery}
                              className="h-10"
                            />
                            <CommandList className="max-h-64">
                              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                لا توجد خدمات مطابقة
                              </CommandEmpty>
                              <CommandGroup>
                                {categoryServices.slice(0, 50).map((service) => {
                                  const features = parseFeatures(service.features);
                                  const platform = getServicePlatform(service);
                                  return (
                                    <CommandItem
                                      key={service.id}
                                      value={service.name}
                                      onSelect={() => handleSelectService(service)}
                                      className="flex items-center gap-2 py-2.5 px-3 cursor-pointer"
                                    >
                                      <div className={`w-7 h-7 rounded-md ${platform.bgColor} flex items-center justify-center shrink-0`}>
                                        {(() => {
                                          const CustomIcon = (platform as any).customIcon;
                                          const Icon = platform.icon;
                                          if (CustomIcon) {
                                            return (
                                              <div className={platform.textColor || "text-white"}>
                                                <CustomIcon />
                                              </div>
                                            );
                                          }
                                          if (Icon) {
                                            return <Icon className={cn("w-3.5 h-3.5", platform.textColor || "text-white")} />;
                                          }
                                          return null;
                                        })()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{service.name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                          {service.external_service_id && `#${service.external_service_id} • `}
                                          {features.min.toLocaleString()}-{features.max.toLocaleString()}
                                        </p>
                                      </div>
                                      <Badge className="bg-primary/10 text-primary border-0 text-[10px] shrink-0">
                                        {convertToSAR(service.price).toFixed(2)}
                                      </Badge>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {categoryServices.length > 50 && (
                        <p className="text-[11px] text-muted-foreground">يتم عرض أول 50 خدمة، استخدم البحث للمزيد</p>
                      )}
                    </div>

                    {/* Link Input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-primary" />
                        الرابط
                      </Label>
                      <Input
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder={getLinkPlaceholder()}
                        className="h-11 rounded-lg bg-background"
                        dir="ltr"
                      />
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        الكمية
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={decrementQuantity}
                          disabled={!selectedService}
                          className="h-11 w-11 rounded-lg shrink-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="أدخل الكمية"
                          className="h-11 rounded-lg bg-background text-center flex-1"
                          dir="ltr"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={incrementQuantity}
                          disabled={!selectedService}
                          className="h-11 w-11 rounded-lg shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {currentFeatures && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>الحد الأدنى: {currentFeatures.min.toLocaleString()}</span>
                          <span>الحد الأقصى: {currentFeatures.max.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Price Summary */}
                    <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">السعر / 1000:</span>
                        <span className="font-medium">{selectedService ? convertToSAR(selectedService.price).toFixed(2) : '0.00'} ر.س</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">الكمية:</span>
                        <span className="font-medium">{parseInt(quantity) ? parseInt(quantity).toLocaleString() : 0}</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">الإجمالي:</span>
                        <span className="text-xl font-bold text-primary">{totalPrice.toFixed(2)} ر.س</span>
                      </div>
                      
                      {userBalance && (
                        <div className="flex items-center justify-between text-sm pt-1">
                          <span className="text-muted-foreground">رصيدك الحالي:</span>
                          <span className={cn("font-medium", userBalance.balance >= totalPrice ? "text-green-600" : "text-red-500")}>
                            {userBalance.balance.toFixed(2)} ر.س
                          </span>
                        </div>
                      )}
                      
                      {userBalance && userBalance.balance < totalPrice && totalPrice > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => navigate('/dashboard/deposit')}
                          className="w-full gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                        >
                          <Wallet className="w-4 h-4" />
                          شحن الرصيد
                        </Button>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !selectedService || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
                      className="w-full h-12 text-base font-semibold rounded-xl gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري تنفيذ الطلب...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          تنفيذ الطلب
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Service Details Card - Right Column (30%) */}
                <Card className="border-border/50 h-fit lg:sticky lg:top-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      تفاصيل الخدمة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedService ? (
                      <div className="space-y-4">
                        {/* Service Name */}
                        <div className="p-3 rounded-lg bg-muted/50 border border-border">
                          <h3 className="font-medium text-sm leading-relaxed">{selectedService.name}</h3>
                          {selectedService.external_service_id && (
                            <p className="text-xs text-muted-foreground mt-1">#{selectedService.external_service_id}</p>
                          )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                            <p className="text-xs text-muted-foreground mb-1">السعر / 1000</p>
                            <p className="text-lg font-bold text-primary">{convertToSAR(selectedService.price).toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">ر.س</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                            <p className="text-xs text-muted-foreground mb-1">الحد الأدنى</p>
                            <p className="text-lg font-bold">{currentFeatures?.min.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                            <p className="text-xs text-muted-foreground mb-1">الحد الأقصى</p>
                            <p className="text-lg font-bold">{currentFeatures?.max.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                            <p className="text-xs text-muted-foreground mb-1">وقت البدء</p>
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="text-sm font-bold">0-1 ساعة</p>
                            </div>
                          </div>
                        </div>

                        {/* Speed */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                          <Zap className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="text-sm font-medium">سرعة التنفيذ</p>
                            <p className="text-xs text-muted-foreground">100 - 10K / يوم</p>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          {(selectedService.refill_enabled || currentFeatures?.refill) && (
                            <Badge className="bg-green-500/15 text-green-600 border-green-500/30 gap-1">
                              <RefreshCw className="w-3 h-3" />
                              ضمان تعويض
                            </Badge>
                          )}
                          {selectedService.refill_days && (
                            <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1">
                              <Shield className="w-3 h-3" />
                              {selectedService.refill_days} يوم
                            </Badge>
                          )}
                          <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
                            <Zap className="w-3 h-3" />
                            تنفيذ فوري
                          </Badge>
                        </div>

                        {/* Description */}
                        {selectedService.description && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              الوصف
                            </Label>
                            <ScrollArea className="h-24 rounded-lg border border-border p-3">
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {selectedService.description}
                              </p>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">اختر خدمة لعرض التفاصيل</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Browse Services Tab */}
            <TabsContent value="browse" className="mt-0">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن خدمة..."
                    value={browseSearchQuery}
                    onChange={(e) => setBrowseSearchQuery(e.target.value)}
                    className="pr-10 h-11 rounded-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {browseServices.length} خدمة متاحة
                </p>
              </div>

              {/* Services List */}
              <div className="space-y-2">
                {browseServices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <Search className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-bold mb-1">لا توجد خدمات</h3>
                    <p className="text-muted-foreground text-xs">
                      {browseSearchQuery ? "لم يتم العثور على خدمات مطابقة" : "سيتم إضافة الخدمات قريباً"}
                    </p>
                  </div>
                ) : (
                  browseServices.map((service) => (
                    <BrowseServiceCard
                      key={service.id}
                      service={service}
                      onOrder={(s) => {
                        handleSelectService(s);
                        setActiveTab("new-order");
                      }}
                      isFavorite={favorites.includes(service.id)}
                      onToggleFavorite={toggleFavorite}
                      parseFeatures={parseFeatures}
                      convertToSAR={convertToSAR}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
