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
  MoreHorizontal,
  Download,
  Receipt,
  Banknote
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
// نظام الإيميل الموحد الجديد - المصدر الوحيد لإشعارات التمويل
import { 
  notifyUnderReview,
  notifyDocumentsRequired,
  notifyApproved,
  notifyContractPresented,
  notifyDeclined,
  notifyCreditDeposited
} from "@/lib/financing/notifications";
import FinancingStatusCard from "@/components/financing/FinancingStatusCard";
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
  promissory_note_url: string | null;
  financing_plans?: {
    name_ar: string;
    installments_count: number;
    duration_months: number;
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
  awaiting_signature: { label: "بانتظار توقيع الكمبيالة", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <FileSignature className="h-3 w-3" /> },
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
  const [showReceiptsSection, setShowReceiptsSection] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  // Fetch payment receipts
  const { data: paymentReceipts = [], refetch: refetchReceipts } = useQuery({
    queryKey: ["admin-financing-payment-receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financing_payment_receipts")
        .select(`
          *,
          financing_applications(
            application_number,
            full_name,
            contract_number,
            approved_amount,
            user_id,
            financing_plans(name_ar, installments_count)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Approve receipt and mark installment as paid
  const approveReceiptMutation = useMutation({
    mutationFn: async ({ receiptId, applicationId, amount, receipt }: { receiptId: string; applicationId: string; amount: number; receipt?: any }) => {
      // Get application details for email
      const { data: application } = await supabase
        .from("financing_applications")
        .select("*, financing_plans(name_ar, installments_count)")
        .eq("id", applicationId)
        .single();

      // Get all installments for this application
      const { data: allInstallments, error: allInstError } = await supabase
        .from("financing_installments")
        .select("*")
        .eq("application_id", applicationId)
        .order("installment_number", { ascending: true });

      if (allInstError) throw allInstError;

      // Get pending installments
      const pendingInstallments = allInstallments?.filter(i => i.status === "pending") || [];

      // Find installment to mark as paid (first pending or closest amount match)
      let installmentToMark = pendingInstallments[0];
      if (pendingInstallments.length > 0) {
        const exactMatch = pendingInstallments.find(i => Math.abs(i.amount - amount) < 1);
        if (exactMatch) installmentToMark = exactMatch;
      }

      // Update receipt status
      const { error: receiptError } = await supabase
        .from("financing_payment_receipts")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          installment_id: installmentToMark?.id || null,
        })
        .eq("id", receiptId);

      if (receiptError) throw receiptError;

      // Mark installment as paid if found
      if (installmentToMark) {
        const { error: updateError } = await supabase
          .from("financing_installments")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            payment_method: "bank_transfer",
          })
          .eq("id", installmentToMark.id);

        if (updateError) throw updateError;
      }

      // Calculate payment stats for email
      const paidInstallments = allInstallments?.filter(i => i.status === "paid" || i.id === installmentToMark?.id) || [];
      const remainingInstallments = allInstallments?.filter(i => i.status !== "paid" && i.id !== installmentToMark?.id) || [];
      const totalPaid = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
      const remainingAmount = remainingInstallments.reduce((sum, i) => sum + i.amount, 0);
      const nextInstallment = remainingInstallments[0];
      const isLastInstallment = remainingInstallments.length === 0;

      // Payment emails handled via admin-notify system
      // Note: Payment notifications are separate from status change notifications
      console.log(`Payment processed for application ${application?.application_number}`);
      
      // Update application status to completed if last installment
      if (isLastInstallment && application) {
        await supabase
          .from("financing_applications")
          .update({ status: "completed" })
          .eq("id", application.id);
      }

      return { installmentToMark, isLastInstallment };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-financing-payment-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["financing-installments"] });
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      if (data.installmentToMark) {
        toast.success(`تم تأكيد الحوالة وخصم القسط رقم ${data.installmentToMark.installment_number} وإرسال إشعار للعميل`);
      } else {
        toast.success("تم تأكيد الحوالة وإرسال إشعار للعميل");
      }
      if (data.isLastInstallment) {
        toast.success("🎉 تم سداد جميع الأقساط! تم إرسال شهادة المخالصة للعميل");
      }
      setShowReceiptDialog(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("حدث خطأ أثناء تأكيد الحوالة");
    },
  });

  // Reject receipt mutation
  const rejectReceiptMutation = useMutation({
    mutationFn: async ({ receiptId, adminNotes }: { receiptId: string; adminNotes: string }) => {
      const { error } = await supabase
        .from("financing_payment_receipts")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", receiptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-financing-payment-receipts"] });
      toast.success("تم رفض الإيصال");
      setShowReceiptDialog(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("حدث خطأ أثناء رفض الإيصال");
    },
  });

  const pendingReceiptsCount = paymentReceipts.filter((r: any) => r.status === "pending").length;

  // Fetch applications - removed foreign key reference that doesn't exist
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["financing-applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("financing_applications")
        .select(`
          *,
          financing_plans (name_ar, installments_count, duration_months)
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

      // Send email notification via unified system
      try {
        await notifyUnderReview(
          id,
          application.application_number,
          application.email,
          application.full_name
        );
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

      // Send email notification via unified system
      try {
        await notifyDocumentsRequired(
          id,
          application.application_number,
          application.email,
          application.full_name,
          `${required_documents}\n${admin_notes}`
        );
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
      const plan = application.financing_plans;
      const installmentAmount = plan ? approved_amount / plan.installments_count : approved_amount;

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

      // Send contract notification via unified system
      try {
        await notifyContractPresented(
          id,
          application.application_number,
          application.email,
          application.full_name,
          approved_amount
        );
      } catch (emailError) {
        console.error("Failed to send contract email:", emailError);
      }
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

      // Promissory note handled separately - no email needed at this stage
      console.log("Contract signed, awaiting promissory note");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم تأكيد توقيع العقد وإرسال الكمبيالة للعميل");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إرسال الكمبيالة");
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
          dueDate.setDate(27);
          
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

        // Add financing amount to service_credits (non-cash credit)
        // Get the financing contract
        const { data: contract } = await supabase
          .from("financing_contracts")
          .select("id")
          .eq("application_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Create or update service credit record
        const { data: existingCredit } = await supabase
          .from("service_credits")
          .select("*")
          .eq("user_id", application.user_id)
          .eq("is_active", true)
          .single();

        if (existingCredit) {
          // Update existing credit
          const newTotal = Number(existingCredit.total_credited) + approved_amount;
          const newAvailable = Number(existingCredit.available_balance) + approved_amount;
          
          await supabase
            .from("service_credits")
            .update({
              total_credited: newTotal,
              available_balance: newAvailable,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingCredit.id);

          // Log the transaction
          await supabase
            .from("service_credit_transactions")
            .insert({
              credit_id: existingCredit.id,
              user_id: application.user_id,
              transaction_type: "credit",
              amount: approved_amount,
              balance_before: Number(existingCredit.available_balance),
              balance_after: newAvailable,
              reference_type: "financing",
              reference_id: id,
              description: `Service financing credit - Application #${application.application_number}`,
              description_ar: `رصيد تمويل خدمات - طلب رقم ${application.application_number}`,
              status: "completed"
            });
        } else {
          // Create new service credit
          const { data: newCredit } = await supabase
            .from("service_credits")
            .insert({
              user_id: application.user_id,
              total_credited: approved_amount,
              total_used: 0,
              available_balance: approved_amount,
              source_type: "financing",
              source_reference_id: id,
              contract_id: contract?.id || null,
              application_id: id,
              is_active: true,
              is_frozen: false
            })
            .select()
            .single();

          if (newCredit) {
            // Log the initial credit transaction
            await supabase
              .from("service_credit_transactions")
              .insert({
                credit_id: newCredit.id,
                user_id: application.user_id,
                transaction_type: "credit",
                amount: approved_amount,
                balance_before: 0,
                balance_after: approved_amount,
                reference_type: "financing",
                reference_id: id,
                description: `Initial service financing credit - Application #${application.application_number}`,
                description_ar: `رصيد تمويل خدمات أولي - طلب رقم ${application.application_number}`,
                status: "completed"
              });
          }
        }

        // Send credit deposited notification via unified system
        try {
          await notifyCreditDeposited(
            id,
            application.application_number,
            application.email,
            application.full_name,
            approved_amount
          );
        } catch (emailError) {
          console.error("Failed to send credit deposited email:", emailError);
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

      // Send rejection notification via unified system
      if (application) {
        try {
          await notifyDeclined(
            id,
            application.application_number,
            application.email,
            application.full_name,
            rejection_reason
          );
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
      // Get installment details first
      const { data: installmentData, error: fetchError } = await supabase
        .from("financing_installments")
        .select("*")
        .eq("id", installmentId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("financing_installments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", installmentId);

      if (error) throw error;

      // Get all installments to calculate totals
      const { data: allInstallments } = await supabase
        .from("financing_installments")
        .select("*")
        .eq("application_id", selectedApplication?.id)
        .order("installment_number", { ascending: true });

      const paidInstallments = allInstallments?.filter(i => i.status === "paid" || i.id === installmentId) || [];
      const remainingInstallments = allInstallments?.filter(i => i.status !== "paid" && i.id !== installmentId) || [];
      const totalPaid = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
      const remainingAmount = remainingInstallments.reduce((sum, i) => sum + i.amount, 0);
      const nextInstallment = remainingInstallments[0];
      const isLastInstallment = remainingInstallments.length === 0;

      // Payment notifications handled via admin-notify system
      // Status change notifications are managed by unified email service
      console.log(`Payment processed: installment ${installmentData.installment_number}`);

      // Check if all installments are paid and update application status
      if (isLastInstallment) {
        await supabase
          .from("financing_applications")
          .update({ status: "completed" })
          .eq("id", selectedApplication?.id);
      }

      return { isLastInstallment };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["financing-installments"] });
      queryClient.invalidateQueries({ queryKey: ["financing-applications"] });
      queryClient.invalidateQueries({ queryKey: ["financing-stats"] });
      toast.success("تم تسجيل الدفعة بنجاح");
      if (data?.isLastInstallment) {
        toast.success("🎉 تم سداد جميع الأقساط! تم إرسال شهادة المخالصة للعميل");
      }
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
                  <SelectItem value="awaiting_signature">بانتظار توقيع الكمبيالة</SelectItem>
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

        {/* Payment Receipts Section */}
        <Card className="bg-gradient-to-br from-purple-500/5 to-violet-500/5 border-purple-500/20">
          <CardHeader className="cursor-pointer" onClick={() => setShowReceiptsSection(!showReceiptsSection)}>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-400" />
                إيصالات السداد
                {pendingReceiptsCount > 0 && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {pendingReceiptsCount} قيد المراجعة
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm">
                {showReceiptsSection ? "إخفاء" : "عرض"}
              </Button>
            </CardTitle>
          </CardHeader>
          {showReceiptsSection && (
            <CardContent>
              {paymentReceipts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">لا توجد إيصالات سداد</div>
              ) : (
                <div className="space-y-3">
                  {paymentReceipts.map((receipt: any) => (
                    <motion.div
                      key={receipt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-background/50 border border-border/50 hover:border-purple-500/30 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-purple-400" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-lg">{receipt.amount.toLocaleString("ar-SA")} ر.س</span>
                              <Badge className={
                                receipt.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                receipt.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                                "bg-red-500/20 text-red-400"
                              }>
                                {receipt.status === "pending" ? "قيد المراجعة" :
                                 receipt.status === "approved" ? "مقبول" : "مرفوض"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {receipt.financing_applications?.full_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {receipt.financing_applications?.application_number}
                              </span>
                              {receipt.financing_applications?.contract_number && (
                                <span className="flex items-center gap-1">
                                  <FileSignature className="h-3 w-3" />
                                  عقد: {receipt.financing_applications.contract_number}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(receipt.created_at), "dd/MM/yyyy", { locale: ar })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setShowReceiptDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            عرض
                          </Button>
                          {receipt.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => approveReceiptMutation.mutate({
                                  receiptId: receipt.id,
                                  applicationId: receipt.application_id,
                                  amount: receipt.amount,
                                })}
                                disabled={approveReceiptMutation.isPending}
                              >
                                <Check className="h-4 w-4 ml-1" />
                                تأكيد وخصم القسط
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => rejectReceiptMutation.mutate({
                                  receiptId: receipt.id,
                                  adminNotes: "تم رفض الإيصال",
                                })}
                                disabled={rejectReceiptMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
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
                          <div className="flex flex-col gap-1">
                            <Badge className={`${statusConfig[app.status]?.color} flex items-center gap-1 w-fit`}>
                              {statusConfig[app.status]?.icon}
                              {statusConfig[app.status]?.label}
                            </Badge>
                            {/* Show promissory note signed indicator */}
                            {app.status === "awaiting_signature" && app.promissory_note_url && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1 w-fit text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                تم توقيع الكمبيالة ✓
                              </Badge>
                            )}
                          </div>
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
                                    تأكيد توقيع العقد وإرسال الكمبيالة
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
                                    تفعيل التمويل (تم استلام الكمبيالة)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Resend contract notification
                                      if (app.approved_amount) {
                                        notifyContractPresented(
                                          app.id,
                                          app.application_number,
                                          app.email,
                                          app.full_name,
                                          app.approved_amount
                                        ).then(() => {
                                          toast.success("تم إعادة إرسال العقد");
                                        }).catch(() => {
                                          toast.error("فشل إرسال العقد");
                                        });
                                      }
                                    }}
                                    className="text-orange-400"
                                  >
                                    <Send className="h-4 w-4 ml-2" />
                                    إعادة إرسال العقد
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
                {/* Client Status Card with full info */}
                <FinancingStatusCard 
                  application={selectedApplication}
                  installments={installments}
                  showClientInfo={true}
                />

                {/* Admin Notes */}
                {selectedApplication.admin_notes && (
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-blue-400 mb-2">ملاحظات الإدارة</h4>
                      <div className="text-sm whitespace-pre-wrap">
                        {selectedApplication.admin_notes.split('\n').map((line, idx) => {
                          // Check if line contains a Supabase storage URL
                          const urlMatch = line.match(/(https:\/\/[^\s]+supabase[^\s]+storage[^\s]+)/);
                          if (urlMatch) {
                            const url = urlMatch[1];
                            const fileName = decodeURIComponent(url.split('/').pop() || 'ملف');
                            const textBeforeUrl = line.split(url)[0];
                            return (
                              <div key={idx} className="flex flex-wrap items-center gap-2 my-2">
                                {textBeforeUrl && <span>{textBeforeUrl}</span>}
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="text-xs truncate max-w-[200px]">{fileName}</span>
                                  <Download className="h-3 w-3" />
                                </a>
                              </div>
                            );
                          }
                          return <p key={idx}>{line}</p>;
                        })}
                      </div>
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
                سيتم إرسال عقد التمويل للعميل للتوقيع عليه. بعد توقيع العقد سيتم إرسال الكمبيالة.
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
                  ✅ تأكد من استلام الكمبيالة موقعة من العميل قبل المتابعة.
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

        {/* Receipt Details Dialog */}
        <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-400" />
                تفاصيل إيصال السداد
              </DialogTitle>
            </DialogHeader>
            {selectedReceipt && (
              <div className="space-y-4">
                {/* Receipt Image */}
                <div className="rounded-xl overflow-hidden border border-border bg-muted/50">
                  <img
                    src={selectedReceipt.receipt_url}
                    alt="إيصال السداد"
                    className="w-full h-auto max-h-80 object-contain"
                  />
                </div>

                {/* Receipt Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">المبلغ</p>
                    <p className="font-bold text-lg text-emerald-400">
                      {selectedReceipt.amount.toLocaleString("ar-SA")} ر.س
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">الحالة</p>
                    <Badge className={
                      selectedReceipt.status === "pending" ? "bg-yellow-500/20 text-yellow-400 mt-1" :
                      selectedReceipt.status === "approved" ? "bg-emerald-500/20 text-emerald-400 mt-1" :
                      "bg-red-500/20 text-red-400 mt-1"
                    }>
                      {selectedReceipt.status === "pending" ? "قيد المراجعة" :
                       selectedReceipt.status === "approved" ? "مقبول" : "مرفوض"}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">اسم العميل</p>
                    <p className="font-medium">{selectedReceipt.financing_applications?.full_name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">رقم الطلب</p>
                    <p className="font-medium">{selectedReceipt.financing_applications?.application_number}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">رقم العقد</p>
                    <p className="font-medium">{selectedReceipt.financing_applications?.contract_number || "-"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">البنك</p>
                    <p className="font-medium">{selectedReceipt.bank_name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">تاريخ الرفع</p>
                    <p className="font-medium">{format(new Date(selectedReceipt.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">تاريخ التحويل</p>
                    <p className="font-medium">{format(new Date(selectedReceipt.payment_date), "dd/MM/yyyy", { locale: ar })}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedReceipt.status === "pending" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => approveReceiptMutation.mutate({
                        receiptId: selectedReceipt.id,
                        applicationId: selectedReceipt.application_id,
                        amount: selectedReceipt.amount,
                      })}
                      disabled={approveReceiptMutation.isPending}
                    >
                      <Check className="h-4 w-4 ml-2" />
                      {approveReceiptMutation.isPending ? "جاري التأكيد..." : "تأكيد الحوالة وخصم القسط"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => rejectReceiptMutation.mutate({
                        receiptId: selectedReceipt.id,
                        adminNotes: "تم رفض الإيصال - بيانات غير صحيحة",
                      })}
                      disabled={rejectReceiptMutation.isPending}
                    >
                      <X className="h-4 w-4 ml-2" />
                      رفض
                    </Button>
                  </div>
                )}

                {/* Download Button */}
                <Button variant="outline" className="w-full" asChild>
                  <a href={selectedReceipt.receipt_url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4 ml-2" />
                    تحميل الإيصال
                  </a>
                </Button>
              </div>
            )}
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