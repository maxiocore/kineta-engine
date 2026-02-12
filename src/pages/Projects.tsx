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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  category: string;
  icon: React.ReactNode;
  tags: string[];
  features: string[];
  color: string;
  accentColor: string;
}

const projects: Project[] = [
  {
    id: "numaxio",
    title: "Numaxio",
    subtitle: "منصة رقمية متكاملة",
    description:
      "منصة رقمية متكاملة تقدم حلولاً مبتكرة وخدمات تقنية متقدمة لتمكين الشركات من تحقيق أهدافها الرقمية بكفاءة واحترافية.",
    url: "https://numaxio.com",
    category: "منصة رقمية",
    icon: <Globe className="w-7 h-7" />,
    tags: ["تطوير ويب", "تصميم UI/UX", "حلول سحابية"],
    features: [
      "تصميم عصري متجاوب",
      "تجربة مستخدم سلسة",
      "أداء عالي وسرعة فائقة",
      "حماية وأمان متقدم",
    ],
    color: "from-cyan-500 to-blue-600",
    accentColor: "cyan",
  },
  {
    id: "ash-holdings",
    title: "ASH Holdings",
    subtitle: "شركة استثمارية رائدة",
    description:
      "شركة استثمارية رائدة تقدم حلولاً متكاملة في مجال الأعمال والاستثمار مع رؤية استراتيجية لتحقيق نمو مستدام وشراكات فعالة.",
    url: "https://ash.holdings",
    category: "شركة استثمارية",
    icon: <Building2 className="w-7 h-7" />,
    tags: ["استثمار", "أعمال", "حلول رقمية"],
    features: [
      "رؤية استراتيجية",
      "حلول مبتكرة",
      "نمو مستدام",
      "شراكات فعالة",
    ],
    color: "from-amber-500 to-orange-600",
    accentColor: "amber",
  },
];

const stats = [
  {
    number: "+50",
    label: "مشروع منجز",
    icon: <Rocket className="w-5 h-5" />,
  },
  {
    number: "+30",
    label: "عميل راضٍ",
    icon: <Star className="w-5 h-5" />,
  },
  {
    number: "99%",
    label: "نسبة الرضا",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    number: "24/7",
    label: "دعم مستمر",
    icon: <Zap className="w-5 h-5" />,
  },
];

const processSteps = [
  {
    step: "01",
    title: "الاستكشاف",
    desc: "نفهم رؤيتك وأهدافك بعمق",
    icon: <Eye className="w-6 h-6" />,
  },
  {
    step: "02",
    title: "التصميم",
    desc: "نصمم تجربة مستخدم فريدة",
    icon: <Palette className="w-6 h-6" />,
  },
  {
    step: "03",
    title: "التطوير",
    desc: "نبني بأحدث التقنيات",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    step: "04",
    title: "الإطلاق",
    desc: "نضمن إطلاقاً ناجحاً ومتابعة مستمرة",
    icon: <TrendingUp className="w-6 h-6" />,
  },
];

const Projects = () => {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-40 pb-20 sm:pb-32 overflow-hidden">
        {/* Animated background */}
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
          {/* Grid pattern */}
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
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              أعمالنا المتميزة
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              مشاريع صُنعت
              <br />
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                بإتقان وشغف
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              نفخر بتقديم مجموعة من المشاريع المتميزة التي تعكس خبرتنا في تطوير
              الحلول الرقمية المبتكرة
            </p>
          </motion.div>

          {/* Stats Row */}
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
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 sm:py-28">
        <div className="container px-4 sm:px-6">
          <div className="space-y-16 sm:space-y-24 max-w-6xl mx-auto">
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
                {/* Card */}
                <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                  {/* Top gradient bar */}
                  <div
                    className={`h-1 w-full bg-gradient-to-l ${project.color}`}
                  />

                  <div className="p-6 sm:p-10 md:p-12">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                      {/* Right side - Info */}
                      <div className="flex-1 space-y-6">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                          <motion.div
                            whileHover={{ rotate: 12, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${project.color} flex items-center justify-center shadow-lg text-white flex-shrink-0`}
                          >
                            {project.icon}
                          </motion.div>
                          <div>
                            <span className="text-xs sm:text-sm text-primary font-medium">
                              {project.category}
                            </span>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-1">
                              {project.title}
                            </h2>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1">
                              {project.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base max-w-xl">
                          {project.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground text-xs sm:text-sm font-medium border border-border/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {project.features.map((feature, i) => (
                            <motion.div
                              key={feature}
                              initial={{ opacity: 0, x: 20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-center gap-2.5 text-sm text-foreground/80"
                            >
                              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                              {feature}
                            </motion.div>
                          ))}
                        </div>

                        {/* CTA */}
                        <motion.a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ x: -5 }}
                          className="inline-flex items-center gap-3 text-primary font-semibold text-sm sm:text-base group/link mt-2"
                        >
                          <span className="relative">
                            زيارة المشروع
                            <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover/link:w-full" />
                          </span>
                          <ArrowUpLeft className="w-4 h-4 transition-transform group-hover/link:-translate-x-1 group-hover/link:-translate-y-1" />
                        </motion.a>
                      </div>

                      {/* Left side - Preview mockup */}
                      <div className="w-full md:w-[340px] lg:w-[400px] flex-shrink-0">
                        <motion.a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ y: -6 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="block relative rounded-2xl overflow-hidden border border-border/30 bg-muted/30 aspect-[4/3]"
                        >
                          {/* Browser chrome */}
                          <div className="flex items-center gap-1.5 px-4 py-3 bg-muted/50 border-b border-border/30">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                            <div className="flex-1 mx-3">
                              <div className="bg-background/60 rounded-md px-3 py-1 text-[10px] text-muted-foreground text-center truncate border border-border/20">
                                {project.url.replace("https://", "")}
                              </div>
                            </div>
                          </div>

                          {/* Placeholder content */}
                          <div
                            className={`absolute inset-0 top-[38px] bg-gradient-to-br ${project.color} opacity-10`}
                          />
                          <div className="absolute inset-0 top-[38px] flex items-center justify-center">
                            <div className="text-center space-y-3">
                              <div
                                className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${project.color} flex items-center justify-center text-white shadow-lg`}
                              >
                                {project.icon}
                              </div>
                              <p className="text-sm font-bold text-foreground/60">
                                {project.title}
                              </p>
                            </div>
                          </div>

                          {/* Hover overlay */}
                          <AnimatePresence>
                            {hoveredProject === project.id && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 top-[38px] bg-foreground/5 backdrop-blur-[1px] flex items-center justify-center"
                              >
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg">
                                  <ExternalLink className="w-4 h-4" />
                                  فتح الموقع
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project number */}
                <div className="absolute -top-4 left-6 sm:left-10">
                  <span className="text-7xl sm:text-8xl font-black text-foreground/[0.03] select-none">
                    {String(index + 1).padStart(2, "0")}
                  </span>
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
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-l from-primary/8 via-accent/8 to-primary/8 rounded-[2rem] blur-2xl" />

            <div className="relative bg-card/60 border border-border/40 rounded-[2rem] p-8 sm:p-14 backdrop-blur-md text-center overflow-hidden">
              {/* Decorative circles */}
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
                فريقنا جاهز لتحويل فكرتك إلى واقع رقمي مبهر. تواصل معنا اليوم
                وابدأ رحلة التميز!
              </p>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
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
