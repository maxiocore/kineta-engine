import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useRef } from "react";

const TestimonialsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      name: "أحمد محمد",
      role: "مدير التسويق",
      company: "شركة التقنية",
      content: "خدمة ممتازة وفريق محترف. ساعدونا في زيادة مبيعاتنا بنسبة 150% خلال 3 أشهر فقط.",
      rating: 5
    },
    {
      name: "سارة أحمد",
      role: "مؤسسة",
      company: "متجر الأناقة",
      content: "تجربة رائعة من البداية للنهاية. التصميم كان مذهلاً والتسليم في الوقت المحدد.",
      rating: 5
    },
    {
      name: "خالد العمري",
      role: "رائد أعمال",
      company: "تطبيقات ذكية",
      content: "أفضل فريق تعاملت معه. يفهمون احتياجات العميل ويقدمون حلول إبداعية.",
      rating: 5
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 bg-secondary/30">
      <div className="container px-4 sm:px-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            آراء العملاء
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            ماذا يقول{" "}
            <span className="text-primary">عملاؤنا</span>
          </h2>
          <p className="text-muted-foreground">
            نفخر بثقة عملائنا وشهاداتهم عن تجربتهم معنا
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative p-5 sm:p-6 rounded-2xl bg-card border border-border/50"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-5 left-5 w-8 h-8 text-primary/10" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role} - {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
