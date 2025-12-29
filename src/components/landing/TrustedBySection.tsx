import { motion, useInView } from "framer-motion";
import { Sparkles, Zap, Shield, Globe, ArrowLeft, CheckCircle2, Play } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TrustedBySection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: 0,
      icon: Zap,
      title: "تسويق رقمي متقدم",
      subtitle: "استراتيجيات تسويق ذكية",
      description: "نوصل علامتك التجارية لجمهورك المستهدف من خلال حملات إعلانية مدروسة على جميع المنصات الرقمية مع تحليلات دقيقة لقياس النتائج.",
      highlights: ["إعلانات Google & Meta", "تحسين محركات البحث", "إدارة المحتوى", "تحليل البيانات"],
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      stats: { value: "+300%", label: "زيادة في المبيعات" }
    },
    {
      id: 1,
      icon: Globe,
      title: "تطوير وبرمجة",
      subtitle: "حلول تقنية متكاملة",
      description: "نبني لك تطبيقات ومواقع احترافية بأحدث التقنيات العالمية مع ضمان الأداء العالي والأمان الكامل والتوافق مع جميع الأجهزة.",
      highlights: ["تطبيقات الويب", "تطبيقات الموبايل", "أنظمة مخصصة", "API متقدمة"],
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-500/10",
      stats: { value: "+200", label: "مشروع منجز" }
    },
    {
      id: 2,
      icon: Sparkles,
      title: "تصميم إبداعي",
      subtitle: "هويات بصرية لا تُنسى",
      description: "نصمم هويات بصرية مميزة تعكس شخصية علامتك التجارية وتترك انطباعاً قوياً لدى عملائك مع تصاميم عصرية ومبتكرة.",
      highlights: ["الهوية البصرية", "تصميم UI/UX", "الموشن جرافيك", "المطبوعات"],
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-500/10",
      stats: { value: "+500", label: "تصميم احترافي" }
    },
    {
      id: 3,
      icon: Shield,
      title: "خدمات السوشيال",
      subtitle: "تواجد رقمي قوي",
      description: "نبني لك حضوراً قوياً على جميع منصات التواصل الاجتماعي مع محتوى جذاب وتفاعل حقيقي يزيد من قاعدة متابعيك.",
      highlights: ["زيادة المتابعين", "إدارة الحسابات", "المحتوى الإبداعي", "التفاعل والنمو"],
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-500/10",
      stats: { value: "+1M", label: "متابع جديد" }
    },
  ];

  const activeFeature = features[activeTab];
  const ActiveIcon = activeFeature.icon;

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-28 bg-muted/30 overflow-hidden" dir="rtl">
      <div className="container px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary mb-6"
          >
            <Play className="w-3.5 h-3.5" />
            خدماتنا المميزة
          </motion.span>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            حلول رقمية{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              شاملة ومتكاملة
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            نقدم مجموعة متكاملة من الخدمات الرقمية التي تلبي جميع احتياجات أعمالك
          </p>
        </motion.div>

        {/* Interactive Content */}
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-14"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.button
                  key={feature.id}
                  onClick={() => setActiveTab(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                    activeTab === index
                      ? `bg-gradient-to-r ${feature.color} text-white shadow-lg`
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{feature.title}</span>
                  <span className="sm:hidden">{feature.title.split(" ")[0]}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Content Card */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center p-6 sm:p-10 lg:p-14 rounded-3xl bg-card border border-border/50 shadow-xl">
              {/* Left Content */}
              <div className="order-2 lg:order-1">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${activeFeature.bgColor} mb-6`}>
                  <ActiveIcon className={`w-5 h-5 bg-gradient-to-r ${activeFeature.color} bg-clip-text`} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' }} />
                  <span className={`text-sm font-semibold bg-gradient-to-r ${activeFeature.color} bg-clip-text text-transparent`}>
                    {activeFeature.subtitle}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  {activeFeature.title}
                </h3>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                  {activeFeature.description}
                </p>

                {/* Highlights */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {activeFeature.highlights.map((highlight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="flex items-center gap-2 text-sm sm:text-base"
                    >
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground font-medium">{highlight}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    asChild 
                    size="lg" 
                    className={`h-12 sm:h-14 px-6 sm:px-8 rounded-xl bg-gradient-to-r ${activeFeature.color} hover:opacity-90 text-white font-semibold shadow-lg group`}
                  >
                    <Link to="/our-services" className="flex items-center gap-2">
                      <span>اكتشف المزيد</span>
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
              </div>

              {/* Right Visual */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  {/* Background Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${activeFeature.color} opacity-20 rounded-3xl blur-3xl`} />
                  
                  {/* Main Visual */}
                  <div className="relative aspect-square max-w-sm mx-auto">
                    {/* Animated Rings */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-4 sm:inset-8 rounded-full border-2 border-dashed border-primary/15"
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-8 sm:inset-16 rounded-full border-2 border-dashed border-primary/10"
                    />

                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${activeFeature.color} shadow-2xl flex items-center justify-center`}
                      >
                        <ActiveIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                      </motion.div>
                    </div>

                    {/* Floating Stats */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="absolute -bottom-4 -right-4 sm:bottom-4 sm:right-0 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-card border border-border shadow-xl"
                    >
                      <div className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${activeFeature.color} bg-clip-text text-transparent`}>
                        {activeFeature.stats.value}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {activeFeature.stats.label}
                      </div>
                    </motion.div>

                    {/* Floating Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="absolute -top-2 -left-2 sm:top-4 sm:left-0 px-3 sm:px-4 py-2 rounded-xl bg-card border border-border shadow-lg flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs sm:text-sm font-medium text-foreground">متاح الآن</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
