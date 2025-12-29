import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Settings, Users, BarChart3, HeadphonesIcon, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Settings,
    title: "حلول مُخصصة",
    description: "نصمم حلولًا تناسب احتياجاتك وأهدافك بدقة",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Users,
    title: "فريق محترف",
    description: "خبراء في التقنية والتصميم والتسويق الرقمي",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: BarChart3,
    title: "نتائج قابلة للقياس",
    description: "نركز على تحقيق أهداف واضحة ونتائج ملموسة",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: HeadphonesIcon,
    title: "دعم مستمر",
    description: "نوفر دعمًا فنيًا متواصلًا بعد إطلاق المشاريع",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Shield,
    title: "أمان وموثوقية",
    description: "نلتزم بأعلى معايير الأمان وحماية البيانات",
    color: "from-rose-500 to-red-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Zap,
    title: "سرعة التنفيذ",
    description: "نلتزم بالمواعيد مع الحفاظ على أعلى جودة",
    color: "from-indigo-500 to-violet-500",
    bgColor: "bg-indigo-500/10",
  },
];

const WhyChooseUsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      <div className="container px-5 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            لماذا نحن
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            لماذا تختار ماكسيو كور؟
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            نتميز بالتزامنا بالجودة والابتكار في كل مشروع نعمل عليه
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group"
            >
              <div className="relative h-full bg-card border border-border/50 rounded-2xl p-5 md:p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                {/* Icon Container */}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 md:w-7 md:h-7 text-transparent bg-gradient-to-br ${feature.color} bg-clip-text`} 
                    style={{ stroke: `url(#why-gradient-${index})` }}
                  />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id={`why-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={feature.color.includes("blue") ? "#3b82f6" : feature.color.includes("purple") ? "#a855f7" : feature.color.includes("emerald") ? "#10b981" : feature.color.includes("orange") ? "#f97316" : feature.color.includes("rose") ? "#f43f5e" : "#6366f1"} />
                        <stop offset="100%" stopColor={feature.color.includes("blue") ? "#06b6d4" : feature.color.includes("purple") ? "#ec4899" : feature.color.includes("emerald") ? "#14b8a6" : feature.color.includes("orange") ? "#f59e0b" : feature.color.includes("rose") ? "#ef4444" : "#8b5cf6"} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Gradient */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
