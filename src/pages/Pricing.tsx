import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  X, 
  Zap, 
  Star,
  ArrowLeft,
  HelpCircle,
  Sparkles,
  Crown,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const plans = [
  {
    name: "أساسي",
    description: "مثالي للشركات الناشئة والصغيرة",
    price: "1,999",
    priceYearly: "1,599",
    period: "شهرياً",
    popular: false,
    icon: Shield,
    gradient: "from-slate-500 to-slate-600",
    features: [
      { text: "إدارة منصتين اجتماعية", included: true },
      { text: "8 منشورات شهرياً", included: true },
      { text: "تقرير أداء شهري", included: true },
      { text: "دعم عبر البريد", included: true },
      { text: "حملات إعلانية", included: false },
      { text: "تحسين محركات البحث", included: false },
      { text: "تصميم المحتوى", included: false },
      { text: "مدير حساب مخصص", included: false },
    ],
  },
  {
    name: "احترافي",
    description: "للشركات المتوسطة والنامية",
    price: "3,999",
    priceYearly: "3,199",
    period: "شهرياً",
    popular: true,
    icon: Star,
    gradient: "from-primary to-accent",
    features: [
      { text: "إدارة 4 منصات اجتماعية", included: true },
      { text: "20 منشور شهرياً", included: true },
      { text: "تقارير أداء أسبوعية", included: true },
      { text: "دعم عبر الواتساب", included: true },
      { text: "حملات إعلانية (5000 ر.س)", included: true },
      { text: "تحسين محركات البحث", included: true },
      { text: "تصميم المحتوى", included: false },
      { text: "مدير حساب مخصص", included: false },
    ],
  },
  {
    name: "متقدم",
    description: "للشركات الكبيرة والمؤسسات",
    price: "7,999",
    priceYearly: "6,399",
    period: "شهرياً",
    popular: false,
    icon: Crown,
    gradient: "from-amber-500 to-orange-600",
    features: [
      { text: "إدارة جميع المنصات", included: true },
      { text: "40 منشور شهرياً", included: true },
      { text: "تقارير أداء يومية", included: true },
      { text: "دعم على مدار الساعة", included: true },
      { text: "حملات إعلانية (15000 ر.س)", included: true },
      { text: "تحسين محركات البحث متقدم", included: true },
      { text: "تصميم محتوى احترافي", included: true },
      { text: "مدير حساب مخصص", included: true },
    ],
  },
];

const faqs = [
  {
    question: "هل يمكنني تغيير الباقة لاحقاً؟",
    answer: "نعم، يمكنك الترقية أو التخفيض في أي وقت. سيتم احتساب الفرق بشكل تناسبي.",
  },
  {
    question: "ما هي مدة العقد؟",
    answer: "نقدم عقود شهرية وربع سنوية وسنوية. العقود السنوية توفر خصم 20%.",
  },
  {
    question: "هل هناك فترة تجريبية؟",
    answer: "نعم، نقدم استشارة مجانية لمدة 30 دقيقة لفهم احتياجاتك قبل البدء.",
  },
  {
    question: "كيف يتم قياس النتائج؟",
    answer: "نقدم تقارير مفصلة توضح جميع مؤشرات الأداء والنمو المحقق.",
  },
];

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 md:py-28 relative">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-10 right-[10%] w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/30 to-blue-600/20 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute bottom-10 left-[5%] w-[500px] h-[500px] bg-gradient-to-tr from-accent/30 to-primary/20 rounded-full blur-[120px]"
            />
          </div>
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm mb-6"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">باقات الأسعار</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              >
                أسعار{" "}
                <span className="bg-gradient-to-l from-cyan-400 via-primary to-accent bg-clip-text text-transparent">
                  تنافسية
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-muted-foreground mb-10"
              >
                اختر الباقة المناسبة لاحتياجاتك وميزانيتك، مع إمكانية الترقية في أي وقت
              </motion.p>

              {/* Billing Toggle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-secondary/50 border border-border/50 backdrop-blur-sm"
              >
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    billingPeriod === "monthly"
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  شهري
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    billingPeriod === "yearly"
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  سنوي
                  <Badge className="bg-success/20 text-success border-0 text-xs">
                    وفر 20%
                  </Badge>
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 md:py-20">
          <div className="container px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`relative p-6 md:p-8 rounded-3xl border transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-b from-primary/10 via-card to-card border-primary/40 shadow-2xl shadow-primary/20 order-first lg:order-none lg:-mt-4 lg:mb-4"
                      : "bg-card/80 backdrop-blur-xl border-border/50 hover:border-primary/40"
                  }`}
                >
                  {plan.popular && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2"
                    >
                      <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 gap-1.5 px-4 py-1.5 shadow-lg shadow-primary/30">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        الأكثر طلباً
                      </Badge>
                    </motion.div>
                  )}

                  <div className="text-center mb-8">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                    >
                      <plan.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    
                    <div className="flex items-baseline justify-center gap-1">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={billingPeriod}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="text-4xl md:text-5xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent"
                        >
                          {billingPeriod === "yearly" ? plan.priceYearly : plan.price}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-sm text-muted-foreground">ر.س / {plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <motion.li
                        key={feature.text}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="flex items-center gap-3 text-sm"
                      >
                        {feature.included ? (
                          <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-success" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                            <X className="w-3 h-3 text-muted-foreground/50" />
                          </div>
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground/50"}>
                          {feature.text}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  <Link to="/contact">
                    <Button
                      className={`w-full gap-2 h-12 rounded-xl text-base ${
                        plan.popular
                          ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/30"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      ابدأ الآن
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <HelpCircle className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">الأسئلة الشائعة</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">لديك سؤال؟</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                إجابات على الأسئلة الأكثر شيوعاً حول خدماتنا وأسعارنا
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full p-6 text-right flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors"
                  >
                    <h3 className="font-bold text-lg">{faq.question}</h3>
                    <motion.div
                      animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 text-primary rotate-90" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-muted-foreground">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
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
              
              {/* Floating Elements */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/30 rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
              
              <div className="relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/30"
                >
                  <Zap className="w-10 h-10 text-white" />
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4">تحتاج باقة مخصصة؟</h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                  تواصل معنا لنصمم لك باقة تناسب احتياجاتك الخاصة
                </p>
                
                <Link to="/contact">
                  <Button size="lg" className="gap-2 px-8 py-6 text-lg rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl shadow-primary/30">
                    تواصل معنا
                    <ArrowLeft className="w-5 h-5" />
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

export default Pricing;
