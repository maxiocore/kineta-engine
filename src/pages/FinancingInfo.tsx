import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { 
  Banknote, 
  Calculator, 
  FileCheck, 
  Clock,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Shield,
  Users,
  Zap,
  Gift
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const financingPlans = [
  {
    title: "خطة 3 أشهر",
    months: 3,
    minAmount: 1000,
    maxAmount: 10000,
    features: ["بدون فوائد", "قسط شهري ثابت", "موافقة سريعة"],
    popular: false,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "خطة 6 أشهر",
    months: 6,
    minAmount: 3000,
    maxAmount: 30000,
    features: ["بدون فوائد", "مرونة في السداد", "الأكثر طلباً"],
    popular: true,
    color: "from-primary to-accent",
  },
  {
    title: "خطة 12 شهر",
    months: 12,
    minAmount: 5000,
    maxAmount: 50000,
    features: ["أقساط مريحة", "للمشاريع الكبيرة", "دعم مخصص"],
    popular: false,
    color: "from-purple-500 to-pink-500",
  },
];

const requirements = [
  { icon: Users, title: "الهوية الوطنية", description: "صورة سارية من الهوية الوطنية أو الإقامة" },
  { icon: FileCheck, title: "السجل التجاري", description: "للشركات: سجل تجاري ساري المفعول" },
  { icon: TrendingUp, title: "كشف حساب", description: "كشف حساب بنكي لآخر 3 أشهر" },
  { icon: Shield, title: "عنوان وطني", description: "عنوان وطني مسجل ومفعل" },
];

const benefits = [
  { icon: Zap, title: "موافقة سريعة", description: "احصل على الموافقة خلال 24 ساعة" },
  { icon: Gift, title: "بدون فوائد", description: "تمويل بدون أي رسوم أو فوائد خفية" },
  { icon: Calculator, title: "أقساط مرنة", description: "اختر الخطة التي تناسب ميزانيتك" },
  { icon: Shield, title: "آمن وموثوق", description: "حماية كاملة لبياناتك المالية" },
];

const steps = [
  { step: 1, title: "تقديم الطلب", description: "املأ نموذج التقديم البسيط عبر الإنترنت" },
  { step: 2, title: "مراجعة الطلب", description: "سنراجع طلبك ونتواصل معك خلال 24 ساعة" },
  { step: 3, title: "توقيع العقد", description: "وقع العقد إلكترونياً بكل سهولة" },
  { step: 4, title: "ابدأ خدمتك", description: "احصل على خدمتك فوراً وابدأ الدفع بالأقساط" },
];

const FinancingInfo = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const plansRef = useRef<HTMLDivElement>(null);
  const isPlansInView = useInView(plansRef, { once: true, margin: "-100px" });

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
            
            {/* Animated Coins */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${15 + (i % 4) * 20}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, -10, 0],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.3 }}
              >
                <Banknote className="w-6 h-6 text-primary/20" />
              </motion.div>
            ))}

            <motion.div
              className="absolute bottom-20 right-[15%] w-80 h-80 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity }}
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
                <span className="text-primary">التمويل</span>
              </motion.div>

              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  animate={{ y: [0, -3, 0] }} 
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Banknote className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm font-medium text-primary">تمويل ميسر</span>
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                <span className="text-foreground">احصل على خدمتك الآن</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary via-accent to-primary">
                  وادفع بالتقسيط
                </span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
                initial={{ opacity: 0 }}
                animate={isHeroInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
              >
                خطط تمويل مرنة بدون فوائد تناسب جميع احتياجاتك
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/dashboard/financing">تقديم طلب تمويل</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link to="/dashboard/financing/calculator">حاسبة الأقساط</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
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
                <span className="text-sm font-medium text-primary">مزايا التمويل</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">لماذا تختار التمويل معنا؟</h2>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 text-center group"
                >
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                  >
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  <h3 className="font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Financing Plans */}
        <section ref={plansRef} className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">خطط التمويل المتاحة</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                اختر الخطة التي تناسب احتياجاتك وميزانيتك
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isPlansInView ? "visible" : "hidden"}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {financingPlans.map((plan, index) => (
                <motion.div
                  key={plan.title}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`relative p-8 rounded-3xl bg-card border ${plan.popular ? 'border-primary' : 'border-border/50'} overflow-hidden`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <motion.div
                      className="absolute -top-1 -right-1 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-bl-xl rounded-tr-3xl"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      الأكثر طلباً
                    </motion.div>
                  )}

                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5`} />

                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">
                        {plan.months}
                      </span>
                      <span className="text-muted-foreground mb-1">شهر</span>
                    </div>

                    <div className="text-sm text-muted-foreground mb-6">
                      من {plan.minAmount.toLocaleString()} إلى {plan.maxAmount.toLocaleString()} ر.س
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      asChild 
                      className={`w-full rounded-full ${plan.popular ? '' : 'variant-outline'}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      <Link to="/dashboard/financing">اختر هذه الخطة</Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 sm:py-24 bg-secondary/30">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">كيف يعمل التمويل؟</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                خطوات بسيطة للحصول على التمويل
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    className="relative text-center"
                  >
                    {/* Connection Line */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-8 -left-3 w-6 h-0.5 bg-gradient-to-l from-primary/50 to-transparent" />
                    )}

                    <motion.div
                      className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary"
                      whileHover={{ scale: 1.1 }}
                    >
                      {step.step}
                    </motion.div>
                    <h3 className="font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">المتطلبات</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                المستندات المطلوبة للتقديم على التمويل
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            >
              {requirements.map((req, index) => (
                <motion.div
                  key={req.title}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 text-center group"
                >
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  >
                    <req.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  <h3 className="font-bold mb-2">{req.title}</h3>
                  <p className="text-sm text-muted-foreground">{req.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-secondary/30">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border/50 text-center max-w-3xl mx-auto overflow-hidden"
            >
              <motion.div
                className="absolute top-0 left-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="relative z-10">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">جاهز للبدء؟</h2>
                <p className="text-muted-foreground mb-6">قدم طلبك الآن واحصل على الموافقة خلال 24 ساعة</p>
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/dashboard/financing">ابدأ الآن</Link>
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

export default FinancingInfo;
