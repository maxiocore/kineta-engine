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
  Target,
  Clock,
  ChevronDown,
  Layers,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

// أيقونات SVG مخصصة للمنصات
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

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.857-.711 2.04-1.134 3.522-1.262 1.048-.09 2.015-.049 2.91.088-.058-.963-.27-1.685-.636-2.166-.453-.595-1.178-.897-2.156-.897h-.04c-.825.011-1.502.252-2.01.716-.322.294-.555.657-.708 1.078l-1.9-.723c.248-.64.623-1.2 1.116-1.67.882-.838 2.073-1.28 3.45-1.28h.06c1.636.013 2.915.563 3.802 1.636.78.943 1.182 2.254 1.2 3.903.013.13.013.26.013.39 1.157.457 2.074 1.19 2.677 2.154.815 1.305 1.05 2.943.66 4.61-.48 2.04-1.68 3.683-3.473 4.758-1.594.955-3.554 1.442-5.834 1.449z"/>
  </svg>
);

const socialNetworks = [
  { id: 'all', name: 'الكل', keywords: [], icon: Sparkles, color: 'bg-gradient-to-r from-orange-500 to-amber-500', iconColor: 'text-white' },
  { id: 'facebook', name: 'فيسبوك', keywords: ['facebook', 'فيسبوك', 'فيس بوك', 'fb'], icon: Facebook, color: 'bg-[#1877F2]', iconColor: 'text-white' },
  { id: 'instagram', name: 'انستقرام', keywords: ['instagram', 'انستقرام', 'انستا', 'insta'], icon: Instagram, color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]', iconColor: 'text-white' },
  { id: 'tiktok', name: 'تيك توك', keywords: ['tiktok', 'تيك توك', 'تيكتوك', 'tik tok'], customIcon: TikTokIcon, color: 'bg-black', iconColor: 'text-white' },
  { id: 'youtube', name: 'يوتيوب', keywords: ['youtube', 'يوتيوب', 'يوتوب', 'yt'], icon: Youtube, color: 'bg-[#FF0000]', iconColor: 'text-white' },
  { id: 'twitter', name: 'تويتر', keywords: ['twitter', 'تويتر', 'x ', ' x', 'اكس'], icon: X, color: 'bg-black', iconColor: 'text-white' },
  { id: 'spotify', name: 'سبوتيفاي', keywords: ['spotify', 'سبوتيفاي', 'سبوتفاي'], customIcon: SpotifyIcon, color: 'bg-[#1DB954]', iconColor: 'text-white' },
  { id: 'snapchat', name: 'سناب شات', keywords: ['snapchat', 'سناب شات', 'سناب', 'snap'], icon: Ghost, color: 'bg-[#FFFC00]', iconColor: 'text-black' },
  { id: 'telegram', name: 'تيليجرام', keywords: ['telegram', 'تيليجرام', 'تلجرام', 'تليجرام'], icon: Send, color: 'bg-[#0088CC]', iconColor: 'text-white' },
  { id: 'discord', name: 'ديسكورد', keywords: ['discord', 'ديسكورد', 'دسكورد'], customIcon: DiscordIcon, color: 'bg-[#5865F2]', iconColor: 'text-white' },
  { id: 'twitch', name: 'تويتش', keywords: ['twitch', 'تويتش', 'توتش'], customIcon: TwitchIcon, color: 'bg-[#9146FF]', iconColor: 'text-white' },
  { id: 'website', name: 'زيارات', keywords: ['website', 'زيار', 'visit', 'traffic', 'موقع', 'ويب'], icon: Globe, color: 'bg-[#10B981]', iconColor: 'text-white' },
  { id: 'reviews', name: 'تقييمات', keywords: ['review', 'تقييم', 'rating', 'google'], icon: Star, color: 'bg-[#F59E0B]', iconColor: 'text-white' },
  { id: 'google', name: 'جوجل', keywords: ['google', 'جوجل', 'قوقل'], customIcon: GoogleIcon, color: 'bg-white border border-border', iconColor: '' },
  { id: 'linkedin', name: 'لينكدإن', keywords: ['linkedin', 'لينكدان', 'لينكد ان', 'لينكدإن'], icon: Linkedin, color: 'bg-[#0A66C2]', iconColor: 'text-white' },
  { id: 'threads', name: 'ثريدز', keywords: ['threads', 'ثريدز', 'ثردز'], customIcon: ThreadsIcon, color: 'bg-black', iconColor: 'text-white' },
];

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

  // Toggle category expansion
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(catId)) {
        newSet.delete(catId);
      } else {
        newSet.add(catId);
      }
      return newSet;
    });
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
        <div className="w-full h-full overflow-hidden">
          <div className="p-4 space-y-4 max-w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <Skeleton className="h-12 rounded-xl w-full" />
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-16 rounded-xl shrink-0" />)}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl w-full" />)}
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div dir="rtl" className="w-full h-full overflow-x-hidden overflow-y-auto bg-background">
        <div className="w-full max-w-full p-4 md:p-6 space-y-5">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/dashboard/deposit')}
              className="bg-gradient-to-bl from-primary to-primary/80 text-primary-foreground rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all col-span-1"
            >
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="text-xs opacity-90">رصيدك</span>
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-left" dir="ltr">{(userBalance?.balance || 0).toFixed(2)}</p>
              <p className="text-[11px] opacity-80 text-right">ريال سعودي</p>
            </motion.div>

            {/* Orders Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="text-xs text-muted-foreground">طلباتي</span>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xl font-bold">{userStats?.totalOrders || 0}</p>
              <p className="text-[11px] text-muted-foreground">طلب مكتمل</p>
            </motion.div>

            {/* Favorites Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="text-xs text-muted-foreground">المفضلة</span>
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-xl font-bold">{favorites.length}</p>
              <p className="text-[11px] text-muted-foreground">خدمة محفوظة</p>
            </motion.div>

            {/* Services Count Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="text-xs text-muted-foreground">الخدمات</span>
                <Layers className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xl font-bold">{filteredServices.length}</p>
              <p className="text-[11px] text-muted-foreground">خدمة متاحة</p>
            </motion.div>
          </div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative w-full"
          >
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="ابحث عن خدمة بالاسم أو رقم الخدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pr-12 pl-12 rounded-xl border-border bg-card text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </motion.div>

          {/* Platform Tabs - Horizontal Scrollable */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full"
          >
            <ScrollArea className="w-full" dir="rtl">
              <div className="flex flex-row-reverse gap-2 pb-2">
                {socialNetworks.map((network) => {
                  const Icon = network.icon;
                  const CustomIcon = (network as any).customIcon;
                  const isSelected = selectedNetwork === network.id;
                  const count = networkCounts[network.id] || 0;
                  
                  return (
                    <button
                      key={network.id}
                      onClick={() => {
                        setSelectedNetwork(network.id);
                        setSelectedCategory("");
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all shrink-0 border",
                        isSelected
                          ? `${network.color} ${network.iconColor} border-transparent shadow-md`
                          : "bg-card border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full",
                        !isSelected && network.color,
                        !isSelected && network.iconColor
                      )}>
                        {CustomIcon ? (
                          <CustomIcon />
                        ) : Icon ? (
                          <Icon className="w-4 h-4" />
                        ) : null}
                      </div>
                      <span className={cn(
                        "text-sm font-medium whitespace-nowrap",
                        isSelected ? network.iconColor : "text-foreground"
                      )}>
                        {network.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
          </motion.div>

          {/* Services List */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 w-full"
          >
            {filteredServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
                <Search className="w-14 h-14 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-lg text-foreground mb-2">لا توجد خدمات</h3>
                <p className="text-sm text-muted-foreground mb-4">جرب البحث بكلمات مختلفة</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setSelectedNetwork("all");
                  }}
                >
                  إعادة ضبط الفلاتر
                </Button>
              </div>
            ) : (
              Object.entries(groupedServices).map(([catId, catServices]) => (
                <Collapsible 
                  key={catId}
                  open={expandedCategories.has(catId) || expandedCategories.size === 0}
                  onOpenChange={() => toggleCategory(catId)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors">
                      <ChevronDown className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform",
                        (expandedCategories.has(catId) || expandedCategories.size === 0) && "rotate-180"
                      )} />
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {catServices.length}
                        </Badge>
                        <span className="font-semibold text-sm">{getCategoryName(catId)}</span>
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-2 space-y-2">
                      {catServices.map((service) => {
                        const features = parseFeatures(service.features);
                        const isFav = favorites.includes(service.id);
                        const pricePerK = convertToSAR(service.price);
                        
                        return (
                          <div
                            key={service.id}
                            className="w-full bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
                          >
                            {/* Service Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(service.id);
                                }}
                                className={cn(
                                  "shrink-0 p-2 rounded-lg transition-colors",
                                  isFav 
                                    ? "bg-rose-500/10 text-rose-500" 
                                    : "bg-muted text-muted-foreground hover:text-rose-500"
                                )}
                              >
                                <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
                              </button>
                              <h4 className="font-medium text-sm text-foreground leading-relaxed text-right flex-1">
                                {service.name}
                              </h4>
                            </div>
                            
                            {/* Service Meta */}
                            <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground mb-3">
                              {(service.refill_enabled || features.refill) && (
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-600 border-0">
                                  تعويض
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                </Badge>
                              )}
                              {service.refill_days && (
                                <span className="flex items-center gap-1">
                                  {service.refill_days} يوم
                                  <Clock className="w-3 h-3" />
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                {features.min.toLocaleString()} - {features.max.toLocaleString()}
                                <Target className="w-3 h-3" />
                              </span>
                              {service.external_service_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyServiceId(service.external_service_id!);
                                  }}
                                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                                >
                                  #{service.external_service_id}
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Price & Action */}
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <Button
                                size="sm"
                                onClick={() => handleSelectService(service)}
                                className="rounded-lg gap-2"
                              >
                                اطلب الآن
                                <ShoppingCart className="w-4 h-4" />
                              </Button>
                              <div className="text-left">
                                <p className="text-lg font-bold text-primary" dir="ltr">
                                  {pricePerK.toFixed(2)} ر.س
                                </p>
                                <p className="text-[10px] text-muted-foreground text-right">لكل 1000</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </motion.div>
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
                  <h4 className="font-medium text-sm text-foreground line-clamp-2">
                    {selectedService.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {selectedService.external_service_id && (
                      <span>#{selectedService.external_service_id}</span>
                    )}
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
              {/* Link Input */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  رابط الحساب أو المنشور
                </Label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="rounded-lg"
                  dir="ltr"
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary" />
                  الكمية
                </Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="أدخل الكمية"
                  className="rounded-lg"
                  dir="ltr"
                />
                {selectedService && (
                  <p className="text-xs text-muted-foreground">
                    الحد: {parseFeatures(selectedService.features).min.toLocaleString()} - {parseFeatures(selectedService.features).max.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Price Summary */}
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
                    className="w-full mt-2 rounded-lg gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
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
      </div>
    </ClientDashboardLayout>
  );
};

export default SocialMediaServices;
