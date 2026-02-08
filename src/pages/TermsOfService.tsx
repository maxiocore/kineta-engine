import { motion } from "framer-motion";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { FileText, CheckCircle2, AlertTriangle, Scale, CreditCard, Ban, RefreshCw, Gavel } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TermsOfService = () => {
  const sections = [
    {
      icon: CheckCircle2,
      title: "قبول الشروط",
      content: [
        "باستخدامك لموقعنا وخدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام.",
        "إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام خدماتنا.",
        "نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسيتم إخطارك بأي تغييرات جوهرية.",
        "استمرارك في استخدام الخدمات بعد التعديلات يعني موافقتك على الشروط المحدثة."
      ]
    },
    {
      icon: FileText,
      title: "وصف الخدمات",
      content: [
        "نقدم خدمات التسويق الرقمي، التصميم الإبداعي، البرمجة والتطوير، وإدارة منصات التواصل الاجتماعي.",
        "تخضع الخدمات للتوفر وقد تتغير دون إشعار مسبق.",
        "نسعى جاهدين لتقديم خدمات عالية الجودة، لكننا لا نضمن نتائج محددة.",
        "بعض الخدمات قد تتطلب اشتراكاً أو دفعاً مسبقاً."
      ]
    },
    {
      icon: CreditCard,
      title: "الدفع والفوترة",
      content: [
        "الأسعار المعروضة بالريال السعودي ما لم يُذكر خلاف ذلك.",
        "يجب إتمام الدفع قبل بدء تنفيذ الخدمة ما لم يتم الاتفاق على خلاف ذلك.",
        "جميع المدفوعات غير قابلة للاسترداد إلا وفقاً لسياسة الاسترداد الخاصة بنا.",
        "نحتفظ بالحق في تعديل الأسعار مع إشعار مسبق للعملاء الحاليين.",
        "في حالة التأخر في الدفع، قد يتم تعليق أو إلغاء الخدمات."
      ]
    },
    {
      icon: RefreshCw,
      title: "سياسة الاسترداد والإلغاء",
      content: [
        "يمكن طلب الاسترداد خلال 24 ساعة من الطلب إذا لم يتم البدء في تنفيذ الخدمة.",
        "بعد بدء تنفيذ الخدمة، لا يمكن استرداد المبلغ المدفوع.",
        "في حالة عدم رضاك عن الخدمة، يرجى التواصل معنا لحل المشكلة.",
        "نحتفظ بالحق في رفض طلبات الاسترداد في حالة سوء الاستخدام."
      ]
    },
    {
      icon: Ban,
      title: "الاستخدام المحظور",
      content: [
        "استخدام الخدمات لأي غرض غير قانوني أو غير مصرح به.",
        "انتهاك حقوق الملكية الفكرية لنا أو لأي طرف ثالث.",
        "محاولة الوصول غير المصرح به إلى أنظمتنا أو بيانات المستخدمين الآخرين.",
        "نشر محتوى ضار أو مسيء أو مخالف للقوانين.",
        "استخدام الخدمات لإرسال رسائل غير مرغوب فيها (سبام).",
        "التلاعب بالنظام أو محاولة الحصول على خدمات دون دفع."
      ]
    },
    {
      icon: Scale,
      title: "الملكية الفكرية",
      content: [
        "جميع المحتويات والعلامات التجارية والشعارات هي ملك لـ ASH HOLDING.",
        "لا يجوز نسخ أو إعادة إنتاج أي محتوى دون إذن كتابي مسبق.",
        "المحتوى الذي تقدمه لنا يبقى ملكاً لك، مع منحنا ترخيصاً لاستخدامه في تقديم الخدمات.",
        "نحترم حقوق الملكية الفكرية للآخرين ونتوقع منك نفس الشيء."
      ]
    },
    {
      icon: AlertTriangle,
      title: "إخلاء المسؤولية",
      content: [
        "الخدمات مقدمة 'كما هي' دون أي ضمانات صريحة أو ضمنية.",
        "لا نتحمل المسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام خدماتنا.",
        "لا نضمن أن الخدمات ستكون متاحة بشكل مستمر أو خالية من الأخطاء.",
        "أنت مسؤول عن الحفاظ على سرية معلومات حسابك."
      ]
    },
    {
      icon: Gavel,
      title: "القانون الحاكم",
      content: [
        "تخضع هذه الشروط لقوانين المملكة العربية السعودية.",
        "أي نزاع ينشأ عن استخدام الخدمات سيتم حله بالتفاوض الودي أولاً.",
        "في حالة عدم التوصل لحل، يتم اللجوء إلى المحاكم المختصة في المملكة العربية السعودية.",
        "إذا تم اعتبار أي حكم من هذه الشروط غير قابل للتنفيذ، تظل بقية الشروط سارية."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-rose-500/10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-purple-500/20 text-purple-400 border-purple-500/30 text-lg px-6 py-2">
              <FileText className="w-5 h-5 ml-2" />
              الشروط والأحكام
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-l from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                شروط الاستخدام
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام خدماتنا. 
              باستخدامك للموقع، فإنك توافق على الالتزام بهذه الشروط.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              آخر تحديث: ديسمبر 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-2 h-2 mt-2 rounded-full bg-purple-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 rounded-2xl p-8 text-center"
          >
            <Scale className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2">هل لديك استفسارات؟</h3>
            <p className="text-muted-foreground mb-4">
              إذا كانت لديك أي أسئلة حول شروط الاستخدام، لا تتردد في التواصل معنا.
            </p>
            <a 
              href="mailto:legal@ash-holding.sa" 
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              legal@ash-holding.sa
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfService;
