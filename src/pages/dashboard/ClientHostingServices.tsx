import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { 
  Globe, 
  Server, 
  Shield, 
  Zap,
  Cloud,
  Database,
  Lock,
  Clock,
  HardDrive,
  Cpu,
  Wifi,
  CheckCircle2,
  Search,
  Star,
  Sparkles,
  RefreshCw,
  Box,
  Layers,
  Network,
  Container
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useHostingProducts, useCreateHostingOrder, HostingProduct, HostingProductType } from "@/hooks/useHostingProducts";
import { useAuth } from "@/hooks/useAuth";

// Domain extensions for search
const domainExtensions = [
  { ext: '.com', price: 49.99, popular: true },
  { ext: '.net', price: 39.99, popular: false },
  { ext: '.org', price: 44.99, popular: false },
  { ext: '.sa', price: 149.99, popular: true },
  { ext: '.store', price: 29.99, popular: false },
  { ext: '.io', price: 89.99, popular: true },
];

const productTypeConfig: Record<HostingProductType, { icon: any; label: string; gradient: string; bgColor: string }> = {
  droplet: { icon: Server, label: 'سيرفرات VPS', gradient: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/10' },
  database: { icon: Database, label: 'قواعد البيانات', gradient: 'from-emerald-500 to-green-500', bgColor: 'bg-emerald-500/10' },
  spaces: { icon: Cloud, label: 'التخزين السحابي', gradient: 'from-violet-500 to-purple-500', bgColor: 'bg-violet-500/10' },
  app_platform: { icon: Box, label: 'استضافة التطبيقات', gradient: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-500/10' },
  load_balancer: { icon: Network, label: 'موازنة الأحمال', gradient: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500/10' },
  kubernetes: { icon: Container, label: 'Kubernetes', gradient: 'from-indigo-500 to-blue-500', bgColor: 'bg-indigo-500/10' },
  firewall: { icon: Shield, label: 'جدران الحماية', gradient: 'from-red-500 to-rose-500', bgColor: 'bg-red-500/10' },
};

const features = [
  { icon: Zap, title: 'أداء فائق السرعة', description: 'خوادم NVMe SSD', color: 'text-amber-500 bg-amber-500/10' },
  { icon: Shield, title: 'حماية متقدمة', description: 'جدار ناري + DDoS', color: 'text-emerald-500 bg-emerald-500/10' },
  { icon: Clock, title: 'وقت تشغيل 99.9%', description: 'ضمان الاستمرارية', color: 'text-blue-500 bg-blue-500/10' },
  { icon: Layers, title: 'API متكامل', description: 'تحكم كامل', color: 'text-purple-500 bg-purple-500/10' },
];

const ClientHostingServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  
  const [domainSearch, setDomainSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{domain: string; available: boolean; price: number}[] | null>(null);
  const [activeTab, setActiveTab] = useState<HostingProductType>('droplet');

  const { data: products, isLoading } = useHostingProducts(activeTab);
  const createOrder = useCreateHostingOrder();

  const handleDomainSearch = async () => {
    if (!domainSearch.trim()) {
      toast.error("الرجاء إدخال اسم الدومين");
      return;
    }

    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const cleanDomain = domainSearch.replace(/\.(com|net|org|sa|store|io|co|dev)$/i, '');
    
    const results = domainExtensions.map(ext => ({
      domain: cleanDomain + ext.ext,
      available: Math.random() > 0.3,
      price: ext.price
    }));
    
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleOrderProduct = async (product: HostingProduct) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }

    try {
      await createOrder.mutateAsync({
        product_id: product.id,
        product_type: product.product_type,
        our_price: product.our_price,
        do_price: product.do_price,
        configuration: {
          product_name: product.name,
          product_name_ar: product.name_ar,
          specs: product.specs
        }
      });
      
      toast.success(`تم إنشاء طلب الاستضافة بنجاح - ${product.name_ar}`);
      navigate('/dashboard/orders');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الطلب');
    }
  };

  const renderProductCard = (product: HostingProduct) => {
    const config = productTypeConfig[product.product_type];
    const specs = product.specs as Record<string, any>;

    return (
      <motion.div
        key={product.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="group"
      >
        <Card className={cn(
          "relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300",
          config.bgColor
        )}>
          {/* Gradient Header */}
          <div className={cn("h-2 bg-gradient-to-r", config.gradient)} />
          
          <CardContent className="p-6">
            {/* Icon & Title */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", config.gradient)}>
                  <config.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{product.name_ar}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{product.name}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {product.description_ar || product.description}
            </p>

            {/* Specs */}
            <div className="space-y-2 mb-4">
              {specs.vcpus && (
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span>{specs.vcpus} vCPU</span>
                </div>
              )}
              {specs.memory && (
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <span>{specs.memory >= 1024 ? `${specs.memory / 1024} GB` : `${specs.memory} MB`} RAM</span>
                </div>
              )}
              {specs.disk && (
                <div className="flex items-center gap-2 text-sm">
                  <Cloud className="w-4 h-4 text-primary" />
                  <span>{specs.disk} GB SSD</span>
                </div>
              )}
              {specs.storage && (
                <div className="flex items-center gap-2 text-sm">
                  <Cloud className="w-4 h-4 text-primary" />
                  <span>{specs.storage} GB تخزين</span>
                </div>
              )}
              {specs.engine && (
                <div className="flex items-center gap-2 text-sm">
                  <Database className="w-4 h-4 text-primary" />
                  <span>{specs.engine.toUpperCase()} {specs.version}</span>
                </div>
              )}
              {specs.nodes && (
                <div className="flex items-center gap-2 text-sm">
                  <Container className="w-4 h-4 text-primary" />
                  <span>{specs.nodes} عقدة</span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="flex items-end justify-between mb-4 pt-4 border-t border-border/50">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                    ${product.our_price}
                  </span>
                  <span className="text-sm text-muted-foreground">/شهرياً</span>
                </div>
                {product.do_price !== product.our_price && (
                  <p className="text-xs text-muted-foreground line-through">
                    السعر الأصلي: ${product.do_price}
                  </p>
                )}
              </div>
            </div>

            {/* Action Button */}
            <Button 
              onClick={() => handleOrderProduct(product)}
              className={cn("w-full gap-2 bg-gradient-to-r hover:opacity-90", config.gradient)}
            >
              <Sparkles className="w-4 h-4" />
              اطلب الآن
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <ClientDashboardLayout>
      <div ref={containerRef} className="min-h-screen pb-8" dir="rtl">
        
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-8"
        >
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border border-border/50 p-5 sm:p-8">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div 
                className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-500/15 to-transparent rounded-full blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <motion.div
                className="absolute top-20 left-20 text-primary/20"
                animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Server className="w-12 h-12" />
              </motion.div>
              <motion.div
                className="absolute bottom-20 right-32 text-cyan-500/20"
                animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Cloud className="w-16 h-16" />
              </motion.div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30"
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Server className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                      خدمات الاستضافة السحابية
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                      سيرفرات عالية الأداء مدعومة بـ DigitalOcean
                    </p>
                  </div>
                </div>
              </div>

              {/* Features Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border border-border/30",
                      feature.color.split(' ')[1]
                    )}
                  >
                    <feature.icon className={cn("w-5 h-5", feature.color.split(' ')[0])} />
                    <div>
                      <p className="text-sm font-medium">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Domain Search Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-cyan-500/5 overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <motion.div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Globe className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">ابحث عن دومينك المثالي</h2>
                <p className="text-muted-foreground text-sm">اكتشف توفر النطاق (إدارة DNS فقط)</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="example.com"
                    value={domainSearch}
                    onChange={(e) => setDomainSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDomainSearch()}
                    className="pr-12 py-6 text-base rounded-xl bg-background border-2 border-border/50 focus:border-primary"
                    dir="ltr"
                  />
                </div>
                <Button 
                  onClick={handleDomainSearch}
                  disabled={isSearching}
                  className="py-6 px-8 rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 gap-2"
                >
                  {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  بحث
                </Button>
              </div>

              {searchResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto"
                >
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.domain}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-4 rounded-xl border-2 flex items-center justify-between",
                        result.available 
                          ? "border-success/30 bg-success/5" 
                          : "border-destructive/30 bg-destructive/5"
                      )}
                    >
                      <div>
                        <p className="font-mono font-medium text-sm" dir="ltr">{result.domain}</p>
                        {result.available && <p className="text-success text-xs font-medium">{result.price} ر.س/سنة</p>}
                      </div>
                      {result.available ? (
                        <Button size="sm" className="bg-success hover:bg-success/90 text-xs">احجز</Button>
                      ) : (
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">غير متاح</Badge>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* Products Tabs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HostingProductType)} className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto mb-8">
              {Object.entries(productTypeConfig).map(([type, config]) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className={cn(
                    "gap-2 px-4 py-2.5 rounded-xl border border-border/50 data-[state=active]:border-primary data-[state=active]:bg-primary/10",
                    "transition-all"
                  )}
                >
                  <config.icon className="w-4 h-4" />
                  {config.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.keys(productTypeConfig).map((type) => (
              <TabsContent key={type} value={type}>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="p-6">
                        <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-20 w-full mb-4" />
                        <Skeleton className="h-10 w-full" />
                      </Card>
                    ))}
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(renderProductCard)}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <Server className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
                    <p className="text-muted-foreground">لا توجد منتجات متاحة في هذه الفئة حالياً</p>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </motion.section>

        {/* Why Choose Us */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center mb-8">لماذا تختار خدماتنا السحابية؟</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: Zap, title: 'أداء عالي', desc: 'سيرفرات NVMe SSD مع موارد مخصصة' },
                  { icon: Shield, title: 'أمان متقدم', desc: 'حماية DDoS وجدار ناري مدمج' },
                  { icon: Clock, title: 'تشغيل 99.9%', desc: 'ضمان وقت التشغيل المستمر' },
                  { icon: Star, title: 'دعم 24/7', desc: 'فريق دعم فني متخصص على مدار الساعة' },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mb-4">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientHostingServices;
