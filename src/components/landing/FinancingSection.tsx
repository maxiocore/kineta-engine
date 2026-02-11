import {
  Banknote,
  ArrowLeft,
  Shield,
  Clock,
  Percent,
  FileCheck,
  HandCoins,
  Building2,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Clock,
    title: "موافقة سريعة",
    description: "إجراءات مبسّطة وموافقة خلال وقت قصير",
  },
  {
    icon: Shield,
    title: "متوافق مع الشريعة",
    description: "جميع الحلول التمويلية متوافقة مع أحكام الشريعة الإسلامية",
  },
  {
    icon: Percent,
    title: "أرباح تنافسية",
    description: "هوامش ربح تنافسية ومناسبة لجميع القطاعات",
  },
  {
    icon: HandCoins,
    title: "خطط سداد مرنة",
    description: "أقساط ميسّرة تناسب تدفقاتك المالية",
  },
  {
    icon: FileCheck,
    title: "مستندات بسيطة",
    description: "متطلبات توثيق سهلة وعملية تقديم واضحة",
  },
  {
    icon: Building2,
    title: "تمويل متعدد القطاعات",
    description: "حلول تمويلية مصممة لقطاعات الأعمال المختلفة",
  },
];

const FinancingSection = () => {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" dir="rtl">
      {/* Static background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 md:mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>خدمات التمويل</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            حلول تمويلية
            <span className="text-primary"> مبتكرة </span>
            لنمو أعمالك
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            نقدّم لك مجموعة شاملة من الحلول التمويلية المصممة خصيصاً لدعم
            مشاريعك وتحقيق طموحاتك التجارية
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-14">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-7 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1.5 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center mb-4 transition-colors duration-300 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
              </div>

              <h3 className="text-base md:text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-l from-primary/60 to-accent/40 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right" />
            </div>
          ))}
        </div>

        {/* CTA Area */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 md:p-8 rounded-2xl bg-gradient-to-l from-primary/5 via-transparent to-accent/5 border border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground text-sm md:text-base">
                  ابدأ رحلتك التمويلية الآن
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  تقديم سريع وسهل بخطوات بسيطة
                </p>
              </div>
            </div>
            <a href="https://ash.holdings" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
              >
                <span>تقدّم بطلب تمويل</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      <style>{`
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

export default FinancingSection;
