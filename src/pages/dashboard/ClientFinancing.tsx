import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Landmark, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  CreditCard,
  Calendar,
  Plus,
  ArrowLeft,
  Shield,
  FileSignature,
  Sparkles,
  TrendingUp,
  DollarSign,
  ChevronRight
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";

interface FinancingPlan {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  installments_count: number;
  duration_months: number;
  min_amount: number;
  max_amount: number | null;
  is_active: boolean;
  display_order: number;
}

interface FinancingApplication {
  id: string;
  application_number: string;
  plan_id: string;
  full_name: string;
  requested_amount: number;
  approved_amount: number | null;
  status: string;
  submitted_at: string;
  rejection_reason: string | null;
  contract_number: string | null;
  financing_plans?: {
    name_ar: string;
    installments_count: number;
  };
}

interface FinancingInstallment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  under_review: { label: "قيد المراجعة", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "موافق عليه", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "مرفوض", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
  active: { label: "نشط", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <TrendingUp className="h-3 w-3" /> },
  completed: { label: "مكتمل", color: "bg-primary/20 text-primary border-primary/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  defaulted: { label: "متعثر", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
};

const installmentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500/20 text-yellow-400" },
  paid: { label: "مدفوع", color: "bg-green-500/20 text-green-400" },
  overdue: { label: "متأخر", color: "bg-red-500/20 text-red-400" },
};

export default function ClientFinancing() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FinancingPlan | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<FinancingApplication | null>(null);
  const [step, setStep] = useState(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    national_id: "",
    phone: "",
    email: "",
    address: "",
    company_name: "",
    commercial_register: "",
    tax_number: "",
    requested_amount: "",
    service_description: "",
  });

  // Fetch plans
  const { data: plans = [] } = useQuery({
    queryKey: ["financing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financing_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as FinancingPlan[];
    },
  });

  // Fetch user's applications
  const { data: applications = [] } = useQuery({
    queryKey: ["my-financing-applications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("financing_applications")
        .select(`
          *,
          financing_plans (name_ar, installments_count)
        `)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as FinancingApplication[];
    },
    enabled: !!user?.id,
  });

  // Fetch installments for selected application
  const { data: installments = [] } = useQuery({
    queryKey: ["my-financing-installments", selectedApplication?.id],
    queryFn: async () => {
      if (!selectedApplication?.id) return [];
      const { data, error } = await supabase
        .from("financing_installments")
        .select("*")
        .eq("application_id", selectedApplication.id)
        .order("installment_number");
      if (error) throw error;
      return data as FinancingInstallment[];
    },
    enabled: !!selectedApplication?.id,
  });

  // Submit application mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedPlan) throw new Error("Missing data");
      
      const { error } = await supabase.from("financing_applications").insert([{
        user_id: user.id,
        plan_id: selectedPlan.id,
        full_name: formData.full_name,
        national_id: formData.national_id,
        phone: formData.phone,
        email: formData.email,
        address: formData.address || null,
        company_name: formData.company_name || null,
        commercial_register: formData.commercial_register || null,
        tax_number: formData.tax_number || null,
        requested_amount: parseFloat(formData.requested_amount),
        service_description: formData.service_description || null,
        application_number: `FIN-${Date.now()}`,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications"] });
      toast.success("تم تقديم طلب التمويل بنجاح! سيتم مراجعته قريباً.");
      setShowApplicationForm(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تقديم الطلب");
      console.error(error);
    },
  });

  const resetForm = () => {
    setStep(1);
    setSelectedPlan(null);
    setAcceptTerms(false);
    setFormData({
      full_name: profile?.full_name || "",
      national_id: "",
      phone: profile?.phone || "",
      email: profile?.email || "",
      address: "",
      company_name: "",
      commercial_register: "",
      tax_number: "",
      requested_amount: "",
      service_description: "",
    });
  };

  const activeApplications = applications.filter(a => a.status === "active");
  const pendingApplications = applications.filter(a => ["pending", "under_review"].includes(a.status));

  const totalPaid = installments.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const totalRemaining = installments.filter(i => i.status !== "paid").reduce((sum, i) => sum + i.amount, 0);
  const nextInstallment = installments.find(i => i.status === "pending");

  return (
    <ClientDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Landmark className="h-6 w-6 text-white" />
              </div>
              التمويل المرن
            </h1>
            <p className="text-muted-foreground mt-1">احصل على خدماتك الآن وادفع لاحقاً بدون فوائد</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setFormData(prev => ({
                ...prev,
                full_name: profile?.full_name || "",
                phone: profile?.phone || "",
                email: profile?.email || "",
              }));
              setShowApplicationForm(true);
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="h-4 w-4 ml-2" />
            تقديم طلب تمويل
          </Button>
        </div>

        {/* Quick Stats for Active Financing */}
        {activeApplications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">المبلغ المدفوع</p>
                    <p className="text-2xl font-bold text-emerald-400">{totalPaid.toFixed(2)} ر.س</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-400/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">المبلغ المتبقي</p>
                    <p className="text-2xl font-bold text-yellow-400">{totalRemaining.toFixed(2)} ر.س</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-400/50" />
                </div>
              </CardContent>
            </Card>

            {nextInstallment && (
              <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">القسط القادم</p>
                      <p className="text-xl font-bold text-blue-400">{nextInstallment.amount.toFixed(2)} ر.س</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(nextInstallment.due_date), "dd MMMM yyyy", { locale: ar })}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-400/50" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="applications">طلباتي ({applications.length})</TabsTrigger>
            <TabsTrigger value="plans">خطط التمويل</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Hero Banner */}
            <Card className="overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 border-0">
              <CardContent className="p-8 relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white/20" />
                  <div className="absolute bottom-4 right-4 w-48 h-48 rounded-full bg-white/10" />
                </div>
                <div className="relative z-10 text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-medium">بدون فوائد • بدون رسوم خفية</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">تمويل مرن لخدماتك</h2>
                  <p className="text-white/80 mb-6 max-w-lg">
                    احصل على جميع خدماتنا الآن وادفع على أقساط شهرية مريحة تصل إلى 6 أشهر بدون أي فوائد أو رسوم إضافية.
                  </p>
                  <Button
                    size="lg"
                    className="bg-white text-emerald-600 hover:bg-white/90"
                    onClick={() => {
                      resetForm();
                      setFormData(prev => ({
                        ...prev,
                        full_name: profile?.full_name || "",
                        phone: profile?.phone || "",
                        email: profile?.email || "",
                      }));
                      setShowApplicationForm(true);
                    }}
                  >
                    ابدأ الآن
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle>كيف يعمل نظام التمويل؟</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { icon: FileText, title: "قدّم طلبك", desc: "املأ نموذج التمويل البسيط" },
                    { icon: Clock, title: "مراجعة سريعة", desc: "نراجع طلبك خلال 24 ساعة" },
                    { icon: FileSignature, title: "توقيع العقد", desc: "سند تنفيذي ملزم قانونياً" },
                    { icon: CheckCircle2, title: "استلم خدماتك", desc: "ابدأ فوراً وادفع لاحقاً" },
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3">
                        <step.icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-medium mb-1">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Plans Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">خطط التمويل المتاحة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.slice(0, 4).map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => setActiveTab("plans")}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h4 className="font-semibold">{plan.name_ar}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{plan.installments_count} {plan.installments_count === 1 ? "دفعة" : "أقساط"}</p>
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">من {plan.min_amount} إلى {plan.max_amount || "غير محدد"} ر.س</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد طلبات تمويل</h3>
                  <p className="text-muted-foreground mb-4">لم تقم بتقديم أي طلب تمويل بعد</p>
                  <Button onClick={() => setShowApplicationForm(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    تقديم طلب جديد
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover:border-primary/30 transition-all">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                              <Landmark className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{app.application_number}</span>
                                <Badge className={`${statusConfig[app.status]?.color} flex items-center gap-1`}>
                                  {statusConfig[app.status]?.icon}
                                  {statusConfig[app.status]?.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {app.financing_plans?.name_ar} • {app.requested_amount.toFixed(2)} ر.س
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(app.submitted_at), "dd/MM/yyyy", { locale: ar })}
                            </span>
                            {app.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedApplication(app)}
                              >
                                عرض الأقساط
                              </Button>
                            )}
                          </div>
                        </div>
                        {app.status === "rejected" && app.rejection_reason && (
                          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                            <strong>سبب الرفض:</strong> {app.rejection_reason}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        {plan.installments_count === 1 && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">الأكثر طلباً</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mt-4">{plan.name_ar}</CardTitle>
                      <CardDescription>{plan.description_ar}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-muted-foreground">عدد الأقساط</p>
                          <p className="font-semibold text-lg">{plan.installments_count}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-muted-foreground">المدة</p>
                          <p className="font-semibold text-lg">{plan.duration_months} شهر</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400">الحد الأدنى</span>
                          <span className="font-semibold">{plan.min_amount} ر.س</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-emerald-400">الحد الأقصى</span>
                          <span className="font-semibold">{plan.max_amount || "غير محدد"} ر.س</span>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                        onClick={() => {
                          resetForm();
                          setSelectedPlan(plan);
                          setFormData(prev => ({
                            ...prev,
                            full_name: profile?.full_name || "",
                            phone: profile?.phone || "",
                            email: profile?.email || "",
                          }));
                          setShowApplicationForm(true);
                        }}
                      >
                        اختر هذه الخطة
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Application Form Dialog */}
        <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-emerald-500" />
                تقديم طلب تمويل
              </DialogTitle>
              <DialogDescription>
                {step === 1 && "اختر خطة التمويل المناسبة لك"}
                {step === 2 && "أدخل بياناتك الشخصية"}
                {step === 3 && "راجع الشروط والأحكام"}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    s === step ? "bg-emerald-500 text-white" : s < step ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
                  }`}>
                    {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
                  </div>
                  {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-emerald-500" : "bg-muted"}`} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Select Plan */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <RadioGroup
                    value={selectedPlan?.id || ""}
                    onValueChange={(value) => {
                      const plan = plans.find(p => p.id === value);
                      setSelectedPlan(plan || null);
                    }}
                  >
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPlan?.id === plan.id
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-border hover:border-emerald-500/50"
                        }`}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={plan.id} id={plan.id} />
                            <div>
                              <Label htmlFor={plan.id} className="font-semibold cursor-pointer">
                                {plan.name_ar}
                              </Label>
                              <p className="text-sm text-muted-foreground">{plan.description_ar}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">{plan.installments_count} {plan.installments_count === 1 ? "دفعة" : "أقساط"}</p>
                            <p className="text-sm text-muted-foreground">{plan.duration_months} شهر</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </motion.div>
              )}

              {/* Step 2: Personal Info */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>الاسم الكامل *</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="الاسم كما في الهوية"
                      />
                    </div>
                    <div>
                      <Label>رقم الهوية *</Label>
                      <Input
                        value={formData.national_id}
                        onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                        placeholder="رقم الهوية الوطنية"
                      />
                    </div>
                    <div>
                      <Label>رقم الجوال *</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="05xxxxxxxx"
                      />
                    </div>
                    <div>
                      <Label>البريد الإلكتروني *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>العنوان</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="المدينة - الحي"
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-3">معلومات الشركة (اختياري)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>اسم الشركة</Label>
                        <Input
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>السجل التجاري</Label>
                        <Input
                          value={formData.commercial_register}
                          onChange={(e) => setFormData({ ...formData, commercial_register: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-3">تفاصيل التمويل</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>المبلغ المطلوب (ر.س) *</Label>
                        <Input
                          type="number"
                          value={formData.requested_amount}
                          onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
                          placeholder="مثال: 5000"
                          min={selectedPlan?.min_amount}
                          max={selectedPlan?.max_amount || undefined}
                        />
                        {selectedPlan && (
                          <p className="text-xs text-muted-foreground mt-1">
                            الحد: {selectedPlan.min_amount} - {selectedPlan.max_amount || "غير محدد"} ر.س
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>وصف الخدمة المطلوبة</Label>
                        <Input
                          value={formData.service_description}
                          onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                          placeholder="اختياري"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Terms & Conditions */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Card className="bg-amber-500/10 border-amber-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-amber-400 mb-2">الشروط والأحكام</h4>
                          <div className="text-sm text-amber-200/80 space-y-2">
                            <p>1. يلتزم العميل بسداد الأقساط في مواعيدها المحددة.</p>
                            <p>2. يعتبر هذا العقد سنداً تنفيذياً وفقاً لنظام التنفيذ السعودي.</p>
                            <p>3. في حال التأخر عن السداد، يحق للشركة اتخاذ الإجراءات القانونية.</p>
                            <p>4. التمويل بدون فوائد أو رسوم إضافية.</p>
                            <p>5. يحق للشركة رفض أو قبول الطلب دون إبداء الأسباب.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">ملخص الطلب</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الخطة:</span>
                        <span>{selectedPlan?.name_ar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المبلغ:</span>
                        <span>{formData.requested_amount} ر.س</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">عدد الأقساط:</span>
                        <span>{selectedPlan?.installments_count}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>قيمة القسط:</span>
                        <span className="text-emerald-400">
                          {(parseFloat(formData.requested_amount || "0") / (selectedPlan?.installments_count || 1)).toFixed(2)} ر.س
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border">
                    <Checkbox
                      id="accept-terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    />
                    <Label htmlFor="accept-terms" className="text-sm cursor-pointer">
                      أقر بأنني قرأت وفهمت الشروط والأحكام المذكورة أعلاه، وأوافق على أن هذا العقد يعتبر سنداً تنفيذياً ملزماً قانونياً.
                    </Label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <DialogFooter className="gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  السابق
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !selectedPlan) ||
                    (step === 2 && (!formData.full_name || !formData.national_id || !formData.phone || !formData.email || !formData.requested_amount))
                  }
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  التالي
                </Button>
              ) : (
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={!acceptTerms || submitMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitMutation.isPending ? "جاري الإرسال..." : "تقديم الطلب"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Installments Dialog */}
        <Dialog open={!!selectedApplication && selectedApplication.status === "active"} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                جدول الأقساط
              </DialogTitle>
              <DialogDescription>
                {selectedApplication?.application_number} • {selectedApplication?.financing_plans?.name_ar}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {installments.map((inst) => {
                const daysUntilDue = differenceInDays(new Date(inst.due_date), new Date());
                const isNearDue = daysUntilDue <= 7 && daysUntilDue >= 0 && inst.status === "pending";
                
                return (
                  <div
                    key={inst.id}
                    className={`p-4 rounded-lg border ${
                      inst.status === "paid" ? "bg-green-500/10 border-green-500/30" :
                      inst.status === "overdue" ? "bg-red-500/10 border-red-500/30" :
                      isNearDue ? "bg-amber-500/10 border-amber-500/30" :
                      "bg-muted/30 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          inst.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"
                        }`}>
                          {inst.installment_number}
                        </div>
                        <div>
                          <p className="font-medium">{inst.amount.toFixed(2)} ر.س</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(inst.due_date), "dd MMMM yyyy", { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <Badge className={installmentStatusConfig[inst.status]?.color}>
                        {installmentStatusConfig[inst.status]?.label}
                      </Badge>
                    </div>
                    {isNearDue && (
                      <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        يستحق خلال {daysUntilDue} أيام
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
}
