import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Clock, Hash, Calendar, ShoppingBag, LinkIcon, 
  Copy, Check, ExternalLink, Zap, Shield, Timer, Loader2,
  CheckCircle, XCircle, AlertCircle, Package, ChevronLeft,
  MessageCircle, RefreshCw, History, X
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
    case "pending": return { label: "قيد الانتظار", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", icon: Clock, progress: 10 };
    case "processing": return { label: "قيد المعالجة", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", icon: Loader2, progress: 30 };
    case "in_progress": return { label: "قيد التنفيذ", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", icon: Loader2, progress: 60 };
    case "completed": return { label: "مكتمل", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", icon: CheckCircle, progress: 100 };
    case "partial": return { label: "مكتمل جزئي", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", icon: AlertCircle, progress: 80 };
    case "cancelled": return { label: "ملغي", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800", icon: XCircle, progress: 0 };
    case "refunded": return { label: "مسترد", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-950/30", border: "border-slate-200 dark:border-slate-800", icon: RefreshCw, progress: 0 };
    default: return { label: status, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border", icon: Clock, progress: 0 };
  }
};

export const OrderDetailsSheet = ({ order, orderHistory, loadingHistory, onClose }: OrderDetailsSheetProps) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const isMobile = useIsMobile();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("تم نسخ الرابط");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Sheet open={!!order} onOpenChange={() => onClose()}>
      <SheetContent 
        side={isMobile ? "bottom" : "left"} 
        className={cn(
          "p-0 border-0",
          isMobile ? "h-[95vh] rounded-t-3xl" : "w-full sm:max-w-md"
        )} 
        dir="rtl"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className={cn(
            "border-b border-border/50 bg-card/50 sticky top-0 z-10",
            isMobile ? "p-4 pb-3" : "p-5"
          )}>
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
            )}
            <div className="flex items-center justify-between">
              <SheetTitle className="text-right flex-1">
                <span className={cn("font-medium text-foreground", isMobile ? "text-sm" : "text-base")}>
                  تفاصيل الطلب
                </span>
                <p className={cn("font-mono text-muted-foreground mt-0.5", isMobile ? "text-[10px]" : "text-xs")}>
                  {order.order_number}
                </p>
              </SheetTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("rounded-full", isMobile ? "h-7 w-7" : "h-8 w-8")} 
                onClick={onClose}
              >
                {isMobile ? <X className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className={cn("space-y-4", isMobile ? "p-4" : "p-5")}>
              {/* Status Card */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "rounded-xl border",
                  statusConfig.bg,
                  statusConfig.border,
                  isMobile ? "p-3" : "p-4"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-muted-foreground", isMobile ? "text-[10px]" : "text-xs")}>حالة الطلب</span>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 rounded-full font-medium",
                    statusConfig.bg,
                    statusConfig.color,
                    isMobile ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
                  )}>
                    <StatusIcon className={cn(
                      isMobile ? "w-3 h-3" : "w-3.5 h-3.5", 
                      (order.status === "in_progress" || order.status === "processing") && "animate-spin"
                    )} />
                    {statusConfig.label}
                  </div>
                </div>
                <Progress 
                  value={statusConfig.progress} 
                  className="h-1.5 bg-background/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                  {statusConfig.progress}% مكتمل
                </p>
              </motion.div>

              {/* Order Info Cards */}
              <div className="grid grid-cols-2 gap-2">
                <InfoCard 
                  icon={Hash}
                  label="رقم الطلب"
                  value={order.order_number}
                  mono
                  delay={0}
                  isMobile={isMobile}
                />
                <InfoCard 
                  icon={Calendar}
                  label="تاريخ الطلب"
                  value={format(new Date(order.created_at), "d MMM yyyy", { locale: ar })}
                  delay={0.05}
                  isMobile={isMobile}
                />
                <InfoCard 
                  icon={ShoppingBag}
                  label="الخدمة"
                  value={order.service?.name}
                  subValue={order.service?.category}
                  fullWidth
                  delay={0.1}
                  isMobile={isMobile}
                />
                <InfoCard 
                  icon={Hash}
                  label="الكمية"
                  value={order.quantity?.toLocaleString() || "-"}
                  delay={0.15}
                  isMobile={isMobile}
                />
                <InfoCard 
                  icon={Timer}
                  label="آخر تحديث"
                  value={formatDistanceToNow(new Date(order.updated_at), { locale: ar, addSuffix: true })}
                  delay={0.2}
                  isMobile={isMobile}
                />
              </div>

              {/* Link Section */}
              {order.link && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className={cn("rounded-xl bg-card border border-border/50", isMobile ? "p-3" : "p-4")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("rounded-lg bg-muted flex items-center justify-center", isMobile ? "w-6 h-6" : "w-7 h-7")}>
                        <LinkIcon className={cn("text-muted-foreground", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
                      </div>
                      <span className={cn("text-muted-foreground", isMobile ? "text-[10px]" : "text-xs")}>الرابط</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("rounded-lg", isMobile ? "h-6 w-6" : "h-7 w-7")}
                        onClick={() => copyToClipboard(order.link!)}
                      >
                        {copiedLink ? <Check className={cn("text-emerald-500", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} /> : <Copy className={cn(isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("rounded-lg", isMobile ? "h-6 w-6" : "h-7 w-7")}
                        asChild
                      >
                        <a href={order.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className={cn(isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <p className={cn("font-mono break-all bg-muted/50 rounded-lg text-muted-foreground", isMobile ? "text-[10px] p-2" : "text-xs p-2.5")} dir="ltr">
                    {order.link}
                  </p>
                </motion.div>
              )}

              {/* Features Row */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="grid grid-cols-2 gap-2"
              >
                <div className={cn("rounded-xl bg-card border border-border/50 flex items-center gap-2", isMobile ? "p-2" : "p-3")}>
                  <div className={cn("rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center", isMobile ? "w-7 h-7" : "w-9 h-9")}>
                    <Zap className={cn("text-emerald-600 dark:text-emerald-400", isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">وقت التسليم</p>
                    <p className={cn("font-medium", isMobile ? "text-[10px]" : "text-xs")}>فوري - 24 ساعة</p>
                  </div>
                </div>
                <div className={cn("rounded-xl bg-card border border-border/50 flex items-center gap-2", isMobile ? "p-2" : "p-3")}>
                  <div className={cn("rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center", isMobile ? "w-7 h-7" : "w-9 h-9")}>
                    <Shield className={cn("text-blue-600 dark:text-blue-400", isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">الضمان</p>
                    <p className={cn("font-medium", isMobile ? "text-[10px]" : "text-xs")}>30 يوم</p>
                  </div>
                </div>
              </motion.div>

              {/* Provider Status */}
              {(order.external_order_id || order.external_status) && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  className={cn("rounded-xl bg-card border border-border/50", isMobile ? "p-3" : "p-4")}
                >
                  <div className={cn("flex items-center gap-2", isMobile ? "mb-2" : "mb-3")}>
                    <div className={cn("rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center", isMobile ? "w-6 h-6" : "w-7 h-7")}>
                      <Package className={cn("text-violet-600 dark:text-violet-400", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
                    </div>
                    <span className={cn("font-medium", isMobile ? "text-[10px]" : "text-xs")}>حالة المزود</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {order.external_order_id && (
                      <div>
                        <span className="text-[10px] text-muted-foreground">رقم الطلب</span>
                        <p className={cn("font-mono font-medium", isMobile ? "text-[10px]" : "text-xs")}>{order.external_order_id}</p>
                      </div>
                    )}
                    {order.external_status && (
                      <div>
                        <span className="text-[10px] text-muted-foreground">الحالة</span>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "mt-0.5 text-[10px] h-5",
                            order.external_status === 'Completed' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
                            order.external_status === 'In progress' && "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
                            order.external_status === 'Pending' && "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
                            order.external_status === 'Partial' && "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
                            order.external_status === 'Canceled' && "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                          )}
                        >
                          {order.external_status === 'Completed' ? 'مكتمل' :
                           order.external_status === 'In progress' ? 'قيد التنفيذ' :
                           order.external_status === 'Pending' || order.external_status === 'pending' ? 'قيد الانتظار' :
                           order.external_status === 'Partial' ? 'مكتمل جزئياً' :
                           order.external_status === 'Canceled' ? 'ملغي' :
                           order.external_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Price Summary */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className={cn("rounded-xl bg-card border border-border/50", isMobile ? "p-3" : "p-4")}
              >
                <div className={cn("space-y-1.5", isMobile ? "text-[11px]" : "text-xs")}>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">السعر الأساسي</span>
                    <span>{(order.total_price + (order.discount_amount || 0)).toFixed(2)} ر.س</span>
                  </div>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px] h-4 bg-emerald-50 dark:bg-emerald-950/30">خصم</Badge>
                      </span>
                      <span>-{order.discount_amount.toFixed(2)} ر.س</span>
                    </div>
                  )}
                  <Separator className="my-1.5" />
                  <div className="flex justify-between items-center">
                    <span className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>الإجمالي</span>
                    <span className={cn("font-bold text-primary", isMobile ? "text-base" : "text-lg")}>
                      {order.total_price.toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Notes */}
              {order.notes && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.3 }}
                  className={cn("rounded-xl bg-card border border-border/50", isMobile ? "p-3" : "p-4")}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageCircle className={cn("text-muted-foreground", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
                    <span className={cn("text-muted-foreground", isMobile ? "text-[10px]" : "text-xs")}>ملاحظاتك</span>
                  </div>
                  <p className={cn("bg-muted/30 rounded-lg", isMobile ? "text-[10px] p-2" : "text-xs p-2.5")}>{order.notes}</p>
                </motion.div>
              )}

              {order.admin_notes && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className={cn("rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800", isMobile ? "p-3" : "p-4")}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertCircle className={cn("text-amber-600 dark:text-amber-400", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
                    <span className={cn("font-medium text-amber-600 dark:text-amber-400", isMobile ? "text-[10px]" : "text-xs")}>ملاحظات الإدارة</span>
                  </div>
                  <p className={cn(isMobile ? "text-[10px]" : "text-xs")}>{order.admin_notes}</p>
                </motion.div>
              )}

              {/* Order History */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.3 }}
                className={cn("rounded-xl bg-card border border-border/50", isMobile ? "p-3" : "p-4")}
              >
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("rounded-lg bg-muted flex items-center justify-center", isMobile ? "w-6 h-6" : "w-7 h-7")}>
                      <History className={cn("text-muted-foreground", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
                    </div>
                    <span className={cn("font-medium", isMobile ? "text-[10px]" : "text-xs")}>سجل التحديثات</span>
                    {orderHistory.length > 0 && (
                      <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
                        {orderHistory.length}
                      </Badge>
                    )}
                  </div>
                  <ChevronLeft className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    showHistory && "-rotate-90"
                  )} />
                </button>

                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3"
                  >
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : orderHistory.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-4">
                        لا يوجد سجل تحديثات
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {orderHistory.map((item, index) => {
                          const historyStatus = getStatusConfig(item.new_status);
                          const HistoryIcon = historyStatus.icon;
                          
                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                historyStatus.bg
                              )}>
                                <HistoryIcon className={cn("w-3 h-3", historyStatus.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    historyStatus.bg,
                                    historyStatus.color
                                  )}>
                                    {historyStatus.label}
                                  </span>
                                  {item.old_status && (
                                    <span className="text-[10px] text-muted-foreground">
                                      من {getStatusConfig(item.old_status).label}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {format(new Date(item.created_at), "d MMM - HH:mm", { locale: ar })}
                                </p>
                                {item.notes && (
                                  <p className="text-[10px] mt-1 text-muted-foreground">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Helper component for info cards
interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  mono?: boolean;
  fullWidth?: boolean;
  delay?: number;
  isMobile?: boolean;
}

const InfoCard = ({ icon: Icon, label, value, subValue, mono, fullWidth, delay = 0, isMobile }: InfoCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={cn(
      "rounded-xl bg-card border border-border/50",
      fullWidth && "col-span-2",
      isMobile ? "p-2.5" : "p-3"
    )}
  >
    <div className={cn("flex items-center gap-2", isMobile ? "mb-1" : "mb-1.5")}>
      <div className={cn(
        "rounded-lg bg-muted flex items-center justify-center",
        isMobile ? "w-6 h-6" : "w-7 h-7"
      )}>
        <Icon className={cn("text-muted-foreground", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
    <p className={cn("font-medium truncate", mono && "font-mono", isMobile ? "text-[11px]" : "text-xs")}>{value}</p>
    {subValue && <p className="text-[10px] text-muted-foreground truncate">{subValue}</p>}
  </motion.div>
);

export default OrderDetailsSheet;
