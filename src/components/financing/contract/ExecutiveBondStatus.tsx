/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *                   حالة السند التنفيذي - Executive Bond Status
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * هذا المكون يعرض حالة السند التنفيذي للعميل
 * السند يُصدر إدارياً عبر منصة نافذ بعد اعتماد العقد
 * 
 * ⚠️ لا يوجد كمبيالة - السند التنفيذي فقط عبر نافذ
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  FileSignature,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Shield,
  Building2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  ExecutiveBondState,
  EXECUTIVE_BOND_STATE_DEFINITIONS,
} from "@/lib/financing/stateMachine/contractStates";
import { FORMAL_UI_MESSAGES, LEGAL_COMPANY_INFO } from "@/lib/financing/legalContractContent";

// ============================================
// Props Interface
// ============================================

interface ExecutiveBondStatusProps {
  bondState: ExecutiveBondState;
  applicationId: string;
  applicationNumber: string;
  contractNumber?: string;
  amount: number;
  clientName: string;
  nafazLink?: string;
  onConfirmSigned?: () => void;
  isConfirming?: boolean;
}

// ============================================
// Main Component
// ============================================

export function ExecutiveBondStatus({
  bondState,
  applicationId,
  applicationNumber,
  contractNumber,
  amount,
  clientName,
  nafazLink,
  onConfirmSigned,
  isConfirming = false,
}: ExecutiveBondStatusProps) {
  const stateDef = EXECUTIVE_BOND_STATE_DEFINITIONS[bondState];
  
  // حساب نسبة التقدم
  const getProgress = (): number => {
    switch (bondState) {
      case "NOT_ISSUED": return 0;
      case "ISSUING": return 33;
      case "ISSUED": return 66;
      case "SIGNED_BY_CLIENT": return 100;
      default: return 0;
    }
  };

  const getStatusColor = (): string => {
    switch (stateDef.color) {
      case "gray": return "bg-gray-500";
      case "blue": return "bg-blue-500";
      case "yellow": return "bg-yellow-500";
      case "green": return "bg-green-500";
      case "orange": return "bg-orange-500";
      case "purple": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getIcon = () => {
    switch (bondState) {
      case "NOT_ISSUED": return <Clock className="w-6 h-6" />;
      case "ISSUING": return <Loader2 className="w-6 h-6 animate-spin" />;
      case "ISSUED": return <FileSignature className="w-6 h-6" />;
      case "SIGNED_BY_CLIENT": return <CheckCircle2 className="w-6 h-6" />;
      default: return <Clock className="w-6 h-6" />;
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
    }).format(value);
  };

  // ════════════════ Render ════════════════
  return (
    <div className="space-y-4" dir="rtl">
      {/* ═══════════ Header Card ═══════════ */}
      <Card className={`border-2 ${bondState === "SIGNED_BY_CLIENT" ? "border-green-500" : "border-purple-500"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${getStatusColor()} text-white`}>
                {getIcon()}
              </div>
              <div>
                <CardTitle className="text-lg font-bold">السند التنفيذي</CardTitle>
                <p className="text-sm text-muted-foreground">
                  عبر منصة نافذ الرسمية
                </p>
              </div>
            </div>
            <Badge className={`${getStatusColor()} text-white`}>
              {stateDef.nameAr}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">تقدم العملية</span>
              <span className="font-medium">{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>

          {/* Timeline Steps */}
          <div className="flex items-center justify-between py-4">
            <TimelineStep 
              label="اعتماد العقد" 
              completed={bondState !== "NOT_ISSUED"} 
              active={bondState === "NOT_ISSUED"}
            />
            <TimelineConnector completed={bondState !== "NOT_ISSUED"} />
            <TimelineStep 
              label="إصدار السند" 
              completed={bondState === "ISSUED" || bondState === "SIGNED_BY_CLIENT"} 
              active={bondState === "ISSUING"}
            />
            <TimelineConnector completed={bondState === "ISSUED" || bondState === "SIGNED_BY_CLIENT"} />
            <TimelineStep 
              label="توقيع العميل" 
              completed={bondState === "SIGNED_BY_CLIENT"} 
              active={bondState === "ISSUED"}
            />
            <TimelineConnector completed={bondState === "SIGNED_BY_CLIENT"} />
            <TimelineStep 
              label="التفعيل" 
              completed={bondState === "SIGNED_BY_CLIENT"} 
              active={false}
            />
          </div>

          <Separator />

          {/* Bond Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">رقم الطلب</p>
              <p className="font-mono font-bold">{applicationNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">رقم العقد</p>
              <p className="font-mono font-bold">{contractNumber || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المبلغ</p>
              <p className="font-bold text-primary">{formatCurrency(amount)} ر.س</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">اسم العميل</p>
              <p className="font-bold">{clientName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ State-Specific Content ═══════════ */}
      {bondState === "NOT_ISSUED" && (
        <Alert className="border-gray-500/30 bg-gray-500/5">
          <Clock className="h-5 w-5 text-gray-500" />
          <AlertTitle className="font-bold">{stateDef.nameAr}</AlertTitle>
          <AlertDescription>
            <p>{stateDef.userMessage}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              سيتم إصدار السند التنفيذي بواسطة الإدارة عبر منصة نافذ.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {bondState === "ISSUING" && (
        <Alert className="border-blue-500/30 bg-blue-500/5">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          <AlertTitle className="font-bold">{FORMAL_UI_MESSAGES.bondIssuingTitle}</AlertTitle>
          <AlertDescription>
            <p>{FORMAL_UI_MESSAGES.bondIssuingMessage}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              ستصلك رسالة نصية عند جاهزية السند للتوقيع.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {bondState === "ISSUED" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Alert className="border-orange-500/30 bg-orange-500/5">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <AlertTitle className="font-bold">{FORMAL_UI_MESSAGES.bondIssuedTitle}</AlertTitle>
            <AlertDescription>
              <p className="mb-3">{FORMAL_UI_MESSAGES.bondIssuedMessage}</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>ادخل إلى منصة نافذ</li>
                <li>ابحث عن السند التنفيذي باسمك</li>
                <li>راجع تفاصيل السند</li>
                <li>وقّع إلكترونياً</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Nafaz Link Button */}
          <Card className="border-2 border-orange-500">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <FileSignature className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1 text-center sm:text-right">
                  <h4 className="font-bold text-lg">{FORMAL_UI_MESSAGES.signBondButton}</h4>
                  <p className="text-sm text-muted-foreground">
                    اضغط على الزر للانتقال إلى منصة نافذ وتوقيع السند
                  </p>
                </div>
                <Button 
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                  onClick={() => {
                    if (nafazLink) {
                      window.open(nafazLink, "_blank");
                    } else {
                      window.open("https://nafath.sa", "_blank");
                    }
                  }}
                >
                  <ExternalLink className="w-5 h-5 ml-2" />
                  الذهاب إلى نافذ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Confirm Signed Button */}
          {onConfirmSigned && (
            <Card className="border-dashed border-2 border-green-500">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1 text-center sm:text-right">
                    <h4 className="font-bold text-lg">هل أتممت التوقيع؟</h4>
                    <p className="text-sm text-muted-foreground">
                      إذا وقّعت السند التنفيذي عبر نافذ، اضغط هنا للتأكيد
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-500/10 w-full sm:w-auto"
                    onClick={onConfirmSigned}
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                        جاري التحقق...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 ml-2" />
                        {FORMAL_UI_MESSAGES.confirmBondSigned}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {bondState === "SIGNED_BY_CLIENT" && (
        <Alert className="border-green-500/30 bg-green-500/5">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <AlertTitle className="font-bold text-green-600">{FORMAL_UI_MESSAGES.bondSignedTitle}</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            <p>{FORMAL_UI_MESSAGES.bondSignedMessage}</p>
            <p className="mt-2 font-semibold">
              سيتم تفعيل رصيد الخدمات في حسابك قريباً.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* ═══════════ Nafaz Info ═══════════ */}
      <Card className="border-muted bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">ما هو السند التنفيذي عبر نافذ؟</p>
              <p>
                نافذ هي منصة وزارة العدل السعودية لإصدار السندات التنفيذية إلكترونياً.
                السند التنفيذي يُعتبر ورقة رسمية قابلة للتنفيذ الجبري في حال التأخر عن السداد.
              </p>
              <a 
                href="https://nafath.sa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                زيارة منصة نافذ
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Timeline Components
// ============================================

function TimelineStep({ 
  label, 
  completed, 
  active 
}: { 
  label: string; 
  completed: boolean; 
  active: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        completed 
          ? "bg-green-500 text-white" 
          : active 
            ? "bg-primary text-white animate-pulse" 
            : "bg-muted text-muted-foreground"
      }`}>
        {completed ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : active ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
      </div>
      <span className={`text-xs mt-1 text-center max-w-[60px] ${
        completed ? "text-green-600 font-medium" : active ? "text-primary font-medium" : "text-muted-foreground"
      }`}>
        {label}
      </span>
    </div>
  );
}

function TimelineConnector({ completed }: { completed: boolean }) {
  return (
    <div className={`flex-1 h-0.5 mx-1 transition-colors ${
      completed ? "bg-green-500" : "bg-muted"
    }`} />
  );
}

export default ExecutiveBondStatus;
