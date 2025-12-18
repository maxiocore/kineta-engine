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
  TrendingUp,
  Filter,
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
  Plus,
  Crown,
  Flame,
  ArrowUpRight,
  Check,
  Clock,
  X,
  Info,
  Eye,
  ChevronDown,
  Grid3X3,
  LayoutList
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import EmbeddedOrderForm from "@/components/services/EmbeddedOrderForm";
import ServiceDetailsDialog from "@/components/services/ServiceDetailsDialog";
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

// Enhanced color mapping for categories with gradients
const colorMap: Record<string, { 
  bg: string; 
  bgLight: string;
  icon: string; 
  border: string;
  glow: string;
  text: string;
  gradient: string;
}> = {
  instagram: { 
    bg: "bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400", 
    bgLight: "bg-pink-500/10",
    icon: "text-white", 
    border: "border-pink-500/30",
    glow: "shadow-pink-500/25",
    text: "text-pink-500",
    gradient: "from-pink-500 via-purple-500 to-orange-400"
  },
  facebook: { 
    bg: "bg-gradient-to-br from-blue-500 to-blue-600", 
    bgLight: "bg-blue-500/10",
    icon: "text-white", 
    border: "border-blue-500/30",
    glow: "shadow-blue-500/25",
    text: "text-blue-500",
    gradient: "from-blue-500 to-blue-600"
  },
  youtube: { 
    bg: "bg-gradient-to-br from-red-500 to-red-600", 
    bgLight: "bg-red-500/10",
    icon: "text-white", 
    border: "border-red-500/30",
    glow: "shadow-red-500/25",
    text: "text-red-500",
    gradient: "from-red-500 to-red-600"
  },
  twitter: { 
    bg: "bg-gradient-to-br from-sky-400 to-sky-500", 
    bgLight: "bg-sky-400/10",
    icon: "text-white", 
    border: "border-sky-500/30",
    glow: "shadow-sky-500/25",
    text: "text-sky-500",
    gradient: "from-sky-400 to-sky-500"
  },
  tiktok: { 
    bg: "bg-gradient-to-br from-gray-900 via-gray-800 to-pink-500", 
    bgLight: "bg-gray-500/10",
    icon: "text-white", 
    border: "border-gray-500/30",
    glow: "shadow-gray-500/25",
    text: "text-gray-900 dark:text-gray-100",
    gradient: "from-gray-900 via-gray-800 to-pink-500"
  },
  telegram: { 
    bg: "bg-gradient-to-br from-blue-400 to-blue-500", 
    bgLight: "bg-blue-400/10",
    icon: "text-white", 
    border: "border-blue-400/30",
    glow: "shadow-blue-400/25",
    text: "text-blue-400",
    gradient: "from-blue-400 to-blue-500"
  },
  linkedin: { 
    bg: "bg-gradient-to-br from-blue-600 to-blue-700", 
    bgLight: "bg-blue-600/10",
    icon: "text-white", 
    border: "border-blue-600/30",
    glow: "shadow-blue-600/25",
    text: "text-blue-600",
    gradient: "from-blue-600 to-blue-700"
  },
  spotify: { 
    bg: "bg-gradient-to-br from-green-500 to-green-600", 
    bgLight: "bg-green-500/10",
    icon: "text-white", 
    border: "border-green-500/30",
    glow: "shadow-green-500/25",
    text: "text-green-500",
    gradient: "from-green-500 to-green-600"
  },
  soundcloud: { 
    bg: "bg-gradient-to-br from-orange-500 to-orange-600", 
    bgLight: "bg-orange-500/10",
    icon: "text-white", 
    border: "border-orange-500/30",
    glow: "shadow-orange-500/25",
    text: "text-orange-500",
    gradient: "from-orange-500 to-orange-600"
  },
  default: { 
    bg: "bg-gradient-to-br from-primary to-accent", 
    bgLight: "bg-primary/10",
    icon: "text-white", 
    border: "border-primary/30",
    glow: "shadow-primary/25",
    text: "text-primary",
    gradient: "from-primary to-accent"
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30
    }
  }
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
  const [detailsService, setDetailsService] = useState<Service | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const handleShowDetails = (service: Service) => {
    setDetailsService(service);
    setShowDetailsDialog(true);
  };

  const handleOrderFromDetails = (service: Service) => {
    setDetailsService(null);
    setShowDetailsDialog(false);
    handleSelectService(service);
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
          <motion.div 
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </motion.div>
          <p className="text-muted-foreground text-sm">جاري تحميل الخدمات...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="min-h-screen">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">طلب جديد</h1>
                <p className="text-xs text-muted-foreground">{services.length} خدمة في {serviceCategories.length} قسم</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-xs">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{services.length}</span>
                <span className="text-muted-foreground">خدمة</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-xs">
                <Heart className="w-3.5 h-3.5 text-destructive" />
                <span className="font-medium">{favorites.length}</span>
                <span className="text-muted-foreground">مفضلة</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Layout */}
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
                    <Card className="border-dashed border-2 border-border/50 bg-muted/5">
                      <CardContent className="py-16 text-center">
                        <motion.div 
                          className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className="w-8 h-8 text-muted-foreground/40" />
                        </motion.div>
                        <h3 className="font-semibold mb-2">اختر خدمة للطلب</h3>
                        <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                          اختر قسم ثم انقر على الخدمة المطلوبة
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
                className="lg:hidden fixed inset-0 z-50 bg-background/98 backdrop-blur-md"
              >
                <div className="h-full overflow-y-auto p-4 pb-20">
                  <motion.div
                    initial={{ x: 50 }}
                    animate={{ x: 0 }}
                    exit={{ x: 50 }}
                  >
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
                      العودة
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
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right Side - Categories & Services */}
          <div className="flex-1 min-w-0 space-y-5 order-1 lg:order-2">
            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">الأقسام</span>
                </div>
                {selectedCategory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchQuery("");
                      setSelectedService(null);
                    }}
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                    إلغاء
                  </Button>
                )}
              </div>
              
              <ScrollArea className="w-full pb-2">
                <motion.div 
                  className="flex gap-2"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {serviceCategories.map((category) => {
                    const IconComponent = getCategoryIcon(category);
                    const colors = getCategoryColors(category);
                    const count = categoryCounts[category] || 0;
                    const isSelected = selectedCategory === category;
                    
                    return (
                      <motion.button
                        key={category}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedCategory(isSelected ? null : category);
                          setSearchQuery("");
                        }}
                        className={cn(
                          "relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap",
                          isSelected 
                            ? `${colors.border} bg-gradient-to-br ${colors.bgLight} ring-1 ring-offset-1 ring-offset-background ${colors.border.replace('border-', 'ring-')}` 
                            : "border-border/50 bg-card hover:bg-muted/50 hover:border-border"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all",
                          colors.bg,
                          colors.glow
                        )}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-medium text-sm transition-colors",
                            isSelected && colors.text
                          )}>
                            {category}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{count} خدمة</p>
                        </div>
                        {isSelected && (
                          <motion.div 
                            layoutId="categoryCheck"
                            className={cn("w-5 h-5 rounded-full flex items-center justify-center mr-1", colors.bg)}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
                <ScrollBar orientation="horizontal" className="mt-2" />
              </ScrollArea>
            </motion.div>

            {/* Services Section */}
            <AnimatePresence mode="wait">
              {selectedCategory ? (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Search & Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث..."
                        className="pr-10 h-10 bg-muted/30 border-border/50 rounded-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                        <SelectTrigger className="w-[140px] h-10 rounded-lg">
                          <SelectValue placeholder="ترتيب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">الاسم</SelectItem>
                          <SelectItem value="price-asc">السعر ↑</SelectItem>
                          <SelectItem value="price-desc">السعر ↓</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex border border-border/50 rounded-lg overflow-hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-10 w-10 rounded-none", viewMode === "grid" && "bg-muted")}
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-10 w-10 rounded-none", viewMode === "list" && "bg-muted")}
                          onClick={() => setViewMode("list")}
                        >
                          <LayoutList className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Category Header */}
                  {(() => {
                    const IconComponent = getCategoryIcon(selectedCategory);
                    const colors = getCategoryColors(selectedCategory);
                    return (
                      <div className="flex items-center gap-3 py-2">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", colors.bg, colors.glow)}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="font-bold text-lg">{selectedCategory}</h2>
                          <p className="text-xs text-muted-foreground">{filteredServices.length} خدمة</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Services */}
                  {filteredServices.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">لا توجد نتائج</p>
                      </CardContent>
                    </Card>
                  ) : viewMode === "grid" ? (
                    <motion.div 
                      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {filteredServices.map((service) => {
                        const isActive = selectedService?.id === service.id;
                        const isFavorite = checkIsFavorite(service.id);
                        const colors = getCategoryColors(service.category);
                        
                        return (
                          <motion.div key={service.id} variants={itemVariants} layout>
                            <Card 
                              className={cn(
                                "group relative overflow-hidden border transition-all cursor-pointer h-full",
                                isActive 
                                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                                  : "border-border/50 hover:border-primary/30 hover:shadow-md"
                              )}
                              onClick={() => handleSelectService(service)}
                            >
                              {/* Favorite Button */}
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(service.id);
                                }}
                                className={cn(
                                  "absolute top-3 left-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                  isFavorite 
                                    ? "bg-destructive/10 text-destructive" 
                                    : "bg-background/80 backdrop-blur text-muted-foreground hover:text-destructive"
                                )}
                              >
                                <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                              </motion.button>

                              {/* Selected Check */}
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                                >
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                              )}

                              <CardContent className="p-4 pt-12">
                                {/* Service Icon */}
                                <div className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md transition-all",
                                  isActive ? colors.bg : "bg-muted group-hover:bg-gradient-to-br group-hover:" + colors.gradient,
                                  colors.glow
                                )}>
                                  <Star className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-white" : "text-muted-foreground group-hover:text-white"
                                  )} />
                                </div>
                                
                                {/* Service Name */}
                                <h3 className={cn(
                                  "font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem] transition-colors",
                                  isActive && "text-primary"
                                )}>
                                  {service.name}
                                </h3>
                                
                                {/* Badges */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {service.external_service_id && (
                                    <Badge variant="outline" className="text-[9px] h-5 px-1.5 font-mono">
                                      #{service.external_service_id}
                                    </Badge>
                                  )}
                                  {service.refill_enabled && (
                                    <Badge className="text-[9px] h-5 px-1.5 bg-success/10 text-success border-success/20">
                                      <Shield className="w-2.5 h-2.5 ml-0.5" />
                                      ضمان
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Price & Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                  <div>
                                    <span className={cn(
                                      "text-lg font-bold",
                                      isActive ? "text-primary" : "text-foreground"
                                    )}>
                                      {service.price.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-muted-foreground mr-1">ر.س</span>
                                  </div>
                                  
                                  <div className="flex gap-1.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShowDetails(service);
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      className={cn(
                                        "h-8 px-3 rounded-lg shadow-md",
                                        isActive 
                                          ? "bg-primary" 
                                          : "bg-gradient-to-r from-primary to-accent"
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectService(service);
                                      }}
                                    >
                                      {isActive ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="space-y-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {filteredServices.map((service) => {
                        const isActive = selectedService?.id === service.id;
                        const isFavorite = checkIsFavorite(service.id);
                        const colors = getCategoryColors(service.category);
                        
                        return (
                          <motion.div key={service.id} variants={itemVariants}>
                            <Card 
                              className={cn(
                                "group overflow-hidden border transition-all cursor-pointer",
                                isActive 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border/50 hover:border-primary/30"
                              )}
                              onClick={() => handleSelectService(service)}
                            >
                              <CardContent className="p-3 flex items-center gap-3">
                                {/* Icon */}
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow",
                                  isActive ? colors.bg : "bg-muted group-hover:bg-gradient-to-br group-hover:" + colors.gradient,
                                  colors.glow
                                )}>
                                  <Star className={cn(
                                    "w-4 h-4",
                                    isActive ? "text-white" : "text-muted-foreground group-hover:text-white"
                                  )} />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h3 className={cn(
                                    "font-medium text-sm truncate",
                                    isActive && "text-primary"
                                  )}>
                                    {service.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {service.external_service_id && (
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        #{service.external_service_id}
                                      </span>
                                    )}
                                    {service.refill_enabled && (
                                      <Badge className="text-[9px] h-4 px-1 bg-success/10 text-success border-success/20">
                                        ضمان
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Price */}
                                <div className="text-left shrink-0">
                                  <span className={cn("font-bold", isActive && "text-primary")}>
                                    {service.price.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-muted-foreground mr-0.5">ر.س</span>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(service.id);
                                    }}
                                    className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                      isFavorite 
                                        ? "text-destructive" 
                                        : "text-muted-foreground hover:text-destructive"
                                    )}
                                  >
                                    <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                                  </motion.button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShowDetails(service);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8 rounded-lg",
                                      isActive ? "bg-primary" : "bg-gradient-to-r from-primary to-accent"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectService(service);
                                    }}
                                  >
                                    {isActive ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16"
                >
                  <motion.div 
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ChevronRight className="w-8 h-8 text-muted-foreground/30" />
                  </motion.div>
                  <h3 className="font-semibold mb-2">اختر قسماً</h3>
                  <p className="text-sm text-muted-foreground">اختر أحد الأقسام لعرض الخدمات</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile FAB */}
        {selectedCategory && !showMobileForm && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden fixed bottom-20 left-4 right-4 z-40"
          >
            <Button
              size="lg"
              className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/30 rounded-xl"
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
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Service Details Dialog */}
        <ServiceDetailsDialog
          service={detailsService}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onOrder={handleOrderFromDetails}
          onToggleFavorite={toggleFavorite}
          isFavorite={detailsService ? favorites.includes(detailsService.id) : false}
        />
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesNew;
