import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sparkles, Code2, Palette, Share2, Globe, Zap, Shield, Star, 
  CheckCircle2, Play, TrendingUp, Award, Rocket, Users, MousePointer2,
  Layers, Target, BarChart3, MessageCircle, Heart, ThumbsUp, Eye,
  Cpu, Cloud, Lock, Smartphone, Monitor, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

// 3D Floating Icon Component
const FloatingIcon = ({ icon: Icon, className, delay = 0, duration = 4, x = 0, y = 0 }: {
  icon: React.ElementType;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
}) => (
  <motion.div
    className={`absolute ${className}`}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.4, 0.8, 0.4],
      scale: [1, 1.1, 1],
      x: [x, x + 10, x],
      y: [y, y - 15, y],
      rotate: [0, 5, -5, 0]
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <div className="p-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl">
      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
    </div>
  </motion.div>
);

// Interactive Metric Card
const MetricCard = ({ icon: Icon, value, label, color, delay }: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.5, type: "spring" }}
    whileHover={{ y: -8, scale: 1.05 }}
    className="relative group cursor-pointer"
  >
    <motion.div
      className={`absolute -inset-1 rounded-2xl ${color} opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500`}
    />
    <div className="relative p-4 sm:p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-primary/40 transition-all duration-300">
      <motion.div
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${color} flex items-center justify-center mb-3`}
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
      </motion.div>
      <motion.h3
        className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        {value}
      </motion.h3>
      <p className="text-sm text-muted-foreground">{label}</p>
      
      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, transparent 50%)",
        }}
        animate={{
          backgroundPosition: ["200% 0", "-200% 0"],
        }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
      />
    </div>
  </motion.div>
);

// Service Card with 3D Effect
const ServiceCard3D = ({ service, index, isActive, onHover }: {
  service: { icon: React.ElementType; title: string; desc: string; color: string; features: string[] };
  index: number;
  isActive: boolean;
  onHover: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40, rotateX: -15 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ delay: 0.4 + index * 0.1, duration: 0.6, type: "spring" }}
    whileHover={{ y: -12, scale: 1.03, rotateY: 5 }}
    onHoverStart={onHover}
    className={`group relative cursor-pointer perspective-1000 ${isActive ? 'z-20' : 'z-10'}`}
    style={{ transformStyle: "preserve-3d" }}
  >
    {/* Glow Effect */}
    <motion.div
      className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-30 blur-2xl transition-all duration-700`}
      animate={isActive ? { opacity: 0.25 } : { opacity: 0 }}
    />
    
    <div className="relative p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-card/90 backdrop-blur-2xl border border-border/50 group-hover:border-primary/40 transition-all duration-500 h-full overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <service.icon className="w-full h-full" />
      </div>
      
      {/* Icon with 3D effect */}
      <motion.div 
        className={`relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${service.color} p-3 sm:p-4 mb-4 sm:mb-5 shadow-2xl`}
        whileHover={{ scale: 1.15, rotate: 8 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{ transformStyle: "preserve-3d", transform: "translateZ(20px)" }}
      >
        <service.icon className="w-full h-full text-white" />
        <motion.div
          className="absolute inset-0 rounded-2xl bg-white/20"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        />
      </motion.div>

      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
        {service.title}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground mb-4">
        {service.desc}
      </p>
      
      {/* Features */}
      <div className="space-y-2">
        {service.features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 + i * 0.05 }}
            className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
            <span>{feature}</span>
          </motion.div>
        ))}
      </div>

      {/* Hover Arrow */}
      <motion.div 
        className="absolute bottom-5 left-5 opacity-0 group-hover:opacity-100 transition-all duration-300"
        animate={{ x: [0, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="flex items-center gap-1 text-primary text-sm font-medium">
          <span>اكتشف المزيد</span>
          <ArrowLeft className="w-4 h-4" />
        </div>
      </motion.div>
    </div>
  </motion.div>
);

const HeroSection = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true, amount: 0.1 });
  const [activeService, setActiveService] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Dummy counters
  const [bonusUsers, setBonusUsers] = useState(() => Math.floor(Math.random() * (33 - 15 + 1)) + 15 + 500);
  const [bonusOrders, setBonusOrders] = useState(() => Math.floor(Math.random() * (33 - 15 + 1)) + 15 + 1200);
  const [bonusServices, setBonusServices] = useState(() => Math.floor(Math.random() * (50 - 20 + 1)) + 20 + 150);

  useEffect(() => {
    const interval = setInterval(() => {
      setBonusUsers(prev => prev + Math.floor(Math.random() * (33 - 15 + 1)) + 15);
      setBonusOrders(prev => prev + Math.floor(Math.random() * (33 - 15 + 1)) + 15);
      setBonusServices(prev => prev + Math.floor(Math.random() * (50 - 20 + 1)) + 20);
    }, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const services = [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      desc: "استراتيجيات نمو مبتكرة لتعزيز حضورك الرقمي",
      color: "from-cyan-500 to-blue-600",
      features: ["إدارة وسائل التواصل", "حملات إعلانية", "تحليل البيانات"]
    },
    { 
      icon: Code2, 
      title: "البرمجة والتطوير",
      desc: "حلول تقنية متقدمة مصممة خصيصاً لاحتياجاتك",
      color: "from-emerald-500 to-teal-600",
      features: ["تطبيقات الويب", "تطبيقات الجوال", "أنظمة مخصصة"]
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      desc: "هوية بصرية مميزة تعكس قيم علامتك التجارية",
      color: "from-violet-500 to-purple-600",
      features: ["الهوية البصرية", "تصميم UI/UX", "موشن جرافيك"]
    },
    { 
      icon: Globe, 
      title: "خدمات رقمية",
      desc: "حلول شاملة ومتكاملة لكل احتياجاتك الرقمية",
      color: "from-amber-500 to-orange-600",
      features: ["استضافة المواقع", "تحسين SEO", "الأمان السيبراني"]
    },
  ];

  const metrics = [
    { icon: Users, value: `+${bonusUsers}`, label: "عميل سعيد", color: "bg-gradient-to-br from-blue-500 to-cyan-500" },
    { icon: Rocket, value: `+${bonusOrders}`, label: "مشروع منجز", color: "bg-gradient-to-br from-emerald-500 to-teal-500" },
    { icon: Star, value: "100%", label: "نسبة الرضا", color: "bg-gradient-to-br from-amber-500 to-orange-500" },
    { icon: Globe, value: `+${bonusServices}`, label: "خدمة متاحة", color: "bg-gradient-to-br from-violet-500 to-purple-500" },
  ];

  const floatingIcons = [
    { icon: Heart, className: "top-[15%] right-[10%] text-rose-500", delay: 0 },
    { icon: ThumbsUp, className: "top-[25%] left-[8%] text-blue-500", delay: 0.5 },
    { icon: Eye, className: "top-[40%] right-[5%] text-emerald-500", delay: 1 },
    { icon: MessageCircle, className: "bottom-[30%] left-[5%] text-violet-500", delay: 1.5 },
    { icon: BarChart3, className: "top-[60%] right-[8%] text-amber-500", delay: 2 },
    { icon: Target, className: "bottom-[20%] right-[12%] text-cyan-500", delay: 2.5 },
  ];

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" />
        
        {/* Animated Gradient Blobs with Mouse Parallax */}
        <motion.div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] lg:w-[900px] lg:h-[900px] opacity-40 dark:opacity-25"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--accent) / 0.2) 40%, transparent 70%)",
            x: mousePosition.x,
            y: mousePosition.y,
          }}
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 45, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] opacity-30 dark:opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.35) 0%, hsl(var(--primary) / 0.15) 50%, transparent 70%)",
            x: -mousePosition.x * 0.5,
            y: -mousePosition.y * 0.5,
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Center Glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1.5px, transparent 1.5px),
              linear-gradient(90deg, hsl(var(--foreground)) 1.5px, transparent 1.5px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(var(--primary) / ${0.3 + Math.random() * 0.4})`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}

        {/* Floating Interactive Icons */}
        <div className="hidden lg:block">
          {floatingIcons.map((item, i) => (
            <FloatingIcon key={i} {...item} />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="container relative z-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="flex justify-center mb-8 lg:mb-12"
          >
            <motion.div 
              className="relative group cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              {/* Animated Border */}
              <motion.div
                className="absolute -inset-[2px] rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative flex items-center gap-3 px-6 py-3 rounded-full bg-background/95 backdrop-blur-xl shadow-2xl">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
                <span className="font-bold text-sm sm:text-base bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                  منصة الخدمات الرقمية الأولى
                </span>
                <motion.span
                  className="w-2.5 h-2.5 rounded-full bg-success"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Main Headline with 3D Effect */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center mb-8 lg:mb-10"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
              <motion.span 
                className="block mb-3 lg:mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                نحول أفكارك إلى
              </motion.span>
              <motion.span 
                className="relative inline-block"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <span className="relative z-10 bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                  واقع رقمي مذهل
                </span>
                {/* Underline with Animation */}
                <motion.div
                  className="absolute -bottom-2 lg:-bottom-4 left-0 right-0 h-3 lg:h-4 rounded-full bg-gradient-to-l from-primary/30 via-accent/30 to-primary/30 blur-sm"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                />
                <motion.svg
                  className="absolute -bottom-1 lg:-bottom-2 left-0 w-full h-3 lg:h-4"
                  viewBox="0 0 300 12"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                >
                  <motion.path
                    d="M2 8C50 2 100 10 150 5C200 0 250 8 298 3"
                    stroke="url(#heroGradientLine)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="heroGradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="50%" stopColor="hsl(var(--accent))" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-center text-base sm:text-lg lg:text-xl xl:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 lg:mb-14 leading-relaxed px-4"
          >
            نجمع بين{" "}
            <span className="text-primary font-bold">الإبداع</span>
            {" "}و{" "}
            <span className="text-emerald-500 font-bold dark:text-emerald-400">التكنولوجيا</span>
            {" "}و{" "}
            <span className="text-violet-500 font-bold dark:text-violet-400">الاستراتيجية</span>
            {" "}لنصنع حلولاً رقمية استثنائية تتخطى توقعاتك
          </motion.p>

          {/* Services Grid with 3D Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-6xl mx-auto mb-12 lg:mb-16"
          >
            {services.map((service, index) => (
              <ServiceCard3D
                key={service.title}
                service={service}
                index={index}
                isActive={activeService === index}
                onHover={() => setActiveService(index)}
              />
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14 lg:mb-20 px-4"
          >
            <Link to="/auth?mode=signup">
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="relative group"
              >
                <motion.div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-l from-primary via-accent to-primary opacity-60 blur-xl group-hover:opacity-100 transition-opacity"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                />
                <Button 
                  size="lg" 
                  className="relative bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-2xl px-8 sm:px-10 py-6 sm:py-7 rounded-2xl text-lg sm:text-xl font-black w-full sm:w-auto"
                >
                  <Zap className="w-6 h-6 ml-2" />
                  ابدأ مشروعك الآن
                  <ArrowLeft className="w-6 h-6 mr-2 group-hover:-translate-x-2 transition-transform" />
                </Button>
              </motion.div>
            </Link>

            <Link to="/our-services">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="outline" 
                  size="lg"
                  className="group border-2 border-border hover:border-primary/60 hover:bg-primary/10 px-8 sm:px-10 py-6 sm:py-7 rounded-2xl text-lg sm:text-xl font-bold w-full sm:w-auto backdrop-blur-sm"
                >
                  <Play className="w-6 h-6 ml-2 group-hover:text-primary group-hover:scale-110 transition-all" />
                  استكشف خدماتنا
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Metrics Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-5xl mx-auto"
          >
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric.label}
                {...metric}
                delay={1.2 + index * 0.15}
              />
            ))}
          </motion.div>

          {/* Trust Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="flex flex-col items-center gap-6 mt-14 lg:mt-20"
          >
            {/* Trust Avatars */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4 rtl:space-x-reverse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold border-3 border-background shadow-xl"
                    initial={{ opacity: 0, scale: 0, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 1.7 + i * 0.1, type: "spring" }}
                    whileHover={{ y: -5, zIndex: 10 }}
                  >
                    {['أ', 'م', 'س', 'ع', 'ن'][i - 1]}
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.2 }}
                className="flex items-center gap-1"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                ))}
              </motion.div>
            </div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.3 }}
              className="text-muted-foreground text-sm sm:text-base"
            >
              <span className="font-bold text-foreground">+{bonusUsers}</span> عميل يثقون بنا
            </motion.p>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="flex justify-center mt-12 lg:mt-16"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-muted-foreground"
            >
              <span className="text-xs">اكتشف المزيد</span>
              <MousePointer2 className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
