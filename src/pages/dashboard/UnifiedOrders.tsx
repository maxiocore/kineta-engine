import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import {
  Package,
  Search,
  Filter,
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
  TrendingUp,
  Calendar,
  ArrowUpDown,
  Server,
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

// KPI Card Component
function StatCard({ 
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

// Order Row Component
function OrderRow({ order, onClick }: { order: UnifiedOrder; onClick: () => void }) {
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
      <TableCell className="max-w-[200px] truncate">{order.service_title}</TableCell>
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
        {format(new Date(order.created_at), "dd MMM yyyy", { locale: ar })}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" className="gap-1">
          عرض
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// Order Card Component (Grid View)
function OrderCard({ order, onClick }: { order: UnifiedOrder; onClick: () => void }) {
  const DomainIcon = domainIconMap[order.domain];
  const StatusIcon = statusIconMap[order.status_config.icon] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-lg transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl ${domainColors[order.domain]} flex items-center justify-center`}>
              <DomainIcon className="h-5 w-5 text-white" />
            </div>
            <Badge className={`${order.status_config.bgColor} ${order.status_config.color} border-0 gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {order.status_label}
            </Badge>
          </div>
          
          <p className="font-mono text-xs text-muted-foreground mb-2">{order.order_no}</p>
          <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{order.service_title}</h3>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ar })}
            </span>
            {order.action_required && (
              <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                إجراء مطلوب
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Loading Skeleton
function OrdersSkeleton({ view }: { view: 'table' | 'grid' }) {
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
              <Skeleton className="w-24 h-3 mb-2" />
              <Skeleton className="w-full h-5 mb-2" />
              <Skeleton className="w-3/4 h-5" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="w-full h-16 rounded-lg" />
      ))}
    </div>
  );
}

// Empty State
function EmptyState({ activeTab }: { activeTab: string }) {
  const messages: Record<string, string> = {
    all: 'لا توجد طلبات حتى الآن',
    action_required: 'لا توجد طلبات تتطلب إجراء منك',
    in_progress: 'لا توجد طلبات قيد المعالجة',
    completed: 'لا توجد طلبات مكتملة',
    cancelled: 'لا توجد طلبات ملغية أو مرفوضة',
    draft: 'لا توجد مسودات',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Package className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {messages[activeTab] || 'لا توجد طلبات'}
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        ابدأ بطلب خدمة جديدة من قسم الخدمات
      </p>
    </motion.div>
  );
}

export default function UnifiedOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<OrderDomain | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "status">("newest");

  // Build filters based on active tab and user selections
  const filters = useMemo<OrderFilters>(() => {
    const baseFilters: OrderFilters = {
      search: search || undefined,
      domain: domainFilter !== "all" ? domainFilter : undefined,
    };

    switch (activeTab) {
      case "action_required":
        return { ...baseFilters, actionRequired: true };
      case "in_progress":
        return { ...baseFilters, status: "in_progress" };
      case "completed":
        return { ...baseFilters, status: "completed" };
      case "cancelled":
        return { ...baseFilters };
      case "draft":
        return { ...baseFilters, status: "draft" };
      default:
        return baseFilters;
    }
  }, [activeTab, search, domainFilter]);

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

  const { orders, loading, stats } = useUnifiedOrders({ filters, sort });

  // Filter cancelled/rejected for that tab
  const displayedOrders = useMemo(() => {
    if (activeTab === "cancelled") {
      return orders.filter(o => o.status === "cancelled" || o.status === "rejected");
    }
    return orders;
  }, [orders, activeTab]);

  const handleOrderClick = (order: UnifiedOrder) => {
    navigate(`/dashboard/orders/${order.id}`);
  };

  return (
    <ClientDashboardLayout>
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              الطلبات
            </h1>
            <p className="text-muted-foreground">
              عرض وإدارة جميع طلباتك من مختلف الأقسام في مكان واحد
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="إجمالي الطلبات"
            value={stats.total}
            icon={Package}
            color="bg-gradient-to-br from-primary to-accent"
            delay={0}
          />
          <StatCard
            label="قيد المعالجة"
            value={stats.inProgress}
            icon={Settings}
            color="bg-gradient-to-br from-purple-500 to-indigo-600"
            delay={0.05}
          />
          <StatCard
            label="بانتظار إجراء مني"
            value={stats.actionRequired}
            icon={AlertCircle}
            color="bg-gradient-to-br from-orange-500 to-amber-600"
            delay={0.1}
          />
          <StatCard
            label="مكتمل"
            value={stats.completed}
            icon={CheckCircle}
            color="bg-gradient-to-br from-green-500 to-emerald-600"
            delay={0.15}
          />
        </div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border/50 p-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث برقم الطلب أو اسم الخدمة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Domain Filter */}
            <Select value={domainFilter} onValueChange={(v) => setDomainFilter(v as OrderDomain | "all")}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                <SelectItem value="dev">برمجة</SelectItem>
                <SelectItem value="smm">سوشيال ميديا</SelectItem>
                <SelectItem value="design">تصميم</SelectItem>
                <SelectItem value="marketing">تسويق</SelectItem>
                <SelectItem value="hosting">استضافة</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full md:w-40">
                <ArrowUpDown className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="oldest">الأقدم</SelectItem>
                <SelectItem value="status">الحالة</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("table")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("grid")}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
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

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <OrdersSkeleton view={view} />
          ) : displayedOrders.length === 0 ? (
            <EmptyState activeTab={activeTab} />
          ) : view === "table" ? (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">القسم</TableHead>
                    <TableHead className="text-right">الخدمة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">آخر تحديث</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {displayedOrders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                      />
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {displayedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => handleOrderClick(order)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </ClientDashboardLayout>
  );
}
