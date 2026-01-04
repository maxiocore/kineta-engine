import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  Palette, 
  Code, 
  Sparkles,
  TrendingUp,
  Users,
  Star,
  Zap,
  Shield,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Award,
  Target,
  Crown,
  BadgeCheck,
  ShoppingBag,
  Eye,
  ChevronLeft,
  Megaphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import ServicesHomeSkeleton from "@/components/dashboard/ServicesHomeSkeleton";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(countRef, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return (
    <span ref={countRef} className="tabular-nums">
      {count.toLocaleString()}
    </span>
  );
};

// Service sections data
const serviceSections = [
  {
    id: 'design',
    title: 'خدمات التصميم الإبداعي',
    subtitle: 'Creative Design',
    description: 'تصاميم احترافية تعكس هويتك وتميز علامتك التجارية',
    icon: Palette,
    path: '/dashboard/design-services',
    gradient: 'from-rose-500 via-violet-500 to-pink-500',
    bgGlow: 'from-rose-500/20',
    shadowColor: 'shadow-rose-500/20',
    features: ['هوية بصرية', 'شعارات', 'سوشيال ميديا', 'موشن جرافيك'],
  },
  {
    id: 'dev',
    title: 'خدمات البرمجة والتطوير',
    subtitle: 'Development',
    description: 'حلول برمجية احترافية بأحدث التقنيات العالمية',
    icon: Code,
    path: '/dashboard/dev-services',
    gradient: 'from-emerald-500 via-cyan-500 to-teal-500',
    bgGlow: 'from-emerald-500/20',
    shadowColor: 'shadow-emerald-500/20',
    features: ['مواقع ويب', 'تطبيقات جوال', 'متاجر إلكترونية', 'أنظمة متكاملة'],
  },
  {
    id: 'marketing',
    title: 'خدمات التسويق الرقمي',
    subtitle: 'Digital Marketing',
    description: 'حلول تسويقية متكاملة لتنمية أعمالك وزيادة مبيعاتك',
    icon: Target,
    path: '/dashboard/marketing-services',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    bgGlow: 'from-orange-500/20',
    shadowColor: 'shadow-orange-500/20',
    features: ['إعلانات ممولة', 'تحسين SEO', 'إدارة حسابات', 'تحليلات'],
  },
];

const features = [
  { icon: Zap, title: 'تنفيذ فوري', color: 'text-amber-500 bg-amber-500/10' },
  { icon: Shield, title: 'ضمان مضمون', color: 'text-emerald-500 bg-emerald-500/10' },
  { icon: Users, title: 'دعم متواصل', color: 'text-blue-500 bg-blue-500/10' },
  { icon: Award, title: 'أعلى جودة', color: 'text-purple-500 bg-purple-500/10' },
];

// Service Card Component
const ServiceCard = ({ 
  section, 
  index, 
  count, 
  isInView 
}: { 
  section: typeof serviceSections[0]; 
  index: number; 
  count: number;
  isInView: boolean;
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.2 + index * 0.15,
        type: "spring",
        stiffness: 100,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card className={cn(
        "relative h-full overflow-hidden border-2 border-border/50 bg-card/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl transition-all duration-500 group cursor-pointer",
        isHovered && "border-primary/30 shadow-2xl",
        section.shadowColor
      )}
        onClick={() => navigate(section.path)}
      >
        {/* Background Glow Effect */}
        <motion.div 
          className={cn(
            "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl transition-opacity duration-500",
            section.bgGlow,
            isHovered ? "opacity-60" : "opacity-0"
          )}
        />
        
        {/* Animated Top Border */}
        <motion.div 
          className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", section.gradient)}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <CardContent className="relative z-10 p-5 sm:p-6 md:p-8 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <motion.div 
              className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                section.gradient
              )}
              animate={{ 
                rotate: isHovered ? [0, -5, 5, 0] : 0,
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.5 }}
            >
              <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </motion.div>
            
            <div className="flex-1">
              <span className={cn(
                "text-xs sm:text-sm font-medium bg-gradient-to-r bg-clip-text text-transparent",
                section.gradient
              )}>
                {section.subtitle}
              </span>
              <h3 className="text-lg sm:text-xl font-bold mt-1 group-hover:text-primary transition-colors">
                {section.title}
              </h3>
            </div>

            {/* Service Count Badge */}
            <Badge 
              variant="secondary" 
              className="px-2.5 py-1 text-xs font-bold bg-secondary/80"
            >
              {count} خدمة
            </Badge>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm sm:text-base mb-5 leading-relaxed">
            {section.description}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-6">
            {section.features.map((feature, i) => (
              <motion.span
                key={feature}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/50 text-xs font-medium"
              >
                <CheckCircle2 className="w-3 h-3 text-success" />
                {feature}
              </motion.span>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div 
            className="mt-auto"
            animate={{ scale: isHovered ? 1.02 : 1 }}
          >
            <Button 
              className={cn(
                "w-full gap-2 py-5 sm:py-6 text-sm sm:text-base font-semibold rounded-xl text-white bg-gradient-to-r shadow-lg hover:shadow-xl transition-shadow",
                section.gradient
              )}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              استعرض الخدمات
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ClientServicesHome = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  
  const [servicesCount, setServicesCount] = useState({ design: 0, dev: 0, marketing: 0 });
  const [globalStats, setGlobalStats] = useState({
    totalServices: 0,
    totalOrders: 0,
    completedOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const [designResult, devResult, marketingResult, totalServicesResult, ordersResult] = await Promise.all([
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .or('category.ilike.%design%,category.ilike.%تصميم%'),
        
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .or('category.ilike.%dev%,category.ilike.%برمجة%,category.ilike.%تطوير%'),
        
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .or('category.ilike.%marketing%,category.ilike.%تسويق%,category.ilike.%إعلان%'),
        
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        
        supabase
          .from('orders')
          .select('status')
      ]);

      const orders = ordersResult.data || [];
      const completedCount = orders.filter(o => o.status === 'completed').length;

      setServicesCount({
        design: designResult.count || 0,
        dev: devResult.count || 0,
        marketing: marketingResult.count || 0
      });

      setGlobalStats({
        totalServices: totalServicesResult.count || 0,
        totalOrders: orders.length,
        completedOrders: completedCount
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    
    // Real-time subscription for services changes
    const channel = supabase
      .channel('client-services-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    await fetchCounts();
    toast.success("تم التحديث بنجاح");
  };

  const statsData = [
    { value: globalStats.totalServices, label: 'خدمة متاحة', icon: Rocket, color: 'text-primary' },
    { value: globalStats.totalOrders, label: 'طلب منفذ', icon: ShoppingBag, color: 'text-emerald-500' },
    { value: globalStats.completedOrders, label: 'طلب مكتمل', icon: CheckCircle2, color: 'text-blue-500' },
    { value: 100, label: 'نسبة الرضا', icon: Star, color: 'text-amber-500', suffix: '%' },
  ];

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesHomeSkeleton />
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div ref={containerRef} className="min-h-screen pb-8" dir="rtl">
          
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative mb-8"
          >
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border border-border/50 p-5 sm:p-8">
              {/* Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-2xl" />
              </div>

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </motion.div>
                    <div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">مركز الخدمات</h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        اختر الخدمة المناسبة وابدأ مشروعك
                      </p>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="gap-2 rounded-xl"
                    onClick={() => navigate('/dashboard/orders')}
                  >
                    <Eye className="w-4 h-4" />
                    سجل الطلبات
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {statsData.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      className="p-3 sm:p-4 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border/30 text-center"
                    >
                      <stat.icon className={cn("w-5 h-5 mx-auto mb-2", stat.color)} />
                      <div className={cn("text-lg sm:text-xl font-bold", stat.color)}>
                        <AnimatedCounter value={stat.value} />
                        {stat.suffix}
                      </div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Features Strip */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl",
                    feature.color.split(' ')[1]
                  )}
                >
                  <feature.icon className={cn("w-4 h-4", feature.color.split(' ')[0])} />
                  <span className="text-sm font-medium">{feature.title}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Service Cards */}
          <section className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-2">اختر القسم المناسب</h2>
              <p className="text-muted-foreground text-sm">انقر على أي قسم لاستعراض الخدمات المتاحة</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {serviceSections.map((section, index) => (
                <ServiceCard
                  key={section.id}
                  section={section}
                  index={index}
                  count={
                    section.id === 'design' 
                      ? servicesCount.design 
                      : section.id === 'dev' 
                        ? servicesCount.dev 
                        : servicesCount.marketing
                  }
                  isInView={true}
                />
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20 rounded-2xl overflow-hidden">
              <CardContent className="p-5 sm:p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center md:text-right">
                    <div className="hidden md:flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">هل لديك مشروع مخصص؟</h3>
                      <p className="text-sm text-muted-foreground">
                        تواصل معنا وسنساعدك في تحقيق رؤيتك
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="gap-2 px-6 py-5 rounded-xl shadow-lg"
                    onClick={() => navigate('/dashboard/support')}
                  >
                    تواصل معنا
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>

        </div>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

export default ClientServicesHome;
