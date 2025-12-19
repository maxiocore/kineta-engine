import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Package, 
  Loader2, 
  ShoppingCart, 
  Star, 
  Heart,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  Hash,
  DollarSign,
  Info,
  RefreshCw,
  Eye,
  ChevronUp,
  Sparkles,
  ArrowUpRight,
  Layers,
  Grid3X3,
  LayoutList,
  Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import SocialNetworkGrid from "@/components/services/SocialNetworkGrid";
import ServiceOrderDialog from "@/components/services/ServiceOrderDialog";
import ServiceDetailsSheet from "@/components/services/ServiceDetailsSheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
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
}

const ITEMS_PER_PAGE = 20;

// Service Card Component
const ServiceCard = ({ 
  service, 
  onOrder, 
  onViewDetails, 
  isFavorite, 
  onToggleFavorite,
  index 
}: { 
  service: Service; 
  onOrder: () => void; 
  onViewDetails: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  index: number;
}) => {
  const features = useMemo(() => {
    if (!service.features) return {};
    try {
      return typeof service.features === 'string' 
        ? JSON.parse(service.features) 
        : service.features;
    } catch {
      return {};
    }
  }, [service.features]);

  const hasRefill = features.refill !== false || service.refill_enabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div 
        className="relative h-full overflow-hidden rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-all duration-500 cursor-pointer"
        onClick={onViewDetails}
      >
        {/* Glass Effect Top */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        
        {/* Hover Glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <div className="relative p-4 sm:p-5 flex flex-col h-full">
          {/* Top Row: ID & Favorite */}
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
                isFavorite 
                  ? "bg-rose-500/15 text-rose-500" 
                  : "bg-muted/50 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </motion.button>

            <div className="flex items-center gap-2">
              {hasRefill && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Shield className="w-3 h-3" />
                  <span className="text-[10px] font-medium">ضمان</span>
                </div>
              )}
              <div className="px-2.5 py-1 rounded-lg bg-muted/60 border border-border/50">
                <span className="text-xs font-mono text-muted-foreground">#{service.external_service_id || '-'}</span>
              </div>
            </div>
          </div>

          {/* Service Name */}
          <h3 className="font-semibold text-sm sm:text-base leading-relaxed mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {service.name}
          </h3>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Price */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground mb-0.5">لكل 1000</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-primary">{service.price.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">$</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>تسليم فوري</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              variant="ghost"
              className="h-10 px-3 rounded-xl text-xs hover:bg-muted"
            >
              <Eye className="w-4 h-4 ml-1" />
              التفاصيل
            </Button>

            <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOrder();
                }}
                className="w-full h-10 rounded-xl font-semibold text-sm gap-2 bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="w-4 h-4" />
                اطلب الآن
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Category Section Component
const CategorySection = ({
  category,
  services,
  isExpanded,
  onToggle,
  onOrder,
  onViewDetails,
  favorites,
  onToggleFavorite,
  visibleCount,
  onLoadMore,
  isLoadingMore
}: {
  category: string;
  services: Service[];
  isExpanded: boolean;
  onToggle: () => void;
  onOrder: (service: Service) => void;
  onViewDetails: (service: Service) => void;
  favorites: string[];
  onToggleFavorite: (serviceId: string) => void;
  visibleCount: number;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}) => {
  const visibleServices = services.slice(0, visibleCount);
  const hasMore = services.length > visibleCount;
  const remainingCount = services.length - visibleCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm"
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">{category}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground">{services.length} خدمة</span>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-xs text-emerald-500">متاحة</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="h-7 px-3 text-xs font-medium">
                {services.length}
              </Badge>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t border-border/40">
            <div className="p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleServices.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    onOrder={() => onOrder(service)}
                    onViewDetails={() => onViewDetails(service)}
                    isFavorite={favorites.includes(service.id)}
                    onToggleFavorite={() => onToggleFavorite(service.id)}
                  />
                ))}
              </div>
              
              {hasMore && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6"
                >
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl gap-2 border-dashed"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadMore();
                    }}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري التحميل...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        عرض المزيد ({remainingCount} خدمة)
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

const ClientServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCategoryItems, setVisibleCategoryItems] = useState<Record<string, number>>({});
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
    setIsDetailsSheetOpen(true);
  };

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();

    // Realtime subscription for instant updates
    const servicesChannel = supabase
      .channel("services-realtime")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "services" 
      }, (payload) => {
        console.log("Service changed:", payload);
        handleServiceChange(payload);
      })
      .subscribe();

    const categoriesChannel = supabase
      .channel("categories-realtime")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "categories" 
      }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  const handleServiceChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setServices(prev => {
      switch (eventType) {
        case "INSERT":
          if (newRecord.status === "active") {
            toast.success("تمت إضافة خدمة جديدة!", { 
              description: newRecord.name,
              duration: 4000 
            });
            return [...prev, newRecord];
          }
          return prev;
          
        case "UPDATE":
          if (newRecord.status === "active") {
            return prev.map(s => s.id === newRecord.id ? newRecord : s);
          } else {
            return prev.filter(s => s.id !== newRecord.id);
          }
          
        case "DELETE":
          return prev.filter(s => s.id !== oldRecord.id);
          
        default:
          return prev;
      }
    });
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("status", "active")
      .order("category", { ascending: true });

    if (error) {
      toast.error("خطأ في جلب الخدمات");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    
    if (data) {
      setCategories(data);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchServices();
    setIsRefreshing(false);
    toast.success("تم تحديث الخدمات");
  };

  const getCategorySlug = (categoryName: string) => {
    const slugMap: Record<string, string> = {
      "Instagram": "instagram",
      "Facebook": "facebook",
      "Youtube": "youtube",
      "Twitter": "twitter",
      "TikTok": "tiktok",
      "Telegram": "telegram",
      "LinkedIn": "linkedin",
      "Spotify": "spotify",
      "SoundCloud": "soundcloud",
      "Website Traffic": "website-traffic",
      "Other": "other",
    };
    return slugMap[categoryName] || categoryName.toLowerCase().replace(/\s+/g, "-");
  };

  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      const slug = getCategorySlug(service.category);
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.external_service_id?.includes(searchQuery));
      
      const categorySlug = getCategorySlug(service.category);
      const matchesCategory = selectedCategory === "all" || categorySlug === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      if (!groups[service.category]) {
        groups[service.category] = [];
      }
      groups[service.category].push(service);
    });
    return groups;
  }, [filteredServices]);

  // Initialize visible items per category
  useEffect(() => {
    const initialVisible: Record<string, number> = {};
    Object.keys(groupedServices).forEach(category => {
      if (!visibleCategoryItems[category]) {
        initialVisible[category] = ITEMS_PER_PAGE;
      }
    });
    if (Object.keys(initialVisible).length > 0) {
      setVisibleCategoryItems(prev => ({ ...prev, ...initialVisible }));
    }
  }, [groupedServices]);

  const loadMoreItems = useCallback((category: string) => {
    setLoadingMore(category);
    setTimeout(() => {
      setVisibleCategoryItems(prev => ({
        ...prev,
        [category]: (prev[category] || ITEMS_PER_PAGE) + ITEMS_PER_PAGE
      }));
      setLoadingMore(null);
    }, 300);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const expandAllCategories = () => {
    setExpandedCategories(new Set(Object.keys(groupedServices)));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  const handleOrder = (service: Service) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول للطلب");
      return;
    }
    setSelectedService(service);
    setIsOrderDialogOpen(true);
  };

  // Auto-expand all categories on initial load
  useEffect(() => {
    if (Object.keys(groupedServices).length > 0 && expandedCategories.size === 0) {
      expandAllCategories();
    }
  }, [groupedServices]);

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Package className="w-10 h-10 text-primary-foreground" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 rounded-2xl border-2 border-dashed border-primary/30"
            />
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-medium mb-1">جاري تحميل الخدمات</p>
            <p className="text-sm text-muted-foreground">يرجى الانتظار...</p>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/40 p-6 sm:p-8"
        >
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-2xl" />
          
          {/* Floating Orbs */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-12 left-12 w-3 h-3 rounded-full bg-primary/40"
          />
          <motion.div
            animate={{ 
              y: [0, 10, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-12 right-24 w-2 h-2 rounded-full bg-accent/40"
          />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 shadow-xl shadow-primary/20 flex items-center justify-center shrink-0"
              >
                <Package className="w-full h-full text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">قائمة الخدمات</h1>
                <p className="text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    متصل
                  </span>
                  <span>•</span>
                  <span>{services.length} خدمة متاحة</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-xl gap-2 h-10"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                تحديث
              </Button>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/50">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{services.length}</span>
                <span className="text-xs text-muted-foreground">خدمة</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <SocialNetworkGrid
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                serviceCounts={serviceCounts}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Search & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن خدمة بالاسم أو الرقم..."
              className="pr-12 h-12 bg-card/50 backdrop-blur-sm border-border/40 rounded-xl text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={expandAllCategories}
                    className="h-12 w-12 rounded-xl"
                  >
                    <Layers className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>فتح الكل</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={collapseAllCategories}
                    className="h-12 w-12 rounded-xl"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>إغلاق الكل</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="h-12 px-4 flex items-center justify-center rounded-xl bg-card border border-border/40">
              <span className="text-sm">
                <span className="font-bold text-primary">{filteredServices.length}</span>
                <span className="text-muted-foreground mr-1">نتيجة</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Services List */}
        <AnimatePresence mode="wait">
          {filteredServices.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-border/40 bg-card/50">
                <CardContent className="py-20 text-center">
                  <motion.div
                    animate={{ 
                      y: [0, -5, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center"
                  >
                    <Package className="w-10 h-10 text-muted-foreground/50" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">لا توجد خدمات</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    {searchQuery || selectedCategory !== "all"
                      ? "لا توجد نتائج مطابقة لبحثك"
                      : "لا توجد خدمات متاحة حالياً"}
                  </p>
                  {(searchQuery || selectedCategory !== "all") && (
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                    >
                      إعادة تعيين البحث
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="services"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {Object.entries(groupedServices).map(([category, categoryServices], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.05 }}
                >
                  <CategorySection
                    category={category}
                    services={categoryServices}
                    isExpanded={expandedCategories.has(category)}
                    onToggle={() => toggleCategory(category)}
                    onOrder={handleOrder}
                    onViewDetails={handleViewDetails}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                    visibleCount={visibleCategoryItems[category] || ITEMS_PER_PAGE}
                    onLoadMore={() => loadMoreItems(category)}
                    isLoadingMore={loadingMore === category}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service Details Sheet */}
        <ServiceDetailsSheet
          service={selectedService}
          isOpen={isDetailsSheetOpen}
          onClose={() => {
            setIsDetailsSheetOpen(false);
            setSelectedService(null);
          }}
          onOrder={handleOrder}
          isFavorite={selectedService ? favorites.includes(selectedService.id) : false}
          onToggleFavorite={toggleFavorite}
        />

        {/* Order Dialog */}
        <ServiceOrderDialog
          service={selectedService}
          open={isOrderDialogOpen}
          onOpenChange={(open) => {
            setIsOrderDialogOpen(open);
            if (!open) setSelectedService(null);
          }}
          userId={user?.id || null}
        />

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-6 left-6 z-50"
            >
              <Button
                size="icon"
                className="h-12 w-12 rounded-2xl shadow-lg bg-primary hover:bg-primary/90"
                onClick={scrollToTop}
              >
                <ChevronUp className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServices;
