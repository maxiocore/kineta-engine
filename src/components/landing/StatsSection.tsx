import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { TrendingUp, Users, Award, Briefcase, Target, Globe } from "lucide-react";

const stats = [
  { value: 500, suffix: "+", label: "عميل سعيد", icon: Users, color: "from-cyan-500 to-blue-600" },
  { value: 98, suffix: "%", label: "معدل النجاح", icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
  { value: 1000, suffix: "+", label: "مشروع منجز", icon: Briefcase, color: "from-violet-500 to-purple-600" },
  { value: 150, suffix: "+", label: "شريك نجاح", icon: Globe, color: "from-amber-500 to-orange-600" },
];

const Counter = ({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (inView) {
      const controls = animate(count, value, {
        duration: 2.5,
        ease: [0.22, 1, 0.36, 1],
      });

      const unsubscribe = rounded.on("change", (latest) => {
        setDisplayValue(latest);
      });

      return () => {
        controls.stop();
        unsubscribe();
      };
    }
  }, [value, count, rounded, inView]);

  return (
    <span className="text-5xl md:text-6xl lg:text-7xl font-bold tabular-nums">
      {displayValue.toLocaleString('ar-EG')}{suffix}
    </span>
  );
};

const StatsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px]"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.08) 0%, transparent 30%),
              radial-gradient(circle at 70% 70%, hsl(var(--accent) / 0.06) 0%, transparent 30%)
            `,
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Floating Rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/5"
            style={{
              width: `${ring * 300}px`,
              height: `${ring * 300}px`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 5 + ring,
              repeat: Infinity,
              delay: ring * 0.5,
            }}
          />
        ))}
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">إنجازاتنا</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            أرقام{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">نفتخر</span>
              <motion.div
                className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gradient-to-l from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </span>
            {" "}بها
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            نتائج حقيقية تعكس التزامنا بتقديم أفضل الخدمات لعملائنا
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group"
            >
              <motion.div 
                className="relative h-full p-8 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                {/* Gradient Background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />
                
                {/* Glow Effect */}
                <motion.div
                  className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />

                {/* Icon */}
                <motion.div
                  className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} p-4 mb-8 shadow-xl`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <stat.icon className="w-full h-full text-white" />
                </motion.div>

                {/* Counter */}
                <div className="mb-4 bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                  <Counter value={stat.value} suffix={stat.suffix} inView={isInView} />
                </div>

                {/* Label */}
                <p className="text-lg font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.label}
                </p>

                {/* Bottom Line */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="flex justify-center mt-16"
        >
          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
            <span className="text-sm">نتائج موثقة ومحققة</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
