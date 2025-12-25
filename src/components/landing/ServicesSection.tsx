import { motion, useInView } from "framer-motion";
import { 
  Share2, 
  Code2, 
  Palette, 
  ArrowLeft,
  Sparkles,
  Instagram,
  Youtube,
  Twitter,
  Globe,
  Smartphone,
  Layout,
  PenTool,
  Layers,
  Monitor,
  Database,
  Rocket,
  LucideIcon,
  CheckCircle2,
  Zap,
  Star,
  TrendingUp
} from "lucide-react";
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
  bgGlow: string;
  link: string;
  features: { icon: LucideIcon; text: string }[];
  highlights: string[];
  badge?: string;
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "social",
    icon: Share2,
    title: "خدمات التواصل الاجتماعي",
    subtitle: "SMM Panel متكامل",
    description: "زيادة متابعين، لايكات، مشاهدات، وتفاعل حقيقي لجميع منصات التواصل الاجتماعي بأسعار تنافسية وجودة عالية.",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    bgGlow: "bg-blue-500/20",
    link: "/dashboard/services",
    badge: "الأكثر طلباً",
    features: [
      { icon: Instagram, text: "انستقرام" },
      { icon: Youtube, text: "يوتيوب" },
      { icon: Twitter, text: "تويتر" },
      { icon: Smartphone, text: "تيك توك" },
    ],
    highlights: ["تسليم سريع", "أسعار تنافسية", "دعم 24/7", "ضمان الجودة"]
  },
  {
    id: "development",
    icon: Code2,
    title: "البرمجة والتطوير",
    subtitle: "حلول تقنية احترافية",
    description: "تطوير مواقع ويب، تطبيقات موبايل، لوحات تحكم، وأنظمة برمجية متكاملة بأحدث التقنيات.",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    bgGlow: "bg-emerald-500/20",
    link: "/dashboard/dev-services",
    features: [
      { icon: Globe, text: "مواقع ويب" },
      { icon: Smartphone, text: "تطبيقات" },
      { icon: Layout, text: "لوحات تحكم" },
      { icon: Database, text: "أنظمة API" },
    ],
    highlights: ["كود نظيف", "تصميم متجاوب", "أداء عالي", "دعم فني"]
  },
  {
    id: "design",
    icon: Palette,
    title: "التصميم الإبداعي",
    subtitle: "هوية بصرية مميزة",
    description: "تصميم شعارات، هوية بصرية كاملة، تصاميم سوشيال ميديا، وجميع أنواع التصاميم الاحترافية.",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    bgGlow: "bg-purple-500/20",
    link: "/dashboard/design-services",
    features: [
      { icon: PenTool, text: "شعارات" },
      { icon: Layers, text: "هوية بصرية" },
      { icon: Monitor, text: "بوسترات" },
      { icon: Layout, text: "تصاميم سوشيال" },
    ],
    highlights: ["إبداع فريد", "تعديلات مجانية", "ملفات مفتوحة", "تسليم سريع"]
  },
];

const ServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.05 });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section ref={containerRef} className="py-20 sm:py-28 lg:py-36 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-[10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-[10%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.05, 0.12, 0.05],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)",
            filter: "blur(120px)",
          }}
        />
      </div>
      
      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14 sm:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">أقسام خدماتنا</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            ثلاثة أقسام،{" "}
            <span className="relative">
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
                آلاف الخدمات
              </span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-l from-primary via-accent to-primary rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed">
            اختر القسم الذي يناسب احتياجاتك وابدأ رحلتك نحو النجاح الرقمي
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {serviceCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -12 }}
              onHoverStart={() => setHoveredCard(category.id)}
              onHoverEnd={() => setHoveredCard(null)}
              className="group relative"
            >
              <div className="relative h-full p-6 sm:p-8 rounded-3xl bg-background/80 border border-border/50 hover:border-primary/50 transition-all duration-500 backdrop-blur-xl overflow-hidden">
                {/* Badge */}
                {category.badge && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 left-4 sm:top-6 sm:left-6"
                  >
                    <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-xs font-bold border border-warning/30">
                      {category.badge}
                    </span>
                  </motion.div>
                )}

                {/* Glow Effect */}
                <motion.div
                  className={`absolute -top-20 -right-20 w-40 h-40 ${category.bgGlow} rounded-full blur-3xl transition-opacity duration-500 ${
                    hoveredCard === category.id ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Icon */}
                <motion.div 
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${category.gradient} p-4 sm:p-5 mb-6 shadow-xl`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <category.icon className="w-full h-full text-white" />
                </motion.div>

                {/* Content */}
                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {category.title}
                  </h3>
                  <p className="text-sm text-primary/70 font-medium mb-3">
                    {category.subtitle}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {category.features.map((feature, i) => (
                    <motion.div 
                      key={feature.text}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.4 + index * 0.1 + i * 0.05 }}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.gradient}/20 flex items-center justify-center`}>
                        <feature.icon className="w-4 h-4 text-foreground" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {category.highlights.map((highlight, i) => (
                    <motion.span
                      key={highlight}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.5 + index * 0.1 + i * 0.05 }}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full bg-secondary/50 border border-border/50"
                    >
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      {highlight}
                    </motion.span>
                  ))}
                </div>

                {/* CTA */}
                <Link to={category.link}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      className={`w-full py-5 sm:py-6 bg-gradient-to-l ${category.gradient} text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl`}
                    >
                      <span>استكشف الخدمات</span>
                      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </Link>

                {/* Hover Border */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${category.gradient} transition-opacity duration-500 pointer-events-none ${
                    hoveredCard === category.id ? 'opacity-[0.06]' : 'opacity-0'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 sm:mt-20"
        >
          {/* Coming Soon */}
          <motion.div 
            className="inline-flex items-center gap-4 px-6 sm:px-8 py-4 rounded-2xl bg-gradient-to-l from-secondary/50 to-secondary/30 border border-border/50 backdrop-blur-sm mb-8"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Rocket className="w-6 h-6 text-primary" />
            </motion.div>
            <div className="text-right">
              <p className="text-sm sm:text-base font-bold text-foreground">قريباً... أقسام جديدة!</p>
              <p className="text-xs sm:text-sm text-muted-foreground">خدمات التسويق بالمحتوى، SEO، وأكثر</p>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-10"
          >
            {[
              { icon: Zap, value: "+100", label: "خدمة متاحة" },
              { icon: Star, value: "4.9", label: "تقييم العملاء" },
              { icon: TrendingUp, value: "99%", label: "معدل النجاح" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.1 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
