import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Package, 
  Loader2, 
  Star, 
  Heart,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronLeft,
  Layers,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  MoreHorizontal,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import EmbeddedOrderForm from "@/components/services/EmbeddedOrderForm";
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
}

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  Layers,
  MoreHorizontal,
};

const ClientServicesNew = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("name");
  const [showMobileForm, setShowMobileForm] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-client"],
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

  // Fetch services
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ["services-client"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    },
  });

  // Get unique categories from services
  const serviceCategories = useMemo(() => {
    return [...new Set(services.map(s => s.category))].sort();
  }, [services]);

  // Count services per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      counts[service.category] = (counts[service.category] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    
    let result = services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.external_service_id?.includes(searchQuery));
      
      const matchesCategory = service.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort
    switch (sortBy) {
      case "price-asc":
        result = result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = result.sort((a, b) => b.price - a.price);
        break;
      case "name":
      default:
        result = result.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }

    return result;
  }, [services, searchQuery, selectedCategory, sortBy]);

  const handleSelectService = (service: Service) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول للطلب");
      return;
    }
    setSelectedService(service);
    setShowMobileForm(true);
  };

  const checkIsFavorite = (serviceId: string) => {
    return favorites.includes(serviceId);
  };

  // Get category icon
  const getCategoryIcon = (categoryName: string) => {
    const dbCategory = categories.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase() ||
      c.name_ar === categoryName
    );
    
    if (dbCategory && iconMap[dbCategory.icon]) {
      return iconMap[dbCategory.icon];
    }
    
    const name = categoryName.toLowerCase();
    if (name.includes('instagram')) return Instagram;
    if (name.includes('facebook')) return Facebook;
    if (name.includes('youtube')) return Youtube;
    if (name.includes('twitter') || name.includes('x')) return Twitter;
    if (name.includes('linkedin')) return Linkedin;
    if (name.includes('tiktok') || name.includes('spotify') || name.includes('music')) return Music2;
    if (name.includes('telegram')) return Send;
    return Globe;
  };

  // Get category color
  const getCategoryColor = (categoryName: string) => {
    const dbCategory = categories.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase() ||
      c.name_ar === categoryName
    );
    return dbCategory?.color || "from-primary to-accent";
  };

  if (isLoading) {
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
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/10 p-4 md:p-6"
        >
          <div className="absolute top-0 left-0 w-24 md:w-32 h-24 md:h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-accent/10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-accent p-2.5 md:p-3 shadow-lg shadow-primary/20">
                <Package className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">الخدمات</h1>
                <p className="text-muted-foreground text-xs md:text-sm">اختر القسم ثم الخدمة</p>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-warning" />
                <span className="text-xs md:text-sm font-medium">{services.length} خدمة</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <Layers className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">{serviceCategories.length} قسم</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-destructive" />
                <span className="text-xs md:text-sm font-medium">{favorites.length} مفضلة</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row-reverse gap-4 md:gap-6">
          {/* Order Form - Right Side (Desktop) / Modal (Mobile) */}
          <div className="hidden lg:block lg:w-[380px] xl:w-[420px] shrink-0">
            <div className="sticky top-4">
              <AnimatePresence mode="wait">
                {selectedService ? (
                  <EmbeddedOrderForm
                    key={selectedService.id}
                    service={selectedService}
                    onClose={() => setSelectedService(null)}
                    onSuccess={() => {
                      refetch();
                      setSelectedService(null);
                    }}
                  />
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="border-border/50 border-dashed bg-muted/20">
                      <CardContent className="py-20 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                          <Sparkles className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">اختر خدمة للطلب</h3>
                        <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                          اختر قسم من الأقسام ثم انقر على الخدمة المطلوبة
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Order Form Modal */}
          <AnimatePresence>
            {showMobileForm && selectedService && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
              >
                <div className="h-full overflow-y-auto p-4 pb-20">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-4 gap-2"
                    onClick={() => {
                      setShowMobileForm(false);
                      setSelectedService(null);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    العودة للخدمات
                  </Button>
                  <EmbeddedOrderForm
                    service={selectedService}
                    onClose={() => {
                      setShowMobileForm(false);
                      setSelectedService(null);
                    }}
                    onSuccess={() => {
                      refetch();
                      setShowMobileForm(false);
                      setSelectedService(null);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Services & Categories - Left Side */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Categories Grid - Show when no category selected */}
            <AnimatePresence mode="wait">
              {!selectedCategory ? (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="border-border/50">
                    <CardContent className="p-3 md:p-4">
                      <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        اختر القسم
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                        {serviceCategories.map((category, index) => {
                          const IconComponent = getCategoryIcon(category);
                          const count = categoryCounts[category] || 0;
                          const color = getCategoryColor(category);
                          
                          return (
                            <motion.button
                              key={category}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedCategory(category)}
                              className="group relative flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
                            >
                              <div className={cn(
                                "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
                                color
                              )}>
                                <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white" />
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-sm md:text-base truncate max-w-full">{category}</p>
                                <p className="text-[11px] md:text-xs text-muted-foreground">{count} خدمة</p>
                              </div>
                              <ChevronLeft className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3 md:space-y-4"
                >
                  {/* Back to Categories & Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(null);
                        setSearchQuery("");
                      }}
                      className="gap-2 w-fit"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      جميع الأقسام
                    </Button>
                    
                    <div className="flex items-center gap-3 flex-1">
                      {(() => {
                        const IconComponent = getCategoryIcon(selectedCategory);
                        const color = getCategoryColor(selectedCategory);
                        return (
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                            color
                          )}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                        );
                      })()}
                      <div>
                        <h2 className="font-bold text-lg md:text-xl">{selectedCategory}</h2>
                        <p className="text-xs text-muted-foreground">{filteredServices.length} خدمة</p>
                      </div>
                    </div>
                  </div>

                  {/* Search & Filters */}
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث في الخدمات..."
                        className="pr-10 h-10 md:h-11 bg-card/50 border-border/50 rounded-lg md:rounded-xl text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="w-full sm:w-40 h-10 md:h-11 rounded-lg md:rounded-xl text-sm">
                        <Filter className="w-4 h-4 ml-2" />
                        <SelectValue placeholder="ترتيب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">الاسم</SelectItem>
                        <SelectItem value="price-asc">السعر: الأقل</SelectItem>
                        <SelectItem value="price-desc">السعر: الأعلى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Services List */}
                  <Card className="border-border/50 overflow-hidden">
                    {filteredServices.length === 0 ? (
                      <CardContent className="py-12 text-center">
                        <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">لا توجد نتائج</p>
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => setSearchQuery("")}
                          >
                            مسح البحث
                          </Button>
                        )}
                      </CardContent>
                    ) : (
                      <ScrollArea className="max-h-[60vh] md:max-h-[70vh]">
                        <div className="divide-y divide-border/50">
                          {filteredServices.map((service, index) => (
                            <motion.button
                              key={service.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.02 }}
                              onClick={() => handleSelectService(service)}
                              className={cn(
                                "w-full text-right p-3 md:p-4 hover:bg-muted/50 transition-all",
                                selectedService?.id === service.id && "bg-primary/5 border-r-2 border-r-primary"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {/* Service Number */}
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
                                  {service.external_service_id || index + 1}
                                </div>
                                
                                {/* Service Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className={cn(
                                    "font-medium text-sm leading-relaxed text-right",
                                    selectedService?.id === service.id && "text-primary"
                                  )}>
                                    {service.name}
                                  </h4>
                                  
                                  {/* Features Badges */}
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {service.features?.min && (
                                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                        أدنى: {service.features.min.toLocaleString('ar-SA')}
                                      </Badge>
                                    )}
                                    {service.features?.max && (
                                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                        أقصى: {service.features.max.toLocaleString('ar-SA')}
                                      </Badge>
                                    )}
                                    {service.refill_enabled && (
                                      <Badge className="text-[10px] h-5 px-1.5 bg-success/10 text-success border-success/20 font-normal">
                                        <Shield className="w-3 h-3 ml-0.5" />
                                        ضمان
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Price & Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-left">
                                    <p className="text-base md:text-lg font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                                      {service.price.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">ر.س/1000</p>
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(service.id);
                                    }}
                                    className={cn(
                                      "w-8 h-8 rounded-lg transition-all",
                                      checkIsFavorite(service.id) 
                                        ? "text-destructive bg-destructive/10" 
                                        : "text-muted-foreground hover:text-destructive"
                                    )}
                                  >
                                    <Heart className={cn(
                                      "w-4 h-4",
                                      checkIsFavorite(service.id) && "fill-current"
                                    )} />
                                  </Button>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesNew;
