import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Code, Clock, CheckCircle, AlertCircle, FileText, ChevronLeft,
  Mail, Settings, XCircle, MessageCircle, Upload, Send, Download,
  User, Building, Building2, Calendar, DollarSign, Loader2, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  contact_email: string;
  admin_notes: string;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
  user_id: string;
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

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "مسودة", color: "bg-gray-500", icon: FileText },
  pending_email_verification: { label: "بانتظار تحقق البريد", color: "bg-yellow-500", icon: Mail },
  under_review: { label: "قيد المراجعة", color: "bg-blue-500", icon: Clock },
  need_info: { label: "بحاجة معلومات", color: "bg-orange-500", icon: AlertCircle },
  accepted: { label: "تم القبول", color: "bg-green-500", icon: CheckCircle },
  in_progress: { label: "قيد التنفيذ", color: "bg-purple-500", icon: Settings },
  completed: { label: "مكتمل", color: "bg-emerald-500", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "bg-red-500", icon: XCircle },
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

export default function AdminDevOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<DevOrder | null>(null);
  const [events, setEvents] = useState<DevOrderEvent[]>([]);
  const [files, setFiles] = useState<DevOrderFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
      setupRealtime();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
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
      setAdminNotes(orderData?.admin_notes || "");
      setRejectionReason(orderData?.rejection_reason || "");
      setNewStatus(orderData?.status || "");

      const { data: eventsData } = await supabase
        .from("dev_order_events")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      setEvents(eventsData || []);

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
    const channel = supabase
      .channel("admin-order-details-realtime")
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
      supabase.removeChannel(channel);
    };
  };

  const updateStatus = async () => {
    if (!order || !newStatus || newStatus === order.status) return;

    setSaving(true);
    try {
      const updateData: any = {
        status: newStatus,
        admin_notes: adminNotes,
      };

      if (newStatus === "rejected") {
        updateData.rejection_reason = rejectionReason;
      }

      await supabase
        .from("dev_orders")
        .update(updateData)
        .eq("id", orderId);

      await supabase.from("dev_order_events").insert([{
        order_id: orderId,
        actor_role: "admin",
        actor_id: user?.id,
        event_type: "status_changed",
        payload: { old_status: order.status, new_status: newStatus },
      }] as any);

      // Send email notification to client about status change
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: order.contact_email,
            type: "dev_order_status_changed",
            data: {
              orderNumber: order.order_no,
              projectTitle: order.project_title,
              serviceName: order.service?.title_ar || "خدمة برمجية",
              newStatus: newStatus,
              oldStatus: order.status,
              adminNotes: adminNotes,
            },
          },
        });
      } catch (emailError) {
        console.error("Failed to send status change email:", emailError);
      }

      toast({
        title: "تم تحديث الحالة بنجاح",
        description: `تم تغيير الحالة إلى: ${statusConfig[newStatus]?.label}`,
      });

      fetchOrderData();
    } catch (error) {
      toast({ title: "خطأ في تحديث الحالة", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !orderId || !user) return;

    setSendingMessage(true);
    try {
      await supabase.from("dev_order_events").insert([{
        order_id: orderId,
        actor_role: "admin",
        actor_id: user.id,
        event_type: "message",
        message_text: message,
      }] as any);

      setMessage("");
      toast({ title: "تم إرسال الرسالة بنجاح" });
    } catch (error) {
      toast({ title: "خطأ في إرسال الرسالة", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const requestInfo = async () => {
    if (!adminNotes.trim() || !orderId || !user) {
      toast({ title: "يرجى كتابة المعلومات المطلوبة في ملاحظات الإدارة", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await supabase
        .from("dev_orders")
        .update({ status: "need_info", admin_notes: adminNotes } as any)
        .eq("id", orderId);

      await supabase.from("dev_order_events").insert([{
        order_id: orderId,
        actor_role: "admin",
        actor_id: user.id,
        event_type: "info_requested",
        message_text: adminNotes,
      }] as any);

      toast({ title: "تم طلب المعلومات بنجاح" });
      fetchOrderData();
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6" dir="rtl">
        <div className="container mx-auto max-w-6xl">
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
          <Button className="mt-4" onClick={() => navigate("/admin/dev-orders")}>
            العودة للطلبات
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
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/admin" className="hover:text-primary transition-colors">
              لوحة الإدارة
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link to="/admin/dev-orders" className="hover:text-primary transition-colors">
              طلبات البرمجة
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground font-medium">{order.order_no}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
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
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{order.contact_email}</span>
              </div>
            </div>
          </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    {order.budget_range && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">الميزانية</h4>
                        <p>{order.budget_range}</p>
                      </div>
                    )}
                    {order.timeline_expectation && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">المدة المتوقعة</h4>
                        <p>{order.timeline_expectation}</p>
                      </div>
                    )}
                  </div>
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
                    <div className="space-y-4 max-h-96 overflow-y-auto">
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
                              <Badge variant="outline" className="mt-2">
                                {event.actor_role === "admin" ? "الإدارة" : event.actor_role === "user" ? "العميل" : "النظام"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Admin Actions */}
          <div className="space-y-6">
            {/* Status Update */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-5 w-5 text-primary" />
                    تحديث الحالة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الحالة الجديدة</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>ملاحظات الإدارة</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="ملاحظات داخلية أو رسالة للعميل..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  {newStatus === "rejected" && (
                    <div>
                      <Label>سبب الرفض</Label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="اشرح سبب رفض الطلب..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={updateStatus}
                      disabled={saving || newStatus === order.status}
                      className="flex-1"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <Save className="h-4 w-4 ml-2" />
                      )}
                      حفظ التغييرات
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={requestInfo}
                    disabled={saving}
                    className="w-full"
                  >
                    <AlertCircle className="h-4 w-4 ml-2" />
                    طلب معلومات إضافية
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Send Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    إرسال رسالة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالة للعميل..."
                    rows={3}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sendingMessage || !message.trim()}
                    className="w-full"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Send className="h-4 w-4 ml-2" />
                    )}
                    إرسال
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Files */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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
          </div>
        </div>
      </div>
    </div>
  );
}
