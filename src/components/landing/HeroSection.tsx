import { motion, useInView } from "framer-motion";
import { ArrowLeft, Sparkles, Code2, Palette, Share2, Globe, Zap, Shield, Star, CheckCircle2, Play, TrendingUp, Award, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

const HeroSection = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true, margin: "-50px" });
  const [activeService, setActiveService] = useState(0);

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
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      desc: "استراتيجيات نمو مبتكرة",
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-500/10",
      textColor: "text-cyan-500"
    },
    { 
      icon: Code2, 
      title: "البرمجة والتطوير",
      desc: "حلول تقنية متقدمة",
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-500"
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      desc: "هوية بصرية مميزة",
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/10",
      textColor: "text-violet-500"
    },
    { 
      icon: Globe, 
      title: "خدمات رقمية",
      desc: "حلول شاملة ومتكاملة",
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-500"
    },
  ];

  const stats = [
    { icon: Users, value: `+${bonusUsers}`, label: "عميل سعيد", color: "text-primary" },
    { icon: Rocket, value: `+${bonusOrders}`, label: "طلب منفذ", color: "text-emerald-500" },
    { icon: Star, value: "100%", label: "نسبة الرضا", color: "text-yellow-500" },
    { icon: Globe, value: `+${bonusServices}`, label: "خدمة متاحة", color: "text-blue-500" },
  ];

  const features = [
    { text: "تفعيل فوري", icon: Zap },
    { text: "دعم متواصل", icon: Shield },
    { text: "أسعار تنافسية", icon: Star },
    { text: "جودة مضمونة", icon: CheckCircle2 },
  ];

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12 lg:pt-24 lg:pb-20">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
        
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-0 right-0 w-[800px] h-[800px] opacity-30 dark:opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 60%)",
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] opacity-20 dark:opacity-15"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.25) 0%, transparent 60%)",
          }}
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Floating Particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="container relative z-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8 lg:mb-10"
          >
            <motion.div 
              className="relative group cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="absolute -inset-1 rounded-full bg-gradient-to-l from-primary via-accent to-primary opacity-30 blur-lg group-hover:opacity-50 transition-opacity"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative flex items-center gap-3 px-5 py-2.5 rounded-full bg-background/90 backdrop-blur-xl border border-primary/20 shadow-lg">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="font-semibold text-sm text-foreground">منصة الخدمات الرقمية المتكاملة</span>
                <motion.span
                  className="w-2 h-2 rounded-full bg-success"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
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
            className="text-center mb-6 lg:mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.15] tracking-tight">
              <span className="block mb-2 lg:mb-3">نطور أعمالك بحلول</span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                  رقمية مبتكرة
                </span>
                <motion.svg
                  className="absolute -bottom-2 lg:-bottom-3 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1, delay: 0.6 }}
                >
                  <motion.path
                    d="M2 10C50 3 100 3 150 6C200 9 250 5 298 2"
                    stroke="url(#heroGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.7 }}
                  />
                  <defs>
                    <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="50%" stopColor="hsl(var(--accent))" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 lg:mb-10 leading-relaxed px-4"
          >
            نجمع بين{" "}
            <span className="text-primary font-semibold">التسويق الذكي</span>
            {" "}و{" "}
            <span className="text-emerald-500 font-semibold">التطوير المتقدم</span>
            {" "}و{" "}
            <span className="text-violet-500 font-semibold">التصميم الإبداعي</span>
            {" "}لتحقيق نجاحك الرقمي
          </motion.p>

          {/* Features Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-2 sm:gap-3 mb-10 lg:mb-12 flex-wrap px-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-secondary/60 backdrop-blur-sm border border-border/50 text-sm"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Services Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 max-w-5xl mx-auto mb-10 lg:mb-12"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onHoverStart={() => setActiveService(index)}
                className={`group relative cursor-pointer ${activeService === index ? 'z-10' : ''}`}
              >
                {/* Glow Effect */}
                <motion.div
                  className={`absolute -inset-1 rounded-2xl lg:rounded-3xl bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}
                />
                
                <div className="relative p-4 sm:p-5 lg:p-6 rounded-2xl lg:rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-primary/30 transition-all duration-500 h-full">
                  {/* Icon */}
                  <motion.div 
                    className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br ${service.color} p-2.5 sm:p-3 mb-3 sm:mb-4 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <service.icon className="w-full h-full text-white" />
                  </motion.div>

                  <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {service.desc}
                  </p>

                  {/* Arrow */}
                  <motion.div 
                    className="absolute bottom-4 sm:bottom-5 lg:bottom-6 left-4 sm:left-5 lg:left-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, -4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 lg:mb-16 px-4"
          >
            <Link to="/auth?mode=signup">
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <motion.div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-l from-primary via-accent to-primary opacity-50 blur-lg group-hover:opacity-80 transition-opacity"
                />
                <Button 
                  size="lg" 
                  className="relative bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-2xl hover:shadow-3xl px-6 sm:px-8 py-5 sm:py-6 rounded-2xl text-base sm:text-lg font-bold w-full sm:w-auto"
                >
                  <Zap className="w-5 h-5 ml-2" />
                  ابدأ الآن مجاناً
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>

            <Link to="/our-services">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="outline" 
                  size="lg"
                  className="group border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 px-6 sm:px-8 py-5 sm:py-6 rounded-2xl text-base sm:text-lg font-semibold w-full sm:w-auto"
                >
                  <Play className="w-5 h-5 ml-2 group-hover:text-primary transition-colors" />
                  تصفح الخدمات
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -3 }}
                className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color} opacity-80`} />
                  <span className={`text-xl sm:text-2xl lg:text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.2 }}
            className="flex justify-center items-center gap-4 mt-10 lg:mt-12"
          >
            <div className="flex -space-x-3 rtl:space-x-reverse">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold border-2 border-background shadow-lg"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 + i * 0.1 }}
                >
                  {['أ', 'م', 'س', 'ع'][i - 1]}
                </motion.div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">+500 تقييم إيجابي</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
      >
        <span className="text-xs text-muted-foreground">اكتشف المزيد</span>
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-3 rounded-full bg-primary"
            animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
