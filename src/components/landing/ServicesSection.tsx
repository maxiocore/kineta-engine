import { motion, useInView } from "framer-motion";
import { 
  BarChart3, 
  Megaphone, 
  Target, 
  Zap, 
  LineChart, 
  Users,
  ArrowLeft,
  Sparkles,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  bgGlow: string;
  features: string[];
}

const services: Service[] = [
  {
    icon: BarChart3,
    title: "التحليلات الذكية",
    description: "تحليلات متقدمة مدعومة بالذكاء الاصطناعي لفهم سلوك عملائك واتخاذ قرارات مدروسة.",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    bgGlow: "bg-blue-500/20",
    features: ["تقارير تفصيلية", "لوحات تحكم مخصصة", "تنبيهات ذكية"]
  },
  {
    icon: Megaphone,
    title: "إدارة الحملات",
    description: "إدارة وتحسين حملاتك الإعلانية عبر جميع المنصات من مكان واحد.",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    bgGlow: "bg-purple-500/20",
    features: ["حملات متعددة القنوات", "تحسين تلقائي", "تتبع الأداء"]
  },
  {
    icon: Target,
    title: "استهداف دقيق",
    description: "الوصول للجمهور المناسب بالرسالة المناسبة في الوقت المناسب.",
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    bgGlow: "bg-emerald-500/20",
    features: ["شرائح مخصصة", "إعادة الاستهداف", "تحليل الجمهور"]
  },
  {
    icon: Zap,
    title: "الأتمتة الذكية",
    description: "أتمتة المهام التسويقية المتكررة وتوفير الوقت للتركيز على الاستراتيجية.",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    bgGlow: "bg-amber-500/20",
    features: ["سير عمل آلي", "رسائل مجدولة", "تكامل شامل"]
  },
  {
    icon: LineChart,
    title: "تحسين محركات البحث",
    description: "تحسين ظهور موقعك في نتائج البحث وزيادة الزيارات العضوية.",
    gradient: "from-indigo-500 via-blue-500 to-sky-500",
    bgGlow: "bg-indigo-500/20",
    features: ["تحليل الكلمات", "بناء الروابط", "تحسين المحتوى"]
  },
  {
    icon: Users,
    title: "إدارة وسائل التواصل",
    description: "إدارة حساباتك على وسائل التواصل الاجتماعي بشكل احترافي.",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    bgGlow: "bg-violet-500/20",
    features: ["جدولة المنشورات", "تفاعل مع الجمهور", "تقارير شهرية"]
  },
];

const ServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-[20%] w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-[20%] w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>
      
      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">خدماتنا المتميزة</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            حلول تسويقية{" "}
            <span className="relative">
              <span className="bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">شاملة</span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-l from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
            نقدم لك مجموعة متكاملة من الخدمات التسويقية المصممة خصيصاً
            لتحقيق أهداف نشاطك التجاري وتعزيز نموه
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              <div className="relative h-full p-8 rounded-3xl bg-background/80 border border-border/50 hover:border-primary/40 transition-all duration-500 backdrop-blur-xl overflow-hidden">
                {/* Glow Effect */}
                <motion.div
                  className={`absolute -top-20 -right-20 w-40 h-40 ${service.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Icon */}
                <motion.div 
                  className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} p-4 mb-6 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <service.icon className="w-full h-full text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-white/20"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-3">
                  {service.features.map((feature, i) => (
                    <motion.li 
                      key={feature} 
                      className="flex items-center gap-3 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.4 + index * 0.1 + i * 0.05 }}
                    >
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${service.gradient} flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Hover Border Gradient */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-16"
        >
          <Link to="/services">
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg" 
                className="group px-10 py-6 text-lg bg-gradient-to-l from-primary to-accent text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all"
              >
                عرض جميع الخدمات
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
