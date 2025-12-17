import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-dark">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      
      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-[20%] w-20 h-20 rounded-2xl bg-gradient-primary opacity-20 blur-sm"
        animate={{ y: [-20, 20, -20], rotate: [0, 45, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-32 right-[15%] w-16 h-16 rounded-full bg-accent/30 blur-sm"
        animate={{ y: [20, -20, 20], x: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container relative z-10 px-4 pt-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">
              منصة التسويق من الجيل القادم
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-foreground">حوّل حضورك</span>
            <br />
            <span className="text-gradient">الرقمي اليوم</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            ارتقِ بعلامتك التجارية مع حلولنا التسويقية المتطورة.
            تحليلات مدعومة بالذكاء الاصطناعي، أتمتة سلسة، وحملات
            مذهلة تحقق نتائج قابلة للقياس.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="lg" className="group px-8 py-6 text-lg bg-gradient-primary hover:opacity-90 transition-all shadow-glow">
              ابدأ مجاناً
              <ArrowLeft className="me-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-border/50 bg-secondary/50 hover:bg-secondary">
              <Play className="ms-2 w-5 h-5" />
              شاهد العرض
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 pt-8 border-t border-border/30"
          >
            <p className="text-sm text-muted-foreground mb-6">موثوق من قبل الشركات الرائدة حول العالم</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
              {["تك كورب", "إنوفيت", "فيوتشر لابز", "جروث هب", "سكيل أب"].map((company, i) => (
                <motion.div
                  key={company}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="text-lg font-display font-semibold text-muted-foreground/70"
                >
                  {company}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;