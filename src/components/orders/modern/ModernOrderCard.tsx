import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, CheckCircle, AlertCircle, XCircle, Loader2, 
  Copy, Check, ExternalLink, Eye, MoreHorizontal,
  Calendar, Package, TrendingUp, RotateCcw, Zap, Hash, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface ModernOrderCardProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    total_price: number;
    created_at: string;
    link: string | null;
    quantity: number | null;
    external_status: string | null;
    external_order_id: string | null;
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
    case "pending": 
      return { 
        label: "قيد الانتظار", 
        bgColor: "bg-amber-500/20",
        textColor: "text-amber-400",
        borderColor: "border-amber-500/30",
        dotColor: "bg-amber-500",
        iconBg: "from-amber-500 to-orange-500",
        icon: Clock,
        progress: 10
      };
    case "processing": 
      return { 
        label: "قيد المعالجة", 
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-400",
        borderColor: "border-blue-500/30",
        dotColor: "bg-blue-500",
        iconBg: "from-blue-500 to-cyan-500",
        icon: Loader2,
        progress: 30,
        animate: true
      };
    case "in_progress": 
      return { 
        label: "قيد التنفيذ", 
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-400",
        borderColor: "border-purple-500/30",
        dotColor: "bg-purple-500",
        iconBg: "from-purple-500 to-violet-500",
        icon: Zap,
        progress: 60,
        animate: true
      };
    case "completed": 
      return { 
        label: "مكتمل", 
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-400",
        borderColor: "border-emerald-500/30",
        dotColor: "bg-emerald-500",
        iconBg: "from-emerald-500 to-green-500",
        icon: CheckCircle,
        progress: 100
      };
    case "partial": 
      return { 
        label: "مكتمل جزئي", 
        bgColor: "bg-orange-500/20",
        textColor: "text-orange-400",
        borderColor: "border-orange-500/30",
        dotColor: "bg-orange-500",
        iconBg: "from-orange-500 to-yellow-500",
        icon: AlertCircle,
        progress: 80
      };
    case "cancelled": 
      return { 
        label: "ملغي", 
        bgColor: "bg-red-500/20",
        textColor: "text-red-400",
        borderColor: "border-red-500/30",
        dotColor: "bg-red-500",
        iconBg: "from-red-500 to-rose-500",
        icon: XCircle,
        progress: 0
      };
    case "refunded": 
      return { 
        label: "مسترجع", 
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-400",
        borderColor: "border-purple-500/30",
        dotColor: "bg-purple-500",
        iconBg: "from-purple-500 to-violet-500",
        icon: RotateCcw,
        progress: 0
      };
    default: 
      return { 
        label: status, 
        bgColor: "bg-muted/50",
        textColor: "text-muted-foreground",
        borderColor: "border-border",
        dotColor: "bg-muted-foreground",
        iconBg: "from-muted to-muted",
        icon: Clock,
        progress: 0
      };
  }
};

export const ModernOrderCard = memo(({ order, index, onClick }: ModernOrderCardProps) => {
  const [copied, setCopied] = useState(false);
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const isAnimating = statusConfig.animate;

  const copyOrderNumber = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    toast.success("تم نسخ رقم الطلب");
    setTimeout(() => setCopied(false), 2000);
  }, [order.order_number]);

  const openLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.link) {
      window.open(order.link, "_blank");
    }
  }, [order.link]);

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ 
        delay: index * 0.04, 
        type: "spring", 
        stiffness: 400, 
        damping: 30 
      }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
      onClick={onClick}
    >
      {/* Top Gradient Line */}
      <motion.div 
        className={cn("absolute top-0 right-0 left-0 h-1 bg-gradient-to-l", statusConfig.iconBg)}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: index * 0.04 + 0.1, duration: 0.4 }}
        style={{ originX: 1 }}
      />

      <div className="p-5">
        {/* Header: Order Number + Status + Icon */}
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Order Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <motion.code 
                className="text-base font-mono font-bold text-foreground"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 + 0.1 }}
              >
                {order.order_number}
              </motion.code>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={copyOrderNumber}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </motion.button>
            </div>
            
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-medium px-2.5 py-0.5 rounded-full border",
                statusConfig.bgColor,
                statusConfig.textColor,
                statusConfig.borderColor
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full ml-1.5", statusConfig.dotColor)} />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Status Icon */}
          <motion.div 
            className={cn(
              "relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg flex-shrink-0",
              statusConfig.iconBg
            )}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
          >
            <StatusIcon className={cn(
              "w-7 h-7 text-white",
              isAnimating && "animate-spin"
            )} style={isAnimating ? { animationDuration: '2s' } : {}} />
            
            {/* Pulse for Active */}
            {isAnimating && (
              <motion.div
                className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br", statusConfig.iconBg)}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            {/* Sparkle for Completed */}
            {order.status === "completed" && (
              <motion.div
                className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-amber-400 shadow-lg flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Sparkles className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Service Name */}
        <motion.h3 
          className="font-semibold text-sm text-foreground mb-4 line-clamp-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.04 + 0.15 }}
        >
          {order.service?.name}
        </motion.h3>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-4">
          {/* Quantity */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/30">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">الكمية</p>
              <p className="font-bold text-sm">{order.quantity?.toLocaleString() || "-"}</p>
            </div>
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/30">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">السعر</p>
              <p className="font-bold text-sm text-emerald-500">{order.total_price.toFixed(2)} <span className="text-[10px] text-muted-foreground">ر.س</span></p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">تقدم الطلب</span>
            <span className={cn("font-bold", statusConfig.textColor)}>{statusConfig.progress}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              className={cn("absolute inset-y-0 right-0 rounded-full bg-gradient-to-l", statusConfig.iconBg)}
              initial={{ width: 0 }}
              animate={{ width: `${statusConfig.progress}%` }}
              transition={{ duration: 1, delay: index * 0.05, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          {/* Date Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(order.created_at), "d MMMM yyyy", { locale: ar })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ar })}</span>
            </div>
          </div>

          {/* External ID */}
          {order.external_order_id && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hash className="w-3 h-3" />
              <span className="font-mono">{order.external_order_id}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ModernOrderCard.displayName = "ModernOrderCard";

export default ModernOrderCard;
