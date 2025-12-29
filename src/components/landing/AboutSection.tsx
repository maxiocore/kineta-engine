import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Target, Lightbulb, Users, Zap } from "lucide-react";

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dots opacity-50" />
      
      <div className="container px-5 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-14"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              من نحن
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              شريكك الرقمي نحو النجاح
            </h2>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-strong rounded-3xl p-6 md:p-10">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-l from-primary/20 via-accent/10 to-primary/20 rounded-3xl blur-xl opacity-50" />
              
              <div className="relative z-10">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 text-center">
                  نحن فريق من المتخصصين الشغوفين بالتقنية والإبداع، نؤمن بأن كل فكرة تستحق أن تتحول إلى واقع رقمي مُبهر. نجمع بين الخبرة التقنية العميقة والرؤية الإبداعية لنقدم حلولًا رقمية متكاملة تُحدث فرقًا حقيقيًا في أعمال عملائنا.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {[
                    {
                      icon: Target,
                      title: "رؤية واضحة",
                      description: "نحدد الأهداف ونرسم خارطة الطريق",
                    },
                    {
                      icon: Lightbulb,
                      title: "إبداع مستمر",
                      description: "نبتكر حلولًا فريدة لكل تحدٍ",
                    },
                    {
                      icon: Users,
                      title: "فريق محترف",
                      description: "خبراء في التقنية والتصميم",
                    },
                    {
                      icon: Zap,
                      title: "تنفيذ سريع",
                      description: "نلتزم بالجودة والمواعيد",
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      className="group p-4 md:p-5 rounded-2xl bg-background/50 hover:bg-background transition-all duration-300 border border-border/50 hover:border-primary/30 hover:shadow-lg"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">
                        {feature.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
