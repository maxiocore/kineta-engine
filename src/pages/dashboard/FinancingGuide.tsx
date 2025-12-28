import { motion } from "framer-motion";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import {
  Landmark,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Shield,
  FileSignature,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  CreditCard,
  Users,
  Briefcase,
  Code,
  Palette,
  Share2,
  Wallet,
  Ban,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const services = [
  {
    icon: Code,
    title: "خدمات البرمجة والتطوير",
    description: "تطوير المواقع، التطبيقات، الأنظمة، والبرمجيات المخصصة",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Palette,
    title: "خدمات التصميم",
    description: "تصميم الهوية البصرية، الشعارات، واجهات المستخدم، والجرافيك",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Share2,
    title: "خدمات مواقع التواصل",
    description: "إدارة الحسابات، زيادة المتابعين، والتسويق الرقمي",
    color: "from-purple-500 to-violet-600",
  },
];

const benefits = [
  { icon: Sparkles, text: "بدون فوائد نهائياً" },
  { icon: Clock, text: "موافقة سريعة خلال 24 ساعة" },
  { icon: Shield, text: "أمان وسرية تامة" },
  { icon: FileSignature, text: "عقود واضحة وملزمة" },
  { icon: CreditCard, text: "أقساط شهرية مريحة" },
  { icon: CheckCircle2, text: "استلام الخدمة فوراً" },
];

const eligibilityRequirements = [
  "أن يكون المتقدم سعودي الجنسية أو مقيم بإقامة سارية",
  "أن يكون عمر المتقدم 21 سنة فأكثر",
  "توفر هوية وطنية أو إقامة سارية المفعول",
  "رقم جوال مسجل باسم المتقدم",
  "بريد إلكتروني فعّال",
  "سجل نظيف من التعثرات السابقة",
];

const prohibitedActions = [
  "لا يمكن سحب مبلغ التمويل نقداً",
  "لا يمكن تحويل الرصيد لحسابات أخرى",
  "لا يمكن استرداد المبلغ بأي شكل",
  "الرصيد صالح فقط لخدماتنا داخل المنصة",
];

const faqs = [
  {
    question: "ما هي خدمات التمويل المتاحة؟",
    answer: "نوفر تمويلاً مرناً لخدمات البرمجة والتصميم ومواقع التواصل الاجتماعي فقط. يتم إضافة مبلغ التمويل كرصيد في حسابك لاستخدامه داخل منصتنا حصرياً.",
  },
  {
    question: "هل هناك فوائد على التمويل؟",
    answer: "لا، التمويل بدون أي فوائد أو رسوم خفية. المبلغ الذي تقسطه هو نفسه المبلغ الإجمالي بدون أي إضافات.",
  },
  {
    question: "كم تستغرق الموافقة على الطلب؟",
    answer: "نراجع الطلبات خلال 24 ساعة عمل. ستتلقى إشعاراً عبر البريد الإلكتروني بمجرد البت في طلبك.",
  },
  {
    question: "هل يمكنني سحب مبلغ التمويل؟",
    answer: "لا، مبلغ التمويل يُضاف كرصيد في حسابك لاستخدامه في شراء خدماتنا فقط، ولا يمكن سحبه أو تحويله بأي شكل.",
  },
  {
    question: "ماذا يحدث إذا تأخرت في سداد قسط؟",
    answer: "نتواصل معك لترتيب السداد. في حالة التأخر المتكرر، قد يتم اتخاذ إجراءات قانونية بموجب السند التنفيذي الموقع.",
  },
  {
    question: "متى يتم تسليم الخدمة؟",
    answer: "يتم تسليم الخدمة حسب الاتفاق المحدد في العقد. فور الموافقة على التمويل، يُضاف الرصيد لحسابك ويمكنك طلب الخدمات مباشرة.",
  },
  {
    question: "ما هي الوثائق المطلوبة؟",
    answer: "صورة الهوية الوطنية أو الإقامة، ورقم جوال مسجل باسمك. قد نطلب مستندات إضافية للمبالغ الكبيرة.",
  },
];

const steps = [
  {
    step: 1,
    title: "تحقق من أهليتك",
    description: "تأكد من استيفاء الشروط المطلوبة عبر أداة التحقق السريع",
    icon: Users,
  },
  {
    step: 2,
    title: "احسب أقساطك",
    description: "استخدم حاسبة التمويل لمعرفة قيمة الأقساط الشهرية",
    icon: CreditCard,
  },
  {
    step: 3,
    title: "قدّم طلبك",
    description: "املأ نموذج التمويل بمعلوماتك الشخصية والمبلغ المطلوب",
    icon: FileText,
  },
  {
    step: 4,
    title: "انتظر المراجعة",
    description: "نراجع طلبك خلال 24 ساعة وتصلك النتيجة عبر الإيميل",
    icon: Clock,
  },
  {
    step: 5,
    title: "وقّع العقد",
    description: "في حالة الموافقة، وقّع السند التنفيذي إلكترونياً",
    icon: FileSignature,
  },
  {
    step: 6,
    title: "استلم رصيدك",
    description: "يُضاف الرصيد لحسابك فوراً لاستخدامه في خدماتنا",
    icon: Wallet,
  },
];

export default function FinancingGuide() {
  return (
    <ClientDashboardLayout>
      <motion.div
        className="space-y-8"
        dir="rtl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 border-0">
            <CardContent className="p-8 relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white/20" />
                <div className="absolute bottom-4 right-4 w-48 h-48 rounded-full bg-white/10" />
                <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-white/15" />
              </div>
              <div className="relative z-10 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    دليل شامل
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  تعليمات نظام التمويل المرن
                </h1>
                <p className="text-white/80 text-lg max-w-2xl mb-6">
                  كل ما تحتاج معرفته عن نظام التمويل بدون فوائد - الشروط، الخطوات،
                  الخدمات المتاحة، والأسئلة الشائعة.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-emerald-600 hover:bg-white/90"
                  >
                    <Link to="/dashboard/financing/apply">
                      تقديم طلب تمويل
                      <ArrowLeft className="h-4 w-4 mr-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <Link to="/dashboard/financing/calculator">
                      حاسبة التمويل
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            مميزات التمويل
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-all">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{benefit.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Available Services */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            الخدمات المتاحة للتمويل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="h-full overflow-hidden group hover:shadow-lg transition-all">
                  <div
                    className={`h-2 bg-gradient-to-r ${service.color}`}
                  />
                  <CardContent className="p-6">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <service.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How it Works */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                خطوات التمويل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                          {step.step}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Important Notes */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Eligibility Requirements */}
          <Card className="border-emerald-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                شروط الأهلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {eligibilityRequirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
                    <span className="text-sm">{req}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard/financing/eligibility">
                  تحقق من أهليتك الآن
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Prohibited Actions */}
          <Card className="border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <Ban className="h-5 w-5" />
                تنبيهات مهمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {prohibitedActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-400">تنبيه قانوني</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      يتم توقيع سند تنفيذي ملزم قانونياً. عدم السداد قد يؤدي
                      لإجراءات قانونية.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Delivery */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    كيف يتم تسليم الخدمة؟
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    بمجرد الموافقة على طلب التمويل وتوقيع العقد، يُضاف مبلغ التمويل
                    كرصيد في حسابك على المنصة. يمكنك استخدام هذا الرصيد لشراء أي من
                    خدماتنا (البرمجة، التصميم، مواقع التواصل). يتم تنفيذ الخدمات حسب
                    المواعيد المتفق عليها مع فريقنا.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                      رصيد فوري
                    </Badge>
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                      استخدام مرن
                    </Badge>
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                      تنفيذ احترافي
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                الأسئلة الشائعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-right">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-3">
                جاهز للبدء؟
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                ابدأ رحلتك مع التمويل المرن واحصل على خدماتك الآن وادفع لاحقاً
                بدون أي فوائد.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Link to="/dashboard/financing/eligibility">
                    تحقق من الأهلية
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                >
                  <Link to="/dashboard/financing/calculator">
                    حاسبة التمويل
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                >
                  <Link to="/dashboard/financing/apply">
                    تقديم طلب
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </ClientDashboardLayout>
  );
}
