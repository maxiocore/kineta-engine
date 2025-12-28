import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Landmark, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  AlertCircle,
  CreditCard,
  Calendar,
  Plus,
  ArrowLeft,
  Shield,
  Sparkles,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Calculator,
  BookOpen,
  UserCheck,
  Eye,
  Receipt,
  ScrollText,
  Percent,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import EnhancedFinancingCard from "@/components/financing/EnhancedFinancingCard";
import FinancingContract from "@/components/financing/FinancingContract";
import InstallmentsTable from "@/components/financing/InstallmentsTable";

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
  national_id: string;
  phone: string;
  email: string;
  address?: string | null;
  requested_amount: number;
  approved_amount: number | null;
  status: string;
  submitted_at: string;
  approved_at?: string | null;
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
        .select(`
          id, application_number, plan_id, full_name, national_id, phone, email, address,
          requested_amount, approved_amount, status, submitted_at, approved_at,
          rejection_reason, contract_number,
          financing_plans (name_ar, installments_count)
        `)
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

  // Calculate paid installments count for active applications to check eligibility for new application
  const paidInstallmentsCount = installments.filter(i => i.status === "paid").length;
  const hasActiveApplication = activeApplications.length > 0;
  const hasPendingApplication = applications.some(a => a.status === "pending" || a.status === "under_review" || a.status === "approved");
  const canApplyForNew = !hasPendingApplication && (!hasActiveApplication || paidInstallmentsCount >= 3);

  return (
    <ClientDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Landmark className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              التمويل المرن
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">احصل على خدماتك الآن وادفع لاحقاً بدون فوائد</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {canApplyForNew ? (
            <Button asChild size="sm" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              <Link to="/dashboard/financing/apply">
                <Plus className="h-4 w-4 ml-2" />
                تقديم طلب تمويل
              </Link>
            </Button>
          ) : (
            <div className="w-full sm:w-auto">
              <Button disabled size="sm" className="w-full sm:w-auto bg-muted text-muted-foreground cursor-not-allowed">
                <AlertTriangle className="h-4 w-4 ml-2" />
                تقديم طلب جديد
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center sm:text-right">
                {hasPendingApplication 
                  ? "لديك طلب قيد المراجعة" 
                  : `يجب سداد ${3 - paidInstallmentsCount} أقساط إضافية`}
              </p>
            </div>
          )}
          </div>
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
                  <CardContent className="p-3 sm:p-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                      <link.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm line-clamp-1">{link.title}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">{link.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bank Card for Active Financing */}
        {activeApplications.length > 0 && currentApplication && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedFinancingCard
              userName={currentApplication.full_name}
              totalBalance={currentApplication.approved_amount || currentApplication.requested_amount}
              paidAmount={totalPaid}
              remainingAmount={totalRemaining}
              nextInstallmentAmount={nextInstallment?.amount}
              nextInstallmentDate={nextInstallment ? new Date(nextInstallment.due_date) : undefined}
              planName={currentApplication.financing_plans?.name_ar}
              contractNumber={currentApplication.contract_number || undefined}
              installmentsCount={currentApplication.financing_plans?.installments_count || 6}
              paidInstallments={installments.filter(i => i.status === "paid").length}
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

        {/* Show application status card for pending/approved/rejected applications */}
        {activeApplications.length === 0 && applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <div className={`h-2 ${
                applications[0].status === "pending" || applications[0].status === "under_review" 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500" 
                  : applications[0].status === "approved" 
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-red-500 to-rose-500"
              }`} />
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                    applications[0].status === "pending" || applications[0].status === "under_review"
                      ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
                      : applications[0].status === "approved"
                        ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                        : "bg-gradient-to-br from-red-500/20 to-rose-500/20"
                  }`}>
                    {applications[0].status === "pending" || applications[0].status === "under_review" ? (
                      <Clock className="h-10 w-10 text-yellow-400" />
                    ) : applications[0].status === "approved" ? (
                      <CheckCircle2 className="h-10 w-10 text-green-400" />
                    ) : (
                      <XCircle className="h-10 w-10 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">طلب التمويل #{applications[0].application_number}</h3>
                      <Badge className={`${statusConfig[applications[0].status]?.color}`}>
                        {statusConfig[applications[0].status]?.icon}
                        <span className="mr-1">{statusConfig[applications[0].status]?.label}</span>
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      {(applications[0].status === "pending" || applications[0].status === "under_review") && "طلبك قيد المراجعة من فريقنا، سنقوم بإعلامك فور اتخاذ القرار عبر البريد الإلكتروني"}
                      {applications[0].status === "approved" && "تمت الموافقة على طلبك! سيتم إضافة الرصيد لحسابك وتفعيل التمويل قريباً"}
                      {applications[0].status === "rejected" && `عذراً، تم رفض الطلب. ${applications[0].rejection_reason || "يمكنك تقديم طلب جديد"}`}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/30 rounded-xl">
                      <div>
                        <p className="text-xs text-muted-foreground">المبلغ المطلوب</p>
                        <p className="text-lg font-bold text-primary">{applications[0].requested_amount.toLocaleString()} ر.س</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">خطة التمويل</p>
                        <p className="font-semibold">{applications[0].financing_plans?.name_ar || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">عدد الأقساط</p>
                        <p className="font-semibold">{applications[0].financing_plans?.installments_count || "-"} قسط</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">تاريخ التقديم</p>
                        <p className="font-semibold">{format(new Date(applications[0].submitted_at), "dd/MM/yyyy", { locale: ar })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-muted/50 inline-flex w-max sm:w-auto gap-1 p-1 h-auto flex-row-reverse" dir="rtl">
              <TabsTrigger 
                value="plans" 
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
              >
                خطط التمويل
              </TabsTrigger>
              {activeApplications.length > 0 && (
                <>
                  <TabsTrigger 
                    value="contract" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    العقد
                  </TabsTrigger>
                  <TabsTrigger 
                    value="installments" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    جدول الأقساط
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger 
                value="applications" 
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
              >
                طلباتي ({applications.length})
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
              >
                نظرة عامة
              </TabsTrigger>
            </TabsList>
          </div>

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
                    {canApplyForNew ? (
                      <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-white/90">
                        <Link to="/dashboard/financing/apply">
                          ابدأ الآن
                          <ArrowLeft className="h-4 w-4 mr-2" />
                        </Link>
                      </Button>
                    ) : (
                      <div className="flex flex-col items-start">
                        <Button disabled size="lg" className="bg-white/50 text-emerald-600/50 cursor-not-allowed">
                          <AlertTriangle className="h-4 w-4 ml-2" />
                          غير متاح حالياً
                        </Button>
                        <p className="text-xs text-white/70 mt-1">
                          {hasPendingApplication 
                            ? "لديك طلب قيد المراجعة" 
                            : `يجب سداد ${3 - paidInstallmentsCount} أقساط إضافية`}
                        </p>
                      </div>
                    )}
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
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mx-auto mb-4 flex items-center justify-center"
                  >
                    <FileText className="h-10 w-10 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">لا توجد طلبات تمويل</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بتقديم طلب تمويل للحصول على خدماتك الآن</p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      <Link to="/dashboard/financing/apply">
                        <Plus className="h-4 w-4 ml-2" />
                        تقديم طلب جديد
                      </Link>
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Applications Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-semibold text-base sm:text-lg">جميع الطلبات ({applications.length})</h3>
                  {canApplyForNew ? (
                    <Button asChild size="sm" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600">
                      <Link to="/dashboard/financing/apply">
                        <Plus className="h-4 w-4 ml-1" />
                        طلب جديد
                      </Link>
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center sm:justify-end">
                      <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 text-xs">
                        <AlertTriangle className="h-3 w-3 ml-1" />
                        {hasPendingApplication 
                          ? "طلب قيد المراجعة" 
                          : `سدد ${3 - paidInstallmentsCount} أقساط للتقديم`}
                      </Badge>
                    </div>
                  )}
                </div>

                {applications.map((app, index) => (
                  <motion.div 
                    key={app.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      selectedApplication?.id === app.id ? "ring-2 ring-primary shadow-lg" : ""
                    } ${app.status === 'active' ? 'border-emerald-500/30' : ''}`}>
                      {/* Status Bar */}
                      <div className={`h-1.5 ${
                        app.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                        app.status === 'approved' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                        app.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                        app.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                        'bg-muted'
                      }`} />
                      
                      <CardContent className="p-4 sm:p-5">
                        {/* Header Row */}
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              app.status === 'active' ? 'bg-emerald-500/20' :
                              app.status === 'approved' ? 'bg-blue-500/20' :
                              app.status === 'pending' ? 'bg-amber-500/20' :
                              app.status === 'rejected' ? 'bg-red-500/20' :
                              'bg-muted'
                            }`}>
                              {statusConfig[app.status]?.icon || <FileText className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">#{app.application_number}</h4>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(app.submitted_at), "dd MMMM yyyy", { locale: ar })}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${statusConfig[app.status]?.color || "bg-muted"} px-3 py-1`}>
                            {statusConfig[app.status]?.label || app.status}
                          </Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">المبلغ المطلوب</p>
                            <p className="font-bold text-base">{app.requested_amount.toLocaleString("ar-SA")} <span className="text-xs text-muted-foreground">ر.س</span></p>
                          </div>
                          {app.approved_amount && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <p className="text-xs text-emerald-400 mb-1">المبلغ المعتمد</p>
                              <p className="font-bold text-base text-emerald-400">{app.approved_amount.toLocaleString("ar-SA")} <span className="text-xs">ر.س</span></p>
                            </div>
                          )}
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">خطة التمويل</p>
                            <p className="font-medium text-sm">{app.financing_plans?.name_ar || "-"}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">عدد الأقساط</p>
                            <p className="font-bold text-base">{app.financing_plans?.installments_count || "-"} <span className="text-xs text-muted-foreground">قسط</span></p>
                          </div>
                        </div>

                        {/* Rejection Reason */}
                        {app.rejection_reason && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                          >
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-red-400">سبب الرفض:</p>
                                <p className="text-sm text-red-300/80">{app.rejection_reason}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Administrative Fee Notice for Active */}
                        {app.status === 'active' && (
                          <div className="mb-4 p-2 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                              <div className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-blue-300">رسوم إدارية 5% تُضاف مع آخر قسط</span>
                              </div>
                              <span className="font-bold text-blue-400 text-sm sm:text-base mr-6 sm:mr-0">
                                {((app.approved_amount || app.requested_amount) * 0.05).toLocaleString("ar-SA")} ر.س
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        {app.status === "active" && (
                          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => setSelectedApplication(selectedApplication?.id === app.id ? null : app)}
                            >
                              <Eye className="h-4 w-4 ml-2" />
                              {selectedApplication?.id === app.id ? "إخفاء الأقساط" : "عرض جدول الأقساط"}
                              <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${selectedApplication?.id === app.id ? 'rotate-180' : ''}`} />
                            </Button>
                          </motion.div>
                        )}

                        {/* Installments Accordion */}
                        <AnimatePresence>
                          {selectedApplication?.id === app.id && installments.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 pt-4 border-t border-border overflow-hidden"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  جدول الأقساط
                                </h5>
                                <span className="text-xs text-muted-foreground">
                                  {installments.filter(i => i.status === 'paid').length} / {installments.length} مدفوع
                                </span>
                              </div>
                              <div className="space-y-2">
                                {installments.map((inst, i) => (
                                  <motion.div 
                                    key={inst.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                      inst.status === 'paid' 
                                        ? 'bg-emerald-500/10 border border-emerald-500/20' 
                                        : inst.status === 'pending' 
                                          ? 'bg-amber-500/10 border border-amber-500/20' 
                                          : 'bg-muted/50 border border-border'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                        inst.status === 'paid' 
                                          ? 'bg-emerald-500 text-white' 
                                          : inst.status === 'pending'
                                            ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500'
                                            : 'bg-muted text-muted-foreground'
                                      }`}>
                                        {inst.status === 'paid' ? <Check className="h-5 w-5" /> : inst.installment_number}
                                      </div>
                                      <div>
                                        <p className="font-bold">{inst.amount.toLocaleString("ar-SA")} ر.س</p>
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(inst.due_date), "dd MMMM yyyy", { locale: ar })}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge className={`${installmentStatusConfig[inst.status]?.color} px-2 py-0.5 text-xs`}>
                                      {installmentStatusConfig[inst.status]?.label}
                                    </Badge>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Installments Tab */}
          {activeApplications.length > 0 && currentApplication && (
            <TabsContent value="installments" className="space-y-4">
              <InstallmentsTable
                installments={installments}
                totalAmount={currentApplication.approved_amount || currentApplication.requested_amount}
              />
            </TabsContent>
          )}

          {/* Contract Tab */}
          {activeApplications.length > 0 && currentApplication && (
            <TabsContent value="contract" className="space-y-4">
              <FinancingContract
                application={{
                  ...currentApplication,
                  financing_plans: currentApplication.financing_plans ? {
                    ...currentApplication.financing_plans,
                    duration_months: currentApplication.financing_plans.installments_count
                  } : undefined
                }}
                installments={installments}
                onContractSigned={(signature) => {
                  console.log("Contract signed:", signature);
                }}
              />
            </TabsContent>
          )}

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
