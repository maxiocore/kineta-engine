import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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
  ChevronRight,
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
  ArrowLeft,
  ShoppingCart,
  Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

// Color mapping for categories
const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  instagram: { bg: "bg-gradient-to-br from-pink-500 to-purple-600", icon: "text-white", border: "border-pink-500/30" },
  facebook: { bg: "bg-gradient-to-br from-blue-500 to-blue-600", icon: "text-white", border: "border-blue-500/30" },
  youtube: { bg: "bg-gradient-to-br from-red-500 to-red-600", icon: "text-white", border: "border-red-500/30" },
  twitter: { bg: "bg-gradient-to-br from-sky-400 to-sky-500", icon: "text-white", border: "border-sky-500/30" },
  tiktok: { bg: "bg-gradient-to-br from-gray-900 to-gray-800", icon: "text-white", border: "border-gray-500/30" },
  telegram: { bg: "bg-gradient-to-br from-blue-400 to-blue-500", icon: "text-white", border: "border-blue-400/30" },
  linkedin: { bg: "bg-gradient-to-br from-blue-600 to-blue-700", icon: "text-white", border: "border-blue-600/30" },
  spotify: { bg: "bg-gradient-to-br from-green-500 to-green-600", icon: "text-white", border: "border-green-500/30" },
  soundcloud: { bg: "bg-gradient-to-br from-orange-500 to-orange-600", icon: "text-white", border: "border-orange-500/30" },
  default: { bg: "bg-gradient-to-br from-primary to-accent", icon: "text-white", border: "border-primary/30" },
};

const ClientServicesNew = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Handle URL params for deep linking from search
  useEffect(() => {
    if (!services.length) return;
    
    const categoryParam = searchParams.get("category");
    const serviceParam = searchParams.get("service");
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    if (serviceParam) {
      const service = services.find(s => s.id === serviceParam);
      if (service) {
        setSelectedCategory(service.category);
        setSelectedService(service);
        if (window.innerWidth < 1024) {
          setShowMobileForm(true);
        }
      }
    }
    
    // Clear params after processing
    if (categoryParam || serviceParam) {
      setSearchParams({});
    }
  }, [services, searchParams]);

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

  // Get category colors
  const getCategoryColors = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('instagram')) return colorMap.instagram;
    if (name.includes('facebook')) return colorMap.facebook;
    if (name.includes('youtube')) return colorMap.youtube;
    if (name.includes('twitter') || name.includes('x')) return colorMap.twitter;
    if (name.includes('tiktok')) return colorMap.tiktok;
    if (name.includes('telegram')) return colorMap.telegram;
    if (name.includes('linkedin')) return colorMap.linkedin;
    if (name.includes('spotify')) return colorMap.spotify;
    if (name.includes('soundcloud')) return colorMap.soundcloud;
    return colorMap.default;
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
      <div className="space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/20 border border-border/50 p-6"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title & Stats */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent p-3 shadow-lg shadow-primary/20">
                <Package className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">الخدمات</h1>
                <p className="text-muted-foreground text-sm">اختر القسم ثم الخدمة</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50">
                <Zap className="w-4 h-4 text-warning" />
                <span className="text-sm font-semibold">{services.length} خدمة</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{serviceCategories.length} قسم</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50">
                <Heart className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold">{favorites.length} مفضلة</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side - Order Form (Desktop) */}
          <div className="hidden lg:block lg:w-[400px] shrink-0 order-2 lg:order-1">
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
                    <Card className="border-border/50 border-dashed bg-muted/10">
                      <CardContent className="py-24 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-muted/30 flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                        <h3 className="font-bold text-xl mb-3">اختر خدمة للطلب</h3>
                        <p className="text-sm text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
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
                className="lg:hidden fixed inset-0 z-50 bg-background/98 backdrop-blur-sm"
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

          {/* Right Side - Categories & Services */}
          <div className="flex-1 min-w-0 space-y-6 order-1 lg:order-2">
            {/* Category Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      اختر القسم
                    </h3>
                    {selectedCategory && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(null);
                          setSearchQuery("");
                          setSelectedService(null);
                        }}
                        className="text-xs"
                      >
                        عرض الكل
                      </Button>
                    )}
                  </div>
                  
                  {/* Horizontal Scrollable Categories */}
                  <div className="relative">
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-3 pb-2">
                        {serviceCategories.map((category, index) => {
                          const IconComponent = getCategoryIcon(category);
                          const colors = getCategoryColors(category);
                          const count = categoryCounts[category] || 0;
                          const isSelected = selectedCategory === category;
                          
                          return (
                            <motion.button
                              key={category}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setSelectedCategory(isSelected ? null : category);
                                setSearchQuery("");
                              }}
                              className={cn(
                                "flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all min-w-[100px]",
                                isSelected 
                                  ? `${colors.border} bg-primary/5 ring-2 ring-primary/20` 
                                  : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30"
                              )}
                            >
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform",
                                colors.bg
                              )}>
                                <IconComponent className={cn("w-6 h-6", colors.icon)} />
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-sm truncate max-w-[80px]">{category}</p>
                                <p className="text-[11px] text-muted-foreground">{count} خدمة</p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Services Section */}
            <AnimatePresence mode="wait">
              {selectedCategory ? (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Search & Filter Bar */}
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="بحث في الخدمات..."
                            className="pr-11 h-11 bg-muted/30 border-border/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                          <SelectTrigger className="w-full sm:w-[160px] h-11">
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
                    </CardContent>
                  </Card>

                  {/* Category Header */}
                  <div className="flex items-center gap-3">
                    {(() => {
                      const IconComponent = getCategoryIcon(selectedCategory);
                      const colors = getCategoryColors(selectedCategory);
                      return (
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="font-bold text-lg">{selectedCategory}</h2>
                      <p className="text-sm text-muted-foreground">{filteredServices.length} خدمة متاحة</p>
                    </div>
                  </div>

                  {/* Services List */}
                  {filteredServices.length === 0 ? (
                    <Card className="border-border/50">
                      <CardContent className="py-16 text-center">
                        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="font-bold text-lg mb-2">لا توجد خدمات</h3>
                        <p className="text-sm text-muted-foreground">
                          لا توجد نتائج مطابقة للبحث
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {filteredServices.map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <Card 
                            className={cn(
                              "border-border/50 hover:border-primary/40 transition-all cursor-pointer group",
                              selectedService?.id === service.id && "border-primary ring-2 ring-primary/20 bg-primary/5"
                            )}
                            onClick={() => handleSelectService(service)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-4">
                                {/* Service Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-3">
                                    <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                                      <Star className="w-5 h-5 text-primary" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-sm leading-relaxed group-hover:text-primary transition-colors line-clamp-2">
                                        {service.name}
                                      </h3>
                                      
                                      {/* Badges */}
                                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                        {service.external_service_id && (
                                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-muted/50">
                                            #{service.external_service_id}
                                          </Badge>
                                        )}
                                        {service.refill_enabled && (
                                          <Badge className="text-[10px] h-5 px-1.5 bg-success/10 text-success border-success/20">
                                            <Shield className="w-3 h-3 mr-0.5" />
                                            ضمان
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Price & Actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-left">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-lg font-bold text-primary">
                                        {service.price.toFixed(2)}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">ر.س</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">لكل 1000</p>
                                  </div>
                                  
                                  <div className="flex gap-1.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(service.id);
                                      }}
                                    >
                                      <Heart className={cn(
                                        "w-4 h-4 transition-all",
                                        checkIsFavorite(service.id) 
                                          ? "fill-destructive text-destructive" 
                                          : "text-muted-foreground"
                                      )} />
                                    </Button>
                                    <Button
                                      size="icon"
                                      className="h-9 w-9 rounded-lg bg-gradient-to-l from-primary to-accent hover:opacity-90"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectService(service);
                                      }}
                                    >
                                      <Plus className="w-4 h-4 text-white" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/30 flex items-center justify-center">
                    <ChevronRight className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">اختر قسماً للبدء</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                    اختر أحد الأقسام أعلاه لعرض الخدمات المتاحة
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* New Order Button - Mobile Fixed */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden fixed bottom-20 left-4 right-4 z-40"
          >
            <Button
              size="lg"
              className="w-full h-14 text-lg gap-3 bg-gradient-to-l from-primary to-accent hover:opacity-90 shadow-2xl shadow-primary/30 rounded-2xl"
              onClick={() => {
                if (selectedService) {
                  setShowMobileForm(true);
                } else {
                  toast.info("اختر خدمة أولاً");
                }
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              طلب جديد
            </Button>
          </motion.div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesNew;
