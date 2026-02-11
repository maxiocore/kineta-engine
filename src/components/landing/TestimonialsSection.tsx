import { Star, Quote, ChevronLeft, ChevronRight, MessageSquare, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

const testimonials = [
  {
    content: "غيّرت هذه المنصة استراتيجيتنا التسويقية بالكامل. شهدنا زيادة بنسبة 300% في العملاء المؤهلين خلال الربع الأول. خدمة استثنائية ودعم متميز.",
    rating: 5,
    category: "تسويق رقمي",
    gradient: "from-cyan-500 to-blue-600",
    emoji: "🚀",
  },
  {
    content: "ميزات الأتمتة وحدها وفرت علينا ساعات لا تحصى. رؤى الذكاء الاصطناعي دقيقة وقابلة للتنفيذ بشكل مذهل. أنصح بها بشدة لكل صاحب عمل.",
    rating: 5,
    category: "إدارة حسابات",
    gradient: "from-violet-500 to-purple-600",
    emoji: "⚡",
  },
  {
    content: "أفضل استثمار تسويقي قمنا به على الإطلاق. تتبع العائد استثنائي وفريق الدعم متجاوب بشكل لا يصدق. نتائج حقيقية في وقت قياسي.",
    rating: 5,
    category: "زيادة متابعين",
    gradient: "from-emerald-500 to-teal-600",
    emoji: "📈",
  },
  {
    content: "التحليلات المتقدمة ساعدتنا على فهم جمهورنا بشكل أفضل. نتائج مذهلة في وقت قياسي. المنصة سهلة الاستخدام وفعالة جداً.",
    rating: 5,
    category: "تصميم إبداعي",
    gradient: "from-amber-500 to-orange-600",
    emoji: "🎨",
  },
  {
    content: "تجربة رائعة من البداية للنهاية. فريق محترف وأسعار منافسة. سأعود للتعامل معهم مرة أخرى بكل تأكيد.",
    rating: 5,
    category: "برمجة وتطوير",
    gradient: "from-rose-500 to-pink-600",
    emoji: "💻",
  },
  {
    content: "خدمة عملاء ممتازة ونتائج تفوق التوقعات. أنصح الجميع بتجربة خدماتهم المتميزة.",
    rating: 5,
    category: "حملات إعلانية",
    gradient: "from-indigo-500 to-blue-600",
    emoji: "📢",
  },
];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
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
    <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 via-background to-secondary/10" />
        <div
          className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-1/4 left-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)",
            filter: "blur(100px)",
          }}
        />
      </div>
      
      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8">
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-primary">تجارب حقيقية</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            ماذا يقول{" "}
            <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">عملاؤنا</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            قصص نجاح حقيقية من عملاء وثقوا بنا لتحقيق أهدافهم
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group animate-fade-in hover:-translate-y-2 transition-transform duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative p-5 lg:p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-300 h-full overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${testimonial.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${testimonial.gradient} mb-4`}>
                  <span className="text-sm">{testimonial.emoji}</span>
                  <span className="text-xs font-medium text-white">{testimonial.category}</span>
                </div>

                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>

                <div className="absolute top-4 left-4 opacity-10">
                  <Quote className="w-8 h-8 text-primary" />
                </div>

                <p className="text-sm lg:text-base leading-relaxed text-foreground/85 relative z-10">
                  {testimonial.content}
                </p>

                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${testimonial.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-right`} />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel - keep minimal framer-motion for slide transitions */}
        <div className="md:hidden">
          <div className="relative overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="relative p-6 bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl"
              >
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${testimonials[activeIndex].gradient} rounded-full blur-[80px] opacity-20`} />

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${testimonials[activeIndex].gradient} mb-4`}>
                  <span className="text-sm">{testimonials[activeIndex].emoji}</span>
                  <span className="text-xs font-medium text-white">{testimonials[activeIndex].category}</span>
                </div>

                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>

                <div className="absolute top-4 left-4 opacity-10">
                  <Quote className="w-8 h-8 text-primary" />
                </div>

                <p className="text-base leading-relaxed text-foreground/85 relative z-10">
                  {testimonials[activeIndex].content}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center items-center gap-3 mt-6">
            <Button variant="outline" size="icon" onClick={prevTestimonial} className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:border-primary/30">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1.5">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => { setIsAutoPlaying(false); setActiveIndex(index); }}
                  className="relative p-1"
                >
                  <span className={`block w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex ? 'bg-primary w-6' : 'bg-border hover:bg-primary/50'
                  }`} />
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={nextTestimonial} className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:border-primary/30">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Trust Indicator */}
        <div className="flex justify-center mt-10 sm:mt-12 md:mt-16 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 px-6 py-4 rounded-2xl bg-secondary/30 backdrop-blur-sm border border-border/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-sm sm:text-base font-medium">+500 عميل راضٍ</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-border" />
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-warning text-warning" />
              ))}
              <span className="text-sm sm:text-base font-medium mr-1">تقييم ممتاز</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out both;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
