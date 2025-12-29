import { motion } from "framer-motion";
import { 
  Wallet, 
  TrendingUp, 
  Shield, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  Percent,
  Rocket,
  Code,
  Palette,
  Megaphone,
  Building2,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const FinancingSection = () => {
  const navigate = useNavigate();
  const [activeService, setActiveService] = useState(0);

  const services = [
    { icon: Code, title: "تطوير المواقع", color: "from-blue-500 to-cyan-500" },
    { icon: Palette, title: "التصميم الجرافيكي", color: "from-pink-500 to-rose-500" },
    { icon: Megaphone, title: "التسويق الرقمي", color: "from-orange-500 to-amber-500" },
    { icon: Building2, title: "الهوية التجارية", color: "from-purple-500 to-violet-500" },
  ];

  const features = [
    { icon: Percent, text: "0% فوائد", desc: "تمويل إسلامي" },
    { icon: Clock, text: "24 شهر", desc: "فترة سداد" },
    { icon: Shield, text: "سريع", desc: "موافقة فورية" },
    { icon: Wallet, text: "50 ألف", desc: "حد أقصى" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-20 md:py-28 overflow-hidden" dir="rtl">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        
        {/* Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-30, 30, -30],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-l from-primary/20 to-accent/20 border border-primary/30 mb-6"
            whileHover={{ scale: 1.05 }}
            animate={{ 
              boxShadow: ["0 0 20px rgba(var(--primary), 0.2)", "0 0 40px rgba(var(--primary), 0.4)", "0 0 20px rgba(var(--primary), 0.2)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">تمويل بدون فوائد</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">أنشئ مشروعك معنا </span>
            <motion.span 
              className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
              animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              بالأقساط
            </motion.span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            نفّذ خدماتك الرقمية من تصميم وتطوير وتسويق بأقساط شهرية ميسرة
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          
          {/* Left Side - Services Animation */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {/* Central Card */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 shadow-2xl">
              
              {/* Animated Ring */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="relative">
                {/* Services Carousel */}
                <div className="flex justify-center mb-8">
                  <div className="relative w-32 h-32">
                    {services.map((service, index) => (
                      <motion.div
                        key={index}
                        className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br ${service.color}`}
                        initial={false}
                        animate={{
                          scale: activeService === index ? 1 : 0.7,
                          opacity: activeService === index ? 1 : 0,
                          rotateY: activeService === index ? 0 : 90,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <service.icon className="w-16 h-16 text-white" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Service Title */}
                <motion.div
                  key={activeService}
                  className="text-center mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {services[activeService].title}
                  </h3>
                  <p className="text-sm text-muted-foreground">بأقساط شهرية مريحة</p>
                </motion.div>

                {/* Service Indicators */}
                <div className="flex justify-center gap-2 mb-6">
                  {services.map((_, index) => (
                    <motion.button
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        activeService === index 
                          ? "w-8 bg-primary" 
                          : "w-2 bg-muted-foreground/30"
                      }`}
                      onClick={() => setActiveService(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>

                {/* Amount Range */}
                <div className="p-4 rounded-2xl bg-gradient-to-l from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">قيمة التمويل</span>
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">1,500</div>
                      <div className="text-xs text-muted-foreground">الحد الأدنى</div>
                    </div>
                    <motion.div
                      className="flex-1 h-1 mx-4 bg-gradient-to-l from-primary to-accent rounded-full"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">50,000</div>
                      <div className="text-xs text-muted-foreground">الحد الأقصى</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Icons */}
            <motion.div
              className="absolute -top-4 -right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg"
              animate={{ y: [-5, 5, -5], rotate: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Rocket className="w-7 h-7 text-white" />
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg"
              animate={{ y: [5, -5, 5], rotate: [5, -5, 5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>

          {/* Right Side - Features & CTA */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="group relative p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <div className="text-xl font-bold text-foreground mb-0.5">{feature.text}</div>
                    <div className="text-sm text-muted-foreground">{feature.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Benefits */}
            <motion.div
              className="p-5 rounded-2xl bg-muted/30 border border-border/30"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: CheckCircle2, text: "تمويل داخلي متوافق" },
                  { icon: CheckCircle2, text: "إجراءات سريعة وسهلة" },
                  { icon: CheckCircle2, text: "بدون كفيل أو ضامن" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <item.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Button
                size="lg"
                className="flex-1 h-14 text-lg bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl shadow-primary/25"
                onClick={() => navigate('/auth')}
              >
                <motion.span
                  className="flex items-center gap-2"
                  whileHover={{ x: -5 }}
                >
                  قدّم طلب التمويل
                  <ArrowLeft className="w-5 h-5" />
                </motion.span>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => navigate('/dashboard/financing/calculator')}
              >
                احسب قسطك
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FinancingSection;
