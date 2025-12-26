import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Share2, Code2, Palette, ArrowLeft, Sparkles, CheckCircle2, LucideIcon, Zap, Star, Users, TrendingUp, Rocket, Target, Award, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

interface ServiceCategory {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  glowColor: string;
  link: string;
  highlights: string[];
  badge?: string;
  stats: { value: string; label: string };
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "social",
    icon: Share2,
    title: "التسويق الرقمي",
    subtitle: "انتشار واسع وسريع",
    description: "نقدم لك أفضل حلول التسويق الرقمي لتعزيز تواجدك على جميع منصات التواصل الاجتماعي بنتائج مضمونة.",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    glowColor: "cyan",
    link: "/dashboard/services",
    badge: "🔥 الأكثر طلباً",
    highlights: ["تفعيل فوري", "ضمان الجودة", "أسعار منافسة", "دعم 24/7"],
    stats: { value: "+50K", label: "طلب ناجح" }
  },
  {
    id: "development",
    icon: Code2,
    title: "البرمجة والتطوير",
    subtitle: "تقنيات متطورة",
    description: "نبني لك مواقع وتطبيقات احترافية بأحدث التقنيات العالمية مع ضمان الأداء العالي والتوافق الكامل.",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    glowColor: "emerald",
    link: "/dashboard/dev-services",
    highlights: ["React & Next.js", "تطبيقات موبايل", "APIs متقدمة", "صيانة مستمرة"],
    stats: { value: "+300", label: "مشروع مكتمل" }
  },
  {
    id: "design",
    icon: Palette,
    title: "التصميم الإبداعي",
    subtitle: "هوية فريدة ومميزة",
    description: "نصمم لك هوية بصرية احترافية تعكس قيم علامتك التجارية وتجذب عملاءك المستهدفين بأسلوب إبداعي.",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    glowColor: "violet",
    link: "/dashboard/design-services",
    highlights: ["شعارات مميزة", "هوية متكاملة", "تصاميم سوشيال", "ملفات مفتوحة"],
    stats: { value: "+2K", label: "تصميم إبداعي" }
  },
];

const ServiceCard = ({ category, index, isInView }: { category: ServiceCategory; index: number; isInView: boolean }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay: index * 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative perspective-1000"
    >
      {/* Glow Effect */}
      <motion.div
        className={`absolute -inset-3 rounded-[2rem] bg-gradient-to-br ${category.gradient} blur-3xl transition-all duration-700`}
        animate={{ opacity: isHovered ? 0.4 : 0 }}
      />
      
      {/* Card */}
      <div className="relative h-full rounded-[2rem] bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-2xl border border-border/40 hover:border-primary/50 transition-all duration-500 overflow-hidden">
        {/* Top Gradient Bar */}
        <div className={`h-1.5 w-full bg-gradient-to-l ${category.gradient}`} />
        
        <div className="p-6 sm:p-8">
          {/* Animated Mesh Background */}
          <motion.div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(45deg, hsl(var(--primary)) 25%, transparent 25%),
                linear-gradient(-45deg, hsl(var(--primary)) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, hsl(var(--primary)) 75%),
                linear-gradient(-45deg, transparent 75%, hsl(var(--primary)) 75%)
              `,
              backgroundSize: "20px 20px",
            }}
            animate={{
              backgroundPosition: isHovered ? ["0px 0px", "20px 20px"] : "0px 0px",
            }}
            transition={{ duration: 3, repeat: isHovered ? Infinity : 0 }}
          />

          {/* Badge & Stats Row */}
          <div className="flex items-center justify-between mb-6">
            {category.badge && (
              <motion.span 
                className="px-4 py-2 rounded-full bg-gradient-to-l from-warning/20 to-amber-500/10 text-warning text-xs sm:text-sm font-bold border border-warning/30"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                {category.badge}
              </motion.span>
            )}
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20"
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success font-bold text-sm">{category.stats.value}</span>
              <span className="text-muted-foreground text-xs hidden sm:inline">{category.stats.label}</span>
            </motion.div>
          </div>

          {/* Icon with Animation */}
          <motion.div 
            className="relative mb-6"
            style={{ transform: "translateZ(50px)" }}
          >
            <motion.div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${category.gradient} p-5 sm:p-6 shadow-2xl`}
              whileHover={{ scale: 1.1, rotate: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                }}
              />
              <category.icon className="w-full h-full text-white relative z-10" />
            </motion.div>
            
            {/* Floating Particles */}
            {isHovered && (
              <>
                <motion.div
                  className={`absolute -top-2 -right-2 w-3 h-3 rounded-full bg-gradient-to-br ${category.gradient}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className={`absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-gradient-to-br ${category.gradient}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.7, x: [-3, 3, -3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
          </motion.div>

          {/* Content */}
          <div style={{ transform: "translateZ(30px)" }}>
            <motion.h3 
              className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300"
              animate={{ x: isHovered ? 5 : 0 }}
            >
              {category.title}
            </motion.h3>
            <p className={`text-sm font-semibold mb-4 bg-gradient-to-l ${category.gradient} bg-clip-text text-transparent`}>
              {category.subtitle}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6 text-sm sm:text-base">
              {category.description}
            </p>

            {/* Highlights with Stagger Animation */}
            <div className="grid grid-cols-2 gap-2 mb-8">
              {category.highlights.map((h, i) => (
                <motion.span 
                  key={h} 
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8 + index * 0.1 + i * 0.08 }}
                  whileHover={{ scale: 1.02, x: 3 }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span className="truncate">{h}</span>
                </motion.span>
              ))}
            </div>

            {/* CTA Button */}
            <Link to={category.link}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className={`w-full bg-gradient-to-l ${category.gradient} text-white rounded-xl py-5 sm:py-6 text-sm sm:text-base font-bold shadow-lg hover:shadow-2xl transition-all duration-300 group/btn`}>
                  <span>اكتشف المزيد</span>
                  <motion.div
                    className="mr-2"
                    animate={{ x: isHovered ? -8 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ArrowLeft className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
                  </motion.div>
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  const features = [
    { icon: Rocket, text: "تنفيذ سريع", color: "text-cyan-500" },
    { icon: Target, text: "نتائج مضمونة", color: "text-emerald-500" },
    { icon: Award, text: "جودة عالية", color: "text-violet-500" },
    { icon: Globe, text: "تغطية شاملة", color: "text-amber-500" },
  ];

  return (
    <section ref={containerRef} className="py-20 md:py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
        
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
        />
      </div>
      
      <div className="container px-4 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <span className="font-semibold text-primary">حلول رقمية شاملة</span>
          </motion.div>
          
          {/* Main Title */}
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            خدمات متكاملة{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                لنجاحك الرقمي
              </span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-l from-primary via-accent to-primary"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.6 }}
              />
            </span>
          </motion.h2>
          
          {/* Subtitle */}
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed mb-10"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
          >
            نقدم لك باقة متنوعة من الخدمات الرقمية المتميزة التي تساعدك على تحقيق أهدافك وتنمية أعمالك
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.text}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border/50 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <feature.icon className={`w-4 h-4 ${feature.color}`} />
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Service Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {serviceCategories.map((category, index) => (
            <ServiceCard 
              key={category.id} 
              category={category} 
              index={index}
              isInView={isInView}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2 }}
        >
          <Link to="/our-services">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-6 text-base font-semibold rounded-2xl border-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300"
              >
                <span>عرض جميع الخدمات</span>
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
