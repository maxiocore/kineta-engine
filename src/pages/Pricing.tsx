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
                باقات الأسعار
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                أسعار <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">تنافسية</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                اختر الباقة المناسبة لاحتياجاتك وميزانيتك، مع إمكانية الترقية في أي وقت
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-secondary/50 border border-border/50">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingPeriod === "monthly"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  شهري
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    billingPeriod === "yearly"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  سنوي
                  <Badge variant="secondary" className="bg-success/20 text-success text-xs">
                    وفر 20%
                  </Badge>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16">
          <div className="container px-4">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-8 rounded-3xl border transition-all ${
                    plan.popular
                      ? "bg-gradient-to-b from-primary/10 to-background border-primary/30 shadow-xl shadow-primary/10"
                      : "bg-background border-border/50 hover:border-primary/30"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground gap-1">
                        <Star className="w-3 h-3" />
                        الأكثر طلباً
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        {billingPeriod === "yearly"
                          ? Math.round(parseInt(plan.price.replace(",", "")) * 0.8).toLocaleString()
                          : plan.price}
                      </span>
                      <span className="text-muted-foreground">ر.س / {plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-center gap-3">
                        {feature.included ? (
                          <CheckCircle className="w-5 h-5 text-success shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 shrink-0" />
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
                      size="lg"
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
        <section className="py-20 bg-secondary/20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">الأسئلة الشائعة</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                إجابات على الأسئلة الأكثر شيوعاً حول خدماتنا وأسعارنا
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto grid gap-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-background border border-border/50"
                >
                  <h3 className="font-bold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
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
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">تحتاج باقة مخصصة؟</h2>
              <p className="text-muted-foreground mb-8">
                تواصل معنا لنصمم لك باقة تناسب احتياجاتك الخاصة
              </p>
              <Link to="/contact">
                <Button size="lg" className="gap-2">
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
