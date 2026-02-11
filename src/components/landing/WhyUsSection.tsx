import { useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Zap, 
  Shield, 
  Clock, 
  HeadphonesIcon, 
  Sparkles, 
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Award
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "سرعة فائقة",
    description: "تنفيذ فوري مع التزام صارم بالمواعيد",
    highlights: ["بدء فوري", "تسليم سريع"],
    gradient: "from-amber-500 via-orange-500 to-red-500",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    stat: "24/7",
    statLabel: "متاح"
  },
  {
    icon: Shield,
    title: "ضمان الجودة",
    description: "جودة عالية مع تعديلات مجانية حتى الرضا",
    highlights: ["ضمان شامل", "تعديلات مجانية"],
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    stat: "100%",
    statLabel: "رضا"
  },
  {
    icon: Clock,
    title: "دعم متواصل",
    description: "فريق جاهز لخدمتك في أي وقت",
    highlights: ["دعم 24/7", "استجابة سريعة"],
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    stat: "5",
    statLabel: "دقائق استجابة"
  },
  {
    icon: HeadphonesIcon,
    title: "خبراء متخصصون",
    description: "نخبة من المتخصصين لتحقيق أهدافك",
    highlights: ["خبرة واسعة", "احترافية"],
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    stat: "+50",
    statLabel: "خبير"
  },
  {
    icon: TrendingUp,
    title: "نتائج مضمونة",
    description: "نركز على تحقيق أهدافك ونمو أعمالك",
    highlights: ["نمو مستمر", "تقارير دورية"],
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
    stat: "+200%",
    statLabel: "نمو"
  },
  {
    icon: Award,
    title: "أسعار تنافسية",
    description: "أفضل الأسعار مع جودة لا تُضاهى",
    highlights: ["عروض مميزة", "قيمة حقيقية"],
    gradient: "from-cyan-500 via-sky-500 to-blue-500",
    iconBg: "bg-gradient-to-br from-cyan-500 to-sky-600",
    stat: "50%",
    statLabel: "توفير"
  },
];

const WhyUsSection = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
      
      {/* Static Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 right-10 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-20 left-10 w-64 h-64 md:w-80 md:h-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.1) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">مميزاتنا</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            لماذا{" "}
            <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
              تختارنا؟
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            نقدم لك تجربة استثنائية تجمع بين الجودة والسرعة والدعم المتواصل
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 lg:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group animate-fade-in hover:-translate-y-2 transition-transform duration-300"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="relative h-full p-4 md:p-6 rounded-2xl md:rounded-3xl bg-card/70 backdrop-blur-sm border border-border/40 hover:border-primary/40 transition-all duration-300 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
                <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${feature.iconBg} p-2 md:p-2.5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-full h-full text-white" />
                    </div>
                    <div className="text-left">
                      <div className={`text-lg md:text-xl font-bold bg-gradient-to-l ${feature.gradient} bg-clip-text text-transparent`}>
                        {feature.stat}
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">
                        {feature.statLabel}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm md:text-lg font-bold mb-1.5 md:mb-2 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-3 md:mb-4 line-clamp-2">
                    {feature.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {feature.highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/60 text-[10px] md:text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-right`} />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-10 md:mt-14 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <Link to="/services">
            <div className="group inline-flex items-center gap-2.5 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold text-sm md:text-base shadow-xl hover:shadow-2xl hover:shadow-primary/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300">
              <span>اكتشف خدماتنا</span>
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="flex justify-center mt-8 md:mt-10 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-6 md:gap-10">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                {(() => {
                  const startDate = new Date('2026-02-11');
                  const today = new Date();
                  const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  return (847 + Math.max(0, diffDays) * 28).toLocaleString('en-US');
                })()}
              </div>
              <span className="text-xs md:text-sm text-muted-foreground">طلب منفذ</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                {(() => {
                  const startDate = new Date('2026-02-11');
                  const today = new Date();
                  const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  return (156 + Math.max(0, diffDays) * 5).toLocaleString('en-US');
                })()}
              </div>
              <span className="text-xs md:text-sm text-muted-foreground">عميل سعيد</span>
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="flex justify-center mt-6 md:mt-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs md:text-sm">شريكك الموثوق للنجاح الرقمي</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '1s' }} />
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
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out both;
        }
      `}</style>
    </section>
  );
};

export default WhyUsSection;
