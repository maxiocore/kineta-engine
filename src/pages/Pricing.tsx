import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  ArrowLeft,
  Sparkles,
  Crown,
  Palette,
  Code,
  Megaphone,
  Share2,
  Star,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const serviceCategories = [
  {
    id: "social",
    name: "مواقع التواصل الاجتماعي",
    icon: Share2,
    color: "from-blue-500 to-cyan-500",
    description: "إدارة وتنمية حساباتك على جميع المنصات",
    packages: [
      {
        name: "باقة الانطلاق",
        price: "499",
        period: "شهرياً",
        popular: false,
        features: [
          "إدارة منصة واحدة",
          "10 منشورات شهرياً",
          "تصميم بوستات بسيطة",
          "تقرير أداء شهري",
          "دعم عبر البريد",
        ],
      },
      {
        name: "باقة النمو",
        price: "1,499",
        period: "شهرياً",
        popular: true,
        features: [
          "إدارة 3 منصات",
          "20 منشور شهرياً",
          "تصميمات احترافية",
          "ريلز وستوريز",
          "تقارير أسبوعية",
          "دعم واتساب",
        ],
      },
      {
        name: "باقة الريادة",
        price: "2,999",
        period: "شهرياً",
        popular: false,
        features: [
          "إدارة جميع المنصات",
          "40 منشور شهرياً",
          "محتوى فيديو احترافي",
          "حملات إعلانية",
          "تحليلات متقدمة",
          "مدير حساب مخصص",
        ],
      },
    ],
  },
  {
    id: "design",
    name: "خدمات التصميم",
    icon: Palette,
    color: "from-purple-500 to-pink-500",
    description: "تصاميم إبداعية تعكس هوية علامتك التجارية",
    packages: [
      {
        name: "تصميم أساسي",
        price: "299",
        period: "للتصميم",
        popular: false,
        features: [
          "تصميم بوستر واحد",
          "3 مراجعات",
          "ملفات بجودة عالية",
          "تسليم خلال 3 أيام",
          "دعم فني",
        ],
      },
      {
        name: "هوية بصرية",
        price: "1,999",
        period: "للمشروع",
        popular: true,
        features: [
          "تصميم شعار احترافي",
          "بطاقة أعمال",
          "أوراق رسمية",
          "ملف الهوية البصرية",
          "5 مراجعات",
          "تسليم خلال أسبوع",
        ],
      },
      {
        name: "باقة متكاملة",
        price: "4,999",
        period: "للمشروع",
        popular: false,
        features: [
          "هوية بصرية كاملة",
          "تصميم موقع UI",
          "قوالب سوشيال ميديا",
          "بروشورات ومطبوعات",
          "مراجعات غير محدودة",
          "دعم مستمر لشهر",
        ],
      },
    ],
  },
  {
    id: "marketing",
    name: "التسويق الرقمي",
    icon: Megaphone,
    color: "from-orange-500 to-red-500",
    description: "استراتيجيات تسويقية لنمو أعمالك",
    packages: [
      {
        name: "باقة البداية",
        price: "1,999",
        period: "شهرياً",
        popular: false,
        features: [
          "استراتيجية تسويقية",
          "إعلانات جوجل",
          "تحسين SEO أساسي",
          "تقارير شهرية",
          "ميزانية 2000 ر.س",
        ],
      },
      {
        name: "باقة الاحتراف",
        price: "4,999",
        period: "شهرياً",
        popular: true,
        features: [
          "خطة تسويق شاملة",
          "إعلانات متعددة المنصات",
          "تحسين SEO متقدم",
          "تسويق بالمحتوى",
          "ميزانية 5000 ر.س",
          "تقارير أسبوعية",
        ],
      },
      {
        name: "باقة الشركات",
        price: "9,999",
        period: "شهرياً",
        popular: false,
        features: [
          "استراتيجية 360 درجة",
          "جميع المنصات الإعلانية",
          "تسويق المؤثرين",
          "تحليلات متقدمة",
          "ميزانية 15000 ر.س",
          "فريق مخصص",
        ],
      },
    ],
  },
  {
    id: "development",
    name: "البرمجة والتطوير",
    icon: Code,
    color: "from-green-500 to-emerald-500",
    description: "حلول برمجية متكاملة لأعمالك",
    packages: [
      {
        name: "موقع تعريفي",
        price: "2,999",
        period: "للمشروع",
        popular: false,
        features: [
          "تصميم متجاوب",
          "5 صفحات",
          "نموذج تواصل",
          "تحسين SEO أساسي",
          "دعم شهر واحد",
        ],
      },
      {
        name: "متجر إلكتروني",
        price: "7,999",
        period: "للمشروع",
        popular: true,
        features: [
          "منصة تجارة متكاملة",
          "بوابات دفع متعددة",
          "لوحة تحكم سهلة",
          "تطبيق موبايل",
          "دعم 3 أشهر",
          "تدريب مجاني",
        ],
      },
      {
        name: "نظام مخصص",
        price: "حسب الطلب",
        period: "",
        popular: false,
        features: [
          "تحليل متطلبات شامل",
          "تصميم حسب الطلب",
          "تكامل مع الأنظمة",
          "تطبيقات موبايل",
          "دعم تقني سنوي",
          "صيانة مستمرة",
        ],
      },
    ],
  },
];

const Pricing = () => {
  const [activeCategory, setActiveCategory] = useState("social");

  const currentCategory = serviceCategories.find(cat => cat.id === activeCategory);

  return (
    <div dir="rtl" className="min-h-screen bg-background overflow-hidden">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-16 md:py-24 relative">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-10 left-[10%] w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/30 to-blue-600/20 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute bottom-10 right-[5%] w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/30 to-primary/20 rounded-full blur-[120px]"
            />
          </div>
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-l from-primary/20 to-cyan-500/20 border border-primary/30 backdrop-blur-sm mb-6"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">باقات وعروض حصرية</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              >
                باقات{" "}
                <span className="bg-gradient-to-l from-cyan-400 via-primary to-purple-500 bg-clip-text text-transparent">
                  خدماتنا المتكاملة
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-muted-foreground mb-10"
              >
                اكتشف باقاتنا المتنوعة في التسويق والتصميم والبرمجة، واختر ما يناسب احتياجاتك
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="py-8 relative z-10">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-3 md:gap-4"
            >
              {serviceCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(category.id)}
                    className={`
                      relative flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-2xl font-medium text-sm md:text-base
                      transition-all duration-300 overflow-hidden
                      ${activeCategory === category.id
                        ? 'text-white shadow-xl'
                        : 'bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
                      }
                    `}
                  >
                    {activeCategory === category.id && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute inset-0 bg-gradient-to-l ${category.color}`}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span className="hidden sm:inline">{category.name}</span>
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Category Description */}
        <AnimatePresence mode="wait">
          <motion.section
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="py-6"
          >
            <div className="container px-4">
              <div className="text-center">
                <motion.div
                  className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-l ${currentCategory?.color} mb-4`}
                >
                  {currentCategory && <currentCategory.icon className="w-6 h-6 text-white" />}
                  <span className="text-white font-bold text-lg">{currentCategory?.name}</span>
                </motion.div>
                <p className="text-muted-foreground text-lg">{currentCategory?.description}</p>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Pricing Cards */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto"
              >
                {currentCategory?.packages.map((pkg, index) => (
                  <motion.div
                    key={pkg.name}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className={`relative p-6 md:p-8 rounded-3xl border transition-all duration-300 ${
                      pkg.popular
                        ? `bg-gradient-to-b ${currentCategory.color.replace('from-', 'from-').replace('to-', 'to-')}/10 via-card to-card border-primary/40 shadow-2xl shadow-primary/20`
                        : "bg-card/80 backdrop-blur-xl border-border/50 hover:border-primary/40"
                    }`}
                  >
                    {pkg.popular && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-4 left-1/2 -translate-x-1/2"
                      >
                        <Badge className={`bg-gradient-to-l ${currentCategory.color} text-white border-0 gap-1.5 px-4 py-1.5 shadow-lg`}>
                          <Star className="w-3.5 h-3.5 fill-current" />
                          الأكثر طلباً
                        </Badge>
                      </motion.div>
                    )}

                    <div className="text-center mb-8">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentCategory.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                      >
                        {index === 0 && <Shield className="w-8 h-8 text-white" />}
                        {index === 1 && <Crown className="w-8 h-8 text-white" />}
                        {index === 2 && <TrendingUp className="w-8 h-8 text-white" />}
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-4">{pkg.name}</h3>
                      
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-4xl md:text-5xl font-bold bg-gradient-to-l ${currentCategory.color} bg-clip-text text-transparent`}>
                          {pkg.price}
                        </span>
                        {pkg.period && (
                          <span className="text-sm text-muted-foreground">ر.س / {pkg.period}</span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {pkg.features.map((feature, idx) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="flex items-center gap-3 text-sm"
                        >
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${currentCategory.color} flex items-center justify-center shrink-0`}>
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <Link to="/contact">
                      <Button
                        className={`w-full gap-2 h-12 rounded-xl text-base ${
                          pkg.popular
                            ? `bg-gradient-to-l ${currentCategory.color} hover:opacity-90 shadow-lg`
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        اطلب الآن
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                لماذا تختار{" "}
                <span className="bg-gradient-to-l from-primary to-cyan-400 bg-clip-text text-transparent">
                  خدماتنا؟
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                نقدم لك أفضل الحلول الرقمية بجودة عالية وأسعار منافسة
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Zap, title: "سرعة التنفيذ", desc: "نلتزم بالمواعيد ونسلم في الوقت المحدد" },
                { icon: Star, title: "جودة عالية", desc: "معايير جودة صارمة في كل مشروع" },
                { icon: Shield, title: "ضمان الرضا", desc: "نضمن رضاك التام أو نعيد أموالك" },
                { icon: TrendingUp, title: "دعم مستمر", desc: "فريق دعم متاح على مدار الساعة" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative max-w-4xl mx-auto text-center p-10 md:p-16 rounded-[2.5rem] overflow-hidden"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-cyan-500/20" />
              <div className="absolute inset-0 backdrop-blur-xl" />
              <div className="absolute inset-[1px] rounded-[2.5rem] bg-gradient-to-br from-card/90 to-card/70" />
              
              {/* Floating Elements */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-primary/30 rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    right: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
              
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="inline-block mb-6"
                >
                  <Sparkles className="w-12 h-12 text-primary" />
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  جاهز للبدء في{" "}
                  <span className="bg-gradient-to-l from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    رحلة النجاح؟
                  </span>
                </h2>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  تواصل معنا الآن واحصل على استشارة مجانية لتحديد الباقة المناسبة لاحتياجاتك
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/contact">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-gradient-to-l from-primary to-cyan-500 hover:opacity-90 text-white gap-2 h-14 px-8 rounded-2xl text-lg shadow-xl shadow-primary/30">
                        احصل على استشارة مجانية
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
