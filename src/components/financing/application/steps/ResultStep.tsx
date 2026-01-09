/**
 * Step 8: Application Result & Status Timeline
 * Post-submission experience with animated timeline
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  ExternalLink,
  Bell,
  MessageSquare,
  FileText,
  CreditCard,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  Timer,
  Shield,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
import type { LoanApplicationData } from "../LoanApplicationWizard";

interface ResultStepProps {
  data: LoanApplicationData;
  onReset: () => void;
}

// Timeline Step Definition
interface TimelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "completed" | "current" | "pending" | "failed";
  estimatedTime?: string;
  completedAt?: string;
}

// Status Configuration
const STATUS_CONFIG = {
  submitted: {
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    title: "تم استلام طلبك بنجاح! ✨",
    description: "شكراً لك! طلبك الآن قيد المراجعة من قبل فريقنا المتخصص.",
    badge: "قيد المراجعة",
    badgeVariant: "secondary" as const,
    activeStep: "received",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    title: "تمت الموافقة على طلبك! 🎉",
    description: "تهانينا! تمت الموافقة على طلب التمويل الخاص بك بالكامل.",
    badge: "موافق عليه",
    badgeVariant: "default" as const,
    activeStep: "approved",
  },
  approved_with_limits: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    title: "تمت الموافقة مع تعديلات",
    description: "تمت الموافقة على طلبك بمبلغ أو شروط معدّلة. راجع التفاصيل أدناه.",
    badge: "موافق جزئياً",
    badgeVariant: "outline" as const,
    activeStep: "approved",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    title: "لم تتم الموافقة",
    description: "للأسف، لم نتمكن من الموافقة على طلبك حالياً. يمكنك المحاولة مرة أخرى.",
    badge: "مرفوض",
    badgeVariant: "destructive" as const,
    activeStep: "declined",
  },
  under_review: {
    icon: FileSearch,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    title: "طلبك تحت المراجعة التفصيلية",
    description: "نحتاج لوقت إضافي لمراجعة طلبك. سنتواصل معك قريباً.",
    badge: "مراجعة إضافية",
    badgeVariant: "outline" as const,
    activeStep: "under_review",
  },
  disbursed: {
    icon: Wallet,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    title: "تم صرف التمويل! 💰",
    description: "تم إيداع مبلغ التمويل في حسابك بنجاح.",
    badge: "تم الصرف",
    badgeVariant: "default" as const,
    activeStep: "disbursed",
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
    activeStep: "received",
  },
};

// Generate timeline steps based on current status
const generateTimelineSteps = (activeStep: string): TimelineStep[] => {
  const now = new Date();
  
  const steps: TimelineStep[] = [
    {
      id: "received",
      title: "استلام الطلب",
      description: "تم استلام طلبك وتسجيله في النظام",
      icon: FileText,
      status: "pending",
      estimatedTime: "فوري",
    },
    {
      id: "under_review",
      title: "المراجعة والتحقق",
      description: "مراجعة البيانات والتحقق من المستندات",
      icon: FileSearch,
      status: "pending",
      estimatedTime: "1-3 أيام عمل",
    },
    {
      id: "approved",
      title: "قرار التمويل",
      description: "الموافقة على الطلب أو رفضه مع الأسباب",
      icon: Shield,
      status: "pending",
      estimatedTime: "1-2 أيام عمل",
    },
    {
      id: "disbursed",
      title: "صرف التمويل",
      description: "إيداع المبلغ في الحساب البنكي",
      icon: Wallet,
      status: "pending",
      estimatedTime: "1-3 أيام عمل",
    },
  ];

  // Update statuses based on active step
  const stepOrder = ["received", "under_review", "approved", "disbursed"];
  const activeIndex = stepOrder.indexOf(activeStep);
  
  // Handle declined as special case
  if (activeStep === "declined") {
    steps[0].status = "completed";
    steps[0].completedAt = now.toISOString();
    steps[1].status = "completed";
    steps[2].status = "failed";
    steps[2].title = "تم رفض الطلب";
    steps[2].description = "لم تتم الموافقة على الطلب";
    steps[3].status = "pending";
    return steps;
  }

  steps.forEach((step, index) => {
    if (index < activeIndex) {
      step.status = "completed";
      step.completedAt = now.toISOString();
    } else if (index === activeIndex) {
      step.status = "current";
      if (activeStep === "received") {
        step.completedAt = now.toISOString();
        step.status = "completed";
        // Make next step current
        if (steps[index + 1]) {
          steps[index + 1].status = "current";
        }
      }
    }
  });

  return steps;
};

// Timeline Step Component
function TimelineStepItem({ 
  step, 
  index, 
  isLast 
}: { 
  step: TimelineStep; 
  index: number;
  isLast: boolean;
}) {
  const Icon = step.icon;
  
  const getStepStyles = () => {
    switch (step.status) {
      case "completed":
        return {
          iconBg: "bg-emerald-500",
          iconColor: "text-white",
          lineColor: "bg-emerald-500",
          titleColor: "text-foreground",
          descColor: "text-muted-foreground",
        };
      case "current":
        return {
          iconBg: "bg-primary",
          iconColor: "text-primary-foreground",
          lineColor: "bg-border",
          titleColor: "text-primary font-bold",
          descColor: "text-muted-foreground",
        };
      case "failed":
        return {
          iconBg: "bg-destructive",
          iconColor: "text-destructive-foreground",
          lineColor: "bg-border",
          titleColor: "text-destructive",
          descColor: "text-muted-foreground",
        };
      default:
        return {
          iconBg: "bg-muted",
          iconColor: "text-muted-foreground",
          lineColor: "bg-border",
          titleColor: "text-muted-foreground",
          descColor: "text-muted-foreground/70",
        };
    }
  };

  const styles = getStepStyles();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15 }}
      className="relative flex gap-4"
    >
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute right-5 top-12 w-0.5 h-full -translate-x-1/2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            transition={{ delay: index * 0.15 + 0.3, duration: 0.4 }}
            className={`w-full ${styles.lineColor}`}
          />
        </div>
      )}

      {/* Icon Circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          delay: index * 0.15 
        }}
        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${styles.iconBg} shrink-0`}
      >
        {step.status === "current" && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <Icon className={`w-5 h-5 ${styles.iconColor}`} />
      </motion.div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`text-sm ${styles.titleColor}`}>{step.title}</h4>
          {step.status === "current" && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              الحالة الحالية
            </Badge>
          )}
          {step.status === "completed" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
        </div>
        
        <p className={`text-xs ${styles.descColor} mb-2`}>
          {step.description}
        </p>

        {step.estimatedTime && step.status !== "completed" && step.status !== "failed" && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Timer className="w-3 h-3" />
            <span>الوقت المتوقع: {step.estimatedTime}</span>
          </div>
        )}

        {step.completedAt && step.status === "completed" && (
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>تم الإنجاز</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// In-App Notification Card
function NotificationCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="text-right">
                <h4 className="text-sm font-semibold">الإشعارات الفورية</h4>
                <p className="text-xs text-muted-foreground">
                  ستصلك تحديثات فورية عند تغيير حالة طلبك
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bell className="w-4 h-4 text-primary" />
                    <span>إشعارات داخل التطبيق</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>رسائل SMS (عند الموافقة)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ResultStep({ data, onReset }: ResultStepProps) {
  const navigate = useNavigate();
  const [showTimeline, setShowTimeline] = useState(false);
  
  // Handle extended status types
  const statusKey = data.status === "approved" ? "approved" : 
                    data.status === "rejected" ? "rejected" : 
                    data.status === "under_review" ? "under_review" :
                    data.status === "submitted" ? "submitted" : 
                    data.status === "draft" ? "draft" : "submitted";
  
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.submitted;
  const StatusIcon = config.icon;
  const timelineSteps = generateTimelineSteps(config.activeStep);

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

    // Animate timeline after initial render
    const timer = setTimeout(() => setShowTimeline(true), 500);
    return () => clearTimeout(timer);
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
      {/* Status Header with Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${config.bgColor} mx-auto relative`}
        >
          {data.status === "submitted" && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <StatusIcon className={`w-12 h-12 ${config.color}`} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Badge variant={config.badgeVariant} className="mb-3 text-sm px-4 py-1">
            {config.badge}
          </Badge>
          <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            {config.description}
          </p>
        </motion.div>
      </motion.div>

      {/* Application ID Card */}
      {data.applicationId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">
                    رقم الطلب (Application ID)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyApplicationId}
                  className="h-8 text-xs gap-1.5 hover:bg-background/50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  نسخ
                </Button>
              </div>
              <div className="bg-background/60 rounded-lg p-3 text-center">
                <p className="font-mono text-xl font-bold tracking-wider">
                  {data.applicationId.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                احتفظ بهذا الرقم لمتابعة طلبك
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Application Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              ملخص الطلب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between py-2.5 px-3 bg-muted/50 rounded-lg"
            >
              <span className="text-sm text-muted-foreground">مبلغ التمويل</span>
              <span className="font-bold">{formatAmount(data.amount)} ر.س</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-between py-2.5 px-3 bg-muted/50 rounded-lg"
            >
              <span className="text-sm text-muted-foreground">مدة السداد</span>
              <span className="font-bold">{data.tenorMonths} شهر</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-between py-2.5 px-3 bg-primary/10 rounded-lg border border-primary/20"
            >
              <span className="text-sm text-muted-foreground">القسط الشهري</span>
              <span className="font-bold text-primary text-lg">
                {formatAmount(data.monthlyInstallment)} ر.س
              </span>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline Section */}
      <AnimatePresence>
        {showTimeline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  مراحل معالجة الطلب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="pr-1">
                  {timelineSteps.map((step, index) => (
                    <TimelineStepItem
                      key={step.id}
                      step={step}
                      index={index}
                      isLast={index === timelineSteps.length - 1}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Info Card */}
      <NotificationCard />

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="space-y-3"
      >
        <Button
          onClick={() => navigate("/dashboard/financing")}
          className="w-full h-12 gap-2 text-base"
        >
          <ExternalLink className="w-4 h-4" />
          <span>متابعة حالة الطلب</span>
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="h-11 gap-2"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={onReset}
            className="h-11 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>طلب جديد</span>
          </Button>
        </div>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center"
      >
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              لديك استفسار أو تحتاج مساعدة؟{" "}
              <button
                onClick={() => navigate("/dashboard/support")}
                className="text-primary font-medium hover:underline"
              >
                تواصل مع فريق الدعم
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
