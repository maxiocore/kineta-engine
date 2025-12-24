import React, { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Code, Clock, CheckCircle, AlertCircle, XCircle, Loader2, 
  Copy, Check, Calendar, GitBranch, Terminal, RotateCcw, Zap,
  FileCode, Database, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface DevOrderCardProps {
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
        label: "قيد التطوير", 
        bgColor: "bg-emerald-500/15",
        textColor: "text-emerald-400",
        borderColor: "border-emerald-500/30",
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

const getProjectIcon = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('web') || cat.includes('frontend')) return Globe;
  if (cat.includes('database') || cat.includes('backend')) return Database;
  if (cat.includes('api')) return Terminal;
  return FileCode;
};

export const DevOrderCard = memo(({ order, index, onClick }: DevOrderCardProps) => {
  const [copied, setCopied] = useState(false);
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const ProjectIcon = getProjectIcon(order.service?.category);

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
      className="group relative bg-gradient-to-br from-card via-card to-emerald-500/5 rounded-3xl border border-border/50 overflow-hidden cursor-pointer hover:border-emerald-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10"
      onClick={onClick}
    >
      {/* Terminal-like Header */}
      <div className="bg-gradient-to-l from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <div className="flex-1 text-center">
          <code className="text-xs text-zinc-400 font-mono">{order.order_number}</code>
        </div>
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          onClick={copyOrderNumber}
          className="p-1 rounded hover:bg-zinc-700/50 transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </motion.button>
      </div>

      <div className="relative p-5">
        {/* Decorative Code Lines */}
        <div className="absolute top-4 left-4 opacity-10 pointer-events-none">
          <code className="text-[10px] text-emerald-500 font-mono block">{"const project = {"}</code>
          <code className="text-[10px] text-emerald-500 font-mono block">{"  status: 'active'"}</code>
          <code className="text-[10px] text-emerald-500 font-mono block">{"}"}</code>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <motion.div 
              className="relative"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Code className="w-8 h-8 text-white" />
              </div>
              <motion.div 
                className="absolute -bottom-1 -left-1 w-6 h-6 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              </motion.div>
            </motion.div>

            <div>
              <h3 className="font-bold text-base text-foreground line-clamp-1 mb-1">
                {order.service?.name}
              </h3>
              <div className="flex items-center gap-2">
                <ProjectIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">مشروع برمجي</span>
              </div>
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

        {/* Progress with Git-like visualization */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-muted-foreground">تقدم المشروع</span>
            </div>
            <span className={cn("font-bold font-mono", statusConfig.textColor)}>{statusConfig.progress}%</span>
          </div>
          <div className="relative h-3 rounded-full bg-zinc-800/50 overflow-hidden border border-zinc-700/50">
            <motion.div
              className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-emerald-500 via-teal-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${statusConfig.progress}%` }}
              transition={{ duration: 1, delay: index * 0.05 }}
            />
            {/* Animated dots on progress */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-lg shadow-emerald-500/50"
              style={{ right: `calc(${statusConfig.progress}% - 4px)` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
            <p className="text-[10px] text-muted-foreground mb-1">التكلفة</p>
            <p className="text-lg font-bold text-emerald-500 font-mono">{order.total_price.toFixed(0)} ر.س</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
            <p className="text-[10px] text-muted-foreground mb-1">الكود</p>
            <div className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-bold">نظيف 100%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(order.created_at), "d MMMM yyyy", { locale: ar })}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-emerald-500 font-medium">نشط</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

DevOrderCard.displayName = "DevOrderCard";

export default DevOrderCard;
