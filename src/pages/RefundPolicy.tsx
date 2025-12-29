import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  ArrowLeft,
  HelpCircle,
  Wallet,
  MessageSquare,
  FileCheck
} from "lucide-react";
import { Link } from "react-router-dom";

const refundConditions = [
  {
    type: "eligible",
    title: "حالات الاسترجاع المقبولة",
    icon: CheckCircle2,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    items: [
      "عدم بدء تنفيذ الخدمة خلال 24 ساعة من الطلب",
      "خطأ تقني من جانبنا أدى لعدم تنفيذ الخدمة",
      "إلغاء الطلب قبل البدء بالتنفيذ",
      "عدم مطابقة الخدمة للمواصفات المتفق عليها",
      "تكرار الخصم عن طريق الخطأ",
    ],
  },
  {
    type: "ineligible",
    title: "حالات لا يشملها الاسترجاع",
    icon: XCircle,
    color: "from-red-500 to-rose-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    items: [
      "بعد اكتمال تنفيذ الخدمة بنجاح",
      "تغيير رأي العميل بعد بدء التنفيذ",
      "انتهاء فترة الضمان المحددة للخدمة",
      "مخالفة شروط الاستخدام من قبل العميل",
      "الخدمات الرقمية القابلة للتحميل بعد التحميل",
    ],
  },
];

const refundSteps = [
  {
    step: 1,
    title: "تقديم الطلب",
    description: "قم بتقديم طلب الاسترجاع من خلال لوحة التحكم أو التواصل مع الدعم",
    icon: MessageSquare,
  },
  {
    step: 2,
    title: "مراجعة الطلب",
    description: "سيقوم فريقنا بمراجعة طلبك خلال 24-48 ساعة عمل",
    icon: FileCheck,
  },
  {
    step: 3,
    title: "الموافقة والإرجاع",
    description: "في حال الموافقة، سيتم إرجاع المبلغ خلال 5-7 أيام عمل",
    icon: Wallet,
  },
];

const timeframes = [
  { method: "بطاقة ائتمانية", duration: "5-7 أيام عمل" },
  { method: "مدى", duration: "3-5 أيام عمل" },
  { method: "رصيد المحفظة", duration: "فوري" },
  { method: "تحويل بنكي", duration: "7-10 أيام عمل" },
];

const RefundPolicy = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const contentRef = useRef<HTMLDivElement>(null);
  const isContentInView = useInView(contentRef, { once: true, margin: "-100px" });

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
            
            {/* Rotating Circle */}
            <motion.div
              className="absolute top-20 right-[20%]"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-40 h-40 rounded-full border-2 border-dashed border-primary/20" />
            </motion.div>

            {/* Floating Elements */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${15 + i * 20}%`,
                  top: `${30 + (i % 2) * 20}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  rotate: [0, 180, 360],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 6 + i * 2, repeat: Infinity, delay: i * 0.5 }}
              >
                <RotateCcw className="w-8 h-8 text-primary/20" />
              </motion.div>
            ))}
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
                <span className="text-primary">سياسة الاسترجاع</span>
              </motion.div>

              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  animate={{ rotate: [0, -360] }} 
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <RotateCcw className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm font-medium text-primary">ضمان استرجاع</span>
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary via-accent to-primary">
                  سياسة الاسترجاع
                </span>
                <br />
                <span className="text-foreground">واسترداد الأموال</span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={isHeroInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
              >
                نلتزم برضا عملائنا ونضمن لك حقك في استرداد أموالك وفق شروط واضحة
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Refund Conditions */}
        <section ref={contentRef} className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isContentInView ? "visible" : "hidden"}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20"
            >
              {refundConditions.map((condition, index) => (
                <motion.div
                  key={condition.title}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className={`relative p-8 rounded-3xl bg-card border ${condition.borderColor} overflow-hidden`}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${condition.color} opacity-5`} />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <motion.div
                        className={`w-14 h-14 rounded-2xl ${condition.bgColor} flex items-center justify-center`}
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                      >
                        <condition.icon className={`w-7 h-7 ${condition.type === 'eligible' ? 'text-emerald-500' : 'text-red-500'}`} />
                      </motion.div>
                      <h3 className="text-xl font-bold">{condition.title}</h3>
                    </div>

                    <ul className="space-y-4">
                      {condition.items.map((item, i) => (
                        <motion.li
                          key={i}
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={isContentInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.4 + index * 0.1 + i * 0.05 }}
                        >
                          <div className={`w-2 h-2 rounded-full mt-2 bg-gradient-to-r ${condition.color}`} />
                          <span className="text-muted-foreground">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Refund Process Steps */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto mb-20"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">خطوات طلب الاسترجاع</h2>
                <p className="text-muted-foreground">عملية بسيطة وسريعة لاسترداد أموالك</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {refundSteps.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    whileHover={{ y: -8 }}
                    className="relative p-6 rounded-2xl bg-card border border-border/50 text-center group"
                  >
                    {/* Step Number */}
                    <motion.div
                      className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm"
                      whileHover={{ scale: 1.2 }}
                    >
                      {step.step}
                    </motion.div>

                    {/* Connection Line */}
                    {index < refundSteps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -left-3 w-6 h-0.5 bg-gradient-to-l from-primary/50 to-transparent" />
                    )}

                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 mt-4 group-hover:bg-primary/20 transition-colors"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                    >
                      <step.icon className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h3 className="font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Timeframes */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <div className="p-8 rounded-3xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold">مدة الاسترجاع حسب طريقة الدفع</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {timeframes.map((item, index) => (
                    <motion.div
                      key={item.method}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50"
                    >
                      <span className="text-muted-foreground">{item.method}</span>
                      <span className="font-semibold text-primary">{item.duration}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Important Note */}
        <section className="py-16 sm:py-24 bg-secondary/30">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative max-w-3xl mx-auto p-8 rounded-3xl bg-card border border-amber-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
              
              <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold mb-2">ملاحظة مهمة</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    يجب تقديم طلب الاسترجاع خلال 7 أيام من تاريخ الشراء. بعد هذه المدة، قد لا نتمكن من معالجة طلبك. 
                    نحتفظ بحق رفض طلبات الاسترجاع التي لا تستوفي الشروط المذكورة أعلاه.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">هل تحتاج مساعدة؟</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                إذا كان لديك أي استفسار حول سياسة الاسترجاع أو تريد تقديم طلب، فريقنا جاهز لمساعدتك
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/dashboard/support"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                  >
                    <MessageSquare className="w-4 h-4" />
                    طلب استرجاع
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border border-border hover:border-primary/50 font-medium transition-colors"
                  >
                    تواصل معنا
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
