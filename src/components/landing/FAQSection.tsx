import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Sparkles, ArrowLeft } from "lucide-react";
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
      {/* Static Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-cyan-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-cyan-500/10 via-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-3 bg-gradient-to-l from-primary/20 to-cyan-500/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">نجيب على جميع تساؤلاتك</span>
            <HelpCircle className="w-5 h-5 text-cyan-400" />
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-l from-primary via-cyan-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
              الأسئلة الشائعة
            </span>
          </h2>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            إليك أجوبة على أكثر الأسئلة التي يطرحها عملاؤنا. إذا لم تجد إجابتك، لا تتردد في التواصل معنا
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto">
          <Accordion 
            type="single" 
            collapsible 
            value={openItem}
            onValueChange={setOpenItem}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className={`
                    group relative bg-card/60 backdrop-blur-md border-2 rounded-2xl overflow-hidden
                    transition-all duration-300 ease-out
                    ${openItem === `item-${index}` 
                      ? 'border-primary/50 shadow-xl shadow-primary/10' 
                      : 'border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                    }
                  `}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-l from-primary/5 via-cyan-500/5 to-transparent transition-opacity duration-300 ${
                      openItem === `item-${index}` ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    }`}
                  />

                  <AccordionTrigger className="relative px-5 md:px-8 py-5 md:py-6 hover:no-underline">
                    <div className="flex items-center gap-4 w-full text-right">
                      <div className={`
                        flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl
                        flex items-center justify-center text-2xl md:text-3xl
                        transition-all duration-300
                        ${openItem === `item-${index}`
                          ? 'bg-gradient-to-br from-primary to-cyan-500 shadow-lg shadow-primary/30'
                          : 'bg-muted/50 group-hover:bg-primary/10'
                        }
                      `}>
                        {faq.icon}
                      </div>

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
                    <div className="pr-16 md:pr-[72px]">
                      <div className="bg-muted/30 rounded-xl p-4 md:p-5 border border-border/30">
                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed text-right">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 md:mt-20 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="inline-block p-1 rounded-2xl bg-gradient-to-l from-primary via-cyan-500 to-primary bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
            <div className="bg-background rounded-xl px-8 py-6">
              <p className="text-muted-foreground text-lg mb-4">
                لم تجد إجابة سؤالك؟ نحن هنا لمساعدتك
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-3 bg-gradient-to-l from-primary to-cyan-500 text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.05] active:scale-[0.95] transition-all"
              >
                تواصل معنا الآن
                <ArrowLeft className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
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

export default FAQSection;
