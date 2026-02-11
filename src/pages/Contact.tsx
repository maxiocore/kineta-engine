import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Phone, 
  Send, 
  MessageSquare,
  Clock,
  CheckCircle,
  Loader2,
  Sparkles,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Headphones,
  MessageCircle,
  Zap,
  Shield,
  Wifi,
  MonitorSmartphone,
  CloudCog,
  AlertTriangle,
  Video,
  Rocket,
  Users,
  Star,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";

const contactMethods = [
  {
    icon: Phone,
    title: "اتصل بنا",
    value: "0555812567",
    description: "متاحون من 9 ص - 7 م",
    dir: "ltr" as const,
    gradient: "from-cyan-500 to-blue-600",
    action: "tel:+966555812567",
    hoverColor: "group-hover:shadow-cyan-500/30"
  },
  {
    icon: Mail,
    title: "راسلنا",
    value: "info@ash-holding.sa",
    description: "نرد خلال 24 ساعة",
    gradient: "from-pink-500 to-rose-600",
    action: "mailto:info@ash-holding.sa",
    hoverColor: "group-hover:shadow-pink-500/30"
  },
  {
    icon: Video,
    title: "اجتماع فيديو",
    value: "حجز موعد",
    description: "استشارة مباشرة أونلاين",
    gradient: "from-violet-500 to-purple-600",
    action: "#",
    hoverColor: "group-hover:shadow-violet-500/30"
  },
  {
    icon: MessageCircle,
    title: "واتساب",
    value: "محادثة فورية",
    description: "رد سريع ومباشر",
    gradient: "from-emerald-500 to-green-600",
    action: "https://wa.me/966555812567",
    hoverColor: "group-hover:shadow-emerald-500/30"
  },
];

const socialLinks = [
  { icon: Twitter, label: "تويتر", href: "#", color: "hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]" },
  { icon: Instagram, label: "انستجرام", href: "#", color: "hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white hover:border-transparent" },
  { icon: Linkedin, label: "لينكدإن", href: "#", color: "hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]" },
  { icon: Facebook, label: "فيسبوك", href: "#", color: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]" },
];

const onlineFeatures = [
  { 
    icon: Wifi, 
    title: "تواصل فوري",
    description: "اتصال مباشر عبر الإنترنت بدون حدود جغرافية"
  },
  { 
    icon: MonitorSmartphone, 
    title: "خدمة من أي مكان",
    description: "نخدمك أينما كنت في العالم"
  },
  { 
    icon: CloudCog, 
    title: "منصة سحابية",
    description: "جميع خدماتنا متاحة أونلاين 24/7"
  },
  { 
    icon: Rocket, 
    title: "سرعة في الإنجاز",
    description: "توفير الوقت بدون حاجة للحضور"
  },
];

const features = [
  { icon: Zap, title: "رد سريع", description: "خلال 24 ساعة", color: "from-amber-500 to-orange-600" },
  { icon: Headphones, title: "دعم متخصص", description: "فريق خبراء", color: "from-blue-500 to-cyan-600" },
  { icon: Shield, title: "حلول مخصصة", description: "لاحتياجاتك", color: "from-emerald-500 to-teal-600" },
  { icon: Users, title: "فريق محترف", description: "+50 مشروع", color: "from-purple-500 to-pink-600" },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const formRef = useRef(null);
  const formInView = useInView(formRef, { once: true, margin: "-100px" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("يرجى إدخال الاسم");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("يرجى كتابة رسالتك");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('contact-form', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          company: formData.company.trim() || undefined,
          subject: formData.subject.trim() || undefined,
          message: formData.message.trim(),
        },
      });

      if (error) throw error;

      if (data?.success) {
        setFormSubmitted(true);
        toast.success("تم إرسال رسالتك بنجاح! سنتواصل معك قريباً");
        setFormData({ name: "", email: "", phone: "", company: "", subject: "", message: "" });
      } else {
        throw new Error(data?.error || "حدث خطأ غير متوقع");
      }
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      toast.error(error.message || "حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden" dir="rtl">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/10 to-violet-500/10 rounded-full blur-[150px]" />
            
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                backgroundSize: '40px 40px',
              }}
            />
            
            {/* Floating Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/30 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -40, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 5 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}
          </div>
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
                <span className="text-sm font-medium text-primary">تواصل معنا أونلاين</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                نحن هنا{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-l from-cyan-400 via-primary to-accent bg-clip-text text-transparent">
                    لمساعدتك
                  </span>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                  />
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
              >
                لديك سؤال أو استفسار؟ فريقنا جاهز للرد عليك ومساعدتك في تحقيق أهدافك من أي مكان في العالم
              </motion.p>

              {/* Online Business Highlight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 10px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-emerald-500"
                />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  نعمل بالكامل أونلاين - خدماتنا رقمية 100%
                </span>
                <Globe className="w-5 h-5 text-emerald-500" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Online Only Warning Banner */}
        <section className="py-6">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 p-6"
            >
              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-right">
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
                >
                  <AlertTriangle className="w-7 h-7 text-white" />
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                    تنبيه هام: لا يوجد مقر فعلي
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base">
                    نحن شركة رقمية بالكامل. جميع خدماتنا تُقدم عن بُعد عبر الإنترنت، ولا نستقبل زيارات في موقع فعلي.
                    <span className="text-amber-600 dark:text-amber-400 font-medium"> تواصل معنا أونلاين!</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center"
                  >
                    <Wifi className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center"
                  >
                    <CloudCog className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Online Features Grid */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3">لماذا العمل أونلاين؟</h2>
              <p className="text-muted-foreground">مزايا التواصل الرقمي معنا</p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {onlineFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative p-5 md:p-6 rounded-2xl bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl border border-border/50 hover:border-primary/40 transition-all duration-300 text-center group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow"
                  >
                    <feature.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  
                  <h3 className="font-bold text-base md:text-lg mb-2">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Methods Cards */}
        <section className="py-8 md:py-12">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3">طرق التواصل</h2>
              <p className="text-muted-foreground">اختر الطريقة الأنسب لك</p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {contactMethods.map((item, index) => (
                <motion.a
                  key={item.title}
                  href={item.action}
                  target={item.action.startsWith('http') ? '_blank' : undefined}
                  rel={item.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`relative p-5 md:p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 hover:border-primary/40 transition-all duration-300 text-center group overflow-hidden cursor-pointer hover:shadow-xl ${item.hoverColor}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                  >
                    <item.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  
                  <h3 className="font-bold text-base md:text-lg mb-1">{item.title}</h3>
                  <p className={`text-primary font-medium text-sm ${item.dir === "ltr" ? "dir-ltr" : ""}`} dir={item.dir}>
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  
                  <motion.div
                    className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.2 }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                  </motion.div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content - Form & Info */}
        <section ref={formRef} className="py-12 md:py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
          
          <div className="container px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={formInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative p-6 md:p-8 lg:p-10 rounded-3xl overflow-hidden">
                  {/* Card Background */}
                  <div className="absolute inset-0 bg-card/90 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                  <div className="absolute inset-[1px] rounded-3xl border border-border/50" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                      >
                        <MessageSquare className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold">أرسل لنا رسالة</h2>
                        <p className="text-sm text-muted-foreground">سنرد عليك في أقرب وقت عبر البريد الإلكتروني</p>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {formSubmitted ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="text-center py-12"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
                          >
                            <CheckCircle className="w-10 h-10 text-white" />
                          </motion.div>
                          <h3 className="text-2xl font-bold mb-3 text-emerald-600 dark:text-emerald-400">
                            تم إرسال رسالتك بنجاح!
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            شكراً لتواصلك معنا. سنرد عليك خلال 24 ساعة كحد أقصى على بريدك الإلكتروني.
                          </p>
                          <Button
                            onClick={() => setFormSubmitted(false)}
                            variant="outline"
                            className="gap-2"
                          >
                            <Send className="w-4 h-4" />
                            إرسال رسالة أخرى
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.form
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onSubmit={handleSubmit}
                          className="space-y-5"
                        >
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-sm font-medium">الاسم الكامل *</Label>
                              <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'name' ? 'ring-2 ring-primary/50' : ''}`}>
                                <Input
                                  id="name"
                                  placeholder="أدخل اسمك"
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  onFocus={() => setFocusedField('name')}
                                  onBlur={() => setFocusedField(null)}
                                  className="h-11 bg-secondary/50 border-border/50 rounded-xl focus:border-primary"
                                  maxLength={100}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني *</Label>
                              <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-primary/50' : ''}`}>
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="example@email.com"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  onFocus={() => setFocusedField('email')}
                                  onBlur={() => setFocusedField(null)}
                                  className="h-11 bg-secondary/50 border-border/50 rounded-xl focus:border-primary"
                                  dir="ltr"
                                  maxLength={255}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="phone" className="text-sm font-medium">رقم الجوال</Label>
                              <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'phone' ? 'ring-2 ring-primary/50' : ''}`}>
                                <Input
                                  id="phone"
                                  placeholder="+966 5X XXX XXXX"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  onFocus={() => setFocusedField('phone')}
                                  onBlur={() => setFocusedField(null)}
                                  className="h-11 bg-secondary/50 border-border/50 rounded-xl focus:border-primary"
                                  dir="ltr"
                                  maxLength={20}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="company" className="text-sm font-medium">اسم الشركة</Label>
                              <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'company' ? 'ring-2 ring-primary/50' : ''}`}>
                                <Input
                                  id="company"
                                  placeholder="اسم شركتك (اختياري)"
                                  value={formData.company}
                                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                  onFocus={() => setFocusedField('company')}
                                  onBlur={() => setFocusedField(null)}
                                  className="h-11 bg-secondary/50 border-border/50 rounded-xl focus:border-primary"
                                  maxLength={100}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="subject" className="text-sm font-medium">الموضوع</Label>
                            <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'subject' ? 'ring-2 ring-primary/50' : ''}`}>
                              <Input
                                id="subject"
                                placeholder="موضوع الرسالة"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                onFocus={() => setFocusedField('subject')}
                                onBlur={() => setFocusedField(null)}
                                className="h-11 bg-secondary/50 border-border/50 rounded-xl focus:border-primary"
                                maxLength={200}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="message" className="text-sm font-medium">رسالتك *</Label>
                            <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'message' ? 'ring-2 ring-primary/50' : ''}`}>
                              <Textarea
                                id="message"
                                placeholder="اكتب رسالتك هنا..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                onFocus={() => setFocusedField('message')}
                                onBlur={() => setFocusedField(null)}
                                className="min-h-[120px] bg-secondary/50 border-border/50 rounded-xl focus:border-primary resize-none"
                                maxLength={1000}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-left" dir="ltr">
                              {formData.message.length}/1000
                            </p>
                          </div>

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <Button 
                              type="submit" 
                              size="lg" 
                              className="w-full h-12 gap-3 text-base rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl shadow-primary/25"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  جاري الإرسال...
                                </>
                              ) : (
                                <>
                                  <Send className="w-5 h-5" />
                                  إرسال الرسالة
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* Info Side */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={formInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6"
              >
                {/* Quick Features */}
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={formInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.03, y: -5 }}
                      className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all group"
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg`}
                      >
                        <feature.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <p className="font-bold">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Social Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={formInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7 }}
                  className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50"
                >
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    تابعنا على السوشيال ميديا
                  </h3>
                  <div className="flex items-center gap-3">
                    {socialLinks.map((social) => (
                      <motion.a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.15, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/50 transition-all duration-300 ${social.color}`}
                        title={social.label}
                      >
                        <social.icon className="w-5 h-5" />
                      </motion.a>
                    ))}
                  </div>
                </motion.div>

                {/* Working Hours */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={formInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <motion.div 
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                    >
                      <Clock className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-lg">ساعات العمل</h3>
                      <p className="text-sm text-muted-foreground">متاحون لخدمتك أونلاين</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={formInView ? { x: 0, opacity: 1 } : {}}
                      transition={{ delay: 0.9 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex justify-between items-center py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-emerald-500"
                        />
                        <span className="font-medium">الأحد - الخميس</span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                        9:00 ص - 7:00 م
                      </span>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={formInView ? { x: 0, opacity: 1 } : {}}
                      transition={{ delay: 1.0 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex justify-between items-center py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                          className="w-2 h-2 rounded-full bg-amber-500"
                        />
                        <span className="font-medium">السبت</span>
                      </div>
                      <span className="font-bold text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                        2:00 م - 6:00 م
                      </span>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={formInView ? { x: 0, opacity: 1 } : {}}
                      transition={{ delay: 1.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex justify-between items-center py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="font-medium">الجمعة</span>
                      </div>
                      <span className="font-bold text-rose-500 group-hover:scale-105 transition-transform">
                        إجازة
                      </span>
                    </motion.div>
                  </div>
                  
                  {/* 24/7 Support Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={formInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.2 }}
                    className="mt-5 p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 via-primary/20 to-accent/20 border border-primary/30 relative overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="relative flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          boxShadow: ['0 0 0px hsl(var(--primary))', '0 0 20px hsl(var(--primary))', '0 0 0px hsl(var(--primary))']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-primary flex items-center justify-center"
                      >
                        <Headphones className="w-5 h-5 text-white" />
                      </motion.div>
                      <div className="text-center">
                        <p className="font-bold text-sm bg-gradient-to-l from-cyan-500 to-primary bg-clip-text text-transparent">
                          الدعم الفني متاح 24/7
                        </p>
                        <p className="text-xs text-muted-foreground">على مدار الساعة طوال أيام الأسبوع</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Star Rating */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={formInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.9 }}
                  className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1 + i * 0.1 }}
                        >
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        </motion.div>
                      ))}
                    </div>
                    <div>
                      <p className="font-bold">تقييم العملاء</p>
                      <p className="text-sm text-muted-foreground">4.9/5 من +100 عميل</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Quick Section */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3">أسئلة شائعة</h2>
              <p className="text-muted-foreground">إجابات سريعة على أكثر الأسئلة شيوعاً</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                { q: "هل يمكنني زيارة مقركم؟", a: "نحن شركة رقمية بالكامل ولا يوجد لدينا مقر فعلي. جميع خدماتنا تُقدم عن بُعد عبر الإنترنت" },
                { q: "كم تستغرق الاستجابة؟", a: "نرد على جميع الرسائل خلال 24 ساعة كحد أقصى عبر البريد الإلكتروني" },
                { q: "هل تقدمون استشارات مجانية؟", a: "نعم، نقدم استشارة أولية مجانية عبر الفيديو أو الهاتف لفهم احتياجاتك" },
                { q: "كيف يتم التواصل معكم؟", a: "يمكنك التواصل عبر الهاتف، البريد الإلكتروني، واتساب، أو نموذج التواصل" },
                { q: "هل تخدمون عملاء خارج السعودية؟", a: "نعم! بما أن خدماتنا أونلاين بالكامل، نخدم عملاء من جميع أنحاء العالم" },
                { q: "ما هي ساعات الدعم الفني؟", a: "الدعم الفني متاح 24/7 على مدار الساعة طوال أيام الأسبوع" },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all"
                >
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary shrink-0" />
                    {faq.q}
                  </h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Guarantee */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 relative overflow-hidden"
            >
              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
                >
                  <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </motion.div>
                
                <h2 className="text-2xl md:text-3xl font-bold mb-4">نضمن لك الرد السريع</h2>
                <p className="text-muted-foreground text-base md:text-lg mb-6">
                  فريقنا متاح للرد على استفساراتك خلال 24 ساعة كحد أقصى. 
                  نحن ملتزمون بتقديم أفضل خدمة لعملائنا من أي مكان في العالم.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {['رد خلال 24 ساعة', 'دعم متخصص', 'خدمة أونلاين 100%', 'حلول مخصصة'].map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border/50 hover:border-primary/40 transition-all"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
