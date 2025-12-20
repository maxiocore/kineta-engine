import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Loader2,
  Package,
  Calendar,
  User,
  FileText,
  CalendarDays,
  SlidersHorizontal,
  X,
  RotateCcw,
  ArrowUpDown,
  Trash2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Copy,
  ExternalLink,
  Bell,
  Download,
  MoreVertical,
  ChevronDown,
  Filter,
  Link as LinkIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isAfter, isBefore, startOfDay, endOfDay, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  category: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  quantity: number | null;
  link: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  external_order_id: string | null;
  external_status: string | null;
  service: { id: string; name: string; category: string } | null;
  profile: { full_name: string | null; email: string | null } | null;
}

interface OrderStats {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

const statusOptions = [
  { value: "pending", label: "قيد الانتظار", icon: Clock, color: "warning", bgColor: "bg-warning/10", textColor: "text-warning", borderColor: "border-warning/30" },
  { value: "processing", label: "قيد المعالجة", icon: Loader2, color: "primary", bgColor: "bg-primary/10", textColor: "text-primary", borderColor: "border-primary/30" },
  { value: "in_progress", label: "قيد التنفيذ", icon: Loader2, color: "accent", bgColor: "bg-accent/10", textColor: "text-accent", borderColor: "border-accent/30" },
  { value: "completed", label: "مكتمل", icon: CheckCircle, color: "success", bgColor: "bg-success/10", textColor: "text-success", borderColor: "border-success/30" },
  { value: "partial", label: "مكتمل جزئي", icon: AlertCircle, color: "orange", bgColor: "bg-orange-500/10", textColor: "text-orange-500", borderColor: "border-orange-500/30" },
  { value: "cancelled", label: "ملغي", icon: XCircle, color: "destructive", bgColor: "bg-destructive/10", textColor: "text-destructive", borderColor: "border-destructive/30" },
  { value: "refunded", label: "مسترد", icon: RotateCcw, color: "muted", bgColor: "bg-muted/50", textColor: "text-muted-foreground", borderColor: "border-muted" },
];

const getStatusConfig = (status: string) => {
  const config = statusOptions.find(s => s.value === status);
  if (!config) return { label: status, bgColor: "bg-muted/50", textColor: "text-muted-foreground", borderColor: "border-muted", icon: Clock };
  return config;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState<OrderStats>({ 
    pending: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0, 
    totalRevenue: 0, todayOrders: 0, todayRevenue: 0 
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"single" | "bulk">("single");
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const activeFiltersCount = [
    statusFilter !== "all",
    serviceFilter !== "all",
    dateFrom !== undefined,
    dateTo !== undefined
  ].filter(Boolean).length;

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session);
      if (session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();
        console.log("User role:", roleData);
      }
    };
    
    checkSession();
    fetchOrders();
    fetchServices();

    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        console.log("Realtime order change:", payload);
        if (payload.eventType === "INSERT") {
          setNewOrdersCount(prev => prev + 1);
          // Play notification sound
          playNotificationSound();
          toast.success("طلب جديد!", {
            description: `تم استلام طلب جديد`,
            action: {
              label: "عرض",
              onClick: () => fetchOrders()
            }
          });
        }
        fetchOrders();
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleOgYtOT/jnt2Y2aXrcDMlW9LNJXX6spvP0CBx9PMk3ldV4Ga0NScgFpNlNjuxJJwW1yQtcq0i2xWYZnO3bGMcF1ghLXQw5x1WFqMt9PNmnZdX4myy8Oad1xdirTO0Jx5X1+IsM7OnnlaXImxzs6eeVpciLDOzp97XF2JsM7On3tdXYmwzs6fe11dibDOzp97XV2JsM7Pn3tdXYmwzs6fe11dibDOz597XV2JsM7Pn3tdXYqwzs6fe11");
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, category")
      .order("name");
    if (data) setServices(data);
  };

  const fetchOrders = async () => {
    console.log("Fetching orders...");
    setNewOrdersCount(0);
    
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, quantity, link, notes, admin_notes, 
        created_at, updated_at, user_id, external_order_id, external_status,
        service:services(id, name, category)
      `)
      .order("created_at", { ascending: false });

    console.log("Orders fetch result:", { ordersData, ordersError });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      toast.error("خطأ في جلب الطلبات: " + ordersError.message);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(ordersData?.map(o => o.user_id) || [])];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    
    const enrichedOrders = ordersData?.map(order => ({
      ...order,
      profile: profilesMap.get(order.user_id) || { full_name: null, email: null }
    })) as Order[];

    console.log("Enriched orders:", enrichedOrders);
    setOrders(enrichedOrders);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = enrichedOrders.filter(o => new Date(o.created_at) >= today);
    
    setStats({
      pending: enrichedOrders.filter(o => o.status === "pending").length,
      in_progress: enrichedOrders.filter(o => o.status === "in_progress" || o.status === "processing").length,
      completed: enrichedOrders.filter(o => o.status === "completed").length,
      cancelled: enrichedOrders.filter(o => o.status === "cancelled" || o.status === "refunded").length,
      total: enrichedOrders.length,
      totalRevenue: enrichedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
    });
    
    setLoading(false);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({
        status: (newStatus || selectedOrder.status) as any,
        admin_notes: adminNotes || selectedOrder.admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", selectedOrder.id);

    if (error) {
      toast.error("خطأ في تحديث الطلب");
    } else {
      toast.success("تم تحديث الطلب بنجاح");
      setSelectedOrder(null);
      fetchOrders();
    }
    setUpdating(false);
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    
    const { error } = await supabase
      .from("orders")
      .update({ status: status as any, updated_at: new Date().toISOString() })
      .in("id", selectedIds);

    if (error) {
      toast.error("خطأ في تحديث الطلبات");
    } else {
      toast.success(`تم تحديث ${selectedIds.length} طلب بنجاح`);
      setSelectedIds([]);
      fetchOrders();
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.admin_notes || "");
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setServiceFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery("");
    setActiveTab("all");
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteType("single");
    setDeleteDialogOpen(true);
  };

  const openBulkDeleteDialog = () => {
    if (selectedIds.length === 0) return;
    setDeleteType("bulk");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteType === "single" && deletingId) {
        await supabase.from("order_status_history").delete().eq("order_id", deletingId);
        const { error } = await supabase.from("orders").delete().eq("id", deletingId);
        if (error) throw error;
        toast.success("تم حذف الطلب بنجاح");
        setSelectedIds(prev => prev.filter(i => i !== deletingId));
      } else if (deleteType === "bulk") {
        setDeleteProgress({ current: 0, total: selectedIds.length });
        for (let i = 0; i < selectedIds.length; i++) {
          await supabase.from("order_status_history").delete().eq("order_id", selectedIds[i]);
          const { error } = await supabase.from("orders").delete().eq("id", selectedIds[i]);
          if (error) throw error;
          setDeleteProgress({ current: i + 1, total: selectedIds.length });
        }
        toast.success(`تم حذف ${selectedIds.length} طلب بنجاح`);
        setSelectedIds([]);
      }
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order(s):", error);
      toast.error("فشل في حذف الطلب");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeleteProgress({ current: 0, total: 0 });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSyncOrdersStatus = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-orders-status');
      
      if (error) throw error;
      
      if (data.synced > 0) {
        toast.success(`تم تحديث ${data.synced} طلب من المزودين`);
        fetchOrders();
      } else if (data.errors > 0) {
        toast.warning(`لم يتم تحديث أي طلب، ${data.errors} أخطاء`);
      } else {
        toast.info("لا توجد طلبات تحتاج للتحديث");
      }
    } catch (error) {
      console.error("Error syncing orders:", error);
      toast.error("فشل في مزامنة حالة الطلبات");
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  const exportOrders = () => {
    const csv = [
      ["رقم الطلب", "العميل", "الخدمة", "السعر", "الحالة", "التاريخ"].join(","),
      ...filteredOrders.map(o => [
        o.order_number,
        o.profile?.full_name || o.profile?.email || "غير معروف",
        o.service?.name || "غير محدد",
        o.total_price,
        getStatusConfig(o.status).label,
        format(new Date(o.created_at), "yyyy-MM-dd HH:mm")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("تم تصدير الطلبات");
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === "pending") matchesTab = order.status === "pending";
      else if (activeTab === "in_progress") matchesTab = order.status === "in_progress" || order.status === "processing";
      else if (activeTab === "completed") matchesTab = order.status === "completed";
      else if (activeTab === "cancelled") matchesTab = order.status === "cancelled" || order.status === "refunded";
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesService = serviceFilter === "all" || order.service?.id === serviceFilter;
      
      const orderDate = new Date(order.created_at);
      const matchesDateFrom = !dateFrom || !isBefore(orderDate, startOfDay(dateFrom));
      const matchesDateTo = !dateTo || !isAfter(orderDate, endOfDay(dateTo));
      
      return matchesSearch && matchesTab && matchesStatus && matchesService && matchesDateFrom && matchesDateTo;
    });

    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc" 
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return sortOrder === "desc" 
          ? b.total_price - a.total_price
          : a.total_price - b.total_price;
      }
    });

    return filtered;
  }, [orders, searchQuery, activeTab, statusFilter, serviceFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const statsCards = [
    { 
      label: "طلبات اليوم", 
      value: stats.todayOrders, 
      icon: Calendar, 
      gradient: "from-blue-500 to-cyan-500",
      subtitle: `${stats.todayRevenue.toFixed(2)} ر.س`
    },
    { 
      label: "قيد الانتظار", 
      value: stats.pending, 
      icon: Clock, 
      gradient: "from-warning to-orange-400",
      clickTab: "pending"
    },
    { 
      label: "قيد التنفيذ", 
      value: stats.in_progress, 
      icon: Loader2, 
      gradient: "from-accent to-pink-400",
      clickTab: "in_progress"
    },
    { 
      label: "مكتملة", 
      value: stats.completed, 
      icon: CheckCircle, 
      gradient: "from-success to-emerald-400",
      clickTab: "completed"
    },
    { 
      label: "إجمالي الإيرادات", 
      value: `${stats.totalRevenue.toFixed(2)}`, 
      icon: DollarSign, 
      gradient: "from-primary to-indigo-500",
      subtitle: `${stats.total} طلب`
    },
  ];

  return (
    <AdminDashboardLayout>
      <TooltipProvider>
        <motion.div 
          className="space-y-4 lg:space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          dir="rtl"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row-reverse sm:items-center justify-between gap-3">
            <div className="text-right">
              <h1 className="text-xl lg:text-2xl font-bold mb-1 flex flex-row-reverse items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </motion.div>
                إدارة الطلبات
                {newOrdersCount > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                    {newOrdersCount} جديد
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground text-sm">متابعة وإدارة جميع الطلبات في الوقت الفعلي</p>
            </div>
            <div className="flex flex-row-reverse flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncOrdersStatus}
                disabled={syncing}
                className="gap-1.5"
              >
                <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                <span className="hidden sm:inline">{syncing ? "مزامنة..." : "تحديث الحالات"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportOrders}
                className="gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">تصدير</span>
              </Button>
              <Link to="/admin/orders/sync">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">مزامنة متقدمة</span>
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                onClick={() => stat.clickTab && setActiveTab(stat.clickTab)}
                className={stat.clickTab ? "cursor-pointer" : ""}
              >
                <Card className="border-border/30 overflow-hidden relative group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  <CardContent className="p-3 lg:p-4">
                    <div className="flex flex-row-reverse items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} p-2 shadow-lg`}>
                        <stat.icon className="w-full h-full text-white" />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <motion.p 
                          className="text-lg lg:text-xl font-bold truncate"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-[10px] lg:text-xs text-muted-foreground truncate">{stat.label}</p>
                        {stat.subtitle && (
                          <p className="text-[9px] lg:text-[10px] text-muted-foreground/70">{stat.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tabs & Filters */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/30">
              <CardContent className="p-3 lg:p-4 space-y-3">
                {/* Quick Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start bg-secondary/30 p-1 h-auto flex-wrap">
                    <TabsTrigger value="all" className="text-xs data-[state=active]:bg-background">
                      الكل ({stats.total})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-background">
                      <Clock className="w-3 h-3 ml-1" />
                      انتظار ({stats.pending})
                    </TabsTrigger>
                    <TabsTrigger value="in_progress" className="text-xs data-[state=active]:bg-background">
                      <Loader2 className="w-3 h-3 ml-1" />
                      تنفيذ ({stats.in_progress})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-xs data-[state=active]:bg-background">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      مكتمل ({stats.completed})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="text-xs data-[state=active]:bg-background">
                      <XCircle className="w-3 h-3 ml-1" />
                      ملغي ({stats.cancelled})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Search & Filters Row */}
                <div className="flex flex-col sm:flex-row-reverse gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="البحث برقم الطلب، العميل، الخدمة..." 
                      className="pr-9 bg-secondary/30 border-border/50 h-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-row-reverse gap-2">
                    <Button
                      variant={showAdvancedFilters ? "default" : "outline"}
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      size="sm"
                      className="gap-1.5 h-10"
                    >
                      <Filter className="w-4 h-4" />
                      فلاتر
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px] h-5 w-5 p-0 flex items-center justify-center rounded-full">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                    
                    <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                      const [by, order] = v.split("-");
                      setSortBy(by as "date" | "price");
                      setSortOrder(order as "asc" | "desc");
                    }}>
                      <SelectTrigger className="w-[140px] h-10 bg-secondary/30">
                        <SelectValue placeholder="ترتيب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">الأحدث أولاً</SelectItem>
                        <SelectItem value="date-asc">الأقدم أولاً</SelectItem>
                        <SelectItem value="price-desc">الأعلى سعراً</SelectItem>
                        <SelectItem value="price-asc">الأقل سعراً</SelectItem>
                      </SelectContent>
                    </Select>

                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="icon" onClick={resetFilters} className="h-10 w-10">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/30">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">الحالة</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-secondary/30 h-9">
                              <SelectValue placeholder="جميع الحالات" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع الحالات</SelectItem>
                              {statusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <opt.icon className="w-3 h-3" />
                                    {opt.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">الخدمة</Label>
                          <Select value={serviceFilter} onValueChange={setServiceFilter}>
                            <SelectTrigger className="bg-secondary/30 h-9">
                              <SelectValue placeholder="جميع الخدمات" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع الخدمات</SelectItem>
                              {services.map(service => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name.substring(0, 40)}...
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">من تاريخ</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start h-9 bg-secondary/30", !dateFrom && "text-muted-foreground")}>
                                <CalendarDays className="ml-2 h-4 w-4" />
                                {dateFrom ? format(dateFrom, "d MMM", { locale: ar }) : "اختر"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start h-9 bg-secondary/30", !dateTo && "text-muted-foreground")}>
                                <CalendarDays className="ml-2 h-4 w-4" />
                                {dateTo ? format(dateTo, "d MMM", { locale: ar }) : "اختر"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20"
                  >
                    <span className="text-sm font-medium">تم تحديد {selectedIds.length} طلب</span>
                    <div className="flex-1" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          تحديث الحالة
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {statusOptions.map(opt => (
                          <DropdownMenuItem key={opt.value} onClick={() => handleBulkStatusUpdate(opt.value)}>
                            <opt.icon className="w-4 h-4 ml-2" />
                            {opt.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="destructive" onClick={openBulkDeleteDialog} className="gap-1.5">
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                      إلغاء
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Orders List */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/30">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-primary" />
                  قائمة الطلبات
                  <Badge variant="secondary">{filteredOrders.length}</Badge>
                </CardTitle>
                {filteredOrders.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-xs text-muted-foreground">تحديد الكل</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-10 h-10 text-primary" />
                    </motion.div>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <motion.div 
                    className="text-center py-20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                    <p className="text-muted-foreground text-lg mb-2">لا توجد طلبات</p>
                    <p className="text-sm text-muted-foreground/70">لم يتم العثور على طلبات تطابق معايير البحث</p>
                  </motion.div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="divide-y divide-border/30">
                      <AnimatePresence>
                        {filteredOrders.map((order, index) => {
                          const statusConfig = getStatusConfig(order.status);
                          const StatusIcon = statusConfig.icon;
                          const isSelected = selectedIds.includes(order.id);
                          
                          return (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.02 }}
                              className={cn(
                                "p-4 hover:bg-secondary/30 transition-colors group",
                                isSelected && "bg-primary/5"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelect(order.id)}
                                  className="mt-1"
                                />
                                
                                <div 
                                  className="flex-1 min-w-0 cursor-pointer" 
                                  onClick={() => openOrderDetails(order)}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-sm">{order.order_number}</span>
                                      <Badge className={cn("text-[10px] gap-1", statusConfig.bgColor, statusConfig.textColor, statusConfig.borderColor, "border")}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConfig.label}
                                      </Badge>
                                      {order.external_order_id && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Badge variant="outline" className="text-[10px]">
                                              #{order.external_order_id}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>رقم الطلب الخارجي</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-left">
                                      <span className="font-bold text-success">{order.total_price.toFixed(2)} ر.س</span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ar })}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5" />
                                      <span className="truncate max-w-[150px]">
                                        {order.profile?.full_name || order.profile?.email || "غير معروف"}
                                      </span>
                                    </div>
                                    <span className="hidden sm:inline text-border">•</span>
                                    <div className="flex items-center gap-1.5">
                                      <Package className="w-3.5 h-3.5" />
                                      <span className="truncate max-w-[250px]">
                                        {order.service?.name || "غير محدد"}
                                      </span>
                                    </div>
                                    {order.quantity && (
                                      <>
                                        <span className="hidden sm:inline text-border">•</span>
                                        <span>الكمية: {order.quantity.toLocaleString()}</span>
                                      </>
                                    )}
                                  </div>
                                  
                                  {order.link && (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                      <LinkIcon className="w-3 h-3" />
                                      <span className="truncate max-w-[300px]">{order.link}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openOrderDetails(order)}>
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>عرض التفاصيل</TooltipContent>
                                  </Tooltip>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => copyToClipboard(order.order_number)}>
                                        <Copy className="w-4 h-4 ml-2" />
                                        نسخ رقم الطلب
                                      </DropdownMenuItem>
                                      {order.link && (
                                        <DropdownMenuItem onClick={() => window.open(order.link!, "_blank")}>
                                          <ExternalLink className="w-4 h-4 ml-2" />
                                          فتح الرابط
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => openDeleteDialog(order.id)}
                                      >
                                        <Trash2 className="w-4 h-4 ml-2" />
                                        حذف الطلب
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Details Dialog */}
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  تفاصيل الطلب
                  {selectedOrder && (
                    <Badge variant="outline">{selectedOrder.order_number}</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              {selectedOrder && (
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Order Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">العميل</p>
                      <p className="font-medium text-sm truncate">{selectedOrder.profile?.full_name || selectedOrder.profile?.email || "غير معروف"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">السعر الإجمالي</p>
                      <p className="font-bold text-success">{selectedOrder.total_price.toFixed(2)} ر.س</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">الخدمة</p>
                      <p className="font-medium text-sm">{selectedOrder.service?.name || "غير محدد"}</p>
                    </div>
                    {selectedOrder.quantity && (
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                        <p className="text-xs text-muted-foreground mb-1">الكمية</p>
                        <p className="font-medium">{selectedOrder.quantity.toLocaleString()}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">تاريخ الإنشاء</p>
                      <p className="font-medium text-sm">{format(new Date(selectedOrder.created_at), "d MMM yyyy - HH:mm", { locale: ar })}</p>
                    </div>
                    {selectedOrder.external_order_id && (
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                        <p className="text-xs text-muted-foreground mb-1">رقم الطلب الخارجي</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{selectedOrder.external_order_id}</p>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(selectedOrder.external_order_id!)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedOrder.link && (
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-2">الرابط</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm truncate flex-1">{selectedOrder.link}</p>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(selectedOrder.link!)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(selectedOrder.link!, "_blank")}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.notes && (
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-2">ملاحظات العميل</p>
                      <p className="text-sm">{selectedOrder.notes}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">تحديث الحالة</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="bg-secondary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <opt.icon className="w-4 h-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">ملاحظات الإدارة</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="أضف ملاحظات داخلية..."
                      className="bg-secondary/30 min-h-20 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleUpdateOrder} 
                      disabled={updating} 
                      className="flex-1 bg-gradient-to-l from-primary to-primary/80"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 ml-2" />
                          حفظ التغييرات
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => {
                        openDeleteDialog(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title={deleteType === "bulk" ? `حذف ${selectedIds.length} طلب` : "حذف الطلب"}
            description={deleteType === "bulk" 
              ? `هل أنت متأكد من حذف ${selectedIds.length} طلب؟ لا يمكن التراجع عن هذا الإجراء.`
              : "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
            }
            onConfirm={handleConfirmDelete}
            loading={deleting}
            progress={deleteType === "bulk" && deleting ? deleteProgress : undefined}
          />
        </motion.div>
      </TooltipProvider>
    </AdminDashboardLayout>
  );
};

export default AdminOrders;
