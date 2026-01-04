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
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { useUnifiedOrderDetails } from "@/hooks/useUnifiedOrders";
import {
  UnifiedOrder,
  OrderDomain,
  OrderTimelineEvent,
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
  file_uploaded: { label: "تم رفع ملف", icon: Upload },
  info_requested: { label: "طلب معلومات إضافية", icon: AlertCircle },
  info_provided: { label: "تم توفير المعلومات", icon: CheckCircle },
};

// Dev order statuses
const devOrderStatuses = [
  { value: "draft", label: "مسودة" },
  { value: "pending_email_verification", label: "بانتظار تأكيد البريد" },
  { value: "under_review", label: "قيد المراجعة" },
  { value: "need_info", label: "بحاجة لمعلومات إضافية" },
  { value: "accepted", label: "تم القبول" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "testing", label: "قيد الاختبار" },
  { value: "completed", label: "مكتمل" },
  { value: "rejected", label: "مرفوض" },
  { value: "cancelled", label: "ملغي" },
];

// SMM order statuses
const smmOrderStatuses = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "confirmed", label: "مؤكد" },
  { value: "processing", label: "قيد المعالجة" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "partial", label: "مكتمل جزئياً" },
  { value: "cancelled", label: "ملغي" },
  { value: "refunded", label: "مسترد" },
];

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
    <div className="space-y-4 max-h-72 overflow-y-auto">
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
                <h4 className="font-medium text-sm">{eventConfig.label}</h4>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ar })}
                </span>
              </div>
              {event.message && (
                <p className="text-sm text-muted-foreground mt-1 p-2 rounded-lg bg-muted/50">
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

// Loading Skeleton
function OrderDetailsSkeleton() {
  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    </AdminDashboardLayout>
  );
}

export default function AdminOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { order, loading, error, refetch } = useUnifiedOrderDetails(orderId);
  const [events, setEvents] = useState<OrderTimelineEvent[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch events
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
      // Set initial status based on order source
      if (order.source_table === 'dev_orders') {
        // Map unified status back to original dev status
        const devStatusMap: Record<string, string> = {
          'draft': 'draft',
          'pending_verification': 'pending_email_verification',
          'submitted': 'under_review',
          'under_review': 'under_review',
          'action_required': 'need_info',
          'in_progress': 'in_progress',
          'completed': 'completed',
          'rejected': 'rejected',
          'cancelled': 'cancelled',
        };
        setSelectedStatus(order.meta?.original_status || devStatusMap[order.status] || 'under_review');
      } else {
        // Map unified status back to original smm status
        const smmStatusMap: Record<string, string> = {
          'submitted': 'pending',
          'in_progress': 'in_progress',
          'completed': 'completed',
          'cancelled': 'cancelled',
        };
        setSelectedStatus(smmStatusMap[order.status] || 'pending');
      }
    }
  }, [order, fetchEvents]);

  const updateOrderStatus = async () => {
    if (!order || !selectedStatus) return;
    
    setUpdatingStatus(true);
    try {
      if (order.source_table === 'dev_orders') {
        const { error } = await supabase
          .from('dev_orders')
          .update({ status: selectedStatus, updated_at: new Date().toISOString() })
          .eq('id', order.source_id);
        
        if (error) throw error;

        // Add event
        await supabase.from('dev_order_events').insert([{
          order_id: order.source_id,
          event_type: 'status_changed',
          actor_role: 'admin',
          actor_id: user?.id,
          message_text: `تم تغيير الحالة إلى: ${devOrderStatuses.find(s => s.value === selectedStatus)?.label || selectedStatus}`,
          payload: { new_status: selectedStatus }
        }]);

        // Send email notification to client
        const statusLabel = devOrderStatuses.find(s => s.value === selectedStatus)?.label || selectedStatus;
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'dev_order_status_changed',
            to: order.user_email,
            data: {
              order_number: order.order_no,
              status: statusLabel,
              project_title: order.meta?.project_title || order.service_title,
            }
          }
        });

      } else if (order.source_table === 'orders') {
        const { error } = await supabase
          .from('orders')
          .update({ status: selectedStatus as any, updated_at: new Date().toISOString() })
          .eq('id', order.source_id);
        
        if (error) throw error;
      }

      toast({ title: "تم تحديث الحالة بنجاح" });
      refetch();
      fetchEvents();
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({ title: "خطأ في تحديث الحالة", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !order || !user) return;
    if (order.source_table !== 'dev_orders') {
      toast({ title: "الرسائل غير متاحة لهذا النوع من الطلبات", variant: "destructive" });
      return;
    }

    setSendingMessage(true);
    try {
      await supabase.from("dev_order_events").insert([{
        order_id: order.source_id,
        actor_role: "admin",
        actor_id: user.id,
        event_type: "message",
        message_text: message,
      }] as any);

      setMessage("");
      toast({ title: "تم إرسال الرسالة بنجاح" });
      fetchEvents();
    } catch (err) {
      toast({ title: "خطأ في إرسال الرسالة", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

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
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">الطلب غير موجود</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/admin/orders")}>
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للطلبات
            </Button>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const DomainIcon = domainIconMap[order.domain];
  const statusOptions = order.source_table === 'dev_orders' ? devOrderStatuses : smmOrderStatuses;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/admin" className="hover:text-primary transition-colors">
            لوحة التحكم
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <Link to="/admin/orders" className="hover:text-primary transition-colors">
            الطلبات
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground font-medium">{order.order_no}</span>
        </nav>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border/50 p-4 md:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${domainColors[order.domain]} flex items-center justify-center`}>
                <DomainIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`${order.status_config.bgColor} ${order.status_config.color} border-0`}>
                    {order.status_label}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-mono">{order.order_no}</span>
                </div>
                <h1 className="text-lg md:text-xl font-bold text-foreground">{order.service_title}</h1>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{order.user_name || 'مستخدم'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{order.user_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(order.created_at), "dd MMMM yyyy", { locale: ar })}</span>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              تحديث حالة الطلب
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={updateOrderStatus} 
                disabled={updatingStatus}
                className="gap-2"
              >
                {updatingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                حفظ التغييرات
              </Button>
            </div>
          </div>
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
                      <p className="whitespace-pre-wrap">{order.meta.project_goal}</p>
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
                  {order.total_price && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">المبلغ</h4>
                      <p className="font-semibold">{order.total_price.toFixed(2)} ر.س</p>
                    </div>
                  )}
                  {order.meta?.admin_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">ملاحظات الإدارة</h4>
                      <p className="bg-muted/50 p-3 rounded-lg">{order.meta.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Message Form - Only for dev orders */}
            {order.source_table === 'dev_orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      إرسال رسالة للعميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="اكتب رسالتك للعميل..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mb-4"
                      rows={3}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!message.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 ml-2" />
                      )}
                      إرسال
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
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
                      الملفات ({files.length})
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

            {/* Back Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/admin/orders")}
            >
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للطلبات
            </Button>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}