import { motion, useInView } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Shield, 
  Zap, 
  HeadphonesIcon, 
  Award, 
  Users, 
  CheckCircle2, 
  Star, 
  Rocket, 
  Globe, 
  CreditCard,
  Palette,
  Code,
  TrendingUp,
  Crown,
  Play,
  Gem,
  Target,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

const serviceCategories = [
  {
    id: "design",
    title: "التصميم الإبداعي",
    subtitle: "Creative Design",
    description: "تصاميم احترافية تعكس هويتك وتميز علامتك التجارية",
    icon: Palette,
    gradient: "from-rose-500 via-pink-500 to-violet-500",
    bgGlow: "bg-rose-500/20",
    features: ["شعارات وهويات", "سوشيال ميديا", "موشن جرافيك"],
    link: "/dashboard/design-services",
  },
  {
    id: "dev",
    title: "البرمجة والتطوير",
    subtitle: "Development",
    description: "حلول برمجية متكاملة بأحدث التقنيات العالمية",
    icon: Code,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    bgGlow: "bg-emerald-500/20",
    features: ["مواقع ويب", "تطبيقات جوال", "متاجر إلكترونية"],
    link: "/dashboard/dev-services",
  },
];

const features = [
  {
    icon: Zap,
    title: "تنفيذ سريع",
    description: "نبدأ فوراً دون تأخير",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "ضمان الجودة",
    description: "استرداد كامل مضمون",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: HeadphonesIcon,
    title: "دعم متواصل",
    description: "فريق متاح 24/7",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: CreditCard,
    title: "دفع آمن",
    description: "طرق دفع متعددة",
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-500/10",
  },
];

const benefits = [
  "أسعار تنافسية",
  "ضمان الجودة",
  "استرداد المبلغ",
  "تقارير مفصلة",
  "واجهة سهلة",
  "تحديثات مستمرة",
];

// Animated Service Card
const ServiceCard = ({ 
  service, 
  index, 
  isInView 
}: { 
  service: typeof serviceCategories[0]; 
  index: number; 
  isInView: boolean;
}) => {
  const IconComponent = service.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ 
        duration: 0.6, 
        delay: 0.2 + index * 0.15,
        type: "spring",
        stiffness: 100,
      }}
      className="group relative"
    >
      <Link to={service.link} className="block">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 p-5 sm:p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
          {/* Background Glow */}
          <div className={cn(
            "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500",
            service.bgGlow
          )} />
          
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className={cn(
              "absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r p-[1px]",
              service.gradient
            )}>
              <div className="h-full w-full rounded-2xl sm:rounded-3xl bg-card" />
            </div>
          </div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <motion.div 
                className={cn(
                  "w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                  service.gradient
                )}
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              
              <div className="flex-1">
                <motion.span 
                  className={cn(
                    "text-xs sm:text-sm font-medium bg-gradient-to-r bg-clip-text text-transparent",
                    service.gradient
                  )}
                >
                  {service.subtitle}
                </motion.span>
                <h3 className="text-lg sm:text-xl font-bold mt-1 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed">
              {service.description}
            </p>
            
            {/* Features */}
            <div className="space-y-2 mb-6">
              {service.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>
            
            {/* CTA */}
            <motion.div
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r opacity-80 group-hover:opacity-100 transition-opacity",
                service.gradient
              )}
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-white font-semibold text-sm sm:text-base">استكشف الخدمات</span>
              <ArrowLeft className="w-5 h-5 text-white group-hover:translate-x-[-4px] transition-transform" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const { data: stats, isLoading } = useRealStats();

  const getExecutedOrders = () => {
    const base = 2849;
    const startDate = new Date('2025-02-11');
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return base + Math.max(0, diffDays) * 2;
  };

  const statsData = [
    { 
      value: getExecutedOrders(), 
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
    <section ref={containerRef} className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
        <motion.div
          className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.3, 1], x: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
        />
      </div>
      
      <div className="container px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary text-sm">لماذا تختارنا؟</span>
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            منصة موثوقة{" "}
            <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              لنجاحك الرقمي
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
            نوفر لك خدمات التصميم والبرمجة بجودة عالية وأسعار منافسة
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 text-center group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <stat.icon className={cn("w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3", stat.color)} />
              <div className={cn("text-xl sm:text-2xl md:text-3xl font-bold mb-1", stat.color)}>
                {isLoading ? (
                  <span className="inline-block w-12 h-6 bg-muted animate-pulse rounded" />
                ) : (
                  <>{stat.value.toLocaleString()}{stat.suffix}</>
                )}
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Service Categories */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto mb-12 sm:mb-16">
          {serviceCategories.map((service, index) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              index={index} 
              isInView={isInView} 
            />
          ))}
        </div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="relative p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4",
                feature.bgColor
              )}>
                <feature.icon 
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ 
                    color: feature.color.includes('amber') ? '#f59e0b' : 
                           feature.color.includes('emerald') ? '#10b981' : 
                           feature.color.includes('blue') ? '#3b82f6' : '#8b5cf6' 
                  }} 
                />
              </div>
              <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
        >
          <div className="relative p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border border-primary/20">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
              {/* Left Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-6 h-6 text-primary" />
                  <h3 className="text-xl sm:text-2xl font-bold">مميزات إضافية</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.7 + index * 0.05 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span className="text-sm sm:text-base">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right CTA */}
              <div className="flex flex-row items-center justify-between md:flex-col md:items-end gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-border/30">
                <div className="text-center md:text-left">
                  <p className="text-muted-foreground text-sm mb-1">ابدأ رحلتك الآن</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">مجاناً!</p>
                </div>
                <Link to="/auth?mode=signup">
                  <Button 
                    size="lg"
                    className="px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold rounded-xl bg-gradient-to-l from-primary to-accent hover:opacity-90 transition-opacity"
                  >
                    <span>سجل الآن</span>
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-10 sm:mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
        >
          <Link to="/our-services">
            <Button 
              variant="outline" 
              size="lg"
              className="px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl border-2 hover:bg-primary/5 hover:border-primary/50"
            >
              تصفح جميع خدماتنا
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
