/**
 * Contract Screen - Digital Contract Signing
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  PenTool,
  FileText,
  Shield,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Download,
  FileSignature
} from "lucide-react";
import { toast } from "sonner";
import type { JourneyFormData } from "../FinancingJourneyWizard";

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
  const [acceptContract, setAcceptContract] = useState(false);
  const [acceptPromissory, setAcceptPromissory] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signedContract, setSignedContract] = useState(false);
  const [signedPromissory, setSignedPromissory] = useState(false);

  const handleSignContract = async () => {
    setIsSigning(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSignedContract(true);
    setIsSigning(false);
    toast.success("تم توقيع عقد التمويل بنجاح");
  };

  const handleSignPromissory = async () => {
    setIsSigning(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSignedPromissory(true);
    setIsSigning(false);
    toast.success("تم توقيع السند لأمر بنجاح");
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsProcessing(false);
    onSigned();
  };

  const canComplete = signedContract && signedPromissory;

  return (
    <div className="space-y-6">
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

      {/* Contract 1: Financing Agreement */}
      <Card className={signedContract ? "border-emerald-500/50 bg-emerald-500/5" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              عقد التمويل
            </div>
            {signedContract && (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-32 border rounded-lg p-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>عقد تمويل رقم: {applicationId?.slice(0, 8) || "FIN-XXXXX"}</strong></p>
              <p>بين الطرف الأول: MaxioCore للخدمات الرقمية</p>
              <p>والطرف الثاني: {formData.full_name}</p>
              <p>هوية رقم: {formData.national_id}</p>
              <Separator className="my-2" />
              <p>مبلغ التمويل: {approvedAmount.toLocaleString()} ريال سعودي</p>
              <p>الغرض: تمويل خدمات رقمية</p>
              <p>نسبة الفائدة: 0% (تمويل إسلامي)</p>
              <Separator className="my-2" />
              <p>يلتزم الطرف الثاني بسداد المبلغ وفق جدول الأقساط المتفق عليه...</p>
            </div>
          </ScrollArea>

          {!signedContract && (
            <>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept_contract"
                  checked={acceptContract}
                  onCheckedChange={(checked) => setAcceptContract(checked === true)}
                />
                <Label htmlFor="accept_contract" className="text-sm cursor-pointer">
                  قرأت وفهمت بنود عقد التمويل وأوافق عليها
                </Label>
              </div>

              <Button
                onClick={handleSignContract}
                disabled={!acceptContract || isSigning}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جارٍ التوقيع...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4 ml-2" />
                    توقيع العقد
                  </>
                )}
              </Button>
            </>
          )}

          {signedContract && (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400">
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

      {/* Contract 2: Promissory Note */}
      <Card className={signedPromissory ? "border-emerald-500/50 bg-emerald-500/5" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              السند لأمر
            </div>
            {signedPromissory && (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-32 border rounded-lg p-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-bold text-center">سند لأمر</p>
              <p>التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
              <p>المكان: المملكة العربية السعودية</p>
              <Separator className="my-2" />
              <p>أتعهد أنا الموقع أدناه:</p>
              <p>الاسم: {formData.full_name}</p>
              <p>رقم الهوية: {formData.national_id}</p>
              <p>بأن أدفع لأمر MaxioCore للخدمات الرقمية مبلغ وقدره:</p>
              <p className="font-bold text-lg text-center">{approvedAmount.toLocaleString()} ريال سعودي</p>
              <p>وذلك وفق جدول السداد المتفق عليه في عقد التمويل...</p>
            </div>
          </ScrollArea>

          {!signedPromissory && (
            <>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept_promissory"
                  checked={acceptPromissory}
                  onCheckedChange={(checked) => setAcceptPromissory(checked === true)}
                  disabled={!signedContract}
                />
                <Label 
                  htmlFor="accept_promissory" 
                  className={`text-sm cursor-pointer ${!signedContract ? "text-muted-foreground" : ""}`}
                >
                  قرأت وفهمت بنود السند لأمر وأوافق عليها
                </Label>
              </div>

              {!signedContract && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  يجب توقيع عقد التمويل أولاً
                </p>
              )}

              <Button
                onClick={handleSignPromissory}
                disabled={!acceptPromissory || !signedContract || isSigning}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جارٍ التوقيع...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4 ml-2" />
                    توقيع السند لأمر
                  </>
                )}
              </Button>
            </>
          )}

          {signedPromissory && (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400">
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
