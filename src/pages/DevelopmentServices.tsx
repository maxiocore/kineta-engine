import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  Smartphone, 
  Globe, 
  Database, 
  ShoppingCart, 
  Building2, 
  User, 
  Store, 
  Send, 
  CheckCircle2, 
  Sparkles,
  Rocket,
  Shield,
  Clock,
  HeadphonesIcon,
  ArrowLeft,
  Zap,
  Settings,
  Layers,
  Monitor,
  Server,
  Lock,
  UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DevelopmentServices = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    projectType: "",
    budget: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('contact-form', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          subject: `طلب خدمة برمجية: ${formData.projectType}`,
          message: `نوع المشروع: ${formData.projectType}\nالميزانية التقريبية: ${formData.budget}\n\nتفاصيل المشروع:\n${formData.description}`
        }
      });

      if (error) throw error;

      toast.success("تم إرسال طلبك بنجاح! سنتواصل معك قريباً");
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        projectType: "",
        budget: "",
        description: ""
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء الإرسال. حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  const individualServices = [
    { icon: Globe, title: "مواقع شخصية", description: "موقع شخصي احترافي يعكس هويتك" },
    { icon: Smartphone, title: "تطبيقات بسيطة", description: "تطبيقات جوال لأفكارك الإبداعية" },
    { icon: Code, title: "سكربتات مخصصة", description: "أدوات برمجية حسب احتياجاتك" },
    { icon: Monitor, title: "بورتفوليو احترافي", description: "معرض أعمال يبرز مهاراتك" }
  ];

  const storeServices = [
    { icon: ShoppingCart, title: "متاجر إلكترونية", description: "متجر متكامل مع بوابات دفع" },
    { icon: Database, title: "أنظمة إدارة المخزون", description: "تتبع المنتجات والمبيعات" },
    { icon: Layers, title: "تكامل مع الشحن", description: "ربط مع شركات الشحن المحلية" },
    { icon: Settings, title: "لوحة تحكم متقدمة", description: "إدارة كاملة لمتجرك" }
  ];

  const companyServices = [
    { icon: Building2, title: "أنظمة ERP", description: "أنظمة إدارة موارد المؤسسات" },
    { icon: Server, title: "تطبيقات مؤسسية", description: "حلول برمجية للشركات الكبرى" },
    { icon: Lock, title: "أمان متقدم", description: "حماية بيانات على أعلى مستوى" },
    { icon: HeadphonesIcon, title: "دعم تقني 24/7", description: "فريق دعم متخصص على مدار الساعة" }
  ];

  const features = [
    { icon: Rocket, title: "تسليم سريع", description: "نلتزم بالمواعيد المحددة" },
    { icon: Shield, title: "جودة عالية", description: "كود نظيف وقابل للتطوير" },
    { icon: Clock, title: "دعم مستمر", description: "صيانة وتحديثات دورية" },
    { icon: Zap, title: "أداء متميز", description: "سرعة وكفاءة في التشغيل" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90]
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">
              <Code className="w-4 h-4 ml-2" />
              خدمات البرمجة والتطوير
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              نحول أفكارك إلى واقع رقمي
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              فريق من المطورين المحترفين جاهز لتنفيذ مشروعك البرمجي بأعلى معايير الجودة
              سواء كنت فرداً أو متجراً أو شركة
            </p>

            {/* Login Notice */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-l from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6 mb-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">خدمات برمجية جاهزة للطلب!</p>
                    <p className="text-sm text-muted-foreground">سجل الآن لاستعراض جميع خدماتنا البرمجية المتاحة</p>
                  </div>
                </div>
                <Link to="/auth">
                  <Button className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    سجل الآن
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="gap-2" onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}>
                <Send className="w-5 h-5" />
                اطلب مشروعك الآن
              </Button>
              <Link to="/dashboard/dev-services">
                <Button size="lg" variant="outline" className="gap-2">
                  <Code className="w-5 h-5" />
                  استعرض الخدمات الجاهزة
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Tabs Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">خدماتنا حسب احتياجك</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              نقدم حلول برمجية مخصصة لكل فئة، اختر الفئة المناسبة لك
            </p>
          </motion.div>

          <Tabs defaultValue="individuals" className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-10 h-auto p-1">
              <TabsTrigger value="individuals" className="flex items-center gap-2 py-3">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">للأفراد</span>
              </TabsTrigger>
              <TabsTrigger value="stores" className="flex items-center gap-2 py-3">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">للمتاجر</span>
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex items-center gap-2 py-3">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">للشركات</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individuals">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {individualServices.map((service, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="h-full hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-7 h-7 text-blue-500" />
                        </div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{service.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
              <div className="text-center mt-8">
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  <User className="w-4 h-4 ml-2" />
                  مثالي للمستقلين والمبدعين
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="stores">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {storeServices.map((service, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="h-full hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-7 h-7 text-green-500" />
                        </div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{service.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
              <div className="text-center mt-8">
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  <Store className="w-4 h-4 ml-2" />
                  حلول متكاملة للتجارة الإلكترونية
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="companies">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {companyServices.map((service, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="h-full hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-7 h-7 text-purple-500" />
                        </div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{service.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
              <div className="text-center mt-8">
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  <Building2 className="w-4 h-4 ml-2" />
                  حلول مؤسسية متقدمة
                </Badge>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Request Form Section */}
      <section id="request-form" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="mb-4 px-4 py-2 bg-accent/10 text-accent border-accent/20">
                <Sparkles className="w-4 h-4 ml-2" />
                طلب مشروع خاص
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">أرسل لنا تفاصيل مشروعك</h2>
              <p className="text-muted-foreground">
                سنقوم بدراسة طلبك والتواصل معك خلال 24 ساعة
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-border/50 shadow-xl">
                <CardContent className="p-6 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم الكامل *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="أدخل اسمك"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="example@email.com"
                          required
                          className="h-12"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">رقم الجوال *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+966 5XX XXX XXXX"
                          required
                          className="h-12"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">اسم الشركة / المتجر (اختياري)</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="اسم شركتك أو متجرك"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="projectType">نوع المشروع *</Label>
                        <Input
                          id="projectType"
                          value={formData.projectType}
                          onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                          placeholder="مثال: موقع ويب، تطبيق جوال، نظام ERP"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget">الميزانية التقريبية</Label>
                        <Input
                          id="budget"
                          value={formData.budget}
                          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                          placeholder="مثال: 5000 - 10000 ريال"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">تفاصيل المشروع *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="اشرح لنا فكرة مشروعك بالتفصيل، ما هي المميزات التي تريدها؟ ما هو الهدف من المشروع؟"
                        required
                        className="min-h-[150px] resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="flex-1 gap-2 h-14 text-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Settings className="w-5 h-5" />
                            </motion.div>
                            جاري الإرسال...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            إرسال الطلب
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                رد خلال 24 ساعة
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                استشارة مجانية
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                أسعار تنافسية
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                ضمان الجودة
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-l from-primary via-primary/90 to-accent rounded-3xl p-8 md:p-14 text-center overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
              />
              <motion.div
                animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
                transition={{ duration: 12, repeat: Infinity }}
                className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
              />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                هل لديك مشروع في ذهنك؟
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                دعنا نساعدك في تحويل فكرتك إلى منتج رقمي ناجح
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/contact">
                  <Button size="lg" variant="secondary" className="gap-2 h-14 px-8">
                    <HeadphonesIcon className="w-5 h-5" />
                    تواصل معنا
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="gap-2 h-14 px-8 bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <UserPlus className="w-5 h-5" />
                    سجل واستكشف خدماتنا
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DevelopmentServices;
