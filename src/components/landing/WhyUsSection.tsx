import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Zap, 
  Shield, 
  Clock, 
  HeadphonesIcon, 
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Award,
  Target,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Zap,
    title: "تنفيذ سريع ودقيق",
    description: "نبدأ العمل على مشروعك فوراً مع التزام صارم بالمواعيد والجودة العالية",
    highlights: ["بدء فوري", "تسليم سريع", "متابعة مستمرة"],
    color: "from-yellow-500 to-orange-500",
    iconBg: "bg-yellow-500/10 dark:bg-yellow-500/20",
    borderColor: "group-hover:border-yellow-500/30"
  },
  {
    icon: Shield,
    title: "ضمان الجودة الشامل",
    description: "نضمن لك جودة استثنائية في كل خدمة مع تعديلات مجانية حتى رضاك التام",
    highlights: ["ضمان 100%", "تعديلات مجانية", "جودة معتمدة"],
    color: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    borderColor: "group-hover:border-emerald-500/30"
  },
  {
    icon: Clock,
    title: "دعم على مدار الساعة",
    description: "فريقنا متاح 24/7 لخدمتك والرد على استفساراتك في أي وقت",
    highlights: ["دعم 24/7", "استجابة فورية", "متابعة دائمة"],
    color: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    borderColor: "group-hover:border-blue-500/30"
  },
  {
    icon: HeadphonesIcon,
    title: "فريق خبراء متخصص",
    description: "نخبة من المحترفين في التسويق والتصميم والبرمجة لتحقيق أهدافك",
    highlights: ["خبرة واسعة", "تخصصات متنوعة", "احترافية عالية"],
    color: "from-violet-500 to-purple-500",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    borderColor: "group-hover:border-violet-500/30"
  },
];

const additionalBenefits = [
  { icon: Award, text: "أفضل أسعار في السوق" },
  { icon: Target, text: "نتائج مضمونة وقابلة للقياس" },
  { icon: TrendingUp, text: "نمو مستمر لأعمالك" },
];

const WhyUsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-96 h-96 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.25) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 lg:mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6 lg:mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">لماذا نحن الخيار الأفضل</span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 lg:mb-6">
            مميزات تجعلنا{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                الخيار الأمثل
              </span>
              <motion.div
                className="absolute -bottom-1 lg:-bottom-2 left-0 right-0 h-1 bg-gradient-to-l from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            نقدم لك تجربة استثنائية تجمع بين الجودة والسرعة والدعم المتواصل
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 gap-4 lg:gap-6 max-w-5xl mx-auto mb-12 lg:mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="group"
            >
              <motion.div 
                className={`relative h-full p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 ${feature.borderColor} transition-all duration-500 overflow-hidden`}
                whileHover={{ y: -5 }}
              >
                {/* Background Glow */}
                <motion.div
                  className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.color} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4 lg:mb-5">
                    <motion.div
                      className={`flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br ${feature.color} p-3 shadow-lg`}
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <feature.icon className="w-full h-full text-white" />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg lg:text-xl font-bold mb-1 lg:mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, i) => (
                      <motion.div
                        key={highlight}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 + i * 0.1 }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${feature.iconBg} text-xs sm:text-sm font-medium`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        <span className="text-foreground/80">{highlight}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Bottom Gradient Line */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color}`}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{ transformOrigin: "right" }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Additional Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 mb-10 lg:mb-12"
        >
          {additionalBenefits.map((benefit, index) => (
            <motion.div
              key={benefit.text}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <benefit.icon className="w-4 h-4 text-primary" />
              </div>
              <span>{benefit.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex justify-center"
        >
          <Link to="/our-services">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <motion.div
                className="absolute -inset-1 rounded-2xl bg-gradient-to-l from-primary via-accent to-primary opacity-40 blur-lg group-hover:opacity-70 transition-opacity"
              />
              <Button 
                size="lg"
                className="relative bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-xl hover:shadow-2xl px-6 sm:px-8 py-5 sm:py-6 rounded-2xl text-base sm:text-lg font-bold"
              >
                <span>اكتشف جميع خدماتنا</span>
                <motion.div
                  animate={{ x: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mr-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Decorative Element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.1 }}
          className="flex justify-center mt-10 lg:mt-12"
        >
          <div className="flex items-center gap-3 text-muted-foreground">
            <motion.div 
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm">شريكك الموثوق للنجاح الرقمي</span>
            <motion.div 
              className="w-2 h-2 rounded-full bg-accent"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyUsSection;
