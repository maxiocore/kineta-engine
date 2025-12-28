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
  Loader2,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import DigitalSignature from "@/components/financing/DigitalSignature";

export default function SignPromissoryNote() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSignature, setShowSignature] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const { data: application, isLoading, error } = useQuery({
    queryKey: ["financing-application-promissory", applicationId],
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

  const signPromissoryMutation = useMutation({
    mutationFn: async (signature: string) => {
      if (!applicationId) throw new Error("No application ID");
      
      const { error } = await supabase
        .from("financing_applications")
        .update({
          promissory_note_url: signature, // Store signature
        })
        .eq("id", applicationId);

      if (error) throw error;

      // Notify admin that promissory note is signed
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "تم توقيع السند التنفيذي",
            message: `قام العميل بتوقيع السند التنفيذي للطلب رقم ${application?.application_number}. يمكنك الآن تفعيل التمويل.`,
            type: "success",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-application-promissory"] });
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications"] });
      toast.success("تم توقيع السند التنفيذي بنجاح! سيتم تفعيل التمويل قريباً بعد التحقق");
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
    await signPromissoryMutation.mutateAsync(signature);
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

  if (application.status !== "awaiting_signature") {
    return (
      <ClientDashboardLayout>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {application.promissory_note_url 
              ? "تم توقيع السند التنفيذي مسبقاً" 
              : "هذا الطلب غير جاهز لتوقيع السند التنفيذي حالياً"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/dashboard/financing")} className="mt-4">
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للتمويل
        </Button>
      </ClientDashboardLayout>
    );
  }

  const amount = application.approved_amount || application.requested_amount;
  const installmentAmount = application.financing_plans 
    ? amount / application.financing_plans.installments_count 
    : amount;

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
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              السند التنفيذي
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              طلب رقم: {application.application_number}
            </p>
          </div>
        </div>

        {/* Promissory Note Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="overflow-hidden border-2 border-indigo-700">
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">سند لأمر</h2>
                    <p className="text-indigo-300 text-sm">سند تنفيذي وفق نظام التنفيذ السعودي</p>
                  </div>
                </div>
                <Badge className={`text-sm px-4 py-2 ${isSigned ? "bg-emerald-500" : "bg-yellow-500"}`}>
                  {isSigned ? "تم التوقيع" : "بانتظار التوقيع"}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Promissory Note Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground">رقم العقد</p>
                  <p className="font-bold text-primary">{application.contract_number || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المبلغ الإجمالي</p>
                  <p className="font-bold text-emerald-500">{amount.toLocaleString()} ر.س</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">عدد الأقساط</p>
                  <p className="font-bold">{application.financing_plans?.installments_count || 1} قسط</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">قيمة القسط</p>
                  <p className="font-bold">{installmentAmount.toLocaleString()} ر.س</p>
                </div>
              </div>

              {/* Promissory Note Content */}
              <div className="p-6 bg-slate-900/50 border-2 border-slate-700 rounded-xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-amber-400 mb-2">سند لأمر</h3>
                  <p className="text-sm text-muted-foreground">
                    التاريخ: {format(new Date(), "dd/MM/yyyy", { locale: ar })}
                  </p>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <p className="text-center text-lg">
                    أتعهد أنا الموقع أدناه <span className="font-bold text-amber-400">{application.full_name}</span>
                  </p>
                  <p className="text-center text-lg">
                    صاحب هوية رقم <span className="font-bold font-mono text-amber-400">{application.national_id}</span>
                  </p>
                  <p className="text-center text-lg mt-4">
                    بأن أدفع لأمر <span className="font-bold text-emerald-400">شركة علي صالح الشهري القابضة</span>
                  </p>
                  <p className="text-center text-lg">
                    (سجل تجاري رقم: <span className="font-mono">4030554749</span>)
                  </p>
                  <p className="text-center text-2xl font-bold text-primary my-6">
                    مبلغ وقدره: {amount.toLocaleString()} ريال سعودي
                  </p>
                  <p className="text-center text-lg">
                    يُسدد على <span className="font-bold">{application.financing_plans?.installments_count || 1}</span> قسط شهري متساوي
                  </p>
                  <p className="text-center text-lg">
                    بقيمة <span className="font-bold">{installmentAmount.toLocaleString()}</span> ريال للقسط الواحد
                  </p>
                  <p className="text-center text-lg mt-4">
                    تُستحق في يوم <span className="font-bold">30</span> من كل شهر ميلادي
                  </p>
                </div>

                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400 text-center">
                    <AlertTriangle className="h-4 w-4 inline ml-1" />
                    هذا السند قابل للتنفيذ مباشرة دون الحاجة إلى حكم قضائي وفقاً لنظام التنفيذ السعودي
                  </p>
                </div>
              </div>

              {/* Debtor Info */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-slate-500/20">
                <h4 className="font-bold text-slate-300 mb-3">معلومات المدين</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العنوان:</span>
                    <span className="font-medium">{application.address || "غير محدد"}</span>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-bold text-lg">توقيع المدين</h3>
                
                {!isSigned ? (
                  <div className="space-y-4">
                    {!showSignature ? (
                      <div className="p-6 border-2 border-dashed border-indigo-500/50 rounded-xl text-center">
                        <AlertTriangle className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">يجب توقيع السند التنفيذي للموافقة على الالتزام بالسداد</p>
                        <Button 
                          onClick={() => setShowSignature(true)}
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
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
                          <p className="font-bold text-emerald-400">تم توقيع السند التنفيذي بنجاح</p>
                          <p className="text-sm text-muted-foreground">
                            سيتم تفعيل التمويل بعد التحقق من الإدارة
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