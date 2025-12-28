import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  Sparkles,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Calculator,
  BookOpen,
  UserCheck,
  Eye,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import FinancingBankCard from "@/components/financing/FinancingBankCard";

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

const quickLinks = [
  {
    title: "حاسبة التمويل",
    description: "احسب أقساطك الشهرية",
    icon: Calculator,
    href: "/dashboard/financing/calculator",
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "تحقق من الأهلية",
    description: "تأكد من استيفاء الشروط",
    icon: UserCheck,
    href: "/dashboard/financing/eligibility",
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "تعليمات التمويل",
    description: "اقرأ الشروط والأحكام",
    icon: BookOpen,
    href: "/dashboard/financing/guide",
    color: "from-purple-500 to-violet-600",
  },
  {
    title: "تقديم طلب",
    description: "ابدأ طلب تمويل جديد",
    icon: Plus,
    href: "/dashboard/financing/apply",
    color: "from-orange-500 to-red-600",
  },
];

export default function ClientFinancing() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedApplication, setSelectedApplication] = useState<FinancingApplication | null>(null);

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
        .select(`*, financing_plans (name_ar, installments_count)`)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as FinancingApplication[];
    },
    enabled: !!user?.id,
  });

  // Get first active application for installments query
  const activeApp = selectedApplication || applications.find(a => a.status === "active");

  // Fetch installments for selected/active application
  const { data: installments = [] } = useQuery({
    queryKey: ["my-financing-installments", activeApp?.id],
    queryFn: async () => {
      if (!activeApp?.id) return [];
      const { data, error } = await supabase
        .from("financing_installments")
        .select("*")
        .eq("application_id", activeApp.id)
        .order("installment_number");
      if (error) throw error;
      return data as FinancingInstallment[];
    },
    enabled: !!activeApp?.id,
  });

  const activeApplications = applications.filter(a => a.status === "active");
  
  // Get the selected or first active application
  const currentApplication = selectedApplication || activeApplications[0];
  
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
          <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
            <Link to="/dashboard/financing/apply">
              <Plus className="h-4 w-4 ml-2" />
              تقديم طلب تمويل
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={link.href}>
                <Card className="h-full hover:border-primary/50 transition-all group cursor-pointer">
                  <CardContent className="p-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <link.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm">{link.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bank Card for Active Financing */}
        {activeApplications.length > 0 && currentApplication && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancingBankCard
              userName={currentApplication.full_name}
              totalBalance={currentApplication.approved_amount || currentApplication.requested_amount}
              paidAmount={totalPaid}
              remainingAmount={totalRemaining}
              nextInstallmentAmount={nextInstallment?.amount}
              nextInstallmentDate={nextInstallment ? new Date(nextInstallment.due_date) : undefined}
              planName={currentApplication.financing_plans?.name_ar}
              contractNumber={currentApplication.contract_number || undefined}
            />
            
            {/* Stats Cards */}
            <div className="space-y-4">
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
                        <p className="text-sm text-muted-foreground">القسط القادم - يوم 30</p>
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
          </div>
        )}

        {/* Show card even for pending/approved applications */}
        {activeApplications.length === 0 && applications.length > 0 && (
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Landmark className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">طلب التمويل الخاص بك</h3>
                  <p className="text-muted-foreground">
                    {applications[0].status === "pending" && "طلبك قيد المراجعة، سنقوم بإعلامك فور الموافقة"}
                    {applications[0].status === "approved" && "تمت الموافقة على طلبك! سيتم تفعيل التمويل قريباً"}
                    {applications[0].status === "rejected" && "عذراً، تم رفض الطلب. يمكنك تقديم طلب جديد"}
                  </p>
                  <Badge className={`mt-2 ${
                    applications[0].status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                    applications[0].status === "approved" ? "bg-green-500/20 text-green-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {statusConfig[applications[0].status]?.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Select Active Application if multiple */}
        {activeApplications.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center">اختر التمويل:</span>
            {activeApplications.map((app) => (
              <Button
                key={app.id}
                variant={currentApplication?.id === app.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedApplication(app)}
              >
                #{app.application_number}
              </Button>
            ))}
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
                    احصل على خدمات البرمجة والتصميم ومواقع التواصل الآن وادفع على أقساط شهرية تصل إلى 12 شهر للمبالغ الكبيرة.
                    الرصيد يُضاف لحسابك مباشرة ولا يمكن سحبه. القسط يوم 30 من كل شهر.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-white/90">
                      <Link to="/dashboard/financing/apply">
                        ابدأ الآن
                        <ArrowLeft className="h-4 w-4 mr-2" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      <Link to="/dashboard/financing/guide">
                        اقرأ التعليمات
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Plans Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">خطط التمويل المتاحة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.slice(0, 4).map((plan, index) => (
                  <motion.div key={plan.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}>
                    <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group" onClick={() => setActiveTab("plans")}>
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
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد طلبات تمويل</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بتقديم طلب تمويل للحصول على خدماتك الآن</p>
                  <Button asChild>
                    <Link to="/dashboard/financing/apply">
                      <Plus className="h-4 w-4 ml-2" />
                      تقديم طلب
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={`transition-all ${selectedApplication?.id === app.id ? "ring-2 ring-primary" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">#{app.application_number}</h4>
                              <Badge className={statusConfig[app.status]?.color || "bg-muted"}>
                                {statusConfig[app.status]?.icon}
                                <span className="mr-1">{statusConfig[app.status]?.label || app.status}</span>
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">المبلغ المطلوب:</span>
                                <p className="font-medium">{app.requested_amount} ر.س</p>
                              </div>
                              {app.approved_amount && (
                                <div>
                                  <span className="text-muted-foreground">المبلغ المعتمد:</span>
                                  <p className="font-medium text-emerald-400">{app.approved_amount} ر.س</p>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">الخطة:</span>
                                <p className="font-medium">{app.financing_plans?.name_ar}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">تاريخ التقديم:</span>
                                <p className="font-medium">{format(new Date(app.submitted_at), "dd/MM/yyyy", { locale: ar })}</p>
                              </div>
                            </div>
                            {app.rejection_reason && (
                              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                <p className="text-sm text-red-400">
                                  <strong>سبب الرفض:</strong> {app.rejection_reason}
                                </p>
                              </div>
                            )}
                          </div>
                          {app.status === "active" && (
                            <Button variant="outline" size="sm" onClick={() => setSelectedApplication(selectedApplication?.id === app.id ? null : app)}>
                              <Eye className="h-4 w-4 ml-2" />
                              {selectedApplication?.id === app.id ? "إخفاء الأقساط" : "عرض الأقساط"}
                            </Button>
                          )}
                        </div>

                        {/* Installments */}
                        {selectedApplication?.id === app.id && installments.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <h5 className="font-medium mb-3">جدول الأقساط</h5>
                            <div className="space-y-2">
                              {installments.map((inst) => (
                                <div key={inst.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                                      {inst.installment_number}
                                    </div>
                                    <div>
                                      <p className="font-medium">{inst.amount.toFixed(2)} ر.س</p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(inst.due_date), "dd MMMM yyyy", { locale: ar })}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className={installmentStatusConfig[inst.status]?.color}>
                                    {installmentStatusConfig[inst.status]?.label}
                                  </Badge>
                                </div>
                              ))}
                            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan, index) => (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name_ar}</CardTitle>
                        <Badge variant="outline">{plan.installments_count} أقساط</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{plan.description_ar || "خطة تمويل مرنة بدون فوائد"}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">المدة:</span>
                          <span className="font-medium">{plan.duration_months} شهر</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الحد الأدنى:</span>
                          <span className="font-medium">{plan.min_amount} ر.س</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الحد الأقصى:</span>
                          <span className="font-medium">{plan.max_amount ? `${plan.max_amount} ر.س` : "غير محدد"}</span>
                        </div>
                      </div>
                      <Button asChild className="w-full mt-4">
                        <Link to="/dashboard/financing/apply">
                          اختر هذه الخطة
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  );
}
