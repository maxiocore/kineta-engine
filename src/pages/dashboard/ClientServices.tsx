import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Loader2, ShoppingCart, Star, Heart } from "lucide-react";
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent p-2.5">
              <Package className="w-full h-full text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">الخدمات</h1>
          </motion.div>
          <p className="text-muted-foreground">اختر الخدمة المناسبة واطلبها الآن</p>
        </div>

        {/* Social Network Grid */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <SocialNetworkGrid
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              serviceCounts={serviceCounts}
            />
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="بحث في الخدمات..."
            className="pr-10 h-12 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Services Count */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            عدد الخدمات: <span className="font-bold text-foreground">{filteredServices.length}</span>
          </p>
        </div>

        {/* Services List */}
        {filteredServices.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-16 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "لا توجد نتائج مطابقة للبحث"
                  : "لا توجد خدمات متاحة حالياً"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold">{category}</h2>
                  <Badge variant="secondary">{categoryServices.length}</Badge>
                </div>
                
                <div className="grid gap-3">
                  {categoryServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="glass border-border/50 hover:border-primary/30 transition-all">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <Star className="w-4 h-4 text-warning mt-1 shrink-0" />
                                <div>
                                  <h3 className="font-medium text-sm leading-relaxed">
                                    {service.name}
                                  </h3>
                                  {service.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {service.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {service.external_service_id && (
                                      <Badge variant="outline" className="text-[10px]">
                                        #{service.external_service_id}
                                      </Badge>
                                    )}
                                    {service.refill_enabled && (
                                      <Badge variant="secondary" className="text-[10px] bg-success/10 text-success">
                                        ضمان
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-left">
                                <p className="text-lg font-bold text-primary">
                                  {service.price.toFixed(2)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">ر.س / 1000</p>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleFavorite(service.id)}
                                  className={checkIsFavorite(service.id) ? "text-destructive" : "text-muted-foreground"}
                                >
                                  <Heart className={`w-4 h-4 ${checkIsFavorite(service.id) ? "fill-current" : ""}`} />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleOrder(service)}
                                  className="bg-gradient-to-l from-primary to-accent text-primary-foreground gap-2"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                  طلب
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
          </div>
        )}

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
