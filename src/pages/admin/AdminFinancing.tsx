import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Landmark, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Users,
  DollarSign,
  Calendar,
  Search,
  Eye,
  Check,
  X,
  TrendingUp,
  CreditCard,
  FileSignature,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { sendFinancingApprovedEmail, sendFinancingRejectedEmail } from "@/lib/emailService";

interface FinancingApplication {
  id: string;
  application_number: string;
  user_id: string;
  plan_id: string;
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  address: string | null;
  company_name: string | null;
  commercial_register: string | null;
  tax_number: string | null;
  requested_amount: number;
  approved_amount: number | null;
  service_id: string | null;
  service_description: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  contract_number: string | null;
  financing_plans?: {
    name_ar: string;
    installments_count: number;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface FinancingInstallment {
  id: string;
  application_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  late_fee: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  under_review: { label: "قيد المراجعة", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Eye className="h-3 w-3" /> },
  approved: { label: "موافق عليه", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "مرفوض", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
  active: { label: "نشط", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <TrendingUp className="h-3 w-3" /> },
  completed: { label: "مكتمل", color: "bg-primary/20 text-primary border-primary/30", icon: <Check className="h-3 w-3" /> },
  defaulted: { label: "متعثر", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: "ملغي", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: <X className="h-3 w-3" /> },
};

const installmentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500/20 text-yellow-400" },
  paid: { label: "مدفوع", color: "bg-green-500/20 text-green-400" },
  overdue: { label: "متأخر", color: "bg-red-500/20 text-red-400" },
  cancelled: { label: "ملغي", color: "bg-gray-500/20 text-gray-400" },
};

export default function AdminFinancing() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<FinancingApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalData, setApprovalData] = useState({ approved_amount: "", admin_notes: "" });
  const [rejectionData, setRejectionData] = useState({ rejection_reason: "" });
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["financing-applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("financing_applications")
        .select(`
          *,
          financing_plans (name_ar, installments_count),
          profiles!financing_applications_user_id_fkey (full_name, email)
        `)
        .order("submitted_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as FinancingApplication[];
    },
  });

  // Fetch installments for selected application
  const { data: installments = [] } = useQuery({
    queryKey: ["financing-installments", selectedApplication?.id],
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

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["financing-stats"],
    queryFn: async () => {
      const { data: apps } = await supabase.from("financing_applications").select("status, requested_amount, approved_amount");
      
      const pending = apps?.filter(a => a.status === "pending").length || 0;
      const active = apps?.filter(a => a.status === "active").length || 0;
      const completed = apps?.filter(a => a.status === "completed").length || 0;
      const totalFinanced = apps?.filter(a => ["active", "completed"].includes(a.status))
        .reduce((sum, a) => sum + (a.approved_amount || 0), 0) || 0;

      return { pending, active, completed, totalFinanced };
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, approved_amount, admin_notes }: { id: string; approved_amount: number; admin_notes: string }) => {
      const application = applications.find(a => a.id === id);
      if (!application) throw new Error("Application not found");

      // Update application status
      const { error: updateError } = await supabase
        .from("financing_applications")
        .update({
          status: "approved",
          approved_amount,
          admin_notes,
          reviewed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          contract_number: `CNT-${Date.now()}`,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Create installments and add balance to user
      const plan = application.financing_plans;
      if (plan) {
        const installmentAmount = approved_amount / plan.installments_count;
        const installments = [];
        
        for (let i = 1; i <= plan.installments_count; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          
          installments.push({
            application_id: id,
            installment_number: i,
            amount: installmentAmount,
            due_date: dueDate.toISOString().split("T")[0],
            status: "pending",
          });
        }

        const { error: installmentError } = await supabase
          .from("financing_installments")
          .insert(installments);

        // Add financing amount to user balance
        // First get current balance
        const { data: currentBalance } = await supabase
          .from("user_balances")
          .select("balance")
          .eq("user_id", application.user_id)
          .single();

        const newBalance = (currentBalance?.balance || 0) + approved_amount;
        
        // Update or insert balance
        await supabase
          .from("user_balances")
          .upsert({ 
            user_id: application.user_id,
            balance: newBalance,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" });

        // Log balance change
        await supabase
          .from("balance_logs")
          .insert({
            user_id: application.user_id,
            action_type: "financing",
            amount: approved_amount,
            balance_before: currentBalance?.balance || 0,
            balance_after: newBalance,
            reference_type: "financing",
            reference_id: id,
            notes: `رصيد تمويل - طلب رقم ${application.application_number}`
          });

        // Send email notification using unified email service
        try {
          await sendFinancingApprovedEmail(application.email, {
            name: application.full_name,
            applicationNumber: application.application_number,
            amount: approved_amount,
            installmentsCount: plan.installments_count,
            monthlyInstallment: installmentAmount,
          });
          console.log("Financing approval email sent successfully");
        } catch (emailError) {
          console.error("Failed to send approval email:", emailError);
        }
      }

      // Update status to active
      await supabase
        .from("financing_applications")
        .update({ status: "active" })
        .eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تمت الموافقة على طلب التمويل وإرسال إشعار للعميل");
      setShowApprovalDialog(false);
      setSelectedApplication(null);
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء الموافقة على الطلب");
      console.error(error);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, rejection_reason }: { id: string; rejection_reason: string }) => {
      const application = applications.find(a => a.id === id);
      
      const { error } = await supabase
        .from("financing_applications")
        .update({
          status: "rejected",
          rejection_reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // Send rejection email using unified email service
      if (application) {
        try {
          await sendFinancingRejectedEmail(application.email, {
            name: application.full_name,
            applicationNumber: application.application_number,
            rejectionReason: rejection_reason,
          });
          console.log("Financing rejection email sent successfully");
        } catch (emailError) {
          console.error("Failed to send rejection email:", emailError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم رفض طلب التمويل وإرسال إشعار للعميل");
      setShowRejectionDialog(false);
      setSelectedApplication(null);
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء رفض الطلب");
      console.error(error);
    },
  });

  // Mark installment as paid
  const markPaidMutation = useMutation({
    mutationFn: async (installmentId: string) => {
      const { error } = await supabase
        .from("financing_installments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", installmentId);

      if (error) throw error;

      // Check if all installments are paid
      const { data: remainingInstallments } = await supabase
        .from("financing_installments")
        .select("id")
        .eq("application_id", selectedApplication?.id)
        .neq("status", "paid");

      if (remainingInstallments?.length === 0) {
        await supabase
          .from("financing_applications")
          .update({ status: "completed" })
          .eq("id", selectedApplication?.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-installments"] });
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم تسجيل الدفعة بنجاح");
    },
  });

  const filteredApplications = applications.filter(app => 
    app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Landmark className="h-6 w-6 text-white" />
              </div>
              نظام التمويل
            </h1>
            <p className="text-muted-foreground mt-1">إدارة طلبات التمويل والأقساط</p>
          </div>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["financing-applications"] })}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">طلبات معلقة</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تمويلات نشطة</p>
                    <p className="text-2xl font-bold text-emerald-400">{stats?.active || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-400/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تمويلات مكتملة</p>
                    <p className="text-2xl font-bold text-blue-400">{stats?.completed || 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-blue-400/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي التمويل</p>
                    <p className="text-2xl font-bold text-primary">{(stats?.totalFinanced || 0).toFixed(2)} ر.س</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو رقم الطلب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="under_review">قيد المراجعة</SelectItem>
                  <SelectItem value="approved">موافق عليه</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                  <SelectItem value="defaulted">متعثر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              طلبات التمويل ({filteredApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد طلبات تمويل</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">رقم الطلب</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">العميل</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">المبلغ</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">الخطة</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">التاريخ</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <motion.tr
                        key={app.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-sm">{app.application_number}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{app.full_name}</div>
                            <div className="text-sm text-muted-foreground">{app.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{app.requested_amount.toFixed(2)} ر.س</td>
                        <td className="py-3 px-4">{app.financing_plans?.name_ar || "-"}</td>
                        <td className="py-3 px-4">
                          <Badge className={`${statusConfig[app.status]?.color} flex items-center gap-1 w-fit`}>
                            {statusConfig[app.status]?.icon}
                            {statusConfig[app.status]?.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {format(new Date(app.submitted_at), "dd/MM/yyyy", { locale: ar })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              title="عرض التفاصيل"
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(app.status === "pending" || app.status === "under_review") && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  title="موافقة"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setApprovalData({ approved_amount: app.requested_amount.toString(), admin_notes: "" });
                                    setShowApprovalDialog(true);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title="رفض"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setRejectionData({ rejection_reason: "" });
                                    setShowRejectionDialog(true);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {app.status === "active" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                title="إدارة الأقساط"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                تفاصيل طلب التمويل - {selectedApplication?.application_number}
              </DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6">
                {/* Applicant Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      معلومات مقدم الطلب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">الاسم:</span> {selectedApplication.full_name}</div>
                    <div><span className="text-muted-foreground">الهوية:</span> {selectedApplication.national_id}</div>
                    <div><span className="text-muted-foreground">الهاتف:</span> {selectedApplication.phone}</div>
                    <div><span className="text-muted-foreground">البريد:</span> {selectedApplication.email}</div>
                    {selectedApplication.company_name && (
                      <div><span className="text-muted-foreground">الشركة:</span> {selectedApplication.company_name}</div>
                    )}
                    {selectedApplication.commercial_register && (
                      <div><span className="text-muted-foreground">السجل التجاري:</span> {selectedApplication.commercial_register}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Finance Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      تفاصيل التمويل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">المبلغ المطلوب:</span> {selectedApplication.requested_amount.toFixed(2)} ر.س</div>
                    <div><span className="text-muted-foreground">المبلغ الموافق عليه:</span> {selectedApplication.approved_amount?.toFixed(2) || "-"} ر.س</div>
                    <div><span className="text-muted-foreground">الخطة:</span> {selectedApplication.financing_plans?.name_ar || "-"}</div>
                    <div><span className="text-muted-foreground">عدد الأقساط:</span> {selectedApplication.financing_plans?.installments_count || "-"}</div>
                    {selectedApplication.service_description && (
                      <div className="col-span-2"><span className="text-muted-foreground">الخدمة:</span> {selectedApplication.service_description}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Installments */}
                {installments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        جدول الأقساط
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {installments.map((inst) => (
                          <div
                            key={inst.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {inst.installment_number}
                              </div>
                              <div>
                                <div className="font-medium">{inst.amount.toFixed(2)} ر.س</div>
                                <div className="text-sm text-muted-foreground">
                                  تاريخ الاستحقاق: {format(new Date(inst.due_date), "dd/MM/yyyy", { locale: ar })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={installmentStatusConfig[inst.status]?.color}>
                                {installmentStatusConfig[inst.status]?.label}
                              </Badge>
                              {inst.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markPaidMutation.mutate(inst.id)}
                                  disabled={markPaidMutation.isPending}
                                >
                                  تسجيل دفع
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Contract Notice */}
                {selectedApplication.status === "active" && (
                  <Card className="bg-amber-500/10 border-amber-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <FileSignature className="h-5 w-5 text-amber-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-400">ملاحظة قانونية</h4>
                          <p className="text-sm text-amber-200/80 mt-1">
                            بموجب هذا العقد يلتزم العميل بسداد المبلغ المتفق عليه وفقاً لجدول الأقساط المحدد. 
                            يعتبر هذا العقد سنداً تنفيذياً وفقاً لنظام التنفيذ السعودي.
                          </p>
                          {selectedApplication.contract_number && (
                            <p className="text-sm mt-2">رقم العقد: <span className="font-mono">{selectedApplication.contract_number}</span></p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                الموافقة على طلب التمويل
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>المبلغ الموافق عليه (ر.س)</Label>
                <Input
                  type="number"
                  value={approvalData.approved_amount}
                  onChange={(e) => setApprovalData({ ...approvalData, approved_amount: e.target.value })}
                />
              </div>
              <div>
                <Label>ملاحظات الإدارة</Label>
                <Textarea
                  value={approvalData.admin_notes}
                  onChange={(e) => setApprovalData({ ...approvalData, admin_notes: e.target.value })}
                  placeholder="ملاحظات اختيارية..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>إلغاء</Button>
              <Button
                onClick={() => {
                  if (selectedApplication) {
                    approveMutation.mutate({
                      id: selectedApplication.id,
                      approved_amount: parseFloat(approvalData.approved_amount),
                      admin_notes: approvalData.admin_notes,
                    });
                  }
                }}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveMutation.isPending ? "جاري المعالجة..." : "تأكيد الموافقة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <XCircle className="h-5 w-5" />
                رفض طلب التمويل
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>سبب الرفض</Label>
                <Textarea
                  value={rejectionData.rejection_reason}
                  onChange={(e) => setRejectionData({ rejection_reason: e.target.value })}
                  placeholder="يرجى توضيح سبب رفض الطلب..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>إلغاء</Button>
              <Button
                onClick={() => {
                  if (selectedApplication && rejectionData.rejection_reason) {
                    rejectMutation.mutate({
                      id: selectedApplication.id,
                      rejection_reason: rejectionData.rejection_reason,
                    });
                  }
                }}
                disabled={rejectMutation.isPending || !rejectionData.rejection_reason}
                variant="destructive"
              >
                {rejectMutation.isPending ? "جاري المعالجة..." : "تأكيد الرفض"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}
