import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Award, Globe, Shield, Star, Verified } from "lucide-react";

// Simulated partner/client logos as icons with company-like styling
const partners = [
  { name: "TechCorp", icon: "⚡", color: "from-blue-500 to-cyan-500" },
  { name: "DigitalPro", icon: "🚀", color: "from-violet-500 to-purple-500" },
  { name: "MediaHub", icon: "📱", color: "from-pink-500 to-rose-500" },
  { name: "CloudSync", icon: "☁️", color: "from-sky-500 to-blue-500" },
  { name: "DataFlow", icon: "📊", color: "from-emerald-500 to-teal-500" },
  { name: "SecureNet", icon: "🔒", color: "from-amber-500 to-orange-500" },
  { name: "InnovateTech", icon: "💡", color: "from-yellow-500 to-amber-500" },
  { name: "GlobalReach", icon: "🌐", color: "from-indigo-500 to-violet-500" },
];

const achievements = [
  { icon: Award, value: "+5", label: "سنوات خبرة", color: "text-amber-500" },
  { icon: Globe, value: "+15", label: "دولة", color: "text-blue-500" },
  { icon: Shield, value: "100%", label: "أمان", color: "text-emerald-500" },
  { icon: Star, value: "4.9", label: "تقييم", color: "text-violet-500" },
];

const TrustedBySection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  return (
    <section ref={containerRef} className="py-16 lg:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
      
      <div className="container relative z-10 px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Verified className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary text-sm">موثوق من الأفضل</span>
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4">
            شركاء النجاح{" "}
            <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
              حول العالم
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base lg:text-lg">
            نفتخر بثقة العديد من الشركات والمؤسسات الرائدة في خدماتنا
          </p>
        </motion.div>

        {/* Partners Marquee */}
        <div className="relative mb-16">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 lg:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 lg:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* First Row - Right to Left */}
          <div className="flex gap-6 lg:gap-8 mb-6 overflow-hidden">
            <motion.div
              className="flex gap-6 lg:gap-8"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            >
              {[...partners, ...partners].map((partner, index) => (
                <motion.div
                  key={`row1-${index}`}
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.1, y: -5 }}
                >
                  <div className={`
                    flex items-center gap-3 px-6 py-4 rounded-2xl 
                    bg-card/80 backdrop-blur-xl border border-border/50
                    hover:border-primary/30 transition-all duration-300
                    shadow-lg hover:shadow-xl
                  `}>
                    <div className={`
                      w-12 h-12 rounded-xl bg-gradient-to-br ${partner.color}
                      flex items-center justify-center text-2xl shadow-lg
                    `}>
                      {partner.icon}
                    </div>
                    <span className="font-bold text-sm lg:text-base whitespace-nowrap">
                      {partner.name}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* Second Row - Left to Right */}
          <div className="flex gap-6 lg:gap-8 overflow-hidden">
            <motion.div
              className="flex gap-6 lg:gap-8"
              animate={{ x: ["-50%", "0%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            >
              {[...partners.reverse(), ...partners].map((partner, index) => (
                <motion.div
                  key={`row2-${index}`}
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.1, y: -5 }}
                >
                  <div className={`
                    flex items-center gap-3 px-6 py-4 rounded-2xl 
                    bg-card/80 backdrop-blur-xl border border-border/50
                    hover:border-primary/30 transition-all duration-300
                    shadow-lg hover:shadow-xl
                  `}>
                    <div className={`
                      w-12 h-12 rounded-xl bg-gradient-to-br ${partner.color}
                      flex items-center justify-center text-2xl shadow-lg
                    `}>
                      {partner.icon}
                    </div>
                    <span className="font-bold text-sm lg:text-base whitespace-nowrap">
                      {partner.name}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Achievement Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative group"
              >
                <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-primary/30 transition-all duration-300 text-center">
                  <achievement.icon className={`w-8 h-8 mx-auto mb-3 ${achievement.color}`} />
                  <div className={`text-3xl lg:text-4xl font-black mb-1 ${achievement.color}`}>
                    {achievement.value}
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          {["SSL مؤمن", "دعم 24/7", "ضمان الجودة", "سرية تامة"].map((badge, i) => (
            <motion.div
              key={badge}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.9 + i * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20"
            >
              <Shield className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">{badge}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBySection;
