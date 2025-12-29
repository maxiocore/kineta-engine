import { motion, useInView } from "framer-motion";
import { Share2, Code2, Palette, Globe, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";

const ServicesSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const services = [
    { 
      icon: Share2, 
      title: "التسويق الرقمي",
      desc: "استراتيجيات نمو مبتكرة لتعزيز حضورك الرقمي على جميع المنصات",
      color: "from-cyan-500 to-blue-600",
      features: ["إدارة وسائل التواصل", "حملات إعلانية مدفوعة", "تحليل البيانات"],
      href: "/digital-marketing-services"
    },
    { 
      icon: Code2, 
      title: "البرمجة والتطوير",
      desc: "حلول تقنية متقدمة مصممة خصيصاً لتلبية احتياجات عملك",
      color: "from-emerald-500 to-teal-600",
      features: ["تطبيقات الويب", "تطبيقات الجوال", "أنظمة مخصصة"],
      href: "/development-services"
    },
    { 
      icon: Palette, 
      title: "التصميم الإبداعي",
      desc: "هوية بصرية مميزة تعكس قيم علامتك التجارية بشكل احترافي",
      color: "from-violet-500 to-purple-600",
      features: ["الهوية البصرية", "تصميم UI/UX", "موشن جرافيك"],
      href: "/design-services"
    },
    { 
      icon: Globe, 
      title: "خدمات السوشيال",
      desc: "حلول شاملة ومتكاملة لإدارة حساباتك على منصات التواصل",
      color: "from-amber-500 to-orange-600",
      features: ["زيادة المتابعين", "إدارة المحتوى", "التفاعل والمشاركة"],
      href: "/social-media-services"
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24">
      <div className="container px-4 sm:px-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            خدماتنا
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            حلول رقمية{" "}
            <span className="text-primary">متكاملة</span>
          </h2>
          <p className="text-muted-foreground">
            نقدم مجموعة شاملة من الخدمات الرقمية لمساعدتك على النمو والتميز
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={service.href} className="block h-full">
                <div className="group relative h-full p-5 sm:p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  {/* Icon */}
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${service.color} p-3 mb-4`}>
                    <service.icon className="w-full h-full text-white" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.desc}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    <span>اكتشف المزيد</span>
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <Link to="/our-services">
            <Button size="lg" className="h-12 px-8 rounded-xl">
              عرض جميع الخدمات
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
