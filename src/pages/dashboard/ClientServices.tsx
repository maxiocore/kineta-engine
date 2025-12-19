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
  TrendingUp,
  Filter,
  ChevronDown,
  Hash,
  DollarSign,
  Info,
  RefreshCw,
  Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import SocialNetworkGrid from "@/components/services/SocialNetworkGrid";
import ServiceOrderDialog from "@/components/services/ServiceOrderDialog";
import ServiceDetailsSheet from "@/components/services/ServiceDetailsSheet";
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
  refill_days: number | null;
}

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

const ClientServices = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
    setIsDetailsSheetOpen(true);
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();

    // Realtime subscription for instant updates
    const servicesChannel = supabase
      .channel("services-realtime")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "services" 
      }, (payload) => {
        console.log("Service changed:", payload);
        handleServiceChange(payload);
      })
      .subscribe();

    const categoriesChannel = supabase
      .channel("categories-realtime")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "categories" 
      }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  const handleServiceChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setServices(prev => {
      switch (eventType) {
        case "INSERT":
          if (newRecord.status === "active") {
            toast.success("تمت إضافة خدمة جديدة!", { 
              description: newRecord.name,
              duration: 4000 
            });
            return [...prev, newRecord];
          }
          return prev;
          
        case "UPDATE":
          if (newRecord.status === "active") {
            return prev.map(s => s.id === newRecord.id ? newRecord : s);
          } else {
            return prev.filter(s => s.id !== newRecord.id);
          }
          
        case "DELETE":
          return prev.filter(s => s.id !== oldRecord.id);
          
        default:
          return prev;
      }
    });
  };

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

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    
    if (data) {
      setCategories(data);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchServices();
    setIsRefreshing(false);
    toast.success("تم تحديث الخدمات");
  };

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

  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      const slug = getCategorySlug(service.category);
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (service.external_service_id?.includes(searchQuery));
      
      const categorySlug = getCategorySlug(service.category);
      const matchesCategory = selectedCategory === "all" || categorySlug === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

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

  const expandAllCategories = () => {
    setExpandedCategories(new Set(Object.keys(groupedServices)));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

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

  // Auto-expand all categories on initial load
  useEffect(() => {
    if (Object.keys(groupedServices).length > 0 && expandedCategories.size === 0) {
      expandAllCategories();
    }
  }, [groupedServices]);

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
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent p-3 shadow-lg shadow-primary/20">
                <Package className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">قائمة الخدمات</h1>
                <p className="text-muted-foreground text-sm">تحديث لحظي • اختر خدمتك وابدأ الآن</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20"
              >
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-success">متصل مباشر</span>
              </motion.div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-xl gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                تحديث
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{services.length} خدمة</span>
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

        {/* Search & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الرقم أو الوصف..."
              className="pr-12 h-12 bg-card/50 backdrop-blur-sm border-border/50 rounded-xl text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAllCategories}
              className="rounded-xl text-xs"
            >
              فتح الكل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAllCategories}
              className="rounded-xl text-xs"
            >
              إغلاق الكل
            </Button>
            <div className="flex items-center justify-center px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <span className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{filteredServices.length}</span> نتيجة
              </span>
            </div>
          </div>
        </motion.div>

        {/* Services Table */}
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
                      ? "لا توجد نتائج مطابقة للبحث"
                      : "لا توجد خدمات متاحة حالياً"}
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
                      إعادة تعيين
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
              className="space-y-4"
            >
              {Object.entries(groupedServices).map(([category, categoryServices], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.03 }}
                >
                  <Collapsible
                    open={expandedCategories.has(category)}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <Card className="glass border-border/50 overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-right">
                              <h3 className="font-bold text-base sm:text-lg">{category}</h3>
                              <p className="text-xs text-muted-foreground">{categoryServices.length} خدمة متاحة</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                              {categoryServices.length}
                            </Badge>
                            <ChevronDown className={cn(
                              "w-5 h-5 text-muted-foreground transition-transform duration-300",
                              expandedCategories.has(category) && "rotate-180"
                            )} />
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t border-border/50">
                        {/* Services List - RTL Layout: ID Right, Name Center, Price Left */}
                          <div className="divide-y divide-border/50">
                            {categoryServices.map((service, index) => (
                              <motion.div
                                key={service.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="group hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                                onClick={() => handleViewDetails(service)}
                              >
                                <div className="flex items-center gap-3 p-3 sm:p-4">
                                  {/* ID Badge - Right */}
                                  <div className="shrink-0 w-14 sm:w-16">
                                    <Badge 
                                      variant="outline" 
                                      className="w-full justify-center font-mono text-xs sm:text-sm h-7 sm:h-8 bg-muted/50 border-border"
                                    >
                                      {service.external_service_id || "-"}
                                    </Badge>
                                  </div>
                                  
                                  {/* Service Name - Center (Flex Grow) */}
                                  <div className="flex-1 min-w-0 px-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium text-sm sm:text-base leading-relaxed group-hover:text-primary transition-colors line-clamp-2">
                                        {service.name}
                                      </p>
                                      {service.refill_enabled && (
                                        <Badge className="text-[10px] h-5 px-1.5 bg-success/10 text-success border-success/20 shrink-0">
                                          <Shield className="w-3 h-3 ml-0.5" />
                                          ضمان
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Price - Left */}
                                  <div className="shrink-0 text-left min-w-[90px] sm:min-w-[110px]">
                                    <div className="flex items-baseline gap-1 justify-end">
                                      <span className="text-base sm:text-lg font-bold text-primary">
                                        ${service.price.toFixed(4)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* View Details Button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetails(service);
                                    }}
                                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  
                                  {/* Favorite Button - Far Left */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(service.id);
                                    }}
                                    className={cn(
                                      "h-8 w-8 sm:h-9 sm:w-9 rounded-lg shrink-0 transition-all",
                                      checkIsFavorite(service.id) 
                                        ? "text-destructive bg-destructive/10 hover:bg-destructive/20" 
                                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    )}
                                  >
                                    <Heart className={cn(
                                      "w-4 h-4",
                                      checkIsFavorite(service.id) && "fill-current"
                                    )} />
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service Details Sheet */}
        <ServiceDetailsSheet
          service={selectedService}
          isOpen={isDetailsSheetOpen}
          onClose={() => {
            setIsDetailsSheetOpen(false);
            setSelectedService(null);
          }}
          onOrder={handleOrder}
          isFavorite={selectedService ? checkIsFavorite(selectedService.id) : false}
          onToggleFavorite={toggleFavorite}
        />

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
