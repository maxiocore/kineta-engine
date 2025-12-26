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
  Users, 
  TrendingUp, 
  MessageCircle, 
  BarChart3, 
  User, 
  Store, 
  Building2, 
  Send, 
  Sparkles,
  Rocket,
  Target,
  Clock,
  Calendar,
  ArrowLeft,
  Zap,
  Heart,
  Share2,
  UserPlus,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  LineChart,
  PieChart,
  Megaphone,
  Eye,
  ThumbsUp,
  Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SocialMediaServices = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    projectType: "",
    platforms: "",
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
          subject: `طلب إدارة سوشيال ميديا: ${formData.projectType}`,
          message: `نوع الخدمة: ${formData.projectType}\nالمنصات المطلوبة: ${formData.platforms}\n\nتفاصيل المشروع:\n${formData.description}`
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
        platforms: "",
        description: ""
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء الإرسال. حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  const individualServices = [
    { icon: Users, title: "زيادة المتابعين", description: "متابعين حقيقيين ومتفاعلين" },
    { icon: Heart, title: "زيادة التفاعل", description: "لايكات وتعليقات ومشاركات" },
    { icon: Eye, title: "زيادة المشاهدات", description: "وصول أكبر لمحتواك" },
    { icon: Share2, title: "نشر المحتوى", description: "توزيع محتواك على نطاق واسع" }
  ];

  const storeServices = [
    { icon: Megaphone, title: "حملات إعلانية", description: "إعلانات مدفوعة فعالة" },
    { icon: Calendar, title: "جدولة المحتوى", description: "نشر منظم ومستمر" },
    { icon: MessageCircle, title: "إدارة التعليقات", description: "رد سريع على العملاء" },
    { icon: BarChart3, title: "تقارير أداء", description: "تحليلات شهرية مفصلة" }
  ];

  const companyServices = [
    { icon: Target, title: "استراتيجية متكاملة", description: "خطة تسويقية شاملة" },
    { icon: LineChart, title: "إدارة الحملات", description: "حملات متعددة المنصات" },
    { icon: PieChart, title: "تحليل المنافسين", description: "دراسة السوق والمنافسة" },
    { icon: Bell, title: "مراقبة السمعة", description: "متابعة ذكر العلامة التجارية" }
  ];

  const platforms = [
    { icon: Instagram, name: "Instagram", color: "pink" },
    { icon: Facebook, name: "Facebook", color: "blue" },
    { icon: Twitter, name: "X (Twitter)", color: "sky" },
    { icon: Youtube, name: "YouTube", color: "red" }
  ];

  const features = [
    { icon: Rocket, title: "نتائج سريعة", description: "نمو ملحوظ خلال أيام" },
    { icon: Target, title: "استهداف دقيق", description: "وصول للجمهور المناسب" },
    { icon: Clock, title: "دعم مستمر", description: "متابعة على مدار الساعة" },
    { icon: Zap, title: "تقارير دورية", description: "تحليلات أداء مفصلة" }
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
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-background to-cyan-500/5" />
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90]
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 px-4 py-2 text-sm bg-blue-500/10 text-blue-500 border-blue-500/20">
              <Users className="w-4 h-4 ml-2" />
              خدمات إدارة السوشيال ميديا
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-l from-blue-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
              نبني حضورك الرقمي القوي
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              فريق متخصص في إدارة حسابات التواصل الاجتماعي وتحقيق نمو حقيقي
              لعلامتك التجارية على جميع المنصات
            </p>

            {/* Platforms Icons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-4 mb-8"
            >
              {platforms.map((platform, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className={`w-14 h-14 rounded-xl bg-${platform.color}-500/10 border border-${platform.color}-500/20 flex items-center justify-center`}
                >
                  <platform.icon className={`w-7 h-7 text-${platform.color}-500`} />
                </motion.div>
              ))}
            </motion.div>

            {/* Login Notice */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-l from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">خدمات سوشيال ميديا جاهزة!</p>
                    <p className="text-sm text-muted-foreground">سجل الآن لاستعراض جميع خدمات التواصل الاجتماعي</p>
                  </div>
                </div>
                <Link to="/auth">
                  <Button className="gap-2 bg-gradient-to-l from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                    <Sparkles className="w-4 h-4" />
                    سجل الآن
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="gap-2 bg-gradient-to-l from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600" onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}>
                <Send className="w-5 h-5" />
                اطلب استشارة مجانية
              </Button>
              <Link to="/dashboard/services">
                <Button size="lg" variant="outline" className="gap-2 border-blue-500/30 hover:bg-blue-500/10">
                  <TrendingUp className="w-5 h-5" />
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
                className="text-center p-6 rounded-2xl bg-background border border-border/50 hover:border-blue-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-blue-500" />
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
              نقدم حلول سوشيال ميديا مخصصة لكل فئة، اختر الفئة المناسبة لك
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
                    <Card className="h-full hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 group">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-blue-500/10 text-blue-500 border-blue-500/20">
                  <User className="w-4 h-4 ml-2" />
                  مثالي للمؤثرين وصناع المحتوى
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
                    <Card className="h-full hover:shadow-xl hover:border-cyan-500/30 transition-all duration-300 group">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-7 h-7 text-cyan-500" />
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
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
                  <Store className="w-4 h-4 ml-2" />
                  حلول تسويقية لزيادة المبيعات
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
                    <Card className="h-full hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 group">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-7 h-7 text-indigo-500" />
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
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                  <Building2 className="w-4 h-4 ml-2" />
                  إدارة احترافية للعلامات التجارية
                </Badge>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-2 bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
              <TrendingUp className="w-4 h-4 ml-2" />
              إنجازاتنا
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">أرقام تتحدث عن نجاحنا</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              نفخر بتحقيق نتائج استثنائية لعملائنا
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { title: "حساب مُدار", count: "+200", icon: Users, color: "blue" },
              { title: "متابع جديد", count: "+5M", icon: ThumbsUp, color: "cyan" },
              { title: "حملة ناجحة", count: "+500", icon: Megaphone, color: "indigo" },
              { title: "عميل سعيد", count: "+150", icon: Heart, color: "pink" }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className={`w-20 h-20 mx-auto rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center mb-4`}>
                  <item.icon className={`w-10 h-10 text-${item.color}-500`} />
                </div>
                <p className={`text-4xl font-bold text-${item.color}-500 mb-2`}>{item.count}</p>
                <p className="text-muted-foreground">{item.title}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Request Form Section */}
      <section id="request-form" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="mb-4 px-4 py-2 bg-blue-500/10 text-blue-500 border-blue-500/20">
                <Sparkles className="w-4 h-4 ml-2" />
                استشارة مجانية
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">احصل على استشارة مجانية</h2>
              <p className="text-muted-foreground">
                أخبرنا عن احتياجاتك وسنتواصل معك لتقديم أفضل الحلول
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-blue-500/20 shadow-xl">
                <CardContent className="p-6 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم الكامل *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="h-12"
                          placeholder="أدخل اسمك الكامل"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="h-12"
                          placeholder="example@email.com"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">رقم الجوال</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-12"
                          placeholder="+966 5X XXX XXXX"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">اسم الحساب/المشروع</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="h-12"
                          placeholder="اسم حسابك أو مشروعك"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="projectType">نوع الخدمة المطلوبة *</Label>
                        <Input
                          id="projectType"
                          value={formData.projectType}
                          onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                          required
                          className="h-12"
                          placeholder="مثال: إدارة حساب، زيادة متابعين"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="platforms">المنصات المطلوبة</Label>
                        <Input
                          id="platforms"
                          value={formData.platforms}
                          onChange={(e) => setFormData({ ...formData, platforms: e.target.value })}
                          className="h-12"
                          placeholder="مثال: انستقرام، تويتر، تيكتوك"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">تفاصيل إضافية</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[150px] resize-none"
                        placeholder="أخبرنا المزيد عن أهدافك وتوقعاتك..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-14 text-lg gap-2 bg-gradient-to-l from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          إرسال الطلب
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SocialMediaServices;
