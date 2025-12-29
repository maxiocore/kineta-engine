import { motion, useInView } from "framer-motion";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";

const FAQSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const faqs = [
    {
      question: "كيف يمكنني البدء في استخدام خدماتكم؟",
      answer: "يمكنك البدء بسهولة من خلال إنشاء حساب مجاني ثم اختيار الخدمة التي تناسب احتياجاتك. فريقنا متاح لمساعدتك في كل خطوة."
    },
    {
      question: "ما هي طرق الدفع المتاحة؟",
      answer: "نوفر العديد من طرق الدفع الآمنة بما في ذلك البطاقات الائتمانية، التحويل البنكي، Apple Pay، ومختلف المحافظ الإلكترونية."
    },
    {
      question: "هل يوجد ضمان على الخدمات؟",
      answer: "نعم، جميع خدماتنا مغطاة بضمان الجودة. إذا لم تكن راضياً عن النتيجة، سنعمل على تعديلها حتى تحقق رضاك التام."
    },
    {
      question: "كم يستغرق تنفيذ المشروع؟",
      answer: "يعتمد وقت التنفيذ على نوع الخدمة وحجم المشروع. المشاريع البسيطة قد تستغرق يوماً واحداً، بينما المشاريع الكبيرة قد تحتاج عدة أسابيع."
    },
    {
      question: "هل يمكنني طلب تعديلات بعد التسليم؟",
      answer: "بالتأكيد! نوفر جولات تعديل مجانية ضمن نطاق المشروع المتفق عليه لضمان رضاك الكامل عن النتيجة النهائية."
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24">
      <div className="container px-4 sm:px-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            الأسئلة الشائعة
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            لديك{" "}
            <span className="text-primary">استفسار؟</span>
          </h2>
          <p className="text-muted-foreground">
            إجابات على أكثر الأسئلة شيوعاً حول خدماتنا
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                  <AccordionTrigger className="text-right hover:no-underline py-4 sm:py-5">
                    <div className="flex items-center gap-3 text-sm sm:text-base font-medium">
                      <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed pb-4 pr-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">لم تجد إجابة سؤالك؟</p>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl">
              <MessageCircle className="w-4 h-4 ml-2" />
              تواصل مع فريق الدعم
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
