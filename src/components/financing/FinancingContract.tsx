import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, PenTool, Check, AlertTriangle, Landmark } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import DigitalSignature from "./DigitalSignature";
import { generateFinancingContract } from "@/lib/financingContract";

interface FinancingContractProps {
  application: {
    id: string;
    application_number: string;
    contract_number: string | null;
    full_name: string;
    national_id: string;
    phone: string;
    email: string;
    address?: string | null;
    requested_amount: number;
    approved_amount: number | null;
    status: string;
    submitted_at: string;
    approved_at?: string | null;
    financing_plans?: {
      name_ar: string;
      installments_count: number;
      duration_months: number;
    };
  };
  installments: Array<{
    id: string;
    installment_number: number;
    amount: number;
    due_date: string;
    status: string;
  }>;
  onContractSigned?: (signatureData: string) => void;
}

export default function FinancingContract({ 
  application, 
  installments, 
  onContractSigned 
}: FinancingContractProps) {
  const [isSigned, setIsSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);

  const handleSignature = (signature: string) => {
    setSignatureData(signature);
    setIsSigned(true);
    setShowSignature(false);
    toast.success("تم التوقيع على العقد بنجاح");
    onContractSigned?.(signature);
  };

  const handleDownloadContract = async () => {
    if (!isSigned || !signatureData) {
      toast.error("يجب توقيع العقد أولاً قبل التحميل");
      return;
    }

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
        installments: installments.map(inst => ({
          number: inst.installment_number,
          amount: inst.amount,
          dueDate: inst.due_date,
        })),
        signatureData,
        contractDate: application.approved_at || new Date().toISOString(),
      });
      toast.success("تم تحميل العقد بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل العقد");
    }
  };

  const contractDate = application.approved_at 
    ? format(new Date(application.approved_at), "dd MMMM yyyy", { locale: ar })
    : format(new Date(), "dd MMMM yyyy", { locale: ar });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      dir="rtl"
    >
      {/* Contract Header */}
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
              {/* First Party */}
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العنوان:</span>
                    <span className="font-medium">المملكة العربية السعودية</span>
                  </div>
                </div>
              </div>

              {/* Second Party */}
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">البريد الإلكتروني:</span>
                    <span className="font-medium">{application.email}</span>
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
                <span className="mr-2">يوافق الطرف الأول على تمويل الطرف الثاني بمبلغ <span className="font-bold text-emerald-500">{(application.approved_amount || application.requested_amount).toLocaleString()} ر.س</span> (فقط {numberToArabicWords(application.approved_amount || application.requested_amount)} ريال سعودي لا غير).</span>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <span className="font-bold text-primary">البند الثاني:</span>
                <span className="mr-2">يقر الطرف الثاني بأن التمويل سيُستخدم حصرياً لشراء خدمات من منصة ماكسيوكور، ولا يمكن سحبه نقداً أو تحويله.</span>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <span className="font-bold text-primary">البند الثالث:</span>
                <span className="mr-2">يلتزم الطرف الثاني بسداد مبلغ التمويل على <span className="font-bold">{application.financing_plans?.installments_count || 6} أقساط شهرية</span> متساوية، تُستحق في يوم 30 من كل شهر ميلادي.</span>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <span className="font-bold text-primary">البند الرابع:</span>
                <span className="mr-2">هذا التمويل بدون فوائد أو رسوم إضافية، بشرط الالتزام بمواعيد السداد المحددة.</span>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <span className="font-bold text-primary">البند الخامس:</span>
                <span className="mr-2">في حال تأخر السداد لمدة تتجاوز 30 يوماً، يحق للطرف الأول اتخاذ الإجراءات القانونية اللازمة.</span>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <span className="font-bold text-primary">البند السادس:</span>
                <span className="mr-2">يقر الطرف الثاني بصحة جميع البيانات المقدمة ويتحمل المسؤولية الكاملة في حال تقديم بيانات غير صحيحة.</span>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <span className="font-bold text-primary">البند السابع:</span>
                <span className="mr-2">يخضع هذا العقد للأنظمة والقوانين المعمول بها في المملكة العربية السعودية.</span>
              </div>
            </div>
          </div>

          {/* Installments Table */}
          {installments.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">جدول الأقساط</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-3 text-right font-bold">رقم القسط</th>
                      <th className="p-3 text-right font-bold">المبلغ</th>
                      <th className="p-3 text-right font-bold">تاريخ الاستحقاق</th>
                      <th className="p-3 text-right font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((inst) => (
                      <tr key={inst.id} className="border-b border-border/50">
                        <td className="p-3 font-bold">{inst.installment_number}</td>
                        <td className="p-3 font-mono">{inst.amount.toFixed(2)} ر.س</td>
                        <td className="p-3">{format(new Date(inst.due_date), "dd/MM/yyyy", { locale: ar })}</td>
                        <td className="p-3">
                          <Badge className={
                            inst.status === "paid" 
                              ? "bg-emerald-500/20 text-emerald-400" 
                              : inst.status === "overdue"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }>
                            {inst.status === "paid" ? "مدفوع" : inst.status === "overdue" ? "متأخر" : "قيد الانتظار"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-primary/10">
                      <td className="p-3 font-bold">الإجمالي</td>
                      <td className="p-3 font-bold text-primary font-mono">
                        {installments.reduce((sum, i) => sum + i.amount, 0).toFixed(2)} ر.س
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

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

          {/* Download Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleDownloadContract}
              disabled={!isSigned}
              size="lg"
              className={`${isSigned 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Download className="h-5 w-5 ml-2" />
              تحميل العقد PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper function to convert number to Arabic words
function numberToArabicWords(num: number): string {
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مئة", "مئتان", "ثلاثمئة", "أربعمئة", "خمسمئة", "ستمئة", "سبعمئة", "ثمانمئة", "تسعمئة"];
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    if (thousands === 1) return "ألف" + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
    if (thousands === 2) return "ألفان" + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
    if (thousands <= 10) return ones[thousands] + " آلاف" + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
    return thousands + " ألف" + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
  }
  
  if (num >= 100) {
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    return hundreds[h] + (remainder > 0 ? " و" + numberToArabicWords(remainder) : "");
  }
  
  if (num >= 10) {
    const t = Math.floor(num / 10);
    const o = num % 10;
    if (o === 0) return tens[t];
    return ones[o] + " و" + tens[t];
  }
  
  return ones[num];
}
