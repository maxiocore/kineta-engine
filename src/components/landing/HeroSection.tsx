import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Zap, Shield, Star, CheckCircle2, Code2, Palette, Share2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

const slides = [
  {
    id: 1,
    badge: "التسويق الرقمي",
    title: "نضاعف مبيعاتك",
    highlight: "بحملات ذكية",
    description: "استراتيجيات تسويقية متقدمة تصل بعلامتك التجارية لجمهورك المستهدف",
    icon: Share2,
    color: "from-cyan-500 to-blue-600",
    stats: [
      { value: "+300%", label: "زيادة المبيعات" },
      { value: "+50K", label: "عميل محتمل" },
    ]
  },
  {
    id: 2,
    badge: "البرمجة والتطوير",
    title: "نبني تطبيقات",
    highlight: "تتفوق على المنافسين",
    description: "حلول برمجية مخصصة بأحدث التقنيات لتحقيق أهداف عملك",
    icon: Code2,
    color: "from-emerald-500 to-teal-600",
    stats: [
      { value: "+200", label: "تطبيق منجز" },
      { value: "99%", label: "رضا العملاء" },
    ]
  },
  {
    id: 3,
    badge: "التصميم الإبداعي",
    title: "نصمم هويات",
    highlight: "لا تُنسى",
    description: "تصاميم إبداعية تعكس شخصية علامتك التجارية وتجذب العملاء",
    icon: Palette,
    color: "from-violet-500 to-purple-600",
    stats: [
      { value: "+500", label: "تصميم احترافي" },
      { value: "+100", label: "هوية بصرية" },
    ]
  },
  {
    id: 4,
    badge: "خدمات السوشيال",
    title: "نزيد متابعيك",
    highlight: "بشكل حقيقي",
    description: "إدارة احترافية لحساباتك على جميع منصات التواصل الاجتماعي",
    icon: Globe,
    color: "from-amber-500 to-orange-600",
    stats: [
      { value: "+1M", label: "متابع جديد" },
      { value: "+5K", label: "حساب نديره" },
    ]
  },
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  // Auto-slide
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
        
        {/* Animated Gradient based on current slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] sm:w-[900px] sm:h-[600px] blur-3xl"
            style={{
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.4) 0%, transparent 70%)`,
            }}
          />
        </AnimatePresence>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Slider Content */}
          <div className="relative min-h-[400px] sm:min-h-[450px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 flex flex-col items-center text-center"
              >
                {/* Badge with Icon */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8"
                >
                  <motion.div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${slide.color} p-1.5`}
                  >
                    <SlideIcon className="w-full h-full text-white" />
                  </motion.div>
                  <span className="text-sm font-medium text-primary">{slide.badge}</span>
                </motion.div>

                {/* Headline */}
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 sm:mb-6"
                >
                  <span className="block mb-2">{slide.title}</span>
                  <span className={`bg-gradient-to-l ${slide.color} bg-clip-text text-transparent`}>
                    {slide.highlight}
                  </span>
                </motion.h1>

                {/* Description */}
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed px-4"
                >
                  {slide.description}
                </motion.p>

                {/* Stats */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-6 sm:gap-10 mb-8"
                >
                  {slide.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                        className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-l ${slide.color} bg-clip-text text-transparent`}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4"
                >
                  <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className={`w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-xl bg-gradient-to-l ${slide.color} text-white shadow-lg text-base font-semibold group`}
                    >
                      <Zap className="w-5 h-5 ml-2" />
                      ابدأ الآن مجاناً
                      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/our-services" className="w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-xl border-border/50 hover:bg-secondary/50 text-base font-medium"
                    >
                      اكتشف خدماتنا
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slider Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {/* Prev Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Dots */}
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="relative"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div 
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-primary' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                  {index === currentSlide && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute inset-0 rounded-full ring-2 ring-primary/30"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Next Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 max-w-xs mx-auto">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                key={currentSlide}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 5, ease: "linear" }}
                className={`h-full bg-gradient-to-l ${slide.color} rounded-full`}
              />
            </div>
          </div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10 sm:mt-12"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-xs sm:text-sm">دعم فني 24/7</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm">ضمان الجودة</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-4 h-4 text-warning" />
              <span className="text-xs sm:text-sm">تقييم 4.9/5</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
