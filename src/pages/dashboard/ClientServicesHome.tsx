import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  Palette, 
  Code, 
  Sparkles,
  TrendingUp,
  Users,
  Star,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MessageCircle,
  Send,
  Globe2,
  Layers,
  Zap,
  Shield,
  Clock,
  ChevronLeft,
  ArrowUpLeft,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Play,
  Hexagon,
  Award,
  Target,
  Heart,
  Flame,
  Crown,
  BadgeCheck,
  Music2,
  BarChart3
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
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, PieChart, Pie, Cell } from "recharts";

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2000, suffix = '' }: { value: number; duration?: number; suffix?: string }) => {
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
      
      // Easing function for smooth animation
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
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const slideInRight = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 80,
      damping: 15
    }
  }
};


const ClientServicesHome = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.05 });
  
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  const [servicesCount, setServicesCount] = useState({
    design: 0,
    dev: 0,
    digital: 0
  });
  const [globalStats, setGlobalStats] = useState({
    totalServices: 0,
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; orders: number; completed: number }>>([]);

  // Track mouse for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchCounts = async (showLoading = true) => {
    if (showLoading && isInitialLoad) {
      setIsLoading(true);
    }
    try {
      // Run ALL queries in parallel for maximum performance
      const [
        designResult,
        devResult,
        digitalResult,
        totalServicesResult,
        ordersResult
      ] = await Promise.all([
        // Service counts - parallel
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .or('category.ilike.%design%,category.ilike.%تصميم%,name.ilike.%تصميم%,name.ilike.%شعار%,name.ilike.%لوجو%'),
        
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .or('category.ilike.%dev%,category.ilike.%برمجة%,category.ilike.%تطوير%,name.ilike.%موقع%,name.ilike.%تطبيق%,name.ilike.%برمجة%'),
        
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .or('category.ilike.%marketing%,category.ilike.%تسويق%,category.ilike.%digital%,category.ilike.%رقمي%,name.ilike.%seo%,name.ilike.%إعلان%,name.ilike.%حملة%,name.ilike.%تسويق%'),
        
        // Total services count
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        
        // Get all orders with status for counting (single query instead of 4)
        supabase
          .from('orders')
          .select('status, created_at')
      ]);

      // Process orders data locally instead of multiple queries
      const orders = ordersResult.data || [];
      const totalOrdersCount = orders.length;
      const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
      const inProgressOrdersCount = orders.filter(o => o.status === 'in_progress').length;
      const completedOrdersCount = orders.filter(o => o.status === 'completed').length;

      setServicesCount({
        design: designResult.count || 0,
        dev: devResult.count || 0,
        digital: digitalResult.count || 0
      });

      setGlobalStats({
        totalServices: totalServicesResult.count || 0,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        inProgressOrders: inProgressOrdersCount,
        completedOrders: completedOrdersCount
      });

      // Process weekly data from the same orders query (no additional queries!)
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const weekData: Array<{ day: string; orders: number; completed: number }> = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
        
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= startOfDay && orderDate <= endOfDay;
        });
        
        const dayCompleted = dayOrders.filter(o => o.status === 'completed').length;
        const dayIndex = date.getDay();
        
        weekData.push({
          day: days[dayIndex],
          orders: dayOrders.length,
          completed: dayCompleted
        });
      }
      
      setWeeklyData(weekData);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchCounts(true);
    
    // Auto-refresh interval - don't show loading on auto refresh
    const intervalId = setInterval(() => {
      fetchCounts(false);
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Realtime subscription for orders changes
  useEffect(() => {
    const channel = supabase
      .channel('orders-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // Refetch stats when orders change - don't show loading
          fetchCounts(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        () => {
          // Refetch stats when services change - don't show loading
          fetchCounts(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    await fetchCounts();
    toast.success("تم التحديث بنجاح");
  };

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeatureIndex(prev => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const sections = [
    {
      id: 'design',
      title: 'خدمات التصميم الإبداعي',
      subtitle: 'Creative Design',
      description: 'تصاميم احترافية تعكس هويتك وتميز علامتك التجارية',
      icon: Palette,
      path: '/dashboard/design-services',
      gradient: 'from-rose-500 via-violet-500 to-pink-500',
      bgGradient: 'from-rose-500/20 via-violet-500/10 to-transparent',
      shadowColor: 'shadow-rose-500/25',
      count: servicesCount.design,
      platforms: [
        { icon: Crown, label: 'هوية بصرية', color: 'from-amber-500 to-orange-600' },
        { icon: Sparkles, label: 'شعارات', color: 'from-rose-500 to-pink-600' },
        { icon: Layers, label: 'سوشيال ميديا', color: 'from-pink-500 to-rose-600' },
        { icon: Play, label: 'موشن جرافيك', color: 'from-cyan-500 to-blue-600' },
      ],
      features: ['تصميم مخصص', 'تعديلات غير محدودة', 'تسليم سريع']
    },
    {
      id: 'dev',
      title: 'خدمات البرمجة والتطوير',
      subtitle: 'Development',
      description: 'حلول برمجية احترافية بأحدث التقنيات',
      icon: Code,
      path: '/dashboard/dev-services',
      gradient: 'from-emerald-500 via-cyan-500 to-teal-500',
      bgGradient: 'from-emerald-500/20 via-cyan-500/10 to-transparent',
      shadowColor: 'shadow-emerald-500/25',
      count: servicesCount.dev,
      platforms: [
        { icon: Globe2, label: 'مواقع ويب', color: 'from-cyan-500 to-blue-600' },
        { icon: Smartphone, label: 'تطبيقات جوال', color: 'from-purple-500 to-violet-600' },
        { icon: Code, label: 'متاجر إلكترونية', color: 'from-pink-500 to-rose-600' },
        { icon: TrendingUp, label: 'أنظمة متكاملة', color: 'from-emerald-500 to-teal-600' },
      ],
      features: ['تقنيات حديثة', 'دعم متواصل', 'ضمان الجودة']
    },
    {
      id: 'digital',
      title: 'التسويق الرقمي',
      subtitle: 'Digital Marketing',
      description: 'حلول تسويقية متكاملة لنمو أعمالك',
      icon: BarChart3,
      path: '/dashboard/digital-services',
      gradient: 'from-blue-500 via-indigo-500 to-violet-500',
      bgGradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      shadowColor: 'shadow-blue-500/25',
      count: servicesCount.digital,
      platforms: [
        { icon: TrendingUp, label: 'SEO', color: 'from-blue-500 to-indigo-600' },
        { icon: Target, label: 'إعلانات', color: 'from-indigo-500 to-violet-600' },
        { icon: BarChart3, label: 'تحليلات', color: 'from-violet-500 to-purple-600' },
        { icon: MessageCircle, label: 'محتوى', color: 'from-cyan-500 to-blue-600' },
      ],
      features: ['استهداف دقيق', 'نتائج مضمونة', 'تقارير مفصلة']
    }
  ];

  const features = [
    { icon: Zap, title: 'تنفيذ فوري', desc: 'بدء العمل خلال دقائق', color: 'from-amber-500 to-orange-600' },
    { icon: Shield, title: 'ضمان الجودة', desc: 'استرداد 100% مضمون', color: 'from-emerald-500 to-green-600' },
    { icon: Users, title: 'دعم متواصل', desc: 'فريق متخصص 24/7', color: 'from-blue-500 to-indigo-600' },
    { icon: Award, title: 'أعلى جودة', desc: 'معايير احترافية', color: 'from-purple-500 to-pink-600' },
  ];

  const totalServices = servicesCount.design + servicesCount.dev + servicesCount.digital;

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
        <div 
          ref={containerRef} 
          className="min-h-screen pb-8 sm:pb-12"
          dir="rtl"
        >
          {/* Animated Background */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <motion.div
              style={{ y: backgroundY }}
              className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                x: mousePosition.x,
                y: mousePosition.y,
              }}
              transition={{ type: "spring", damping: 30 }}
              className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl"
            />
          </div>

          {/* Hero Section */}
          <motion.section
            ref={heroRef}
            className="relative mb-6 sm:mb-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border border-border/50 p-4 sm:p-6"
            >
              {/* Hero Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-40 sm:w-48 h-40 sm:h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-xl" />
                
                {/* Floating Shapes - Hidden on mobile for performance */}
                {/* Floating Shapes - Hidden on mobile for performance */}
                <div className="hidden sm:block">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [0, -15, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 5 + i * 2,
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                      className={cn(
                        "absolute w-3 h-3 rounded-full opacity-15",
                        i % 2 === 0 ? "bg-primary" : "bg-purple-500"
                      )}
                      style={{
                        top: `${25 + i * 20}%`,
                        left: `${15 + i * 25}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="relative z-10">
                {/* Header Content */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <motion.div 
                    variants={slideInRight}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    {/* Animated Icon */}
                    <motion.div
                      animate={{ 
                        rotateY: [0, 360],
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-xl blur-lg opacity-40" />
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 flex items-center justify-center shadow-xl">
                        <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                      </div>
                    </motion.div>
                    
                    <div>
                      <motion.h1 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-foreground via-foreground to-foreground/70 bg-clip-text"
                      >
                        خدماتنا المتميزة
                      </motion.h1>
                      <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap items-center gap-2 mt-1.5"
                      >
                        <Badge variant="secondary" className="gap-1 px-2 py-1 text-[10px] sm:text-xs">
                          <Sparkles className="w-3 h-3 text-primary" />
                          {totalServices}+ خدمة
                        </Badge>
                        <Badge variant="outline" className="gap-1 px-2 py-1 text-[10px] sm:text-xs text-emerald-500 border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          متاح الآن
                        </Badge>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Quick Action Button */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      onClick={() => navigate('/dashboard/orders')}
                      variant="outline"
                      size="sm"
                      className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl gap-1.5 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background hover:border-primary/50 transition-all duration-300 group"
                    >
                      <span className="text-xs sm:text-sm font-medium">طلباتي</span>
                      <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </div>

                {/* Stats Grid */}
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-3 gap-2 sm:gap-3"
                >
                  {[
                    { value: servicesCount.design, label: 'خدمات تصميم', icon: Palette, gradient: 'from-violet-500 to-purple-500' },
                    { value: servicesCount.dev, label: 'برمجة وتطوير', icon: Code, gradient: 'from-emerald-500 to-teal-500' },
                    { value: servicesCount.digital, label: 'تسويق رقمي', icon: BarChart3, gradient: 'from-blue-500 to-indigo-500' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="group relative"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} rounded-xl blur-lg opacity-0 group-hover:opacity-15 transition-opacity duration-500`} />
                      <div className="relative p-3 sm:p-4 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 group-hover:border-border transition-all duration-300">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-2 shadow-md`}>
                          <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-foreground mb-0.5">
                          {stat.value}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </motion.section>

          {/* Main Services Grid */}
          <motion.section
            ref={sectionsRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 sm:mb-8 space-y-4"
          >
            <motion.h2 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2"
            >
              <Crown className="w-5 h-5 text-primary" />
              اختر نوع الخدمة
            </motion.h2>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.2 + index * 0.08
                  }}
                  className="group"
                >
                  <Link to={section.path} className="block h-full">
                    <Card className="h-full relative overflow-hidden border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4 sm:p-5 flex flex-col h-full min-h-[240px] sm:min-h-[280px]">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          {/* Icon */}
                          <div className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${section.gradient} shadow-lg`}>
                            <section.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          
                          {/* Counter Badge */}
                          <Badge className={`bg-gradient-to-l ${section.gradient} text-white border-0 shadow-md px-2 sm:px-2.5 py-1 text-xs font-bold`}>
                            +{section.count}
                          </Badge>
                        </div>

                        {/* Title & Description */}
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                            {section.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {section.description}
                          </p>
                        </div>

                        {/* Platforms Grid */}
                        <div className="flex-1 mb-3 sm:mb-4">
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {section.platforms.slice(0, 4).map((platform) => (
                              <div
                                key={platform.label}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-sm`}
                              >
                                <platform.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                              </div>
                            ))}
                            {section.platforms.length > 4 && (
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted/80 flex items-center justify-center text-xs font-medium text-muted-foreground">
                                +{section.platforms.length - 4}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
                          {section.features.map((feat) => (
                            <div
                              key={feat}
                              className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground"
                            >
                              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 flex-shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        {/* CTA Button */}
                        <Button 
                          className={cn(
                            "w-full h-9 sm:h-10 rounded-lg font-semibold text-xs sm:text-sm gap-1.5",
                            `bg-gradient-to-l ${section.gradient} hover:opacity-90 text-white`
                          )}
                        >
                          <span>استعراض الخدمات</span>
                          <ArrowUpLeft className="w-3.5 h-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 sm:mb-8"
          >
            {/* Last Updated Indicator */}
            {lastUpdated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-start gap-2 mb-2"
              >
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 border border-border/50">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            )}
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {[
                { 
                  value: globalStats.totalServices, 
                  label: 'خدمة متاحة', 
                  icon: Layers, 
                  bgColor: 'bg-cyan-500',
                  suffix: '+'
                },
                { 
                  value: globalStats.pendingOrders, 
                  label: 'طلب قيد الانتظار', 
                  icon: Clock, 
                  bgColor: 'bg-orange-500',
                  suffix: ''
                },
                { 
                  value: globalStats.inProgressOrders, 
                  label: 'طلب قيد التنفيذ', 
                  icon: TrendingUp, 
                  bgColor: 'bg-teal-500',
                  suffix: ''
                },
                { 
                  value: globalStats.completedOrders, 
                  label: 'طلب مكتمل', 
                  icon: CheckCircle2, 
                  bgColor: 'bg-emerald-500',
                  suffix: ''
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-xl bg-card border border-border/50 p-3 sm:p-4 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                    {/* Subtle Background Glow */}
                    <div className={`absolute -top-8 -right-8 w-20 h-20 ${stat.bgColor} opacity-10 rounded-full blur-xl group-hover:opacity-15 transition-opacity duration-500`} />
                    
                    <div className="relative z-10 flex flex-row-reverse items-center justify-between gap-2">
                      {/* Icon Container */}
                      <motion.div 
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-md`}
                      >
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </motion.div>
                      
                      {/* Content */}
                      <div className="flex-1 text-right">
                        <div className="text-xl sm:text-2xl font-bold text-foreground">
                          {stat.suffix && <span className="text-primary text-sm">{stat.suffix}</span>}
                          <AnimatedCounter value={stat.value} />
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Weekly Orders Chart */}
          {weeklyData.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 sm:mb-12"
            >
              <div className="rounded-2xl bg-card border border-border/50 p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">تطور الطلبات</h3>
                      <p className="text-xs text-muted-foreground">آخر 7 أيام</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">إجمالي الطلبات</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">المكتملة</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-40 sm:h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="day" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          direction: 'rtl'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: 4 }}
                        formatter={(value: number, name: string) => [
                          value,
                          name === 'orders' ? 'إجمالي الطلبات' : 'المكتملة'
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#ordersGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#completedGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-foreground">
                      {weeklyData.reduce((sum, d) => sum + d.orders, 0)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">إجمالي الأسبوع</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-emerald-500">
                      {weeklyData.reduce((sum, d) => sum + d.completed, 0)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">المكتملة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-primary">
                      {weeklyData.length > 0 ? Math.round(weeklyData.reduce((sum, d) => sum + d.orders, 0) / 7) : 0}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">معدل يومي</div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Order Status Pie Chart */}
          {(globalStats.pendingOrders > 0 || globalStats.inProgressOrders > 0 || globalStats.completedOrders > 0) && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-8 sm:mb-12"
            >
              <div className="rounded-2xl bg-card border border-border/50 p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">توزيع حالات الطلبات</h3>
                    <p className="text-xs text-muted-foreground">نظرة عامة على جميع الطلبات</p>
                  </div>
                </div>
                
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  {/* Pie Chart */}
                  <div className="h-48 w-48 sm:h-56 sm:w-56 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'قيد الانتظار', value: globalStats.pendingOrders, color: '#f97316' },
                            { name: 'قيد التنفيذ', value: globalStats.inProgressOrders, color: '#14b8a6' },
                            { name: 'مكتمل', value: globalStats.completedOrders, color: '#10b981' },
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={1000}
                        >
                          {[
                            { name: 'قيد الانتظار', value: globalStats.pendingOrders, color: '#f97316' },
                            { name: 'قيد التنفيذ', value: globalStats.inProgressOrders, color: '#14b8a6' },
                            { name: 'مكتمل', value: globalStats.completedOrders, color: '#10b981' },
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              stroke="hsl(var(--card))"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            direction: 'rtl'
                          }}
                          formatter={(value: number, name: string) => [value, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend & Stats */}
                  <div className="flex-1 w-full">
                    <div className="grid gap-3">
                      {[
                        { name: 'قيد الانتظار', value: globalStats.pendingOrders, color: 'bg-orange-500', percentage: globalStats.totalOrders > 0 ? ((globalStats.pendingOrders / globalStats.totalOrders) * 100).toFixed(1) : 0 },
                        { name: 'قيد التنفيذ', value: globalStats.inProgressOrders, color: 'bg-teal-500', percentage: globalStats.totalOrders > 0 ? ((globalStats.inProgressOrders / globalStats.totalOrders) * 100).toFixed(1) : 0 },
                        { name: 'مكتمل', value: globalStats.completedOrders, color: 'bg-emerald-500', percentage: globalStats.totalOrders > 0 ? ((globalStats.completedOrders / globalStats.totalOrders) * 100).toFixed(1) : 0 },
                      ].map((item) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-foreground">{item.value}</span>
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                              {item.percentage}%
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Total */}
                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">إجمالي الطلبات</span>
                      <span className="text-xl font-bold text-foreground">{globalStats.totalOrders}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Features Row */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8 sm:mb-12"
          >
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 cursor-pointer",
                    activeFeatureIndex === i 
                      ? "bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border-primary/30"
                      : "bg-card/50 border-border/50 hover:border-border"
                  )}
                  onClick={() => setActiveFeatureIndex(i)}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-semibold text-foreground">{feature.title}</div>
                    <div className="text-xs text-muted-foreground">{feature.desc}</div>
                  </div>
                  <div className="sm:hidden text-sm font-medium text-foreground">{feature.title}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Bottom CTA Section */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-10 sm:mt-14"
          >
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-l from-primary via-primary/90 to-purple-600 p-6 sm:p-8 lg:p-10">
              {/* Background Effects */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/30 rounded-full blur-2xl" />
                {/* Animated Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-right">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4"
                  >
                    <Flame className="w-4 h-4 text-amber-300" />
                    <span className="text-sm font-medium text-white/90">عروض حصرية</span>
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                    هل أنت مستعد للبدء؟
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base max-w-md">
                    انضم لآلاف العملاء الراضين واحصل على أفضل الخدمات بأسعار منافسة
                  </p>
                </div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => navigate('/dashboard/services-new')}
                    size="lg"
                    className="h-14 px-8 rounded-2xl bg-white text-primary hover:bg-white/90 font-bold text-base gap-2 shadow-xl"
                  >
                    <Rocket className="w-5 h-5" />
                    ابدأ الآن
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.section>
        </div>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

export default ClientServicesHome;
