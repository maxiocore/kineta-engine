import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Code,
  Search,
  Grid3X3,
  List,
  ShoppingCart,
  Shield,
  Activity,
  TrendingUp,
  Sparkles,
  FileCode,
  Database,
  Server,
  Monitor,
  Smartphone,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ServiceDetailsSheet from "@/components/services/ServiceDetailsSheet";

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

const ClientDevServices = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Keywords for development services
  const devKeywords = ["programming", "code", "web", "app", "برمجة", "موقع", "تطبيق", "development", "developer", "website", "application", "api", "backend", "frontend"];

  // Fetch dev services
  const { data: initialServices, isLoading } = useQuery({
    queryKey: ["dev-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      
      if (error) throw error;
      
      // Filter for dev-related services
      return (data as Service[]).filter(service => {
        const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
        return devKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    },
  });

  useEffect(() => {
    if (initialServices) {
      setServices(initialServices);
    }
  }, [initialServices]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('dev_services_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const service = payload.new as Service;
            const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
            const isDevService = devKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
            
            if (service.status === 'active' && isDevService) {
              setServices(prev => {
                const exists = prev.find(s => s.id === service.id);
                if (exists) {
                  return prev.map(s => s.id === service.id ? service : s);
                }
                return [...prev, service].sort((a, b) => a.price - b.price);
              });
              if (payload.eventType === 'INSERT') {
                toast.success(`خدمة جديدة: ${service.name}`);
              }
            } else {
              setServices(prev => prev.filter(s => s.id !== service.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setServices(prev => prev.filter(s => s.id !== (payload.old as Service).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter by search
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

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <Code className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">خدمات البرمجة والتطوير</h1>
                <LiveIndicator />
              </div>
              <p className="text-muted-foreground">تطوير مواقع وتطبيقات بأحدث التقنيات</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-2">
              <Activity className="w-3 h-3" />
              {services.length} خدمة
            </Badge>
          </div>
        </motion.div>

        {/* Search & View Toggle */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن خدمة برمجة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 text-base rounded-xl"
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

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <Code className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">لا توجد خدمات برمجة حالياً</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "لم يتم العثور على خدمات تطابق البحث" : "سيتم إضافة خدمات البرمجة والتطوير قريباً"}
            </p>
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
                    className="h-full cursor-pointer border-border/50 hover:border-emerald-500/30 transition-all duration-300"
                    onClick={() => handleServiceClick(service)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-base group-hover:text-emerald-500 transition-colors line-clamp-2">
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

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">السعر</p>
                          <p className="text-xl font-bold text-emerald-500">
                            ${service.price.toFixed(2)}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
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

      {/* Service Details Sheet */}
      <ServiceDetailsSheet
        service={selectedService ? {
          ...selectedService,
          refill_days: null,
        } : null}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onOrder={() => selectedService && handleOrder(selectedService)}
        isFavorite={false}
        onToggleFavorite={() => {}}
      />
    </ClientDashboardLayout>
  );
};

export default ClientDevServices;
