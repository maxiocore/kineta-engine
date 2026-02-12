import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Globe,
  Rocket,
  Palette,
  Zap,
  Shield,
  Star,
  ArrowUpLeft,
  Sparkles,
  Eye,
  CheckCircle2,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import numaxioImg from "@/assets/project-numaxio.jpg";
import ashHoldingsImg from "@/assets/project-ash-holdings.jpg";

interface ProjectFeature {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  category: string;
  image: string;
  tags: string[];
  highlights: ProjectFeature[];
  color: string;
}

const projects: Project[] = [
  {
    id: "numaxio",
    title: "Numaxio",
    subtitle: "منصة رقمية متكاملة",
    description:
      "منصة رقمية متكاملة من إنتاج الشركة تقدم حلولاً مبتكرة وخدمات تقنية متقدمة لتمكين الشركات من تحقيق أهدافها الرقمية بكفاءة واحترافية عالية.",
    url: "https://numaxio.com",
    category: "منتج رقمي",
    image: numaxioImg,
    tags: ["تطوير ويب", "تصميم UI/UX", "حلول سحابية", "SaaS"],
    highlights: [
      { icon: <Code className="w-5 h-5" />, title: "تطوير متقدم", desc: "بأحدث تقنيات الويب" },
      { icon: <Smartphone className="w-5 h-5" />, title: "تصميم متجاوب", desc: "يعمل على جميع الأجهزة" },
      { icon: <Zap className="w-5 h-5" />, title: "أداء فائق", desc: "سرعة تحميل عالية جداً" },
      { icon: <Lock className="w-5 h-5" />, title: "حماية متقدمة", desc: "تشفير وأمان شامل" },
      { icon: <Cpu className="w-5 h-5" />, title: "ذكاء اصطناعي", desc: "أتمتة ذكية للعمليات" },
      { icon: <Users className="w-5 h-5" />, title: "تجربة مستخدم", desc: "واجهات بديهية وسلسة" },
    ],
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "ash-holdings",
    title: "ASH Holdings",
    subtitle: "الموقع الرسمي للشركة الأم",
    description:
      "الموقع الرسمي لشركة ASH Holdings الاستثمارية، يعرض رؤية الشركة وخدماتها ومحفظتها الاستثمارية بتصميم احترافي يعكس هوية الشركة وقيمها.",
    url: "https://ash.holdings",
    category: "موقع مؤسسي",
    image: ashHoldingsImg,
    tags: ["استثمار", "هوية مؤسسية", "موقع رسمي", "أعمال"],
    highlights: [
      { icon: <Building2 className="w-5 h-5" />, title: "هوية مؤسسية", desc: "تصميم يعكس قوة العلامة" },
      { icon: <BarChart3 className="w-5 h-5" />, title: "عرض المحفظة", desc: "استعراض المشاريع الاستثمارية" },
      { icon: <Globe className="w-5 h-5" />, title: "متعدد اللغات", desc: "عربي وإنجليزي" },
      { icon: <Handshake className="w-5 h-5" />, title: "شراكات فعالة", desc: "بناء علاقات استراتيجية" },
      { icon: <TrendingUp className="w-5 h-5" />, title: "نمو مستدام", desc: "رؤية طويلة المدى" },
      { icon: <Gem className="w-5 h-5" />, title: "تصميم فاخر", desc: "واجهة أنيقة واحترافية" },
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
  { step: "01", title: "الاستكشاف", desc: "نفهم رؤيتك وأهدافك بعمق", icon: <Eye className="w-6 h-6" /> },
  { step: "02", title: "التصميم", desc: "نصمم تجربة مستخدم فريدة", icon: <Palette className="w-6 h-6" /> },
  { step: "03", title: "التطوير", desc: "نبني بأحدث التقنيات", icon: <Sparkles className="w-6 h-6" /> },
  { step: "04", title: "الإطلاق", desc: "نضمن إطلاقاً ناجحاً ومتابعة مستمرة", icon: <TrendingUp className="w-6 h-6" /> },
];

const Projects = () => {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-40 pb-20 sm:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-[10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]"
          />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container relative px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              منتجات ومشاريع الشركة
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              مشاريع صُنعت
              <br />
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
                بإتقان وشغف
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              منتجات رقمية من إنتاج الشركة تعكس خبرتنا وابتكارنا في بناء حلول تقنية متقدمة
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-14 sm:mt-20"
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
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">
                    {stat.number}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 sm:py-28">
        <div className="container px-4 sm:px-6">
          <div className="space-y-20 sm:space-y-32 max-w-6xl mx-auto">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                className="group relative"
              >
                {/* Project number watermark */}
                <div className="absolute -top-8 left-4 sm:left-8 z-0">
                  <span className="text-8xl sm:text-9xl font-black text-foreground/[0.03] select-none">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                  {/* Top gradient bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-l ${project.color}`} />

                  <div className="p-6 sm:p-8 md:p-10">
                    {/* Layout: Image on top for mobile, side by side for desktop */}
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                      
                      {/* Image Section */}
                      <motion.a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="block w-full lg:w-[48%] flex-shrink-0 relative rounded-2xl overflow-hidden border border-border/30 group/img cursor-pointer"
                      >
                        <div className="aspect-[16/10] overflow-hidden">
                          <img
                            src={project.image}
                            alt={`${project.title} - معاينة المشروع`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                            loading="lazy"
                          />
                        </div>

                        {/* Hover overlay */}
                        <AnimatePresence>
                          {hoveredProject === project.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] flex items-center justify-center"
                            >
                              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-xl">
                                <ExternalLink className="w-4 h-4" />
                                زيارة الموقع
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Category badge on image */}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-l ${project.color} text-white text-xs font-bold shadow-lg`}>
                            {project.category}
                          </span>
                        </div>
                      </motion.a>

                      {/* Info Section */}
                      <div className="flex-1 space-y-5">
                        {/* Title & subtitle */}
                        <div>
                          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                            {project.title}
                          </h2>
                          <p className="text-sm sm:text-base text-primary font-medium mt-1">
                            {project.subtitle}
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                          {project.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground text-xs sm:text-sm font-medium border border-border/30 hover:border-primary/30 transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Visit button */}
                        <motion.a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ x: -5 }}
                          className="inline-flex items-center gap-3 text-primary font-semibold text-sm sm:text-base group/link"
                        >
                          <span className="relative">
                            زيارة المشروع
                            <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover/link:w-full" />
                          </span>
                          <ArrowUpLeft className="w-4 h-4 transition-transform group-hover/link:-translate-x-1 group-hover/link:-translate-y-1" />
                        </motion.a>
                      </div>
                    </div>

                    {/* Features Grid - Below the main content */}
                    <div className="mt-8 pt-8 border-t border-border/30">
                      <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        مميزات المشروع
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                        {project.highlights.map((feature, i) => (
                          <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -3 }}
                            className="group/feat text-center p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                          >
                            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/feat:bg-primary group-hover/feat:text-primary-foreground transition-all duration-300">
                              {feature.icon}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-foreground">
                              {feature.title}
                            </h4>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {feature.desc}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 sm:py-24 border-t border-border/30">
        <div className="container px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              كيف نعمل
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
              منهجية عمل مدروسة تضمن نتائج استثنائية في كل مشروع
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {processSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ y: -5 }}
                className="group relative text-center p-5 sm:p-6 rounded-2xl bg-card/50 border border-border/40 hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-primary/40 tracking-widest">
                  {item.step}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-foreground mt-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="container px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-3xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-primary/8 via-accent/8 to-primary/8 rounded-[2rem] blur-2xl" />
            <div className="relative bg-card/60 border border-border/40 rounded-[2rem] p-8 sm:p-14 backdrop-blur-md text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />

              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20"
              >
                <Rocket className="w-8 h-8 text-primary-foreground" />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                هل لديك مشروع في ذهنك؟
              </h2>
              <p className="text-muted-foreground mb-8 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                فريقنا جاهز لتحويل فكرتك إلى واقع رقمي مبهر. تواصل معنا اليوم وابدأ رحلة التميز!
              </p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a href="/contact">
                  <Button
                    size="lg"
                    className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20 gap-2 px-10 py-6 text-base rounded-xl"
                  >
                    <Rocket className="w-5 h-5" />
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
