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
  ChevronUp,
  Layers,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("name");

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
    let result = services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.external_service_id?.includes(searchQuery));
      
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
      
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

  // Group services by category
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

  // Toggle category expansion
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

  // Expand all categories by default
  useEffect(() => {
    if (Object.keys(groupedServices).length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(Object.keys(groupedServices)));
    }
  }, [groupedServices]);

  const handleSelectService = (service: Service) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول للطلب");
      return;
    }
    setSelectedService(service);
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
    
    // Fallback based on name
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
                <h1 className="text-2xl md:text-3xl font-bold">الخدمات</h1>
                <p className="text-muted-foreground text-sm">اختر الخدمة وأكمل طلبك مباشرة</p>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <Zap className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">{services.length} خدمة</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <Heart className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium">{favorites.length} مفضلة</span>
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
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {/* All Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border transition-all",
                    selectedCategory === "all"
                      ? "bg-primary/10 border-primary/50"
                      : "bg-card hover:bg-muted/50 border-border/50"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">الكل</p>
                    <p className="text-[10px] text-muted-foreground">{services.length} خدمة</p>
                  </div>
                </motion.button>

                {/* Category Buttons */}
                {serviceCategories.map((category, index) => {
                  const IconComponent = getCategoryIcon(category);
                  const count = categoryCounts[category] || 0;
                  
                  return (
                    <motion.button
                      key={category}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border transition-all",
                        selectedCategory === category
                          ? "bg-primary/10 border-primary/50"
                          : "bg-card hover:bg-muted/50 border-border/50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                        <IconComponent className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{category}</p>
                        <p className="text-[10px] text-muted-foreground">{count} خدمة</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، الرقم، أو الفئة..."
              className="pr-12 h-11 bg-card/50 border-border/50 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">الاسم</SelectItem>
              <SelectItem value="price-asc">السعر: الأقل أولاً</SelectItem>
              <SelectItem value="price-desc">السعر: الأعلى أولاً</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center px-4 py-2 rounded-xl bg-card/50 border border-border/50">
            <span className="text-sm text-muted-foreground">
              النتائج: <span className="font-bold text-foreground">{filteredServices.length}</span>
            </span>
          </div>
        </motion.div>

        {/* Main Content - Services & Order Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Services List */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {filteredServices.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border-border/50">
                    <CardContent className="py-16 text-center">
                      <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="font-bold mb-2">لا توجد خدمات</h3>
                      <p className="text-sm text-muted-foreground">
                        جرب تغيير معايير البحث
                      </p>
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
                  {Object.entries(groupedServices).map(([category, categoryServices]) => (
                    <Card key={category} className="border-border/50 overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {(() => {
                            const IconComponent = getCategoryIcon(category);
                            return (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-primary" />
                              </div>
                            );
                          })()}
                          <div className="text-right">
                            <h3 className="font-bold">{category}</h3>
                            <p className="text-xs text-muted-foreground">{categoryServices.length} خدمة</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedCategories.has(category) ? 180 : 0 }}
                        >
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        </motion.div>
                      </button>

                      {/* Services */}
                      <AnimatePresence>
                        {expandedCategories.has(category) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="border-t border-border/50">
                              {categoryServices.map((service, index) => (
                                <motion.div
                                  key={service.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.02 }}
                                  className={cn(
                                    "p-4 hover:bg-muted/30 transition-all cursor-pointer border-b border-border/30 last:border-0",
                                    selectedService?.id === service.id && "bg-primary/5 border-r-2 border-r-primary"
                                  )}
                                  onClick={() => handleSelectService(service)}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    {/* Service Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-3">
                                        <div className="hidden sm:flex w-8 h-8 rounded-lg bg-muted items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
                                          {service.external_service_id || index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className={cn(
                                            "font-medium text-sm leading-relaxed transition-colors",
                                            selectedService?.id === service.id && "text-primary"
                                          )}>
                                            {service.name}
                                          </h4>
                                          {service.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                              {service.description}
                                            </p>
                                          )}
                                          {/* Service Features */}
                                          <div className="flex flex-wrap gap-1.5 mt-2">
                                            {service.features?.min && (
                                              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                أدنى: {service.features.min.toLocaleString('ar-SA')}
                                              </Badge>
                                            )}
                                            {service.features?.max && (
                                              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                أقصى: {service.features.max.toLocaleString('ar-SA')}
                                              </Badge>
                                            )}
                                            {service.refill_enabled && (
                                              <Badge className="text-[10px] h-5 px-1.5 bg-success/10 text-success border-success/20">
                                                <Shield className="w-3 h-3 ml-0.5" />
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
                                        <p className="text-lg font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                                          {service.price.toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">ر.س / 1000</p>
                                      </div>
                                      
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(service.id);
                                        }}
                                        className={cn(
                                          "rounded-lg transition-all",
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
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Form Sidebar */}
          <div className="lg:col-span-1">
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
                  <Card className="border-border/50 border-dashed">
                    <CardContent className="py-16 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                        <Star className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-bold mb-2">اختر خدمة للطلب</h3>
                      <p className="text-sm text-muted-foreground">
                        انقر على أي خدمة من القائمة لبدء الطلب
                      </p>
                    </CardContent>
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
