import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search,
  Filter,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  RefreshCcw,
  XCircle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@supabase/supabase-js";
import ServiceOrderDialog from "@/components/services/ServiceOrderDialog";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  status: string;
  features: string[];
  image_url: string | null;
  external_service_id: string | null;
}

const Services = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services-public"],
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

  const categories = useMemo(() => {
    if (!services) return [];
    return [...new Set(services.map(s => s.category))].sort();
  }, [services]);

  const groupedServices = useMemo(() => {
    if (!services) return {};
    
    const filtered = services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (s.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const grouped: Record<string, Service[]> = {};
    filtered.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });
    return grouped;
  }, [services, searchQuery, selectedCategory]);

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

  const expandAll = () => {
    setExpandedCategories(new Set(Object.keys(groupedServices)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const handleOrderService = (service: Service) => {
    if (!user) {
      toast.info("يرجى تسجيل الدخول أولاً لطلب الخدمة");
      navigate("/auth");
      return;
    }
    setSelectedService(service);
    setOrderDialogOpen(true);
  };

  const totalServices = services?.length || 0;
  const totalCategories = categories.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-12 relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <motion.div 
            className="absolute top-10 right-[20%] w-64 h-64 bg-primary/10 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge className="mb-4 gap-2" variant="secondary">
                <Sparkles className="w-3 h-3" />
                خدمات SMM Panel
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                اختر من بين{" "}
                <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                  {totalServices}+ خدمة
                </span>
              </h1>
              <p className="text-muted-foreground mb-8">
                خدمات سوشيال ميديا احترافية بأفضل الأسعار وأعلى جودة
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-6">
                {[
                  { icon: Zap, label: "توصيل سريع", color: "text-warning" },
                  { icon: RefreshCcw, label: "تعبئة تلقائية", color: "text-success" },
                  { icon: Shield, label: "ضمان الجودة", color: "text-primary" },
                  { icon: Clock, label: "دعم 24/7", color: "text-accent" },
                ].map((item) => (
                  <motion.div 
                    key={item.label}
                    className="flex items-center gap-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-muted-foreground">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="py-6 sticky top-16 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50">
          <div className="container px-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن خدمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <div className="flex gap-3 items-center">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="جميع الأقسام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام ({totalServices})</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat} ({services?.filter(s => s.category === cat).length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={expandAll}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={collapseAll}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services List */}
        <section className="py-8">
          <div className="container px-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[...Array(3)].map((_, j) => (
                          <Skeleton key={j} className="h-16 w-full" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : Object.keys(groupedServices).length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
                <p className="text-muted-foreground">جرب البحث بكلمات مختلفة</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {Object.entries(groupedServices).map(([category, categoryServices], categoryIndex) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: categoryIndex * 0.05 }}
                    >
                      <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-colors">
                        <CardHeader 
                          className="cursor-pointer hover:bg-muted/30 transition-colors py-4"
                          onClick={() => toggleCategory(category)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-primary-foreground" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{category}</CardTitle>
                                <p className="text-sm text-muted-foreground">{categoryServices.length} خدمة</p>
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: expandedCategories.has(category) ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            </motion.div>
                          </div>
                        </CardHeader>
                        
                        <AnimatePresence>
                          {expandedCategories.has(category) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CardContent className="pt-0 pb-4">
                                {/* Table Header */}
                                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/30 rounded-lg mb-2 text-sm font-medium text-muted-foreground">
                                  <div className="col-span-1">ID</div>
                                  <div className="col-span-5">الخدمة</div>
                                  <div className="col-span-2 text-center">السعر</div>
                                  <div className="col-span-2 text-center">المميزات</div>
                                  <div className="col-span-2 text-center">طلب</div>
                                </div>

                                <div className="divide-y divide-border/50">
                                  {categoryServices.map((service, index) => {
                                    const features = Array.isArray(service.features) 
                                      ? service.features 
                                      : [];
                                    const hasRefill = features.some((f: string) => 
                                      f.includes('تعبئة') || f.includes('إعادة')
                                    );
                                    const hasDrip = features.some((f: string) => 
                                      f.includes('تنقيط')
                                    );

                                    return (
                                      <motion.div
                                        key={service.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="py-3 px-4 hover:bg-muted/20 rounded-lg transition-colors group"
                                      >
                                        {/* Desktop View */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                          <div className="col-span-1">
                                            <span className="text-xs text-muted-foreground font-mono">
                                              #{index + 1}
                                            </span>
                                          </div>
                                          <div className="col-span-5">
                                            <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                                              {service.name}
                                            </h4>
                                            {service.description && (
                                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {service.description}
                                              </p>
                                            )}
                                          </div>
                                          <div className="col-span-2 text-center">
                                            <span className="font-bold text-primary">
                                              ${service.price.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="col-span-2 flex justify-center gap-1">
                                            {hasRefill && (
                                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                <RefreshCcw className="w-2.5 h-2.5 ml-1" />
                                                تعبئة
                                              </Badge>
                                            )}
                                            {hasDrip && (
                                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                <Zap className="w-2.5 h-2.5 ml-1" />
                                                تنقيط
                                              </Badge>
                                            )}
                                            {!hasRefill && !hasDrip && (
                                              <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                          </div>
                                          <div className="col-span-2 text-center">
                                            <Button 
                                              size="sm" 
                                              onClick={() => handleOrderService(service)}
                                              className="h-8 px-4"
                                            >
                                              <ShoppingCart className="w-3.5 h-3.5 ml-1" />
                                              طلب
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Mobile View */}
                                        <div className="md:hidden space-y-3">
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <h4 className="font-medium text-sm">{service.name}</h4>
                                              {service.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                  {service.description}
                                                </p>
                                              )}
                                            </div>
                                            <span className="font-bold text-primary text-lg">
                                              ${service.price.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <div className="flex gap-1">
                                              {hasRefill && (
                                                <Badge variant="secondary" className="text-[10px]">
                                                  تعبئة
                                                </Badge>
                                              )}
                                              {hasDrip && (
                                                <Badge variant="secondary" className="text-[10px]">
                                                  تنقيط
                                                </Badge>
                                              )}
                                            </div>
                                            <Button 
                                              size="sm" 
                                              onClick={() => handleOrderService(service)}
                                            >
                                              <ShoppingCart className="w-3.5 h-3.5 ml-1" />
                                              طلب
                                            </Button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold mb-3">لماذا نحن؟</h2>
              <p className="text-muted-foreground">نقدم لك أفضل الخدمات بأعلى جودة</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Zap, title: "سرعة التنفيذ", desc: "بدء فوري للطلبات" },
                { icon: Shield, title: "أمان عالي", desc: "حماية كاملة للحسابات" },
                { icon: Star, title: "جودة ممتازة", desc: "أفضل النتائج المضمونة" },
                { icon: RefreshCcw, title: "تعبئة تلقائية", desc: "استعادة في حال النقص" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="text-center p-6 hover:border-primary/30 transition-colors h-full">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Order Dialog */}
      <ServiceOrderDialog
        service={selectedService}
        open={orderDialogOpen}
        onOpenChange={(open) => {
          setOrderDialogOpen(open);
          if (!open) setSelectedService(null);
        }}
        userId={user?.id || null}
      />
    </div>
  );
};

export default Services;
