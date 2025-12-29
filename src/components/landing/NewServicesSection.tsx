import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { 
  Code2, Palette, Smartphone, TrendingUp, Share2,
  Globe, ShoppingCart, Database, Layers,
  Brush, Layout, Image,
  Bot, Cloud, Settings, Cpu,
  Target, Search, BarChart3, Rocket,
  Users, Calendar, MessageCircle, FileText,
  ArrowLeft, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const services = [
  {
    id: "development",
    icon: Code2,
    title: "التطوير والبرمجة",
    description: "نبني حلولاً تقنية متطورة بأحدث التقنيات",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    features: [
      { icon: Globe, text: "مواقع احترافية" },
      { icon: ShoppingCart, text: "متاجر إلكترونية" },
      { icon: Database, text: "أنظمة ولوحات تحكم" },
      { icon: Layers, text: "تكاملات تقنية" },
    ],
    link: "/dashboard/development",
  },
  {
    id: "design",
    icon: Palette,
    title: "التصميم الإبداعي",
    description: "نصمم تجارب بصرية تُلهم وتُؤثر",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    features: [
      { icon: Brush, text: "هوية بصرية" },
      { icon: Layout, text: "تصميم واجهات UI/UX" },
      { icon: Image, text: "تصاميم حملات رقمية" },
    ],
    link: "/dashboard/design",
  },
  {
    id: "digital",
    icon: Smartphone,
    title: "الخدمات الرقمية",
    description: "نُسرّع تحولك الرقمي بذكاء",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
    features: [
      { icon: Bot, text: "حلول ذكاء اصطناعي" },
      { icon: Cloud, text: "حلول SaaS" },
      { icon: Settings, text: "أتمتة العمليات" },
      { icon: Cpu, text: "تكامل الأنظمة" },
    ],
    link: "/dashboard/digital",
  },
  {
    id: "marketing",
    icon: TrendingUp,
    title: "التسويق الرقمي",
    description: "نُوصل علامتك للجمهور المناسب",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
    features: [
      { icon: Target, text: "إعلانات مدفوعة" },
      { icon: Search, text: "تحسين SEO" },
      { icon: BarChart3, text: "تحسين التحويلات" },
      { icon: Rocket, text: "استراتيجيات نمو" },
    ],
    link: "/dashboard/marketing",
  },
  {
    id: "social",
    icon: Share2,
    title: "إدارة وسائل التواصل",
    description: "نُدير حضورك الرقمي باحترافية",
    color: "from-rose-500 to-red-500",
    bgColor: "bg-rose-500/10",
    features: [
      { icon: Users, text: "إدارة الحسابات" },
      { icon: Calendar, text: "صناعة وجدولة المحتوى" },
      { icon: MessageCircle, text: "التفاعل والتحليل" },
      { icon: FileText, text: "تقارير أداء شهرية" },
    ],
    link: "/dashboard/social",
  },
];

const NewServicesSection = () => {
  const ref = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section ref={ref} id="services" className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="container px-5 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-14"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              خدماتنا
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              حلول رقمية شاملة
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              نقدم مجموعة متكاملة من الخدمات الرقمية المصممة لتلبية احتياجات أعمالك
            </p>
          </motion.div>
        </div>

        {/* Mobile Scroll Navigation */}
        <div className="lg:hidden flex items-center justify-between px-5 mb-4">
          <span className="text-xs text-muted-foreground">اسحب لاستكشاف الخدمات</span>
          <div className="flex gap-2">
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollLeft}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                canScrollLeft 
                  ? "border-primary/50 text-primary hover:bg-primary/10" 
                  : "border-border text-muted-foreground opacity-50"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollRight}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                canScrollRight 
                  ? "border-primary/50 text-primary hover:bg-primary/10" 
                  : "border-border text-muted-foreground opacity-50"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Services Cards - Horizontal Scroll on Mobile */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex lg:grid lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 overflow-x-auto lg:overflow-visible px-5 sm:px-6 lg:container snap-x snap-mandatory scrollbar-hide pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="flex-shrink-0 w-[280px] sm:w-[300px] lg:w-auto snap-center"
            >
              <div className="group relative h-full bg-card border border-border/50 rounded-3xl p-5 md:p-6 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5">
                {/* Gradient Overlay on Hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-2xl ${service.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className={`w-7 h-7 bg-gradient-to-br ${service.color} [&>*]:fill-transparent bg-clip-text text-transparent`} style={{ stroke: "url(#gradient-" + service.id + ")" }} />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id={`gradient-${service.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={service.color.includes("blue") ? "#3b82f6" : service.color.includes("purple") ? "#a855f7" : service.color.includes("emerald") ? "#10b981" : service.color.includes("orange") ? "#f97316" : "#f43f5e"} />
                        <stop offset="100%" stopColor={service.color.includes("blue") ? "#06b6d4" : service.color.includes("purple") ? "#ec4899" : service.color.includes("emerald") ? "#14b8a6" : service.color.includes("orange") ? "#f59e0b" : "#ef4444"} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-2.5 mb-5">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <div className={`w-6 h-6 rounded-lg ${service.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <feature.icon className="w-3.5 h-3.5 text-foreground" />
                      </div>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-between group/btn hover:bg-gradient-to-l ${service.color} hover:text-white transition-all duration-300`}
                >
                  <Link to={service.link}>
                    اكتشف المزيد
                    <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewServicesSection;
