import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Sparkles, Code2, Palette, Share2, Rocket, Globe, Zap, Shield, Star, CheckCircle2, TrendingUp, Users, Award, Play, Heart, ChevronDown, MousePointer2, Boxes, Layers3 } from "lucide-react";
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

const AnimatedCounter = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      let start = 0;
      const duration = 2000;
      const increment = value / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, value, hasAnimated]);

  return <div ref={containerRef} className="inline">{prefix}{count.toLocaleString("ar-SA")}{suffix}</div>;
};

const FloatingCard = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, delay, type: "spring", stiffness: 100 }}
    className={className}
  >
    {children}
  </motion.div>
);

const HeroSection = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const { data: stats, isLoading } = useRealStats();

  const services = [
    { icon: Share2, title: "التسويق الرقمي", desc: "نمو رقمي مضمون", color: "from-cyan-500 to-blue-600" },
    { icon: Code2, title: "البرمجة والتطوير", desc: "مواقع وتطبيقات احترافية", color: "from-emerald-500 to-green-600" },
    { icon: Palette, title: "التصميم الإبداعي", desc: "هوية بصرية مميزة", color: "from-violet-500 to-purple-600" },
    { icon: Globe, title: "خدمات رقمية", desc: "حلول متكاملة ومتنوعة", color: "from-amber-500 to-orange-600" },
  ];

  const stats_data = [
    { value: stats?.completedOrders || 1000, suffix: "+", label: "مشروع منجز", icon: Award, color: "text-primary" },
    { value: stats?.totalUsers || 500, suffix: "+", label: "عميل سعيد", icon: Users, color: "text-emerald-500" },
    { value: stats?.satisfactionRate || 98, suffix: "%", label: "نسبة الرضا", icon: TrendingUp, color: "text-violet-500" },
  ];

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden" dir="rtl">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        
        {/* Animated Mesh Gradient */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.3), transparent),
              radial-gradient(ellipse 60% 40% at 100% 50%, hsl(var(--accent) / 0.2), transparent),
              radial-gradient(ellipse 60% 40% at 0% 50%, hsl(var(--primary) / 0.2), transparent)
            `,
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating Orbs */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.4), transparent)",
            right: "-15%",
            top: "-10%",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--accent) / 0.3), transparent)",
            left: "-10%",
            bottom: "10%",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      {/* Main Content */}
      <motion.div style={{ y, opacity }} className="relative z-10">
        <div className="container px-4 pt-32 pb-20">
          <div className="max-w-7xl mx-auto">
            
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-10"
            >
              <motion.div 
                className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-l from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-xl cursor-pointer overflow-hidden"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-l from-primary/20 to-accent/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
                <span className="relative text-sm font-medium bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text">
                  منصة MaxioCore للخدمات الرقمية المتكاملة
                </span>
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-success"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>

            {/* Hero Headline */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight">
                <motion.span 
                  className="block mb-4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  نحوّل رؤيتك إلى
                </motion.span>
                <motion.span 
                  className="relative inline-block"
                  initial={{ opacity: 0, x: 50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <span className="relative z-10 bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                    نجاح رقمي
                  </span>
                  <motion.svg
                    className="absolute -bottom-2 right-0 w-full h-4"
                    viewBox="0 0 200 20"
                    initial={{ pathLength: 0 }}
                    animate={isInView ? { pathLength: 1 } : {}}
                    transition={{ duration: 1, delay: 0.6 }}
                  >
                    <motion.path
                      d="M0 15 Q50 0, 100 15 T200 15"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </motion.span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              شريكك الاستراتيجي في التحول الرقمي - نقدم حلولاً متكاملة في التسويق والبرمجة والتصميم
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
            >
              <Link to="/auth?mode=signup">
                <motion.div 
                  whileHover={{ scale: 1.03, y: -2 }} 
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-l from-primary to-accent rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                  <Button 
                    size="lg" 
                    className="relative px-10 py-7 text-lg font-bold rounded-2xl bg-gradient-to-l from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-2xl"
                  >
                    <span className="flex items-center gap-3">
                      ابدأ مشروعك الآن
                      <motion.div
                        animate={{ x: [-3, 3, -3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </motion.div>
                    </span>
                  </Button>
                </motion.div>
              </Link>
              <Link to="/our-services">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="px-10 py-7 text-lg font-semibold rounded-2xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 backdrop-blur-sm"
                  >
                    <span className="flex items-center gap-3">
                      <Play className="w-5 h-5" />
                      اكتشف خدماتنا
                    </span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Services Grid - Modern Cards */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-20"
            >
              {services.map((service, index) => (
                <FloatingCard key={service.title} delay={0.7 + index * 0.1}>
                  <motion.div
                    className="group relative h-full p-6 md:p-8 rounded-3xl bg-card/50 border border-border/50 backdrop-blur-xl overflow-hidden cursor-pointer"
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Hover Gradient */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    />
                    
                    {/* Icon */}
                    <motion.div 
                      className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${service.color} mb-5 shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <service.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </motion.div>
                    
                    <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      {service.desc}
                    </p>

                    {/* Arrow */}
                    <motion.div
                      className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: 10 }}
                      whileHover={{ x: 0 }}
                    >
                      <ArrowLeft className="w-5 h-5 text-primary" />
                    </motion.div>
                  </motion.div>
                </FloatingCard>
              ))}
            </motion.div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="relative"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-accent/5 rounded-[2rem] blur-2xl" />
              
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 p-8 md:p-10 rounded-[2rem] bg-card/30 border border-border/50 backdrop-blur-xl">
                {stats_data.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="relative group text-center p-6"
                  >
                    {/* Hover Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    
                    <div className="relative">
                      <motion.div
                        className="inline-flex p-3 rounded-xl bg-primary/10 mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </motion.div>
                      
                      <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>
                        {isLoading ? (
                          <motion.div
                            className="inline-block w-20 h-10 rounded-lg bg-muted/50"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        ) : (
                          <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                        )}
                      </div>
                      <div className="text-muted-foreground font-medium">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex justify-center mt-16"
            >
              <motion.div
                className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-sm">اكتشف المزيد</span>
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
