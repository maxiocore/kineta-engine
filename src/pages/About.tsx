import { motion } from "framer-motion";
import { 
  Target, 
  Users, 
  Award, 
  Lightbulb,
  Heart,
  Rocket,
  CheckCircle,
  MapPin
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
  },
  {
    icon: Heart,
    title: "الشغف",
    description: "نحب ما نعمل ونعمل ما نحب، التسويق الرقمي هو شغفنا",
  },
  {
    icon: Lightbulb,
    title: "الابتكار",
    description: "نبحث دائماً عن حلول إبداعية ومبتكرة لتحقيق أهداف عملائنا",
  },
  {
    icon: Users,
    title: "الشراكة",
    description: "نؤمن بأن نجاح عملائنا هو نجاحنا، لذا نعمل كشركاء حقيقيين",
  },
];

const team = [
  { name: "أحمد محمد", role: "المدير التنفيذي", image: "أ" },
  { name: "سارة أحمد", role: "مديرة التسويق", image: "س" },
  { name: "خالد العلي", role: "مدير العمليات", image: "خ" },
  { name: "نورة السعيد", role: "مديرة الإبداع", image: "ن" },
];

const achievements = [
  { value: "+500", label: "عميل راضي" },
  { value: "+1000", label: "مشروع منجز" },
  { value: "+50", label: "جائزة وشهادة" },
  { value: "+5", label: "سنوات خبرة" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 right-[10%] w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-20 left-[10%] w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
          </div>
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
                من نحن
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                نحن <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">MaxioCore</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                شركة رائدة في مجال التسويق الرقمي، نساعد الشركات على النمو والتميز في العالم الرقمي منذ عام 2019
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-secondary/20">
          <div className="container px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6">قصتنا</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    بدأت رحلتنا في عام 2019 برؤية واضحة: تقديم حلول تسويقية رقمية متميزة للشركات في المملكة العربية السعودية والعالم العربي.
                  </p>
                  <p>
                    من فريق صغير مكون من 3 أشخاص، نمونا لنصبح فريقاً من أكثر من 25 متخصصاً في مختلف مجالات التسويق الرقمي.
                  </p>
                  <p>
                    اليوم، نفخر بخدمة أكثر من 500 عميل وتنفيذ أكثر من 1000 مشروع ناجح، محققين نتائج استثنائية لعملائنا.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-8">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">الرياض، المملكة العربية السعودية</span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
              >
                {achievements.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-2xl bg-background border border-border/50 text-center"
                  >
                    <p className="text-4xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent mb-2">
                      {item.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">قيمنا</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                نؤمن بمجموعة من القيم الأساسية التي توجه عملنا وعلاقاتنا مع عملائنا
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors text-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-secondary/20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">فريق القيادة</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                فريق من الخبراء والمتخصصين يعملون معاً لتحقيق رؤيتنا
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-primary-foreground">
                    {member.image}
                  </div>
                  <h3 className="font-bold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
            >
              <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">هل أنت جاهز للانطلاق؟</h2>
              <p className="text-muted-foreground mb-8">
                انضم إلى قائمة عملائنا الناجحين وابدأ رحلة النمو الرقمي اليوم
              </p>
              <Link to="/contact">
                <Button size="lg" className="gap-2">
                  تواصل معنا الآن
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
