import React, { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Palette, Clock, CheckCircle, AlertCircle, XCircle, Loader2, 
  Copy, Check, Calendar, Star, Eye, RotateCcw, Zap, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface DesignOrderCardProps {
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
    case "pending": 
      return { 
        label: "قيد الانتظار", 
        bgColor: "bg-amber-500/15",
        textColor: "text-amber-400",
        borderColor: "border-amber-500/30",
        icon: Clock,
        progress: 10
      };
    case "processing": 
      return { 
        label: "قيد المعالجة", 
        bgColor: "bg-blue-500/15",
        textColor: "text-blue-400",
        borderColor: "border-blue-500/30",
        icon: Loader2,
        progress: 30,
        animate: true
      };
    case "in_progress": 
      return { 
        label: "قيد التنفيذ", 
        bgColor: "bg-violet-500/15",
        textColor: "text-violet-400",
        borderColor: "border-violet-500/30",
        icon: Zap,
        progress: 60,
        animate: true
      };
    case "completed": 
      return { 
        label: "مكتمل", 
        bgColor: "bg-emerald-500/15",
        textColor: "text-emerald-400",
        borderColor: "border-emerald-500/30",
        icon: CheckCircle,
        progress: 100
      };
    case "partial": 
      return { 
        label: "مكتمل جزئي", 
        bgColor: "bg-orange-500/15",
        textColor: "text-orange-400",
        borderColor: "border-orange-500/30",
        icon: AlertCircle,
        progress: 80
      };
    case "cancelled": 
      return { 
        label: "ملغي", 
        bgColor: "bg-red-500/15",
        textColor: "text-red-400",
        borderColor: "border-red-500/30",
        icon: XCircle,
        progress: 0
      };
    case "refunded": 
      return { 
        label: "مسترجع", 
        bgColor: "bg-purple-500/15",
        textColor: "text-purple-400",
        borderColor: "border-purple-500/30",
        icon: RotateCcw,
        progress: 0
      };
    default: 
      return { 
        label: status, 
        bgColor: "bg-muted/50",
        textColor: "text-muted-foreground",
        borderColor: "border-border",
        icon: Clock,
        progress: 0
      };
  }
};

export const DesignOrderCard = memo(({ order, index, onClick }: DesignOrderCardProps) => {
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

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative bg-gradient-to-br from-card via-card to-violet-500/5 rounded-3xl border border-border/50 overflow-hidden cursor-pointer hover:border-violet-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/10"
      onClick={onClick}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-fuchsia-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Top Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-violet-500 via-fuchsia-500 to-pink-500" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          {/* Icon & Order Info */}
          <div className="flex items-center gap-4">
            <motion.div 
              className="relative"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <motion.div 
                className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <code className="text-sm font-mono font-bold text-foreground">
                  {order.order_number}
                </code>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={copyOrderNumber}
                  className="p-1 rounded-lg hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </motion.button>
              </div>
              <h3 className="font-bold text-base text-foreground line-clamp-1">
                {order.service?.name}
              </h3>
            </div>
          </div>

          {/* Status Badge */}
          <Badge 
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-xl gap-1.5",
              statusConfig.bgColor,
              statusConfig.textColor,
              statusConfig.borderColor,
              "border"
            )}
          >
            <StatusIcon className={cn(
              "w-3.5 h-3.5",
              statusConfig.animate && "animate-spin"
            )} style={statusConfig.animate ? { animationDuration: '2s' } : {}} />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">تقدم المشروع</span>
            <span className={cn("font-bold", statusConfig.textColor)}>{statusConfig.progress}%</span>
          </div>
          <div className="relative h-2.5 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-violet-500 via-fuchsia-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${statusConfig.progress}%` }}
              transition={{ duration: 1, delay: index * 0.05 }}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/30">
            <p className="text-[10px] text-muted-foreground mb-1">السعر</p>
            <p className="text-sm font-bold text-violet-500">{order.total_price.toFixed(0)} ر.س</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/30">
            <p className="text-[10px] text-muted-foreground mb-1">التقييم</p>
            <div className="flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold">4.9</span>
            </div>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/30">
            <p className="text-[10px] text-muted-foreground mb-1">المشاهدات</p>
            <div className="flex items-center justify-center gap-1">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-bold">{order.quantity || 1}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(order.created_at), "d MMMM yyyy", { locale: ar })}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ar })}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

DesignOrderCard.displayName = "DesignOrderCard";

export default DesignOrderCard;
