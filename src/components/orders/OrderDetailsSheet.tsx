import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Hash, Calendar, ShoppingBag, LinkIcon, 
  Copy, Check, ExternalLink, Zap, Shield, Timer, Loader2,
  CheckCircle, XCircle, AlertCircle, Package, ChevronLeft,
  MessageCircle, RefreshCw, History, X, Download, FileText,
  Sparkles, TrendingUp, RotateCcw, ArrowRight, Circle
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import jsPDF from "jspdf";
import { useAuth } from "@/hooks/useAuth";

interface OrderDetailsSheetProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    total_price: number;
    notes: string | null;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    link: string | null;
    quantity: number | null;
    external_order_id: string | null;
    external_status: string | null;
    discount_amount: number | null;
    service: {
      id: string;
      name: string;
      price: number;
      category: string;
      description: string | null;
    };
  } | null;
  orderHistory: {
    id: string;
    old_status: string | null;
    new_status: string;
    created_at: string;
    notes: string | null;
  }[];
  loadingHistory: boolean;
  onClose: () => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": 
      return { 
        label: "قيد الانتظار", 
        color: "text-amber-600 dark:text-amber-400", 
        bg: "bg-amber-50 dark:bg-amber-950/30", 
        border: "border-amber-200 dark:border-amber-800", 
        gradient: "from-amber-500 to-orange-500",
        glowColor: "shadow-amber-500/30",
        icon: Clock, 
        progress: 10 
      };
    case "processing": 
      return { 
        label: "قيد المعالجة", 
        color: "text-blue-600 dark:text-blue-400", 
        bg: "bg-blue-50 dark:bg-blue-950/30", 
        border: "border-blue-200 dark:border-blue-800", 
        gradient: "from-blue-500 to-cyan-500",
        glowColor: "shadow-blue-500/30",
        icon: Loader2, 
        progress: 30 
      };
    case "in_progress": 
      return { 
        label: "قيد التنفيذ", 
        color: "text-violet-600 dark:text-violet-400", 
        bg: "bg-violet-50 dark:bg-violet-950/30", 
        border: "border-violet-200 dark:border-violet-800", 
        gradient: "from-violet-500 to-purple-500",
        glowColor: "shadow-violet-500/30",
        icon: Zap, 
        progress: 60 
      };
    case "completed": 
      return { 
        label: "مكتمل", 
        color: "text-emerald-600 dark:text-emerald-400", 
        bg: "bg-emerald-50 dark:bg-emerald-950/30", 
        border: "border-emerald-200 dark:border-emerald-800", 
        gradient: "from-emerald-500 to-green-500",
        glowColor: "shadow-emerald-500/30",
        icon: CheckCircle, 
        progress: 100 
      };
    case "partial": 
      return { 
        label: "مكتمل جزئي", 
        color: "text-orange-600 dark:text-orange-400", 
        bg: "bg-orange-50 dark:bg-orange-950/30", 
        border: "border-orange-200 dark:border-orange-800", 
        gradient: "from-orange-500 to-amber-500",
        glowColor: "shadow-orange-500/30",
        icon: AlertCircle, 
        progress: 80 
      };
    case "cancelled": 
      return { 
        label: "ملغي", 
        color: "text-rose-600 dark:text-rose-400", 
        bg: "bg-rose-50 dark:bg-rose-950/30", 
        border: "border-rose-200 dark:border-rose-800", 
        gradient: "from-rose-500 to-red-500",
        glowColor: "shadow-rose-500/30",
        icon: XCircle, 
        progress: 0 
      };
    case "refunded": 
      return { 
        label: "مسترد", 
        color: "text-slate-600 dark:text-slate-400", 
        bg: "bg-slate-50 dark:bg-slate-950/30", 
        border: "border-slate-200 dark:border-slate-800", 
        gradient: "from-slate-500 to-gray-500",
        glowColor: "shadow-slate-500/30",
        icon: RotateCcw, 
        progress: 0 
      };
    default: 
      return { 
        label: status, 
        color: "text-muted-foreground", 
        bg: "bg-muted/50", 
        border: "border-border", 
        gradient: "from-muted to-muted",
        glowColor: "shadow-muted/30",
        icon: Clock, 
        progress: 0 
      };
  }
};

// Animated Timeline Component
const AnimatedTimeline = ({ 
  history, 
  loading,
  isMobile 
}: { 
  history: OrderDetailsSheetProps['orderHistory'];
  loading: boolean;
  isMobile: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
        >
          <History className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-10 text-center"
      >
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <History className="w-8 h-8 text-muted-foreground/50" />
        </motion.div>
        <p className="text-sm text-muted-foreground">لا يوجد سجل تحديثات</p>
      </motion.div>
    );
  }

  return (
    <div className="relative pr-6">
      {/* Animated Timeline Line */}
      <motion.div 
        className="absolute right-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-muted rounded-full"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ originY: 0 }}
      />
      
      <div className="space-y-4">
        {history.map((item, index) => {
          const historyStatus = getStatusConfig(item.new_status);
          const HistoryIcon = historyStatus.icon;
          const isFirst = index === 0;
          const isAnimating = item.new_status === "in_progress" || item.new_status === "processing";
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 300 }}
              className="relative"
            >
              {/* Timeline Node */}
              <motion.div 
                className={cn(
                  "absolute -right-[1.15rem] w-5 h-5 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br shadow-lg z-10",
                  historyStatus.gradient,
                  historyStatus.glowColor
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.4, type: "spring", stiffness: 400 }}
              >
                <HistoryIcon className={cn(
                  "w-2.5 h-2.5 text-white",
                  isAnimating && "animate-spin"
                )} />
                
                {/* Pulse Ring for First Item */}
                {isFirst && (
                  <motion.div
                    className={cn("absolute inset-0 rounded-full bg-gradient-to-br", historyStatus.gradient)}
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Content Card */}
              <motion.div
                className={cn(
                  "mr-4 rounded-2xl border overflow-hidden",
                  isFirst ? "bg-card shadow-lg" : "bg-card/50",
                  historyStatus.border
                )}
                whileHover={{ scale: 1.02, x: -4 }}
                transition={{ duration: 0.2 }}
              >
                {/* Status Header */}
                <div className={cn(
                  "px-4 py-3 flex items-center justify-between",
                  historyStatus.bg
                )}>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-lg border-0",
                        "bg-gradient-to-r text-white shadow-md",
                        historyStatus.gradient
                      )}
                    >
                      <HistoryIcon className={cn("w-3 h-3 ml-1.5", isAnimating && "animate-spin")} />
                      {historyStatus.label}
                    </Badge>
                    
                    {item.old_status && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>من</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-medium",
                          getStatusConfig(item.old_status).bg,
                          getStatusConfig(item.old_status).color
                        )}>
                          {getStatusConfig(item.old_status).label}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {isFirst && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </motion.div>
                  )}
                </div>

                {/* Details */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(item.created_at), "d MMMM yyyy", { locale: ar })}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{format(new Date(item.created_at), "HH:mm", { locale: ar })}</span>
                  </div>
                  
                  {item.notes && (
                    <motion.p 
                      className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                    >
                      <MessageCircle className="w-3 h-3 inline-block ml-1" />
                      {item.notes}
                    </motion.p>
                  )}
                  
                  {/* Time Ago */}
                  <p className="mt-2 text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ar })}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Progress Steps Component
const OrderProgressSteps = ({ status, isMobile }: { status: string; isMobile: boolean }) => {
  const steps = [
    { key: "pending", label: "تم الاستلام", icon: Package },
    { key: "processing", label: "قيد المعالجة", icon: Loader2 },
    { key: "in_progress", label: "قيد التنفيذ", icon: Zap },
    { key: "completed", label: "مكتمل", icon: CheckCircle },
  ];

  const currentIndex = steps.findIndex(s => s.key === status);
  const isCancelled = status === "cancelled" || status === "refunded";

  if (isCancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center gap-4 py-6"
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-xl shadow-rose-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {status === "cancelled" ? (
            <XCircle className="w-8 h-8 text-white" />
          ) : (
            <RotateCcw className="w-8 h-8 text-white" />
          )}
        </motion.div>
        <div>
          <p className="font-bold text-lg text-rose-600 dark:text-rose-400">
            {status === "cancelled" ? "تم إلغاء الطلب" : "تم استرداد المبلغ"}
          </p>
          <p className="text-sm text-muted-foreground">
            {status === "cancelled" ? "لقد تم إلغاء هذا الطلب" : "تم إرجاع المبلغ لرصيدك"}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Progress Line */}
      <div className="absolute top-1/2 right-8 left-8 h-1 bg-muted rounded-full -translate-y-1/2">
        <motion.div
          className="h-full bg-gradient-to-l from-primary to-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, currentIndex) / (steps.length - 1) * 100}%` }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isActive = step.key === "processing" || step.key === "in_progress";
          const stepConfig = getStatusConfig(step.key);

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 + 0.2 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className={cn(
                  "relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg z-10",
                  isCompleted 
                    ? `bg-gradient-to-br ${stepConfig.gradient} ${stepConfig.glowColor}` 
                    : "bg-muted"
                )}
                animate={isCurrent && isActive ? { 
                  boxShadow: ["0 0 0 0 rgba(0,0,0,0)", "0 0 20px 5px rgba(147,51,234,0.3)", "0 0 0 0 rgba(0,0,0,0)"]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.1 }}
              >
                <StepIcon className={cn(
                  "w-6 h-6",
                  isCompleted ? "text-white" : "text-muted-foreground",
                  isCurrent && isActive && "animate-pulse"
                )} />
                
                {/* Current Step Ring */}
                {isCurrent && (
                  <motion.div
                    className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br", stepConfig.gradient)}
                    animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              <motion.p
                className={cn(
                  "mt-2 text-xs font-medium text-center",
                  isCurrent ? "text-primary" : isCompleted ? stepConfig.color : "text-muted-foreground"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.15 + 0.4 }}
              >
                {step.label}
              </motion.p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const OrderDetailsSheet = ({ order, orderHistory, loadingHistory, onClose }: OrderDetailsSheetProps) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("تم نسخ الرابط");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Generate PDF Invoice
  const generatePDF = useCallback(() => {
    if (!order) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const invoiceNumber = `ORD-${order.order_number}`;
    
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      in_progress: 'In Progress',
      completed: 'Completed',
      partial: 'Partial',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('KINETA', 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Order Invoice', 105, 38, { align: 'center' });
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceNumber, 20, 72);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Order Number:', 20, 82);
    doc.setFont('helvetica', 'normal');
    doc.text(order.order_number, 20, 89);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 20, 99);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'), 20, 106);
    
    const statusText = statusLabels[order.status] || order.status;
    let statusColor: [number, number, number] = [100, 100, 100];
    if (order.status === 'completed') statusColor = [34, 197, 94];
    else if (order.status === 'pending') statusColor = [234, 179, 8];
    else if (order.status === 'in_progress' || order.status === 'processing') statusColor = [59, 130, 246];
    else if (order.status === 'cancelled' || order.status === 'refunded') statusColor = [239, 68, 68];
    else if (order.status === 'partial') statusColor = [249, 115, 22];
    
    doc.setFillColor(...statusColor);
    doc.roundedRect(140, 60, 50, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, 165, 69, { align: 'center' });
    
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(20, 115, 190, 115);
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 120, 170, 35, 3, 3, 'F');
    
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Service Information', 25, 130);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const serviceName = order.service?.name || 'N/A';
    const truncatedName = serviceName.length > 40 ? serviceName.substring(0, 37) + '...' : serviceName;
    doc.text('Service: ' + truncatedName, 25, 140);
    doc.text('Category: ' + (order.service?.category || 'N/A'), 25, 148);
    
    if (order.quantity) {
      doc.text('Quantity: ' + order.quantity.toLocaleString(), 130, 140);
    }
    
    if (order.link) {
      const truncatedLink = order.link.length > 50 ? order.link.substring(0, 47) + '...' : order.link;
      doc.setFontSize(8);
      doc.text('Link: ' + truncatedLink, 25, 152);
    }
    
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details', 25, 168);
    
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(20, 173, 170, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Description', 25, 180);
    doc.text('Amount (SAR)', 165, 180, { align: 'right' });
    
    let yPos = 193;
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    
    const basePrice = order.total_price + (order.discount_amount || 0);
    doc.setFillColor(252, 252, 252);
    doc.rect(20, yPos - 7, 170, 12, 'F');
    doc.text('Service Price', 25, yPos);
    doc.text(basePrice.toFixed(2), 185, yPos, { align: 'right' });
    yPos += 15;
    
    if (order.discount_amount && order.discount_amount > 0) {
      doc.setFillColor(240, 253, 244);
      doc.rect(20, yPos - 7, 170, 12, 'F');
      doc.setTextColor(22, 163, 74);
      doc.text('Discount', 25, yPos);
      doc.text('-' + order.discount_amount.toFixed(2), 185, yPos, { align: 'right' });
      doc.setTextColor(60, 60, 60);
      yPos += 15;
    }
    
    yPos += 5;
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(1);
    doc.line(20, yPos - 3, 190, yPos - 3);
    
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(20, yPos, 170, 16, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Paid', 25, yPos + 11);
    doc.text(order.total_price.toFixed(2) + ' SAR', 185, yPos + 11, { align: 'right' });
    
    yPos += 30;
    
    if (order.notes) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Notes:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(order.notes.substring(0, 80), 25, yPos + 7);
      yPos += 18;
    }
    
    if (order.admin_notes) {
      doc.setTextColor(180, 120, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Admin Notes:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(order.admin_notes.substring(0, 80), 25, yPos + 7);
    }
    
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(20, 265, 190, 265);
    
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This is an electronically generated invoice.', 105, 272, { align: 'center' });
    doc.text('Thank you for using our services!', 105, 278, { align: 'center' });
    doc.text('Generated: ' + format(new Date(), 'dd/MM/yyyy HH:mm'), 105, 284, { align: 'center' });
    
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 290, 210, 7, 'F');
    
    doc.save(`Invoice-${invoiceNumber}.pdf`);
    
    toast.success('تم تحميل الفاتورة بنجاح');
  }, [order]);

  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const isAnimating = order.status === "in_progress" || order.status === "processing";

  return (
    <Sheet open={!!order} onOpenChange={() => onClose()}>
      <SheetContent 
        side={isMobile ? "bottom" : "left"} 
        className={cn(
          "p-0 border-0",
          isMobile ? "h-[95vh] rounded-t-3xl" : "w-full sm:max-w-lg"
        )} 
        dir="rtl"
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Header */}
          <SheetHeader className={cn(
            "border-b border-border/50 sticky top-0 z-10 overflow-hidden",
            isMobile ? "p-4 pb-3" : "p-5"
          )}>
            {/* Background Gradient */}
            <motion.div 
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-10",
                statusConfig.gradient
              )}
              animate={{ 
                opacity: [0.05, 0.15, 0.05]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
            )}
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Animated Status Icon */}
                <motion.div
                  className={cn(
                    "relative w-14 h-14 rounded-2xl flex items-center justify-center",
                    "bg-gradient-to-br shadow-xl",
                    statusConfig.gradient,
                    statusConfig.glowColor
                  )}
                  animate={isAnimating ? { 
                    boxShadow: ["0 10px 30px rgba(0,0,0,0.2)", "0 15px 40px rgba(0,0,0,0.3)", "0 10px 30px rgba(0,0,0,0.2)"]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <StatusIcon className={cn("w-7 h-7 text-white", isAnimating && "animate-pulse")} />
                  
                  {/* Pulse Ring */}
                  {isAnimating && (
                    <motion.div
                      className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br", statusConfig.gradient)}
                      animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  
                  {/* Completed Sparkle */}
                  {order.status === "completed" && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </motion.div>
                  )}
                </motion.div>
                
                <SheetTitle className="text-right">
                  <span className="font-bold text-lg text-foreground">تفاصيل الطلب</span>
                  <motion.code 
                    className="block font-mono text-sm text-primary mt-1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {order.order_number}
                  </motion.code>
                </SheetTitle>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-colors" 
                onClick={onClose}
              >
                {isMobile ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className={cn("space-y-5", isMobile ? "p-4" : "p-5")}>
              {/* Progress Steps */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl bg-card border border-border/50 p-5"
              >
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  حالة الطلب
                </h3>
                <OrderProgressSteps status={order.status} isMobile={isMobile} />
              </motion.div>

              {/* Order Info Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-3"
              >
                <InfoCard 
                  icon={ShoppingBag}
                  label="الخدمة"
                  value={order.service?.name}
                  subValue={order.service?.category}
                  fullWidth
                  gradient="from-primary/10 to-accent/10"
                  delay={0}
                  isMobile={isMobile}
                />
                <InfoCard 
                  icon={Hash}
                  label="الكمية"
                  value={order.quantity?.toLocaleString() || "-"}
                  gradient="from-violet-500/10 to-purple-500/10"
                  delay={0.05}
                  isMobile={isMobile}
                />
                <InfoCard 
                  icon={Calendar}
                  label="تاريخ الطلب"
                  value={format(new Date(order.created_at), "d MMM yyyy", { locale: ar })}
                  gradient="from-blue-500/10 to-cyan-500/10"
                  delay={0.1}
                  isMobile={isMobile}
                />
              </motion.div>

              {/* Link Section */}
              {order.link && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-2xl bg-card border border-border/50 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
                        <LinkIcon className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">الرابط</span>
                    </div>
                    <div className="flex gap-2">
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => copyToClipboard(order.link!)}
                        >
                          <AnimatePresence mode="wait">
                            {copiedLink ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Check className="w-4 h-4 text-emerald-500" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="copy"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Copy className="w-4 h-4" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          asChild
                        >
                          <a href={order.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                  <p className="font-mono text-xs break-all bg-muted/50 rounded-xl p-3 text-muted-foreground" dir="ltr">
                    {order.link}
                  </p>
                </motion.div>
              )}

              {/* Price Summary */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border border-primary/20 p-5"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">السعر الأساسي</span>
                    <span className="font-medium">{(order.total_price + (order.discount_amount || 0)).toFixed(2)} ر.س</span>
                  </div>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-2">
                        <Badge className="text-[10px] bg-emerald-500/20 text-emerald-600 border-0">خصم</Badge>
                      </span>
                      <span className="font-medium">-{order.discount_amount.toFixed(2)} ر.س</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">الإجمالي المدفوع</span>
                    <motion.span 
                      className="text-2xl font-bold text-primary"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {order.total_price.toFixed(2)} <span className="text-sm text-muted-foreground">ر.س</span>
                    </motion.span>
                  </div>
                </div>
              </motion.div>

              {/* Download Invoice */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={generatePDF}
                  className="w-full gap-3 rounded-2xl h-12 bg-gradient-to-l from-primary to-accent hover:shadow-xl hover:shadow-primary/30 transition-all"
                  size="lg"
                >
                  <Download className="w-5 h-5" />
                  تحميل الفاتورة PDF
                </Button>
              </motion.div>

              {/* Notes */}
              {order.notes && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl bg-card border border-border/50 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">ملاحظاتك</span>
                  </div>
                  <p className="text-sm bg-muted/30 rounded-xl p-3">{order.notes}</p>
                </motion.div>
              )}

              {order.admin_notes && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">ملاحظات الإدارة</span>
                  </div>
                  <p className="text-sm">{order.admin_notes}</p>
                </motion.div>
              )}

              {/* Order History Timeline */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-card border border-border/50 p-5"
              >
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center justify-between w-full mb-4"
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <History className="w-5 h-5 text-primary" />
                    </motion.div>
                    <div className="text-right">
                      <span className="font-semibold text-sm">سجل التحديثات</span>
                      {orderHistory.length > 0 && (
                        <Badge variant="secondary" className="mr-2 text-[10px]">
                          {orderHistory.length} تحديث
                        </Badge>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: showHistory ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <AnimatedTimeline 
                        history={orderHistory} 
                        loading={loadingHistory}
                        isMobile={isMobile}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Enhanced Info Card Component
interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  mono?: boolean;
  fullWidth?: boolean;
  delay?: number;
  isMobile?: boolean;
  gradient?: string;
}

const InfoCard = ({ icon: Icon, label, value, subValue, mono, fullWidth, delay = 0, isMobile, gradient = "from-muted/50 to-muted/30" }: InfoCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={cn(
      "rounded-2xl bg-gradient-to-br border border-border/50 p-4 cursor-pointer transition-all duration-300",
      fullWidth && "col-span-2",
      gradient
    )}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="w-9 h-9 rounded-xl bg-card shadow-sm flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
    <p className={cn("font-semibold text-sm truncate", mono && "font-mono")}>{value}</p>
    {subValue && <p className="text-xs text-muted-foreground truncate mt-1">{subValue}</p>}
  </motion.div>
);

export default OrderDetailsSheet;
