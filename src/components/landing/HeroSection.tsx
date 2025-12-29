import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Shield, Zap, Globe, Star, TrendingUp, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const quickActions = [
    { icon: TrendingUp, label: "تسويق", color: "from-blue-500 to-cyan-500", href: "/digital-marketing-services" },
    { icon: Globe, label: "تطوير", color: "from-violet-500 to-purple-500", href: "/development-services" },
    { icon: Sparkles, label: "تصميم", color: "from-pink-500 to-rose-500", href: "/design-services" },
    { icon: Zap, label: "سوشيال", color: "from-amber-500 to-orange-500", href: "/social-media-services" },
  ];

  const stats = [
    { value: "50K+", label: "عميل" },
    { value: "100K+", label: "مشروع" },
    { value: "99%", label: "رضا" },
  ];

  return (
    <section className="relative overflow-hidden bg-background" dir="rtl">
      {/* Background - simplified for mobile */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.2, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-br from-primary/30 to-violet-500/20 rounded-full blur-[80px] sm:blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 left-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/15 rounded-full blur-[60px] sm:blur-[100px]"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-6 pb-8 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
        <div className="max-w-5xl mx-auto">
          
          {/* Mobile App Style Hero */}
          <div className="lg:hidden">
            {/* Welcome Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="p-5 rounded-3xl bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-2xl"
                  >
                    👋
                  </motion.div>
                  <span className="text-base font-medium text-foreground">مرحباً بك!</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">
                  نحوّل رؤيتك إلى{" "}
                  <span className="bg-gradient-to-l from-primary to-violet-500 bg-clip-text text-transparent">
                    واقع رقمي
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  خدمات رقمية متكاملة بمعايير عالمية
                </p>
              </div>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">خدماتنا</h2>
                <Link to="/our-services" className="flex items-center gap-1 text-xs text-primary font-medium">
                  <span>عرض الكل</span>
                  <ChevronLeft className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    >
                      <Link to={action.href}>
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[11px] font-medium text-foreground">{action.label}</span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  className="p-4 rounded-2xl bg-card/60 border border-border/40 text-center"
                >
                  <div className="text-xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="space-y-3"
            >
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full h-14 text-base rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-blue-600 shadow-xl shadow-primary/25 font-bold"
                >
                  <Link to="/auth" className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />
                    <span>ابدأ الآن مجاناً</span>
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-12 text-sm rounded-2xl border-2"
                >
                  <Link to="/our-services">استكشف جميع الخدمات</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-border/30"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span>آمن</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>4.9/5</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>سريع</span>
              </div>
            </motion.div>
          </div>

          {/* Desktop Hero - Original Style */}
          <div className="hidden lg:block text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-violet-500/10 to-blue-500/10 border border-primary/20 mb-8"
            >
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                المنصة الرقمية الأولى في المنطقة
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight mb-6"
            >
              <span className="block text-foreground">نحوّل رؤيتك إلى</span>
              <span className="block mt-4">
                <span className="relative">
                  <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-primary bg-clip-text text-transparent">
                    واقع رقمي مذهل
                  </span>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="absolute -bottom-3 right-0 h-2 bg-gradient-to-r from-blue-500 via-violet-500 to-primary rounded-full"
                  />
                </span>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10"
            >
              خدمات رقمية متكاملة من التسويق والتطوير والتصميم{" "}
              <span className="text-foreground font-medium">بمعايير عالمية وأسعار تنافسية</span>
            </motion.p>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4 mb-10"
            >
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link to={action.href}>
                      <div className={`flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r ${action.color} text-white shadow-lg font-medium`}>
                        <Icon className="w-4 h-4" />
                        <span>{action.label}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center justify-center gap-4 mb-16"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  asChild 
                  size="lg" 
                  className="h-16 px-12 text-lg rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-primary hover:opacity-90 shadow-2xl shadow-primary/30 font-bold group"
                >
                  <Link to="/auth" className="flex items-center gap-3">
                    <Zap className="w-5 h-5" />
                    <span>ابدأ الآن مجاناً</span>
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="h-16 px-12 text-lg rounded-2xl border-2 font-semibold"
                >
                  <Link to="/our-services">استكشف الخدمات</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex items-center justify-center gap-12"
            >
              {[
                { value: "50K+", label: "عميل نشط" },
                { value: "100K+", label: "مشروع منجز" },
                { value: "99.9%", label: "نسبة الرضا" },
                { value: "24/7", label: "دعم متواصل" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl font-black bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
