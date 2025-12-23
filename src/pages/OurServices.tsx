import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
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
  ChevronRight,
  ChevronLeft,
  Activity,
  TrendingUp,
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
  Gem,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// Extended icon mapping
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

// Service types with their categories
const serviceTypes = [
  {
    id: "social",
    name: "مواقع التواصل الاجتماعي",
    nameEn: "Social Media",
    description: "خدمات زيادة المتابعين والتفاعل على جميع منصات التواصل",
    icon: Globe,
    gradient: "from-pink-500 via-purple-500 to-blue-500",
    bgGradient: "from-pink-500/10 via-purple-500/10 to-blue-500/10",
    borderGradient: "from-pink-500/50 via-purple-500/50 to-blue-500/50",
    keywords: ["instagram", "facebook", "youtube", "twitter", "tiktok", "linkedin", "telegram", "snapchat", "social"],
    features: ["توصيل سريع", "متابعين حقيقيين", "ضمان التعويض", "دعم 24/7"],
    stats: { services: 500, clients: "10K+", rating: 4.9 },
  },
  {
    id: "design",
    name: "خدمات التصميم",
    nameEn: "Design Services",
    description: "تصميم جرافيك احترافي وهوية بصرية متكاملة",
    icon: Palette,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    bgGradient: "from-orange-500/10 via-amber-500/10 to-yellow-500/10",
    borderGradient: "from-orange-500/50 via-amber-500/50 to-yellow-500/50",
    keywords: ["design", "graphic", "logo", "brand", "تصميم", "شعار", "هوية"],
    features: ["تصاميم احترافية", "مراجعات مجانية", "ملفات مفتوحة", "تسليم سريع"],
    stats: { services: 200, clients: "5K+", rating: 4.8 },
  },
  {
    id: "programming",
    name: "خدمات البرمجة",
    nameEn: "Programming Services",
    description: "تطوير مواقع وتطبيقات بأحدث التقنيات",
    icon: Code,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    bgGradient: "from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
    borderGradient: "from-emerald-500/50 via-teal-500/50 to-cyan-500/50",
    keywords: ["programming", "code", "web", "app", "برمجة", "موقع", "تطبيق", "development"],
    features: ["كود نظيف", "تقنيات حديثة", "دعم فني", "أمان عالي"],
    stats: { services: 150, clients: "3K+", rating: 4.9 },
  },
];

// Stats data
const statsData = [
  { icon: Users, value: "50K+", label: "عميل سعيد", color: "from-blue-500 to-cyan-500" },
  { icon: Heart, value: "1M+", label: "طلب مكتمل", color: "from-pink-500 to-rose-500" },
  { icon: Award, value: "850+", label: "خدمة متاحة", color: "from-amber-500 to-orange-500" },
  { icon: Star, value: "4.9", label: "تقييم العملاء", color: "from-purple-500 to-violet-500" },
];

// Stagger container variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

// Live Indicator Component
const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full border border-success/30"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.5 }}
  >
    <motion.div
      className="w-2.5 h-2.5 rounded-full bg-success"
      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-sm font-semibold text-success">متصل الآن</span>
  </motion.div>
);

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, type: "spring" }}
      className="font-bold"
    >
      {value}{suffix}
    </motion.span>
  );
};

// Service Type Card Component
const ServiceTypeCard = ({ 
  type, 
  index, 
  categoriesCount,
  onExplore 
}: { 
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
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ 
        delay: index * 0.15, 
        duration: 0.6,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ y: -12, scale: 1.02 }}
      className="group perspective-1000"
    >
      <Card className={`h-full relative overflow-hidden border-2 border-transparent bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-500`}>
        {/* Animated gradient border */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-lg`}
        />
        
        {/* Glowing orb effect */}
        <motion.div
          className={`absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br ${type.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        <CardContent className="p-6 sm:p-8 relative z-10">
          {/* Icon with animated background */}
          <motion.div 
            className="relative mb-6"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-2xl`}
              whileHover={{ scale: 1.1 }}
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <IconComponent className="w-10 h-10 text-white" />
            </motion.div>
            
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="absolute -top-2 -left-2"
            >
              <Badge className={`bg-gradient-to-l ${type.gradient} text-white border-0 shadow-lg`}>
                <Sparkles className="w-3 h-3 ml-1" />
                مميز
              </Badge>
            </motion.div>
          </motion.div>

          {/* Content */}
          <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
            {type.name}
          </h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {type.description}
          </p>

          {/* Features with staggered animation */}
          <motion.div 
            className="space-y-3 mb-6"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {type.features.map((feature, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="flex items-center gap-3 text-sm"
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                </motion.div>
                <span className="text-foreground/80">{feature}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats row */}
          <div className="flex items-center justify-between gap-4 py-4 px-4 rounded-xl bg-secondary/50 mb-6">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{type.stats.services}+</p>
              <p className="text-[10px] text-muted-foreground">خدمة</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{type.stats.clients}</p>
              <p className="text-[10px] text-muted-foreground">عميل</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <p className="text-lg font-bold text-primary">{type.stats.rating}</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <Badge variant="secondary" className="text-xs px-3 py-1">
              {categoriesCount} قسم متاح
            </Badge>
            <Button 
              variant="ghost" 
              className="gap-2 group-hover:gap-3 transition-all group-hover:text-primary"
              onClick={onExplore}
            >
              استكشف الآن
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
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
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ 
        delay: index * 0.03,
        duration: 0.4,
        type: "spring",
        stiffness: 200 
      }}
      whileHover={{ y: -8, scale: 1.03 }}
      className="group"
    >
      <Link to={`/category/${category.slug}`}>
        <Card className="h-full cursor-pointer overflow-hidden border border-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex flex-col items-center text-center">
            {/* Icon container with animated gradient */}
            <motion.div 
              className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color || 'from-primary to-accent'} flex items-center justify-center mb-4 shadow-lg`}
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <IconComponent className="w-8 h-8 text-white" />
              
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </motion.div>
            
            {/* Title */}
            <h3 className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors mb-1">
              {category.name_ar}
            </h3>
            
            {/* English name */}
            <p className="text-xs text-muted-foreground mb-2">
              {category.name}
            </p>
            
            {/* Description */}
            {category.description_ar && (
              <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
                {category.description_ar}
              </p>
            )}
            
            {/* Arrow indicator */}
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
  const [categories, setCategories] = useState<Category[]>([]);
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Fetch categories
  const { data: initialCategories, isLoading } = useQuery({
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

  // Initialize categories
  useEffect(() => {
    if (initialCategories) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  // Real-time subscription for categories
  useEffect(() => {
    const channel = supabase
      .channel('categories_realtime_ourservices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCat = payload.new as Category;
            if (newCat.is_active) {
              setCategories(prev => [...prev, newCat].sort((a, b) => a.display_order - b.display_order));
              toast.success(`تمت إضافة قسم جديد: ${newCat.name_ar}`);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedCat = payload.new as Category;
            setCategories(prev => {
              if (!updatedCat.is_active) {
                return prev.filter(c => c.id !== updatedCat.id);
              }
              const exists = prev.find(c => c.id === updatedCat.id);
              if (exists) {
                return prev.map(c => c.id === updatedCat.id ? updatedCat : c)
                  .sort((a, b) => a.display_order - b.display_order);
              } else {
                return [...prev, updatedCat].sort((a, b) => a.display_order - b.display_order);
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedCat = payload.old as Category;
            setCategories(prev => prev.filter(c => c.id !== deletedCat.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter categories based on service type
  const getCategoriesForType = (type: typeof serviceTypes[0]) => {
    return categories.filter(cat => {
      const searchText = `${cat.name} ${cat.name_ar} ${cat.slug} ${cat.description || ''} ${cat.description_ar || ''}`.toLowerCase();
      return type.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });
  };

  // Filter by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(query) ||
      cat.name_ar.includes(query) ||
      cat.description?.toLowerCase().includes(query) ||
      cat.description_ar?.includes(query)
    );
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          
          {/* Floating orbs */}
          <motion.div 
            className="absolute top-20 right-[10%] w-96 h-96 bg-primary/20 rounded-full blur-[150px]"
            animate={{ 
              scale: [1, 1.4, 1], 
              opacity: [0.15, 0.3, 0.15],
              x: [0, 50, 0] 
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-20 left-[15%] w-80 h-80 bg-accent/20 rounded-full blur-[120px]"
            animate={{ 
              scale: [1, 1.3, 1], 
              opacity: [0.15, 0.25, 0.15],
              y: [0, -30, 0] 
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-[200px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="container px-4 relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-center max-w-5xl mx-auto"
            >
              {/* Badges row */}
              <motion.div 
                className="flex flex-wrap items-center justify-center gap-3 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="gap-2 text-sm py-2 px-5 bg-primary/10 text-primary border-primary/30" variant="outline">
                  <Crown className="w-4 h-4" />
                  الأفضل في المنطقة
                </Badge>
                <LiveIndicator />
              </motion.div>
              
              {/* Main heading */}
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <span className="block text-foreground mb-2">اكتشف عالم</span>
                <span className="relative inline-block">
                  <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    خدماتنا المتميزة
                  </span>
                  {/* Underline decoration */}
                  <motion.svg
                    className="absolute -bottom-2 left-0 right-0 w-full h-3"
                    viewBox="0 0 200 8"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                  >
                    <motion.path
                      d="M0 4 Q50 0, 100 4 T200 4"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </span>
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p 
                className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                نقدم لك مجموعة شاملة من الخدمات الرقمية المتكاملة لتطوير حضورك 
                <br className="hidden sm:block" />
                على الإنترنت وتحقيق أهدافك بأعلى جودة
              </motion.p>

              {/* Search Bar */}
              <motion.div 
                className="max-w-xl mx-auto relative mb-12"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="relative group">
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-l from-primary/50 to-accent/50 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-70 transition-opacity duration-300"
                  />
                  <div className="relative flex items-center">
                    <Search className="absolute right-5 w-6 h-6 text-muted-foreground" />
                    <Input
                      placeholder="ابحث عن خدمة... (مثال: انستقرام، تصميم، برمجة)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-14 pl-6 h-16 text-lg rounded-2xl bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all shadow-lg"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {statsData.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="relative group"
                  >
                    <div className="p-4 sm:p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all">
                      <motion.div 
                        className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                        whileHover={{ rotate: 10 }}
                      >
                        <stat.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                        <AnimatedCounter value={stat.value} />
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-muted-foreground"
            >
              <span className="text-sm">اكتشف المزيد</span>
              <ChevronRight className="w-5 h-5 rotate-90" />
            </motion.div>
          </motion.div>
        </section>

        {/* Service Types Section */}
        <section className="py-16 sm:py-24 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
          
          <div className="container px-4 relative z-10">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <Badge variant="outline" className="mb-4 gap-2 text-sm py-2 px-4">
                <Gem className="w-4 h-4 text-primary" />
                خدمات متنوعة
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                أقسام <span className="text-gradient">الخدمات</span> الرئيسية
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
                  onExplore={() => navigate(`/our-services?type=${type.id}`)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* All Categories Section */}
        <section className="py-16 sm:py-24 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 via-background to-background" />
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          
          <div className="container px-4 relative z-10">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring" }}
              >
                <Badge variant="outline" className="mb-4 gap-2">
                  <Activity className="w-4 h-4 text-success" />
                  تحديث لحظي مباشر
                </Badge>
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                جميع <span className="text-gradient">الأقسام</span> المتاحة
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                استعرض جميع أقسام الخدمات - يتم تحديثها تلقائياً في الوقت الحقيقي
              </p>
            </motion.div>

            {/* Categories Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Skeleton className="h-44 rounded-xl" />
                  </motion.div>
                ))}
              </div>
            ) : filteredCategories.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Layers className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
                </motion.div>
                <p className="text-xl text-muted-foreground mb-4">لا توجد أقسام متطابقة</p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  مسح البحث
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                layout
              >
                <AnimatePresence mode="popLayout">
                  {filteredCategories.map((category, index) => (
                    <CategoryCard 
                      key={category.id} 
                      category={category} 
                      index={index} 
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-primary/20 p-8 sm:p-14"
            >
              {/* Animated background orbs */}
              <motion.div 
                className="absolute top-0 right-1/4 w-72 h-72 bg-primary/30 rounded-full blur-[120px]"
                animate={{ 
                  scale: [1, 1.3, 1], 
                  x: [0, 40, 0],
                  opacity: [0.3, 0.5, 0.3] 
                }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-0 left-1/4 w-64 h-64 bg-accent/30 rounded-full blur-[100px]"
                animate={{ 
                  scale: [1, 1.2, 1], 
                  y: [0, -30, 0],
                  opacity: [0.3, 0.5, 0.3] 
                }}
                transition={{ duration: 6, repeat: Infinity, delay: 1 }}
              />
              
              <div className="relative z-10 text-center max-w-3xl mx-auto">
                {/* Animated icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="mb-8"
                >
                  <motion.div 
                    className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30"
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Rocket className="w-12 h-12 text-primary-foreground" />
                  </motion.div>
                </motion.div>
                
                <motion.h2 
                  className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  هل أنت مستعد لـ
                  <span className="text-gradient"> تطوير أعمالك</span>؟
                </motion.h2>
                
                <motion.p 
                  className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  انضم إلى آلاف العملاء الراضين واستفد من خدماتنا المتميزة مع ضمان الجودة والدعم المتواصل على مدار الساعة
                </motion.p>
                
                {/* CTA Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    size="lg" 
                    className="gap-3 px-10 h-14 text-lg bg-gradient-to-l from-primary to-accent shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all"
                    onClick={() => navigate("/auth?mode=signup")}
                  >
                    <Sparkles className="w-5 h-5" />
                    ابدأ مجاناً الآن
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-3 px-10 h-14 text-lg border-2 hover:bg-secondary/50"
                    onClick={() => navigate("/services")}
                  >
                    استعرض الخدمات
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </motion.div>

                {/* Trust indicators */}
                <motion.div 
                  className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-8 border-t border-border/30"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  {[
                    { icon: Shield, text: "ضمان الجودة" },
                    { icon: Zap, text: "توصيل فوري" },
                    { icon: Clock, text: "دعم 24/7" },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.text}
                      className="flex items-center gap-2 text-muted-foreground"
                      whileHover={{ scale: 1.05, color: "hsl(var(--primary))" }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
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
