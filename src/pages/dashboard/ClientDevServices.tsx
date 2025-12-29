import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Code,
  Search,
  Grid3X3,
  LayoutList,
  ShoppingCart,
  Shield,
  Activity,
  Check,
  Star,
  Clock,
  Sparkles,
  Zap,
  Award,
  Layers,
  Globe,
  Rocket,
  Users,
  MessageSquare,
  Target,
  TrendingUp,
  Eye,
  Terminal,
  Database,
  Server,
  Smartphone,
  Monitor,
  FileCode,
  Cpu,
  Braces,
  GitBranch,
  Cloud,
  Settings,
  Box,
  Webhook,
  ShieldCheck,
  Gauge,
  Blocks,
  MousePointer2,
  Bug,
  TestTube,
  Workflow,
  Binary,
  HardDrive,
  Network,
  Lock,
  RefreshCw,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ServicesPageSkeleton from "@/components/dashboard/ServicesPageSkeleton";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  category_id: string | null;
  status: string;
  features: any;
  refill_enabled: boolean | null;
  external_service_id: string | null;
}

// ===== Main Categories Data =====
const mainCategories = [
  {
    id: "web",
    name: "تطوير الويب",
    icon: Globe,
    color: "from-cyan-500 to-blue-600",
    description: "مواقع وتطبيقات ويب احترافية",
    keywords: ["web", "website", "موقع", "ويب", "frontend", "html", "css", "react", "vue", "landing", "صفحة"]
  },
  {
    id: "mobile",
    name: "تطبيقات الجوال",
    icon: Smartphone,
    color: "from-purple-500 to-violet-600",
    description: "تطبيقات iOS و Android",
    keywords: ["mobile", "app", "تطبيق", "جوال", "ios", "android", "flutter", "react native", "موبايل"]
  },
  {
    id: "backend",
    name: "الباك إند",
    icon: Server,
    color: "from-orange-500 to-red-600",
    description: "أنظمة وسيرفرات قوية",
    keywords: ["backend", "server", "سيرفر", "باك", "node", "python", "php", "laravel", "express", "api"]
  },
  {
    id: "database",
    name: "قواعد البيانات",
    icon: Database,
    color: "from-emerald-500 to-green-600",
    description: "تصميم وإدارة البيانات",
    keywords: ["database", "قواعد", "بيانات", "sql", "mysql", "postgresql", "mongodb", "firebase"]
  },
  {
    id: "ecommerce",
    name: "المتاجر الإلكترونية",
    icon: ShoppingCart,
    color: "from-pink-500 to-rose-600",
    description: "حلول تجارة إلكترونية متكاملة",
    keywords: ["ecommerce", "متجر", "shop", "store", "سلة", "shopify", "woocommerce", "تجارة"]
  },
  {
    id: "systems",
    name: "الأنظمة المتكاملة",
    icon: Workflow,
    color: "from-indigo-500 to-blue-600",
    description: "أنظمة إدارية وتشغيلية",
    keywords: ["system", "نظام", "erp", "crm", "إدارة", "dashboard", "لوحة تحكم"]
  }
];

// ===== Tech Stack Icons =====
const techStackIcons = [
  { icon: Braces, label: "JavaScript" },
  { icon: Code, label: "TypeScript" },
  { icon: Terminal, label: "Node.js" },
  { icon: Database, label: "PostgreSQL" },
  { icon: Cloud, label: "AWS" },
  { icon: GitBranch, label: "Git" },
];

// ===== Floating Element Component =====
const FloatingElement = ({ 
  children, 
  delay = 0, 
  duration = 5,
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number;
  duration?: number;
  className?: string;
}) => (
  <motion.div
    animate={{
      y: [-8, 8, -8],
      rotate: [-2, 2, -2],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// ===== Code Animation Component =====
const CodeAnimation = () => {
  const codeLines = [
    "const app = express();",
    "app.use(cors());",
    "await db.connect();",
    "return res.json(data);",
  ];
  
  return (
    <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 font-mono text-xs text-white/30 space-y-1">
      {codeLines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.3, x: 0 }}
          transition={{ delay: i * 0.2 }}
        >
          {line}
        </motion.div>
      ))}
    </div>
  );
};

// ===== Helper function to extract delivery time from features =====
const getDeliveryTime = (features: any): string => {
  if (!Array.isArray(features)) return "3-7 أيام";
  
  for (const feature of features) {
    if (typeof feature === 'string') {
      const dayMatch = feature.match(/(\d+)\s*(يوم|أيام)/);
      if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        return days === 1 ? "يوم واحد" : `${days} أيام`;
      }
      
      const weekMatch = feature.match(/(\d+)\s*(أسبوع|أسابيع)/);
      if (weekMatch) {
        const weeks = parseInt(weekMatch[1]);
        return weeks === 1 ? "أسبوع واحد" : `${weeks} أسابيع`;
      }
      
      if (feature.includes("تسليم سريع")) return "3-5 أيام";
    }
  }
  
  return "3-7 أيام";
};

// ===== Service Card Component =====
const DevServiceCard = ({ 
  service, 
  index, 
  onOrder, 
  onViewDetails 
}: { 
  service: Service; 
  index: number; 
  onOrder: (service: Service) => void;
  onViewDetails: (service: Service) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const icons = [Code, Terminal, Database, Server, Globe, Smartphone, Cpu, FileCode, Braces];
  const IconComponent = icons[index % icons.length];
  const features = Array.isArray(service.features) ? service.features.slice(0, 3) : [];
  const deliveryTime = getDeliveryTime(service.features);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group h-full"
    >
      <Card className="h-full relative overflow-hidden border-2 border-border/50 bg-card/95 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-500 rounded-2xl hover:shadow-2xl hover:shadow-emerald-500/10">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-teal-500/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="relative z-10 p-5 h-full flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <motion.div 
              animate={{ rotate: isHovered ? 5 : 0, scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                <IconComponent className="w-7 h-7 text-white" />
              </div>
            </motion.div>

            <div className="text-left flex flex-col items-end gap-2">
              <motion.div 
                animate={{ scale: isHovered ? 1.05 : 1 }}
                className="flex items-baseline gap-1"
              >
                <span className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  {service.price.toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">ر.س</span>
              </motion.div>
              
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {index < 3 && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    مميز
                  </Badge>
                )}
                {service.refill_enabled && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-0.5">
                    <Shield className="w-2.5 h-2.5" />
                    ضمان
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <h3 className="font-bold text-base leading-snug mb-2 group-hover:text-emerald-500 transition-colors line-clamp-2">
            {service.name}
          </h3>

          {service.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-3 leading-relaxed flex-grow">
              {service.description}
            </p>
          )}

          {features.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                  <span className="text-muted-foreground truncate">{feature}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mb-4 mt-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>التسليم: {deliveryTime}</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(service)}
              className="flex-1 rounded-xl h-10 text-xs border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5"
            >
              <Eye className="w-3.5 h-3.5 ml-1.5" />
              التفاصيل
            </Button>
            <Button
              size="sm"
              onClick={() => onOrder(service)}
              className="flex-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500 hover:opacity-90 text-white rounded-xl h-10 text-xs shadow-md hover:shadow-lg transition-shadow"
            >
              <ShoppingCart className="w-3.5 h-3.5 ml-1.5" />
              اطلب الآن
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ===== List View Card =====
const DevServiceListCard = ({ 
  service, 
  index, 
  onOrder, 
  onViewDetails 
}: { 
  service: Service; 
  index: number; 
  onOrder: (service: Service) => void;
  onViewDetails: (service: Service) => void;
}) => {
  const icons = [Code, Terminal, Database, Server, Globe, Smartphone];
  const IconComponent = icons[index % icons.length];
  const deliveryTime = getDeliveryTime(service.features);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-2 border-border/50 bg-card/95 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300 rounded-xl hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-md shrink-0">
              <IconComponent className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-base truncate group-hover:text-emerald-500 transition-colors">
                  {service.name}
                </h3>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent shrink-0">
                  {service.price.toFixed(0)} ر.س
                </span>
              </div>
              
              {service.description && (
                <p className="text-xs text-muted-foreground/70 line-clamp-1 mb-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {index < 3 && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                      <Star className="w-2.5 h-2.5 fill-current ml-0.5" />
                      مميز
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {deliveryTime}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(service)}
                    className="h-8 px-3 text-xs rounded-lg"
                  >
                    <Eye className="w-3 h-3 ml-1" />
                    التفاصيل
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onOrder(service)}
                    className="h-8 px-3 text-xs bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg"
                  >
                    <ShoppingCart className="w-3 h-3 ml-1" />
                    اطلب
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ===== Main Component =====
const ClientDevServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const devKeywords = ["programming", "code", "web", "app", "برمجة", "موقع", "تطبيق", "development", "developer", "website", "application", "api", "backend", "frontend", "متجر", "نظام", "لوحة", "dashboard"];

  const { data: initialServices, isLoading, refetch } = useQuery({
    queryKey: ["dev-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      
      if (error) throw error;
      
      return (data as Service[]).filter(service => {
        if (service.category === 'development' || service.category === 'dev') return true;
        
        const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
        return devKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    },
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success("تم تحديث الخدمات");
  };

  useEffect(() => {
    if (initialServices) {
      setServices(initialServices);
    }
  }, [initialServices]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (data) setBalance(data.balance);
  };

  useEffect(() => {
    const channel = supabase
      .channel('dev_services_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Filter services by category and search
  const getFilteredServices = () => {
    let filtered = services;

    // Filter by selected category
    if (selectedCategory) {
      const category = mainCategories.find(c => c.id === selectedCategory);
      if (category) {
        filtered = filtered.filter(service => {
          const searchText = `${service.name} ${service.description || ''}`.toLowerCase();
          return category.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
        });
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredServices = getFilteredServices();

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
    setDetailsDialogOpen(true);
  };

  const handleOrderClick = (service: Service) => {
    navigate(`/dashboard/dev-services/order?serviceId=${service.id}`);
  };

  const stats = [
    { value: `${services.length}`, label: "خدمة متاحة", icon: Activity },
    { value: "3-14", label: "يوم تسليم", icon: Rocket },
    { value: "+100", label: "مشروع منجز", icon: Users },
    { value: "100%", label: "ضمان الجودة", icon: Shield }
  ];

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <ServicesPageSkeleton title="خدمات البرمجة" color="emerald" />
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="space-y-6 lg:space-y-8 pb-8" dir="rtl">
          
          {/* ===== HERO SECTION ===== */}
          <section className="relative overflow-hidden rounded-3xl">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-cyan-600 to-teal-700" />
            
            {/* Animated Orbs */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], x: [0, 50, 0] }}
              transition={{ duration: 15, repeat: Infinity }}
              className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2], x: [0, -40, 0] }}
              transition={{ duration: 12, repeat: Infinity }}
              className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"
            />

            {/* Code Pattern Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 text-white text-xs font-mono">{'<code>'}</div>
              <div className="absolute bottom-4 right-4 text-white text-xs font-mono">{'</code>'}</div>
              <div className="absolute top-1/3 right-1/4 text-white text-2xl font-mono">{'{}'}</div>
              <div className="absolute bottom-1/3 left-1/4 text-white text-2xl font-mono">{'()'}</div>
              <div className="absolute top-1/2 right-1/3 text-white text-lg font-mono">{'// TODO'}</div>
            </div>

            {/* Floating Elements */}
            <FloatingElement delay={0} duration={6} className="absolute top-8 left-8 hidden lg:block">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Terminal className="w-6 h-6 text-white" />
              </div>
            </FloatingElement>
            <FloatingElement delay={1} duration={7} className="absolute bottom-12 right-20 hidden lg:block">
              <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
            </FloatingElement>
            <FloatingElement delay={2} duration={5} className="absolute top-20 right-1/4 hidden lg:block">
              <div className="w-8 h-8 rounded-full bg-cyan-400/30 backdrop-blur-sm flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
            </FloatingElement>

            {/* Code Animation */}
            <CodeAnimation />

            {/* Content */}
            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
              <div className="max-w-4xl">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-4"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span className="text-white/90 text-sm font-medium">+{services.length} خدمة</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-300 text-xs">متاح الآن</span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
                >
                  خدمات البرمجة
                  <span className="block text-cyan-300">والتطوير</span>
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/80 text-base sm:text-lg max-w-xl mb-6"
                >
                  حلول برمجية احترافية بأحدث التقنيات لتحويل أفكارك إلى واقع رقمي
                </motion.p>

                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
                    >
                      <stat.icon className="w-5 h-5 text-cyan-300" />
                      <div>
                        <div className="text-xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-white/70">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Tech Stack */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 mt-6 flex-wrap"
                >
                  <span className="text-white/60 text-xs">التقنيات:</span>
                  {techStackIcons.map((tech, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center" title={tech.label}>
                      <tech.icon className="w-4 h-4 text-white/70" />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </section>

          {/* ===== CATEGORIES SECTION ===== */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                اختر نوع الخدمة
              </h2>
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-muted-foreground"
                >
                  عرض الكل
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {mainCategories.map((category, index) => {
                const isActive = selectedCategory === category.id;
                const categoryCount = services.filter(s => {
                  const searchText = `${s.name} ${s.description || ''}`.toLowerCase();
                  return category.keywords.some(k => searchText.includes(k.toLowerCase()));
                }).length;

                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedCategory(isActive ? null : category.id)}
                    className={cn(
                      "relative p-4 rounded-2xl border-2 transition-all duration-300 text-right",
                      isActive
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-border/50 bg-card/80 hover:border-emerald-500/30 hover:bg-card"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br",
                      category.color
                    )}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
                    <Badge variant="secondary" className="absolute top-3 left-3 text-[10px]">
                      {categoryCount}+
                    </Badge>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* ===== SEARCH & FILTERS ===== */}
          <section className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن خدمة برمجية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 h-14 text-base rounded-2xl border-2 border-transparent bg-card/80 focus:border-emerald-500/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-14 w-14 rounded-2xl",
                  viewMode === "grid" && "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                )}
              >
                <Grid3X3 className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-14 w-14 rounded-2xl",
                  viewMode === "list" && "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                )}
              >
                <LayoutList className="w-5 h-5" />
              </Button>
            </div>
          </section>

          {/* ===== SERVICES COUNT ===== */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-2 px-4 py-2">
              <Activity className="w-4 h-4" />
              {filteredServices.length} خدمة
            </Badge>
            {selectedCategory && (
              <Badge variant="outline" className="gap-1">
                {mainCategories.find(c => c.id === selectedCategory)?.name}
              </Badge>
            )}
          </div>

          {/* ===== SERVICES GRID ===== */}
          <AnimatePresence mode="wait">
            {filteredServices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6"
                >
                  <Terminal className="w-12 h-12 text-emerald-500" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">لا توجد خدمات</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  {searchQuery ? "جرب البحث بكلمات مختلفة" : "سيتم إضافة خدمات جديدة قريباً"}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-3"
                )}
              >
                {filteredServices.map((service, index) =>
                  viewMode === "grid" ? (
                    <DevServiceCard
                      key={service.id}
                      service={service}
                      index={index}
                      onOrder={handleOrderClick}
                      onViewDetails={handleViewDetails}
                    />
                  ) : (
                    <DevServiceListCard
                      key={service.id}
                      service={service}
                      index={index}
                      onOrder={handleOrderClick}
                      onViewDetails={handleViewDetails}
                    />
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== WHY CHOOSE US ===== */}
          <section className="mt-12">
            <h2 className="text-xl font-bold text-center mb-8">لماذا تختارنا؟</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Zap, title: "تنفيذ سريع", desc: "نلتزم بالمواعيد المحددة", color: "text-amber-500" },
                { icon: Shield, title: "ضمان الجودة", desc: "معايير عالية الجودة", color: "text-emerald-500" },
                { icon: Users, title: "دعم متواصل", desc: "فريق دعم فني متخصص", color: "text-blue-500" },
                { icon: Award, title: "خبرة واسعة", desc: "+100 مشروع منجز", color: "text-purple-500" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-card/80 border border-border/50"
                >
                  <div className={cn("w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-current/10", item.color)}>
                    <item.icon className={cn("w-6 h-6", item.color)} />
                  </div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </PullToRefresh>

      {/* ===== SERVICE DETAILS DIALOG ===== */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          {selectedService && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <Terminal className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl mb-1">{selectedService.name}</DialogTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                        {selectedService.price.toFixed(0)} ر.س
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {selectedService.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {selectedService.description}
                  </p>
                )}

                {Array.isArray(selectedService.features) && selectedService.features.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      مميزات الخدمة
                    </h4>
                    <div className="space-y-2">
                      {selectedService.features.map((feature: string, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-2 p-2 rounded-lg bg-card/50"
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-[10px] text-muted-foreground">مدة التسليم</p>
                      <p className="font-bold text-sm">{selectedService ? getDeliveryTime(selectedService.features) : "3-7 أيام"}</p>
                    </div>
                    <div className="text-center">
                      <MessageSquare className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <p className="text-[10px] text-muted-foreground">الدعم</p>
                      <p className="font-bold text-sm">متواصل</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="rounded-xl flex-1 sm:flex-none">
                  إغلاق
                </Button>
                <Button
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleOrderClick(selectedService);
                  }}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500 text-white rounded-xl"
                >
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  اطلب الآن
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ClientDashboardLayout>
  );
};

export default ClientDevServices;
