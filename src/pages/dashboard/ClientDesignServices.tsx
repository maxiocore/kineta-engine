import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Palette,
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
  Layers,
  PenTool,
  Image,
  Globe,
  Rocket,
  Users,
  MessageSquare,
  Target,
  SlidersHorizontal,
  TrendingUp,
  Eye,
  Crown,
  Share2,
  Video,
  BookOpen,
  Package,
  Megaphone,
  Brush,
  Lightbulb,
  Heart,
  CheckCircle2,
  MousePointer2,
  Briefcase,
  Utensils,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Car,
  Home,
  Plane,
  Music,
  Camera,
  Play,
  Smartphone,
  ThumbsUp,
  Frame,
  FileImage,
  Gem,
  Gift,
  Coffee,
  ShoppingBag,
  Presentation,
  Wallet,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ServicesPageSkeleton from "@/components/dashboard/ServicesPageSkeleton";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

// ===== Design Categories Data =====
const mainCategories = [
  {
    id: "identity",
    name: "الهوية البصرية",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    description: "بناء هوية تجارية قوية ومميزة",
    keywords: ["شعار", "logo", "brand", "هوية", "بطاقة", "أوراق رسمية"]
  },
  {
    id: "social",
    name: "سوشيال ميديا",
    icon: Share2,
    color: "from-pink-500 to-rose-600",
    description: "محتوى بصري جذاب لمنصاتك",
    keywords: ["انستقرام", "فيسبوك", "تويتر", "تيك توك", "يوتيوب", "ستوري", "سوشيال", "social"]
  },
  {
    id: "marketing",
    name: "التسويق الإعلاني",
    icon: Megaphone,
    color: "from-purple-500 to-violet-600",
    description: "حملات إعلانية تحقق النتائج",
    keywords: ["بانر", "فلاير", "بروشور", "إعلان", "بوستر", "رول أب"]
  },
  {
    id: "motion",
    name: "موشن جرافيك",
    icon: Video,
    color: "from-cyan-500 to-blue-600",
    description: "فيديوهات متحركة احترافية",
    keywords: ["موشن", "فيديو", "انيميشن", "إنترو", "متحرك", "motion"]
  },
  {
    id: "print",
    name: "المطبوعات",
    icon: BookOpen,
    color: "from-emerald-500 to-teal-600",
    description: "تصاميم مطبوعة عالية الجودة",
    keywords: ["كتالوج", "مجلة", "تقرير", "قائمة", "كتيب", "دعوة", "مطبوع"]
  },
  {
    id: "packaging",
    name: "التغليف والتعبئة",
    icon: Package,
    color: "from-orange-500 to-red-600",
    description: "عبوات جذابة تميز منتجاتك",
    keywords: ["علبة", "تغليف", "ملصق", "كيس", "عبوة", "زجاجة", "packaging"]
  }
];

// ===== Industry Categories =====
const industries = [
  { name: "المطاعم والكافيهات", icon: Utensils, color: "bg-orange-500/10 text-orange-500" },
  { name: "الرياضة واللياقة", icon: Dumbbell, color: "bg-green-500/10 text-green-500" },
  { name: "التعليم والتدريب", icon: GraduationCap, color: "bg-blue-500/10 text-blue-500" },
  { name: "الصحة والجمال", icon: HeartPulse, color: "bg-pink-500/10 text-pink-500" },
  { name: "السيارات", icon: Car, color: "bg-slate-500/10 text-slate-500" },
  { name: "العقارات", icon: Home, color: "bg-amber-500/10 text-amber-500" },
  { name: "السفر والسياحة", icon: Plane, color: "bg-cyan-500/10 text-cyan-500" },
  { name: "الموسيقى والفنون", icon: Music, color: "bg-purple-500/10 text-purple-500" }
];

// ===== 3D Card Component =====
const Card3D = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);
  
  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={cn("transition-all duration-200", className)}
    >
      {children}
    </motion.div>
  );
};

// ===== Floating Elements =====
const FloatingElement = ({ delay, duration, children, className }: { delay: number; duration: number; children: React.ReactNode; className?: string }) => (
  <motion.div
    animate={{
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// ===== Helper function to extract delivery time from features =====
const getDeliveryTime = (features: any): string => {
  if (!Array.isArray(features)) return "24-48 ساعة";
  
  for (const feature of features) {
    if (typeof feature === 'string') {
      // Check for patterns like "تسليم خلال 48 ساعة" or "24 ساعة" or "يوم واحد"
      const hourMatch = feature.match(/(\d+)\s*ساع/);
      if (hourMatch) {
        const hours = parseInt(hourMatch[1]);
        if (hours <= 24) return `${hours} ساعة`;
        if (hours <= 48) return `${hours} ساعة`;
        return `${Math.ceil(hours / 24)} أيام`;
      }
      
      const dayMatch = feature.match(/(\d+)\s*(يوم|أيام)/);
      if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        return days === 1 ? "يوم واحد" : `${days} أيام`;
      }
      
      if (feature.includes("تسليم سريع")) return "24 ساعة";
      if (feature.includes("تسليم فوري")) return "12 ساعة";
    }
  }
  
  return "24-48 ساعة";
};

// ===== Service Card Component =====
const DesignServiceCard = ({ 
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
  
  const icons = [PenTool, Palette, Image, Layers, Globe, Sparkles, Crown, Video, Package];
  const IconComponent = icons[index % icons.length];
  const features = Array.isArray(service.features) ? service.features.slice(0, 3) : [];
  const deliveryTime = getDeliveryTime(service.features);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group h-full"
    >
      <Card className="h-full relative overflow-hidden border-2 border-border/50 bg-card/95 backdrop-blur-sm hover:border-rose-500/30 transition-all duration-500 rounded-2xl hover:shadow-2xl hover:shadow-rose-500/10">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-violet-500/5 to-pink-500/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-violet-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="relative z-10 p-5 h-full flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <motion.div 
              animate={{ rotate: isHovered ? 5 : 0, scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-violet-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
                <IconComponent className="w-7 h-7 text-white" />
              </div>
            </motion.div>

            <div className="text-left flex flex-col items-end gap-2">
              <motion.div 
                animate={{ scale: isHovered ? 1.05 : 1 }}
                className="flex items-baseline gap-1"
              >
                <span className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">
                  {service.price.toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">ر.س</span>
              </motion.div>
              
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {index < 3 && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    مميز
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

          <h3 className="font-bold text-base leading-snug mb-2 group-hover:text-rose-500 transition-colors line-clamp-2">
            {service.name}
          </h3>

          {service.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-3 leading-relaxed flex-grow">
              {service.description}
            </p>
          )}

          {features.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                  <span className="text-muted-foreground truncate">{feature}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mb-4 mt-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>التسليم: {deliveryTime}</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(service)}
              className="flex-1 rounded-xl h-10 text-xs border-border/50 hover:border-rose-500/50 hover:bg-rose-500/5"
            >
              <Eye className="w-3.5 h-3.5 ml-1.5" />
              التفاصيل
            </Button>
            <Button
              size="sm"
              onClick={() => onOrder(service)}
              className="flex-1 bg-gradient-to-r from-rose-500 via-violet-500 to-pink-500 hover:opacity-90 text-white rounded-xl h-10 text-xs shadow-md hover:shadow-lg transition-shadow"
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

// ===== List View Card =====
const DesignServiceListCard = ({ 
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
  const icons = [PenTool, Palette, Image, Layers, Globe, Sparkles];
  const IconComponent = icons[index % icons.length];
  const deliveryTime = getDeliveryTime(service.features);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-2 border-border/50 bg-card/95 backdrop-blur-sm hover:border-rose-500/30 transition-all duration-300 rounded-xl hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-md shrink-0">
              <IconComponent className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-base truncate group-hover:text-rose-500 transition-colors">
                  {service.name}
                </h3>
                <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent shrink-0">
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
                      <Star className="w-2.5 h-2.5 fill-current ml-0.5" />
                      مميز
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {deliveryTime}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(service)}
                    className="h-8 px-2 text-xs rounded-lg hover:bg-rose-500/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onOrder(service)}
                    className="h-8 px-3 bg-gradient-to-r from-rose-500 to-violet-500 hover:opacity-90 text-white rounded-lg text-xs"
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

const ClientDesignServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("price-asc");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const designKeywords = ["design", "graphic", "logo", "brand", "تصميم", "شعار", "هوية", "جرافيك", "بوستر", "فوتوشوب", "illustrator", "بانر", "فلاير", "موشن", "سوشيال"];

  const { data: initialServices, isLoading, refetch } = useQuery({
    queryKey: ["design-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      
      if (error) throw error;
      
      return (data as Service[]).filter(service => {
        // Include services with category 'design' OR matching design keywords
        if (service.category === 'design') return true;
        
        const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
        return designKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
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
      .channel('design_services_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Filter services by category and search
  const getFilteredServices = () => {
    let filtered = services;

    // Filter by selected category
    if (selectedCategory) {
      const category = mainCategories.find(c => c.id === selectedCategory);
      if (category) {
        filtered = filtered.filter(service => {
          const searchText = `${service.name} ${service.description || ''}`.toLowerCase();
          return category.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
        });
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    return filtered.sort((a, b) => {
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
  };

  const filteredServices = getFilteredServices();

  const getFeatures = (service: Service): string[] => {
    if (Array.isArray(service.features)) return service.features;
    return [];
  };

  const handleOrderClick = (service: Service) => {
    navigate(`/dashboard/design-services/order?serviceId=${service.id}`);
  };

  const stats = [
    { value: `${services.length}`, label: "خدمة متاحة", icon: Activity },
    { value: "24-48", label: "ساعة تسليم", icon: Rocket },
    { value: "+50", label: "مصمم محترف", icon: Users },
    { value: "99%", label: "نسبة الرضا", icon: Heart }
  ];

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesPageSkeleton title="خدمات التصميم" color="purple" />
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="space-y-6 lg:space-y-8 pb-8" dir="rtl">
          
          {/* ===== HERO SECTION ===== */}
          <section className="relative overflow-hidden rounded-3xl">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-violet-600 to-purple-700" />
            
            {/* Animated Orbs */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], x: [0, 50, 0] }}
              transition={{ duration: 15, repeat: Infinity }}
              className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2], x: [0, -40, 0] }}
              transition={{ duration: 12, repeat: Infinity }}
              className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"
            />

            {/* Floating Elements */}
            <FloatingElement delay={0} duration={6} className="absolute top-8 left-8 hidden lg:block">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
            </FloatingElement>
            <FloatingElement delay={1} duration={7} className="absolute bottom-12 right-20 hidden lg:block">
              <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Brush className="w-5 h-5 text-white" />
              </div>
            </FloatingElement>

            <div className="relative z-10 p-6 lg:p-10">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 flex-wrap mb-3"
                  >
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      <Sparkles className="w-3 h-3 ml-1 animate-pulse" />
                      استوديو التصميم الإبداعي
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-0">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1"
                      />
                      متاح الآن
                    </Badge>
                  </motion.div>
                  
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                    حوّل أفكارك إلى تصاميم استثنائية
                  </h1>
                  <p className="text-white/70 text-sm md:text-base max-w-xl hidden md:block">
                    اكتشف أكثر من {services.length} خدمة تصميم في 6 فئات متنوعة
                  </p>
                </div>

                <Link to="/dashboard/our-services">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors border border-white/10"
                  >
                    <ArrowLeft className="w-6 h-6 text-white" />
                  </motion.div>
                </Link>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center"
                  >
                    <stat.icon className="w-5 h-5 mx-auto mb-1 text-white/80" />
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                    <p className="text-white/60 text-xs">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20"
              >
                <Wallet className="w-5 h-5 text-white" />
                <span className="text-white/80 text-sm">رصيدك:</span>
                <span className="font-bold text-white text-lg">{balance.toFixed(2)} ر.س</span>
              </motion.div>
            </div>
          </section>

          {/* ===== CATEGORIES SECTION ===== */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-4"
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                الأقسام الرئيسية
              </h2>
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  عرض الكل
                </Button>
              )}
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {mainCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  className={cn(
                    "cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 text-center",
                    selectedCategory === category.id
                      ? "border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/20"
                      : "border-border/50 bg-card hover:border-rose-500/30 hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    category.color
                  )}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{category.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== SEARCH & FILTERS ===== */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  placeholder="ابحث عن خدمة تصميم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-11 text-sm rounded-xl bg-background/50 border-border/50 focus:border-rose-500/50"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[140px] h-11 rounded-xl text-sm bg-background/50 border-border/50">
                    <SlidersHorizontal className="w-3.5 h-3.5 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="price-asc">السعر: الأقل</SelectItem>
                    <SelectItem value="price-desc">السعر: الأعلى</SelectItem>
                    <SelectItem value="name">الاسم</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={`h-9 w-9 rounded-lg transition-colors ${
                      viewMode === "grid" 
                        ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white shadow-md" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={`h-9 w-9 rounded-lg transition-colors ${
                      viewMode === "list" 
                        ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white shadow-md" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <span className="text-xs text-muted-foreground">
                عرض {filteredServices.length} من {services.length} خدمة
                {selectedCategory && ` - ${mainCategories.find(c => c.id === selectedCategory)?.name}`}
              </span>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  مسح البحث
                </Button>
              )}
            </div>
          </motion.div>

          {/* ===== SERVICES GRID/LIST ===== */}
          {filteredServices.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Palette className="w-12 h-12 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">لا توجد خدمات تصميم</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {searchQuery || selectedCategory 
                  ? "لم يتم العثور على خدمات تطابق البحث" 
                  : "سيتم إضافة خدمات التصميم قريباً"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key={`${viewMode}-${selectedCategory}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`grid gap-4 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                }`}
              >
                {filteredServices.map((service, index) => (
                  viewMode === "grid" ? (
                    <DesignServiceCard
                      key={service.id}
                      service={service}
                      index={index}
                      onOrder={handleOrderClick}
                      onViewDetails={(s) => {
                        setSelectedService(s);
                        setDetailsDialogOpen(true);
                      }}
                    />
                  ) : (
                    <DesignServiceListCard
                      key={service.id}
                      service={service}
                      index={index}
                      onOrder={handleOrderClick}
                      onViewDetails={(s) => {
                        setSelectedService(s);
                        setDetailsDialogOpen(true);
                      }}
                    />
                  )
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ===== INDUSTRIES SECTION ===== */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-6"
            >
              <Badge className="mb-3 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                <Briefcase className="w-3.5 h-3.5 ml-1" />
                القطاعات
              </Badge>
              <h2 className="text-xl font-bold">
                نصمم لـ <span className="text-emerald-500">جميع القطاعات</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {industries.map((industry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-emerald-500/30 hover:shadow-md transition-all text-center cursor-pointer group"
                >
                  <div className={cn(
                    "w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    industry.color
                  )}>
                    <industry.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">{industry.name}</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== WHY CHOOSE US ===== */}
          <section>
            <h2 className="text-lg font-bold text-center mb-6">
              لماذا تختار خدمات التصميم لدينا؟
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Target, title: "تصميم هادف", desc: "نفهم أهدافك ونصمم لتحقيقها" },
                { icon: Zap, title: "سرعة التنفيذ", desc: "نلتزم بمواعيد التسليم" },
                { icon: Sparkles, title: "إبداع متجدد", desc: "أفكار مبتكرة ومميزة" },
                { icon: Shield, title: "ضمان الرضا", desc: "نعمل حتى تكون راضياً" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -3 }}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-rose-500/30 hover:shadow-md transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/15 to-violet-500/15 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== DETAILS DIALOG ===== */}
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl" dir="rtl">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Palette className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">{selectedService?.name}</DialogTitle>
                    <p className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">
                      {selectedService?.price.toFixed(0)} ر.س
                    </p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedService?.description && (
                  <div className="p-4 rounded-xl bg-muted/50">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      وصف الخدمة
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedService.description}
                    </p>
                  </div>
                )}

                {selectedService && getFeatures(selectedService).length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/5 to-violet-500/5 border border-rose-500/10">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-rose-500" />
                      مميزات الخدمة
                    </h4>
                    <div className="grid gap-2">
                      {getFeatures(selectedService).map((feature, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-2 p-2 rounded-lg bg-card/50"
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-[10px] text-muted-foreground">مدة التسليم</p>
                      <p className="font-bold text-sm">{selectedService ? getDeliveryTime(selectedService.features) : "24-48 ساعة"}</p>
                    </div>
                    <div className="text-center">
                      <MessageSquare className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <p className="text-[10px] text-muted-foreground">تعديلات</p>
                      <p className="font-bold text-sm">غير محدودة</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="rounded-xl flex-1 sm:flex-none">
                  إغلاق
                </Button>
                <Button
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    if (selectedService) {
                      handleOrderClick(selectedService);
                    }
                  }}
                  className="gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 flex-1 sm:flex-none"
                >
                  <ShoppingCart className="w-4 h-4" />
                  اطلب الآن
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

export default ClientDesignServices;
