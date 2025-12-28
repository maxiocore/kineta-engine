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
            title: "تم توقيع الكمبيالة",
            message: `قام العميل بتوقيع الكمبيالة للطلب رقم ${application?.application_number}. يمكنك الآن تفعيل التمويل.`,
            type: "success",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-application-promissory"] });
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications"] });
      toast.success("تم توقيع الكمبيالة بنجاح! سيتم تفعيل التمويل قريباً بعد التحقق");
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
              ? "تم توقيع الكمبيالة مسبقاً" 
              : "هذا الطلب غير جاهز لتوقيع الكمبيالة حالياً"}
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
              الكمبيالة
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              كمبيالة تجارية وفق نظام الأوراق التجارية السعودي
            </p>
            <p className="text-xs text-muted-foreground">
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
                    <h2 className="text-2xl font-bold text-white">كمبيالة تجارية</h2>
                    <p className="text-indigo-300 text-sm">ورقة تجارية وفق نظام الأوراق التجارية السعودي</p>
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
              <div className="p-6 bg-slate-900/50 border-2 border-amber-600/50 rounded-xl">
                {/* كمبيالة Header */}
                <div className="text-center mb-6 pb-4 border-b-2 border-amber-500/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">المبلغ بالأرقام</p>
                      <p className="font-bold text-xl text-amber-400">{amount.toLocaleString()} ر.س</p>
                    </div>
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-amber-400 mb-1">كمبيالة</h3>
                      <p className="text-xs text-muted-foreground">BILL OF EXCHANGE</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">التاريخ</p>
                      <p className="font-bold">{format(new Date(), "dd/MM/yyyy", { locale: ar })}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 text-sm leading-relaxed">
                  {/* مكان الإنشاء */}
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-muted-foreground">مكان الإنشاء:</span>
                    <span className="font-bold">المملكة العربية السعودية</span>
                  </div>

                  {/* الساحب (المدين) */}
                  <div className="p-4 border border-slate-600 rounded-lg">
                    <p className="text-amber-400 font-bold mb-2">الساحب (المسحوب عليه):</p>
                    <p className="text-lg">
                      أنا الموقع أدناه <span className="font-bold text-amber-400">{application.full_name}</span>
                    </p>
                    <p className="text-lg">
                      هوية رقم: <span className="font-bold font-mono text-amber-400">{application.national_id}</span>
                    </p>
                  </div>

                  {/* المستفيد */}
                  <div className="p-4 border border-emerald-600/50 rounded-lg bg-emerald-500/5">
                    <p className="text-emerald-400 font-bold mb-2">المستفيد (لأمر):</p>
                    <p className="text-lg">
                      <span className="font-bold text-emerald-400">شركة علي صالح الشهري القابضة</span>
                    </p>
                    <p className="text-sm">سجل تجاري رقم: <span className="font-mono">4030554749</span></p>
                  </div>

                  {/* المبلغ */}
                  <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">مبلغ وقدره</p>
                    <p className="text-2xl font-bold text-primary">{amount.toLocaleString()} ريال سعودي</p>
                    <p className="text-sm text-muted-foreground mt-1">(فقط {amount.toLocaleString()} ريال سعودي لا غير)</p>
                  </div>

                  {/* شروط السداد */}
                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <p className="text-amber-400 font-bold mb-3">شروط السداد:</p>
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">عدد الأقساط:</span>
                        <span className="font-bold">{application.financing_plans?.installments_count || 1} قسط شهري</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">قيمة القسط:</span>
                        <span className="font-bold">{installmentAmount.toLocaleString()} ريال</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                        <span className="font-bold">يوم 30 من كل شهر ميلادي</span>
                      </div>
                    </div>
                  </div>

                  {/* الشرط الإضافي */}
                  <div className="p-3 bg-slate-700/30 rounded-lg text-center text-sm">
                    <p>هذه الكمبيالة صادرة بموجب عقد تمويل رقم: <span className="font-bold text-primary">{application.contract_number}</span></p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400 text-center">
                    <AlertTriangle className="h-4 w-4 inline ml-1" />
                    هذه الكمبيالة ورقة تجارية قابلة للتنفيذ وفقاً لنظام الأوراق التجارية السعودي
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
                <h3 className="font-bold text-lg">توقيع الساحب (المسحوب عليه)</h3>
                
                {!isSigned ? (
                  <div className="space-y-4">
                    {!showSignature ? (
                      <div className="p-6 border-2 border-dashed border-amber-500/50 rounded-xl text-center">
                        <PenTool className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">يجب توقيع الكمبيالة للموافقة على الالتزام بالسداد</p>
                        <Button 
                          onClick={() => setShowSignature(true)}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          <PenTool className="h-4 w-4 ml-2" />
                          توقيع الكمبيالة
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
                          <p className="font-bold text-emerald-400">تم توقيع الكمبيالة بنجاح</p>
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