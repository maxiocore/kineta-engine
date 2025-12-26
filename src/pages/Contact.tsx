import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare,
  Clock,
  CheckCircle,
  Loader2,
  Sparkles,
  ArrowLeft,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  ExternalLink,
  Building2,
  Headphones,
  MessageCircle,
  Zap,
  Shield,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";

const contactInfo = [
  {
    icon: Phone,
    title: "اتصل بنا",
    value: "+966 55 123 4567",
    description: "متاحون من 9 ص - 6 م",
    dir: "ltr" as const,
    gradient: "from-cyan-500 to-blue-600",
    action: "tel:+966551234567"
  },
  {
    icon: Mail,
    title: "راسلنا",
    value: "info@maxiocore.com",
    description: "نرد خلال 24 ساعة",
    gradient: "from-pink-500 to-rose-600",
    action: "mailto:info@maxiocore.com"
  },
  {
    icon: Globe,
    title: "موقعنا",
    value: "جدة، السعودية",
    description: "خدماتنا أونلاين بالكامل",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Clock,
    title: "ساعات العمل",
    value: "الأحد - الخميس",
    description: "9:00 ص - 6:00 م",
    gradient: "from-amber-500 to-orange-600",
  },
];

const socialLinks = [
  { icon: Twitter, label: "تويتر", href: "#", color: "hover:text-[#1DA1F2]" },
  { icon: Instagram, label: "انستجرام", href: "#", color: "hover:text-[#E4405F]" },
  { icon: Linkedin, label: "لينكدإن", href: "#", color: "hover:text-[#0A66C2]" },
  { icon: Facebook, label: "فيسبوك", href: "#", color: "hover:text-[#1877F2]" },
];

const features = [
  { icon: Zap, title: "رد سريع", description: "خلال 24 ساعة" },
  { icon: Headphones, title: "دعم متخصص", description: "فريق خبراء" },
  { icon: Shield, title: "حلول مخصصة", description: "لاحتياجاتك" },
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
            
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                backgroundSize: '40px 40px',
              }}
            />
            
            {/* Floating Particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/30 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
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
                <span className="text-sm font-medium text-primary">تواصل معنا</span>
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
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                لديك سؤال أو استفسار؟ فريقنا جاهز للرد عليك ومساعدتك في تحقيق أهدافك
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-8 md:py-12">
          <div className="container px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {contactInfo.map((item, index) => (
                <motion.a
                  key={item.title}
                  href={item.action || "#"}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative p-5 md:p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 hover:border-primary/40 transition-all duration-300 text-center group overflow-hidden cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg`}
                  >
                    <item.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </motion.div>
                  
                  <h3 className="font-bold text-sm md:text-base mb-1">{item.title}</h3>
                  <p className={`text-primary font-medium text-xs md:text-sm ${item.dir === "ltr" ? "dir-ltr" : ""}`} dir={item.dir}>
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content - Form & Map */}
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
                        <p className="text-sm text-muted-foreground">سنرد عليك في أقرب وقت</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                    </form>
                  </div>
                </div>
              </motion.div>

              {/* Map & Info Side */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={formInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6"
              >
                {/* Interactive Map */}
                <div className="relative rounded-3xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-xl">
                  <div className="aspect-[4/3] md:aspect-video lg:aspect-[4/3]">
                    {/* Google Maps Embed for Jeddah */}
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119066.41789625495!2d39.10220645!3d21.485811!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15c3d01fb1137e59%3A0xe059579737b118db!2sJeddah%20Saudi%20Arabia!5e0!3m2!1sen!2s!4v1703347200000!5m2!1sen!2s"
                      className="w-full h-full"
                      style={{ border: 0, filter: 'grayscale(20%) contrast(1.1)' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="موقعنا في جدة"
                    />
                  </div>
                  
                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/95 via-background/80 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">موقعنا</p>
                        <p className="text-xs text-muted-foreground">جدة، المملكة العربية السعودية - خدماتنا أونلاين</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={formInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 text-center hover:border-primary/40 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-bold text-sm">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Social Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={formInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7 }}
                  className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50"
                >
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    تابعنا على
                  </h3>
                  <div className="flex items-center gap-3">
                    {socialLinks.map((social, index) => (
                      <motion.a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-11 h-11 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/50 hover:border-primary/40 transition-all ${social.color}`}
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
                  className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold">ساعات العمل</h3>
                      <p className="text-sm text-muted-foreground">متاحون لخدمتك</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-muted-foreground">الأحد - الخميس</span>
                      <span className="font-medium">9:00 ص - 6:00 م</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">الجمعة - السبت</span>
                      <span className="text-rose-500 font-medium">مغلق</span>
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
                { q: "كم تستغرق الاستجابة؟", a: "نرد على جميع الرسائل خلال 24 ساعة كحد أقصى" },
                { q: "هل تقدمون استشارات مجانية؟", a: "نعم، نقدم استشارة أولية مجانية لفهم احتياجاتك" },
                { q: "ما هي طرق التواصل المتاحة؟", a: "يمكنك التواصل عبر الهاتف، البريد الإلكتروني، أو نموذج التواصل" },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
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
              className="max-w-3xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl"
              >
                <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-4">نضمن لك الرد السريع</h2>
              <p className="text-muted-foreground text-base md:text-lg mb-6">
                فريقنا متاح للرد على استفساراتك خلال 24 ساعة كحد أقصى. 
                نحن ملتزمون بتقديم أفضل خدمة لعملائنا.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                {['رد خلال 24 ساعة', 'دعم متخصص', 'حلول مخصصة'].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border/50"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">{item}</span>
                  </motion.div>
                ))}
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
