import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { ArrowLeft, Sparkles, Code2, Palette, Share2, Rocket, Globe, Zap, Shield, Star, Play, CheckCircle2, TrendingUp, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useRealStats = () => {
  return useQuery({
    queryKey: ["hero-real-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_stats");
      
      if (error) throw error;
      
      const stats = data as {
        total_orders: number;
        completed_orders: number;
        total_users: number;
        total_services: number;
        total_deposits: number;
      };
      
      const satisfactionRate = stats.total_orders > 0 
        ? Math.min(98, Math.round((stats.completed_orders / stats.total_orders) * 100)) 
        : 98;
      
      return {
        totalUsers: stats.total_users || 0,
        completedOrders: stats.completed_orders || 0,
        satisfactionRate,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeFeature, setActiveFeature] = useState(0);
  const { data: stats, isLoading } = useRealStats();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - rect.width / 2) / 50;
        const y = (e.clientY - rect.top - rect.height / 2) / 50;
        mouseX.set(x);
        mouseY.set(y);
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      desc: "نمو رقمي مضمون",
      color: "from-cyan-500 via-blue-500 to-indigo-500",
      glow: "cyan"
    },
    { 
      icon: Code2, 
      title: "البرمجة والتطوير",
      desc: "مواقع وتطبيقات احترافية",
      color: "from-emerald-500 via-green-500 to-teal-500",
      glow: "emerald"
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      desc: "هوية بصرية مميزة",
      color: "from-violet-500 via-purple-500 to-fuchsia-500",
      glow: "violet"
    },
    { 
      icon: Globe, 
      title: "خدمات رقمية",
      desc: "حلول متكاملة ومتنوعة",
      color: "from-amber-500 via-orange-500 to-red-500",
      glow: "amber"
    },
  ];

  const features = [
    { text: "تفعيل فوري", icon: Zap },
    { text: "دعم على مدار الساعة", icon: Shield },
    { text: "أسعار تنافسية", icon: Star },
    { text: "جودة مضمونة", icon: CheckCircle2 },
  ];

  const floatingElements = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 8 + 4,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <section ref={containerRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden" dir="rtl">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-bl from-background via-background to-secondary/20" />
        
        {/* Animated Mesh Gradient */}
        <motion.div
          className="absolute inset-0 opacity-60 dark:opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 50% at 80% 40%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 20% 20%, hsl(var(--accent) / 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 50% 80% at 50% 80%, hsl(var(--primary) / 0.1) 0%, transparent 50%)
            `,
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Floating Particles */}
        {floatingElements.map((el) => (
          <motion.div
            key={el.id}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: el.size,
              height: el.size,
              right: `${el.x}%`,
              top: `${el.y}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Interactive Cursor Glow */}
        <motion.div
          className="pointer-events-none fixed w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 50%)",
            left: mousePosition.x - 300,
            top: mousePosition.y - 300,
            filter: "blur(40px)",
          }}
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Hero Content */}
      <motion.div 
        ref={heroRef}
        className="container relative z-10 px-4 pt-24 pb-16"
        style={{ y }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-10"
          >
            <motion.div 
              className="relative group cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-20 blur-lg group-hover:opacity-40 transition-opacity"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <div className="relative flex items-center gap-3 px-6 py-3 rounded-full bg-background/80 backdrop-blur-xl border border-primary/20 flex-row-reverse">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
                <span className="font-semibold text-sm">منصة الخدمات الرقمية الأولى في السعودية</span>
                <motion.span
                  className="w-2 h-2 rounded-full bg-success"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight">
              <motion.span 
                className="block mb-4"
                initial={{ opacity: 0, x: 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                حلول رقمية
              </motion.span>
              <motion.span 
                className="relative inline-block"
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <span className="relative z-10 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  متكاملة
                </span>
                <motion.svg
                  className="absolute -bottom-4 right-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <motion.path
                    d="M298 10C248 3 198 3 148 6C98 9 48 5 2 2"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="100%" y1="0%" x2="0%" y2="0%">
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
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            نجمع بين قوة{" "}
            <span className="text-primary font-semibold">التسويق الذكي</span>
            {" "}و{" "}
            <span className="text-emerald-500 font-semibold">البرمجة المتقدمة</span>
            {" "}و{" "}
            <span className="text-violet-500 font-semibold">التصميم الإبداعي</span>
            {" "}لتحقيق نجاحك الرقمي
          </motion.p>

          {/* Animated Features Carousel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-3 mb-12 flex-wrap"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                  activeFeature === index
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary/30 border-border/30 text-muted-foreground"
                }`}
                animate={{
                  scale: activeFeature === index ? 1.05 : 1,
                }}
              >
                <feature.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Services Cards - 3D Hover Effect */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto mb-14"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -10, rotateX: 5, rotateY: -5 }}
                style={{ transformStyle: "preserve-3d" }}
                className="group relative cursor-pointer perspective-1000"
              >
                <motion.div
                  className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-30 blur-2xl transition-all duration-500`}
                />
                <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 group-hover:border-primary/30 transition-all duration-500 overflow-hidden">
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: "linear-gradient(45deg, transparent 30%, hsl(var(--primary) / 0.05) 50%, transparent 70%)",
                    }}
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  />
                  
                  {/* Icon */}
                  <motion.div 
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${service.color} p-2 sm:p-3 md:p-4 mb-3 sm:mb-4 md:mb-6 shadow-xl`}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <service.icon className="w-full h-full text-white" />
                  </motion.div>

                  <h3 className="text-sm sm:text-base md:text-xl font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                    {service.desc}
                  </p>

                  {/* Arrow */}
                  <motion.div 
                    className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 opacity-0 group-hover:opacity-100 transition-all hidden sm:block"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-primary rotate-180" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 xs:gap-4 justify-center items-center mb-12 xs:mb-14 sm:mb-16 px-4 flex-row-reverse"
          >
            <Link to="/auth?mode=signup">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  className="group relative px-6 xs:px-8 sm:px-10 py-5 xs:py-6 sm:py-7 text-sm xs:text-base sm:text-lg font-semibold overflow-hidden rounded-xl xs:rounded-2xl w-full sm:w-auto"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]"
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2 xs:gap-3 text-primary-foreground flex-row-reverse">
                    ابدأ الآن مجاناً
                    <Rocket className="w-4 h-4 xs:w-5 xs:h-5 group-hover:-rotate-12 transition-transform" />
                  </span>
                </Button>
              </motion.div>
            </Link>
            <Link to="/our-services">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="group px-6 xs:px-8 sm:px-10 py-5 xs:py-6 sm:py-7 text-sm xs:text-base sm:text-lg font-semibold border-2 rounded-xl xs:rounded-2xl bg-background/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/50 transition-all w-full sm:w-auto gap-2 flex-row-reverse"
                >
                  شاهد كيف نعمل
                  <Play className="w-4 h-4 xs:w-5 xs:h-5 group-hover:scale-110 transition-transform" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-6 xs:gap-8 md:gap-16"
          >
            {[
              { value: stats?.totalUsers || 0, suffix: "+", label: "عميل سعيد", icon: Users, color: "text-primary" },
              { value: stats?.completedOrders || 0, suffix: "+", label: "مشروع ناجح", icon: Award, color: "text-emerald-500" },
              { value: stats?.satisfactionRate || 98, suffix: "%", label: "معدل الرضا", icon: TrendingUp, color: "text-violet-500" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center group"
              >
                <div className="flex items-center justify-center gap-1.5 xs:gap-2 mb-1 xs:mb-2">
                  <stat.icon className={`w-5 h-5 xs:w-6 xs:h-6 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                  <span className={`text-2xl xs:text-3xl md:text-4xl font-bold ${stat.color}`}>
                    {isLoading ? (
                      <span className="inline-block w-12 h-8 bg-muted animate-pulse rounded" />
                    ) : (
                      <>
                        {stat.value.toLocaleString()}{stat.suffix}
                      </>
                    )}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs xs:text-sm">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          className="w-8 h-14 rounded-full border-2 border-primary/30 flex justify-center pt-3"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-2 h-3 rounded-full bg-primary"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s linear infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
