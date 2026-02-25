import { ArrowLeft, Sparkles, Code2, Palette, Share2, Rocket, Globe, Zap, Shield, Star, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

const HeroSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const services = useMemo(() => [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      desc: "نمو رقمي مضمون",
      color: "from-cyan-500 via-blue-500 to-indigo-500",
    },
    { 
      icon: Code2, 
      title: "البرمجة والتطوير",
      desc: "مواقع وتطبيقات احترافية",
      color: "from-emerald-500 via-green-500 to-teal-500",
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      desc: "هوية بصرية مميزة",
      color: "from-violet-500 via-purple-500 to-fuchsia-500",
    },
    { 
      icon: Globe, 
      title: "خدمات رقمية",
      desc: "حلول متكاملة ومتنوعة",
      color: "from-amber-500 via-orange-500 to-red-500",
    },
  ], []);

  const features = useMemo(() => [
    { text: "تفعيل فوري", icon: Zap },
    { text: "دعم على مدار الساعة", icon: Shield },
    { text: "أسعار تنافسية", icon: Star },
    { text: "جودة مضمونة", icon: CheckCircle2 },
  ], []);

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Simple Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 50% at 20% 40%, hsl(var(--primary) / 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 80% 20%, hsl(var(--accent) / 0.1) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      {/* Hero Content */}
      <div className="container relative z-10 px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-10 animate-fade-in">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-l from-primary via-accent to-primary opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
              <div className="relative flex items-center gap-3 px-6 py-3 rounded-full bg-background/80 backdrop-blur-xl border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '8s' }} />
                <span className="font-semibold text-sm">منصة الخدمات الرقمية الأولى</span>
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight">
              <span className="block mb-4">حلول رقمية</span>
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  متكاملة
                </span>
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-center text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
            نجمع بين قوة{" "}
            <span className="text-primary font-semibold">التسويق الذكي</span>
            {" "}و{" "}
            <span className="text-emerald-500 font-semibold">البرمجة المتقدمة</span>
            {" "}و{" "}
            <span className="text-violet-500 font-semibold">التصميم الإبداعي</span>
            {" "}لتحقيق نجاحك الرقمي
          </p>

          {/* Features */}
          <div className="flex justify-center gap-3 mb-12 flex-wrap animate-fade-in" style={{ animationDelay: '300ms' }}>
            {features.map((feature, index) => (
              <div
                key={feature.text}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                  activeFeature === index
                    ? "bg-primary/10 border-primary/30 text-primary scale-105"
                    : "bg-secondary/30 border-border/30 text-muted-foreground"
                }`}
              >
                <feature.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Services Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto mb-14 animate-fade-in" style={{ animationDelay: '400ms' }}>
            {services.map((service) => (
              <div
                key={service.title}
                className="group relative cursor-pointer hover:-translate-y-2 transition-transform duration-300"
              >
                <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-30 blur-2xl transition-all duration-500`} />
                <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 group-hover:border-primary/30 transition-all duration-300 overflow-hidden">
                  <div className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${service.color} p-2 sm:p-3 md:p-4 mb-3 sm:mb-4 md:mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-xl font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                    {service.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 xs:gap-4 justify-center items-center mb-12 xs:mb-14 sm:mb-16 px-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <Link to="/auth?mode=signup">
              <Button 
                size="lg" 
                className="group relative px-6 xs:px-8 sm:px-10 py-5 xs:py-6 sm:py-7 text-sm xs:text-base sm:text-lg font-semibold overflow-hidden rounded-xl xs:rounded-2xl w-full sm:w-auto bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient hover:scale-[1.03] active:scale-[0.98] transition-transform"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 xs:gap-3 text-primary-foreground">
                  <Rocket className="w-4 h-4 xs:w-5 xs:h-5 group-hover:rotate-12 transition-transform" />
                  ابدأ الآن مجاناً
                  <ArrowLeft className="w-4 h-4 xs:w-5 xs:h-5 group-hover:-translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
            
            
            
            <Link to="/our-services">
              <Button 
                size="lg" 
                variant="outline" 
                className="group px-6 xs:px-8 sm:px-10 py-5 xs:py-6 sm:py-7 text-sm xs:text-base sm:text-lg font-semibold border-2 rounded-xl xs:rounded-2xl bg-background/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/50 transition-all w-full sm:w-auto"
              >
                <Play className="w-4 h-4 xs:w-5 xs:h-5 ml-2 xs:ml-3 group-hover:scale-110 transition-transform" />
                شاهد كيف نعمل
              </Button>
            </Link>
          </div>
        </div>
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

export default HeroSection;
