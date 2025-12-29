import { motion } from "framer-motion";
import { ArrowLeft, Zap, Shield, CheckCircle2, Rocket, TrendingUp, Users, Award, Star, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const features = [
    { icon: Shield, text: "حماية وأمان كامل" },
    { icon: Zap, text: "تنفيذ فوري" },
    { icon: Globe, text: "خدمة عالمية" },
  ];

  const stats = [
    { value: "50,000+", label: "عميل نشط", icon: Users },
    { value: "100,000+", label: "مشروع منجز", icon: Award },
    { value: "99.9%", label: "نسبة الرضا", icon: Star },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background" dir="rtl">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary Gradient Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-primary/40 to-primary/10 rounded-full blur-[120px]"
        />
        
        {/* Secondary Gradient Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-primary/30 to-transparent rounded-full blur-[100px]"
        />

        {/* Subtle Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.02 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "80px 80px"
          }}
        />

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[5%] w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 backdrop-blur-xl hidden lg:flex items-center justify-center"
        >
          <Rocket className="w-6 h-6 text-primary/40" />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[30%] right-[8%] w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 backdrop-blur-xl hidden lg:flex items-center justify-center"
        >
          <TrendingUp className="w-5 h-5 text-primary/40" />
        </motion.div>

        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[25%] left-[10%] w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 backdrop-blur-xl hidden lg:flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-primary/40" />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-24 pb-16 sm:pt-28 sm:pb-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/15 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-semibold text-primary tracking-wide">الشريك الرقمي الموثوق للشركات الرائدة</span>
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6"
          >
            <span className="block">نُمكّن الشركات من</span>
            <span className="block mt-3">
              <span className="relative">
                <span className="bg-gradient-to-l from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  التحول الرقمي الشامل
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-l from-primary to-primary/50 rounded-full origin-right"
                />
              </span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed font-light"
          >
            منصة متكاملة تقدم حلولاً رقمية مبتكرة للتسويق والتطوير والتصميم،
            <span className="text-foreground font-medium"> مصممة خصيصاً لتحقيق أهداف أعمالك</span>
          </motion.p>

          {/* Features Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-10"
          >
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/15">
                    <IconComponent className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">{feature.text}</span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto text-base px-8 py-7 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 font-semibold"
              >
                <Link to="/auth" className="flex items-center gap-3">
                  <Zap className="w-5 h-5" />
                  <span>ابدأ تجربتك المجانية</span>
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-base px-8 py-7 rounded-2xl border-2 border-border hover:bg-muted/50 transition-all duration-300 font-medium"
              >
                <Link to="/our-services">استعرض الخدمات</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mb-12"
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group cursor-default"
                >
                  <div className="p-4 sm:p-6 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.9 + index * 0.1, type: "spring" }}
                      className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center"
                    >
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </motion.div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="pt-8 border-t border-border/40"
          >
            <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wider">موثوق من قبل</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 transition-colors hover:text-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-medium">معاملات مشفرة</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border/60" />
              <div className="flex items-center gap-2 transition-colors hover:text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-medium">حماية البيانات</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border/60" />
              <div className="flex items-center gap-2 transition-colors hover:text-foreground">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="font-medium">دعم متميز على مدار الساعة</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-muted/40 via-muted/20 to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
