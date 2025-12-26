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
  Palette, 
  Image, 
  PenTool, 
  Layers, 
  User, 
  Store, 
  Building2, 
  Send, 
  Sparkles,
  Rocket,
  Eye,
  Clock,
  Wand2,
  ArrowLeft,
  Zap,
  Frame,
  FileImage,
  Video,
  UserPlus,
  BookOpen,
  Presentation,
  Megaphone,
  Package,
  Crown,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DesignServices = () => {
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
          subject: `طلب خدمة تصميم: ${formData.projectType}`,
          message: `نوع التصميم: ${formData.projectType}\nالميزانية التقريبية: ${formData.budget}\n\nتفاصيل المشروع:\n${formData.description}`
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
    { icon: Image, title: "تصميم شعارات", description: "هوية بصرية فريدة تعكس شخصيتك" },
    { icon: FileImage, title: "تصاميم سوشيال ميديا", description: "محتوى جذاب لحساباتك الشخصية" },
    { icon: PenTool, title: "كروت شخصية", description: "تصاميم احترافية تترك انطباعاً" },
    { icon: Frame, title: "بورتفوليو إبداعي", description: "معرض أعمال يبرز إبداعاتك" }
  ];

  const storeServices = [
    { icon: Package, title: "تصميم تغليف المنتجات", description: "عبوات جذابة تزيد المبيعات" },
    { icon: Megaphone, title: "إعلانات ترويجية", description: "تصاميم إعلانية مؤثرة" },
    { icon: BookOpen, title: "كتالوجات المنتجات", description: "عرض احترافي لمنتجاتك" },
    { icon: Target, title: "بانرات المتجر", description: "صور عرض جاذبة للعملاء" }
  ];

  const companyServices = [
    { icon: Crown, title: "هوية بصرية متكاملة", description: "براند كامل يعكس قيم شركتك" },
    { icon: Presentation, title: "عروض تقديمية", description: "بريزنتيشن احترافي ومؤثر" },
    { icon: Video, title: "موشن جرافيك", description: "فيديوهات متحركة مذهلة" },
    { icon: Layers, title: "مطبوعات الشركات", description: "جميع المواد المطبوعة بتصميم موحد" }
  ];

  const features = [
    { icon: Rocket, title: "تسليم سريع", description: "نلتزم بالمواعيد المحددة" },
    { icon: Eye, title: "تصاميم فريدة", description: "إبداع بلا حدود" },
    { icon: Clock, title: "تعديلات مجانية", description: "حتى الوصول للنتيجة المثالية" },
    { icon: Zap, title: "جودة عالية", description: "ملفات بدقة احترافية" }
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
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-background to-purple-500/5" />
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-20 right-20 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90]
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 px-4 py-2 text-sm bg-pink-500/10 text-pink-500 border-pink-500/20">
              <Palette className="w-4 h-4 ml-2" />
              خدمات التصميم الإبداعي
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-l from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              نصنع هويتك البصرية المميزة
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              فريق من المصممين المحترفين يحول أفكارك إلى تصاميم إبداعية تجذب الأنظار
              وتترك انطباعاً لا يُنسى
            </p>

            {/* Login Notice */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-l from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-6 mb-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-pink-500" />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">خدمات تصميم جاهزة للطلب!</p>
                    <p className="text-sm text-muted-foreground">سجل الآن لاستعراض جميع خدمات التصميم المتاحة</p>
                  </div>
                </div>
                <Link to="/auth">
                  <Button className="gap-2 bg-gradient-to-l from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    <Sparkles className="w-4 h-4" />
                    سجل الآن
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="gap-2 bg-gradient-to-l from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}>
                <Send className="w-5 h-5" />
                اطلب تصميمك الآن
              </Button>
              <Link to="/dashboard/design-services">
                <Button size="lg" variant="outline" className="gap-2 border-pink-500/30 hover:bg-pink-500/10">
                  <Palette className="w-5 h-5" />
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
                className="text-center p-6 rounded-2xl bg-background border border-border/50 hover:border-pink-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-pink-500" />
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
              نقدم تصاميم إبداعية مخصصة لكل فئة، اختر الفئة المناسبة لك
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
                    <Card className="h-full hover:shadow-xl hover:border-pink-500/30 transition-all duration-300 group">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-7 h-7 text-pink-500" />
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
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-pink-500/10 text-pink-500 border-pink-500/20">
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
                    <Card className="h-full hover:shadow-xl hover:border-purple-500/30 transition-all duration-300 group">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-purple-500/10 text-purple-500 border-purple-500/20">
                  <Store className="w-4 h-4 ml-2" />
                  تصاميم تزيد مبيعاتك
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
                    <Card className="h-full hover:shadow-xl hover:border-fuchsia-500/30 transition-all duration-300 group">
                      <CardHeader>
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-7 h-7 text-fuchsia-500" />
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
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20">
                  <Building2 className="w-4 h-4 ml-2" />
                  هوية بصرية متكاملة
                </Badge>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Portfolio Showcase */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-2 bg-purple-500/10 text-purple-500 border-purple-500/20">
              <Wand2 className="w-4 h-4 ml-2" />
              أعمالنا الإبداعية
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">نماذج من إبداعاتنا</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              نفخر بتقديم تصاميم استثنائية لعملائنا في مختلف المجالات
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { title: "هويات بصرية", count: "+150", icon: Crown, color: "pink" },
              { title: "تصاميم سوشيال", count: "+500", icon: Megaphone, color: "purple" },
              { title: "موشن جرافيك", count: "+80", icon: Video, color: "fuchsia" }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative group"
              >
                <div className={`p-8 rounded-2xl bg-gradient-to-br from-${item.color}-500/10 to-${item.color}-500/5 border border-${item.color}-500/20 hover:border-${item.color}-500/40 transition-all duration-300`}>
                  <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-8 h-8 text-${item.color}-500`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className={`text-4xl font-bold text-${item.color}-500`}>{item.count}</p>
                  <p className="text-muted-foreground mt-2">مشروع منجز</p>
                </div>
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
              <Badge className="mb-4 px-4 py-2 bg-pink-500/10 text-pink-500 border-pink-500/20">
                <Sparkles className="w-4 h-4 ml-2" />
                طلب تصميم خاص
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
              <Card className="border-2 border-pink-500/20 shadow-xl">
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
                        <Label htmlFor="company">اسم الشركة/المشروع</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="h-12"
                          placeholder="اسم شركتك أو مشروعك"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="projectType">نوع التصميم المطلوب *</Label>
                        <Input
                          id="projectType"
                          value={formData.projectType}
                          onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                          required
                          className="h-12"
                          placeholder="مثال: شعار، هوية بصرية، موشن"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget">الميزانية التقريبية</Label>
                        <Input
                          id="budget"
                          value={formData.budget}
                          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                          className="h-12"
                          placeholder="مثال: 500 - 1000 ريال"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">تفاصيل المشروع *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        className="min-h-[150px] resize-none"
                        placeholder="اشرح لنا فكرتك بالتفصيل... ما هي الألوان المفضلة؟ هل لديك أمثلة تصاميم تعجبك؟"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-14 text-lg gap-2 bg-gradient-to-l from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
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

export default DesignServices;
