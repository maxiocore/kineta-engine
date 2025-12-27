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
  Check,
  Globe,
  RotateCcw,
  CreditCard
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

// Main section tabs
const MAIN_SECTIONS = [
  { id: 'social', label: 'مواقع التواصل الاجتماعي', icon: Globe },
  { id: 'reorder', label: 'إعادة طلب', icon: RotateCcw },
  { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCard },
  { id: 'favorites', label: 'المفضلة', icon: Heart },
];

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

// Category Section Component with Infinite Scroll
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
  isLoadingMore,
  hasMore
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
  hasMore: boolean;
}) => {
  const visibleServices = services.slice(0, visibleCount);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!isExpanded || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && hasMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const element = loadMoreTriggerRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [isExpanded, hasMore, isLoadingMore, onLoadMore]);

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
              
              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div 
                  ref={loadMoreTriggerRef}
                  className="flex items-center justify-center py-8"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
                    >
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground">
                      جاري تحميل المزيد...
                    </span>
                  </motion.div>
                </div>
              )}
              
              {/* End of list indicator */}
              {!hasMore && visibleServices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center py-6 mt-4 border-t border-border/30"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">تم عرض جميع الخدمات ({services.length})</span>
                  </div>
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
  const [activeMainSection, setActiveMainSection] = useState("social");
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

  const getCategorySlug = useCallback((service: Service) => {
    // Use category_id to find the correct category slug
    if (service.category_id) {
      const category = categories.find(c => c.id === service.category_id);
      if (category) {
        return category.slug;
      }
    }
    
    // Fallback to text-based matching for services without category_id
    const categoryText = service.category.toLowerCase();
    const slugMap: Record<string, string> = {
      "instagram": "instagram",
      "facebook": "facebook",
      "youtube": "youtube",
      "twitter": "twitter",
      "x (": "twitter",
      "tiktok": "tiktok",
      "telegram": "telegram",
      "linkedin": "linkedin",
      "spotify": "spotify",
      "soundcloud": "soundcloud",
      "website": "website-traffic",
      "traffic": "website-traffic",
    };
    
    for (const [key, slug] of Object.entries(slugMap)) {
      if (categoryText.includes(key)) {
        return slug;
      }
    }
    
    return "other";
  }, [categories]);

  // Filter out design and development services from social media section
  const isDesignOrDevService = useCallback((service: Service) => {
    const name = service.name.toLowerCase();
    const category = service.category.toLowerCase();
    const designKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية'];
    const devKeywords = ['برمجة', 'تطوير', 'موقع', 'تطبيق', 'dev', 'development', 'website', 'app'];
    
    return designKeywords.some(k => name.includes(k) || category.includes(k)) ||
           devKeywords.some(k => name.includes(k) || category.includes(k));
  }, []);

  // Only count social media services (exclude design and dev)
  const socialMediaServices = useMemo(() => {
    return services.filter(service => !isDesignOrDevService(service));
  }, [services, isDesignOrDevService]);

  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    socialMediaServices.forEach(service => {
      const slug = getCategorySlug(service);
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [socialMediaServices, getCategorySlug]);

  const filteredServices = useMemo(() => {
    return socialMediaServices.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.external_service_id?.includes(searchQuery));
      
      const categorySlug = getCategorySlug(service);
      const matchesCategory = selectedCategory === "all" || categorySlug === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [socialMediaServices, searchQuery, selectedCategory, getCategorySlug]);

  // Get category display name in Arabic
  const getCategoryDisplayName = useCallback((service: Service) => {
    if (service.category_id) {
      const category = categories.find(c => c.id === service.category_id);
      if (category) {
        return category.name_ar;
      }
    }
    return service.category;
  }, [categories]);

  const groupedServices = useMemo(() => {
    // Wait for categories to load before grouping
    if (categories.length === 0) {
      return {};
    }
    
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      const displayName = getCategoryDisplayName(service);
      if (!groups[displayName]) {
        groups[displayName] = [];
      }
      groups[displayName].push(service);
    });
    return groups;
  }, [filteredServices, getCategoryDisplayName, categories]);

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
      <div className="space-y-4 sm:space-y-6 px-1 sm:px-0" dir="rtl">
        {/* Main Section Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeMainSection} onValueChange={setActiveMainSection} className="w-full">
            <TabsList className="w-full h-auto p-1 sm:p-1.5 bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl sm:rounded-2xl flex flex-wrap justify-start gap-1">
              {MAIN_SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className={cn(
                    "flex-1 min-w-[80px] sm:min-w-[140px] h-9 sm:h-12 rounded-lg sm:rounded-xl gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium transition-all duration-300",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
                  )}
                >
                  <section.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">{section.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Conditional Content Based on Active Section */}
        <AnimatePresence mode="wait">
          {activeMainSection === 'favorites' ? (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-border/40 bg-card/50">
                <CardContent className="p-4 sm:p-8 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-rose-500/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">المفضلة</h3>
                  <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                    {favorites.length > 0 
                      ? `لديك ${favorites.length} خدمة في المفضلة`
                      : "لم تقم بإضافة أي خدمات للمفضلة بعد"}
                  </p>
                  {favorites.length === 0 && (
                    <Button
                      variant="outline"
                      className="rounded-xl text-sm"
                      onClick={() => setActiveMainSection('social')}
                    >
                      تصفح الخدمات
                    </Button>
                  )}
                  {favorites.length > 0 && (
                    <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {services
                        .filter(s => favorites.includes(s.id))
                        .map((service, index) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            index={index}
                            onOrder={() => handleOrder(service)}
                            onViewDetails={() => handleViewDetails(service)}
                            isFavorite={true}
                            onToggleFavorite={() => toggleFavorite(service.id)}
                          />
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : activeMainSection === 'reorder' ? (
            <motion.div
              key="reorder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-border/40 bg-card/50">
                <CardContent className="p-4 sm:p-8 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">إعادة طلب</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    يمكنك إعادة طلب خدماتك السابقة من هنا
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : activeMainSection === 'subscriptions' ? (
            <motion.div
              key="subscriptions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-border/40 bg-card/50">
                <CardContent className="p-4 sm:p-8 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-violet-500/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-violet-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">الاشتراكات</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    خدمات الاشتراكات الشهرية والسنوية
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Categories Grid */}
              <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <SocialNetworkGrid
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    serviceCounts={serviceCounts}
                  />
                </CardContent>
              </Card>

              {/* Search & Controls */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن خدمة..."
                    className="pr-10 sm:pr-12 h-10 sm:h-12 bg-card/50 backdrop-blur-sm border-border/40 rounded-lg sm:rounded-xl text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 justify-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={expandAllCategories}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl"
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
              </div>

              {/* Services List */}
              {filteredServices.length === 0 ? (
                <Card className="border-border/40 bg-card/50">
                  <CardContent className="py-20 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/50" />
                    </div>
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
              ) : (
                <div className="space-y-4">
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
                        hasMore={categoryServices.length > (visibleCategoryItems[category] || ITEMS_PER_PAGE)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
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
