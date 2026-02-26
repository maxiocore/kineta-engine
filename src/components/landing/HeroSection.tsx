import { ArrowLeft, Sparkles, Code2, Palette, Share2, Rocket, Globe, Zap, Shield, Star, Play, CheckCircle2, Layers, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

const HeroSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeService, setActiveService] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const services = useMemo(() => [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      desc: "نمو رقمي مضمون",
      color: "from-cyan-500 to-blue-600",
      bgAccent: "bg-cyan-500/10",
      stat: "+340%",
      statLabel: "نمو متوسط",
    },
    { 
      icon: Code2, 
      title: "البرمجة والتطوير",
      desc: "مواقع وتطبيقات احترافية",
      color: "from-emerald-500 to-teal-600",
      bgAccent: "bg-emerald-500/10",
      stat: "+120",
      statLabel: "مشروع منجز",
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      desc: "هوية بصرية مميزة",
      color: "from-violet-500 to-purple-600",
      bgAccent: "bg-violet-500/10",
      stat: "+95%",
      statLabel: "رضا العملاء",
    },
    { 
      icon: Globe, 
      title: "خدمات رقمية",
      desc: "حلول متكاملة ومتنوعة",
      color: "from-amber-500 to-orange-600",
      bgAccent: "bg-amber-500/10",
      stat: "24/7",
      statLabel: "دعم فني",
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
      {/* Layered Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/[0.07] blur-[120px] hero-orb-1" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-accent/[0.06] blur-[100px] hero-orb-2" />
        <div className="absolute -bottom-32 left-1/3 w-[350px] h-[350px] rounded-full bg-brand-light/[0.05] blur-[100px] hero-orb-3" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Badge */}
          <div className="flex justify-center mb-8 hero-animate" style={{ '--delay': '0ms' } as React.CSSProperties}>
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-l from-primary to-accent opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-500" />
              <div className="relative flex items-center gap-3 px-5 py-2.5 rounded-full bg-card/80 backdrop-blur-xl border border-primary/15 shadow-sm">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="font-semibold text-sm text-foreground/90">منصة الخدمات الرقمية الأولى</span>
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              </div>
            </div>
          </div>

          {/* Main Headline - More dramatic */}
          <div className="text-center mb-6 hero-animate" style={{ '--delay': '100ms' } as React.CSSProperties}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] tracking-tight">
              <span className="block mb-2 text-foreground">نبني مستقبلك</span>
              <span className="relative inline-block">
                <span className="relative z-10 text-gradient-brand hero-text-glow">
                  الرقمي
                </span>
                {/* Decorative underline */}
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0 8 Q50 0, 100 8 Q150 16, 200 8" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-center text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed hero-animate" style={{ '--delay': '200ms' } as React.CSSProperties}>
            نجمع بين{" "}
            <span className="text-primary font-semibold">التسويق الذكي</span>
            {" "}و{" "}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">البرمجة المتقدمة</span>
            {" "}و{" "}
            <span className="text-violet-600 dark:text-violet-400 font-semibold">التصميم الإبداعي</span>
            {" "}لتحقيق نجاحك
          </p>

          {/* CTA Buttons - Before cards for better hierarchy */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12 px-4 hero-animate" style={{ '--delay': '300ms' } as React.CSSProperties}>
            <Link to="/auth?mode=signup">
              <Button 
                size="lg" 
                className="group relative px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg font-semibold overflow-hidden rounded-2xl w-full sm:w-auto bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-brand"
              >
                <span className="relative z-10 flex items-center justify-center gap-3 text-primary-foreground">
                  <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  ابدأ الآن مجاناً
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
            
            <Link to="/our-services">
              <Button 
                size="lg" 
                variant="outline" 
                className="group px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg font-semibold border-2 rounded-2xl bg-card/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/50 transition-all w-full sm:w-auto"
              >
                <Play className="w-5 h-5 ml-3 group-hover:scale-110 transition-transform" />
                شاهد كيف نعمل
              </Button>
            </Link>
          </div>

          {/* Services Cards - Redesigned with active state */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto mb-10 hero-animate" style={{ '--delay': '400ms' } as React.CSSProperties}>
            {services.map((service, index) => {
              const isActive = activeService === index;
              return (
                <div
                  key={service.title}
                  className={`group relative cursor-pointer transition-all duration-500 ${isActive ? '-translate-y-2' : 'hover:-translate-y-1'}`}
                  onMouseEnter={() => setActiveService(index)}
                >
                  <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${service.color} transition-opacity duration-500 blur-xl ${isActive ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'}`} />
                  <div className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-500 overflow-hidden ${
                    isActive 
                      ? 'bg-card border-primary/20 shadow-lg' 
                      : 'bg-card/60 backdrop-blur-sm border-border/50 hover:border-border'
                  }`}>
                    {/* Icon */}
                    <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${service.color} p-2.5 sm:p-3 mb-3 shadow-md transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                      <service.icon className="w-full h-full text-white" />
                    </div>
                    
                    <h3 className="text-sm sm:text-base font-bold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {service.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {service.desc}
                    </p>

                    {/* Stat indicator - visible on active */}
                    <div className={`flex items-center gap-1.5 transition-all duration-500 ${isActive ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-xs font-bold text-success">{service.stat}</span>
                      <span className="text-[10px] text-muted-foreground">{service.statLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features Row */}
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap hero-animate" style={{ '--delay': '500ms' } as React.CSSProperties}>
            {features.map((feature, index) => (
              <div
                key={feature.text}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border transition-all duration-500 ${
                  activeFeature === index
                    ? "bg-primary/10 border-primary/25 text-primary shadow-sm"
                    : "bg-card/40 border-border/30 text-muted-foreground"
                }`}
              >
                <feature.icon className="w-3.5 h-3.5" />
                <span className="text-xs sm:text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s linear infinite;
        }
        
        .hero-animate {
          opacity: 0;
          transform: translateY(20px);
          animation: heroFadeIn 0.7s ease-out forwards;
          animation-delay: var(--delay, 0ms);
        }
        
        @keyframes heroFadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .hero-text-glow {
          text-shadow: 0 0 60px hsl(var(--primary) / 0.15);
        }
        
        .hero-orb-1 {
          animation: orbFloat1 20s ease-in-out infinite;
        }
        .hero-orb-2 {
          animation: orbFloat2 25s ease-in-out infinite;
        }
        .hero-orb-3 {
          animation: orbFloat3 18s ease-in-out infinite;
        }
        
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -20px); }
          66% { transform: translate(-20px, 15px); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-25px, 20px); }
          66% { transform: translate(15px, -30px); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -15px); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
