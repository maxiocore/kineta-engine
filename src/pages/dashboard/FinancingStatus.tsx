import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  ArrowRight,
  Landmark,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Wallet,
  FileSignature,
  Receipt,
  User,
  Phone,
  Mail,
  Hash,
  Building2,
  Loader2,
} from "lucide-react";
import { FinancingStatusTimeline } from "@/components/financing/status/FinancingStatusTimeline";
import InstallmentsTable from "@/components/financing/InstallmentsTable";

interface FinancingInstallment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bgGradient: string }> = {
  pending: { 
    label: "قيد الانتظار", 
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", 
    icon: <Clock className="h-4 w-4" />,
    bgGradient: "from-yellow-500/10 to-orange-500/10"
  },
  under_review: { 
    label: "قيد المراجعة", 
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30", 
    icon: <Clock className="h-4 w-4" />,
    bgGradient: "from-blue-500/10 to-indigo-500/10"
  },
  documents_required: { 
    label: "مستندات مطلوبة", 
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30", 
    icon: <FileText className="h-4 w-4" />,
    bgGradient: "from-orange-500/10 to-amber-500/10"
  },
  awaiting_contract: { 
    label: "بانتظار توقيع العقد", 
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30", 
    icon: <FileSignature className="h-4 w-4" />,
    bgGradient: "from-purple-500/10 to-violet-500/10"
  },
  awaiting_signature: { 
    label: "بانتظار توقيع الكمبيالة", 
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", 
    icon: <FileSignature className="h-4 w-4" />,
    bgGradient: "from-indigo-500/10 to-blue-500/10"
  },
  approved: { 
    label: "موافق عليه", 
    color: "bg-green-500/20 text-green-400 border-green-500/30", 
    icon: <CheckCircle2 className="h-4 w-4" />,
    bgGradient: "from-green-500/10 to-emerald-500/10"
  },
  active: { 
    label: "نشط", 
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", 
    icon: <TrendingUp className="h-4 w-4" />,
    bgGradient: "from-emerald-500/10 to-teal-500/10"
  },
  completed: { 
    label: "مكتمل", 
    color: "bg-primary/20 text-primary border-primary/30", 
    icon: <CheckCircle2 className="h-4 w-4" />,
    bgGradient: "from-primary/10 to-primary/5"
  },
  rejected: { 
    label: "مرفوض", 
    color: "bg-red-500/20 text-red-400 border-red-500/30", 
    icon: <AlertTriangle className="h-4 w-4" />,
    bgGradient: "from-red-500/10 to-rose-500/10"
  },
  defaulted: { 
    label: "متعثر", 
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30", 
    icon: <AlertTriangle className="h-4 w-4" />,
    bgGradient: "from-orange-500/10 to-red-500/10"
  },
};

export default function FinancingStatus() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for hash to determine initial tab
  const initialTab = location.hash === "#installments" ? "installments" : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Fetch application
  const { data: application, isLoading: isLoadingApp } = useQuery({
    queryKey: ["financing-application-status", applicationId],
    queryFn: async () => {
      if (!applicationId || !user?.id) return null;
      const { data, error } = await supabase
        .from("financing_applications")
        .select(`
          *,
          financing_plans (
            name_ar,
            installments_count,
            duration_months
          )
        `)
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!applicationId && !!user?.id,
  });

  // Fetch installments
  const { data: installments = [] } = useQuery({
    queryKey: ["financing-installments-status", applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      const { data, error } = await supabase
        .from("financing_installments")
        .select("*")
        .eq("application_id", applicationId)
        .order("installment_number", { ascending: true });
      
      if (error) throw error;
      return data as FinancingInstallment[];
    },
    enabled: !!applicationId,
  });

  // Fetch service credit if active
  const { data: serviceCredit } = useQuery({
    queryKey: ["service-credit-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("service_credits")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id && application?.status === "active",
  });

  // Update tab when hash changes
  useEffect(() => {
    if (location.hash === "#installments") {
      setActiveTab("installments");
    }
  }, [location.hash]);

  if (isLoadingApp) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!application) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center" dir="rtl">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">لم يتم العثور على طلب التمويل</h2>
          <p className="text-muted-foreground mb-4">
            الطلب غير موجود أو ليس لديك صلاحية للوصول إليه
          </p>
          <Button onClick={() => navigate("/dashboard/financing")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للتمويل
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  const config = statusConfig[application.status] || statusConfig.pending;
  const totalAmount = application.approved_amount || application.requested_amount;
  const paidInstallments = installments.filter((i) => i.status === "paid");
  const pendingInstallments = installments.filter((i) => i.status === "pending");
  const overdueInstallments = installments.filter((i) => i.status === "overdue");
  const totalPaid = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
  const totalRemaining = installments.filter((i) => i.status !== "paid").reduce((sum, i) => sum + i.amount, 0);
  const nextInstallment = installments.find((i) => i.status === "pending");
  const progressPercent = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <ClientDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/financing")}
              className="shrink-0"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap">
                <Landmark className="h-6 w-6 text-primary shrink-0" />
                تفاصيل التمويل
              </h1>
              <p className="text-sm text-muted-foreground">
                طلب رقم: <span className="font-mono">{application.application_number}</span>
              </p>
            </div>
          </div>
          <Badge className={`${config.color} flex items-center gap-1.5 px-3 py-1.5 self-start`}>
            {config.icon}
            <span>{config.label}</span>
          </Badge>
        </div>

        {/* Timeline */}
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <FinancingStatusTimeline 
              currentStatus={application.status.toUpperCase() as any} 
            />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2 flex-row-reverse">
              <FileText className="h-4 w-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="installments" className="flex items-center gap-2 flex-row-reverse">
              <Calendar className="h-4 w-4" />
              سجل الأقساط
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Service Credit Card - Show only for active financing */}
            {(application.status === "active" || serviceCredit) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-400" />
                      رصيد الخدمات المتاح
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-3xl sm:text-4xl font-bold text-emerald-400">
                          {(serviceCredit?.available_balance || application.approved_amount || 0).toLocaleString()} ر.س
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          رصيد غير نقدي - يُستخدم لشراء الخدمات فقط
                        </p>
                      </div>
                      <Button 
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                        onClick={() => navigate("/dashboard/services")}
                      >
                        <CreditCard className="h-4 w-4 ml-2" />
                        استخدام الرصيد
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Stats - Only for active/completed */}
            {(application.status === "active" || application.status === "completed") && installments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Progress Bar */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">نسبة السداد</span>
                      <span className="font-bold">{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden" dir="ltr">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 rounded-full"
                        style={{ marginInlineStart: "auto" }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="p-4 text-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">المدفوع</p>
                      <p className="text-lg font-bold text-emerald-400">{totalPaid.toLocaleString()} ر.س</p>
                      <p className="text-xs text-muted-foreground">{paidInstallments.length} قسط</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">المتبقي</p>
                      <p className="text-lg font-bold text-amber-400">{totalRemaining.toLocaleString()} ر.س</p>
                      <p className="text-xs text-muted-foreground">{pendingInstallments.length} قسط</p>
                    </CardContent>
                  </Card>

                  {overdueInstallments.length > 0 && (
                    <Card className="bg-red-500/10 border-red-500/20">
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">متأخرة</p>
                        <p className="text-lg font-bold text-red-400">
                          {overdueInstallments.reduce((sum, i) => sum + i.amount, 0).toLocaleString()} ر.س
                        </p>
                        <p className="text-xs text-muted-foreground">{overdueInstallments.length} قسط</p>
                      </CardContent>
                    </Card>
                  )}

                  {nextInstallment && (
                    <Card className="bg-blue-500/10 border-blue-500/20">
                      <CardContent className="p-4 text-center">
                        <Calendar className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">القسط القادم</p>
                        <p className="text-lg font-bold text-blue-400">{nextInstallment.amount.toLocaleString()} ر.س</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(nextInstallment.due_date), "dd MMM yyyy", { locale: ar })}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {/* Application Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    تفاصيل الطلب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        بيانات العميل
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{application.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span dir="ltr">{application.national_id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span dir="ltr">{application.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{application.email}</span>
                        </div>
                        {application.company_name && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{application.company_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financing Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        تفاصيل التمويل
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">المبلغ المطلوب:</span>
                          <span className="font-bold">{application.requested_amount.toLocaleString()} ر.س</span>
                        </div>
                        {application.approved_amount && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">المبلغ الموافق عليه:</span>
                            <span className="font-bold text-emerald-400">{application.approved_amount.toLocaleString()} ر.س</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">خطة التمويل:</span>
                          <span>{application.financing_plans?.name_ar || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">عدد الأقساط:</span>
                          <span>{application.financing_plans?.installments_count || "-"} قسط</span>
                        </div>
                        {application.contract_number && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">رقم العقد:</span>
                            <span className="font-mono text-xs">{application.contract_number}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">تاريخ التقديم:</span>
                          <span>{format(new Date(application.submitted_at), "dd/MM/yyyy", { locale: ar })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Methods - for active financing */}
            {(application.status === "active" || application.status === "awaiting_signature") && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      طرق سداد الأقساط
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">الرصيد الحالي</p>
                            <p className="text-xs text-muted-foreground">خصم تلقائي من رصيدك</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Landmark className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">تحويل بنكي</p>
                            <p className="text-xs text-muted-foreground">تحويل مباشر للحساب</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">بطاقة ائتمانية</p>
                            <p className="text-xs text-muted-foreground">فيزا / ماستركارد / مدى</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm text-blue-400">
                        💡 يتم خصم الأقساط تلقائياً من رصيدك عند توفره، أو يمكنك السداد عبر التحويل البنكي ورفع إيصال السداد.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Installments Tab */}
          <TabsContent value="installments">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    سجل الأقساط
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {installments.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        لا توجد أقساط حتى الآن
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        سيتم إنشاء جدول الأقساط بعد تفعيل التمويل
                      </p>
                    </div>
                  ) : (
                    <InstallmentsTable 
                      installments={installments}
                      totalAmount={totalAmount}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  );
}
