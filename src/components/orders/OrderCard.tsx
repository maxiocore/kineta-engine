import React, { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, AlertCircle, XCircle, Loader2, ChevronLeft, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface OrderCardProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    total_price: number;
    created_at: string;
    link: string | null;
    quantity: number | null;
    external_status: string | null;
    service: {
      name: string;
      category: string;
    };
  };
  index: number;
  onClick: () => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": return { label: "قيد الانتظار", color: "bg-warning/10 text-warning border-warning/30", iconBg: "bg-gradient-to-br from-warning to-orange-500", icon: Clock, progress: 10 };
    case "processing": return { label: "قيد المعالجة", color: "bg-primary/10 text-primary border-primary/30", iconBg: "bg-gradient-to-br from-primary to-cyan-400", icon: Loader2, progress: 30 };
    case "in_progress": return { label: "قيد التنفيذ", color: "bg-accent/10 text-accent border-accent/30", iconBg: "bg-gradient-to-br from-accent to-purple-400", icon: Loader2, progress: 60 };
    case "completed": return { label: "مكتمل", color: "bg-success/10 text-success border-success/30", iconBg: "bg-gradient-to-br from-success to-emerald-400", icon: CheckCircle, progress: 100 };
    case "partial": return { label: "مكتمل جزئي", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", iconBg: "bg-gradient-to-br from-orange-500 to-amber-400", icon: AlertCircle, progress: 80 };
    case "cancelled": return { label: "ملغي", color: "bg-destructive/10 text-destructive border-destructive/30", iconBg: "bg-gradient-to-br from-destructive to-rose-400", icon: XCircle, progress: 0 };
    default: return { label: status, color: "bg-muted text-muted-foreground border-border", iconBg: "bg-muted", icon: Clock, progress: 0 };
  }
};

export const OrderCard = memo(({ order, index, onClick }: OrderCardProps) => {
  const [copied, setCopied] = useState(false);
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  const copyOrderNumber = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    toast.success("تم نسخ رقم الطلب");
    setTimeout(() => setCopied(false), 2000);
  }, [order.order_number]);

  const isAnimating = order.status === "in_progress" || order.status === "processing";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.005, backgroundColor: "hsl(var(--muted) / 0.3)" }}
      className="p-4 md:p-5 cursor-pointer transition-all border-b border-border/30 last:border-0 group relative overflow-hidden"
      onClick={onClick}
    >
      {/* Hover highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Status indicator line */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-1 transition-all",
        statusConfig.iconBg
      )} />

      <div className="flex items-center gap-4 relative">
        {/* Status Icon with animation */}
        <motion.div 
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative",
            statusConfig.iconBg
          )}
          animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: isAnimating ? Infinity : 0 }}
        >
          <StatusIcon className={cn(
            "w-7 h-7 text-white",
            isAnimating && "animate-spin"
          )} />
          
          {/* Pulse effect for active orders */}
          {isAnimating && (
            <motion.div
              className={cn("absolute inset-0 rounded-2xl", statusConfig.iconBg)}
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <code className="px-2.5 py-1 bg-secondary rounded-lg text-xs font-mono font-medium">
                {order.order_number}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={copyOrderNumber}
              >
                {copied ? (
                  <Check className="w-3 h-3 text-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1",
              statusConfig.color
            )}>
              {isAnimating && (
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              )}
              {statusConfig.label}
            </span>
          </div>
          
          <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {order.service?.name}
          </p>
          <p className="text-xs text-muted-foreground">{order.service?.category}</p>
          
          {/* External status */}
          {order.external_status && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {order.external_status}
            </p>
          )}
        </div>

        {/* Quantity & Price */}
        <div className="text-left shrink-0 hidden sm:block">
          <p className="text-xs text-muted-foreground mb-0.5">الكمية</p>
          <p className="font-bold text-lg">{order.quantity?.toLocaleString() || "-"}</p>
        </div>

        <div className="text-left shrink-0">
          <p className="text-xs text-muted-foreground mb-0.5 hidden sm:block">السعر</p>
          <motion.p 
            className="font-bold text-primary text-xl"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            {order.total_price.toFixed(2)}
            <span className="text-sm font-normal mr-1">ر.س</span>
          </motion.p>
        </div>

        {/* Date */}
        <div className="text-left shrink-0 hidden md:block min-w-[80px]">
          <p className="text-xs text-muted-foreground mb-0.5">التاريخ</p>
          <p className="text-sm font-medium">
            {format(new Date(order.created_at), "d MMM", { locale: ar })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(order.created_at), "yyyy", { locale: ar })}
          </p>
        </div>

        {/* Action */}
        <motion.div 
          whileHover={{ scale: 1.1, x: -4 }} 
          whileTap={{ scale: 0.9 }}
          className="shrink-0"
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 relative">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">تقدم الطلب</span>
          <span className={cn("font-medium", statusConfig.color.split(" ")[1])}>
            {statusConfig.progress}%
          </span>
        </div>
        <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", statusConfig.iconBg)}
            initial={{ width: 0 }}
            animate={{ width: `${statusConfig.progress}%` }}
            transition={{ duration: 0.8, delay: index * 0.05 }}
          />
          {isAnimating && (
            <motion.div
              className="absolute top-0 h-full w-1/4 bg-gradient-to-l from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "500%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
});

OrderCard.displayName = 'OrderCard';

export default OrderCard;
