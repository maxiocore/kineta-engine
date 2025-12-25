import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Code2, Palette, Share2, Rocket, Globe, Zap, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredService, setHoveredService] = useState<number | null>(null);

  const services = [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      subtitle: "SMM Panel",
      description: "زيادة متابعين وتفاعل لجميع المنصات",
      gradient: "from-primary to-accent",
      features: ["انستقرام", "تيك توك", "يوتيوب", "تويتر"]
    },
    { 
      icon: Code2, 
      title: "البرمجة والتطوير",
      subtitle: "حلول تقنية",
      description: "مواقع وتطبيقات وأنظمة احترافية",
      gradient: "from-emerald-500 to-teal-500",
      features: ["مواقع ويب", "تطبيقات", "لوحات تحكم", "API"]
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      subtitle: "هوية بصرية",
      description: "شعارات وتصاميم احترافية مميزة",
      gradient: "from-violet-500 to-purple-500",
      features: ["شعارات", "هوية بصرية", "بوسترات", "بنرات"]
    },
  ];

  const stats = [
    { value: "+500", label: "عميل", icon: "👥" },
    { value: "+1000", label: "مشروع", icon: "🎯" },
    { value: "98%", label: "رضا", icon: "⭐" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] rounded-full"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.25) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      <motion.div 
        className="container relative z-10 px-4 py-16 md:py-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <motion.div 
              className="badge-premium"
              whileHover={{ scale: 1.02 }}
            >
              <Sparkles className="w-4 h-4" />
              <span>منصة الخدمات الرقمية المتكاملة</span>
              <motion.span
                className="w-2 h-2 rounded-full bg-success"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              <span className="block mb-2">كل ما تحتاجه لـ</span>
              <span className="relative inline-block">
                <span className="text-gradient">نجاحك الرقمي</span>
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-l from-primary to-accent rounded-full"
                  initial={{ scaleX: 0, originX: 1 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                />
              </span>
              <span className="block mt-2 text-2xl sm:text-3xl md:text-4xl text-muted-foreground font-medium">في مكان واحد</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-center text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            منصة متكاملة تجمع خدمات{" "}
            <span className="text-primary font-semibold">التسويق الرقمي</span>،{" "}
            <span className="text-emerald-500 font-semibold">البرمجة</span>، و
            <span className="text-violet-500 font-semibold">التصميم</span> لتحقيق أهدافك
          </motion.p>

          {/* Service Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mb-12"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                onHoverStart={() => setHoveredService(index)}
                onHoverEnd={() => setHoveredService(null)}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative cursor-pointer"
              >
                <div className={`relative p-5 md:p-6 rounded-2xl border transition-all duration-300 backdrop-blur-sm overflow-hidden ${
                  hoveredService === index 
                    ? 'bg-card border-primary/30 shadow-lg' 
                    : 'bg-card/50 border-border/50 hover:border-border'
                }`}>
                  {/* Glow */}
                  <motion.div
                    className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}
                  />
                  
                  {/* Icon */}
                  <motion.div 
                    className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} p-2.5 mb-4 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <service.icon className="w-full h-full text-white" />
                  </motion.div>

                  <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs text-primary font-medium mb-2">
                    {service.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {service.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Arrow */}
                  <motion.div 
                    className="absolute bottom-5 left-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, -4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowLeft className="w-4 h-4 text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-14"
          >
            <Link to="/auth?mode=signup">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  className="group w-full sm:w-auto px-8 py-6 text-base font-semibold bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-brand hover:shadow-lg transition-all rounded-xl"
                >
                  <Rocket className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  ابدأ الآن مجاناً
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/our-services">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="group w-full sm:w-auto px-8 py-6 text-base font-semibold border-2 hover:border-primary/50 transition-all rounded-xl"
                >
                  <Globe className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  استكشف خدماتنا
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6 md:gap-10"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <span className="text-xl mb-1 block">{stat.icon}</span>
                <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-4 mt-12 text-muted-foreground"
          >
            {[
              { icon: Zap, text: "تفعيل فوري" },
              { icon: Shield, text: "دفع آمن" },
              { icon: Star, text: "دعم 24/7" },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-sm">
                <badge.icon className="w-4 h-4 text-primary" />
                <span>{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
