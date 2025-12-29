import { motion, useInView } from "framer-motion";
import { ArrowLeft, Sparkles, Shield, Zap, Clock, HeadphonesIcon, Award, TrendingUp, Users, CheckCircle2, Star, Rocket, Globe, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useRealStats = () => {
  return useQuery({
    queryKey: ["landing-real-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_stats");
      
      if (error) throw error;
      
      const stats = data as {
        total_orders: number;
        completed_orders: number;
        total_users: number;
        total_services: number;
        total_deposits: number;
      };
      
      const satisfactionRate = stats.total_orders > 0 
        ? Math.min(98, Math.round((stats.completed_orders / stats.total_orders) * 100)) 
        : 98;
      
      return {
        totalOrders: stats.total_orders || 0,
        completedOrders: stats.completed_orders || 0,
        totalUsers: stats.total_users || 0,
        totalServices: stats.total_services || 0,
        satisfactionRate,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

const features = [
  {
    icon: Zap,
    title: "تفعيل فوري",
    description: "نبدأ تنفيذ طلبك فور استلامه دون أي تأخير",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "أمان مضمون",
    description: "حماية كاملة لبياناتك ومعلوماتك الشخصية",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: HeadphonesIcon,
    title: "دعم متواصل",
    description: "فريق دعم فني متاح على مدار الساعة لمساعدتك",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: CreditCard,
    title: "دفع آمن",
    description: "طرق دفع متعددة وآمنة تناسب الجميع",
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-500/10",
  },
];

const benefits = [
  "أسعار تنافسية لا تُقارن",
  "ضمان جودة الخدمة",
  "استرداد المبلغ عند الحاجة",
  "تقارير مفصلة للطلبات",
  "واجهة سهلة الاستخدام",
  "تحديثات مستمرة",
];

const ServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const { data: stats, isLoading } = useRealStats();

  const statsData = [
    { 
      value: stats?.totalOrders || 0, 
      suffix: "+", 
      label: "طلب منفذ", 
      icon: Rocket,
      color: "text-primary" 
    },
    { 
      value: stats?.totalUsers || 0, 
      suffix: "+", 
      label: "عميل سعيد", 
      icon: Users,
      color: "text-emerald-500" 
    },
    { 
      value: stats?.totalServices || 0, 
      suffix: "+", 
      label: "خدمة متاحة", 
      icon: Globe,
      color: "text-violet-500" 
    },
    { 
      value: 100, 
      suffix: "%", 
      label: "نسبة الرضا", 
      icon: Star,
      color: "text-amber-500" 
    },
  ];

  return (
    <section ref={containerRef} className="py-12 xs:py-14 sm:py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>
      
      <div className="container px-3 xs:px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 xs:mb-10 sm:mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 xs:mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-primary" />
            <span className="font-semibold text-primary text-xs xs:text-sm">لماذا تختارنا؟</span>
          </motion.div>
          
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 xs:mb-4 sm:mb-6 px-2">
            منصة موثوقة{" "}
            <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              لنجاحك الرقمي
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed px-4">
            نوفر لك كل ما تحتاجه لتنمية حضورك الرقمي بجودة عالية وأسعار منافسة
          </p>
        </motion.div>

        {/* Live Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto mb-8 xs:mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative p-3 xs:p-4 sm:p-6 rounded-xl xs:rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 text-center group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <stat.icon className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 xs:mb-2 sm:mb-3 ${stat.color}`} />
              <div className={`text-lg xs:text-xl sm:text-3xl md:text-4xl font-bold ${stat.color} mb-0.5 xs:mb-1`}>
                {isLoading ? (
                  <span className="inline-block w-10 xs:w-12 h-6 xs:h-8 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    {stat.value.toLocaleString()}{stat.suffix}
                  </>
                )}
              </div>
              <p className="text-muted-foreground text-[10px] xs:text-xs sm:text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto mb-8 xs:mb-10 sm:mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="relative p-3 xs:p-4 sm:p-6 rounded-xl xs:rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className={`w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-lg xs:rounded-xl ${feature.bgColor} flex items-center justify-center mb-2.5 xs:mb-3 sm:mb-4`}>
                <feature.icon className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`} style={{ color: feature.color.includes('amber') ? '#f59e0b' : feature.color.includes('emerald') ? '#10b981' : feature.color.includes('blue') ? '#3b82f6' : '#8b5cf6' }} />
              </div>
              <h3 className="text-sm xs:text-base sm:text-lg font-bold mb-1 xs:mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-[10px] xs:text-xs sm:text-sm leading-relaxed line-clamp-3">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
        >
          <div className="relative p-4 xs:p-5 sm:p-8 md:p-10 rounded-2xl xs:rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
            <div className="absolute top-0 right-0 w-20 xs:w-24 sm:w-32 h-20 xs:h-24 sm:h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            
            <div className="flex flex-col gap-4 xs:gap-5 sm:gap-6 md:flex-row md:items-center md:gap-10">
              {/* Left Content */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 xs:gap-2 mb-3 xs:mb-4">
                  <Award className="w-5 h-5 xs:w-6 xs:h-6 text-primary" />
                  <h3 className="text-lg xs:text-xl sm:text-2xl font-bold">مميزات إضافية</h3>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit}
                      className="flex items-center gap-1.5 xs:gap-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.7 + index * 0.05 }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-success shrink-0" />
                      <span className="text-xs xs:text-sm sm:text-base">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right CTA */}
              <div className="flex flex-row xs:flex-col items-center justify-between xs:justify-center xs:items-center md:items-end gap-3 xs:gap-4 pt-3 xs:pt-0 border-t xs:border-t-0 border-border/30">
                <div className="text-center xs:text-right md:text-left">
                  <p className="text-muted-foreground text-xs xs:text-sm mb-0.5 xs:mb-1">ابدأ رحلتك الآن</p>
                  <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-primary">مجاناً!</p>
                </div>
                <Link to="/auth?mode=signup">
                  <Button 
                    size="lg"
                    className="px-4 xs:px-6 sm:px-8 py-4 xs:py-5 sm:py-6 text-xs xs:text-sm sm:text-base font-bold rounded-lg xs:rounded-xl bg-gradient-to-l from-primary to-accent hover:opacity-90 transition-opacity"
                  >
                    <span>سجل الآن</span>
                    <ArrowLeft className="w-4 h-4 xs:w-5 xs:h-5 mr-1.5 xs:mr-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-8 xs:mt-10 sm:mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
        >
          <Link to="/our-services">
            <Button 
              variant="outline" 
              size="lg"
              className="px-5 xs:px-6 sm:px-8 py-4 xs:py-5 sm:py-6 text-xs xs:text-sm sm:text-base font-semibold rounded-xl xs:rounded-2xl border-2 hover:bg-primary/5 hover:border-primary/50"
            >
              تصفح خدماتنا
              <ArrowLeft className="w-4 h-4 xs:w-5 xs:h-5 mr-1.5 xs:mr-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
