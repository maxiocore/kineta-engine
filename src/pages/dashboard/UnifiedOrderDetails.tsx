import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings,
  XCircle,
  MessageCircle,
  Upload,
  Send,
  Download,
  Code,
  Palette,
  Megaphone,
  Share2,
  Package,
  Calendar,
  DollarSign,
  User,
  Mail,
  Loader2,
  ArrowRight,
  Paperclip,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnifiedOrderDetails } from "@/hooks/useUnifiedOrders";
import InvoicePaymentCard from "@/components/orders/InvoicePaymentCard";
import MessageWithAttachment from "@/components/orders/MessageWithAttachment";
import {
  UnifiedOrder,
  OrderDomain,
  OrderTimelineEvent,
  domainLabels,
  domainColors,
  unifiedStatusConfig,
} from "@/types/unified-orders";

// Domain icon components
const domainIconMap: Record<OrderDomain, any> = {
  dev: Code,
  design: Palette,
  marketing: Megaphone,
  smm: Share2,
  other: Package,
};

// Event type labels
const eventTypeLabels: Record<string, { label: string; icon: any }> = {
  created: { label: "تم إنشاء الطلب", icon: FileText },
  email_sent: { label: "تم إرسال بريد", icon: Mail },
  email_verified: { label: "تم تأكيد البريد", icon: CheckCircle },
  status_changed: { label: "تم تغيير الحالة", icon: Settings },
  message: { label: "رسالة جديدة", icon: MessageCircle },
  message_with_files: { label: "رسالة مع مرفقات", icon: Paperclip },
  file_uploaded: { label: "تم رفع ملف", icon: Upload },
  info_requested: { label: "طلب معلومات إضافية", icon: AlertCircle },
  info_provided: { label: "تم توفير المعلومات", icon: CheckCircle },
  invoice_sent: { label: "تم إرسال فاتورة", icon: Receipt },
  payment_received: { label: "تم دفع الفاتورة", icon: DollarSign },
};

// Timeline Component
function OrderTimeline({ events, loading }: { events: OrderTimelineEvent[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="w-32 h-4 mb-2" />
              <Skeleton className="w-48 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">لا توجد أحداث بعد</p>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {events.map((event, index) => {
        const eventConfig = eventTypeLabels[event.event_type] || { label: event.event_type, icon: FileText };
        const EventIcon = eventConfig.icon;
        
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-4"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <EventIcon className="h-5 w-5 text-primary" />
              </div>
              {index < events.length - 1 && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-border" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{eventConfig.label}</h4>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ar })}
                </span>
              </div>
              {event.message && (
                <p className="text-sm text-muted-foreground mt-1 p-3 rounded-lg bg-muted/50">
                  {event.message}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Status Progress Component
function StatusProgress({ order }: { order: UnifiedOrder }) {
  const allStatuses = [
    { key: 'submitted', label: 'تم الاستلام' },
    { key: 'under_review', label: 'قيد المراجعة' },
    { key: 'in_progress', label: 'قيد التنفيذ' },
    { key: 'completed', label: 'مكتمل' },
  ];

  const currentIndex = allStatuses.findIndex(s => s.key === order.status);
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {allStatuses.map((status, index) => {
          const isActive = index <= currentIndex && !isCancelled;
          const isCurrent = index === currentIndex && !isCancelled;
          
          return (
            <div key={status.key} className="flex flex-col items-center flex-1">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                  {isActive && index < currentIndex ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < allStatuses.length - 1 && (
                  <div className={`absolute top-1/2 right-full w-full h-0.5 -translate-y-1/2 ${
                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                  }`} style={{ width: 'calc(100% + 2rem)', right: '-100%' }} />
                )}
              </div>
              <span className={`text-xs mt-2 text-center ${
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Loading Skeleton
function OrderDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-5xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-40 rounded-2xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function UnifiedOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { order, loading, error, refetch } = useUnifiedOrderDetails(orderId);
  const [events, setEvents] = useState<OrderTimelineEvent[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Fetch events based on order source
  const fetchEvents = useCallback(async () => {
    if (!order) return;
    
    setLoadingEvents(true);
    try {
      if (order.source_table === 'dev_orders') {
        const { data, error } = await supabase
          .from('dev_order_events')
          .select('*')
          .eq('order_id', order.source_id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setEvents(data.map(e => ({
            id: e.id,
            order_id: e.order_id,
            event_type: e.event_type,
            event_label: eventTypeLabels[e.event_type]?.label || e.event_type,
            actor_role: e.actor_role as 'user' | 'admin' | 'system',
            message: e.message_text || undefined,
            created_at: e.created_at,
            payload: (e.payload as Record<string, any>) || undefined,
          })));
        }

        // Fetch files
        const { data: filesData } = await supabase
          .from('dev_order_files')
          .select('*')
          .eq('order_id', order.source_id)
          .order('created_at', { ascending: false });
        
        setFiles(filesData || []);
      } else if (order.source_table === 'orders') {
        // For regular orders, use order_status_history
        const { data, error } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', order.source_id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setEvents(data.map(e => ({
            id: e.id,
            order_id: e.order_id,
            event_type: 'status_changed',
            event_label: 'تغيير الحالة',
            actor_role: 'system' as any,
            message: e.notes || `من ${e.old_status} إلى ${e.new_status}`,
            created_at: e.created_at,
            payload: { old_status: e.old_status, new_status: e.new_status },
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, [order]);

  useEffect(() => {
    if (order) {
      fetchEvents();
    }
  }, [order, fetchEvents]);

  const downloadFile = async (file: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('dev-order-files')
        .download(file.file_path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: "خطأ في تحميل الملف", variant: "destructive" });
    }
  };

  if (loading) return <OrderDetailsSkeleton />;

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">الطلب غير موجود</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate("/dashboard/orders")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للطلبات
          </Button>
        </div>
      </div>
    );
  }

  const DomainIcon = domainIconMap[order.domain];
  const StatusIcon = CheckCircle;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              لوحة التحكم
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link to="/dashboard/orders" className="hover:text-primary transition-colors">
              الطلبات
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground font-medium">{order.order_no}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl ${domainColors[order.domain]} flex items-center justify-center`}>
                <DomainIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`${order.status_config.bgColor} ${order.status_config.color} border-0`}>
                    {order.status_label}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-mono">{order.order_no}</span>
                </div>
                <h1 className="text-xl font-bold text-foreground">{order.service_title}</h1>
              </div>
            </div>
            <div className="text-left md:text-right text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(order.created_at), "dd MMMM yyyy", { locale: ar })}</span>
              </div>
              {order.total_price && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{order.total_price.toFixed(2)} ر.س</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Required Alert */}
          {order.action_required && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">إجراء مطلوب</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">{order.action_label || 'يرجى إكمال المعلومات المطلوبة'}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Status Progress */}
          <StatusProgress order={order} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    تفاصيل الطلب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.meta?.project_title && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">اسم المشروع</h4>
                      <p>{order.meta.project_title}</p>
                    </div>
                  )}
                  {order.meta?.project_goal && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">هدف المشروع</h4>
                      <p>{order.meta.project_goal}</p>
                    </div>
                  )}
                  {order.meta?.link && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">الرابط</h4>
                      <a href={order.meta.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                        {order.meta.link}
                      </a>
                    </div>
                  )}
                  {order.meta?.quantity && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">الكمية</h4>
                        <p>{order.meta.quantity}</p>
                      </div>
                      {order.meta?.remains !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">المتبقي</h4>
                          <p>{order.meta.remains}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {order.meta?.budget_range && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">الميزانية</h4>
                        <p>{order.meta.budget_range}</p>
                      </div>
                      {order.meta?.timeline_expectation && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">المدة المتوقعة</h4>
                          <p>{order.meta.timeline_expectation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    سجل الأحداث
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline events={events} loading={loadingEvents} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Invoice Payment - Only for dev orders with pending invoices */}
            {order.source_table === 'dev_orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <InvoicePaymentCard
                  orderId={order.source_id}
                  orderNo={order.order_no}
                  onPaymentComplete={() => {
                    refetch();
                    fetchEvents();
                  }}
                />
              </motion.div>
            )}

            {/* Message Form with Attachments - Only for dev orders */}
            {order.source_table === 'dev_orders' && order.status !== 'completed' && order.status !== 'cancelled' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <MessageWithAttachment
                  orderId={order.source_id}
                  isAdmin={false}
                  onMessageSent={fetchEvents}
                />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Files */}
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-primary" />
                      الملفات المرفقة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>معلومات سريعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">القسم</span>
                    <Badge className={`${domainColors[order.domain]} text-white border-0`}>
                      {order.domain_label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تاريخ الإنشاء</span>
                    <span className="text-sm">{format(new Date(order.created_at), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">آخر تحديث</span>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true, locale: ar })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Back Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/dashboard/orders")}
            >
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للطلبات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
