import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { 
  Target, 
  Users, 
  Award, 
  Lightbulb,
  Heart,
  Rocket,
  MapPin,
  Sparkles,
  TrendingUp,
  Globe,
  Zap,
  Shield,
  Star,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Clock,
  Trophy,
  MessageCircle,
  Code,
  Palette,
  BarChart3,
  Headphones,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const values = [
  {
    icon: Target,
    title: "التميز",
    description: "نسعى دائماً لتقديم أعلى مستويات الجودة في كل ما نقدمه من خدمات",
    gradient: "from-cyan-500 to-blue-600",
    bgGlow: "bg-cyan-500/20",
  },
  {
    icon: Heart,
    title: "الشغف",
    description: "نحب ما نعمل ونعمل ما نحب، التسويق الرقمي هو شغفنا الحقيقي",
    gradient: "from-pink-500 to-rose-600",
    bgGlow: "bg-pink-500/20",
  },
  {
    icon: Lightbulb,
    title: "الابتكار",
    description: "نبحث دائماً عن حلول إبداعية ومبتكرة لتحقيق أهداف عملائنا",
    gradient: "from-amber-500 to-orange-600",
    bgGlow: "bg-amber-500/20",
  },
  {
    icon: Users,
    title: "الشراكة",
    description: "نؤمن بأن نجاح عملائنا هو نجاحنا، لذا نعمل كشركاء حقيقيين",
    gradient: "from-emerald-500 to-teal-600",
    bgGlow: "bg-emerald-500/20",
  },
];

const milestones = [
  { year: "2025", title: "الإطلاق", description: "إطلاق الموقع رسمياً في 23 ديسمبر 2025", icon: Rocket, color: "from-primary to-accent" },
];

const services = [
  { icon: BarChart3, title: "التسويق الرقمي", description: "استراتيجيات تسويقية متكاملة" },
  { icon: Palette, title: "التصميم الإبداعي", description: "تصاميم احترافية ومبتكرة" },
  { icon: Code, title: "تطوير المواقع", description: "حلول برمجية متقدمة" },
  { icon: Headphones, title: "دعم متواصل", description: "خدمة عملاء على مدار الساعة" },
];

const achievements = [
  { value: "500+", label: "عميل راضي", icon: Users, color: "from-cyan-500 to-blue-600" },
  { value: "1000+", label: "مشروع منجز", icon: Rocket, color: "from-emerald-500 to-teal-600" },
  { value: "50+", label: "جائزة وشهادة", icon: Award, color: "from-amber-500 to-orange-600" },
  { value: "5+", label: "سنوات خبرة", icon: TrendingUp, color: "from-pink-500 to-rose-600" },
];

const team = [
  { name: "أحمد محمد", role: "المدير التنفيذي", initial: "أ", gradient: "from-cyan-500 to-blue-600" },
  { name: "سارة أحمد", role: "مديرة التسويق", initial: "س", gradient: "from-pink-500 to-rose-600" },
  { name: "خالد العلي", role: "مدير العمليات", initial: "خ", gradient: "from-emerald-500 to-teal-600" },
  { name: "نورة السعيد", role: "مديرة الإبداع", initial: "ن", gradient: "from-amber-500 to-orange-600" },
];

const About = () => {
  const [activeTimeline, setActiveTimeline] = useState(5);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" });

  return (
    <div className="min-h-screen bg-background overflow-hidden" dir="rtl">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-[100px]" />
            
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="container px-4 relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center mb-8"
              >
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                  <span className="text-sm font-medium text-primary">تعرف علينا أكثر</span>
                </div>
              </motion.div>

              {/* Main Title */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  نحن{" "}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-l from-cyan-400 via-primary to-accent bg-clip-text text-transparent">
                      MaxioCore
                    </span>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                    />
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  شركة رائدة في مجال التسويق الرقمي والحلول الإبداعية، نساعد الشركات على 
                  <span className="text-primary font-semibold"> النمو </span>
                  والتميز في العالم الرقمي - تم إطلاقنا في ديسمبر 2025
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Link to="/contact">
                  <Button size="lg" className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-xl shadow-primary/25 px-8 py-6 text-base gap-2 rounded-xl">
                    <MessageCircle className="w-5 h-5" />
                    تواصل معنا
                  </Button>
                </Link>
                <Link to="/our-services">
                  <Button variant="outline" size="lg" className="px-8 py-6 text-base gap-2 rounded-xl border-2">
                    اكتشف خدماتنا
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section ref={statsRef} className="py-16 md:py-20 bg-secondary/30">
          <div className="container px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {achievements.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative p-6 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 text-center group overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <item.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  
                  <div className={`text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-l ${item.color} bg-clip-text text-transparent mb-2`}>
                    {item.value}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground font-medium">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">ماذا نقدم</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">خدماتنا المتميزة</h2>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mx-auto mb-4 transition-colors">
                    <service.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/50 to-background">
          <div className="container px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">قصتنا</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  رحلة من <span className="text-primary">الشغف</span>
                  <br />
                  إلى <span className="text-accent">النجاح</span>
                </h2>
                
                <div className="space-y-5 text-muted-foreground text-base md:text-lg leading-relaxed">
                  <p>
                    انطلقت رحلتنا في ديسمبر 2025 برؤية واضحة: تقديم حلول تسويقية رقمية متميزة للشركات في المملكة العربية السعودية والعالم العربي.
                  </p>
                  <p>
                    من فريق صغير مكون من 3 أشخاص، نمونا لنصبح فريقاً من أكثر من 25 متخصصاً في مختلف مجالات التسويق الرقمي والتصميم والبرمجة.
                  </p>
                  <p>
                    اليوم، نفخر بخدمة أكثر من 500 عميل وتنفيذ أكثر من 1000 مشروع ناجح، محققين نتائج استثنائية تتجاوز التوقعات.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-8 p-5 rounded-2xl bg-card border border-border/50">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">المقر الرئيسي</p>
                    <p className="text-muted-foreground">الرياض، المملكة العربية السعودية</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Visual */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative aspect-square max-w-md mx-auto">
                  {/* Circles */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-8 rounded-full border-2 border-dashed border-accent/20"
                  />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-16 rounded-full border border-primary/30"
                  />
                  
                  {/* Center */}
                  <div className="absolute inset-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm flex items-center justify-center border border-primary/20">
                    <div className="text-center">
                      <span className="text-5xl md:text-6xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                        2025
                      </span>
                      <p className="text-sm text-muted-foreground mt-2">سنة الإطلاق</p>
                    </div>
                  </div>

                  {/* Corner Icons */}
                  <div className="absolute top-4 right-1/4 w-12 h-12 rounded-xl bg-card border border-border/50 shadow-lg flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-primary" />
                  </div>
                  <div className="absolute top-1/4 left-4 w-12 h-12 rounded-xl bg-card border border-border/50 shadow-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="absolute bottom-1/4 right-4 w-12 h-12 rounded-xl bg-card border border-border/50 shadow-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="absolute bottom-4 left-1/4 w-12 h-12 rounded-xl bg-card border border-border/50 shadow-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-rose-500" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">رحلتنا</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                مسيرة <span className="text-primary">نجاح</span> متواصلة
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                من البداية المتواضعة إلى الريادة في السوق
              </p>
            </motion.div>

            {/* Timeline Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTimeline(index)}
                  className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    activeTimeline === index
                      ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/50 shadow-lg shadow-primary/10'
                      : 'bg-card border-border/50 hover:border-primary/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                    activeTimeline === index
                      ? `bg-gradient-to-br ${milestone.color}`
                      : 'bg-secondary'
                  }`}>
                    <milestone.icon className={`w-6 h-6 ${activeTimeline === index ? 'text-white' : 'text-primary'}`} />
                  </div>
                  
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${activeTimeline === index ? 'text-primary' : ''}`}>
                      {milestone.year}
                    </span>
                    <h4 className="font-semibold mt-1 mb-1">{milestone.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{milestone.description}</p>
                  </div>

                  {activeTimeline === index && (
                    <motion.div
                      layoutId="timelineIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-l from-primary to-accent rounded-full"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">قيمنا</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">ما يميزنا عن الآخرين</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                نؤمن بمجموعة من القيم الأساسية التي توجه عملنا وعلاقاتنا مع عملائنا
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 text-center group overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-l ${value.gradient}`} />
                  <div className={`absolute inset-0 ${value.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl`} />
                  
                  <div className={`relative w-18 h-18 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                    <value.icon className="w-9 h-9 md:w-10 md:h-10 text-white" />
                  </div>
                  
                  <h3 className="relative font-bold text-xl md:text-2xl mb-3">{value.title}</h3>
                  <p className="relative text-muted-foreground leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">فريق القيادة</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">العقول المبدعة</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                فريق من الخبراء والمتخصصين يعملون معاً لتحقيق رؤيتنا
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 text-center group"
                >
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center mx-auto mb-4 shadow-xl text-white text-3xl md:text-4xl font-bold`}>
                    {member.initial}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/30">
          <div className="container px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">لماذا نحن</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  لماذا تختار <span className="text-primary">MaxioCore</span>؟
                </h2>
                
                <div className="space-y-4">
                  {[
                    "خبرة أكثر من 5 سنوات في السوق السعودي والعربي",
                    "فريق متخصص من أكثر من 25 خبيراً في مختلف المجالات",
                    "أكثر من 1000 مشروع ناجح ومتنوع",
                    "دعم فني متواصل على مدار الساعة",
                    "ضمان جودة الخدمات ورضا العملاء",
                    "أسعار تنافسية وباقات مرنة"
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
                      <Shield className="w-10 h-10 text-cyan-500 mb-3" />
                      <h4 className="font-bold mb-1">موثوقية عالية</h4>
                      <p className="text-sm text-muted-foreground">خدمات موثوقة ومضمونة</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20">
                      <Zap className="w-10 h-10 text-amber-500 mb-3" />
                      <h4 className="font-bold mb-1">سرعة في التنفيذ</h4>
                      <p className="text-sm text-muted-foreground">نتائج سريعة وفعالة</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20">
                      <Clock className="w-10 h-10 text-emerald-500 mb-3" />
                      <h4 className="font-bold mb-1">دعم 24/7</h4>
                      <p className="text-sm text-muted-foreground">متاحون دائماً لخدمتك</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-600/10 border border-pink-500/20">
                      <Award className="w-10 h-10 text-pink-500 mb-3" />
                      <h4 className="font-bold mb-1">جودة مضمونة</h4>
                      <p className="text-sm text-muted-foreground">معايير عالية الجودة</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                مستعد لبدء <span className="text-primary">رحلتك</span>؟
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                انضم إلى أكثر من 500 عميل يثقون بنا لتحقيق أهدافهم الرقمية
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-xl shadow-primary/25 px-10 py-7 text-lg gap-3 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                    ابدأ الآن مجاناً
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="px-10 py-7 text-lg gap-3 rounded-xl border-2">
                    <MessageCircle className="w-5 h-5" />
                    تحدث مع خبير
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
