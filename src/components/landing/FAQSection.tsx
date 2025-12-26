import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Sparkles } from "lucide-react";

const faqs = [
  {
    question: "ما هي الخدمات التي تقدمونها؟",
    answer: "نقدم مجموعة شاملة من الخدمات الرقمية تشمل التسويق الرقمي، تطوير المواقع والتطبيقات، التصميم الإبداعي، إدارة وسائل التواصل الاجتماعي، وخدمات تحسين محركات البحث SEO."
  },
  {
    question: "كم من الوقت يستغرق تنفيذ المشروع؟",
    answer: "يختلف وقت التنفيذ حسب نوع المشروع وحجمه. المشاريع البسيطة قد تستغرق من 3-7 أيام، بينما المشاريع الكبيرة قد تحتاج من 2-4 أسابيع. نحرص دائماً على تسليم العمل في الوقت المحدد مع الحفاظ على أعلى جودة."
  },
  {
    question: "هل تقدمون ضمان على الخدمات؟",
    answer: "نعم، نقدم ضمان جودة على جميع خدماتنا. إذا لم تكن راضياً عن النتائج، نعمل معك على تعديلها حتى تحقق رضاك الكامل. رضا عملائنا هو أولويتنا الأولى."
  },
  {
    question: "كيف يمكنني التواصل مع فريق الدعم؟",
    answer: "يمكنك التواصل معنا عبر نموذج الاتصال في الموقع، أو عبر البريد الإلكتروني، أو من خلال الواتساب على مدار الساعة. فريقنا جاهز لمساعدتك في أي وقت."
  },
  {
    question: "ما هي طرق الدفع المتاحة؟",
    answer: "نقبل جميع طرق الدفع الرئيسية بما في ذلك البطاقات الائتمانية، التحويل البنكي، Apple Pay، وخدمات الدفع الإلكتروني المحلية. جميع المعاملات آمنة ومشفرة بالكامل."
  },
  {
    question: "هل يمكنني طلب تعديلات بعد استلام العمل؟",
    answer: "بالتأكيد! نوفر جولات تعديل مجانية ضمن نطاق المشروع المتفق عليه. نؤمن بأن التواصل المستمر هو مفتاح النجاح، لذلك نحرص على فهم متطلباتك بدقة."
  }
];

const FAQSection = () => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Floating Question Marks */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/10 pointer-events-none"
          style={{
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <HelpCircle className="w-8 h-8 md:w-12 md:h-12" />
        </motion.div>
      ))}

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">نجيب على تساؤلاتك</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-l from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
              الأسئلة الشائعة
            </span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            إليك أجوبة على أكثر الأسئلة شيوعاً. إذا لم تجد إجابتك، تواصل معنا مباشرة
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-4 md:px-6 overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                >
                  <AccordionTrigger className="text-base md:text-lg font-semibold hover:text-primary transition-colors py-4 md:py-5 gap-4">
                    <span className="flex items-center gap-3 text-right">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed pb-4 md:pb-5 pr-11">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {faq.answer}
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* CTA at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            لم تجد إجابة سؤالك؟
          </p>
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-gradient-to-l from-primary to-cyan-500 text-primary-foreground px-6 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-primary/25 transition-shadow"
          >
            <HelpCircle className="w-5 h-5" />
            تواصل معنا الآن
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
