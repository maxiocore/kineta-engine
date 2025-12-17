import { motion } from "framer-motion";
import { 
  BarChart3, 
  Megaphone, 
  Target, 
  Zap, 
  LineChart, 
  Users,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const services = [
  {
    icon: BarChart3,
    title: "التحليلات الذكية",
    description: "تحليلات متقدمة مدعومة بالذكاء الاصطناعي لفهم سلوك عملائك واتخاذ قرارات مدروسة.",
    gradient: "from-primary to-cyan-400",
    features: ["تقارير تفصيلية", "لوحات تحكم مخصصة", "تنبيهات ذكية"]
  },
  {
    icon: Megaphone,
    title: "إدارة الحملات",
    description: "إدارة وتحسين حملاتك الإعلانية عبر جميع المنصات من مكان واحد.",
    gradient: "from-accent to-pink-400",
    features: ["حملات متعددة القنوات", "تحسين تلقائي", "تتبع الأداء"]
  },
  {
    icon: Target,
    title: "استهداف دقيق",
    description: "الوصول للجمهور المناسب بالرسالة المناسبة في الوقت المناسب.",
    gradient: "from-success to-emerald-400",
    features: ["شرائح مخصصة", "إعادة الاستهداف", "تحليل الجمهور"]
  },
  {
    icon: Zap,
    title: "الأتمتة الذكية",
    description: "أتمتة المهام التسويقية المتكررة وتوفير الوقت للتركيز على الاستراتيجية.",
    gradient: "from-warning to-orange-400",
    features: ["سير عمل آلي", "رسائل مجدولة", "تكامل شامل"]
  },
  {
    icon: LineChart,
    title: "تحسين محركات البحث",
    description: "تحسين ظهور موقعك في نتائج البحث وزيادة الزيارات العضوية.",
    gradient: "from-primary to-blue-400",
    features: ["تحليل الكلمات", "بناء الروابط", "تحسين المحتوى"]
  },
  {
    icon: Users,
    title: "إدارة وسائل التواصل",
    description: "إدارة حساباتك على وسائل التواصل الاجتماعي بشكل احترافي.",
    gradient: "from-accent to-purple-400",
    features: ["جدولة المنشورات", "تفاعل مع الجمهور", "تقارير شهرية"]
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const ServicesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-secondary/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[120px]" />
      </div>
      
      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            خدماتنا المتميزة
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            حلول تسويقية <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">شاملة</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            نقدم لك مجموعة متكاملة من الخدمات التسويقية المصممة خصيصاً
            لتحقيق أهداف نشاطك التجاري وتعزيز نموه
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="h-full p-8 rounded-2xl bg-background/80 border border-border/50 hover:border-primary/30 transition-all duration-300 backdrop-blur-sm">
                {/* Icon */}
                <motion.div 
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} p-3 mb-6 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <service.icon className="w-full h-full text-primary-foreground" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.gradient}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to="/services">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" variant="outline" className="gap-2">
                عرض جميع الخدمات
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
