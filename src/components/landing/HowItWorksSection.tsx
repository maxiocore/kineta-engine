import { motion, useInView } from "framer-motion";
import { UserPlus, Settings, Rocket, TrendingUp, ArrowDown } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    icon: UserPlus,
    title: "إنشاء حساب",
    description: "سجّل في ثوانٍ واحصل على وصول فوري لأدوات التسويق القوية.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Settings,
    title: "تكوين الاستراتيجية",
    description: "أعد حملاتك، حدد جمهورك، وخصص سير العمل الخاص بك.",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Rocket,
    title: "إطلاق الحملات",
    description: "انشر حملاتك التسويقية عبر قنوات متعددة بنقرة واحدة.",
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: TrendingUp,
    title: "تتبع وتحسين",
    description: "راقب الأداء في الوقت الفعلي ودع الذكاء الاصطناعي يحسن النتائج.",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
  },
];

const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      {/* Animated Background */}
      <motion.div
        className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 left-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.span 
            className="inline-block px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
          >
            كيف يعمل
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            خطوات بسيطة نحو{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">النجاح</span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
            ابدأ في دقائق مع عملية التسجيل المبسطة لدينا
          </p>
        </motion.div>

        {/* Steps - Vertical Timeline */}
        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.2 }}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <motion.div
                  className="absolute right-8 md:right-1/2 top-24 w-0.5 h-16 md:h-20"
                  style={{
                    background: `linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--accent)))`,
                  }}
                  initial={{ scaleY: 0 }}
                  animate={isInView ? { scaleY: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
                />
              )}

              <div className={`flex items-start gap-6 md:gap-12 mb-8 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                {/* Step Number & Icon */}
                <div className="flex flex-col items-center shrink-0">
                  <motion.div
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${step.color} p-4 shadow-xl relative z-10`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <step.icon className="w-full h-full text-white" />
                    <motion.div
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : {}}
                      transition={{ delay: 0.4 + index * 0.2, type: "spring" }}
                    >
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </motion.div>
                  </motion.div>
                  
                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <motion.div
                      className="md:hidden mt-4"
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowDown className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                </div>

                {/* Content Card */}
                <motion.div
                  className={`flex-1 p-6 md:p-8 rounded-3xl ${step.bgColor} border border-border/50 backdrop-blur-sm ${
                    index % 2 === 1 ? 'md:text-left' : ''
                  }`}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl md:text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{step.description}</p>
                </motion.div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block flex-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
