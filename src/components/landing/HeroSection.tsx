import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Zap, Shield, Star, CheckCircle2, Rocket, TrendingUp, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const features = [
    { icon: Shield, text: "ضمان الجودة" },
    { icon: Zap, text: "تنفيذ سريع" },
    { icon: TrendingUp, text: "نتائج مضمونة" },
  ];

  const stats = [
    { value: "+50K", label: "عميل راضٍ", icon: Users },
    { value: "+100K", label: "طلب مكتمل", icon: Award },
    { value: "4.9", label: "تقييم العملاء", icon: Star },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/20" dir="rtl">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-20 right-10 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-primary/30 rounded-full blur-[100px] sm:blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.08, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-20 left-10 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-primary/20 rounded-full blur-[80px] sm:blur-[100px]"
        />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "50px 50px"
          }}
        />
        
        {/* Floating Shapes */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-[8%] w-14 h-14 bg-primary/5 rounded-2xl border border-primary/10 backdrop-blur-sm hidden lg:block"
        />
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute top-1/3 right-[6%] w-10 h-10 bg-primary/5 rounded-xl border border-primary/10 backdrop-blur-sm hidden lg:block"
        />
        <motion.div
          animate={{ y: [0, 10, 0], x: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute bottom-1/3 left-[12%] w-8 h-8 bg-primary/5 rounded-lg border border-primary/10 backdrop-blur-sm hidden lg:block"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8"
          >
            <Rocket className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">منصة الخدمات الرقمية الأولى في المملكة</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5 sm:mb-6"
          >
            نحول أفكارك إلى
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="block mt-2 bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
            >
              نجاح رقمي حقيقي
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2"
          >
            خدمات تسويقية وبرمجية وتصميمية احترافية تساعدك على تحقيق أهدافك 
            بأعلى معايير الجودة وأفضل الأسعار
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-8 sm:mb-10"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.08 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-14 px-4"
          >
            <Button 
              asChild 
              size="lg" 
              className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25"
            >
              <Link to="/auth" className="flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                ابدأ الآن مجاناً
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 rounded-xl border-2 border-border/60 hover:bg-muted/50 transition-all duration-300"
            >
              <Link to="/our-services">استكشف الخدمات</Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="grid grid-cols-3 gap-3 sm:gap-6 max-w-xl mx-auto mb-10 sm:mb-12"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.08 }}
                className="group"
              >
                <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-card/40 border border-border/40 backdrop-blur-sm transition-all duration-300 hover:bg-card/60 hover:border-primary/20">
                  <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="pt-6 sm:pt-8 border-t border-border/30"
          >
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                <span>دفع آمن 100%</span>
              </div>
              <div className="w-px h-3 sm:h-4 bg-border/50 hidden sm:block" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>دعم فني 24/7</span>
              </div>
              <div className="w-px h-3 sm:h-4 bg-border/50 hidden sm:block" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>ضمان استرداد المال</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-muted/30 to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
