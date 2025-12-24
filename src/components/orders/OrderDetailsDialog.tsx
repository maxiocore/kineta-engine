import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Clock, Hash, Calendar, ShoppingBag, LinkIcon, 
  Copy, Check, ExternalLink, Zap, Shield, Timer, Loader2,
  CheckCircle, XCircle, AlertCircle, Package, Download,
  Share2, MessageCircle, MapPin
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import InteractiveTimeline from "./modern/InteractiveTimeline";

interface OrderDetailsDialogProps {
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
    case "pending": return { label: "قيد الانتظار", color: "bg-warning/10 text-warning border-warning/30", iconBg: "bg-gradient-to-br from-warning to-orange-500", icon: Clock, progress: 10 };
    case "processing": return { label: "قيد المعالجة", color: "bg-primary/10 text-primary border-primary/30", iconBg: "bg-gradient-to-br from-primary to-cyan-400", icon: Loader2, progress: 30 };
    case "in_progress": return { label: "قيد التنفيذ", color: "bg-accent/10 text-accent border-accent/30", iconBg: "bg-gradient-to-br from-accent to-purple-400", icon: Loader2, progress: 60 };
    case "completed": return { label: "مكتمل", color: "bg-success/10 text-success border-success/30", iconBg: "bg-gradient-to-br from-success to-emerald-400", icon: CheckCircle, progress: 100 };
    case "partial": return { label: "مكتمل جزئي", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", iconBg: "bg-gradient-to-br from-orange-500 to-amber-400", icon: AlertCircle, progress: 80 };
    case "cancelled": return { label: "ملغي", color: "bg-destructive/10 text-destructive border-destructive/30", iconBg: "bg-gradient-to-br from-destructive to-rose-400", icon: XCircle, progress: 0 };
    default: return { label: status, color: "bg-muted text-muted-foreground border-border", iconBg: "bg-muted", icon: Clock, progress: 0 };
  }
};

export const OrderDetailsDialog = ({ order, orderHistory, loadingHistory, onClose }: OrderDetailsDialogProps) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("تم نسخ الرابط");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareOrder = () => {
    if (navigator.share && order) {
      navigator.share({
        title: `طلب ${order.order_number}`,
        text: `تفاصيل الطلب: ${order.service?.name}`,
        url: window.location.href,
      });
    } else {
      toast.info("المشاركة غير مدعومة في هذا المتصفح");
    }
  };

  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={!!order} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0" dir="rtl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-l from-primary/5 to-transparent">
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-xl" onClick={shareOrder}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            
            <DialogTitle className="flex items-center gap-3 flex-row-reverse">
              <div className="text-right">
                <span className="text-lg">تفاصيل الطلب</span>
                <p className="text-sm font-normal text-muted-foreground font-mono">
                  {order.order_number}
                </p>
              </div>
              <motion.div 
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                  statusConfig.iconBg
                )}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <StatusIcon className={cn(
                  "w-6 h-6 text-white",
                  (order.status === "in_progress" || order.status === "processing") && "animate-spin"
                )} />
              </motion.div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-3 h-12 bg-muted/30 rounded-xl p-1">
              <TabsTrigger value="details" className="gap-2 rounded-lg data-[state=active]:shadow-md flex-row-reverse">
                التفاصيل
                <FileText className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="tracking" className="gap-2 rounded-lg data-[state=active]:shadow-md flex-row-reverse">
                التتبع
                <MapPin className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 rounded-lg data-[state=active]:shadow-md flex-row-reverse">
                السجل
                <Clock className="w-4 h-4" />
                {orderHistory.length > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                    {orderHistory.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 max-h-[55vh]">
            {/* Details Tab */}
            <TabsContent value="details" className="p-6 pt-4 space-y-4 m-0">
              {/* Status Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl border",
                  statusConfig.color.replace("text-", "bg-").replace("/10", "/5"),
                  statusConfig.color.split(" ")[2]
                )}
              >
                <div className="flex items-center justify-between mb-3 flex-row-reverse">
                  <span className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border flex-row-reverse",
                    statusConfig.color
                  )}>
                    {statusConfig.label}
                    <StatusIcon className={cn(
                      "w-4 h-4", 
                      (order.status === "in_progress" || order.status === "processing") && "animate-spin"
                    )} />
                  </span>
                  <span className="text-sm text-muted-foreground">حالة الطلب</span>
                </div>
                <Progress value={statusConfig.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {statusConfig.progress}% مكتمل
                </p>
              </motion.div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Hash, label: "رقم الطلب", value: order.order_number, mono: true },
                  { icon: Calendar, label: "تاريخ الطلب", value: format(new Date(order.created_at), "d MMMM yyyy", { locale: ar }) },
                  { icon: ShoppingBag, label: "الخدمة", value: order.service?.name, sub: order.service?.category },
                  { icon: Hash, label: "الكمية", value: order.quantity?.toLocaleString() || "-" },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors text-right"
                  >
                    <div className="flex items-center gap-2 mb-2 flex-row-reverse justify-end">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <p className={cn("font-medium", item.mono && "font-mono")}>{item.value}</p>
                    {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
                  </motion.div>
                ))}
              </div>

              {/* Link */}
              {order.link && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-card border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2 flex-row-reverse">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => copyToClipboard(order.link!)}
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        asChild
                      >
                        <a href={order.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <span className="text-sm text-muted-foreground">الرابط</span>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LinkIcon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                  <p className="font-mono text-sm break-all bg-secondary/50 p-3 rounded-lg" dir="ltr">
                    {order.link}
                  </p>
                </motion.div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Zap, label: "وقت التسليم", value: "فوري - 24 ساعة", gradient: "from-primary/10 to-primary/5", border: "border-primary/20", iconColor: "text-primary", iconBg: "bg-primary/10" },
                  { icon: Shield, label: "ضمان", value: "30 يوم", gradient: "from-success/10 to-success/5", border: "border-success/20", iconColor: "text-success", iconBg: "bg-success/10" },
                  { icon: Timer, label: "آخر تحديث", value: formatDistanceToNow(new Date(order.updated_at), { locale: ar, addSuffix: true }), gradient: "from-accent/10 to-accent/5", border: "border-accent/20", iconColor: "text-accent", iconBg: "bg-accent/10" },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className={cn(
                      "p-3 rounded-xl text-center border",
                      `bg-gradient-to-br ${item.gradient} ${item.border}`
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center", item.iconBg)}>
                      <item.icon className={cn("w-5 h-5", item.iconColor)} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                    <p className="font-bold text-xs">{item.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* معلومات المزود مخفية عن العملاء */}

              {/* Price Summary */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/20"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm flex-row-reverse">
                    <span>{(order.total_price + (order.discount_amount || 0)).toFixed(2)} ر.س</span>
                    <span className="text-muted-foreground">السعر الأساسي:</span>
                  </div>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-sm text-success flex-row-reverse">
                      <span>-{order.discount_amount.toFixed(2)} ر.س</span>
                      <span className="flex items-center gap-1 flex-row-reverse">
                        <Badge variant="secondary" className="text-success bg-success/10">خصم</Badge>
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center flex-row-reverse">
                    <motion.span 
                      className="text-2xl font-bold text-primary"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {order.total_price.toFixed(2)} ر.س
                    </motion.span>
                    <span className="text-muted-foreground font-medium">الإجمالي:</span>
                  </div>
                </div>
              </motion.div>

              {/* Notes */}
              {order.notes && (
                <div className="p-4 rounded-xl bg-card border border-border/50 text-right">
                  <div className="flex items-center gap-2 mb-2 flex-row-reverse justify-end">
                    <p className="text-sm text-muted-foreground">ملاحظاتك:</p>
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm bg-secondary/30 p-3 rounded-lg">{order.notes}</p>
                </div>
              )}
              {order.admin_notes && (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-right">
                  <div className="flex items-center gap-2 mb-2 flex-row-reverse justify-end">
                    <p className="text-sm font-medium text-warning">ملاحظات الإدارة:</p>
                    <AlertCircle className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-sm">{order.admin_notes}</p>
                </div>
              )}
            </TabsContent>

            {/* Tracking Tab - Interactive Timeline */}
            <TabsContent value="tracking" className="p-6 pt-4 m-0">
              <InteractiveTimeline
                status={order.status}
                createdAt={order.created_at}
                updatedAt={order.updated_at}
                externalStatus={order.external_status}
                externalOrderId={order.external_order_id}
                orderHistory={orderHistory}
                loadingHistory={loadingHistory}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="p-6 pt-4 m-0">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : orderHistory.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">لا يوجد سجل تحديثات بعد</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {orderHistory.map((item, index) => {
                    const historyStatus = getStatusConfig(item.new_status);
                    const HistoryIcon = historyStatus.icon;
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 flex-row-reverse"
                      >
                        <div className="flex flex-col items-center">
                          <motion.div 
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              index === 0 ? historyStatus.iconBg : "bg-muted"
                            )}
                            animate={index === 0 ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 2, repeat: index === 0 ? Infinity : 0 }}
                          >
                            <HistoryIcon className={cn(
                              "w-5 h-5",
                              index === 0 ? "text-white" : "text-muted-foreground"
                            )} />
                          </motion.div>
                          {index < orderHistory.length - 1 && (
                            <div className="w-px flex-1 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4 text-right">
                          <div className="flex items-center gap-2 mb-1 flex-wrap justify-end flex-row-reverse">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-medium border",
                              historyStatus.color
                            )}>
                              {historyStatus.label}
                            </span>
                            {item.old_status && (
                              <span className="text-xs text-muted-foreground">
                                من {getStatusConfig(item.old_status).label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "d MMMM yyyy - HH:mm", { locale: ar })}
                          </p>
                          {item.notes && (
                            <p className="text-sm mt-2 text-muted-foreground bg-muted/50 p-3 rounded-lg">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
