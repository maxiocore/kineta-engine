import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  Code, ChevronLeft, Clock, Shield, Star, Zap, Users, Building, 
  Building2, FileText, ListChecks, Package, HelpCircle, ImageIcon,
  ArrowLeft, CheckCircle, Globe, Smartphone, Server, Database,
  Link as LinkIcon, Cloud, ShoppingCart, Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  requirements: string[];
  deliverables: string[];
  faqs: { q: string; a: string }[];
  is_featured: boolean;
  is_fast: boolean;
  has_guarantee: boolean;
}

type ClientType = "individual" | "company" | "organization";

const clientTypes = [
  {
    id: "individual" as ClientType,
    label: "فرد",
    icon: Users,
    description: "مناسب للمشاريع الشخصية والمستقلين",
    priceMultiplier: 1,
  },
  {
    id: "company" as ClientType,
    label: "شركة",
    icon: Building,
    description: "للشركات الصغيرة والمتوسطة",
    priceMultiplier: 1.2,
  },
  {
    id: "organization" as ClientType,
    label: "مؤسسة",
    icon: Building2,
    description: "للمؤسسات الكبيرة والحكومية",
    priceMultiplier: 1.5,
  },
];

const iconMap: Record<string, any> = {
  Code, Globe, Smartphone, Server, Database, Link: LinkIcon, Cloud, ShoppingCart, Wrench
};

export default function DevServiceDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<DevService | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClientType, setSelectedClientType] = useState<ClientType>("individual");
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    if (slug) {
      fetchService();
    }
  }, [slug]);

  const fetchService = async () => {
    try {
      const { data, error } = await supabase
        .from("dev_services")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const parseJsonField = <T,>(field: unknown, fallback: T): T => {
          if (Array.isArray(field)) return field as T;
          if (typeof field === 'string') {
            try { return JSON.parse(field) as T; } catch { return fallback; }
          }
          return fallback;
        };
        
        setService({
          ...data,
          features: parseJsonField<string[]>(data.features, []),
          requirements: parseJsonField<string[]>(data.requirements, []),
          deliverables: parseJsonField<string[]>(data.deliverables, []),
          faqs: parseJsonField<{ q: string; a: string }[]>(data.faqs, []),
        } as DevService);
      }
    } catch (error) {
      console.error("Error fetching service:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clientTypes.find(c => c.id === selectedClientType)!;
  const calculatedPrice = service ? Math.round(service.base_price * selectedClient.priceMultiplier) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6" dir="rtl">
        <div className="container mx-auto max-w-5xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 rounded-2xl mb-6" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Code className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground">الخدمة غير موجودة</h2>
          <Button className="mt-4" onClick={() => navigate("/dashboard/dev-services")}>
            العودة للخدمات
          </Button>
        </div>
      </div>
    );
  }

  const IconComponent = iconMap[service.icon] || Code;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              لوحة التحكم
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link to="/dashboard/dev-services" className="hover:text-primary transition-colors">
              خدمات البرمجة
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground font-medium">{service.title_ar}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <IconComponent className="h-10 w-10 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
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
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 ml-1 text-primary" />
                    ضمان
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {service.title_ar}
              </h1>
              <p className="text-muted-foreground">{service.desc_ar}</p>

              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>مدة التنفيذ: {service.eta_days_min}-{service.eta_days_max} يوم</span>
                </div>
                <div className="text-left">
                  <span className="text-sm text-muted-foreground block">يبدأ من</span>
                  <span className="text-2xl font-bold text-primary">
                    {service.base_price.toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Client Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            اختر نوع العميل
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clientTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedClientType === type.id;
              return (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedClientType(type.id)}
                  className={`relative p-4 rounded-xl border-2 text-right transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 left-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <Icon className={`h-8 w-8 mb-3 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-bold text-foreground">{type.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                  {type.priceMultiplier > 1 && (
                    <Badge variant="secondary" className="mt-2">
                      +{((type.priceMultiplier - 1) * 100).toFixed(0)}% من السعر الأساسي
                    </Badge>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Price Summary */}
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">السعر التقديري لـ {selectedClient.label}</p>
              <p className="text-2xl font-bold text-primary">{calculatedPrice.toLocaleString()} ر.س</p>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate(`/dashboard/dev-services/order/${service.id}?clientType=${selectedClientType}`)}
            >
              اطلب الآن
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl mb-6">
              <TabsTrigger value="description" className="gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">الوصف</span>
              </TabsTrigger>
              <TabsTrigger value="requirements" className="gap-2 py-3">
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">المتطلبات</span>
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="gap-2 py-3">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">المخرجات</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2 py-3">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">الأسئلة</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-2 py-3">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">أعمالنا</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="description" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-4">وصف الخدمة</h3>
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {service.desc_ar}
                      </p>
                      <h4 className="font-bold mb-3">المميزات الرئيسية:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {service.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="requirements" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-4">المتطلبات</h3>
                      <p className="text-muted-foreground mb-6">
                        لضمان تنفيذ المشروع بأفضل شكل، نحتاج منك توفير التالي:
                      </p>
                      <div className="space-y-3">
                        {service.requirements.map((req, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-muted/30">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-primary">{i + 1}</span>
                            </div>
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="deliverables" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-4">ما ستحصل عليه</h3>
                      <p className="text-muted-foreground mb-6">
                        عند اكتمال المشروع، ستستلم:
                      </p>
                      <div className="space-y-3">
                        {service.deliverables.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                            <Package className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="faq" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-4">الأسئلة الشائعة</h3>
                      {service.faqs.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          {service.faqs.map((faq, i) => (
                            <AccordionItem key={i} value={`faq-${i}`}>
                              <AccordionTrigger className="text-right">
                                {faq.q}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground">
                                {faq.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          لا توجد أسئلة شائعة لهذه الخدمة حالياً
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-4">نماذج من أعمالنا</h3>
                      <div className="text-center py-12">
                        <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          قريباً... سيتم إضافة نماذج أعمال لهذه الخدمة
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
