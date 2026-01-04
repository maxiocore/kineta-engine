import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Code, Clock, CheckCircle, AlertCircle, FileText, 
  ChevronLeft, Filter, Search, Eye, Plus, RefreshCw,
  Loader2, Mail, Settings, Zap, XCircle, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface DevOrder {
  id: string;
  order_no: string;
  status: string;
  project_title: string;
  client_type: string;
  budget_range: string;
  created_at: string;
  updated_at: string;
  service: {
    title_ar: string;
    icon: string;
  } | null;
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

const clientTypeLabels: Record<string, string> = {
  individual: "فرد",
  company: "شركة",
  organization: "مؤسسة",
};

export default function MyDevOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<DevOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchOrders();
      setupRealtime();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("dev_orders")
        .select(`
          id, order_no, status, project_title, client_type, budget_range, created_at, updated_at,
          service:dev_services(title_ar, icon)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel("dev-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dev_orders",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.project_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    active: orders.filter((o) => ["under_review", "accepted", "in_progress"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
    pending: orders.filter((o) => ["draft", "pending_email_verification", "need_info"].includes(o.status)).length,
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              لوحة التحكم
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground font-medium">طلباتي البرمجية</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">طلباتي البرمجية</h1>
            <p className="text-muted-foreground mt-1">تتبع ومتابعة جميع طلباتك</p>
          </div>
          <Button className="gap-2" onClick={() => navigate("/dashboard/dev-services")}>
            <Plus className="h-4 w-4" />
            طلب جديد
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="text-2xl font-bold text-blue-500">{stats.active}</div>
            <div className="text-sm text-muted-foreground">طلبات نشطة</div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">مكتملة</div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">بانتظار إجراء</div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ابحث باسم المشروع أو رقم الطلب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="حالة الطلب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchOrders} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-card rounded-2xl border border-border/50"
          >
            <Code className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">لا توجد طلبات</h3>
            <p className="text-muted-foreground/70 mt-2">ابدأ بإنشاء طلب جديد</p>
            <Button className="mt-4" onClick={() => navigate("/dashboard/dev-services")}>
              <Plus className="h-4 w-4 ml-2" />
              طلب جديد
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.draft;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border/50 p-4 md:p-6 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/dashboard/dev-orders/${order.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`${status.color} text-white border-0`}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {status.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-mono">
                          {order.order_no}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {order.project_title || "بدون عنوان"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{order.service?.title_ar || "خدمة برمجية"}</span>
                        <span>•</span>
                        <span>{clientTypeLabels[order.client_type] || order.client_type}</span>
                        {order.budget_range && (
                          <>
                            <span>•</span>
                            <span>{order.budget_range}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <div className="text-xs text-muted-foreground">آخر تحديث</div>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(order.updated_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
