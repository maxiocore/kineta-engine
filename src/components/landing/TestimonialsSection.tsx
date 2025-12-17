import { motion, useInView } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "سارة الأحمد",
    role: "مدير التسويق",
    company: "تك كورب",
    content: "غيّرت هذه المنصة استراتيجيتنا التسويقية بالكامل. شهدنا زيادة بنسبة 300% في العملاء المؤهلين خلال الربع الأول.",
    rating: 5,
    image: "س",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "محمد العلي",
    role: "الرئيس التنفيذي",
    company: "إنوفيت",
    content: "ميزات الأتمتة وحدها وفرت علينا ساعات لا تحصى. رؤى الذكاء الاصطناعي دقيقة وقابلة للتنفيذ بشكل مذهل.",
    rating: 5,
    image: "م",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "نورة الخالد",
    role: "مسؤول النمو",
    company: "سكيل أب",
    content: "أفضل استثمار تسويقي قمنا به على الإطلاق. تتبع العائد استثنائي وفريق الدعم متجاوب بشكل لا يصدق.",
    rating: 5,
    image: "ن",
    color: "from-emerald-500 to-green-500",
  },
  {
    name: "أحمد السعيد",
    role: "مدير المنتجات",
    company: "ديجيتال فيرست",
    content: "التحليلات المتقدمة ساعدتنا على فهم جمهورنا بشكل أفضل. نتائج مذهلة في وقت قياسي.",
    rating: 5,
    image: "أ",
    color: "from-amber-500 to-orange-500",
  },
];

const TestimonialsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      {/* Decorative Elements */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
        animate={{
          scale: [1.2, 1, 1.2],
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      
      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
          >
            آراء العملاء
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            ماذا يقول{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">عملاؤنا</span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </span>
          </h2>
        </motion.div>

        {/* Testimonials Grid - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="relative p-8 rounded-3xl bg-background/60 border border-border/50 hover:border-primary/40 backdrop-blur-xl transition-all duration-500 h-full">
                {/* Quote Icon */}
                <motion.div
                  className={`absolute -top-4 right-8 w-12 h-12 rounded-2xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center shadow-lg`}
                  whileHover={{ rotate: 10 }}
                >
                  <Quote className="w-6 h-6 text-white" />
                </motion.div>

                {/* Rating */}
                <div className="flex gap-1 mb-6 mt-4">
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
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center shadow-lg`}
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="font-bold text-xl text-white">
                      {testimonial.image}
                    </span>
                  </motion.div>
                  <div>
                    <p className="font-bold text-lg">{testimonial.name}</p>
                    <p className="text-muted-foreground">
                      {testimonial.role} في {testimonial.company}
                    </p>
                  </div>
                </div>

                {/* Glow Effect */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${testimonial.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Carousel - Mobile */}
        <div className="lg:hidden">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="relative p-8 rounded-3xl bg-background/60 border border-border/50 backdrop-blur-xl"
          >
            {/* Quote Icon */}
            <motion.div
              className={`absolute -top-4 right-8 w-12 h-12 rounded-2xl bg-gradient-to-br ${testimonials[activeIndex].color} flex items-center justify-center shadow-lg`}
            >
              <Quote className="w-6 h-6 text-white" />
            </motion.div>

            {/* Rating */}
            <div className="flex gap-1 mb-6 mt-4">
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
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonials[activeIndex].color} flex items-center justify-center shadow-lg`}>
                <span className="font-bold text-xl text-white">
                  {testimonials[activeIndex].image}
                </span>
              </div>
              <div>
                <p className="font-bold text-lg">{testimonials[activeIndex].name}</p>
                <p className="text-muted-foreground">
                  {testimonials[activeIndex].role} في {testimonials[activeIndex].company}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === activeIndex ? 'bg-primary' : 'bg-border'
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-xl"
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
