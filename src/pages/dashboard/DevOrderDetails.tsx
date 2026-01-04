import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Code, Clock, CheckCircle, AlertCircle, FileText, ChevronLeft,
  Mail, Settings, XCircle, MessageCircle, Upload, Send, Download,
  User, Building, Building2, Calendar, DollarSign, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

interface DevOrder {
  id: string;
  order_no: string;
  status: string;
  project_title: string;
  project_goal: string;
  project_summary: string;
  client_type: string;
  budget_range: string;
  timeline_expectation: string;
  requirements_json: any;
  admin_notes: string;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
  service: {
    title_ar: string;
    icon: string;
  } | null;
}

interface DevOrderEvent {
  id: string;
  event_type: string;
  actor_role: string;
  message_text: string;
  payload: any;
  created_at: string;
}

interface DevOrderFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  draft: { label: "مسودة", color: "bg-gray-500", bgColor: "bg-gray-500/10", icon: FileText },
  pending_email_verification: { label: "بانتظار تحقق البريد", color: "bg-yellow-500", bgColor: "bg-yellow-500/10", icon: Mail },
  under_review: { label: "قيد المراجعة", color: "bg-blue-500", bgColor: "bg-blue-500/10", icon: Clock },
  need_info: { label: "بحاجة معلومات", color: "bg-orange-500", bgColor: "bg-orange-500/10", icon: AlertCircle },
  accepted: { label: "تم القبول", color: "bg-green-500", bgColor: "bg-green-500/10", icon: CheckCircle },
  in_progress: { label: "قيد التنفيذ", color: "bg-purple-500", bgColor: "bg-purple-500/10", icon: Settings },
  completed: { label: "مكتمل", color: "bg-emerald-500", bgColor: "bg-emerald-500/10", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "bg-red-500", bgColor: "bg-red-500/10", icon: XCircle },
};

const eventTypeLabels: Record<string, { label: string; icon: any }> = {
  created: { label: "تم إنشاء الطلب", icon: FileText },
  email_sent: { label: "تم إرسال بريد التحقق", icon: Mail },
  email_verified: { label: "تم تأكيد البريد", icon: CheckCircle },
  status_changed: { label: "تم تغيير الحالة", icon: Settings },
  message: { label: "رسالة جديدة", icon: MessageCircle },
  file_uploaded: { label: "تم رفع ملف", icon: Upload },
  info_requested: { label: "طلب معلومات إضافية", icon: AlertCircle },
  info_provided: { label: "تم توفير المعلومات", icon: CheckCircle },
};

const clientTypeConfig: Record<string, { label: string; icon: any }> = {
  individual: { label: "فرد", icon: User },
  company: { label: "شركة", icon: Building },
  organization: { label: "مؤسسة", icon: Building2 },
};

export default function DevOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<DevOrder | null>(null);
  const [events, setEvents] = useState<DevOrderEvent[]>([]);
  const [files, setFiles] = useState<DevOrderFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (orderId && user) {
      fetchOrderData();
      setupRealtime();
    }
  }, [orderId, user]);

  const fetchOrderData = async () => {
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from("dev_orders")
        .select(`
          *,
          service:dev_services(title_ar, icon)
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch events
      const { data: eventsData } = await supabase
        .from("dev_order_events")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      setEvents(eventsData || []);

      // Fetch files
      const { data: filesData } = await supabase
        .from("dev_order_files")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      setFiles(filesData || []);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const ordersChannel = supabase
      .channel("order-details-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dev_orders",
          filter: `id=eq.${orderId}`,
        },
        () => fetchOrderData()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dev_order_events",
          filter: `order_id=eq.${orderId}`,
        },
        () => fetchOrderData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  };

  const sendMessage = async () => {
    if (!message.trim() || !orderId || !user) return;

    setSendingMessage(true);
    try {
      await supabase.from("dev_order_events").insert([{
        order_id: orderId,
        actor_role: "user",
        actor_id: user.id,
        event_type: "message",
        message_text: message,
      }] as any);

      // If order needs info, update status
      if (order?.status === "need_info") {
        await supabase.from("dev_order_events").insert([{
          order_id: orderId,
          actor_role: "user",
          actor_id: user.id,
          event_type: "info_provided",
          payload: {},
        }] as any);

        await supabase
          .from("dev_orders")
          .update({ status: "under_review" } as any)
          .eq("id", orderId);
      }

      setMessage("");
      toast({ title: "تم إرسال الرسالة بنجاح" });
    } catch (error) {
      toast({ title: "خطأ في إرسال الرسالة", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!orderId || !user) return;

    setUploadingFile(true);
    try {
      const filePath = `${user.id}/${orderId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("dev-order-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      await supabase.from("dev_order_files").insert([{
        order_id: orderId,
        user_id: user.id,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      }] as any);

      await supabase.from("dev_order_events").insert([{
        order_id: orderId,
        actor_role: "user",
        actor_id: user.id,
        event_type: "file_uploaded",
        payload: { file_name: file.name },
      }] as any);

      toast({ title: "تم رفع الملف بنجاح" });
      fetchOrderData();
    } catch (error) {
      toast({ title: "خطأ في رفع الملف", variant: "destructive" });
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6" dir="rtl">
        <div className="container mx-auto max-w-5xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 rounded-2xl mb-6" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">الطلب غير موجود</h2>
          <Button className="mt-4" onClick={() => navigate("/dashboard/dev-orders")}>
            العودة لطلباتي
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.draft;
  const StatusIcon = status.icon;
  const clientType = clientTypeConfig[order.client_type] || clientTypeConfig.individual;
  const ClientIcon = clientType.icon;
  const requirements = typeof order.requirements_json === 'string' 
    ? JSON.parse(order.requirements_json) 
    : order.requirements_json || {};

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
            <Link to="/dashboard/dev-orders" className="hover:text-primary transition-colors">
              طلباتي
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
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${status.color} text-white border-0 py-1 px-3`}>
                  <StatusIcon className="h-4 w-4 ml-1" />
                  {status.label}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{order.order_no}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {order.project_title || "بدون عنوان"}
              </h1>
              <p className="text-muted-foreground">{order.project_goal}</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(order.created_at), "dd MMMM yyyy", { locale: ar })}</span>
              </div>
              <div className="flex items-center gap-2">
                <ClientIcon className="h-4 w-4" />
                <span>{clientType.label}</span>
              </div>
              {order.budget_range && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{order.budget_range}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {order.status === "need_info" && (
            <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-600">نحتاج معلومات إضافية</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.admin_notes || "يرجى تقديم معلومات إضافية لإكمال طلبك"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {order.status === "rejected" && order.rejection_reason && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-600">سبب الرفض</h4>
                  <p className="text-sm text-muted-foreground mt-1">{order.rejection_reason}</p>
                </div>
              </div>
            </div>
          )}

          {order.status === "completed" && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-600">تم إكمال طلبك بنجاح!</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    شكراً لثقتك بنا. نتمنى أن تكون راضياً عن الخدمة.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    تفاصيل المشروع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.project_summary && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">وصف المشروع</h4>
                      <p>{order.project_summary}</p>
                    </div>
                  )}
                  {order.timeline_expectation && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">المدة المتوقعة</h4>
                      <p>{order.timeline_expectation}</p>
                    </div>
                  )}
                  {requirements.platforms?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">المنصات</h4>
                      <div className="flex flex-wrap gap-2">
                        {requirements.platforms.map((p: string) => (
                          <Badge key={p} variant="secondary">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {requirements.technologies?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">التقنيات</h4>
                      <div className="flex flex-wrap gap-2">
                        {requirements.technologies.map((t: string) => (
                          <Badge key={t} variant="outline">{t}</Badge>
                        ))}
                      </div>
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
                  {events.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">لا توجد أحداث بعد</p>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event, index) => {
                        const eventConfig = eventTypeLabels[event.event_type] || { label: event.event_type, icon: FileText };
                        const EventIcon = eventConfig.icon;
                        return (
                          <div key={event.id} className="flex gap-4">
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
                              {event.message_text && (
                                <p className="text-sm text-muted-foreground mt-1 p-3 rounded-lg bg-muted/50">
                                  {event.message_text}
                                </p>
                              )}
                              {event.actor_role !== "system" && (
                                <Badge variant="outline" className="mt-2">
                                  {event.actor_role === "admin" ? "الإدارة" : "أنت"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Message Form */}
            {["under_review", "need_info", "accepted", "in_progress"].includes(order.status) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      إرسال رسالة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اكتب رسالتك هنا..."
                      rows={4}
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFile(file);
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("file-upload")?.click()}
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <Upload className="h-4 w-4 ml-2" />
                          )}
                          رفع ملف
                        </Button>
                      </div>
                      <Button onClick={sendMessage} disabled={sendingMessage || !message.trim()}>
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <Send className="h-4 w-4 ml-2" />
                        )}
                        إرسال
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Files */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-primary" />
                    الملفات ({files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {files.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">لا توجد ملفات</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-sm truncate">{file.file_name}</span>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Service Info */}
            {order.service && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Code className="h-5 w-5 text-primary" />
                      الخدمة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold">{order.service.title_ar}</h4>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
