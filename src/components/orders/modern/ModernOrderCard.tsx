import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Clock, CheckCircle, AlertCircle, XCircle, Loader2, 
  Copy, Check, Calendar, Package, TrendingUp, RotateCcw, Zap,
  RefreshCw, Eye, ChevronDown, LinkIcon, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      id?: string;
      name: string;
      category: string;
    };
  };
  index: number;
  onClick: () => void;
  onReorder?: (order: any) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": 
      return { 
        label: "قيد الانتظار", 
        bgColor: "bg-amber-500/15",
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
        bgColor: "bg-blue-500/15",
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
        bgColor: "bg-purple-500/15",
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
        bgColor: "bg-emerald-500/15",
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
        bgColor: "bg-orange-500/15",
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
        bgColor: "bg-red-500/15",
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
        bgColor: "bg-purple-500/15",
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

export const ModernOrderCard = memo(({ order, index, onClick, onReorder }: ModernOrderCardProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
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

  const handleReorder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReorder) {
      onReorder(order);
    } else {
      // Navigate to service page with pre-filled data
      navigate(`/dashboard/services?reorder=${order.service?.id}&link=${encodeURIComponent(order.link || '')}&quantity=${order.quantity || 1}`);
    }
    toast.success("جاري إعادة الطلب...");
  }, [order, onReorder, navigate]);

  const handleViewDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  }, [expanded]);

  const copyLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.link) {
      navigator.clipboard.writeText(order.link);
      toast.success("تم نسخ الرابط");
    }
  }, [order.link]);

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        delay: index * 0.04, 
        type: "spring", 
        stiffness: 400, 
        damping: 30 
      }}
      whileHover={{ y: -2 }}
      className="group relative bg-card rounded-2xl border-r-4 border border-border/50 overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
      style={{ borderRightColor: `var(--${order.status === 'pending' ? 'amber' : order.status === 'completed' ? 'emerald' : order.status === 'in_progress' ? 'purple' : 'blue'}-500, #8b5cf6)` }}
    >
      {/* Colored Right Border */}
      <div className={cn(
        "absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b",
        statusConfig.iconBg
      )} />

      <div className="p-5 pr-6">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Status Icon */}
          <motion.div 
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg flex-shrink-0",
              statusConfig.iconBg
            )}
            whileHover={{ rotate: [0, -5, 5, 0] }}
          >
            <StatusIcon className={cn(
              "w-7 h-7 text-white",
              isAnimating && "animate-spin"
            )} style={isAnimating ? { animationDuration: '2s' } : {}} />
          </motion.div>

          {/* Order Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <motion.code 
                className="text-sm font-mono font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                statusConfig.bgColor,
                statusConfig.textColor,
                statusConfig.borderColor
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full ml-1", statusConfig.dotColor)} />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Service Name */}
        <h3 className="font-bold text-sm text-foreground mb-4 line-clamp-1">
          {order.service?.name}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center gap-2 mb-4">
          {/* Quantity */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/30 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">عدد البدء</p>
              <p className="font-bold text-sm">{order.quantity?.toLocaleString() || 1}</p>
            </div>
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/30 flex-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
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
          <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className={cn("absolute inset-y-0 right-0 rounded-full bg-gradient-to-l", statusConfig.iconBg)}
              initial={{ width: 0 }}
              animate={{ width: `${statusConfig.progress}%` }}
              transition={{ duration: 1, delay: index * 0.05, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Footer with Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(order.created_at), "d MMMM yyyy", { locale: ar })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ar })}</span>
            </div>
          </div>
          
          {/* Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={toggleExpand}
          >
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              expanded && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-xs gap-1.5"
            onClick={handleViewDetails}
          >
            <Eye className="w-4 h-4" />
            التفاصيل
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-9 text-xs gap-1.5"
            onClick={handleReorder}
          >
            <RefreshCw className="w-4 h-4" />
            إعادة الطلب
          </Button>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-border/50 space-y-3">
                {/* Link */}
                {order.link && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium">الرابط</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={copyLink}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          asChild
                        >
                          <a href={order.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground break-all" dir="ltr">
                      {order.link}
                    </p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">التصنيف</p>
                    <p className="text-xs font-medium">{order.service?.category}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">آخر تحديث</p>
                    <p className="text-xs font-medium">{format(new Date(order.created_at), "HH:mm", { locale: ar })}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

ModernOrderCard.displayName = "ModernOrderCard";

export default ModernOrderCard;
