import { motion, useInView } from "framer-motion";
import { Zap, Shield, Users, Award, Clock, HeartHandshake } from "lucide-react";
import { useRef } from "react";

const WhyUsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: Zap,
      title: "سرعة التنفيذ",
      desc: "نلتزم بتسليم مشاريعك في الوقت المحدد مع أعلى معايير الجودة",
      color: "bg-amber-500/10 text-amber-500"
    },
    {
      icon: Shield,
      title: "أمان وخصوصية",
      desc: "نحمي بياناتك ومعلوماتك بأحدث تقنيات الأمان والتشفير",
      color: "bg-emerald-500/10 text-emerald-500"
    },
    {
      icon: Users,
      title: "فريق متخصص",
      desc: "خبراء محترفون في مختلف المجالات لتقديم أفضل الحلول",
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      icon: Award,
      title: "جودة مضمونة",
      desc: "نضمن لك جودة العمل مع إمكانية التعديل حتى رضاك التام",
      color: "bg-violet-500/10 text-violet-500"
    },
    {
      icon: Clock,
      title: "دعم متواصل",
      desc: "فريق دعم فني متاح على مدار الساعة للإجابة على استفساراتك",
      color: "bg-rose-500/10 text-rose-500"
    },
    {
      icon: HeartHandshake,
      title: "أسعار منافسة",
      desc: "خدمات احترافية بأسعار تنافسية تناسب جميع الميزانيات",
      color: "bg-cyan-500/10 text-cyan-500"
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 bg-secondary/30">
      <div className="container px-4 sm:px-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            لماذا نحن؟
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            مميزات تجعلنا{" "}
            <span className="text-primary">الخيار الأفضل</span>
          </h2>
          <p className="text-muted-foreground">
            نتميز بمجموعة من المزايا التي تضمن لك تجربة استثنائية
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-5 sm:p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
