/**
 * صفحة اعتماد العقد الرسمي
 * Official Contract Signing Page
 */

import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  ArrowRight, 
  FileText, 
  Check, 
  AlertTriangle, 
  Loader2,
  Shield,
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  OfficialContractViewer, 
  type ContractAcceptanceRecord 
} from "@/components/financing/contract/OfficialContractViewer";
import { ExecutiveBondStatus } from "@/components/financing/contract/ExecutiveBondStatus";
import { type LegalContractData } from "@/lib/financing/legalContractContent";
import { type ExecutiveBondState } from "@/lib/financing/stateMachine/contractStates";
import { useServerContractPdf } from "@/hooks/useServerContractPdf";

// الحالات المسموحة لتوقيع العقد
const SIGNABLE_STATUSES = [
  "awaiting_contract", "contract_presented", "CONTRACT_PRESENTED",
  "CONTRACT_SENT", "CONTRACT_PENDING", "awaiting_signature",
];
// الحالات النشطة للتمويل
const ACTIVE_STATUSES = ["active", "approved", "completed"];

export default function SignContract() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Hooks - يجب تعريفها قبل أي شرط return
  const serverPdf = useServerContractPdf();
  const [pdfLoaded, setPdfLoaded] = useState(false);

  // جلب بيانات الطلب
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

  // بناء بيانات العقد
  const contractData = useMemo<LegalContractData | null>(() => {
    if (!application) return null;
    
    const today = new Date();
    const installmentsCount = application.contract_override_installments 
      || application.financing_plans?.installments_count 
      || 6;
    const approvedAmount = application.approved_amount || application.requested_amount;
    const installmentAmount = approvedAmount / installmentsCount;
    
    const installmentsSchedule = Array.from(
      { length: installmentsCount },
      (_, i) => {
        const dueDate = new Date(today);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        return {
          number: i + 1,
          amount: installmentAmount,
          due_date: format(dueDate, "dd/MM/yyyy", { locale: ar }),
        };
      }
    );

    const firstDueDate = new Date(today);
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    
    const lastDueDate = new Date(today);
    lastDueDate.setMonth(lastDueDate.getMonth() + installmentsCount);

    return {
      applicant_full_name: application.contract_override_name || application.full_name,
      applicant_national_id: application.national_id,
      applicant_phone: application.phone,
      applicant_email: application.email,
      applicant_address: application.address || undefined,
      contract_number: `CNT-${applicationId?.substring(0, 8).toUpperCase()}`,
      application_number: application.application_number,
      contract_date: format(new Date(), "dd/MM/yyyy", { locale: ar }),
      services_list: [{
        name: "تمويل خدمات رقمية",
        quantity: 1,
        unit_price: approvedAmount,
        total_price: approvedAmount,
      }],
      total_services_value: approvedAmount,
      admin_fees: 0,
      vat_amount: approvedAmount * 0.15,
      grand_total: approvedAmount * 1.15,
      financed_amount: approvedAmount * 1.15,
      installments_count: installmentsCount,
      installment_amount: (approvedAmount * 1.15) / installmentsCount,
      first_installment_date: format(firstDueDate, "dd/MM/yyyy", { locale: ar }),
      last_installment_date: format(lastDueDate, "dd/MM/yyyy", { locale: ar }),
      installments_schedule: installmentsSchedule,
    };
  }, [application, applicationId]);

  // حسابات الحالة
  const isFinancingActive = application ? ACTIVE_STATUSES.includes(application.status) : false;
  const hasContractSigned = application ? (!!application.contract_signed_at || !!application.contract_document_url) : false;
  const canSignContract = application ? SIGNABLE_STATUSES.includes(application.status) : false;

  // تحميل PDF للعقد الموقع
  useEffect(() => {
    if (hasContractSigned && !canSignContract && applicationId && !pdfLoaded) {
      serverPdf.generateContract(applicationId).then(() => setPdfLoaded(true));
    }
  }, [hasContractSigned, canSignContract, applicationId, pdfLoaded]);

  // Mutation لتوقيع العقد
  const signContractMutation = useMutation({
    mutationFn: async (acceptanceRecord: ContractAcceptanceRecord) => {
      if (!application) throw new Error("No application");
      
      const { error } = await supabase
        .from("financing_applications")
        .update({
          contract_signed_at: new Date().toISOString(),
          contract_document_url: `signed-contract-${applicationId}`,
          status: "contract_signed",
        })
        .eq("id", applicationId);

      if (error) throw error;

      await supabase.from("financing_contracts").insert([{
        application_id: applicationId,
        user_id: user?.id,
        contract_number: `CNT-${Date.now()}`,
        contract_data: JSON.parse(JSON.stringify(acceptanceRecord)),
        status: "finalized" as const,
        accepted_at: acceptanceRecord.accepted_at,
        finalized_at: new Date().toISOString(),
        acceptance_checkbox: acceptanceRecord.checkbox_accepted,
        acceptance_button_clicked: acceptanceRecord.button_clicked,
        acceptance_user_agent: acceptanceRecord.user_agent || navigator.userAgent,
        acceptance_device_info: {
          readingTimeSeconds: acceptanceRecord.reading_time_seconds,
          scrollCompleted: acceptanceRecord.scroll_completed,
          pdfHash: acceptanceRecord.pdf_hash,
          ipAddress: acceptanceRecord.ip_address,
        },
        pdf_hash: acceptanceRecord.pdf_hash,
        viewed_at: new Date().toISOString(),
        viewed_count: 1,
      }]);

      // إشعار المدراء
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "تم اعتماد عقد التمويل",
            message: `قام العميل باعتماد عقد التمويل رقم ${application?.application_number}`,
            type: "success",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-application"] });
      queryClient.invalidateQueries({ queryKey: ["financing-contract"] });
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications"] });
      toast.success("تم اعتماد العقد بنجاح!");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء اعتماد العقد");
      console.error(error);
    },
  });

  const getExecutiveBondState = (): ExecutiveBondState => {
    if (!application) return "NOT_ISSUED";
    switch (application.status) {
      case "active":
      case "completed":
        return "SIGNED_BY_CLIENT";
      case "contract_signed":
      case "awaiting_signature":
        return "ISSUING";
      default:
        return "NOT_ISSUED";
    }
  };

  const handleDownloadContract = async () => {
    if (!applicationId || !application) return;
    
    if (serverPdf.contractHtml) {
      serverPdf.downloadContract(application.application_number);
    } else {
      toast.loading("جاري توليد العقد...", { id: "pdf-gen" });
      const result = await serverPdf.generateContract(applicationId);
      if (result) {
        serverPdf.downloadContract(application.application_number);
        toast.success("سيتم فتح نافذة الطباعة", { id: "pdf-gen" });
      } else {
        toast.error("فشل توليد العقد", { id: "pdf-gen" });
      }
    }
  };

  const handlePreviewContract = async () => {
    if (!applicationId) return;
    
    if (serverPdf.contractHtml) {
      serverPdf.previewContract();
    } else {
      toast.loading("جاري توليد العقد...", { id: "pdf-preview" });
      const result = await serverPdf.generateContract(applicationId);
      if (result) {
        serverPdf.previewContract();
        toast.dismiss("pdf-preview");
      } else {
        toast.error("فشل توليد العقد", { id: "pdf-preview" });
      }
    }
  };

  // ════════════════ واجهات العرض ════════════════

  // حالة التحميل
  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4" dir="rtl">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل بيانات العقد...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  // خطأ أو لا يوجد طلب
  if (error || !application) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-4" dir="rtl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error ? "حدث خطأ أثناء تحميل الطلب" : "لم يتم العثور على الطلب"}
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/dashboard/financing")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للتمويل
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  // التمويل نشط
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
          <Button onClick={() => navigate("/dashboard/financing")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للتمويل
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  // العقد موقّع - عرض حالة السند التنفيذي
  if (hasContractSigned && !canSignContract) {
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
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                حالة التمويل
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                طلب رقم: {application.application_number}
              </p>
            </div>
          </div>

          {/* تم توقيع العقد */}
          <Alert className="bg-emerald-500/10 border-emerald-500/30">
            <Check className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-400">
              تم اعتماد العقد بنجاح! جاري إصدار السند التنفيذي.
            </AlertDescription>
          </Alert>

          {/* تحميل العقد */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-right">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">تحميل نسخة من العقد</p>
                    <p className="text-sm text-muted-foreground">احفظ نسخة من عقد التمويل الموقّع</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handlePreviewContract}
                    variant="outline"
                    disabled={serverPdf.isLoading}
                    className="gap-2"
                  >
                    {serverPdf.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    معاينة
                  </Button>
                  <Button 
                    onClick={handleDownloadContract}
                    disabled={serverPdf.isLoading}
                    className="gap-2"
                  >
                    {serverPdf.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    تحميل PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* حالة السند التنفيذي */}
          <ExecutiveBondStatus
            bondState={getExecutiveBondState()}
            applicationId={applicationId || ''}
            applicationNumber={application.application_number}
            contractNumber={application.contract_number || undefined}
            amount={application.approved_amount || application.requested_amount}
            clientName={application.full_name}
            onConfirmSigned={() => {
              queryClient.invalidateQueries({ queryKey: ["financing-application"] });
              toast.success("تم تأكيد توقيع السند التنفيذي بنجاح!");
            }}
          />

          <Button variant="outline" onClick={() => navigate("/dashboard/financing")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للتمويل
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  // لا يمكن توقيع العقد حالياً
  if (!canSignContract) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-4" dir="rtl">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              هذا الطلب غير جاهز لاعتماد العقد حالياً. الحالة الحالية: {application.status}
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/dashboard/financing")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للتمويل
          </Button>
        </div>
      </ClientDashboardLayout>
    );
  }

  // لا توجد بيانات عقد (حالة نادرة)
  if (!contractData) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4" dir="rtl">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تجهيز بيانات العقد...</p>
        </div>
      </ClientDashboardLayout>
    );
  }

  // ════════════════ واجهة توقيع العقد ════════════════
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

        {/* Legal Notice */}
        <Alert className="bg-amber-500/10 border-amber-500/30">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            <strong>تنبيه قانوني:</strong> هذا عقد تمويل رسمي وملزم قانونياً. يرجى قراءة جميع الشروط والأحكام بعناية قبل الاعتماد.
          </AlertDescription>
        </Alert>

        {/* Official Contract Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <OfficialContractViewer
            contractData={contractData}
            applicationId={applicationId || ''}
            userId={user?.id || ''}
            onContractAccepted={(record) => signContractMutation.mutate(record)}
            onCancel={() => navigate("/dashboard/financing")}
            isSubmitting={signContractMutation.isPending}
          />
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
}
