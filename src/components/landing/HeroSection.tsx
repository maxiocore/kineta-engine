import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Play, Shield, Zap, Globe, Users, Award, Star, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const stats = [
    { value: "50K+", label: "عميل نشط" },
    { value: "100K+", label: "مشروع منجز" },
    { value: "99.9%", label: "نسبة الرضا" },
    { value: "24/7", label: "دعم فني" },
  ];

  const trustedBy = [
    "شركات التقنية",
    "المتاجر الإلكترونية", 
    "الوكالات الإعلانية",
    "رواد الأعمال"
  ];

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-background" 
      dir="rtl"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />
        
        {/* Animated Orbs */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.08, 0.12, 0.08]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[120px]"
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />

        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
      </div>

      <motion.div 
        style={{ y, opacity }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32 pb-20 lg:pt-40 lg:pb-32"
      >
        <div className="max-w-6xl mx-auto">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-foreground">+500 شركة تثق بنا هذا الشهر</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="text-center">
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-6"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05]">
                <span className="block text-foreground">حلول رقمية</span>
                <span className="block mt-2 sm:mt-3">
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-l from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                      تصنع الفارق
                    </span>
                    <motion.svg
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                      className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-3 sm:h-4"
                      viewBox="0 0 200 12"
                      fill="none"
                    >
                      <motion.path
                        d="M2 8C50 2 150 2 198 8"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                      />
                    </motion.svg>
                  </span>
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed px-4"
            >
              نساعد الشركات على النمو والتوسع من خلال خدمات التسويق الرقمي 
              والتطوير والتصميم بمعايير عالمية
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg rounded-2xl bg-foreground text-background hover:bg-foreground/90 shadow-2xl shadow-foreground/10 font-semibold group"
                >
                  <Link to="/auth" className="flex items-center gap-3">
                    <span>ابدأ مجاناً</span>
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg rounded-2xl border-2 hover:bg-muted/50 font-medium group"
                >
                  <Link to="/our-services" className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-primary" />
                    <span>شاهد كيف نعمل</span>
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-16"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="relative group"
                >
                  <div className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm transition-all duration-500 group-hover:bg-card group-hover:border-primary/20 group-hover:shadow-xl group-hover:shadow-primary/5">
                    <motion.div 
                      className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-1"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.1, type: "spring" }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="relative"
            >
              {/* Divider */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-gradient-to-l from-border to-transparent" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">موثوق من قبل</span>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* Trust Tags */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
                {trustedBy.map((item, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-muted/50 border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-default"
                  >
                    {item}
                  </motion.span>
                ))}
              </div>

              {/* Features */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.3 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>بدون رسوم خفية</span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Shield className="w-4 h-4 text-primary" />
                  <span>ضمان الجودة</span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>تنفيذ فوري</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
      >
        <span className="text-xs text-muted-foreground font-medium">اكتشف المزيد</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5"
        >
          <motion.div 
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
