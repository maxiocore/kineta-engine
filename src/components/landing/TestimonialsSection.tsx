import { motion, useInView, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronRight, ChevronLeft } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const TestimonialsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const testimonials = [
    {
      name: "أحمد محمد",
      role: "مدير تسويق",
      content: "خدمة ممتازة وفريق محترف ساعدونا في زيادة مبيعاتنا بنسبة 150% خلال 3 أشهر فقط",
      rating: 5,
      avatar: "أ"
    },
    {
      name: "سارة أحمد",
      role: "صاحبة مشروع",
      content: "تجربة رائعة من البداية للنهاية والتصميم كان مذهلاً والتسليم في الوقت المحدد",
      rating: 5,
      avatar: "س"
    },
    {
      name: "خالد العمري",
      role: "رائد أعمال",
      content: "أفضل فريق تعاملت معه يفهمون احتياجات العميل ويقدمون حلول إبداعية تفوق التوقعات",
      rating: 5,
      avatar: "خ"
    },
    {
      name: "نورة السالم",
      role: "مديرة محتوى",
      content: "احترافية عالية وسرعة في التنفيذ والنتائج كانت مبهرة وتجاوزت كل توقعاتي",
      rating: 5,
      avatar: "ن"
    },
    {
      name: "فهد الحربي",
      role: "مستثمر",
      content: "تعاون مثمر ونتائج ملموسة والفريق متميز ويستحق الثقة سأعود للتعامل معهم",
      rating: 5,
      avatar: "ف"
    },
  ];

  const nextTestimonial = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-play
  useEffect(() => {
    const timer = setInterval(nextTestimonial, 6000);
    return () => clearInterval(timer);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section ref={ref} className="py-16 sm:py-24 lg:py-32 relative overflow-hidden" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
      
      {/* Animated Background Elements */}
      <motion.div
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03]"
      >
        <div className="w-full h-full rounded-full border-[40px] border-primary" />
      </motion.div>

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5"
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-primary">+50,000 عميل راضٍ</span>
          </motion.div>
          
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            ماذا يقول{" "}
            <span className="bg-gradient-to-l from-primary to-violet-500 bg-clip-text text-transparent">
              عملاؤنا
            </span>
          </h2>
        </motion.div>

        {/* Main Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Navigation Buttons - Desktop */}
            <div className="hidden sm:block">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-20 z-10 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 lg:-translate-x-20 z-10 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Card Container */}
            <div className="relative min-h-[320px] sm:min-h-[280px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <div className="h-full p-6 sm:p-10 lg:p-12 rounded-3xl bg-card border border-border/50 shadow-2xl shadow-primary/5">
                    {/* Quote Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                      className="mb-6"
                    >
                      <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-primary/20" />
                    </motion.div>

                    {/* Content */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="text-lg sm:text-xl lg:text-2xl text-foreground font-medium leading-relaxed mb-8"
                    >
                      {testimonials[activeIndex].content}
                    </motion.p>

                    {/* Author & Rating */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/25"
                        >
                          <span className="text-white font-bold text-lg sm:text-xl">
                            {testimonials[activeIndex].avatar}
                          </span>
                        </motion.div>
                        <div>
                          <div className="text-base sm:text-lg font-bold text-foreground">
                            {testimonials[activeIndex].name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {testimonials[activeIndex].role}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2, delay: 0.4 + i * 0.05 }}
                          >
                            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots & Mobile Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {/* Mobile Prev */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={prevTestimonial}
                className="sm:hidden w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setDirection(index > activeIndex ? 1 : -1);
                      setActiveIndex(index);
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative p-1"
                  >
                    <motion.div
                      animate={{
                        width: index === activeIndex ? 24 : 8,
                        backgroundColor: index === activeIndex ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-2 rounded-full"
                    />
                  </motion.button>
                ))}
              </div>

              {/* Mobile Next */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={nextTestimonial}
                className="sm:hidden w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mt-12 sm:mt-16"
        >
          {[
            { value: "4.9", label: "تقييم" },
            { value: "50K+", label: "عميل" },
            { value: "99%", label: "رضا" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              className="text-center p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/30"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
