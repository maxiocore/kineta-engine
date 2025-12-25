import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Sparkles, Play, Shield, Zap, Clock, Star, Code2, Palette, Share2, Rocket, Globe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeService, setActiveService] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const services = [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      subtitle: "خدمات السوشيال ميديا",
      description: "زيادة متابعين، تفاعل، مشاهدات لجميع منصات التواصل",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      features: ["انستقرام", "تيك توك", "يوتيوب", "تويتر"]
    },
    { 
      icon: Code2, 
      title: "البرمجة والتطوير",
      subtitle: "حلول تقنية متكاملة",
      description: "مواقع، تطبيقات، أنظمة إدارة، وحلول برمجية احترافية",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-500/10",
      features: ["مواقع ويب", "تطبيقات", "لوحات تحكم", "API"]
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      subtitle: "هوية بصرية مميزة",
      description: "شعارات، هوية بصرية، تصاميم سوشيال ميديا احترافية",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      features: ["شعارات", "هوية بصرية", "بوسترات", "بنرات"]
    },
  ];

  const stats = [
    { value: "+500", label: "عميل راضي", icon: "👥" },
    { value: "+1000", label: "مشروع منجز", icon: "🎯" },
    { value: "98%", label: "نسبة الرضا", icon: "⭐" },
    { value: "+5", label: "سنوات خبرة", icon: "🏆" },
  ];

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
        
        {/* Animated Mesh Gradient */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 80%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-[5%] right-[5%] w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.18, 0.1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[5%] w-[350px] sm:w-[450px] md:w-[600px] h-[350px] sm:h-[450px] md:h-[600px] rounded-full"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.08, 0.15, 0.08],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating Particles */}
        <div className="hidden sm:block">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 90}%`,
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                background: i % 3 === 0 
                  ? "hsl(var(--primary) / 0.4)" 
                  : i % 3 === 1 
                    ? "hsl(var(--accent) / 0.4)"
                    : "hsl(var(--warning) / 0.4)",
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0.2, 0.7, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      </div>

      <motion.div 
        style={{ y, opacity }}
        className="container relative z-10 px-4 pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-20"
      >
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex justify-center mb-6 sm:mb-8"
          >
            <motion.div 
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 rounded-full bg-gradient-to-l from-primary/15 via-accent/10 to-primary/15 border border-primary/25 backdrop-blur-sm"
              whileHover={{ scale: 1.03, borderColor: "hsl(var(--primary) / 0.5)" }}
              animate={{ boxShadow: ["0 0 20px hsl(var(--primary) / 0.1)", "0 0 40px hsl(var(--primary) / 0.2)", "0 0 20px hsl(var(--primary) / 0.1)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </motion.div>
              <span className="text-xs sm:text-sm font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                منصة الخدمات الرقمية المتكاملة
              </span>
              <motion.div
                className="w-2 h-2 rounded-full bg-success"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.25] tracking-tight px-2">
              <motion.span 
                className="block mb-2 sm:mb-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                كل ما تحتاجه لـ
              </motion.span>
              <motion.div 
                className="relative inline-block"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <span className="bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient_5s_ease-in-out_infinite]">
                  نجاحك الرقمي
                </span>
                <motion.div
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-l from-primary via-accent to-primary rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                />
              </motion.div>
              <motion.span 
                className="block mt-2 sm:mt-3 text-xl sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground font-medium"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                في مكان واحد
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 px-4 leading-relaxed"
          >
            منصة متكاملة تجمع خدمات <span className="text-primary font-semibold">التسويق الرقمي</span>، 
            <span className="text-emerald-500 font-semibold"> البرمجة والتطوير</span>، 
            و<span className="text-purple-500 font-semibold">التصميم الإبداعي</span> لتحقيق أهدافك
          </motion.p>

          {/* Interactive Service Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-10 sm:mb-12 px-2"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onHoverStart={() => setActiveService(index)}
                className={`group relative cursor-pointer`}
              >
                <div className={`relative p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-500 backdrop-blur-xl overflow-hidden ${
                  activeService === index 
                    ? 'bg-gradient-to-br ' + service.color + '/10 border-primary/40 shadow-xl shadow-primary/10' 
                    : 'bg-background/60 border-border/50 hover:border-primary/30'
                }`}>
                  {/* Glow Effect */}
                  <motion.div
                    className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}
                  />
                  
                  {/* Icon */}
                  <motion.div 
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${service.color} p-3 mb-4 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <service.icon className="w-full h-full text-white" />
                  </motion.div>

                  <h3 className="text-lg sm:text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-primary/80 font-medium mb-2">
                    {service.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  {/* Features Tags */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {service.features.map((feature, i) => (
                      <motion.span
                        key={feature}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9 + index * 0.1 + i * 0.05 }}
                        className={`text-[10px] sm:text-xs px-2 py-1 rounded-full ${service.bgColor} border border-current/10 font-medium`}
                      >
                        {feature}
                      </motion.span>
                    ))}
                  </div>

                  {/* Arrow */}
                  <motion.div 
                    className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowLeft className="w-5 h-5 text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-10 sm:mb-14 px-4"
          >
            <Link to="/auth?mode=signup" className="w-full sm:w-auto">
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }} 
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Button 
                  size="lg" 
                  className="group w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg font-bold bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_auto] text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 rounded-xl sm:rounded-2xl animate-[gradient_5s_ease-in-out_infinite]"
                >
                  <Rocket className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  ابدأ الآن مجاناً
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/our-services" className="w-full sm:w-auto">
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }} 
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="group w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg font-semibold border-2 border-border/50 hover:border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-secondary/50 transition-all duration-300 rounded-xl sm:rounded-2xl"
                >
                  <Globe className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  استكشف خدماتنا
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto px-2"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative"
              >
                <div className="relative text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-secondary/40 to-secondary/20 border border-border/40 hover:border-primary/40 backdrop-blur-sm transition-all duration-500 overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <span className="text-xl sm:text-2xl mb-2 block">{stat.icon}</span>
                  <motion.p 
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent mb-1"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Coming Soon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="flex justify-center mt-10 sm:mt-14"
          >
            <motion.div 
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-l from-warning/10 to-warning/5 border border-warning/30 backdrop-blur-sm"
              animate={{ 
                boxShadow: ["0 0 20px hsl(var(--warning) / 0.1)", "0 0 30px hsl(var(--warning) / 0.2)", "0 0 20px hsl(var(--warning) / 0.1)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="text-xl"
              >
                🚀
              </motion.span>
              <span className="text-sm sm:text-base font-semibold text-warning">
                قريباً... المزيد من الأقسام والخدمات الجديدة!
              </span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-1.5"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        </motion.div>
      </motion.div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
