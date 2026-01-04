import { useState, useRef, useEffect } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
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
  Award,
  Rocket,
  Crown,
  TrendingUp,
  Play,
  Eye,
  Layers,
  Globe,
  Smartphone,
  Video,
  BadgeCheck,
  Headphones,
  Lock,
  Target,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Service categories data
const services = [
  {
    id: "design",
    name: "خدمات التصميم الإبداعي",
    nameEn: "Creative Design Studio",
    description: "تصاميم مبتكرة وهوية بصرية متكاملة تعكس رؤية علامتك التجارية",
    longDescription: "فريق من المصممين المحترفين يقدمون تصاميم شعارات، هويات بصرية، منشورات سوشيال ميديا، تصاميم UI/UX، وكل ما تحتاجه لإبراز علامتك التجارية.",
    icon: Palette,
    gradient: "from-rose-500 via-pink-500 to-violet-500",
    bgGradient: "from-rose-500/20 via-pink-500/10 to-transparent",
    features: [
      { icon: Eye, text: "تصاميم فريدة 100%" },
      { icon: Clock, text: "تسليم سريع" },
      { icon: Layers, text: "ملفات مصدرية كاملة" },
      { icon: Award, text: "مصممين محترفين" },
    ],
    subServices: [
      { name: "الهوية البصرية", icon: Crown },
      { name: "شعارات ولوجو", icon: Sparkles },
      { name: "سوشيال ميديا", icon: Globe },
      { name: "موشن جرافيك", icon: Video },
    ],
    stats: { value: "10K+", label: "تصميم مُنجز" },
    link: "/dashboard/design-services",
  },
  {
    id: "development",
    name: "خدمات البرمجة والتطوير",
    nameEn: "Development & Tech Solutions",
    description: "تطوير مواقع وتطبيقات بأحدث التقنيات العالمية",
    longDescription: "متخصصون في تطوير مواقع الويب، تطبيقات الموبايل، متاجر إلكترونية، وحلول برمجية مخصصة باستخدام أحدث التقنيات.",
    icon: Code,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    bgGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    features: [
      { icon: Lock, text: "أمان عالي المستوى" },
      { icon: Rocket, text: "أداء فائق السرعة" },
      { icon: Code, text: "كود نظيف وموثق" },
      { icon: Headphones, text: "دعم فني مستمر" },
    ],
    subServices: [
      { name: "مواقع ويب", icon: Globe },
      { name: "تطبيقات جوال", icon: Smartphone },
      { name: "متاجر إلكترونية", icon: TrendingUp },
      { name: "أنظمة متكاملة", icon: Layers },
    ],
    stats: { value: "500+", label: "مشروع ناجح" },
    link: "/dashboard/dev-services",
  },
];

// Why choose us data
const whyChooseUs = [
  { icon: Zap, title: "تنفيذ سريع", description: "نبدأ العمل فور استلام الطلب", color: "text-amber-500" },
  { icon: Shield, title: "ضمان الجودة", description: "استرداد كامل مضمون", color: "text-emerald-500" },
  { icon: Users, title: "فريق محترف", description: "خبراء في مجالاتهم", color: "text-blue-500" },
  { icon: Headphones, title: "دعم متواصل", description: "متاحين على مدار الساعة", color: "text-violet-500" },
];

// Floating Particles
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-primary/20"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [-20, 20, -20],
          x: [-10, 10, -10],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5 + Math.random() * 5,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

// Service Card Component
const ServiceCard = ({ 
  service, 
  index, 
  isInView 
}: { 
  service: typeof services[0]; 
  index: number; 
  isInView: boolean;
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = service.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.2, type: "spring" }}
      className="relative"
    >
      <Card className="relative overflow-hidden border-2 border-border/50 bg-card/90 backdrop-blur-xl hover:border-primary/30 transition-all duration-500 rounded-2xl sm:rounded-3xl hover:shadow-2xl hover:shadow-primary/10 group">
        {/* Background Glow */}
        <div className={cn(
          "absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700",
          service.bgGradient.replace('from-', 'bg-').split(' ')[0]
        )} />
        
        {/* Animated Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }}
        >
          <div className={cn("h-full bg-gradient-to-r", service.gradient)} />
        </div>

        <CardContent className="relative z-10 p-6 sm:p-8 md:p-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6">
            <motion.div 
              className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl shrink-0",
                service.gradient
              )}
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>

            <div className="flex-1">
              <motion.span 
                className={cn(
                  "text-sm sm:text-base font-medium bg-gradient-to-r bg-clip-text text-transparent",
                  service.gradient
                )}
              >
                {service.nameEn}
              </motion.span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 group-hover:text-primary transition-colors">
                {service.name}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2 leading-relaxed">
                {service.longDescription}
              </p>
            </div>

            {/* Stats Badge */}
            <motion.div 
              className="hidden md:flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/50 border border-border/50"
              whileHover={{ scale: 1.05 }}
            >
              <span className={cn(
                "text-2xl sm:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                service.gradient
              )}>
                {service.stats.value}
              </span>
              <span className="text-xs text-muted-foreground">{service.stats.label}</span>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            {service.features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border/30 hover:border-primary/30 transition-all"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0",
                  service.gradient
                )}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Sub Services */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/50">
                  {service.subServices.map((sub, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/20 text-center hover:bg-secondary/40 transition-colors cursor-pointer"
                    >
                      <sub.icon className={cn("w-6 h-6", service.gradient.includes('rose') ? 'text-rose-500' : 'text-emerald-500')} />
                      <span className="text-xs sm:text-sm font-medium">{sub.name}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className={cn(
                "flex-1 gap-2 text-white border-0 px-6 py-6 text-base shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r",
                service.gradient
              )}
              onClick={() => navigate(service.link)}
            >
              <Sparkles className="w-5 h-5" />
              استكشف الخدمات
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 px-6 py-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span>{isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const OurServices = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const heroInView = useInView(heroRef, { once: true });
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-20 sm:pt-24 pb-16 sm:pb-24 overflow-hidden"
      >
        <FloatingParticles />
        
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <motion.div
            className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="container px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="font-semibold text-primary text-sm">خدماتنا المتميزة</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              خدمات احترافية{" "}
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
                لنجاح أعمالك
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              نقدم لك أفضل خدمات التصميم والبرمجة بأيدي فريق من الخبراء المحترفين
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Button size="lg" className="px-8 py-6 text-base gap-2 shadow-lg" onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}>
                <Rocket className="w-5 h-5" />
                استكشف الخدمات
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-base gap-2" asChild>
                <a href="/auth?mode=signup">
                  سجل الآن مجاناً
                  <ArrowLeft className="w-5 h-5" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16 bg-secondary/30">
        <div className="container px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-4 sm:p-6"
              >
                <motion.div 
                  className={cn("w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center", item.color)}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </motion.div>
                <h3 className="font-bold text-sm sm:text-base mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section ref={containerRef} className="py-16 sm:py-24">
        <div className="container px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              اختر الخدمة المناسبة لك
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              نوفر لك مجموعة متكاملة من الخدمات لتلبية جميع احتياجاتك
            </p>
          </motion.div>

          <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <ServiceCard 
                key={service.id}
                service={service}
                index={index}
                isInView={isInView}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <BadgeCheck className="w-4 h-4 text-success" />
              <span className="font-semibold text-success text-sm">ابدأ الآن</span>
            </motion.div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              جاهز للبدء في مشروعك؟
            </h2>
            <p className="text-muted-foreground mb-8 text-base sm:text-lg">
              سجل الآن واحصل على أفضل الخدمات بأسعار منافسة
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="px-8 py-6 text-base gap-2 shadow-lg" asChild>
                <a href="/auth?mode=signup">
                  <Sparkles className="w-5 h-5" />
                  سجل مجاناً الآن
                </a>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-base gap-2" asChild>
                <a href="/contact">
                  <MessageCircle className="w-5 h-5" />
                  تواصل معنا
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OurServices;
