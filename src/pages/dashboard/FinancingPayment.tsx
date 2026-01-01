import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Landmark, 
  CreditCard, 
  Upload, 
  CheckCircle2, 
  Copy, 
  ArrowRight,
  Shield,
  Clock,
  FileCheck,
  Banknote,
  Building2,
  Receipt
} from "lucide-react";

export default function FinancingPayment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch user's active financing applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ["my-financing-applications-for-payment"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("financing_applications")
        .select(`
          *,
          financing_installments(*)
        `)
        .eq("user_id", user.id)
        .in("status", ["approved", "active", "contract_signed"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!receiptFile || !selectedApplication || !amount || !user?.id) {
        throw new Error("يرجى ملء جميع الحقول المطلوبة");
      }

      // Upload file to storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("payment-receipts")
        .getPublicUrl(fileName);

      // Create payment receipt record
      const { error: insertError } = await supabase
        .from("financing_payment_receipts")
        .insert({
          application_id: selectedApplication,
          user_id: user.id,
          receipt_url: urlData.publicUrl,
          amount: parseFloat(amount),
          bank_name: "مصرف الراجحي",
        });

      if (insertError) throw insertError;

      // Create admin notification
      const app = applications?.find(a => a.id === selectedApplication);
      await supabase.from("admin_notifications").insert({
        title: "إيصال سداد تمويل جديد",
        message: `تم رفع إيصال سداد بمبلغ ${amount} ر.س للطلب رقم ${app?.application_number}`,
        type: "info",
        related_user_id: user.id,
        metadata: {
          application_id: selectedApplication,
          amount: parseFloat(amount),
        }
      });
    },
    onSuccess: () => {
      toast.success("تم رفع الإيصال بنجاح! سيتم مراجعته قريباً");
      queryClient.invalidateQueries({ queryKey: ["my-financing-applications-for-payment"] });
      setReceiptFile(null);
      setAmount("");
      setSelectedApplication("");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء رفع الإيصال");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await uploadReceiptMutation.mutateAsync();
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const bankInfo = {
    bankName: "مصرف الراجحي",
    accountName: "قابضة",
    accountNumber: "161000010006086071040",
    iban: "SA1980000161608016071040",
  };

  return (
    <ClientDashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mx-auto">
            <Banknote className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">سداد التمويل</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            قم بتحويل المبلغ المطلوب ورفع إيصال التحويل لتأكيد عملية السداد
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { icon: Shield, title: "دفع آمن", description: "معاملات مشفرة وآمنة", color: "from-blue-500 to-indigo-600" },
            { icon: Clock, title: "تأكيد سريع", description: "مراجعة خلال 24 ساعة", color: "from-emerald-500 to-teal-600" },
            { icon: FileCheck, title: "توثيق فوري", description: "حفظ تلقائي للإيصالات", color: "from-purple-500 to-violet-600" },
          ].map((feature, index) => (
            <Card key={index} className="border-0 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bank Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
              <CardHeader className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">معلومات الحساب البنكي</CardTitle>
                    <p className="text-sm text-muted-foreground">للتحويل البنكي</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                {/* Bank Name */}
                <div className="bg-background/30 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">اسم البنك</p>
                      <p className="text-lg font-bold text-emerald-400">{bankInfo.bankName}</p>
                    </div>
                    <Landmark className="h-8 w-8 text-emerald-500/50" />
                  </div>
                </div>

                {/* Account Name */}
                <div className="bg-background/30 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">اسم الحساب</p>
                      <p className="text-lg font-bold">{bankInfo.accountName}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-emerald-500/50" />
                  </div>
                </div>

                {/* Account Number */}
                <div className="bg-background/30 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">رقم الحساب</p>
                      <p className="text-lg font-mono font-bold truncate" dir="ltr">{bankInfo.accountNumber}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(bankInfo.accountNumber, "رقم الحساب")}
                      className="flex-shrink-0 hover:bg-emerald-500/20"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* IBAN */}
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 border border-emerald-500/30">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">رقم الآيبان (IBAN)</p>
                      <p className="text-lg font-mono font-bold text-emerald-400 truncate" dir="ltr">{bankInfo.iban}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(bankInfo.iban, "رقم الآيبان")}
                      className="flex-shrink-0 hover:bg-emerald-500/20"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Important Note */}
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-400">ملاحظة مهمة</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        يرجى إرفاق صورة واضحة من إيصال التحويل بعد إتمام العملية لتأكيد السداد
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upload Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">رفع إيصال السداد</CardTitle>
                    <p className="text-sm text-muted-foreground">أرفق إيصال التحويل البنكي</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Select Application */}
                  <div className="space-y-2">
                    <Label>اختر طلب التمويل</Label>
                    <Select value={selectedApplication} onValueChange={setSelectedApplication}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="اختر طلب التمويل" />
                      </SelectTrigger>
                      <SelectContent>
                        {applications?.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.application_number} - {app.approved_amount?.toLocaleString("ar-SA")} ر.س
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {applications?.length === 0 && !isLoading && (
                      <p className="text-sm text-muted-foreground">
                        لا توجد طلبات تمويل نشطة. 
                        <Button variant="link" className="p-0 h-auto mr-1" onClick={() => navigate("/dashboard/financing/apply")}>
                          تقديم طلب جديد
                        </Button>
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label>المبلغ المحول (ر.س)</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="أدخل المبلغ"
                      className="bg-background/50"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>صورة الإيصال البنكي</Label>
                    <div 
                      className={`
                        relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                        ${receiptFile 
                          ? "border-emerald-500/50 bg-emerald-500/10" 
                          : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                        }
                      `}
                      onClick={() => document.getElementById("receipt-upload")?.click()}
                    >
                      <input
                        id="receipt-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      />
                      {receiptFile ? (
                        <div className="space-y-2">
                          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                          <p className="font-medium text-emerald-400">{receiptFile.name}</p>
                          <p className="text-sm text-muted-foreground">انقر لتغيير الملف</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                          <p className="font-medium">اضغط لرفع صورة الإيصال</p>
                          <p className="text-sm text-muted-foreground">PNG, JPG, PDF حتى 10 ميجابايت</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                    disabled={isUploading || !selectedApplication || !amount || !receiptFile}
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري الرفع...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        رفع الإيصال وتأكيد السداد
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-6 border-0 bg-blue-500/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <ArrowRight className="h-5 w-5 text-blue-400" />
                  خطوات السداد
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                    <span>قم بتحويل المبلغ المطلوب إلى الحساب البنكي أعلاه</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                    <span>احتفظ بصورة واضحة من إيصال التحويل</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                    <span>اختر طلب التمويل وأدخل المبلغ المحول</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                    <span>ارفع صورة الإيصال وانتظر التأكيد خلال 24 ساعة</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
}
