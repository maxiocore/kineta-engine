import { ArrowLeft, Sparkles, Zap, Shield, Clock, Rocket, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const benefits = [
  { icon: Zap, text: "تفعيل فوري" },
  { icon: Shield, text: "بدون بطاقة ائتمان" },
  { icon: Clock, text: "إلغاء في أي وقت" },
];

const CTASection = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Static Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 40%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="relative p-10 md:p-16 lg:p-20 rounded-[3rem] bg-card/60 backdrop-blur-2xl border border-border/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px"
              style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)" }}
            />
            
            <div className="relative">
              {/* Badge */}
              <div className="flex justify-center mb-8">
                <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-l from-primary/20 to-accent/20 border border-primary/30 shadow-lg shadow-primary/20">
                  <Sparkles className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="font-semibold text-primary">عرض لفترة محدودة</span>
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                </div>
              </div>

              {/* Countdown */}
              <div className="flex justify-center gap-4 mb-10">
                {[
                  { value: timeLeft.hours, label: "ساعة" },
                  { value: timeLeft.minutes, label: "دقيقة" },
                  { value: timeLeft.seconds, label: "ثانية" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mb-2">
                      <span className="text-2xl md:text-3xl font-bold text-primary">
                        {item.value.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Headline */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-center">
                مستعد{" "}
                <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_4s_linear_infinite]">
                  للانطلاق
                </span>
                ؟
              </h2>

              {/* Subtitle */}
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-center leading-relaxed">
                انضم لآلاف الشركات الناجحة التي تستخدم منصتنا.
                <br className="hidden md:block" />
                <span className="text-primary font-semibold">ابدأ تجربتك المجانية اليوم</span> — لا حاجة لبطاقة ائتمان.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-5 justify-center mb-12">
                <Link to="/auth?mode=signup">
                  <Button 
                    size="lg" 
                    className="group relative px-14 py-8 text-lg font-semibold overflow-hidden rounded-2xl shadow-2xl shadow-primary/30 bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient_3s_linear_infinite] hover:scale-[1.03] active:scale-[0.98] transition-transform"
                  >
                    <span className="relative z-10 flex items-center gap-3 text-primary-foreground">
                      <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      ابدأ الآن مجاناً
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                    </span>
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="px-14 py-8 text-lg font-semibold border-2 border-border/50 hover:border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-primary/5 transition-all duration-300 rounded-2xl hover:scale-[1.03] active:scale-[0.98]"
                  >
                    تحدث مع فريقنا
                  </Button>
                </Link>
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap justify-center gap-8">
                {benefits.map((benefit) => (
                  <div key={benefit.text} className="flex items-center gap-3 group hover:scale-105 transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center group-hover:bg-success/30 transition-colors">
                      <benefit.icon className="w-5 h-5 text-success" />
                    </div>
                    <span className="font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="flex justify-center items-center gap-4 mt-12 pt-8 border-t border-border/30">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out both;
        }
      `}</style>
    </section>
  );
};

export default CTASection;
