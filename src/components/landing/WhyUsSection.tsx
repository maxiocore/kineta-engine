import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Zap, 
  Shield, 
  Clock, 
  HeadphonesIcon, 
  Sparkles, 
  Target,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Award
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "سرعة فائقة",
    description: "تنفيذ فوري مع التزام صارم بالمواعيد",
    highlights: ["بدء فوري", "تسليم سريع"],
    gradient: "from-amber-500 via-orange-500 to-red-500",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    stat: "24/7",
    statLabel: "متاح"
  },
  {
    icon: Shield,
    title: "ضمان الجودة",
    description: "جودة عالية مع تعديلات مجانية حتى الرضا",
    highlights: ["ضمان شامل", "تعديلات مجانية"],
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    stat: "100%",
    statLabel: "رضا"
  },
  {
    icon: Clock,
    title: "دعم متواصل",
    description: "فريق جاهز لخدمتك في أي وقت",
    highlights: ["دعم 24/7", "استجابة سريعة"],
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    stat: "5",
    statLabel: "دقائق استجابة"
  },
  {
    icon: HeadphonesIcon,
    title: "خبراء متخصصون",
    description: "نخبة من المتخصصين لتحقيق أهدافك",
    highlights: ["خبرة واسعة", "احترافية"],
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    stat: "+50",
    statLabel: "خبير"
  },
  {
    icon: TrendingUp,
    title: "نتائج مضمونة",
    description: "نركز على تحقيق أهدافك ونمو أعمالك",
    highlights: ["نمو مستمر", "تقارير دورية"],
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
    stat: "+200%",
    statLabel: "نمو"
  },
  {
    icon: Award,
    title: "أسعار تنافسية",
    description: "أفضل الأسعار مع جودة لا تُضاهى",
    highlights: ["عروض مميزة", "قيمة حقيقية"],
    gradient: "from-cyan-500 via-sky-500 to-blue-500",
    iconBg: "bg-gradient-to-br from-cyan-500 to-sky-600",
    stat: "50%",
    statLabel: "توفير"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20
    }
  }
};

const WhyUsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <section ref={containerRef} className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
      
      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)" }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-64 h-64 md:w-80 md:h-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.1) 0%, transparent 70%)" }}
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-semibold text-primary">مميزاتنا</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            لماذا{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                تختارنا؟
              </span>
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-l from-primary to-accent rounded-full"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            نقدم لك تجربة استثنائية تجمع بين الجودة والسرعة والدعم المتواصل
          </p>
        </motion.div>

        {/* Features Grid - 2 columns on mobile, 3 on desktop */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 lg:gap-6 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group"
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="relative h-full p-4 md:p-6 rounded-2xl md:rounded-3xl bg-card/70 backdrop-blur-sm border border-border/40 hover:border-primary/40 transition-all duration-500 overflow-hidden">
                {/* Hover Gradient Background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`}
                />
                
                {/* Corner Glow */}
                <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />

                <div className="relative z-10">
                  {/* Icon & Stat Row */}
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <motion.div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${feature.iconBg} p-2 md:p-2.5 shadow-lg`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <feature.icon className="w-full h-full text-white" />
                    </motion.div>
                    
                    {/* Stat Badge */}
                    <motion.div 
                      className="text-left"
                    initial={{ opacity: 0, x: 10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.2 + index * 0.03 }}
                  >
                      <div className={`text-lg md:text-xl font-bold bg-gradient-to-l ${feature.gradient} bg-clip-text text-transparent`}>
                        {feature.stat}
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">
                        {feature.statLabel}
                      </div>
                    </motion.div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm md:text-lg font-bold mb-1.5 md:mb-2 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-3 md:mb-4 line-clamp-2">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {feature.highlights.map((highlight, i) => (
                      <motion.div
                        key={highlight}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.2, delay: 0.2 + index * 0.02 + i * 0.05 }}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/60 text-[10px] md:text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
                        <span>{highlight}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Bottom Animated Line */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient}`}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{ transformOrigin: "right" }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex justify-center mt-10 md:mt-14"
        >
          <motion.a
            href="/services"
            className="group inline-flex items-center gap-2.5 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold text-sm md:text-base shadow-xl hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>اكتشف خدماتنا</span>
            <motion.div
              animate={{ x: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </motion.div>
          </motion.a>
        </motion.div>

        {/* Bottom Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-8 md:mt-10"
        >
          <div className="flex items-center gap-3 text-muted-foreground">
            <motion.div 
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs md:text-sm">شريكك الموثوق للنجاح الرقمي</span>
            <motion.div 
              className="w-1.5 h-1.5 rounded-full bg-accent"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyUsSection;
