import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  ArrowRight, 
  FileText, 
  Check, 
  AlertTriangle, 
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ServiceFinancingContractViewer } from "@/components/financing/contract/ServiceFinancingContractViewer";
import { 
  type ContractPlaceholders,
  type ContractApprovalRecord,
  type InstallmentItem
} from "@/lib/financing/serviceFinancingContract";
import { COMPANY_INFO } from "@/lib/financing/serviceFinancingPolicy";

export default function SignContract() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: application, isLoading, error } = useQuery({
    queryKey: ["financing-application", applicationId],
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

  const signContractMutation = useMutation({
    mutationFn: async (approvalRecord: ContractApprovalRecord) => {
      if (!application) throw new Error("No application");
      
      const { error } = await supabase
        .from("financing_applications")
        .update({
          contract_signed_at: new Date().toISOString(),
          contract_document_url: `signed-contract-${applicationId}`,
          status: "awaiting_signature", // Next step: promissory note
        })
        .eq("id", applicationId);

      if (error) throw error;

      // Create financing contract record
      await supabase.from("financing_contracts").insert([{
        application_id: applicationId,
        user_id: user?.id,
        contract_number: `CNT-${Date.now()}`,
        contract_data: JSON.parse(JSON.stringify(approvalRecord)),
        status: "accepted" as const,
        accepted_at: new Date().toISOString(),
        acceptance_checkbox: approvalRecord.checkbox_accepted,
        acceptance_button_clicked: approvalRecord.button_clicked,
      }]);

      // Notify admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "تم توقيع عقد التمويل",
            message: `قام العميل بتوقيع عقد التمويل رقم ${application?.application_number}. يمكنك الآن إرسال الكمبيالة.`,
            type: "success",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-application"] });
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications"] });
      toast.success("تم اعتماد العقد بنجاح! سيتم إرسال الكمبيالة قريباً");
      // Navigate to promissory note signing
      navigate(`/dashboard/financing/sign-promissory/${applicationId}`);
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حفظ التوقيع");
      console.error(error);
    },
  });

  const handleContractApproval = async (approvalRecord: ContractApprovalRecord) => {
    await signContractMutation.mutateAsync(approvalRecord);
  };

  // Build contract data
  const contractData = useMemo<ContractPlaceholders | null>(() => {
    if (!application) return null;
    
    const today = new Date();
    const installmentsCount = application.financing_plans?.installments_count || 6;
    const approvedAmount = application.approved_amount || application.requested_amount;
    const installmentAmount = approvedAmount / installmentsCount;
    
    // Generate installments schedule
    const installmentsSchedule: InstallmentItem[] = Array.from(
      { length: installmentsCount },
      (_, i) => {
        const dueDate = new Date(today);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        return {
          number: i + 1,
          amount: installmentAmount,
          dueDate: format(dueDate, "dd/MM/yyyy", { locale: ar }),
          status: 'pending' as const,
        };
      }
    );

    const firstDueDate = new Date(today);
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    
    const lastDueDate = new Date(today);
    lastDueDate.setMonth(lastDueDate.getMonth() + installmentsCount);

    return {
      customer_name: application.full_name,
      customer_national_id: application.national_id,
      customer_phone: application.phone,
      customer_email: application.email,
      customer_address: application.address || undefined,
      order_id: application.id,
      application_number: application.application_number,
      application_date: format(new Date(application.submitted_at), "dd/MM/yyyy", { locale: ar }),
      services_table: [{
        name: "تمويل خدمات رقمية",
        description: application.service_description || "خدمات رقمية متنوعة",
        price: approvedAmount,
        quantity: 1,
        total: approvedAmount,
      }],
      total_services_value: approvedAmount,
      admin_fees: 0,
      vat_amount: approvedAmount * 0.15,
      total_amount: approvedAmount * 1.15,
      down_payment: 0,
      financed_amount: approvedAmount * 1.15,
      installments_count: installmentsCount,
      installment_amount: (approvedAmount * 1.15) / installmentsCount,
      first_due_date: format(firstDueDate, "dd/MM/yyyy", { locale: ar }),
      last_due_date: format(lastDueDate, "dd/MM/yyyy", { locale: ar }),
      installments_schedule: installmentsSchedule,
      service_provider: COMPANY_INFO.name,
    };
  }, [application]);

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error || !application || !contractData) {
    return (
      <ClientDashboardLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>لم يتم العثور على الطلب</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/dashboard/financing")} className="mt-4">
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للتمويل
        </Button>
      </ClientDashboardLayout>
    );
  }

  // Check if financing is already active or completed
  const isFinancingActive = ["active", "approved", "completed"].includes(application.status);
  const hasContractSigned = !!application.contract_signed_at || !!application.contract_document_url;
  
  // If financing is active, show success message
  if (isFinancingActive) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-4" dir="rtl">
          <Alert className="bg-emerald-500/10 border-emerald-500/30">
            <Check className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-400">
              تم تفعيل التمويل بنجاح! يمكنك الآن استخدام رصيد التمويل لشراء الخدمات.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/dashboard/financing")} className="mt-4">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للتمويل
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  // If contract already signed and waiting for promissory note or activation
  if (hasContractSigned && application.status !== "awaiting_contract") {
    return (
      <ClientDashboardLayout>
        <div className="space-y-4" dir="rtl">
          <Alert className="bg-primary/10 border-primary/30">
            <FileText className="h-4 w-4 text-primary" />
            <AlertDescription>
              تم اعتماد العقد بنجاح. 
              {application.status === "awaiting_signature" && " يرجى توقيع الكمبيالة لإتمام عملية التمويل."}
            </AlertDescription>
          </Alert>
          {application.status === "awaiting_signature" && (
            <Button 
              onClick={() => navigate(`/dashboard/financing/sign-promissory/${applicationId}`)} 
              className="bg-gradient-to-r from-indigo-500 to-blue-600"
            >
              <FileText className="h-4 w-4 ml-2" />
              توقيع الكمبيالة
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/dashboard/financing")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للتمويل
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (application.status !== "awaiting_contract") {
    return (
      <ClientDashboardLayout>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            هذا الطلب غير جاهز للتوقيع حالياً
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/dashboard/financing")} className="mt-4">
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للتمويل
        </Button>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/financing")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              اعتماد عقد التمويل
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              طلب رقم: {application.application_number}
            </p>
          </div>
        </div>

        {/* Contract Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ServiceFinancingContractViewer
            contractData={contractData}
            applicationId={applicationId || ''}
            userId={user?.id || ''}
            onApprove={handleContractApproval}
            onCancel={() => navigate("/dashboard/financing")}
            isSubmitting={signContractMutation.isPending}
          />
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
}
