import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Hash, Calendar, ShoppingBag, LinkIcon, 
  Copy, Check, ExternalLink, Zap, Shield, Loader2,
  CheckCircle, XCircle, AlertCircle, Package, ArrowRight,
  MessageCircle, RefreshCw, History, Download,
  Sparkles, TrendingUp, RotateCcw, DollarSign, 
  FileText, Share2, Printer, Star, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";

interface Order {
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
}

interface OrderStatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
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

const ClientOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
      fetchOrderHistory();

      // Realtime subscription
      const channel = supabase
        .channel(`order-${orderId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, (payload) => {
          setOrder(prev => prev ? { ...prev, ...payload.new } : null);
          fetchOrderHistory();
          toast.info("تم تحديث حالة الطلب");
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, orderId]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, notes, admin_notes, 
        created_at, updated_at, link, quantity, external_order_id, 
        external_status, discount_amount, 
        service:services(id, name, price, category, description)
      `)
      .eq("id", orderId)
      .eq("user_id", user?.id)
      .single();
    
    if (error || !data) {
      toast.error("لم يتم العثور على الطلب");
      navigate('/dashboard/orders');
    } else {
      setOrder(data as unknown as Order);
    }
    setLoading(false);
  };

  const fetchOrderHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    
    if (!error && data) setOrderHistory(data);
    setLoadingHistory(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("تم نسخ الرابط");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const generatePDF = useCallback(() => {
    if (!order) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      in_progress: 'In Progress',
      completed: 'Completed',
      partial: 'Partial',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    
    // Header
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('MARKETO', 105, 25, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Order Invoice', 105, 38, { align: 'center' });
    
    // Order Info
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Number:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(order.order_number, 20, 72);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 20, 82);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'), 20, 89);
    
    // Status badge
    const statusText = statusLabels[order.status] || order.status;
    let statusColor: [number, number, number] = [100, 100, 100];
    if (order.status === 'completed') statusColor = [34, 197, 94];
    else if (order.status === 'pending') statusColor = [234, 179, 8];
    else if (order.status === 'in_progress' || order.status === 'processing') statusColor = [59, 130, 246];
    else if (order.status === 'cancelled' || order.status === 'refunded') statusColor = [239, 68, 68];
    
    doc.setFillColor(...statusColor);
    doc.roundedRect(140, 60, 50, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, 165, 69, { align: 'center' });
    
    // Service Info
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(20, 100, 190, 100);
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 105, 170, 35, 3, 3, 'F');
    
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Service Information', 25, 115);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const serviceName = order.service?.name || 'N/A';
    doc.text('Service: ' + serviceName.substring(0, 40), 25, 125);
    doc.text('Category: ' + (order.service?.category || 'N/A'), 25, 133);
    if (order.quantity) {
      doc.text('Quantity: ' + order.quantity.toLocaleString(), 130, 125);
    }
    
    // Price
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details', 25, 155);
    
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(20, 160, 170, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Description', 25, 167);
    doc.text('Amount (SAR)', 165, 167, { align: 'right' });
    
    let yPos = 180;
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    
    const basePrice = order.total_price + (order.discount_amount || 0);
    doc.text('Service Price', 25, yPos);
    doc.text(basePrice.toFixed(2), 185, yPos, { align: 'right' });
    yPos += 12;
    
    if (order.discount_amount && order.discount_amount > 0) {
      doc.setTextColor(22, 163, 74);
      doc.text('Discount', 25, yPos);
      doc.text('-' + order.discount_amount.toFixed(2), 185, yPos, { align: 'right' });
      doc.setTextColor(60, 60, 60);
      yPos += 12;
    }
    
    yPos += 5;
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(20, yPos, 170, 16, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Paid', 25, yPos + 11);
    doc.text(order.total_price.toFixed(2) + ' SAR', 185, yPos + 11, { align: 'right' });
    
    // Footer
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(20, 265, 190, 265);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This is an electronically generated invoice.', 105, 272, { align: 'center' });
    doc.text('Generated: ' + format(new Date(), 'dd/MM/yyyy HH:mm'), 105, 278, { align: 'center' });
    
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 290, 210, 7, 'F');
    
    doc.save(`Invoice-${order.order_number}.pdf`);
    toast.success('تم تحميل الفاتورة بنجاح');
  }, [order]);

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-6 p-4" dir="rtl">
          <Skeleton className="h-10 w-48" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const isAnimating = order.status === "in_progress" || order.status === "processing";
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  const steps = [
    { key: "pending", label: "تم الاستلام", icon: Package },
    { key: "processing", label: "قيد المعالجة", icon: Loader2 },
    { key: "in_progress", label: "قيد التنفيذ", icon: Zap },
    { key: "completed", label: "مكتمل", icon: CheckCircle },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === order.status);

  return (
    <ClientDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard/orders')}
              className="rounded-xl"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">تفاصيل الطلب</h1>
              <p className="text-sm text-muted-foreground font-mono">{order.order_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generatePDF} className="gap-2 rounded-xl">
              <Download className="w-4 h-4" />
              تحميل الفاتورة
            </Button>
            <Button variant="outline" size="sm" onClick={fetchOrder} className="gap-2 rounded-xl">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden border-0 shadow-xl">
                <div className={cn("p-6 relative", statusConfig.bg)}>
                  <motion.div 
                    className={cn("absolute inset-0 bg-gradient-to-br opacity-20", statusConfig.gradient)}
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div className="relative flex items-center gap-4">
                    <motion.div
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl",
                        "bg-gradient-to-br", statusConfig.gradient
                      )}
                      animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <StatusIcon className={cn("w-8 h-8 text-white", isAnimating && "animate-pulse")} />
                      {order.status === "completed" && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        </motion.div>
                      )}
                    </motion.div>
                    <div>
                      <Badge 
                        className={cn(
                          "text-sm font-bold px-4 py-1.5 rounded-xl border-0 bg-gradient-to-r text-white shadow-lg",
                          statusConfig.gradient
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        آخر تحديث: {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Steps */}
                {!isCancelled && (
                  <CardContent className="pt-6">
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute top-6 right-8 left-8 h-1 bg-muted rounded-full">
                        <motion.div
                          className="h-full bg-gradient-to-l from-primary to-accent rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, currentStepIndex) / (steps.length - 1) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>

                      <div className="relative flex justify-between">
                        {steps.map((step, index) => {
                          const StepIcon = step.icon;
                          const isCompleted = index <= currentStepIndex;
                          const isCurrent = index === currentStepIndex;
                          const stepConfig = getStatusConfig(step.key);

                          return (
                            <motion.div
                              key={step.key}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex flex-col items-center"
                            >
                              <motion.div
                                className={cn(
                                  "relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg z-10",
                                  isCompleted 
                                    ? `bg-gradient-to-br ${stepConfig.gradient}` 
                                    : "bg-muted"
                                )}
                                animate={isCurrent ? { 
                                  boxShadow: ["0 0 0 0 rgba(0,0,0,0)", "0 0 20px 5px rgba(147,51,234,0.3)", "0 0 0 0 rgba(0,0,0,0)"]
                                } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <StepIcon className={cn(
                                  "w-5 h-5",
                                  isCompleted ? "text-white" : "text-muted-foreground"
                                )} />
                              </motion.div>
                              <p className={cn(
                                "mt-2 text-xs font-medium text-center",
                                isCurrent ? "text-primary" : isCompleted ? stepConfig.color : "text-muted-foreground"
                              )}>
                                {step.label}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}

                {/* Cancelled/Refunded State */}
                {isCancelled && (
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-4 py-4">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-xl"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {order.status === "cancelled" ? (
                          <XCircle className="w-8 h-8 text-white" />
                        ) : (
                          <RotateCcw className="w-8 h-8 text-white" />
                        )}
                      </motion.div>
                      <div>
                        <p className="font-bold text-lg text-rose-600 dark:text-rose-400">
                          {order.status === "cancelled" ? "تم إلغاء الطلب" : "تم استرداد المبلغ"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.status === "cancelled" ? "لقد تم إلغاء هذا الطلب" : "تم إرجاع المبلغ لرصيدك"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* Service Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    معلومات الخدمة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">اسم الخدمة</p>
                      <p className="font-medium">{order.service?.name}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">التصنيف</p>
                      <p className="font-medium">{order.service?.category}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">الكمية</p>
                      <p className="font-medium">{order.quantity?.toLocaleString() || "-"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">تاريخ الطلب</p>
                      <p className="font-medium">{format(new Date(order.created_at), "d MMMM yyyy - HH:mm", { locale: ar })}</p>
                    </div>
                  </div>

                  {/* Link */}
                  {order.link && (
                    <div className="p-4 rounded-xl border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">الرابط</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => copyToClipboard(order.link!)}
                          >
                            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" asChild>
                            <a href={order.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <p className="font-mono text-xs break-all bg-muted/50 rounded-lg p-2 text-muted-foreground" dir="ltr">
                        {order.link}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Order History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    سجل التحديثات
                    {orderHistory.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{orderHistory.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : orderHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا يوجد سجل تحديثات</p>
                    </div>
                  ) : (
                    <div className="relative pr-6 space-y-4">
                      {/* Timeline Line */}
                      <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-muted rounded-full" />
                      
                      {(showAllHistory ? orderHistory : orderHistory.slice(0, 3)).map((item, index) => {
                        const historyStatus = getStatusConfig(item.new_status);
                        const HistoryIcon = historyStatus.icon;
                        
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative"
                          >
                            <div className={cn(
                              "absolute -right-[1.15rem] w-5 h-5 rounded-full flex items-center justify-center z-10",
                              "bg-gradient-to-br shadow-lg",
                              historyStatus.gradient
                            )}>
                              <HistoryIcon className="w-2.5 h-2.5 text-white" />
                            </div>

                            <div className={cn(
                              "mr-4 rounded-xl border overflow-hidden",
                              index === 0 ? "bg-card shadow-md" : "bg-card/50",
                              historyStatus.border
                            )}>
                              <div className={cn("px-4 py-3 flex items-center justify-between", historyStatus.bg)}>
                                <Badge className={cn(
                                  "text-xs font-semibold px-2.5 py-1 rounded-lg border-0 bg-gradient-to-r text-white",
                                  historyStatus.gradient
                                )}>
                                  {historyStatus.label}
                                </Badge>
                                {index === 0 && (
                                  <Sparkles className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <div className="px-4 py-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{format(new Date(item.created_at), "d MMMM yyyy - HH:mm", { locale: ar })}</span>
                                </div>
                                {item.notes && (
                                  <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                                    <MessageCircle className="w-3 h-3 inline-block ml-1" />
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {orderHistory.length > 3 && !showAllHistory && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowAllHistory(true)}
                          className="w-full mt-4 gap-2"
                        >
                          <ChevronDown className="w-4 h-4" />
                          عرض المزيد ({orderHistory.length - 3})
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes */}
            {(order.notes || order.admin_notes) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                {order.notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        ملاحظاتك
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-muted/30 rounded-xl p-4">{order.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {order.admin_notes && (
                  <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        ملاحظات الإدارة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{order.admin_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    ملخص السعر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      {order.total_price.toFixed(2)}
                      <span className="text-sm text-muted-foreground mr-1">ر.س</span>
                    </motion.span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Download Invoice */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={generatePDF}
                className="w-full gap-3 rounded-2xl h-14 bg-gradient-to-l from-primary to-accent hover:shadow-xl hover:shadow-primary/30 transition-all text-lg"
                size="lg"
              >
                <FileText className="w-6 h-6" />
                تحميل الفاتورة PDF
              </Button>
            </motion.div>

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Hash className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">رقم الطلب الخارجي</p>
                      <p className="font-mono text-sm">{order.external_order_id || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">حالة المزود</p>
                      <p className="text-sm">{order.external_status || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientOrderDetails;