import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  Check,
  FileCheck,
  Briefcase,
  Lightbulb,
  Shield,
  Palette,
  Wallet,
  CreditCard,
  Sparkles,
  Clock,
  MessageSquare,
  Users,
  Target,
  Star,
  Zap,
  Award,
  ChevronLeft,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  features: any;
  refill_enabled: boolean | null;
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

const DesignServiceOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const { user } = useAuth();
  
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

  // Fetch service details
  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();
      
      if (error) throw error;
      return data as Service;
    },
    enabled: !!serviceId,
  });

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

  const getFeatures = (service: Service): string[] => {
    if (Array.isArray(service.features)) return service.features;
    return [];
  };

  const handleOrder = async () => {
    if (!user || !service) return;
    
    if (balance < service.price) {
      toast.error("رصيدك غير كافي", {
        description: "يرجى شحن رصيدك أولاً"
      });
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      
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
          service_id: service.id,
          total_price: service.price,
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
          balance: balance - service.price,
          total_spent: balance + service.price
        })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      toast.success("تم إرسال الطلب بنجاح! 🎉", {
        description: "سيتم التواصل معك قريباً لمناقشة التفاصيل"
      });
      
      navigate('/dashboard/orders');
    } catch (error) {
      toast.error("حدث خطأ", {
        description: "يرجى المحاولة مرة أخرى"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedToStep2 = formData.projectName && formData.projectActivity;
  const canProceedToStep3 = formData.ideaType && formData.ideaDescription;
  const insufficientBalance = balance < (service?.price || 0);

  if (!serviceId) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center" dir="rtl">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
            <ShoppingCart className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">لم يتم تحديد خدمة</h2>
          <p className="text-muted-foreground mb-6">يرجى اختيار خدمة من صفحة خدمات التصميم</p>
          <Button onClick={() => navigate('/dashboard/design-services')} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            العودة لخدمات التصميم
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (serviceLoading) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!service) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center" dir="rtl">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
            <ShoppingCart className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">الخدمة غير موجودة</h2>
          <p className="text-muted-foreground mb-6">الخدمة المطلوبة غير متوفرة حالياً</p>
          <Button onClick={() => navigate('/dashboard/design-services')} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            العودة لخدمات التصميم
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 p-6 sm:p-8"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-900/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link to="/dashboard/design-services">
                  <motion.div 
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white rotate-180" />
                  </motion.div>
                </Link>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">طلب خدمة التصميم</h1>
                  <p className="text-white/80 text-sm mt-1">"{service.name}" - {service.price.toFixed(2)} ر.س</p>
                </div>
              </div>

              {/* Balance Card */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-sm ${
                  insufficientBalance 
                    ? "bg-red-500/20 border border-red-500/30" 
                    : "bg-white/20"
                }`}
              >
                <Wallet className={`w-5 h-5 ${insufficientBalance ? "text-red-300" : "text-white/80"}`} />
                <div>
                  <p className={`text-xs ${insufficientBalance ? "text-red-300" : "text-white/60"}`}>رصيدك الحالي</p>
                  <p className={`font-bold text-lg ${insufficientBalance ? "text-red-300" : "text-white"}`}>
                    {balance.toFixed(2)} ر.س
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 p-6"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {[
              { num: 1, label: "معلومات المشروع" },
              { num: 2, label: "فكرة التصميم" },
              { num: 3, label: "تأكيد الطلب" },
            ].map((step, index) => (
              <div key={step.num} className="flex items-center gap-2 sm:gap-4">
                <motion.div
                  animate={{
                    scale: orderStep === step.num ? 1.1 : 1,
                  }}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${
                      orderStep > step.num
                        ? "bg-green-500 text-white"
                        : orderStep === step.num
                        ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {orderStep > step.num ? <Check className="w-6 h-6" /> : step.num}
                  </div>
                  <span className={`text-xs mt-2 hidden sm:block ${
                    orderStep >= step.num ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </span>
                </motion.div>
                {index < 2 && (
                  <div className={`w-8 sm:w-16 lg:w-24 h-1 rounded-full transition-colors ${
                    orderStep > step.num ? "bg-green-500" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Project Info */}
          {orderStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">معلومات المشروع الأساسية</h2>
                      <p className="text-sm text-muted-foreground">ساعدنا نفهم مشروعك أكثر</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <Label htmlFor="projectName" className="text-base font-medium">
                      اسم المشروع / العلامة التجارية <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="projectName"
                      value={formData.projectName}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                      placeholder="مثال: مطعم الأصالة، متجر نور، ..."
                      className="mt-2 h-12 rounded-xl text-base"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      نشاط المشروع <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">اختر المجال الأقرب لمشروعك</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {projectActivities.map((activity) => (
                        <motion.button
                          key={activity.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, projectActivity: activity.value }))}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl border text-right transition-all ${
                            formData.projectActivity === activity.value
                              ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                              : "border-border hover:border-purple-500/50 hover:bg-muted/50"
                          }`}
                        >
                          <span className="text-2xl mb-2 block">{activity.icon}</span>
                          <span className="text-sm font-medium block">{activity.label}</span>
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
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Design Idea */}
          {orderStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">فكرة التصميم</h2>
                      <p className="text-sm text-muted-foreground">شاركنا رؤيتك للتصميم</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <Label className="text-base font-medium">
                      نوع التصميم المطلوب <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">اختر الأسلوب الذي يناسب علامتك</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ideaTypes.map((type) => (
                        <motion.button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, ideaType: type.value }))}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl border text-right transition-all ${
                            formData.ideaType === type.value
                              ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20"
                              : "border-border hover:border-fuchsia-500/50 hover:bg-muted/50"
                          }`}
                        >
                          <span className="font-bold block mb-1">{type.label}</span>
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
                      className="mt-2 min-h-[140px] rounded-xl text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        روابط مرجعية
                      </Label>
                      <Input
                        id="referenceLinks"
                        value={formData.referenceLinks}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceLinks: e.target.value }))}
                        placeholder="روابط تصاميم أو مواقع تعجبك"
                        className="mt-2 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {orderStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">مراجعة وتأكيد الطلب</h2>
                      <p className="text-sm text-muted-foreground">راجع بياناتك قبل إرسال الطلب</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Service Summary */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Palette className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الخدمة المختارة</p>
                          <p className="font-bold text-lg">{service.name}</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {service.price.toFixed(2)} ر.س
                      </p>
                    </div>
                  </div>
                  
                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">اسم المشروع</p>
                      <p className="font-semibold">{formData.projectName || "-"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">نشاط المشروع</p>
                      <p className="font-semibold">
                        {projectActivities.find(a => a.value === formData.projectActivity)?.label || "-"}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">نوع التصميم</p>
                      <p className="font-semibold">
                        {ideaTypes.find(t => t.value === formData.ideaType)?.label || "-"}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">الفئة المستهدفة</p>
                      <p className="font-semibold">
                        {targetAudiences.find(t => t.value === formData.targetAudience)?.label || "-"}
                      </p>
                    </div>
                  </div>

                  {formData.ideaDescription && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">وصف الفكرة</p>
                      <p className="text-sm leading-relaxed">{formData.ideaDescription}</p>
                    </div>
                  )}

                  {/* Balance Section */}
                  <div className={`p-5 rounded-xl border ${
                    insufficientBalance 
                      ? "bg-destructive/5 border-destructive/30" 
                      : "bg-green-500/5 border-green-500/30"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-lg">المبلغ الإجمالي</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        ${service.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-3">
                        <Wallet className={`w-5 h-5 ${insufficientBalance ? "text-destructive" : "text-green-500"}`} />
                        <span className="text-muted-foreground">رصيدك الحالي</span>
                      </div>
                      <span className={`font-bold text-xl ${insufficientBalance ? 'text-destructive' : 'text-green-500'}`}>
                        ${balance.toFixed(2)}
                      </span>
                    </div>

                    {insufficientBalance && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
                              <Wallet className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                              <p className="font-semibold text-destructive">رصيدك غير كافي</p>
                              <p className="text-sm text-destructive/80">
                                تحتاج ${(service.price - balance).toFixed(2)} إضافية
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => navigate('/dashboard/deposit')}
                            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg w-full sm:w-auto"
                          >
                            <CreditCard className="w-4 h-4" />
                            اشحن رصيدك الآن
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Contact Method */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">طريقة التواصل المفضلة</Label>
                    <RadioGroup
                      value={formData.contactMethod}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, contactMethod: value }))}
                      className="grid grid-cols-3 gap-3"
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
                            className={`flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all text-center ${
                              formData.contactMethod === method.value
                                ? "border-purple-500 bg-purple-500/10 shadow-md"
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
                      className="mt-2 min-h-[100px] rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Service Features */}
              {getFeatures(service).length > 0 && (
                <Card className="border-0 shadow-lg rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-500" />
                      <h3 className="font-bold">ما ستحصل عليه</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getFeatures(service).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 justify-between bg-card rounded-2xl border border-border/50 p-4 sm:p-6"
        >
          <div className="flex gap-3">
            {orderStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setOrderStep(prev => prev - 1)}
                disabled={submitting}
                className="gap-2 rounded-xl"
              >
                <ArrowRight className="w-4 h-4" />
                السابق
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard/design-services')} 
              disabled={submitting}
              className="rounded-xl"
            >
              إلغاء
            </Button>
          </div>
          
          {orderStep < 3 ? (
            <Button
              onClick={() => setOrderStep(prev => prev + 1)}
              disabled={orderStep === 1 ? !canProceedToStep2 : !canProceedToStep3}
              className="gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
            >
              التالي
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleOrder}
              disabled={submitting || insufficientBalance}
              className="gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg px-8"
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
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
};

export default DesignServiceOrder;
