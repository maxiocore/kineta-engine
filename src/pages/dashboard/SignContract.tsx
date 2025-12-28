import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  ArrowRight, 
  FileText, 
  Landmark, 
  Check, 
  AlertTriangle, 
  PenTool,
  Download,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import DigitalSignature from "@/components/financing/DigitalSignature";
import { generateFinancingContract } from "@/lib/financingContract";

export default function SignContract() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSignature, setShowSignature] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const { data: application, isLoading, error } = useQuery({
    queryKey: ["financing-application", applicationId],
    queryFn: async () => {
      if (!applicationId || !user?.id) return null;
      const { data, error } = await supabase
        .from("financing_applications")
        .select(`
          *,
          financing_plans (name_ar, installments_count, duration_months)
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
    mutationFn: async (signature: string) => {
      if (!applicationId) throw new Error("No application ID");
      
      const { error } = await supabase
        .from("financing_applications")
        .update({
          contract_signed_at: new Date().toISOString(),
          contract_document_url: signature, // Store signature temporarily
        })
        .eq("id", applicationId);

      if (error) throw error;

      // Notify admin that contract is signed
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "تم توقيع عقد التمويل",
            message: `قام العميل بتوقيع عقد التمويل رقم ${application?.application_number}. يمكنك الآن إرسال السند التنفيذي.`,
            type: "success",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-application"] });
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications"] });
      toast.success("تم توقيع العقد بنجاح! سيتم إرسال السند التنفيذي قريباً");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حفظ التوقيع");
      console.error(error);
    },
  });

  const handleSignature = async (signature: string) => {
    setSignatureData(signature);
    setIsSigned(true);
    setShowSignature(false);
    await signContractMutation.mutateAsync(signature);
  };

  const handleDownloadContract = async () => {
    if (!application || !signatureData) return;
    
    try {
      await generateFinancingContract({
        contractNumber: application.contract_number || `CNT-${Date.now()}`,
        applicationNumber: application.application_number,
        clientName: application.full_name,
        nationalId: application.national_id,
        phone: application.phone,
        email: application.email,
        address: application.address || "غير محدد",
        amount: application.approved_amount || application.requested_amount,
        installmentsCount: application.financing_plans?.installments_count || 6,
        planName: application.financing_plans?.name_ar || "التمويل المرن",
        installments: [],
        signatureData,
        contractDate: application.approved_at || new Date().toISOString(),
      });
      toast.success("تم تحميل العقد بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل العقد");
    }
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error || !application) {
    return (
      <ClientDashboardLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>لم يتم العثور على الطلب</AlertDescription>
        </Alert>
      </ClientDashboardLayout>
    );
  }

  if (application.status !== "awaiting_contract") {
    return (
      <ClientDashboardLayout>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {application.contract_signed_at 
              ? "تم توقيع هذا العقد مسبقاً" 
              : "هذا الطلب غير جاهز للتوقيع حالياً"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/dashboard/financing")} className="mt-4">
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للتمويل
        </Button>
      </ClientDashboardLayout>
    );
  }

  const contractDate = application.approved_at 
    ? format(new Date(application.approved_at), "dd MMMM yyyy", { locale: ar })
    : format(new Date(), "dd MMMM yyyy", { locale: ar });

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
              توقيع عقد التمويل
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              طلب رقم: {application.application_number}
            </p>
          </div>
        </div>

        {/* Contract Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="overflow-hidden border-2 border-slate-700">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                    <Landmark className="h-8 w-8 text-slate-900" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">عقد التمويل</h2>
                    <p className="text-amber-400 text-sm">شركة علي صالح الشهري القابضة</p>
                  </div>
                </div>
                <Badge className={`text-sm px-4 py-2 ${isSigned ? "bg-emerald-500" : "bg-yellow-500"}`}>
                  {isSigned ? "تم التوقيع" : "بانتظار التوقيع"}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Contract Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground">رقم العقد</p>
                  <p className="font-bold text-primary">{application.contract_number || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">رقم الطلب</p>
                  <p className="font-bold">{application.application_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ العقد</p>
                  <p className="font-bold">{contractDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">مبلغ التمويل</p>
                  <p className="font-bold text-emerald-500">{(application.approved_amount || application.requested_amount).toLocaleString()} ر.س</p>
                </div>
              </div>

              {/* Contract Parties */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">أطراف العقد</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
                    <h4 className="font-bold text-amber-400 mb-3">الطرف الأول (الممول)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">اسم الشركة:</span>
                        <span className="font-medium">شركة علي صالح الشهري القابضة</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">السجل التجاري:</span>
                        <span className="font-medium font-mono">4030554749</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <h4 className="font-bold text-emerald-400 mb-3">الطرف الثاني (المستفيد)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الاسم الكامل:</span>
                        <span className="font-medium">{application.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">رقم الهوية:</span>
                        <span className="font-medium font-mono">{application.national_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">رقم الجوال:</span>
                        <span className="font-medium font-mono">{application.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Terms */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">بنود العقد</h3>
                <div className="space-y-3 text-sm leading-relaxed">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="font-bold text-primary">البند الأول:</span>
                    <span className="mr-2">يوافق الطرف الأول على تمويل الطرف الثاني بمبلغ <span className="font-bold text-emerald-500">{(application.approved_amount || application.requested_amount).toLocaleString()} ر.س</span>.</span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="font-bold text-primary">البند الثاني:</span>
                    <span className="mr-2">يقر الطرف الثاني بأن التمويل سيُستخدم حصرياً لشراء خدمات من منصة ماكسيوكور، ولا يمكن سحبه نقداً.</span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="font-bold text-primary">البند الثالث:</span>
                    <span className="mr-2">يلتزم الطرف الثاني بسداد مبلغ التمويل على <span className="font-bold">{application.financing_plans?.installments_count || 6} أقساط شهرية</span>.</span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="font-bold text-primary">البند الرابع:</span>
                    <span className="mr-2">هذا التمويل بدون فوائد أو رسوم إضافية، بشرط الالتزام بمواعيد السداد.</span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="font-bold text-primary">البند الخامس:</span>
                    <span className="mr-2">في حال تأخر السداد لمدة تتجاوز 30 يوماً، يحق للطرف الأول اتخاذ الإجراءات القانونية.</span>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-bold text-lg">التوقيع الرقمي</h3>
                
                {!isSigned ? (
                  <div className="space-y-4">
                    {!showSignature ? (
                      <div className="p-6 border-2 border-dashed border-amber-500/50 rounded-xl text-center">
                        <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">يجب توقيع العقد رقمياً للموافقة على الشروط والأحكام</p>
                        <Button 
                          onClick={() => setShowSignature(true)}
                          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900"
                        >
                          <PenTool className="h-4 w-4 ml-2" />
                          التوقيع الآن
                        </Button>
                      </div>
                    ) : (
                      <DigitalSignature onSign={handleSignature} onCancel={() => setShowSignature(false)} />
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-400">تم توقيع العقد بنجاح</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(), "dd/MM/yyyy - HH:mm", { locale: ar })}
                          </p>
                        </div>
                      </div>
                      {signatureData && (
                        <img src={signatureData} alt="توقيع" className="h-16 border rounded-lg bg-white" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center pt-4">
                {isSigned && (
                  <Button
                    onClick={handleDownloadContract}
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Download className="h-5 w-5 ml-2" />
                    تحميل العقد PDF
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard/financing")}
                  size="lg"
                >
                  <ArrowRight className="h-5 w-5 ml-2" />
                  العودة للتمويل
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
}