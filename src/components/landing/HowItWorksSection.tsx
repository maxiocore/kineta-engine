import { UserPlus, Settings, Rocket, TrendingUp, ChevronDown, Sparkles, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "إنشاء حساب",
    description: "سجّل في ثوانٍ واحصل على وصول فوري لجميع خدماتنا المتميزة",
    features: ["تسجيل سريع", "تفعيل فوري", "واجهة سهلة"],
    color: "from-cyan-500 to-blue-600",
    glowColor: "bg-cyan-500",
  },
  {
    icon: Settings,
    number: "02",
    title: "اختر الخدمة",
    description: "تصفح خدماتنا المتنوعة واختر ما يناسب احتياجاتك ومتطلباتك",
    features: ["تنوع كبير", "أسعار تنافسية", "وصف واضح"],
    color: "from-violet-500 to-purple-600",
    glowColor: "bg-violet-500",
  },
  {
    icon: Rocket,
    number: "03",
    title: "أطلق طلبك",
    description: "أكمل طلبك بخطوات بسيطة وانتظر البدء الفوري في التنفيذ",
    features: ["طلب سهل", "دفع آمن", "تنفيذ سريع"],
    color: "from-emerald-500 to-teal-600",
    glowColor: "bg-emerald-500",
  },
  {
    icon: TrendingUp,
    number: "04",
    title: "تابع النتائج",
    description: "راقب تقدم طلبك في الوقت الفعلي واستمتع بالنتائج المذهلة",
    features: ["تتبع مباشر", "تقارير فورية", "دعم متواصل"],
    color: "from-amber-500 to-orange-600",
    glowColor: "bg-amber-500",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      {/* Static Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 right-0 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-1/4 left-0 w-[250px] sm:w-[350px] md:w-[500px] h-[250px] sm:h-[350px] md:h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-primary">كيف نعمل</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            خطوات بسيطة نحو{" "}
            <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
              النجاح
            </span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            ابدأ رحلتك معنا في دقائق مع عملية مبسطة وسريعة
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative h-full p-5 sm:p-6 md:p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
                {/* Glow Background */}
                <div className={`absolute -top-32 -right-32 w-64 h-64 ${step.glowColor} rounded-full blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-700`} />
                
                {/* Progress Line at Top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary/50 overflow-hidden rounded-t-3xl">
                  <div 
                    className="h-full rounded-full bg-gradient-to-l from-primary to-accent animate-[progress_1.5s_ease-out_forwards]"
                    style={{ animationDelay: `${300 + index * 150}ms` }}
                  />
                </div>

                {/* Step Number Badge */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                  <span className={`text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-20 group-hover:opacity-40 transition-opacity`}>
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${step.color} p-3 sm:p-4 mb-5 sm:mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <step.icon className="w-full h-full text-white" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                    {step.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {step.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary/60 text-xs sm:text-sm"
                      >
                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center mt-12 sm:mt-16 md:mt-20 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <div className="flex flex-col items-center gap-2 sm:gap-3 text-muted-foreground animate-bounce" style={{ animationDuration: '2s' }}>
            <span className="text-xs sm:text-sm">اكتشف المزيد</span>
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out both;
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
};

export default HowItWorksSection;
