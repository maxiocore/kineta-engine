import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  Smartphone, 
  Shield, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const paymentMethods = [
  {
    icon: CreditCard,
    title: "البطاقات الائتمانية",
    titleEn: "Credit Cards",
    description: "نقبل جميع البطاقات الائتمانية الرئيسية بما في ذلك Visa و Mastercard و American Express",
    features: ["معالجة فورية", "حماية ضد الاحتيال", "دعم 3D Secure"],
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Wallet,
    title: "المحافظ الرقمية",
    titleEn: "Digital Wallets",
    description: "ادفع بسهولة عبر Apple Pay و Google Pay و STC Pay",
    features: ["دفع بلمسة واحدة", "تخزين آمن للبيانات", "سرعة فائقة"],
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Building2,
    title: "التحويل البنكي",
    titleEn: "Bank Transfer",
    description: "تحويل مباشر من حسابك البنكي إلى حسابنا في البنوك السعودية",
    features: ["بدون رسوم إضافية", "تأكيد خلال 24 ساعة", "جميع البنوك المحلية"],
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Smartphone,
    title: "مدى",
    titleEn: "Mada",
    description: "استخدم بطاقة مدى للدفع الآمن والسريع داخل المملكة",
    features: ["دعم كامل للمملكة", "أمان عالي", "بدون رسوم"],
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
  },
];

const securityFeatures = [
  { icon: Shield, title: "تشفير SSL", description: "جميع البيانات مشفرة بأعلى معايير الأمان" },
  { icon: Clock, title: "معالجة فورية", description: "تتم معالجة المدفوعات في ثوانٍ معدودة" },
  { icon: CheckCircle2, title: "تأكيد فوري", description: "احصل على تأكيد الدفع مباشرة" },
];

const PaymentMethods = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const methodsRef = useRef<HTMLDivElement>(null);
  const isMethodsInView = useInView(methodsRef, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 12 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section ref={heroRef} className="relative py-20 sm:py-28 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
            <motion.div
              className="absolute top-20 right-[20%] w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-10 left-[10%] w-72 h-72 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            />
          </div>

          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Breadcrumb */}
              <motion.div 
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8"
                initial={{ opacity: 0 }}
                animate={isHeroInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.2 }}
              >
                <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
                <ArrowLeft className="w-4 h-4" />
                <span className="text-primary">طرق الدفع</span>
              </motion.div>

              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 }}
              >
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                  <CreditCard className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm font-medium text-primary">طرق دفع متعددة</span>
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary via-accent to-primary">
                  طرق الدفع
                </span>
                <br />
                <span className="text-foreground">المتاحة لديك</span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={isHeroInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
              >
                نوفر لك مجموعة متنوعة من طرق الدفع الآمنة والموثوقة لتختار ما يناسبك
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Payment Methods Grid */}
        <section ref={methodsRef} className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isMethodsInView ? "visible" : "hidden"}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto"
            >
              {paymentMethods.map((method, index) => (
                <motion.div
                  key={method.title}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden"
                >
                  {/* Background Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Floating Particles */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${method.color}`}
                      style={{ left: `${20 + i * 30}%`, top: `${30 + i * 20}%` }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -20, -40] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    />
                  ))}

                  <div className="relative z-10">
                    <div className="flex items-start gap-5 mb-6">
                      <motion.div
                        className={`w-16 h-16 rounded-2xl ${method.bgColor} flex items-center justify-center`}
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <method.icon className={`w-8 h-8 bg-gradient-to-r ${method.color} bg-clip-text text-transparent`} style={{ stroke: `url(#gradient-${index})` }} />
                        <svg width="0" height="0">
                          <defs>
                            <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="hsl(var(--primary))" />
                              <stop offset="100%" stopColor="hsl(var(--accent))" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">{method.title}</h3>
                        <p className="text-sm text-muted-foreground">{method.titleEn}</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-6 leading-relaxed">{method.description}</p>

                    <div className="space-y-3">
                      {method.features.map((feature, i) => (
                        <motion.div
                          key={feature}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={isMethodsInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.5 + index * 0.1 + i * 0.1 }}
                        >
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${method.color} flex items-center justify-center`}>
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-16 sm:py-24 bg-secondary/30">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">أمان مضمون</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">مدفوعاتك في أمان تام</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                نستخدم أحدث تقنيات التشفير لحماية بياناتك ومعاملاتك المالية
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 text-center group"
                >
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  >
                    <feature.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border/50 text-center max-w-3xl mx-auto overflow-hidden"
            >
              <motion.div
                className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="relative z-10">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">هل لديك استفسار؟</h2>
                <p className="text-muted-foreground mb-6">فريق الدعم لدينا جاهز لمساعدتك على مدار الساعة</p>
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/contact">تواصل معنا</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentMethods;
