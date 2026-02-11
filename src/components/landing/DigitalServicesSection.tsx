import { motion, useInView } from "framer-motion";
import { 
  Instagram, Facebook, Youtube, Twitter, 
  MessageCircle, Linkedin, Music, Globe, 
  TrendingUp, Sparkles, ArrowLeft, Play, Camera, Headphones
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const platforms = [
  { 
    name: "انستغرام", 
    icon: Instagram, 
    color: "from-pink-500 via-purple-500 to-orange-400",
    services: ["متابعين", "لايكات", "مشاهدات", "تعليقات"],
    popular: true
  },
  { 
    name: "فيسبوك", 
    icon: Facebook, 
    color: "from-blue-600 to-blue-400",
    services: ["متابعين", "لايكات", "مشاركات", "تعليقات"],
    popular: true
  },
  { 
    name: "يوتيوب", 
    icon: Youtube, 
    color: "from-red-600 to-red-400",
    services: ["مشتركين", "مشاهدات", "لايكات", "تعليقات"],
    popular: true
  },
  { 
    name: "تويتر", 
    icon: Twitter, 
    color: "from-sky-500 to-sky-400",
    services: ["متابعين", "لايكات", "ريتويت", "مشاهدات"],
    popular: false
  },
  { 
    name: "تيك توك", 
    icon: Play, 
    color: "from-gray-900 via-pink-500 to-cyan-400",
    services: ["متابعين", "لايكات", "مشاهدات", "تعليقات"],
    popular: true
  },
  { 
    name: "تيليجرام", 
    icon: MessageCircle, 
    color: "from-blue-500 to-cyan-400",
    services: ["أعضاء قناة", "مشاهدات", "تفاعل", "أعضاء مجموعة"],
    popular: false
  },
  { 
    name: "لينكد إن", 
    icon: Linkedin, 
    color: "from-blue-700 to-blue-500",
    services: ["متابعين", "لايكات", "تعليقات", "اتصالات"],
    popular: false
  },
  { 
    name: "سبوتيفاي", 
    icon: Music, 
    color: "from-green-500 to-green-400",
    services: ["متابعين", "تشغيلات", "حفظ", "قوائم تشغيل"],
    popular: false
  },
  { 
    name: "سناب شات", 
    icon: Camera, 
    color: "from-yellow-400 to-yellow-500",
    services: ["متابعين", "مشاهدات", "قصص", "تفاعل"],
    popular: false
  },
  { 
    name: "زيارات المواقع", 
    icon: Globe, 
    color: "from-indigo-500 to-purple-500",
    services: ["زيارات عضوية", "زيارات مستهدفة", "SEO", "ترافيك"],
    popular: false
  },
];

const PlatformCard = ({ platform, index, isInView }: { platform: typeof platforms[0]; index: number; isInView: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = platform.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative cursor-pointer"
    >
      {/* Glow Effect */}
      <motion.div
        className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${platform.color} opacity-0 blur-xl transition-all duration-500`}
        animate={{ opacity: isHovered ? 0.4 : 0 }}
      />

      {/* Popular Badge */}
      {platform.popular && (
        <motion.div
          className="absolute -top-2 -right-2 z-20 px-2 py-0.5 rounded-full bg-warning text-warning-foreground text-[10px] font-bold"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: 0.5 + index * 0.05, type: "spring" }}
        >
          شائع
        </motion.div>
      )}

      {/* Card */}
      <div className="relative h-full p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden">
        {/* Shimmer */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background: "linear-gradient(105deg, transparent 40%, hsl(var(--primary) / 0.06) 50%, transparent 60%)",
          }}
          animate={{
            x: isHovered ? ["0%", "200%"] : "0%",
          }}
          transition={{ duration: 1, repeat: isHovered ? Infinity : 0, repeatDelay: 0.5 }}
        />

        {/* Icon */}
        <motion.div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} p-3 mb-4 shadow-lg`}
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="w-full h-full text-white" />
        </motion.div>

        {/* Title */}
        <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors">
          {platform.name}
        </h3>

        {/* Services Tags */}
        <div className="flex flex-wrap gap-1.5">
          {platform.services.slice(0, 3).map((service, i) => (
            <motion.span
              key={service}
              className="text-[10px] px-2 py-1 rounded-full bg-secondary/80 text-muted-foreground"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + index * 0.05 + i * 0.05 }}
            >
              {service}
            </motion.span>
          ))}
          {platform.services.length > 3 && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              +{platform.services.length - 3}
            </span>
          )}
        </div>

        {/* Hover Arrow */}
        <motion.div
          className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100"
          animate={{ x: isHovered ? -5 : 0 }}
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const DigitalServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  return (
    <section ref={containerRef} className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
                              radial-gradient(circle at 70% 50%, hsl(var(--accent) / 0.1) 0%, transparent 50%)`,
          }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="container px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <motion.div 
            className="badge-premium mb-6 mx-auto w-fit"
            whileHover={{ scale: 1.05 }}
          >
            <TrendingUp className="w-4 h-4" />
            <span>خدمات التسويق الرقمي</span>
          </motion.div>

          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            تواجد قوي على{" "}
            <span className="relative inline-block">
              <span className="text-gradient">كل المنصات</span>
              <motion.div
                className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-l from-primary via-accent to-primary rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </span>
          </motion.h2>

          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
          >
            خدمات تسويق رقمي احترافية لأكثر من 9 منصات اجتماعية — نعزّز حضورك الرقمي بنتائج ملموسة وقابلة للقياس
          </motion.p>
        </motion.div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 max-w-6xl mx-auto mb-12">
          {platforms.map((platform, index) => (
            <PlatformCard
              key={platform.name}
              platform={platform}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link to="/dashboard/services">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" className="px-8 py-6 text-base rounded-xl">
                <Sparkles className="w-5 h-5 ml-2" />
                استعرض جميع الخدمات
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default DigitalServicesSection;
