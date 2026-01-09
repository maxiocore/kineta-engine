/**
 * Step 8: Result / Status
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { 
  CheckCircle2,
  Clock,
  XCircle,
  FileSearch,
  Home,
  RefreshCw,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface ResultStepProps {
  data: LoanApplicationData;
  onReset: () => void;
}

const STATUS_CONFIG = {
  submitted: {
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    title: "تم استلام طلبك",
    description: "طلبك قيد المراجعة من قبل فريقنا المختص. ستتلقى إشعاراً عند تحديث الحالة.",
    badge: "قيد المراجعة",
    badgeVariant: "secondary" as const,
  },
  approved: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    title: "تمت الموافقة! 🎉",
    description: "تهانينا! تمت الموافقة على طلب التمويل الخاص بك.",
    badge: "موافق عليه",
    badgeVariant: "default" as const,
  },
  rejected: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    title: "لم تتم الموافقة",
    description: "للأسف، لم نتمكن من الموافقة على طلبك في الوقت الحالي. يمكنك المحاولة مرة أخرى لاحقاً.",
    badge: "مرفوض",
    badgeVariant: "destructive" as const,
  },
  under_review: {
    icon: FileSearch,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    title: "يتطلب مراجعة إضافية",
    description: "نحتاج لبعض الوقت لمراجعة طلبك بشكل أدق. سنتواصل معك قريباً.",
    badge: "مراجعة إضافية",
    badgeVariant: "outline" as const,
  },
  draft: {
    icon: Clock,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    title: "مسودة",
    description: "لم يتم إرسال الطلب بعد.",
    badge: "مسودة",
    badgeVariant: "outline" as const,
  },
};

export function ResultStep({ data, onReset }: ResultStepProps) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[data.status] || STATUS_CONFIG.submitted;
  const StatusIcon = config.icon;

  // Celebration effect for approved
  useEffect(() => {
    if (data.status === "approved") {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10b981", "#14b8a6", "#06b6d4"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10b981", "#14b8a6", "#06b6d4"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [data.status]);

  const copyApplicationId = () => {
    if (data.applicationId) {
      navigator.clipboard.writeText(data.applicationId);
      toast.success("تم نسخ رقم الطلب");
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${config.bgColor} mx-auto`}
        >
          <StatusIcon className={`w-10 h-10 ${config.color}`} />
        </motion.div>

        <div>
          <Badge variant={config.badgeVariant} className="mb-2">
            {config.badge}
          </Badge>
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {config.description}
          </p>
        </div>
      </motion.div>

      {/* Application Details */}
      {data.applicationId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`${config.bgColor} ${config.borderColor} border`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">رقم الطلب</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyApplicationId}
                  className="h-7 text-xs gap-1"
                >
                  <Copy className="w-3 h-3" />
                  نسخ
                </Button>
              </div>
              <p className="font-mono text-lg font-bold text-center bg-background/50 py-2 rounded">
                {data.applicationId.slice(0, 8).toUpperCase()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">ملخص الطلب</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">مبلغ التمويل</span>
                <span className="font-semibold">{formatAmount(data.amount)} ر.س</span>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">مدة السداد</span>
                <span className="font-semibold">{data.tenorMonths} شهر</span>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 bg-primary/10 rounded-lg">
                <span className="text-sm text-muted-foreground">القسط الشهري</span>
                <span className="font-bold text-primary">{formatAmount(data.monthlyInstallment)} ر.س</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <Button
          onClick={() => navigate("/dashboard/financing")}
          className="w-full h-12 gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>متابعة حالة الطلب</span>
        </Button>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex-1 h-10 gap-2"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={onReset}
            className="flex-1 h-10 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>طلب جديد</span>
          </Button>
        </div>
      </motion.div>

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-sm text-muted-foreground"
      >
        <p>
          لديك استفسار؟{" "}
          <a href="/dashboard/support" className="text-primary underline">
            تواصل مع الدعم الفني
          </a>
        </p>
      </motion.div>
    </div>
  );
}
