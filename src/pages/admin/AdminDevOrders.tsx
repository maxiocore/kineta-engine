import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Code, Clock, CheckCircle, AlertCircle, FileText, ChevronLeft,
  Filter, Search, Eye, RefreshCw, Mail, Settings, XCircle, 
  Loader2, Users, TrendingUp, DollarSign
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

interface DevOrder {
  id: string;
  order_no: string;
  status: string;
  project_title: string;
  client_type: string;
  budget_range: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  service: {
    title_ar: string;
  } | null;
  profile: {
    full_name: string;
    email: string;
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

export default function AdminDevOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<DevOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
    setupRealtime();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("dev_orders")
        .select(`
          id, order_no, status, project_title, client_type, budget_range, 
          contact_email, created_at, updated_at, user_id,
          service:dev_services(title_ar)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set((data || []).map(o => o.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]));

      const ordersWithProfiles = (data || []).map(order => ({
        ...order,
        profile: profilesMap.get(order.user_id) || null,
      }));

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel("admin-dev-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dev_orders",
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
      order.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "under_review").length,
    inProgress: orders.filter((o) => o.status === "in_progress").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/admin" className="hover:text-primary transition-colors">
              لوحة الإدارة
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground font-medium">طلبات البرمجة</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Code className="h-8 w-8 text-primary" />
              إدارة طلبات البرمجة
            </h1>
            <p className="text-muted-foreground mt-1">إدارة ومتابعة جميع طلبات البرمجة</p>
          </div>
          <Button variant="outline" onClick={fetchOrders} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">قيد المراجعة</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Settings className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">قيد التنفيذ</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">مكتملة</div>
              </div>
            </div>
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
              placeholder="ابحث باسم المشروع، رقم الطلب، أو العميل..."
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
        </motion.div>

        {/* Orders Table */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
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
            <p className="text-muted-foreground/70 mt-2">لم يتم العثور على طلبات تطابق معايير البحث</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border/50 overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">المشروع</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{order.order_no}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.project_title || "بدون عنوان"}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.service?.title_ar || "خدمة برمجية"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.profile?.full_name || "غير معروف"}</div>
                          <div className="text-sm text-muted-foreground">
                            {clientTypeLabels[order.client_type] || order.client_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} text-white border-0`}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/dev-orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </div>
    </div>
  );
}
