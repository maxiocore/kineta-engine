import { motion, useInView } from "framer-motion";
import { Share2, Code2, Palette, ArrowLeft, Sparkles, CheckCircle2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";

interface ServiceCategory {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  link: string;
  highlights: string[];
  badge?: string;
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "social",
    icon: Share2,
    title: "خدمات التواصل الاجتماعي",
    subtitle: "SMM Panel متكامل",
    description: "زيادة متابعين، لايكات، مشاهدات، وتفاعل حقيقي لجميع منصات التواصل الاجتماعي.",
    gradient: "from-primary to-accent",
    link: "/dashboard/services",
    badge: "الأكثر طلباً",
    highlights: ["تسليم سريع", "أسعار تنافسية", "دعم 24/7", "ضمان الجودة"]
  },
  {
    id: "development",
    icon: Code2,
    title: "البرمجة والتطوير",
    subtitle: "حلول تقنية احترافية",
    description: "تطوير مواقع ويب، تطبيقات موبايل، لوحات تحكم، وأنظمة برمجية متكاملة.",
    gradient: "from-emerald-500 to-teal-500",
    link: "/dashboard/dev-services",
    highlights: ["كود نظيف", "تصميم متجاوب", "أداء عالي", "دعم فني"]
  },
  {
    id: "design",
    icon: Palette,
    title: "التصميم الإبداعي",
    subtitle: "هوية بصرية مميزة",
    description: "تصميم شعارات، هوية بصرية كاملة، تصاميم سوشيال ميديا احترافية.",
    gradient: "from-violet-500 to-purple-500",
    link: "/dashboard/design-services",
    highlights: ["إبداع فريد", "تعديلات مجانية", "ملفات مفتوحة", "تسليم سريع"]
  },
];

const ServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  return (
    <section ref={containerRef} className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="badge-premium mb-6 mx-auto w-fit">
            <Sparkles className="w-4 h-4" />
            <span>أقسام خدماتنا</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            ثلاثة أقسام، <span className="text-gradient">آلاف الخدمات</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            اختر القسم الذي يناسب احتياجاتك وابدأ رحلتك نحو النجاح
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {serviceCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="relative h-full p-6 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-card hover:shadow-elevated">
                {category.badge && (
                  <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-warning/15 text-warning text-xs font-semibold">
                    {category.badge}
                  </span>
                )}

                <motion.div 
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} p-3 mb-5 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <category.icon className="w-full h-full text-white" />
                </motion.div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-primary font-medium mb-3">{category.subtitle}</p>
                <p className="text-muted-foreground mb-5">{category.description}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {category.highlights.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      {h}
                    </span>
                  ))}
                </div>

                <Link to={category.link}>
                  <Button className={`w-full bg-gradient-to-l ${category.gradient} text-white rounded-xl`}>
                    استكشف الخدمات
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
