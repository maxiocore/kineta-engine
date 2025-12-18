import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Sparkles, Play, CheckCircle, Star, Zap, Shield, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";
import GlobalServiceSearch from "@/components/GlobalServiceSearch";

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const features = [
    { icon: Shield, text: "أمان متقدم" },
    { icon: Zap, text: "سرعة فائقة" },
    { icon: Clock, text: "دعم 24/7" },
    { icon: Star, text: "نتائج مضمونة" },
  ];

  return (
    <section ref={containerRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" />
        
        {/* Animated Orbs */}
        <motion.div
          className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--success) / 0.08) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div 
        style={{ y, opacity }}
        className="container relative z-10 px-4 pt-32 pb-20"
      >
        <div className="max-w-6xl mx-auto">
          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center mb-10"
          >
            <motion.div 
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-l from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary) / 0.5)" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
              <span className="text-sm font-semibold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                الشريك الأول للتسويق الرقمي في السعودية
              </span>
              <motion.div
                className="w-2 h-2 rounded-full bg-success"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.15] tracking-tight">
              <motion.span 
                className="block mb-2 sm:mb-3"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                نُحوّل أفكارك إلى
              </motion.span>
              <motion.span 
                className="relative inline-block"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <span className="bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient_4s_ease-in-out_infinite]">
                  نجاحات رقمية
                </span>
                <motion.div
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                />
              </motion.span>
            </h1>
          </motion.div>

          {/* Global Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-xl mx-auto mb-8 sm:mb-12 px-4"
          >
            <GlobalServiceSearch />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center items-center mb-10 sm:mb-16 px-4"
          >
            <Link to="/auth?mode=signup" className="w-full sm:w-auto">
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  className="group relative w-full sm:w-auto px-6 sm:px-10 py-5 sm:py-7 text-sm sm:text-lg font-semibold bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    ابدأ رحلتك الآن
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1.5 transition-transform duration-300" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-l from-accent to-primary"
                    initial={{ x: "100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Button>
              </motion.div>
            </Link>
            <Link to="/services" className="w-full sm:w-auto">
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="group w-full sm:w-auto px-6 sm:px-10 py-5 sm:py-7 text-sm sm:text-lg border-2 border-border/50 hover:border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-secondary/50 transition-all duration-300"
                >
                  <Play className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                  استكشف خدماتنا
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Features Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12 sm:mb-20 px-2"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm"
              >
                <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto px-2"
          >
            {[
              { value: "+500", label: "عميل راضي", color: "primary" },
              { value: "+1000", label: "مشروع منجز", color: "accent" },
              { value: "98%", label: "نسبة الرضا", color: "success" },
              { value: "+5", label: "سنوات خبرة", color: "warning" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="group relative"
              >
                <div className="relative text-center p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-secondary/40 border border-border/50 hover:border-primary/40 backdrop-blur-sm transition-all duration-300 overflow-hidden">
                  <motion.div
                    className={`absolute inset-0 bg-${stat.color}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />
                  <motion.p 
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent mb-1 sm:mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-secondary/30 border border-border/30 backdrop-blur-sm">
              <div className="flex -space-x-3 space-x-reverse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.3 + i * 0.1 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-foreground/80">{String.fromCharCode(64 + i)}</span>
                  </motion.div>
                ))}
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5 + i * 0.05, type: "spring" }}
                  >
                    <Star className="w-5 h-5 fill-warning text-warning" />
                  </motion.div>
                ))}
              </div>
              <span className="text-sm font-medium text-muted-foreground">موثوق من +500 شركة</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-border/50 flex items-start justify-center p-1"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        </motion.div>
      </motion.div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent" />

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
