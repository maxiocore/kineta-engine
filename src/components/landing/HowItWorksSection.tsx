import { motion } from "framer-motion";
import { UserPlus, Settings, Rocket, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "إنشاء حساب",
    description: "سجّل في ثوانٍ واحصل على وصول فوري لأدوات التسويق القوية.",
  },
  {
    icon: Settings,
    title: "تكوين الاستراتيجية",
    description: "أعد حملاتك، حدد جمهورك، وخصص سير العمل الخاص بك.",
  },
  {
    icon: Rocket,
    title: "إطلاق الحملات",
    description: "انشر حملاتك التسويقية عبر قنوات متعددة بنقرة واحدة.",
  },
  {
    icon: TrendingUp,
    title: "تتبع وتحسين",
    description: "راقب الأداء في الوقت الفعلي ودع الذكاء الاصطناعي يحسن النتائج.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-secondary/30">
      <div className="container px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <span className="text-primary font-medium text-sm tracking-wider uppercase">
            كيف يعمل
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            خطوات بسيطة نحو <span className="text-gradient">النجاح</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            ابدأ في دقائق مع عملية التسجيل المبسطة لدينا
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connection Line */}
          <div className="absolute right-8 md:right-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-primary/20 md:translate-x-px" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`relative flex items-center gap-8 mb-16 last:mb-0 ${
                index % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row"
              }`}
            >
              {/* Step Number */}
              <div className="absolute right-8 md:right-1/2 w-16 h-16 translate-x-1/2 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow z-10">
                <span className="font-display text-2xl font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </div>

              {/* Content Card */}
              <div className={`mr-24 md:mr-0 md:w-[calc(50%-4rem)] ${index % 2 === 0 ? "md:pl-8" : "md:pr-8"}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-2xl p-6 hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </motion.div>
              </div>

              {/* Spacer for opposite side */}
              <div className="hidden md:block md:w-[calc(50%-4rem)]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;