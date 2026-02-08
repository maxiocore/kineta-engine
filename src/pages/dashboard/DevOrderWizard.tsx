import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Code, ChevronLeft, Users, Building, Building2, FileText, 
  Settings, Upload, CheckCircle, ArrowLeft, ArrowRight, Save,
  Loader2, AlertCircle, Mail, Globe, Smartphone, Server, Database,
  Link as LinkIcon, Cloud, ShoppingCart, Wrench, DollarSign, Clock,
  Shield, CreditCard, Key, Webhook
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DevService {
  id: string;
  slug: string;
  title_ar: string;
  desc_ar: string;
  base_price: number;
  eta_days_min: number;
  eta_days_max: number;
  icon: string;
}

type ClientType = "individual" | "company" | "organization";

interface OrderFormData {
  clientType: ClientType;
  projectTitle: string;
  projectGoal: string;
  projectSummary: string;
  budgetRange: string;
  timelineExpectation: string;
  requirements: {
    platforms: string[];
    technologies: string[];
    hasAuth: boolean;
    hasPayment: boolean;
    hasAPIs: boolean;
    databaseType: string;
    otherNotes: string;
  };
  files: File[];
  notes: string;
}

const steps = [
  { id: 1, title: "نوع العميل", icon: Users },
  { id: 2, title: "بيانات المشروع", icon: FileText },
  { id: 3, title: "المتطلبات التقنية", icon: Settings },
  { id: 4, title: "الملفات والملاحظات", icon: Upload },
  { id: 5, title: "المراجعة والتأكيد", icon: CheckCircle },
];

const clientTypes = [
  { id: "individual" as ClientType, label: "فرد", icon: Users, description: "مشاريع شخصية أو مستقلين" },
  { id: "company" as ClientType, label: "شركة", icon: Building, description: "شركات صغيرة ومتوسطة" },
  { id: "organization" as ClientType, label: "مؤسسة", icon: Building2, description: "مؤسسات كبيرة وحكومية" },
];

const budgetRanges = [
  "أقل من 1,000 ر.س",
  "1,000 - 5,000 ر.س",
  "5,000 - 15,000 ر.س",
  "15,000 - 50,000 ر.س",
  "أكثر من 50,000 ر.س",
];

const timelineOptions = [
  "أقل من أسبوع",
  "1-2 أسابيع",
  "2-4 أسابيع",
  "1-2 شهر",
  "أكثر من شهرين",
];

const platforms = [
  { id: "web", label: "موقع ويب", icon: Globe },
  { id: "ios", label: "تطبيق iOS", icon: Smartphone },
  { id: "android", label: "تطبيق Android", icon: Smartphone },
  { id: "desktop", label: "تطبيق سطح المكتب", icon: Server },
  { id: "api", label: "API فقط", icon: Webhook },
];

const technologies = [
  "React", "Next.js", "Vue.js", "Angular", "React Native", "Flutter",
  "Node.js", "Python", "PHP", "Laravel", "Django", ".NET",
  "PostgreSQL", "MySQL", "MongoDB", "Firebase", "Supabase"
];

const iconMap: Record<string, any> = {
  Code, Globe, Smartphone, Server, Database, Link: LinkIcon, Cloud, ShoppingCart, Wrench
};

export default function DevOrderWizard() {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [service, setService] = useState<DevService | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<OrderFormData>({
    clientType: (searchParams.get("clientType") as ClientType) || "individual",
    projectTitle: "",
    projectGoal: "",
    projectSummary: "",
    budgetRange: "",
    timelineExpectation: "",
    requirements: {
      platforms: [],
      technologies: [],
      hasAuth: false,
      hasPayment: false,
      hasAPIs: false,
      databaseType: "",
      otherNotes: "",
    },
    files: [],
    notes: "",
  });

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  useEffect(() => {
    // Auto-save draft every 30 seconds
    const interval = setInterval(() => {
      if (currentStep > 1 && formData.projectTitle) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, currentStep]);

  const fetchService = async () => {
    try {
      const { data, error } = await supabase
        .from("dev_services")
        .select("id, slug, title_ar, desc_ar, base_price, eta_days_min, eta_days_max, icon")
        .eq("id", serviceId)
        .maybeSingle();

      if (error) throw error;
      setService(data);
    } catch (error) {
      console.error("Error fetching service:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الخدمة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!user || !serviceId) return;

    try {
      const requirementsJson = JSON.stringify(formData.requirements);
      
      if (draftOrderId) {
        await supabase
          .from("dev_orders")
          .update({
            client_type: formData.clientType,
            project_title: formData.projectTitle,
            project_goal: formData.projectGoal,
            project_summary: formData.projectSummary,
            budget_range: formData.budgetRange,
            timeline_expectation: formData.timelineExpectation,
            requirements_json: requirementsJson,
            contact_email: user.email,
          } as any)
          .eq("id", draftOrderId);
      } else {
        const { data, error } = await supabase
          .from("dev_orders")
          .insert([{
            user_id: user.id,
            service_id: serviceId,
            client_type: formData.clientType,
            status: "draft",
            project_title: formData.projectTitle,
            project_goal: formData.projectGoal,
            project_summary: formData.projectSummary,
            budget_range: formData.budgetRange,
            timeline_expectation: formData.timelineExpectation,
            requirements_json: requirementsJson,
            contact_email: user.email,
          }] as any)
          .select("id")
          .single();

        if (error) throw error;
        if (data) setDraftOrderId(data.id);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.clientType) {
          newErrors.clientType = "يرجى اختيار نوع العميل";
        }
        break;
      case 2:
        if (!formData.projectTitle.trim()) {
          newErrors.projectTitle = "يرجى إدخال اسم المشروع";
        }
        if (!formData.projectGoal.trim()) {
          newErrors.projectGoal = "يرجى إدخال هدف المشروع";
        }
        if (!formData.budgetRange) {
          newErrors.budgetRange = "يرجى اختيار نطاق الميزانية";
        }
        break;
      case 3:
        if (formData.requirements.platforms.length === 0) {
          newErrors.platforms = "يرجى اختيار منصة واحدة على الأقل";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      saveDraft();
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user || !serviceId) return;

    setSubmitting(true);
    try {
      // Check if email is verified
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const emailVerified = authUser?.email_confirmed_at != null;

      const status = emailVerified ? "under_review" : "pending_email_verification";

      const requirementsJson = JSON.stringify(formData.requirements);
      let orderId = draftOrderId;
      let orderNo = "";

      if (draftOrderId) {
        const { data: updatedOrder, error } = await supabase
          .from("dev_orders")
          .update({
            client_type: formData.clientType,
            status,
            project_title: formData.projectTitle,
            project_goal: formData.projectGoal,
            project_summary: formData.projectSummary,
            budget_range: formData.budgetRange,
            timeline_expectation: formData.timelineExpectation,
            requirements_json: requirementsJson,
            contact_email: user.email,
          } as any)
          .eq("id", draftOrderId)
          .select("order_no")
          .single();
        if (error) throw error;
        orderNo = updatedOrder?.order_no || "";
      } else {
        const { data, error } = await supabase
          .from("dev_orders")
          .insert([{
            user_id: user.id,
            service_id: serviceId,
            client_type: formData.clientType,
            status,
            project_title: formData.projectTitle,
            project_goal: formData.projectGoal,
            project_summary: formData.projectSummary,
            budget_range: formData.budgetRange,
            timeline_expectation: formData.timelineExpectation,
            requirements_json: requirementsJson,
            contact_email: user.email,
          }] as any)
          .select("id, order_no")
          .single();
        if (error) throw error;
        orderId = data.id;
        orderNo = data.order_no;
      }

      // Create initial event
      await supabase.from("dev_order_events").insert({
        order_id: orderId,
        actor_role: "system",
        event_type: "created",
        payload: { service_id: serviceId, client_type: formData.clientType },
      });

      // Handle files
      if (formData.files.length > 0 && orderId) {
        for (const file of formData.files) {
          const filePath = `${user.id}/${orderId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("dev-order-files")
            .upload(filePath, file);

          if (!uploadError) {
            await supabase.from("dev_order_files").insert({
              order_id: orderId,
              user_id: user.id,
              file_path: filePath,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
            });

            await supabase.from("dev_order_events").insert({
              order_id: orderId,
              actor_role: "user",
              actor_id: user.id,
              event_type: "file_uploaded",
              payload: { file_name: file.name },
            });
          }
        }
      }

      // Get user profile for name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Send email to client
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: user.email,
            type: "dev_order_created",
            data: {
              name: profileData?.full_name || user.email,
              orderNumber: orderNo,
              projectTitle: formData.projectTitle,
              serviceName: service?.title_ar || "خدمة برمجية",
              clientType: formData.clientType,
              budgetRange: formData.budgetRange,
              timelineExpectation: formData.timelineExpectation,
              projectGoal: formData.projectGoal,
            },
          },
        });
      } catch (emailError) {
        console.error("Failed to send client email:", emailError);
      }

      // Send email to admin
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: "info@ashholding.com",
            type: "dev_order_created_admin",
            data: {
              orderNumber: orderNo,
              clientName: profileData?.full_name || "غير محدد",
              clientEmail: user.email,
              clientType: formData.clientType,
              projectTitle: formData.projectTitle,
              serviceName: service?.title_ar || "خدمة برمجية",
              budgetRange: formData.budgetRange,
              timelineExpectation: formData.timelineExpectation,
              projectGoal: formData.projectGoal,
              projectSummary: formData.projectSummary,
            },
          },
        });
      } catch (emailError) {
        console.error("Failed to send admin email:", emailError);
      }

      if (!emailVerified) {
        // Send verification email event
        await supabase.from("dev_order_events").insert({
          order_id: orderId,
          actor_role: "system",
          event_type: "email_sent",
          payload: { email: user.email },
        });

        navigate(`/dashboard/verify-email?orderId=${orderId}`);
      } else {
        toast({
          title: "تم استلام طلبك بنجاح",
          description: "طلبك الآن قيد المراجعة من فريقنا",
        });
        navigate(`/dashboard/my-dev-orders/${orderId}`);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الطلب. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<OrderFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateRequirements = (updates: Partial<OrderFormData["requirements"]>) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, ...updates },
    }));
  };

  const togglePlatform = (platformId: string) => {
    const current = formData.requirements.platforms;
    const updated = current.includes(platformId)
      ? current.filter(p => p !== platformId)
      : [...current, platformId];
    updateRequirements({ platforms: updated });
  };

  const toggleTechnology = (tech: string) => {
    const current = formData.requirements.technologies;
    const updated = current.includes(tech)
      ? current.filter(t => t !== tech)
      : [...current, tech];
    updateRequirements({ technologies: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6" dir="rtl">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">الخدمة غير موجودة</h2>
          <Button className="mt-4" onClick={() => navigate("/dashboard/dev-services")}>
            العودة للخدمات
          </Button>
        </div>
      </div>
    );
  }

  const IconComponent = iconMap[service.icon] || Code;
  const progress = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              لوحة التحكم
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link to="/dashboard/dev-services" className="hover:text-primary transition-colors">
              خدمات البرمجة
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground font-medium">طلب جديد</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Service Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <IconComponent className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{service.title_ar}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {service.eta_days_min}-{service.eta_days_max} يوم
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  يبدأ من {service.base_price.toLocaleString()} ر.س
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden md:block w-16 lg:w-24 h-1 mx-2 rounded ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs md:text-sm">
            {steps.map((step) => (
              <span
                key={step.id}
                className={currentStep === step.id ? "text-primary font-medium" : "text-muted-foreground"}
              >
                {step.title}
              </span>
            ))}
          </div>
          <Progress value={progress} className="mt-4 h-2" />
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card rounded-2xl border border-border/50 p-6 md:p-8"
          >
            {/* Step 1: Client Type */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-2">اختر نوع العميل</h2>
                <p className="text-muted-foreground mb-6">
                  حدد نوع العميل لنتمكن من تقديم أفضل خدمة تناسب احتياجاتك
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {clientTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.clientType === type.id;
                    return (
                      <motion.button
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateFormData({ clientType: type.id })}
                        className={`relative p-6 rounded-xl border-2 text-right transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border/50 hover:border-primary/30"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-4 left-4">
                            <CheckCircle className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <Icon className={`h-10 w-10 mb-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <h3 className="font-bold text-lg text-foreground">{type.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      </motion.button>
                    );
                  })}
                </div>
                {errors.clientType && (
                  <p className="text-destructive text-sm mt-2">{errors.clientType}</p>
                )}
              </div>
            )}

            {/* Step 2: Project Info */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-bold mb-2">بيانات المشروع</h2>
                <p className="text-muted-foreground mb-6">
                  أخبرنا المزيد عن مشروعك
                </p>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="projectTitle">اسم المشروع *</Label>
                    <Input
                      id="projectTitle"
                      value={formData.projectTitle}
                      onChange={(e) => updateFormData({ projectTitle: e.target.value })}
                      placeholder="مثال: متجر إلكتروني للملابس"
                      className="mt-1"
                    />
                    {errors.projectTitle && (
                      <p className="text-destructive text-sm mt-1">{errors.projectTitle}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="projectGoal">هدف المشروع *</Label>
                    <Input
                      id="projectGoal"
                      value={formData.projectGoal}
                      onChange={(e) => updateFormData({ projectGoal: e.target.value })}
                      placeholder="ما الذي تريد تحقيقه من خلال هذا المشروع؟"
                      className="mt-1"
                    />
                    {errors.projectGoal && (
                      <p className="text-destructive text-sm mt-1">{errors.projectGoal}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="projectSummary">وصف مختصر للمشروع</Label>
                    <Textarea
                      id="projectSummary"
                      value={formData.projectSummary}
                      onChange={(e) => updateFormData({ projectSummary: e.target.value })}
                      placeholder="اشرح فكرة المشروع بشكل مختصر..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>نطاق الميزانية *</Label>
                      <Select
                        value={formData.budgetRange}
                        onValueChange={(value) => updateFormData({ budgetRange: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="اختر نطاق الميزانية" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetRanges.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.budgetRange && (
                        <p className="text-destructive text-sm mt-1">{errors.budgetRange}</p>
                      )}
                    </div>

                    <div>
                      <Label>المدة المتوقعة للتنفيذ</Label>
                      <Select
                        value={formData.timelineExpectation}
                        onValueChange={(value) => updateFormData({ timelineExpectation: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="اختر المدة المتوقعة" />
                        </SelectTrigger>
                        <SelectContent>
                          {timelineOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Technical Requirements */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-bold mb-2">المتطلبات التقنية</h2>
                <p className="text-muted-foreground mb-6">
                  حدد المتطلبات التقنية لمشروعك
                </p>
                
                <div className="space-y-8">
                  {/* Platforms */}
                  <div>
                    <Label className="text-base font-semibold">المنصات المطلوبة *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      {platforms.map((platform) => {
                        const Icon = platform.icon;
                        const isSelected = formData.requirements.platforms.includes(platform.id);
                        return (
                          <button
                            key={platform.id}
                            type="button"
                            onClick={() => togglePlatform(platform.id)}
                            className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border/50 hover:border-primary/30"
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={isSelected ? "font-medium" : ""}>{platform.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.platforms && (
                      <p className="text-destructive text-sm mt-1">{errors.platforms}</p>
                    )}
                  </div>

                  {/* Technologies */}
                  <div>
                    <Label className="text-base font-semibold">التقنيات المفضلة (اختياري)</Label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {technologies.map((tech) => {
                        const isSelected = formData.requirements.technologies.includes(tech);
                        return (
                          <Badge
                            key={tech}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer py-2 px-3"
                            onClick={() => toggleTechnology(tech)}
                          >
                            {tech}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50">
                      <Checkbox
                        id="hasAuth"
                        checked={formData.requirements.hasAuth}
                        onCheckedChange={(checked) => updateRequirements({ hasAuth: !!checked })}
                      />
                      <Label htmlFor="hasAuth" className="flex items-center gap-2 cursor-pointer">
                        <Key className="h-4 w-4 text-primary" />
                        نظام تسجيل دخول
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50">
                      <Checkbox
                        id="hasPayment"
                        checked={formData.requirements.hasPayment}
                        onCheckedChange={(checked) => updateRequirements({ hasPayment: !!checked })}
                      />
                      <Label htmlFor="hasPayment" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4 text-primary" />
                        بوابات دفع
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50">
                      <Checkbox
                        id="hasAPIs"
                        checked={formData.requirements.hasAPIs}
                        onCheckedChange={(checked) => updateRequirements({ hasAPIs: !!checked })}
                      />
                      <Label htmlFor="hasAPIs" className="flex items-center gap-2 cursor-pointer">
                        <Webhook className="h-4 w-4 text-primary" />
                        تكامل APIs خارجية
                      </Label>
                    </div>
                  </div>

                  {/* Database */}
                  <div>
                    <Label>نوع قاعدة البيانات</Label>
                    <Select
                      value={formData.requirements.databaseType}
                      onValueChange={(value) => updateRequirements({ databaseType: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر نوع قاعدة البيانات (اختياري)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="mongodb">MongoDB</SelectItem>
                        <SelectItem value="firebase">Firebase</SelectItem>
                        <SelectItem value="supabase">Supabase</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Files & Notes */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-bold mb-2">الملفات والملاحظات</h2>
                <p className="text-muted-foreground mb-6">
                  أضف أي ملفات أو ملاحظات إضافية
                </p>
                
                <div className="space-y-6">
                  {/* File Upload */}
                  <div>
                    <Label className="text-base font-semibold">رفع الملفات (اختياري)</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      يمكنك رفع ملفات التصميم، المواصفات، أو أي مستندات ذات صلة
                    </p>
                    <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          updateFormData({ files: [...formData.files, ...files] });
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-foreground font-medium">اضغط لرفع الملفات</p>
                        <p className="text-sm text-muted-foreground mt-1">أو اسحب الملفات وأفلتها هنا</p>
                      </label>
                    </div>
                    
                    {formData.files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {formData.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = formData.files.filter((_, i) => i !== index);
                                updateFormData({ files: updated });
                              }}
                            >
                              حذف
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">ملاحظات إضافية</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => updateFormData({ notes: e.target.value })}
                      placeholder="أي معلومات إضافية تريد إضافتها..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="otherNotes">متطلبات تقنية إضافية</Label>
                    <Textarea
                      id="otherNotes"
                      value={formData.requirements.otherNotes}
                      onChange={(e) => updateRequirements({ otherNotes: e.target.value })}
                      placeholder="أي متطلبات تقنية خاصة لم تُذكر..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div>
                <h2 className="text-xl font-bold mb-2">مراجعة وتأكيد الطلب</h2>
                <p className="text-muted-foreground mb-6">
                  راجع بيانات طلبك قبل الإرسال
                </p>
                
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        نوع العميل
                      </h4>
                      <p>{clientTypes.find(c => c.id === formData.clientType)?.label}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        الميزانية
                      </h4>
                      <p>{formData.budgetRange || "غير محدد"}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      المشروع
                    </h4>
                    <p className="font-medium">{formData.projectTitle}</p>
                    <p className="text-sm text-muted-foreground mt-1">{formData.projectGoal}</p>
                    {formData.projectSummary && (
                      <p className="text-sm text-muted-foreground mt-2">{formData.projectSummary}</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      المتطلبات التقنية
                    </h4>
                    <div className="space-y-2">
                      <p><strong>المنصات:</strong> {formData.requirements.platforms.map(p => platforms.find(pl => pl.id === p)?.label).join(", ")}</p>
                      {formData.requirements.technologies.length > 0 && (
                        <p><strong>التقنيات:</strong> {formData.requirements.technologies.join(", ")}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.requirements.hasAuth && <Badge variant="outline">تسجيل دخول</Badge>}
                        {formData.requirements.hasPayment && <Badge variant="outline">بوابات دفع</Badge>}
                        {formData.requirements.hasAPIs && <Badge variant="outline">APIs خارجية</Badge>}
                        {formData.requirements.databaseType && <Badge variant="outline">{formData.requirements.databaseType}</Badge>}
                      </div>
                    </div>
                  </div>

                  {formData.files.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Upload className="h-4 w-4 text-primary" />
                        الملفات المرفقة
                      </h4>
                      <p>{formData.files.length} ملف مرفق</p>
                    </div>
                  )}

                  {/* Terms */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">بالضغط على "إرسال الطلب"، أنت توافق على:</p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                          <li>شروط الخدمة وسياسة الخصوصية</li>
                          <li>سيتم مراجعة طلبك من قبل فريقنا</li>
                          <li>سيتم التواصل معك عبر البريد الإلكتروني</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                السابق
              </Button>

              <div className="flex items-center gap-2">
                {currentStep < 5 && (
                  <Button
                    variant="ghost"
                    onClick={saveDraft}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    حفظ كمسودة
                  </Button>
                )}
                
                {currentStep < 5 ? (
                  <Button onClick={nextStep} className="gap-2">
                    التالي
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-2 min-w-[140px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        إرسال الطلب
                        <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
