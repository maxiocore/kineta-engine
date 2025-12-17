import { motion, useInView } from "framer-motion";
import { ArrowLeft, Sparkles, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";

const benefits = [
  { icon: Zap, text: "تفعيل فوري" },
  { icon: Shield, text: "بدون بطاقة ائتمان" },
  { icon: Clock, text: "إلغاء في أي وقت" },
];

const CTASection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
        
        {/* Animated Orbs */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
            filter: "blur(100px)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, 30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--success) / 0.08) 0%, transparent 60%)",
            filter: "blur(100px)",
          }}
          animate={{
            y: [0, 40, 0],
            x: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative p-10 md:p-16 lg:p-20 rounded-[2.5rem] bg-background/60 border border-border/50 backdrop-blur-2xl overflow-hidden">
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            
            <div className="relative">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-8"
              >
                <motion.div 
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-l from-primary/20 to-accent/20 border border-primary/30"
                  animate={{
                    boxShadow: [
                      "0 0 20px hsl(var(--primary) / 0.2)",
                      "0 0 40px hsl(var(--primary) / 0.4)",
                      "0 0 20px hsl(var(--primary) / 0.2)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                  <span className="font-semibold text-primary">عرض لفترة محدودة</span>
                </motion.div>
              </motion.div>

              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-center"
              >
                مستعد{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">لتوسيع</span>
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </span>{" "}
                عملك؟
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-center leading-relaxed"
              >
                انضم لآلاف الشركات الناجحة التي تستخدم منصتنا بالفعل.
                <br className="hidden md:block" />
                ابدأ تجربتك المجانية اليوم — لا حاجة لبطاقة ائتمان.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-5 justify-center mb-12"
              >
                <Link to="/auth?mode=signup">
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -2 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      size="lg" 
                      className="group relative px-12 py-8 text-lg font-semibold bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-300 overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        ابدأ التجربة المجانية
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform duration-300" />
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-l from-accent to-primary"
                        initial={{ x: "100%" }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/contact">
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -2 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="px-12 py-8 text-lg border-2 border-border/50 hover:border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-secondary/50 transition-all duration-300"
                    >
                      تحدث مع المبيعات
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap justify-center gap-6"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                      <benefit.icon className="w-4 h-4 text-success" />
                    </div>
                    <span className="font-medium">{benefit.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
