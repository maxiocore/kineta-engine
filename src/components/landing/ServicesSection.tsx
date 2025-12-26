import { motion, useInView } from "framer-motion";
import { Share2, Code2, Palette, ArrowLeft, Sparkles, CheckCircle2, LucideIcon, Loader2, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ServiceStats {
  totalOrders: number;
  completedOrders: number;
  activeServices: number;
}

interface ServiceCategory {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  bgGradient: string;
  iconBg: string;
  link: string;
  categoryFilter: string;
  highlights: string[];
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "social",
    icon: Share2,
    title: "التسويق الرقمي",
    subtitle: "انتشار سريع ومضمون",
    description: "عزّز تواجدك على منصات التواصل الاجتماعي مع خدمات تسويق احترافية",
    gradient: "from-cyan-500 to-blue-600",
    bgGradient: "from-cyan-500/10 to-blue-600/10",
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
    link: "/dashboard/services",
    categoryFilter: "social",
    highlights: ["تفعيل فوري", "جودة عالية", "دعم متواصل"],
  },
  {
    id: "development",
    icon: Code2,
    title: "البرمجة والتطوير",
    subtitle: "حلول تقنية متقدمة",
    description: "نطور لك مواقع وتطبيقات احترافية بأحدث التقنيات العالمية",
    gradient: "from-emerald-500 to-teal-600",
    bgGradient: "from-emerald-500/10 to-teal-600/10",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    link: "/dashboard/dev-services",
    categoryFilter: "development",
    highlights: ["كود نظيف", "أداء عالي", "صيانة مستمرة"],
  },
  {
    id: "design",
    icon: Palette,
    title: "التصميم الإبداعي",
    subtitle: "هوية بصرية مميزة",
    description: "نصمم لك هوية بصرية احترافية تعكس قيم علامتك التجارية",
    gradient: "from-violet-500 to-purple-600",
    bgGradient: "from-violet-500/10 to-purple-600/10",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    link: "/dashboard/design-services",
    categoryFilter: "design",
    highlights: ["إبداع فريد", "تعديلات مجانية", "تسليم سريع"],
  },
];

const useServiceStats = () => {
  return useQuery({
    queryKey: ["landing-service-stats"],
    queryFn: async (): Promise<Record<string, ServiceStats>> => {
      // Fetch orders count by category
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, status, service:services(category)");

      if (ordersError) throw ordersError;

      // Fetch active services count by category
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("id, category, status")
        .eq("status", "active");

      if (servicesError) throw servicesError;

      // Calculate stats for each category
      const stats: Record<string, ServiceStats> = {
        social: { totalOrders: 0, completedOrders: 0, activeServices: 0 },
        development: { totalOrders: 0, completedOrders: 0, activeServices: 0 },
        design: { totalOrders: 0, completedOrders: 0, activeServices: 0 },
      };

      // Count orders by category
      orders?.forEach((order: any) => {
        const category = order.service?.category?.toLowerCase() || "";
        let categoryKey = "social";
        
        if (category.includes("dev") || category.includes("programming") || category.includes("برمجة")) {
          categoryKey = "development";
        } else if (category.includes("design") || category.includes("تصميم")) {
          categoryKey = "design";
        }

        if (stats[categoryKey]) {
          stats[categoryKey].totalOrders++;
          if (order.status === "completed") {
            stats[categoryKey].completedOrders++;
          }
        }
      });

      // Count active services by category
      services?.forEach((service: any) => {
        const category = service.category?.toLowerCase() || "";
        let categoryKey = "social";
        
        if (category.includes("dev") || category.includes("programming") || category.includes("برمجة")) {
          categoryKey = "development";
        } else if (category.includes("design") || category.includes("تصميم")) {
          categoryKey = "design";
        }

        if (stats[categoryKey]) {
          stats[categoryKey].activeServices++;
        }
      });

      return stats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

const ServiceCard = ({ 
  category, 
  index, 
  isInView, 
  stats 
}: { 
  category: ServiceCategory; 
  index: number; 
  isInView: boolean;
  stats?: ServiceStats;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
      className="group relative"
    >
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${category.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
      
      <div className="relative h-full p-6 sm:p-8 rounded-3xl bg-card/90 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden">
        {/* Decorative Corner */}
        <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${category.gradient} opacity-5 rounded-br-full`} />
        
        {/* Header with Icon and Stats */}
        <div className="flex items-start justify-between mb-6">
          <motion.div 
            className={`${category.iconBg} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <category.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </motion.div>
          
          {/* Real-time Stats */}
          <div className="flex flex-col items-end gap-1">
            <motion.div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20"
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-success" />
              <span className="text-success font-bold text-sm">
                {stats?.totalOrders || 0}
              </span>
              <span className="text-muted-foreground text-xs">طلب</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-bold text-sm">
                {stats?.activeServices || 0}
              </span>
              <span className="text-muted-foreground text-xs">خدمة</span>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
            {category.title}
          </h3>
          <p className={`text-sm font-semibold mb-3 bg-gradient-to-l ${category.gradient} bg-clip-text text-transparent`}>
            {category.subtitle}
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {category.description}
          </p>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap gap-2 mb-6">
          {category.highlights.map((h, i) => (
            <motion.span 
              key={h}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/70 border border-border/50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.6 + index * 0.1 + i * 0.05 }}
            >
              <CheckCircle2 className="w-3 h-3 text-success" />
              {h}
            </motion.span>
          ))}
        </div>

        {/* CTA Button */}
        <Link to={category.link}>
          <Button 
            className={`w-full bg-gradient-to-l ${category.gradient} text-white rounded-xl py-5 sm:py-6 text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 group/btn`}
          >
            <span>استكشف الخدمات</span>
            <ArrowLeft className="w-5 h-5 mr-2 group-hover/btn:-translate-x-1 transition-transform" />
          </Button>
        </Link>

        {/* Completed Orders Badge */}
        {stats && stats.completedOrders > 0 && (
          <motion.div 
            className="absolute bottom-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 + index * 0.1 }}
          >
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">{stats.completedOrders} طلب مكتمل</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const ServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const { data: stats, isLoading } = useServiceStats();

  // Calculate totals
  const totalOrders = stats 
    ? Object.values(stats).reduce((sum, s) => sum + s.totalOrders, 0) 
    : 0;
  const totalServices = stats 
    ? Object.values(stats).reduce((sum, s) => sum + s.activeServices, 0) 
    : 0;
  const totalCompleted = stats 
    ? Object.values(stats).reduce((sum, s) => sum + s.completedOrders, 0) 
    : 0;

  return (
    <section ref={containerRef} className="py-16 sm:py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
      
      <div className="container px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary text-sm">خدماتنا المتميزة</span>
          </motion.div>
          
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            حلول رقمية{" "}
            <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              متكاملة
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed mb-8">
            نقدم لك باقة متنوعة من الخدمات الرقمية لتحقيق أهدافك وتنمية أعمالك
          </p>

          {/* Live Stats Summary */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">جاري تحميل الإحصائيات...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary">{totalOrders}</span>
                  <span className="text-muted-foreground text-sm">طلب إجمالي</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-emerald-500">{totalServices}</span>
                  <span className="text-muted-foreground text-sm">خدمة متاحة</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="font-bold text-success">{totalCompleted}</span>
                  <span className="text-muted-foreground text-sm">طلب مكتمل</span>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {serviceCategories.map((category, index) => (
            <ServiceCard 
              key={category.id} 
              category={category} 
              index={index}
              isInView={isInView}
              stats={stats?.[category.id]}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12 sm:mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
        >
          <Link to="/our-services">
            <Button 
              variant="outline" 
              size="lg"
              className="px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold rounded-2xl border-2 hover:bg-primary/5 hover:border-primary/50"
            >
              عرض جميع الخدمات
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
