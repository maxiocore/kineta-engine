import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
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
  Palette,
  Code,
  PenTool,
  Figma,
  FileCode,
  Database,
  Server,
  Brush,
  Image,
  Video,
  Monitor,
  Smartphone,
  Box,
  ArrowRight,
  Search,
  Zap,
  Shield,
  Clock,
  Star,
  ChevronLeft,
  Activity,
  ShoppingCart,
  Eye,
  Heart,
  Sparkles,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ServiceDetailsSheet from "@/components/services/ServiceDetailsSheet";

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  description_ar: string | null;
  display_order: number;
  is_active: boolean;
  parent_id: string | null;
}

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
  Palette,
  Code,
  PenTool,
  Figma,
  FileCode,
  Database,
  Server,
  Brush,
  Image,
  Video,
  Monitor,
  Smartphone,
  Box,
};

const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      className="w-2 h-2 rounded-full bg-emerald-500"
      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-xs font-medium text-emerald-500">مباشر</span>
  </motion.div>
);

const CategoryDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch category
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      
      if (error) throw error;
      return data as Category;
    },
    enabled: !!slug,
  });

  // Fetch services for this category - search by category_id OR category name/slug
  const { data: initialServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["category-services", category?.id, category?.slug, category?.name],
    queryFn: async () => {
      // Try multiple matching strategies
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .or(`category_id.eq.${category!.id},category.ilike.%${category!.name}%,category.ilike.%${category!.slug}%,category.ilike.%${category!.name_ar}%`)
        .order("price", { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!category?.id,
  });

  useEffect(() => {
    if (initialServices) {
      setServices(initialServices);
    }
  }, [initialServices]);

  // Real-time subscription for services
  useEffect(() => {
    if (!category?.id) return;

    const channel = supabase
      .channel(`services_realtime_${category.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
          filter: `category_id=eq.${category.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newService = payload.new as Service;
            if (newService.status === 'active') {
              setServices(prev => [...prev, newService].sort((a, b) => a.price - b.price));
              toast.success(`تمت إضافة خدمة جديدة: ${newService.name}`);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedService = payload.new as Service;
            setServices(prev => {
              if (updatedService.status !== 'active') {
                return prev.filter(s => s.id !== updatedService.id);
              }
              const exists = prev.find(s => s.id === updatedService.id);
              if (exists) {
                return prev.map(s => s.id === updatedService.id ? updatedService : s);
              } else {
                return [...prev, updatedService].sort((a, b) => a.price - b.price);
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedService = payload.old as Service;
            setServices(prev => prev.filter(s => s.id !== deletedService.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category?.id]);

  // Filter services by search
  const filteredServices = services.filter(service => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query)
    );
  });

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsSheetOpen(true);
  };

  const handleOrder = (service: Service) => {
    navigate(`/dashboard/services?service=${service.id}`);
  };

  const IconComponent = category ? iconMap[category.icon] || Layers : Layers;

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container px-4 py-16">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container px-4 py-16 text-center">
            <h1 className="text-2xl font-bold mb-4">القسم غير موجود</h1>
            <p className="text-muted-foreground mb-6">عذراً، القسم الذي تبحث عنه غير متاح</p>
            <Button onClick={() => navigate("/our-services")}>
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للخدمات
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 relative overflow-hidden border-b border-border/50">
          <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5`} />
          <motion.div 
            className="absolute top-20 right-[10%] w-72 h-72 bg-primary/10 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="container px-4 relative z-10">
            {/* Breadcrumb */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
            >
              <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              <ChevronLeft className="w-4 h-4" />
              <Link to="/our-services" className="hover:text-primary transition-colors">خدماتنا</Link>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-foreground font-medium">{category.name_ar}</span>
            </motion.nav>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row items-start md:items-center gap-6"
            >
              {/* Category Icon */}
              <motion.div 
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <IconComponent className="w-10 h-10 text-white" />
              </motion.div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    {category.name_ar}
                  </h1>
                  <LiveIndicator />
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {category.description_ar || category.description || "استكشف جميع الخدمات المتاحة في هذا القسم"}
                </p>
                
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="secondary" className="gap-2">
                    <Activity className="w-3 h-3" />
                    {services.length} خدمة متاحة
                  </Badge>
                  <Badge variant="outline" className="gap-2">
                    <TrendingUp className="w-3 h-3" />
                    تحديث لحظي
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Search & Filters */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن خدمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-12 h-12 text-base rounded-xl bg-card/50 border-border/50"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-12 w-12 rounded-xl"
                >
                  <Grid3X3 className="w-5 h-5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-12 w-12 rounded-xl"
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-10 sm:py-16">
          <div className="container px-4">
            {servicesLoading ? (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">لا توجد خدمات</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? "لم يتم العثور على خدمات تطابق البحث" : "لا توجد خدمات متاحة في هذا القسم حالياً"}
                </p>
                <Button onClick={() => navigate("/our-services")} variant="outline">
                  <ArrowRight className="w-4 h-4 ml-2" />
                  استكشف أقسام أخرى
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div 
                  key={viewMode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
                >
                  {filteredServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{ y: -5 }}
                      className="group"
                    >
                      <Card 
                        className={`h-full cursor-pointer border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden ${
                          viewMode === "list" ? "flex flex-row" : ""
                        }`}
                        onClick={() => handleServiceClick(service)}
                      >
                        <CardContent className={`p-5 ${viewMode === "list" ? "flex items-center gap-6 w-full" : ""}`}>
                          {/* Service Header */}
                          <div className={viewMode === "list" ? "flex-1" : ""}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-2">
                                  {service.name}
                                </h3>
                                {service.external_service_id && (
                                  <span className="text-xs text-muted-foreground">
                                    #{service.external_service_id}
                                  </span>
                                )}
                              </div>
                              {service.refill_enabled && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  <Shield className="w-3 h-3 ml-1" />
                                  ضمان
                                </Badge>
                              )}
                            </div>

                            {service.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {service.description}
                              </p>
                            )}

                            {/* Features */}
                            {service.features && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {(() => {
                                  const features = typeof service.features === 'string' 
                                    ? JSON.parse(service.features) 
                                    : service.features;
                                  
                                  if (features.min) {
                                    return (
                                      <Badge variant="outline" className="text-xs">
                                        الحد الأدنى: {features.min}
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                                {(() => {
                                  const features = typeof service.features === 'string' 
                                    ? JSON.parse(service.features) 
                                    : service.features;
                                  
                                  if (features.max) {
                                    return (
                                      <Badge variant="outline" className="text-xs">
                                        الحد الأقصى: {features.max}
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Price & Actions */}
                          <div className={`flex items-center justify-between pt-4 border-t border-border/50 ${
                            viewMode === "list" ? "border-t-0 border-r pr-6 pt-0 flex-col items-end gap-3" : ""
                          }`}>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">السعر لكل 1000</p>
                              <p className="text-xl font-bold text-primary">
                                ${service.price.toFixed(2)}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              className="gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrder(service);
                              }}
                            >
                              <ShoppingCart className="w-4 h-4" />
                              اطلب الآن
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* Related Categories */}
        <section className="py-10 sm:py-16 bg-gradient-to-b from-secondary/20 to-transparent border-t border-border/30">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-bold mb-2">أقسام أخرى</h2>
              <p className="text-muted-foreground">استكشف المزيد من خدماتنا</p>
            </motion.div>

            <RelatedCategories currentCategoryId={category.id} />
          </div>
        </section>
      </main>

      <Footer />

      {/* Service Details Sheet */}
      <ServiceDetailsSheet
        service={selectedService ? {
          id: selectedService.id,
          name: selectedService.name,
          description: selectedService.description,
          price: selectedService.price,
          category: selectedService.category,
          status: selectedService.status,
          features: selectedService.features,
          refill_enabled: selectedService.refill_enabled,
          refill_days: null,
          external_service_id: selectedService.external_service_id,
        } : null}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onOrder={() => selectedService && handleOrder(selectedService)}
        isFavorite={false}
        onToggleFavorite={() => {}}
      />
    </div>
  );
};

// Related Categories Component
const RelatedCategories = ({ currentCategoryId }: { currentCategoryId: string }) => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["related-categories", currentCategoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .neq("id", currentCategoryId)
        .order("display_order", { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data as Category[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories?.map((cat, index) => {
        const CatIcon = iconMap[cat.icon] || Layers;
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Link to={`/category/${cat.slug}`}>
              <Card className="h-full hover:border-primary/30 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-4 text-center">
                  <motion.div 
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-3`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <CatIcon className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {cat.name_ar}
                  </h3>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CategoryDetails;
