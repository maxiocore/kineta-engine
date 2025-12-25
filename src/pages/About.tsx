import { motion, useInView } from "framer-motion";
import { useRef } from "react";
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
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const values = [
  {
    icon: Target,
    title: "التميز",
    description: "نسعى دائماً لتقديم أعلى مستويات الجودة في كل ما نقدمه",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Heart,
    title: "الشغف",
    description: "نحب ما نعمل ونعمل ما نحب، التسويق الرقمي هو شغفنا",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Lightbulb,
    title: "الابتكار",
    description: "نبحث دائماً عن حلول إبداعية ومبتكرة لتحقيق أهداف عملائنا",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    title: "الشراكة",
    description: "نؤمن بأن نجاح عملائنا هو نجاحنا، لذا نعمل كشركاء حقيقيين",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const team = [
  { name: "أحمد محمد", role: "المدير التنفيذي", initial: "أ", color: "from-cyan-500 to-blue-600" },
  { name: "سارة أحمد", role: "مديرة التسويق", initial: "س", color: "from-pink-500 to-rose-600" },
  { name: "خالد العلي", role: "مدير العمليات", initial: "خ", color: "from-emerald-500 to-teal-600" },
  { name: "نورة السعيد", role: "مديرة الإبداع", initial: "ن", color: "from-amber-500 to-orange-600" },
];

const achievements = [
  { value: 500, suffix: "+", label: "عميل راضي", icon: Users },
  { value: 1000, suffix: "+", label: "مشروع منجز", icon: Rocket },
  { value: 50, suffix: "+", label: "جائزة وشهادة", icon: Award },
  { value: 5, suffix: "+", label: "سنوات خبرة", icon: TrendingUp },
];

const Counter = ({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) => {
  const count = inView ? value : 0;
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-4xl md:text-5xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent"
    >
      {inView && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {count.toLocaleString('ar-SA')}{suffix}
        </motion.span>
      )}
    </motion.span>
  );
};

const About = () => {
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section ref={heroRef} className="py-24 md:py-32 relative">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-20 right-[5%] w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/30 to-blue-600/20 rounded-full blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute bottom-0 left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-accent/30 to-primary/20 rounded-full blur-[140px]"
            />
            
            {/* Floating Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/40 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm mb-6"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">من نحن</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                نحن{" "}
                <span className="relative">
                  <span className="bg-gradient-to-l from-cyan-400 via-primary to-accent bg-clip-text text-transparent">
                    MaxioCore
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                شركة رائدة في مجال التسويق الرقمي، نساعد الشركات على النمو والتميز في العالم الرقمي منذ عام 2019
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section ref={statsRef} className="py-20 relative">
          <div className="container px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {achievements.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-300 text-center group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <item.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  <Counter value={item.value} suffix={item.suffix} inView={statsInView} />
                  <p className="text-sm text-muted-foreground mt-2">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background" />
          
          <div className="container px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                >
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">قصتنا</span>
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-8">
                  رحلة من <span className="text-primary">الشغف</span> إلى <span className="text-accent">النجاح</span>
                </h2>
                
                <div className="space-y-6 text-muted-foreground text-lg">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    بدأت رحلتنا في عام 2019 برؤية واضحة: تقديم حلول تسويقية رقمية متميزة للشركات في المملكة العربية السعودية والعالم العربي.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    من فريق صغير مكون من 3 أشخاص، نمونا لنصبح فريقاً من أكثر من 25 متخصصاً في مختلف مجالات التسويق الرقمي.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    اليوم، نفخر بخدمة أكثر من 500 عميل وتنفيذ أكثر من 1000 مشروع ناجح، محققين نتائج استثنائية لعملائنا.
                  </motion.p>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-4 mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">المقر الرئيسي</p>
                    <p className="text-sm text-muted-foreground">الرياض، المملكة العربية السعودية</p>
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative aspect-square max-w-md mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-8 rounded-full border-2 border-dashed border-accent/20"
                  />
                  <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-center"
                    >
                      <span className="text-5xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                        2019
                      </span>
                      <p className="text-sm text-muted-foreground mt-2">سنة التأسيس</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">قيمنا</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">ما يميزنا عن الآخرين</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
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
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-300 text-center group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  >
                    <value.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="font-bold text-xl mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">فريق القيادة</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">العقول المبدعة خلف نجاحنا</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                فريق من الخبراء والمتخصصين يعملون معاً لتحقيق رؤيتنا
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="text-center group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${member.color} flex items-center justify-center mx-auto mb-6 text-4xl font-bold text-white shadow-2xl relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {member.initial}
                  </motion.div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative max-w-4xl mx-auto text-center p-12 md:p-16 rounded-[2.5rem] overflow-hidden"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20" />
              <div className="absolute inset-0 backdrop-blur-xl" />
              <div className="absolute inset-[1px] rounded-[2.5rem] bg-gradient-to-br from-card/90 to-card/70" />
              
              {/* Animated Border */}
              <motion.div
                className="absolute inset-0 rounded-[2.5rem]"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  backgroundPosition: ['200% 0', '-200% 0'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              <div className="relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/30"
                >
                  <Rocket className="w-10 h-10 text-white" />
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4">هل أنت جاهز للانطلاق؟</h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                  انضم إلى قائمة عملائنا الناجحين وابدأ رحلة النمو الرقمي اليوم
                </p>
                
                <Link to="/contact">
                  <Button size="lg" className="gap-2 px-8 py-6 text-lg rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl shadow-primary/30">
                    تواصل معنا الآن
                    <Sparkles className="w-5 h-5" />
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
