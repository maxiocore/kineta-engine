import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Filter,
  SlidersHorizontal,
  TrendingUp,
  Heart,
  Eye,
  ArrowUpRight,
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

// Modern Design Service Card
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
  
  const icons = [PenTool, Palette, Image, Layers, Globe, Sparkles];
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
      <Card className="h-full relative overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-500 rounded-2xl hover:shadow-xl hover:shadow-purple-500/5">
        {/* Gradient Overlay on Hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-pink-500/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="relative z-10 p-4 sm:p-5 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Icon */}
            <motion.div 
              animate={{ rotate: isHovered ? 5 : 0, scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            </motion.div>

            {/* Price & Badges */}
            <div className="text-left flex flex-col items-end gap-2">
              <motion.div 
                animate={{ scale: isHovered ? 1.05 : 1 }}
                className="flex items-baseline gap-1"
              >
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
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

          {/* Service Name */}
          <h3 className="font-bold text-sm sm:text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
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

          {/* Delivery Info */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mb-4 mt-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>التسليم: 24-48 ساعة</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(service)}
              className="flex-1 rounded-xl h-9 sm:h-10 text-xs border-border/50 hover:border-purple-500/50 hover:bg-purple-500/5"
            >
              <Eye className="w-3.5 h-3.5 ml-1.5" />
              التفاصيل
            </Button>
            <Button
              size="sm"
              onClick={() => onOrder(service)}
              className="flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:opacity-90 text-white rounded-xl h-9 sm:h-10 text-xs shadow-md hover:shadow-lg transition-shadow"
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <Card className="relative overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 rounded-xl hover:shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-md shrink-0">
              <IconComponent className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent shrink-0">
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
                    24-48 ساعة
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(service)}
                    className="h-8 px-2 text-xs rounded-lg hover:bg-purple-500/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onOrder(service)}
                    className="h-8 px-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white rounded-lg text-xs"
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

  const designKeywords = ["design", "graphic", "logo", "brand", "تصميم", "شعار", "هوية", "جرافيك", "بوستر", "فوتوشوب", "illustrator"];

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
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const service = payload.new as Service;
            const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
            const isDesignService = designKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
            
            if (service.status === 'active' && isDesignService) {
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
    navigate(`/dashboard/design-services/order?serviceId=${service.id}`);
  };

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
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-8" dir="rtl">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 p-4 sm:p-6 lg:p-8"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-40 sm:w-72 h-40 sm:h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 sm:w-96 h-60 sm:h-96 bg-purple-900/30 rounded-full blur-3xl translate-x-1/4 translate-y-1/3" />
            
            {/* Floating Icons */}
            <motion.div 
              className="absolute top-4 left-4 opacity-15 hidden md:block"
              animate={{ y: [0, -8, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Palette className="w-12 h-12 text-white" />
            </motion.div>
            <motion.div 
              className="absolute bottom-8 left-1/4 opacity-15 hidden md:block"
              animate={{ y: [0, 8, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            >
              <PenTool className="w-10 h-10 text-white" />
            </motion.div>
            
            <div className="relative z-10">
              {/* Top Row */}
              <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                    <LiveIndicator />
                    <Badge className="bg-white/15 text-white border-0 text-[10px] sm:text-xs">
                      <TrendingUp className="w-3 h-3 ml-1" />
                      الأكثر طلباً
                    </Badge>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                    خدمات التصميم الإبداعي
                  </h1>
                  <p className="text-white/70 text-xs sm:text-sm max-w-lg hidden sm:block">
                    نحول أفكارك إلى تصاميم مبهرة تعكس هوية علامتك التجارية بأعلى جودة
                  </p>
                </div>
                
                <Link to="/dashboard/our-services">
                  <motion.div 
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors border border-white/10"
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                </Link>
              </div>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <StatBadge icon={Activity} value={`${services.length}`} label="خدمة متاحة" delay={0.1} />
                <StatBadge icon={Rocket} value="24-48 ساعة" label="وقت التسليم" delay={0.2} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border border-white/20"
                >
                  <span className="text-white/80 text-xs">رصيدك:</span>
                  <span className="font-bold text-white text-sm sm:text-base">{balance.toFixed(2)} ر.س</span>
                </motion.div>
              </div>

              {/* Quick Features - Desktop Only */}
              <div className="hidden lg:grid grid-cols-4 gap-3 mt-6">
                {[
                  { icon: Rocket, label: "تسليم سريع", value: "24-48 ساعة" },
                  { icon: Shield, label: "ضمان الجودة", value: "100%" },
                  { icon: Users, label: "عملاء سعداء", value: "+1000" },
                  { icon: Award, label: "مصممين محترفين", value: "+50" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center border border-white/10"
                  >
                    <stat.icon className="w-5 h-5 text-white/80 mx-auto mb-1" />
                    <p className="text-white font-bold text-sm">{stat.value}</p>
                    <p className="text-white/50 text-[10px]">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Search & Filters Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-3 sm:p-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  placeholder="ابحث عن خدمة تصميم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10 sm:h-11 text-sm rounded-xl bg-background/50 border-border/50 focus:border-purple-500/50 placeholder:text-muted-foreground/50"
                />
              </div>
              
              {/* Sort & View Controls */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[130px] sm:w-[150px] h-10 sm:h-11 rounded-xl text-xs sm:text-sm bg-background/50 border-border/50">
                    <SlidersHorizontal className="w-3.5 h-3.5 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="price-asc">السعر: الأقل</SelectItem>
                    <SelectItem value="price-desc">السعر: الأعلى</SelectItem>
                    <SelectItem value="name">الاسم</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-colors ${
                      viewMode === "grid" 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-colors ${
                      viewMode === "list" 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <span className="text-xs text-muted-foreground">
                عرض {filteredServices.length} من {services.length} خدمة
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

          {/* Services Grid/List */}
          {filteredServices.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 sm:py-20"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <Palette className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">لا توجد خدمات تصميم</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto px-4">
                {searchQuery ? "لم يتم العثور على خدمات تطابق البحث" : "سيتم إضافة خدمات التصميم قريباً"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key={viewMode}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`grid gap-3 sm:gap-4 ${
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

          {/* Why Choose Us Section */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4 sm:mb-6">
              لماذا تختار خدمات التصميم لدينا؟
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {[
                { icon: Target, title: "تصميم هادف", desc: "نفهم أهدافك ونصمم لتحقيقها" },
                { icon: Zap, title: "سرعة التنفيذ", desc: "نلتزم بمواعيد التسليم" },
                { icon: Sparkles, title: "إبداع متجدد", desc: "أفكار مبتكرة ومميزة" },
                { icon: Shield, title: "ضمان الرضا", desc: "نعمل حتى تكون راضياً" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileHover={{ y: -3 }}
                  className="p-3 sm:p-4 rounded-xl bg-card border border-border/50 hover:border-purple-500/30 hover:shadow-md transition-all text-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm mb-1">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Details Dialog */}
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl" dir="rtl">
              <DialogHeader>
                <div className="flex items-center gap-3 sm:gap-4 mb-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Palette className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg">{selectedService?.name}</DialogTitle>
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {selectedService?.price.toFixed(0)} ر.س
                    </p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedService?.description && (
                  <div className="p-3 sm:p-4 rounded-xl bg-muted/50">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      وصف الخدمة
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {selectedService.description}
                    </p>
                  </div>
                )}

                {selectedService && getFeatures(selectedService).length > 0 && (
                  <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-500" />
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
                          <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          </div>
                          <span className="text-xs sm:text-sm">{feature}</span>
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
                      <p className="font-bold text-sm">24-48 ساعة</p>
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
                  className="gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-1 sm:flex-none"
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
