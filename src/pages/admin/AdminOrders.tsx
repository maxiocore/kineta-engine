import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
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
  TrendingUp,
  ArrowLeft,
  CalendarDays,
  SlidersHorizontal,
  X,
  RotateCcw,
  ArrowUpDown,
  Trash2,
  RefreshCw
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
import { cn } from "@/lib/utils";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
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
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  user_id: string;
  service: { id: string; name: string; category: string };
  profile: { full_name: string | null; email: string | null };
}

interface OrderStats {
  pending: number;
  in_progress: number;
  completed: number;
  total: number;
  cancelled: number;
}

const statusOptions = [
  { value: "pending", label: "قيد الانتظار", icon: Clock, color: "warning" },
  { value: "processing", label: "قيد المعالجة", icon: Loader2, color: "primary" },
  { value: "in_progress", label: "قيد التنفيذ", icon: Loader2, color: "accent" },
  { value: "completed", label: "مكتمل", icon: CheckCircle, color: "success" },
  { value: "partial", label: "مكتمل جزئي", icon: AlertCircle, color: "orange" },
  { value: "cancelled", label: "ملغي", icon: XCircle, color: "destructive" },
];

const getStatusConfig = (status: string) => {
  const config = statusOptions.find(s => s.value === status);
  if (!config) return { label: status, color: "muted", icon: Clock };
  
  const colorMap: Record<string, string> = {
    warning: "bg-warning/10 text-warning border-warning/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    success: "bg-success/10 text-success border-success/20",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    muted: "bg-muted text-muted-foreground border-muted",
  };
  
  return { 
    label: config.label, 
    color: colorMap[config.color] || colorMap.muted, 
    icon: config.icon 
  };
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
  const [stats, setStats] = useState<OrderStats>({ pending: 0, in_progress: 0, completed: 0, total: 0, cancelled: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"single" | "bulk">("single");
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });
  const [syncing, setSyncing] = useState(false);

  const activeFiltersCount = [
    statusFilter !== "all",
    serviceFilter !== "all",
    dateFrom !== undefined,
    dateTo !== undefined
  ].filter(Boolean).length;

  useEffect(() => {
    fetchOrders();
    fetchServices();

    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, category")
      .order("name");
    if (data) setServices(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, notes, admin_notes, created_at, user_id,
        service:services(id, name, category),
        profile:profiles(full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب الطلبات");
    } else {
      const ordersData = data as unknown as Order[];
      setOrders(ordersData);
      
      setStats({
        pending: ordersData.filter(o => o.status === "pending").length,
        in_progress: ordersData.filter(o => o.status === "in_progress").length,
        completed: ordersData.filter(o => o.status === "completed").length,
        cancelled: ordersData.filter(o => o.status === "cancelled").length,
        total: ordersData.length
      });
    }
    setLoading(false);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({
        status: (newStatus || selectedOrder.status) as "pending" | "processing" | "in_progress" | "completed" | "partial" | "cancelled",
        admin_notes: adminNotes || selectedOrder.admin_notes
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.service?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesService = serviceFilter === "all" || order.service?.id === serviceFilter;
    
    const orderDate = new Date(order.created_at);
    const matchesDateFrom = !dateFrom || !isBefore(orderDate, startOfDay(dateFrom));
    const matchesDateTo = !dateTo || !isAfter(orderDate, endOfDay(dateTo));
    
    return matchesSearch && matchesStatus && matchesService && matchesDateFrom && matchesDateTo;
  });

  const statsData = [
    { label: "طلبات جديدة", value: stats.pending, icon: Clock, gradient: "from-warning to-orange-400", shadowColor: "shadow-warning/20" },
    { label: "قيد التنفيذ", value: stats.in_progress, icon: Loader2, gradient: "from-accent to-pink-400", shadowColor: "shadow-accent/20" },
    { label: "مكتملة", value: stats.completed, icon: CheckCircle, gradient: "from-success to-emerald-400", shadowColor: "shadow-success/20" },
    { label: "إجمالي الطلبات", value: stats.total, icon: ShoppingBag, gradient: "from-primary to-cyan-400", shadowColor: "shadow-primary/20" },
  ];

  return (
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <ShoppingBag className="w-8 h-8 text-primary" />
              </motion.div>
              إدارة الطلبات
            </h1>
            <p className="text-muted-foreground">متابعة وإدارة جميع الطلبات</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSyncOrdersStatus}
              disabled={syncing}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              {syncing ? "جاري المزامنة..." : "تحديث الحالات"}
            </Button>
            <Link to="/admin/orders/sync">
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="w-4 h-4" />
                مزامنة الطلبات الخارجية
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card className={`card-elevated border-border/30 ${stat.shadowColor} shadow-md`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </motion.div>
                    <div>
                      <motion.p 
                        className="text-2xl font-bold"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border/30">
            <CardContent className="p-4 space-y-4">
              {/* Main Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="البحث في الطلبات..." 
                    className="pr-10 bg-secondary/50 border-border/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant={showAdvancedFilters ? "default" : "outline"}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  فلترة متقدمة
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="mr-1 bg-primary/20 text-primary">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="icon" onClick={resetFilters} className="text-muted-foreground hover:text-foreground">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                {filteredOrders.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="gap-2"
                  >
                    {selectedIds.length === filteredOrders.length ? "إلغاء التحديد" : "تحديد الكل"}
                  </Button>
                )}
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 mr-auto">
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.length} محدد
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={openBulkDeleteDialog}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف المحدد
                    </Button>
                  </div>
                )}
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/30">
                      {/* Status Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Filter className="w-3 h-3" />
                          الحالة
                        </Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="bg-secondary/50 border-border/50">
                            <SelectValue placeholder="جميع الحالات" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">كل الطلبات</SelectItem>
                            {statusOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Service Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          الخدمة
                        </Label>
                        <Select value={serviceFilter} onValueChange={setServiceFilter}>
                          <SelectTrigger className="bg-secondary/50 border-border/50">
                            <SelectValue placeholder="جميع الخدمات" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">جميع الخدمات</SelectItem>
                            {services.map(service => (
                              <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date From */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          من تاريخ
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-right bg-secondary/50 border-border/50",
                                !dateFrom && "text-muted-foreground"
                              )}
                            >
                              <CalendarDays className="ml-2 h-4 w-4" />
                              {dateFrom ? format(dateFrom, "d MMM yyyy", { locale: ar }) : "اختر التاريخ"}
                              {dateFrom && (
                                <X 
                                  className="mr-auto h-4 w-4 hover:text-destructive" 
                                  onClick={(e) => { e.stopPropagation(); setDateFrom(undefined); }}
                                />
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={dateFrom}
                              onSelect={setDateFrom}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Date To */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          إلى تاريخ
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-right bg-secondary/50 border-border/50",
                                !dateTo && "text-muted-foreground"
                              )}
                            >
                              <CalendarDays className="ml-2 h-4 w-4" />
                              {dateTo ? format(dateTo, "d MMM yyyy", { locale: ar }) : "اختر التاريخ"}
                              {dateTo && (
                                <X 
                                  className="mr-auto h-4 w-4 hover:text-destructive" 
                                  onClick={(e) => { e.stopPropagation(); setDateTo(undefined); }}
                                />
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={dateTo}
                              onSelect={setDateTo}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Active Filters Tags */}
                    {activeFiltersCount > 0 && (
                      <div className="flex flex-wrap gap-2 pt-3">
                        {statusFilter !== "all" && (
                          <Badge variant="secondary" className="gap-1 pr-1">
                            الحالة: {statusOptions.find(s => s.value === statusFilter)?.label}
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => setStatusFilter("all")}>
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        )}
                        {serviceFilter !== "all" && (
                          <Badge variant="secondary" className="gap-1 pr-1">
                            الخدمة: {services.find(s => s.id === serviceFilter)?.name}
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => setServiceFilter("all")}>
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        )}
                        {dateFrom && (
                          <Badge variant="secondary" className="gap-1 pr-1">
                            من: {format(dateFrom, "d MMM", { locale: ar })}
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => setDateFrom(undefined)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        )}
                        {dateTo && (
                          <Badge variant="secondary" className="gap-1 pr-1">
                            إلى: {format(dateTo, "d MMM", { locale: ar })}
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => setDateTo(undefined)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders List */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                قائمة الطلبات
                <Badge variant="secondary" className="mr-2">{filteredOrders.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-10 h-10 text-primary" />
                  </motion.div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-lg">لا توجد طلبات</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {/* Select All */}
                  <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                    <Checkbox
                      checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">تحديد الكل</span>
                  </div>
                  <AnimatePresence>
                    {filteredOrders.map((order, index) => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className={`p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/30 hover:border-primary/20 transition-all group ${selectedIds.includes(order.id) ? "bg-primary/5 border-primary/30" : ""}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={selectedIds.includes(order.id)}
                                onCheckedChange={() => toggleSelect(order.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <motion.div 
                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 cursor-pointer"
                                whileHover={{ scale: 1.1 }}
                                onClick={() => openOrderDetails(order)}
                              >
                                <ShoppingBag className="w-6 h-6 text-primary" />
                              </motion.div>
                              <div className="cursor-pointer" onClick={() => openOrderDetails(order)}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold">{order.order_number}</span>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig.label}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <User className="w-3.5 h-3.5" />
                                  {order.profile?.full_name || order.profile?.email || "غير معروف"}
                                  <span className="text-border">•</span>
                                  <Package className="w-3.5 h-3.5" />
                                  {order.service?.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-left">
                                <p className="font-bold text-success">{order.total_price.toLocaleString()} ر.س</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(order.created_at), "d MMM yyyy", { locale: ar })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); openOrderDetails(order); }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); openDeleteDialog(order.id); }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                تفاصيل الطلب
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Order Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">رقم الطلب</p>
                    <p className="font-bold">{selectedOrder.order_number}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">العميل</p>
                    <p className="font-bold truncate">{selectedOrder.profile?.full_name || selectedOrder.profile?.email}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">الخدمة</p>
                    <p className="font-bold">{selectedOrder.service?.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">السعر</p>
                    <p className="font-bold text-success">{selectedOrder.total_price.toLocaleString()} ر.س</p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-2">ملاحظات العميل</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium">تحديث الحالة</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">ملاحظات الإدارة</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="أضف ملاحظات داخلية..."
                    className="bg-secondary/50 min-h-24 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button 
                      onClick={handleUpdateOrder} 
                      disabled={updating} 
                      className="w-full bg-gradient-to-l from-primary to-cyan-500 text-primary-foreground shadow-lg shadow-primary/20"
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
                  </motion.div>
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
    </AdminDashboardLayout>
  );
};

export default AdminOrders;
