import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Sparkles, MessageCircleQuestion, ArrowLeft } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "ما هي الخدمات التي تقدمونها؟",
    answer: "نقدم مجموعة شاملة من الخدمات الرقمية تشمل التسويق الرقمي، تطوير المواقع والتطبيقات، التصميم الإبداعي، إدارة وسائل التواصل الاجتماعي، وخدمات تحسين محركات البحث SEO.",
    icon: "🚀"
  },
  {
    question: "كم من الوقت يستغرق تنفيذ المشروع؟",
    answer: "يختلف وقت التنفيذ حسب نوع المشروع وحجمه. المشاريع البسيطة قد تستغرق من 3-7 أيام، بينما المشاريع الكبيرة قد تحتاج من 2-4 أسابيع. نحرص دائماً على تسليم العمل في الوقت المحدد مع الحفاظ على أعلى جودة.",
    icon: "⏱️"
  },
  {
    question: "هل تقدمون ضمان على الخدمات؟",
    answer: "نعم، نقدم ضمان جودة على جميع خدماتنا. إذا لم تكن راضياً عن النتائج، نعمل معك على تعديلها حتى تحقق رضاك الكامل. رضا عملائنا هو أولويتنا الأولى.",
    icon: "✅"
  },
  {
    question: "كيف يمكنني التواصل مع فريق الدعم؟",
    answer: "يمكنك التواصل معنا عبر نموذج الاتصال في الموقع، أو عبر البريد الإلكتروني، أو من خلال الواتساب على مدار الساعة. فريقنا جاهز لمساعدتك في أي وقت.",
    icon: "💬"
  },
  {
    question: "ما هي طرق الدفع المتاحة؟",
    answer: "نقبل جميع طرق الدفع الرئيسية بما في ذلك البطاقات الائتمانية، التحويل البنكي، Apple Pay، وخدمات الدفع الإلكتروني المحلية. جميع المعاملات آمنة ومشفرة بالكامل.",
    icon: "💳"
  },
  {
    question: "هل يمكنني طلب تعديلات بعد استلام العمل؟",
    answer: "بالتأكيد! نوفر جولات تعديل مجانية ضمن نطاق المشروع المتفق عليه. نؤمن بأن التواصل المستمر هو مفتاح النجاح، لذلك نحرص على فهم متطلباتك بدقة.",
    icon: "🔄"
  }
];

const FAQSection = () => {
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);

  return (
    <section dir="rtl" className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-cyan-500/5 to-transparent rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-cyan-500/10 via-primary/5 to-transparent rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Floating Question Icons */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/5"
            style={{
              right: `${5 + (i * 12)}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 15, -15, 0],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 5 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <MessageCircleQuestion className="w-10 h-10 md:w-16 md:h-16" />
          </motion.div>
        ))}

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary-rgb,59,130,246),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary-rgb,59,130,246),0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center gap-3 bg-gradient-to-l from-primary/20 to-cyan-500/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-primary/20"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <span className="text-primary font-semibold">نجيب على جميع تساؤلاتك</span>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </motion.div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          >
            <span className="bg-gradient-to-l from-primary via-cyan-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
              الأسئلة الشائعة
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            إليك أجوبة على أكثر الأسئلة التي يطرحها عملاؤنا. إذا لم تجد إجابتك، لا تتردد في التواصل معنا
          </motion.p>
        </motion.div>

        {/* FAQ Grid Layout */}
        <div className="max-w-4xl mx-auto">
          <Accordion 
            type="single" 
            collapsible 
            value={openItem}
            onValueChange={setOpenItem}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className={`
                    group relative bg-card/60 backdrop-blur-md border-2 rounded-2xl overflow-hidden
                    transition-all duration-500 ease-out
                    ${openItem === `item-${index}` 
                      ? 'border-primary/50 shadow-xl shadow-primary/10' 
                      : 'border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                    }
                  `}
                >
                  {/* Animated Background Glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-l from-primary/5 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={false}
                    animate={openItem === `item-${index}` ? { opacity: 1 } : { opacity: 0 }}
                  />

                  <AccordionTrigger className="relative px-5 md:px-8 py-5 md:py-6 hover:no-underline">
                    <div className="flex items-center gap-4 w-full text-right">
                      {/* Animated Icon */}
                      <motion.div
                        className={`
                          flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl
                          flex items-center justify-center text-2xl md:text-3xl
                          transition-all duration-300
                          ${openItem === `item-${index}`
                            ? 'bg-gradient-to-br from-primary to-cyan-500 shadow-lg shadow-primary/30'
                            : 'bg-muted/50 group-hover:bg-primary/10'
                          }
                        `}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {faq.icon}
                      </motion.div>

                      {/* Question Text */}
                      <span className={`
                        flex-1 text-base md:text-lg lg:text-xl font-bold text-right
                        transition-colors duration-300
                        ${openItem === `item-${index}` ? 'text-primary' : 'text-foreground group-hover:text-primary'}
                      `}>
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="relative px-5 md:px-8 pb-6">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="pr-16 md:pr-[72px]"
                    >
                      <div className="bg-muted/30 rounded-xl p-4 md:p-5 border border-border/30">
                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed text-right">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16 md:mt-20"
        >
          <motion.div
            className="inline-block p-1 rounded-2xl bg-gradient-to-l from-primary via-cyan-500 to-primary bg-[length:200%_auto]"
            animate={{ backgroundPosition: ["0%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="bg-background rounded-xl px-8 py-6">
              <p className="text-muted-foreground text-lg mb-4">
                لم تجد إجابة سؤالك؟ نحن هنا لمساعدتك
              </p>
              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-gradient-to-l from-primary to-cyan-500 text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary/30 transition-shadow"
              >
                تواصل معنا الآن
                <motion.div
                  animate={{ x: [0, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.div>
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
