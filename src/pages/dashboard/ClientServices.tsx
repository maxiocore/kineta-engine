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
  ChevronUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  const observerRefs = useRef<Record<string, IntersectionObserver>>({});
  const loadMoreRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    // Simulate slight delay for smooth UX
    setTimeout(() => {
      setVisibleCategoryItems(prev => ({
        ...prev,
        [category]: (prev[category] || ITEMS_PER_PAGE) + ITEMS_PER_PAGE
      }));
      setLoadingMore(null);
    }, 300);
  }, []);

  const getVisibleServices = useCallback((category: string, allServices: Service[]) => {
    const visibleCount = visibleCategoryItems[category] || ITEMS_PER_PAGE;
    return allServices.slice(0, visibleCount);
  }, [visibleCategoryItems]);

  const hasMoreItems = useCallback((category: string, allServices: Service[]) => {
    const visibleCount = visibleCategoryItems[category] || ITEMS_PER_PAGE;
    return allServices.length > visibleCount;
  }, [visibleCategoryItems]);

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

  const checkIsFavorite = (serviceId: string) => {
    return favorites.includes(serviceId);
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse" />
            <Loader2 className="w-8 h-8 animate-spin text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground animate-pulse">جاري تحميل الخدمات...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/10 p-6"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent p-3 shadow-lg shadow-primary/20">
                <Package className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">قائمة الخدمات</h1>
                <p className="text-muted-foreground text-sm">تحديث لحظي • اختر خدمتك وابدأ الآن</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20"
              >
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-success">متصل مباشر</span>
              </motion.div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-xl gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                تحديث
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{services.length} خدمة</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Network Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-border/50 overflow-hidden">
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
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الرقم أو الوصف..."
              className="pr-12 h-12 bg-card/50 backdrop-blur-sm border-border/50 rounded-xl text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAllCategories}
              className="rounded-xl text-xs"
            >
              فتح الكل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAllCategories}
              className="rounded-xl text-xs"
            >
              إغلاق الكل
            </Button>
            <div className="flex items-center justify-center px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <span className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{filteredServices.length}</span> نتيجة
              </span>
            </div>
          </div>
        </motion.div>

        {/* Services Table */}
        <AnimatePresence mode="wait">
          {filteredServices.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass border-border/50">
                <CardContent className="py-20 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">لا توجد خدمات</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {searchQuery || selectedCategory !== "all"
                      ? "لا توجد نتائج مطابقة للبحث"
                      : "لا توجد خدمات متاحة حالياً"}
                  </p>
                  {(searchQuery || selectedCategory !== "all") && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                    >
                      إعادة تعيين
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
                  transition={{ delay: categoryIndex * 0.03 }}
                >
                  <Collapsible
                    open={expandedCategories.has(category)}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <Card className="glass border-border/50 overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-right">
                              <h3 className="font-bold text-base sm:text-lg">{category}</h3>
                              <p className="text-xs text-muted-foreground">{categoryServices.length} خدمة متاحة</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                              {categoryServices.length}
                            </Badge>
                            <ChevronDown className={cn(
                              "w-5 h-5 text-muted-foreground transition-transform duration-300",
                              expandedCategories.has(category) && "rotate-180"
                            )} />
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t border-border/50">
                          {/* Services Grid - RTL Optimized */}
                          <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            {getVisibleServices(category, categoryServices).map((service, index) => (
                              <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                whileHover={{ y: -2, scale: 1.01 }}
                                className="group relative"
                              >
                                <div 
                                  className="relative overflow-hidden rounded-2xl border border-border/50 hover:border-primary/40 bg-gradient-to-br from-card via-card/95 to-card/90 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/10"
                                  onClick={() => handleViewDetails(service)}
                                >
                                  {/* Hover Gradient Overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-300" />
                                  
                                  <div className="relative p-4">
                                    {/* Header: ID + Price */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                      {/* Service ID */}
                                      <Badge 
                                        variant="outline" 
                                        className="font-mono text-xs px-2.5 py-1 bg-muted/60 border-border shrink-0"
                                      >
                                        <Hash className="w-3 h-3 ml-1 text-primary" />
                                        {service.external_service_id || "-"}
                                      </Badge>
                                      
                                      {/* Price Badge */}
                                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20">
                                        <DollarSign className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                          {service.price.toFixed(4)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Service Name */}
                                    <h4 className="font-semibold text-sm sm:text-base leading-relaxed mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                      {service.name}
                                    </h4>

                                    {/* Features Tags */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                      {service.refill_enabled && (
                                        <Badge className="text-[10px] h-5 px-2 bg-success/15 text-success border-success/30 gap-1">
                                          <Shield className="w-2.5 h-2.5" />
                                          ضمان
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-[10px] h-5 px-2 bg-accent/10 border-accent/20 gap-1">
                                        <Zap className="w-2.5 h-2.5 text-accent" />
                                        فوري
                                      </Badge>
                                    </div>

                                    {/* Actions Row */}
                                    <div className="flex items-center gap-2">
                                      {/* Order Button */}
                                      <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOrder(service);
                                          }}
                                          className="w-full h-9 rounded-xl gap-1.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 font-semibold text-xs"
                                        >
                                          <ShoppingCart className="w-3.5 h-3.5" />
                                          طلب
                                        </Button>
                                      </motion.div>

                                      {/* View Details */}
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewDetails(service);
                                        }}
                                        className="h-9 w-9 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </Button>

                                      {/* Favorite */}
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(service.id);
                                        }}
                                        className={cn(
                                          "h-9 w-9 rounded-xl transition-all",
                                          checkIsFavorite(service.id) 
                                            ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20" 
                                            : "border-border/50 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                                        )}
                                      >
                                        <Heart className={cn("w-3.5 h-3.5", checkIsFavorite(service.id) && "fill-current")} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          
                          {/* Load More Button */}
                          {hasMoreItems(category, categoryServices) && (
                            <div className="p-4 border-t border-border/50">
                              <Button
                                variant="outline"
                                className="w-full gap-2 rounded-xl h-12"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadMoreItems(category);
                                }}
                                disabled={loadingMore === category}
                              >
                                {loadingMore === category ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري التحميل...
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    تحميل المزيد ({categoryServices.length - (visibleCategoryItems[category] || ITEMS_PER_PAGE)} متبقي)
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
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
          isFavorite={selectedService ? checkIsFavorite(selectedService.id) : false}
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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed bottom-6 left-6 z-50"
            >
              <Button
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
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
