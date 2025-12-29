import { motion, useInView } from "framer-motion";
import { MessageSquare, FileSearch, Rocket, CheckCircle } from "lucide-react";
import { useRef } from "react";

const HowItWorksSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      icon: MessageSquare,
      title: "تواصل معنا",
      desc: "أخبرنا عن احتياجاتك وأهدافك",
      number: "01"
    },
    {
      icon: FileSearch,
      title: "تحليل المتطلبات",
      desc: "ندرس طلبك ونقدم أفضل الحلول",
      number: "02"
    },
    {
      icon: Rocket,
      title: "بدء التنفيذ",
      desc: "نبدأ العمل على مشروعك فوراً",
      number: "03"
    },
    {
      icon: CheckCircle,
      title: "التسليم والدعم",
      desc: "نسلم مشروعك ونوفر دعم مستمر",
      number: "04"
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
            كيف نعمل
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            خطوات بسيطة{" "}
            <span className="text-primary">لبدء مشروعك</span>
          </h2>
          <p className="text-muted-foreground">
            نجعل عملية التعاون معنا سهلة وواضحة من البداية للنهاية
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative text-center"
            >
              {/* Connector Line - hidden on mobile */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-0 w-full h-px bg-border -translate-x-1/2" />
              )}

              {/* Step Number */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-5">
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {step.number}
                </span>
                <step.icon className="w-10 h-10 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
