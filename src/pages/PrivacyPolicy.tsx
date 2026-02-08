import { motion } from "framer-motion";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Shield, Lock, Eye, Database, Users, Bell, Mail, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Database,
      title: "المعلومات التي نجمعها",
      content: [
        "المعلومات الشخصية: الاسم، البريد الإلكتروني، رقم الهاتف عند التسجيل أو التواصل معنا.",
        "معلومات الحساب: بيانات تسجيل الدخول والتفضيلات الشخصية.",
        "معلومات الدفع: تفاصيل الفواتير والمعاملات المالية (يتم معالجتها بشكل آمن عبر مزودي خدمات الدفع).",
        "معلومات الاستخدام: كيفية تفاعلك مع خدماتنا، الصفحات المزارة، والوقت المستغرق.",
        "المعلومات التقنية: عنوان IP، نوع المتصفح، نظام التشغيل، ومعلومات الجهاز."
      ]
    },
    {
      icon: Eye,
      title: "كيف نستخدم معلوماتك",
      content: [
        "تقديم وتحسين خدماتنا وتخصيص تجربتك.",
        "معالجة الطلبات والمعاملات المالية.",
        "التواصل معك بخصوص الطلبات والتحديثات والعروض.",
        "تحليل استخدام الموقع لتحسين الأداء والمحتوى.",
        "حماية حقوقنا ومنع الاستخدام غير المصرح به.",
        "الامتثال للمتطلبات القانونية والتنظيمية."
      ]
    },
    {
      icon: Users,
      title: "مشاركة المعلومات",
      content: [
        "لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة.",
        "قد نشارك المعلومات مع مزودي الخدمات الموثوقين الذين يساعدوننا في تشغيل أعمالنا.",
        "قد نفصح عن المعلومات عند الضرورة للامتثال للقانون أو حماية حقوقنا.",
        "في حالة الاندماج أو الاستحواذ، قد يتم نقل معلوماتك للكيان الجديد."
      ]
    },
    {
      icon: Lock,
      title: "أمان البيانات",
      content: [
        "نستخدم تشفير SSL/TLS لحماية البيانات أثناء النقل.",
        "نطبق إجراءات أمان تقنية وإدارية لحماية معلوماتك.",
        "الوصول إلى البيانات الشخصية مقيد للموظفين المصرح لهم فقط.",
        "نراجع ونحدث إجراءات الأمان بشكل دوري."
      ]
    },
    {
      icon: Bell,
      title: "حقوقك",
      content: [
        "الوصول إلى معلوماتك الشخصية وطلب نسخة منها.",
        "تصحيح أي معلومات غير دقيقة أو غير كاملة.",
        "طلب حذف معلوماتك الشخصية (مع مراعاة الالتزامات القانونية).",
        "الاعتراض على معالجة بياناتك لأغراض التسويق.",
        "سحب موافقتك في أي وقت عندما تكون المعالجة مبنية على الموافقة."
      ]
    },
    {
      icon: FileText,
      title: "ملفات تعريف الارتباط (Cookies)",
      content: [
        "نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح.",
        "ملفات تعريف الارتباط الضرورية: لتشغيل الموقع بشكل صحيح.",
        "ملفات تعريف الارتباط التحليلية: لفهم كيفية استخدام الموقع.",
        "يمكنك إدارة تفضيلات ملفات تعريف الارتباط من إعدادات المتصفح."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-teal-500/10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-blue-500/20 text-blue-400 border-blue-500/30 text-lg px-6 py-2">
              <Shield className="w-5 h-5 ml-2" />
              سياسة الخصوصية
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-l from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                نحمي خصوصيتك
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              نلتزم بحماية خصوصيتك وأمان بياناتك الشخصية. تشرح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك.
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
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
            className="mt-12 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-2xl p-8 text-center"
          >
            <Mail className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2">أسئلة حول الخصوصية؟</h3>
            <p className="text-muted-foreground mb-4">
              إذا كانت لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا.
            </p>
            <a 
              href="mailto:privacy@ashholding.com" 
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              privacy@ashholding.com
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
