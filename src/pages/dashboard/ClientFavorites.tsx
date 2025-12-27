import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Heart, 
  Search, 
  Package, 
  ShoppingCart,
  Star,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import ServiceOrderDialog from "@/components/services/ServiceOrderDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { translateCategory } from "@/lib/categoryTranslation";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  status: string;
  features: any;
  external_service_id: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ClientFavorites = () => {
  const { user } = useAuth();
  const { favorites, isFavorite, toggleFavorite, loading: favoritesLoading } = useFavorites();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  useEffect(() => {
    if (favorites.length > 0) {
      fetchFavoriteServices();
    } else if (!favoritesLoading) {
      setServices([]);
      setLoading(false);
    }
  }, [favorites, favoritesLoading]);

  const fetchFavoriteServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .in('id', favorites)
      .eq('status', 'active');

    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  const handleOrderService = (service: Service) => {
    setSelectedService(service);
    setOrderDialogOpen(true);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || favoritesLoading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <motion.div 
        className="space-y-4 md:space-y-6 px-1"
        dir="rtl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header - Mobile Optimized */}
        <motion.div variants={itemVariants}>
          <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
            <Heart className="w-6 h-6 md:w-8 md:h-8 text-destructive fill-destructive" />
            خدماتي المفضلة
          </h1>
          <p className="text-xs md:text-base text-muted-foreground">الخدمات التي قمت بإضافتها للمفضلة</p>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants}>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Input
              placeholder="البحث في المفضلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-10 md:h-11 text-sm md:text-base"
            />
          </div>
        </motion.div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="card-elevated">
              <CardContent className="p-12 text-center">
                <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "لا توجد نتائج" : "لا توجد خدمات مفضلة"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "جرب تغيير كلمات البحث" 
                    : "قم بإضافة خدمات للمفضلة من صفحة الخدمات"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service, index) => (
              <motion.div 
                key={service.id} 
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <Card className="card-elevated h-full overflow-hidden group">
                  <CardContent className="p-4 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {translateCategory(service.category)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleFavorite(service.id)}
                      >
                        <Heart className="w-4 h-4 fill-destructive text-destructive" />
                      </Button>
                    </div>
                    
                    <h3 className="font-semibold mb-2 line-clamp-2">{service.name}</h3>
                    
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">السعر لكل 1000</p>
                          <p className="text-lg font-bold text-primary">
                            {service.price.toFixed(2)} ر.س
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleOrderService(service)}
                          className="gap-1"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          طلب
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Order Dialog */}
      {selectedService && (
        <ServiceOrderDialog
          service={selectedService}
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          userId={user?.id || null}
        />
      )}
    </ClientDashboardLayout>
  );
};

export default ClientFavorites;
