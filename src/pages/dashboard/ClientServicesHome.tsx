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
  Layers,
  Zap,
  Shield,
  Clock,
  ChevronLeft
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";

const ClientServicesHome = () => {
  const [servicesCount, setServicesCount] = useState({
    social: 0,
    design: 0,
    dev: 0
  });
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: socialCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('category.ilike.%instagram%,category.ilike.%facebook%,category.ilike.%twitter%,category.ilike.%youtube%,category.ilike.%tiktok%,category.ilike.%social%,category.ilike.%telegram%,name.ilike.%متابع%,name.ilike.%لايك%');

      const { count: designCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('category.ilike.%design%,category.ilike.%تصميم%,name.ilike.%تصميم%,name.ilike.%شعار%,name.ilike.%لوجو%');

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
      titleEn: 'Social Media',
      description: 'زيادة المتابعين والتفاعل على جميع منصات التواصل الاجتماعي بأفضل الأسعار وأعلى جودة',
      icon: Globe,
      path: '/dashboard/services',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      bgGlow: 'bg-blue-500/20',
      count: servicesCount.social,
      platforms: [
        { icon: Instagram, name: 'انستغرام', color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { icon: Facebook, name: 'فيسبوك', color: 'text-blue-600', bg: 'bg-blue-600/10' },
        { icon: Youtube, name: 'يوتيوب', color: 'text-red-500', bg: 'bg-red-500/10' },
        { icon: Twitter, name: 'تويتر', color: 'text-sky-500', bg: 'bg-sky-500/10' },
        { icon: MessageCircle, name: 'تيك توك', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { icon: Send, name: 'تيليجرام', color: 'text-blue-400', bg: 'bg-blue-400/10' },
      ]
    },
    {
      id: 'design',
      title: 'خدمات التصميم',
      titleEn: 'Design Services',
      description: 'تصاميم احترافية للشعارات والهويات البصرية والسوشيال ميديا بأيدي مصممين محترفين',
      icon: Palette,
      path: '/dashboard/design-services',
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      bgGlow: 'bg-purple-500/20',
      count: servicesCount.design,
      platforms: [
        { icon: Sparkles, name: 'شعارات', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { icon: Layers, name: 'هوية بصرية', color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { icon: Globe2, name: 'سوشيال ميديا', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { icon: Star, name: 'بوسترات', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
      ]
    },
    {
      id: 'dev',
      title: 'خدمات البرمجة والتطوير',
      titleEn: 'Development',
      description: 'تطوير المواقع والتطبيقات والأنظمة بأحدث التقنيات وأفضل الممارسات البرمجية',
      icon: Code,
      path: '/dashboard/dev-services',
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      bgGlow: 'bg-green-500/20',
      count: servicesCount.dev,
      platforms: [
        { icon: Globe2, name: 'مواقع ويب', color: 'text-green-500', bg: 'bg-green-500/10' },
        { icon: Code, name: 'تطبيقات', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { icon: Layers, name: 'أنظمة', color: 'text-teal-500', bg: 'bg-teal-500/10' },
        { icon: TrendingUp, name: 'SEO', color: 'text-lime-500', bg: 'bg-lime-500/10' },
      ]
    }
  ];

  const features = [
    { icon: Zap, title: 'سرعة التنفيذ', desc: 'تنفيذ فوري للطلبات', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { icon: Shield, title: 'جودة مضمونة', desc: 'ضمان على جميع الخدمات', color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: Users, title: 'دعم متواصل', desc: 'فريق دعم 24/7', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Clock, title: 'متابعة مستمرة', desc: 'تحديثات لحظية للطلبات', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const quickPlatforms = [
    { icon: Instagram, name: 'انستغرام', gradient: 'from-pink-500 to-purple-500' },
    { icon: Facebook, name: 'فيسبوك', gradient: 'from-blue-600 to-blue-700' },
    { icon: Youtube, name: 'يوتيوب', gradient: 'from-red-500 to-red-600' },
    { icon: Twitter, name: 'تويتر', gradient: 'from-sky-400 to-sky-500' },
    { icon: MessageCircle, name: 'تيك توك', gradient: 'from-gray-700 to-gray-900' },
    { icon: Send, name: 'تيليجرام', gradient: 'from-blue-400 to-blue-500' },
    { icon: Music, name: 'سبوتيفاي', gradient: 'from-green-500 to-green-600' },
    { icon: Linkedin, name: 'لينكدان', gradient: 'from-blue-700 to-blue-800' },
  ];

  return (
    <ClientDashboardLayout>
      <div className="min-h-screen" dir="rtl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-card via-card to-card/50 border border-border/50 p-6 sm:p-8 lg:p-10 mb-6 lg:mb-8"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl"
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6"
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl shadow-primary/30"
              >
                <Layers className="w-8 h-8 lg:w-10 lg:h-10 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                  خدماتنا
                </h1>
                <p className="text-muted-foreground text-sm lg:text-base">
                  اختر من بين مجموعة واسعة من الخدمات الاحترافية
                </p>
              </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4"
            >
              {[
                { label: 'إجمالي الخدمات', value: servicesCount.social + servicesCount.design + servicesCount.dev, gradient: 'from-primary to-primary/70' },
                { label: 'خدمات التواصل', value: servicesCount.social, gradient: 'from-blue-500 to-cyan-500' },
                { label: 'خدمات التصميم', value: servicesCount.design, gradient: 'from-purple-500 to-pink-500' },
                { label: 'خدمات البرمجة', value: servicesCount.dev, gradient: 'from-green-500 to-emerald-500' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 p-3 lg:p-4"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{stat.value}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Main Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
              className="group"
            >
              <Link to={section.path}>
                <Card className="h-full border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
                  <CardContent className="p-5 lg:p-6 relative">
                    {/* Glow Effect */}
                    <motion.div
                      className={`absolute -top-20 -right-20 w-40 h-40 ${section.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`p-4 rounded-2xl bg-gradient-to-br ${section.gradient} shadow-lg`}
                      >
                        <section.icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                      </motion.div>
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                        {section.count} خدمة
                      </Badge>
                    </div>

                    {/* Title & Description */}
                    <div className="mb-5 relative z-10">
                      <h3 className="text-lg lg:text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {section.description}
                      </p>
                    </div>

                    {/* Platforms */}
                    <div className="flex flex-wrap gap-2 mb-5 relative z-10">
                      {section.platforms.slice(0, 4).map((platform, pIndex) => (
                        <motion.div
                          key={platform.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: hoveredSection === section.id ? 1 : 0.7, 
                            scale: hoveredSection === section.id ? 1 : 0.95 
                          }}
                          transition={{ delay: pIndex * 0.05 }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${platform.bg} transition-all`}
                        >
                          <platform.icon className={`w-3.5 h-3.5 ${platform.color}`} />
                          <span className="text-xs font-medium text-foreground/80">{platform.name}</span>
                        </motion.div>
                      ))}
                      {section.platforms.length > 4 && (
                        <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">+{section.platforms.length - 4}</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <motion.div 
                      className="flex items-center justify-between pt-4 border-t border-border/50 relative z-10"
                    >
                      <span className="text-sm font-medium text-primary">استعرض الخدمات</span>
                      <motion.div
                        animate={{ x: hoveredSection === section.id ? -5 : 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </motion.div>
                    </motion.div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Access Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 lg:mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">الوصول السريع للمنصات</h2>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 lg:gap-3">
            {quickPlatforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/dashboard/services">
                  <Card className="border-border/30 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 overflow-hidden group cursor-pointer">
                    <CardContent className="p-3 lg:p-4 flex flex-col items-center gap-2 relative">
                      <motion.div 
                        className={`p-2.5 lg:p-3 rounded-xl bg-gradient-to-br ${platform.gradient} shadow-md group-hover:shadow-lg transition-shadow`}
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                      >
                        <platform.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      </motion.div>
                      <span className="text-[10px] lg:text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium text-center">
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.03, y: -2 }}
            >
              <Card className="border-border/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm h-full">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${feature.bg} shrink-0`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesHome;
