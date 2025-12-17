import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "سارة الأحمد",
    role: "مدير التسويق",
    company: "تك كورب",
    content: "غيّرت هذه المنصة استراتيجيتنا التسويقية بالكامل. شهدنا زيادة بنسبة 300% في العملاء المؤهلين خلال الربع الأول.",
    rating: 5,
  },
  {
    name: "محمد العلي",
    role: "الرئيس التنفيذي",
    company: "إنوفيت",
    content: "ميزات الأتمتة وحدها وفرت علينا ساعات لا تحصى. رؤى الذكاء الاصطناعي دقيقة وقابلة للتنفيذ بشكل مذهل.",
    rating: 5,
  },
  {
    name: "نورة الخالد",
    role: "مسؤول النمو",
    company: "سكيل أب",
    content: "أفضل استثمار تسويقي قمنا به على الإطلاق. تتبع العائد استثنائي وفريق الدعم متجاوب بشكل لا يصدق.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-10" />
      
      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium text-sm tracking-wider uppercase">
            آراء العملاء
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            ماذا يقول <span className="text-gradient">عملاؤنا</span>
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="glass rounded-2xl p-8 h-full hover:border-primary/30 transition-all">
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-primary/30 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground/90 leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="font-display font-bold text-primary-foreground">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} في {testimonial.company}
                    </p>
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