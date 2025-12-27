import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Package, 
  Loader2, 
  Heart,
  Globe,
  RotateCcw,
  CreditCard,
  Layers,
  Grid3X3,
  ChevronUp,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import PlatformCategoriesGrid from "@/components/services/PlatformCategoriesGrid";
import ServicesCategorySection from "@/components/services/ServicesCategorySection";
import ServiceCardModern from "@/components/services/ServiceCardModern";
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
  parent_id: string | null;
}

// Main section tabs
const MAIN_SECTIONS = [
  { id: 'social', label: 'التواصل الاجتماعي', labelShort: 'التواصل', icon: Globe },
  { id: 'reorder', label: 'إعادة طلب', labelShort: 'إعادة', icon: RotateCcw },
  { id: 'subscriptions', label: 'الاشتراكات', labelShort: 'اشتراكات', icon: CreditCard },
  { id: 'favorites', label: 'المفضلة', labelShort: 'المفضلة', icon: Heart },
];

const ClientServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [activeMainSection, setActiveMainSection] = useState("social");
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  // Fetch data
  useEffect(() => {
    fetchServices();
    fetchCategories();

    // Realtime subscriptions
    const servicesChannel = supabase
      .channel("services-realtime")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "services" 
      }, (payload) => {
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
    await Promise.all([fetchServices(), fetchCategories()]);
    setIsRefreshing(false);
    toast.success("تم تحديث الخدمات");
  };

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
    setIsDetailsSheetOpen(true);
  };

  const handleOrder = (service: Service) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول للطلب");
      return;
    }
    setSelectedService(service);
    setIsOrderDialogOpen(true);
  };

  const handleCategoryChange = (categoryId: string | null, slug: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategorySlug(slug);
  };

  // Filter design/dev services
  const isDesignOrDevService = useCallback((service: Service) => {
    const name = service.name.toLowerCase();
    const category = service.category.toLowerCase();
    const designKeywords = ['تصميم', 'شعار', 'لوجو', 'design', 'logo', 'بنر', 'banner', 'هوية'];
    const devKeywords = ['برمجة', 'تطوير', 'موقع', 'تطبيق', 'dev', 'development', 'website', 'app'];
    
    return designKeywords.some(k => name.includes(k) || category.includes(k)) ||
           devKeywords.some(k => name.includes(k) || category.includes(k));
  }, []);

  // Social media services only
  const socialMediaServices = useMemo(() => {
    return services.filter(service => !isDesignOrDevService(service));
  }, [services, isDesignOrDevService]);

  // Service counts per category slug
  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    socialMediaServices.forEach(service => {
      // Count by category_id (find slug)
      if (service.category_id) {
        const cat = categories.find(c => c.id === service.category_id);
        if (cat) {
          counts[cat.slug] = (counts[cat.slug] || 0) + 1;
          // Also add to parent count if this is a subcategory
          if (cat.parent_id) {
            const parent = categories.find(c => c.id === cat.parent_id);
            if (parent) {
              counts[parent.slug] = (counts[parent.slug] || 0) + 1;
            }
          }
        }
      }
    });
    
    return counts;
  }, [socialMediaServices, categories]);

  // Filtered services based on selection
  const filteredServices = useMemo(() => {
    let filtered = socialMediaServices;

    // Filter by category
    if (selectedCategoryId) {
      const selectedCat = categories.find(c => c.id === selectedCategoryId);
      
      if (selectedCat) {
        // Check if it's a main category (no parent)
        if (!selectedCat.parent_id) {
          // Get all subcategory IDs
          const subCatIds = categories
            .filter(c => c.parent_id === selectedCat.id)
            .map(c => c.id);
          
          // Include services from main category and all subcategories
          filtered = filtered.filter(s => 
            s.category_id === selectedCat.id || 
            (s.category_id && subCatIds.includes(s.category_id))
          );
        } else {
          // It's a subcategory - filter by exact match
          filtered = filtered.filter(s => s.category_id === selectedCategoryId);
        }
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.external_service_id?.includes(query)
      );
    }

    return filtered;
  }, [socialMediaServices, selectedCategoryId, searchQuery, categories]);

  // Get category display name in Arabic
  const getCategoryInfo = useCallback((service: Service) => {
    if (service.category_id) {
      const cat = categories.find(c => c.id === service.category_id);
      if (cat) {
        return {
          name: cat.name,
          nameAr: cat.name_ar,
          color: cat.color || "from-primary to-primary/70"
        };
      }
    }
    return {
      name: service.category,
      nameAr: service.category,
      color: "from-primary to-primary/70"
    };
  }, [categories]);

  // Group services by category
  const groupedServices = useMemo(() => {
    if (categories.length === 0) return {};
    
    const groups: Record<string, { services: Service[]; nameAr: string; color: string }> = {};
    
    filteredServices.forEach(service => {
      const info = getCategoryInfo(service);
      const key = info.nameAr;
      
      if (!groups[key]) {
        groups[key] = {
          services: [],
          nameAr: info.nameAr,
          color: info.color
        };
      }
      groups[key].services.push(service);
    });

    return groups;
  }, [filteredServices, getCategoryInfo, categories]);

  // Auto-expand all categories on load
  useEffect(() => {
    if (Object.keys(groupedServices).length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(Object.keys(groupedServices)));
    }
  }, [groupedServices]);

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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-2xl shadow-primary/30">
              <Package className="w-10 h-10 text-primary-foreground" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 rounded-2xl border-2 border-dashed border-primary/30"
            />
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-bold mb-1">جاري تحميل الخدمات</p>
            <p className="text-sm text-muted-foreground">يرجى الانتظار...</p>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 px-1 sm:px-0" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              خدمات التواصل الاجتماعي
            </h1>
            <p className="text-muted-foreground mt-1">
              اختر منصتك وابدأ في تنمية حساباتك
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-xl gap-2 h-10 px-4"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            تحديث
          </Button>
        </motion.div>

        {/* Main Section Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeMainSection} onValueChange={setActiveMainSection} className="w-full">
            <TabsList className="w-full h-auto p-1.5 bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl flex flex-wrap justify-start gap-1">
              {MAIN_SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className={cn(
                    "flex-1 min-w-[80px] h-11 sm:h-12 rounded-xl gap-2 text-xs sm:text-sm font-medium transition-all duration-300",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25"
                  )}
                >
                  <section.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                  <span className="sm:hidden">{section.labelShort}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Content Based on Active Section */}
        <AnimatePresence mode="wait">
          {activeMainSection === 'favorites' ? (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-border/40 bg-card/50">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                      <Heart className="w-7 h-7 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">المفضلة</h3>
                      <p className="text-muted-foreground">
                        {favorites.length > 0 
                          ? `${favorites.length} خدمة محفوظة`
                          : "لم تقم بإضافة خدمات للمفضلة"}
                      </p>
                    </div>
                  </div>
                  
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setActiveMainSection('social')}
                      >
                        تصفح الخدمات
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {services
                        .filter(s => favorites.includes(s.id))
                        .map((service, index) => (
                          <ServiceCardModern
                            key={service.id}
                            service={service}
                            index={index}
                            onOrder={() => handleOrder(service)}
                            onViewDetails={() => handleViewDetails(service)}
                            isFavorite={true}
                            onToggleFavorite={() => toggleFavorite(service.id)}
                            categoryNameAr={getCategoryInfo(service).nameAr}
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
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <RotateCcw className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">إعادة طلب</h3>
                  <p className="text-muted-foreground">
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
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">الاشتراكات</h3>
                  <p className="text-muted-foreground">
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
              className="space-y-6"
            >
              {/* Platforms Grid */}
              <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <PlatformCategoriesGrid
                    onCategoryChange={handleCategoryChange}
                    selectedCategoryId={selectedCategoryId}
                    serviceCounts={serviceCounts}
                  />
                </CardContent>
              </Card>

              {/* Search & Controls */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن خدمة بالاسم أو الرقم..."
                    className="pr-12 h-12 bg-card/50 backdrop-blur-sm border-border/40 rounded-xl text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2 justify-end">
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
              {filteredServices.length === 0 ? (
                <Card className="border-border/40 bg-card/50">
                  <CardContent className="py-20 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">لا توجد خدمات</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                      {searchQuery || selectedCategoryId
                        ? "لا توجد نتائج مطابقة لبحثك"
                        : "لا توجد خدمات متاحة حالياً"}
                    </p>
                    {(searchQuery || selectedCategoryId) && (
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategoryId(null);
                          setSelectedCategorySlug("all");
                        }}
                      >
                        إعادة تعيين البحث
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedServices).map(([categoryName, data], index) => (
                    <motion.div
                      key={categoryName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ServicesCategorySection
                        categoryName={categoryName}
                        categoryNameAr={data.nameAr}
                        categoryColor={data.color}
                        services={data.services}
                        isExpanded={expandedCategories.has(categoryName)}
                        onToggle={() => toggleCategory(categoryName)}
                        onOrder={handleOrder}
                        onViewDetails={handleViewDetails}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <ServiceOrderDialog
        service={selectedService}
        userId={user?.id || ''}
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
      />

      <ServiceDetailsSheet
        service={selectedService}
        isOpen={isDetailsSheetOpen}
        onClose={() => setIsDetailsSheetOpen(false)}
        onOrder={() => {
          setIsDetailsSheetOpen(false);
          setIsOrderDialogOpen(true);
        }}
        isFavorite={selectedService ? favorites.includes(selectedService.id) : false}
        onToggleFavorite={() => selectedService && toggleFavorite(selectedService.id)}
      />
    </ClientDashboardLayout>
  );
};

export default ClientServices;
