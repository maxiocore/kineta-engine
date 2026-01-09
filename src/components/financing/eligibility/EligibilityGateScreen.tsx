// ============================================
// Eligibility Gate Screen - MaxioCore FinTech
// Displays eligibility status before application
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Lock,
  Unlock,
  Timer,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useEligibilityGate } from "@/hooks/useEligibilityGate";
import { RequiredItem, EligibilityLimits } from "@/lib/financing/eligibilityContract";
import { AnimatedButton } from "../application/animations/AnimatedButton";
import { AnimatedCard } from "../application/animations/AnimatedCard";

interface EligibilityGateScreenProps {
  onProceed: () => void;
  onBack: () => void;
}

// Status Configuration
const STATUS_CONFIG = {
  APPROVED: {
    icon: ShieldCheck,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-500",
    title: "تهانينا! أنت مؤهل للتمويل",
    subtitle: "جميع خيارات التمويل متاحة لك",
  },
  APPROVED_WITH_LIMITS: {
    icon: Shield,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-500",
    title: "مؤهل للتمويل مع بعض القيود",
    subtitle: "بعض الخيارات محدودة بناءً على ملفك",
  },
  MANUAL_REVIEW: {
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    gradientFrom: "from-blue-500",
    gradientTo: "to-indigo-500",
    title: "طلبك يحتاج مراجعة إضافية",
    subtitle: "يمكنك إرسال الطلب وسنراجعه خلال 24-48 ساعة",
  },
  SOFT_DECLINE: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    gradientFrom: "from-orange-500",
    gradientTo: "to-red-500",
    title: "غير مؤهل حالياً",
    subtitle: "يمكنك المحاولة مرة أخرى بعد استكمال المتطلبات",
  },
  HARD_DECLINE: {
    icon: ShieldX,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    gradientFrom: "from-red-500",
    gradientTo: "to-rose-600",
    title: "عذراً، لا يمكن المتابعة",
    subtitle: "لم تستوفِ متطلبات الأهلية للتمويل",
  },
};

export function EligibilityGateScreen({ onProceed, onBack }: EligibilityGateScreenProps) {
  const navigate = useNavigate();
  const {
    gateResult,
    isLoading,
    isExpired,
    status,
    canApply,
    isApproved,
    isApprovedWithLimits,
    isManualReview,
    isSoftDecline,
    isHardDecline,
    limits,
    maxAmount,
    maxTenor,
    getLimitationsMessage,
    getDeclineMessage,
    getRequiredItems,
    canRetry,
    getRetryDate,
    refreshGate,
  } = useEligibilityGate();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!gateResult || !status) {
    return <NoEligibilityCheck onCheck={() => navigate('/dashboard/financing/eligibility-check')} onBack={onBack} />;
  }

  if (isExpired) {
    return <ExpiredState onRefresh={refreshGate} onBack={onBack} />;
  }

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          className={`inline-flex p-4 rounded-full ${config.bgColor} ${config.borderColor} border-2`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <Icon className={`h-12 w-12 ${config.color}`} />
        </motion.div>

        <motion.h2
          className="text-2xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {config.title}
        </motion.h2>

        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {config.subtitle}
        </motion.p>
      </div>

      {/* Status-specific content */}
      <AnimatePresence mode="wait">
        {(isApproved || isApprovedWithLimits) && (
          <ApprovedContent
            key="approved"
            isLimited={isApprovedWithLimits}
            limits={limits}
            maxAmount={maxAmount}
            maxTenor={maxTenor}
            tier={gateResult.decision?.tier || 'bronze'}
            limitationsMessage={getLimitationsMessage()}
            onProceed={onProceed}
          />
        )}

        {isManualReview && (
          <ManualReviewContent
            key="manual-review"
            onProceed={onProceed}
          />
        )}

        {isSoftDecline && (
          <SoftDeclineContent
            key="soft-decline"
            message={getDeclineMessage()}
            requiredItems={getRequiredItems()}
            retryDate={getRetryDate()}
            canRetry={canRetry()}
            onRefresh={refreshGate}
          />
        )}

        {isHardDecline && (
          <HardDeclineContent
            key="hard-decline"
            message={getDeclineMessage()}
          />
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      <motion.div
        className="flex gap-3 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <AnimatedButton
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4 ml-2" />
          رجوع
        </AnimatedButton>

        {canApply && (
          <AnimatedButton
            onClick={onProceed}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500"
          >
            متابعة الطلب
            <ArrowRight className="h-4 w-4 mr-2" />
          </AnimatedButton>
        )}

        {(isSoftDecline || isHardDecline) && (
          <AnimatedButton
            variant="outline"
            onClick={() => navigate('/dashboard/support')}
            className="flex-1"
          >
            <HelpCircle className="h-4 w-4 ml-2" />
            تواصل مع الدعم
          </AnimatedButton>
        )}
      </motion.div>
    </motion.div>
  );
}

// Sub-components

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <motion.div
        className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-muted-foreground">جاري التحقق من الأهلية...</p>
    </div>
  );
}

function NoEligibilityCheck({ onCheck, onBack }: { onCheck: () => void; onBack: () => void }) {
  return (
    <motion.div
      className="text-center space-y-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="inline-flex p-4 rounded-full bg-muted">
        <Shield className="h-12 w-12 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">فحص الأهلية مطلوب</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          يجب إجراء فحص الأهلية قبل المتابعة في طلب التمويل. هذا الفحص سريع ويستغرق أقل من دقيقة.
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <Button onClick={onCheck} className="bg-gradient-to-r from-emerald-500 to-teal-500">
          ابدأ فحص الأهلية
          <ArrowRight className="h-4 w-4 mr-2" />
        </Button>
      </div>
    </motion.div>
  );
}

function ExpiredState({ onRefresh, onBack }: { onRefresh: () => void; onBack: () => void }) {
  return (
    <motion.div
      className="text-center space-y-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="inline-flex p-4 rounded-full bg-amber-500/10">
        <Timer className="h-12 w-12 text-amber-500" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">انتهت صلاحية التحقق</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          انتهت صلاحية نتيجة فحص الأهلية السابق. يرجى إعادة الفحص للمتابعة.
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <Button onClick={onRefresh} className="bg-gradient-to-r from-blue-500 to-indigo-500">
          <RefreshCw className="h-4 w-4 ml-2" />
          إعادة الفحص
        </Button>
      </div>
    </motion.div>
  );
}

interface ApprovedContentProps {
  isLimited: boolean;
  limits: EligibilityLimits | null;
  maxAmount: number;
  maxTenor: number;
  tier: string;
  limitationsMessage: string;
  onProceed: () => void;
}

function ApprovedContent({
  isLimited,
  limits,
  maxAmount,
  maxTenor,
  tier,
  limitationsMessage,
}: ApprovedContentProps) {
  const tierConfig = {
    platinum: { label: 'بلاتيني', color: 'from-slate-300 to-slate-500', icon: '💎' },
    gold: { label: 'ذهبي', color: 'from-yellow-400 to-amber-500', icon: '🥇' },
    silver: { label: 'فضي', color: 'from-gray-300 to-gray-400', icon: '🥈' },
    bronze: { label: 'برونزي', color: 'from-orange-400 to-orange-600', icon: '🥉' },
  };

  const currentTier = tierConfig[tier as keyof typeof tierConfig] || tierConfig.bronze;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Tier Badge */}
      <Card className={`border-2 overflow-hidden`}>
        <div className={`h-2 bg-gradient-to-r ${currentTier.color}`} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentTier.icon}</span>
              <div>
                <p className="font-bold">مستوى {currentTier.label}</p>
                <p className="text-sm text-muted-foreground">بناءً على تقييم ملفك</p>
              </div>
            </div>
            {isLimited && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                <Lock className="h-3 w-3 ml-1" />
                محدود
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Limits Display */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Unlock className="h-4 w-4 text-emerald-500" />
            الحدود المتاحة لك
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {maxAmount.toLocaleString('ar-SA')}
              </p>
              <p className="text-sm text-muted-foreground">ر.س الحد الأقصى</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{maxTenor}</p>
              <p className="text-sm text-muted-foreground">شهر أقصى مدة</p>
            </div>
          </div>

          {limits && (
            <div className="space-y-2">
              <p className="text-sm font-medium">أنواع التمويل المتاحة:</p>
              <div className="flex flex-wrap gap-2">
                {limits.availableProducts.includes('personal') && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    شخصي
                  </Badge>
                )}
                {limits.availableProducts.includes('business') ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    أعمال
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600">
                    <XCircle className="h-3 w-3 ml-1" />
                    أعمال
                  </Badge>
                )}
                {limits.availableProducts.includes('service') ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    خدمات
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600">
                    <XCircle className="h-3 w-3 ml-1" />
                    خدمات
                  </Badge>
                )}
              </div>
            </div>
          )}

          {isLimited && limitationsMessage && (
            <div className="bg-amber-500/10 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 inline ml-2" />
              {limitationsMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ManualReviewContent({ onProceed }: { onProceed: () => void }) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-blue-500/30">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-blue-500/10">
              <FileCheck className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">ماذا يعني هذا؟</h3>
              <p className="text-sm text-muted-foreground mt-1">
                طلبك يحتاج مراجعة يدوية من فريقنا. يمكنك إكمال الطلب الآن وسنراجعه خلال 24-48 ساعة عمل.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">ما المتوقع:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                يمكنك إكمال وإرسال الطلب الآن
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                سيتم مراجعة طلبك خلال 24-48 ساعة
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ستصلك رسالة بالنتيجة على جوالك
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SoftDeclineContentProps {
  message: string;
  requiredItems: RequiredItem[];
  retryDate: Date | null;
  canRetry: boolean;
  onRefresh: () => void;
}

function SoftDeclineContent({
  message,
  requiredItems,
  retryDate,
  canRetry,
  onRefresh,
}: SoftDeclineContentProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-orange-500/30">
        <CardContent className="p-4">
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>

      {requiredItems.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">المطلوب لإعادة المحاولة:</h3>
            <div className="space-y-3">
              {requiredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    item.isCompleted 
                      ? 'bg-emerald-500/5 border-emerald-500/30' 
                      : 'bg-muted/50 border-border'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.titleAr}</p>
                    <p className="text-xs text-muted-foreground">{item.descriptionAr}</p>
                  </div>
                  {item.actionUrl && !item.isCompleted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(item.actionUrl!)}
                    >
                      <ExternalLink className="h-3 w-3 ml-1" />
                      إكمال
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {retryDate && (
        <Card className="border-amber-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Timer className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">يمكنك إعادة المحاولة بعد:</p>
              <p className="text-lg font-bold text-amber-600">
                {retryDate.toLocaleDateString('ar-SA', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {canRetry && !retryDate && (
        <AnimatedButton
          onClick={onRefresh}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 ml-2" />
          إعادة فحص الأهلية
        </AnimatedButton>
      )}
    </motion.div>
  );
}

function HardDeclineContent({ message }: { message: string }) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-red-500/30">
        <CardContent className="p-4 space-y-4">
          <p className="text-muted-foreground">{message}</p>

          <div className="bg-red-500/5 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              لماذا تم الرفض؟
            </p>
            <p className="text-xs text-muted-foreground">
              لأسباب أمنية، لا يمكننا الإفصاح عن التفاصيل الكاملة. إذا كنت تعتقد أن هذا خطأ،
              يرجى التواصل مع فريق الدعم.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">ماذا يمكنك فعله؟</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              تواصل مع فريق الدعم للاستفسار
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              تصفح خدماتنا الأخرى التي لا تتطلب تمويل
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              حسّن ملفك وأعد المحاولة بعد 30 يوماً
            </li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
