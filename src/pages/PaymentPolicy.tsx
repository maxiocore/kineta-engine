import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Info,
  Lock,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";

const policyItems = [
  {
    icon: CreditCard,
    title: "طرق الدفع المقبولة",
    items: [
      "البطاقات الائتمانية والخصم (Visa, Mastercard, Mada)",
      "المحافظ الرقمية (Apple Pay, Google Pay, STC Pay)",
      "التحويل البنكي المباشر",
      "الدفع عند الاستلام (لخدمات محددة)",
    ],
  },
  {
    icon: Lock,
    title: "أمان المدفوعات",
    items: [
      "جميع المعاملات مشفرة باستخدام SSL 256-bit",
      "لا نخزن بيانات بطاقتك الائتمانية",
      "نستخدم بوابات دفع معتمدة دولياً",
      "حماية ضد الاحتيال بتقنية 3D Secure",
    ],
  },
  {
    icon: Clock,
    title: "توقيت الدفع",
    items: [
      "يتم خصم المبلغ فوراً عند تأكيد الطلب",
      "للتحويل البنكي: يتم تفعيل الخدمة خلال 24 ساعة",
      "تظهر المعاملات في كشف حسابك خلال 2-5 أيام عمل",
      "يمكنك الدفع بالتقسيط عبر تمارا",
    ],
  },
  {
    icon: Globe,
    title: "العملات المقبولة",
    items: [
      "الريال السعودي (SAR) - العملة الرئيسية",
      "الدولار الأمريكي (USD)",
      "يتم تحويل العملات بأسعار الصرف الحالية",
      "قد تطبق رسوم تحويل العملة من البنك",
    ],
  },
];

const importantNotes = [
  {
    title: "الفواتير الإلكترونية",
    description: "ستصلك فاتورة إلكترونية معتمدة على بريدك الإلكتروني بعد كل عملية دفع ناجحة",
    icon: FileText,
  },
  {
    title: "ضريبة القيمة المضافة",
    description: "جميع الأسعار المعروضة شاملة ضريبة القيمة المضافة 15%",
    icon: AlertCircle,
  },
  {
    title: "تأكيد الدفع",
    description: "ستتلقى رسالة تأكيد عبر البريد الإلكتروني والرسائل النصية فور إتمام الدفع",
    icon: CheckCircle2,
  },
];

const PaymentPolicy = () => {
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
            <motion.div
              className="absolute top-10 left-[30%] w-80 h-80 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
              animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            
            {/* Floating Documents */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${10 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.5 }}
              >
                <FileText className="w-8 h-8 text-primary/20" />
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
                <span className="text-primary">سياسة الدفع</span>
              </motion.div>

              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 }}
              >
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm font-medium text-primary">سياسة واضحة</span>
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                <span className="text-foreground">سياسة</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary via-accent to-primary">
                  الدفع والفوترة
                </span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={isHeroInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
              >
                نلتزم بالشفافية التامة في جميع عمليات الدفع والفوترة
              </motion.p>

              <motion.p
                className="text-sm text-muted-foreground mt-6"
                initial={{ opacity: 0 }}
                animate={isHeroInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.6 }}
              >
                آخر تحديث: يناير 2025
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Policy Content */}
        <section ref={contentRef} className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isContentInView ? "visible" : "hidden"}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16"
            >
              {policyItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="group relative p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all overflow-hidden"
                >
                  {/* Hover Gradient */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <motion.div
                        className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <item.icon className="w-7 h-7 text-primary" />
                      </motion.div>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                    </div>

                    <ul className="space-y-3">
                      {item.items.map((point, i) => (
                        <motion.li
                          key={i}
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={isContentInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.3 + index * 0.1 + i * 0.05 }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Important Notes */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-8">
                <Info className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">ملاحظات مهمة</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {importantNotes.map((note, index) => (
                  <motion.div
                    key={note.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-2xl bg-secondary/50 border border-border/50"
                  >
                    <note.icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold mb-2">{note.title}</h3>
                    <p className="text-sm text-muted-foreground">{note.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 sm:py-24 bg-secondary/30">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">لديك استفسار حول الدفع؟</h2>
              <p className="text-muted-foreground mb-6">
                فريق الدعم المالي لدينا جاهز لمساعدتك والإجابة على جميع استفساراتك
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                  >
                    تواصل معنا
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/dashboard/support"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border border-border hover:border-primary/50 font-medium transition-colors"
                  >
                    فتح تذكرة دعم
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

export default PaymentPolicy;
