import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { UserPlus, Settings, Rocket, TrendingUp, ChevronDown, Sparkles, CheckCircle } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "إنشاء حساب",
    description: "سجّل في ثوانٍ واحصل على وصول فوري لجميع خدماتنا المتميزة",
    features: ["تسجيل سريع", "تفعيل فوري", "واجهة سهلة"],
    color: "from-cyan-500 to-blue-600",
    shadowColor: "shadow-cyan-500/20",
    glowColor: "bg-cyan-500",
  },
  {
    icon: Settings,
    number: "02",
    title: "اختر الخدمة",
    description: "تصفح خدماتنا المتنوعة واختر ما يناسب احتياجاتك ومتطلباتك",
    features: ["تنوع كبير", "أسعار تنافسية", "وصف واضح"],
    color: "from-violet-500 to-purple-600",
    shadowColor: "shadow-violet-500/20",
    glowColor: "bg-violet-500",
  },
  {
    icon: Rocket,
    number: "03",
    title: "أطلق طلبك",
    description: "أكمل طلبك بخطوات بسيطة وانتظر البدء الفوري في التنفيذ",
    features: ["طلب سهل", "دفع آمن", "تنفيذ سريع"],
    color: "from-emerald-500 to-teal-600",
    shadowColor: "shadow-emerald-500/20",
    glowColor: "bg-emerald-500",
  },
  {
    icon: TrendingUp,
    number: "04",
    title: "تابع النتائج",
    description: "راقب تقدم طلبك في الوقت الفعلي واستمتع بالنتائج المذهلة",
    features: ["تتبع مباشر", "تقارير فورية", "دعم متواصل"],
    color: "from-amber-500 to-orange-600",
    shadowColor: "shadow-amber-500/20",
    glowColor: "bg-amber-500",
  },
];

const AnimatedProgress = ({ isInView, delay }: { isInView: boolean; delay: number }) => {
  const progress = useMotionValue(0);
  const width = useTransform(progress, [0, 100], ["0%", "100%"]);
  
  useEffect(() => {
    if (isInView) {
      animate(progress, 100, { duration: 1.5, delay, ease: "easeOut" });
    }
  }, [isInView, progress, delay]);

  return (
    <motion.div className="h-full rounded-full bg-gradient-to-l from-primary to-accent" style={{ width }} />
  );
};

const StepCard = ({ step, index, isInView }: { step: typeof steps[0]; index: number; isInView: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card */}
      <motion.div
        className={`relative h-full p-5 sm:p-6 md:p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 overflow-hidden transition-colors duration-500 hover:border-primary/30 ${step.shadowColor}`}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        style={{
          boxShadow: isHovered ? `0 25px 50px -12px hsl(var(--primary) / 0.15)` : undefined,
        }}
      >
        {/* Animated Glow Background */}
        <motion.div
          className={`absolute -top-32 -right-32 w-64 h-64 ${step.glowColor} rounded-full blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-700`}
        />
        
        {/* Progress Line at Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary/50 overflow-hidden rounded-t-3xl">
          <AnimatedProgress isInView={isInView} delay={0.3 + index * 0.15} />
        </div>

        {/* Step Number Badge */}
        <motion.div
          className="absolute top-4 left-4 sm:top-6 sm:left-6"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 + index * 0.15, type: "spring" }}
        >
          <span className={`text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-20 group-hover:opacity-40 transition-opacity`}>
            {step.number}
          </span>
        </motion.div>

        {/* Icon */}
        <motion.div
          className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-gradient-to-br ${step.color} p-3 sm:p-4 mb-5 sm:mb-6 shadow-xl`}
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <step.icon className="w-full h-full text-white" />
          
          {/* Pulse Ring */}
          <motion.div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color}`}
            animate={isHovered ? {
              scale: [1, 1.4],
              opacity: [0.5, 0],
            } : {}}
            transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
          />
        </motion.div>

        {/* Content */}
        <div className="relative z-10">
          <motion.h3 
            className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors"
          >
            {step.title}
          </motion.h3>
          
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
            {step.description}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {step.features.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 + i * 0.1 }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary/60 text-xs sm:text-sm"
              >
                <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hover Gradient Border */}
        <motion.div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`}
        />
      </motion.div>

      {/* Connector Arrow - Desktop */}
      {index < steps.length - 1 && (
        <motion.div
          className="hidden lg:flex absolute -left-8 xl:-left-12 top-1/2 -translate-y-1/2 items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 + index * 0.15 }}
        >
          <motion.div
            className="w-8 xl:w-12 h-0.5 bg-gradient-to-l from-primary/50 to-transparent"
          />
          <motion.div
            animate={{ x: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-3 h-3 rotate-45 border-l-2 border-b-2 border-primary/50 -ml-1"
          />
        </motion.div>
      )}
    </motion.div>
  );
};

const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <section ref={containerRef} className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 right-0 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 w-[250px] sm:w-[350px] md:w-[500px] h-[250px] sm:h-[350px] md:h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/30"
            style={{
              top: `${20 + i * 15}%`,
              right: `${10 + i * 12}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-primary">كيف نعمل</span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            خطوات بسيطة نحو{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                النجاح
              </span>
              <motion.div
                className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            ابدأ رحلتك معنا في دقائق مع عملية مبسطة وسريعة
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} isInView={isInView} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-col items-center mt-12 sm:mt-16 md:mt-20"
        >
          {/* Scroll Indicator */}
          <motion.div
            className="flex flex-col items-center gap-2 sm:gap-3 text-muted-foreground"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs sm:text-sm">اكتشف المزيد</span>
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
