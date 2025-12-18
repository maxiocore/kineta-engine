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
  X
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

// Enhanced color mapping for categories with gradients
const colorMap: Record<string, { 
  bg: string; 
  bgLight: string;
  icon: string; 
  border: string;
  glow: string;
  text: string;
}> = {
  instagram: { 
    bg: "bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400", 
    bgLight: "bg-pink-500/10",
    icon: "text-white", 
    border: "border-pink-500/30",
    glow: "shadow-pink-500/20",
    text: "text-pink-500"
  },
  facebook: { 
    bg: "bg-gradient-to-br from-blue-500 to-blue-600", 
    bgLight: "bg-blue-500/10",
    icon: "text-white", 
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
    text: "text-blue-500"
  },
  youtube: { 
    bg: "bg-gradient-to-br from-red-500 to-red-600", 
    bgLight: "bg-red-500/10",
    icon: "text-white", 
    border: "border-red-500/30",
    glow: "shadow-red-500/20",
    text: "text-red-500"
  },
  twitter: { 
    bg: "bg-gradient-to-br from-sky-400 to-sky-500", 
    bgLight: "bg-sky-400/10",
    icon: "text-white", 
    border: "border-sky-500/30",
    glow: "shadow-sky-500/20",
    text: "text-sky-500"
  },
  tiktok: { 
    bg: "bg-gradient-to-br from-gray-900 via-gray-800 to-pink-500", 
    bgLight: "bg-gray-500/10",
    icon: "text-white", 
    border: "border-gray-500/30",
    glow: "shadow-gray-500/20",
    text: "text-gray-900 dark:text-gray-100"
  },
  telegram: { 
    bg: "bg-gradient-to-br from-blue-400 to-blue-500", 
    bgLight: "bg-blue-400/10",
    icon: "text-white", 
    border: "border-blue-400/30",
    glow: "shadow-blue-400/20",
    text: "text-blue-400"
  },
  linkedin: { 
    bg: "bg-gradient-to-br from-blue-600 to-blue-700", 
    bgLight: "bg-blue-600/10",
    icon: "text-white", 
    border: "border-blue-600/30",
    glow: "shadow-blue-600/20",
    text: "text-blue-600"
  },
  spotify: { 
    bg: "bg-gradient-to-br from-green-500 to-green-600", 
    bgLight: "bg-green-500/10",
    icon: "text-white", 
    border: "border-green-500/30",
    glow: "shadow-green-500/20",
    text: "text-green-500"
  },
  soundcloud: { 
    bg: "bg-gradient-to-br from-orange-500 to-orange-600", 
    bgLight: "bg-orange-500/10",
    icon: "text-white", 
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
    text: "text-orange-500"
  },
  default: { 
    bg: "bg-gradient-to-br from-primary to-accent", 
    bgLight: "bg-primary/10",
    icon: "text-white", 
    border: "border-primary/30",
    glow: "shadow-primary/20",
    text: "text-primary"
  },
};

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
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
          <motion.div 
            className="relative"
            animate={{ 
              rotate: 360,
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-accent to-primary p-[3px]">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
          </motion.div>
          <motion.p 
            className="text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            جاري تحميل الخدمات...
          </motion.p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Hero Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50"
        >
          {/* Animated background effects */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl"
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
            />
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Title & Icon */}
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-[2px] shadow-xl shadow-primary/30">
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <motion.div 
                    className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-3 h-3 text-white" />
                  </motion.div>
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-foreground to-foreground/70 bg-clip-text">
                    طلب جديد
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    اختر القسم والخدمة المطلوبة
                  </p>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="flex items-center gap-3 flex-wrap">
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{services.length}</p>
                    <p className="text-[11px] text-muted-foreground">خدمة متاحة</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{serviceCategories.length}</p>
                    <p className="text-[11px] text-muted-foreground">قسم</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-br from-destructive/5 to-destructive/10 border border-destructive/20 cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-lg shadow-destructive/20">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{favorites.length}</p>
                    <p className="text-[11px] text-muted-foreground">مفضلة</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side - Order Form (Desktop) */}
          <div className="hidden lg:block lg:w-[420px] shrink-0 order-2 lg:order-1">
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="border-dashed border-2 border-border/50 bg-gradient-to-b from-muted/5 to-muted/20 overflow-hidden">
                      <CardContent className="py-20 text-center relative">
                        {/* Decorative circles */}
                        <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-primary/5 blur-2xl" />
                        <div className="absolute bottom-6 right-6 w-20 h-20 rounded-full bg-accent/5 blur-2xl" />
                        
                        <motion.div 
                          className="relative w-28 h-28 mx-auto mb-6"
                          animate={{ 
                            y: [0, -10, 0],
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-xl" />
                          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-muted/50 to-muted/80 border border-border/50 flex items-center justify-center">
                            <Sparkles className="w-12 h-12 text-muted-foreground/40" />
                          </div>
                        </motion.div>
                        
                        <h3 className="font-bold text-xl mb-3 relative">اختر خدمة للطلب</h3>
                        <p className="text-sm text-muted-foreground max-w-[240px] mx-auto leading-relaxed relative">
                          اختر قسم من الأقسام ثم انقر على الخدمة المطلوبة لبدء الطلب
                        </p>
                        
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-100" />
                          <span className="w-2 h-2 rounded-full bg-primary/30 animate-pulse delay-200" />
                        </div>
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
                      className="mb-4 gap-2 hover:bg-muted"
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
                  </motion.div>
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
              <Card className="border-border/50 overflow-hidden shadow-lg shadow-foreground/5">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">اختر القسم</h3>
                        <p className="text-xs text-muted-foreground">{serviceCategories.length} قسم متاح</p>
                      </div>
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
                        className="text-xs gap-1.5 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="w-3.5 h-3.5" />
                        إلغاء التحديد
                      </Button>
                    )}
                  </div>
                  
                  {/* Category Grid - Horizontal Scroll */}
                  <div className="relative">
                    <ScrollArea className="w-full whitespace-nowrap pb-2">
                      <motion.div 
                        className="flex gap-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                      >
                        {serviceCategories.map((category, index) => {
                          const IconComponent = getCategoryIcon(category);
                          const colors = getCategoryColors(category);
                          const count = categoryCounts[category] || 0;
                          const isSelected = selectedCategory === category;
                          
                          return (
                            <motion.button
                              key={category}
                              variants={itemVariants}
                              whileHover={{ scale: 1.03, y: -4 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                setSelectedCategory(isSelected ? null : category);
                                setSearchQuery("");
                              }}
                              className={cn(
                                "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all min-w-[120px] group",
                                isSelected 
                                  ? `${colors.border} bg-gradient-to-b from-background to-muted/50 ring-2 ring-offset-2 ring-offset-background ${colors.border.replace('border-', 'ring-')}` 
                                  : "border-border/50 bg-card hover:border-primary/30 hover:shadow-lg"
                              )}
                            >
                              {/* Selected indicator */}
                              {isSelected && (
                                <motion.div 
                                  layoutId="selectedCategory"
                                  className={cn("absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center", colors.bg)}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500 }}
                                >
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                              )}
                              
                              <motion.div 
                                className={cn(
                                  "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-all",
                                  colors.bg,
                                  `shadow-xl ${colors.glow}`,
                                  isSelected && "scale-110"
                                )}
                                whileHover={{ rotate: [0, -5, 5, 0] }}
                                transition={{ duration: 0.5 }}
                              >
                                <IconComponent className={cn("w-7 h-7", colors.icon)} />
                              </motion.div>
                              
                              <div className="text-center">
                                <p className={cn(
                                  "font-semibold text-sm truncate max-w-[100px] transition-colors",
                                  isSelected && colors.text
                                )}>
                                  {category}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {count} خدمة
                                </p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                      <ScrollBar orientation="horizontal" className="mt-2" />
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
                  <Card className="border-border/50 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 group">
                          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            placeholder="بحث في الخدمات..."
                            className="pr-11 h-12 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                          <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-xl">
                            <Filter className="w-4 h-4 ml-2 text-muted-foreground" />
                            <SelectValue placeholder="ترتيب حسب" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">الاسم</SelectItem>
                            <SelectItem value="price-asc">السعر: الأقل أولاً</SelectItem>
                            <SelectItem value="price-desc">السعر: الأعلى أولاً</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category Header with animation */}
                  <motion.div 
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-l from-muted/30 to-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {(() => {
                      const IconComponent = getCategoryIcon(selectedCategory);
                      const colors = getCategoryColors(selectedCategory);
                      return (
                        <motion.div 
                          className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", colors.bg, colors.glow)}
                          whileHover={{ rotate: 10, scale: 1.1 }}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </motion.div>
                      );
                    })()}
                    <div className="flex-1">
                      <h2 className="font-bold text-xl">{selectedCategory}</h2>
                      <p className="text-sm text-muted-foreground">{filteredServices.length} خدمة متاحة للطلب</p>
                    </div>
                    <Badge variant="secondary" className="text-xs px-3 py-1.5 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5 ml-1" />
                      نشط
                    </Badge>
                  </motion.div>

                  {/* Services List */}
                  {filteredServices.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card className="border-border/50">
                        <CardContent className="py-20 text-center">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <Package className="w-10 h-10 text-muted-foreground/30" />
                          </div>
                          <h3 className="font-bold text-xl mb-3">لا توجد خدمات</h3>
                          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                            لا توجد نتائج مطابقة لبحثك، جرب كلمات أخرى
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="space-y-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {filteredServices.map((service, index) => {
                        const isActive = selectedService?.id === service.id;
                        const isFavorite = checkIsFavorite(service.id);
                        
                        return (
                          <motion.div
                            key={service.id}
                            variants={itemVariants}
                            layout
                          >
                            <Card 
                              className={cn(
                                "group border-border/50 hover:border-primary/40 transition-all cursor-pointer overflow-hidden",
                                isActive && "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-lg shadow-primary/10"
                              )}
                              onClick={() => handleSelectService(service)}
                            >
                              <CardContent className="p-0">
                                <div className="flex items-stretch">
                                  {/* Left accent bar */}
                                  <motion.div 
                                    className={cn(
                                      "w-1.5 shrink-0 transition-all",
                                      isActive 
                                        ? "bg-gradient-to-b from-primary to-accent" 
                                        : "bg-border group-hover:bg-primary/50"
                                    )}
                                    layoutId={`accent-${service.id}`}
                                  />
                                  
                                  <div className="flex-1 p-4 flex items-center gap-4">
                                    {/* Service Icon */}
                                    <motion.div 
                                      className={cn(
                                        "hidden sm:flex w-12 h-12 rounded-xl items-center justify-center shrink-0 transition-all",
                                        isActive 
                                          ? "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30" 
                                          : "bg-gradient-to-br from-muted/50 to-muted group-hover:from-primary/10 group-hover:to-accent/10"
                                      )}
                                      whileHover={{ rotate: 5, scale: 1.05 }}
                                    >
                                      <Star className={cn(
                                        "w-5 h-5 transition-colors",
                                        isActive ? "text-white" : "text-primary"
                                      )} />
                                    </motion.div>
                                    
                                    {/* Service Info */}
                                    <div className="flex-1 min-w-0">
                                      <h3 className={cn(
                                        "font-semibold text-sm leading-relaxed line-clamp-2 transition-colors",
                                        isActive ? "text-primary" : "group-hover:text-primary"
                                      )}>
                                        {service.name}
                                      </h3>
                                      
                                      {/* Badges */}
                                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                        {service.external_service_id && (
                                          <Badge variant="outline" className="text-[10px] h-5 px-2 bg-muted/50 font-mono">
                                            #{service.external_service_id}
                                          </Badge>
                                        )}
                                        {service.refill_enabled && (
                                          <Badge className="text-[10px] h-5 px-2 bg-success/10 text-success border-success/20 gap-1">
                                            <Shield className="w-3 h-3" />
                                            ضمان
                                          </Badge>
                                        )}
                                        <Badge variant="secondary" className="text-[10px] h-5 px-2 gap-1">
                                          <Clock className="w-3 h-3" />
                                          سريع
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    {/* Price & Actions */}
                                    <div className="flex items-center gap-4 shrink-0">
                                      <div className="text-left">
                                        <div className="flex items-baseline gap-1">
                                          <motion.span 
                                            className={cn(
                                              "text-xl font-bold",
                                              isActive ? "text-primary" : ""
                                            )}
                                            key={service.price}
                                            initial={{ scale: 1.2 }}
                                            animate={{ scale: 1 }}
                                          >
                                            {service.price.toFixed(2)}
                                          </motion.span>
                                          <span className="text-[10px] text-muted-foreground">ر.س</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">لكل 1000</p>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-xl hover:bg-destructive/10"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite(service.id);
                                            }}
                                          >
                                            <Heart className={cn(
                                              "w-5 h-5 transition-all",
                                              isFavorite 
                                                ? "fill-destructive text-destructive scale-110" 
                                                : "text-muted-foreground hover:text-destructive"
                                            )} />
                                          </Button>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                          <Button
                                            size="icon"
                                            className={cn(
                                              "h-10 w-10 rounded-xl transition-all shadow-lg",
                                              isActive 
                                                ? "bg-gradient-to-l from-success to-success/80 shadow-success/30" 
                                                : "bg-gradient-to-l from-primary to-accent shadow-primary/30 hover:shadow-primary/50"
                                            )}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSelectService(service);
                                            }}
                                          >
                                            {isActive ? (
                                              <Check className="w-5 h-5 text-white" />
                                            ) : (
                                              <ArrowUpRight className="w-5 h-5 text-white" />
                                            )}
                                          </Button>
                                        </motion.div>
                                      </div>
                                    </div>
                                  </div>
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
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16"
                >
                  <motion.div 
                    className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center relative"
                    animate={{ 
                      y: [0, -8, 0],
                      rotate: [0, 3, -3, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <ChevronRight className="w-12 h-12 text-muted-foreground/30" />
                    <motion.div 
                      className="absolute inset-0 rounded-3xl border-2 border-dashed border-muted-foreground/20"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                  <h3 className="font-bold text-2xl mb-3">اختر قسماً للبدء</h3>
                  <p className="text-sm text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
                    اختر أحد الأقسام أعلاه لعرض الخدمات المتاحة والبدء في الطلب
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Action Button - Mobile */}
        {selectedCategory && !showMobileForm && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="lg:hidden fixed bottom-20 left-4 right-4 z-40"
          >
            <Button
              size="lg"
              className="w-full h-14 text-lg gap-3 bg-gradient-to-l from-primary via-primary to-accent hover:opacity-90 shadow-2xl shadow-primary/40 rounded-2xl border-t border-white/20"
              onClick={() => {
                if (selectedService) {
                  setShowMobileForm(true);
                } else {
                  toast.info("اختر خدمة أولاً");
                }
              }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                <ShoppingCart className="w-6 h-6" />
              </motion.div>
              طلب جديد
              <ArrowUpRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesNew;
