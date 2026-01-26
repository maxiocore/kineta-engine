/**
 * صفحة اعتماد العقد الرسمي
 * Official Contract Signing Page
 * 
 * يستخدم التوليد السيرفري للعقود مع:
 * - قراءة إلزامية (95% scroll + 60 ثانية)
 * - موافقة صريحة
 * - لا كمبيالة
 * - توليد PDF سيرفري (Arabic Shaping + Bidi RTL)
 */

import { useMemo, useEffect } from "react";
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
import { COMPANY_INFO } from "@/lib/financing/serviceFinancingPolicy";
import { type LegalContractData } from "@/lib/financing/legalContractContent";
import { type ExecutiveBondState } from "@/lib/financing/stateMachine/contractStates";
import { useServerContractPdf } from "@/hooks/useServerContractPdf";

export default function SignContract() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Server-side PDF hook - MUST be called before any conditional returns
  const serverPdf = useServerContractPdf();

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

  // Get contract record if exists
  const { data: contractRecord } = useQuery({
    queryKey: ["financing-contract", applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const { data } = await supabase
        .from("financing_contracts")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!applicationId,
  });

  const signContractMutation = useMutation({
    mutationFn: async (acceptanceRecord: ContractAcceptanceRecord) => {
      if (!application) throw new Error("No application");
      
      // Update application status - directly to contract finalized (no promissory note)
      const { error } = await supabase
        .from("financing_applications")
        .update({
          contract_signed_at: new Date().toISOString(),
          contract_document_url: `signed-contract-${applicationId}`,
          status: "contract_signed", // New status: contract signed, waiting for admin to issue executive bond
        })
        .eq("id", applicationId);

      if (error) throw error;

      // Create financing contract record with full acceptance data
      // Note: acceptance_ip_address requires inet type, so we skip it here and let the database handle it
      const contractInsertResult = await supabase.from("financing_contracts").insert([{
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
          ipAddress: acceptanceRecord.ip_address, // Store IP in device_info instead
        },
        pdf_hash: acceptanceRecord.pdf_hash,
        viewed_at: new Date().toISOString(),
        viewed_count: 1,
      }]);

      if (contractInsertResult.error) {
        console.error("Contract insert error:", contractInsertResult.error);
        throw contractInsertResult.error;
      }

      // Log activity
      try {
        await supabase.functions.invoke('financing-activity-log', {
          body: {
            applicationId,
            eventType: 'CONTRACT_SIGNED',
            fromStatus: 'awaiting_contract',
            toStatus: 'contract_signed',
            triggeredBy: 'customer',
            actorId: user?.id,
            metadata: {
              readingTimeSeconds: acceptanceRecord.reading_time_seconds,
              scrollCompleted: acceptanceRecord.scroll_completed,
              pdfHash: acceptanceRecord.pdf_hash,
            },
            isVisibleToCustomer: true,
          }
        });
      } catch (e) {
        console.error("Failed to log activity:", e);
      }

      // Notify admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "تم اعتماد عقد التمويل",
            message: `قام العميل باعتماد عقد التمويل رقم ${application?.application_number}. يرجى إصدار السند التنفيذي عبر نافذ.`,
            type: "success",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-application"] });
      queryClient.invalidateQueries({ queryKey: ["financing-contract"] });
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications"] });
      toast.success("تم اعتماد العقد بنجاح! سيتم إصدار السند التنفيذي عبر منصة نافذ.");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء اعتماد العقد");
      console.error(error);
    },
  });

  const handleContractAccepted = (acceptanceRecord: ContractAcceptanceRecord) => {
    signContractMutation.mutate(acceptanceRecord);
  };

  // Determine executive bond state from application status
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

  // Build contract data for OfficialContractViewer
  const contractData = useMemo<LegalContractData | null>(() => {
    if (!application) return null;
    
    const today = new Date();
    const installmentsCount = application.financing_plans?.installments_count || 6;
    const approvedAmount = application.approved_amount || application.requested_amount;
    const installmentAmount = approvedAmount / installmentsCount;
    
    // Generate installments schedule
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
      // بيانات العميل من طلب التمويل
      applicant_full_name: application.full_name,
      applicant_national_id: application.national_id,
      applicant_phone: application.phone,
      applicant_email: application.email,
      applicant_address: application.address || undefined,
      
      // بيانات العقد
      contract_number: `CNT-${applicationId?.substring(0, 8).toUpperCase()}`,
      application_number: application.application_number,
      contract_date: format(new Date(), "dd/MM/yyyy", { locale: ar }),
      
      // البيانات المالية
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
      
      // جدول الأقساط
      installments_count: installmentsCount,
      installment_amount: (approvedAmount * 1.15) / installmentsCount,
      first_installment_date: format(firstDueDate, "dd/MM/yyyy", { locale: ar }),
      last_installment_date: format(lastDueDate, "dd/MM/yyyy", { locale: ar }),
      installments_schedule: installmentsSchedule,
    };
  }, [application, applicationId]);

  // Check if financing is already active or completed
  const isFinancingActive = application ? ["active", "approved", "completed"].includes(application.status) : false;
  const hasContractSigned = application ? (!!application.contract_signed_at || !!application.contract_document_url) : false;

  // Load contract PDF when viewing signed contract - MUST be before any conditional returns
  useEffect(() => {
    if (hasContractSigned && application?.status !== "awaiting_contract" && applicationId) {
      serverPdf.generateContract(applicationId);
    }
  }, [hasContractSigned, application?.status, applicationId, serverPdf]);

  // ============ Conditional Returns ============
  
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

  // If contract already signed - show executive bond status with download button
  if (hasContractSigned && application.status !== "awaiting_contract") {
    // Server-side PDF Download function
    const handleDownloadContract = async () => {
      if (serverPdf.contractHtml) {
        serverPdf.downloadContract(application.application_number);
      } else {
        toast.loading("جاري توليد العقد...", { id: "pdf-gen" });
        const result = await serverPdf.generateContract(applicationId!);
        if (result) {
          serverPdf.downloadContract(application.application_number);
          toast.success("سيتم فتح نافذة الطباعة", { id: "pdf-gen" });
        } else {
          toast.error("فشل توليد العقد", { id: "pdf-gen" });
        }
      }
    };

    // Preview contract in new window
    const handlePreviewContract = async () => {
      if (serverPdf.contractHtml) {
        serverPdf.previewContract();
      } else {
        toast.loading("جاري توليد العقد...", { id: "pdf-preview" });
        const result = await serverPdf.generateContract(applicationId!);
        if (result) {
          serverPdf.previewContract();
          toast.dismiss("pdf-preview");
        } else {
          toast.error("فشل توليد العقد", { id: "pdf-preview" });
        }
      }
    };

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

          {/* Contract Signed Success */}
          <Alert className="bg-emerald-500/10 border-emerald-500/30">
            <Check className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-400">
              تم اعتماد العقد بنجاح! جاري إصدار السند التنفيذي.
            </AlertDescription>
          </Alert>

          {/* Download Contract Button */}
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
                    variant="default"
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

          {/* Executive Bond Status */}
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

  // Allow contract signing for both awaiting_contract and contract_presented statuses
  const canSignContract = ["awaiting_contract", "contract_presented", "CONTRACT_PRESENTED"].includes(application.status);
  
  if (!canSignContract) {
    return (
      <ClientDashboardLayout>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            هذا الطلب غير جاهز لاعتماد العقد حالياً
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
            onContractAccepted={handleContractAccepted}
            onCancel={() => navigate("/dashboard/financing")}
            isSubmitting={signContractMutation.isPending}
          />
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
}
