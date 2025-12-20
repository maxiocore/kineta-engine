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
      dir="rtl"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 180, damping: 20 }}
      whileHover={{ scale: 1.008, backgroundColor: "hsl(var(--muted) / 0.4)" }}
      className="p-4 md:p-5 cursor-pointer transition-all border-b border-border/30 last:border-0 group relative overflow-hidden"
      onClick={onClick}
    >
      {/* Hover highlight effect - RTL gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Status indicator line - Right side for RTL */}
      <motion.div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-1.5 rounded-l-full",
          statusConfig.iconBg
        )}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
      />

      <div className="flex items-center gap-4 relative flex-row-reverse">
        {/* Action Button - Now first in RTL */}
        <motion.div 
          whileHover={{ scale: 1.15, x: 4 }} 
          whileTap={{ scale: 0.9 }}
          className="shrink-0"
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Date */}
        <div className="text-center shrink-0 hidden md:block min-w-[90px]">
          <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">التاريخ</p>
          <motion.p 
            className="text-sm font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2 }}
          >
            {format(new Date(order.created_at), "d MMM", { locale: ar })}
          </motion.p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(order.created_at), "yyyy", { locale: ar })}
          </p>
        </div>

        {/* Price */}
        <div className="text-center shrink-0">
          <p className="text-[10px] text-muted-foreground mb-0.5 hidden sm:block uppercase tracking-wider">السعر</p>
          <motion.p 
            className="font-bold text-primary text-xl"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
          >
            <span className="text-sm font-normal ml-0.5">ر.س</span>
            {order.total_price.toFixed(2)}
          </motion.p>
        </div>

        {/* Quantity */}
        <div className="text-center shrink-0 hidden sm:block">
          <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">الكمية</p>
          <motion.p 
            className="font-bold text-lg"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 + 0.1 }}
          >
            {order.quantity?.toLocaleString() || "-"}
          </motion.p>
        </div>

        {/* Order Info - Now on the right side */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap justify-end">
            <span className={cn(
              "px-3 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5 flex-row-reverse",
              statusConfig.color
            )}>
              {statusConfig.label}
              {isAnimating && (
                <motion.span 
                  className="w-1.5 h-1.5 rounded-full bg-current"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </span>
            
            <div className="flex items-center gap-1 flex-row-reverse">
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
              <code className="px-2.5 py-1 bg-secondary/80 rounded-lg text-xs font-mono font-medium">
                {order.order_number}
              </code>
            </div>
          </div>
          
          <motion.p 
            className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 + 0.15 }}
          >
            {order.service?.name}
          </motion.p>
          <p className="text-xs text-muted-foreground">{order.service?.category}</p>
          
          {/* External status */}
          {order.external_status && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end flex-row-reverse">
              <ExternalLink className="w-3 h-3" />
              {order.external_status}
            </p>
          )}
        </div>

        {/* Status Icon with animation - Now on the left */}
        <motion.div 
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative",
            statusConfig.iconBg
          )}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.04, type: "spring", stiffness: 200 }}
          whileHover={isAnimating ? {} : { rotate: [0, -5, 5, 0] }}
        >
          <StatusIcon className={cn(
            "w-7 h-7 text-white",
            isAnimating && "animate-spin"
          )} />
          
          {/* Pulse effect for active orders */}
          {isAnimating && (
            <motion.div
              className={cn("absolute inset-0 rounded-2xl", statusConfig.iconBg)}
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      {/* Progress Bar - RTL direction */}
      <div className="mt-4 relative" dir="rtl">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">تقدم الطلب</span>
          <motion.span 
            className={cn("font-semibold", statusConfig.color.split(" ")[1])}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.3 }}
          >
            {statusConfig.progress}%
          </motion.span>
        </div>
        <div className="relative h-2 rounded-full bg-secondary/80 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", statusConfig.iconBg)}
            initial={{ width: 0, opacity: 0.5 }}
            animate={{ width: `${statusConfig.progress}%`, opacity: 1 }}
            transition={{ duration: 1, delay: index * 0.06, ease: "easeOut" }}
            style={{ originX: 0 }}
          />
          {isAnimating && (
            <motion.div
              className="absolute top-0 right-0 h-full w-1/4 bg-gradient-to-l from-transparent via-white/40 to-transparent"
              animate={{ x: ["100%", "-400%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
});

OrderCard.displayName = 'OrderCard';

export default OrderCard;
