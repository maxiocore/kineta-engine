import { motion } from "framer-motion";
import { Clock, CheckCircle, Loader2, XCircle, AlertCircle, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OrderProgressTrackerProps {
  status: string;
  externalStatus?: string | null;
  showSteps?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusSteps = [
  { key: "pending", label: "قيد الانتظار", icon: Clock },
  { key: "processing", label: "قيد المعالجة", icon: Loader2 },
  { key: "in_progress", label: "قيد التنفيذ", icon: Loader2 },
  { key: "completed", label: "مكتمل", icon: CheckCircle },
];

const getStatusProgress = (status: string): number => {
  switch (status) {
    case "pending": return 10;
    case "processing": return 30;
    case "in_progress": return 60;
    case "completed": return 100;
    case "partial": return 80;
    case "cancelled": return 0;
    default: return 0;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending": return "text-warning";
    case "processing": return "text-primary";
    case "in_progress": return "text-accent";
    case "completed": return "text-success";
    case "partial": return "text-orange-500";
    case "cancelled": return "text-destructive";
    default: return "text-muted-foreground";
  }
};

const getProgressColor = (status: string): string => {
  switch (status) {
    case "pending": return "bg-warning";
    case "processing": return "bg-primary";
    case "in_progress": return "bg-accent";
    case "completed": return "bg-success";
    case "partial": return "bg-orange-500";
    case "cancelled": return "bg-destructive";
    default: return "bg-muted";
  }
};

export const OrderProgressTracker = ({
  status,
  externalStatus,
  showSteps = true,
  size = "md",
}: OrderProgressTrackerProps) => {
  const progress = getStatusProgress(status);
  const isCancelledOrPartial = status === "cancelled" || status === "partial";
  
  const sizeClasses = {
    sm: { step: "w-8 h-8", icon: "w-4 h-4", text: "text-xs", progressHeight: "h-1.5" },
    md: { step: "w-10 h-10", icon: "w-5 h-5", text: "text-sm", progressHeight: "h-2" },
    lg: { step: "w-12 h-12", icon: "w-6 h-6", text: "text-base", progressHeight: "h-3" },
  };

  const currentStep = statusSteps.findIndex(s => s.key === status);

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs sm:text-sm mb-2">
          <span className="text-muted-foreground">تقدم الطلب</span>
          <motion.span 
            key={progress}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("font-bold", getStatusColor(status))}
          >
            {progress}%
          </motion.span>
        </div>
        <div className={cn("relative w-full rounded-full bg-secondary overflow-hidden", sizeClasses[size].progressHeight)}>
          <motion.div
            className={cn("h-full rounded-full", getProgressColor(status))}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {status === "in_progress" && (
            <motion.div
              className="absolute top-0 right-0 h-full w-1/4 bg-gradient-to-l from-transparent via-foreground/20 to-transparent"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
      </div>

      {/* Status Steps */}
      {showSteps && !isCancelledOrPartial && (
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
          <div 
            className={cn("absolute top-1/2 left-0 h-0.5 -translate-y-1/2 z-0 transition-all duration-700", getProgressColor(status))}
            style={{ width: `${progress}%` }}
          />
          
          {/* Steps */}
          <div className="relative flex justify-between z-10">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStep;
              const isCurrent = step.key === status;
              const StepIcon = step.icon;
              
              return (
                <motion.div
                  key={step.key}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <motion.div
                    className={cn(
                      "rounded-full flex items-center justify-center transition-all duration-300 border-2",
                      sizeClasses[size].step,
                      isCurrent
                        ? cn("scale-110 shadow-lg", getProgressColor(status), "border-transparent text-primary-foreground")
                        : isActive
                        ? cn("bg-primary/20 border-primary/50", getStatusColor(status))
                        : "bg-secondary border-border text-muted-foreground"
                    )}
                    animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                  >
                    <StepIcon className={cn(
                      sizeClasses[size].icon,
                      isCurrent && step.key === "in_progress" && "animate-spin"
                    )} />
                  </motion.div>
                  <span className={cn(
                    sizeClasses[size].text,
                    "font-medium text-center hidden sm:block",
                    isCurrent ? getStatusColor(status) : isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled/Partial State */}
      {isCancelledOrPartial && (
        <div className={cn(
          "flex items-center justify-center gap-3 p-4 rounded-xl border",
          status === "cancelled" 
            ? "bg-destructive/10 border-destructive/20 text-destructive"
            : "bg-orange-500/10 border-orange-500/20 text-orange-500"
        )}>
          {status === "cancelled" ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">
            {status === "cancelled" ? "تم إلغاء الطلب" : "مكتمل جزئياً"}
          </span>
        </div>
      )}

      {/* External Status */}
      {externalStatus && !isCancelledOrPartial && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-info/10 border border-info/20"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-info" />
            <span className="text-sm text-muted-foreground">حالة المزود:</span>
            <span className="text-sm font-medium">{externalStatus}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OrderProgressTracker;
