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
  Target,
  Activity,
  Shield,
  Users,
  Award,
  Grid3X3,
  LayoutList,
  SlidersHorizontal,
  ArrowLeft,
  X,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

const socialNetworks = [
  { id: 'all', name: 'الكل', keywords: [], icon: Sparkles, gradient: 'from-primary to-primary/80', bgColor: 'bg-primary' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]', bgColor: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك'], customIcon: TikTokIcon, gradient: 'from-black to-gray-800', bgColor: 'bg-black' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب'], icon: Youtube, gradient: 'from-[#FF0000] to-[#CC0000]', bgColor: 'bg-[#FF0000]' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك'], icon: Facebook, gradient: 'from-[#1877F2] to-[#0D65D9]', bgColor: 'bg-[#1877F2]' },
  { id: 'twitter', name: 'تويتر', keywords: ['twitter', 'تويتر', 'x ', 'اكس'], icon: X, gradient: 'from-black to-gray-800', bgColor: 'bg-black' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي'], customIcon: SpotifyIcon, gradient: 'from-[#1DB954] to-[#19A349]', bgColor: 'bg-[#1DB954]' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب'], icon: Ghost, gradient: 'from-[#FFFC00] to-[#FFE100]', bgColor: 'bg-[#FFFC00]', textColor: 'text-black' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام'], icon: Send, gradient: 'from-[#0088CC] to-[#0077B5]', bgColor: 'bg-[#0088CC]' },
  { id: 'discord', name: 'ديسكورد', keywords: ['discord', 'ديسكورد'], customIcon: DiscordIcon, gradient: 'from-[#5865F2] to-[#4752C4]', bgColor: 'bg-[#5865F2]' },
  { id: 'twitch', name: 'تويتش', keywords: ['twitch', 'تويتش'], customIcon: TwitchIcon, gradient: 'from-[#9146FF] to-[#7C2FE6]', bgColor: 'bg-[#9146FF]' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان'], icon: Linkedin, gradient: 'from-[#0A66C2] to-[#0855A5]', bgColor: 'bg-[#0A66C2]' },
  { id: 'website', name: 'زيارات', keywords: ['website', 'زيار', 'visit', 'traffic'], icon: Globe, gradient: 'from-[#10B981] to-[#059669]', bgColor: 'bg-[#10B981]' },
  { id: 'reviews', name: 'تقييمات', keywords: ['review', 'تقييم', 'rating'], icon: Star, gradient: 'from-[#F59E0B] to-[#D97706]', bgColor: 'bg-[#F59E0B]' },
];

// Service Card Component
const ServiceCard = ({ 
  service, 
  index, 
  onOrder, 
  isFavorite,
  onToggleFavorite,
  parseFeatures,
  convertToSAR,
  viewMode,
}: { 
  service: Service; 
  index: number; 
  onOrder: (service: Service) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  parseFeatures: (features: any) => { min: number; max: number; refill: boolean };
  convertToSAR: (price: number) => number;
  viewMode: "grid" | "list";
}) => {
  const features = parseFeatures(service.features);
  const pricePerK = convertToSAR(service.price);

  // Find matching platform
  const getPlatform = () => {
    const text = `${service.name} ${service.category}`.toLowerCase();
    for (const network of socialNetworks) {
      if (network.id !== 'all' && network.keywords.some(k => text.includes(k))) {
        return network;
      }
    }
    return socialNetworks[1]; // default to instagram
  };
  
  const platform = getPlatform();
  const Icon = platform.icon;
  const CustomIcon = (platform as any).customIcon;

  const copyServiceId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (service.external_service_id) {
      navigator.clipboard.writeText(service.external_service_id);
      toast.success("تم نسخ رقم الخدمة");
    }
  };

  if (viewMode === "list") {
    return (
      <Card className="border border-border/50 bg-card hover:border-primary/30 transition-all rounded-lg overflow-hidden">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center gap-2.5">
            {/* Platform Icon */}
            <div className={`w-10 h-10 rounded-lg ${platform.bgColor} flex items-center justify-center shrink-0`}>
              {CustomIcon ? <CustomIcon /> : Icon && <Icon className={cn("w-5 h-5", platform.textColor || "text-white")} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-xs line-clamp-1">{service.name}</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                {service.external_service_id && (
                  <button onClick={copyServiceId} className="hover:text-primary">#{service.external_service_id}</button>
                )}
                <span>{features.min.toLocaleString()}-{features.max.toLocaleString()}</span>
                {(service.refill_enabled || features.refill) && (
                  <Badge className="bg-green-500/15 text-green-600 border-0 text-[9px] px-1 py-0">ضمان</Badge>
                )}
              </div>
            </div>

            {/* Price & Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm font-bold text-primary">{pricePerK.toFixed(2)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(service.id); }}
                className={cn("h-8 w-8 rounded-md", isFavorite ? "text-rose-500" : "hover:text-rose-500")}
              >
                <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
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
  }

  // Grid View
  return (
    <Card className="h-full border border-border/50 bg-card hover:border-primary/30 transition-all rounded-lg overflow-hidden group min-w-0">
      <CardContent className="p-2 sm:p-3 flex flex-col h-full min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${platform.bgColor} flex items-center justify-center shrink-0`}>
            {CustomIcon ? <CustomIcon /> : Icon && <Icon className={cn("w-4 h-4", platform.textColor || "text-white")} />}
          </div>
          <div className="text-left shrink-0">
            <p className="text-sm sm:text-base font-bold text-primary leading-none">{pricePerK.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground">ر.س</p>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-medium text-[11px] sm:text-xs leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors flex-1 min-w-0">
          {service.name}
        </h3>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-0.5 text-[9px] text-muted-foreground mb-1.5 min-w-0">
          {service.external_service_id && (
            <span className="px-1 py-0.5 rounded bg-muted/50 truncate max-w-[60px]">
              #{service.external_service_id}
            </span>
          )}
          <span className="px-1 py-0.5 rounded bg-muted/50 whitespace-nowrap">
            {features.min.toLocaleString()}-{features.max.toLocaleString()}
          </span>
          {(service.refill_enabled || features.refill) && (
            <Badge className="bg-green-500/15 text-green-600 border-0 text-[8px] px-1 py-0">ضمان</Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 mt-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(service.id); }}
            className={cn("h-7 w-7 rounded-md shrink-0", isFavorite ? "text-rose-500" : "hover:text-rose-500")}
          >
            <Heart className={cn("w-3 h-3", isFavorite && "fill-current")} />
          </Button>
          <Button
            onClick={() => onOrder(service)}
            className={`flex-1 bg-gradient-to-r ${platform.gradient} text-white rounded-md h-7 text-[10px] sm:text-xs px-2`}
          >
            <ShoppingCart className="w-3 h-3 ml-0.5" />
            اطلب
          </Button>
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
  
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("price-asc");
  const [balance, setBalance] = useState(0);

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

  // Filter social media services
  const designDevKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية', 'برمجة', 'تطوير', 'dev', 'development', 'app'];
  
  const socialMediaServices = useMemo(() => {
    return services.filter(service => {
      const text = `${service.category} ${service.name}`.toLowerCase();
      return !designDevKeywords.some(k => text.includes(k));
    });
  }, [services]);

  // Get services by network
  const getServicesByNetwork = useCallback((networkId: string) => {
    if (networkId === 'all') return socialMediaServices;
    const network = socialNetworks.find(n => n.id === networkId);
    if (!network || network.keywords.length === 0) return socialMediaServices;
    return socialMediaServices.filter(s => {
      const text = `${s.name} ${s.category}`.toLowerCase();
      return network.keywords.some(k => text.includes(k));
    });
  }, [socialMediaServices]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = getServicesByNetwork(selectedNetwork);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.external_service_id?.includes(query)
      );
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "name": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  }, [selectedNetwork, searchQuery, sortBy, getServicesByNetwork]);

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

  // Handle service selection
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    const features = parseFeatures(service.features);
    setQuantity(features.min.toString());
    setShowOrderDialog(true);
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
      setShowOrderDialog(false);
      refetchBalance();
      
    } catch { 
      toast.error("حدث خطأ أثناء إرسال الطلب"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesPageSkeleton title="خدمات السوشيال ميديا" color="blue" />
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full w-full overflow-x-hidden overflow-y-auto">
        <div className="w-full min-w-0 max-w-full space-y-4 pb-8 px-2 sm:px-4" dir="rtl">
          
          {/* Hero Header - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-4 sm:p-5"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative z-10">
              {/* Top Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 rounded-full border border-emerald-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-semibold text-emerald-400">متاح</span>
                    </div>
                    <Badge className="bg-white/15 text-white border-0 text-[10px]">
                      <TrendingUp className="w-2.5 h-2.5 ml-0.5" />
                      الأكثر طلباً
                    </Badge>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                    خدمات السوشيال ميديا
                  </h1>
                  <p className="text-white/70 text-xs hidden sm:block truncate">
                    زد متابعيك وتفاعلك على جميع المنصات
                  </p>
                </div>
                
                <Link to="/dashboard/our-services">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors shrink-0">
                    <ArrowLeft className="w-4 h-4 text-white" />
                  </div>
                </Link>
              </div>
              
              {/* Stats Row - Compact */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 shrink-0">
                  <Activity className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-medium">{socialMediaServices.length} خدمة</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 shrink-0">
                  <Zap className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-medium">تنفيذ فوري</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 shrink-0">
                  <Wallet className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-bold">{balance.toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Platform Tabs - Compact */}
          <div className="w-full overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5 min-w-max py-1 px-1">
              {socialNetworks.map((network) => {
                const Icon = network.icon;
                const CustomIcon = (network as any).customIcon;
                const isSelected = selectedNetwork === network.id;
                
                return (
                  <button
                    key={network.id}
                    onClick={() => setSelectedNetwork(network.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 text-xs font-medium",
                      isSelected
                        ? `bg-gradient-to-r ${network.gradient} text-white shadow-sm`
                        : "bg-card border border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", !isSelected && network.bgColor)}>
                      {CustomIcon ? (
                        <div className={isSelected ? "text-white" : network.textColor || "text-white"}>
                          <CustomIcon />
                        </div>
                      ) : Icon && (
                        <Icon className={cn("w-3 h-3", isSelected ? "text-white" : network.textColor || "text-white")} />
                      )}
                    </div>
                    <span className="whitespace-nowrap">{network.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Filters - Compact */}
          <div className="bg-card rounded-lg border border-border p-3">
            <div className="flex gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 h-9 rounded-lg text-sm"
                />
              </div>
              
              {/* Sort & View */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-24 sm:w-28 h-9 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">الأقل سعراً</SelectItem>
                  <SelectItem value="price-desc">الأعلى سعراً</SelectItem>
                  <SelectItem value="name">الاسم</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-muted">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn("h-8 w-8 rounded-md", viewMode === "grid" && "bg-primary text-primary-foreground")}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn("h-8 w-8 rounded-md", viewMode === "list" && "bg-primary text-primary-foreground")}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <span className="text-[11px] text-muted-foreground">
                {filteredServices.length} من {socialMediaServices.length} خدمة
              </span>
              {searchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="h-6 text-[11px] px-2">
                  مسح
                </Button>
              )}
            </div>
          </div>

          {/* Services Grid/List */}
          <div className="w-full min-w-0">
            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-1">لا توجد خدمات</h3>
                <p className="text-muted-foreground text-xs mb-3">
                  {searchQuery ? "لم يتم العثور على خدمات" : "سيتم إضافة الخدمات قريباً"}
                </p>
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setSelectedNetwork("all"); }} className="h-8 text-xs">
                  إعادة ضبط
                </Button>
              </div>
            ) : (
              <div className={cn(
                "grid gap-2 sm:gap-3 w-full",
                viewMode === "grid" 
                  ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                  : "grid-cols-1"
              )}>
                {filteredServices.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    onOrder={handleSelectService}
                    isFavorite={favorites.includes(service.id)}
                    onToggleFavorite={toggleFavorite}
                    parseFeatures={parseFeatures}
                    convertToSAR={convertToSAR}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-md mx-4 rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-primary/5 p-4 border-b border-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  طلب جديد
                </DialogTitle>
              </DialogHeader>
              
              {selectedService && (
                <div className="mt-3 p-3 bg-card rounded-xl border border-border">
                  <h4 className="font-medium text-sm line-clamp-2">{selectedService.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {selectedService.external_service_id && <span>#{selectedService.external_service_id}</span>}
                    {(selectedService.refill_enabled || parseFeatures(selectedService.features).refill) && (
                      <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 border-0">
                        <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
                        ضمان تعويض
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  رابط الحساب أو المنشور
                </Label>
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="rounded-lg" dir="ltr" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary" />
                  الكمية
                </Label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="أدخل الكمية" className="rounded-lg" dir="ltr" />
                {selectedService && (
                  <p className="text-xs text-muted-foreground">
                    الحد: {parseFeatures(selectedService.features).min.toLocaleString()} - {parseFeatures(selectedService.features).max.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="p-3 bg-muted/50 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">السعر / 1000:</span>
                  <span>{selectedService ? convertToSAR(selectedService.price).toFixed(2) : 0} ر.س</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">الكمية:</span>
                  <span>{parseInt(quantity) || 0}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">الإجمالي:</span>
                  <span className="text-lg font-bold text-primary">{totalPrice.toFixed(2)} ر.س</span>
                </div>
                
                {userBalance && (
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-muted-foreground">رصيدك:</span>
                    <span className={cn("font-medium", userBalance.balance >= totalPrice ? "text-green-600" : "text-red-500")}>
                      {userBalance.balance.toFixed(2)} ر.س
                    </span>
                  </div>
                )}
                
                {userBalance && userBalance.balance < totalPrice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/deposit')}
                    className="w-full mt-2 rounded-lg gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                  >
                    <Wallet className="w-4 h-4" />
                    شحن الرصيد
                  </Button>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !link || !quantity || (userBalance && userBalance.balance < totalPrice)}
                className="w-full h-11 rounded-xl gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    تأكيد الطلب
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
