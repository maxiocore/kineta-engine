import React, { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Clock, CheckCircle, AlertCircle, XCircle, Loader2, 
  Copy, Check, ExternalLink, Eye, MoreHorizontal,
  Hash, Calendar, Package, ArrowUpRight
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
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dotColor: "bg-amber-500",
        icon: Clock,
        progress: 10
      };
    case "processing": 
      return { 
        label: "قيد المعالجة", 
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        dotColor: "bg-blue-500",
        icon: Loader2,
        progress: 30,
        animate: true
      };
    case "in_progress": 
      return { 
        label: "قيد التنفيذ", 
        color: "bg-primary/10 text-primary border-primary/20",
        dotColor: "bg-primary",
        icon: Loader2,
        progress: 60,
        animate: true
      };
    case "completed": 
      return { 
        label: "مكتمل", 
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        dotColor: "bg-emerald-500",
        icon: CheckCircle,
        progress: 100
      };
    case "partial": 
      return { 
        label: "مكتمل جزئي", 
        color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        dotColor: "bg-orange-500",
        icon: AlertCircle,
        progress: 80
      };
    case "cancelled": 
      return { 
        label: "ملغي", 
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        dotColor: "bg-red-500",
        icon: XCircle,
        progress: 0
      };
    case "refunded": 
      return { 
        label: "مسترجع", 
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        dotColor: "bg-purple-500",
        icon: XCircle,
        progress: 0
      };
    default: 
      return { 
        label: status, 
        color: "bg-muted text-muted-foreground border-border",
        dotColor: "bg-muted-foreground",
        icon: Clock,
        progress: 0
      };
  }
};

export const ModernOrderCard = memo(({ order, index, onClick }: ModernOrderCardProps) => {
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

  const openLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.link) {
      window.open(order.link, "_blank");
    }
  }, [order.link]);

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ y: -2 }}
      className="group relative bg-card rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Status indicator bar */}
      <div className={cn(
        "absolute top-0 right-0 left-0 h-1 rounded-t-2xl",
        statusConfig.dotColor
      )} />

      <div className="relative p-4 sm:p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Order Icon */}
            <motion.div 
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                statusConfig.color
              )}
              whileHover={{ scale: 1.05 }}
            >
              <StatusIcon className={cn(
                "w-6 h-6",
                statusConfig.animate && "animate-spin"
              )} />
            </motion.div>
            
            {/* Order Info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <code className="text-sm font-mono font-semibold text-foreground">
                  {order.order_number}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={copyOrderNumber}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              <Badge variant="outline" className={cn("text-xs font-medium", statusConfig.color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full ml-1.5", statusConfig.dotColor)} />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={copyOrderNumber}>
                  <Copy className="w-4 h-4 ml-2" />
                  نسخ رقم الطلب
                </DropdownMenuItem>
                {order.link && (
                  <DropdownMenuItem onClick={openLink}>
                    <ExternalLink className="w-4 h-4 ml-2" />
                    فتح الرابط
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                  <Eye className="w-4 h-4 ml-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Service Name */}
        <h3 className="font-semibold text-foreground mb-3 line-clamp-1 group-hover:text-primary transition-colors">
          {order.service?.name}
        </h3>

        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>{order.quantity?.toLocaleString() || "-"}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(order.created_at), "d MMM", { locale: ar })}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="text-xs text-muted-foreground">ر.س</span>
            <span>{order.total_price.toFixed(2)}</span>
          </div>
          
          {order.external_order_id && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span className="truncate">{order.external_order_id}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", statusConfig.dotColor)}
              initial={{ width: 0 }}
              animate={{ width: `${statusConfig.progress}%` }}
              transition={{ duration: 1, delay: index * 0.05, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Time ago */}
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ar })}
        </p>
      </div>
    </motion.div>
  );
});

ModernOrderCard.displayName = 'ModernOrderCard';

export default ModernOrderCard;
