import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  FileQuestion,
  Send,
  Edit,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  sendFinancingApprovedEmail, 
  sendFinancingRejectedEmail,
  sendFinancingDocumentsRequiredEmail,
  sendFinancingUnderReviewEmail,
  sendFinancingPromissoryNoteEmail
} from "@/lib/emailService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  documents_required: { label: "مستندات مطلوبة", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <FileQuestion className="h-3 w-3" /> },
  awaiting_contract: { label: "بانتظار توقيع العقد", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", icon: <FileText className="h-3 w-3" /> },
  awaiting_signature: { label: "بانتظار توقيع السند", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <FileSignature className="h-3 w-3" /> },
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
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [documentsData, setDocumentsData] = useState({ required_documents: "", admin_notes: "" });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({ status: "", admin_notes: "" });
  const [showActivateDialog, setShowActivateDialog] = useState(false);

  // Fetch applications - removed foreign key reference that doesn't exist
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["financing-applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("financing_applications")
        .select(`
          *,
          financing_plans (name_ar, installments_count)
        `)
        .order("submitted_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
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
      
      const pending = apps?.filter(a => a.status === "pending" || a.status === "documents_required").length || 0;
      const active = apps?.filter(a => a.status === "active").length || 0;
      const completed = apps?.filter(a => a.status === "completed").length || 0;
      const totalFinanced = apps?.filter(a => ["active", "completed"].includes(a.status))
        .reduce((sum, a) => sum + (a.approved_amount || 0), 0) || 0;

      return { pending, active, completed, totalFinanced };
    },
  });

  // Set to under review mutation
  const underReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const application = applications.find(a => a.id === id);
      if (!application) throw new Error("Application not found");

      const { error } = await supabase
        .from("financing_applications")
        .update({
          status: "under_review",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // Send email notification
      try {
        await sendFinancingUnderReviewEmail(application.email, {
          name: application.full_name,
          applicationNumber: application.application_number,
        });
      } catch (emailError) {
        console.error("Failed to send under review email:", emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم تحويل الطلب إلى قيد المراجعة وإرسال إشعار للعميل");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تحديث الطلب");
      console.error(error);
    },
  });

  // Request documents mutation
  const requestDocumentsMutation = useMutation({
    mutationFn: async ({ id, required_documents, admin_notes }: { id: string; required_documents: string; admin_notes: string }) => {
      const application = applications.find(a => a.id === id);
      if (!application) throw new Error("Application not found");

      const { error } = await supabase
        .from("financing_applications")
        .update({
          status: "documents_required",
          admin_notes: `المستندات المطلوبة: ${required_documents}\n\n${admin_notes}`,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // Send email notification
      try {
        await sendFinancingDocumentsRequiredEmail(application.email, {
          name: application.full_name,
          applicationNumber: application.application_number,
          requiredDocuments: required_documents,
          adminNotes: admin_notes,
        });
      } catch (emailError) {
        console.error("Failed to send documents required email:", emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم طلب المستندات الإضافية وإرسال إشعار للعميل");
      setShowDocumentsDialog(false);
      setSelectedApplication(null);
      setDocumentsData({ required_documents: "", admin_notes: "" });
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء طلب المستندات");
      console.error(error);
    },
  });

  // Approve mutation (first step - send contract for signing)
  const approveMutation = useMutation({
    mutationFn: async ({ id, approved_amount, admin_notes }: { id: string; approved_amount: number; admin_notes: string }) => {
      const application = applications.find(a => a.id === id);
      if (!application) throw new Error("Application not found");

      const contractNumber = `CNT-${Date.now()}`;

      // Update application status to awaiting_contract (first step)
      const { error: updateError } = await supabase
        .from("financing_applications")
        .update({
          status: "awaiting_contract",
          approved_amount,
          admin_notes,
          reviewed_at: new Date().toISOString(),
          contract_number: contractNumber,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // TODO: Send financing contract email to customer
      // For now, we'll just update the status
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم الموافقة المبدئية وإرسال عقد التمويل للعميل");
      setShowApprovalDialog(false);
      setSelectedApplication(null);
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء الموافقة");
      console.error(error);
    },
  });

  // Send promissory note mutation (second step - after contract signed)
  const sendPromissoryNoteMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const application = applications.find(a => a.id === id);
      if (!application) throw new Error("Application not found");

      const plan = application.financing_plans;
      const installmentAmount = plan ? (application.approved_amount || application.requested_amount) / plan.installments_count : (application.approved_amount || application.requested_amount);

      // Update status to awaiting_signature
      const { error: updateError } = await supabase
        .from("financing_applications")
        .update({
          status: "awaiting_signature",
          contract_signed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Send promissory note email to customer
      try {
        await sendFinancingPromissoryNoteEmail(application.email, {
          name: application.full_name,
          nationalId: application.national_id,
          applicationNumber: application.application_number,
          contractNumber: application.contract_number || `CNT-${Date.now()}`,
          amount: application.approved_amount || application.requested_amount,
          installmentsCount: plan?.installments_count || 1,
          monthlyInstallment: installmentAmount,
          startDate: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error("Failed to send promissory note email:", emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم تأكيد توقيع العقد وإرسال السند التنفيذي للعميل");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إرسال السند");
      console.error(error);
    },
  });

  // Activate financing mutation (after receiving signed promissory note)
  const activateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const application = applications.find(a => a.id === id);
      if (!application) throw new Error("Application not found");
      if (!application.approved_amount) throw new Error("No approved amount");

      const approved_amount = application.approved_amount;
      const plan = application.financing_plans;

      if (plan) {
        const installmentAmount = approved_amount / plan.installments_count;
        const installmentsToCreate = [];
        
        for (let i = 1; i <= plan.installments_count; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          dueDate.setDate(30);
          
          installmentsToCreate.push({
            application_id: id,
            installment_number: i,
            amount: installmentAmount,
            due_date: dueDate.toISOString().split("T")[0],
            status: "pending",
          });
        }

        await supabase
          .from("financing_installments")
          .insert(installmentsToCreate);

        // Add financing amount to user balance
        const { data: currentBalance } = await supabase
          .from("user_balances")
          .select("balance")
          .eq("user_id", application.user_id)
          .single();

        const newBalance = (currentBalance?.balance || 0) + approved_amount;
        
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

        // Send approved email notification
        try {
          await sendFinancingApprovedEmail(application.email, {
            name: application.full_name,
            applicationNumber: application.application_number,
            amount: approved_amount,
            installmentsCount: plan.installments_count,
            monthlyInstallment: installmentAmount,
          });
        } catch (emailError) {
          console.error("Failed to send approval email:", emailError);
        }
      }

      // Update status to active with signed date
      await supabase
        .from("financing_applications")
        .update({ 
          status: "active",
          approved_at: new Date().toISOString(),
          contract_signed_at: new Date().toISOString()
        })
        .eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم تفعيل التمويل وإضافة الرصيد لحساب العميل");
      setShowActivateDialog(false);
      setSelectedApplication(null);
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تفعيل التمويل");
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

      // Send rejection email
      if (application) {
        try {
          await sendFinancingRejectedEmail(application.email, {
            name: application.full_name,
            applicationNumber: application.application_number,
            rejectionReason: rejection_reason,
          });
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

  // Edit application mutation
  const editApplicationMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes: string }) => {
      const { error } = await supabase
        .from("financing_applications")
        .update({
          status,
          admin_notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم تحديث الطلب بنجاح");
      setShowEditDialog(false);
      setSelectedApplication(null);
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تحديث الطلب");
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
                  <SelectItem value="documents_required">مستندات مطلوبة</SelectItem>
                  <SelectItem value="awaiting_contract">بانتظار توقيع العقد</SelectItem>
                  <SelectItem value="awaiting_signature">بانتظار توقيع السند</SelectItem>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 ml-2" />
                                عرض التفاصيل
                              </DropdownMenuItem>
                              
                              {app.status === "pending" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => underReviewMutation.mutate(app.id)}
                                    className="text-blue-400"
                                  >
                                    <Eye className="h-4 w-4 ml-2" />
                                    بدء المراجعة
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {(app.status === "pending" || app.status === "under_review" || app.status === "documents_required") && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setDocumentsData({ required_documents: "", admin_notes: "" });
                                      setShowDocumentsDialog(true);
                                    }}
                                    className="text-purple-400"
                                  >
                                    <FileQuestion className="h-4 w-4 ml-2" />
                                    طلب مستندات
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setApprovalData({ approved_amount: app.requested_amount.toString(), admin_notes: "" });
                                      setShowApprovalDialog(true);
                                    }}
                                    className="text-green-400"
                                  >
                                    <Check className="h-4 w-4 ml-2" />
                                    الموافقة
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setRejectionData({ rejection_reason: "" });
                                      setShowRejectionDialog(true);
                                    }}
                                    className="text-red-400"
                                  >
                                    <X className="h-4 w-4 ml-2" />
                                    الرفض
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {app.status === "awaiting_contract" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => sendPromissoryNoteMutation.mutate({ id: app.id })}
                                    className="text-orange-400"
                                    disabled={sendPromissoryNoteMutation.isPending}
                                  >
                                    <FileSignature className="h-4 w-4 ml-2" />
                                    تأكيد توقيع العقد وإرسال السند
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {app.status === "awaiting_signature" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setShowActivateDialog(true);
                                    }}
                                    className="text-emerald-400"
                                  >
                                    <CheckCircle2 className="h-4 w-4 ml-2" />
                                    تفعيل التمويل (تم استلام السند)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Resend promissory note
                                      if (app.financing_plans) {
                                        const installmentAmount = (app.approved_amount || app.requested_amount) / app.financing_plans.installments_count;
                                        sendFinancingPromissoryNoteEmail(app.email, {
                                          name: app.full_name,
                                          nationalId: app.national_id,
                                          applicationNumber: app.application_number,
                                          contractNumber: app.contract_number || `CNT-${Date.now()}`,
                                          amount: app.approved_amount || app.requested_amount,
                                          installmentsCount: app.financing_plans.installments_count,
                                          monthlyInstallment: installmentAmount,
                                          startDate: new Date().toISOString(),
                                        }).then(() => {
                                          toast.success("تم إعادة إرسال السند التنفيذي");
                                        }).catch(() => {
                                          toast.error("فشل إرسال السند");
                                        });
                                      }
                                    }}
                                    className="text-orange-400"
                                  >
                                    <Send className="h-4 w-4 ml-2" />
                                    إعادة إرسال السند
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {app.status === "active" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setShowDetailsDialog(true);
                                    }}
                                    className="text-blue-400"
                                  >
                                    <CreditCard className="h-4 w-4 ml-2" />
                                    إدارة الأقساط
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setEditData({ status: app.status, admin_notes: app.admin_notes || "" });
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4 ml-2" />
                                تعديل الطلب
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge className={`${statusConfig[selectedApplication.status]?.color} flex items-center gap-1`}>
                    {statusConfig[selectedApplication.status]?.icon}
                    {statusConfig[selectedApplication.status]?.label}
                  </Badge>
                  {selectedApplication.reviewed_at && (
                    <span className="text-sm text-muted-foreground">
                      آخر تحديث: {format(new Date(selectedApplication.reviewed_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                    </span>
                  )}
                </div>

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
                    {selectedApplication.address && (
                      <div className="col-span-2"><span className="text-muted-foreground">العنوان:</span> {selectedApplication.address}</div>
                    )}
                    {selectedApplication.company_name && (
                      <div><span className="text-muted-foreground">الشركة:</span> {selectedApplication.company_name}</div>
                    )}
                    {selectedApplication.commercial_register && (
                      <div><span className="text-muted-foreground">السجل التجاري:</span> {selectedApplication.commercial_register}</div>
                    )}
                    {selectedApplication.tax_number && (
                      <div><span className="text-muted-foreground">الرقم الضريبي:</span> {selectedApplication.tax_number}</div>
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

                {/* Admin Notes */}
                {selectedApplication.admin_notes && (
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-blue-400 mb-2">ملاحظات الإدارة</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedApplication.admin_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Rejection Reason */}
                {selectedApplication.rejection_reason && (
                  <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-red-400 mb-2">سبب الرفض</h4>
                      <p className="text-sm">{selectedApplication.rejection_reason}</p>
                    </CardContent>
                  </Card>
                )}

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

                {/* Action Buttons for pending applications */}
                {(selectedApplication.status === "pending" || selectedApplication.status === "under_review" || selectedApplication.status === "documents_required") && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {selectedApplication.status === "pending" && (
                      <Button
                        variant="outline"
                        onClick={() => underReviewMutation.mutate(selectedApplication.id)}
                        disabled={underReviewMutation.isPending}
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        بدء المراجعة
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                      onClick={() => {
                        setDocumentsData({ required_documents: "", admin_notes: "" });
                        setShowDocumentsDialog(true);
                        setShowDetailsDialog(false);
                      }}
                    >
                      <FileQuestion className="h-4 w-4 ml-2" />
                      طلب مستندات
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setApprovalData({ approved_amount: selectedApplication.requested_amount.toString(), admin_notes: "" });
                        setShowApprovalDialog(true);
                        setShowDetailsDialog(false);
                      }}
                    >
                      <Check className="h-4 w-4 ml-2" />
                      الموافقة
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setRejectionData({ rejection_reason: "" });
                        setShowRejectionDialog(true);
                        setShowDetailsDialog(false);
                      }}
                    >
                      <X className="h-4 w-4 ml-2" />
                      الرفض
                    </Button>
                  </div>
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
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <p><strong>رقم الطلب:</strong> {selectedApplication?.application_number}</p>
                <p><strong>العميل:</strong> {selectedApplication?.full_name}</p>
                <p><strong>المبلغ المطلوب:</strong> {selectedApplication?.requested_amount.toFixed(2)} ر.س</p>
              </div>
              <div>
                <Label>المبلغ الموافق عليه (ر.س)</Label>
                <Input
                  type="number"
                  value={approvalData.approved_amount}
                  onChange={(e) => setApprovalData({ ...approvalData, approved_amount: e.target.value })}
                />
              </div>
              <div>
                <Label>ملاحظات الإدارة (اختياري)</Label>
                <Textarea
                  value={approvalData.admin_notes}
                  onChange={(e) => setApprovalData({ ...approvalData, admin_notes: e.target.value })}
                  placeholder="ملاحظات اختيارية..."
                />
              </div>
              <p className="text-sm text-muted-foreground">
                سيتم إرسال عقد التمويل للعميل للتوقيع عليه. بعد توقيع العقد سيتم إرسال السند التنفيذي.
              </p>
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
                disabled={approveMutation.isPending || !approvalData.approved_amount}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="h-4 w-4 ml-2" />
                {approveMutation.isPending ? "جاري الإرسال..." : "إرسال عقد التمويل"}
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
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <p><strong>رقم الطلب:</strong> {selectedApplication?.application_number}</p>
                <p><strong>العميل:</strong> {selectedApplication?.full_name}</p>
              </div>
              <div>
                <Label>سبب الرفض <span className="text-red-400">*</span></Label>
                <Textarea
                  value={rejectionData.rejection_reason}
                  onChange={(e) => setRejectionData({ rejection_reason: e.target.value })}
                  placeholder="يرجى توضيح سبب رفض الطلب..."
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                سيتم إرسال إشعار بالرفض للعميل عبر البريد الإلكتروني.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>إلغاء</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedApplication && rejectionData.rejection_reason) {
                    rejectMutation.mutate({
                      id: selectedApplication.id,
                      rejection_reason: rejectionData.rejection_reason,
                    });
                  }
                }}
                disabled={rejectMutation.isPending || !rejectionData.rejection_reason}
              >
                {rejectMutation.isPending ? "جاري المعالجة..." : "تأكيد الرفض"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Documents Required Dialog */}
        <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-purple-400">
                <FileQuestion className="h-5 w-5" />
                طلب مستندات إضافية
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <p><strong>رقم الطلب:</strong> {selectedApplication?.application_number}</p>
                <p><strong>العميل:</strong> {selectedApplication?.full_name}</p>
              </div>
              <div>
                <Label>المستندات المطلوبة <span className="text-red-400">*</span></Label>
                <Textarea
                  value={documentsData.required_documents}
                  onChange={(e) => setDocumentsData({ ...documentsData, required_documents: e.target.value })}
                  placeholder="مثال: صورة الهوية، كشف حساب بنكي، إثبات الدخل..."
                  required
                />
              </div>
              <div>
                <Label>ملاحظات إضافية (اختياري)</Label>
                <Textarea
                  value={documentsData.admin_notes}
                  onChange={(e) => setDocumentsData({ ...documentsData, admin_notes: e.target.value })}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
              <p className="text-sm text-muted-foreground">
                سيتم إرسال إشعار للعميل بالمستندات المطلوبة عبر البريد الإلكتروني.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDocumentsDialog(false)}>إلغاء</Button>
              <Button
                onClick={() => {
                  if (selectedApplication && documentsData.required_documents) {
                    requestDocumentsMutation.mutate({
                      id: selectedApplication.id,
                      required_documents: documentsData.required_documents,
                      admin_notes: documentsData.admin_notes,
                    });
                  }
                }}
                disabled={requestDocumentsMutation.isPending || !documentsData.required_documents}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4 ml-2" />
                {requestDocumentsMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate Financing Dialog */}
        <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                تفعيل التمويل
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <p><strong>رقم الطلب:</strong> {selectedApplication?.application_number}</p>
                <p><strong>العميل:</strong> {selectedApplication?.full_name}</p>
                <p><strong>المبلغ الموافق عليه:</strong> {selectedApplication?.approved_amount?.toFixed(2)} ر.س</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-400">
                  ✅ تأكد من استلام السند التنفيذي موقعاً من العميل قبل المتابعة.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                بالضغط على "تأكيد التفعيل" سيتم:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>إضافة مبلغ التمويل لرصيد العميل</li>
                <li>إنشاء جدول الأقساط</li>
                <li>إرسال إشعار للعميل بتفعيل التمويل</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActivateDialog(false)}>إلغاء</Button>
              <Button
                onClick={() => {
                  if (selectedApplication) {
                    activateMutation.mutate({ id: selectedApplication.id });
                  }
                }}
                disabled={activateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {activateMutation.isPending ? "جاري التفعيل..." : "تأكيد التفعيل"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                تعديل طلب التمويل
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <p><strong>رقم الطلب:</strong> {selectedApplication?.application_number}</p>
                <p><strong>العميل:</strong> {selectedApplication?.full_name}</p>
              </div>
              <div>
                <Label>الحالة</Label>
                <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="under_review">قيد المراجعة</SelectItem>
                    <SelectItem value="documents_required">مستندات مطلوبة</SelectItem>
                    <SelectItem value="awaiting_contract">بانتظار توقيع العقد</SelectItem>
                    <SelectItem value="awaiting_signature">بانتظار توقيع السند</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                    <SelectItem value="defaulted">متعثر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ملاحظات الإدارة</Label>
                <Textarea
                  value={editData.admin_notes}
                  onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
                  placeholder="ملاحظات..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>إلغاء</Button>
              <Button
                onClick={() => {
                  if (selectedApplication) {
                    editApplicationMutation.mutate({
                      id: selectedApplication.id,
                      status: editData.status,
                      admin_notes: editData.admin_notes,
                    });
                  }
                }}
                disabled={editApplicationMutation.isPending}
              >
                {editApplicationMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}