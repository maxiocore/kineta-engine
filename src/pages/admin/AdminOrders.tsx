import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Link as LinkIcon,
  ChevronRight,
  Activity,
  Zap,
  BarChart3,
  PieChart,
  Volume2,
  VolumeX,
  History,
  Printer,
  Mail,
  MessageSquare
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isAfter, isBefore, startOfDay, endOfDay, formatDistanceToNow, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

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

interface OrderHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
}

const statusOptions = [
  { value: "pending", label: "قيد الانتظار", icon: Clock, gradient: "from-amber-500 to-orange-500", bgColor: "bg-amber-500/10", textColor: "text-amber-500", borderColor: "border-amber-500/30" },
  { value: "processing", label: "قيد المعالجة", icon: Loader2, gradient: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/10", textColor: "text-blue-500", borderColor: "border-blue-500/30" },
  { value: "in_progress", label: "قيد التنفيذ", icon: Activity, gradient: "from-violet-500 to-purple-500", bgColor: "bg-violet-500/10", textColor: "text-violet-500", borderColor: "border-violet-500/30" },
  { value: "completed", label: "مكتمل", icon: CheckCircle, gradient: "from-emerald-500 to-green-500", bgColor: "bg-emerald-500/10", textColor: "text-emerald-500", borderColor: "border-emerald-500/30" },
  { value: "partial", label: "مكتمل جزئي", icon: AlertCircle, gradient: "from-orange-500 to-amber-500", bgColor: "bg-orange-500/10", textColor: "text-orange-500", borderColor: "border-orange-500/30" },
  { value: "cancelled", label: "ملغي", icon: XCircle, gradient: "from-red-500 to-rose-500", bgColor: "bg-red-500/10", textColor: "text-red-500", borderColor: "border-red-500/30" },
  { value: "refunded", label: "مسترد", icon: RotateCcw, gradient: "from-slate-500 to-gray-500", bgColor: "bg-slate-500/10", textColor: "text-slate-500", borderColor: "border-slate-500/30" },
];

const getStatusConfig = (status: string) => {
  const config = statusOptions.find(s => s.value === status);
  if (!config) return { label: status, bgColor: "bg-muted/50", textColor: "text-muted-foreground", borderColor: "border-muted", icon: Clock, gradient: "from-gray-500 to-slate-500" };
  return config;
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const activeFiltersCount = [
    statusFilter !== "all",
    serviceFilter !== "all",
    dateFrom !== undefined,
    dateTo !== undefined
  ].filter(Boolean).length;

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleOgYtOT/jnt2Y2aXrcDMlW9LNJXX6spvP0CBx9PMk3ldV4Ga0NScgFpNlNjuxJJwW1yQtcq0i2xWYZnO3bGMcF1ghLXQw5x1WFqMt9PNmnZdX4myy8Oad1xdirTO0Jx5X1+IsM7OnnlaXImxzs6eeVpciLDOzp97XF2JsM7On3tdXYmwzs6fe11dibDOzp97XV2JsM7Pn3tdXYmwzs6fe11dibDOz597XV2JsM7Pn3tdXYqwzs6fe11");
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchOrders();
    fetchServices();
    generateChartData();

    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setNewOrdersCount(prev => prev + 1);
          playNotificationSound();
          toast.success("🔔 طلب جديد!", {
            description: `تم استلام طلب جديد`,
            action: {
              label: "عرض",
              onClick: () => fetchOrders()
            }
          });
        }
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playNotificationSound]);

  const generateChartData = async () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, "MM/dd");
    });

    const { data: ordersData } = await supabase
      .from("orders")
      .select("created_at, total_price, status")
      .gte("created_at", subDays(new Date(), 7).toISOString());

    const chartDataMap = last7Days.map(date => {
      const dayOrders = ordersData?.filter(o => format(new Date(o.created_at), "MM/dd") === date) || [];
      return {
        date,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
        completed: dayOrders.filter(o => o.status === "completed").length
      };
    });

    setChartData(chartDataMap);
  };

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, category")
      .order("name");
    if (data) setServices(data);
  };

  const fetchOrders = async () => {
    setNewOrdersCount(0);
    
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, quantity, link, notes, admin_notes, 
        created_at, updated_at, user_id, external_order_id, external_status,
        service:services(id, name, category)
      `)
      .order("created_at", { ascending: false });

    if (ordersError) {
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

  const fetchOrderHistory = async (orderId: string) => {
    const { data } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    
    if (data) setOrderHistory(data);
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

  const openOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.admin_notes || "");
    await fetchOrderHistory(order.id);
    setShowTimeline(true);
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
      toast.error("فشل في مزامنة حالة الطلبات");
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  const exportOrders = (type: 'csv' | 'json') => {
    const dataToExport = selectedIds.length > 0 
      ? filteredOrders.filter(o => selectedIds.includes(o.id))
      : filteredOrders;

    if (type === 'csv') {
      const csv = [
        ["رقم الطلب", "العميل", "الخدمة", "السعر", "الكمية", "الحالة", "التاريخ"].join(","),
        ...dataToExport.map(o => [
          o.order_number,
          o.profile?.full_name || o.profile?.email || "غير معروف",
          o.service?.name || "غير محدد",
          o.total_price,
          o.quantity || 0,
          getStatusConfig(o.status).label,
          format(new Date(o.created_at), "yyyy-MM-dd HH:mm")
        ].join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
    } else {
      const jsonData = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `orders-${format(new Date(), "yyyy-MM-dd")}.json`;
      link.click();
    }
    toast.success(`تم تصدير ${dataToExport.length} طلب`);
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

  const pieChartData = [
    { name: 'مكتمل', value: stats.completed, color: '#10b981' },
    { name: 'قيد التنفيذ', value: stats.in_progress, color: '#8b5cf6' },
    { name: 'انتظار', value: stats.pending, color: '#f59e0b' },
    { name: 'ملغي', value: stats.cancelled, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const statsCards = [
    { 
      label: "طلبات اليوم", 
      value: stats.todayOrders, 
      icon: Calendar, 
      gradient: "from-blue-500 to-cyan-400",
      subtitle: `${stats.todayRevenue.toFixed(2)} ر.س`,
      clickTab: null
    },
    { 
      label: "قيد الانتظار", 
      value: stats.pending, 
      icon: Clock, 
      gradient: "from-amber-500 to-orange-400",
      clickTab: "pending"
    },
    { 
      label: "قيد التنفيذ", 
      value: stats.in_progress, 
      icon: Activity, 
      gradient: "from-violet-500 to-purple-400",
      clickTab: "in_progress"
    },
    { 
      label: "مكتمل", 
      value: stats.completed, 
      icon: CheckCircle, 
      gradient: "from-emerald-500 to-green-400",
      clickTab: "completed"
    },
    { 
      label: "إجمالي الإيرادات", 
      value: `${stats.totalRevenue.toFixed(2)}`, 
      icon: DollarSign, 
      gradient: "from-pink-500 to-rose-400",
      subtitle: `${stats.total} طلب`
    },
  ];

  return (
    <AdminDashboardLayout>
      <TooltipProvider>
        <div className="space-y-4 lg:space-y-6" dir="rtl">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 lg:p-6"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <ShoppingBag className="w-7 h-7 text-primary-foreground" />
                </motion.div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                    إدارة الطلبات
                    {newOrdersCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1"
                      >
                        <Badge className="bg-destructive text-destructive-foreground animate-pulse text-sm px-3">
                          <Bell className="w-3.5 h-3.5 ml-1" />
                          {newOrdersCount} جديد
                        </Badge>
                      </motion.div>
                    )}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">متابعة وإدارة جميع الطلبات في الوقت الفعلي</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="h-10 w-10"
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{soundEnabled ? "إيقاف الصوت" : "تفعيل الصوت"}</TooltipContent>
                </Tooltip>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="gap-2 h-10"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">التحليلات</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncOrdersStatus}
                  disabled={syncing}
                  className="gap-2 h-10"
                >
                  <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                  <span className="hidden sm:inline">{syncing ? "مزامنة..." : "تحديث الحالات"}</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-10">
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">تصدير</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportOrders('csv')} className="gap-2">
                      <FileText className="w-4 h-4" />
                      تصدير CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportOrders('json')} className="gap-2">
                      <FileText className="w-4 h-4" />
                      تصدير JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Link to="/admin/orders/sync">
                  <Button variant="default" size="sm" className="gap-2 h-10 bg-gradient-to-l from-primary to-primary/80">
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden sm:inline">مزامنة متقدمة</span>
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => stat.clickTab && setActiveTab(stat.clickTab)}
                className={stat.clickTab ? "cursor-pointer" : ""}
              >
                <Card className="border-border/40 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <CardContent className="p-4 lg:p-5">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg`}
                        whileHover={{ scale: 1.05, rotate: 5 }}
                      >
                        <stat.icon className="w-full h-full text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <motion.p 
                          className="text-xl lg:text-2xl font-bold truncate"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                        {stat.subtitle && (
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{stat.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Analytics Section */}
          <AnimatePresence>
            {showAnalytics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid lg:grid-cols-3 gap-4">
                  {/* Line Chart */}
                  <Card className="lg:col-span-2 border-border/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        إحصائيات آخر 7 أيام
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '12px',
                                padding: '12px'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="orders" 
                              stroke="hsl(var(--primary))" 
                              fillOpacity={1}
                              fill="url(#colorOrders)"
                              strokeWidth={2}
                              name="الطلبات"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="completed" 
                              stroke="hsl(var(--success))" 
                              fillOpacity={1}
                              fill="url(#colorRevenue)"
                              strokeWidth={2}
                              name="المكتمل"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pie Chart */}
                  <Card className="border-border/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <PieChart className="w-5 h-5 text-primary" />
                        توزيع الحالات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {pieChartData.map((entry, index) => (
                          <div key={index} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs text-muted-foreground">{entry.name} ({entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs & Filters */}
          <Card className="border-border/40">
            <CardContent className="p-4 space-y-4">
              {/* Quick Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start bg-secondary/40 p-1.5 h-auto flex-wrap gap-1 rounded-xl">
                  <TabsTrigger value="all" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4">
                    الكل ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    انتظار ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    تنفيذ ({stats.in_progress})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    مكتمل ({stats.completed})
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    ملغي ({stats.cancelled})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search & Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="البحث برقم الطلب، العميل، الخدمة..." 
                    className="pr-10 bg-secondary/40 border-border/50 h-11 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={showAdvancedFilters ? "default" : "outline"}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    size="sm"
                    className="gap-2 h-11 rounded-xl"
                  >
                    <Filter className="w-4 h-4" />
                    فلاتر
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="bg-primary/20 text-primary text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                  
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                    const [by, order] = v.split("-");
                    setSortBy(by as "date" | "price");
                    setSortOrder(order as "asc" | "desc");
                  }}>
                    <SelectTrigger className="w-[150px] h-11 bg-secondary/40 rounded-xl">
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
                    <Button variant="ghost" size="icon" onClick={resetFilters} className="h-11 w-11 rounded-xl">
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border/40">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">الحالة</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="bg-secondary/40 h-10 rounded-xl">
                            <SelectValue placeholder="جميع الحالات" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">جميع الحالات</SelectItem>
                            {statusOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                  <opt.icon className="w-3.5 h-3.5" />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">الخدمة</Label>
                        <Select value={serviceFilter} onValueChange={setServiceFilter}>
                          <SelectTrigger className="bg-secondary/40 h-10 rounded-xl">
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

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">من تاريخ</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start h-10 bg-secondary/40 gap-2 rounded-xl", !dateFrom && "text-muted-foreground")}>
                              <CalendarDays className="h-4 w-4" />
                              {dateFrom ? format(dateFrom, "d MMM", { locale: ar }) : "اختر"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start h-10 bg-secondary/40 gap-2 rounded-xl", !dateTo && "text-muted-foreground")}>
                              <CalendarDays className="h-4 w-4" />
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
              <AnimatePresence>
                {selectedIds.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-l from-primary/10 to-primary/5 rounded-xl border border-primary/20"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">تم تحديد {selectedIds.length} طلب</span>
                    </div>
                    <div className="flex-1" />
                    <div className="flex flex-wrap gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            تحديث الحالة
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {statusOptions.map(opt => (
                            <DropdownMenuItem key={opt.value} onClick={() => handleBulkStatusUpdate(opt.value)} className="gap-2">
                              <opt.icon className="w-4 h-4" />
                              {opt.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2 rounded-lg">
                            <Download className="w-4 h-4" />
                            تصدير المحدد
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => exportOrders('csv')} className="gap-2">
                            تصدير CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportOrders('json')} className="gap-2">
                            تصدير JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button size="sm" variant="destructive" onClick={openBulkDeleteDialog} className="gap-2 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="rounded-lg">
                        إلغاء
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card className="border-border/40">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                قائمة الطلبات
                <Badge variant="secondary" className="rounded-lg">{filteredOrders.length}</Badge>
              </CardTitle>
              {filteredOrders.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">تحديد الكل</span>
                  <Checkbox
                    checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-12 h-12 text-primary" />
                  </motion.div>
                  <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <motion.div 
                  className="text-center py-20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                  </div>
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
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.02 }}
                            className={cn(
                              "p-4 hover:bg-secondary/30 transition-all group",
                              isSelected && "bg-primary/5 border-r-2 border-primary"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(order.id)}
                                className="mt-1"
                              />
                              
                              <div 
                                className="flex-1 min-w-0 cursor-pointer" 
                                onClick={() => openOrderDetails(order)}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm">{order.order_number}</span>
                                    <Badge className={cn(
                                      "text-[11px] gap-1.5 px-2.5 py-1 rounded-lg font-medium",
                                      statusConfig.bgColor, 
                                      statusConfig.textColor, 
                                      statusConfig.borderColor, 
                                      "border"
                                    )}>
                                      <StatusIcon className={cn("w-3 h-3", order.status === "processing" && "animate-spin")} />
                                      {statusConfig.label}
                                    </Badge>
                                    {order.external_order_id && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Badge variant="outline" className="text-[10px] rounded-lg">
                                            #{order.external_order_id}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>رقم الطلب الخارجي</TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ar })}
                                    </span>
                                    <span className="font-bold text-success text-base">{order.total_price.toFixed(2)} ر.س</span>
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
                                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg px-2 py-1 w-fit">
                                    <LinkIcon className="w-3 h-3" />
                                    <span className="truncate max-w-[300px]">{order.link}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openOrderDetails(order)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>عرض التفاصيل</TooltipContent>
                                </Tooltip>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => copyToClipboard(order.order_number)} className="gap-2">
                                      <Copy className="w-4 h-4" />
                                      نسخ رقم الطلب
                                    </DropdownMenuItem>
                                    {order.link && (
                                      <DropdownMenuItem onClick={() => window.open(order.link!, "_blank")} className="gap-2">
                                        <ExternalLink className="w-4 h-4" />
                                        فتح الرابط
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive focus:text-destructive gap-2"
                                      onClick={() => openDeleteDialog(order.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
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

          {/* Order Details Dialog */}
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
              <DialogHeader className="p-6 pb-4 border-b border-border/40">
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="text-lg">تفاصيل الطلب</span>
                    {selectedOrder && (
                      <Badge variant="outline" className="mr-2 rounded-lg">{selectedOrder.order_number}</Badge>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {selectedOrder && (
                <ScrollArea className="max-h-[calc(90vh-100px)]">
                  <motion.div 
                    className="p-6 space-y-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Status Progress */}
                    <div className="p-4 rounded-xl bg-gradient-to-l from-secondary/50 to-secondary/30 border border-border/40">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">حالة الطلب</span>
                        <Badge className={cn(
                          "gap-1.5 px-3 py-1 rounded-lg",
                          getStatusConfig(selectedOrder.status).bgColor,
                          getStatusConfig(selectedOrder.status).textColor,
                          getStatusConfig(selectedOrder.status).borderColor,
                          "border"
                        )}>
                          {React.createElement(getStatusConfig(selectedOrder.status).icon, { className: "w-3.5 h-3.5" })}
                          {getStatusConfig(selectedOrder.status).label}
                        </Badge>
                      </div>
                      <Progress 
                        value={
                          selectedOrder.status === "pending" ? 25 :
                          selectedOrder.status === "processing" ? 50 :
                          selectedOrder.status === "in_progress" ? 75 :
                          selectedOrder.status === "completed" ? 100 : 0
                        } 
                        className="h-2"
                      />
                    </div>

                    {/* Order Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          العميل
                        </p>
                        <p className="font-medium truncate">{selectedOrder.profile?.full_name || selectedOrder.profile?.email || "غير معروف"}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          السعر الإجمالي
                        </p>
                        <p className="font-bold text-success text-lg">{selectedOrder.total_price.toFixed(2)} ر.س</p>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/40 col-span-2">
                        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          الخدمة
                        </p>
                        <p className="font-medium">{selectedOrder.service?.name || "غير محدد"}</p>
                      </div>
                      {selectedOrder.quantity && (
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1.5">الكمية</p>
                          <p className="font-medium">{selectedOrder.quantity.toLocaleString()}</p>
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          تاريخ الإنشاء
                        </p>
                        <p className="font-medium text-sm">{format(new Date(selectedOrder.created_at), "d MMM yyyy - HH:mm", { locale: ar })}</p>
                      </div>
                      {selectedOrder.external_order_id && (
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                          <p className="text-xs text-muted-foreground mb-1.5">رقم الطلب الخارجي</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{selectedOrder.external_order_id}</p>
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg" onClick={() => copyToClipboard(selectedOrder.external_order_id!)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedOrder.link && (
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                          <LinkIcon className="w-3.5 h-3.5" />
                          الرابط
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm truncate flex-1 bg-background/50 rounded-lg px-3 py-2">{selectedOrder.link}</p>
                          <Button size="icon" variant="outline" className="h-9 w-9 rounded-lg" onClick={() => copyToClipboard(selectedOrder.link!)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-9 w-9 rounded-lg" onClick={() => window.open(selectedOrder.link!, "_blank")}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedOrder.notes && (
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          ملاحظات العميل
                        </p>
                        <p className="text-sm bg-background/50 rounded-lg px-3 py-2">{selectedOrder.notes}</p>
                      </div>
                    )}

                    {/* Order Timeline */}
                    {orderHistory.length > 0 && (
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" />
                          سجل التغييرات
                        </p>
                        <div className="space-y-3">
                          {orderHistory.slice(0, 5).map((history, index) => (
                            <div key={history.id} className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] rounded-lg">
                                    {getStatusConfig(history.new_status).label}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(history.created_at), { addSuffix: true, locale: ar })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">تحديث الحالة</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="bg-secondary/40 h-11 rounded-xl">
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

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">ملاحظات الإدارة</Label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="أضف ملاحظات داخلية..."
                        className="bg-secondary/40 min-h-24 resize-none rounded-xl"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={handleUpdateOrder} 
                        disabled={updating} 
                        className="flex-1 h-11 rounded-xl bg-gradient-to-l from-primary to-primary/80"
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
                        className="h-11 w-11 rounded-xl"
                        onClick={() => {
                          openDeleteDialog(selectedOrder.id);
                          setSelectedOrder(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                </ScrollArea>
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
        </div>
      </TooltipProvider>
    </AdminDashboardLayout>
  );
};

export default AdminOrders;
