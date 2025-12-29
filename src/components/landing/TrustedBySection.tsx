import { motion, useInView } from "framer-motion";
import { Building2, Users, TrendingUp, Award } from "lucide-react";
import { useRef } from "react";

const TrustedBySection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { icon: Users, value: "+500", label: "عميل نشط", color: "text-primary" },
    { icon: TrendingUp, value: "+1200", label: "مشروع منجز", color: "text-success" },
    { icon: Award, value: "100%", label: "نسبة الرضا", color: "text-warning" },
    { icon: Building2, value: "+50", label: "شركة شريكة", color: "text-accent" },
  ];

  const partners = [
    "شركة التقنية المتقدمة",
    "مؤسسة الإبداع الرقمي",
    "شركة الحلول الذكية",
    "مجموعة النجاح",
    "شركة الابتكار",
  ];

  return (
    <section ref={ref} className="py-12 sm:py-16 lg:py-20 bg-secondary/30">
      <div className="container px-4 sm:px-6">
        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center p-4 sm:p-6 rounded-2xl bg-card border border-border/50"
            >
              <div className={`w-12 h-12 rounded-xl bg-current/10 flex items-center justify-center mx-auto mb-3 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`text-2xl sm:text-3xl font-bold mb-1 ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Partners Marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-6">يثق بنا العديد من الشركات الرائدة</p>
          
          <div className="relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-secondary/30 to-transparent z-10" />
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-secondary/30 to-transparent z-10" />
            
            <div className="flex gap-8 animate-[marquee_20s_linear_infinite]">
              {[...partners, ...partners].map((partner, index) => (
                <div 
                  key={index}
                  className="flex-shrink-0 px-6 py-3 rounded-xl bg-card border border-border/30 text-muted-foreground text-sm font-medium whitespace-nowrap"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
};

export default TrustedBySection;
