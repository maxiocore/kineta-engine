import { useState, useEffect, useMemo } from "react";
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
  TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import SocialNetworkGrid from "@/components/services/SocialNetworkGrid";
import ServiceOrderDialog from "@/components/services/ServiceOrderDialog";
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
}

const ClientServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel("client-services")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => {
        fetchServices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  // Get category slug from category name
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

  // Count services by category
  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      const slug = getCategorySlug(service.category);
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const categorySlug = getCategorySlug(service.category);
      const matchesCategory = selectedCategory === "all" || categorySlug === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

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
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent p-3 shadow-lg shadow-primary/20">
                <Package className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">الخدمات</h1>
                <p className="text-muted-foreground text-sm">اختر الخدمة المناسبة واطلبها الآن</p>
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

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث في الخدمات..."
              className="pr-12 h-12 bg-card/50 backdrop-blur-sm border-border/50 rounded-xl text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Results count */}
          <div className="flex items-center justify-center px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <span className="text-sm text-muted-foreground">
              النتائج: <span className="font-bold text-foreground">{filteredServices.length}</span>
            </span>
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
              <Card className="glass border-border/50">
                <CardContent className="py-20 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">لا توجد خدمات</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {searchQuery || selectedCategory !== "all"
                      ? "لا توجد نتائج مطابقة للبحث، جرب تغيير معايير البحث"
                      : "لا توجد خدمات متاحة حالياً، عد لاحقاً"}
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
                      إعادة تعيين الفلاتر
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
              className="space-y-8"
            >
              {Object.entries(groupedServices).map(([category, categoryServices], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.05 }}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 rounded-full bg-gradient-to-b from-primary to-accent" />
                    <h2 className="text-xl font-bold">{category}</h2>
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border-none"
                    >
                      {categoryServices.length} خدمة
                    </Badge>
                  </div>
                  
                  {/* Services Grid */}
                  <div className="grid gap-3">
                    {categoryServices.map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Card className={cn(
                          "group glass border-border/50 hover:border-primary/30 transition-all duration-300",
                          "hover:shadow-lg hover:shadow-primary/5"
                        )}>
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              {/* Service Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-3">
                                  {/* Service icon */}
                                  <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                                    <Star className="w-5 h-5 text-primary" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm sm:text-base leading-relaxed group-hover:text-primary transition-colors">
                                      {service.name}
                                    </h3>
                                    {service.description && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {service.description}
                                      </p>
                                    )}
                                    
                                    {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      {service.external_service_id && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-2 bg-muted/50">
                                          <TrendingUp className="w-3 h-3 mr-1" />
                                          #{service.external_service_id}
                                        </Badge>
                                      )}
                                      {service.refill_enabled && (
                                        <Badge className="text-[10px] h-5 px-2 bg-success/10 text-success border-success/20 hover:bg-success/20">
                                          <Shield className="w-3 h-3 mr-1" />
                                          ضمان
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-[10px] h-5 px-2 bg-muted/50">
                                        <Clock className="w-3 h-3 mr-1" />
                                        سريع
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Price & Actions */}
                              <div className="flex items-center gap-4 shrink-0">
                                {/* Price */}
                                <div className="text-left sm:text-center">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xl sm:text-2xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                                      {service.price.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">ر.س</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">لكل 1000</p>
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleFavorite(service.id)}
                                    className={cn(
                                      "rounded-xl transition-all",
                                      checkIsFavorite(service.id) 
                                        ? "text-destructive bg-destructive/10 hover:bg-destructive/20" 
                                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    )}
                                  >
                                    <Heart className={cn(
                                      "w-5 h-5 transition-transform",
                                      checkIsFavorite(service.id) && "fill-current scale-110"
                                    )} />
                                  </Button>
                                  <Button
                                    onClick={() => handleOrder(service)}
                                    className="rounded-xl bg-gradient-to-l from-primary to-accent hover:opacity-90 text-white gap-2 shadow-lg shadow-primary/20"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    <span className="hidden sm:inline">طلب</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

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
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServices;
