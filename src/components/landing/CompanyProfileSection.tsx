import { Download, Code2, Palette, BarChart3, Cloud, Cpu, Users, Shield, Headphones, Target, Building2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

const services = [
  { icon: Code2, title: "تطوير البرمجيات والأنظمة", desc: "أنظمة مؤسسية متكاملة مصممة خصيصاً لاحتياجات أعمالك" },
  { icon: Layers, title: "تطوير المواقع والتطبيقات", desc: "مواقع وتطبيقات عصرية بأحدث التقنيات وأعلى الأداء" },
  { icon: Palette, title: "التصميم والهوية البصرية", desc: "هوية بصرية مميزة تعكس قوة علامتك التجارية" },
  { icon: BarChart3, title: "التسويق الرقمي", desc: "استراتيجيات تسويق رقمية مبتكرة لتوسيع نطاق أعمالك" },
  { icon: Cpu, title: "التحليل والأتمتة", desc: "حلول ذكاء اصطناعي وأتمتة لتحسين العمليات وزيادة الكفاءة" },
];

const technologies = [
  "React / Next.js", "Laravel / PHP", "Python", "Cloud & APIs", "أدوات التسويق والتحليل",
];

const advantages = [
  { icon: Target, title: "حلول مخصصة", desc: "نصمم حلولاً فريدة تناسب طبيعة عملك" },
  { icon: Shield, title: "تنفيذ بمعايير عالمية", desc: "نلتزم بأفضل الممارسات والمعايير الدولية" },
  { icon: Users, title: "فريق محترف", desc: "خبراء متخصصون في مختلف المجالات التقنية" },
  { icon: Headphones, title: "دعم مستمر", desc: "دعم فني متواصل لضمان استمرارية أعمالك" },
];

const CompanyProfileSection = () => {
  const hero = useInView();
  const about = useInView();
  const servicesView = useInView();
  const techView = useInView();
  const whyView = useInView();

  const handleDownload = () => {
    // Open PDF in new tab or trigger download
    const link = document.createElement("a");
    link.href = "/ash-holding-profile.pdf";
    link.download = "ASH-Holding-Company-Profile.pdf";
    link.click();
  };

  return (
    <section id="company-profile" dir="rtl" className="relative overflow-hidden">
      {/* ── Hero ── */}
      <div className="relative py-20 md:py-32 bg-gradient-to-bl from-[hsl(220,60%,12%)] via-[hsl(230,50%,18%)] to-[hsl(260,45%,15%)]">
        {/* decorative circles */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[hsl(260,60%,40%)]/10 blur-3xl pointer-events-none" />

        <div ref={hero.ref} className={`container mx-auto px-4 text-center relative z-10 transition-all duration-700 ${hero.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-primary/20 text-primary border border-primary/30">
            الملف التعريفي
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            <span className="bidi-isolate-ltr inline-block">ASH Holding</span>
            <br className="hidden md:block" />
            <span className="text-primary"> — </span>
            حلول رقمية متكاملة لنمو أعمالك
          </h2>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-white/70 mb-10 leading-relaxed">
            شركة متخصصة في البرمجيات، التصميم، والتسويق الرقمي، نقدم حلولًا ذكية بمعايير عالمية.
          </p>
          <Button
            size="lg"
            onClick={handleDownload}
            className="gap-3 text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
          >
            <Download className="w-5 h-5" />
            تحميل الملف التعريفي
          </Button>
        </div>
      </div>

      {/* ── About ── */}
      <div className="py-16 md:py-24 bg-background">
        <div ref={about.ref} className={`container mx-auto px-4 max-w-3xl text-center transition-all duration-700 delay-100 ${about.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 mb-4 text-primary">
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-semibold">من نحن</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">شريكك التقني الموثوق</h3>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            نحن شركة <span className="bidi-isolate-ltr font-semibold text-foreground">ASH Holding</span> — شركة تقنية سعودية متخصصة في تقديم حلول رقمية شاملة
            تساعد المؤسسات والأفراد على التحول الرقمي وتحقيق النمو المستدام. نجمع بين الخبرة
            التقنية العميقة والرؤية الإبداعية لنقدم نتائج استثنائية.
          </p>
        </div>
      </div>

      {/* ── Services ── */}
      <div className="py-16 md:py-24 bg-muted/40">
        <div ref={servicesView.ref} className="container mx-auto px-4">
          <div className={`text-center mb-12 transition-all duration-700 ${servicesView.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">خدماتنا</h3>
            <p className="text-muted-foreground">نقدم مجموعة متكاملة من الخدمات الرقمية الاحترافية</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <div
                key={i}
                className={`group relative rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 ${servicesView.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: servicesView.inView ? `${i * 100}ms` : "0ms" }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-card-foreground mb-2">{s.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Technologies ── */}
      <div className="py-16 md:py-24 bg-background">
        <div ref={techView.ref} className="container mx-auto px-4">
          <div className={`text-center mb-12 transition-all duration-700 ${techView.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">التقنيات المستخدمة</h3>
            <p className="text-muted-foreground">نعتمد على أحدث التقنيات والأدوات العالمية</p>
          </div>
          <div className={`flex flex-wrap justify-center gap-4 transition-all duration-700 delay-200 ${techView.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            {technologies.map((t, i) => (
              <span
                key={i}
                className="px-5 py-3 rounded-xl border border-border bg-card text-sm font-medium text-card-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-default"
                style={{ transitionDelay: techView.inView ? `${i * 80}ms` : "0ms" }}
              >
                <span className="bidi-isolate-ltr">{t}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why ASH Holding ── */}
      <div className="py-16 md:py-24 bg-muted/40">
        <div ref={whyView.ref} className="container mx-auto px-4">
          <div className={`text-center mb-12 transition-all duration-700 ${whyView.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              لماذا <span className="bidi-isolate-ltr">ASH Holding</span>؟
            </h3>
            <p className="text-muted-foreground">ما يميزنا عن غيرنا</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {advantages.map((a, i) => (
              <div
                key={i}
                className={`group text-center rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 ${whyView.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: whyView.inView ? `${i * 100}ms` : "0ms" }}
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <a.icon className="w-7 h-7 text-primary" />
                </div>
                <h4 className="text-base font-semibold text-card-foreground mb-2">{a.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA Download ── */}
      <div className="py-16 md:py-20 bg-gradient-to-bl from-[hsl(220,60%,12%)] via-[hsl(230,50%,18%)] to-[hsl(260,45%,15%)] text-center">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">احصل على الملف التعريفي الكامل</h3>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">تحميل ملف PDF يحتوي على جميع التفاصيل: الخدمات، التقنيات، المزايا، وبيانات التواصل.</p>
          <Button
            size="lg"
            onClick={handleDownload}
            className="gap-3 text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
          >
            <Download className="w-5 h-5" />
            تحميل الملف التعريفي الكامل
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CompanyProfileSection;
