import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Code,
  Search,
  Grid3X3,
  List,
  Activity,
  FileCode,
  Database,
  Server,
  Monitor,
  Smartphone,
  Globe,
  Layers,
  Cpu,
  Terminal,
  Sparkles,
  Zap,
  Star,
  Shield,
  Clock,
  ArrowUpRight,
  Filter,
  TrendingUp,
  Package,
  CheckCircle2,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ServiceDetailsSheet from "@/components/services/ServiceDetailsSheet";
import ServicesPageSkeleton from "@/components/dashboard/ServicesPageSkeleton";
import PullToRefresh from "@/components/ui/pull-to-refresh";

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

// Category configuration
const serviceCategories = [
  { id: "all", name: "جميع الخدمات", icon: Layers, color: "from-emerald-500 to-teal-500" },
  { id: "web", name: "تطوير الويب", icon: Globe, color: "from-blue-500 to-cyan-500" },
  { id: "mobile", name: "تطبيقات الجوال", icon: Smartphone, color: "from-purple-500 to-pink-500" },
  { id: "backend", name: "باك إند", icon: Server, color: "from-orange-500 to-red-500" },
  { id: "database", name: "قواعد البيانات", icon: Database, color: "from-green-500 to-emerald-500" },
  { id: "api", name: "APIs", icon: Terminal, color: "from-indigo-500 to-purple-500" },
];

// Stats configuration
const statsConfig = [
  { label: "خدمة متاحة", icon: Package, color: "text-emerald-500" },
  { label: "مشروع منجز", icon: CheckCircle2, color: "text-blue-500", value: "500+" },
  { label: "رضا العملاء", icon: Star, color: "text-amber-500", value: "98%" },
  { label: "دعم متواصل", icon: Clock, color: "text-purple-500", value: "24/7" },
];

const serviceIcons = [Code, FileCode, Database, Server, Monitor, Smartphone, Globe, Layers, Cpu, Terminal];

const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <motion.div
      className="w-2 h-2 rounded-full bg-emerald-500"
      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-xs font-semibold text-emerald-500">مباشر</span>
  </motion.div>
);

const ClientDevServices = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const devKeywords = ["programming", "code", "web", "app", "برمجة", "موقع", "تطبيق", "development", "developer", "website", "application", "api", "backend", "frontend"];

  const { data: initialServices, isLoading, refetch } = useQuery({
    queryKey: ["dev-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      
      if (error) throw error;
      
      return (data as Service[]).filter(service => {
        const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
        return devKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    },
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success("تم تحديث الخدمات");
  };

  useEffect(() => {
    if (initialServices) {
      setServices(initialServices);
    }
  }, [initialServices]);

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

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesPageSkeleton title="خدمات البرمجة" color="emerald" />
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="space-y-8 pb-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 lg:p-10"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0],
                }}
                transition={{ duration: 10, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  x: [0, 20, 0],
                }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              {/* Code Pattern Background */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 left-4 text-white text-xs font-mono">{'<code>'}</div>
                <div className="absolute bottom-4 right-4 text-white text-xs font-mono">{'</code>'}</div>
                <div className="absolute top-1/3 right-1/4 text-white text-lg font-mono">{'{}'}</div>
                <div className="absolute bottom-1/3 left-1/4 text-white text-lg font-mono">{'()'}</div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <motion.div 
                      className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                    >
                      <Code className="w-8 h-8 text-white" />
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                          خدمات البرمجة والتطوير
                        </h1>
                        <LiveIndicator />
                      </div>
                      <p className="text-white/80 text-sm sm:text-base mt-1">
                        حلول برمجية احترافية بأحدث التقنيات
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    {statsConfig.map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl"
                      >
                        <stat.icon className="w-4 h-4 text-white" />
                        <span className="text-white font-bold text-sm">
                          {stat.value || services.length}
                        </span>
                        <span className="text-white/70 text-xs">{stat.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Feature Highlights */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="hidden lg:grid grid-cols-2 gap-3"
                >
                  {[
                    { icon: Zap, text: "تنفيذ سريع" },
                    { icon: Shield, text: "ضمان الجودة" },
                    { icon: Sparkles, text: "تقنيات حديثة" },
                    { icon: TrendingUp, text: "أداء عالي" },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl">
                      <feature.icon className="w-4 h-4 text-white" />
                      <span className="text-white text-sm">{feature.text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Search & Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن خدمة برمجة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-12 h-14 text-base rounded-2xl border-2 border-transparent bg-card/80 focus:border-emerald-500/50 transition-all"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={`h-14 w-14 rounded-2xl ${viewMode === "grid" ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : ""}`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={`h-14 w-14 rounded-2xl ${viewMode === "list" ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : ""}`}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {serviceCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all shrink-0 ${
                    activeCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : "bg-card hover:bg-muted border border-border"
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Services Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-2 px-3 py-1.5">
                <Activity className="w-3.5 h-3.5" />
                {filteredServices.length} خدمة
              </Badge>
              {searchQuery && (
                <Badge variant="outline" className="gap-1">
                  نتائج البحث عن "{searchQuery}"
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div 
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-6"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Code className="w-12 h-12 text-emerald-500" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-3">لا توجد خدمات برمجة حالياً</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery 
                  ? "لم يتم العثور على خدمات تطابق البحث، جرب كلمات بحث مختلفة" 
                  : "سيتم إضافة خدمات البرمجة والتطوير قريباً"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key={viewMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`grid gap-5 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                }`}
              >
                {filteredServices.map((service, index) => {
                  const IconComponent = serviceIcons[index % serviceIcons.length];
                  const isBestSeller = index === 0;
                  const features = Array.isArray(service.features) ? service.features.slice(0, 3) : [];
                  
                  if (viewMode === "list") {
                    return (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 5 }}
                        className="group"
                      >
                        <Card className="overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-5">
                              <motion.div 
                                whileHover={{ rotate: 10, scale: 1.1 }}
                                className="relative shrink-0"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 blur-xl opacity-40" />
                                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                  <IconComponent className="w-8 h-8 text-white" />
                                </div>
                              </motion.div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg truncate">{service.name}</h3>
                                  {isBestSeller && (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shrink-0">
                                      <Star className="w-3 h-3 ml-1 fill-current" />
                                      الأكثر طلباً
                                    </Badge>
                                  )}
                                </div>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {service.description}
                                  </p>
                                )}
                              </div>

                            <div className="text-left shrink-0">
                                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                  {service.price.toFixed(0)} ر.س
                                </p>
                                <span className="text-xs text-muted-foreground">للمشروع</span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleServiceClick(service)}
                                  className="rounded-xl"
                                >
                                  التفاصيل
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleOrder(service)}
                                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl"
                                >
                                  اطلب الآن
                                  <ArrowUpRight className="w-4 h-4 mr-1" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group h-full"
                    >
                      <Card className="h-full relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl">
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-all duration-700" />
                        
                        {/* Best Seller Ribbon */}
                        {isBestSeller && (
                          <div className="absolute top-4 -right-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-1 px-10 rotate-45 shadow-lg">
                            الأكثر طلباً
                          </div>
                        )}

                        <CardContent className="relative z-10 p-6 h-full flex flex-col">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <motion.div 
                              whileHover={{ rotate: 10, scale: 1.1 }}
                              className="relative"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                                <IconComponent className="w-7 h-7 text-white" />
                              </div>
                            </motion.div>

                            <div className="text-left">
                              <motion.p 
                                whileHover={{ scale: 1.05 }}
                                className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
                              >
                                {service.price.toFixed(0)} ر.س
                              </motion.p>
                              <span className="text-xs text-muted-foreground">للمشروع</span>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            {service.refill_enabled && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Shield className="w-3 h-3" />
                                ضمان
                              </Badge>
                            )}
                          </div>

                          {/* Service Name */}
                          <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {service.name}
                          </h3>

                          {/* Description */}
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                              {service.description}
                            </p>
                          )}

                          {/* Features */}
                          {features.length > 0 && (
                            <div className="space-y-1.5 mb-4">
                              {features.map((feature: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="text-muted-foreground truncate">{feature}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Delivery Time */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 mt-auto">
                            <Clock className="w-4 h-4" />
                            <span>التسليم: 24-72 ساعة</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleServiceClick(service)}
                              className="flex-1 rounded-xl h-11 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                            >
                              التفاصيل
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOrder(service)}
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl h-11 shadow-lg group/btn"
                            >
                              <span className="flex items-center gap-1">
                                اطلب الآن
                                <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                              </span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
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
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

export default ClientDevServices;
