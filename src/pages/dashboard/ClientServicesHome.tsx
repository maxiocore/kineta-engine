import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Globe, 
  Palette, 
  Code, 
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
  ChevronLeft,
  ArrowUpRight,
  Smartphone
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";

const ClientServicesHome = () => {
  const navigate = useNavigate();
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
      subtitle: 'Social Media Services',
      description: 'زيادة المتابعين والتفاعل على جميع منصات التواصل الاجتماعي',
      icon: Globe,
      path: '/dashboard/services',
      gradient: 'from-blue-500 to-cyan-400',
      shadowColor: 'shadow-blue-500/25',
      count: servicesCount.social,
      platforms: [
        { icon: Instagram, color: 'text-pink-500' },
        { icon: Facebook, color: 'text-blue-600' },
        { icon: Youtube, color: 'text-red-500' },
        { icon: Twitter, color: 'text-sky-500' },
        { icon: MessageCircle, color: 'text-purple-500' },
        { icon: Send, color: 'text-blue-400' },
      ]
    },
    {
      id: 'design',
      title: 'خدمات التصميم',
      subtitle: 'Design Services',
      description: 'تصاميم احترافية للشعارات والهويات البصرية',
      icon: Palette,
      path: '/dashboard/design-services',
      gradient: 'from-purple-500 to-pink-400',
      shadowColor: 'shadow-purple-500/25',
      count: servicesCount.design,
      platforms: [
        { icon: Sparkles, color: 'text-purple-500' },
        { icon: Layers, color: 'text-pink-500' },
        { icon: Star, color: 'text-yellow-500' },
        { icon: Globe2, color: 'text-indigo-500' },
      ]
    },
    {
      id: 'dev',
      title: 'خدمات البرمجة والتطوير',
      subtitle: 'Development Services',
      description: 'تطوير المواقع والتطبيقات بأحدث التقنيات',
      icon: Code,
      path: '/dashboard/dev-services',
      gradient: 'from-emerald-500 to-teal-400',
      shadowColor: 'shadow-emerald-500/25',
      count: servicesCount.dev,
      platforms: [
        { icon: Globe2, color: 'text-green-500' },
        { icon: Code, color: 'text-emerald-500' },
        { icon: Smartphone, color: 'text-teal-500' },
        { icon: TrendingUp, color: 'text-lime-500' },
      ]
    }
  ];

  const features = [
    { icon: Zap, title: 'تنفيذ سريع', color: 'from-yellow-500 to-orange-400' },
    { icon: Shield, title: 'جودة مضمونة', color: 'from-green-500 to-emerald-400' },
    { icon: Users, title: 'دعم 24/7', color: 'from-blue-500 to-cyan-400' },
    { icon: Clock, title: 'متابعة لحظية', color: 'from-purple-500 to-pink-400' },
  ];

  const quickPlatforms = [
    { icon: Instagram, name: 'انستغرام', gradient: 'from-pink-500 via-purple-500 to-orange-400' },
    { icon: Facebook, name: 'فيسبوك', gradient: 'from-blue-600 to-blue-500' },
    { icon: Youtube, name: 'يوتيوب', gradient: 'from-red-600 to-red-500' },
    { icon: Twitter, name: 'تويتر', gradient: 'from-sky-500 to-sky-400' },
    { icon: MessageCircle, name: 'تيك توك', gradient: 'from-gray-800 to-gray-700' },
    { icon: Send, name: 'تيليجرام', gradient: 'from-blue-500 to-blue-400' },
    { icon: Music, name: 'سبوتيفاي', gradient: 'from-green-600 to-green-500' },
    { icon: Linkedin, name: 'لينكدان', gradient: 'from-blue-700 to-blue-600' },
  ];

  const totalServices = servicesCount.social + servicesCount.design + servicesCount.dev;

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 lg:space-y-8" dir="rtl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/dashboard/orders')}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-border/50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 3 }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30"
              >
                <Layers className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  خدماتنا
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {totalServices} خدمة متاحة
                </p>
              </div>
            </div>

            {/* Quick Stats - Mobile */}
            <div className="flex gap-2 sm:gap-3">
              {[
                { value: servicesCount.social, label: 'تواصل', color: 'bg-blue-500' },
                { value: servicesCount.design, label: 'تصميم', color: 'bg-purple-500' },
                { value: servicesCount.dev, label: 'برمجة', color: 'bg-emerald-500' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/50"
                >
                  <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                  <span className="text-sm font-semibold">{stat.value}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Services Cards */}
        <div className="grid gap-4 sm:gap-5 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <Link to={section.path} className="block h-full">
                <Card className={`h-full group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 hover:shadow-2xl ${section.shadowColor} transition-all duration-500`}>
                  {/* Background Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Glow Effect */}
                  <motion.div
                    animate={{ 
                      opacity: hoveredSection === section.id ? 0.15 : 0,
                      scale: hoveredSection === section.id ? 1.2 : 1
                    }}
                    className={`absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br ${section.gradient} rounded-full blur-3xl`}
                  />

                  <CardContent className="relative z-10 p-5 sm:p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${section.gradient} shadow-lg`}
                      >
                        <section.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      
                      <motion.div
                        animate={{ x: hoveredSection === section.id ? -4 : 0 }}
                        className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors"
                      >
                        <span className="text-xs font-medium">استعراض</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {section.title}
                        </h3>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          {section.count}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground/70 mb-1">{section.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.description}
                      </p>
                    </div>

                    {/* Platforms */}
                    <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border/50">
                      {section.platforms.map((platform, pIndex) => (
                        <motion.div
                          key={pIndex}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + pIndex * 0.05 }}
                          className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors"
                        >
                          <platform.icon className={`w-4 h-4 ${platform.color}`} />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Features Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card/50 border border-border/30"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">{feature.title}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Access Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">وصول سريع</h2>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
            {quickPlatforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.03 }}
                whileHover={{ scale: 1.08, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/dashboard/services">
                  <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-card transition-all cursor-pointer group">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                      <platform.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium text-center">
                      {platform.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-6"
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              animate={{ 
                x: [0, 100, 0],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -top-1/2 -right-1/4 w-1/2 h-full bg-primary/20 rounded-full blur-3xl"
            />
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">هل تحتاج مساعدة؟</h3>
              <p className="text-sm text-muted-foreground">فريق الدعم الفني متواجد على مدار الساعة لمساعدتك</p>
            </div>
            <Link to="/dashboard/support">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-shadow"
              >
                تواصل معنا
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesHome;
