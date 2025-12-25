import { motion, useInView, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "سارة الأحمد",
    role: "مدير التسويق",
    company: "تك كورب",
    content: "غيّرت هذه المنصة استراتيجيتنا التسويقية بالكامل. شهدنا زيادة بنسبة 300% في العملاء المؤهلين خلال الربع الأول. خدمة استثنائية ودعم متميز.",
    rating: 5,
    initials: "س",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    name: "محمد العلي",
    role: "الرئيس التنفيذي",
    company: "إنوفيت",
    content: "ميزات الأتمتة وحدها وفرت علينا ساعات لا تحصى. رؤى الذكاء الاصطناعي دقيقة وقابلة للتنفيذ بشكل مذهل. أنصح بها بشدة لكل صاحب عمل.",
    rating: 5,
    initials: "م",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    name: "نورة الخالد",
    role: "مسؤول النمو",
    company: "سكيل أب",
    content: "أفضل استثمار تسويقي قمنا به على الإطلاق. تتبع العائد استثنائي وفريق الدعم متجاوب بشكل لا يصدق. نتائج حقيقية في وقت قياسي.",
    rating: 5,
    initials: "ن",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    name: "أحمد السعيد",
    role: "مدير المنتجات",
    company: "ديجيتال فيرست",
    content: "التحليلات المتقدمة ساعدتنا على فهم جمهورنا بشكل أفضل. نتائج مذهلة في وقت قياسي. المنصة سهلة الاستخدام وفعالة جداً.",
    rating: 5,
    initials: "أ",
    gradient: "from-amber-500 to-orange-600",
  },
];

const TestimonialsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-secondary/20" />
        
        {/* Decorative Blurs */}
        <motion.div
          className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 60%)",
            filter: "blur(100px)",
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.05) 0%, transparent 60%)",
            filter: "blur(120px)",
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 18, repeat: Infinity }}
        />
      </div>
      
      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
          >
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">آراء العملاء</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            ماذا يقول{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">عملاؤنا</span>
              <motion.div
                className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            قصص نجاح حقيقية من عملاء وثقوا بنا لتحقيق أهدافهم
          </p>
        </motion.div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <div className="relative p-8 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 h-full overflow-hidden">
                {/* Glow Effect */}
                <motion.div
                  className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${testimonial.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-500`}
                />
                
                {/* Quote Icon */}
                <motion.div
                  className={`absolute -top-4 right-8 w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center shadow-xl`}
                  whileHover={{ rotate: 10, scale: 1.05 }}
                >
                  <Quote className="w-7 h-7 text-white" />
                </motion.div>

                {/* Rating */}
                <div className="flex gap-1 mb-6 mt-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <Star className="w-5 h-5 fill-warning text-warning" />
                    </motion.div>
                  ))}
                </div>

                {/* Content */}
                <p className="text-lg leading-relaxed mb-8 text-foreground/90">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <motion.div 
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <span className="font-bold text-xl text-white">
                      {testimonial.initials}
                    </span>
                  </motion.div>
                  <div>
                    <p className="font-bold text-lg">{testimonial.name}</p>
                    <p className="text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </p>
                  </div>
                </div>

                {/* Bottom Gradient Line */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${testimonial.gradient}`}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden">
          <div className="relative overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4 }}
                className="relative p-8 bg-card/60 backdrop-blur-xl border border-border/50"
              >
                {/* Quote Icon */}
                <motion.div
                  className={`absolute -top-4 right-8 w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonials[activeIndex].gradient} flex items-center justify-center shadow-xl`}
                >
                  <Quote className="w-7 h-7 text-white" />
                </motion.div>

                {/* Rating */}
                <div className="flex gap-1 mb-6 mt-6">
                  {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-lg leading-relaxed mb-8 text-foreground/90">
                  "{testimonials[activeIndex].content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonials[activeIndex].gradient} flex items-center justify-center shadow-lg`}>
                    <span className="font-bold text-xl text-white">
                      {testimonials[activeIndex].initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{testimonials[activeIndex].name}</p>
                    <p className="text-muted-foreground">
                      {testimonials[activeIndex].role} • {testimonials[activeIndex].company}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-xl hover:bg-primary/10 hover:border-primary/30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setActiveIndex(index);
                  }}
                  className="relative w-3 h-3 rounded-full transition-colors"
                  whileHover={{ scale: 1.2 }}
                >
                  <span className={`absolute inset-0 rounded-full ${
                    index === activeIndex ? 'bg-primary' : 'bg-border'
                  }`} />
                  {index === activeIndex && (
                    <motion.span
                      className="absolute -inset-1 rounded-full border-2 border-primary/50"
                      layoutId="active-dot"
                    />
                  )}
                </motion.button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-xl hover:bg-primary/10 hover:border-primary/30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
