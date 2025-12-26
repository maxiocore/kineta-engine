import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { 
  Target, 
  Users, 
  Award, 
  Lightbulb,
  Heart,
  Rocket,
  MapPin,
  Sparkles,
  TrendingUp,
  Globe,
  Zap,
  Shield,
  Star,
  ArrowLeft,
  Play,
  CheckCircle2,
  Building2,
  Clock,
  Trophy,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const values = [
  {
    icon: Target,
    title: "التميز",
    description: "نسعى دائماً لتقديم أعلى مستويات الجودة في كل ما نقدمه",
    gradient: "from-cyan-500 to-blue-500",
    delay: 0,
  },
  {
    icon: Heart,
    title: "الشغف",
    description: "نحب ما نعمل ونعمل ما نحب، التسويق الرقمي هو شغفنا",
    gradient: "from-pink-500 to-rose-500",
    delay: 0.1,
  },
  {
    icon: Lightbulb,
    title: "الابتكار",
    description: "نبحث دائماً عن حلول إبداعية ومبتكرة لتحقيق أهداف عملائنا",
    gradient: "from-amber-500 to-orange-500",
    delay: 0.2,
  },
  {
    icon: Users,
    title: "الشراكة",
    description: "نؤمن بأن نجاح عملائنا هو نجاحنا، لذا نعمل كشركاء حقيقيين",
    gradient: "from-emerald-500 to-teal-500",
    delay: 0.3,
  },
];

const milestones = [
  { year: "2019", title: "البداية", description: "تأسيس الشركة برؤية طموحة", icon: Rocket },
  { year: "2020", title: "النمو", description: "توسيع الفريق وإضافة خدمات جديدة", icon: TrendingUp },
  { year: "2021", title: "التوسع", description: "افتتاح فروع جديدة في المنطقة", icon: Globe },
  { year: "2022", title: "الريادة", description: "الحصول على جوائز التميز", icon: Trophy },
  { year: "2023", title: "الابتكار", description: "إطلاق منتجات رقمية مبتكرة", icon: Lightbulb },
  { year: "2024", title: "المستقبل", description: "نحو آفاق جديدة من النجاح", icon: Star },
];

const features = [
  { icon: Shield, title: "موثوقية عالية", description: "خدمات موثوقة ومضمونة 100%" },
  { icon: Clock, title: "دعم على مدار الساعة", description: "فريق دعم متاح 24/7" },
  { icon: Zap, title: "سرعة في التنفيذ", description: "نتائج سريعة وفعالة" },
  { icon: CheckCircle2, title: "جودة مضمونة", description: "ضمان جودة الخدمات" },
];

const achievements = [
  { value: 500, suffix: "+", label: "عميل راضي", icon: Users },
  { value: 1000, suffix: "+", label: "مشروع منجز", icon: Rocket },
  { value: 50, suffix: "+", label: "جائزة وشهادة", icon: Award },
  { value: 5, suffix: "+", label: "سنوات خبرة", icon: TrendingUp },
];

const AnimatedCounter = ({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent"
    >
      {inView && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {value.toLocaleString('ar-SA')}{suffix}
        </motion.span>
      )}
    </motion.span>
  );
};

const FloatingShape = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      delay,
    }}
  />
);

const About = () => {
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const timelineRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const [activeTimeline, setActiveTimeline] = useState(0);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      <main className="pt-20">
        {/* Hero Section - Immersive */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            {/* Gradient Orbs */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.6, 0.4],
                x: [0, 50, 0],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/30 to-blue-600/20 rounded-full blur-[150px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
                x: [0, -50, 0],
              }}
              transition={{ duration: 12, repeat: Infinity }}
              className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-primary/30 to-accent/20 rounded-full blur-[130px]"
            />
            
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(to left, hsl(var(--foreground)) 1px, transparent 1px),
                  linear-gradient(to top, hsl(var(--foreground)) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
              }}
            />

            {/* Floating Particles */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-primary/50 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -40, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}

            {/* Decorative Shapes */}
            <FloatingShape 
              className="absolute top-[15%] right-[10%] w-20 h-20 border-2 border-primary/20 rounded-2xl rotate-12"
              delay={0}
            />
            <FloatingShape 
              className="absolute bottom-[20%] left-[15%] w-16 h-16 bg-accent/10 rounded-full"
              delay={1}
            />
            <FloatingShape 
              className="absolute top-[40%] left-[5%] w-12 h-12 border border-accent/30 rounded-lg rotate-45"
              delay={2}
            />
          </div>
          
          <motion.div 
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="container px-4 relative z-10"
          >
            <div className="text-center max-w-5xl mx-auto">
              {/* Badge */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-l from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-xl mb-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
                <span className="text-sm font-semibold text-primary">تعرف علينا أكثر</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
              </motion.div>
              
              {/* Main Title */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
              >
                <span className="block mb-2">نحن</span>
                <span className="relative inline-block">
                  <motion.span 
                    className="bg-gradient-to-l from-cyan-400 via-primary to-accent bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    style={{ backgroundSize: "200% 200%" }}
                  >
                    MaxioCore
                  </motion.span>
                  <motion.div
                    className="absolute -bottom-3 left-0 w-full h-2 bg-gradient-to-l from-primary to-accent rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                  />
                </span>
              </motion.h1>
              
              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
              >
                شركة رائدة في مجال التسويق الرقمي والحلول الإبداعية، نساعد الشركات على 
                <span className="text-primary font-semibold"> النمو</span> و
                <span className="text-accent font-semibold"> التميز</span> في العالم الرقمي
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Link to="/contact">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/30 px-8 py-6 text-lg gap-3 rounded-2xl">
                      <MessageCircle className="w-5 h-5" />
                      تواصل معنا
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/our-services">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="lg" className="px-8 py-6 text-lg gap-3 rounded-2xl border-2 backdrop-blur-sm">
                      اكتشف خدماتنا
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Scroll Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex flex-col items-center gap-2 text-muted-foreground"
                >
                  <span className="text-xs">اكتشف المزيد</span>
                  <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1">
                    <motion.div
                      animate={{ y: [0, 16, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-3 bg-primary rounded-full"
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Stats Section - Floating Cards */}
        <section ref={statsRef} className="py-24 relative">
          <div className="container px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {achievements.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 50, rotateX: -15 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, type: "spring" }}
                  whileHover={{ y: -10, scale: 1.03 }}
                  className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-br from-card via-card/80 to-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 text-center group overflow-hidden shadow-xl"
                >
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <motion.div
                    className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 shadow-lg"
                  >
                    <item.icon className="w-8 h-8 text-primary" />
                  </motion.div>
                  
                  {/* Counter */}
                  <AnimatedCounter value={item.value} suffix={item.suffix} inView={statsInView} />
                  <p className="text-sm md:text-base text-muted-foreground mt-3 font-medium">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 relative">
          <div className="container px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-secondary/50 border border-border/50 hover:border-primary/50 transition-all duration-300 text-center group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <feature.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section ref={timelineRef} className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-secondary/50" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">رحلتنا</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                مسيرة <span className="text-primary">نجاح</span> متواصلة
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                من البداية المتواضعة إلى الريادة في السوق
              </p>
            </motion.div>

            {/* Interactive Timeline */}
            <div className="relative max-w-5xl mx-auto">
              {/* Timeline Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-l from-primary/20 via-primary to-primary/20 rounded-full hidden md:block" />
              
              {/* Timeline Items */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setActiveTimeline(index)}
                    className={`relative cursor-pointer group ${activeTimeline === index ? 'z-10' : ''}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 ${
                        activeTimeline === index
                          ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-primary shadow-lg shadow-primary/20'
                          : 'bg-card/80 border-border/50 hover:border-primary/50'
                      }`}
                    >
                      {/* Year Circle */}
                      <motion.div
                        animate={activeTimeline === index ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                          activeTimeline === index
                            ? 'bg-gradient-to-br from-primary to-accent shadow-lg'
                            : 'bg-secondary'
                        }`}
                      >
                        <milestone.icon className={`w-6 h-6 ${activeTimeline === index ? 'text-white' : 'text-primary'}`} />
                      </motion.div>
                      
                      <div className="text-center">
                        <span className={`text-2xl font-bold ${activeTimeline === index ? 'text-primary' : ''}`}>
                          {milestone.year}
                        </span>
                        <h4 className="font-semibold mt-2 mb-1">{milestone.title}</h4>
                        <p className="text-xs text-muted-foreground">{milestone.description}</p>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values Section - 3D Cards */}
        <section className="py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">قيمنا</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">ما يميزنا عن الآخرين</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                نؤمن بمجموعة من القيم الأساسية التي توجه عملنا
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 40, rotateY: -10 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: value.delay, type: "spring" }}
                  whileHover={{ y: -15, rotateY: 5, scale: 1.02 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-card via-card/90 to-card/70 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 text-center group overflow-hidden shadow-xl"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Animated Background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-500"
                  />
                  <motion.div
                    className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                    style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                  />
                  
                  {/* Icon Container */}
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mx-auto mb-6 shadow-xl`}
                  >
                    <value.icon className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <h3 className="font-bold text-2xl mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  
                  {/* Decorative Element */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: value.delay + 0.3 }}
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l ${value.gradient} opacity-50`}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section - Split Layout */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
          
          <div className="container px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="order-2 lg:order-1"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
                >
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">قصتنا</span>
                </motion.div>
                
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                  رحلة من{" "}
                  <span className="text-primary">الشغف</span>
                  <br />
                  إلى <span className="text-accent">النجاح</span>
                </h2>
                
                <div className="space-y-6 text-muted-foreground text-lg">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="leading-relaxed"
                  >
                    بدأت رحلتنا في عام 2019 برؤية واضحة: تقديم حلول تسويقية رقمية متميزة للشركات في المملكة العربية السعودية والعالم العربي.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="leading-relaxed"
                  >
                    من فريق صغير مكون من 3 أشخاص، نمونا لنصبح فريقاً من أكثر من 25 متخصصاً في مختلف مجالات التسويق الرقمي والتصميم والبرمجة.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="leading-relaxed"
                  >
                    اليوم، نفخر بخدمة أكثر من 500 عميل وتنفيذ أكثر من 1000 مشروع ناجح، محققين نتائج استثنائية.
                  </motion.p>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-4 mt-10 p-5 rounded-2xl bg-gradient-to-l from-primary/10 to-accent/10 border border-primary/20"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">المقر الرئيسي</p>
                    <p className="text-muted-foreground">الرياض، المملكة العربية السعودية</p>
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Visual Element */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative order-1 lg:order-2"
              >
                <div className="relative aspect-square max-w-lg mx-auto">
                  {/* Rotating Circles */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-6 rounded-full border-2 border-dashed border-accent/30"
                  />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-12 rounded-full border border-primary/20"
                  />
                  
                  {/* Center Content */}
                  <div className="absolute inset-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="text-center"
                    >
                      <span className="text-6xl md:text-7xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                        2019
                      </span>
                      <p className="text-muted-foreground mt-3 font-medium">سنة التأسيس</p>
                    </motion.div>
                  </div>

                  {/* Floating Icons */}
                  {[
                    { icon: Rocket, position: "top-0 right-1/4", delay: 0 },
                    { icon: Star, position: "top-1/4 left-0", delay: 0.5 },
                    { icon: Trophy, position: "bottom-1/4 right-0", delay: 1 },
                    { icon: Target, position: "bottom-0 left-1/4", delay: 1.5 },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className={`absolute ${item.position}`}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: item.delay }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-card border border-border/50 shadow-lg flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30"
              >
                <Rocket className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                مستعد لبدء <span className="text-primary">رحلتك</span>؟
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                انضم إلى أكثر من 500 عميل يثقون بنا لتحقيق أهدافهم الرقمية
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/auth?mode=signup">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/30 px-10 py-7 text-lg gap-3 rounded-2xl">
                      <Sparkles className="w-5 h-5" />
                      ابدأ الآن مجاناً
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/contact">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="lg" className="px-10 py-7 text-lg gap-3 rounded-2xl border-2">
                      <MessageCircle className="w-5 h-5" />
                      تحدث مع خبير
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
