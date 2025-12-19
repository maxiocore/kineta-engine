import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Palette,
  Search,
  Grid3X3,
  List,
  ShoppingCart,
  Shield,
  Activity,
  Check,
  Star,
  Clock,
  ArrowLeft,
  Eye,
  FileCheck,
  Sparkles,
  Briefcase,
  Lightbulb,
  Target,
  Building2,
  Zap,
  Award,
  Layers,
  PenTool,
  Image,
  Globe,
  Rocket,
  Heart,
  Users,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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

interface OrderFormData {
  projectName: string;
  projectActivity: string;
  ideaType: string;
  ideaDescription: string;
  targetAudience: string;
  preferredColors: string;
  referenceLinks: string;
  additionalNotes: string;
  contactMethod: string;
}

const projectActivities = [
  { value: "restaurant", label: "مطعم / كافيه", icon: "🍽️" },
  { value: "tech", label: "تقنية / برمجة", icon: "💻" },
  { value: "fashion", label: "أزياء / موضة", icon: "👗" },
  { value: "health", label: "صحة / طب", icon: "🏥" },
  { value: "education", label: "تعليم / تدريب", icon: "📚" },
  { value: "sports", label: "رياضة / لياقة", icon: "⚽" },
  { value: "real-estate", label: "عقارات", icon: "🏠" },
  { value: "ecommerce", label: "تجارة إلكترونية", icon: "🛒" },
  { value: "beauty", label: "جمال / عناية", icon: "💄" },
  { value: "finance", label: "مالية / استثمار", icon: "💰" },
  { value: "travel", label: "سفر / سياحة", icon: "✈️" },
  { value: "entertainment", label: "ترفيه / فنون", icon: "🎭" },
  { value: "other", label: "أخرى", icon: "📌" },
];

const ideaTypes = [
  { value: "modern", label: "عصري وحديث", description: "تصميم بسيط وأنيق" },
  { value: "classic", label: "كلاسيكي فخم", description: "تصميم راقي وتقليدي" },
  { value: "playful", label: "مرح وإبداعي", description: "ألوان زاهية وأشكال مميزة" },
  { value: "minimal", label: "بسيط ونظيف", description: "الأقل هو الأفضل" },
  { value: "bold", label: "جريء ومؤثر", description: "تصميم قوي يلفت الانتباه" },
  { value: "elegant", label: "أنيق وراقي", description: "فخامة وجاذبية" },
];

const targetAudiences = [
  { value: "youth", label: "الشباب (18-30)" },
  { value: "adults", label: "البالغين (30-50)" },
  { value: "seniors", label: "كبار السن (50+)" },
  { value: "children", label: "الأطفال" },
  { value: "families", label: "العائلات" },
  { value: "professionals", label: "المحترفين والأعمال" },
  { value: "all", label: "جميع الفئات" },
];

const LiveIndicator = () => (
  <motion.div 
    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      className="w-2 h-2 rounded-full bg-emerald-500"
      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <span className="text-xs font-medium text-emerald-500">مباشر</span>
  </motion.div>
);

const ServiceFeatureIcon = ({ index }: { index: number }) => {
  const icons = [CheckCircle2, Star, Zap, Award, Shield];
  const Icon = icons[index % icons.length];
  return <Icon className="w-3.5 h-3.5 text-green-500" />;
};

const ClientDesignServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderStep, setOrderStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  
  const [formData, setFormData] = useState<OrderFormData>({
    projectName: "",
    projectActivity: "",
    ideaType: "",
    ideaDescription: "",
    targetAudience: "",
    preferredColors: "",
    referenceLinks: "",
    additionalNotes: "",
    contactMethod: "email",
  });

  // Keywords for design services
  const designKeywords = ["design", "graphic", "logo", "brand", "تصميم", "شعار", "هوية", "جرافيك", "بوستر", "فوتوشوب", "illustrator"];

  // Fetch design services
  const { data: initialServices, isLoading } = useQuery({
    queryKey: ["design-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });
      
      if (error) throw error;
      
      return (data as Service[]).filter(service => {
        const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
        return designKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    },
  });

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

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('design_services_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const service = payload.new as Service;
            const searchText = `${service.name} ${service.description || ''} ${service.category}`.toLowerCase();
            const isDesignService = designKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
            
            if (service.status === 'active' && isDesignService) {
              setServices(prev => {
                const exists = prev.find(s => s.id === service.id);
                if (exists) {
                  return prev.map(s => s.id === service.id ? service : s);
                }
                return [...prev, service].sort((a, b) => a.price - b.price);
              });
              if (payload.eventType === 'INSERT') {
                toast.success(`خدمة جديدة: ${service.name}`);
              }
            } else {
              setServices(prev => prev.filter(s => s.id !== service.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setServices(prev => prev.filter(s => s.id !== (payload.old as Service).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter by search
  const filteredServices = services.filter(service => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query)
    );
  });

  const resetForm = () => {
    setFormData({
      projectName: "",
      projectActivity: "",
      ideaType: "",
      ideaDescription: "",
      targetAudience: "",
      preferredColors: "",
      referenceLinks: "",
      additionalNotes: "",
      contactMethod: "email",
    });
    setOrderStep(1);
  };

  const handleOrder = async () => {
    if (!user || !selectedService) return;
    
    if (balance < selectedService.price) {
      toast.error("رصيدك غير كافي", {
        description: "يرجى شحن رصيدك أولاً"
      });
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      
      // Build detailed notes from form data
      const detailedNotes = `
📋 تفاصيل المشروع:
━━━━━━━━━━━━━━━━━━━━━
🏷️ اسم المشروع: ${formData.projectName || "غير محدد"}
📌 نشاط المشروع: ${projectActivities.find(a => a.value === formData.projectActivity)?.label || "غير محدد"}
🎨 نوع التصميم المطلوب: ${ideaTypes.find(t => t.value === formData.ideaType)?.label || "غير محدد"}
👥 الفئة المستهدفة: ${targetAudiences.find(t => t.value === formData.targetAudience)?.label || "غير محدد"}

💡 فكرة التصميم:
${formData.ideaDescription || "لم يتم تحديد وصف"}

🎨 الألوان المفضلة: ${formData.preferredColors || "غير محدد"}

🔗 روابط مرجعية:
${formData.referenceLinks || "لا توجد"}

📝 ملاحظات إضافية:
${formData.additionalNotes || "لا توجد"}

📞 طريقة التواصل المفضلة: ${formData.contactMethod === "email" ? "البريد الإلكتروني" : formData.contactMethod === "whatsapp" ? "واتساب" : "الهاتف"}
`.trim();

      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          service_id: selectedService.id,
          total_price: selectedService.price,
          quantity: 1,
          link: formData.referenceLinks || null,
          notes: detailedNotes,
          status: 'pending' as const,
          order_number: orderNumber
        }]);

      if (orderError) throw orderError;

      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({ 
          balance: balance - selectedService.price,
          total_spent: balance + selectedService.price
        })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      toast.success("تم إرسال الطلب بنجاح! 🎉", {
        description: "سيتم التواصل معك قريباً لمناقشة التفاصيل"
      });
      
      setOrderDialogOpen(false);
      resetForm();
      setSelectedService(null);
      fetchBalance();
    } catch (error) {
      toast.error("حدث خطأ", {
        description: "يرجى المحاولة مرة أخرى"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFeatures = (service: Service): string[] => {
    if (Array.isArray(service.features)) return service.features;
    return [];
  };

  const canProceedToStep2 = formData.projectName && formData.projectActivity;
  const canProceedToStep3 = formData.ideaType && formData.ideaDescription;

  const getServiceIcon = (index: number) => {
    const icons = [PenTool, Palette, Image, Layers, Globe];
    return icons[index % icons.length];
  };

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 lg:space-y-8" dir="rtl">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 p-6 sm:p-8 lg:p-10"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          
          {/* Floating Icons */}
          <motion.div 
            className="absolute top-6 left-6 opacity-20"
            animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Palette className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div 
            className="absolute bottom-6 left-1/4 opacity-20"
            animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          >
            <PenTool className="w-10 h-10 text-white" />
          </motion.div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <Link to="/dashboard/our-services">
                  <motion.div 
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </motion.div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">خدمات التصميم الإبداعي</h1>
                    <LiveIndicator />
                  </div>
                  <p className="text-white/80 text-sm sm:text-base max-w-xl">
                    نحول أفكارك إلى تصاميم مبهرة تعكس هوية علامتك التجارية وتجذب جمهورك المستهدف
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm"
                >
                  <Activity className="w-4 h-4 text-white" />
                  <span className="font-semibold text-white">{services.length} خدمة متاحة</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm"
                >
                  <span className="text-white/80 text-sm">رصيدك:</span>
                  <span className="font-bold text-white text-lg">${balance.toFixed(2)}</span>
                </motion.div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { icon: Rocket, label: "تسليم سريع", value: "24-48 ساعة" },
                { icon: Shield, label: "ضمان الجودة", value: "100%" },
                { icon: Users, label: "عملاء سعداء", value: "+1000" },
                { icon: Award, label: "مصممين محترفين", value: "+50" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center"
                >
                  <stat.icon className="w-5 h-5 text-white/80 mx-auto mb-1" />
                  <p className="text-white font-bold text-sm">{stat.value}</p>
                  <p className="text-white/60 text-xs">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن خدمة تصميم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 text-base rounded-xl bg-card border-border/50 focus:border-purple-500/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-12 w-12 rounded-xl ${viewMode === "grid" ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}`}
            >
              <Grid3X3 className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-12 w-12 rounded-xl ${viewMode === "list" ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}`}
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 lg:py-24"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
              <Palette className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">لا توجد خدمات تصميم حالياً</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery ? "لم يتم العثور على خدمات تطابق البحث" : "سيتم إضافة خدمات التصميم قريباً"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`grid gap-5 lg:gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                  : "grid-cols-1"
              }`}
            >
              {filteredServices.map((service, index) => {
                const IconComponent = getServiceIcon(index);
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="group"
                  >
                    <Card className="h-full relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/80 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 rounded-2xl">
                      {/* Background Decorations */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-fuchsia-500/10 to-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Popular Badge */}
                      {index === 0 && (
                        <div className="absolute top-4 left-4 z-10">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                          >
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg gap-1.5 px-3 py-1">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              الأكثر طلباً
                            </Badge>
                          </motion.div>
                        </div>
                      )}

                      {/* New Service Badge */}
                      {index === 1 && (
                        <div className="absolute top-4 left-4 z-10">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                          >
                            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg gap-1.5 px-3 py-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              جديد
                            </Badge>
                          </motion.div>
                        </div>
                      )}

                      <CardHeader className="relative z-10 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <motion.div 
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0"
                            >
                              <IconComponent className="w-7 h-7 text-white" />
                            </motion.div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-lg group-hover:text-purple-500 transition-colors line-clamp-1">
                                {service.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="text-xs">تسليم 24-48 ساعة</span>
                                </div>
                                {service.refill_enabled && (
                                  <Badge variant="outline" className="text-[10px] h-5 gap-1 border-green-500/30 text-green-600">
                                    <Shield className="w-2.5 h-2.5" />
                                    ضمان
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-left flex-shrink-0">
                            <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                              ${service.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="relative z-10 pt-0 space-y-4">
                        {service.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {service.description}
                          </p>
                        )}

                        {/* Features */}
                        {getFeatures(service).length > 0 && (
                          <div className="space-y-2.5 p-3 rounded-xl bg-muted/30 border border-border/30">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">مميزات الخدمة</p>
                            {getFeatures(service).slice(0, 4).map((feature, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + idx * 0.05 }}
                                className="flex items-center gap-2.5"
                              >
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                  <ServiceFeatureIcon index={idx} />
                                </div>
                                <span className="text-sm text-foreground/80">{feature}</span>
                              </motion.div>
                            ))}
                            {getFeatures(service).length > 4 && (
                              <p className="text-xs text-purple-500 font-medium mr-7">
                                +{getFeatures(service).length - 4} مميزات أخرى
                              </p>
                            )}
                          </div>
                        )}

                        {/* Service Highlights */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Heart className="w-3 h-3 text-pink-500" />
                            تصميم مخصص
                          </Badge>
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            تعديلات مجانية
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-border/30">
                          <Button
                            onClick={() => {
                              setSelectedService(service);
                              setDetailsDialogOpen(true);
                            }}
                            variant="outline"
                            className="flex-1 gap-2 h-11 rounded-xl hover:bg-purple-500/10 hover:border-purple-500/50"
                          >
                            <Eye className="w-4 h-4" />
                            التفاصيل
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedService(service);
                              resetForm();
                              setOrderDialogOpen(true);
                            }}
                            className="flex-1 gap-2 h-11 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            اطلب الآن
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Why Choose Us Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-center mb-8">لماذا تختار خدمات التصميم لدينا؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Target, title: "تصميم هادف", desc: "نفهم أهدافك ونصمم لتحقيقها" },
              { icon: Zap, title: "سرعة التنفيذ", desc: "نلتزم بمواعيد التسليم" },
              { icon: Sparkles, title: "إبداع متجدد", desc: "أفكار مبتكرة ومميزة" },
              { icon: Shield, title: "ضمان الرضا", desc: "نعمل حتى تكون راضياً تماماً" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-card border border-border/50 hover:border-purple-500/30 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Palette className="w-7 h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedService?.name}</DialogTitle>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    ${selectedService?.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-5">
              {selectedService?.description && (
                <div className="p-4 rounded-xl bg-muted/50">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    وصف الخدمة
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedService.description}
                  </p>
                </div>
              )}

              {selectedService && getFeatures(selectedService).length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    مميزات الخدمة
                  </h4>
                  <div className="grid gap-2.5">
                    {getFeatures(selectedService).map((feature, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-card/50 hover:bg-card transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Info */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs text-muted-foreground">مدة التسليم</p>
                    <p className="font-bold">24-48 ساعة</p>
                  </div>
                  <div className="text-center">
                    <MessageSquare className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xs text-muted-foreground">تعديلات</p>
                    <p className="font-bold">غير محدودة</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="rounded-xl">
                إغلاق
              </Button>
              <Button
                onClick={() => {
                  setDetailsDialogOpen(false);
                  resetForm();
                  setOrderDialogOpen(true);
                }}
                className="gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <ShoppingCart className="w-4 h-4" />
                اطلب الآن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Advanced Order Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={(open) => {
          setOrderDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                طلب خدمة التصميم
              </DialogTitle>
              <DialogDescription className="text-base">
                "{selectedService?.name}" - ${selectedService?.price.toFixed(2)}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      scale: orderStep === step ? 1.1 : 1,
                      backgroundColor: orderStep >= step ? "hsl(var(--primary))" : "hsl(var(--muted))"
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      orderStep >= step ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {orderStep > step ? <Check className="w-5 h-5" /> : step}
                  </motion.div>
                  {step < 3 && (
                    <div className={`w-12 h-1 rounded-full ${orderStep > step ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-8 text-xs text-muted-foreground mb-4">
              <span className={orderStep >= 1 ? "text-primary font-medium" : ""}>معلومات المشروع</span>
              <span className={orderStep >= 2 ? "text-primary font-medium" : ""}>فكرة التصميم</span>
              <span className={orderStep >= 3 ? "text-primary font-medium" : ""}>تأكيد الطلب</span>
            </div>
            
            <AnimatePresence mode="wait">
              {/* Step 1: Project Info */}
              {orderStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-500" />
                      معلومات المشروع الأساسية
                    </h3>
                    <p className="text-sm text-muted-foreground">ساعدنا نفهم مشروعك أكثر</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projectName" className="text-base font-medium">
                        اسم المشروع / العلامة التجارية <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="projectName"
                        value={formData.projectName}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                        placeholder="مثال: مطعم الأصالة، متجر نور، ..."
                        className="mt-2 h-12 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        نشاط المشروع <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">اختر المجال الأقرب لمشروعك</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {projectActivities.map((activity) => (
                          <motion.button
                            key={activity.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, projectActivity: activity.value }))}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3 rounded-xl border text-right transition-all ${
                              formData.projectActivity === activity.value
                                ? "border-purple-500 bg-purple-500/10 shadow-md"
                                : "border-border hover:border-purple-500/50 hover:bg-muted/50"
                            }`}
                          >
                            <span className="text-xl mb-1 block">{activity.icon}</span>
                            <span className="text-sm font-medium">{activity.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium">الفئة المستهدفة</Label>
                      <Select
                        value={formData.targetAudience}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}
                      >
                        <SelectTrigger className="mt-2 h-12 rounded-xl">
                          <SelectValue placeholder="اختر الفئة المستهدفة" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetAudiences.map((audience) => (
                            <SelectItem key={audience.value} value={audience.value}>
                              {audience.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Design Idea */}
              {orderStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/20">
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-fuchsia-500" />
                      فكرة التصميم
                    </h3>
                    <p className="text-sm text-muted-foreground">شاركنا رؤيتك للتصميم</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        نوع التصميم المطلوب <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">اختر الأسلوب الذي يناسب علامتك</p>
                      <div className="grid grid-cols-2 gap-3">
                        {ideaTypes.map((type) => (
                          <motion.button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, ideaType: type.value }))}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl border text-right transition-all ${
                              formData.ideaType === type.value
                                ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-md"
                                : "border-border hover:border-fuchsia-500/50 hover:bg-muted/50"
                            }`}
                          >
                            <span className="font-bold block">{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ideaDescription" className="text-base font-medium">
                        وصف فكرة التصميم <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="ideaDescription"
                        value={formData.ideaDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, ideaDescription: e.target.value }))}
                        placeholder="صف لنا فكرتك بالتفصيل... ما الرسالة التي تريد إيصالها؟ ما العناصر التي تريد تضمينها؟"
                        className="mt-2 min-h-[120px] rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="preferredColors" className="text-base font-medium">
                        الألوان المفضلة
                      </Label>
                      <Input
                        id="preferredColors"
                        value={formData.preferredColors}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredColors: e.target.value }))}
                        placeholder="مثال: أزرق داكن، ذهبي، أبيض..."
                        className="mt-2 h-12 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="referenceLinks" className="text-base font-medium">
                        روابط مرجعية أو تصاميم تعجبك
                      </Label>
                      <Textarea
                        id="referenceLinks"
                        value={formData.referenceLinks}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceLinks: e.target.value }))}
                        placeholder="أضف روابط لتصاميم أو مواقع تعجبك لنفهم ذوقك أكثر..."
                        className="mt-2 min-h-[80px] rounded-xl"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {orderStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-500" />
                      مراجعة وتأكيد الطلب
                    </h3>
                    <p className="text-sm text-muted-foreground">راجع بياناتك قبل إرسال الطلب</p>
                  </div>

                  {/* Order Summary */}
                  <div className="p-5 rounded-xl bg-card border border-border space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-muted-foreground">الخدمة</span>
                      <span className="font-bold">{selectedService?.name}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">اسم المشروع</p>
                        <p className="font-medium">{formData.projectName || "-"}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">نشاط المشروع</p>
                        <p className="font-medium">
                          {projectActivities.find(a => a.value === formData.projectActivity)?.label || "-"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">نوع التصميم</p>
                        <p className="font-medium">
                          {ideaTypes.find(t => t.value === formData.ideaType)?.label || "-"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">الفئة المستهدفة</p>
                        <p className="font-medium">
                          {targetAudiences.find(t => t.value === formData.targetAudience)?.label || "-"}
                        </p>
                      </div>
                    </div>

                    {formData.ideaDescription && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">وصف الفكرة</p>
                        <p className="text-sm">{formData.ideaDescription}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <span className="font-bold">المبلغ الإجمالي</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        ${selectedService?.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">رصيدك الحالي</span>
                      <span className={`font-bold text-lg ${balance >= (selectedService?.price || 0) ? 'text-green-500' : 'text-destructive'}`}>
                        ${balance.toFixed(2)}
                      </span>
                    </div>

                    {balance < (selectedService?.price || 0) && (
                      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        <span>رصيدك غير كافي. يرجى شحن رصيدك أولاً.</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Method */}
                  <div>
                    <Label className="text-base font-medium">طريقة التواصل المفضلة</Label>
                    <RadioGroup
                      value={formData.contactMethod}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, contactMethod: value }))}
                      className="mt-3 grid grid-cols-3 gap-3"
                    >
                      {[
                        { value: "email", label: "البريد الإلكتروني" },
                        { value: "whatsapp", label: "واتساب" },
                        { value: "phone", label: "الهاتف" },
                      ].map((method) => (
                        <div key={method.value} className="relative">
                          <RadioGroupItem
                            value={method.value}
                            id={method.value}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={method.value}
                            className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                              formData.contactMethod === method.value
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-border hover:border-purple-500/50"
                            }`}
                          >
                            {method.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <Label htmlFor="additionalNotes" className="text-base font-medium">ملاحظات إضافية (اختياري)</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                      placeholder="أي شيء آخر تود إضافته..."
                      className="mt-2 min-h-[80px] rounded-xl"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <DialogFooter className="gap-2 sm:gap-0 mt-6 flex-col sm:flex-row">
              <div className="flex gap-2 w-full sm:w-auto">
                {orderStep > 1 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setOrderStep(prev => prev - 1)}
                    disabled={submitting}
                    className="flex-1 sm:flex-none rounded-xl"
                  >
                    السابق
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setOrderDialogOpen(false)} 
                  disabled={submitting}
                  className="flex-1 sm:flex-none rounded-xl"
                >
                  إلغاء
                </Button>
              </div>
              
              {orderStep < 3 ? (
                <Button
                  onClick={() => setOrderStep(prev => prev + 1)}
                  disabled={orderStep === 1 ? !canProceedToStep2 : !canProceedToStep3}
                  className="gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto"
                >
                  التالي
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
              ) : (
                <Button
                  onClick={handleOrder}
                  disabled={submitting || balance < (selectedService?.price || 0)}
                  className="gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري الطلب...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      تأكيد الطلب
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDesignServices;
