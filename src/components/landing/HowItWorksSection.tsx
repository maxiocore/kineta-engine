import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { UserPlus, Settings, Rocket, TrendingUp, Sparkles, CheckCircle, ArrowLeft, Play } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "إنشاء حساب",
    description: "سجّل في ثوانٍ واحصل على وصول فوري لجميع خدماتنا",
    features: ["تسجيل سريع", "تفعيل فوري", "واجهة سهلة"],
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    iconBg: "bg-cyan-500",
  },
  {
    icon: Settings,
    number: "02",
    title: "اختر الخدمة",
    description: "تصفح خدماتنا المتنوعة واختر ما يناسب احتياجاتك",
    features: ["تنوع كبير", "أسعار تنافسية", "وصف واضح"],
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    iconBg: "bg-violet-500",
  },
  {
    icon: Rocket,
    number: "03",
    title: "أطلق طلبك",
    description: "أكمل طلبك بخطوات بسيطة وانتظر البدء الفوري",
    features: ["طلب سهل", "دفع آمن", "تنفيذ سريع"],
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    iconBg: "bg-emerald-500",
  },
  {
    icon: TrendingUp,
    number: "04",
    title: "تابع النتائج",
    description: "راقب تقدم طلبك في الوقت الفعلي واستمتع بالنتائج",
    features: ["تتبع مباشر", "تقارير فورية", "دعم متواصل"],
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    iconBg: "bg-amber-500",
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

const MobileStepCard = ({ step, index, isInView, isActive, onClick }: { 
  step: typeof steps[0]; 
  index: number; 
  isInView: boolean;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-300 ${isActive ? 'scale-100' : 'scale-95 opacity-70'}`}
    >
      <div className={`relative p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
        isActive 
          ? `${step.bgColor} ${step.borderColor} shadow-lg` 
          : 'bg-card/50 border-border/30'
      }`}>
        {/* Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary/30 overflow-hidden rounded-t-2xl">
          {isActive && <AnimatedProgress isInView={isInView} delay={0.2} />}
        </div>

        <div className="flex items-start gap-3">
          {/* Icon */}
          <motion.div
            className={`relative w-12 h-12 rounded-xl ${step.iconBg} p-2.5 shadow-lg flex-shrink-0`}
            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <step.icon className="w-full h-full text-white" />
            {isActive && (
              <motion.div
                className={`absolute inset-0 rounded-xl ${step.iconBg}`}
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                الخطوة {step.number}
              </span>
            </div>
            <h3 className="text-base font-bold mb-1">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {step.description}
            </p>

            {/* Features - Only show when active */}
            {isActive && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-wrap gap-1.5 mt-3"
              >
                {step.features.map((feature, i) => (
                  <motion.span
                    key={feature}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/60 text-[10px]"
                  >
                    <CheckCircle className="w-2.5 h-2.5 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </motion.span>
                ))}
              </motion.div>
            )}
          </div>

          {/* Step Number */}
          <span className={`text-2xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-30`}>
            {step.number}
          </span>
        </div>
      </div>

      {/* Connector Line */}
      {index < steps.length - 1 && (
        <div className="flex justify-center py-1">
          <div className={`w-0.5 h-4 rounded-full transition-colors duration-300 ${
            isActive ? 'bg-primary/50' : 'bg-border/30'
          }`} />
        </div>
      )}
    </motion.div>
  );
};

const DesktopStepCard = ({ step, index, isInView }: { step: typeof steps[0]; index: number; isInView: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className={`relative h-full p-6 lg:p-7 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 overflow-hidden transition-all duration-500 hover:border-primary/40`}
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        style={{
          boxShadow: isHovered ? `0 20px 40px -12px hsl(var(--primary) / 0.2)` : undefined,
        }}
      >
        {/* Glow Background */}
        <motion.div
          className={`absolute -top-24 -right-24 w-48 h-48 ${step.iconBg} rounded-full blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-700`}
        />
        
        {/* Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary/40 overflow-hidden rounded-t-2xl">
          <AnimatedProgress isInView={isInView} delay={0.3 + index * 0.12} />
        </div>

        {/* Step Number */}
        <motion.div
          className="absolute top-4 left-4"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 + index * 0.12, type: "spring" }}
        >
          <span className={`text-5xl lg:text-6xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-20 group-hover:opacity-40 transition-opacity`}>
            {step.number}
          </span>
        </motion.div>

        {/* Icon */}
        <motion.div
          className={`relative w-14 h-14 lg:w-16 lg:h-16 rounded-xl ${step.iconBg} p-3 lg:p-3.5 mb-5 shadow-xl`}
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <step.icon className="w-full h-full text-white" />
          {isHovered && (
            <motion.div
              className={`absolute inset-0 rounded-xl ${step.iconBg}`}
              animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-xl lg:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
            {step.title}
          </h3>
          
          <p className="text-muted-foreground text-sm lg:text-base leading-relaxed mb-5">
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 text-xs"
              >
                <CheckCircle className="w-3 h-3 text-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hover Gradient */}
        <motion.div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
        />
      </motion.div>

      {/* Connector Arrow */}
      {index < steps.length - 1 && (
        <motion.div
          className="hidden lg:flex absolute -left-6 xl:-left-8 top-1/2 -translate-y-1/2 items-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 + index * 0.12 }}
        >
          <div className="w-6 xl:w-8 h-0.5 bg-gradient-to-l from-primary/50 to-transparent" />
          <motion.div
            animate={{ x: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rotate-45 border-l-2 border-b-2 border-primary/50 -ml-0.5"
          />
        </motion.div>
      )}
    </motion.div>
  );
};

const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [activeStep, setActiveStep] = useState(0);

  // Auto-rotate on mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={containerRef} className="py-12 sm:py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
      
      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-0 w-[200px] sm:w-[350px] md:w-[500px] h-[200px] sm:h-[350px] md:h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 60%)",
            filter: "blur(50px)",
          }}
          animate={{
            x: [0, 20, 0],
            y: [0, -15, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 w-[180px] sm:w-[300px] md:w-[400px] h-[180px] sm:h-[300px] md:h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)",
            filter: "blur(50px)",
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 sm:mb-14 md:mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-primary">كيف نعمل</span>
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            خطوات بسيطة نحو{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                النجاح
              </span>
              <motion.div
                className="absolute -bottom-0.5 sm:-bottom-1 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-l from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.7, delay: 0.3 }}
              />
            </span>
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            ابدأ رحلتك معنا في دقائق مع عملية مبسطة وسريعة
          </p>
        </motion.div>

        {/* Mobile Steps */}
        <div className="md:hidden space-y-2 max-w-sm mx-auto">
          {steps.map((step, index) => (
            <MobileStepCard 
              key={step.title} 
              step={step} 
              index={index} 
              isInView={isInView}
              isActive={activeStep === index}
              onClick={() => setActiveStep(index)}
            />
          ))}

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 pt-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeStep === index 
                    ? 'w-6 bg-primary' 
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Steps */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <DesktopStepCard key={step.title} step={step} index={index} isInView={isInView} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-10 sm:mt-14 md:mt-16"
        >
          <Button asChild size="lg" className="w-full sm:w-auto group">
            <Link to="/auth" className="flex items-center gap-2">
              <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>ابدأ الآن مجاناً</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link to="/services">
              تصفح الخدمات
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
