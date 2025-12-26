import { motion, useInView } from "framer-motion";
import { ArrowLeft, Sparkles, Code2, Palette, Share2, Rocket, Globe, Zap, Shield, Star, CheckCircle2, TrendingUp, Users, Award, Play, Heart, Target, Cpu, Layers } from "lucide-react";
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

const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
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

  return <div ref={containerRef} className="inline">{count.toLocaleString("ar-SA")}{suffix}</div>;
};

const HeroSection = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true });
  const [activeService, setActiveService] = useState(0);
  const { data: stats, isLoading } = useRealStats();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      desc: "استراتيجيات تسويقية متطورة لتعزيز حضورك الرقمي",
      features: ["إدارة الحملات", "تحسين محركات البحث", "التسويق عبر السوشال ميديا"],
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30"
    },
    { 
      icon: Code2, 
      title: "البرمجة والتطوير",
      desc: "تطوير مواقع وتطبيقات بأحدث التقنيات",
      features: ["مواقع متجاوبة", "تطبيقات ذكية", "أنظمة إدارة"],
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30"
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      desc: "تصاميم احترافية تعكس هويتك المميزة",
      features: ["هوية بصرية", "تصميم UI/UX", "محتوى بصري"],
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/30"
    },
    { 
      icon: Globe, 
      title: "الخدمات الرقمية",
      desc: "حلول شاملة لجميع احتياجاتك الرقمية",
      features: ["استضافة سحابية", "نطاقات وايميلات", "أمان وحماية"],
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30"
    },
  ];

  const benefits = [
    { icon: Zap, text: "تفعيل فوري", desc: "خدماتنا تبدأ فوراً" },
    { icon: Shield, text: "ضمان الجودة", desc: "نتائج مضمونة" },
    { icon: Heart, text: "دعم متواصل", desc: "24/7 على مدار الساعة" },
    { icon: Star, text: "أسعار منافسة", desc: "أفضل قيمة مقابل السعر" },
  ];

  const floatingIcons = [
    { Icon: Target, delay: 0, x: "10%", y: "20%" },
    { Icon: Cpu, delay: 0.5, x: "85%", y: "15%" },
    { Icon: Layers, delay: 1, x: "5%", y: "70%" },
    { Icon: TrendingUp, delay: 1.5, x: "90%", y: "65%" },
    { Icon: Award, delay: 2, x: "75%", y: "85%" },
    { Icon: Users, delay: 2.5, x: "15%", y: "85%" },
  ];

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0">
        {/* Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-bl from-background via-background to-primary/5" />
        
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            right: "-10%",
            top: "-20%",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))",
            left: "-10%",
            bottom: "-20%",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Floating Icons */}
        {floatingIcons.map(({ Icon, delay, x, y }, index) => (
          <motion.div
            key={index}
            className="absolute text-primary/10"
            style={{ right: x, top: y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.1, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay,
            }}
          >
            <Icon className="w-12 h-12 md:w-16 md:h-16" />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container px-4 pt-28 pb-20">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-sm font-medium text-foreground">منصة ماكسيو كور للخدمات الرقمية</span>
              <motion.div
                className="w-2 h-2 rounded-full bg-success"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="block mb-2">نحول أفكارك إلى</span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  واقع رقمي
                </span>
                <motion.div
                  className="absolute -bottom-2 right-0 w-full h-1 bg-gradient-to-l from-primary to-accent rounded-full"
                  initial={{ scaleX: 0, originX: 1 }}
                  animate={isInView ? { scaleX: 1 } : {}}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            شريكك الموثوق في التحول الرقمي - من التسويق إلى البرمجة والتصميم
          </motion.p>

          {/* Benefits Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 md:gap-6 mb-14"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <benefit.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{benefit.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Services Interactive Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-14"
          >
            {/* Active Service Display */}
            <motion.div
              key={activeService}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className={`relative p-8 rounded-3xl ${services[activeService].bgColor} border ${services[activeService].borderColor} backdrop-blur-sm overflow-hidden`}
            >
              {/* Background Glow */}
              <div className={`absolute -left-20 -top-20 w-40 h-40 rounded-full bg-gradient-to-br ${services[activeService].color} opacity-20 blur-3xl`} />
              
              <div className="relative z-10">
                <motion.div 
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${services[activeService].color} mb-6`}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  {(() => {
                    const IconComponent = services[activeService].icon;
                    return <IconComponent className="w-8 h-8 text-white" />;
                  })()}
                </motion.div>
                
                <h3 className="text-2xl md:text-3xl font-bold mb-3">{services[activeService].title}</h3>
                <p className="text-muted-foreground mb-6">{services[activeService].desc}</p>
                
                <div className="space-y-3">
                  {services[activeService].features.map((feature, idx) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <span className="font-medium">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Service Selector */}
            <div className="grid grid-cols-2 gap-4">
              {services.map((service, index) => (
                <motion.button
                  key={service.title}
                  onClick={() => setActiveService(index)}
                  className={`relative p-5 rounded-2xl text-right transition-all duration-300 ${
                    activeService === index
                      ? `${service.bgColor} border-2 ${service.borderColor}`
                      : "bg-card/50 border border-border/50 hover:border-primary/30"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeService === index && (
                    <motion.div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.color} opacity-10`}
                      layoutId="activeService"
                    />
                  )}
                  <div className="relative z-10">
                    <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${service.color} mb-3`}>
                      <service.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold mb-1">{service.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{service.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link to="/auth?mode=signup">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  className="relative px-8 py-6 text-lg font-semibold rounded-2xl overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_100%]"
                    animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <span className="relative z-10 flex items-center gap-3 text-primary-foreground">
                    ابدأ الآن مجاناً
                    <Rocket className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                  </span>
                </Button>
              </motion.div>
            </Link>
            <Link to="/our-services">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold rounded-2xl border-2 group"
                >
                  <span className="flex items-center gap-3">
                    <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    استكشف خدماتنا
                  </span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-primary/10 via-transparent to-accent/10 rounded-3xl blur-xl" />
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 rounded-3xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {isLoading ? "..." : <AnimatedCounter value={stats?.completedOrders || 1000} suffix="+" />}
                </div>
                <div className="text-sm text-muted-foreground">طلب مكتمل</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-emerald-500 mb-1">
                  {isLoading ? "..." : <AnimatedCounter value={stats?.totalUsers || 500} suffix="+" />}
                </div>
                <div className="text-sm text-muted-foreground">عميل سعيد</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-violet-500 mb-1">
                  {isLoading ? "..." : <AnimatedCounter value={stats?.satisfactionRate || 98} suffix="%" />}
                </div>
                <div className="text-sm text-muted-foreground">نسبة الرضا</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold text-amber-500 mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">دعم متواصل</div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
