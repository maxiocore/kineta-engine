import { motion, useInView } from "framer-motion";
import { Star, Quote, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

const TestimonialsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      name: "أحمد محمد",
      role: "مدير تسويق",
      content: "خدمة ممتازة وفريق محترف. ساعدونا في زيادة مبيعاتنا بنسبة 150% خلال 3 أشهر فقط. أنصح بهم بشدة!",
      rating: 5,
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "سارة أحمد",
      role: "صاحبة مشروع",
      content: "تجربة رائعة من البداية للنهاية. التصميم كان مذهلاً والتسليم في الوقت المحدد. شكراً لكم!",
      rating: 5,
      color: "from-violet-500 to-purple-500"
    },
    {
      name: "خالد العمري",
      role: "رائد أعمال",
      content: "أفضل فريق تعاملت معه. يفهمون احتياجات العميل ويقدمون حلول إبداعية تفوق التوقعات.",
      rating: 5,
      color: "from-emerald-500 to-teal-500"
    },
    {
      name: "نورة السالم",
      role: "مديرة محتوى",
      content: "احترافية عالية وسرعة في التنفيذ. النتائج كانت مبهرة وتجاوزت كل توقعاتي.",
      rating: 5,
      color: "from-amber-500 to-orange-500"
    },
    {
      name: "فهد الحربي",
      role: "مستثمر",
      content: "تعاون مثمر ونتائج ملموسة. الفريق متميز ويستحق الثقة. سأعود للتعامل معهم حتماً.",
      rating: 5,
      color: "from-pink-500 to-rose-500"
    },
  ];

  return (
    <section ref={ref} className="py-20 sm:py-28 lg:py-32 relative overflow-hidden" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-muted/30" />
      
      {/* Decorative Orbs */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.12, 0.08] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"
      />

      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              آراء عملائنا
            </span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
            <span className="text-foreground">عملاؤنا</span>{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              يتحدثون
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            نفخر بثقة عملائنا الكرام وتجاربهم الناجحة معنا
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="max-w-5xl mx-auto">
          {/* Main Featured Card */}
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative mb-10"
          >
            <div className="relative p-8 sm:p-12 rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden">
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonials[activeIndex].color} opacity-[0.03]`} />
              
              {/* Quote Icon */}
              <motion.div
                initial={{ rotate: -10, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute top-6 left-6 sm:top-8 sm:left-8"
              >
                <Quote className="w-12 h-12 sm:w-16 sm:h-16 text-primary/10" />
              </motion.div>

              <div className="relative z-10">
                {/* Rating */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex gap-1.5 mb-6"
                >
                  {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                    >
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-500 text-amber-500" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Content */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-xl sm:text-2xl lg:text-3xl text-foreground font-medium leading-relaxed mb-8"
                >
                  &ldquo;{testimonials[activeIndex].content}&rdquo;
                </motion.p>

                {/* Author */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonials[activeIndex].color} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-xl">
                      {testimonials[activeIndex].name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{testimonials[activeIndex].name}</div>
                    <div className="text-sm text-muted-foreground">{testimonials[activeIndex].role}</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Thumbnails */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 sm:gap-4"
          >
            {testimonials.map((testimonial, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveIndex(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl transition-all duration-300 ${
                  activeIndex === index
                    ? "bg-card border-2 border-primary shadow-lg shadow-primary/10"
                    : "bg-muted/50 border border-border/50 hover:bg-card hover:border-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold text-sm">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div className="text-right hidden sm:block">
                  <div className={`text-sm font-semibold ${activeIndex === index ? "text-primary" : "text-foreground"}`}>
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-16 sm:mt-20 pt-10 border-t border-border/30"
        >
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              4.9/5
            </div>
            <div className="text-sm text-muted-foreground mt-1">تقييم العملاء</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              +50K
            </div>
            <div className="text-sm text-muted-foreground mt-1">عميل سعيد</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
              99%
            </div>
            <div className="text-sm text-muted-foreground mt-1">نسبة الرضا</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
