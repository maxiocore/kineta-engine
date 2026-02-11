import { motion } from "framer-motion";
import { ExternalLink, Globe, Smartphone, Code2, Palette, Rocket, ArrowLeft, Layers, Monitor, Zap, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  categoryIcon: React.ReactNode;
  tags: string[];
  features: string[];
  gradient: string;
  iconBg: string;
}

const projects: Project[] = [
  {
    id: "numaxio",
    title: "Numaxio",
    description: "منصة رقمية متكاملة تقدم حلولاً مبتكرة وخدمات تقنية متقدمة",
    url: "https://numaxio.com",
    category: "منصة رقمية",
    categoryIcon: <Globe className="w-5 h-5" />,
    tags: ["تطوير ويب", "تصميم UI/UX", "حلول سحابية"],
    features: ["تصميم عصري متجاوب", "تجربة مستخدم سلسة", "أداء عالي وسرعة فائقة", "حماية وأمان متقدم"],
    gradient: "from-cyan-500/20 via-blue-500/10 to-purple-500/20",
    iconBg: "from-cyan-500 to-blue-600",
  },
];

const categories = [
  { label: "جميع المشاريع", icon: <Layers className="w-4 h-4" />, value: "all" },
  { label: "مواقع إلكترونية", icon: <Monitor className="w-4 h-4" />, value: "websites" },
  { label: "تطبيقات", icon: <Smartphone className="w-4 h-4" />, value: "apps" },
  { label: "منصات رقمية", icon: <Globe className="w-4 h-4" />, value: "platforms" },
  { label: "أنظمة", icon: <Code2 className="w-4 h-4" />, value: "systems" },
];

const stats = [
  { number: "+50", label: "مشروع منجز", icon: <Rocket className="w-5 h-5" /> },
  { number: "+30", label: "عميل راضٍ", icon: <Star className="w-5 h-5" /> },
  { number: "99%", label: "نسبة الرضا", icon: <Shield className="w-5 h-5" /> },
  { number: "24/7", label: "دعم مستمر", icon: <Zap className="w-5 h-5" /> },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const Projects = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/3 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="container relative px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25"
            >
              <Rocket className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
                مشاريعنا
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              نفخر بتقديم مجموعة من المشاريع المتميزة التي تعكس خبرتنا في تطوير الحلول الرقمية المبتكرة
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-16 max-w-3xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative group"
              >
                <div className="text-center p-4 sm:p-5 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-4">
        <div className="container px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-2 sm:gap-3"
          >
            {categories.map((cat, index) => (
              <motion.button
                key={cat.value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  cat.value === "all"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-card border border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {cat.icon}
                {cat.label}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Projects Grid - Compact Icon Cards */}
      <section className="py-12 sm:py-20">
        <div className="container px-4 sm:px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 max-w-5xl mx-auto"
          >
            {projects.map((project) => (
              <motion.a
                key={project.id}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="group relative flex flex-col items-center text-center"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-accent/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                <div className="relative w-full bg-card border border-border/50 rounded-2xl p-5 sm:p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25"
                  >
                    <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>

                  {/* Category badge */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-medium">
                    {project.categoryIcon}
                    {project.category}
                  </span>

                  {/* External link indicator */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="container px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative text-center max-w-2xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-accent/5 to-primary/5 rounded-3xl blur-2xl" />
            <div className="relative bg-card/50 border border-border/50 rounded-3xl p-8 sm:p-12 backdrop-blur-sm">
              <Palette className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                هل لديك مشروع في ذهنك؟
              </h2>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                فريقنا جاهز لتحويل فكرتك إلى واقع رقمي مبهر. تواصل معنا اليوم!
              </p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a href="/contact">
                  <Button size="lg" className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20 gap-2 px-8">
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
