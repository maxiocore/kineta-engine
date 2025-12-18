import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Megaphone, 
  Target, 
  Zap, 
  LineChart, 
  Users,
  CheckCircle,
  ArrowLeft,
  Phone,
  Mail,
  Palette,
  Code,
  FileText,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcons: Record<string, React.ElementType> = {
  "التسويق": TrendingUp,
  "الإعلانات": Megaphone,
  "التصميم": Palette,
  "التطوير": Code,
  "الاستشارات": MessageSquare,
};

const categoryGradients: Record<string, string> = {
  "التسويق": "from-primary to-cyan-400",
  "الإعلانات": "from-accent to-pink-400",
  "التصميم": "from-warning to-orange-400",
  "التطوير": "from-success to-emerald-400",
  "الاستشارات": "from-purple-500 to-indigo-400",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.08,
      delayChildren: 0.1
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const floatingAnimation = {
  y: [-5, 5, -5],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
};

const Services = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const categories = services 
    ? [...new Set(services.map(s => s.category))]
    : [];

  const filteredServices = selectedCategory
    ? services?.filter(s => s.category === selectedCategory)
    : services;

  const getIcon = (category: string) => {
    return categoryIcons[category] || BarChart3;
  };

  const getGradient = (category: string) => {
    return categoryGradients[category] || "from-primary to-cyan-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <motion.div 
              className="absolute top-20 right-[10%] w-72 h-72 bg-primary/10 rounded-full blur-[100px]"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div 
              className="absolute bottom-20 left-[10%] w-96 h-96 bg-accent/10 rounded-full blur-[120px]"
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.3, 0.5]
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-[150px]"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          <div className="container px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
                  <Sparkles className="w-4 h-4" />
                  خدماتنا المتميزة
                </span>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                حلول تسويقية{" "}
                <span className="relative">
                  <span className="bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_100%] bg-clip-text text-transparent animate-gradient">
                    متكاملة
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-l from-primary to-accent rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                نقدم لك مجموعة شاملة من الخدمات التسويقية المصممة خصيصاً لتحقيق أهدافك وتعزيز نمو أعمالك
              </motion.p>

              {/* Stats */}
              <motion.div 
                className="flex flex-wrap justify-center gap-8 mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {[
                  { value: "10+", label: "خدمة متخصصة" },
                  { value: "500+", label: "عميل راضٍ" },
                  { value: "98%", label: "نسبة الرضا" },
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    className="text-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 sticky top-16 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="container px-4">
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                الكل
              </Button>
              {categories.map((category) => {
                const Icon = getIcon(category);
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {category}
                  </Button>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 bg-gradient-to-b from-secondary/20 to-background">
          <div className="container px-4">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-8 rounded-2xl bg-background border border-border/50">
                    <Skeleton className="w-14 h-14 rounded-xl mb-6" />
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-6" />
                    <Skeleton className="h-8 w-1/3 mb-4" />
                    <div className="space-y-2">
                      {[...Array(5)].map((_, j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedCategory || "all"}
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                >
                  {filteredServices?.map((service, index) => {
                    const Icon = getIcon(service.category);
                    const gradient = getGradient(service.category);
                    const features = Array.isArray(service.features) 
                      ? service.features 
                      : JSON.parse(service.features as string || "[]");

                    return (
                      <motion.div
                        key={service.id}
                        variants={itemVariants}
                        whileHover={{ y: -8 }}
                        className="group relative"
                        layout
                      >
                        {/* Card Glow Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500`} />
                        
                        <div className="relative h-full p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden">
                          {/* Top Gradient Line */}
                          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-l ${gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                          
                          {/* Category Badge */}
                          <motion.div 
                            className="absolute top-4 left-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 + 0.3 }}
                          >
                            <Badge variant="secondary" className="text-xs">
                              {service.category}
                            </Badge>
                          </motion.div>

                          {/* Icon */}
                          <motion.div 
                            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} p-4 mb-6 shadow-lg relative`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            animate={floatingAnimation}
                          >
                            <Icon className="w-full h-full text-primary-foreground" />
                            <motion.div
                              className="absolute inset-0 bg-white/20 rounded-2xl"
                              animate={{ opacity: [0, 0.5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </motion.div>

                          {/* Title & Description */}
                          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-muted-foreground mb-6 line-clamp-2">
                            {service.description}
                          </p>

                          {/* Price */}
                          <div className="mb-6 flex items-baseline gap-2">
                            <span className="text-3xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                              {service.price.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground text-sm">ر.س / شهرياً</span>
                          </div>

                          {/* Features */}
                          <ul className="space-y-3 mb-8">
                            {features.slice(0, 5).map((feature: string, i: number) => (
                              <motion.li 
                                key={feature} 
                                className="flex items-center gap-3 text-sm"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 + 0.2 }}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.2 }}
                                  className="shrink-0"
                                >
                                  <CheckCircle className="w-4 h-4 text-success" />
                                </motion.div>
                                <span className="text-muted-foreground">{feature}</span>
                              </motion.li>
                            ))}
                            {features.length > 5 && (
                              <li className="text-sm text-primary font-medium">
                                +{features.length - 5} مميزات أخرى
                              </li>
                            )}
                          </ul>

                          {/* CTA Button */}
                          <Link to="/contact">
                            <Button className="w-full gap-2 group/btn overflow-hidden relative">
                              <span className="relative z-10">اطلب الخدمة</span>
                              <ArrowLeft className="w-4 h-4 relative z-10 group-hover/btn:-translate-x-1 transition-transform" />
                              <motion.div
                                className={`absolute inset-0 bg-gradient-to-l ${gradient}`}
                                initial={{ x: "100%" }}
                                whileHover={{ x: 0 }}
                                transition={{ duration: 0.3 }}
                              />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                لماذا تختارنا؟
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                نتميز بخبرة واسعة وفريق متخصص يعمل على تحقيق أهدافك
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Star, title: "جودة عالية", desc: "نلتزم بأعلى معايير الجودة في كل خدمة نقدمها" },
                { icon: Users, title: "فريق متخصص", desc: "خبراء في مجالاتهم مع سنوات من الخبرة" },
                { icon: Zap, title: "سرعة التنفيذ", desc: "نلتزم بالمواعيد ونسلم المشاريع في وقتها" },
                { icon: MessageSquare, title: "دعم مستمر", desc: "فريق دعم متاح للرد على استفساراتك" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center"
                >
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                    whileHover={{ rotate: 10 }}
                  >
                    <item.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border border-primary/20 relative overflow-hidden"
            >
              {/* Animated circles */}
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl"
                animate={{ scale: [1.2, 1, 1.2] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <motion.div
                animate={floatingAnimation}
                className="relative z-10"
              >
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              </motion.div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">
                هل تحتاج خدمة مخصصة؟
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto relative z-10">
                تواصل معنا لنصمم لك باقة خدمات تناسب احتياجاتك وميزانيتك
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Link to="/contact">
                  <Button size="lg" className="gap-2">
                    <Mail className="w-4 h-4" />
                    تواصل معنا
                  </Button>
                </Link>
                <a href="tel:+966551234567">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">+966 55 123 4567</span>
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;