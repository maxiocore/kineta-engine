import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Globe, 
  Palette, 
  Code, 
  ArrowLeft, 
  Sparkles,
  TrendingUp,
  Users,
  Star,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MessageCircle,
  Send,
  Music,
  Linkedin,
  Globe2,
  Layers
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const ClientServicesHome = () => {
  const [servicesCount, setServicesCount] = useState({
    social: 0,
    design: 0,
    dev: 0
  });
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      // Count social media services
      const { count: socialCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('category.ilike.%instagram%,category.ilike.%facebook%,category.ilike.%twitter%,category.ilike.%youtube%,category.ilike.%tiktok%,category.ilike.%social%,category.ilike.%telegram%,name.ilike.%متابع%,name.ilike.%لايك%');

      // Count design services
      const { count: designCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('category.ilike.%design%,category.ilike.%تصميم%,name.ilike.%تصميم%,name.ilike.%شعار%,name.ilike.%لوجو%');

      // Count dev services
      const { count: devCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('category.ilike.%dev%,category.ilike.%برمجة%,category.ilike.%تطوير%,name.ilike.%موقع%,name.ilike.%تطبيق%,name.ilike.%برمجة%');

      setServicesCount({
        social: socialCount || 0,
        design: designCount || 0,
        dev: devCount || 0
      });
    };

    fetchCounts();
  }, []);

  const sections = [
    {
      id: 'social',
      title: 'خدمات مواقع التواصل',
      titleEn: 'Social Media Services',
      description: 'زيادة المتابعين والتفاعل على جميع منصات التواصل الاجتماعي',
      icon: Globe,
      path: '/dashboard/services',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      count: servicesCount.social,
      platforms: [
        { icon: Instagram, name: 'انستغرام', color: 'text-pink-500' },
        { icon: Facebook, name: 'فيسبوك', color: 'text-blue-600' },
        { icon: Youtube, name: 'يوتيوب', color: 'text-red-500' },
        { icon: Twitter, name: 'تويتر', color: 'text-sky-500' },
        { icon: MessageCircle, name: 'تيك توك', color: 'text-purple-500' },
        { icon: Send, name: 'تيليجرام', color: 'text-blue-400' },
        { icon: Music, name: 'سبوتيفاي', color: 'text-green-500' },
        { icon: Linkedin, name: 'لينكدان', color: 'text-blue-700' },
      ]
    },
    {
      id: 'design',
      title: 'خدمات التصميم',
      titleEn: 'Design Services',
      description: 'تصاميم احترافية للشعارات والهويات البصرية والسوشيال ميديا',
      icon: Palette,
      path: '/dashboard/design-services',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      count: servicesCount.design,
      platforms: [
        { icon: Sparkles, name: 'شعارات', color: 'text-purple-500' },
        { icon: Layers, name: 'هوية بصرية', color: 'text-pink-500' },
        { icon: Globe2, name: 'سوشيال ميديا', color: 'text-indigo-500' },
        { icon: Star, name: 'بوسترات', color: 'text-yellow-500' },
      ]
    },
    {
      id: 'dev',
      title: 'خدمات البرمجة والتطوير',
      titleEn: 'Development Services',
      description: 'تطوير المواقع والتطبيقات والأنظمة بأحدث التقنيات',
      icon: Code,
      path: '/dashboard/dev-services',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      count: servicesCount.dev,
      platforms: [
        { icon: Globe2, name: 'مواقع ويب', color: 'text-green-500' },
        { icon: Code, name: 'تطبيقات', color: 'text-emerald-500' },
        { icon: Layers, name: 'أنظمة', color: 'text-teal-500' },
        { icon: TrendingUp, name: 'SEO', color: 'text-lime-500' },
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  const platformVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.05,
        type: "spring" as const,
        stiffness: 200,
        damping: 15
      }
    })
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Layers className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              خدماتنا
            </h1>
            <p className="text-muted-foreground text-sm">
              اختر القسم المناسب لاحتياجاتك
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'إجمالي الخدمات', value: servicesCount.social + servicesCount.design + servicesCount.dev, icon: Layers, color: 'from-primary to-primary/70' },
          { label: 'خدمات التواصل', value: servicesCount.social, icon: Globe, color: 'from-blue-500 to-cyan-500' },
          { label: 'خدمات التصميم', value: servicesCount.design, icon: Palette, color: 'from-purple-500 to-pink-500' },
          { label: 'خدمات البرمجة', value: servicesCount.dev, icon: Code, color: 'from-green-500 to-emerald-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-4 relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-3 gap-6"
      >
        {sections.map((section) => (
          <motion.div
            key={section.id}
            variants={itemVariants}
            onMouseEnter={() => setHoveredSection(section.id)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <Link to={section.path}>
              <Card className={`h-full border-2 ${section.borderColor} bg-card/50 backdrop-blur-sm overflow-hidden group hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 cursor-pointer`}>
                <CardContent className="p-6 relative">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Animated Background Circles */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <motion.div 
                      className={`p-4 rounded-2xl bg-gradient-to-br ${section.color} shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <section.icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      {section.count} خدمة
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div className="mb-6 relative z-10">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>
                  </div>

                  {/* Platforms Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-4 relative z-10">
                    {section.platforms.map((platform, index) => (
                      <motion.div
                        key={platform.name}
                        custom={index}
                        variants={platformVariants}
                        initial="hidden"
                        animate={hoveredSection === section.id ? "visible" : "hidden"}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-background/50 hover:bg-background transition-colors"
                      >
                        <platform.icon className={`h-5 w-5 ${platform.color}`} />
                        <span className="text-[10px] text-muted-foreground">{platform.name}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <motion.div 
                    className="flex items-center justify-between pt-4 border-t border-border/50 relative z-10"
                    initial={{ opacity: 0.7 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <span className="text-sm font-medium text-primary group-hover:text-primary/80">
                      استعرض الخدمات
                    </span>
                    <motion.div
                      animate={{ x: hoveredSection === section.id ? -5 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ArrowLeft className="h-5 w-5 text-primary" />
                    </motion.div>
                  </motion.div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Access Platforms */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-10"
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">وصول سريع للمنصات</h2>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {[
            { icon: Instagram, name: 'انستغرام', color: 'from-pink-500 to-purple-500' },
            { icon: Facebook, name: 'فيسبوك', color: 'from-blue-600 to-blue-700' },
            { icon: Youtube, name: 'يوتيوب', color: 'from-red-500 to-red-600' },
            { icon: Twitter, name: 'تويتر', color: 'from-sky-400 to-sky-500' },
            { icon: MessageCircle, name: 'تيك توك', color: 'from-gray-800 to-gray-900' },
            { icon: Send, name: 'تيليجرام', color: 'from-blue-400 to-blue-500' },
            { icon: Music, name: 'سبوتيفاي', color: 'from-green-500 to-green-600' },
            { icon: Linkedin, name: 'لينكدان', color: 'from-blue-700 to-blue-800' },
            { icon: Globe2, name: 'زيارات', color: 'from-indigo-500 to-indigo-600' },
            { icon: Star, name: 'تقييمات', color: 'from-yellow-500 to-orange-500' },
          ].map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className="cursor-pointer"
            >
              <Link to="/dashboard/services">
                <Card className="border-border/30 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-3 flex flex-col items-center gap-2 relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${platform.color} shadow-md group-hover:shadow-lg transition-shadow`}>
                      <platform.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                      {platform.name}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-10 grid md:grid-cols-3 gap-4"
      >
        {[
          { icon: TrendingUp, title: 'جودة عالية', desc: 'خدمات موثوقة بأعلى جودة' },
          { icon: Users, title: 'دعم فني', desc: 'فريق دعم متواجد على مدار الساعة' },
          { icon: Sparkles, title: 'أسعار منافسة', desc: 'أفضل الأسعار في السوق' },
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <Card className="border-border/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ClientServicesHome;
