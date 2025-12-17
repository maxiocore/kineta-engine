import { motion } from "framer-motion";
import { 
  BarChart3, 
  Megaphone, 
  Target, 
  Zap, 
  LineChart, 
  Users,
  CheckCircle,
  ArrowLeft,
  Phone,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const services = [
  {
    icon: BarChart3,
    title: "التحليلات الذكية",
    description: "تحليلات متقدمة مدعومة بالذكاء الاصطناعي لفهم سلوك عملائك واتخاذ قرارات مدروسة.",
    gradient: "from-primary to-cyan-400",
    price: "1,500",
    features: [
      "تقارير تفصيلية أسبوعية وشهرية",
      "لوحات تحكم مخصصة",
      "تنبيهات ذكية فورية",
      "تحليل المنافسين",
      "توصيات مبنية على البيانات",
    ]
  },
  {
    icon: Megaphone,
    title: "إدارة الحملات الإعلانية",
    description: "إدارة وتحسين حملاتك الإعلانية عبر جميع المنصات من مكان واحد.",
    gradient: "from-accent to-pink-400",
    price: "2,500",
    features: [
      "حملات Google Ads",
      "إعلانات Facebook & Instagram",
      "حملات TikTok",
      "إعلانات Snapchat",
      "تقارير أداء تفصيلية",
    ]
  },
  {
    icon: Target,
    title: "استهداف الجمهور",
    description: "الوصول للجمهور المناسب بالرسالة المناسبة في الوقت المناسب.",
    gradient: "from-success to-emerald-400",
    price: "1,800",
    features: [
      "تحليل شامل للجمهور",
      "إنشاء شرائح مخصصة",
      "إعادة الاستهداف الذكي",
      "اختبار A/B",
      "تحسين معدل التحويل",
    ]
  },
  {
    icon: Zap,
    title: "الأتمتة التسويقية",
    description: "أتمتة المهام التسويقية المتكررة وتوفير الوقت للتركيز على الاستراتيجية.",
    gradient: "from-warning to-orange-400",
    price: "2,000",
    features: [
      "سير عمل آلي متقدم",
      "رسائل بريد مجدولة",
      "تسلسلات رعاية العملاء",
      "تكامل مع CRM",
      "إشعارات ذكية",
    ]
  },
  {
    icon: LineChart,
    title: "تحسين محركات البحث (SEO)",
    description: "تحسين ظهور موقعك في نتائج البحث وزيادة الزيارات العضوية.",
    gradient: "from-primary to-blue-400",
    price: "3,000",
    features: [
      "تحليل الكلمات المفتاحية",
      "تحسين المحتوى",
      "بناء الروابط الخلفية",
      "تحسين السرعة",
      "تقارير ترتيب شهرية",
    ]
  },
  {
    icon: Users,
    title: "إدارة وسائل التواصل",
    description: "إدارة حساباتك على وسائل التواصل الاجتماعي بشكل احترافي.",
    gradient: "from-accent to-purple-400",
    price: "2,200",
    features: [
      "إدارة 4 منصات",
      "تصميم المحتوى",
      "جدولة المنشورات",
      "التفاعل مع الجمهور",
      "تقارير أداء شهرية",
    ]
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const Services = () => {
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
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
                خدماتنا المتميزة
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                حلول تسويقية <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">متكاملة</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                نقدم لك مجموعة شاملة من الخدمات التسويقية المصممة خصيصاً لتحقيق أهدافك وتعزيز نمو أعمالك
              </p>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 bg-secondary/20">
          <div className="container px-4">
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {services.map((service) => (
                <motion.div
                  key={service.title}
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <div className="h-full p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/30 transition-all duration-300">
                    <motion.div 
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} p-3 mb-6 shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <service.icon className="w-full h-full text-primary-foreground" />
                    </motion.div>

                    <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>

                    <div className="mb-6">
                      <span className="text-3xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                        {service.price}
                      </span>
                      <span className="text-muted-foreground"> ر.س / شهرياً</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to="/contact">
                      <Button className="w-full gap-2">
                        اطلب الخدمة
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
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
              <h2 className="text-3xl font-bold mb-4">هل تحتاج خدمة مخصصة؟</h2>
              <p className="text-muted-foreground mb-8">
                تواصل معنا لنصمم لك باقة خدمات تناسب احتياجاتك وميزانيتك
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="gap-2">
                    <Mail className="w-4 h-4" />
                    تواصل معنا
                  </Button>
                </Link>
                <a href="tel:+966551234567">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">+966 55 123 4567</span>
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
