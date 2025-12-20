import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Palette,
  Search,
  Grid3X3,
  List,
  ShoppingCart,
  Shield,
  Activity,
  Check,
  Star,
  Clock,
  ArrowLeft,
  Sparkles,
  Zap,
  Award,
  Layers,
  PenTool,
  Image,
  Globe,
  Rocket,
  Users,
  MessageSquare,
  Target,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import EnhancedServiceCard from "@/components/services/EnhancedServiceCard";

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

const ServiceFeatureIcon = ({ index }: { index: number }) => {
  const icons = [Check, Star, Zap, Award, Shield];
  const Icon = icons[index % icons.length];
  return <Icon className="w-3.5 h-3.5 text-green-500" />;
};

const ClientDesignServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [balance, setBalance] = useState(0);

  // Keywords for design services
  const designKeywords = ["design", "graphic", "logo", "brand", "تصميم", "شعار", "هوية", "جرافيك", "بوستر", "فوتوشوب", "illustrator"];

  // Fetch design services
  const { data: initialServices, isLoading } = useQuery({
    queryKey: ["design-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      
      if (error) throw error;
      
      return (data as Service[]).filter(service => {
        const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
        return designKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    },
  });

  useEffect(() => {
    if (initialServices) {
      setServices(initialServices);
    }
  }, [initialServices]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (data) setBalance(data.balance);
  };

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('design_services_realtime')
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
            const isDesignService = designKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
            
            if (service.status === 'active' && isDesignService) {
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

  const getFeatures = (service: Service): string[] => {
    if (Array.isArray(service.features)) return service.features;
    return [];
  };

  const getServiceIcon = (index: number) => {
    const icons = [PenTool, Palette, Image, Layers, Globe];
    return icons[index % icons.length];
  };

  const handleOrderClick = (service: Service) => {
    navigate(`/dashboard/design-services/order?serviceId=${service.id}`);
  };

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 lg:space-y-8" dir="rtl">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 p-6 sm:p-8 lg:p-10"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          
          {/* Floating Icons */}
          <motion.div 
            className="absolute top-6 left-6 opacity-20"
            animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Palette className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div 
            className="absolute bottom-6 left-1/4 opacity-20"
            animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          >
            <PenTool className="w-10 h-10 text-white" />
          </motion.div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <Link to="/dashboard/our-services">
                  <motion.div 
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </motion.div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">خدمات التصميم الإبداعي</h1>
                    <LiveIndicator />
                  </div>
                  <p className="text-white/80 text-sm sm:text-base max-w-xl">
                    نحول أفكارك إلى تصاميم مبهرة تعكس هوية علامتك التجارية وتجذب جمهورك المستهدف
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm"
                >
                  <Activity className="w-4 h-4 text-white" />
                  <span className="font-semibold text-white">{services.length} خدمة متاحة</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm"
                >
                  <span className="text-white/80 text-sm">رصيدك:</span>
                  <span className="font-bold text-white text-lg">{balance.toFixed(2)} ر.س</span>
                </motion.div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { icon: Rocket, label: "تسليم سريع", value: "24-48 ساعة" },
                { icon: Shield, label: "ضمان الجودة", value: "100%" },
                { icon: Users, label: "عملاء سعداء", value: "+1000" },
                { icon: Award, label: "مصممين محترفين", value: "+50" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center"
                >
                  <stat.icon className="w-5 h-5 text-white/80 mx-auto mb-1" />
                  <p className="text-white font-bold text-sm">{stat.value}</p>
                  <p className="text-white/60 text-xs">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن خدمة تصميم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 text-base rounded-xl bg-card border-border/50 focus:border-purple-500/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-12 w-12 rounded-xl ${viewMode === "grid" ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}`}
            >
              <Grid3X3 className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-12 w-12 rounded-xl ${viewMode === "list" ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}`}
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 lg:py-24"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
              <Palette className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">لا توجد خدمات تصميم حالياً</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery ? "لم يتم العثور على خدمات تطابق البحث" : "سيتم إضافة خدمات التصميم قريباً"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`grid gap-4 sm:gap-5 lg:gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" 
                  : "grid-cols-1"
              }`}
            >
              {filteredServices.map((service, index) => {
                const IconComponent = getServiceIcon(index);
                return (
                  <EnhancedServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    icon={IconComponent}
                    gradientFrom="purple-500"
                    gradientVia="fuchsia-500"
                    gradientTo="pink-500"
                    onOrder={handleOrderClick}
                    onViewDetails={() => {
                      setSelectedService(service);
                      setDetailsDialogOpen(true);
                    }}
                    showBestSeller={true}
                    viewMode={viewMode}
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Why Choose Us Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-center mb-8">لماذا تختار خدمات التصميم لدينا؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Target, title: "تصميم هادف", desc: "نفهم أهدافك ونصمم لتحقيقها" },
              { icon: Zap, title: "سرعة التنفيذ", desc: "نلتزم بمواعيد التسليم" },
              { icon: Sparkles, title: "إبداع متجدد", desc: "أفكار مبتكرة ومميزة" },
              { icon: Shield, title: "ضمان الرضا", desc: "نعمل حتى تكون راضياً تماماً" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-card border border-border/50 hover:border-purple-500/30 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Palette className="w-7 h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedService?.name}</DialogTitle>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {selectedService?.price.toFixed(0)} ر.س
                  </p>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-5">
              {selectedService?.description && (
                <div className="p-4 rounded-xl bg-muted/50">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    وصف الخدمة
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedService.description}
                  </p>
                </div>
              )}

              {selectedService && getFeatures(selectedService).length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    مميزات الخدمة
                  </h4>
                  <div className="grid gap-2.5">
                    {getFeatures(selectedService).map((feature, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-card/50 hover:bg-card transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Info */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs text-muted-foreground">مدة التسليم</p>
                    <p className="font-bold">24-48 ساعة</p>
                  </div>
                  <div className="text-center">
                    <MessageSquare className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xs text-muted-foreground">تعديلات</p>
                    <p className="font-bold">غير محدودة</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="rounded-xl">
                إغلاق
              </Button>
              <Button
                onClick={() => {
                  setDetailsDialogOpen(false);
                  if (selectedService) {
                    handleOrderClick(selectedService);
                  }
                }}
                className="gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <ShoppingCart className="w-4 h-4" />
                اطلب الآن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDesignServices;
