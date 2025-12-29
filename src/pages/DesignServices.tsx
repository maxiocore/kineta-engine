import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Palette, 
  Image, 
  PenTool, 
  Layers, 
  User, 
  Store, 
  Building2, 
  Send, 
  Sparkles,
  Rocket,
  Eye,
  Clock,
  Wand2,
  ArrowLeft,
  ArrowRight,
  Zap,
  Frame,
  FileImage,
  Video,
  UserPlus,
  BookOpen,
  Presentation,
  Megaphone,
  Package,
  Crown,
  Target,
  Star,
  Heart,
  TrendingUp,
  CheckCircle2,
  Play,
  Camera,
  Brush,
  Lightbulb,
  Award,
  Gift,
  Gem,
  MousePointer2,
  Globe,
  Smartphone,
  Monitor,
  Share2,
  MessageSquare,
  ThumbsUp,
  Users,
  Briefcase,
  ShoppingBag,
  Coffee,
  Music,
  Utensils,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Car,
  Home,
  Plane
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ===== Design Categories Data =====
const mainCategories = [
  {
    id: "identity",
    name: "الهوية البصرية",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    description: "بناء هوية تجارية قوية ومميزة",
    services: [
      { name: "تصميم شعار", price: "500", popular: true, icon: Palette },
      { name: "دليل الهوية البصرية", price: "1500", popular: false, icon: BookOpen },
      { name: "ألوان وخطوط العلامة", price: "300", popular: false, icon: Brush },
      { name: "أيقونات مخصصة", price: "200", popular: false, icon: Gem },
      { name: "بطاقات الأعمال", price: "150", popular: true, icon: Frame },
      { name: "أوراق رسمية", price: "200", popular: false, icon: FileImage }
    ]
  },
  {
    id: "social",
    name: "سوشيال ميديا",
    icon: Share2,
    color: "from-pink-500 to-rose-600",
    description: "محتوى بصري جذاب لمنصاتك",
    services: [
      { name: "تصاميم انستقرام", price: "50", popular: true, icon: Camera },
      { name: "تصاميم فيسبوك", price: "50", popular: false, icon: ThumbsUp },
      { name: "تصاميم تويتر", price: "40", popular: false, icon: MessageSquare },
      { name: "تصاميم تيك توك", price: "60", popular: true, icon: Play },
      { name: "تصاميم يوتيوب", price: "80", popular: false, icon: Video },
      { name: "ستوري وريلز", price: "30", popular: true, icon: Smartphone }
    ]
  },
  {
    id: "marketing",
    name: "التسويق الإعلاني",
    icon: Megaphone,
    color: "from-purple-500 to-violet-600",
    description: "حملات إعلانية تحقق النتائج",
    services: [
      { name: "بانرات إعلانية", price: "100", popular: true, icon: Target },
      { name: "فلاير وبروشور", price: "150", popular: true, icon: FileImage },
      { name: "إعلانات جوجل", price: "80", popular: false, icon: Globe },
      { name: "إعلانات سوشيال", price: "100", popular: true, icon: TrendingUp },
      { name: "بوسترات", price: "120", popular: false, icon: Frame },
      { name: "رول أب وستاند", price: "200", popular: false, icon: Presentation }
    ]
  },
  {
    id: "motion",
    name: "موشن جرافيك",
    icon: Video,
    color: "from-cyan-500 to-blue-600",
    description: "فيديوهات متحركة احترافية",
    services: [
      { name: "فيديو ترويجي قصير", price: "500", popular: true, icon: Play },
      { name: "إنترو وآوترو", price: "300", popular: true, icon: Sparkles },
      { name: "إنفوجرافيك متحرك", price: "400", popular: false, icon: TrendingUp },
      { name: "موشن للسوشيال", price: "200", popular: true, icon: Share2 },
      { name: "فيديو وايت بورد", price: "600", popular: false, icon: Brush },
      { name: "انيميشن 2D", price: "800", popular: false, icon: Layers }
    ]
  },
  {
    id: "print",
    name: "المطبوعات",
    icon: BookOpen,
    color: "from-emerald-500 to-teal-600",
    description: "تصاميم مطبوعة عالية الجودة",
    services: [
      { name: "كتالوج منتجات", price: "500", popular: true, icon: Package },
      { name: "مجلة", price: "800", popular: false, icon: BookOpen },
      { name: "تقرير سنوي", price: "600", popular: false, icon: FileImage },
      { name: "قائمة طعام", price: "300", popular: true, icon: Utensils },
      { name: "كتيب تعريفي", price: "400", popular: false, icon: Briefcase },
      { name: "دعوات ومناسبات", price: "150", popular: true, icon: Gift }
    ]
  },
  {
    id: "packaging",
    name: "التغليف والتعبئة",
    icon: Package,
    color: "from-orange-500 to-red-600",
    description: "عبوات جذابة تميز منتجاتك",
    services: [
      { name: "تصميم علبة منتج", price: "400", popular: true, icon: Package },
      { name: "ملصقات المنتجات", price: "150", popular: true, icon: Frame },
      { name: "أكياس تسوق", price: "200", popular: false, icon: ShoppingBag },
      { name: "تغليف هدايا", price: "250", popular: false, icon: Gift },
      { name: "علب طعام", price: "300", popular: false, icon: Coffee },
      { name: "زجاجات ومشروبات", price: "350", popular: false, icon: Coffee }
    ]
  }
];

// ===== Industry Categories =====
const industries = [
  { name: "المطاعم والكافيهات", icon: Utensils, color: "bg-orange-500/10 text-orange-500" },
  { name: "الرياضة واللياقة", icon: Dumbbell, color: "bg-green-500/10 text-green-500" },
  { name: "التعليم والتدريب", icon: GraduationCap, color: "bg-blue-500/10 text-blue-500" },
  { name: "الصحة والجمال", icon: HeartPulse, color: "bg-pink-500/10 text-pink-500" },
  { name: "السيارات", icon: Car, color: "bg-slate-500/10 text-slate-500" },
  { name: "العقارات", icon: Home, color: "bg-amber-500/10 text-amber-500" },
  { name: "السفر والسياحة", icon: Plane, color: "bg-cyan-500/10 text-cyan-500" },
  { name: "الموسيقى والفنون", icon: Music, color: "bg-purple-500/10 text-purple-500" }
];

// ===== Smart Recommendation System =====
const getRecommendedServices = (selectedCategory: string | null, budget: string) => {
  if (!selectedCategory) return [];
  const category = mainCategories.find(c => c.id === selectedCategory);
  if (!category) return [];
  
  const budgetNum = parseInt(budget) || 0;
  return category.services
    .filter(s => parseInt(s.price) <= (budgetNum || 10000))
    .sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
};

// ===== 3D Card Component =====
const Card3D = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);
  
  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={cn("transition-all duration-200", className)}
    >
      {children}
    </motion.div>
  );
};

// ===== Floating Elements =====
const FloatingElement = ({ delay, duration, children, className }: { delay: number; duration: number; children: React.ReactNode; className?: string }) => (
  <motion.div
    animate={{
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const DesignServices = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    projectType: "",
    budget: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recommendations = getRecommendedServices(selectedCategory, selectedBudget);

  useEffect(() => {
    if (selectedCategory && selectedBudget) {
      setShowRecommendations(true);
    }
  }, [selectedCategory, selectedBudget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('contact-form', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          subject: `طلب خدمة تصميم: ${formData.projectType}`,
          message: `نوع التصميم: ${formData.projectType}\nالميزانية التقريبية: ${formData.budget}\n\nتفاصيل المشروع:\n${formData.description}`
        }
      });

      if (error) throw error;

      toast.success("تم إرسال طلبك بنجاح! سنتواصل معك قريباً");
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        projectType: "",
        budget: "",
        description: ""
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء الإرسال. حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { value: "2500+", label: "تصميم منجز", icon: CheckCircle2 },
    { value: "500+", label: "عميل سعيد", icon: Heart },
    { value: "50+", label: "مصمم محترف", icon: Users },
    { value: "99%", label: "نسبة الرضا", icon: Star }
  ];

  const steps = [
    { title: "اختر الفئة", description: "حدد نوع التصميم المطلوب" },
    { title: "حدد الميزانية", description: "اختر نطاق ميزانيتك" },
    { title: "احصل على التوصيات", description: "نقترح لك الأفضل" },
    { title: "ابدأ الآن", description: "تواصل معنا" }
  ];

  const budgetRanges = [
    { label: "أقل من 200 ر.س", value: "200" },
    { label: "200 - 500 ر.س", value: "500" },
    { label: "500 - 1000 ر.س", value: "1000" },
    { label: "1000 - 2000 ر.س", value: "2000" },
    { label: "أكثر من 2000 ر.س", value: "10000" }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden" dir="rtl">
      <Header />
      
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-background to-violet-500/5" />
          
          {/* Animated Gradient Orbs */}
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-rose-500/20 to-pink-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              x: [0, -40, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-violet-500/20 to-purple-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full blur-3xl"
          />
          
          {/* Floating Design Elements */}
          <FloatingElement delay={0} duration={6} className="absolute top-32 right-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl shadow-rose-500/30">
              <Palette className="w-8 h-8 text-white" />
            </div>
          </FloatingElement>
          
          <FloatingElement delay={1} duration={7} className="absolute top-48 left-32">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Brush className="w-7 h-7 text-white" />
            </div>
          </FloatingElement>
          
          <FloatingElement delay={2} duration={5} className="absolute bottom-40 right-40">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
          </FloatingElement>
          
          <FloatingElement delay={0.5} duration={8} className="absolute bottom-60 left-20">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
          </FloatingElement>
        </div>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="mb-6 px-5 py-2.5 text-sm bg-gradient-to-r from-rose-500/20 to-violet-500/20 text-rose-500 border-rose-500/30 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
                  استوديو التصميم الإبداعي
                </Badge>
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-l from-rose-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                  حوّل أفكارك
                </span>
                <br />
                <span className="text-foreground">إلى تصاميم استثنائية</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                نظام ذكي يساعدك على اختيار التصميم المثالي لمشروعك. 
                اكتشف أكثر من <span className="text-rose-500 font-semibold">50 خدمة تصميم</span> في 6 فئات متنوعة.
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-center p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-rose-500/30 transition-all"
                  >
                    <stat.icon className="w-5 h-5 mx-auto mb-2 text-rose-500" />
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-l from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 shadow-xl shadow-rose-500/25"
                  onClick={() => document.getElementById('smart-system')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Wand2 className="w-5 h-5" />
                  جرّب النظام الذكي
                </Button>
                <Link to="/dashboard/design-services">
                  <Button size="lg" variant="outline" className="gap-2 border-rose-500/30 hover:bg-rose-500/10">
                    <Eye className="w-5 h-5" />
                    استعرض الخدمات
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right - Interactive 3D Cards */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full h-[500px]">
                {/* Main Card */}
                <Card3D className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-72 h-80 rounded-3xl bg-gradient-to-br from-rose-500 to-violet-600 p-1 shadow-2xl shadow-rose-500/30">
                    <div className="w-full h-full rounded-3xl bg-background/95 backdrop-blur-xl p-6 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center mb-6">
                        <Crown className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">تصميم احترافي</h3>
                      <p className="text-muted-foreground text-sm mb-4">نصمم لك هوية بصرية تميز علامتك التجارية</p>
                      <div className="flex gap-2">
                        <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">شعارات</Badge>
                        <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20">هوية</Badge>
                      </div>
                    </div>
                  </div>
                </Card3D>

                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-10 right-10"
                >
                  <div className="w-40 h-48 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 p-0.5 shadow-xl">
                    <div className="w-full h-full rounded-2xl bg-background/90 p-4 flex flex-col items-center justify-center">
                      <Share2 className="w-8 h-8 text-pink-500 mb-3" />
                      <span className="text-sm font-semibold">سوشيال ميديا</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute bottom-10 left-10"
                >
                  <div className="w-36 h-44 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 shadow-xl">
                    <div className="w-full h-full rounded-2xl bg-background/90 p-4 flex flex-col items-center justify-center">
                      <Video className="w-8 h-8 text-violet-500 mb-3" />
                      <span className="text-sm font-semibold">موشن جرافيك</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="absolute top-20 left-0"
                >
                  <div className="w-32 h-36 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-xl">
                    <div className="w-full h-full rounded-xl bg-background/90 p-3 flex flex-col items-center justify-center">
                      <Package className="w-6 h-6 text-amber-500 mb-2" />
                      <span className="text-xs font-semibold">تغليف</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MAIN CATEGORIES SECTION ===== */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-2 bg-rose-500/10 text-rose-500 border-rose-500/20">
              <Layers className="w-4 h-4 ml-2" />
              الأقسام الرئيسية
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              اكتشف عالم <span className="text-rose-500">التصميم الإبداعي</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              6 أقسام متخصصة تغطي جميع احتياجاتك التصميمية بأعلى معايير الجودة والإبداع
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={cn(
                    "group cursor-pointer h-full transition-all duration-500 hover:shadow-2xl border-2",
                    selectedCategory === category.id 
                      ? "border-rose-500 shadow-xl shadow-rose-500/20" 
                      : "border-transparent hover:border-rose-500/30"
                  )}
                  onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
                >
                  <CardHeader>
                    <div className={cn(
                      "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                      category.color
                    )}>
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl flex items-center justify-between">
                      {category.name}
                      <Badge variant="secondary" className="text-xs">
                        {category.services.length} خدمة
                      </Badge>
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence>
                      {selectedCategory === category.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pt-4 border-t border-border"
                        >
                          {category.services.map((service, sIndex) => (
                            <motion.div
                              key={sIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: sIndex * 0.05 }}
                              className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <service.icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{service.name}</span>
                                {service.popular && (
                                  <Badge className="text-[10px] px-2 py-0 bg-rose-500/10 text-rose-500 border-rose-500/20">
                                    شائع
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-rose-500">
                                {service.price} ر.س
                              </span>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-1">
                        {category.services.slice(0, 3).map((_, i) => (
                          <div key={i} className={cn(
                            "w-2 h-2 rounded-full",
                            `bg-gradient-to-r ${category.color}`
                          )} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-rose-500 transition-colors flex items-center gap-1">
                        {selectedCategory === category.id ? "إخفاء" : "عرض الخدمات"}
                        <ArrowLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SMART RECOMMENDATION SYSTEM ===== */}
      <section id="smart-system" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-rose-500/5 to-background" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-2 bg-violet-500/10 text-violet-500 border-violet-500/20">
              <Lightbulb className="w-4 h-4 ml-2" />
              النظام الذكي
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              اكتشف <span className="text-violet-500">التصميم المناسب</span> لك
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              نظامنا الذكي يساعدك على اختيار أفضل الخدمات بناءً على احتياجاتك وميزانيتك
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    activeStep >= index 
                      ? "bg-gradient-to-r from-rose-500 to-violet-600 text-white" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <span className={cn(
                    "text-xs mt-2 hidden md:block",
                    activeStep >= index ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={(activeStep + 1) * 25} className="h-2" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Selection Panel */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MousePointer2 className="w-5 h-5 text-rose-500" />
                اختر تفضيلاتك
              </h3>
              
              {/* Category Selection */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">1. اختر فئة التصميم</Label>
                <div className="grid grid-cols-2 gap-3">
                  {mainCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setActiveStep(1);
                      }}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-right",
                        selectedCategory === category.id 
                          ? "border-rose-500 bg-rose-500/10" 
                          : "border-border hover:border-rose-500/30"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                        category.color
                      )}>
                        <category.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Selection */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">2. حدد ميزانيتك التقريبية</Label>
                <div className="flex flex-wrap gap-2">
                  {budgetRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => {
                        setSelectedBudget(range.value);
                        setActiveStep(2);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-full border-2 text-sm transition-all",
                        selectedBudget === range.value 
                          ? "border-violet-500 bg-violet-500/10 text-violet-500" 
                          : "border-border hover:border-violet-500/30"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Get Recommendations Button */}
              <Button 
                className="w-full gap-2 bg-gradient-to-l from-rose-500 to-violet-600"
                disabled={!selectedCategory || !selectedBudget}
                onClick={() => {
                  setShowRecommendations(true);
                  setActiveStep(3);
                }}
              >
                <Sparkles className="w-4 h-4" />
                احصل على التوصيات
              </Button>
            </Card>

            {/* Recommendations Panel */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-violet-500" />
                توصياتنا لك
              </h3>
              
              <AnimatePresence mode="wait">
                {showRecommendations && recommendations.length > 0 ? (
                  <motion.div
                    key="recommendations"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-3"
                  >
                    {recommendations.map((service, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-l from-muted/50 to-transparent border border-border hover:border-violet-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <service.icon className="w-6 h-6 text-rose-500" />
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {service.name}
                              {service.popular && (
                                <Badge className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                                  <Star className="w-3 h-3 ml-1" />
                                  مقترح
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              يناسب ميزانيتك
                            </span>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-lg text-rose-500">{service.price}</div>
                          <div className="text-xs text-muted-foreground">ريال سعودي</div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <Button 
                      className="w-full mt-4 gap-2"
                      variant="outline"
                      onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <Send className="w-4 h-4" />
                      اطلب هذه الخدمات
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-64 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Wand2 className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-2">اختر تفضيلاتك</h4>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      حدد فئة التصميم وميزانيتك للحصول على توصيات مخصصة لك
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== INDUSTRIES SECTION ===== */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <Briefcase className="w-4 h-4 ml-2" />
              القطاعات
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              نصمم لـ <span className="text-emerald-500">جميع القطاعات</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              خبرة واسعة في تصميم هويات بصرية ومحتوى إبداعي لمختلف المجالات
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl bg-background border border-border hover:border-emerald-500/30 hover:shadow-lg transition-all text-center cursor-pointer group"
              >
                <div className={cn(
                  "w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  industry.color
                )}>
                  <industry.icon className="w-7 h-7" />
                </div>
                <span className="text-sm font-medium">{industry.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REQUEST FORM SECTION ===== */}
      <section id="request-form" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-rose-500/5 to-transparent" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-2 bg-rose-500/10 text-rose-500 border-rose-500/20">
              <Send className="w-4 h-4 ml-2" />
              ابدأ الآن
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              اطلب <span className="text-rose-500">تصميمك</span> المخصص
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              أرسل لنا تفاصيل مشروعك وسنتواصل معك خلال 24 ساعة
            </p>
          </motion.div>

          <Card className="max-w-3xl mx-auto p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="أدخل اسمك"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="example@email.com"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الجوال *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="05xxxxxxxx"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">اسم الشركة/المشروع</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="اختياري"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="projectType">نوع التصميم المطلوب *</Label>
                  <Input
                    id="projectType"
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    required
                    placeholder="مثال: شعار، هوية بصرية، سوشيال ميديا"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">الميزانية التقريبية</Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="مثال: 500 - 1000 ريال"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">تفاصيل المشروع *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="اكتب وصفاً تفصيلياً لمشروعك، ما تريد تحقيقه، والأسلوب المفضل..."
                  rows={5}
                  className="resize-none"
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full gap-2 h-14 text-lg bg-gradient-to-l from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    أرسل طلبك الآن
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-rose-600 via-purple-600 to-violet-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
            
            <div className="relative p-12 md:p-16 text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="w-20 h-20 mx-auto mb-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Sparkles className="w-10 h-10" />
              </motion.div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                هل أنت جاهز لتميز علامتك التجارية؟
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                انضم إلى أكثر من 500 عميل وثقوا بنا لتصميم هوياتهم البصرية ومحتواهم الإبداعي
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/auth">
                  <Button size="lg" className="gap-2 bg-white text-purple-600 hover:bg-white/90">
                    <Rocket className="w-5 h-5" />
                    ابدأ الآن مجاناً
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10">
                    <MessageSquare className="w-5 h-5" />
                    تواصل معنا
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DesignServices;
