import { useState } from "react";
import { motion } from "framer-motion";
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
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const contactInfo = [
  {
    icon: Phone,
    title: "اتصل بنا",
    value: "+966 55 123 4567",
    description: "متاحون من 9 ص - 6 م",
    dir: "ltr",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Mail,
    title: "راسلنا",
    value: "info@maxiocore.com",
    description: "نرد خلال 24 ساعة",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    icon: MapPin,
    title: "زرنا",
    value: "الرياض، حي العليا",
    description: "المملكة العربية السعودية",
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

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("تم إرسال رسالتك بنجاح! سنتواصل معك قريباً");
    setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 md:py-28 relative">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/30 to-blue-600/20 rounded-full blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute bottom-0 left-[5%] w-[600px] h-[600px] bg-gradient-to-tr from-accent/30 to-primary/20 rounded-full blur-[140px]"
            />
            
            {/* Floating Particles */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-primary/40 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
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
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm mb-6"
              >
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">تواصل معنا</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              >
                نحن هنا{" "}
                <span className="bg-gradient-to-l from-cyan-400 via-primary to-accent bg-clip-text text-transparent">
                  لمساعدتك
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-muted-foreground"
              >
                لديك سؤال أو استفسار؟ فريقنا جاهز للرد عليك ومساعدتك في تحقيق أهدافك التسويقية
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-12">
          <div className="container px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative p-6 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 hover:border-primary/40 transition-all duration-300 text-center group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                  >
                    <item.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className={`text-primary font-medium ${item.dir === "ltr" ? "dir-ltr" : ""}`} dir={item.dir}>
                    {item.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background" />
          
          <div className="container px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative p-8 md:p-12 rounded-[2rem] overflow-hidden"
              >
                {/* Card Background */}
                <div className="absolute inset-0 bg-card/80 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="absolute inset-[1px] rounded-[2rem] border border-border/50" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-10">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                      <MessageSquare className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold">أرسل لنا رسالة</h2>
                      <p className="text-muted-foreground">سنرد عليك في أقرب وقت ممكن</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="name" className="text-base font-medium">الاسم الكامل *</Label>
                        <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'name' ? 'ring-2 ring-primary/50' : ''}`}>
                          <Input
                            id="name"
                            placeholder="أدخل اسمك"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            className="h-12 bg-secondary/50 border-border/50 rounded-xl focus:border-primary"
                          />
                        </div>
                      </motion.div>
                      
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="email" className="text-base font-medium">البريد الإلكتروني *</Label>
                        <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-primary/50' : ''}`}>
                          <Input
                            id="email"
                            type="email"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            className="h-12 bg-secondary/50 border-border/50 rounded-xl focus:border-primary"
                            dir="ltr"
                          />
                        </div>
                      </motion.div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="phone" className="text-base font-medium">رقم الجوال</Label>
                        <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'phone' ? 'ring-2 ring-primary/50' : ''}`}>
                          <Input
                            id="phone"
                            placeholder="+966 5X XXX XXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            className="h-12 bg-secondary/50 border-border/50 rounded-xl focus:border-primary"
                            dir="ltr"
                          />
                        </div>
                      </motion.div>
                      
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="company" className="text-base font-medium">اسم الشركة</Label>
                        <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'company' ? 'ring-2 ring-primary/50' : ''}`}>
                          <Input
                            id="company"
                            placeholder="اسم شركتك (اختياري)"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            onFocus={() => setFocusedField('company')}
                            onBlur={() => setFocusedField(null)}
                            className="h-12 bg-secondary/50 border-border/50 rounded-xl focus:border-primary"
                          />
                        </div>
                      </motion.div>
                    </div>

                    <motion.div
                      whileFocus={{ scale: 1.01 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="message" className="text-base font-medium">رسالتك *</Label>
                      <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'message' ? 'ring-2 ring-primary/50' : ''}`}>
                        <Textarea
                          id="message"
                          placeholder="اكتب رسالتك هنا..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          onFocus={() => setFocusedField('message')}
                          onBlur={() => setFocusedField(null)}
                          className="min-h-[160px] bg-secondary/50 border-border/50 rounded-xl focus:border-primary resize-none"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full h-14 gap-3 text-lg rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl shadow-primary/30"
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
              </motion.div>
            </div>
          </div>
        </section>

        {/* Success Guarantee */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-success/20 to-emerald-500/20 border border-success/30 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-success" />
              </motion.div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-4">نضمن لك الرد السريع</h2>
              <p className="text-muted-foreground text-lg mb-8">
                فريقنا متاح للرد على استفساراتك خلال 24 ساعة كحد أقصى
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                {['رد سريع', 'دعم متخصص', 'حلول مخصصة'].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
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
