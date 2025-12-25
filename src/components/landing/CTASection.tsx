import { motion, useInView } from "framer-motion";
import { ArrowLeft, Sparkles, Zap, Shield, Clock, Rocket, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

const benefits = [
  { icon: Zap, text: "تفعيل فوري" },
  { icon: Shield, text: "بدون بطاقة ائتمان" },
  { icon: Clock, text: "إلغاء في أي وقت" },
];

const floatingIcons = [
  { icon: "🚀", x: "10%", y: "20%", delay: 0 },
  { icon: "💎", x: "85%", y: "25%", delay: 0.5 },
  { icon: "⭐", x: "15%", y: "70%", delay: 1 },
  { icon: "🎯", x: "80%", y: "75%", delay: 1.5 },
  { icon: "✨", x: "50%", y: "10%", delay: 2 },
];

const CTASection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
        
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 40%)",
            filter: "blur(100px)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.1) 0%, transparent 50%)",
            filter: "blur(80px)",
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 left-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--success) / 0.08) 0%, transparent 50%)",
            filter: "blur(100px)",
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity }}
        />

        {/* Floating Icons */}
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute text-4xl"
            style={{ left: item.x, top: item.y }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 15, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: item.delay,
            }}
          >
            {item.icon}
          </motion.div>
        ))}

        {/* Particles */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.5, 0.5],
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
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative p-10 md:p-16 lg:p-20 rounded-[3rem] bg-card/60 backdrop-blur-2xl border border-border/50 overflow-hidden">
            {/* Inner Glow Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)",
              }}
            />
            
            <div className="relative">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-8"
              >
                <motion.div 
                  className="relative group"
                  animate={{
                    boxShadow: [
                      "0 0 20px hsl(var(--primary) / 0.2)",
                      "0 0 50px hsl(var(--primary) / 0.4)",
                      "0 0 20px hsl(var(--primary) / 0.2)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-l from-primary/20 to-accent/20 border border-primary/30">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-primary" />
                    </motion.div>
                    <span className="font-semibold text-primary">عرض لفترة محدودة</span>
                    <motion.span
                      className="w-2 h-2 rounded-full bg-success"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              </motion.div>

              {/* Countdown Timer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="flex justify-center gap-4 mb-10"
              >
                {[
                  { value: timeLeft.hours, label: "ساعة" },
                  { value: timeLeft.minutes, label: "دقيقة" },
                  { value: timeLeft.seconds, label: "ثانية" },
                ].map((item, index) => (
                  <div key={item.label} className="text-center">
                    <motion.div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mb-2"
                      animate={{ scale: item.label === "ثانية" ? [1, 1.05, 1] : 1 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="text-2xl md:text-3xl font-bold text-primary">
                        {item.value.toString().padStart(2, '0')}
                      </span>
                    </motion.div>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </motion.div>

              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-center"
              >
                مستعد{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    للانطلاق
                  </span>
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  />
                </span>
                ؟
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-center leading-relaxed"
              >
                انضم لآلاف الشركات الناجحة التي تستخدم منصتنا.
                <br className="hidden md:block" />
                <span className="text-primary font-semibold">ابدأ تجربتك المجانية اليوم</span> — لا حاجة لبطاقة ائتمان.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-5 justify-center mb-12"
              >
                <Link to="/auth?mode=signup">
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -3 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      size="lg" 
                      className="group relative px-14 py-8 text-lg font-semibold overflow-hidden rounded-2xl shadow-2xl shadow-primary/30"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_100%]"
                        animate={{
                          backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <span className="relative z-10 flex items-center gap-3 text-primary-foreground">
                        <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        ابدأ الآن مجاناً
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                      </span>
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/contact">
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -3 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="px-14 py-8 text-lg font-semibold border-2 border-border/50 hover:border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-primary/5 transition-all duration-300 rounded-2xl"
                    >
                      تحدث مع فريقنا
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap justify-center gap-8"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center group-hover:bg-success/30 transition-colors">
                      <benefit.icon className="w-5 h-5 text-success" />
                    </div>
                    <span className="font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                      {benefit.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1 }}
                className="flex justify-center items-center gap-4 mt-12 pt-8 border-t border-border/30"
              >
                <div className="flex -space-x-3 rtl:space-x-reverse">
                  {["س", "م", "ن", "أ"].map((initial, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-2 border-background text-sm font-bold text-white"
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground">+500</strong> عميل سعيد
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default CTASection;
