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
  ArrowLeft,
  Star,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  Rocket,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Domain extensions
const domainExtensions = [
  { ext: '.com', price: 49.99, popular: true },
  { ext: '.net', price: 39.99, popular: false },
  { ext: '.org', price: 44.99, popular: false },
  { ext: '.sa', price: 149.99, popular: true },
  { ext: '.store', price: 29.99, popular: false },
  { ext: '.io', price: 89.99, popular: true },
  { ext: '.co', price: 34.99, popular: false },
  { ext: '.dev', price: 59.99, popular: false },
];

// Hosting packages
const hostingPackages = [
  {
    id: 'starter',
    name: 'الباقة الأساسية',
    subtitle: 'Starter',
    price: 99,
    period: 'شهرياً',
    description: 'مثالية للمواقع الشخصية والمدونات الصغيرة',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-blue-500/20',
    features: [
      { icon: HardDrive, text: '10 جيجابايت مساحة تخزين SSD' },
      { icon: Wifi, text: 'ترافيك غير محدود' },
      { icon: Globe, text: 'دومين مجاني (.com)' },
      { icon: Lock, text: 'شهادة SSL مجانية' },
      { icon: Database, text: '2 قاعدة بيانات MySQL' },
      { icon: Users, text: '5 حسابات بريد' },
    ],
    popular: false,
  },
  {
    id: 'professional',
    name: 'الباقة الاحترافية',
    subtitle: 'Professional',
    price: 199,
    period: 'شهرياً',
    description: 'الأفضل للشركات والمتاجر الإلكترونية',
    gradient: 'from-violet-500 to-purple-500',
    shadowColor: 'shadow-violet-500/20',
    features: [
      { icon: HardDrive, text: '50 جيجابايت مساحة تخزين NVMe' },
      { icon: Wifi, text: 'ترافيك غير محدود' },
      { icon: Globe, text: 'دومين مجاني (.com أو .sa)' },
      { icon: Lock, text: 'شهادة SSL Wildcard مجانية' },
      { icon: Database, text: 'قواعد بيانات غير محدودة' },
      { icon: Users, text: 'حسابات بريد غير محدودة' },
      { icon: Shield, text: 'حماية DDoS متقدمة' },
      { icon: Clock, text: 'نسخ احتياطي يومي' },
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'باقة الأعمال',
    subtitle: 'Enterprise',
    price: 399,
    period: 'شهرياً',
    description: 'للمشاريع الكبيرة والتطبيقات عالية الأداء',
    gradient: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-500/20',
    features: [
      { icon: HardDrive, text: '200 جيجابايت مساحة تخزين NVMe' },
      { icon: Wifi, text: 'ترافيك غير محدود + CDN' },
      { icon: Globe, text: '3 دومينات مجانية' },
      { icon: Lock, text: 'شهادة SSL EV مجانية' },
      { icon: Database, text: 'قواعد بيانات غير محدودة' },
      { icon: Users, text: 'حسابات بريد غير محدودة' },
      { icon: Shield, text: 'حماية متقدمة + جدار ناري' },
      { icon: Clock, text: 'نسخ احتياطي كل ساعة' },
      { icon: Cpu, text: 'موارد مخصصة (4 CPU)' },
      { icon: Zap, text: 'أولوية في الدعم الفني 24/7' },
    ],
    popular: false,
  },
];

// VPS packages
const vpsPackages = [
  {
    id: 'vps-basic',
    name: 'VPS Basic',
    price: 149,
    period: 'شهرياً',
    specs: { cpu: '2 vCPU', ram: '4 GB', storage: '80 GB NVMe', bandwidth: '4 TB' },
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'vps-pro',
    name: 'VPS Pro',
    price: 299,
    period: 'شهرياً',
    specs: { cpu: '4 vCPU', ram: '8 GB', storage: '160 GB NVMe', bandwidth: '8 TB' },
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'vps-enterprise',
    name: 'VPS Enterprise',
    price: 599,
    period: 'شهرياً',
    specs: { cpu: '8 vCPU', ram: '16 GB', storage: '320 GB NVMe', bandwidth: 'غير محدود' },
    gradient: 'from-rose-500 to-pink-500',
  },
];

const features = [
  { icon: Zap, title: 'أداء فائق السرعة', description: 'خوادم NVMe SSD', color: 'text-amber-500 bg-amber-500/10' },
  { icon: Shield, title: 'حماية متقدمة', description: 'جدار ناري + DDoS', color: 'text-emerald-500 bg-emerald-500/10' },
  { icon: Clock, title: 'وقت تشغيل 99.9%', description: 'ضمان الاستمرارية', color: 'text-blue-500 bg-blue-500/10' },
  { icon: Users, title: 'دعم فني 24/7', description: 'فريق متخصص', color: 'text-purple-500 bg-purple-500/10' },
];

const ClientHostingServices = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  
  const [domainSearch, setDomainSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{domain: string; available: boolean; price: number}[] | null>(null);
  const [activeTab, setActiveTab] = useState<'hosting' | 'vps' | 'domain'>('hosting');

  const handleDomainSearch = async () => {
    if (!domainSearch.trim()) {
      toast.error("الرجاء إدخال اسم الدومين");
      return;
    }

    setIsSearching(true);
    
    // Simulate domain availability check
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

  const handleOrderPackage = (packageName: string) => {
    toast.success(`تم إضافة ${packageName} إلى سلة الطلبات`);
    // Navigate to order form
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
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-500/15 to-transparent rounded-full blur-3xl"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              {/* Floating server icons */}
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
                      الدومين والإستضافة
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                      حلول استضافة متكاملة بأداء عالي وأمان متقدم
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant={activeTab === 'domain' ? 'default' : 'outline'} 
                    className="gap-2 rounded-xl"
                    onClick={() => setActiveTab('domain')}
                  >
                    <Globe className="w-4 h-4" />
                    الدومينات
                  </Button>
                  <Button 
                    variant={activeTab === 'hosting' ? 'default' : 'outline'} 
                    className="gap-2 rounded-xl"
                    onClick={() => setActiveTab('hosting')}
                  >
                    <Cloud className="w-4 h-4" />
                    الإستضافة
                  </Button>
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
                  <Search className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">ابحث عن دومينك المثالي</h2>
                <p className="text-muted-foreground text-sm">اكتشف توفر النطاق واحجزه الآن بأفضل الأسعار</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="example.com أو example فقط"
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
                  {isSearching ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  بحث
                </Button>
              </div>

              {/* Search Results */}
              {searchResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto"
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
                        {result.available && (
                          <p className="text-success text-xs font-medium">{result.price} ر.س/سنة</p>
                        )}
                      </div>
                      {result.available ? (
                        <Button size="sm" className="bg-success hover:bg-success/90 text-xs">
                          احجز الآن
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">
                          غير متاح
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Popular Extensions */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {domainExtensions.filter(e => e.popular).map((ext) => (
                  <Badge 
                    key={ext.ext}
                    variant="outline" 
                    className="px-3 py-1.5 cursor-pointer hover:bg-primary/10"
                    onClick={() => setDomainSearch(prev => prev.replace(/\.[^.]+$/, '') + ext.ext)}
                  >
                    <span className="font-mono">{ext.ext}</span>
                    <span className="text-primary mr-1">{ext.price} ر.س</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-2 mb-8"
        >
          <Button 
            variant={activeTab === 'hosting' ? 'default' : 'outline'}
            onClick={() => setActiveTab('hosting')}
            className="gap-2 rounded-xl"
          >
            <Cloud className="w-4 h-4" />
            استضافة مشتركة
          </Button>
          <Button 
            variant={activeTab === 'vps' ? 'default' : 'outline'}
            onClick={() => setActiveTab('vps')}
            className="gap-2 rounded-xl"
          >
            <Server className="w-4 h-4" />
            سيرفرات VPS
          </Button>
        </motion.div>

        {/* Hosting Packages */}
        {activeTab === 'hosting' && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">باقات الإستضافة المشتركة</h2>
              <p className="text-muted-foreground text-sm">اختر الباقة المناسبة لاحتياجاتك</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {hostingPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.15 }}
                  className="relative"
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 gap-1">
                        <Star className="w-3 h-3" />
                        الأكثر طلباً
                      </Badge>
                    </div>
                  )}
                  <Card className={cn(
                    "h-full border-2 transition-all duration-300 hover:shadow-xl overflow-hidden",
                    pkg.popular ? "border-primary/50" : "border-border/50",
                    pkg.shadowColor
                  )}>
                    {/* Header Gradient */}
                    <div className={cn("h-2 bg-gradient-to-r", pkg.gradient)} />
                    
                    <CardHeader className="text-center pb-4">
                      <CardTitle>
                        <span className={cn(
                          "text-xs font-medium bg-gradient-to-r bg-clip-text text-transparent",
                          pkg.gradient
                        )}>
                          {pkg.subtitle}
                        </span>
                        <p className="text-xl font-bold mt-1">{pkg.name}</p>
                      </CardTitle>
                      <p className="text-muted-foreground text-sm mt-2">{pkg.description}</p>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Price */}
                      <div className="text-center mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={cn(
                            "text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                            pkg.gradient
                          )}>
                            {pkg.price}
                          </span>
                          <span className="text-muted-foreground text-sm">ر.س / {pkg.period}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-6">
                        {pkg.features.map((feature, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="flex items-center gap-3 text-sm"
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                              pkg.gradient,
                              "bg-opacity-10"
                            )}>
                              <feature.icon className="w-4 h-4 text-white" />
                            </div>
                            <span>{feature.text}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* CTA */}
                      <Button 
                        className={cn(
                          "w-full gap-2 py-6 rounded-xl text-white bg-gradient-to-r",
                          pkg.gradient
                        )}
                        onClick={() => handleOrderPackage(pkg.name)}
                      >
                        <Rocket className="w-4 h-4" />
                        اطلب الآن
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* VPS Packages */}
        {activeTab === 'vps' && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">سيرفرات VPS عالية الأداء</h2>
              <p className="text-muted-foreground text-sm">موارد مخصصة وتحكم كامل</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {vpsPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.15 }}
                >
                  <Card className={cn(
                    "h-full border-2 border-border/50 transition-all duration-300 hover:shadow-xl overflow-hidden",
                    pkg.id === 'vps-pro' && "border-primary/50"
                  )}>
                    <div className={cn("h-2 bg-gradient-to-r", pkg.gradient)} />
                    
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <motion.div
                          className={cn(
                            "w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4",
                            pkg.gradient
                          )}
                          whileHover={{ rotate: [0, -5, 5, 0] }}
                        >
                          <Server className="w-8 h-8 text-white" />
                        </motion.div>
                        <h3 className="text-lg font-bold">{pkg.name}</h3>
                        <div className="flex items-baseline justify-center gap-1 mt-2">
                          <span className={cn(
                            "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                            pkg.gradient
                          )}>
                            {pkg.price}
                          </span>
                          <span className="text-muted-foreground text-sm">ر.س / {pkg.period}</span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-secondary/30 text-center">
                          <Cpu className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <p className="text-sm font-medium">{pkg.specs.cpu}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/30 text-center">
                          <Database className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
                          <p className="text-sm font-medium">{pkg.specs.ram}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/30 text-center">
                          <HardDrive className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                          <p className="text-sm font-medium">{pkg.specs.storage}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/30 text-center">
                          <Wifi className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                          <p className="text-sm font-medium">{pkg.specs.bandwidth}</p>
                        </div>
                      </div>

                      <Button 
                        className={cn(
                          "w-full gap-2 py-6 rounded-xl text-white bg-gradient-to-r",
                          pkg.gradient
                        )}
                        onClick={() => handleOrderPackage(pkg.name)}
                      >
                        <Server className="w-4 h-4" />
                        اطلب السيرفر
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Why Choose Us */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">لماذا تختار استضافتنا؟</h2>
                <p className="text-muted-foreground text-sm">نقدم لك أفضل تجربة استضافة في المنطقة</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Zap, title: 'سرعة خارقة', desc: 'خوادم NVMe SSD بأحدث التقنيات', color: 'text-amber-500' },
                  { icon: Shield, title: 'أمان متقدم', desc: 'حماية DDoS وجدار ناري ذكي', color: 'text-emerald-500' },
                  { icon: Clock, title: 'استمرارية 99.9%', desc: 'ضمان وقت التشغيل', color: 'text-blue-500' },
                  { icon: Award, title: 'دعم متميز', desc: 'فريق فني متخصص 24/7', color: 'text-purple-500' },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="p-4 rounded-xl bg-secondary/20 border border-border/30 text-center"
                  >
                    <item.icon className={cn("w-8 h-8 mx-auto mb-3", item.color)} />
                    <h3 className="font-bold mb-1">{item.title}</h3>
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
