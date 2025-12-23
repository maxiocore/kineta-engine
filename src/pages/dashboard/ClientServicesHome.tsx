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
  Music2
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

const scaleIn = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
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
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  
  const [servicesCount, setServicesCount] = useState({
    social: 0,
    design: 0,
    dev: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  const fetchCounts = async () => {
    setIsLoading(true);
    try {
      const { count: socialCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('category.ilike.%instagram%,category.ilike.%facebook%,category.ilike.%twitter%,category.ilike.%youtube%,category.ilike.%tiktok%,category.ilike.%social%,category.ilike.%telegram%,name.ilike.%متابع%,name.ilike.%لايك%');

      const { count: designCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('category.ilike.%design%,category.ilike.%تصميم%,name.ilike.%تصميم%,name.ilike.%شعار%,name.ilike.%لوجو%');

      const { count: devCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('category.ilike.%dev%,category.ilike.%برمجة%,category.ilike.%تطوير%,name.ilike.%موقع%,name.ilike.%تطبيق%,name.ilike.%برمجة%');

      setServicesCount({
        social: socialCount || 0,
        design: designCount || 0,
        dev: devCount || 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
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
      id: 'social',
      title: 'خدمات التواصل الاجتماعي',
      subtitle: 'Social Media',
      description: 'زيادة المتابعين والتفاعل على جميع المنصات',
      icon: Globe,
      path: '/dashboard/services',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      bgGradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
      shadowColor: 'shadow-blue-500/25',
      count: servicesCount.social,
      platforms: [
        { icon: Instagram, label: 'انستقرام', color: 'from-pink-500 to-purple-600' },
        { icon: Facebook, label: 'فيسبوك', color: 'from-blue-500 to-blue-700' },
        { icon: Youtube, label: 'يوتيوب', color: 'from-red-500 to-red-700' },
        { icon: Twitter, label: 'تويتر', color: 'from-sky-400 to-sky-600' },
        { icon: Music2, label: 'تيك توك', color: 'from-zinc-700 to-zinc-900' },
        { icon: Send, label: 'تيليجرام', color: 'from-sky-500 to-blue-600' },
      ],
      features: ['متابعين حقيقيين', 'تسليم فوري', 'ضمان 30 يوم']
    },
    {
      id: 'design',
      title: 'خدمات التصميم',
      subtitle: 'Design Services',
      description: 'تصاميم احترافية تعكس هويتك',
      icon: Palette,
      path: '/dashboard/design-services',
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      bgGradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
      shadowColor: 'shadow-violet-500/25',
      count: servicesCount.design,
      platforms: [
        { icon: Sparkles, label: 'شعارات', color: 'from-violet-500 to-purple-600' },
        { icon: Layers, label: 'هوية بصرية', color: 'from-purple-500 to-pink-600' },
        { icon: Target, label: 'سوشيال ميديا', color: 'from-fuchsia-500 to-pink-600' },
        { icon: Globe2, label: 'واجهات', color: 'from-indigo-500 to-violet-600' },
      ],
      features: ['تصميم مخصص', 'مراجعات غير محدودة', 'ملفات مصدر']
    },
    {
      id: 'dev',
      title: 'خدمات البرمجة',
      subtitle: 'Development',
      description: 'مواقع وتطبيقات بأحدث التقنيات',
      icon: Code,
      path: '/dashboard/dev-services',
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      bgGradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
      shadowColor: 'shadow-emerald-500/25',
      count: servicesCount.dev,
      platforms: [
        { icon: Globe2, label: 'مواقع', color: 'from-emerald-500 to-teal-600' },
        { icon: Smartphone, label: 'تطبيقات', color: 'from-green-500 to-emerald-600' },
        { icon: Code, label: 'برمجة', color: 'from-teal-500 to-cyan-600' },
        { icon: TrendingUp, label: 'SEO', color: 'from-lime-500 to-green-600' },
      ],
      features: ['تقنيات حديثة', 'دعم فني', 'سيو متقدم']
    }
  ];

  const features = [
    { icon: Zap, title: 'تنفيذ فوري', desc: 'بدء العمل خلال دقائق', color: 'from-amber-500 to-orange-600' },
    { icon: Shield, title: 'ضمان الجودة', desc: 'استرداد 100% مضمون', color: 'from-emerald-500 to-green-600' },
    { icon: Users, title: 'دعم متواصل', desc: 'فريق متخصص 24/7', color: 'from-blue-500 to-indigo-600' },
    { icon: Award, title: 'أعلى جودة', desc: 'معايير احترافية', color: 'from-purple-500 to-pink-600' },
  ];

  const totalServices = servicesCount.social + servicesCount.design + servicesCount.dev;

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
            style={{ scale: heroScale, opacity: heroOpacity }}
            className="relative mb-8 sm:mb-12"
          >
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-2xl border border-border/50 p-6 sm:p-8 lg:p-10"
            >
              {/* Hero Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl" />
                
                {/* Floating Shapes */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 6 + i * 2,
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                    className={cn(
                      "absolute w-4 h-4 rounded-full opacity-20",
                      i % 2 === 0 ? "bg-primary" : "bg-purple-500"
                    )}
                    style={{
                      top: `${20 + i * 15}%`,
                      left: `${10 + i * 20}%`,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                {/* Header Content */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                  <motion.div 
                    variants={slideInRight}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-4 sm:gap-5"
                  >
                    {/* Animated Icon */}
                    <motion.div
                      animate={{ 
                        rotateY: [0, 360],
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-2xl blur-xl opacity-50" />
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 flex items-center justify-center shadow-2xl">
                        <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
                      </div>
                    </motion.div>
                    
                    <div>
                      <motion.h1 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-l from-foreground via-foreground to-foreground/70 bg-clip-text"
                      >
                        خدماتنا المتميزة
                      </motion.h1>
                      <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-3 mt-2"
                      >
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs sm:text-sm">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          {totalServices}+ خدمة متاحة
                        </Badge>
                        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-emerald-500 border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          متاح الآن
                        </Badge>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Quick Action Button */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => navigate('/dashboard/orders')}
                      variant="outline"
                      size="lg"
                      className="h-12 sm:h-14 px-5 sm:px-6 rounded-2xl gap-2 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background hover:border-primary/50 transition-all duration-300 group"
                    >
                      <span className="text-sm sm:text-base font-medium">طلباتي</span>
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </div>

                {/* Stats Grid */}
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-3 gap-3 sm:gap-4"
                >
                  {[
                    { value: servicesCount.social, label: 'تواصل اجتماعي', icon: Globe, gradient: 'from-blue-500 to-cyan-500' },
                    { value: servicesCount.design, label: 'خدمات تصميم', icon: Palette, gradient: 'from-violet-500 to-purple-500' },
                    { value: servicesCount.dev, label: 'برمجة وتطوير', icon: Code, gradient: 'from-emerald-500 to-teal-500' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      variants={itemVariants}
                      whileHover={{ scale: 1.03, y: -4 }}
                      className="group relative"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                      <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 group-hover:border-border transition-all duration-300">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                          <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                          {stat.value}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </motion.section>

          {/* Features Row */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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

          {/* Main Services Grid */}
          <motion.section
            ref={sectionsRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-5 sm:space-y-6"
          >
            <motion.h2 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3"
            >
              <Crown className="w-6 h-6 text-primary" />
              اختر نوع الخدمة
            </motion.h2>

            <div className="grid gap-5 sm:gap-6 grid-cols-1 lg:grid-cols-3">
              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.3 + index * 0.1
                  }}
                  className="group"
                >
                  <Link to={section.path} className="block h-full">
                    <Card className="h-full relative overflow-hidden border border-border/50 bg-card hover:border-border transition-colors duration-300">
                      <CardContent className="p-5 sm:p-6 lg:p-7 flex flex-col h-full min-h-[320px] sm:min-h-[360px]">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-5">
                          {/* Icon */}
                          <div className={`p-4 rounded-2xl bg-gradient-to-br ${section.gradient} shadow-lg`}>
                            <section.icon className="w-7 h-7 text-white" />
                          </div>
                          
                          {/* Counter Badge */}
                          <Badge className={`bg-gradient-to-l ${section.gradient} text-white border-0 shadow-lg px-3 py-1.5 text-sm font-bold`}>
                            {section.count}+
                          </Badge>
                        </div>

                        {/* Title & Description */}
                        <div className="mb-5">
                          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                            {section.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {section.description}
                          </p>
                        </div>

                        {/* Platforms Grid */}
                        <div className="flex-1 mb-5">
                          <div className="flex flex-wrap gap-2">
                            {section.platforms.map((platform) => (
                              <div
                                key={platform.label}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-md`}
                              >
                                <platform.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-2 mb-5">
                          {section.features.map((feat) => (
                            <div
                              key={feat}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        {/* CTA Button */}
                        <Button 
                          className={cn(
                            "w-full h-12 rounded-xl font-semibold text-sm gap-2",
                            `bg-gradient-to-l ${section.gradient} hover:opacity-90 text-white`
                          )}
                        >
                          <span>استعراض الخدمات</span>
                          <ArrowUpLeft className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
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
