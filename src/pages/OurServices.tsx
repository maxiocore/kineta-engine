import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Activity,
  TrendingUp,
  CheckCircle2,
  Circle,
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
    keywords: ["instagram", "facebook", "youtube", "twitter", "tiktok", "linkedin", "telegram", "snapchat", "social"],
    features: ["توصيل سريع", "متابعين حقيقيين", "ضمان التعويض", "دعم 24/7"],
  },
  {
    id: "design",
    name: "خدمات التصميم",
    nameEn: "Design Services",
    description: "تصميم جرافيك احترافي وهوية بصرية متكاملة",
    icon: Palette,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    bgGradient: "from-orange-500/10 via-amber-500/10 to-yellow-500/10",
    keywords: ["design", "graphic", "logo", "brand", "تصميم", "شعار", "هوية"],
    features: ["تصاميم احترافية", "مراجعات مجانية", "ملفات مفتوحة", "تسليم سريع"],
  },
  {
    id: "programming",
    name: "خدمات البرمجة",
    nameEn: "Programming Services",
    description: "تطوير مواقع وتطبيقات بأحدث التقنيات",
    icon: Code,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    bgGradient: "from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
    keywords: ["programming", "code", "web", "app", "برمجة", "موقع", "تطبيق", "development"],
    features: ["كود نظيف", "تقنيات حديثة", "دعم فني", "أمان عالي"],
  },
];

const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      className="w-2 h-2 rounded-full bg-emerald-500"
      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-xs font-medium text-emerald-500">مباشر</span>
  </motion.div>
);

const OurServices = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedType = searchParams.get("type");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <motion.div 
            className="absolute top-20 right-[10%] w-72 h-72 bg-primary/10 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-10 left-[20%] w-64 h-64 bg-accent/10 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, delay: 2 }}
          />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <Badge className="gap-2 text-sm py-1.5 px-4" variant="secondary">
                  <Sparkles className="w-4 h-4" />
                  خدمات متكاملة
                </Badge>
                <LiveIndicator />
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
                  خدماتنا
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                نقدم لك مجموعة متكاملة من الخدمات الرقمية لتطوير حضورك على الإنترنت
              </p>

              {/* Search Bar */}
              <motion.div 
                className="max-w-md mx-auto relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن خدمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-12 h-12 text-base rounded-xl bg-card/50 border-border/50"
                />
              </motion.div>

              {/* Quick Stats */}
              <motion.div 
                className="flex flex-wrap justify-center gap-6 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { icon: Zap, label: "توصيل فوري", value: "سريع" },
                  { icon: Shield, label: "ضمان الجودة", value: "100%" },
                  { icon: Clock, label: "دعم متواصل", value: "24/7" },
                  { icon: Star, label: "تقييم العملاء", value: "4.9" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/30 border border-border/30">
                    <stat.icon className="w-5 h-5 text-primary" />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Service Types Grid */}
        <section className="py-10 sm:py-16">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {serviceTypes.map((type, index) => {
                const typeCats = getCategoriesForType(type);
                const IconComponent = type.icon;
                
                return (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group"
                  >
                    <Card className={`h-full relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-500 bg-gradient-to-br ${type.bgGradient}`}>
                      {/* Decorative gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                      
                      <CardContent className="p-6 relative">
                        {/* Icon */}
                        <motion.div 
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-5 shadow-lg shadow-primary/10 group-hover:shadow-xl group-hover:shadow-primary/20 transition-shadow`}
                          whileHover={{ rotate: 5, scale: 1.05 }}
                        >
                          <IconComponent className="w-8 h-8 text-white" />
                        </motion.div>

                        {/* Content */}
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {type.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {type.description}
                        </p>

                        {/* Features */}
                        <div className="space-y-2 mb-5">
                          {type.features.slice(0, 3).map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              {feature}
                            </div>
                          ))}
                        </div>

                        {/* Categories count & CTA */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <Badge variant="secondary" className="text-xs">
                            {typeCats.length} قسم
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 group-hover:gap-2 transition-all"
                            onClick={() => navigate(`/our-services?type=${type.id}`)}
                          >
                            استكشف
                            <ArrowLeft className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Preview of categories */}
                        {typeCats.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {typeCats.slice(0, 4).map(cat => {
                              const CatIcon = iconMap[cat.icon] || Layers;
                              return (
                                <motion.div
                                  key={cat.id}
                                  whileHover={{ scale: 1.1 }}
                                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm`}
                                >
                                  <CatIcon className="w-4 h-4 text-white" />
                                </motion.div>
                              );
                            })}
                            {typeCats.length > 4 && (
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                +{typeCats.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* All Categories Section */}
        <section className="py-10 sm:py-16 bg-gradient-to-b from-secondary/20 to-transparent border-y border-border/30">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <Badge variant="outline" className="mb-4 gap-2">
                <Activity className="w-3 h-3" />
                تحديث لحظي
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                جميع الأقسام
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                استعرض جميع أقسام الخدمات المتاحة - يتم تحديثها تلقائياً
              </p>
            </motion.div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : filteredCategories.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">لا توجد أقسام متطابقة</p>
              </motion.div>
            ) : (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                layout
              >
                <AnimatePresence mode="popLayout">
                  {filteredCategories.map((category, index) => {
                    const IconComponent = iconMap[category.icon] || Layers;
                    
                    return (
                      <motion.div
                        key={category.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                      >
                        <Link to={`/category/${category.slug}`}>
                          <Card className="h-full group cursor-pointer overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-lg transition-all">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                              <motion.div 
                                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}
                                whileHover={{ rotate: 10, scale: 1.1 }}
                              >
                                <IconComponent className="w-7 h-7 text-white" />
                              </motion.div>
                              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-1">
                                {category.name_ar}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {category.name}
                              </p>
                              {category.description_ar && (
                                <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2">
                                  {category.description_ar}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-8 sm:p-12 text-center"
            >
              <motion.div 
                className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"
                animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl"
                >
                  <TrendingUp className="w-10 h-10 text-primary-foreground" />
                </motion.div>
                
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  هل أنت مستعد لتطوير أعمالك؟
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                  ابدأ الآن واستفد من خدماتنا المتميزة مع ضمان الجودة والدعم المتواصل
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="gap-2 px-8 bg-gradient-to-l from-primary to-accent shadow-lg"
                    onClick={() => navigate("/auth?mode=signup")}
                  >
                    <Sparkles className="w-5 h-5" />
                    ابدأ مجاناً
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/services")}
                  >
                    استعرض الخدمات
                    <ChevronRight className="w-5 h-5" />
                  </Button>
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
