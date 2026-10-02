import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Code, Clock, CheckCircle, AlertCircle, FileText, ChevronLeft,
  Mail, Settings, XCircle, MessageCircle, Upload, Send, Download,
  User, Building, Building2, Calendar, DollarSign, Loader2, Sparkles,
  Activity, ArrowUpLeft, Paperclip, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  let requirements: { platforms?: string[]; technologies?: string[] } = {};
  try {
    requirements = typeof order.requirements_json === "string"
      ? JSON.parse(order.requirements_json)
      : order.requirements_json || {};
  } catch {
    requirements = {};
  }

  const activeStatuses = ["draft", "pending_email_verification", "under_review", "accepted", "in_progress", "completed"];
  const statusIndex = activeStatuses.indexOf(order.status);
  const progress = order.status === "rejected" ? 100 : Math.max(12, ((statusIndex + 1) / activeStatuses.length) * 100);
  const canMessage = ["under_review", "need_info", "accepted", "in_progress"].includes(order.status);

  const triggerFileUpload = () => document.getElementById("file-upload")?.click();

  return (
    <div className="min-h-screen bg-background pb-12" dir="rtl">
      <div className="border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <nav className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              لوحة التحكم
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link to="/dashboard/dev-orders" className="hover:text-primary transition-colors">
              طلباتي
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="truncate font-mono font-semibold text-primary" dir="ltr">{order.order_no}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-6 overflow-hidden rounded-lg border border-border bg-card shadow-elevated"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-muted">
            <motion.div
              className="h-full bg-gradient-to-l from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          </div>
          <div className="relative p-5 md:p-8">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Badge className={`${status.color} border-0 px-3 py-1 text-primary-foreground shadow-sm`}>
                  <StatusIcon className="h-4 w-4 ml-1" />
                  {status.label}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">ID: {order.order_no}</span>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-foreground md:text-4xl">
                  {order.project_title || "بدون عنوان"}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">{order.project_goal || "طلب تطوير برمجي مخصص"}</p>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 border-t border-border pt-5 lg:w-auto lg:min-w-[430px] lg:grid-cols-3 lg:border-r lg:border-t-0 lg:pr-7 lg:pt-0">
                <HeaderMetric icon={Calendar} label="تاريخ الطلب" value={format(new Date(order.created_at), "dd MMMM yyyy", { locale: ar })} />
                <HeaderMetric icon={ClientIcon} label="نوع العميل" value={clientType.label} />
                <HeaderMetric icon={DollarSign} label="الميزانية" value={order.budget_range || "تحدد لاحقاً"} className="col-span-2 lg:col-span-1" />
              </div>
            </div>

            {order.status === "need_info" && (
            <div className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                   <h4 className="font-semibold text-warning">نحتاج معلومات إضافية</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.admin_notes || "يرجى تقديم معلومات إضافية لإكمال طلبك"}
                  </p>
                </div>
              </div>
            </div>
            )}

          {order.status === "rejected" && order.rejection_reason && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive">سبب الرفض</h4>
                  <p className="text-sm text-muted-foreground mt-1">{order.rejection_reason}</p>
                </div>
              </div>
            </div>
          )}

          {order.status === "completed" && (
            <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-success">تم إكمال طلبك بنجاح!</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    شكراً لثقتك بنا. نتمنى أن تكون راضياً عن الخدمة.
                  </p>
                </div>
              </div>
            </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border border-border bg-card p-5 shadow-card md:p-7"
            >
              <SectionTitle icon={FileText} title="تفاصيل المشروع" subtitle="نطاق العمل والمتطلبات المسجلة" />
              <div className="space-y-7">
                  {order.project_summary && (
                    <div className="rounded-lg bg-muted/45 p-4 md:p-5">
                      <h4 className="mb-2 text-xs font-semibold text-muted-foreground">وصف المشروع</h4>
                      <p className="leading-8 text-foreground">{order.project_summary}</p>
                    </div>
                  )}
                  <div className="grid gap-6 md:grid-cols-2">
                    {requirements.platforms && requirements.platforms.length > 0 && (
                    <div>
                      <h4 className="mb-3 text-xs font-semibold text-muted-foreground">المنصات المستهدفة</h4>
                      <div className="flex flex-wrap gap-2">
                        {requirements.platforms.map((p: string) => (
                          <Badge key={p} variant="secondary" className="rounded-md border border-border px-3 py-1.5">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                    {requirements.technologies && requirements.technologies.length > 0 && (
                    <div>
                      <h4 className="mb-3 text-xs font-semibold text-muted-foreground">التقنيات المطلوبة</h4>
                      <div className="flex flex-wrap gap-2">
                        {requirements.technologies.map((t: string) => (
                          <Badge key={t} variant="outline" className="rounded-md border-primary/20 bg-primary/5 px-3 py-1.5 text-primary">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                  {order.timeline_expectation && (
                    <div className="flex items-center justify-between border-t border-border pt-5">
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground">المدة المتوقعة</h4>
                        <p className="mt-1 font-bold text-foreground">{order.timeline_expectation}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
                    </div>
                  )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg border border-border bg-card p-5 shadow-card md:p-7"
            >
              <SectionTitle icon={Activity} title="سجل الأحداث" subtitle="آخر تحديثات الطلب بترتيب زمني" />
                  {events.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">لا توجد أحداث بعد</p>
                  ) : (
                    <div className="space-y-1">
                      {events.map((event, index) => {
                        const eventConfig = eventTypeLabels[event.event_type] || { label: event.event_type, icon: FileText };
                        const EventIcon = eventConfig.icon;
                        return (
                          <motion.div key={event.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.05, 0.35) }} className="flex gap-4">
                            <div className="relative flex-shrink-0">
                              <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 border-card bg-primary/10 ring-1 ring-primary/20">
                                <EventIcon className="h-4 w-4 text-primary" />
                              </div>
                              {index < events.length - 1 && (
                                <div className="absolute right-1/2 top-9 h-full w-px translate-x-1/2 bg-border" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 pb-6">
                              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                                <h4 className="font-medium">{eventConfig.label}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ar })}
                                </span>
                              </div>
                              {event.message_text && (
                                <p className="mt-2 rounded-md bg-muted/55 p-3 text-sm leading-6 text-muted-foreground">
                                  {event.message_text}
                                </p>
                              )}
                              {event.actor_role !== "system" && (
                                <Badge variant="outline" className="mt-2 rounded-md">
                                  {event.actor_role === "admin" ? "الإدارة" : "أنت"}
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
            </motion.div>

            {canMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              className="rounded-lg border border-border bg-card p-5 shadow-card md:p-7"
              >
                <SectionTitle icon={MessageCircle} title="تواصل مع فريق المشروع" subtitle="أرسل تحديثاً أو استفساراً مرتبطاً بهذا الطلب" />
                  <div className="space-y-4">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اكتب رسالتك هنا..."
                      rows={4}
                      className="min-h-28 resize-none rounded-lg border-border bg-muted/25 p-4 focus-visible:ring-primary"
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
                          onClick={triggerFileUpload}
                          disabled={uploadingFile}
                          className="rounded-md"
                        >
                          {uploadingFile ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <Upload className="h-4 w-4 ml-2" />
                          )}
                          رفع ملف
                        </Button>
                      </div>
                      <Button onClick={sendMessage} disabled={sendingMessage || !message.trim()} className="rounded-md shadow-brand">
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <Send className="h-4 w-4 ml-2" />
                        )}
                        إرسال
                      </Button>
                    </div>
                  </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {order.service && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="relative overflow-hidden rounded-lg bg-foreground p-6 text-background shadow-elevated">
                <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
                <div className="relative">
                  <div className="mb-5 flex items-center gap-3 text-background/70"><Code className="h-5 w-5 text-primary" /><span className="text-sm font-semibold">الخدمة المطلوبة</span></div>
                  <h3 className="text-xl font-bold leading-8">{order.service.title_ar}</h3>
                  <div className="mt-6 flex items-center gap-2 border-t border-background/10 pt-4 text-xs text-background/70"><ShieldCheck className="h-4 w-4 text-primary" /> طلب محفوظ ومتابع</div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg border border-border bg-card p-5 shadow-card"
            >
              <SectionTitle icon={Paperclip} title={`الملفات (${files.length})`} compact />
                  {files.length === 0 ? (
                    <button type="button" onClick={triggerFileUpload} className="group flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-9 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
                      <Upload className="mb-3 h-7 w-7 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">لا توجد ملفات مرفقة</span>
                      <span className="mt-2 text-xs font-semibold text-primary">إضافة ملف</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between rounded-md bg-muted/50 p-3 transition-colors hover:bg-muted"
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
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-lg border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="font-bold">ملخص ذكي</h3></div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">التقدم الحالي</span><span className="font-bold text-primary">{Math.round(progress)}%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted"><motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} /></div>
                <p className="border-t border-border pt-3 leading-6 text-muted-foreground">{order.status === "need_info" ? "يتطلب الطلب معلومات إضافية منك للمتابعة." : order.status === "completed" ? "اكتملت جميع مراحل الطلب بنجاح." : "الطلب تحت المتابعة وستظهر جميع التحديثات هنا فوراً."}</p>
              </div>
            </motion.div>

            <Button variant="outline" className="w-full justify-between rounded-md" onClick={() => navigate("/dashboard/dev-orders")}>
              العودة لجميع الطلبات <ArrowUpLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderMetric({ icon: Icon, label, value, className = "" }: { icon: typeof Calendar; label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" />{label}</div>
      <p className="text-sm font-bold leading-6 text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, compact = false }: { icon: typeof FileText; title: string; subtitle?: string; compact?: boolean }) {
  return (
    <div className={compact ? "mb-4 flex items-center gap-3" : "mb-7 flex items-start gap-3"}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      <div><h2 className="font-bold text-foreground md:text-lg">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}</div>
    </div>
  );
}
