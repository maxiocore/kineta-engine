/**
 * Contract Screen - Digital Contract Signing
 * يستخدم العقد الجديد المتكامل ServiceFinancingContractViewer
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  PenTool,
  FileText,
  Shield,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Download,
  FileSignature,
  ScrollText
} from "lucide-react";
import { toast } from "sonner";
import type { JourneyFormData } from "../FinancingJourneyWizard";
import { ServiceFinancingContractViewer } from "@/components/financing/contract/ServiceFinancingContractViewer";
import { 
  type ContractPlaceholders,
  type ContractApprovalRecord,
  type InstallmentItem
} from "@/lib/financing/serviceFinancingContract";
import { COMPANY_INFO } from "@/lib/financing/serviceFinancingPolicy";

interface ContractScreenProps {
  formData: JourneyFormData;
  updateFormData: (updates: Partial<JourneyFormData>) => void;
  goNext: () => void;
  goBack: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  applicationId: string | null;
  approvedAmount: number;
  onSigned: () => void;
}

export function ContractScreen({ 
  formData,
  applicationId,
  approvedAmount,
  isProcessing,
  setIsProcessing,
  onSigned
}: ContractScreenProps) {
  const [contractApproved, setContractApproved] = useState(false);
  const [promissoryApproved, setPromissoryApproved] = useState(false);
  const [acceptPromissory, setAcceptPromissory] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // تحويل البيانات إلى صيغة العقد الجديد
  const contractData = useMemo<ContractPlaceholders>(() => {
    const today = new Date();
    // استخدام 6 أقساط كافتراضي
    const installmentsCount = 6;
    const installmentAmount = approvedAmount / installmentsCount;
    
    // إنشاء جدول الأقساط
    const installmentsSchedule: InstallmentItem[] = Array.from(
      { length: installmentsCount },
      (_, i) => {
        const dueDate = new Date(today);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        return {
          number: i + 1,
          amount: installmentAmount,
          dueDate: dueDate.toLocaleDateString('ar-SA'),
          status: 'pending' as const,
        };
      }
    );

    const firstDueDate = new Date(today);
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    
    const lastDueDate = new Date(today);
    lastDueDate.setMonth(lastDueDate.getMonth() + installmentsCount);

    return {
      // بيانات العميل
      customer_name: formData.full_name,
      customer_national_id: formData.national_id,
      customer_phone: formData.phone,
      customer_email: formData.email,
      customer_address: formData.address,

      // بيانات الطلب
      order_id: applicationId || `ORD-${Date.now()}`,
      application_number: applicationId?.slice(0, 8).toUpperCase() || `FIN-${Date.now().toString().slice(-6)}`,
      application_date: today.toLocaleDateString('ar-SA'),

      // تفاصيل الخدمات
      services_table: [
        {
          name: "تمويل خدمات رقمية",
          description: formData.service_description || "خدمات رقمية متنوعة",
          price: approvedAmount,
          quantity: 1,
          total: approvedAmount,
        }
      ],
      total_services_value: approvedAmount,

      // تفاصيل التمويل
      admin_fees: 0,
      vat_amount: approvedAmount * 0.15,
      total_amount: approvedAmount * 1.15,
      down_payment: 0,
      financed_amount: approvedAmount * 1.15,

      // تفاصيل الأقساط
      installments_count: installmentsCount,
      installment_amount: (approvedAmount * 1.15) / installmentsCount,
      first_due_date: firstDueDate.toLocaleDateString('ar-SA'),
      last_due_date: lastDueDate.toLocaleDateString('ar-SA'),
      
      // جدول الأقساط
      installments_schedule: installmentsSchedule,

      // مزود الخدمة
      service_provider: COMPANY_INFO.name,
      service_provider_cr: undefined, // السجل التجاري غير متوفر حالياً
    };
  }, [formData, applicationId, approvedAmount]);

  // معالجة اعتماد العقد
  const handleContractApproval = async (record: ContractApprovalRecord) => {
    setContractApproved(true);
    toast.success("تم اعتماد عقد التمويل بنجاح", {
      description: `رقم العقد: ${record.contract_id}`,
    });
  };

  // معالجة توقيع السند لأمر
  const handleSignPromissory = async () => {
    setIsSigning(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPromissoryApproved(true);
    setIsSigning(false);
    toast.success("تم توقيع السند لأمر بنجاح");
  };

  // إتمام العملية
  const handleComplete = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsProcessing(false);
    onSigned();
  };

  const canComplete = contractApproved && promissoryApproved;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <PenTool className="h-10 w-10 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">توقيع العقود</h2>
        <p className="text-muted-foreground">وقّع على عقد التمويل والسند لأمر لإتمام العملية</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
          contractApproved ? 'bg-emerald-500/20 text-emerald-600' : 'bg-primary/10 text-primary'
        }`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
            contractApproved ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
          }`}>
            {contractApproved ? <CheckCircle2 className="w-4 h-4" /> : '1'}
          </span>
          <span className="font-medium">عقد التمويل</span>
        </div>
        <div className="h-0.5 w-8 bg-muted" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
          promissoryApproved ? 'bg-emerald-500/20 text-emerald-600' : contractApproved ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
            promissoryApproved ? 'bg-emerald-500 text-white' : contractApproved ? 'bg-primary text-white' : 'bg-muted-foreground/20 text-muted-foreground'
          }`}>
            {promissoryApproved ? <CheckCircle2 className="w-4 h-4" /> : '2'}
          </span>
          <span className="font-medium">السند لأمر</span>
        </div>
      </div>

      {/* Contract 1: Service Financing Contract (New) */}
      {!contractApproved ? (
        <ServiceFinancingContractViewer
          contractData={contractData}
          applicationId={applicationId || ''}
          userId={formData.national_id}
          onApprove={handleContractApproval}
          isSubmitting={isSigning}
        />
      ) : (
        <Card className="border-emerald-500/50 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-emerald-500" />
                عقد تمويل الخدمات
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                تم الاعتماد
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">تم اعتماد العقد بنجاح</span>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-1" />
                تحميل PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract 2: Promissory Note */}
      <Card className={promissoryApproved ? "border-emerald-500/50 bg-emerald-500/5" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              السند لأمر
            </div>
            {promissoryApproved && (
              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                تم التوقيع
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Non-Cash Financing Notice */}
          <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  ⚠️ تنبيه مهم: تمويل خدمات فقط
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  هذا السند ضمان لعقد تمويل خدمات وليس تمويلاً نقدياً.
                  <strong className="text-foreground"> لن يتم صرف أي مبلغ للعميل.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Promissory Note Content */}
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <div className="text-center border-b pb-4">
              <h3 className="text-xl font-bold">سند لأمر</h3>
              <p className="text-sm text-muted-foreground mt-1">
                التاريخ: {new Date().toLocaleDateString('ar-SA')}
              </p>
              <p className="text-sm text-muted-foreground">
                المكان: المملكة العربية السعودية
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <p className="leading-relaxed">
                أتعهد أنا الموقع أدناه <strong>{formData.full_name}</strong> صاحب/صاحبة 
                الهوية الوطنية رقم <strong>{formData.national_id}</strong>
              </p>
              <p className="leading-relaxed">
                بأن أدفع لأمر <strong>{COMPANY_INFO.name}</strong> أو لحامله مبلغاً وقدره:
              </p>
              <div className="text-center py-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-3xl font-bold text-primary">
                  {(approvedAmount * 1.15).toLocaleString('ar-SA')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">ريال سعودي</p>
                <p className="text-xs text-muted-foreground mt-2">
                  ({numberToArabicWords(Math.round(approvedAmount * 1.15))} ريال سعودي لا غير)
                </p>
              </div>
              <p className="leading-relaxed">
                وذلك وفق جدول السداد المتفق عليه في عقد تمويل الخدمات رقم 
                <strong className="mx-1">{contractData.application_number}</strong>
                على <strong>{contractData.installments_count}</strong> قسط شهري متساوي،
                قيمة كل قسط <strong>{contractData.installment_amount.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س</strong>.
              </p>
              <p className="text-xs text-muted-foreground border-t pt-3">
                هذا السند قابل للتحويل والتظهير وخاضع لنظام الأوراق التجارية السعودي.
              </p>
            </div>
          </div>

          {!promissoryApproved && (
            <>
              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
                <Checkbox
                  id="accept_promissory"
                  checked={acceptPromissory}
                  onCheckedChange={(checked) => setAcceptPromissory(checked === true)}
                  disabled={!contractApproved}
                  className="mt-1"
                />
                <Label 
                  htmlFor="accept_promissory" 
                  className={`text-sm cursor-pointer leading-relaxed ${!contractApproved ? "text-muted-foreground" : ""}`}
                >
                  <span className="font-bold">✓ أوافق على السند لأمر</span>
                  <br />
                  <span className="text-muted-foreground text-xs">
                    أقر بأنني قرأت وفهمت بنود السند لأمر، وأتعهد بالسداد وفق الجدول المتفق عليه في عقد التمويل.
                  </span>
                </Label>
              </div>

              {!contractApproved && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 px-2">
                  <AlertTriangle className="h-3 w-3" />
                  يجب اعتماد عقد التمويل أولاً
                </p>
              )}

              <Button
                onClick={handleSignPromissory}
                disabled={!acceptPromissory || !contractApproved || isSigning}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    جارٍ التوقيع...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-5 w-5 ml-2" />
                    توقيع السند لأمر
                  </>
                )}
              </Button>
            </>
          )}

          {promissoryApproved && (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">تم التوقيع بنجاح</span>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-1" />
                تحميل
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Button */}
      <Button
        onClick={handleComplete}
        disabled={!canComplete || isProcessing}
        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
            جارٍ إنهاء الطلب...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5 ml-2" />
            إنهاء وتفعيل التمويل
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * تحويل الأرقام إلى كلمات عربية
 */
function numberToArabicWords(num: number): string {
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشر', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const thousands = ['', 'ألف', 'ألفان', 'ثلاثة آلاف', 'أربعة آلاف', 'خمسة آلاف', 'ستة آلاف', 'سبعة آلاف', 'ثمانية آلاف', 'تسعة آلاف'];
  const tenThousands = ['', 'عشرة آلاف', 'عشرون ألف', 'ثلاثون ألف', 'أربعون ألف', 'خمسون ألف', 'ستون ألف', 'سبعون ألف', 'ثمانون ألف', 'تسعون ألف'];
  const hundredThousands = ['', 'مائة ألف', 'مائتا ألف', 'ثلاثمائة ألف', 'أربعمائة ألف', 'خمسمائة ألف', 'ستمائة ألف', 'سبعمائة ألف', 'ثمانمائة ألف', 'تسعمائة ألف'];

  if (num === 0) return 'صفر';
  if (num >= 1000000) return num.toLocaleString('ar-SA');

  let words = '';
  
  // مئات الآلاف
  const hThousand = Math.floor(num / 100000);
  if (hThousand > 0) {
    words += hundredThousands[hThousand] + ' ';
    num %= 100000;
  }
  
  // عشرات الآلاف
  const tThousand = Math.floor(num / 10000);
  if (tThousand > 0) {
    words += tenThousands[tThousand] + ' ';
    num %= 10000;
  }
  
  // الآلاف
  const thousand = Math.floor(num / 1000);
  if (thousand > 0) {
    if (thousands[thousand]) {
      words += (words ? 'و' : '') + thousands[thousand] + ' ';
    }
    num %= 1000;
  }
  
  // المئات
  const hundred = Math.floor(num / 100);
  if (hundred > 0) {
    words += (words ? 'و' : '') + hundreds[hundred] + ' ';
    num %= 100;
  }
  
  // العشرات والآحاد
  if (num >= 10 && num <= 19) {
    words += (words ? 'و' : '') + teens[num - 10];
  } else {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    if (one > 0) {
      words += (words ? 'و' : '') + ones[one];
    }
    if (ten > 0) {
      words += (one > 0 ? ' و' : (words ? 'و' : '')) + tens[ten];
    }
  }
  
  return words.trim() || num.toString();
}
