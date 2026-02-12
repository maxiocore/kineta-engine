import { useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Globe,
  Rocket,
  Zap,
  Shield,
  Star,
  Sparkles,
  Eye,
  TrendingUp,
  Building2,
  Code,
  Smartphone,
  Lock,
  BarChart3,
  Users,
  Cpu,
  Handshake,
  Gem,
  Palette,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

interface ProjectFeature {
  icon: React.ReactNode;
  title: string;
}

interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  category: string;
  icon: React.ReactNode;
  iconBg: string;
  tags: string[];
  highlights: ProjectFeature[];
  color: string;
}

const projects: Project[] = [
  {
    id: "numaxio",
    title: "Numaxio",
    subtitle: "منصة رقمية متكاملة",
    description: "منصة رقمية متكاملة تقدم حلولاً مبتكرة وخدمات تقنية متقدمة لتمكين الشركات من تحقيق أهدافها الرقمية.",
    url: "https://numaxio.com",
    category: "منتج رقمي",
    icon: <Layers className="w-8 h-8" />,
    iconBg: "from-cyan-500 to-blue-600",
    tags: ["تطوير ويب", "UI/UX", "سحابية", "SaaS"],
    highlights: [
      { icon: <Code className="w-4 h-4" />, title: "تطوير متقدم" },
      { icon: <Smartphone className="w-4 h-4" />, title: "تصميم متجاوب" },
      { icon: <Zap className="w-4 h-4" />, title: "أداء فائق" },
      { icon: <Lock className="w-4 h-4" />, title: "حماية متقدمة" },
      { icon: <Cpu className="w-4 h-4" />, title: "ذكاء اصطناعي" },
      { icon: <Users className="w-4 h-4" />, title: "تجربة مستخدم" },
    ],
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "ash-holdings",
    title: "ASH Holdings",
    subtitle: "الموقع الرسمي للشركة الأم",
    description: "الموقع الرسمي لشركة ASH Holdings الاستثمارية، يعرض رؤية الشركة ومحفظتها الاستثمارية بتصميم احترافي.",
    url: "https://ash.holdings",
    category: "موقع مؤسسي",
    icon: <Building2 className="w-8 h-8" />,
    iconBg: "from-amber-500 to-orange-600",
    tags: ["استثمار", "هوية مؤسسية", "أعمال"],
    highlights: [
      { icon: <Building2 className="w-4 h-4" />, title: "هوية مؤسسية" },
      { icon: <BarChart3 className="w-4 h-4" />, title: "عرض المحفظة" },
      { icon: <Globe className="w-4 h-4" />, title: "متعدد اللغات" },
      { icon: <Handshake className="w-4 h-4" />, title: "شراكات فعالة" },
      { icon: <TrendingUp className="w-4 h-4" />, title: "نمو مستدام" },
      { icon: <Gem className="w-4 h-4" />, title: "تصميم فاخر" },
    ],
    color: "from-amber-500 to-orange-600",
  },
];

const stats = [
  { number: "+50", label: "مشروع منجز", icon: <Rocket className="w-5 h-5" /> },
  { number: "+30", label: "عميل راضٍ", icon: <Star className="w-5 h-5" /> },
  { number: "99%", label: "نسبة الرضا", icon: <Shield className="w-5 h-5" /> },
  { number: "24/7", label: "دعم مستمر", icon: <Zap className="w-5 h-5" /> },
];

const processSteps = [
  { step: "01", title: "الاستكشاف", desc: "نفهم رؤيتك وأهدافك", icon: <Eye className="w-6 h-6" /> },
  { step: "02", title: "التصميم", desc: "نصمم تجربة فريدة", icon: <Palette className="w-6 h-6" /> },
  { step: "03", title: "التطوير", desc: "نبني بأحدث التقنيات", icon: <Sparkles className="w-6 h-6" /> },
  { step: "04", title: "الإطلاق", desc: "نضمن إطلاقاً ناجحاً", icon: <TrendingUp className="w-6 h-6" /> },
];

const Projects = () => {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 sm:pt-36 pb-14 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-[10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]"
          />
        </div>

        <div className="container relative px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              منتجات ومشاريع الشركة
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              مشاريع صُنعت{" "}
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
                بإتقان وشغف
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              منتجات رقمية من إنتاج الشركة تعكس خبرتنا في بناء حلول تقنية متقدمة
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-10"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="group text-center"
              >
                <div className="flex items-center gap-2 justify-center mb-1">
                  <span className="text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                    {stat.icon}
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">{stat.number}</span>
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Projects Grid - Side by Side */}
      <section className="py-12 sm:py-20">
        <div className="container px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                className="group relative"
              >
                <div className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 h-full">
                  {/* Top gradient bar */}
                  <div className={`h-1 w-full bg-gradient-to-l ${project.color}`} />

                  <div className="p-5 sm:p-6 flex flex-col h-full">
                    {/* Animated Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        animate={
                          hoveredProject === project.id
                            ? { rotate: [0, -10, 10, -5, 0], scale: [1, 1.1, 1] }
                            : {}
                        }
                        transition={{ duration: 0.6 }}
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${project.iconBg} flex items-center justify-center text-white shadow-lg`}
                      >
                        {project.icon}
                      </motion.div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-l ${project.color} text-white text-[10px] font-bold`}>
                        {project.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                      {project.title}
                    </h2>
                    <p className="text-xs text-primary font-medium mb-2">{project.subtitle}</p>

                    {/* Description */}
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 flex-grow">
                      {project.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground text-[10px] sm:text-xs font-medium border border-border/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {project.highlights.map((feature, i) => (
                        <motion.div
                          key={feature.title}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30 border border-border/20 hover:border-primary/20 hover:bg-primary/5 transition-all"
                        >
                          <span className="text-primary">{feature.icon}</span>
                          <span className="text-[9px] sm:text-[10px] font-medium text-foreground text-center leading-tight">
                            {feature.title}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Visit button */}
                    <motion.a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-l ${project.color} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      زيارة المشروع
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-14 sm:py-20 border-t border-border/30">
        <div className="container px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">كيف نعمل</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              منهجية عمل مدروسة تضمن نتائج استثنائية
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {processSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                whileHover={{ y: -4 }}
                className="group text-center p-4 rounded-xl bg-card/50 border border-border/40 hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-primary/40 tracking-widest">{item.step}</span>
                <h3 className="text-sm font-bold text-foreground mt-1">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20">
        <div className="container px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-primary/8 via-accent/8 to-primary/8 rounded-2xl blur-2xl" />
            <div className="relative bg-card/60 border border-border/40 rounded-2xl p-8 sm:p-12 backdrop-blur-md text-center">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-14 h-14 mx-auto mb-5 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20"
              >
                <Rocket className="w-7 h-7 text-primary-foreground" />
              </motion.div>

              <h2 className="text-xl sm:text-2xl font-bold mb-3">هل لديك مشروع في ذهنك؟</h2>
              <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
                فريقنا جاهز لتحويل فكرتك إلى واقع رقمي مبهر
              </p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a href="/contact">
                  <Button
                    size="lg"
                    className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20 gap-2 px-8 py-5 text-sm rounded-xl"
                  >
                    <Rocket className="w-4 h-4" />
                    ابدأ مشروعك الآن
                  </Button>
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Projects;
