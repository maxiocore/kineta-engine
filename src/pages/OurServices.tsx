import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useInView, useScroll, useTransform, useMotionValue, animate } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  Palette,
  Code,
  Sparkles,
  ArrowLeft,
  Zap,
  Shield,
  Clock,
  Star,
  CheckCircle2,
  Users,
  Heart,
  Award,
  Rocket,
  Target,
  Crown,
  TrendingUp,
  ArrowUpRight,
  Play,
  ShoppingCart,
  Wallet,
  Activity,
  Layers,
  Eye,
  MousePointer,
  Headphones,
  BadgeCheck,
  Timer,
  BarChart3,
  PieChart,
  LineChart,
  Megaphone,
  Building2,
  Briefcase,
  GraduationCap,
  Gem,
  Flame,
  MessageCircle,
  Send,
  Lock,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

// Main service categories with enterprise-level content
const mainServices = [
  {
    id: "social",
    name: "خدمات التواصل الاجتماعي",
    nameEn: "Social Media Growth",
    description: "حلول متكاملة لتنمية حضورك الرقمي على جميع منصات التواصل الاجتماعي مع ضمان الجودة والتوصيل السريع",
    longDescription: "نقدم خدمات احترافية لزيادة المتابعين والتفاعل على Instagram, TikTok, YouTube, Twitter, Facebook, LinkedIn وجميع المنصات الأخرى. خبراء في التسويق الرقمي مع فريق دعم متواصل.",
    icon: Globe,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    bgGradient: "from-pink-500/20 via-rose-500/10 to-transparent",
    accentColor: "text-pink-500",
    features: [
      { icon: Zap, text: "توصيل فوري خلال دقائق" },
      { icon: Shield, text: "ضمان التعويض مدى الحياة" },
      { icon: Users, text: "متابعين حقيقيين ونشطين" },
      { icon: Headphones, text: "دعم فني على مدار الساعة" },
    ],
    stats: { value: "500K+", label: "طلب منفذ" },
    clients: ["شركات Fortune 500", "مؤثرين عالميين", "علامات تجارية كبرى"],
    link: "/services",
    popular: true,
  },
  {
    id: "design",
    name: "خدمات التصميم الإبداعي",
    nameEn: "Creative Design Studio",
    description: "تصاميم مبتكرة وهوية بصرية متكاملة تعكس رؤية علامتك التجارية بأعلى معايير الجودة العالمية",
    longDescription: "فريق من المصممين المحترفين يقدمون تصاميم شعارات، هويات بصرية، منشورات سوشيال ميديا، تصاميم UI/UX، وكل ما تحتاجه لإبراز علامتك التجارية بشكل مميز.",
    icon: Palette,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    bgGradient: "from-orange-500/20 via-amber-500/10 to-transparent",
    accentColor: "text-orange-500",
    features: [
      { icon: Eye, text: "تصاميم فريدة 100%" },
      { icon: Timer, text: "مراجعات غير محدودة" },
      { icon: Layers, text: "ملفات مصدرية كاملة" },
      { icon: Award, text: "مصممين حائزين على جوائز" },
    ],
    stats: { value: "10K+", label: "تصميم مُنجز" },
    clients: ["وكالات إعلانية", "شركات ناشئة", "علامات فاخرة"],
    link: "/dashboard/design-services",
    popular: false,
  },
  {
    id: "development",
    name: "خدمات البرمجة والتطوير",
    nameEn: "Development & Tech Solutions",
    description: "تطوير مواقع وتطبيقات بأحدث التقنيات العالمية مع معايير أمان وأداء استثنائية",
    longDescription: "متخصصون في تطوير مواقع الويب، تطبيقات الموبايل، أنظمة إدارة المحتوى، متاجر إلكترونية، وحلول برمجية مخصصة. نستخدم أحدث التقنيات مثل React, Next.js, Node.js, Flutter.",
    icon: Code,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    bgGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    accentColor: "text-emerald-500",
    features: [
      { icon: Lock, text: "أمان على مستوى البنوك" },
      { icon: Rocket, text: "أداء فائق السرعة" },
      { icon: Code, text: "كود نظيف وموثق" },
      { icon: Headphones, text: "دعم فني مستمر" },
    ],
    stats: { value: "500+", label: "مشروع ناجح" },
    clients: ["شركات تقنية", "بنوك ومؤسسات مالية", "حكومات ومنظمات"],
    link: "/dashboard/dev-services",
    popular: false,
  },
  {
    id: "digital",
    name: "خدمات التسويق الرقمي",
    nameEn: "Digital Marketing Agency",
    description: "استراتيجيات تسويق رقمي متكاملة لزيادة المبيعات وتحقيق أعلى عائد على الاستثمار",
    longDescription: "خبراء في SEO، إعلانات Google و Meta، التسويق بالمحتوى، إدارة حملات إعلانية، تحليل البيانات، وتحسين معدلات التحويل. نساعدك على الوصول لجمهورك المستهدف بدقة.",
    icon: Megaphone,
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
    bgGradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    accentColor: "text-violet-500",
    features: [
      { icon: BarChart3, text: "تحليلات متقدمة" },
      { icon: Target, text: "استهداف دقيق" },
      { icon: TrendingUp, text: "نتائج مضمونة" },
      { icon: PieChart, text: "تقارير تفصيلية" },
    ],
    stats: { value: "200%", label: "متوسط زيادة المبيعات" },
    clients: ["متاجر إلكترونية", "شركات SaaS", "علامات عالمية"],
    link: "/dashboard/digital-services",
    popular: true,
  },
];

// Global companies that trust us
const trustedCompanies = [
  { name: "Google", logo: "G" },
  { name: "Meta", logo: "M" },
  { name: "Amazon", logo: "A" },
  { name: "Microsoft", logo: "MS" },
  { name: "Apple", logo: "🍎" },
  { name: "Netflix", logo: "N" },
];

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration,
        ease: "easeOut",
        onUpdate: (latest) => {
          if (latest >= 1000000) {
            setDisplayValue(`${(latest / 1000000).toFixed(1)}M`);
          } else if (latest >= 1000) {
            setDisplayValue(`${(latest / 1000).toFixed(latest >= 10000 ? 0 : 1)}K`);
          } else {
            setDisplayValue(Math.round(latest).toLocaleString('en-US'));
          }
        }
      });
      return controls.stop;
    }
  }, [isInView, value, duration, count]);

  return (
    <span ref={ref} className="tabular-nums font-mono">
      {displayValue}
    </span>
  );
};

// Floating Particles Background
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-primary/20"
        initial={{ 
          x: Math.random() * window.innerWidth, 
          y: Math.random() * 800,
          scale: Math.random() * 0.5 + 0.5,
        }}
        animate={{ 
          y: [null, -100],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{ 
          duration: Math.random() * 10 + 10,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
    ))}
  </div>
);

// Premium Service Card Component
const ServiceCard = ({ service, index }: { service: typeof mainServices[0]; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();
  const IconComponent = service.icon;
  const isReversed = index % 2 === 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
        {/* Content Side */}
        <motion.div 
          className={`relative z-10 ${isReversed ? 'lg:order-2' : ''}`}
          initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Badge */}
          {service.popular && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4 }}
            >
              <Badge className={`mb-4 gap-2 px-4 py-2 bg-gradient-to-l ${service.gradient} text-white border-0`}>
                <Flame className="w-4 h-4" />
                الأكثر طلباً
              </Badge>
            </motion.div>
          )}

          {/* Title */}
          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            {service.name}
          </motion.h2>
          
          <motion.p 
            className={`text-lg mb-2 font-medium ${service.accentColor}`}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.35 }}
          >
            {service.nameEn}
          </motion.p>

          {/* Description */}
          <motion.p 
            className="text-muted-foreground text-lg mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
          >
            {service.longDescription}
          </motion.p>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-2 gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            {service.features.map((feature, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ scale: 1.02, backgroundColor: 'hsl(var(--secondary))' }}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.gradient} flex items-center justify-center shrink-0`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Trusted By */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
          >
            <p className="text-sm text-muted-foreground mb-3">موثوق من قبل:</p>
            <div className="flex flex-wrap gap-2">
              {service.clients.map((client, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1.5">
                  <BadgeCheck className="w-3 h-3 ml-1 text-success" />
                  {client}
                </Badge>
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
          >
            <Button 
              size="lg"
              className={`gap-2 bg-gradient-to-l ${service.gradient} hover:opacity-90 text-white border-0 px-8 py-6 text-lg shadow-xl`}
              onClick={() => navigate('/auth?mode=signup')}
            >
              <Sparkles className="w-5 h-5" />
              سجل الآن للبدء
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="gap-2 px-8 py-6 text-lg"
              onClick={() => navigate(service.link)}
            >
              استكشف الخدمات
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Visual Side */}
        <motion.div 
          className={`relative ${isReversed ? 'lg:order-1' : ''}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Background Glow */}
          <div className={`absolute inset-0 bg-gradient-to-br ${service.bgGradient} rounded-3xl blur-3xl scale-110`} />
          
          {/* Card */}
          <Card className="relative overflow-hidden border-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-8 sm:p-12">
              {/* Icon */}
              <motion.div 
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-8 mx-auto shadow-2xl`}
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <IconComponent className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </motion.div>

              {/* Stats */}
              <div className="text-center mb-8">
                <motion.div 
                  className={`text-5xl sm:text-6xl font-bold bg-gradient-to-l ${service.gradient} bg-clip-text text-transparent mb-2`}
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  {service.stats.value}
                </motion.div>
                <p className="text-muted-foreground text-lg">{service.stats.label}</p>
              </div>

              {/* Mini Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Star, label: "تقييم", value: "4.9" },
                  { icon: Clock, label: "سرعة", value: "فوري" },
                  { icon: Shield, label: "ضمان", value: "100%" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="text-center p-3 rounded-xl bg-secondary/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <stat.icon className={`w-5 h-5 mx-auto mb-2 ${service.accentColor}`} />
                    <div className="font-bold text-sm">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Decorative Elements */}
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-2xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Divider */}
      {index < mainServices.length - 1 && (
        <motion.div 
          className="my-20 lg:my-32 flex items-center justify-center"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <div className="h-px w-full max-w-md bg-gradient-to-l from-transparent via-border to-transparent" />
          <div className={`mx-4 w-12 h-12 rounded-full bg-gradient-to-br ${service.gradient} flex items-center justify-center shrink-0`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-border to-transparent" />
        </motion.div>
      )}
    </motion.div>
  );
};

// Live Stats Section
const LiveStatsSection = ({ stats, isLoading }: { stats: any; isLoading: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const statsData = [
    { icon: Users, value: stats?.total_users || 0, label: "عميل نشط", gradient: "from-blue-500 to-cyan-400" },
    { icon: ShoppingCart, value: stats?.completed_orders || 0, label: "طلب مكتمل", gradient: "from-violet-500 to-purple-400" },
    { icon: Award, value: stats?.total_services || 0, label: "خدمة متاحة", gradient: "from-amber-500 to-orange-400" },
    { icon: Wallet, value: stats?.total_deposits || 0, label: "عملية ناجحة", gradient: "from-emerald-500 to-green-400" },
  ];

  return (
    <motion.section
      ref={ref}
      className="py-20 bg-gradient-to-b from-secondary/50 to-background"
    >
      <div className="container px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="gap-2 mb-4 px-4 py-2">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            إحصائيات لحظية
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            أرقام <span className="text-primary">تتحدث</span> عن نجاحنا
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-xl hover:border-primary/50 transition-all duration-500 h-full">
                <CardContent className="p-6 sm:p-8 text-center">
                  {/* Background glow */}
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  />
                  
                  <motion.div 
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <stat.icon className="w-7 h-7 text-white" />
                  </motion.div>

                  {isLoading ? (
                    <Skeleton className="h-10 w-20 mx-auto mb-2" />
                  ) : (
                    <div className="text-3xl sm:text-4xl font-bold mb-1" dir="ltr">
                      <AnimatedCounter value={stat.value} />
                    </div>
                  )}
                  <p className="text-muted-foreground font-medium">{stat.label}</p>

                  {/* Live indicator */}
                  <motion.div
                    className="absolute top-3 right-3 flex items-center gap-1.5"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-2 h-2 rounded-full bg-success" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Trusted Companies Section
const TrustedCompaniesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.section
      ref={ref}
      className="py-16 border-y border-border/50 bg-secondary/30"
    >
      <div className="container px-4">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
        >
          <p className="text-muted-foreground text-lg">
            موثوق من قبل <span className="text-primary font-semibold">+10,000</span> عميل حول العالم
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {trustedCompanies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-card border border-border/50 shadow-lg cursor-pointer hover:border-primary/50 transition-all"
            >
              <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">{company.logo}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

const OurServices = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  // Fetch real stats from database
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["public-stats-services"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_stats');
      if (error) throw error;
      return data as {
        total_orders: number;
        completed_orders: number;
        total_users: number;
        total_services: number;
        total_deposits: number;
      };
    },
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center py-20 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
            <motion.div 
              className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div 
              className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <FloatingParticles />
          </div>

          <div className="container px-4 relative z-10">
            <motion.div
              className="text-center max-w-5xl mx-auto"
              initial={{ opacity: 0 }}
              animate={isHeroInView ? { opacity: 1 } : {}}
            >
              {/* Badges */}
              <motion.div 
                className="flex flex-wrap items-center justify-center gap-3 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 }}
              >
                <Badge className="gap-2 text-sm py-2 px-4 bg-primary/10 text-primary border-primary/30" variant="outline">
                  <Crown className="w-4 h-4" />
                  #1 في الشرق الأوسط
                </Badge>
                <Badge className="gap-2 text-sm py-2 px-4 bg-success/10 text-success border-success/30" variant="outline">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-success"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  متصل الآن
                </Badge>
              </motion.div>

              {/* Main Title */}
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
              >
                <span className="block mb-2">حلول رقمية</span>
                <span className="bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">
                  بمعايير عالمية
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
              >
                نقدم لك مجموعة شاملة من الخدمات الرقمية المتكاملة 
                <span className="text-primary"> لتحقيق نجاحك </span>
                في العالم الرقمي
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-wrap items-center justify-center gap-4 mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-l from-primary to-accent text-primary-foreground px-8 py-6 text-lg shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  <Rocket className="w-5 h-5" />
                  ابدأ رحلتك الآن
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 px-8 py-6 text-lg"
                  onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="w-5 h-5" />
                  اكتشف خدماتنا
                </Button>
              </motion.div>

              {/* Quick Stats */}
              <motion.div 
                className="flex flex-wrap items-center justify-center gap-8 sm:gap-12"
                initial={{ opacity: 0 }}
                animate={isHeroInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
              >
                {[
                  { icon: Shield, label: "ضمان 100%", color: "text-success" },
                  { icon: Clock, label: "توصيل فوري", color: "text-primary" },
                  { icon: Headphones, label: "دعم 24/7", color: "text-accent" },
                  { icon: Star, label: "تقييم 4.9", color: "text-amber-500" },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-8 h-12 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
                <motion.div 
                  className="w-1.5 h-3 rounded-full bg-primary"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trusted Companies */}
        <TrustedCompaniesSection />

        {/* Live Stats */}
        <LiveStatsSection stats={stats} isLoading={isStatsLoading} />

        {/* Main Services Sections */}
        <section id="services-section" className="py-20 sm:py-32">
          <div className="container px-4">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <Badge variant="outline" className="gap-2 mb-6 px-4 py-2 text-sm">
                <Layers className="w-4 h-4 text-primary" />
                خدماتنا الرئيسية
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                كل ما تحتاجه في 
                <span className="text-primary"> مكان واحد</span>
              </h2>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
                نوفر لك مجموعة متكاملة من الخدمات الرقمية المصممة لتلبية جميع احتياجاتك
              </p>
            </motion.div>

            {/* Service Cards */}
            <div className="space-y-12">
              {mainServices.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 sm:py-32 bg-gradient-to-br from-primary/10 via-background to-accent/10 relative overflow-hidden">
          {/* Background Effects */}
          <motion.div 
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[200px]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[150px]"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 10, repeat: Infinity }}
          />

          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", duration: 0.8 }}
                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-3xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center mb-8 shadow-2xl"
              >
                <Rocket className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                جاهز للانطلاق؟
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                انضم إلى آلاف العملاء الذين يثقون بنا لتحقيق أهدافهم الرقمية وابدأ رحلة النجاح اليوم
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-l from-primary to-accent text-primary-foreground px-10 py-7 text-xl shadow-2xl hover:shadow-primary/50 transition-all"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  <Sparkles className="w-6 h-6" />
                  سجل الآن مجاناً
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2 px-10 py-7 text-xl"
                  onClick={() => navigate('/contact')}
                >
                  <MessageCircle className="w-6 h-6" />
                  تواصل معنا
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
                {[
                  { icon: Shield, text: "دفع آمن 100%", color: "text-success" },
                  { icon: Clock, text: "دعم فني 24/7", color: "text-primary" },
                  { icon: Award, text: "ضمان الجودة", color: "text-amber-500" },
                  { icon: Heart, text: "+10K عميل سعيد", color: "text-rose-500" },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default OurServices;
