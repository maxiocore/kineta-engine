import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  Code, Globe, Smartphone, Server, Database, Link, Cloud, 
  ShoppingCart, Wrench, Search, Filter, Star, Zap, Shield,
  Clock, ArrowLeft, Sparkles, TrendingUp, CheckCircle,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DevService {
  id: string;
  slug: string;
  title_ar: string;
  desc_ar: string;
  category: string;
  base_price: number;
  eta_days_min: number;
  eta_days_max: number;
  icon: string;
  features: string[];
  is_featured: boolean;
  is_fast: boolean;
  has_guarantee: boolean;
}

const categories = [
  { id: "all", label: "الكل", icon: Code },
  { id: "web", label: "تطوير ويب", icon: Globe },
  { id: "mobile", label: "تطبيقات جوال", icon: Smartphone },
  { id: "backend", label: "باك-إند", icon: Server },
  { id: "database", label: "قواعد بيانات", icon: Database },
  { id: "systems", label: "الأنظمة", icon: Link },
  { id: "devops", label: "DevOps", icon: Cloud },
];

const sortOptions = [
  { id: "featured", label: "الأكثر تميزاً" },
  { id: "fast", label: "الأسرع تنفيذاً" },
  { id: "price-low", label: "السعر: الأقل" },
  { id: "price-high", label: "السعر: الأعلى" },
];

const iconMap: Record<string, any> = {
  Code, Globe, Smartphone, Server, Database, Link, Cloud, ShoppingCart, Wrench
};

export default function DevServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<DevService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("dev_services")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      const mappedServices = (data || []).map(s => ({
        ...s,
        features: Array.isArray(s.features) 
          ? (s.features as unknown as string[]) 
          : (typeof s.features === 'string' ? JSON.parse(s.features) : [])
      }));
      
      setServices(mappedServices as DevService[]);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = useMemo(() => {
    let result = [...services];

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter(s => s.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title_ar.toLowerCase().includes(query) ||
        s.desc_ar?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "featured":
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
      case "fast":
        result.sort((a, b) => a.eta_days_min - b.eta_days_min);
        break;
      case "price-low":
        result.sort((a, b) => a.base_price - b.base_price);
        break;
      case "price-high":
        result.sort((a, b) => b.base_price - a.base_price);
        break;
    }

    return result;
  }, [services, selectedCategory, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: services.length,
    avgDelivery: services.length > 0 
      ? Math.round(services.reduce((acc, s) => acc + s.eta_days_min, 0) / services.length)
      : 0,
    featured: services.filter(s => s.is_featured).length
  }), [services]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-bl from-primary/10 via-background to-accent/5 border-b border-border/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Code className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  خدمات البرمجة
                </h1>
                <p className="text-muted-foreground mt-1">
                  حلول برمجية احترافية تناسب احتياجاتك
                </p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-xl border border-border/50">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{stats.total} خدمة متاحة</span>
              </div>
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-xl border border-border/50">
                <Clock className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">متوسط التسليم: {stats.avgDelivery} أيام</span>
              </div>
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-xl border border-border/50">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">ضمان الجودة 100%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 p-4 mb-8 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن خدمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-background border-border/50"
              />
            </div>

            {/* Category Filter - Desktop */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>

            {/* Category Filter - Mobile */}
            <div className="lg:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[150px]">
                  <Filter className="h-4 w-4" />
                  <span>ترتيب حسب</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {sortOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className={sortBy === opt.id ? "bg-primary/10" : ""}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Code className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">لا توجد خدمات</h3>
            <p className="text-muted-foreground/70 mt-2">جرب تغيير معايير البحث</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => {
                const IconComponent = iconMap[service.icon] || Code;
                return (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="relative h-full bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                      {/* Tags */}
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        {service.is_featured && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                            <Star className="h-3 w-3 ml-1" />
                            مميز
                          </Badge>
                        )}
                        {service.is_fast && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                            <Zap className="h-3 w-3 ml-1" />
                            سريع
                          </Badge>
                        )}
                        {service.has_guarantee && (
                          <Badge variant="outline" className="bg-card/80 backdrop-blur">
                            <Shield className="h-3 w-3 ml-1 text-primary" />
                            ضمان
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {/* Icon */}
                        <div className="mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className="h-7 w-7 text-primary" />
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {service.title_ar}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {service.desc_ar}
                        </p>

                        {/* Features */}
                        <div className="space-y-2 mb-4">
                          {service.features?.slice(0, 3).map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{service.eta_days_min}-{service.eta_days_max} يوم</span>
                          </div>
                          <div className="text-left">
                            <span className="text-xs text-muted-foreground block">يبدأ من</span>
                            <span className="text-lg font-bold text-primary">
                              {service.base_price.toLocaleString()} ر.س
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 pt-0 flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => navigate(`/dashboard/dev-services/${service.slug}`)}
                        >
                          عرض التفاصيل
                        </Button>
                        <Button
                          className="flex-1 gap-2"
                          onClick={() => navigate(`/dashboard/dev-services/order/${service.id}`)}
                        >
                          اطلب الآن
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
