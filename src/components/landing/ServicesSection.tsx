import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Share2, Code2, Palette, ArrowLeft, Sparkles, CheckCircle2, LucideIcon, Zap, Star, Users, TrendingUp } from "lucide-react";
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
    subtitle: "SMM Panel احترافي",
    description: "عزّز حضورك الرقمي مع خدمات التسويق المتكاملة. زيادة متابعين، لايكات، ومشاهدات حقيقية لجميع المنصات.",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    glowColor: "cyan",
    link: "/dashboard/services",
    badge: "⭐ الأكثر طلباً",
    highlights: ["تسليم فوري", "أسعار منافسة", "دعم متواصل", "جودة عالية"],
    stats: { value: "+50K", label: "طلب مكتمل" }
  },
  {
    id: "development",
    icon: Code2,
    title: "البرمجة والتطوير",
    subtitle: "حلول تقنية متقدمة",
    description: "حوّل أفكارك إلى واقع رقمي. نطور مواقع ويب، تطبيقات موبايل، وأنظمة برمجية بأحدث التقنيات.",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    glowColor: "emerald",
    link: "/dashboard/dev-services",
    highlights: ["كود احترافي", "تصميم متجاوب", "أداء فائق", "دعم مستمر"],
    stats: { value: "+200", label: "مشروع ناجح" }
  },
  {
    id: "design",
    icon: Palette,
    title: "التصميم الإبداعي",
    subtitle: "إبداع بلا حدود",
    description: "صمم هويتك البصرية المميزة. شعارات احترافية، تصاميم سوشيال ميديا، وهوية بصرية متكاملة.",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    glowColor: "violet",
    link: "/dashboard/design-services",
    highlights: ["إبداع فريد", "تعديلات مجانية", "ملفات مفتوحة", "تسليم سريع"],
    stats: { value: "+1K", label: "تصميم مميز" }
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
      initial={{ opacity: 0, y: 50, rotateX: 10 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative perspective-1000"
    >
      {/* Glow Effect */}
      <motion.div
        className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${category.gradient} opacity-0 blur-2xl transition-all duration-500`}
        animate={{ opacity: isHovered ? 0.3 : 0 }}
      />
      
      {/* Card */}
      <div className="relative h-full p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 hover:border-primary/40 transition-all duration-500 overflow-hidden">
        {/* Animated Background Pattern */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
          animate={{
            backgroundPosition: isHovered ? ["0% 0%", "50% 50%"] : "0% 0%",
          }}
          transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
        />

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background: "linear-gradient(105deg, transparent 40%, hsl(var(--primary) / 0.08) 50%, transparent 60%)",
          }}
          animate={{
            x: isHovered ? ["0%", "200%"] : "0%",
          }}
          transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, repeatDelay: 0.5 }}
        />

        {/* Badge */}
        {category.badge && (
          <motion.span 
            className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-gradient-to-l from-warning/20 to-warning/10 text-warning text-xs font-bold border border-warning/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            {category.badge}
          </motion.span>
        )}

        {/* Stats Badge */}
        <motion.div
          className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 text-xs font-semibold"
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.6 + index * 0.1 }}
        >
          <TrendingUp className="w-3 h-3 text-success" />
          <span className="text-success">{category.stats.value}</span>
          <span className="text-muted-foreground">{category.stats.label}</span>
        </motion.div>

        {/* Icon */}
        <motion.div 
          className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${category.gradient} p-5 mb-6 shadow-2xl mt-8`}
          style={{ transform: "translateZ(40px)" }}
          whileHover={{ scale: 1.1, rotate: 8 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl bg-white/20"
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <category.icon className="w-full h-full text-white relative z-10" />
        </motion.div>

        {/* Content */}
        <div style={{ transform: "translateZ(20px)" }}>
          <motion.h3 
            className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors"
            animate={{ x: isHovered ? 5 : 0 }}
          >
            {category.title}
          </motion.h3>
          <p className={`text-sm font-semibold mb-4 bg-gradient-to-l ${category.gradient} bg-clip-text text-transparent`}>
            {category.subtitle}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            {category.description}
          </p>

          {/* Highlights */}
          <div className="flex flex-wrap gap-2 mb-8">
            {category.highlights.map((h, i) => (
              <motion.span 
                key={h} 
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/80 border border-border/50 hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.7 + index * 0.1 + i * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                {h}
              </motion.span>
            ))}
          </div>

          {/* Button */}
          <Link to={category.link}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className={`w-full bg-gradient-to-l ${category.gradient} text-white rounded-xl py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow`}>
                <span>استكشف الخدمات</span>
                <motion.div
                  animate={{ x: isHovered ? -8 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </motion.div>
              </Button>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const ServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  const floatingIcons = [
    { icon: Star, x: "10%", y: "20%", delay: 0 },
    { icon: Zap, x: "85%", y: "15%", delay: 0.5 },
    { icon: Users, x: "5%", y: "70%", delay: 1 },
    { icon: Sparkles, x: "90%", y: "75%", delay: 1.5 },
  ];

  return (
    <section ref={containerRef} className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 50%, hsl(var(--primary) / 0.1) 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Floating Icons */}
      {floatingIcons.map((item, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: item.delay }}
        >
          <item.icon className="w-8 h-8 text-primary/30" />
        </motion.div>
      ))}
      
      <div className="container px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div 
            className="badge-premium mb-6 mx-auto w-fit"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <span>خدماتنا المتميزة</span>
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            ثلاثة أقسام رئيسية،{" "}
            <span className="relative inline-block">
              <span className="text-gradient">آلاف الإمكانيات</span>
              <motion.svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : {}}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <motion.path
                  d="M2 6C40 2 80 2 100 4C120 6 160 4 198 2"
                  stroke="url(#underline-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="50%" stopColor="hsl(var(--accent))" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
          >
            اختر القسم المناسب لاحتياجاتك وانطلق في رحلة نجاحك الرقمي معنا
          </motion.p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {serviceCategories.map((category, index) => (
            <ServiceCard 
              key={category.id} 
              category={category} 
              index={index}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
