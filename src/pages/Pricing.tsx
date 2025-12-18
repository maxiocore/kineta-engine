import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  X, 
  Zap, 
  Star,
  ArrowLeft,
  HelpCircle
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
    period: "شهرياً",
    popular: false,
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
    period: "شهرياً",
    popular: true,
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
    period: "شهرياً",
    popular: false,
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 right-[10%] w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-20 left-[10%] w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-[120px]" />
          </div>
          
          <div className="container px-3 sm:px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary font-medium text-xs sm:text-sm mb-3 sm:mb-4">
                باقات الأسعار
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                أسعار <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">تنافسية</span>
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
                اختر الباقة المناسبة لاحتياجاتك وميزانيتك، مع إمكانية الترقية في أي وقت
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-2 sm:gap-4 p-1 sm:p-1.5 rounded-full bg-secondary/50 border border-border/50">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    billingPeriod === "monthly"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  شهري
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${
                    billingPeriod === "yearly"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  سنوي
                  <Badge variant="secondary" className="bg-success/20 text-success text-[10px] sm:text-xs">
                    وفر 20%
                  </Badge>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-10 sm:py-16">
          <div className="container px-3 sm:px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all ${
                    plan.popular
                      ? "bg-gradient-to-b from-primary/10 to-background border-primary/30 shadow-xl shadow-primary/10 order-first md:order-none"
                      : "bg-background border-border/50 hover:border-primary/30"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        الأكثر طلباً
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-5 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2">{plan.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl sm:text-4xl font-bold">
                        {billingPeriod === "yearly"
                          ? Math.round(parseInt(plan.price.replace(",", "")) * 0.8).toLocaleString()
                          : plan.price}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">ر.س / {plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 sm:space-y-4 mb-5 sm:mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-center gap-2 sm:gap-3 text-sm">
                        {feature.included ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success shrink-0" />
                        ) : (
                          <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground/50"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/contact">
                    <Button
                      className={`w-full gap-2 ${
                        plan.popular
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                      size="default"
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
        <section className="py-12 sm:py-20 bg-secondary/20">
          <div className="container px-3 sm:px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">الأسئلة الشائعة</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                إجابات على الأسئلة الأكثر شيوعاً حول خدماتنا وأسعارنا
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto grid gap-3 sm:gap-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-background border border-border/50"
                >
                  <h3 className="font-bold text-sm sm:text-base mb-1.5 sm:mb-2">{faq.question}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20">
          <div className="container px-3 sm:px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
            >
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">تحتاج باقة مخصصة؟</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-8">
                تواصل معنا لنصمم لك باقة تناسب احتياجاتك الخاصة
              </p>
              <Link to="/contact">
                <Button size="default" className="gap-2">
                  تواصل معنا
                  <ArrowLeft className="w-4 h-4" />
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

export default Pricing;
