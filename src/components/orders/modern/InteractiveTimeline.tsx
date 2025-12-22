import React from "react";
import { motion } from "framer-motion";
import { 
  Clock, CheckCircle, Loader2, XCircle, AlertCircle, 
  Package, Send, Settings, Truck, Sparkles, PartyPopper,
  CircleDot, ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface OrderStatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
}

interface InteractiveTimelineProps {
  status: string;
  createdAt: string;
  updatedAt: string;
  externalStatus?: string | null;
  externalOrderId?: string | null;
  orderHistory: OrderStatusHistory[];
  loadingHistory?: boolean;
}

// Define timeline stages
const stages = [
  { 
    key: "created", 
    label: "تم إنشاء الطلب", 
    icon: Send,
    description: "تم استلام طلبك بنجاح",
    color: "primary"
  },
  { 
    key: "pending", 
    label: "قيد الانتظار", 
    icon: Clock,
    description: "في انتظار المراجعة والموافقة",
    color: "warning"
  },
  { 
    key: "processing", 
    label: "قيد المعالجة", 
    icon: Settings,
    description: "يتم تجهيز طلبك للتنفيذ",
    color: "blue"
  },
  { 
    key: "in_progress", 
    label: "قيد التنفيذ", 
    icon: Truck,
    description: "جاري تنفيذ الطلب",
    color: "accent"
  },
  { 
    key: "completed", 
    label: "مكتمل", 
    icon: CheckCircle,
    description: "تم إتمام الطلب بنجاح!",
    color: "success"
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  primary: { bg: "bg-primary", text: "text-primary", border: "border-primary", glow: "shadow-primary/30" },
  warning: { bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500", glow: "shadow-amber-500/30" },
  blue: { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", glow: "shadow-blue-500/30" },
  accent: { bg: "bg-accent", text: "text-accent", border: "border-accent", glow: "shadow-accent/30" },
  success: { bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500", glow: "shadow-emerald-500/30" },
  destructive: { bg: "bg-red-500", text: "text-red-500", border: "border-red-500", glow: "shadow-red-500/30" },
  orange: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500", glow: "shadow-orange-500/30" },
};

const getStatusIndex = (status: string): number => {
  const statusMap: Record<string, number> = {
    pending: 1,
    processing: 2,
    in_progress: 3,
    completed: 4,
  };
  return statusMap[status] ?? 0;
};

export const InteractiveTimeline = ({
  status,
  createdAt,
  updatedAt,
  externalStatus,
  externalOrderId,
  orderHistory,
  loadingHistory,
}: InteractiveTimelineProps) => {
  const currentStageIndex = getStatusIndex(status);
  const isCancelled = status === "cancelled";
  const isPartial = status === "partial";
  const isRefunded = status === "refunded";
  const isCompleted = status === "completed";

  // Calculate progress percentage
  const progressPercentage = isCompleted ? 100 : isCancelled ? 0 : (currentStageIndex / 4) * 100;

  // Get history entry for a stage
  const getHistoryForStage = (stageKey: string) => {
    return orderHistory.find(h => h.new_status === stageKey);
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Progress Overview */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl p-5",
          isCompleted ? "bg-gradient-to-l from-emerald-500/20 via-emerald-500/10 to-teal-500/10" :
          isCancelled ? "bg-gradient-to-l from-red-500/20 via-red-500/10 to-rose-500/10" :
          "bg-gradient-to-l from-primary/20 via-primary/10 to-accent/10"
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        {/* Animated glow */}
        {!isCancelled && !isCompleted && (
          <motion.div
            className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-primary/20 blur-3xl"
            animate={{ 
              x: ["-50%", "100%", "-50%"],
              y: ["-50%", "0%", "-50%"],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        )}

        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                isCompleted ? "bg-gradient-to-br from-emerald-500 to-teal-500" :
                isCancelled ? "bg-gradient-to-br from-red-500 to-rose-500" :
                "bg-gradient-to-br from-primary to-accent"
              )}
              animate={isCompleted ? { rotate: [0, 10, -10, 0] } : { scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isCompleted ? (
                <PartyPopper className="w-7 h-7 text-white" />
              ) : isCancelled ? (
                <XCircle className="w-7 h-7 text-white" />
              ) : (
                <Package className="w-7 h-7 text-white" />
              )}
            </motion.div>
            
            <div>
              <h3 className="font-bold text-lg">
                {isCompleted ? "🎉 تم إكمال الطلب!" :
                 isCancelled ? "تم إلغاء الطلب" :
                 isPartial ? "مكتمل جزئياً" :
                 "جاري تتبع الطلب"}
              </h3>
              <p className="text-sm text-muted-foreground">
                آخر تحديث: {formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ar })}
              </p>
            </div>
          </div>

          {/* Progress Circle */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={isCompleted ? "hsl(142 76% 36%)" : isCancelled ? "hsl(0 84% 60%)" : "hsl(var(--primary))"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="176"
                initial={{ strokeDashoffset: 176 }}
                animate={{ strokeDashoffset: 176 - (176 * progressPercentage / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 rounded-full bg-secondary/50 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isCompleted ? "bg-gradient-to-l from-emerald-500 to-teal-500" :
              isCancelled ? "bg-gradient-to-l from-red-500 to-rose-500" :
              "bg-gradient-to-l from-primary to-accent"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          {!isCompleted && !isCancelled && (
            <motion.div
              className="absolute top-0 right-0 h-full w-1/4 bg-gradient-to-l from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
      </motion.div>

      {/* Timeline Stages */}
      {!isCancelled && !isPartial && !isRefunded && (
        <div className="relative">
          {stages.map((stage, index) => {
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isPast = index < currentStageIndex;
            const historyEntry = getHistoryForStage(stage.key);
            const StageIcon = stage.icon;
            const colors = colorClasses[stage.color];

            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div className="absolute top-14 right-6 w-0.5 h-16 bg-border">
                    <motion.div
                      className={cn("w-full", isPast ? colors.bg : "bg-border")}
                      initial={{ height: 0 }}
                      animate={{ height: isPast ? "100%" : "0%" }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                    />
                  </div>
                )}

                <div className={cn(
                  "flex gap-4 p-4 rounded-2xl transition-all mb-3",
                  isCurrent ? "bg-card border-2 shadow-lg" : "bg-transparent",
                  isCurrent && colors.border
                )}>
                  {/* Icon */}
                  <motion.div
                    className={cn(
                      "relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                      isActive ? colors.bg : "bg-muted",
                      isCurrent && `shadow-lg ${colors.glow}`
                    )}
                    animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0 }}
                  >
                    <StageIcon className={cn(
                      "w-6 h-6",
                      isActive ? "text-white" : "text-muted-foreground",
                      isCurrent && (stage.key === "processing" || stage.key === "in_progress") && "animate-spin"
                    )} />
                    
                    {/* Pulse effect for current */}
                    {isCurrent && (
                      <motion.div
                        className={cn("absolute inset-0 rounded-xl", colors.bg)}
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    
                    {/* Checkmark for completed stages */}
                    {isPast && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                      >
                        <CheckCircle className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn(
                        "font-semibold",
                        isCurrent ? colors.text : isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {stage.label}
                      </h4>
                      {historyEntry && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(historyEntry.created_at), "d MMM HH:mm", { locale: ar })}
                        </span>
                      )}
                      {index === 0 && !historyEntry && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(createdAt), "d MMM HH:mm", { locale: ar })}
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm",
                      isActive ? "text-muted-foreground" : "text-muted-foreground/50"
                    )}>
                      {stage.description}
                    </p>
                    
                    {/* Current stage indicator */}
                    {isCurrent && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex items-center gap-2"
                      >
                        <CircleDot className={cn("w-4 h-4 animate-pulse", colors.text)} />
                        <span className={cn("text-xs font-medium", colors.text)}>الحالة الحالية</span>
                      </motion.div>
                    )}

                    {/* History notes */}
                    {historyEntry?.notes && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg"
                      >
                        💬 {historyEntry.notes}
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cancelled/Partial/Refunded State */}
      {(isCancelled || isPartial || isRefunded) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-6 rounded-2xl border-2 text-center",
            isCancelled ? "bg-red-500/10 border-red-500/30" :
            isRefunded ? "bg-purple-500/10 border-purple-500/30" :
            "bg-orange-500/10 border-orange-500/30"
          )}
        >
          <motion.div
            className={cn(
              "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center",
              isCancelled ? "bg-red-500" :
              isRefunded ? "bg-purple-500" :
              "bg-orange-500"
            )}
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            {isCancelled ? <XCircle className="w-8 h-8 text-white" /> :
             isRefunded ? <AlertCircle className="w-8 h-8 text-white" /> :
             <AlertCircle className="w-8 h-8 text-white" />}
          </motion.div>
          <h3 className={cn(
            "font-bold text-lg mb-2",
            isCancelled ? "text-red-500" :
            isRefunded ? "text-purple-500" :
            "text-orange-500"
          )}>
            {isCancelled ? "تم إلغاء الطلب" :
             isRefunded ? "تم استرجاع المبلغ" :
             "مكتمل جزئياً"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isCancelled ? "تم إلغاء هذا الطلب. يمكنك إنشاء طلب جديد." :
             isRefunded ? "تم استرجاع مبلغ هذا الطلب إلى رصيدك." :
             "تم تنفيذ جزء من الطلب. قد يكون هناك استرجاع جزئي."}
          </p>
        </motion.div>
      )}

      {/* External Provider Info */}
      {externalOrderId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-xl bg-gradient-to-l from-violet-500/10 to-purple-500/10 border border-violet-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold">معلومات المزود</h4>
              <p className="text-xs text-muted-foreground">تفاصيل التنفيذ من المزود الخارجي</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-card/50">
              <span className="text-xs text-muted-foreground">رقم الطلب</span>
              <p className="font-mono font-bold">{externalOrderId}</p>
            </div>
            {externalStatus && (
              <div className="p-3 rounded-lg bg-card/50">
                <span className="text-xs text-muted-foreground">الحالة</span>
                <p className="font-semibold">
                  {externalStatus === 'Completed' ? '✅ مكتمل' :
                   externalStatus === 'In progress' ? '🔄 قيد التنفيذ' :
                   externalStatus === 'Pending' ? '⏳ قيد الانتظار' :
                   externalStatus === 'Partial' ? '⚠️ جزئي' :
                   externalStatus === 'Canceled' ? '❌ ملغي' :
                   externalStatus}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Loading History */}
      {loadingHistory && (
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-6 h-6 text-primary" />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTimeline;
