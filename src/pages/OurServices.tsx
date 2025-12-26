import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  Layers,
  MoreHorizontal,
  Palette,
  Code,
  Sparkles,
  ArrowLeft,
  Search,
  Zap,
  Shield,
  Clock,
  Star,
  ChevronLeft,
  CheckCircle2,
  Monitor,
  Smartphone,
  PenTool,
  Figma,
  FileCode,
  Database,
  Server,
  Brush,
  Image,
  Video,
  Box,
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
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  description_ar: string | null;
  display_order: number;
  is_active: boolean;
  parent_id: string | null;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Music2,
  Send,
  Globe,
  Layers,
  MoreHorizontal,
  Palette,
  Code,
  PenTool,
  Figma,
  FileCode,
  Database,
  Server,
  Brush,
  Image,
  Video,
  Monitor,
  Smartphone,
  Box,
};

// Service types data
const serviceTypes = [
  {
    id: "social",
    name: "خدمات التواصل الاجتماعي",
    nameEn: "Social Media Services",
    description: "زيادة المتابعين والتفاعل على جميع منصات التواصل الاجتماعي",
    icon: Globe,
    gradient: "from-pink-500 via-purple-500 to-indigo-500",
    hoverGradient: "group-hover:from-pink-400 group-hover:via-purple-400 group-hover:to-indigo-400",
    keywords: ["instagram", "facebook", "youtube", "twitter", "tiktok", "linkedin", "telegram", "snapchat", "social"],
    features: ["توصيل سريع", "متابعين حقيقيين", "ضمان التعويض", "دعم 24/7"],
    link: "/services",
  },
  {
    id: "design",
    name: "خدمات التصميم",
    nameEn: "Design Services",
    description: "تصميم جرافيك احترافي وهوية بصرية متكاملة لعلامتك التجارية",
    icon: Palette,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    hoverGradient: "group-hover:from-orange-400 group-hover:via-amber-400 group-hover:to-yellow-400",
    keywords: ["design", "graphic", "logo", "brand", "تصميم", "شعار", "هوية"],
    features: ["تصاميم احترافية", "مراجعات مجانية", "ملفات مفتوحة", "تسليم سريع"],
    link: "/dashboard/design-services",
  },
  {
    id: "programming",
    name: "خدمات البرمجة والتطوير",
    nameEn: "Development Services",
    description: "تطوير مواقع وتطبيقات بأحدث التقنيات والمعايير العالمية",
    icon: Code,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    hoverGradient: "group-hover:from-emerald-400 group-hover:via-teal-400 group-hover:to-cyan-400",
    keywords: ["programming", "code", "web", "app", "برمجة", "موقع", "تطبيق", "development"],
    features: ["كود نظيف", "تقنيات حديثة", "دعم فني", "أمان عالي"],
    link: "/dashboard/dev-services",
  },
  {
    id: "digital",
    name: "خدمات رقمية",
    nameEn: "Digital Services",
    description: "حلول رقمية متكاملة تشمل SEO والتسويق الإلكتروني وإدارة المحتوى",
    icon: Zap,
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    hoverGradient: "group-hover:from-blue-400 group-hover:via-indigo-400 group-hover:to-violet-400",
    keywords: ["digital", "seo", "marketing", "content", "رقمية", "تسويق", "محتوى", "إعلانات"],
    features: ["تحسين محركات البحث", "إدارة الإعلانات", "تحليل البيانات", "استراتيجية رقمية"],
    link: "/dashboard/digital-services",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// Live Indicator Component
const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full border border-success/30"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.3 }}
  >
    <motion.div
      className="w-2 h-2 rounded-full bg-success"
      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-xs font-medium text-success">متصل الآن</span>
  </motion.div>
);

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

// Modern Stats Card Component
const ModernStatsCard = ({ 
  icon: Icon, 
  value, 
  label, 
  sublabel,
  gradient,
  accentColor,
  index,
  isLoading 
}: { 
  icon: any; 
  value: number; 
  label: string; 
  sublabel?: string;
  gradient: string;
  accentColor: string;
  index: number;
  isLoading?: boolean;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border/40 p-6 sm:p-8 hover:border-primary/30 transition-all duration-500">
        {/* Animated background gradient */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700`}
        />
        
        {/* Floating orbs */}
        <motion.div
          className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${accentColor} opacity-20 blur-3xl`}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
        />
        
        <div className="relative z-10">
          {/* Top row - Icon and live dot */}
          <div className="flex items-start justify-between mb-6">
            <motion.div 
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.05, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
            
            {/* Animated pulse */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.1 + 0.5 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-success"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[10px] font-medium text-success">LIVE</span>
            </motion.div>
          </div>
          
          {/* Value */}
          {isLoading ? (
            <div className="space-y-2 mb-4">
              <Skeleton className="h-14 w-28" />
              <Skeleton className="h-5 w-20" />
            </div>
          ) : (
            <motion.div 
              className="mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
            >
              <div className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight" dir="ltr">
                <AnimatedCounter value={value} duration={2} />
              </div>
            </motion.div>
          )}
          
          {/* Labels */}
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {label}
            </h3>
            {sublabel && (
              <p className="text-sm text-muted-foreground">
                {sublabel}
              </p>
            )}
          </div>
          
          {/* Bottom progress bar */}
          <motion.div
            className="mt-6 h-1 rounded-full bg-border/50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: index * 0.1 + 0.6 }}
          >
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
              initial={{ width: "0%" }}
              animate={isInView ? { width: "100%" } : {}}
              transition={{ delay: index * 0.1 + 0.8, duration: 1.5, ease: "easeOut" }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// Service Type Card Component  
const ServiceTypeCard = ({ type, index, categoriesCount, onExplore }: { 
  type: typeof serviceTypes[0]; 
  index: number;
  categoriesCount: number;
  onExplore: () => void;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const IconComponent = type.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
      className="group"
    >
      <Card className="h-full relative overflow-hidden border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        <CardContent className="p-6 sm:p-8 relative z-10">
          {/* Icon */}
          <motion.div 
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transition-shadow duration-500`}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>

          {/* Badge */}
          <Badge className={`mb-4 bg-gradient-to-l ${type.gradient} text-white border-0`}>
            <Sparkles className="w-3 h-3 ml-1" />
            خدمة مميزة
          </Badge>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
            {type.name}
          </h3>
          
          {/* English name */}
          <p className="text-sm text-muted-foreground mb-4">{type.nameEn}</p>
          
          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {type.description}
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {type.features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.15 + i * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <span className="text-foreground/80">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <Badge variant="secondary" className="text-xs">
              {categoriesCount > 0 ? `${categoriesCount} قسم` : "قريباً"}
            </Badge>
            <Button 
              onClick={onExplore}
              className={`gap-2 bg-gradient-to-l ${type.gradient} hover:opacity-90 text-white border-0`}
            >
              استكشف الآن
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Category Card Component
const CategoryCard = ({ category, index }: { category: Category; index: number }) => {
  const IconComponent = iconMap[category.icon] || Layers;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link to={`/category/${category.slug}`}>
        <Card className="h-full cursor-pointer overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-5 flex flex-col items-center text-center">
            {/* Icon */}
            <motion.div 
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color || 'from-primary to-accent'} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <IconComponent className="w-7 h-7 text-white" />
            </motion.div>
            
            {/* Title */}
            <h3 className="font-bold text-sm group-hover:text-primary transition-colors mb-1">
              {category.name_ar}
            </h3>
            
            {/* English name */}
            <p className="text-xs text-muted-foreground">
              {category.name}
            </p>
            
            {/* Arrow */}
            <motion.div
              className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ x: 10 }}
              whileHover={{ x: 0 }}
            >
              <ChevronLeft className="w-5 h-5 text-primary" />
            </motion.div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

const OurServices = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedType = searchParams.get("type");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories from database
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories-ourservices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch real stats from database
  const { data: stats } = useQuery({
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

  // Get categories for a specific service type
  const getCategoriesForType = (type: typeof serviceTypes[0]) => {
    return categories.filter(cat => 
      type.keywords.some(keyword => 
        cat.name.toLowerCase().includes(keyword) || 
        cat.name_ar.includes(keyword) ||
        cat.slug.toLowerCase().includes(keyword)
      )
    );
  };

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(query) ||
      cat.name_ar.includes(query) ||
      cat.slug.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Modern stats data with real values
  const statsData = [
    { 
      icon: Users, 
      value: stats?.total_users || 0, 
      label: "عميل سعيد", 
      sublabel: "يثقون بخدماتنا",
      gradient: "from-blue-500 to-cyan-400",
      accentColor: "bg-blue-500"
    },
    { 
      icon: ShoppingCart, 
      value: stats?.completed_orders || 0, 
      label: "طلب مكتمل", 
      sublabel: "تم تنفيذه بنجاح",
      gradient: "from-violet-500 to-purple-400",
      accentColor: "bg-violet-500"
    },
    { 
      icon: Award, 
      value: stats?.total_services || 0, 
      label: "خدمة متاحة", 
      sublabel: "جاهزة للطلب",
      gradient: "from-amber-500 to-orange-400",
      accentColor: "bg-amber-500"
    },
    { 
      icon: Wallet, 
      value: stats?.total_deposits || 0, 
      label: "عملية إيداع", 
      sublabel: "تمت بنجاح",
      gradient: "from-emerald-500 to-green-400",
      accentColor: "bg-emerald-500"
    },
  ];

  const isStatsLoading = !stats;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] opacity-50" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[120px] opacity-50" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <Badge className="gap-2 text-sm py-2 px-4 bg-primary/10 text-primary border-primary/30" variant="outline">
                  <Crown className="w-4 h-4" />
                  الأفضل في المنطقة
                </Badge>
                <LiveIndicator />
              </div>
              
              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="block text-foreground mb-2">اكتشف عالم</span>
                <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
                  خدماتنا المتميزة
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                نقدم لك مجموعة شاملة من الخدمات الرقمية المتكاملة لتحقيق نجاحك في العالم الرقمي
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-l from-primary to-accent text-primary-foreground px-8"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  ابدأ الآن مجاناً
                  <Sparkles className="w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="w-5 h-5" />
                  استعرض الخدمات
                </Button>
              </div>
            </motion.div>
            
            {/* Modern Stats Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-24"
            >
              {/* Stats Header */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Badge variant="outline" className="gap-2 mb-4 px-4 py-2">
                    <Activity className="w-4 h-4 text-primary" />
                    إحصائيات لحظية
                  </Badge>
                </motion.div>
                <motion.h2 
                  className="text-3xl sm:text-4xl font-bold mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  أرقامنا تتحدث
                </motion.h2>
                <motion.p 
                  className="text-muted-foreground max-w-lg mx-auto text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  بيانات حقيقية من قاعدة البيانات
                </motion.p>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statsData.map((stat, index) => (
                  <ModernStatsCard 
                    key={index} 
                    {...stat} 
                    index={index} 
                    isLoading={isStatsLoading}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Services Section */}
        <section id="services-section" className="py-16 sm:py-24 bg-secondary/30">
          <div className="container px-4">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <Badge variant="outline" className="mb-4 gap-2 text-sm py-2 px-4">
                <Target className="w-4 h-4 text-primary" />
                خدمات متنوعة
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                أقسام <span className="text-primary">الخدمات</span> الرئيسية
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                اختر القسم المناسب لاحتياجاتك واستكشف مئات الخدمات المتاحة
              </p>
            </motion.div>

            {/* Service Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {serviceTypes.map((type, index) => (
                <ServiceTypeCard
                  key={type.id}
                  type={type}
                  index={index}
                  categoriesCount={getCategoriesForType(type).length}
                  onExplore={() => navigate(type.link)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-2xl"
              >
                <Rocket className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                جاهز للبدء؟
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                انضم إلى آلاف العملاء الذين يثقون بنا لتحقيق أهدافهم الرقمية
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-l from-primary to-accent text-primary-foreground px-8 py-6 text-lg"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  <Zap className="w-5 h-5" />
                  سجل الآن مجاناً
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2 px-8 py-6 text-lg"
                  onClick={() => navigate('/contact')}
                >
                  تواصل معنا
                  <ArrowUpRight className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-success" />
                  <span>دفع آمن</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>دعم 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span>ضمان الجودة</span>
                </div>
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
