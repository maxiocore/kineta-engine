import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Clock, Loader2, Activity, CheckCircle, AlertCircle, XCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays } from "date-fns";

import OrdersHeader from "@/components/admin/orders/OrdersHeader";
import OrdersStatsGrid from "@/components/admin/orders/OrdersStatsGrid";
import OrdersFilters from "@/components/admin/orders/OrdersFilters";
import BulkActionsBar from "@/components/admin/orders/BulkActionsBar";
import OrdersList from "@/components/admin/orders/OrdersList";
import OrderDetailsDialog from "@/components/admin/orders/OrderDetailsDialog";

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

interface OrderHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
  changed_by: string;
}

const statusOptions = [
  { value: "pending", label: "قيد الانتظار", icon: Clock },
  { value: "processing", label: "قيد المعالجة", icon: Loader2 },
  { value: "in_progress", label: "قيد التنفيذ", icon: Activity },
  { value: "completed", label: "مكتمل", icon: CheckCircle },
  { value: "partial", label: "مكتمل جزئي", icon: AlertCircle },
  { value: "cancelled", label: "ملغي", icon: XCircle },
  { value: "refunded", label: "مسترد", icon: RotateCcw },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0, totalRevenue: 0, todayOrders: 0, todayRevenue: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"single" | "bulk">("single");
  const [deleting, setDeleting] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);

  const activeFiltersCount = [statusFilter !== "all", serviceFilter !== "all", dateFrom !== undefined, dateTo !== undefined].filter(Boolean).length;

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleOgYtOT/jnt2Y2aXrcDMlW9LNJXX6spvP0CBx9PMk3ldV4Ga0NScgFpNlNjuxJJwW1yQtcq0i2xWYZnO3bGMcF1ghLXQw5x1WFqMt9PNmnZdX4myy8Oad1xdirTO0Jx5X1+IsM7OnnlaXImxzs6eeVpciLDOzp97XF2JsM7On3tdXYmwzs6fe11dibDOzp97XV2JsM7Pn3tdXYmwzs6fe11dibDOz597XV2JsM7Pn3tdXYqwzs6fe11dibDOz597XV2JsM7Pn3tdXYqwzs6fe11");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    fetchOrders();
    fetchServices();

    const channel = supabase
      .channel("orders-changes-new")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setNewOrdersCount(prev => prev + 1);
          playNotificationSound();
          toast.success("🔔 طلب جديد!");
        }
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [playNotificationSound]);

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("id, name").order("name");
    if (data) setServices(data);
  };

  const fetchOrders = async () => {
    setNewOrdersCount(0);
    const { data: ordersData } = await supabase.from("orders").select(`id, order_number, status, total_price, quantity, link, notes, admin_notes, created_at, updated_at, user_id, external_order_id, external_status, service:services(id, name, category)`).order("created_at", { ascending: false });
    if (!ordersData) { setLoading(false); return; }

    const userIds = [...new Set(ordersData.map(o => o.user_id))];
    const { data: profilesData } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    
    const enrichedOrders = ordersData.map(order => ({ ...order, profile: profilesMap.get(order.user_id) || { full_name: null, email: null } })) as Order[];
    setOrders(enrichedOrders);
    
    const today = new Date(); today.setHours(0, 0, 0, 0);
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
    const { data } = await supabase.from("order_status_history").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
    if (data) setOrderHistory(data);
  };

  const handleUpdateOrder = async (orderId: string, status: string, adminNotes: string) => {
    setUpdating(true);
    const currentOrder = orders.find(o => o.id === orderId);
    const oldStatus = currentOrder?.status;
    
    const { error } = await supabase.from("orders").update({ status: status as any, admin_notes: adminNotes, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) toast.error("خطأ في تحديث الطلب");
    else { 
      // Send email notification to client if status changed
      if (oldStatus !== status) {
        try {
          await supabase.functions.invoke('notify-order-status', {
            body: { orderId, oldStatus, newStatus: status }
          });
        } catch (e) {
          console.error("Failed to send status notification:", e);
        }
      }
      toast.success("تم تحديث الطلب بنجاح"); 
      setSelectedOrder(null); 
      fetchOrders(); 
    }
    setUpdating(false);
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    
    // Get old statuses before update
    const ordersToUpdate = orders.filter(o => selectedIds.includes(o.id));
    
    const { error } = await supabase.from("orders").update({ status: status as any, updated_at: new Date().toISOString() }).in("id", selectedIds);
    if (error) toast.error("خطأ في تحديث الطلبات");
    else { 
      // Send email notifications to clients
      for (const order of ordersToUpdate) {
        if (order.status !== status) {
          try {
            await supabase.functions.invoke('notify-order-status', {
              body: { orderId: order.id, oldStatus: order.status, newStatus: status }
            });
          } catch (e) {
            console.error("Failed to send status notification:", e);
          }
        }
      }
      toast.success(`تم تحديث ${selectedIds.length} طلب`); 
      setSelectedIds([]); 
      fetchOrders(); 
    }
  };

  const openOrderDetails = async (order: Order) => { setSelectedOrder(order); await fetchOrderHistory(order.id); };
  const resetFilters = () => { setStatusFilter("all"); setServiceFilter("all"); setDateFrom(undefined); setDateTo(undefined); setSearchQuery(""); setActiveTab("all"); };
  const openDeleteDialog = (id: string) => { setDeletingId(id); setDeleteType("single"); setDeleteDialogOpen(true); };
  const openBulkDeleteDialog = () => { if (selectedIds.length === 0) return; setDeleteType("bulk"); setDeleteDialogOpen(true); };
  const openCancelDialog = (order: Order) => { setCancellingOrder(order); setCancelDialogOpen(true); };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setCancelling(true);
    try {
      const { error } = await supabase.from("orders").update({ 
        status: 'cancelled' as any, 
        updated_at: new Date().toISOString() 
      }).eq("id", cancellingOrder.id);
      
      if (error) throw error;
      toast.success(`تم إلغاء الطلب ${cancellingOrder.order_number} واسترداد المبلغ $${cancellingOrder.total_price}`);
      fetchOrders();
    } catch (error) {
      toast.error("فشل في إلغاء الطلب");
    } finally {
      setCancelling(false);
      setCancelDialogOpen(false);
      setCancellingOrder(null);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteType === "single" && deletingId) {
        await supabase.from("order_status_history").delete().eq("order_id", deletingId);
        await supabase.from("orders").delete().eq("id", deletingId);
        toast.success("تم حذف الطلب");
        setSelectedIds(prev => prev.filter(i => i !== deletingId));
      } else if (deleteType === "bulk") {
        for (const id of selectedIds) {
          await supabase.from("order_status_history").delete().eq("order_id", id);
          await supabase.from("orders").delete().eq("id", id);
        }
        toast.success(`تم حذف ${selectedIds.length} طلب`);
        setSelectedIds([]);
      }
      fetchOrders();
    } catch { toast.error("فشل في الحذف"); }
    finally { setDeleting(false); setDeleteDialogOpen(false); setDeletingId(null); }
  };

  const toggleSelectAll = () => { setSelectedIds(selectedIds.length === filteredOrders.length ? [] : filteredOrders.map(o => o.id)); };
  const toggleSelect = (id: string) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const handleSyncOrdersStatus = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-orders-status');
      if (error) throw error;
      if (data.synced > 0) { toast.success(`تم تحديث ${data.synced} طلب`); fetchOrders(); }
      else toast.info("لا توجد طلبات تحتاج للتحديث");
    } catch { toast.error("فشل في المزامنة"); }
    finally { setSyncing(false); }
  };

  const exportOrders = (type: 'csv' | 'json') => {
    const dataToExport = selectedIds.length > 0 ? filteredOrders.filter(o => selectedIds.includes(o.id)) : filteredOrders;
    if (type === 'csv') {
      const csv = [["رقم الطلب", "العميل", "الخدمة", "السعر", "الحالة", "التاريخ"].join(","), ...dataToExport.map(o => [o.order_number, o.profile?.full_name || "غير معروف", o.service?.name || "غير محدد", o.total_price, o.status, format(new Date(o.created_at), "yyyy-MM-dd")].join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`; link.click();
    } else {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `orders-${format(new Date(), "yyyy-MM-dd")}.json`; link.click();
    }
    toast.success(`تم تصدير ${dataToExport.length} طلب`);
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || order.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) || order.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());
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
    filtered.sort((a, b) => sortBy === "date" ? (sortOrder === "desc" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : (sortOrder === "desc" ? b.total_price - a.total_price : a.total_price - b.total_price));
    return filtered;
  }, [orders, searchQuery, activeTab, statusFilter, serviceFilter, dateFrom, dateTo, sortBy, sortOrder]);

  return (
    <AdminDashboardLayout>
      <TooltipProvider>
        <div className="space-y-4" dir="rtl">
          <OrdersHeader newOrdersCount={newOrdersCount} soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)} showAnalytics={showAnalytics} onToggleAnalytics={() => setShowAnalytics(!showAnalytics)} syncing={syncing} onSync={handleSyncOrdersStatus} onExport={exportOrders} />
          <OrdersStatsGrid stats={stats} onTabClick={setActiveTab} />
          <Card className="border-border/40">
            <CardContent className="p-3 sm:p-4 space-y-3">
              <OrdersFilters activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} serviceFilter={serviceFilter} onServiceFilterChange={setServiceFilter} dateFrom={dateFrom} onDateFromChange={setDateFrom} dateTo={dateTo} onDateToChange={setDateTo} sortBy={sortBy} sortOrder={sortOrder} onSortChange={(by, order) => { setSortBy(by); setSortOrder(order); }} showAdvancedFilters={showAdvancedFilters} onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)} activeFiltersCount={activeFiltersCount} onResetFilters={resetFilters} stats={stats} services={services} statusOptions={statusOptions} />
              <BulkActionsBar selectedCount={selectedIds.length} onStatusUpdate={handleBulkStatusUpdate} onExport={exportOrders} onDelete={openBulkDeleteDialog} onClear={() => setSelectedIds([])} statusOptions={statusOptions} />
            </CardContent>
          </Card>
          <OrdersList orders={filteredOrders} loading={loading} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} onViewOrder={openOrderDetails} onDeleteOrder={openDeleteDialog} onCancelOrder={openCancelDialog} />
          <OrderDetailsDialog order={selectedOrder} orderHistory={orderHistory} open={!!selectedOrder} onClose={() => setSelectedOrder(null)} onSave={handleUpdateOrder} onCancel={(order) => { setSelectedOrder(null); openCancelDialog(order); }} saving={updating} />
          <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title={deleteType === "single" ? "حذف الطلب" : `حذف ${selectedIds.length} طلب`} description="هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={handleConfirmDelete} loading={deleting} />
          <ConfirmDialog 
            open={cancelDialogOpen} 
            onOpenChange={setCancelDialogOpen} 
            title="إلغاء الطلب واسترداد الرصيد" 
            description={cancellingOrder ? `هل تريد إلغاء الطلب ${cancellingOrder.order_number} واسترداد مبلغ $${cancellingOrder.total_price} لرصيد العميل؟` : ""} 
            onConfirm={handleCancelOrder} 
            loading={cancelling} 
          />
        </div>
      </TooltipProvider>
    </AdminDashboardLayout>
  );
};

export default AdminOrders;
