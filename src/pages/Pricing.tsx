import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  ArrowLeft,
  Sparkles,
  Crown,
  Palette,
  Code,
  Megaphone,
  Share2,
  Star,
  Zap,
  Shield,
  TrendingUp,
  X,
  Table,
  User,
  Mail,
  Phone,
  Building,
  MessageSquare,
  Send,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";

// Comparison data for each category
const comparisonData = {
  social: {
    features: [
      { name: "عدد المنصات", values: ["منصة واحدة", "3 منصات", "جميع المنصات"] },
      { name: "عدد المنشورات", values: ["10 شهرياً", "20 شهرياً", "40 شهرياً"] },
      { name: "تصميم المحتوى", values: ["بسيط", "احترافي", "احترافي + فيديو"] },
      { name: "الريلز والستوريز", values: [false, true, true] },
      { name: "التقارير", values: ["شهرية", "أسبوعية", "يومية"] },
      { name: "الحملات الإعلانية", values: [false, false, true] },
      { name: "التحليلات المتقدمة", values: [false, false, true] },
      { name: "مدير حساب مخصص", values: [false, false, true] },
      { name: "الدعم الفني", values: ["بريد", "واتساب", "24/7"] },
      { name: "وقت الاستجابة", values: ["48 ساعة", "24 ساعة", "4 ساعات"] },
    ],
  },
  design: {
    features: [
      { name: "عدد التصاميم", values: ["تصميم واحد", "هوية كاملة", "باقة متكاملة"] },
      { name: "المراجعات", values: ["3 مراجعات", "5 مراجعات", "غير محدودة"] },
      { name: "تصميم الشعار", values: [false, true, true] },
      { name: "بطاقات الأعمال", values: [false, true, true] },
      { name: "الأوراق الرسمية", values: [false, true, true] },
      { name: "ملف الهوية البصرية", values: [false, true, true] },
      { name: "تصميم موقع UI", values: [false, false, true] },
      { name: "قوالب سوشيال ميديا", values: [false, false, true] },
      { name: "المطبوعات", values: [false, false, true] },
      { name: "مدة التسليم", values: ["3 أيام", "أسبوع", "2 أسبوع"] },
    ],
  },
  marketing: {
    features: [
      { name: "الاستراتيجية التسويقية", values: ["أساسية", "شاملة", "360 درجة"] },
      { name: "إعلانات جوجل", values: [true, true, true] },
      { name: "إعلانات السوشيال", values: [false, true, true] },
      { name: "تحسين SEO", values: ["أساسي", "متقدم", "متقدم + محلي"] },
      { name: "تسويق المحتوى", values: [false, true, true] },
      { name: "تسويق المؤثرين", values: [false, false, true] },
      { name: "الميزانية الإعلانية", values: ["2,000 ر.س", "5,000 ر.س", "15,000 ر.س"] },
      { name: "التقارير", values: ["شهرية", "أسبوعية", "يومية"] },
      { name: "فريق مخصص", values: [false, false, true] },
      { name: "الاستشارات", values: ["شهرية", "أسبوعية", "حسب الطلب"] },
    ],
  },
  development: {
    features: [
      { name: "نوع المشروع", values: ["موقع تعريفي", "متجر إلكتروني", "نظام مخصص"] },
      { name: "عدد الصفحات", values: ["5 صفحات", "غير محدود", "حسب الطلب"] },
      { name: "التصميم المتجاوب", values: [true, true, true] },
      { name: "نظام إدارة المحتوى", values: [false, true, true] },
      { name: "بوابات الدفع", values: [false, true, true] },
      { name: "تطبيق موبايل", values: [false, true, true] },
      { name: "تكامل الأنظمة", values: [false, false, true] },
      { name: "تحسين SEO", values: ["أساسي", "متقدم", "متقدم"] },
      { name: "مدة الدعم", values: ["شهر", "3 أشهر", "سنة"] },
      { name: "التدريب", values: [false, true, true] },
    ],
  },
};

const serviceCategories = [
  {
    id: "social",
    name: "مواقع التواصل الاجتماعي",
    icon: Share2,
    color: "from-blue-500 to-cyan-500",
    description: "إدارة وتنمية حساباتك على جميع المنصات",
    packages: [
      {
        name: "باقة الانطلاق",
        price: "499",
        period: "شهرياً",
        popular: false,
        features: [
          "إدارة منصة واحدة",
          "10 منشورات شهرياً",
          "تصميم بوستات بسيطة",
          "تقرير أداء شهري",
          "دعم عبر البريد",
        ],
      },
      {
        name: "باقة النمو",
        price: "1,499",
        period: "شهرياً",
        popular: true,
        features: [
          "إدارة 3 منصات",
          "20 منشور شهرياً",
          "تصميمات احترافية",
          "ريلز وستوريز",
          "تقارير أسبوعية",
          "دعم واتساب",
        ],
      },
      {
        name: "باقة الريادة",
        price: "2,999",
        period: "شهرياً",
        popular: false,
        features: [
          "إدارة جميع المنصات",
          "40 منشور شهرياً",
          "محتوى فيديو احترافي",
          "حملات إعلانية",
          "تحليلات متقدمة",
          "مدير حساب مخصص",
        ],
      },
    ],
  },
  {
    id: "design",
    name: "خدمات التصميم",
    icon: Palette,
    color: "from-purple-500 to-pink-500",
    description: "تصاميم إبداعية تعكس هوية علامتك التجارية",
    packages: [
      {
        name: "تصميم أساسي",
        price: "299",
        period: "للتصميم",
        popular: false,
        features: [
          "تصميم بوستر واحد",
          "3 مراجعات",
          "ملفات بجودة عالية",
          "تسليم خلال 3 أيام",
          "دعم فني",
        ],
      },
      {
        name: "هوية بصرية",
        price: "1,999",
        period: "للمشروع",
        popular: true,
        features: [
          "تصميم شعار احترافي",
          "بطاقة أعمال",
          "أوراق رسمية",
          "ملف الهوية البصرية",
          "5 مراجعات",
          "تسليم خلال أسبوع",
        ],
      },
      {
        name: "باقة متكاملة",
        price: "4,999",
        period: "للمشروع",
        popular: false,
        features: [
          "هوية بصرية كاملة",
          "تصميم موقع UI",
          "قوالب سوشيال ميديا",
          "بروشورات ومطبوعات",
          "مراجعات غير محدودة",
          "دعم مستمر لشهر",
        ],
      },
    ],
  },
  {
    id: "marketing",
    name: "التسويق الرقمي",
    icon: Megaphone,
    color: "from-orange-500 to-red-500",
    description: "استراتيجيات تسويقية لنمو أعمالك",
    packages: [
      {
        name: "باقة البداية",
        price: "1,999",
        period: "شهرياً",
        popular: false,
        features: [
          "استراتيجية تسويقية",
          "إعلانات جوجل",
          "تحسين SEO أساسي",
          "تقارير شهرية",
          "ميزانية 2000 ر.س",
        ],
      },
      {
        name: "باقة الاحتراف",
        price: "4,999",
        period: "شهرياً",
        popular: true,
        features: [
          "خطة تسويق شاملة",
          "إعلانات متعددة المنصات",
          "تحسين SEO متقدم",
          "تسويق بالمحتوى",
          "ميزانية 5000 ر.س",
          "تقارير أسبوعية",
        ],
      },
      {
        name: "باقة الشركات",
        price: "9,999",
        period: "شهرياً",
        popular: false,
        features: [
          "استراتيجية 360 درجة",
          "جميع المنصات الإعلانية",
          "تسويق المؤثرين",
          "تحليلات متقدمة",
          "ميزانية 15000 ر.س",
          "فريق مخصص",
        ],
      },
    ],
  },
  {
    id: "development",
    name: "البرمجة والتطوير",
    icon: Code,
    color: "from-green-500 to-emerald-500",
    description: "حلول برمجية متكاملة لأعمالك",
    packages: [
      {
        name: "موقع تعريفي",
        price: "2,999",
        period: "للمشروع",
        popular: false,
        features: [
          "تصميم متجاوب",
          "5 صفحات",
          "نموذج تواصل",
          "تحسين SEO أساسي",
          "دعم شهر واحد",
        ],
      },
      {
        name: "متجر إلكتروني",
        price: "7,999",
        period: "للمشروع",
        popular: true,
        features: [
          "منصة تجارة متكاملة",
          "بوابات دفع متعددة",
          "لوحة تحكم سهلة",
          "تطبيق موبايل",
          "دعم 3 أشهر",
          "تدريب مجاني",
        ],
      },
      {
        name: "نظام مخصص",
        price: "حسب الطلب",
        period: "",
        popular: false,
        features: [
          "تحليل متطلبات شامل",
          "تصميم حسب الطلب",
          "تكامل مع الأنظمة",
          "تطبيقات موبايل",
          "دعم تقني سنوي",
          "صيانة مستمرة",
        ],
      },
    ],
  },
];

interface PackageFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

const Pricing = () => {
  const [activeCategory, setActiveCategory] = useState("social");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{
    categoryName: string;
    categoryColor: string;
    packageName: string;
    packagePrice: string;
    packagePeriod: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PackageFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  const currentCategory = serviceCategories.find(cat => cat.id === activeCategory);

  const handlePackageSelect = (pkg: typeof serviceCategories[0]["packages"][0], category: typeof serviceCategories[0]) => {
    setSelectedPackage({
      categoryName: category.name,
      categoryColor: category.color,
      packageName: pkg.name,
      packagePrice: pkg.price,
      packagePeriod: pkg.period,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email to admin
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'info@ash-holding.sa',
          type: 'package_inquiry',
          data: {
            clientName: formData.name,
            clientEmail: formData.email,
            clientPhone: formData.phone,
            companyName: formData.company,
            message: formData.message,
            categoryName: selectedPackage?.categoryName,
            packageName: selectedPackage?.packageName,
            packagePrice: selectedPackage?.packagePrice,
            packagePeriod: selectedPackage?.packagePeriod,
          },
        },
      });

      if (emailError) throw emailError;

      // Send confirmation email to client
      await supabase.functions.invoke('send-email', {
        body: {
          to: formData.email,
          type: 'custom',
          data: {
            title: `شكراً لاهتمامك بباقة ${selectedPackage?.packageName}! 🎉`,
            message: `
              <p>مرحباً ${formData.name}،</p>
              <p>تم استلام طلبك لباقة <strong>${selectedPackage?.packageName}</strong> من قسم <strong>${selectedPackage?.categoryName}</strong>.</p>
              <p>سيتواصل معك فريقنا المختص خلال 24 ساعة لمناقشة التفاصيل وتلبية احتياجاتك.</p>
            `,
            customHtml: `
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 25px; margin-top: 20px; border-right: 4px solid #6366f1;">
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #64748b;">الباقة</span>
                  <span style="color: #1e293b; font-weight: 700;">${selectedPackage?.packageName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #64748b;">القسم</span>
                  <span style="color: #1e293b; font-weight: 700;">${selectedPackage?.categoryName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                  <span style="color: #64748b;">السعر</span>
                  <span style="color: #6366f1; font-weight: 700; font-size: 18px;">${selectedPackage?.packagePrice} ر.س${selectedPackage?.packagePeriod ? ` / ${selectedPackage?.packagePeriod}` : ''}</span>
                </div>
              </div>
            `,
          },
        },
      });

      toast({
        title: "تم الإرسال بنجاح! ✅",
        description: "سيتواصل معك فريقنا في أقرب وقت. تم إرسال تأكيد لبريدك الإلكتروني.",
      });

      setIsDialogOpen(false);
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background overflow-hidden">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-12 md:py-20 relative">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-10 left-[10%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-gradient-to-br from-cyan-500/30 to-blue-600/20 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute bottom-10 right-[5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-gradient-to-tr from-purple-500/30 to-primary/20 rounded-full blur-[120px]"
            />
          </div>
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-full bg-gradient-to-l from-primary/20 to-cyan-500/20 border border-primary/30 backdrop-blur-sm mb-6"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">باقات وعروض حصرية</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6"
              >
                باقات{" "}
                <span className="bg-gradient-to-l from-cyan-400 via-primary to-purple-500 bg-clip-text text-transparent">
                  خدماتنا المتكاملة
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base md:text-xl text-muted-foreground mb-8"
              >
                اكتشف باقاتنا المتنوعة في التسويق والتصميم والبرمجة، واختر ما يناسب احتياجاتك
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="py-6 md:py-8 relative z-10">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-2 md:gap-4"
            >
              {serviceCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(category.id)}
                    className={`
                      relative flex items-center gap-2 px-3 md:px-6 py-2.5 md:py-4 rounded-xl md:rounded-2xl font-medium text-xs md:text-base
                      transition-all duration-300 overflow-hidden
                      ${activeCategory === category.id
                        ? 'text-white shadow-xl'
                        : 'bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
                      }
                    `}
                  >
                    {activeCategory === category.id && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute inset-0 bg-gradient-to-l ${category.color}`}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5 md:gap-2">
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden sm:inline">{category.name}</span>
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Category Description */}
        <AnimatePresence mode="wait">
          <motion.section
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="py-4 md:py-6"
          >
            <div className="container px-4">
              <div className="text-center">
                <motion.div
                  className={`inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl bg-gradient-to-l ${currentCategory?.color} mb-3 md:mb-4`}
                >
                  {currentCategory && <currentCategory.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                  <span className="text-white font-bold text-sm md:text-lg">{currentCategory?.name}</span>
                </motion.div>
                <p className="text-muted-foreground text-sm md:text-lg">{currentCategory?.description}</p>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Pricing Cards */}
        <section className="py-8 md:py-16">
          <div className="container px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto"
              >
                {currentCategory?.packages.map((pkg, index) => (
                  <motion.div
                    key={pkg.name}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className={`relative p-5 md:p-8 rounded-2xl md:rounded-3xl border transition-all duration-300 ${
                      pkg.popular
                        ? `bg-gradient-to-b ${currentCategory.color.replace('from-', 'from-').replace('to-', 'to-')}/10 via-card to-card border-primary/40 shadow-2xl shadow-primary/20`
                        : "bg-card/80 backdrop-blur-xl border-border/50 hover:border-primary/40"
                    }`}
                  >
                    {pkg.popular && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2"
                      >
                        <Badge className={`bg-gradient-to-l ${currentCategory.color} text-white border-0 gap-1 md:gap-1.5 px-3 md:px-4 py-1 md:py-1.5 shadow-lg text-xs md:text-sm`}>
                          <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                          الأكثر طلباً
                        </Badge>
                      </motion.div>
                    )}

                    <div className="text-center mb-6 md:mb-8">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${currentCategory.color} flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg`}
                      >
                        {index === 0 && <Shield className="w-6 h-6 md:w-8 md:h-8 text-white" />}
                        {index === 1 && <Crown className="w-6 h-6 md:w-8 md:h-8 text-white" />}
                        {index === 2 && <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />}
                      </motion.div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{pkg.name}</h3>
                      
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-lg md:text-xl font-bold bg-gradient-to-l ${currentCategory.color} bg-clip-text text-transparent`}>
                          تواصل معنا للتسعير
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                      {pkg.features.map((feature, idx) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="flex items-center gap-2 md:gap-3 text-xs md:text-sm"
                        >
                          <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br ${currentCategory.color} flex items-center justify-center shrink-0`}>
                            <CheckCircle className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
                          </div>
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePackageSelect(pkg, currentCategory)}
                      className={`w-full gap-2 h-10 md:h-12 rounded-xl text-sm md:text-base ${
                        pkg.popular
                          ? `bg-gradient-to-l ${currentCategory.color} hover:opacity-90 shadow-lg`
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      اطلب الآن
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Comparison Table Section */}
        <section className="py-12 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 md:mb-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6"
              >
                <Table className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">مقارنة تفصيلية</span>
              </motion.div>
              <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">
                قارن بين{" "}
                <span className={`bg-gradient-to-l ${currentCategory?.color} bg-clip-text text-transparent`}>
                  الباقات
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-lg">
                اختر الباقة المناسبة لاحتياجاتك من خلال المقارنة التفصيلية
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory + "-table"}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                className="max-w-5xl mx-auto"
              >
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl">
                  {/* Table Header */}
                  <div className={`grid grid-cols-4 bg-gradient-to-l ${currentCategory?.color} text-white`}>
                    <div className="p-5 font-bold text-lg border-l border-white/20">المميزات</div>
                    {currentCategory?.packages.map((pkg, index) => (
                      <motion.div
                        key={pkg.name}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-5 text-center border-l border-white/20 last:border-l-0 ${pkg.popular ? 'bg-white/10' : ''}`}
                      >
                        <div className="font-bold text-lg">{pkg.name}</div>
                        {pkg.popular && (
                          <Badge className="mt-2 bg-white/20 text-white border-0 text-xs">
                            الأكثر طلباً
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-border/30">
                    {comparisonData[activeCategory as keyof typeof comparisonData]?.features.map((feature, rowIndex) => (
                      <motion.div
                        key={feature.name}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: rowIndex * 0.05 }}
                        className={`grid grid-cols-4 ${rowIndex % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-primary/5 transition-colors`}
                      >
                        <div className="p-4 font-medium text-foreground border-l border-border/30 flex items-center">
                          {feature.name}
                        </div>
                        {feature.values.map((value, colIndex) => (
                          <div
                            key={colIndex}
                            className={`p-4 text-center border-l border-border/30 last:border-l-0 flex items-center justify-center ${
                              currentCategory?.packages[colIndex]?.popular ? 'bg-primary/5' : ''
                            }`}
                          >
                            {typeof value === 'boolean' ? (
                              value ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg"
                                >
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </motion.div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
                                  <X className="w-4 h-4 text-muted-foreground/50" />
                                </div>
                              )
                            ) : (
                              <span className="text-sm font-medium">{value}</span>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    ))}
                  </div>

                  {/* Table Footer - CTA */}
                  <div className="grid grid-cols-4 bg-muted/30 border-t border-border/30">
                    <div className="p-5"></div>
                    {currentCategory?.packages.map((pkg) => (
                      <div key={pkg.name} className="p-5 text-center border-l border-border/30 last:border-l-0">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => handlePackageSelect(pkg, currentCategory)}
                            className={`w-full gap-2 ${
                              pkg.popular
                                ? `bg-gradient-to-l ${currentCategory.color} hover:opacity-90 shadow-lg text-white`
                                : "bg-secondary hover:bg-secondary/80"
                            }`}
                          >
                            اختر الباقة
                            <ArrowLeft className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile Comparison Cards */}
                <div className="md:hidden space-y-4">
                  {currentCategory?.packages.map((pkg, pkgIndex) => (
                    <motion.div
                      key={pkg.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: pkgIndex * 0.1 }}
                      className={`rounded-xl border overflow-hidden ${
                        pkg.popular
                          ? 'border-primary/50 shadow-xl shadow-primary/10'
                          : 'border-border/50'
                      }`}
                    >
                      {/* Card Header */}
                      <div className={`p-4 bg-gradient-to-l ${currentCategory.color} text-white text-center`}>
                        <h3 className="font-bold text-lg">{pkg.name}</h3>
                        <div className="text-sm font-medium mt-1 opacity-90">تواصل معنا للتسعير</div>
                        {pkg.popular && (
                          <Badge className="mt-2 bg-white/20 text-white border-0 text-xs">الأكثر طلباً</Badge>
                        )}
                      </div>

                      {/* Card Features */}
                      <div className="bg-card/80 backdrop-blur-xl divide-y divide-border/30">
                        {comparisonData[activeCategory as keyof typeof comparisonData]?.features.slice(0, 5).map((feature, idx) => (
                          <div key={feature.name} className="flex items-center justify-between p-3">
                            <span className="text-xs text-muted-foreground">{feature.name}</span>
                            <span className="font-medium text-xs">
                              {typeof feature.values[pkgIndex] === 'boolean' ? (
                                feature.values[pkgIndex] ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <X className="w-4 h-4 text-muted-foreground/30" />
                                )
                              ) : (
                                <span>{feature.values[pkgIndex]}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Card CTA */}
                      <div className="p-4 bg-muted/30">
                        <Button
                          onClick={() => handlePackageSelect(pkg, currentCategory)}
                          className={`w-full gap-2 h-10 ${
                            pkg.popular
                              ? `bg-gradient-to-l ${currentCategory.color} hover:opacity-90 shadow-lg text-white`
                              : "bg-secondary hover:bg-secondary/80"
                          }`}
                        >
                          اختر الباقة
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 md:mb-12"
            >
              <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">
                لماذا تختار{" "}
                <span className="bg-gradient-to-l from-primary to-cyan-400 bg-clip-text text-transparent">
                  خدماتنا؟
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-lg">
                نقدم لك أفضل الحلول الرقمية بجودة عالية وأسعار منافسة
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {[
                { icon: Zap, title: "سرعة التنفيذ", desc: "نلتزم بالمواعيد ونسلم في الوقت المحدد" },
                { icon: Star, title: "جودة عالية", desc: "معايير جودة صارمة في كل مشروع" },
                { icon: Shield, title: "ضمان الرضا", desc: "نضمن رضاك التام أو نعيد أموالك" },
                { icon: TrendingUp, title: "دعم مستمر", desc: "فريق دعم متاح على مدار الساعة" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mb-3 md:mb-4">
                    <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-24">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative max-w-4xl mx-auto text-center p-8 md:p-16 rounded-2xl md:rounded-[2.5rem] overflow-hidden"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-cyan-500/20" />
              <div className="absolute inset-0 backdrop-blur-xl" />
              <div className="absolute inset-[1px] rounded-2xl md:rounded-[2.5rem] bg-gradient-to-br from-card/90 to-card/70" />
              
              {/* Floating Elements */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 md:w-3 h-2 md:h-3 bg-primary/30 rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    right: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
              
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="inline-block mb-4 md:mb-6"
                >
                  <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                </motion.div>
                
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
                  جاهز للبدء في{" "}
                  <span className="bg-gradient-to-l from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    رحلة النجاح؟
                  </span>
                </h2>
                
                <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
                  تواصل معنا الآن واحصل على استشارة مجانية لتحديد الباقة المناسبة لاحتياجاتك
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => {
                        setSelectedPackage({
                          categoryName: "استشارة عامة",
                          categoryColor: "from-primary to-cyan-500",
                          packageName: "استشارة مجانية",
                          packagePrice: "مجاني",
                          packagePeriod: "",
                        });
                        setIsDialogOpen(true);
                      }}
                      className="bg-gradient-to-l from-primary to-cyan-500 hover:opacity-90 text-white gap-2 h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl text-base md:text-lg shadow-xl shadow-primary/30"
                    >
                      احصل على استشارة مجانية
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Package Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedPackage?.categoryColor || 'from-primary to-cyan-500'} flex items-center justify-center`}>
                <Send className="w-5 h-5 text-white" />
              </div>
              طلب باقة
            </DialogTitle>
          </DialogHeader>

          {/* Package Info */}
          {selectedPackage && (
            <div className={`p-4 rounded-xl bg-gradient-to-l ${selectedPackage.categoryColor}/10 border border-primary/20 mb-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">الباقة المختارة</span>
                <Badge className={`bg-gradient-to-l ${selectedPackage.categoryColor} text-white border-0`}>
                  {selectedPackage.categoryName}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{selectedPackage.packageName}</span>
                <span className={`font-bold text-xl bg-gradient-to-l ${selectedPackage.categoryColor} bg-clip-text text-transparent`}>
                  {selectedPackage.packagePrice} {selectedPackage.packagePeriod && `ر.س / ${selectedPackage.packagePeriod}`}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-primary" />
                الاسم الكامل <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسمك الكامل"
                className="text-right"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4 text-primary" />
                البريد الإلكتروني <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                className="text-right"
                dir="ltr"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4 text-primary" />
                رقم الجوال <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="05xxxxxxxx"
                className="text-right"
                dir="ltr"
                required
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2 text-sm font-medium">
                <Building className="w-4 h-4 text-primary" />
                اسم الشركة <span className="text-muted-foreground text-xs">(اختياري)</span>
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="اسم شركتك أو مشروعك"
                className="text-right"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="w-4 h-4 text-primary" />
                رسالة إضافية <span className="text-muted-foreground text-xs">(اختياري)</span>
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="أخبرنا المزيد عن احتياجاتك..."
                className="text-right min-h-[100px] resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-l from-primary to-cyan-500 hover:opacity-90 text-white gap-2 rounded-xl text-base shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  إرسال الطلب
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              سيتواصل معك فريقنا خلال 24 ساعة عبر الجوال أو البريد الإلكتروني
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
