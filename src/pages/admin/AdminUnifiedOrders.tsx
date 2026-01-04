import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Package,
  Search,
  List,
  LayoutGrid,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Settings,
  ChevronLeft,
  Code,
  Palette,
  Megaphone,
  Share2,
  ArrowUpDown,
  Users,
  Mail,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useUnifiedOrders } from "@/hooks/useUnifiedOrders";
import {
  UnifiedOrder,
  OrderDomain,
  UnifiedStatus,
  OrderFilters,
  domainLabels,
  domainColors,
  unifiedStatusConfig,
  orderTabs,
} from "@/types/unified-orders";

// Domain icon components
const domainIconMap: Record<OrderDomain, any> = {
  dev: Code,
  design: Palette,
  marketing: Megaphone,
  smm: Share2,
  other: Package,
};

// Status icon components
const statusIconMap: Record<string, any> = {
  FileText,
  Mail: AlertCircle,
  Inbox: Package,
  Search,
  AlertCircle,
  Settings,
  CreditCard: Clock,
  CheckCircle,
  XCircle,
  Ban: XCircle,
};

// Admin Stats Card
function AdminStatCard({ 
  label, 
  value, 
  icon: Icon, 
  color,
  delay = 0 
}: { 
  label: string; 
  value: number; 
  icon: any; 
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{label}</p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Admin Order Row
function AdminOrderRow({ order, onClick }: { order: UnifiedOrder; onClick: () => void }) {
  const DomainIcon = domainIconMap[order.domain];
  const StatusIcon = statusIconMap[order.status_config.icon] || FileText;

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <TableCell className="font-mono text-sm">{order.order_no}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${domainColors[order.domain]} flex items-center justify-center`}>
            <DomainIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm">{order.domain_label}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-[180px] truncate">{order.service_title}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{order.user_name || 'مستخدم'}</span>
          <span className="text-xs text-muted-foreground">{order.user_email}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={`${order.status_config.bgColor} ${order.status_config.color} border-0 gap-1`}>
          <StatusIcon className="h-3 w-3" />
          {order.status_label}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true, locale: ar })}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ar })}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" className="gap-1">
          <Eye className="h-4 w-4" />
          عرض
        </Button>
      </TableCell>
    </TableRow>
  );
}

// Loading Skeleton
function AdminOrdersSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="w-full h-16 rounded-lg" />
      ))}
    </div>
  );
}

// Empty State
function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Package className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
    </motion.div>
  );
}

export default function AdminUnifiedOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<OrderDomain | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UnifiedStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "status">("newest");

  // Build filters
  const filters = useMemo<OrderFilters>(() => {
    const baseFilters: OrderFilters = {
      search: search || undefined,
      domain: domainFilter !== "all" ? domainFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    };

    switch (activeTab) {
      case "action_required":
        return { ...baseFilters, actionRequired: true };
      case "in_progress":
        return { ...baseFilters, status: "in_progress" };
      case "completed":
        return { ...baseFilters, status: "completed" };
      case "draft":
        return { ...baseFilters, status: "draft" };
      default:
        return baseFilters;
    }
  }, [activeTab, search, domainFilter, statusFilter]);

  const sort = useMemo(() => {
    switch (sortBy) {
      case "oldest":
        return { field: "created_at" as const, direction: "asc" as const };
      case "status":
        return { field: "status_rank" as const, direction: "asc" as const };
      default:
        return { field: "created_at" as const, direction: "desc" as const };
    }
  }, [sortBy]);

  const { orders, loading, stats, refetch } = useUnifiedOrders({ 
    filters, 
    sort, 
    isAdmin: true 
  });

  // Filter cancelled/rejected for that tab
  const displayedOrders = useMemo(() => {
    if (activeTab === "cancelled") {
      return orders.filter(o => o.status === "cancelled" || o.status === "rejected");
    }
    return orders;
  }, [orders, activeTab]);

  const handleOrderClick = (order: UnifiedOrder) => {
    navigate(`/admin/orders/${order.id}`);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                إدارة الطلبات
              </h1>
              <p className="text-muted-foreground">
                عرض وإدارة جميع طلبات العملاء من مختلف الأقسام
              </p>
            </motion.div>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <AdminStatCard
            label="إجمالي الطلبات"
            value={stats.total}
            icon={Package}
            color="bg-gradient-to-br from-primary to-accent"
            delay={0}
          />
          <AdminStatCard
            label="قيد المعالجة"
            value={stats.inProgress}
            icon={Settings}
            color="bg-gradient-to-br from-purple-500 to-indigo-600"
            delay={0.05}
          />
          <AdminStatCard
            label="بانتظار إجراء"
            value={stats.actionRequired}
            icon={AlertCircle}
            color="bg-gradient-to-br from-orange-500 to-amber-600"
            delay={0.1}
          />
          <AdminStatCard
            label="مكتمل"
            value={stats.completed}
            icon={CheckCircle}
            color="bg-gradient-to-br from-green-500 to-emerald-600"
            delay={0.15}
          />
          <AdminStatCard
            label="مسودات"
            value={stats.draft}
            icon={FileText}
            color="bg-gradient-to-br from-gray-500 to-slate-600"
            delay={0.2}
          />
        </div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border/50 p-4"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث برقم الطلب، الخدمة، البريد الإلكتروني..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Domain Filter */}
            <Select value={domainFilter} onValueChange={(v) => setDomainFilter(v as OrderDomain | "all")}>
              <SelectTrigger className="w-full lg:w-36">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                <SelectItem value="dev">برمجة</SelectItem>
                <SelectItem value="smm">سوشيال ميديا</SelectItem>
                <SelectItem value="design">تصميم</SelectItem>
                <SelectItem value="marketing">تسويق</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UnifiedStatus | "all")}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="submitted">تم الاستلام</SelectItem>
                <SelectItem value="under_review">قيد المراجعة</SelectItem>
                <SelectItem value="action_required">بانتظار إجراء</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full lg:w-36">
                <ArrowUpDown className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="oldest">الأقدم</SelectItem>
                <SelectItem value="status">الحالة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="w-full justify-start overflow-x-auto bg-transparent p-0 gap-2">
              {orderTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4"
                >
                  {tab.label}
                  {tab.id === "action_required" && stats.actionRequired > 0 && (
                    <Badge variant="secondary" className="mr-2 bg-orange-500 text-white h-5 min-w-[20px] px-1">
                      {stats.actionRequired}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <AdminOrdersSkeleton />
          ) : displayedOrders.length === 0 ? (
            <EmptyState message="لا توجد طلبات مطابقة للفلاتر المحددة" />
          ) : (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">القسم</TableHead>
                    <TableHead className="text-right">الخدمة</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">آخر تحديث</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {displayedOrders.map((order) => (
                      <AdminOrderRow
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                      />
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>

        {/* Results count */}
        {!loading && displayedOrders.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground"
          >
            عرض {displayedOrders.length} طلب
          </motion.p>
        )}
      </div>
    </div>
  );
}
