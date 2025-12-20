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
  ArrowUpRight,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Rocket
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import ServicesHomeSkeleton from "@/components/dashboard/ServicesHomeSkeleton";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import { toast } from "sonner";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

const floatAnimation = {
  y: [-8, 8, -8],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: [0.4, 0, 0.2, 1] as const
  }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [0.5, 0.8, 0.5],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: [0.4, 0, 0.2, 1] as const
  }
};

const ClientServicesHome = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.05 });
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  
  const [servicesCount, setServicesCount] = useState({
    social: 0,
    design: 0,
    dev: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);

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
    toast.success("تم تحديث الخدمات");
  };

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sections = [
    {
      id: 'social',
      title: 'خدمات مواقع التواصل',
      subtitle: 'Social Media Services',
      description: 'زيادة المتابعين والتفاعل على جميع منصات التواصل الاجتماعي',
      icon: Globe,
      path: '/dashboard/services',
      gradient: 'from-blue-600/80 to-cyan-600/80',
      iconGradient: 'from-blue-500 to-cyan-500',
      glowColor: 'rgba(59, 130, 246, 0.15)',
      bgGlow: 'bg-blue-500/10',
      count: servicesCount.social,
      platforms: [
        { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { icon: Facebook, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { icon: Youtube, color: 'text-red-400', bg: 'bg-red-500/10' },
        { icon: Twitter, color: 'text-sky-400', bg: 'bg-sky-500/10' },
        { icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { icon: Send, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      ]
    },
    {
      id: 'design',
      title: 'خدمات التصميم',
      subtitle: 'Design Services',
      description: 'تصاميم احترافية للشعارات والهويات البصرية',
      icon: Palette,
      path: '/dashboard/design-services',
      gradient: 'from-violet-600/80 to-purple-600/80',
      iconGradient: 'from-violet-500 to-purple-500',
      glowColor: 'rgba(139, 92, 246, 0.15)',
      bgGlow: 'bg-violet-500/10',
      count: servicesCount.design,
      platforms: [
        { icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { icon: Globe2, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
      ]
    },
    {
      id: 'dev',
      title: 'خدمات البرمجة والتطوير',
      subtitle: 'Development Services',
      description: 'تطوير المواقع والتطبيقات بأحدث التقنيات',
      icon: Code,
      path: '/dashboard/dev-services',
      gradient: 'from-emerald-600/80 to-teal-600/80',
      iconGradient: 'from-emerald-500 to-teal-500',
      glowColor: 'rgba(16, 185, 129, 0.15)',
      bgGlow: 'bg-emerald-500/10',
      count: servicesCount.dev,
      platforms: [
        { icon: Globe2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { icon: Code, color: 'text-teal-400', bg: 'bg-teal-500/10' },
        { icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/10' },
        { icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      ]
    }
  ];

  const features = [
    { icon: Zap, title: 'تنفيذ سريع', description: 'بدء الخدمة خلال دقائق', gradient: 'from-amber-500/80 to-orange-500/80' },
    { icon: Shield, title: 'جودة مضمونة', description: 'ضمان استرداد 100%', gradient: 'from-emerald-500/80 to-green-500/80' },
    { icon: Users, title: 'دعم 24/7', description: 'فريق دعم متخصص', gradient: 'from-blue-500/80 to-cyan-500/80' },
    { icon: Clock, title: 'متابعة لحظية', description: 'تتبع طلباتك مباشرة', gradient: 'from-violet-500/80 to-purple-500/80' },
  ];

  const stats = [
    { value: servicesCount.social, label: 'تواصل', gradient: 'from-blue-500/80 to-cyan-500/80' },
    { value: servicesCount.design, label: 'تصميم', gradient: 'from-violet-500/80 to-purple-500/80' },
    { value: servicesCount.dev, label: 'برمجة', gradient: 'from-emerald-500/80 to-teal-500/80' },
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
        <div ref={containerRef} className="space-y-8 lg:space-y-12 relative" dir="rtl">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <motion.div
            style={{ y: backgroundY }}
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={pulseAnimation}
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/5 via-pink-500/10 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: [0, 0, 1, 1] }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.02]"
          >
            <div className="w-full h-full border border-primary/20 rounded-full" />
            <div className="absolute inset-8 border border-primary/15 rounded-full" />
            <div className="absolute inset-16 border border-primary/10 rounded-full" />
          </motion.div>
        </div>

        {/* Hero Header Section */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          {/* Glassmorphism Header Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/30 p-6 sm:p-8">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
            
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Side - Title & Description */}
              <div className="flex items-start gap-4 sm:gap-5">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/dashboard/orders')}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </motion.div>
                
                <div className="flex items-center gap-4 sm:gap-5">
                  <motion.div 
                    animate={floatAnimation}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 rounded-2xl blur-xl opacity-50" />
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-2xl shadow-primary/30">
                      <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
                    />
                  </motion.div>
                  
                  <div>
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text"
                    >
                      خدماتنا
                    </motion.h1>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-2 mt-1"
                    >
                      <Rocket className="w-4 h-4 text-primary" />
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {totalServices} خدمة متاحة للطلب الآن
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Right Side - Stats Cards */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap gap-3"
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="group relative"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                    <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                        <span className="text-sm font-bold text-white">{stat.value}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{stat.label}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Services Cards - Premium Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-5 sm:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              variants={itemVariants}
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
              className="group"
            >
              <Link to={section.path} className="block h-full">
                <Card className="h-full relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-500 hover:shadow-xl hover:border-border">
                  {/* Subtle Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.08]`}
                  />
                  
                  {/* Subtle Glow Orb */}
                  <div
                    className={`absolute -top-20 -right-20 w-40 h-40 ${section.bgGlow} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}
                  />

                  <CardContent className="relative z-10 p-6 sm:p-7 flex flex-col h-full min-h-[280px]">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <motion.div 
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${section.iconGradient || section.gradient} rounded-2xl blur-lg opacity-40`} />
                        <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${section.iconGradient || section.gradient} shadow-lg`}>
                          <section.icon className="w-7 h-7 text-white" />
                        </div>
                      </motion.div>
                      
                      <motion.div
                        animate={{ 
                          x: hoveredSection === section.id ? -8 : 0,
                          scale: hoveredSection === section.id ? 1.1 : 1
                        }}
                        className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-all duration-300"
                      >
                        <span className="text-xs font-semibold tracking-wide">استعراض</span>
                        <ArrowUpRight className="w-5 h-5" />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <motion.h3 
                          animate={{ x: hoveredSection === section.id ? 4 : 0 }}
                          className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-all duration-300"
                        >
                          {section.title}
                        </motion.h3>
                        <Badge 
                          className={`bg-gradient-to-r ${section.iconGradient || section.gradient} text-white border-0 shadow-md px-3 py-1 text-xs font-bold`}
                        >
                          {section.count}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground/70 tracking-wider uppercase">
                        {section.subtitle}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.description}
                      </p>
                    </div>

                    {/* Platforms */}
                    <div className="flex items-center gap-2 mt-5 pt-5 border-t border-border/30">
                      <AnimatePresence>
                        {section.platforms.map((platform, pIndex) => (
                          <motion.div
                            key={pIndex}
                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ 
                              delay: 0.4 + pIndex * 0.08,
                              type: "spring",
                              stiffness: 200
                            }}
                            whileHover={{ scale: 1.2, y: -4 }}
                            className={`w-9 h-9 rounded-xl ${platform.bg} flex items-center justify-center backdrop-blur-sm border border-border/30 group-hover:border-primary/20 transition-all duration-300`}
                          >
                            <platform.icon className={`w-4 h-4 ${platform.color}`} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      <motion.div
                        animate={{ x: hoveredSection === section.id ? 4 : 0 }}
                        className="mr-auto flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors"
                      >
                        <span>المزيد</span>
                        <ArrowRight className="w-3 h-3" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Section - Animated Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 rounded-3xl blur-3xl" />
          
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                onMouseEnter={() => setActiveFeature(index)}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-xl transition-opacity duration-500 ${activeFeature === index ? 'opacity-10' : 'opacity-0'}`} />
                
                <div className={`relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-card/90 backdrop-blur-sm border transition-all duration-500 ${activeFeature === index ? 'border-primary/20 shadow-lg' : 'border-border/30'}`}>
                  <motion.div 
                    animate={{ 
                      scale: activeFeature === index ? [1, 1.1, 1] : 1,
                      rotate: activeFeature === index ? [0, 5, -5, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  
                  <div className="text-center">
                    <h4 className="font-bold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  
                  <motion.div
                    animate={{ scale: activeFeature === index ? 1 : 0 }}
                    className="absolute -top-2 -right-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Banner - Premium Design */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-purple-600" />
          <motion.div
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              x: [0, -80, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} />
          
          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <motion.div
                  animate={floatAnimation}
                  className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20"
                >
                  <MessageCircle className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="text-xl sm:text-2xl font-bold text-white mb-2"
                  >
                    هل تحتاج مساعدة؟
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 }}
                    className="text-white/80 text-sm sm:text-base"
                  >
                    فريق الدعم الفني متواجد على مدار الساعة لمساعدتك
                  </motion.p>
                </div>
              </div>
              
              <Link to="/dashboard/support">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-primary font-bold text-base shadow-2xl transition-all duration-300"
                >
                  <span>تواصل معنا</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
        </div>
      </PullToRefresh>
    </ClientDashboardLayout>
  );
};

// Arrow Left component for RTL
const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export default ClientServicesHome;
