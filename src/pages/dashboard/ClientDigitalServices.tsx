import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  TrendingUp,
  Search,
  Grid3X3,
  LayoutList,
  ShoppingCart,
  Shield,
  Activity,
  Check,
  Star,
  Clock,
  ArrowLeft,
  Sparkles,
  Zap,
  Award,
  Target,
  BarChart3,
  PieChart,
  Megaphone,
  Globe,
  Rocket,
  Users,
  MessageSquare,
  Filter,
  SlidersHorizontal,
  Heart,
  Eye,
  ArrowUpRight,
  Mail,
  MousePointerClick,
  Share2,
  Layers,
  LineChart,
  Gauge,
  BadgeCheck,
  Flame,
  Trophy,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ServicesPageSkeleton from "@/components/dashboard/ServicesPageSkeleton";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import FeaturedOffersSection from "@/components/offers/FeaturedOffersSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  category_id: string | null;
  status: string;
  features: any;
  refill_enabled: boolean | null;
  external_service_id: string | null;
}

const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 rounded-full border border-emerald-500/30"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <motion.div
      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-[10px] sm:text-xs font-semibold text-emerald-500">متاح الآن</span>
  </motion.div>
);

const StatBadge = ({ icon: Icon, value, label, delay = 0 }: { icon: any; value: string; label: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10"
  >
    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="text-right">
      <p className="text-white font-bold text-sm">{value}</p>
      <p className="text-white/60 text-[10px]">{label}</p>
    </div>
  </motion.div>
);

// Digital Marketing Service Categories
const marketingCategories = [
  { id: "all", name: "الكل", icon: Layers, count: 0 },
  { id: "seo", name: "تحسين محركات البحث", icon: Search, count: 0 },
  { id: "ads", name: "الإعلانات المدفوعة", icon: Megaphone, count: 0 },
  { id: "social", name: "إدارة السوشيال", icon: Share2, count: 0 },
  { id: "content", name: "التسويق بالمحتوى", icon: MessageSquare, count: 0 },
  { id: "email", name: "التسويق بالبريد", icon: Mail, count: 0 },
  { id: "analytics", name: "تحليل البيانات", icon: BarChart3, count: 0 },
];

// Modern Digital Marketing Service Card
const DigitalServiceCard = ({ 
  service, 
  index, 
  onOrder, 
  onViewDetails 
}: { 
  service: Service; 
  index: number; 
  onOrder: (service: Service) => void;
  onViewDetails: (service: Service) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const icons = [TrendingUp, BarChart3, Target, Megaphone, LineChart, Gauge, PieChart, Rocket];
  const IconComponent = icons[index % icons.length];

  const features = Array.isArray(service.features) ? service.features.slice(0, 3) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group h-full"
    >
      <Card className="h-full relative overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-500 rounded-2xl hover:shadow-xl hover:shadow-blue-500/5">
        {/* Gradient Overlay on Hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-violet-500/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Animated particles on hover */}
        {isHovered && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-blue-400/40"
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: "100%",
                  opacity: 0 
                }}
                animate={{ 
                  y: "-20%",
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
              />
            ))}
          </>
        )}

        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="relative z-10 p-4 sm:p-5 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Icon */}
            <motion.div 
              animate={{ rotate: isHovered ? 5 : 0, scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            </motion.div>

            {/* Price & Badges */}
            <div className="text-left flex flex-col items-end gap-2">
              <motion.div 
                animate={{ scale: isHovered ? 1.05 : 1 }}
                className="flex items-baseline gap-1"
              >
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                  {service.price.toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">ر.س</span>
              </motion.div>
              
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {index < 3 && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-0.5">
                    <Flame className="w-2.5 h-2.5" />
                    شائع
                  </Badge>
                )}
                {service.refill_enabled && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-0.5">
                    <Shield className="w-2.5 h-2.5" />
                    ضمان
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Service Name */}
          <h3 className="font-bold text-sm sm:text-base leading-snug mb-2 group-hover:text-blue-500 transition-colors line-clamp-2">
            {service.name}
          </h3>

          {/* Description */}
          {service.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-3 leading-relaxed flex-grow">
              {service.description}
            </p>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-green-500" />
                  </div>
                  <span className="text-muted-foreground truncate">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Results Info */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mb-4 mt-auto">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span>نتائج مضمونة</span>
            <span className="mx-1">•</span>
            <Clock className="w-3.5 h-3.5" />
            <span>بدء فوري</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(service)}
              className="flex-1 rounded-xl h-9 sm:h-10 text-xs border-border/50 hover:border-blue-500/50 hover:bg-blue-500/5"
            >
              <Eye className="w-3.5 h-3.5 ml-1.5" />
              التفاصيل
            </Button>
            <Button
              size="sm"
              onClick={() => onOrder(service)}
              className="flex-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 hover:opacity-90 text-white rounded-xl h-9 sm:h-10 text-xs shadow-md hover:shadow-lg transition-shadow"
            >
              <ShoppingCart className="w-3.5 h-3.5 ml-1.5" />
              اطلب الآن
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// List View Card
const DigitalServiceListCard = ({ 
  service, 
  index, 
  onOrder, 
  onViewDetails 
}: { 
  service: Service; 
  index: number; 
  onOrder: (service: Service) => void;
  onViewDetails: (service: Service) => void;
}) => {
  const icons = [TrendingUp, BarChart3, Target, Megaphone, LineChart, Gauge, PieChart, Rocket];
  const IconComponent = icons[index % icons.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <Card className="relative overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 rounded-xl hover:shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-md shrink-0">
              <IconComponent className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-blue-500 transition-colors">
                  {service.name}
                </h3>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent shrink-0">
                  {service.price.toFixed(0)} ر.س
                </span>
              </div>
              
              {service.description && (
                <p className="text-xs text-muted-foreground/70 line-clamp-1 mb-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {index < 3 && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                      <Flame className="w-2.5 h-2.5 ml-0.5" />
                      شائع
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    نتائج مضمونة
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(service)}
                    className="h-8 px-2 text-xs rounded-lg hover:bg-blue-500/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onOrder(service)}
                    className="h-8 px-3 bg-gradient-to-r from-blue-500 to-violet-500 hover:opacity-90 text-white rounded-lg text-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 ml-1" />
                    اطلب
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ClientDigitalServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("price-asc");
  const [activeCategory, setActiveCategory] = useState("all");

  const digitalKeywords = [
    "digital", "marketing", "seo", "ads", "google", "تسويق", "رقمي", "إعلان", "إعلانات", 
    "قوقل", "تحليل", "analytics", "content", "محتوى", "email", "بريد", "حملة", "حملات",
    "cpc", "ppc", "sem", "smm", "influencer", "مؤثرين", "تحسين", "محركات", "البحث",
    "facebook ads", "google ads", "instagram ads", "tiktok ads", "snapchat ads",
    "تيك توك", "سناب", "انستقرام", "فيسبوك", "تويتر", "لينكدإن", "يوتيوب",
  ];

  const { data: initialServices, isLoading, refetch } = useQuery({
    queryKey: ["digital-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      
      if (error) throw error;
      
      return (data as Service[]).filter(service => {
        const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
        return digitalKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    },
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success("تم تحديث الخدمات");
  };

  useEffect(() => {
    if (initialServices) {
      setServices(initialServices);
    }
  }, [initialServices]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (data) setBalance(data.balance);
  };

  useEffect(() => {
    const channel = supabase
      .channel('digital_services_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const service = payload.new as Service;
            const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
            const isDigitalService = digitalKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
            
            if (service.status === 'active' && isDigitalService) {
              setServices(prev => {
                const exists = prev.find(s => s.id === service.id);
                if (exists) {
                  return prev.map(s => s.id === service.id ? service : s);
                }
                return [...prev, service].sort((a, b) => a.price - b.price);
              });
              if (payload.eventType === 'INSERT') {
                toast.success(`خدمة جديدة: ${service.name}`);
              }
            } else {
              setServices(prev => prev.filter(s => s.id !== service.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setServices(prev => prev.filter(s => s.id !== (payload.old as Service).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter and sort services
  const filteredServices = services
    .filter(service => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getFeatures = (service: Service): string[] => {
    if (Array.isArray(service.features)) return service.features;
    return [];
  };

  const handleOrderClick = (service: Service) => {
    navigate(`/dashboard/services?serviceId=${service.id}`);
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesPageSkeleton title="خدمات التسويق الرقمي" color="blue" />
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-8" dir="rtl">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-4 sm:p-6 lg:p-8"
          >
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Animated gradient orbs */}
              <motion.div
                className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-400/20 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              
              {/* Floating icons */}
              {[TrendingUp, Target, BarChart3, Megaphone, LineChart].map((Icon, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white/10"
                  style={{
                    left: `${15 + i * 18}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 10, -10, 0],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                >
                  <Icon className="w-8 h-8 sm:w-12 sm:h-12" />
                </motion.div>
              ))}

              {/* Grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                  backgroundSize: '30px 30px',
                }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Top row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
                <Link 
                  to="/dashboard/our-services"
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs sm:text-sm group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>العودة للخدمات</span>
                </Link>
                <LiveIndicator />
              </div>

              {/* Title & Stats */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-6">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 mb-2"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                        خدمات التسويق الرقمي
                      </h1>
                      <p className="text-white/60 text-xs sm:text-sm">
                        حلول تسويقية متكاملة لنمو أعمالك
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2 sm:gap-3"
                >
                  <StatBadge icon={Layers} value={`${filteredServices.length}`} label="خدمة متاحة" delay={0.1} />
                  <StatBadge icon={Trophy} value="100%" label="نتائج مضمونة" delay={0.2} />
                  <StatBadge icon={Zap} value="24/7" label="دعم فني" delay={0.3} />
                </motion.div>
              </div>

              {/* Service categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex flex-wrap gap-2"
              >
                {marketingCategories.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat.id
                        ? "bg-white text-blue-600 shadow-lg"
                        : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                    }`}
                  >
                    <cat.icon className="w-3.5 h-3.5" />
                    {cat.name}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Featured Offers */}
          <FeaturedOffersSection category="digital" />

          {/* Why Digital Marketing Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {[
              { icon: Target, title: "استهداف دقيق", desc: "وصول لجمهورك المثالي", color: "from-blue-500 to-cyan-500" },
              { icon: BarChart3, title: "تحليلات متقدمة", desc: "قياس وتتبع الأداء", color: "from-indigo-500 to-purple-500" },
              { icon: TrendingUp, title: "نمو مستمر", desc: "زيادة المبيعات والأرباح", color: "from-emerald-500 to-teal-500" },
              { icon: Award, title: "جودة عالية", desc: "حملات احترافية", color: "from-amber-500 to-orange-500" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative group"
              >
                <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50 hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <CardContent className="p-4 sm:p-5 relative">
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg`}
                    >
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-sm sm:text-base mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="ابحث في خدمات التسويق..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-11 bg-card/80 backdrop-blur-sm border-border/50 rounded-xl focus:border-blue-500/50"
              />
            </div>

            {/* Sort & View */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[140px] sm:w-[160px] h-11 bg-card/80 backdrop-blur-sm border-border/50 rounded-xl">
                  <SlidersHorizontal className="w-4 h-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder="الترتيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">السعر: من الأقل</SelectItem>
                  <SelectItem value="price-desc">السعر: من الأعلى</SelectItem>
                  <SelectItem value="name">الاسم</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`h-9 px-3 rounded-lg ${viewMode === "grid" ? "bg-blue-500/10 text-blue-500" : ""}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-9 px-3 rounded-lg ${viewMode === "list" ? "bg-blue-500/10 text-blue-500" : ""}`}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Services Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              عرض <span className="font-bold text-foreground">{filteredServices.length}</span> خدمة
            </p>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs h-8"
              >
                مسح البحث
              </Button>
            )}
          </div>

          {/* Services Grid/List */}
          {filteredServices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">لا توجد خدمات</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {searchQuery ? "لم نجد خدمات تطابق بحثك" : "لا توجد خدمات تسويق رقمي متاحة حالياً"}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl"
                >
                  مسح البحث
                </Button>
              )}
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
            >
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service, index) => (
                  <DigitalServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    onOrder={handleOrderClick}
                    onViewDetails={(s) => {
                      setSelectedService(s);
                      setDetailsDialogOpen(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service, index) => (
                  <DigitalServiceListCard
                    key={service.id}
                    service={service}
                    index={index}
                    onOrder={handleOrderClick}
                    onViewDetails={(s) => {
                      setSelectedService(s);
                      setDetailsDialogOpen(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/20 p-6 sm:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-violet-500/5" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-right">
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  هل تحتاج استشارة تسويقية؟
                </h3>
                <p className="text-sm text-muted-foreground">
                  فريقنا جاهز لمساعدتك في اختيار الحل الأمثل لأعمالك
                </p>
              </div>
              <Button
                onClick={() => navigate("/dashboard/support")}
                className="bg-gradient-to-r from-blue-500 to-violet-500 hover:opacity-90 text-white rounded-xl px-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <MessageSquare className="w-4 h-4 ml-2" />
                تواصل معنا
              </Button>
            </div>
          </motion.div>
        </div>
      </PullToRefresh>

      {/* Service Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span>{selectedService?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-4 mt-4">
              {/* Price */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <span className="text-muted-foreground">السعر</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                  {selectedService.price.toFixed(2)} ر.س
                </span>
              </div>

              {/* Description */}
              {selectedService.description && (
                <div className="p-4 rounded-xl bg-muted/30">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    الوصف
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedService.description}
                  </p>
                </div>
              )}

              {/* Features */}
              {getFeatures(selectedService).length > 0 && (
                <div className="p-4 rounded-xl bg-muted/30">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    المميزات
                  </h4>
                  <div className="space-y-2">
                    {getFeatures(selectedService).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {selectedService.refill_enabled && (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="w-3 h-3" />
                    ضمان التعبئة
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  نتائج مضمونة
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" />
                  بدء فوري
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
              className="flex-1 rounded-xl"
            >
              إغلاق
            </Button>
            <Button
              onClick={() => {
                if (selectedService) {
                  handleOrderClick(selectedService);
                  setDetailsDialogOpen(false);
                }
              }}
              className="flex-1 bg-gradient-to-r from-blue-500 to-violet-500 hover:opacity-90 text-white rounded-xl"
            >
              <ShoppingCart className="w-4 h-4 ml-2" />
              اطلب الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClientDashboardLayout>
  );
};

export default ClientDigitalServices;
