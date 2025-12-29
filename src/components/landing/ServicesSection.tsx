import { motion, useInView } from "framer-motion";
import { Share2, Code2, Palette, Globe, ArrowLeft, Sparkles, Zap, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

const ServicesSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const services = [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      subtitle: "نمو سريع ومستدام",
      desc: "نصمم حملات تسويقية ذكية تصل بعلامتك لملايين العملاء المحتملين",
      color: "from-blue-500 via-blue-600 to-cyan-500",
      lightColor: "blue",
      stats: "+300% نمو",
      users: "15K+ عميل",
      href: "/digital-marketing-services"
    },
    { 
      icon: Code2, 
      title: "التطوير والبرمجة",
      subtitle: "حلول تقنية متقدمة",
      desc: "نبني تطبيقات ومواقع احترافية بأحدث التقنيات العالمية",
      color: "from-emerald-500 via-emerald-600 to-teal-500",
      lightColor: "emerald",
      stats: "+200 مشروع",
      users: "99% رضا",
      href: "/development-services"
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      subtitle: "هويات لا تُنسى",
      desc: "نصمم هويات بصرية مميزة تعكس شخصية علامتك التجارية",
      color: "from-violet-500 via-purple-600 to-pink-500",
      lightColor: "violet",
      stats: "+500 تصميم",
      users: "100+ هوية",
      href: "/design-services"
    },
    { 
      icon: Globe, 
      title: "خدمات السوشيال",
      subtitle: "تواجد رقمي قوي",
      desc: "نزيد متابعيك ونبني لك حضوراً قوياً على جميع المنصات",
      color: "from-amber-500 via-orange-500 to-red-500",
      lightColor: "amber",
      stats: "+1M متابع",
      users: "5K+ حساب",
      href: "/social-media-services"
    },
  ];

  return (
    <section ref={ref} className="py-20 sm:py-28 lg:py-32 relative overflow-hidden" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 sm:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-violet-500/10 to-pink-500/10 border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              خدمات احترافية متكاملة
            </span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-6 leading-tight">
            <span className="text-foreground">كل ما تحتاجه</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-500 to-pink-500 bg-clip-text text-transparent">
              في مكان واحد
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            نقدم لك باقة متكاملة من الخدمات الرقمية المصممة خصيصاً لتحقيق أهداف أعمالك
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Link to={service.href} className="block h-full">
                  <div className="group relative h-full p-6 sm:p-8 rounded-3xl bg-card border border-border/50 hover:border-transparent transition-all duration-500 overflow-hidden">
                    {/* Hover Gradient Background */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`}
                    />
                    
                    {/* Glow Effect */}
                    <motion.div
                      initial={false}
                      animate={{ 
                        opacity: hoveredIndex === index ? 0.15 : 0,
                        scale: hoveredIndex === index ? 1 : 0.8
                      }}
                      className={`absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br ${service.color} rounded-full blur-3xl`}
                    />

                    <div className="relative z-10">
                      {/* Top Row */}
                      <div className="flex items-start justify-between mb-6">
                        <motion.div 
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${service.color} p-3.5 sm:p-4 shadow-lg`}
                        >
                          <Icon className="w-full h-full text-white" />
                        </motion.div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1.5 rounded-full bg-${service.lightColor}-500/10 text-${service.lightColor}-600 dark:text-${service.lightColor}-400 text-xs font-bold`}>
                            {service.stats}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-6">
                        <span className={`text-xs font-semibold uppercase tracking-wider bg-gradient-to-r ${service.color} bg-clip-text text-transparent`}>
                          {service.subtitle}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-2 mb-3 group-hover:text-primary transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {service.desc}
                        </p>
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{service.users}</span>
                        </div>
                        
                        <motion.div 
                          className="flex items-center gap-2 text-primary font-semibold"
                          whileHover={{ x: -5 }}
                        >
                          <span className="text-sm">اكتشف المزيد</span>
                          <ArrowLeft className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/5 via-violet-500/5 to-pink-500/5 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">هل تحتاج مساعدة؟</p>
                <p className="font-semibold text-foreground">تواصل معنا الآن</p>
              </div>
            </div>
            
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button 
                asChild 
                size="lg" 
                className="h-12 sm:h-14 px-8 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 font-semibold shadow-lg shadow-primary/25 group"
              >
                <Link to="/our-services" className="flex items-center gap-2">
                  <span>عرض جميع الخدمات</span>
                  <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-12 sm:mt-16"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-amber-500" />
            <span>تقييم 4.9/5</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-primary" />
            <span>+50,000 عميل</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span>تنفيذ سريع</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
